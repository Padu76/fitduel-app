import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// ====================================
// TYPES & VALIDATION
// ====================================
const achievementQuerySchema = z.object({
  userId: z.string().optional(),
  category: z.enum(['wins', 'streak', 'form', 'participation', 'special', 'all']).default('all'),
  unlocked: z.boolean().optional(), // Filter by unlocked status
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0)
})

const checkAchievementSchema = z.object({
  userId: z.string().min(1, 'User ID richiesto'),
  triggerType: z.enum(['duel_win', 'duel_loss', 'streak_update', 'form_score', 'level_up', 'manual']),
  triggerData: z.object({
    formScore: z.number().optional(),
    newStreak: z.number().optional(),
    newLevel: z.number().optional(),
    totalWins: z.number().optional(),
    totalDuels: z.number().optional()
  }).optional()
})

type AchievementQuery = z.infer<typeof achievementQuerySchema>
type CheckAchievementRequest = z.infer<typeof checkAchievementSchema>

interface Achievement {
  id: string
  name: string
  description: string
  category: 'wins' | 'streak' | 'form' | 'participation' | 'special'
  icon: string
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary'
  xpReward: number
  coinsReward: number
  requirement: {
    type: string
    value: number
    condition?: string
  }
  isUnlocked?: boolean
  unlockedAt?: string
  progress?: {
    current: number
    target: number
    percentage: number
  }
}

interface AchievementResponse {
  success: boolean
  message: string
  data?: {
    achievements: Achievement[]
    unlockedCount: number
    totalCount: number
    categories: {
      [key: string]: {
        unlocked: number
        total: number
      }
    }
    recentUnlocks?: Achievement[]
    nextToUnlock?: Achievement[]
  }
  error?: string
}

interface CheckAchievementResponse {
  success: boolean
  message: string
  data?: {
    newAchievements: Achievement[]
    totalXPAwarded: number
    totalCoinsAwarded: number
  }
  error?: string
}

