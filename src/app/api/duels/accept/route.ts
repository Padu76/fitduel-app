import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

// ====================================
// TYPES & VALIDATION
// ====================================
const acceptDuelSchema = z.object({
  duelId: z.string().min(1, 'Duel ID richiesto'),
  userId: z.string().min(1, 'User ID richiesto')
})

type AcceptDuelRequest = z.infer<typeof acceptDuelSchema>

interface AcceptDuelResponse {
  success: boolean
  message: string
  data?: {
    duel: {
      id: string
      challengerId: string
      challengerUsername: string
      opponentId: string
      opponentUsername: string
      exerciseCode: string
      exerciseName: string
      status: string
      wagerXP: number
      rewardXP: number
      duration: number
      difficulty: string
      timeLimit: string
      expiresAt: string
      startedAt: string
    }
    opponent: {
      id: string
      username: string
      level: number
      xp: number
    }
  }
  error?: string
}

// ====================================
// TEST MODE HANDLER
// ====================================
const testDuels: any[] = [] // Should match the array from create route

async function handleTestMode(data: AcceptDuelRequest): Promise<AcceptDuelResponse> {
  // Find the duel
  const duel = testDuels.find(d => d.id === data.duelId)
  
  if (!duel) {
    return {
      success: false,
      message: 'Sfida non trovata',
      error: 'DUEL_NOT_FOUND'
    }
  }

  // Check if duel is available for acceptance
  if (duel.status !== 'PENDING' && duel.status !== 'OPEN') {
    return {
      success: false,
      message: 'Questa sfida non è più disponibile',
      error: 'DUEL_NOT_AVAILABLE'
    }
  }

  // Check if duel is expired
  const now = new Date()
  const expiresAt = new Date(duel.expires_at)
  if (now > expiresAt) {
    duel.status = 'EXPIRED'
    return {
      success: false,
      message: 'Questa sfida è scaduta',
      error: 'DUEL_EXPIRED'
    }
  }

  // Check if user is trying to accept their own duel
  if (duel.challenger_id === data.userId) {
    return {
      success: false,
      message: 'Non puoi accettare la tua stessa sfida',
      error: 'SELF_ACCEPT'
    }
  }

  // Check if duel is full (for open duels)
  if (duel.current_participants >= duel.max_participants) {
    return {
      success: false,
      message: 'Questa sfida è al completo',
      error: 'DUEL_FULL'
    }
  }

  // Update duel
  duel.challenged_id = data.userId
  duel.challenged_username = 'TestOpponent'
  duel.status = 'ACTIVE'
  duel.current_participants += 1
  duel.started_at = new Date().toISOString()
  duel.updated_at = new Date().toISOString()

  console.log('✅ Test duel accepted:', data.duelId)

  return {
    success: true,
    message: 'Sfida accettata! Inizia a giocare.',
    data: {
      duel: {
        id: duel.id,
        challengerId: duel.challenger_id,
        challengerUsername: duel.challenger_username,
        opponentId: duel.challenged_id,
        opponentUsername: duel.challenged_username,
        exerciseCode: duel.exercise_code,
        exerciseName: duel.exercise_name,
        status: duel.status,
        wagerXP: duel.wager_xp,
        rewardXP: duel.reward_xp,
        duration: duel.duration,
        difficulty: duel.difficulty,
        timeLimit: `${duel.time_limit}h`,
        expiresAt: duel.expires_at,
        startedAt: duel.started_at
      },
      opponent: {
        id: data.userId,
        username: 'TestOpponent',
        level: 5,
        xp: 250
      }
    }
  }
}

