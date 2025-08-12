import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// ====================================
// TYPES & VALIDATION
// ====================================
const completeDuelSchema = z.object({
  duelId: z.string().min(1, 'Duel ID richiesto'),
  userId: z.string().min(1, 'User ID richiesto'),
  score: z.number().min(0, 'Score deve essere maggiore o uguale a 0'),
  reps: z.number().min(0, 'Reps deve essere maggiore o uguale a 0').optional(),
  duration: z.number().min(0, 'Duration deve essere maggiore o uguale a 0').optional(),
  formScore: z.number().min(0).max(100, 'Form score deve essere tra 0 e 100').optional(),
  caloriesBurned: z.number().min(0, 'Calories deve essere maggiore o uguale a 0').optional(),
  completedAt: z.string().optional(), // ISO string
  notes: z.string().max(500, 'Note troppo lunghe').optional()
})

type CompleteDuelRequest = z.infer<typeof completeDuelSchema>

interface CompleteDuelResponse {
  success: boolean
  message: string
  data?: {
    duel: {
      id: string
      status: string
      winnerId?: string
      winnerUsername?: string
      loserId?: string
      loserUsername?: string
      challengerScore: number
      opponentScore: number
      completedAt: string
      xpAwarded: {
        winner: number
        loser: number
      }
      coinsAwarded: {
        winner: number
        loser: number
      }
    }
    userResult: {
      won: boolean
      xpGained: number
      coinsGained: number
      newLevel?: number
      leveledUp: boolean
      newXP: number
      newCoins: number
    }
    achievements?: Array<{
      id: string
      name: string
      description: string
      xpBonus: number
    }>
  }
  error?: string
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
// LEVEL CALCULATION UTILITIES
// ====================================
function calculateLevel(xp: number): number {
  // Level formula: level = floor(sqrt(xp / 100))
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

function getXPForLevel(level: number): number {
  // XP needed for level: (level - 1)^2 * 100
  return Math.pow(level - 1, 2) * 100
}

function getXPForNextLevel(level: number): number {
  return Math.pow(level, 2) * 100
}

// ====================================
// ACHIEVEMENT CHECKING
// ====================================
const ACHIEVEMENTS = [
  {
    id: 'first_win',
    name: 'Prima Vittoria',
    description: 'Vinci la tua prima sfida',
    condition: (stats: any) => stats.total_wins === 1,
    xpBonus: 50
  },
  {
    id: 'win_streak_5',
    name: 'Streak di Fuoco',
    description: 'Vinci 5 sfide consecutive',
    condition: (stats: any) => stats.current_win_streak === 5,
    xpBonus: 100
  },
  {
    id: 'win_streak_10',
    name: 'Inarrestabile',
    description: 'Vinci 10 sfide consecutive',
    condition: (stats: any) => stats.current_win_streak === 10,
    xpBonus: 200
  },
  {
    id: 'total_wins_10',
    name: 'Veterano',
    description: 'Vinci 10 sfide totali',
    condition: (stats: any) => stats.total_wins === 10,
    xpBonus: 150
  },
  {
    id: 'total_wins_50',
    name: 'Campione',
    description: 'Vinci 50 sfide totali',
    condition: (stats: any) => stats.total_wins === 50,
    xpBonus: 500
  },
  {
    id: 'perfect_form',
    name: 'Forma Perfetta',
    description: 'Ottieni un form score di 95+ in una sfida',
    condition: (stats: any, performance: any) => performance.formScore >= 95,
    xpBonus: 75
  }
]

async function checkAchievements(
  supabase: any,
  userId: string,
  userStats: any,
  performance: any
): Promise<any[]> {
  const unlockedAchievements = []

  for (const achievement of ACHIEVEMENTS) {
    // Check if user already has this achievement
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', achievement.id)
      .single()

    if (existing) continue // Already unlocked

    // Check if condition is met
    if (achievement.condition(userStats, performance)) {
      // Award achievement
      await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString()
        })

      unlockedAchievements.push(achievement)

      // Award bonus XP
      await supabase
        .from('xp_transactions')
        .insert({
          user_id: userId,
          amount: achievement.xpBonus,
          type: 'achievement',
          description: `Achievement: ${achievement.name}`,
          created_at: new Date().toISOString()
        })
    }
  }

  return unlockedAchievements
}

// ====================================
// TEST MODE HANDLER
// ====================================
const testDuels: any[] = [] // Should match the array from other routes

