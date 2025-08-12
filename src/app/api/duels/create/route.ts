import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// ====================================
// TYPES & VALIDATION
// ====================================
const createDuelSchema = z.object({
  challengerId: z.string().min(1, 'Challenger ID richiesto'),
  challengedId: z.string().optional(), // Optional for open challenges
  exerciseCode: z.enum(['push_up', 'squat', 'plank', 'burpee', 'jumping_jack', 'mountain_climber']),
  duelType: z.enum(['1v1', 'open', 'tournament', 'mission']).default('1v1'),
  wagerXP: z.number().min(10).max(500).default(50),
  duration: z.number().min(30).max(300).default(60), // seconds
  difficulty: z.enum(['easy', 'medium', 'hard', 'extreme']).default('medium'),
  maxParticipants: z.number().min(2).max(100).default(2),
  timeLimit: z.number().min(1).max(168).default(24), // hours to accept/complete
  rules: z.object({
    minReps: z.number().optional(),
    targetTime: z.number().optional(),
    formScoreRequired: z.number().min(0).max(100).optional(),
    allowRetry: z.boolean().default(false)
  }).optional()
})

type CreateDuelRequest = z.infer<typeof createDuelSchema>

interface DuelResponse {
  success: boolean
  message: string
  data?: {
    duel: {
      id: string
      challengerId: string
      challengerUsername: string
      challengedId?: string
      challengedUsername?: string
      exerciseCode: string
      exerciseName: string
      duelType: string
      status: string
      wagerXP: number
      rewardXP: number
      duration: number
      difficulty: string
      maxParticipants: number
      currentParticipants: number
      timeLimit: string
      expiresAt: string
      createdAt: string
      rules?: any
    }
  }
  error?: string
}

// Exercise data
const EXERCISES = {
  push_up: { 
    name: 'Push-Up', 
    nameIt: 'Flessioni',
    category: 'strength',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    defaultReps: { easy: 10, medium: 20, hard: 30, extreme: 50 }
  },
  squat: { 
    name: 'Squat', 
    nameIt: 'Squat',
    category: 'strength',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
    defaultReps: { easy: 15, medium: 30, hard: 45, extreme: 60 }
  },
  plank: { 
    name: 'Plank', 
    nameIt: 'Plank',
    category: 'core',
    muscleGroups: ['core', 'shoulders', 'back'],
    defaultTime: { easy: 30, medium: 60, hard: 90, extreme: 120 }
  },
  burpee: { 
    name: 'Burpee', 
    nameIt: 'Burpee',
    category: 'cardio',
    muscleGroups: ['full body'],
    defaultReps: { easy: 5, medium: 10, hard: 15, extreme: 25 }
  },
  jumping_jack: { 
    name: 'Jumping Jack', 
    nameIt: 'Jumping Jack',
    category: 'cardio',
    muscleGroups: ['full body'],
    defaultReps: { easy: 20, medium: 40, hard: 60, extreme: 100 }
  },
  mountain_climber: { 
    name: 'Mountain Climber', 
    nameIt: 'Mountain Climber',
    category: 'cardio',
    muscleGroups: ['core', 'shoulders', 'legs'],
    defaultReps: { easy: 10, medium: 20, hard: 30, extreme: 50 }
  }
}

// ====================================
// SUPABASE CLIENT
// ====================================
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase non configurato - usando modalità test')
    return null
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

// ====================================
// TEST MODE HANDLER
// ====================================
const testDuels: any[] = [] // Store test duels in memory

