// ====================================
// AUTOMATED MISSION GENERATION API (CRON JOB)
// Scheduled mission generation for all users
// ====================================

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { headers } from 'next/headers'
import { MissionScheduler } from '@/lib/ai/scheduler'

// ====================================
// TYPES & INTERFACES
// ====================================

interface CronJobRequest {
  type: 'daily_reset' | 'weekly_reset' | 'cleanup' | 'special_event' | 'economy_balance'
  secret?: string // Cron secret for Vercel Cron
  force?: boolean // Force execution even if recently run
  testMode?: boolean // Run in test mode (limited users)
  metadata?: {
    eventType?: string
    userLimit?: number
    dryRun?: boolean
  }
}

interface CronJobResponse {
  success: boolean
  message: string
  data?: {
    job: {
      id: string
      type: string
      status: string
      startedAt: string
      completedAt?: string
    }
    stats: {
      usersProcessed: number
      missionsGenerated: number
      missionsDeleted?: number
      processingTime: number
      errors: number
    }
    nextExecution?: string
  }
  error?: string
}

// ====================================
// CONSTANTS
// ====================================

const CRON_CONFIG = {
  // Vercel Cron secret (set in environment variables)
  CRON_SECRET: process.env.CRON_SECRET || 'dev-secret',
  
  // Rate limiting
  MIN_INTERVAL_HOURS: {
    daily_reset: 23, // Allow daily reset every 23 hours
    weekly_reset: 167, // Allow weekly reset every ~7 days
    cleanup: 5, // Allow cleanup every 5 hours
    special_event: 1, // Allow special events hourly
    economy_balance: 11, // Allow economy check every 11 hours
  },
  
  // Test mode limits
  TEST_MODE_USER_LIMIT: 10,
  
  // Timeouts
  JOB_TIMEOUT: 300000, // 5 minutes
  
  // Special event schedule
  SPECIAL_EVENTS: {
    weekend: { days: [0, 6] }, // Sunday, Saturday
    month_start: { day: 1 },
    holidays: [
      { month: 1, day: 1, name: 'new_year' },
      { month: 12, day: 25, name: 'christmas' },
      { month: 10, day: 31, name: 'halloween' },
      { month: 2, day: 14, name: 'valentine' },
    ],
  },
}

// ====================================
// AUTHENTICATION & AUTHORIZATION
// ====================================

async function verifyCronAuthentication(request: NextRequest): Promise<boolean> {
  // Check for Vercel Cron header
  const authHeader = headers().get('authorization')
  
  // In production, verify the cron secret
  if (process.env.NODE_ENV === 'production') {
    if (!authHeader || authHeader !== `Bearer ${CRON_CONFIG.CRON_SECRET}`) {
      console.error('❌ Invalid cron authentication')
      return false
    }
  }
  
  // In development, allow localhost requests
  if (process.env.NODE_ENV === 'development') {
    const host = headers().get('host')
    if (host?.includes('localhost')) {
      return true
    }
  }
  
  return true
}

// ====================================
// RATE LIMITING
// ====================================

async function checkRateLimit(
  type: CronJobRequest['type'],
  force: boolean,
  supabase: any
): Promise<{ allowed: boolean; reason?: string; lastRun?: Date }> {
  if (force) {
    console.log('⚡ Force execution enabled, skipping rate limit')
    return { allowed: true }
  }

  try {
    // Get last execution time for this job type
    const { data: lastJob } = await supabase
      .from('scheduler_jobs')
      .select('completed_at')
      .eq('type', type)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()

    if (!lastJob) {
      // No previous execution found
      return { allowed: true }
    }

    const lastRun = new Date(lastJob.completed_at)
    const hoursSinceLastRun = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60)
    const minInterval = CRON_CONFIG.MIN_INTERVAL_HOURS[type]

    if (hoursSinceLastRun < minInterval) {
      return {
        allowed: false,
        reason: `Job ${type} già eseguito ${hoursSinceLastRun.toFixed(1)} ore fa. Minimo intervallo: ${minInterval} ore`,
        lastRun,
      }
    }

    return { allowed: true, lastRun }
  } catch (error) {
    console.error('Rate limit check error:', error)
    // Allow execution on error to prevent blocking
    return { allowed: true }
  }
}

