import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

// ====================================
// TYPES & VALIDATION
// ====================================
const myDuelsActionSchema = z.object({
  action: z.enum(['withdraw', 'extend']),
  duelId: z.string().min(1, 'Duel ID richiesto'),
  userId: z.string().min(1, 'User ID richiesto')
})

const updateDuelSchema = z.object({
  duelId: z.string().min(1, 'Duel ID richiesto'),
  userId: z.string().min(1, 'User ID richiesto'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'extreme']).optional(),
  wagerCoins: z.number().min(0).max(10000).optional(),
  xpReward: z.number().min(50).max(5000).optional(),
  targetReps: z.number().min(1).max(1000).optional().nullable(),
  targetTime: z.number().min(1).max(3600).optional().nullable(),
  timeLimit: z.number().min(1).max(168).optional() // hours
})

type MyDuelsActionRequest = z.infer<typeof myDuelsActionSchema>
type UpdateDuelRequest = z.infer<typeof updateDuelSchema>

// ====================================
// GET MY DUELS HANDLER
// ====================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status') // 'active', 'completed', 'open', etc.
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type') || 'all' // 'created', 'joined', 'all'

    if (!userId) {
      return NextResponse.json({ 
        success: false,
        message: 'User ID richiesto',
        error: 'MISSING_USER_ID'
      }, { status: 400 })
    }

    console.log('🔍 GET My Duels - User:', userId)
    console.log('📊 Query params:', { status, limit, offset, type })

    const supabase = createRouteHandlerClient({ cookies })

    // Build base query
    let query = supabase
      .from('duels')
      .select(`
        *,
        challenger:profiles!challenger_id(
          id,
          username,
          display_name,
          level,
          xp,
          coins
        ),
        challenged:profiles!challenged_id(
          id,
          username,
          display_name,
          level,
          xp,
          coins
        ),
        exercise:exercises!exercise_id(
          id,
          code,
          name,
          description,
          category,
          icon,
          video_url
        )
      `)

    // Filter by user involvement
    if (type === 'created') {
      // Only duels created by the user
      query = query.eq('challenger_id', userId)
    } else if (type === 'joined') {
      // Only duels the user joined (was challenged)
      query = query.eq('challenged_id', userId)
    } else {
      // All duels the user is involved in (default)
      query = query.or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      if (status === 'active') {
        query = query.in('status', ['active', 'pending'])
      } else {
        query = query.eq('status', status)
      }
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: myDuels, error: duelsError } = await query

    if (duelsError) {
      console.error('❌ Error fetching my duels:', duelsError)
      return NextResponse.json({ 
        success: false,
        message: 'Errore nel recupero delle tue sfide',
        error: duelsError.message
      }, { status: 500 })
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('duels')
      .select('*', { count: 'exact', head: true })

    if (type === 'created') {
      countQuery = countQuery.eq('challenger_id', userId)
    } else if (type === 'joined') {
      countQuery = countQuery.eq('challenged_id', userId)
    } else {
      countQuery = countQuery.or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        countQuery = countQuery.in('status', ['active', 'pending'])
      } else {
        countQuery = countQuery.eq('status', status)
      }
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.warn('⚠️ Error getting count:', countError)
    }

    // Categorize duels for easier frontend handling
    const categorizedDuels = {
      active: myDuels?.filter(d => ['active', 'pending'].includes(d.status)) || [],
      completed: myDuels?.filter(d => d.status === 'completed') || [],
      open: myDuels?.filter(d => d.status === 'open' && d.challenger_id === userId) || [],
      expired: myDuels?.filter(d => d.status === 'expired') || [],
      cancelled: myDuels?.filter(d => d.status === 'cancelled') || []
    }

    // Calculate user statistics
    const completedDuels = categorizedDuels.completed
    const wonDuels = completedDuels.filter(d => d.winner_id === userId)
    const lostDuels = completedDuels.filter(d => d.winner_id && d.winner_id !== userId)
    const drawDuels = completedDuels.filter(d => !d.winner_id && d.status === 'completed')

    console.log('✅ Found duels:', {
      total: myDuels?.length || 0,
      active: categorizedDuels.active.length,
      completed: categorizedDuels.completed.length,
      open: categorizedDuels.open.length
    })

    return NextResponse.json({
      success: true,
      message: `Trovate ${myDuels?.length || 0} tue sfide`,
      data: {
        duels: myDuels || [],
        categorized: categorizedDuels,
        stats: {
          total_duels: count || 0,
          active_duels: categorizedDuels.active.length,
          completed_duels: categorizedDuels.completed.length,
          open_duels: categorizedDuels.open.length,
          won_duels: wonDuels.length,
          lost_duels: lostDuels.length,
          draw_duels: drawDuels.length,
          win_rate: completedDuels.length > 0 ? Math.round((wonDuels.length / completedDuels.length) * 100) : 0
        },
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > (offset + limit)
        }
      }
    })

  } catch (error) {
    console.error('❌ GET My Duels Error:', error)
    return NextResponse.json({ 
      success: false,
      message: 'Errore del server',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 })
  }
}

