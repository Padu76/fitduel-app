import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// ====================================
// TYPES & VALIDATION
// ====================================
const leaderboardQuerySchema = z.object({
  type: z.enum(['xp', 'level', 'wins', 'streak', 'weekly', 'monthly']).default('xp'),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  timeframe: z.enum(['all', 'week', 'month', 'year']).default('all'),
  exercise: z.string().optional(), // Filter by specific exercise
  userId: z.string().optional() // Get user's position in leaderboard
})

type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>

interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  displayName?: string
  avatarUrl?: string
  level: number
  xp: number
  totalWins: number
  totalLosses: number
  winRate: number
  currentStreak: number
  maxStreak: number
  totalDuels: number
  weeklyXP?: number
  monthlyXP?: number
  favoriteExercise?: string
  joinedAt: string
  lastActive: string
  isCurrentUser?: boolean
}

interface LeaderboardResponse {
  success: boolean
  message: string
  data?: {
    leaderboard: LeaderboardEntry[]
    userPosition?: {
      rank: number
      entry: LeaderboardEntry
    }
    metadata: {
      type: string
      timeframe: string
      totalEntries: number
      limit: number
      offset: number
      generatedAt: string
    }
    stats?: {
      topXP: number
      topLevel: number
      topWins: number
      topStreak: number
      averageLevel: number
      totalActivePlayers: number
    }
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
// TEST MODE DATA
// ====================================
const mockLeaderboardData: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: 'user1',
    username: 'FitMaster',
    level: 25,
    xp: 6250,
    totalWins: 45,
    totalLosses: 12,
    winRate: 78.9,
    currentStreak: 8,
    maxStreak: 15,
    totalDuels: 57,
    weeklyXP: 450,
    monthlyXP: 1200,
    favoriteExercise: 'push_up',
    joinedAt: '2024-01-15T10:00:00Z',
    lastActive: '2025-08-12T20:30:00Z'
  },
  {
    rank: 2,
    userId: 'user2',
    username: 'IronWill',
    level: 22,
    xp: 4840,
    totalWins: 38,
    totalLosses: 15,
    winRate: 71.7,
    currentStreak: 3,
    maxStreak: 12,
    totalDuels: 53,
    weeklyXP: 380,
    monthlyXP: 980,
    favoriteExercise: 'plank',
    joinedAt: '2024-02-01T14:22:00Z',
    lastActive: '2025-08-12T19:45:00Z'
  },
  {
    rank: 3,
    userId: 'user3',
    username: 'SpeedDemon',
    level: 20,
    xp: 4000,
    totalWins: 32,
    totalLosses: 8,
    winRate: 80.0,
    currentStreak: 12,
    maxStreak: 12,
    totalDuels: 40,
    weeklyXP: 320,
    monthlyXP: 850,
    favoriteExercise: 'burpee',
    joinedAt: '2024-03-10T09:15:00Z',
    lastActive: '2025-08-12T21:00:00Z'
  },
  {
    rank: 4,
    userId: 'user4',
    username: 'FlexGuru',
    level: 18,
    xp: 3240,
    totalWins: 28,
    totalLosses: 18,
    winRate: 60.9,
    currentStreak: 1,
    maxStreak: 8,
    totalDuels: 46,
    weeklyXP: 280,
    monthlyXP: 720,
    favoriteExercise: 'squat',
    joinedAt: '2024-04-05T16:30:00Z',
    lastActive: '2025-08-12T18:20:00Z'
  },
  {
    rank: 5,
    userId: 'user5',
    username: 'CardioKing',
    level: 16,
    xp: 2560,
    totalWins: 22,
    totalLosses: 14,
    winRate: 61.1,
    currentStreak: 0,
    maxStreak: 6,
    totalDuels: 36,
    weeklyXP: 220,
    monthlyXP: 580,
    favoriteExercise: 'jumping_jack',
    joinedAt: '2024-05-20T11:45:00Z',
    lastActive: '2025-08-12T17:10:00Z'
  }
]