// ====================================
// SUPABASE ACCEPT DUEL HANDLER
// ====================================
async function handleSupabaseAcceptDuel(
  supabase: any,
  data: AcceptDuelRequest
): Promise<AcceptDuelResponse> {
  try {
    // Get the duel with challenger info
    const { data: duel, error: duelError } = await supabase
      .from('duels')
      .select(`
        *,
        challenger:profiles!challenger_id(id, username, level, xp),
        challenged:profiles!challenged_id(id, username, level, xp)
      `)
      .eq('id', data.duelId)
      .single()

    if (duelError || !duel) {
      return {
        success: false,
        message: 'Sfida non trovata',
        error: 'DUEL_NOT_FOUND'
      }
    }

    // Check if duel is available for acceptance
    if (duel.status !== 'PENDING' && duel.status !== 'OPEN') {
      return {
        success: false,
        message: 'Questa sfida non è più disponibile',
        error: 'DUEL_NOT_AVAILABLE'
      }
    }

    // Check if duel is expired
    const now = new Date()
    const expiresAt = new Date(duel.expires_at)
    if (now > expiresAt) {
      // Mark as expired
      await supabase
        .from('duels')
        .update({ status: 'EXPIRED', updated_at: new Date().toISOString() })
        .eq('id', data.duelId)

      return {
        success: false,
        message: 'Questa sfida è scaduta',
        error: 'DUEL_EXPIRED'
      }
    }

    // Check if user is trying to accept their own duel
    if (duel.challenger_id === data.userId) {
      return {
        success: false,
        message: 'Non puoi accettare la tua stessa sfida',
        error: 'SELF_ACCEPT'
      }
    }

    // Check if duel is full (for open duels)
    if (duel.current_participants >= duel.max_participants) {
      return {
        success: false,
        message: 'Questa sfida è al completo',
        error: 'DUEL_FULL'
      }
    }

    // Get opponent profile
    const { data: opponentProfile, error: opponentError } = await supabase
      .from('profiles')
      .select('id, username, level, xp')
      .eq('id', data.userId)
      .single()

    if (opponentError || !opponentProfile) {
      return {
        success: false,
        message: 'Profilo utente non trovato',
        error: 'USER_NOT_FOUND'
      }
    }

    // Check if opponent has enough XP for wager
    if (opponentProfile.xp < duel.wager_xp) {
      return {
        success: false,
        message: `XP insufficienti. Hai ${opponentProfile.xp} XP ma ne servono ${duel.wager_xp}`,
        error: 'INSUFFICIENT_XP'
      }
    }

    // Update duel to ACTIVE status
    const startedAt = new Date().toISOString()
    const { data: updatedDuel, error: updateError } = await supabase
      .from('duels')
      .update({
        challenged_id: data.userId,
        status: 'ACTIVE',
        current_participants: duel.current_participants + 1,
        started_at: startedAt,
        updated_at: startedAt
      })
      .eq('id', data.duelId)
      .select(`
        *,
        challenger:profiles!challenger_id(id, username, level, xp),
        challenged:profiles!challenged_id(id, username, level, xp)
      `)
      .single()

    if (updateError || !updatedDuel) {
      console.error('Duel update error:', updateError)
      return {
        success: false,
        message: 'Errore nell\'accettare la sfida',
        error: 'UPDATE_FAILED'
      }
    }

    // Add opponent to duel participants (if table exists)
    try {
      await supabase
        .from('duel_participants')
        .insert({
          duel_id: data.duelId,
          user_id: data.userId,
          role: 'challenged',
          status: 'ready',
          joined_at: startedAt
        })
    } catch (e) {
      console.log('duel_participants table might not exist, skipping...')
    }

    // Deduct wager XP from opponent
    await supabase
      .from('profiles')
      .update({ 
        xp: opponentProfile.xp - duel.wager_xp,
        updated_at: startedAt
      })
      .eq('id', data.userId)

    // Record XP transaction (if table exists)
    try {
      await supabase
        .from('xp_transactions')
        .insert({
          user_id: data.userId,
          amount: -duel.wager_xp,
          type: 'wager',
          description: `Wager per sfida ${duel.exercise_name}`,
          duel_id: data.duelId,
          created_at: startedAt
        })
    } catch (e) {
      console.log('xp_transactions table might not exist, skipping...')
    }

    // Send notification to challenger
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: duel.challenger_id,
          type: 'challenge',
          title: 'Sfida Accettata!',
          message: `${opponentProfile.username} ha accettato la tua sfida a ${duel.exercise_name}!`,
          metadata: { duel_id: data.duelId },
          is_read: false,
          created_at: startedAt
        })
    } catch (e) {
      console.log('Failed to create notification:', e)
    }

    // Update user stats (if function exists)
    try {
      await supabase.rpc('increment_user_stat', {
        user_id: data.userId,
        stat_name: 'total_duels_joined',
        amount: 1
      })

      await supabase.rpc('increment_user_stat', {
        user_id: duel.challenger_id,
        stat_name: 'total_duels_started',
        amount: 1
      })
    } catch (e) {
      console.log('increment_user_stat function might not exist, skipping...')
    }

    return {
      success: true,
      message: 'Sfida accettata! Inizia a giocare.',
      data: {
        duel: {
          id: updatedDuel.id,
          challengerId: updatedDuel.challenger_id,
          challengerUsername: updatedDuel.challenger?.username || 'Challenger',
          opponentId: updatedDuel.challenged_id,
          opponentUsername: updatedDuel.challenged?.username || 'Opponent',
          exerciseCode: updatedDuel.exercise_code,
          exerciseName: updatedDuel.exercise_name,
          status: updatedDuel.status,
          wagerXP: updatedDuel.wager_xp,
          rewardXP: updatedDuel.reward_xp,
          duration: updatedDuel.duration,
          difficulty: updatedDuel.difficulty,
          timeLimit: `${updatedDuel.time_limit}h`,
          expiresAt: updatedDuel.expires_at,
          startedAt: updatedDuel.started_at
        },
        opponent: {
          id: opponentProfile.id,
          username: opponentProfile.username,
          level: opponentProfile.level,
          xp: opponentProfile.xp - duel.wager_xp // Updated XP after wager
        }
      }
    }

  } catch (error) {
    console.error('Unexpected error accepting duel:', error)
    return {
      success: false,
      message: 'Si è verificato un errore inaspettato',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    }
  }
}

