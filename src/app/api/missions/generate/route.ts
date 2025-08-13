// ====================================
// MANUAL MISSION GENERATION API
// Generate missions on-demand for users
// ====================================

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { AIMissionGenerator } from '@/lib/ai/mission-generator'
import { RewardBalancer } from '@/lib/ai/balancer'

// ====================================
// TYPES & VALIDATION
// ====================================

const generateMissionsSchema = z.object({
  userId: z.string().optional(), // If not provided, use current user
  type: z.enum(['daily', 'weekly', 'special', 'progressive']),
  count: z.number().min(1).max(10).optional(),
  category: z.enum(['duels', 'exercise', 'social', 'streak', 'performance', 'exploration']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard', 'extreme']).optional(),
  trigger: z.enum(['level_up', 'streak_milestone', 'weekend', 'event']).optional(),
  forceRegenerate: z.boolean().optional(), // Force regenerate even if user has active missions
})

type GenerateMissionsRequest = z.infer<typeof generateMissionsSchema>

interface GenerateMissionsResponse {
  success: boolean
  message: string
  data?: {
    missions: Array<{
      id: string
      type: string
      category: string
      difficulty: string
      title: string
      description: string
      target_value: number
      reward_xp: number
      reward_coins: number
      expires_at: string
      metadata: any
    }>
    stats: {
      generated: number
      skipped: number
      errors: number
      processingTime: number
    }
  }
  error?: string
}

// ====================================
// SUPABASE CLIENT
// ====================================

function getSupabaseClient() {
  try {
    const cookieStore = cookies()
    return createRouteHandlerClient({ cookies: () => cookieStore })
  } catch (error) {
    console.warn('⚠️ Supabase client creation failed')
    return null
  }
}

// ====================================
// PERMISSION CHECKS
// ====================================

async function checkPermissions(
  supabase: any,
  currentUserId: string,
  targetUserId?: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Users can generate their own missions
  if (!targetUserId || targetUserId === currentUserId) {
    return { allowed: true }
  }

  // Check if user is admin or moderator
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUserId)
    .single()

  if (profile?.role === 'admin' || profile?.role === 'moderator') {
    return { allowed: true }
  }

  return { 
    allowed: false, 
    reason: 'Non hai i permessi per generare missioni per altri utenti' 
  }
}

// ====================================
// MISSION GENERATION LOGIC
// ====================================