// ====================================
// JOB EXECUTION
// ====================================

async function executeCronJob(
  request: CronJobRequest,
  supabase: any
): Promise<CronJobResponse> {
  const startTime = Date.now()
  const jobId = `cron_${request.type}_${startTime}`
  
  try {
    // Initialize scheduler
    const scheduler = new MissionScheduler()
    
    // Create job record
    const job = {
      id: jobId,
      type: request.type,
      status: 'running' as const,
      startedAt: new Date(),
      metadata: {
        source: 'cron',
        testMode: request.testMode,
        ...request.metadata,
      },
    }

    // Save job to database
    await supabase
      .from('scheduler_jobs')
      .insert({
        ...job,
        scheduled_for: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })

    // Execute based on job type
    let result: any = {}
    
    switch (request.type) {
      case 'daily_reset':
        result = await executeDailyReset(scheduler, request, supabase)
        break
        
      case 'weekly_reset':
        result = await executeWeeklyReset(scheduler, request, supabase)
        break
        
      case 'cleanup':
        result = await executeCleanup(scheduler, request, supabase)
        break
        
      case 'special_event':
        result = await executeSpecialEvent(scheduler, request, supabase)
        break
        
      case 'economy_balance':
        result = await executeEconomyBalance(scheduler, request, supabase)
        break
        
      default:
        throw new Error(`Unknown job type: ${request.type}`)
    }

    // Update job completion
    const completedAt = new Date()
    await supabase
      .from('scheduler_jobs')
      .update({
        status: 'completed',
        completed_at: completedAt.toISOString(),
        metadata: {
          ...job.metadata,
          ...result.stats,
        },
      })
      .eq('id', jobId)

    // Calculate next execution time
    const nextExecution = calculateNextExecution(request.type)

    return {
      success: true,
      message: `Job ${request.type} completato con successo`,
      data: {
        job: {
          id: jobId,
          type: request.type,
          status: 'completed',
          startedAt: job.startedAt.toISOString(),
          completedAt: completedAt.toISOString(),
        },
        stats: {
          ...result.stats,
          processingTime: Date.now() - startTime,
        },
        nextExecution: nextExecution.toISOString(),
      },
    }

  } catch (error) {
    console.error(`❌ Cron job ${jobId} failed:`, error)

    // Update job failure
    await supabase
      .from('scheduler_jobs')
      .update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    return {
      success: false,
      message: `Job ${request.type} fallito`,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        job: {
          id: jobId,
          type: request.type,
          status: 'failed',
          startedAt: new Date(startTime).toISOString(),
        },
        stats: {
          usersProcessed: 0,
          missionsGenerated: 0,
          processingTime: Date.now() - startTime,
          errors: 1,
        },
      },
    }
  }
}

// ====================================
// SPECIFIC JOB EXECUTIONS
// ====================================

