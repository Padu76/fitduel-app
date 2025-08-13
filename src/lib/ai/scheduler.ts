// ====================================
// FITDUEL MISSION SCHEDULER
// Automated mission generation and cleanup system
// ====================================

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AIMissionGenerator } from './mission-generator'
import { RewardBalancer } from './balancer'

// ====================================
// TYPES & INTERFACES
// ====================================

export interface SchedulerConfig {
  enabled: boolean
  timezone: string
  dailyResetTime: string // Format: "HH:MM"
  weeklyResetDay: number // 0 = Sunday, 6 = Saturday
  weeklyResetTime: string // Format: "HH:MM"
  batchSize: number
  maxRetries: number
  retryDelay: number // milliseconds
}

export interface SchedulerJob {
  id: string
  type: 'daily_reset' | 'weekly_reset' | 'cleanup' | 'special_event' | 'economy_balance'
  status: 'pending' | 'running' | 'completed' | 'failed'
  scheduledFor: Date
  startedAt?: Date
  completedAt?: Date
  error?: string
  metadata: {
    usersProcessed?: number
    missionsGenerated?: number
    missionsDeleted?: number
    retryCount?: number
  }
}

export interface GenerationResult {
  success: boolean
  userId: string
  missionsGenerated: number
  error?: string
  processingTime: number
}

export interface SchedulerStats {
  lastDailyReset: Date | null
  lastWeeklyReset: Date | null
  lastCleanup: Date | null
  totalMissionsGenerated24h: number
  totalMissionsDeleted24h: number
  averageGenerationTime: number
  failureRate: number
  activeUsers: number
}

// ====================================
// DEFAULT CONFIGURATION
// ====================================

const DEFAULT_CONFIG: SchedulerConfig = {
  enabled: true,
  timezone: 'Europe/Rome',
  dailyResetTime: '00:00', // Midnight
  weeklyResetDay: 1, // Monday
  weeklyResetTime: '00:00',
  batchSize: 100, // Process 100 users at a time
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
}

// ====================================
// SCHEDULER CONSTANTS
// ====================================

const SCHEDULER_CONSTANTS = {
  // Mission generation settings
  MISSIONS_PER_USER: {
    daily: 5,
    weekly: 3,
    special: 1,
  },
  
  // Cleanup settings
  CLEANUP_AFTER_DAYS: {
    daily: 1,
    weekly: 7,
    special: 30,
    expired: 0, // Immediate
  },
  
  // Performance settings
  MAX_CONCURRENT_JOBS: 3,
  JOB_TIMEOUT: 300000, // 5 minutes
  HEALTH_CHECK_INTERVAL: 60000, // 1 minute
  
  // Special events
  SPECIAL_EVENTS: {
    weekend: { days: [0, 6], bonus: 1.5 },
    monthStart: { day: 1, bonus: 2.0 },
    levelMilestone: { levels: [5, 10, 15, 20, 25, 30], bonus: 3.0 },
  },
}

// ====================================
// MISSION SCHEDULER CLASS
// ====================================

export class MissionScheduler {
  private supabase
  private config: SchedulerConfig
  private missionGenerator: AIMissionGenerator
  private rewardBalancer: RewardBalancer
  private activeJobs: Map<string, SchedulerJob>
  private isRunning: boolean
  private healthCheckInterval?: NodeJS.Timeout

  constructor(config?: Partial<SchedulerConfig>) {
    this.supabase = createClientComponentClient()
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.missionGenerator = new AIMissionGenerator()
    this.rewardBalancer = new RewardBalancer()
    this.activeJobs = new Map()
    this.isRunning = false
  }

  // ====================================
  // INITIALIZATION & LIFECYCLE
  // ====================================