async function generateMissionsForUser(
  request: GenerateMissionsRequest,
  userId: string,
  supabase: any
): Promise<GenerateMissionsResponse> {
  const startTime = Date.now()
  const stats = {
    generated: 0,
    skipped: 0,
    errors: 0,
    processingTime: 0,
  }

  try {
    // Initialize generators
    const missionGenerator = new AIMissionGenerator()
    const rewardBalancer = new RewardBalancer()

    // Check if user already has active missions (unless force regenerate)
    if (!request.forceRegenerate) {
      const { count: activeMissions } = await supabase
        .from('user_missions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('mission_type', request.type)
        .eq('is_completed', false)
        .gte('expires_at', new Date().toISOString())

      if (activeMissions && activeMissions > 0) {
        stats.skipped = activeMissions
        stats.processingTime = Date.now() - startTime

        return {
          success: true,
          message: `L'utente ha già ${activeMissions} missioni ${request.type} attive`,
          data: {
            missions: [],
            stats,
          },
        }
      }
    }

    // Generate missions based on type
    let generatedMissions: any[] = []

    switch (request.type) {
      case 'daily':
        generatedMissions = await missionGenerator.generateDailyMissions(
          userId,
          request.count || 5
        )
        break

      case 'weekly':
        generatedMissions = await missionGenerator.generateWeeklyMissions(
          userId,
          request.count || 3
        )
        break

      case 'special':
        if (request.trigger) {
          const mission = await missionGenerator.generateSpecialMission(
            userId,
            request.trigger
          )
          if (mission) generatedMissions = [mission]
        }
        break

      case 'progressive':
        if (request.category) {
          generatedMissions = await missionGenerator.generateProgressiveMission(
            userId,
            request.category
          )
        }
        break
    }

    // Calculate balanced rewards for each mission
    const missionsWithRewards = await Promise.all(
      generatedMissions.map(async (mission) => {
        const rewardCalc = await rewardBalancer.calculateRewards({
          category: mission.category,
          difficulty: mission.difficulty,
          targetValue: mission.target_value,
          userLevel: await getUserLevel(userId, supabase),
        })

        return {
          ...mission,
          reward_xp: rewardCalc.finalXP,
          reward_coins: rewardCalc.finalCoins,
          reward_explanation: rewardCalc.explanation,
        }
      })
    )

    // Save missions to database
    const savedMissions = []
    for (const mission of missionsWithRewards) {
      try {
        const { data, error } = await supabase
          .from('user_missions')
          .insert({
            user_id: userId,
            mission_id: mission.id,
            mission_type: mission.type,
            category: mission.category,
            difficulty: mission.difficulty,
            title: mission.title,
            description: mission.description,
            target_value: mission.target_value,
            current_value: 0,
            reward_xp: mission.reward_xp,
            reward_coins: mission.reward_coins,
            streak_bonus: mission.streak_bonus,
            conditions: mission.conditions,
            metadata: mission.metadata,
            is_completed: false,
            expires_at: mission.expires_at,
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) throw error
        if (data) {
          savedMissions.push(data)
          stats.generated++
        }
      } catch (error) {
        console.error(`Failed to save mission ${mission.id}:`, error)
        stats.errors++
      }
    }

    // Send notification to user
    if (savedMissions.length > 0) {
      await notifyUser(userId, {
        type: `${request.type}_missions_ready`,
        count: savedMissions.length,
        missions: savedMissions.map(m => ({
          title: m.title,
          reward_xp: m.reward_xp,
        })),
      }, supabase)
    }

    // Log the generation
    await logMissionGeneration({
      user_id: userId,
      type: request.type,
      count: savedMissions.length,
      trigger: 'manual',
      metadata: request,
    }, supabase)

    stats.processingTime = Date.now() - startTime

    return {
      success: true,
      message: `Generate ${savedMissions.length} missioni ${request.type}`,
      data: {
        missions: savedMissions,
        stats,
      },
    }

  } catch (error) {
    console.error('Mission generation error:', error)
    stats.errors++
    stats.processingTime = Date.now() - startTime

    return {
      success: false,
      message: 'Errore nella generazione delle missioni',
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        missions: [],
        stats,
      },
    }
  }
}

// ====================================
// HELPER FUNCTIONS
// ====================================

async function getUserLevel(userId: string, supabase: any): Promise<number> {
  const { data } = await supabase
    .from('user_stats')
    .select('level')
    .eq('user_id', userId)
    .single()

  return data?.level || 1
}

async function notifyUser(userId: string, notification: any, supabase: any): Promise<void> {
  const titles: Record<string, string> = {
    daily_missions_ready: '🎯 Nuove Missioni Giornaliere!',
    weekly_missions_ready: '📅 Nuove Missioni Settimanali!',
    special_missions_ready: '🎉 Missione Speciale!',
    progressive_missions_ready: '🚀 Sfida Progressiva!',
  }

  const title = titles[notification.type] || 'Nuove Missioni!'
  const message = `${notification.count} nuove missioni ti aspettano! Completa per guadagnare XP e coins!`

  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'mission_generated',
      title,
      message,
      data: notification,
      is_read: false,
      created_at: new Date().toISOString(),
    })
}

async function logMissionGeneration(log: any, supabase: any): Promise<void> {
  await supabase
    .from('mission_generation_logs')
    .insert({
      ...log,
      created_at: new Date().toISOString(),
    })
}

// ====================================
// DEMO MODE HANDLER
// ====================================

