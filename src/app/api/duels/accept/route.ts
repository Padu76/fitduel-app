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

// ====================================
// SUPABASE ACCEPT DUEL HANDLER
// ====================================
async function handleSupabaseAcceptDuel(
  supabase: any,
  data: AcceptDuelRequest
): Promise<any> {
  try {
    // Get the duel with challenger info - USING CORRECT COLUMN NAMES
    const { data: duel, error: duelError } = await supabase
      .from('duels')
      .select(`
        *,
        challenger:profiles!challenger_id(id, username, level, xp, coins),
        challenged:profiles!challenged_id(id, username, level, xp, coins),
        exercise:exercises!exercise_id(id, name, code, icon, category)
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
    if (duel.status !== 'pending' && duel.status !== 'open') {
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
        .update({ 
          status: 'expired', // Using correct enum value
          updated_at: new Date().toISOString() 
        })
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

    // Get opponent profile (person accepting the duel)
    const { data: opponentProfile, error: opponentError } = await supabase
      .from('profiles')
      .select('id, username, level, xp, coins')
      .eq('id', data.userId)
      .single()

    if (opponentError || !opponentProfile) {
      return {
        success: false,
        message: 'Profilo utente non trovato',
        error: 'USER_NOT_FOUND'
      }
    }

    // Check if opponent has enough coins for wager
    if (opponentProfile.coins < duel.wager_coins) {
      return {
        success: false,
        message: `Coins insufficienti. Hai ${opponentProfile.coins} coins ma ne servono ${duel.wager_coins}`,
        error: 'INSUFFICIENT_COINS'
      }
    }

    // Update duel to ACTIVE status - USING CORRECT COLUMN NAME
    const startedAt = new Date().toISOString()
    const { data: updatedDuel, error: updateError } = await supabase
      .from('duels')
      .update({
        challenged_id: data.userId, // CORRECT: challenged_id, not opponent_id
        status: 'active', // Using correct enum value
        started_at: startedAt,
        updated_at: startedAt
      })
      .eq('id', data.duelId)
      .select(`
        *,
        challenger:profiles!challenger_id(id, username, level, xp),
        challenged:profiles!challenged_id(id, username, level, xp),
        exercise:exercises!exercise_id(id, name, code, icon)
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

    // Add opponent to duel participants
    await supabase
      .from('duel_participants')
      .insert({
        duel_id: data.duelId,
        user_id: data.userId,
        joined_at: startedAt
      })

    // Deduct wager coins from opponent
    await supabase
      .from('profiles')
      .update({ 
        coins: opponentProfile.coins - duel.wager_coins,
        updated_at: startedAt
      })
      .eq('id', data.userId)

    // Record transaction
    try {
      await supabase
        .from('xp_transactions')
        .insert({
          user_id: data.userId,
          amount: -duel.wager_coins,
          type: 'duel_win', // Using valid enum
          description: `Wager per sfida ${updatedDuel.exercise?.name}`,
          created_at: startedAt
        })
    } catch (e) {
      console.log('xp_transactions insert skipped')
    }

    // Send notification to challenger
    await supabase
      .from('notifications')
      .insert({
        user_id: duel.challenger_id,
        type: 'challenge', // Using valid notification_type enum
        title: 'Sfida Accettata!',
        message: `${opponentProfile.username} ha accettato la tua sfida a ${updatedDuel.exercise?.name}!`,
        metadata: { duel_id: data.duelId },
        is_read: false,
        created_at: startedAt
      })

    // Update user stats
    const { data: challengedStats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', data.userId)
      .single()

    if (!challengedStats) {
      // Create user_stats if doesn't exist
      await supabase
        .from('user_stats')
        .insert({
          user_id: data.userId,
          total_duels_completed: 0
        })
    }

    return {
      success: true,
      message: 'Sfida accettata! Inizia a giocare.',
      data: {
        duel: {
          id: updatedDuel.id,
          challengerId: updatedDuel.challenger_id,
          challengerUsername: updatedDuel.challenger?.username || 'Challenger',
          challengedId: updatedDuel.challenged_id, // CORRECT: challenged_id
          challengedUsername: updatedDuel.challenged?.username || 'Opponent',
          exerciseId: updatedDuel.exercise_id,
          exerciseName: updatedDuel.exercise?.name,
          exerciseIcon: updatedDuel.exercise?.icon,
          status: updatedDuel.status,
          wagerCoins: updatedDuel.wager_coins,
          xpReward: updatedDuel.xp_reward,
          difficulty: updatedDuel.difficulty,
          expiresAt: updatedDuel.expires_at,
          startedAt: updatedDuel.started_at
        },
        opponent: {
          id: opponentProfile.id,
          username: opponentProfile.username,
          level: opponentProfile.level,
          xp: opponentProfile.xp,
          coins: opponentProfile.coins - duel.wager_coins // Updated coins after wager
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
      
      return NextResponse.json({
        success: false,
        message: 'Devi essere autenticato per accettare una sfida',
        error: 'UNAUTHORIZED'
      }, { status: 401 })
    }

    // Ensure userId matches authenticated user
    if (data.userId !== user.id) {
      return NextResponse.json({
        success: false,
        message: 'Non puoi accettare sfide per altri utenti',
        error: 'FORBIDDEN'
      }, { status: 403 })
    }

    console.log('⚔️ Accepting duel for user:', user.email)
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