// ====================================
// ACHIEVEMENT DEFINITIONS
// ====================================
const ACHIEVEMENTS: Achievement[] = [
  // WINS CATEGORY
  {
    id: 'first_win',
    name: 'Prima Vittoria',
    description: 'Vinci la tua prima sfida',
    category: 'wins',
    icon: '🏆',
    difficulty: 'bronze',
    xpReward: 50,
    coinsReward: 10,
    requirement: { type: 'total_wins', value: 1 }
  },
  {
    id: 'rookie_fighter',
    name: 'Combattente Rookie',
    description: 'Vinci 5 sfide',
    category: 'wins',
    icon: '🥊',
    difficulty: 'bronze',
    xpReward: 100,
    coinsReward: 20,
    requirement: { type: 'total_wins', value: 5 }
  },
  {
    id: 'experienced_fighter',
    name: 'Combattente Esperto',
    description: 'Vinci 25 sfide',
    category: 'wins',
    icon: '⚔️',
    difficulty: 'silver',
    xpReward: 250,
    coinsReward: 50,
    requirement: { type: 'total_wins', value: 25 }
  },
  {
    id: 'veteran_champion',
    name: 'Campione Veterano',
    description: 'Vinci 100 sfide',
    category: 'wins',
    icon: '👑',
    difficulty: 'gold',
    xpReward: 500,
    coinsReward: 100,
    requirement: { type: 'total_wins', value: 100 }
  },
  {
    id: 'legendary_master',
    name: 'Maestro Leggendario',
    description: 'Vinci 500 sfide',
    category: 'wins',
    icon: '🌟',
    difficulty: 'legendary',
    xpReward: 1500,
    coinsReward: 300,
    requirement: { type: 'total_wins', value: 500 }
  },

  // STREAK CATEGORY
  {
    id: 'hot_streak',
    name: 'Streak di Fuoco',
    description: 'Vinci 5 sfide consecutive',
    category: 'streak',
    icon: '🔥',
    difficulty: 'silver',
    xpReward: 150,
    coinsReward: 30,
    requirement: { type: 'win_streak', value: 5 }
  },
  {
    id: 'unstoppable',
    name: 'Inarrestabile',
    description: 'Vinci 10 sfide consecutive',
    category: 'streak',
    icon: '⚡',
    difficulty: 'gold',
    xpReward: 300,
    coinsReward: 75,
    requirement: { type: 'win_streak', value: 10 }
  },
  {
    id: 'dominator',
    name: 'Dominatore',
    description: 'Vinci 20 sfide consecutive',
    category: 'streak',
    icon: '💫',
    difficulty: 'platinum',
    xpReward: 750,
    coinsReward: 150,
    requirement: { type: 'win_streak', value: 20 }
  },

  // FORM CATEGORY
  {
    id: 'perfect_form',
    name: 'Forma Perfetta',
    description: 'Ottieni un form score di 95+ in una sfida',
    category: 'form',
    icon: '✨',
    difficulty: 'silver',
    xpReward: 100,
    coinsReward: 25,
    requirement: { type: 'form_score', value: 95 }
  },
  {
    id: 'flawless_execution',
    name: 'Esecuzione Impeccabile',
    description: 'Ottieni un form score di 98+ in una sfida',
    category: 'form',
    icon: '💎',
    difficulty: 'gold',
    xpReward: 200,
    coinsReward: 50,
    requirement: { type: 'form_score', value: 98 }
  },

  // PARTICIPATION CATEGORY
  {
    id: 'social_warrior',
    name: 'Guerriero Sociale',
    description: 'Partecipa a 10 sfide',
    category: 'participation',
    icon: '🤝',
    difficulty: 'bronze',
    xpReward: 75,
    coinsReward: 15,
    requirement: { type: 'total_duels', value: 10 }
  },
  {
    id: 'arena_veteran',
    name: 'Veterano dell\'Arena',
    description: 'Partecipa a 50 sfide',
    category: 'participation',
    icon: '🏟️',
    difficulty: 'silver',
    xpReward: 200,
    coinsReward: 40,
    requirement: { type: 'total_duels', value: 50 }
  },
  {
    id: 'gladiator',
    name: 'Gladiatore',
    description: 'Partecipa a 200 sfide',
    category: 'participation',
    icon: '🗡️',
    difficulty: 'gold',
    xpReward: 400,
    coinsReward: 80,
    requirement: { type: 'total_duels', value: 200 }
  },

  // SPECIAL CATEGORY
  {
    id: 'early_bird',
    name: 'Mattiniero',
    description: 'Completa una sfida prima delle 8:00',
    category: 'special',
    icon: '🌅',
    difficulty: 'bronze',
    xpReward: 50,
    coinsReward: 10,
    requirement: { type: 'special', value: 1, condition: 'early_morning' }
  },
  {
    id: 'night_owl',
    name: 'Gufo Notturno',
    description: 'Completa una sfida dopo le 22:00',
    category: 'special',
    icon: '🦉',
    difficulty: 'bronze',
    xpReward: 50,
    coinsReward: 10,
    requirement: { type: 'special', value: 1, condition: 'late_night' }
  },
  {
    id: 'weekend_warrior',
    name: 'Guerriero del Weekend',
    description: 'Vinci 10 sfide nel weekend',
    category: 'special',
    icon: '🎉',
    difficulty: 'silver',
    xpReward: 150,
    coinsReward: 30,
    requirement: { type: 'special', value: 10, condition: 'weekend_wins' }
  }
]

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
const mockUserAchievements = new Set(['first_win', 'rookie_fighter', 'perfect_form', 'social_warrior'])