async function executeDailyReset(
  scheduler: MissionScheduler,
  request: CronJobRequest,
  supabase: any
): Promise<{ stats: any }> {
  console.log('🌅 Executing daily reset via cron...')
  
  // Get active users (with test mode limit)
  let userQuery = supabase
    .from('user_stats')
    .select('user_id')
    .eq('is_active', true)
    .gte('last_active', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  if (request.testMode) {
    userQuery = userQuery.limit(request.metadata?.userLimit || CRON_CONFIG.TEST_MODE_USER_LIMIT)
  }

  const { data: users, error } = await userQuery
  
  if (error) throw error

  let usersProcessed = 0
  let missionsGenerated = 0
  let errors = 0

  // Process users in batches
  const batchSize = 50
  for (let i = 0; i < (users?.length || 0); i += batchSize) {
    const batch = users?.slice(i, i + batchSize) || []
    
    const results = await Promise.allSettled(
      batch.map(async (user) => {
        try {
          // Generate daily missions using the scheduler's method
          const result = await scheduler['generateDailyMissionsForUser'](user.user_id)
          return result
        } catch (error) {
          console.error(`Failed to generate missions for user ${user.user_id}:`, error)
          return { success: false, error }
        }
      })
    )

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.success) {
        usersProcessed++
        missionsGenerated += result.value.missionsGenerated || 0
      } else {
        errors++
      }
    })

    // Small delay between batches
    if (i + batchSize < (users?.length || 0)) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  // Update daily streaks
  await updateDailyStreaks(supabase)

  // Clean up expired daily missions
  await cleanupExpiredMissions('daily', supabase)

  return {
    stats: {
      usersProcessed,
      missionsGenerated,
      errors,
      totalUsers: users?.length || 0,
    },
  }
}

async function executeWeeklyReset(
  scheduler: MissionScheduler,
  request: CronJobRequest,
  supabase: any
): Promise<{ stats: any }> {
  console.log('📅 Executing weekly reset via cron...')
  
  // Get eligible users (level 3+)
  let userQuery = supabase
    .from('user_stats')
    .select('user_id')
    .gte('level', 3)
    .eq('is_active', true)

  if (request.testMode) {
    userQuery = userQuery.limit(request.metadata?.userLimit || CRON_CONFIG.TEST_MODE_USER_LIMIT)
  }

  const { data: users, error } = await userQuery
  
  if (error) throw error

  let usersProcessed = 0
  let missionsGenerated = 0
  let errors = 0

  // Process users
  for (const user of (users || [])) {
    try {
      const result = await scheduler['generateWeeklyMissionsForUser'](user.user_id)
      if (result.success) {
        usersProcessed++
        missionsGenerated += result.missionsGenerated || 0
      } else {
        errors++
      }
    } catch (error) {
      console.error(`Failed to generate weekly missions for user ${user.user_id}:`, error)
      errors++
    }
  }

  // Process weekly leaderboard rewards
  await processWeeklyLeaderboard(supabase)

  // Clean up expired weekly missions
  await cleanupExpiredMissions('weekly', supabase)

  return {
    stats: {
      usersProcessed,
      missionsGenerated,
      errors,
      totalUsers: users?.length || 0,
    },
  }
}

async function executeCleanup(
  scheduler: MissionScheduler,
  request: CronJobRequest,
  supabase: any
): Promise<{ stats: any }> {
  console.log('🧹 Executing cleanup via cron...')
  
  let missionsDeleted = 0
  let orphanedDeleted = 0
  
  // Delete expired missions
  const { count: expired } = await supabase
    .from('user_missions')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .eq('is_completed', false)
  
  missionsDeleted += expired || 0
  
  // Delete old completed missions (keep last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { count: oldCompleted } = await supabase
    .from('user_missions')
    .delete()
    .lt('completed_at', thirtyDaysAgo.toISOString())
    .eq('is_completed', true)
  
  missionsDeleted += oldCompleted || 0
  
  // Clean up orphaned records
  const { count: orphaned } = await supabase
    .from('user_missions')
    .delete()
    .is('user_id', null)
  
  orphanedDeleted = orphaned || 0
  
  // Clean up old scheduler jobs (keep last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  await supabase
    .from('scheduler_jobs')
    .delete()
    .lt('created_at', sevenDaysAgo.toISOString())
  
  return {
    stats: {
      missionsDeleted,
      orphanedDeleted,
      totalCleaned: missionsDeleted + orphanedDeleted,
      errors: 0,
    },
  }
}