async function handleTestMode(data: CreateDuelRequest): Promise<DuelResponse> {
  // Create mock duel
  const exercise = EXERCISES[data.exerciseCode]
  const duelId = `duel-${Date.now()}`
  const expiresAt = new Date(Date.now() + data.timeLimit * 60 * 60 * 1000)
  
  const newDuel = {
    id: duelId,
    challenger_id: data.challengerId,
    challenger_username: 'TestChallenger',
    challenged_id: data.challengedId || null,
    challenged_username: data.challengedId ? 'TestOpponent' : null,
    exercise_code: data.exerciseCode,
    exercise_name: exercise.nameIt,
    duel_type: data.duelType,
    status: data.duelType === 'open' ? 'OPEN' : 'PENDING',
    wager_xp: data.wagerXP,
    reward_xp: Math.floor(data.wagerXP * 1.5), // 1.5x multiplier for winner
    duration: data.duration,
    difficulty: data.difficulty,
    max_participants: data.maxParticipants,
    current_participants: 1,
    time_limit: data.timeLimit,
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    rules: data.rules || null,
    results: null
  }

  testDuels.push(newDuel)
  console.log('✅ Test duel created:', duelId)

  return {
    success: true,
    message: data.duelType === 'open' ? 'Sfida aperta creata!' : 'Sfida creata! In attesa dell\'avversario.',
    data: {
      duel: {
        id: newDuel.id,
        challengerId: newDuel.challenger_id,
        challengerUsername: newDuel.challenger_username,
        challengedId: newDuel.challenged_id || undefined,
        challengedUsername: newDuel.challenged_username || undefined,
        exerciseCode: newDuel.exercise_code,
        exerciseName: newDuel.exercise_name,
        duelType: newDuel.duel_type,
        status: newDuel.status,
        wagerXP: newDuel.wager_xp,
        rewardXP: newDuel.reward_xp,
        duration: newDuel.duration,
        difficulty: newDuel.difficulty,
        maxParticipants: newDuel.max_participants,
        currentParticipants: newDuel.current_participants,
        timeLimit: `${newDuel.time_limit}h`,
        expiresAt: newDuel.expires_at,
        createdAt: newDuel.created_at,
        rules: newDuel.rules
      }
    }
  }
}

