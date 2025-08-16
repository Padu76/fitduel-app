import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

// ====================================
// TYPES & VALIDATION
// ====================================
const createDuelSchema = z.object({
  challengerId: z.string().min(1, 'Challenger ID richiesto'),
  challengedId: z.string().optional().nullable(), // Optional for open challenges
  exerciseId: z.string().min(1, 'Exercise ID richiesto'),
  duelType: z.enum(['1v1', 'open', 'tournament', 'mission']).default('open'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'extreme']).default('medium'),
  wagerCoins: z.number().min(0).max(10000).default(50),
  xpReward: z.number().min(50).max(5000).default(100),
  targetReps: z.number().min(1).max(1000).optional().nullable(),
  targetTime: z.number().min(1).max(3600).optional().nullable(), // seconds
  timeLimit: z.number().min(1).max(168).default(24), // hours
})

type CreateDuelRequest = z.infer<typeof createDuelSchema>

// ====================================
// HELPER FUNCTIONS
// ====================================
function calculateExpiry(hoursFromNow: number): string {
  const expiry = new Date()
  expiry.setHours(expiry.getHours() + hoursFromNow)
  return expiry.toISOString()
}

// Helper function to check if exercise is time-based
function isExerciseTimeBased(code: string): boolean {
  const timeBasedExercises = ['plank', 'wall_sit', 'dead_hang', 'bridge_hold']
  return timeBasedExercises.includes(code)
}