async function executeSpecialEvent(
  scheduler: MissionScheduler,
  request: CronJobRequest,
  supabase: any
): Promise<{ stats: any }> {
  console.log('🎉 Executing special event via cron...')
  
  const eventType = request.metadata?.eventType || detectSpecialEvent()
  
  if (!eventType) {
    return {
      stats: {
        usersProcessed: 0,
        missionsGenerated: 0,
        errors: 0,
        message: 'No special event detected',
      },
    }
  }
  
  // Get eligible users
  let userQuery = supabase
    .from('user_stats')
    .select('user_id')
    .eq('is_active', true)
  
  if (request.testMode) {
    userQuery = userQuery.limit(request.metadata?.userLimit || CRON_CONFIG.TEST_MODE_USER_LIMIT)
  }
  
  const { data: users, error } = await userQuery
  
  if (error) throw error
  
  let missionsGenerated = 0
  let errors = 0
  
  for (const user of (users || [])) {
    try {
      const mission = await scheduler['missionGenerator'].generateSpecialMission(
        user.user_id,
        eventType as any
      )
      
      if (mission) {
        // Save mission
        await supabase
          .from('user_missions')
          .insert({
            user_id: user.user_id,
            mission_id: mission.id,
            mission_type: 'special',
            ...mission,
            created_at: new Date().toISOString(),
          })
        
        missionsGenerated++
      }
    } catch (error) {
      console.error(`Failed to generate special mission for user ${user.user_id}:`, error)
      errors++
    }
  }
  
  // Send global notification about the event
  await sendGlobalEventNotification(eventType, missionsGenerated, supabase)
  
  return {
    stats: {
      usersProcessed: users?.length || 0,
      missionsGenerated,
      errors,
      eventType,
    },
  }
}

async function executeEconomyBalance(
  scheduler: MissionScheduler,
  request: CronJobRequest,
  supabase: any
): Promise<{ stats: any }> {
  console.log('💰 Executing economy balance check via cron...')
  
  const rewardBalancer = scheduler['rewardBalancer']
  
  // Generate economy report
  const report = await rewardBalancer.generateDailyReport()
  
  // Save report
  await supabase
    .from('economy_reports')
    .insert({
      metrics: report.metrics,
      recommendations: report.recommendations,
      alerts: report.alerts,
      created_at: new Date().toISOString(),
    })
  
  // Check for critical issues
  if (report.metrics.economyHealth === 'critical') {
    // Apply emergency measures
    await applyEmergencyMeasures(report, supabase)
    
    // Notify admins
    await notifyAdmins({
      type: 'economy_critical',
      report,
    }, supabase)
  }
  
  // Generate predictions
  const predictions = await rewardBalancer.predictFutureEconomy(7)
  
  return {
    stats: {
      economyHealth: report.metrics.economyHealth,
      inflationRate: report.metrics.inflationRate,
      alerts: report.alerts.length,
      recommendations: report.recommendations.length,
      projectedRisk: predictions.risk,
      errors: 0,
    },
  }
}

// ====================================
// HELPER FUNCTIONS
// ====================================

function calculateNextExecution(type: string): Date {
  const now = new Date()
  const next = new Date()
  
  switch (type) {
    case 'daily_reset':
      // Next day at midnight
      next.setDate(next.getDate() + 1)
      next.setHours(0, 0, 0, 0)
      break
      
    case 'weekly_reset':
      // Next Monday at midnight
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7
      next.setDate(next.getDate() + daysUntilMonday)
      next.setHours(0, 0, 0, 0)
      break
      
    case 'cleanup':
      // 6 hours from now
      next.setHours(next.getHours() + 6)
      break
      
    case 'special_event':
      // Check next special event
      const nextEvent = getNextSpecialEvent()
      return nextEvent || new Date(now.getTime() + 24 * 60 * 60 * 1000)
      
    case 'economy_balance':
      // 12 hours from now
      next.setHours(next.getHours() + 12)
      break
  }
  
  return next
}