// ====================================
// ACCEPT DUEL HANDLER
// ====================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = acceptDuelSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.errors[0]
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
      
      // Check for demo mode fallback
      const userInfo = request.cookies.get('user_info')?.value
      if (!userInfo) {
        return NextResponse.json({
          success: false,
          message: 'Devi essere autenticato per accettare una sfida',
          error: 'UNAUTHORIZED'
        }, { status: 401 })
      }

      // Demo mode
      const demoUser = JSON.parse(userInfo)
      
      // Ensure userId matches demo user
      if (data.userId !== demoUser.id) {
        return NextResponse.json({
          success: false,
          message: 'Non puoi accettare sfide per altri utenti',
          error: 'FORBIDDEN'
        }, { status: 403 })
      }

      console.log('⚔️ Accepting duel (demo mode):', data.duelId)
      const result = await handleTestMode(data)
      return NextResponse.json(result, { 
        status: result.success ? 200 : 400 
      })
    }

    // Real Supabase user
    // Ensure userId matches authenticated user
    if (data.userId !== user.id) {
      return NextResponse.json({
        success: false,
        message: 'Non puoi accettare sfide per altri utenti',
        error: 'FORBIDDEN'
      }, { status: 403 })
    }

    console.log('⚔️ Accepting duel (Supabase) for user:', user.email)
    const result = await handleSupabaseAcceptDuel(supabase, data)

    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    })

  } catch (error) {
    console.error('Accept duel error:', error)
    return NextResponse.json({
      success: false,
      message: 'Errore del server',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 })
  }
}

// ====================================
// METHOD NOT ALLOWED
// ====================================
export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'Metodo non consentito. Usa POST per accettare una sfida.',
    error: 'METHOD_NOT_ALLOWED'
  }, { status: 405 })
}