async function handleDemoMode(request: GenerateMissionsRequest): Promise<GenerateMissionsResponse> {
  console.log('🎮 Generating missions (demo mode)')

  const mockMissions = [
    {
      id: `demo_${Date.now()}_1`,
      type: request.type,
      category: request.category || 'exercise',
      difficulty: request.difficulty || 'medium',
      title: '💪 Sfida Demo: 50 Push-ups',
      description: 'Completa 50 push-ups per vincere!',
      target_value: 50,
      reward_xp: 100,
      reward_coins: 20,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      metadata: { demo: true },
    },
    {
      id: `demo_${Date.now()}_2`,
      type: request.type,
      category: 'streak',
      difficulty: 'easy',
      title: '🔥 Mantieni lo Streak',
      description: 'Accedi per 3 giorni consecutivi',
      target_value: 3,
      reward_xp: 50,
      reward_coins: 10,
      expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      metadata: { demo: true },
    },
  ]

  return {
    success: true,
    message: 'Missioni demo generate con successo!',
    data: {
      missions: mockMissions.slice(0, request.count || 2),
      stats: {
        generated: request.count || 2,
        skipped: 0,
        errors: 0,
        processingTime: 100,
      },
    },
  }
}

// ====================================
// MAIN HANDLERS
// ====================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request
    const validation = generateMissionsSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return NextResponse.json(
        {
          success: false,
          message: `Errore di validazione: ${firstError.message}`,
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    const data = validation.data
    const supabase = getSupabaseClient()

    // Check if Supabase is available
    if (!supabase) {
      console.log('🎮 Using demo mode')
      const result = await handleDemoMode(data)
      return NextResponse.json(result)
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Autenticazione richiesta',
          error: 'UNAUTHORIZED',
        },
        { status: 401 }
      )
    }

    // Check permissions
    const targetUserId = data.userId || user.id
    const permissions = await checkPermissions(supabase, user.id, targetUserId)
    
    if (!permissions.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: permissions.reason,
          error: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }

    // Generate missions
    const result = await generateMissionsForUser(data, targetUserId, supabase)

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    })

  } catch (error) {
    console.error('Generate missions error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Errore del server',
        error: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    )
  }
}

// ====================================
// GET HANDLER - Check Mission Status
// ====================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') || 'all'

    const supabase = getSupabaseClient()

    if (!supabase) {
      // Demo mode
      return NextResponse.json({
        success: true,
        data: {
          missions: [],
          stats: {
            daily: { active: 2, completed: 5, expired: 1 },
            weekly: { active: 1, completed: 2, expired: 0 },
            special: { active: 0, completed: 1, expired: 0 },
          },
        },
      })
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Autenticazione richiesta',
          error: 'UNAUTHORIZED',
        },
        { status: 401 }
      )
    }

    const targetUserId = userId || user.id

    // Check permissions
    const permissions = await checkPermissions(supabase, user.id, targetUserId)
    if (!permissions.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: permissions.reason,
          error: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }

    // Get missions
    let query = supabase
      .from('user_missions')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })

    if (type !== 'all') {
      query = query.eq('mission_type', type)
    }

    const { data: missions, error } = await query

    if (error) throw error

    // Calculate stats
    const stats = {
      daily: {
        active: missions?.filter(m => m.mission_type === 'daily' && !m.is_completed && new Date(m.expires_at) > new Date()).length || 0,
        completed: missions?.filter(m => m.mission_type === 'daily' && m.is_completed).length || 0,
        expired: missions?.filter(m => m.mission_type === 'daily' && !m.is_completed && new Date(m.expires_at) <= new Date()).length || 0,
      },
      weekly: {
        active: missions?.filter(m => m.mission_type === 'weekly' && !m.is_completed && new Date(m.expires_at) > new Date()).length || 0,
        completed: missions?.filter(m => m.mission_type === 'weekly' && m.is_completed).length || 0,
        expired: missions?.filter(m => m.mission_type === 'weekly' && !m.is_completed && new Date(m.expires_at) <= new Date()).length || 0,
      },
      special: {
        active: missions?.filter(m => m.mission_type === 'special' && !m.is_completed && new Date(m.expires_at) > new Date()).length || 0,
        completed: missions?.filter(m => m.mission_type === 'special' && m.is_completed).length || 0,
        expired: missions?.filter(m => m.mission_type === 'special' && !m.is_completed && new Date(m.expires_at) <= new Date()).length || 0,
      },
    }

    return NextResponse.json({
      success: true,
      data: {
        missions: missions || [],
        stats,
      },
    })

  } catch (error) {
    console.error('Get missions error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Errore nel recupero delle missioni',
        error: 'FETCH_ERROR',
      },
      { status: 500 }
    )
  }
}