function detectSpecialEvent(): string | null {
  const now = new Date()
  const day = now.getDay()
  const date = now.getDate()
  const month = now.getMonth() + 1
  
  // Weekend
  if (CRON_CONFIG.SPECIAL_EVENTS.weekend.days.includes(day)) {
    return 'weekend'
  }
  
  // Month start
  if (date === CRON_CONFIG.SPECIAL_EVENTS.month_start.day) {
    return 'month_start'
  }
  
  // Holidays
  const holiday = CRON_CONFIG.SPECIAL_EVENTS.holidays.find(
    h => h.month === month && h.day === date
  )
  if (holiday) {
    return holiday.name
  }
  
  return null
}

function getNextSpecialEvent(): Date | null {
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  
  // Check if tomorrow is a special event
  tomorrow.setHours(0, 0, 0, 0)
  
  const day = tomorrow.getDay()
  const date = tomorrow.getDate()
  const month = tomorrow.getMonth() + 1
  
  // Weekend
  if (CRON_CONFIG.SPECIAL_EVENTS.weekend.days.includes(day)) {
    return tomorrow
  }
  
  // Month start
  if (date === CRON_CONFIG.SPECIAL_EVENTS.month_start.day) {
    return tomorrow
  }
  
  // Holidays
  const holiday = CRON_CONFIG.SPECIAL_EVENTS.holidays.find(
    h => h.month === month && h.day === date
  )
  if (holiday) {
    return tomorrow
  }
  
  return null
}

async function updateDailyStreaks(supabase: any): Promise<void> {
  // Update streaks for users who completed missions yesterday
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  await supabase.rpc('update_daily_streaks', {
    yesterday_start: yesterday.toISOString(),
    today_start: today.toISOString(),
  })
}

async function cleanupExpiredMissions(type: string, supabase: any): Promise<void> {
  await supabase
    .from('user_missions')
    .update({ is_expired: true })
    .eq('mission_type', type)
    .lt('expires_at', new Date().toISOString())
    .eq('is_completed', false)
}

async function processWeeklyLeaderboard(supabase: any): Promise<void> {
  // Get top 10 players
  const { data: topPlayers } = await supabase
    .from('user_stats')
    .select('user_id, weekly_xp')
    .order('weekly_xp', { ascending: false })
    .limit(10)
  
  if (topPlayers) {
    const rewards = [500, 300, 200, 100, 50, 50, 50, 25, 25, 25]
    
    for (let i = 0; i < topPlayers.length; i++) {
      await supabase
        .from('user_rewards')
        .insert({
          user_id: topPlayers[i].user_id,
          type: 'weekly_leaderboard',
          xp: rewards[i],
          coins: Math.floor(rewards[i] / 5),
          position: i + 1,
          created_at: new Date().toISOString(),
        })
    }
  }
  
  // Reset weekly XP
  await supabase
    .from('user_stats')
    .update({ weekly_xp: 0 })
}

async function sendGlobalEventNotification(
  eventType: string,
  missionsGenerated: number,
  supabase: any
): Promise<void> {
  const eventNames: Record<string, string> = {
    weekend: '🎉 Weekend Challenge!',
    month_start: '🚀 Nuovo Mese, Nuove Sfide!',
    new_year: '🎊 Buon Anno!',
    christmas: '🎄 Evento Natalizio!',
    halloween: '🎃 Halloween Special!',
    valentine: '❤️ San Valentino!',
  }
  
  const title = eventNames[eventType] || '🎉 Evento Speciale!'
  const message = `${missionsGenerated} missioni speciali disponibili! Non perdere l'occasione!`
  
  // Get all active users
  const { data: users } = await supabase
    .from('user_stats')
    .select('user_id')
    .eq('is_active', true)
  
  if (users) {
    const notifications = users.map(user => ({
      user_id: user.user_id,
      type: 'special_event',
      title,
      message,
      data: { eventType, missionsGenerated },
      is_read: false,
      created_at: new Date().toISOString(),
    }))
    
    // Insert in batches
    const batchSize = 100
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize)
      await supabase.from('notifications').insert(batch)
    }
  }
}