// ====================================
// SUPABASE CREATE DUEL HANDLER
// ====================================
async function handleSupabaseCreateDuel(
  supabase: any,
  data: CreateDuelRequest
): Promise<any> {
  try {
    // Get challenger profile
    const { data: challengerProfile, error: challengerError } = await supabase
      .from('profiles')
      .select('id, username, display_name, level, xp, coins')
      .eq('id', data.challengerId)
      .single()

    if (challengerError || !challengerProfile) {
      console.error('Challenger not found:', challengerError)
      return {
        success: false,
        message: 'Profilo challenger non trovato',
        error: 'CHALLENGER_NOT_FOUND'
      }
    }

    // Check if challenger has enough coins for wager
    if (challengerProfile.coins < data.wagerCoins) {
      return {
        success: false,
        message: `Coins insufficienti. Hai ${challengerProfile.coins} coins ma ne servono ${data.wagerCoins}`,
        error: 'INSUFFICIENT_COINS'
      }
    }

    // Get exercise info
    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', data.exerciseId)
      .single()

    if (exerciseError || !exercise) {
      console.error('Exercise not found:', exerciseError)
      return {
        success: false,
        message: 'Esercizio non trovato',
        error: 'EXERCISE_NOT_FOUND'
      }
    }

    // Determine if exercise is time-based
    const isTimeBased = isExerciseTimeBased(exercise.code)
    
    // Validate target values based on exercise type
    if (isTimeBased) {
      // Time-based exercise should have targetTime
      if (!data.targetTime && data.targetReps) {
        return {
          success: false,
          message: `${exercise.name} è un esercizio a tempo, non a ripetizioni`,
          error: 'INVALID_TARGET_TYPE'
        }
      }
      // Set default if not provided
      if (!data.targetTime) {
        data.targetTime = data.difficulty === 'easy' ? 30 : 
                         data.difficulty === 'medium' ? 60 : 
                         data.difficulty === 'hard' ? 90 : 120
      }
    } else {
      // Rep-based exercise should have targetReps
      if (!data.targetReps && data.targetTime) {
        return {
          success: false,
          message: `${exercise.name} è un esercizio a ripetizioni, non a tempo`,
          error: 'INVALID_TARGET_TYPE'
        }
      }
      // Set default if not provided
      if (!data.targetReps) {
        data.targetReps = data.difficulty === 'easy' ? 10 : 
                         data.difficulty === 'medium' ? 20 : 
                         data.difficulty === 'hard' ? 30 : 50
      }
    }

    // Prepare metadata
    const metadata: any = {
      targetReps: data.targetReps,
      targetTime: data.targetTime,
      exerciseCode: exercise.code,
      exerciseName: exercise.name,
      exerciseIcon: exercise.icon,
      isTimeBased: isTimeBased
    }

    // If 1v1, check challenged user exists
    let challengedProfile = null
    if (data.duelType === '1v1' && data.challengedId) {
      const { data: challenged, error: challengedError } = await supabase
        .from('profiles')
        .select('id, username, display_name, level, xp, coins')
        .eq('id', data.challengedId)
        .single()

      if (challengedError || !challenged) {
        console.error('Challenged user not found:', challengedError)
        return {
          success: false,
          message: 'Utente sfidato non trovato',
          error: 'CHALLENGED_NOT_FOUND'
        }
      }

      challengedProfile = challenged

      // Check if challenging self
      if (data.challengerId === data.challengedId) {
        return {
          success: false,
          message: 'Non puoi sfidare te stesso',
          error: 'SELF_CHALLENGE'
        }
      }
    }

    const createdAt = new Date().toISOString()
    const expiresAt = calculateExpiry(data.timeLimit)

    // Create the duel
    const { data: newDuel, error: createError } = await supabase
      .from('duels')
      .insert({
        type: data.duelType,
        status: data.duelType === 'open' ? 'open' : 'pending',
        challenger_id: data.challengerId,
        challenged_id: data.challengedId || null,
        exercise_id: data.exerciseId,
        difficulty: data.difficulty,
        wager_coins: data.wagerCoins,
        xp_reward: data.xpReward,
        challenger_score: 0,
        challenged_score: 0,
        metadata: metadata,
        expires_at: expiresAt,
        created_at: createdAt,
        updated_at: createdAt
      })
      .select(`
        *,
        challenger:profiles!challenger_id(id, username, display_name, level, xp, coins),
        challenged:profiles!challenged_id(id, username, display_name, level, xp, coins),
        exercise:exercises!exercise_id(id, name, code, icon, category)
      `)
      .single()

    if (createError || !newDuel) {
      console.error('Duel creation error:', createError)
      return {
        success: false,
        message: 'Errore nella creazione della sfida. Verifica che tutte le tabelle esistano nel database.',
        error: createError?.message || 'CREATE_FAILED'
      }
    }

    // Add challenger to duel_participants
    const { error: participantError } = await supabase
      .from('duel_participants')
      .insert({
        duel_id: newDuel.id,
        user_id: data.challengerId,
        score: 0,
        form_score: 0,
        completed: false,
        joined_at: createdAt
      })

    if (participantError) {
      console.error('Error adding participant:', participantError)
      // Not critical, continue
    }

    // Deduct wager coins from challenger
    await supabase
      .from('profiles')
      .update({ 
        coins: challengerProfile.coins - data.wagerCoins,
        updated_at: createdAt
      })
      .eq('id', data.challengerId)

    // Record transaction (if table exists)
    try {
      await supabase
        .from('xp_transactions')
        .insert({
          user_id: data.challengerId,
          amount: -data.wagerCoins,
          type: 'duel_win', // Using valid enum
          description: `Wager per sfida ${exercise.name}`,
          created_at: createdAt
        })
    } catch (e) {
      console.log('xp_transactions table might not exist, skipping...')
    }

    // Send notification if 1v1
    if (data.duelType === '1v1' && data.challengedId && challengedProfile) {
      try {
        await supabase
          .from('notifications')
          .insert({
            user_id: data.challengedId,
            type: 'challenge', // Using valid notification_type enum
            title: 'Nuova Sfida!',
            message: `${challengerProfile.username || challengerProfile.display_name} ti ha sfidato a ${exercise.name}!`,
            metadata: { duel_id: newDuel.id },
            is_read: false,
            created_at: createdAt
          })
      } catch (e) {
        console.log('Notification insert failed, continuing...')
      }
    }

    // Update user stats (if table exists)
    try {
      const { data: userStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', data.challengerId)
        .single()

      if (!userStats) {
        // Create user_stats if doesn't exist
        await supabase
          .from('user_stats')
          .insert({
            user_id: data.challengerId,
            total_duels_completed: 0,
            total_wins: 0,
            total_losses: 0,
            total_draws: 0,
            current_win_streak: 0,
            max_win_streak: 0
          })
      }
    } catch (e) {
      console.log('user_stats table operations skipped')
    }

    return {
      success: true,
      message: data.duelType === 'open' 
        ? 'Sfida aperta creata! In attesa di un avversario.' 
        : 'Sfida creata! In attesa dell\'avversario.',
      data: {
        duel: {
          id: newDuel.id,
          type: newDuel.type,
          status: newDuel.status,
          challengerId: newDuel.challenger_id,
          challengerUsername: newDuel.challenger?.username || newDuel.challenger?.display_name || 'Challenger',
          challengedId: newDuel.challenged_id,
          challengedUsername: newDuel.challenged?.username || newDuel.challenged?.display_name || null,
          exerciseId: newDuel.exercise_id,
          exerciseName: newDuel.exercise?.name,
          exerciseCode: newDuel.exercise?.code,
          exerciseIcon: newDuel.exercise?.icon,
          difficulty: newDuel.difficulty,
          wagerCoins: newDuel.wager_coins,
          xpReward: newDuel.xp_reward,
          targetReps: metadata.targetReps,
          targetTime: metadata.targetTime,
          timeLimit: `${data.timeLimit}h`,
          expiresAt: newDuel.expires_at,
          createdAt: newDuel.created_at,
          metadata: newDuel.metadata
        }
      }
    }

  } catch (error) {
    console.error('Unexpected error creating duel:', error)
    return {
      success: false,
      message: 'Si è verificato un errore inaspettato. Verifica la configurazione del database.',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    }
  }
}

// ====================================
// CREATE DUEL HANDLER
// ====================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Create duel request:', body)
    
    // Validate input
    const validation = createDuelSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      console.error('Validation error:', firstError)
      return NextResponse.json({
        success: false,
        message: firstError.message,
        error: 'VALIDATION_ERROR'
      }, { status: 400 })
    }

    const data = validation.data

    // Get Supabase client with proper auth
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('Auth error:', authError)
      
      // Check if using localStorage user (dev mode)
      const savedUser = body.challengerId
      if (savedUser) {
        console.log('Using localStorage user:', savedUser)
        const result = await handleSupabaseCreateDuel(supabase, data)
        return NextResponse.json(result, { 
          status: result.success ? 201 : 400 
        })
      }
      
      return NextResponse.json({
        success: false,
        message: 'Devi essere autenticato per creare una sfida',
        error: 'UNAUTHORIZED'
      }, { status: 401 })
    }

    // Ensure challengerId matches authenticated user
    if (data.challengerId !== user.id) {
      console.error('User mismatch:', data.challengerId, '!==', user.id)
      return NextResponse.json({
        success: false,
        message: 'Non puoi creare sfide per altri utenti',
        error: 'FORBIDDEN'
      }, { status: 403 })
    }

    console.log('⚔️ Creating duel for user:', user.email)
    const result = await handleSupabaseCreateDuel(supabase, data)

    return NextResponse.json(result, { 
      status: result.success ? 201 : 400 
    })

  } catch (error) {
    console.error('Create duel error:', error)
    return NextResponse.json({
      success: false,
      message: 'Errore del server',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 })
  }
}