async function handleTestMode(data: CompleteDuelRequest): Promise<CompleteDuelResponse> {
  const duel = testDuels.find(d => d.id === data.duelId)
  
  if (!duel) {
    return {
      success: false,
      message: 'Sfida non trovata',
      error: 'DUEL_NOT_FOUND'
    }
  }

  if (duel.status !== 'ACTIVE') {
    return {
      success: false,
      message: 'Questa sfida non è attiva',
      error: 'DUEL_NOT_ACTIVE'
    }
  }

  const isChallenger = duel.challenger_id === data.userId
  const isOpponent = duel.challenged_id === data.userId

  if (!isChallenger && !isOpponent) {
    return {
      success: false,
      message: 'Non fai parte di questa sfida',
      error: 'NOT_PARTICIPANT'
    }
  }

  // Update scores
  if (isChallenger) {
    duel.challenger_score = data.score
  } else {
    duel.opponent_score = data.score
  }

  const completedAt = new Date().toISOString()
  const challengerScore = duel.challenger_score || 0
  const opponentScore = duel.opponent_score || 0

  // Determine winner
  let winnerId, winnerUsername, loserId, loserUsername
  if (challengerScore > opponentScore) {
    winnerId = duel.challenger_id
    winnerUsername = duel.challenger_username
    loserId = duel.challenged_id
    loserUsername = duel.challenged_username
  } else if (opponentScore > challengerScore) {
    winnerId = duel.challenged_id
    winnerUsername = duel.challenged_username
    loserId = duel.challenger_id
    loserUsername = duel.challenger_username
  }

  // Calculate rewards
  const winnerXP = duel.reward_xp + duel.wager_xp // Reward + opponent's wager back
  const loserXP = 0
  const winnerCoins = Math.floor(duel.wager_xp * 0.5)
  const loserCoins = 0

  duel.status = 'COMPLETED'
  duel.winner_id = winnerId
  duel.completed_at = completedAt
  duel.updated_at = completedAt

  const userWon = data.userId === winnerId
  const userXP = userWon ? winnerXP : loserXP
  const userCoins = userWon ? winnerCoins : loserCoins

  return {
    success: true,
    message: userWon ? 'Congratulazioni! Hai vinto la sfida!' : 'Sfida completata. Ritenta la prossima volta!',
    data: {
      duel: {
        id: duel.id,
        status: duel.status,
        winnerId,
        winnerUsername,
        loserId,
        loserUsername,
        challengerScore,
        opponentScore,
        completedAt,
        xpAwarded: { winner: winnerXP, loser: loserXP },
        coinsAwarded: { winner: winnerCoins, loser: loserCoins }
      },
      userResult: {
        won: userWon,
        xpGained: userXP,
        coinsGained: userCoins,
        leveledUp: false,
        newXP: 500 + userXP,
        newCoins: 100 + userCoins
      }
    }
  }
}