// ====================================
// SUPABASE DUEL CREATION HANDLER
// ====================================
async function handleSupabaseCreateDuel(
  supabase: any,
  data: CreateDuelRequest
): Promise<DuelResponse> {
  try {
    // Get challenger profile
    const { data: challengerProfile, error: challengerError } = await supabase
      .from('profiles')
      .select('username, xp')
      .eq('id', data.challengerId)
      .single()

    if (challengerError || !challengerProfile) {
      return {
        success: false,
        message: 'Profilo challenger non trovato',
        error: 'CHALLENGER_NOT_FOUND'
      }
    }

    // Check if challenger has enough XP for wager
    if (challengerProfile.xp < data.wagerXP) {
      return {
        success: false,
        message: `XP insufficienti. Hai ${challengerProfile.xp} XP ma ne servono ${data.wagerXP}`,
        error: 'INSUFFICIENT_XP'
      }
    }

    // Get challenged profile if specified
    let challengedProfile = null
    if (data.challengedId) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username, xp')
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
    const exercise = EXERCISES[data.exerciseCode]
    
    // Create duel
    const { data: newDuel, error: duelError } = await supabase
      .from('duels')
      .insert({
        challenger_id: data.challengerId,
        challenged_id: data.challengedId || null,
        exercise_code: data.exerciseCode,
        exercise_name: exercise.nameIt,
        duel_type: data.duelType,
        status: data.duelType === 'open' ? 'OPEN' : 'PENDING',
        wager_xp: data.wagerXP,
        reward_xp: Math.floor(data.wagerXP * 1.5),
        duration: data.duration,
        difficulty: data.difficulty,
        max_participants: data.maxParticipants,
        current_participants: 1,
        time_limit: data.timeLimit,
        expires_at: expiresAt.toISOString(),
        rules: data.rules || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (duelError || !newDuel) {
      console.error('Duel creation error:', duelError)
      return {
        success: false,
        message: 'Errore nella creazione della sfida',
        error: 'DUEL_CREATION_FAILED'
      }
    }

    // Create duel participants entry
    await supabase
      .from('duel_participants')
      .insert({
        duel_id: newDuel.id,
        user_id: data.challengerId,
        role: 'challenger',
        status: 'ready',
        joined_at: new Date().toISOString()
      })

    // Deduct wager XP from challenger
    await supabase
      .from('profiles')
      .update({ xp: challengerProfile.xp - data.wagerXP })
      .eq('id', data.challengerId)

    // Record XP transaction
    await supabase
      .from('xp_transactions')
      .insert({
        user_id: data.challengerId,
        amount: -data.wagerXP,
        type: 'wager',
        description: `Wager per sfida ${exercise.nameIt}`,
        duel_id: newDuel.id,
        created_at: new Date().toISOString()
      })

    // Send notification if 1v1
    if (data.challengedId) {
      await supabase
        .from('notifications')
        .insert({
          user_id: data.challengedId,
          type: 'duel_challenge',
          title: 'Nuova Sfida!',
          message: `${challengerProfile.username} ti ha sfidato a ${exercise.nameIt}!`,
          data: { duel_id: newDuel.id },
          read: false,
          created_at: new Date().toISOString()
        })
    }

    // Update user stats
    await supabase.rpc('increment_user_stat', {
      user_id: data.challengerId,
      stat_name: 'total_duels_created',
      amount: 1
    })

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
          challengerUsername: challengerProfile.username,
          challengedId: newDuel.challenged_id,
          challengedUsername: challengedProfile?.username,
          exerciseCode: newDuel.exercise_code,
          exerciseName: newDuel.exercise_name,
          duelType: newDuel.duel_type,
          status: newDuel.status,
          wagerXP: newDuel.wager_xp,
          rewardXP: newDuel.reward_xp,
          duration: newDuel.duration,
          difficulty: newDuel.difficulty,
          maxParticipants: newDuel.max_participants,
          currentParticipants: newDuel.current_participants,
          timeLimit: `${newDuel.time_limit}h`,
          expiresAt: newDuel.expires_at,
          createdAt: newDuel.created_at,
          rules: newDuel.rules
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
      // Test mode: return mock duels
      let duels = [...testDuels]
      
      if (duelId) {
        const duel = duels.find(d => d.id === duelId)
        return NextResponse.json({
          success: !!duel,
          data: duel,
          message: duel ? 'Duel trovato' : 'Duel non trovato'
        })
      }

      if (userId) {
        duels = duels.filter(d => 
          d.challenger_id === userId || d.challenged_id === userId
        )
      }

      if (status) {
        duels = duels.filter(d => d.status === status)
      }

      return NextResponse.json({
        success: true,
        data: duels,
        count: duels.length
      })
    }

    // Supabase query
    if (duelId) {
      const { data, error } = await supabase
        .from('duels')
        .select(`
          *,
          challenger:profiles!challenger_id(id, username, level, xp),
          challenged:profiles!challenged_id(id, username, level, xp),
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

    // Check authentication
    const userInfo = request.cookies.get('user_info')?.value
    if (!userInfo) {
      return NextResponse.json({
        success: false,
        message: 'Devi essere autenticato per creare una sfida',
        error: 'UNAUTHORIZED'
      }, { status: 401 })
    }

    const user = JSON.parse(userInfo)
    
    // Ensure challengerId matches authenticated user
    if (data.challengerId !== user.id) {
      return NextResponse.json({
        success: false,
        message: 'Non puoi creare sfide per altri utenti',
        error: 'FORBIDDEN'
      }, { status: 403 })
    }

    // Check if user is challenging themselves
    if (data.challengedId === data.challengerId) {
      return NextResponse.json({
        success: false,
        message: 'Non puoi sfidare te stesso!',
        error: 'SELF_CHALLENGE'
      }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    
    let result: DuelResponse
    if (!supabase) {
      console.log('⚔️ Creating duel (test mode):', data.exerciseCode)
      result = await handleTestMode(data)
    } else {
      console.log('⚔️ Creating duel (Supabase):', data.exerciseCode)
      result = await handleSupabaseCreateDuel(supabase, data)
    }

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