import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

// ====================================
// TYPES & VALIDATION
// ====================================
const createOpenDuelSchema = z.object({
  challengerId: z.string().min(1, 'Challenger ID richiesto'),
  exerciseId: z.string().min(1, 'Exercise ID richiesto'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'extreme']).default('medium'),
  wagerCoins: z.number().min(0).max(10000).default(50),
  xpReward: z.number().min(50).max(5000).default(100),
  targetReps: z.number().min(1).max(1000).optional().nullable(),
  targetTime: z.number().min(1).max(3600).optional().nullable(), // seconds
  timeLimit: z.number().min(1).max(168).default(24), // hours
})

type CreateOpenDuelRequest = z.infer<typeof createOpenDuelSchema>

// ====================================
// HELPER FUNCTIONS
// ====================================
function calculateExpiry(hoursFromNow: number): string {
  const expiry = new Date()
  expiry.setHours(expiry.getHours() + hoursFromNow)
  return expiry.toISOString()
}

function isExerciseTimeBased(code: string): boolean {
  const timeBasedExercises = ['plank', 'wall_sit', 'dead_hang', 'bridge_hold']
  return timeBasedExercises.includes(code)
}

// ====================================
// GET OPEN DUELS HANDLER
// ====================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const exerciseId = searchParams.get('exerciseId')
    const difficulty = searchParams.get('difficulty')

    console.log('🔍 GET Open Duels - User:', userId)
    console.log('📊 Query params:', { limit, offset, exerciseId, difficulty })

    const supabase = createRouteHandlerClient({ cookies })

    // Build query for open duels
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
        exercise:exercises!exercise_id(
          id,
          code,
          name,
          description,
          category,
          icon
        )
      `)
      .eq('type', 'open') // Only open type duels
      .eq('status', 'open') // Only open status
      .is('challenged_id', null) // Not yet accepted
      .gt('expires_at', new Date().toISOString()) // Not expired
      .order('created_at', { ascending: false })

    // Exclude own duels if userId provided
    if (userId) {
      query = query.neq('challenger_id', userId)
    }

    // Filter by exercise if provided
    if (exerciseId) {
      query = query.eq('exercise_id', exerciseId)
    }

    // Filter by difficulty if provided
    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: openDuels, error: duelsError } = await query

    if (duelsError) {
      console.error('❌ Error fetching open duels:', duelsError)
      return NextResponse.json({ 
        success: false,
        message: 'Errore nel recupero delle sfide aperte',
        error: duelsError.message 
      }, { status: 500 })
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('duels')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'open')
      .eq('status', 'open')
      .is('challenged_id', null)
      .gt('expires_at', new Date().toISOString())

    if (countError) {
      console.warn('⚠️ Error getting count:', countError)
    }

    console.log('✅ Found', openDuels?.length || 0, 'open duels')

    return NextResponse.json({
      success: true,
      message: `Trovate ${openDuels?.length || 0} sfide aperte`,
      data: {
        duels: openDuels || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > (offset + limit)
        }
      }
    })

  } catch (error) {
    console.error('❌ GET Open Duels Error:', error)
    return NextResponse.json({ 
      success: false,
      message: 'Errore del server',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 })
  }
}

// ====================================
// CREATE OPEN DUEL HANDLER
// ====================================
async function handleCreateOpenDuel(
  supabase: any,
  data: CreateOpenDuelRequest
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

    // Determine if exercise is time-based and set appropriate targets
    const isTimeBased = isExerciseTimeBased(exercise.code)
    
    if (isTimeBased) {
      // Set default targetTime if not provided
      if (!data.targetTime) {
        data.targetTime = data.difficulty === 'easy' ? 30 : 
                         data.difficulty === 'medium' ? 60 : 
                         data.difficulty === 'hard' ? 90 : 120
      }
      data.targetReps = null // Clear reps for time-based
    } else {
      // Set default targetReps if not provided
      if (!data.targetReps) {
        data.targetReps = data.difficulty === 'easy' ? 10 : 
                         data.difficulty === 'medium' ? 20 : 
                         data.difficulty === 'hard' ? 30 : 50
      }
      data.targetTime = null // Clear time for rep-based
    }

    // Prepare metadata
    const metadata = {
      targetReps: data.targetReps,
      targetTime: data.targetTime,
      exerciseCode: exercise.code,
      exerciseName: exercise.name,
      exerciseIcon: exercise.icon,
      isTimeBased: isTimeBased
    }

    const createdAt = new Date().toISOString()
    const expiresAt = calculateExpiry(data.timeLimit)

    // Create the open duel
    const { data: newDuel, error: createError } = await supabase
      .from('duels')
      .insert({
        type: 'open',
        status: 'open',
        challenger_id: data.challengerId,
        challenged_id: null, // Open duel - no specific opponent
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
        exercise:exercises!exercise_id(id, name, code, icon, category)
      `)
      .single()

    if (createError || !newDuel) {
      console.error('Duel creation error:', createError)
      return {
        success: false,
        message: 'Errore nella creazione della sfida aperta',
        error: createError?.message || 'CREATE_FAILED'
      }
    }

    // Add challenger to duel_participants (if table exists)
    try {
      await supabase
        .from('duel_participants')
        .insert({
          duel_id: newDuel.id,
          user_id: data.challengerId,
          score: 0,
          form_score: 0,
          completed: false,
          joined_at: createdAt
        })
    } catch (e) {
      console.log('duel_participants insert skipped')
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
          type: 'duel_win',
          description: `Wager per sfida aperta ${exercise.name}`,
          created_at: createdAt
        })
    } catch (e) {
      console.log('xp_transactions insert skipped')
    }

    return {
      success: true,
      message: 'Sfida aperta creata! In attesa di un avversario.',
      data: {
        duel: {
          id: newDuel.id,
          type: newDuel.type,
          status: newDuel.status,
          challengerId: newDuel.challenger_id,
          challengerUsername: newDuel.challenger?.username || newDuel.challenger?.display_name || 'Challenger',
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
    console.error('Unexpected error creating open duel:', error)
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
    
    console.log('Create open duel request:', body)
    
    // Validate input
    const validation = createOpenDuelSchema.safeParse(body)
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
        const result = await handleCreateOpenDuel(supabase, data)
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

    console.log('⚔️ Creating open duel for user:', user.email)
    const result = await handleCreateOpenDuel(supabase, data)

    return NextResponse.json(result, { 
      status: result.success ? 201 : 400 
    })

  } catch (error) {
    console.error('Create open duel error:', error)
    return NextResponse.json({
      success: false,
      message: 'Errore del server',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 })
  }
}

// ====================================
// DELETE OPEN DUEL (CANCEL) HANDLER
// ====================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const duelId = searchParams.get('duelId')
    const userId = searchParams.get('userId')

    if (!duelId || !userId) {
      return NextResponse.json({ 
        success: false,
        message: 'Duel ID e User ID richiesti',
        error: 'MISSING_PARAMETERS'
      }, { status: 400 })
    }

    console.log('🗑️ Cancelling open duel:', duelId, 'by user:', userId)

    const supabase = createRouteHandlerClient({ cookies })

    // Verify the duel exists and is open
    const { data: duel, error: fetchError } = await supabase
      .from('duels')
      .select(`
        *,
        challenger:profiles!challenger_id(id, username, coins)
      `)
      .eq('id', duelId)
      .single()

    if (fetchError || !duel) {
      return NextResponse.json({ 
        success: false,
        message: 'Sfida non trovata',
        error: 'DUEL_NOT_FOUND'
      }, { status: 404 })
    }

    // Verify user is the challenger
    if (duel.challenger_id !== userId) {
      return NextResponse.json({ 
        success: false,
        message: 'Puoi cancellare solo le tue sfide',
        error: 'UNAUTHORIZED'
      }, { status: 403 })
    }

    // Verify duel is still open
    if (duel.status !== 'open') {
      return NextResponse.json({ 
        success: false,
        message: 'Puoi cancellare solo sfide aperte',
        error: 'INVALID_STATUS'
      }, { status: 400 })
    }

    // Cancel the duel
    const { error: updateError } = await supabase
      .from('duels')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', duelId)

    if (updateError) {
      console.error('❌ Error cancelling duel:', updateError)
      return NextResponse.json({ 
        success: false,
        message: 'Errore nella cancellazione della sfida',
        error: updateError.message
      }, { status: 500 })
    }

    // Refund wager coins to challenger
    await supabase
      .from('profiles')
      .update({ 
        coins: duel.challenger.coins + duel.wager_coins,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    // Record refund transaction (if table exists)
    try {
      await supabase
        .from('xp_transactions')
        .insert({
          user_id: userId,
          amount: duel.wager_coins,
          type: 'duel_win',
          description: `Rimborso cancellazione sfida`,
          created_at: new Date().toISOString()
        })
    } catch (e) {
      console.log('xp_transactions refund insert skipped')
    }

    console.log('✅ Open duel cancelled successfully')

    return NextResponse.json({
      success: true,
      message: 'Sfida cancellata e coins rimborsati'
    })

  } catch (error) {
    console.error('❌ DELETE Open Duel Error:', error)
    return NextResponse.json({ 
      success: false,
      message: 'Errore del server',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 })
  }
}