// ====================================
// MY DUELS ACTIONS HANDLER
// ====================================
async function handleMyDuelsAction(
  supabase: any,
  data: MyDuelsActionRequest
): Promise<any> {
  try {
    // Verify the duel exists and user has permission
    const { data: duel, error: fetchError } = await supabase
      .from('duels')
      .select(`
        *,
        challenger:profiles!challenger_id(id, username, coins)
      `)
      .eq('id', data.duelId)
      .single()

    if (fetchError || !duel) {
      return {
        success: false,
        message: 'Sfida non trovata',
        error: 'DUEL_NOT_FOUND'
      }
    }

    // Check if user is involved in this duel
    if (duel.challenger_id !== data.userId && duel.challenged_id !== data.userId) {
      return {
        success: false,
        message: 'Non fai parte di questa sfida',
        error: 'NOT_PARTICIPANT'
      }
    }

    const now = new Date().toISOString()

    switch (data.action) {
      case 'withdraw':
        // Only challenger can withdraw open duels
        if (duel.challenger_id !== data.userId) {
          return {
            success: false,
            message: 'Solo il challenger può ritirare una sfida',
            error: 'UNAUTHORIZED'
          }
        }

        if (duel.status !== 'open' && duel.status !== 'pending') {
          return {
            success: false,
            message: 'Puoi ritirare solo sfide aperte o in attesa',
            error: 'INVALID_STATUS'
          }
        }

        // Update duel status to cancelled
        const { error: withdrawError } = await supabase
          .from('duels')
          .update({
            status: 'cancelled',
            updated_at: now
          })
          .eq('id', data.duelId)

        if (withdrawError) {
          throw withdrawError
        }

        // Refund wager coins to challenger
        await supabase
          .from('profiles')
          .update({
            coins: duel.challenger.coins + duel.wager_coins,
            updated_at: now
          })
          .eq('id', data.userId)

        // Record refund transaction (if table exists)
        try {
          await supabase
            .from('xp_transactions')
            .insert({
              user_id: data.userId,
              amount: duel.wager_coins,
              type: 'duel_win',
              description: 'Rimborso ritiro sfida',
              created_at: now
            })
        } catch (e) {
          console.log('xp_transactions refund insert skipped')
        }

        return {
          success: true,
          message: 'Sfida ritirata e coins rimborsati'
        }

      case 'extend':
        // Only challenger can extend expiring duels
        if (duel.challenger_id !== data.userId) {
          return {
            success: false,
            message: 'Solo il challenger può estendere una sfida',
            error: 'UNAUTHORIZED'
          }
        }

        if (duel.status !== 'open') {
          return {
            success: false,
            message: 'Puoi estendere solo sfide aperte',
            error: 'INVALID_STATUS'
          }
        }

        // Extend by 24 hours
        const currentExpiry = new Date(duel.expires_at)
        currentExpiry.setHours(currentExpiry.getHours() + 24)

        const { error: extendError } = await supabase
          .from('duels')
          .update({
            expires_at: currentExpiry.toISOString(),
            updated_at: now
          })
          .eq('id', data.duelId)

        if (extendError) {
          throw extendError
        }

        return {
          success: true,
          message: 'Sfida estesa di 24 ore',
          data: {
            newExpiresAt: currentExpiry.toISOString()
          }
        }

      default:
        return {
          success: false,
          message: `Azione sconosciuta: ${data.action}`,
          error: 'UNKNOWN_ACTION'
        }
    }

  } catch (error) {
    console.error('Unexpected error in duel action:', error)
    return {
      success: false,
      message: 'Si è verificato un errore inaspettato',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = myDuelsActionSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return NextResponse.json({
        success: false,
        message: firstError.message,
        error: 'VALIDATION_ERROR'
      }, { status: 400 })
    }

    const data = validation.data

    console.log('🎮 My Duels Action:', data.action, 'on duel:', data.duelId, 'by user:', data.userId)

    // Get Supabase client with proper auth
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        message: 'Devi essere autenticato per questa azione',
        error: 'UNAUTHORIZED'
      }, { status: 401 })
    }

    // Ensure userId matches authenticated user
    if (data.userId !== user.id) {
      return NextResponse.json({
        success: false,
        message: 'Non puoi eseguire azioni per altri utenti',
        error: 'FORBIDDEN'
      }, { status: 403 })
    }

    const result = await handleMyDuelsAction(supabase, data)

    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    })

  } catch (error) {
    console.error('❌ POST My Duels Error:', error)
    return NextResponse.json({ 
      success: false,
      message: 'Errore del server',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 })
  }
}

