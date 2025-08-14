// API Route per il reset giornaliero delle sfide
// Percorso: /src/app/api/cron/daily-reset/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

// Verifica che la richiesta venga da Vercel Cron
function validateCronRequest(request: NextRequest) {
  const authHeader = headers().get('authorization')
  
  // In produzione, Vercel aggiunge un header di autorizzazione per i cron job
  if (process.env.NODE_ENV === 'production') {
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return false
    }
  }
  
  return true
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

export async function GET(request: NextRequest) {
  try {
    // Valida che sia una richiesta autorizzata
    if (!validateCronRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🌅 Starting daily reset...')
    
    const supabase = getSupabaseAdmin()
    const now = new Date()
    const resetTime = now.toISOString()
    
    // 1. Reset missioni giornaliere
    console.log('Resetting daily missions...')
    
    // Marca tutte le missioni giornaliere come expired
    const { error: expireError } = await supabase
      .from('missions')
      .update({ 
        status: 'expired',
        updated_at: resetTime 
      })
      .eq('type', 'daily')
      .eq('status', 'active')
    
    if (expireError) {
      console.error('Error expiring missions:', expireError)
    }

    // 2. Genera nuove sfide giornaliere
    console.log('Generating new daily challenges...')
    
    const dailyChallenges = [
      {
        exercise_id: 'squat',
        exercise_name: 'Squat',
        difficulty: 'medium',
        target_reps: 50,
        target_time: null,
        xp_reward: 200,
        coin_reward: 50,
        description: 'Completa 50 squat con forma perfetta',
        type: 'daily',
        status: 'active',
        expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: resetTime
      },
      {
        exercise_id: 'plank',
        exercise_name: 'Plank',
        difficulty: 'hard',
        target_reps: null,
        target_time: 120,
        xp_reward: 300,
        coin_reward: 75,
        description: 'Mantieni il plank per 2 minuti',
        type: 'daily',
        status: 'active',
        expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: resetTime
      },
      {
        exercise_id: 'pushup',
        exercise_name: 'Push-Up',
        difficulty: 'medium',
        target_reps: 30,
        target_time: null,
        xp_reward: 250,
        coin_reward: 60,
        description: 'Esegui 30 push-up perfetti',
        type: 'daily',
        status: 'active',
        expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: resetTime
      }
    ]
    
    const { error: insertError } = await supabase
      .from('daily_challenges')
      .insert(dailyChallenges)
    
    if (insertError) {
      console.error('Error creating daily challenges:', insertError)
    }

    // 3. Reset streak per utenti inattivi
    console.log('Checking user streaks...')
    
    // Ottieni tutti gli utenti con streak attivo
    const { data: activeUsers, error: usersError } = await supabase
      .from('user_stats')
      .select('user_id, daily_streak, last_activity')
      .gt('daily_streak', 0)
    
    if (!usersError && activeUsers) {
      for (const user of activeUsers) {
        const lastActivity = new Date(user.last_activity)
        const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)
        
        // Se non attivo da più di 48 ore, reset streak
        if (hoursSinceActivity > 48) {
          await supabase
            .from('user_stats')
            .update({ 
              daily_streak: 0,
              updated_at: resetTime
            })
            .eq('user_id', user.user_id)
          
          console.log(`Reset streak for user ${user.user_id}`)
        }
      }
    }

    // 4. Crea notifiche per tutti gli utenti attivi
    console.log('Creating daily reset notifications...')
    
    // Ottieni utenti attivi negli ultimi 7 giorni
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const { data: recentUsers, error: recentError } = await supabase
      .from('profiles')
      .select('id, username')
      .gte('last_seen', sevenDaysAgo.toISOString())
    
    if (!recentError && recentUsers) {
      const notifications = recentUsers.map(user => ({
        user_id: user.id,
        type: 'daily_reset',
        title: '🌅 Nuove Sfide Giornaliere!',
        message: '3 nuove sfide ti aspettano! Completale entro mezzanotte per bonus XP!',
        priority: 'normal',
        icon: '🌅',
        action_url: '/dashboard#daily-challenges',
        expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          new_challenges: 3,
          bonus_xp: 500
        },
        is_read: false,
        created_at: resetTime
      }))
      
      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications)
      
      if (notifError) {
        console.error('Error creating notifications:', notifError)
      } else {
        console.log(`Created ${notifications.length} daily reset notifications`)
      }
    }

    // 5. Pulisci vecchie notifiche (più di 30 giorni)
    console.log('Cleaning old notifications...')
    
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const { error: cleanupError } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())
      .eq('is_read', true)
    
    if (cleanupError) {
      console.error('Error cleaning notifications:', cleanupError)
    }

    // 6. Log del reset completato
    await supabase
      .from('system_logs')
      .insert({
        type: 'daily_reset',
        status: 'success',
        metadata: {
          reset_time: resetTime,
          challenges_created: dailyChallenges.length,
          notifications_sent: recentUsers?.length || 0
        },
        created_at: resetTime
      })

    console.log('✅ Daily reset completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'Daily reset completed',
      data: {
        reset_time: resetTime,
        challenges_created: dailyChallenges.length,
        notifications_sent: recentUsers?.length || 0
      }
    })

  } catch (error) {
    console.error('Daily reset error:', error)
    
    // Log errore
    try {
      const supabase = getSupabaseAdmin()
      await supabase
        .from('system_logs')
        .insert({
          type: 'daily_reset',
          status: 'error',
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error'
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