// ====================================
// TEST MODE HANDLER
// ====================================
async function handleTestMode(query: LeaderboardQuery): Promise<LeaderboardResponse> {
  let leaderboard = [...mockLeaderboardData]

  // Apply sorting based on type
  switch (query.type) {
    case 'xp':
      leaderboard.sort((a, b) => b.xp - a.xp)
      break
    case 'level':
      leaderboard.sort((a, b) => b.level - a.level || b.xp - a.xp)
      break
    case 'wins':
      leaderboard.sort((a, b) => b.totalWins - a.totalWins)
      break
    case 'streak':
      leaderboard.sort((a, b) => b.currentStreak - a.currentStreak || b.maxStreak - a.maxStreak)
      break
    case 'weekly':
      leaderboard.sort((a, b) => (b.weeklyXP || 0) - (a.weeklyXP || 0))
      break
    case 'monthly':
      leaderboard.sort((a, b) => (b.monthlyXP || 0) - (a.monthlyXP || 0))
      break
  }

  // Update ranks
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1
    if (query.userId && entry.userId === query.userId) {
      entry.isCurrentUser = true
    }
  })

  // Apply pagination
  const totalEntries = leaderboard.length
  const paginatedLeaderboard = leaderboard.slice(query.offset, query.offset + query.limit)

  // Find user position if requested
  let userPosition
  if (query.userId) {
    const userEntry = leaderboard.find(entry => entry.userId === query.userId)
    if (userEntry) {
      userPosition = {
        rank: userEntry.rank,
        entry: userEntry
      }
    }
  }

  // Calculate stats
  const stats = {
    topXP: Math.max(...leaderboard.map(e => e.xp)),
    topLevel: Math.max(...leaderboard.map(e => e.level)),
    topWins: Math.max(...leaderboard.map(e => e.totalWins)),
    topStreak: Math.max(...leaderboard.map(e => e.currentStreak)),
    averageLevel: Math.round(leaderboard.reduce((sum, e) => sum + e.level, 0) / leaderboard.length),
    totalActivePlayers: leaderboard.length
  }

  return {
    success: true,
    message: 'Classifica caricata con successo',
    data: {
      leaderboard: paginatedLeaderboard,
      userPosition,
      metadata: {
        type: query.type,
        timeframe: query.timeframe,
        totalEntries,
        limit: query.limit,
        offset: query.offset,
        generatedAt: new Date().toISOString()
      },
      stats
    }
  }
}

