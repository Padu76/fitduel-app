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
// LEVEL CALCULATION UTILITIES
// ====================================
function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

// ====================================
// ACHIEVEMENT CHECKING
// ====================================
const ACHIEVEMENTS = [
  {
    id: 'first_win',
    title: 'Prima Vittoria',
    description: 'Vinci la tua prima sfida',
    icon: '🏆',
    rarity: 'common' as const,
    condition: (stats: any) => stats.total_wins === 1,
    xpBonus: 50
  },
  {
    id: 'win_streak_5',
    title: 'Streak di Fuoco',
    description: 'Vinci 5 sfide consecutive',
    icon: '🔥',
    rarity: 'rare' as const,
    condition: (stats: any) => stats.current_win_streak === 5,
    xpBonus: 100
  },
  {
    id: 'win_streak_10',
    title: 'Inarrestabile',
    description: 'Vinci 10 sfide consecutive',
    icon: '⚡',
    rarity: 'epic' as const,
    condition: (stats: any) => stats.current_win_streak === 10,
    xpBonus: 200
  },
  {
    id: 'total_wins_10',
    title: 'Veterano',
    description: 'Vinci 10 sfide totali',
    icon: '🎖️',
    rarity: 'rare' as const,
    condition: (stats: any) => stats.total_wins === 10,
    xpBonus: 150
  },
  {
    id: 'total_wins_50',
    title: 'Campione',
    description: 'Vinci 50 sfide totali',
    icon: '👑',
    rarity: 'legendary' as const,
    condition: (stats: any) => stats.total_wins === 50,
    xpBonus: 500
  },
  {
    id: 'perfect_form',
    title: 'Forma Perfetta',
    description: 'Ottieni un form score di 95+ in una sfida',
    icon: '💯',
    rarity: 'epic' as const,
    condition: (stats: any, performance: any) => performance.form_score >= 95,
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

    if (existing) continue

    // Check if condition is met
    if (achievement.condition(userStats, performance)) {
      // Award achievement
      await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          rarity: achievement.rarity,
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
          description: `Achievement: ${achievement.title}`,
          created_at: new Date().toISOString()
        })
    }
  }

  return unlockedAchievements
}