async function handleTestModeGet(query: AchievementQuery): Promise<AchievementResponse> {
  let achievements = [...ACHIEVEMENTS]

  // Filter by category
  if (query.category !== 'all') {
    achievements = achievements.filter(a => a.category === query.category)
  }

  // Filter by unlocked status
  if (query.unlocked !== undefined) {
    achievements = achievements.filter(a => {
      const isUnlocked = mockUserAchievements.has(a.id)
      return query.unlocked ? isUnlocked : !isUnlocked
    })
  }

  // Add unlock status and progress
  achievements = achievements.map(achievement => ({
    ...achievement,
    isUnlocked: mockUserAchievements.has(achievement.id),
    unlockedAt: mockUserAchievements.has(achievement.id) ? '2025-08-10T15:30:00Z' : undefined,
    progress: mockUserAchievements.has(achievement.id) ? undefined : {
      current: Math.floor(achievement.requirement.value * 0.7),
      target: achievement.requirement.value,
      percentage: 70
    }
  }))

  // Apply pagination
  const totalCount = achievements.length
  const paginatedAchievements = achievements.slice(query.offset, query.offset + query.limit)

  // Calculate categories
  const categories: any = {}
  for (const category of ['wins', 'streak', 'form', 'participation', 'special']) {
    const categoryAchievements = ACHIEVEMENTS.filter(a => a.category === category)
    const unlockedInCategory = categoryAchievements.filter(a => mockUserAchievements.has(a.id))
    categories[category] = {
      unlocked: unlockedInCategory.length,
      total: categoryAchievements.length
    }
  }

  return {
    success: true,
    message: 'Achievement caricati con successo',
    data: {
      achievements: paginatedAchievements,
      unlockedCount: mockUserAchievements.size,
      totalCount: ACHIEVEMENTS.length,
      categories,
      recentUnlocks: achievements.filter(a => a.isUnlocked).slice(0, 3),
      nextToUnlock: achievements.filter(a => !a.isUnlocked).slice(0, 3)
    }
  }
}

async function handleTestModeCheck(data: CheckAchievementRequest): Promise<CheckAchievementResponse> {
  const newAchievements: Achievement[] = []
  let totalXP = 0
  let totalCoins = 0

  // Simulate checking achievements based on trigger
  if (data.triggerType === 'duel_win' && data.triggerData?.totalWins === 5) {
    const achievement = ACHIEVEMENTS.find(a => a.id === 'rookie_fighter')!
    if (!mockUserAchievements.has(achievement.id)) {
      mockUserAchievements.add(achievement.id)
      newAchievements.push({
        ...achievement,
        isUnlocked: true,
        unlockedAt: new Date().toISOString()
      })
      totalXP += achievement.xpReward
      totalCoins += achievement.coinsReward
    }
  }

  return {
    success: true,
    message: newAchievements.length > 0 ? 'Nuovi achievement sbloccati!' : 'Nessun nuovo achievement',
    data: {
      newAchievements,
      totalXPAwarded: totalXP,
      totalCoinsAwarded: totalCoins
    }
  }
}

