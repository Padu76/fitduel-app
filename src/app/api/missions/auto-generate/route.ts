// ====================================
// AUTO-GENERATE MISSIONS API (CRON JOB)
// Simplified version for Vercel Cron
// ====================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { AIMissionGenerator } from '@/lib/ai/mission-generator'

// ====================================
// CONFIGURATION
// ====================================

const CONFIG = {
  CRON_SECRET: process.env.CRON_SECRET || 'fitduel-cron-2024-secret-key-xyz789',
  BATCH_SIZE: 10, // Process users in batches
  MAX_USERS_TEST: 5, // Limit for test mode
  DAILY_MISSIONS: 5,
  WEEKLY_MISSIONS: 3,
}

// ====================================
// AUTHENTICATION
// ====================================

function validateCronRequest(request: NextRequest): boolean {
  const authHeader = headers().get('authorization')
  
  // In production, verify Vercel Cron header
  if (process.env.NODE_ENV === 'production') {
    if (authHeader !== `Bearer ${CONFIG.CRON_SECRET}`) {
      console.error('❌ Invalid cron authentication')
      return false
    }
  }
  
  // In development, allow test requests
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  
  return true
}

// ====================================
// SUPABASE ADMIN CLIENT
// ====================================

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey)
}

// ====================================
// MAIN CRON HANDLER
// ====================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Parse request body for test mode
    const body = await request.json().catch(() => ({}))
    const testMode = body.testMode === true
    const forceAuth = body.secret === CONFIG.CRON_SECRET
    
    // Validate authentication
    if (!testMode && !forceAuth && !validateCronRequest(request)) {
      return NextResponse.json(
        { error: '❌ Invalid cron authentication' },
        { status: 401 }
      )
    }
    
    console.log('🚀 Starting auto-generate missions...')
    console.log(`Mode: ${testMode ? 'TEST' : 'PRODUCTION'}`)
    
    const supabase = getSupabaseAdmin()
    const now = new Date()
    const isMonday = now.getDay() === 1
    
    // Stats tracking
    const stats = {
      usersProcessed: 0,
      missionsGenerated: 0,
      dailyMissions: 0,
      weeklyMissions: 0,
      errors: [] as Array<{user: string, error: string}>,
      skipped: 0
    }
    
    // ====================================
    // 1. EXPIRE OLD MISSIONS
    // ====================================
    
    console.log('🔍 Expiring old missions...')
    
    const { data: expired } = await supabase
      .from('user_missions')
      .update({ 
        is_completed: false,
        updated_at: now.toISOString()
      })
      .lt('expires_at', now.toISOString())
      .eq('is_completed', false)
      .select('id')
    
    console.log(`✅ Expired ${expired?.length || 0} old missions`)
    
    // ====================================
    // 2. GET ACTIVE USERS - IMPROVED QUERY
    // ====================================
    
    console.log('👥 Finding active users...')
    
    // Get users active in last 30 days OR recently created
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // First attempt: get ALL users for debugging
    let userQuery = supabase
      .from('profiles')
      .select('id, username, email, level, last_seen, created_at')
    
    // In test mode, limit results
    if (testMode) {
      userQuery = userQuery.limit(CONFIG.MAX_USERS_TEST)
    }
    
    const { data: allUsers, error: allUsersError } = await userQuery
    
    if (allUsersError) {
      console.error('Error fetching all users:', allUsersError)
      console.error('Error details:', allUsersError.message)
      console.error('Error code:', allUsersError.code)
      throw new Error(`Cannot fetch users: ${allUsersError.message}`)
    }
    
    console.log(`📊 Total users in database: ${allUsers?.length || 0}`)
    
    // Filter active users manually
    // Consider a user active if:
    // 1. They have been seen in the last 30 days
    // 2. OR they were created in the last 30 days
    // 3. OR they have no last_seen (new users)
    const users = allUsers?.filter(user => {
      // If last_seen exists, check if it's recent
      if (user.last_seen) {
        const lastSeenDate = new Date(user.last_seen)
        if (lastSeenDate >= thirtyDaysAgo) {
          return true
        }
      }
      
      // If created_at is recent, include the user
      if (user.created_at) {
        const createdDate = new Date(user.created_at)
        if (createdDate >= thirtyDaysAgo) {
          return true
        }
      }
      
      // If no last_seen and created_at is not available, include them (new users)
      if (!user.last_seen && !user.created_at) {
        return true
      }
      
      return false
    }) || []
    
    console.log(`📊 Active users (last 30 days): ${users.length}`)
    
    if (users.length === 0) {
      // If still no users, get ANY user for testing
      console.log('⚠️ No active users found, trying to get ANY user for testing...')
      
      const { data: anyUsers, error: anyError } = await supabase
        .from('profiles')
        .select('id, username, email, level, last_seen, created_at')
        .limit(testMode ? CONFIG.MAX_USERS_TEST : 1)
      
      if (anyError) {
        console.error('Cannot get any users:', anyError)
        return NextResponse.json({
          success: false,
          message: 'No users found in database',
          error: anyError.message,
          stats
        })
      }
      
      if (anyUsers && anyUsers.length > 0) {
        users.push(...anyUsers)
        console.log(`📊 Found ${users.length} users for testing`)
      } else {
        console.log('⚠️ No users in database at all')
        return NextResponse.json({
          success: true,
          message: 'No users to process',
          stats
        })
      }
    }
    
    console.log(`🎯 Processing ${users.length} users...`)
    
    // ====================================
    // 3. GENERATE MISSIONS WITH AI
    // ====================================
    
    console.log('🤖 Initializing AI Mission Generator...')
    const generator = new AIMissionGenerator()
    
    // Process users in batches
    const batches = []
    for (let i = 0; i < users.length; i += CONFIG.BATCH_SIZE) {
      batches.push(users.slice(i, i + CONFIG.BATCH_SIZE))
    }
    
    console.log(`Processing ${batches.length} batches...`)
    
    for (const [batchIndex, batch] of batches.entries()) {
      console.log(`\n📦 Batch ${batchIndex + 1}/${batches.length}`)
      
      await Promise.all(
        batch.map(async (user) => {
          try {
            console.log(`  🎯 Processing ${user.username || user.id}...`)
            
            // Check if user already has active missions today
            const { data: existingMissions } = await supabase
              .from('user_missions')
              .select('id')
              .eq('user_id', user.id)
              .eq('mission_type', 'daily')
              .gte('created_at', new Date(now.toISOString().split('T')[0]).toISOString())
              .limit(1)
            
            if (existingMissions && existingMissions.length > 0 && !body.forceRegenerate) {
              console.log(`    ⭐️ Skipping ${user.username} - already has missions today`)
              stats.skipped++
              return
            }
            
            // Generate daily missions
            // generateDailyMissions returns GeneratedMission[] directly
            console.log(`    📅 Generating ${CONFIG.DAILY_MISSIONS} daily missions...`)
            const dailyMissions = await generator.generateDailyMissions(
              user.id,
              CONFIG.DAILY_MISSIONS
            )
            
            if (dailyMissions && dailyMissions.length > 0) {
              stats.dailyMissions += dailyMissions.length
              stats.missionsGenerated += dailyMissions.length
              console.log(`    ✅ Generated ${dailyMissions.length} daily missions`)
            } else {
              console.log(`    ⚠️ Failed to generate daily missions`)
            }
            
            // Generate weekly missions (only on Mondays)
            if (isMonday || body.type === 'weekly_reset') {
              console.log(`    📅 Generating ${CONFIG.WEEKLY_MISSIONS} weekly missions...`)
              
              const weeklyMissions = await generator.generateWeeklyMissions(
                user.id,
                CONFIG.WEEKLY_MISSIONS
              )
              
              if (weeklyMissions && weeklyMissions.length > 0) {
                stats.weeklyMissions += weeklyMissions.length
                stats.missionsGenerated += weeklyMissions.length
                console.log(`    ✅ Generated ${weeklyMissions.length} weekly missions`)
              } else {
                console.log(`    ⚠️ Failed to generate weekly missions`)
              }
            }
            
            stats.usersProcessed++
            
          } catch (error) {
            console.error(`  ❌ Error for user ${user.id}:`, error)
            stats.errors.push({
              user: user.username || user.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        })
      )
      
      // Small delay between batches to prevent rate limiting
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    // ====================================
    // 4. CREATE NOTIFICATIONS
    // ====================================
    
    if (stats.usersProcessed > 0) {
      console.log('\n📬 Creating notifications...')
      
      const processedUsers = users.filter(u => {
        return !stats.errors.some(e => e.user === (u.username || u.id))
      })
      
      const notifications = processedUsers.map(user => ({
        user_id: user.id,
        type: 'missions_generated',
        title: '🎯 Nuove Missioni Disponibili!',
        message: `${stats.dailyMissions > 0 ? `${Math.floor(stats.dailyMissions / stats.usersProcessed)} missioni giornaliere` : ''}${isMonday && stats.weeklyMissions > 0 ? ` e ${Math.floor(stats.weeklyMissions / stats.usersProcessed)} settimanali` : ''} ti aspettano!`,
        priority: 'normal',
        icon: '🎯',
        action_url: '/dashboard',
        expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          daily_count: Math.floor(stats.dailyMissions / Math.max(stats.usersProcessed, 1)),
          weekly_count: isMonday ? Math.floor(stats.weeklyMissions / Math.max(stats.usersProcessed, 1)) : 0
        },
        is_read: false,
        created_at: now.toISOString()
      }))
      
      // Insert notifications in batches
      for (let i = 0; i < notifications.length; i += 50) {
        const batch = notifications.slice(i, i + 50)
        await supabase.from('notifications').insert(batch)
      }
      
      console.log(`✅ Created ${notifications.length} notifications`)
    }
    
    // ====================================
    // 5. LOG RESULTS
    // ====================================
    
    const processingTime = Date.now() - startTime
    
    // Save to system logs
    await supabase
      .from('system_logs')
      .insert({
        type: 'auto_generate_missions',
        status: stats.errors.length === 0 ? 'success' : 'partial',
        metadata: {
          stats,
          processing_time_ms: processingTime,
          test_mode: testMode,
          is_monday: isMonday
        },
        created_at: now.toISOString()
      })
    
    // Final report
    console.log('\n' + '='.repeat(50))
    console.log('✅ AUTO-GENERATE MISSIONS COMPLETED!')
    console.log('='.repeat(50))
    console.log('📊 Final Statistics:')
    console.log(`  • Users Processed: ${stats.usersProcessed}`)
    console.log(`  • Users Skipped: ${stats.skipped}`)
    console.log(`  • Total Missions: ${stats.missionsGenerated}`)
    console.log(`  • Daily Missions: ${stats.dailyMissions}`)
    console.log(`  • Weekly Missions: ${stats.weeklyMissions}`)
    console.log(`  • Errors: ${stats.errors.length}`)
    console.log(`  • Processing Time: ${(processingTime / 1000).toFixed(2)}s`)
    console.log('='.repeat(50))
    
    return NextResponse.json({
      success: true,
      message: `Generated ${stats.missionsGenerated} missions for ${stats.usersProcessed} users`,
      stats: {
        ...stats,
        processingTime: `${(processingTime / 1000).toFixed(2)}s`
      }
    })
    
  } catch (error) {
    console.error('❌ Critical error in auto-generate:', error)
    
    // Log critical error
    try {
      const supabase = getSupabaseAdmin()
      await supabase
        .from('system_logs')
        .insert({
          type: 'auto_generate_missions',
          status: 'error',
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          },
          created_at: new Date().toISOString()
        })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Mission generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// ====================================
// GET HANDLER - Check Status
// ====================================

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    
    // Get last execution log
    const { data: lastRun } = await supabase
      .from('system_logs')
      .select('*')
      .eq('type', 'auto_generate_missions')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    // Get today's missions count
    const today = new Date().toISOString().split('T')[0]
    const { count: todayMissions } = await supabase
      .from('user_missions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)
    
    // Get ALL users first for debugging
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    // Get active users count (with better logic)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const { data: activeUsersData } = await supabase
      .from('profiles')
      .select('id, last_seen, created_at')
    
    // Count active users manually with same logic as POST
    const activeUsers = activeUsersData?.filter(user => {
      if (user.last_seen) {
        const lastSeenDate = new Date(user.last_seen)
        if (lastSeenDate >= thirtyDaysAgo) return true
      }
      if (user.created_at) {
        const createdDate = new Date(user.created_at)
        if (createdDate >= thirtyDaysAgo) return true
      }
      if (!user.last_seen && !user.created_at) return true
      return false
    }).length || 0
    
    return NextResponse.json({
      success: true,
      status: {
        lastRun: lastRun || null,
        todayMissions: todayMissions || 0,
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers,
        nextRun: getNextCronExecution(),
        isMonday: new Date().getDay() === 1
      }
    })
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get status'
      },
      { status: 500 }
    )
  }
}

// ====================================
// HELPER FUNCTIONS
// ====================================

function getNextCronExecution(): string {
  const now = new Date()
  const next = new Date()
  
  // Set to next midnight
  next.setHours(24, 0, 0, 0)
  
  return next.toISOString()
}