  async initialize(): Promise<void> {
    console.log('🚀 Mission Scheduler initializing...')
    
    try {
      // Check if scheduler is enabled
      const { data: settings } = await this.supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'scheduler_enabled')
        .single()

      if (settings?.value === 'false') {
        console.log('⚠️ Scheduler is disabled in system settings')
        this.config.enabled = false
        return
      }

      // Start health monitoring
      this.startHealthMonitoring()
      
      // Check for pending jobs
      await this.resumePendingJobs()
      
      // Schedule next jobs
      await this.scheduleNextJobs()
      
      this.isRunning = true
      console.log('✅ Mission Scheduler initialized successfully')
      
    } catch (error) {
      console.error('❌ Failed to initialize scheduler:', error)
      throw error
    }
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Mission Scheduler...')
    
    this.isRunning = false
    
    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    
    // Wait for active jobs to complete
    const activeJobIds = Array.from(this.activeJobs.keys())
    if (activeJobIds.length > 0) {
      console.log(`⏳ Waiting for ${activeJobIds.length} active jobs to complete...`)
      await Promise.all(activeJobIds.map(id => this.waitForJob(id)))
    }
    
    console.log('✅ Mission Scheduler shutdown complete')
  }

  // ====================================
  // JOB SCHEDULING
  // ====================================

  async scheduleNextJobs(): Promise<void> {
    const now = new Date()
    
    // Schedule daily reset
    const nextDailyReset = this.getNextResetTime('daily')
    await this.scheduleJob({
      id: `daily_reset_${nextDailyReset.getTime()}`,
      type: 'daily_reset',
      status: 'pending',
      scheduledFor: nextDailyReset,
      metadata: {},
    })
    
    // Schedule weekly reset
    const nextWeeklyReset = this.getNextResetTime('weekly')
    await this.scheduleJob({
      id: `weekly_reset_${nextWeeklyReset.getTime()}`,
      type: 'weekly_reset',
      status: 'pending',
      scheduledFor: nextWeeklyReset,
      metadata: {},
    })
    
    // Schedule cleanup (every 6 hours)
    const nextCleanup = new Date(now.getTime() + 6 * 60 * 60 * 1000)
    await this.scheduleJob({
      id: `cleanup_${nextCleanup.getTime()}`,
      type: 'cleanup',
      status: 'pending',
      scheduledFor: nextCleanup,
      metadata: {},
    })
    
    // Check for special events
    await this.scheduleSpecialEvents()
  }

  private async scheduleJob(job: SchedulerJob): Promise<void> {
    try {
      // Save job to database
      await this.supabase
        .from('scheduler_jobs')
        .insert({
          ...job,
          created_at: new Date().toISOString(),
        })
      
      // Calculate delay until execution
      const delay = job.scheduledFor.getTime() - Date.now()
      
      if (delay <= 0) {
        // Execute immediately if past due
        this.executeJob(job)
      } else {
        // Schedule for future execution
        setTimeout(() => this.executeJob(job), Math.min(delay, 2147483647)) // Max timeout value
      }
      
      console.log(`📅 Scheduled job: ${job.type} for ${job.scheduledFor.toISOString()}`)
      
    } catch (error) {
      console.error(`❌ Failed to schedule job ${job.type}:`, error)
    }
  }

  // ====================================
  // JOB EXECUTION
  // ====================================

  private async executeJob(job: SchedulerJob): Promise<void> {
    if (!this.isRunning || !this.config.enabled) {
      console.log(`⏸️ Skipping job ${job.id} - scheduler not running`)
      return
    }
    
    // Check if already running
    if (this.activeJobs.has(job.id)) {
      console.log(`⚠️ Job ${job.id} already running`)
      return
    }
    
    // Add to active jobs
    this.activeJobs.set(job.id, job)
    job.status = 'running'
    job.startedAt = new Date()
    
    try {
      console.log(`🏃 Executing job: ${job.type}`)
      
      // Update job status in database
      await this.updateJobStatus(job)
      
      // Execute based on job type
      switch (job.type) {
        case 'daily_reset':
          await this.executeDailyReset(job)
          break
        case 'weekly_reset':
          await this.executeWeeklyReset(job)
          break
        case 'cleanup':
          await this.executeCleanup(job)
          break
        case 'special_event':
          await this.executeSpecialEvent(job)
          break
        case 'economy_balance':
          await this.executeEconomyBalance(job)
          break
        default:
          throw new Error(`Unknown job type: ${job.type}`)
      }
      
      // Mark as completed
      job.status = 'completed'
      job.completedAt = new Date()
      
      console.log(`✅ Job completed: ${job.type} (${job.metadata.usersProcessed} users processed)`)
      
    } catch (error) {
      console.error(`❌ Job failed: ${job.type}`, error)
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Unknown error'
      
      // Retry if applicable
      if ((job.metadata.retryCount || 0) < this.config.maxRetries) {
        await this.retryJob(job)
      }
      
    } finally {
      // Update final status
      await this.updateJobStatus(job)
      
      // Remove from active jobs
      this.activeJobs.delete(job.id)
      
      // Schedule next job of same type
      if (job.status === 'completed') {
        await this.scheduleNextJobOfType(job.type)
      }
    }
  }

  // ====================================
  // DAILY RESET EXECUTION
  // ====================================

  private async executeDailyReset(job: SchedulerJob): Promise<void> {
    console.log('🌅 Executing daily mission reset...')
    
    const startTime = Date.now()
    let usersProcessed = 0
    let missionsGenerated = 0
    let errors: string[] = []
    
    try {
      // Get all active users
      const activeUsers = await this.getActiveUsers()
      console.log(`📊 Found ${activeUsers.length} active users`)
      
      // Process in batches
      for (let i = 0; i < activeUsers.length; i += this.config.batchSize) {
        const batch = activeUsers.slice(i, i + this.config.batchSize)
        
        // Process batch in parallel
        const results = await Promise.all(
          batch.map(user => this.generateDailyMissionsForUser(user.id))
        )
        
        // Count results
        results.forEach(result => {
          if (result.success) {
            usersProcessed++
            missionsGenerated += result.missionsGenerated
          } else if (result.error) {
            errors.push(`User ${result.userId}: ${result.error}`)
          }
        })
        
        // Update progress
        job.metadata.usersProcessed = usersProcessed
        job.metadata.missionsGenerated = missionsGenerated
        
        // Small delay between batches
        if (i + this.config.batchSize < activeUsers.length) {
          await this.delay(1000)
        }
      }
      
      // Mark expired missions
      await this.markExpiredMissions('daily')
      
      // Update daily streak tracking
      await this.updateDailyStreaks()
      
      // Log statistics
      const processingTime = Date.now() - startTime
      await this.logSchedulerStats({
        type: 'daily_reset',
        usersProcessed,
        missionsGenerated,
        processingTime,
        errors: errors.length,
      })
      
      console.log(`✅ Daily reset complete: ${missionsGenerated} missions for ${usersProcessed} users in ${processingTime}ms`)
      
    } catch (error) {
      console.error('❌ Daily reset failed:', error)
      throw error
    }
  }

  // ====================================
  // WEEKLY RESET EXECUTION
  // ====================================

  private async executeWeeklyReset(job: SchedulerJob): Promise<void> {
    console.log('📅 Executing weekly mission reset...')
    
    const startTime = Date.now()
    let usersProcessed = 0
    let missionsGenerated = 0
    
    try {
      // Get users eligible for weekly missions
      const eligibleUsers = await this.getWeeklyEligibleUsers()
      console.log(`📊 Found ${eligibleUsers.length} eligible users for weekly missions`)
      
      // Process in batches
      for (let i = 0; i < eligibleUsers.length; i += this.config.batchSize) {
        const batch = eligibleUsers.slice(i, i + this.config.batchSize)
        
        const results = await Promise.all(
          batch.map(user => this.generateWeeklyMissionsForUser(user.id))
        )
        
        results.forEach(result => {
          if (result.success) {
            usersProcessed++
            missionsGenerated += result.missionsGenerated
          }
        })
        
        job.metadata.usersProcessed = usersProcessed
        job.metadata.missionsGenerated = missionsGenerated
        
        await this.delay(1000)
      }
      
      // Mark expired weekly missions
      await this.markExpiredMissions('weekly')
      
      // Generate leaderboard rewards
      await this.generateLeaderboardRewards()
      
      const processingTime = Date.now() - startTime
      console.log(`✅ Weekly reset complete: ${missionsGenerated} missions for ${usersProcessed} users in ${processingTime}ms`)
      
    } catch (error) {
      console.error('❌ Weekly reset failed:', error)
      throw error
    }
  }

  // ====================================
  // CLEANUP EXECUTION
  // ====================================

  private async executeCleanup(job: SchedulerJob): Promise<void> {
    console.log('🧹 Executing mission cleanup...')
    
    let deletedCount = 0
    
    try {
      // Delete expired missions
      const { count: expiredDeleted } = await this.supabase
        .from('user_missions')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .eq('is_completed', false)
      
      deletedCount += expiredDeleted || 0
      
      // Delete old completed missions (keep last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { count: oldCompleted } = await this.supabase
        .from('user_missions')
        .delete()
        .lt('completed_at', thirtyDaysAgo.toISOString())
        .eq('is_completed', true)
      
      deletedCount += oldCompleted || 0
      
      // Clean up orphaned records
      await this.cleanupOrphanedRecords()
      
      // Optimize database
      await this.optimizeDatabase()
      
      job.metadata.missionsDeleted = deletedCount
      
      console.log(`✅ Cleanup complete: ${deletedCount} missions deleted`)
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error)
      throw error
    }
  }

  // ====================================
  // SPECIAL EVENT EXECUTION
  // ====================================

  private async executeSpecialEvent(job: SchedulerJob): Promise<void> {
    console.log('🎉 Executing special event mission generation...')
    
    const eventType = job.metadata.eventType as string
    let missionsGenerated = 0
    
    try {
      // Get eligible users for special event
      const eligibleUsers = await this.getSpecialEventUsers(eventType)
      
      for (const user of eligibleUsers) {
        const mission = await this.missionGenerator.generateSpecialMission(
          user.id,
          eventType as any
        )
        
        if (mission) {
          // Save mission to database
          await this.saveMission(user.id, mission)
          missionsGenerated++
        }
      }
      
      job.metadata.missionsGenerated = missionsGenerated
      
      console.log(`✅ Special event complete: ${missionsGenerated} missions generated`)
      
    } catch (error) {
      console.error('❌ Special event failed:', error)
      throw error
    }
  }

  // ====================================
  // ECONOMY BALANCE EXECUTION
  // ====================================

  private async executeEconomyBalance(job: SchedulerJob): Promise<void> {
    console.log('💰 Executing economy balance check...')
    
    try {
      // Generate economy report
      const report = await this.rewardBalancer.generateDailyReport()
      
      // Log alerts if any
      if (report.alerts.length > 0) {
        console.warn('⚠️ Economy alerts:', report.alerts)
        
        // Send notifications to admins
        await this.notifyAdmins({
          type: 'economy_alert',
          alerts: report.alerts,
          recommendations: report.recommendations,
        })
      }
      
      // Apply automatic adjustments if needed
      if (report.metrics.economyHealth === 'critical') {
        await this.applyEmergencyEconomyMeasures()
      }
      
      // Save report to database
      await this.supabase
        .from('economy_reports')
        .insert({
          metrics: report.metrics,
          recommendations: report.recommendations,
          alerts: report.alerts,
          created_at: new Date().toISOString(),
        })
      
      console.log(`✅ Economy balance check complete`)
      
    } catch (error) {
      console.error('❌ Economy balance check failed:', error)
      throw error
    }
  }

  // ====================================
  // HELPER METHODS - USER PROCESSING
  // ====================================

  private async generateDailyMissionsForUser(userId: string): Promise<GenerationResult> {
    const startTime = Date.now()
    
    try {
      // Check if user already has daily missions for today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { count: existingCount } = await this.supabase
        .from('user_missions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('mission_type', 'daily')
        .gte('created_at', today.toISOString())
      
      if (existingCount && existingCount > 0) {
        return {
          success: true,
          userId,
          missionsGenerated: 0,
          processingTime: Date.now() - startTime,
        }
      }
      
      // Generate new daily missions
      const missions = await this.missionGenerator.generateDailyMissions(
        userId,
        SCHEDULER_CONSTANTS.MISSIONS_PER_USER.daily
      )
      
      // Save missions to database
      for (const mission of missions) {
        await this.saveMission(userId, mission)
      }
      
      // Send notification to user
      await this.notifyUser(userId, {
        type: 'daily_missions_ready',
        count: missions.length,
      })
      
      return {
        success: true,
        userId,
        missionsGenerated: missions.length,
        processingTime: Date.now() - startTime,
      }
      
    } catch (error) {
      console.error(`Failed to generate daily missions for user ${userId}:`, error)
      return {
        success: false,
        userId,
        missionsGenerated: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      }
    }
  }

  private async generateWeeklyMissionsForUser(userId: string): Promise<GenerationResult> {
    const startTime = Date.now()
    
    try {
      // Generate weekly missions
      const missions = await this.missionGenerator.generateWeeklyMissions(
        userId,
        SCHEDULER_CONSTANTS.MISSIONS_PER_USER.weekly
      )
      
      // Save missions
      for (const mission of missions) {
        await this.saveMission(userId, mission)
      }
      
      // Send notification
      await this.notifyUser(userId, {
        type: 'weekly_missions_ready',
        count: missions.length,
      })
      
      return {
        success: true,
        userId,
        missionsGenerated: missions.length,
        processingTime: Date.now() - startTime,
      }
      
    } catch (error) {
      return {
        success: false,
        userId,
        missionsGenerated: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      }
    }
  }

  // ====================================
  // HELPER METHODS - DATABASE
  // ====================================

  private async getActiveUsers(): Promise<{ id: string }[]> {
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    
    const { data } = await this.supabase
      .from('user_stats')
      .select('user_id')
      .gte('last_active', oneDayAgo.toISOString())
      .eq('is_active', true)
    
    return data?.map(u => ({ id: u.user_id })) || []
  }

  private async getWeeklyEligibleUsers(): Promise<{ id: string }[]> {
    // Users with level >= 3 get weekly missions
    const { data } = await this.supabase
      .from('user_stats')
      .select('user_id')
      .gte('level', 3)
      .eq('is_active', true)
    
    return data?.map(u => ({ id: u.user_id })) || []
  }

  private async getSpecialEventUsers(eventType: string): Promise<{ id: string }[]> {
    // Logic to determine eligible users for special events
    const { data } = await this.supabase
      .from('user_stats')
      .select('user_id')
      .eq('is_active', true)
    
    return data?.map(u => ({ id: u.user_id })) || []
  }

  private async saveMission(userId: string, mission: any): Promise<void> {
    await this.supabase
      .from('user_missions')
      .insert({
        user_id: userId,
        mission_id: mission.id,
        mission_type: mission.type,
        mission_data: mission,
        is_completed: false,
        expires_at: mission.expires_at,
        created_at: new Date().toISOString(),
      })
  }

  private async markExpiredMissions(type: string): Promise<void> {
    await this.supabase
      .from('user_missions')
      .update({ is_expired: true })
      .eq('mission_type', type)
      .lt('expires_at', new Date().toISOString())
      .eq('is_completed', false)
  }

  private async updateDailyStreaks(): Promise<void> {
    // Update streak counters for users who completed missions yesterday
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Get users who completed missions yesterday
    const { data: completedYesterday } = await this.supabase
      .from('user_missions')
      .select('user_id')
      .eq('is_completed', true)
      .gte('completed_at', yesterday.toISOString())
      .lt('completed_at', today.toISOString())
    
    if (completedYesterday) {
      const userIds = [...new Set(completedYesterday.map(m => m.user_id))]
      
      for (const userId of userIds) {
        await this.supabase.rpc('increment_streak', { user_id: userId })
      }
    }
    
    // Reset streaks for users who didn't complete missions yesterday
    await this.supabase.rpc('reset_broken_streaks')
  }

  // ====================================
  // HELPER METHODS - UTILITIES
  // ====================================

  private getNextResetTime(type: 'daily' | 'weekly'): Date {
    const now = new Date()
    let next: Date
    
    if (type === 'daily') {
      // Next daily reset
      const [hours, minutes] = this.config.dailyResetTime.split(':').map(Number)
      next = new Date(now)
      next.setHours(hours, minutes, 0, 0)
      
      if (next <= now) {
        next.setDate(next.getDate() + 1)
      }
    } else {
      // Next weekly reset
      const [hours, minutes] = this.config.weeklyResetTime.split(':').map(Number)
      next = new Date(now)
      next.setHours(hours, minutes, 0, 0)
      
      // Find next occurrence of reset day
      const daysUntilReset = (this.config.weeklyResetDay - now.getDay() + 7) % 7 || 7
      next.setDate(next.getDate() + daysUntilReset)
      
      if (next <= now) {
        next.setDate(next.getDate() + 7)
      }
    }
    
    return next
  }

  private async scheduleSpecialEvents(): Promise<void> {
    const now = new Date()
    
    // Weekend bonus
    if (now.getDay() === 5) { // Friday
      const saturday = new Date(now)
      saturday.setDate(saturday.getDate() + 1)
      saturday.setHours(0, 0, 0, 0)
      
      await this.scheduleJob({
        id: `weekend_event_${saturday.getTime()}`,
        type: 'special_event',
        status: 'pending',
        scheduledFor: saturday,
        metadata: { eventType: 'weekend' },
      })
    }
    
    // Month start bonus
    if (now.getDate() === 28) { // Schedule for first of next month
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      
      await this.scheduleJob({
        id: `month_start_${firstOfMonth.getTime()}`,
        type: 'special_event',
        status: 'pending',
        scheduledFor: firstOfMonth,
        metadata: { eventType: 'month_start' },
      })
    }
  }

  private async updateJobStatus(job: SchedulerJob): Promise<void> {
    await this.supabase
      .from('scheduler_jobs')
      .update({
        status: job.status,
        started_at: job.startedAt,
        completed_at: job.completedAt,
        error: job.error,
        metadata: job.metadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id)
  }

  private async retryJob(job: SchedulerJob): Promise<void> {
    job.metadata.retryCount = (job.metadata.retryCount || 0) + 1
    
    console.log(`🔄 Retrying job ${job.id} (attempt ${job.metadata.retryCount})`)
    
    // Wait before retry
    await this.delay(this.config.retryDelay)
    
    // Reset status and try again
    job.status = 'pending'
    job.error = undefined
    
    await this.executeJob(job)
  }

  private async waitForJob(jobId: string): Promise<void> {
    const maxWait = SCHEDULER_CONSTANTS.JOB_TIMEOUT
    const startTime = Date.now()
    
    while (this.activeJobs.has(jobId)) {
      if (Date.now() - startTime > maxWait) {
        console.warn(`⚠️ Job ${jobId} timed out`)
        break
      }
      await this.delay(1000)
    }
  }

  private async scheduleNextJobOfType(type: string): Promise<void> {
    switch (type) {
      case 'daily_reset':
        const nextDaily = this.getNextResetTime('daily')
        await this.scheduleJob({
          id: `daily_reset_${nextDaily.getTime()}`,
          type: 'daily_reset',
          status: 'pending',
          scheduledFor: nextDaily,
          metadata: {},
        })
        break
      
      case 'weekly_reset':
        const nextWeekly = this.getNextResetTime('weekly')
        await this.scheduleJob({
          id: `weekly_reset_${nextWeekly.getTime()}`,
          type: 'weekly_reset',
          status: 'pending',
          scheduledFor: nextWeekly,
          metadata: {},
        })
        break
      
      case 'cleanup':
        const nextCleanup = new Date(Date.now() + 6 * 60 * 60 * 1000)
        await this.scheduleJob({
          id: `cleanup_${nextCleanup.getTime()}`,
          type: 'cleanup',
          status: 'pending',
          scheduledFor: nextCleanup,
          metadata: {},
        })
        break
    }
  }

  // ====================================
  // MONITORING & HEALTH
  // ====================================

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(
      () => this.performHealthCheck(),
      SCHEDULER_CONSTANTS.HEALTH_CHECK_INTERVAL
    )
  }

  private async performHealthCheck(): Promise<void> {
    try {
      // Check for stuck jobs
      const stuckJobs = Array.from(this.activeJobs.values()).filter(job => {
        const runtime = Date.now() - (job.startedAt?.getTime() || 0)
        return runtime > SCHEDULER_CONSTANTS.JOB_TIMEOUT
      })
      
      if (stuckJobs.length > 0) {
        console.warn(`⚠️ Found ${stuckJobs.length} stuck jobs`)
        
        for (const job of stuckJobs) {
          job.status = 'failed'
          job.error = 'Job timeout'
          await this.updateJobStatus(job)
          this.activeJobs.delete(job.id)
        }
      }
      
      // Check scheduler health
      if (!this.isRunning && this.config.enabled) {
        console.warn('⚠️ Scheduler stopped unexpectedly, restarting...')
        await this.initialize()
      }
      
    } catch (error) {
      console.error('❌ Health check failed:', error)
    }
  }

  private async resumePendingJobs(): Promise<void> {
    // Find jobs that were running when scheduler stopped
    const { data: pendingJobs } = await this.supabase
      .from('scheduler_jobs')
      .select('*')
      .in('status', ['pending', 'running'])
      .order('scheduled_for', { ascending: true })
    
    if (pendingJobs && pendingJobs.length > 0) {
      console.log(`📋 Found ${pendingJobs.length} pending jobs to resume`)
      
      for (const job of pendingJobs) {
        // Reset running jobs to pending
        if (job.status === 'running') {
          job.status = 'pending'
          job.metadata.wasInterrupted = true
        }
        
        await this.scheduleJob(job)
      }
    }
  }

  // ====================================
  // UTILITY METHODS
  // ====================================

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async notifyUser(userId: string, notification: any): Promise<void> {
    await this.supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: notification.type,
        title: this.getNotificationTitle(notification.type),
        message: this.getNotificationMessage(notification),
        is_read: false,
        created_at: new Date().toISOString(),
      })
  }

  private async notifyAdmins(alert: any): Promise<void> {
    // Get admin users
    const { data: admins } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
    
    if (admins) {
      for (const admin of admins) {
        await this.notifyUser(admin.id, alert)
      }
    }
  }

  private getNotificationTitle(type: string): string {
    const titles: Record<string, string> = {
      daily_missions_ready: '🎯 Nuove Missioni Giornaliere!',
      weekly_missions_ready: '📅 Nuove Missioni Settimanali!',
      special_event: '🎉 Evento Speciale!',
      economy_alert: '⚠️ Alert Economia',
    }
    return titles[type] || 'Notifica'
  }

  private getNotificationMessage(notification: any): string {
    switch (notification.type) {
      case 'daily_missions_ready':
        return `${notification.count} nuove missioni ti aspettano!`
      case 'weekly_missions_ready':
        return `${notification.count} sfide settimanali pronte!`
      default:
        return 'Controlla le tue missioni!'
    }
  }

  private async cleanupOrphanedRecords(): Promise<void> {
    // Remove missions without valid users
    await this.supabase
      .from('user_missions')
      .delete()
      .is('user_id', null)
  }

  private async optimizeDatabase(): Promise<void> {
    // Run VACUUM or optimization queries
    // This depends on your database system
    console.log('🔧 Database optimization skipped (implement based on your DB)')
  }

  private async generateLeaderboardRewards(): Promise<void> {
    // Award top players from weekly leaderboard
    const { data: topPlayers } = await this.supabase
      .from('user_stats')
      .select('user_id, weekly_xp')
      .order('weekly_xp', { ascending: false })
      .limit(10)
    
    if (topPlayers) {
      const rewards = [500, 300, 200, 100, 50, 50, 50, 25, 25, 25] // XP rewards
      
      for (let i = 0; i < topPlayers.length; i++) {
        await this.supabase
          .from('user_rewards')
          .insert({
            user_id: topPlayers[i].user_id,
            type: 'leaderboard_weekly',
            xp: rewards[i],
            coins: Math.floor(rewards[i] / 5),
            position: i + 1,
            created_at: new Date().toISOString(),
          })
      }
    }
  }

  private async applyEmergencyEconomyMeasures(): Promise<void> {
    console.log('🚨 Applying emergency economy measures')
    
    // Reduce all active mission rewards by 30%
    await this.supabase.rpc('reduce_mission_rewards', { percentage: 0.3 })
    
    // Notify all users
    const { data: users } = await this.supabase
      .from('profiles')
      .select('id')
    
    if (users) {
      for (const user of users) {
        await this.notifyUser(user.id, {
          type: 'economy_adjustment',
          message: 'Bilanciamento economia in corso. Ricompense temporaneamente ridotte.',
        })
      }
    }
  }

  private async logSchedulerStats(stats: any): Promise<void> {
    await this.supabase
      .from('scheduler_stats')
      .insert({
        ...stats,
        created_at: new Date().toISOString(),
      })
  }

  // ====================================
  // PUBLIC API
  // ====================================

  async getStats(): Promise<SchedulerStats> {
    const { data: stats } = await this.supabase
      .from('scheduler_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recent = stats?.filter(s => new Date(s.created_at) > last24h) || []
    
    return {
      lastDailyReset: recent.find(s => s.type === 'daily_reset')?.created_at || null,
      lastWeeklyReset: recent.find(s => s.type === 'weekly_reset')?.created_at || null,
      lastCleanup: recent.find(s => s.type === 'cleanup')?.created_at || null,
      totalMissionsGenerated24h: recent.reduce((sum, s) => sum + (s.missionsGenerated || 0), 0),
      totalMissionsDeleted24h: recent.reduce((sum, s) => sum + (s.missionsDeleted || 0), 0),
      averageGenerationTime: recent.length > 0 
        ? recent.reduce((sum, s) => sum + (s.processingTime || 0), 0) / recent.length 
        : 0,
      failureRate: recent.length > 0 
        ? recent.filter(s => s.errors > 0).length / recent.length 
        : 0,
      activeUsers: recent[0]?.usersProcessed || 0,
    }
  }

  async triggerManualReset(type: 'daily' | 'weekly'): Promise<void> {
    console.log(`🔧 Manual ${type} reset triggered`)
    
    const job: SchedulerJob = {
      id: `manual_${type}_${Date.now()}`,
      type: type === 'daily' ? 'daily_reset' : 'weekly_reset',
      status: 'pending',
      scheduledFor: new Date(),
      metadata: { manual: true },
    }
    
    await this.executeJob(job)
  }
}

// ====================================
// EXPORT SINGLETON INSTANCE
// ====================================

export const missionScheduler = new MissionScheduler()
export default MissionScheduler