// ====================================
// SUPABASE HANDLERS
// ====================================
async function handleSupabaseGet(
  supabase: any,
  query: AchievementQuery
): Promise<AchievementResponse> {
  try {
    let achievements = [...ACHIEVEMENTS]

    // Filter by category
    if (query.category !== 'all') {
      achievements = achievements.filter(a => a.category === query.category)
    }

    let userAchievements: any[] = []
    if (query.userId) {
      // Get user's unlocked achievements
      const { data: unlocked, error: unlockedError } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', query.userId)

      if (unlockedError) {
        console.error('Error fetching user achievements:', unlockedError)
      } else {
        userAchievements = unlocked || []
      }

      // Get user stats for progress calculation
      const { data: userStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', query.userId)
        .single()

      // Add unlock status and progress
      achievements = achievements.map(achievement => {
        const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id)
        const isUnlocked = !!userAchievement

        let progress
        if (!isUnlocked && userStats) {
          let current = 0
          switch (achievement.requirement.type) {
            case 'total_wins':
              current = userStats.total_wins || 0
              break
            case 'win_streak':
              current = userStats.current_win_streak || 0
              break
            case 'total_duels':
              current = userStats.total_duels_completed || 0
              break
            case 'form_score':
              current = userStats.best_form_score || 0
              break
          }

          progress = {
            current: Math.min(current, achievement.requirement.value),
            target: achievement.requirement.value,
            percentage: Math.min((current / achievement.requirement.value) * 100, 100)
          }
        }

        return {
          ...achievement,
          isUnlocked,
          unlockedAt: userAchievement?.unlocked_at,
          progress
        }
      })

      // Filter by unlocked status if specified
      if (query.unlocked !== undefined) {
        achievements = achievements.filter(a => query.unlocked ? a.isUnlocked : !a.isUnlocked)
      }
    }

    // Apply pagination
    const totalCount = achievements.length
    const paginatedAchievements = achievements.slice(query.offset, query.offset + query.limit)

    // Calculate categories
    const categories: any = {}
    for (const category of ['wins', 'streak', 'form', 'participation', 'special']) {
      const categoryAchievements = ACHIEVEMENTS.filter(a => a.category === category)
      const unlockedInCategory = query.userId 
        ? categoryAchievements.filter(a => {
            const userAchievement = userAchievements.find(ua => ua.achievement_id === a.id)
            return !!userAchievement
          })
        : []
      
      categories[category] = {
        unlocked: unlockedInCategory.length,
        total: categoryAchievements.length
      }
    }

    const unlockedCount = query.userId ? userAchievements.length : 0
    const recentUnlocks = query.userId 
      ? achievements
          .filter(a => a.isUnlocked)
          .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
          .slice(0, 3)
      : []

    const nextToUnlock = query.userId
      ? achievements
          .filter(a => !a.isUnlocked && a.progress)
          .sort((a, b) => (b.progress?.percentage || 0) - (a.progress?.percentage || 0))
          .slice(0, 3)
      : []

    return {
      success: true,
      message: 'Achievement caricati con successo',
      data: {
        achievements: paginatedAchievements,
        unlockedCount,
        totalCount: ACHIEVEMENTS.length,
        categories,
        recentUnlocks,
        nextToUnlock
      }
    }

  } catch (error) {
    console.error('Unexpected achievements error:', error)
    return {
      success: false,
      message: 'Si è verificato un errore inaspettato',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    }
  }
}

async function handleSupabaseCheck(
  supabase: any,
  data: CheckAchievementRequest
): Promise<CheckAchievementResponse> {
  try {
    // Get current user stats
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', data.userId)
      .single()

    if (statsError || !userStats) {
      return {
        success: false,
        message: 'Statistiche utente non trovate',
        error: 'USER_STATS_NOT_FOUND'
      }
    }

    // Get already unlocked achievements
    const { data: unlockedAchievements, error: unlockedError } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', data.userId)

    if (unlockedError) {
      console.error('Error fetching unlocked achievements:', unlockedError)
      return {
        success: false,
        message: 'Errore nel recupero degli achievement',
        error: 'FETCH_ERROR'
      }
    }

    const unlockedIds = new Set((unlockedAchievements || []).map((ua: any) => ua.achievement_id))
    const newAchievements: Achievement[] = []
    let totalXP = 0
    let totalCoins = 0

    // Check each achievement
    for (const achievement of ACHIEVEMENTS) {
      if (unlockedIds.has(achievement.id)) continue // Already unlocked

      let shouldUnlock = false

      switch (achievement.requirement.type) {
        case 'total_wins':
          shouldUnlock = (userStats.total_wins || 0) >= achievement.requirement.value
          break
        case 'win_streak':
          shouldUnlock = (userStats.current_win_streak || 0) >= achievement.requirement.value
          break
        case 'total_duels':
          shouldUnlock = (userStats.total_duels_completed || 0) >= achievement.requirement.value
          break
        case 'form_score':
          if (data.triggerType === 'form_score' && data.triggerData?.formScore) {
            shouldUnlock = data.triggerData.formScore >= achievement.requirement.value
          }
          break
        case 'special':
          // Handle special achievements based on trigger data
          if (achievement.requirement.condition === 'early_morning' && data.triggerType === 'manual') {
            const now = new Date()
            shouldUnlock = now.getHours() < 8
          } else if (achievement.requirement.condition === 'late_night' && data.triggerType === 'manual') {
            const now = new Date()
            shouldUnlock = now.getHours() >= 22
          }
          break
      }

      if (shouldUnlock) {
        const unlockedAt = new Date().toISOString()

        // Insert achievement unlock
        await supabase
          .from('user_achievements')
          .insert({
            user_id: data.userId,
            achievement_id: achievement.id,
            unlocked_at: unlockedAt
          })

        // Award XP and coins
        await supabase
          .from('xp_transactions')
          .insert({
            user_id: data.userId,
            amount: achievement.xpReward,
            type: 'achievement',
            description: `Achievement: ${achievement.name}`,
            created_at: unlockedAt
          })

        // Update user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('xp, coins')
          .eq('id', data.userId)
          .single()

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              xp: profile.xp + achievement.xpReward,
              coins: profile.coins + achievement.coinsReward,
              updated_at: unlockedAt
            })
            .eq('id', data.userId)
        }

        newAchievements.push({
          ...achievement,
          isUnlocked: true,
          unlockedAt
        })

        totalXP += achievement.xpReward
        totalCoins += achievement.coinsReward
      }
    }

    return {
      success: true,
      message: newAchievements.length > 0 
        ? `${newAchievements.length} nuovi achievement sbloccati!` 
        : 'Nessun nuovo achievement',
      data: {
        newAchievements,
        totalXPAwarded: totalXP,
        totalCoinsAwarded: totalCoins
      }
    }

  } catch (error) {
    console.error('Unexpected check achievements error:', error)
    return {
      success: false,
      message: 'Si è verificato un errore inaspettato',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    }
  }
}

