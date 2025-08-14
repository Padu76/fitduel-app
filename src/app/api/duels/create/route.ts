import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// ====================================
// TYPES & VALIDATION
// ====================================
const createDuelSchema = z.object({
  challengerId: z.string().min(1, 'Challenger ID richiesto'),
  challengedId: z.string().optional(), // Optional for open challenges
  exerciseId: z.string().min(1, 'Exercise ID richiesto'), // CHANGED: exercise_id from exercises table
  duelType: z.enum(['1v1', 'open', 'tournament', 'mission']).default('1v1'),
  wagerCoins: z.number().min(10).max(500).default(50), // CHANGED: coins instead of XP
  difficulty: z.enum(['easy', 'medium', 'hard', 'extreme']).default('medium'),
  targetReps: z.number().min(1).max(1000).optional().nullable(),
  targetTime: z.number().min(5).max(600).optional().nullable(),
  maxParticipants: z.number().min(2).max(100).default(2),
  timeLimit: z.number().min(1).max(168).default(24),
  xpReward: z.number().min(50).max(1000).default(100),
  rules: z.object({
    minReps: z.number().optional(),
    targetTime: z.number().optional(),
    formScoreRequired: z.number().min(0).max(100).optional(),
    allowRetry: z.boolean().default(false)
  }).optional()
})

type CreateDuelRequest = z.infer<typeof createDuelSchema>

// ====================================
// SUPABASE CLIENT
// ====================================
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase non configurato')
    return null
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