// ====================================
// SUPABASE LEADERBOARD HANDLER
// ====================================
async function handleSupabaseLeaderboard(
  supabase: any,
  query: LeaderboardQuery
): Promise<LeaderboardResponse> {
  try {
    // Base query for profiles with stats
    let baseQuery = supabase
      .from('profiles')
      .select(`
        id,
        username,
        display_name,
        avatar_url,
        level,
        xp,
        coins,
        created_at,
        updated_at,
        user_stats!inner(
          total_wins,
          total_losses,
          current_win_streak,
          max_win_streak,
          total_duels_completed,
          weekly_xp,
          monthly_xp,
          favorite_exercise
        )
      `)

    // Apply timeframe filters for XP-based leaderboards
    if (query.timeframe !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (query.timeframe) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(0)
      }

      baseQuery = baseQuery.gte('updated_at', startDate.toISOString())
    }

    // Apply sorting based on type
    let orderBy: string
    switch (query.type) {
      case 'xp':
        orderBy = 'xp'
        break
      case 'level':
        orderBy = 'level'
        break
      case 'wins':
        orderBy = 'user_stats.total_wins'
        break
      case 'streak':
        orderBy = 'user_stats.current_win_streak'
        break
      case 'weekly':
        orderBy = 'user_stats.weekly_xp'
        break
      case 'monthly':
        orderBy = 'user_stats.monthly_xp'
        break
      default:
        orderBy = 'xp'
    }

    // Execute query with pagination
    const { data: profiles, error: profileError, count } = await baseQuery
      .order(orderBy, { ascending: false })
      .order('xp', { ascending: false }) // Secondary sort by XP
      .range(query.offset, query.offset + query.limit - 1)

    if (profileError) {
      console.error('Leaderboard query error:', profileError)
      return {
        success: false,
        message: 'Errore nel caricamento della classifica',
        error: 'QUERY_ERROR'
      }
    }

    if (!profiles || profiles.length === 0) {
      return {
        success: true,
        message: 'Nessun giocatore trovato',
        data: {
          leaderboard: [],
          metadata: {
            type: query.type,
            timeframe: query.timeframe,
            totalEntries: 0,
            limit: query.limit,
            offset: query.offset,
            generatedAt: new Date().toISOString()
          }
        }
      }
    }

    // Transform data to leaderboard format
    const leaderboard: LeaderboardEntry[] = profiles.map((profile: any, index: number) => {
      const stats = profile.user_stats[0] || {}
      const totalDuels = (stats.total_wins || 0) + (stats.total_losses || 0)
      const winRate = totalDuels > 0 ? ((stats.total_wins || 0) / totalDuels) * 100 : 0

      return {
        rank: query.offset + index + 1,
        userId: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        level: profile.level || 1,
        xp: profile.xp || 0,
        totalWins: stats.total_wins || 0,
        totalLosses: stats.total_losses || 0,
        winRate: Math.round(winRate * 10) / 10,
        currentStreak: stats.current_win_streak || 0,
        maxStreak: stats.max_win_streak || 0,
        totalDuels: stats.total_duels_completed || 0,
        weeklyXP: stats.weekly_xp || 0,
        monthlyXP: stats.monthly_xp || 0,
        favoriteExercise: stats.favorite_exercise,
        joinedAt: profile.created_at,
        lastActive: profile.updated_at,
        isCurrentUser: query.userId ? profile.id === query.userId : false
      }
    })

    // Get user position if requested
    let userPosition
    if (query.userId) {
      // Get user's exact rank with a separate query
      const { data: userRankData, error: userRankError } = await supabase
        .rpc('get_user_leaderboard_rank', {
          user_id: query.userId,
          leaderboard_type: query.type,
          timeframe: query.timeframe
        })

      if (!userRankError && userRankData) {
        const userEntry = leaderboard.find(entry => entry.userId === query.userId)
        if (userEntry) {
          userPosition = {
            rank: userRankData.rank,
            entry: { ...userEntry, rank: userRankData.rank }
          }
        } else {
          // User not in current page, get their data separately
          const { data: userData } = await supabase
            .from('profiles')
            .select(`
              id,
              username,
              display_name,
              avatar_url,
              level,
              xp,
              coins,
              created_at,
              updated_at,
              user_stats!inner(
                total_wins,
                total_losses,
                current_win_streak,
                max_win_streak,
                total_duels_completed,
                weekly_xp,
                monthly_xp,
                favorite_exercise
              )
            `)
            .eq('id', query.userId)
            .single()

          if (userData) {
            const userStats = userData.user_stats[0] || {}
            const userTotalDuels = (userStats.total_wins || 0) + (userStats.total_losses || 0)
            const userWinRate = userTotalDuels > 0 ? ((userStats.total_wins || 0) / userTotalDuels) * 100 : 0

            userPosition = {
              rank: userRankData.rank,
              entry: {
                rank: userRankData.rank,
                userId: userData.id,
                username: userData.username,
                displayName: userData.display_name,
                avatarUrl: userData.avatar_url,
                level: userData.level || 1,
                xp: userData.xp || 0,
                totalWins: userStats.total_wins || 0,
                totalLosses: userStats.total_losses || 0,
                winRate: Math.round(userWinRate * 10) / 10,
                currentStreak: userStats.current_win_streak || 0,
                maxStreak: userStats.max_win_streak || 0,
                totalDuels: userStats.total_duels_completed || 0,
                weeklyXP: userStats.weekly_xp || 0,
                monthlyXP: userStats.monthly_xp || 0,
                favoriteExercise: userStats.favorite_exercise,
                joinedAt: userData.created_at,
                lastActive: userData.updated_at,
                isCurrentUser: true
              }
            }
          }
        }
      }
    }

    // Get global stats
    const { data: globalStats } = await supabase
      .rpc('get_leaderboard_stats')

    const stats = globalStats ? {
      topXP: globalStats.top_xp || 0,
      topLevel: globalStats.top_level || 1,
      topWins: globalStats.top_wins || 0,
      topStreak: globalStats.top_streak || 0,
      averageLevel: globalStats.average_level || 1,
      totalActivePlayers: globalStats.total_players || 0
    } : undefined

    return {
      success: true,
      message: 'Classifica caricata con successo',
      data: {
        leaderboard,
        userPosition,
        metadata: {
          type: query.type,
          timeframe: query.timeframe,
          totalEntries: count || 0,
          limit: query.limit,
          offset: query.offset,
          generatedAt: new Date().toISOString()
        },
        stats
      }
    }

  } catch (error) {
    console.error('Unexpected leaderboard error:', error)
    return {
      success: false,
      message: 'Si è verificato un errore inaspettato',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    }
  }
}

// ====================================
// GET LEADERBOARD HANDLER
// ====================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const queryParams = {
      type: searchParams.get('type') || 'xp',
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      timeframe: searchParams.get('timeframe') || 'all',
      exercise: searchParams.get('exercise') || undefined,
      userId: searchParams.get('userId') || undefined
    }

    // Validate query parameters
    const validation = leaderboardQuerySchema.safeParse(queryParams)
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
    
    let result: LeaderboardResponse
    if (!supabase) {
      console.log('📊 Loading leaderboard (test mode):', query.type)
      result = await handleTestMode(query)
    } else {
      console.log('📊 Loading leaderboard (Supabase):', query.type)
      result = await handleSupabaseLeaderboard(supabase, query)
    }

    // Add cache headers for performance
    const response = NextResponse.json(result)
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    
    return response

  } catch (error) {
    console.error('Leaderboard error:', error)
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
export async function POST() {
  return NextResponse.json({
    success: false,
    message: 'Metodo non consentito. Usa GET per recuperare la classifica.',
    error: 'METHOD_NOT_ALLOWED'
  }, { status: 405 })
}