// ====================================
// SUPABASE COMPLETE DUEL HANDLER
// ====================================
async function handleSupabaseCompleteDuel(
  supabase: any,
  data: CompleteDuelRequest
): Promise<any> {
  try {
    // Get the duel with participant info - USING CORRECT COLUMN NAMES
    const { data: duel, error: duelError } = await supabase
      .from('duels')
      .select(`
        *,
        challenger:profiles!challenger_id(id, username, level, xp, coins),
        challenged:profiles!challenged_id(id, username, level, xp, coins),
        exercise:exercises!exercise_id(id, name, code, icon)
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

    if (duel.status !== 'active') {
      return {
        success: false,
        message: 'Questa sfida non è attiva',
        error: 'DUEL_NOT_ACTIVE'
      }
    }

    const isChallenger = duel.challenger_id === data.userId
    const isChallenged = duel.challenged_id === data.userId // CORRECT: challenged_id

    if (!isChallenger && !isChallenged) {
      return {
        success: false,
        message: 'Non fai parte di questa sfida',
        error: 'NOT_PARTICIPANT'
      }
    }

    const completedAt = data.completedAt || new Date().toISOString()

    // Check if table exists before inserting
    try {
      // First check if the performances table exists
      const { data: tables } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'performances')
        .single()

      if (tables) {
        // Table exists, insert performance
        await supabase
          .from('performances')
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
      }
    } catch (e) {
      console.log('performances table might not exist, using duel_participants instead')
      
      // Update participant score
      await supabase
        .from('duel_participants')
        .update({
          score: data.score,
          form_score: data.formScore,
          completed: true,
          completed_at: completedAt
        })
        .eq('duel_id', data.duelId)
        .eq('user_id', data.userId)
    }

    // Get participants to check if both completed
    const { data: participants } = await supabase
      .from('duel_participants')
      .select('*')
      .eq('duel_id', data.duelId)

    const allCompleted = participants?.length === 2 && 
                        participants.every((p: any) => p.completed)

    if (!allCompleted) {
      // Only one user has completed
      const scoreField = isChallenger ? 'challenger_score' : 'challenged_score'
      await supabase
        .from('duels')
        .update({
          [scoreField]: data.score,
          updated_at: completedAt
        })
        .eq('id', data.duelId)

      return {
        success: true,
        message: 'Performance registrata! In attesa dell\'avversario.',
        data: {
          duel: {
            id: duel.id,
            status: 'active',
            challengerScore: isChallenger ? data.score : duel.challenger_score || 0,
            challengedScore: isChallenged ? data.score : duel.challenged_score || 0,
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

    // Both users have completed - determine winner
    const challengerScore = isChallenger ? data.score : (duel.challenger_score || 0)
    const challengedScore = isChallenged ? data.score : (duel.challenged_score || 0)

    let winnerId, winnerUsername, winnerProfile, loserId, loserUsername, loserProfile
    if (challengerScore > challengedScore) {
      winnerId = duel.challenger_id
      winnerUsername = duel.challenger.username
      winnerProfile = duel.challenger
      loserId = duel.challenged_id
      loserUsername = duel.challenged.username
      loserProfile = duel.challenged
    } else if (challengedScore > challengerScore) {
      winnerId = duel.challenged_id
      winnerUsername = duel.challenged.username
      winnerProfile = duel.challenged
      loserId = duel.challenger_id
      loserUsername = duel.challenger.username
      loserProfile = duel.challenger
    } else {
      // Tie
      winnerId = null
      winnerUsername = null
    }

    // Calculate rewards
    const winnerXP = duel.xp_reward + 50 // Base reward + bonus
    const loserXP = Math.floor(duel.xp_reward * 0.2) // 20% consolation
    const tieXP = Math.floor(duel.xp_reward * 0.5) // 50% for ties
    const winnerCoins = duel.wager_coins * 2 // Get both wagers
    const loserCoins = 0
    const tieCoins = duel.wager_coins // Get wager back

    // Update duel status
    await supabase
      .from('duels')
      .update({
        status: 'completed',
        winner_id: winnerId,
        challenger_score: challengerScore,
        challenged_score: challengedScore, // CORRECT: challenged_score
        completed_at: completedAt,
        updated_at: completedAt
      })
      .eq('id', data.duelId)

    // Award XP and coins
    if (winnerId) {
      // Update winner
      const winnerNewXP = winnerProfile.xp + winnerXP
      const winnerNewLevel = calculateLevel(winnerNewXP)
      const winnerLeveledUp = winnerNewLevel > winnerProfile.level

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
      const loserNewXP = loserProfile.xp + loserXP
      const loserNewLevel = calculateLevel(loserNewXP)

      await supabase
        .from('profiles')
        .update({
          xp: loserNewXP,
          coins: loserProfile.coins + loserCoins,
          level: loserNewLevel,
          updated_at: completedAt
        })
        .eq('id', loserId)

      // Update user stats
      const { data: winnerStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', winnerId)
        .single()

      if (winnerStats) {
        await supabase
          .from('user_stats')
          .update({
            total_wins: (winnerStats.total_wins || 0) + 1,
            current_win_streak: (winnerStats.current_win_streak || 0) + 1,
            max_win_streak: Math.max(
              winnerStats.max_win_streak || 0,
              (winnerStats.current_win_streak || 0) + 1
            ),
            total_duels_completed: (winnerStats.total_duels_completed || 0) + 1,
            updated_at: completedAt
          })
          .eq('user_id', winnerId)
      }

      const { data: loserStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', loserId)
        .single()

      if (loserStats) {
        await supabase
          .from('user_stats')
          .update({
            total_losses: (loserStats.total_losses || 0) + 1,
            current_win_streak: 0,
            total_duels_completed: (loserStats.total_duels_completed || 0) + 1,
            updated_at: completedAt
          })
          .eq('user_id', loserId)
      }
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
    }

    // Check for achievements
    const { data: userStats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', data.userId)
      .single()

    const achievements = await checkAchievements(
      supabase, 
      data.userId, 
      userStats || {}, 
      { form_score: data.formScore }
    )

    // Calculate final user result
    const userWon = data.userId === winnerId
    const userTied = !winnerId
    const userXP = userWon ? winnerXP : userTied ? tieXP : loserXP
    const userCoins = userWon ? winnerCoins : userTied ? tieCoins : loserCoins
    const userProfile = isChallenger ? duel.challenger : duel.challenged
    const newXP = userProfile.xp + userXP
    const newLevel = calculateLevel(newXP)
    const leveledUp = newLevel > userProfile.level

    return {
      success: true,
      message: userTied 
        ? 'Pareggio! Entrambi avete dato il massimo.' 
        : userWon 
          ? 'Congratulazioni! Hai vinto la sfida!' 
          : 'Sfida completata. Ritenta la prossima volta!',
      data: {
        duel: {
          id: duel.id,
          status: 'completed',
          winnerId,
          winnerUsername,
          loserId,
          loserUsername,
          challengerScore,
          challengedScore, // CORRECT: not opponentScore
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
    const supabase = getSupabaseClient()
    
    if (!supabase) {
      return NextResponse.json({
        success: false,
        message: 'Database non configurato',
        error: 'NO_DATABASE'
      }, { status: 500 })
    }

    const result = await handleSupabaseCompleteDuel(supabase, data)

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