// ====================================
// SUPABASE COMPLETE DUEL HANDLER
// ====================================
async function handleSupabaseCompleteDuel(
  supabase: any,
  data: CompleteDuelRequest
): Promise<CompleteDuelResponse> {
  try {
    // Get the duel with participant info
    const { data: duel, error: duelError } = await supabase
      .from('duels')
      .select(`
        *,
        challenger:profiles!challenger_id(id, username, level, xp, coins),
        challenged:profiles!challenged_id(id, username, level, xp, coins)
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

    if (duel.status !== 'ACTIVE') {
      return {
        success: false,
        message: 'Questa sfida non è attiva',
        error: 'DUEL_NOT_ACTIVE'
      }
    }

    const isChallenger = duel.challenger_id === data.userId
    const isOpponent = duel.challenged_id === data.userId

    if (!isChallenger && !isOpponent) {
      return {
        success: false,
        message: 'Non fai parte di questa sfida',
        error: 'NOT_PARTICIPANT'
      }
    }

    const completedAt = data.completedAt || new Date().toISOString()

    // Record performance
    await supabase
      .from('duel_performances')
      .insert({
        duel_id: data.duelId,
        user_id: data.userId,
        score: data.score,
        reps: data.reps,
        duration: data.duration,
        form_score: data.formScore,
        calories_burned: data.caloriesBurned,
        completed_at: completedAt,
        notes: data.notes
      })

    // Get current scores from performances
    const { data: performances, error: perfError } = await supabase
      .from('duel_performances')
      .select('user_id, score, form_score')
      .eq('duel_id', data.duelId)

    if (perfError) {
      console.error('Performance fetch error:', perfError)
      return {
        success: false,
        message: 'Errore nel recuperare le performance',
        error: 'PERFORMANCE_FETCH_ERROR'
      }
    }

    // Check if both users have completed
    const challengerPerf = performances.find(p => p.user_id === duel.challenger_id)
    const opponentPerf = performances.find(p => p.user_id === duel.challenged_id)

    if (!challengerPerf || !opponentPerf) {
      // Only one user has completed, mark as partial completion
      await supabase
        .from('duels')
        .update({
          updated_at: completedAt,
          [`${isChallenger ? 'challenger' : 'opponent'}_completed_at`]: completedAt
        })
        .eq('id', data.duelId)

      return {
        success: true,
        message: 'Performance registrata! In attesa dell\'avversario.',
        data: {
          duel: {
            id: duel.id,
            status: 'ACTIVE',
            challengerScore: challengerPerf?.score || 0,
            opponentScore: opponentPerf?.score || 0,
            completedAt: completedAt,
            xpAwarded: { winner: 0, loser: 0 },
            coinsAwarded: { winner: 0, loser: 0 }
          },
          userResult: {
            won: false,
            xpGained: 0,
            coinsGained: 0,
            leveledUp: false,
            newXP: isChallenger ? duel.challenger.xp : duel.challenged.xp,
            newCoins: isChallenger ? duel.challenger.coins : duel.challenged.coins
          }
        }
      }
    }

    // Both users have completed - determine winner and award prizes
    const challengerScore = challengerPerf.score
    const opponentScore = opponentPerf.score

    let winnerId, winnerUsername, winnerProfile, loserId, loserUsername, loserProfile
    if (challengerScore > opponentScore) {
      winnerId = duel.challenger_id
      winnerUsername = duel.challenger.username
      winnerProfile = duel.challenger
      loserId = duel.challenged_id
      loserUsername = duel.challenged.username
      loserProfile = duel.challenged
    } else if (opponentScore > challengerScore) {
      winnerId = duel.challenged_id
      winnerUsername = duel.challenged.username
      winnerProfile = duel.challenged
      loserId = duel.challenger_id
      loserUsername = duel.challenger.username
      loserProfile = duel.challenger
    } else {
      // Tie - both get participation rewards
      winnerId = null
      winnerUsername = null
    }

    // Calculate rewards
    const winnerXP = duel.reward_xp + duel.wager_xp // Reward + both wagers
    const loserXP = Math.floor(duel.wager_xp * 0.1) // Small consolation prize
    const tieXP = Math.floor(duel.wager_xp * 0.5) // Half wager back for ties
    const winnerCoins = Math.floor(duel.wager_xp * 0.5)
    const loserCoins = 0
    const tieCoins = Math.floor(duel.wager_xp * 0.2)

    // Update duel status
    await supabase
      .from('duels')
      .update({
        status: 'COMPLETED',
        winner_id: winnerId,
        challenger_score: challengerScore,
        opponent_score: opponentScore,
        completed_at: completedAt,
        updated_at: completedAt
      })
      .eq('id', data.duelId)

    // Award XP and coins
    const transactions = []
    
    if (winnerId) {
      // We have a winner
      const winnerNewXP = winnerProfile.xp + winnerXP
      const winnerOldLevel = calculateLevel(winnerProfile.xp)
      const winnerNewLevel = calculateLevel(winnerNewXP)
      const winnerLeveledUp = winnerNewLevel > winnerOldLevel

      const loserNewXP = loserProfile.xp + loserXP
      const loserOldLevel = calculateLevel(loserProfile.xp)
      const loserNewLevel = calculateLevel(loserNewXP)
      const loserLeveledUp = loserNewLevel > loserOldLevel

      // Update winner
      await supabase
        .from('profiles')
        .update({
          xp: winnerNewXP,
          coins: winnerProfile.coins + winnerCoins,
          level: winnerNewLevel,
          updated_at: completedAt
        })
        .eq('id', winnerId)

      // Update loser
      await supabase
        .from('profiles')
        .update({
          xp: loserNewXP,
          coins: loserProfile.coins + loserCoins,
          level: loserNewLevel,
          updated_at: completedAt
        })
        .eq('id', loserId)

      // XP transactions
      transactions.push(
        {
          user_id: winnerId,
          amount: winnerXP,
          type: 'duel_win',
          description: `Vittoria sfida ${duel.exercise_name}`,
          duel_id: data.duelId,
          created_at: completedAt
        },
        {
          user_id: loserId,
          amount: loserXP,
          type: 'duel_participation',
          description: `Partecipazione sfida ${duel.exercise_name}`,
          duel_id: data.duelId,
          created_at: completedAt
        }
      )

      // Update user stats
      await supabase.rpc('increment_user_stat', {
        user_id: winnerId,
        stat_name: 'total_wins',
        amount: 1
      })
      await supabase.rpc('increment_user_stat', {
        user_id: winnerId,
        stat_name: 'current_win_streak',
        amount: 1
      })
      await supabase.rpc('increment_user_stat', {
        user_id: loserId,
        stat_name: 'total_losses',
        amount: 1
      })
      await supabase.rpc('reset_user_stat', {
        user_id: loserId,
        stat_name: 'current_win_streak'
      })

    } else {
      // Tie - both get participation rewards
      await supabase
        .from('profiles')
        .update({
          xp: duel.challenger.xp + tieXP,
          coins: duel.challenger.coins + tieCoins,
          level: calculateLevel(duel.challenger.xp + tieXP),
          updated_at: completedAt
        })
        .eq('id', duel.challenger_id)

      await supabase
        .from('profiles')
        .update({
          xp: duel.challenged.xp + tieXP,
          coins: duel.challenged.coins + tieCoins,
          level: calculateLevel(duel.challenged.xp + tieXP),
          updated_at: completedAt
        })
        .eq('id', duel.challenged_id)

      transactions.push(
        {
          user_id: duel.challenger_id,
          amount: tieXP,
          type: 'duel_tie',
          description: `Pareggio sfida ${duel.exercise_name}`,
          duel_id: data.duelId,
          created_at: completedAt
        },
        {
          user_id: duel.challenged_id,
          amount: tieXP,
          type: 'duel_tie',
          description: `Pareggio sfida ${duel.exercise_name}`,
          duel_id: data.duelId,
          created_at: completedAt
        }
      )

      await supabase.rpc('increment_user_stat', {
        user_id: duel.challenger_id,
        stat_name: 'total_ties',
        amount: 1
      })
      await supabase.rpc('increment_user_stat', {
        user_id: duel.challenged_id,
        stat_name: 'total_ties',
        amount: 1
      })
    }

    // Insert XP transactions
    if (transactions.length > 0) {
      await supabase
        .from('xp_transactions')
        .insert(transactions)
    }

    // Check for achievements
    const { data: userStats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', data.userId)
      .single()

    const userPerformance = performances.find(p => p.user_id === data.userId)
    const achievements = await checkAchievements(supabase, data.userId, userStats, userPerformance)

    // Calculate final user result
    const userWon = data.userId === winnerId
    const userTied = !winnerId
    const userXP = userWon ? winnerXP : userTied ? tieXP : loserXP
    const userCoins = userWon ? winnerCoins : userTied ? tieCoins : loserCoins
    const userProfile = isChallenger ? duel.challenger : duel.challenged
    const newXP = userProfile.xp + userXP
    const oldLevel = calculateLevel(userProfile.xp)
    const newLevel = calculateLevel(newXP)
    const leveledUp = newLevel > oldLevel

    // Send notifications
    const winnerMessage = userTied 
      ? 'Pareggio! Entrambi avete dato il massimo.' 
      : userWon 
        ? 'Congratulazioni! Hai vinto la sfida!' 
        : 'Sfida completata. Ritenta la prossima volta!'

    return {
      success: true,
      message: winnerMessage,
      data: {
        duel: {
          id: duel.id,
          status: 'COMPLETED',
          winnerId,
          winnerUsername,
          loserId,
          loserUsername,
          challengerScore,
          opponentScore,
          completedAt,
          xpAwarded: { 
            winner: winnerId ? winnerXP : tieXP, 
            loser: winnerId ? loserXP : tieXP 
          },
          coinsAwarded: { 
            winner: winnerId ? winnerCoins : tieCoins, 
            loser: winnerId ? loserCoins : tieCoins 
          }
        },
        userResult: {
          won: userWon,
          xpGained: userXP,
          coinsGained: userCoins,
          newLevel: leveledUp ? newLevel : undefined,
          leveledUp,
          newXP,
          newCoins: userProfile.coins + userCoins
        },
        achievements: achievements.length > 0 ? achievements : undefined
      }
    }

  } catch (error) {
    console.error('Unexpected error completing duel:', error)
    return {
      success: false,
      message: 'Si è verificato un errore inaspettato',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    }
  }
}

// ====================================
// COMPLETE DUEL HANDLER
// ====================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = completeDuelSchema.safeParse(body)
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
        message: 'Devi essere autenticato per completare una sfida',
        error: 'UNAUTHORIZED'
      }, { status: 401 })
    }

    const user = JSON.parse(userInfo)
    
    // Ensure userId matches authenticated user
    if (data.userId !== user.id) {
      return NextResponse.json({
        success: false,
        message: 'Non puoi completare sfide per altri utenti',
        error: 'FORBIDDEN'
      }, { status: 403 })
    }

    const supabase = getSupabaseClient()
    
    let result: CompleteDuelResponse
    if (!supabase) {
      console.log('⚔️ Completing duel (test mode):', data.duelId)
      result = await handleTestMode(data)
    } else {
      console.log('⚔️ Completing duel (Supabase):', data.duelId)
      result = await handleSupabaseCompleteDuel(supabase, data)
    }

    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    })

  } catch (error) {
    console.error('Complete duel error:', error)
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
    message: 'Metodo non consentito. Usa POST per completare una sfida.',
    error: 'METHOD_NOT_ALLOWED'
  }, { status: 405 })
}