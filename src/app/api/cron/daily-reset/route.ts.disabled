// API Route per il reset giornaliero con AI Mission Generator
// Percorso: /src/app/api/cron/daily-reset/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { AIMissionGenerator } from '@/lib/ai/mission-generator'

// ====================================
// VALIDATION & SETUP
// ====================================

// Verifica che la richiesta venga da Vercel Cron
function validateCronRequest(request: NextRequest) {
  const authHeader = headers().get('authorization')
  
  // In produzione, Vercel aggiunge un header di autorizzazione per i cron job
  if (process.env.NODE_ENV === 'production') {
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return false
    }
  }
  
  // In development, accetta richieste locali per test
  if (process.env.NODE_ENV === 'development') {
    const testSecret = request.headers.get('x-cron-secret')
    if (testSecret === process.env.CRON_SECRET) {
      return true
    }
  }
  
  return process.env.NODE_ENV === 'development' // Allow in dev mode
}

// Inizializza Supabase Admin Client
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

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Valida che sia una richiesta autorizzata
    if (!validateCronRequest(request)) {
      console.error('❌ Unauthorized cron request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🌅 Starting daily reset with AI Mission Generator...')
    
    const supabase = getSupabaseAdmin()
    const now = new Date()
    const resetTime = now.toISOString()
    
    // Stats per il report finale
    const stats = {
      expiredMissions: 0,
      generatedMissions: 0,
      processedUsers: 0,
      resetStreaks: 0,
      notifications: 0,
      errors: [] as string[]
    }

    // ====================================
    // 1. EXPIRE OLD MISSIONS
    // ====================================
    
    console.log('🔍 Expiring old daily missions...')
    
    // Marca tutte le missioni giornaliere scadute
    const { data: expiredData, error: expireError } = await supabase
      .from('user_missions')
      .update({ 
        is_completed: false,
        updated_at: resetTime 
      })
      .lt('expires_at', resetTime)
      .eq('is_completed', false)
      .select('id')
    
    if (expireError) {
      console.error('Error expiring missions:', expireError)
      stats.errors.push(`Expire missions: ${expireError.message}`)
    } else {
      stats.expiredMissions = expiredData?.length || 0
      console.log(`✅ Expired ${stats.expiredMissions} old missions`)
    }

    // ====================================
    // 2. GET ACTIVE USERS
    // ====================================
    
    console.log('👥 Finding active users...')
    
    // Ottieni utenti attivi negli ultimi 30 giorni
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const { data: activeUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, username, email, level, last_seen')
      .or(`last_seen.gte.${thirtyDaysAgo.toISOString()},last_seen.is.null`)
      .order('last_seen', { ascending: false, nullsFirst: false })
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      stats.errors.push(`Fetch users: ${usersError.message}`)
      throw new Error('Cannot proceed without users')
    }
    
    console.log(`📊 Found ${activeUsers?.length || 0} active users`)

    // ====================================
    // 3. GENERATE AI MISSIONS FOR EACH USER
    // ====================================
    
    if (activeUsers && activeUsers.length > 0) {
      console.log('🤖 Generating AI missions for all users...')
      
      // Inizializza AI Generator
      const generator = new AIMissionGenerator()
      
      // Process users in batches per non sovraccaricare
      const batchSize = 10
      const batches = []
      
      for (let i = 0; i < activeUsers.length; i += batchSize) {
        batches.push(activeUsers.slice(i, i + batchSize))
      }
      
      for (const [batchIndex, batch] of batches.entries()) {
        console.log(`Processing batch ${batchIndex + 1}/${batches.length}...`)
        
        await Promise.all(
          batch.map(async (user) => {
            try {
              console.log(`🎯 Generating missions for ${user.username || user.id}...`)
              
              // Genera 5 missioni giornaliere
              // generateDailyMissions ritorna direttamente un array di GeneratedMission[]
              const dailyMissions = await generator.generateDailyMissions(
                user.id,
                5
              )
              
              if (dailyMissions && dailyMissions.length > 0) {
                stats.generatedMissions += dailyMissions.length
                console.log(`✅ Generated ${dailyMissions.length} daily missions for ${user.username}`)
              } else {
                console.log(`⚠️ No daily missions generated for ${user.username}`)
              }
              
              // Genera 3 missioni settimanali (solo il lunedì)
              if (now.getDay() === 1) { // 1 = Monday
                const weeklyMissions = await generator.generateWeeklyMissions(
                  user.id,
                  3
                )
                
                if (weeklyMissions && weeklyMissions.length > 0) {
                  stats.generatedMissions += weeklyMissions.length
                  console.log(`✅ Generated ${weeklyMissions.length} weekly missions for ${user.username}`)
                } else {
                  console.log(`⚠️ No weekly missions generated for ${user.username}`)
                }
              }
              
              stats.processedUsers++
              
            } catch (userError: any) {
              console.error(`Error processing user ${user.id}:`, userError)
              stats.errors.push(`User ${user.username}: ${userError.message || 'Unknown error'}`)
            }
          })
        )
        
        // Small delay between batches to prevent rate limiting
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    // ====================================
    // 4. RESET INACTIVE STREAKS
    // ====================================
    
    console.log('🔥 Checking user streaks...')
    
    const { data: streakUsers, error: streakError } = await supabase
      .from('user_stats')
      .select('user_id, daily_streak, last_activity')
      .gt('daily_streak', 0)
    
    if (!streakError && streakUsers) {
      for (const user of streakUsers) {
        if (!user.last_activity) continue
        
        const lastActivity = new Date(user.last_activity)
        const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)
        
        // Se non attivo da più di 48 ore, reset streak
        if (hoursSinceActivity > 48) {
          const { error: resetError } = await supabase
            .from('user_stats')
            .update({ 
              daily_streak: 0,
              updated_at: resetTime
            })
            .eq('user_id', user.user_id)
          
          if (!resetError) {
            stats.resetStreaks++
            console.log(`🔄 Reset streak for user ${user.user_id}`)
          }
        }
      }
    }

    // ====================================
    // 5. CREATE NOTIFICATIONS
    // ====================================
    
    console.log('📬 Creating daily notifications...')
    
    if (activeUsers && activeUsers.length > 0) {
      const notifications = activeUsers.map(user => ({
        user_id: user.id,
        type: 'daily_reset',
        title: '🌅 Nuove Missioni AI Disponibili!',
        message: `${stats.generatedMissions > 0 ? 'Le tue missioni personalizzate sono pronte!' : 'Controlla le nuove sfide di oggi!'}`,
        priority: 'normal',
        icon: '🎯',
        action_url: '/dashboard',
        expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          generated_missions: Math.floor(stats.generatedMissions / Math.max(stats.processedUsers, 1)),
          reset_time: resetTime
        },
        is_read: false,
        created_at: resetTime
      }))
      
      // Insert notifications in batches
      const notifBatchSize = 100
      for (let i = 0; i < notifications.length; i += notifBatchSize) {
        const batch = notifications.slice(i, i + notifBatchSize)
        const { error: notifError } = await supabase
          .from('notifications')
          .insert(batch)
        
        if (notifError) {
          console.error('Error creating notifications:', notifError)
          stats.errors.push(`Notifications batch ${i}: ${notifError.message}`)
        } else {
          stats.notifications += batch.length
        }
      }
      
      console.log(`✅ Created ${stats.notifications} notifications`)
    }

    // ====================================
    // 6. CLEANUP OLD DATA
    // ====================================
    
    console.log('🧹 Cleaning old data...')
    
    // Pulisci notifiche vecchie (più di 30 giorni)
    const { error: cleanupError } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())
      .eq('is_read', true)
    
    if (cleanupError) {
      console.error('Error cleaning notifications:', cleanupError)
      stats.errors.push(`Cleanup: ${cleanupError.message}`)
    }

    // ====================================
    // 7. LOG RESULTS
    // ====================================
    
    const processingTime = Date.now() - startTime
    
    await supabase
      .from('system_logs')
      .insert({
        type: 'daily_reset_ai',
        status: stats.errors.length === 0 ? 'success' : 'partial',
        metadata: {
          reset_time: resetTime,
          expired_missions: stats.expiredMissions,
          generated_missions: stats.generatedMissions,
          processed_users: stats.processedUsers,
          reset_streaks: stats.resetStreaks,
          notifications_sent: stats.notifications,
          processing_time_ms: processingTime,
          errors: stats.errors
        },
        created_at: resetTime
      })

    console.log('✅ Daily reset with AI completed!')
    console.log('📊 Final Stats:', {
      ...stats,
      processingTime: `${(processingTime / 1000).toFixed(2)}s`
    })

    return NextResponse.json({
      success: true,
      message: 'Daily reset with AI completed',
      data: {
        reset_time: resetTime,
        expired_missions: stats.expiredMissions,
        generated_missions: stats.generatedMissions,
        processed_users: stats.processedUsers,
        reset_streaks: stats.resetStreaks,
        notifications_sent: stats.notifications,
        processing_time: `${(processingTime / 1000).toFixed(2)}s`,
        errors: stats.errors.length
      }
    })

  } catch (error) {
    console.error('❌ Daily reset error:', error)
    
    // Log errore critico
    try {
      const supabase = getSupabaseAdmin()
      await supabase
        .from('system_logs')
        .insert({
          type: 'daily_reset_ai',
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
        error: 'Daily reset failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// ====================================
// POST HANDLER FOR MANUAL TRIGGER
// ====================================

export async function POST(request: NextRequest) {
  try {
    // Per test manuali in development
    const body = await request.json()
    
    if (process.env.NODE_ENV === 'development' || body.testMode === true) {
      console.log('🧪 Manual trigger in test mode')
      
      // Crea una fake GET request con auth header
      const fakeRequest = new NextRequest(request.url, {
        headers: {
          'x-cron-secret': process.env.CRON_SECRET || ''
        }
      })
      
      return GET(fakeRequest)
    }
    
    return NextResponse.json(
      { error: 'Manual trigger not allowed in production' },
      { status: 403 }
    )
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