// ====================================
// GET DUELS HANDLER
// ====================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const duelId = searchParams.get('duelId')

    // Get Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Build query
    let query = supabase
      .from('duels')
      .select(`
        *,
        challenger:profiles!challenger_id(id, username, display_name, level, xp, coins),
        challenged:profiles!challenged_id(id, username, display_name, level, xp, coins),
        exercise:exercises!exercise_id(id, name, code, icon, category),
        participants:duel_participants(*)
      `)

    // Apply filters
    if (duelId) {
      query = query.eq('id', duelId)
    } else {
      if (userId) {
        query = query.or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
      }
      if (status) {
        query = query.eq('status', status)
      }
      query = query.order('created_at', { ascending: false }).limit(50)
    }

    const { data, error } = await query

    if (error) {
      console.error('Duels fetch error:', error)
      return NextResponse.json({
        success: false,
        message: 'Errore nel recupero delle sfide',
        error: error.message
      }, { status: 500 })
    }

    // If fetching single duel
    if (duelId) {
      return NextResponse.json({
        success: true,
        data: data?.[0] || null,
        message: data?.[0] ? 'Sfida trovata' : 'Sfida non trovata'
      })
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    })

  } catch (error) {
    console.error('Get duels error:', error)
    return NextResponse.json({
      success: false,
      message: 'Errore del server',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 })
  }
}