// ====================================
// GET ACHIEVEMENTS HANDLER
// ====================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const queryParams = {
      userId: searchParams.get('userId') || undefined,
      category: searchParams.get('category') || 'all',
      unlocked: searchParams.get('unlocked') ? searchParams.get('unlocked') === 'true' : undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    }

    // Validate query parameters
    const validation = achievementQuerySchema.safeParse(queryParams)
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return NextResponse.json({
        success: false,
        message: `Parametro non valido: ${firstError.message}`,
        error: 'VALIDATION_ERROR'
      }, { status: 400 })
    }

    const query = validation.data

    const supabase = getSupabaseClient()
    
    let result: AchievementResponse
    if (!supabase) {
      console.log('🏅 Loading achievements (test mode)')
      result = await handleTestModeGet(query)
    } else {
      console.log('🏅 Loading achievements (Supabase)')
      result = await handleSupabaseGet(supabase, query)
    }

    // Add cache headers for performance
    const response = NextResponse.json(result)
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
    
    return response

  } catch (error) {
    console.error('Achievements error:', error)
    return NextResponse.json({
      success: false,
      message: 'Errore del server',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 })
  }
}

// ====================================
// CHECK ACHIEVEMENTS HANDLER
// ====================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = checkAchievementSchema.safeParse(body)
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
        message: 'Devi essere autenticato per controllare gli achievement',
        error: 'UNAUTHORIZED'
      }, { status: 401 })
    }

    const user = JSON.parse(userInfo)
    
    // Ensure userId matches authenticated user
    if (data.userId !== user.id) {
      return NextResponse.json({
        success: false,
        message: 'Non puoi controllare gli achievement per altri utenti',
        error: 'FORBIDDEN'
      }, { status: 403 })
    }

    const supabase = getSupabaseClient()
    
    let result: CheckAchievementResponse
    if (!supabase) {
      console.log('🏅 Checking achievements (test mode)')
      result = await handleTestModeCheck(data)
    } else {
      console.log('🏅 Checking achievements (Supabase)')
      result = await handleSupabaseCheck(supabase, data)
    }

    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    })

  } catch (error) {
    console.error('Check achievements error:', error)
    return NextResponse.json({
      success: false,
      message: 'Errore del server',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 })
  }
}