// ====================================
// UPDATE DUEL SETTINGS HANDLER
// ====================================
async function handleUpdateDuel(
  supabase: any,
  data: UpdateDuelRequest
): Promise<any> {
  try {
    // Verify the duel exists and is editable
    const { data: duel, error: fetchError } = await supabase
      .from('duels')
      .select(`
        *,
        challenger:profiles!challenger_id(id, username),
        exercise:exercises!exercise_id(code)
      `)
      .eq('id', data.duelId)
      .single()

    if (fetchError || !duel) {
      return {
        success: false,
        message: 'Sfida non trovata',
        error: 'DUEL_NOT_FOUND'
      }
    }

    // Only challenger can edit
    if (duel.challenger_id !== data.userId) {
      return {
        success: false,
        message: 'Solo il challenger può modificare una sfida',
        error: 'UNAUTHORIZED'
      }
    }

    // Can only edit open duels
    if (duel.status !== 'open' && duel.status !== 'pending') {
      return {
        success: false,
        message: 'Puoi modificare solo sfide aperte o in attesa',
        error: 'INVALID_STATUS'
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (data.difficulty) updateData.difficulty = data.difficulty
    if (data.wagerCoins !== undefined) {
      updateData.wager_coins = data.wagerCoins
      updateData.xp_reward = data.xpReward || Math.floor(data.wagerCoins * 2)
    }
    if (data.xpReward !== undefined) updateData.xp_reward = data.xpReward
    if (data.targetReps !== undefined) updateData.target_reps = data.targetReps
    if (data.targetTime !== undefined) updateData.target_time = data.targetTime
    if (data.timeLimit) {
      const newExpiry = new Date()
      newExpiry.setHours(newExpiry.getHours() + data.timeLimit)
      updateData.expires_at = newExpiry.toISOString()
    }

    // Update metadata if targets changed
    if (data.targetReps !== undefined || data.targetTime !== undefined) {
      const currentMetadata = duel.metadata || {}
      updateData.metadata = {
        ...currentMetadata,
        targetReps: data.targetReps !== undefined ? data.targetReps : currentMetadata.targetReps,
        targetTime: data.targetTime !== undefined ? data.targetTime : currentMetadata.targetTime,
      }
    }

    // Update the duel
    const { data: updatedDuel, error: updateError } = await supabase
      .from('duels')
      .update(updateData)
      .eq('id', data.duelId)
      .select(`
        *,
        challenger:profiles!challenger_id(id, username, display_name),
        exercise:exercises!exercise_id(id, code, name, icon)
      `)
      .single()

    if (updateError) {
      console.error('❌ Error updating duel:', updateError)
      return {
        success: false,
        message: 'Errore nell\'aggiornamento della sfida',
        error: updateError.message
      }
    }

    console.log('✅ Duel updated successfully')

    return {
      success: true,
      message: 'Sfida aggiornata con successo',
      data: {
        duel: {
          id: updatedDuel.id,
          type: updatedDuel.type,
          status: updatedDuel.status,
          challengerId: updatedDuel.challenger_id,
          challengerUsername: updatedDuel.challenger?.username || updatedDuel.challenger?.display_name,
          exerciseId: updatedDuel.exercise_id,
          exerciseName: updatedDuel.exercise?.name,
          exerciseCode: updatedDuel.exercise?.code,
          exerciseIcon: updatedDuel.exercise?.icon,
          difficulty: updatedDuel.difficulty,
          wagerCoins: updatedDuel.wager_coins,
          xpReward: updatedDuel.xp_reward,
          expiresAt: updatedDuel.expires_at,
          updatedAt: updatedDuel.updated_at,
          metadata: updatedDuel.metadata
        }
      }
    }

  } catch (error) {
    console.error('Unexpected error updating duel:', error)
    return {
      success: false,
      message: 'Si è verificato un errore inaspettato',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    }
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = updateDuelSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return NextResponse.json({
        success: false,
        message: firstError.message,
        error: 'VALIDATION_ERROR'
      }, { status: 400 })
    }

    const data = validation.data

    console.log('✏️ Updating duel:', data.duelId, 'by user:', data.userId)

    // Get Supabase client with proper auth
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        message: 'Devi essere autenticato per modificare una sfida',
        error: 'UNAUTHORIZED'
      }, { status: 401 })
    }

    // Ensure userId matches authenticated user
    if (data.userId !== user.id) {
      return NextResponse.json({
        success: false,
        message: 'Non puoi modificare sfide per altri utenti',
        error: 'FORBIDDEN'
      }, { status: 403 })
    }

    const result = await handleUpdateDuel(supabase, data)

    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    })

  } catch (error) {
    console.error('❌ PUT My Duels Error:', error)
    return NextResponse.json({ 
      success: false,
      message: 'Errore del server',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 })
  }
}