// ====================================
// SUPABASE DUEL CREATION HANDLER
// ====================================
async function handleSupabaseCreateDuel(
  supabase: any,
  data: CreateDuelRequest
): Promise<any> {
  try {
    // Get exercise info
    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', data.exerciseId)
      .single()

    if (exerciseError || !exercise) {
      return {
        success: false,
        message: 'Esercizio non trovato',
        error: 'EXERCISE_NOT_FOUND'
      }
    }

    // Get challenger profile
    const { data: challengerProfile, error: challengerError } = await supabase
      .from('profiles')
      .select('username, coins, xp')
      .eq('id', data.challengerId)
      .single()

    if (challengerError || !challengerProfile) {
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

    // Get challenged profile if specified
    let challengedProfile = null
    if (data.challengedId) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username, coins')
        .eq('id', data.challengedId)
        .single()

      if (error || !profile) {
        return {
          success: false,
          message: 'Profilo avversario non trovato',
          error: 'OPPONENT_NOT_FOUND'
        }
      }
      challengedProfile = profile
    }

    // Calculate expiration
    const expiresAt = new Date(Date.now() + data.timeLimit * 60 * 60 * 1000)
    
    // Create duel with correct column names
    const { data: newDuel, error: duelError } = await supabase
      .from('duels')
      .insert({
        challenger_id: data.challengerId,
        challenged_id: data.challengedId || null, // CORRECT: challenged_id
        exercise_id: data.exerciseId, // CORRECT: exercise_id
        type: data.duelType, // Will be cast to duel_type enum
        status: data.duelType === 'open' ? 'open' : 'pending', // Will be cast to duel_status enum
        wager_coins: data.wagerCoins,
        xp_reward: data.xpReward,
        difficulty: data.difficulty, // Will be cast to difficulty_level enum
        expires_at: expiresAt.toISOString(),
        metadata: {
          targetReps: data.targetReps,
          targetTime: data.targetTime,
          rules: data.rules || {}
        },
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        challenger:profiles!challenger_id(id, username, level, xp),
        challenged:profiles!challenged_id(id, username, level, xp),
        exercise:exercises!exercise_id(id, name, code, icon, category)
      `)
      .single()

    if (duelError || !newDuel) {
      console.error('Duel creation error:', duelError)
      return {
        success: false,
        message: 'Errore nella creazione della sfida',
        error: duelError?.message || 'DUEL_CREATION_FAILED'
      }
    }

    // Create duel participant entry
    await supabase
      .from('duel_participants')
      .insert({
        duel_id: newDuel.id,
        user_id: data.challengerId,
        joined_at: new Date().toISOString()
      })

    // Deduct wager coins from challenger
    await supabase
      .from('profiles')
      .update({ 
        coins: challengerProfile.coins - data.wagerCoins,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.challengerId)

    // Record XP transaction if table exists
    try {
      await supabase
        .from('xp_transactions')
        .insert({
          user_id: data.challengerId,
          amount: -data.wagerCoins,
          type: 'duel_win', // Using valid enum value
          description: `Wager per sfida ${exercise.name}`,
          created_at: new Date().toISOString()
        })
    } catch (e) {
      console.log('xp_transactions insert skipped')
    }

    // Send notification if 1v1
    if (data.challengedId) {
      await supabase
        .from('notifications')
        .insert({
          user_id: data.challengedId,
          type: 'challenge', // Valid notification_type enum
          title: 'Nuova Sfida!',
          message: `${challengerProfile.username} ti ha sfidato a ${exercise.name}!`,
          metadata: { duel_id: newDuel.id },
          is_read: false,
          created_at: new Date().toISOString()
        })
    }

    // Update user stats
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
          total_duels_completed: 1
        })
    } else {
      // Update existing stats
      await supabase
        .from('user_stats')
        .update({
          total_duels_completed: (userStats.total_duels_completed || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', data.challengerId)
    }

    return {
      success: true,
      message: data.duelType === 'open' 
        ? 'Sfida aperta creata! Altri giocatori possono unirsi.' 
        : challengedProfile 
          ? `Sfida inviata a ${challengedProfile.username}!`
          : 'Sfida creata con successo!',
      data: {
        duel: {
          id: newDuel.id,
          challengerId: newDuel.challenger_id,
          challengerUsername: newDuel.challenger?.username,
          challengedId: newDuel.challenged_id,
          challengedUsername: newDuel.challenged?.username,
          exerciseId: newDuel.exercise_id,
          exerciseName: newDuel.exercise?.name,
          exerciseIcon: newDuel.exercise?.icon,
          duelType: newDuel.type,
          status: newDuel.status,
          wagerCoins: newDuel.wager_coins,
          xpReward: newDuel.xp_reward,
          difficulty: newDuel.difficulty,
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
      message: 'Si è verificato un errore inaspettato',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    }
  }
}

// ====================================
// GET DUEL DETAILS
// ====================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const duelId = searchParams.get('id')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    const supabase = getSupabaseClient()

    if (!supabase) {
      return NextResponse.json({
        success: false,
        message: 'Database non configurato',
        error: 'NO_DATABASE'
      }, { status: 500 })
    }

    if (duelId) {
      const { data, error } = await supabase
        .from('duels')
        .select(`
          *,
          challenger:profiles!challenger_id(id, username, level, xp),
          challenged:profiles!challenged_id(id, username, level, xp),
          exercise:exercises!exercise_id(id, name, code, icon, category),
          participants:duel_participants(*)
        `)
        .eq('id', duelId)
        .single()

      if (error) {
        console.error('Duel fetch error:', error)
        return NextResponse.json({
          success: false,
          message: 'Errore nel recupero della sfida',
          error: error.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: data,
        count: 1
      })
    } else {
      let query = supabase
        .from('duels')
        .select(`
          *,
          challenger:profiles!challenger_id(id, username, level, xp),
          challenged:profiles!challenged_id(id, username, level, xp),
          exercise:exercises!exercise_id(id, name, code, icon, category),
          participants:duel_participants(*)
        `)

      if (userId) {
        query = query.or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
      }
      if (status) {
        query = query.eq('status', status)
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Duel fetch error:', error)
        return NextResponse.json({
          success: false,
          message: 'Errore nel recupero delle sfide',
          error: error.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: data,
        count: Array.isArray(data) ? data.length : 0
      })
    }

  } catch (error) {
    console.error('Get duels error:', error)
    return NextResponse.json({
      success: false,
      message: 'Errore del server',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 })
  }
}

// ====================================
// CREATE DUEL HANDLER
// ====================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = createDuelSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return NextResponse.json({
        success: false,
        message: firstError.message,
        error: 'VALIDATION_ERROR'
      }, { status: 400 })
    }

    const data = validation.data

    // Check if user is challenging themselves
    if (data.challengedId === data.challengerId) {
      return NextResponse.json({
        success: false,
        message: 'Non puoi sfidare te stesso!',
        error: 'SELF_CHALLENGE'
      }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    
    if (!supabase) {
      return NextResponse.json({
        success: false,
        message: 'Database non configurato',
        error: 'NO_DATABASE'
      }, { status: 500 })
    }

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