async function applyEmergencyMeasures(report: any, supabase: any): Promise<void> {
  console.log('🚨 Applying emergency economy measures')
  
  // Reduce all rewards by 30%
  await supabase.rpc('apply_economy_adjustment', { 
    adjustment_factor: 0.7,
    reason: 'emergency_balance',
  })
  
  // Increase sink rates
  await supabase
    .from('system_settings')
    .update({ value: '0.15' })
    .eq('key', 'economy_sink_rate')
}

async function notifyAdmins(notification: any, supabase: any): Promise<void> {
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
  
  if (admins) {
    const adminNotifications = admins.map(admin => ({
      user_id: admin.id,
      type: 'admin_alert',
      title: '⚠️ Admin Alert',
      message: JSON.stringify(notification),
      is_read: false,
      priority: 'high',
      created_at: new Date().toISOString(),
    }))
    
    await supabase.from('notifications').insert(adminNotifications)
  }
}

// ====================================
// MAIN HANDLER
// ====================================

export async function POST(request: NextRequest) {
  try {
    // Verify cron authentication
    const isAuthenticated = await verifyCronAuthentication(request)
    if (!isAuthenticated) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized cron request',
          error: 'UNAUTHORIZED',
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const cronRequest: CronJobRequest = {
      type: body.type || 'daily_reset',
      secret: body.secret,
      force: body.force || false,
      testMode: body.testMode || false,
      metadata: body.metadata || {},
    }

    // Initialize Supabase
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookies() 
    })

    // Check rate limiting
    const rateLimit = await checkRateLimit(
      cronRequest.type,
      cronRequest.force || false,
      supabase
    )
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: rateLimit.reason,
          error: 'RATE_LIMITED',
          data: {
            lastRun: rateLimit.lastRun?.toISOString(),
            nextAllowed: calculateNextExecution(cronRequest.type).toISOString(),
          },
        },
        { status: 429 }
      )
    }

    // Execute the cron job
    const result = await executeCronJob(cronRequest, supabase)

    // Log the execution
    await supabase
      .from('cron_logs')
      .insert({
        type: cronRequest.type,
        success: result.success,
        stats: result.data?.stats,
        error: result.error,
        created_at: new Date().toISOString(),
      })

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ====================================
// GET HANDLER - Check Cron Status
// ====================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'

    const supabase = createRouteHandlerClient({ 
      cookies: () => cookies() 
    })

    // Get recent job executions
    let query = supabase
      .from('scheduler_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (type !== 'all') {
      query = query.eq('type', type)
    }

    const { data: jobs, error } = await query

    if (error) throw error

    // Calculate statistics
    const stats = {
      total: jobs?.length || 0,
      completed: jobs?.filter(j => j.status === 'completed').length || 0,
      failed: jobs?.filter(j => j.status === 'failed').length || 0,
      running: jobs?.filter(j => j.status === 'running').length || 0,
      avgProcessingTime: jobs?.reduce((sum, j) => {
        if (j.metadata?.processingTime) {
          return sum + j.metadata.processingTime
        }
        return sum
      }, 0) / (jobs?.length || 1),
    }

    // Get next scheduled executions
    const nextExecutions = {
      daily_reset: calculateNextExecution('daily_reset'),
      weekly_reset: calculateNextExecution('weekly_reset'),
      cleanup: calculateNextExecution('cleanup'),
      special_event: getNextSpecialEvent(),
      economy_balance: calculateNextExecution('economy_balance'),
    }

    return NextResponse.json({
      success: true,
      data: {
        jobs: jobs || [],
        stats,
        nextExecutions,
        currentTime: new Date().toISOString(),
      },
    })

  } catch (error) {
    console.error('Get cron status error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error fetching cron status',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}