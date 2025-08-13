import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { AIMissionGenerator } from '@/lib/ai/mission-generator'

// ====================================
// TYPES & VALIDATION
// ====================================
const createEventMissionSchema = z.object({
  // Event Details
  theme: z.string().min(3, 'Tema richiesto (min 3 caratteri)'),
  title: z.string().min(5, 'Titolo richiesto (min 5 caratteri)'),
  description: z.string().min(10, 'Descrizione richiesta (min 10 caratteri)'),
  
  // Mission Settings
  category: z.enum(['duels', 'exercise', 'social', 'streak', 'performance', 'exploration']),
  difficulty: z.enum(['easy', 'medium', 'hard', 'extreme']),
  target_value: z.number().min(1).max(1000),
  target_type: z.enum(['reps', 'time', 'duels_won', 'streak_days', 'form_score', 'social_actions']),
  
  // Timing
  duration_days: z.number().min(1).max(30),
  start_date: z.string().optional(), // ISO date, defaults to now
  
  // Rewards
  xp_reward: z.number().min(50).max(5000),
  coins_reward: z.number().min(10).max(1000),
  special_badge: z.string().optional(),
  bonus_multiplier: z.number().min(1).max(5).default(1),
  
  // Restrictions
  min_level: z.number().min(1).max(50).optional(),
  max_level: z.number().min(1).max(50).optional(),
  max_participants: z.number().min(10).max(10000).optional(),
  
  // Visual
  icon_emoji: z.string().optional(),
  banner_color: z.string().optional(),
  
  // Admin
  created_by: z.string().min(1, 'Creator ID richiesto'),
  is_global: z.boolean().default(true)
})

type CreateEventMissionRequest = z.infer<typeof createEventMissionSchema>

interface EventMissionResponse {
  success: boolean
  message: string
  data?: {
    mission: {
      id: string
      theme: string
      title: string
      description: string
      starts_at: string
      expires_at: string
      participants_count: number
      estimated_completion_rate: number
    }
    impact: {
      estimated_participants: number
      xp_economy_impact: number
      engagement_score: number
    }
  }
  error?: string
}

// ====================================
// EVENT THEMES TEMPLATES
// ====================================
const EVENT_THEMES = {
  // Seasonal Events
  halloween: {
    emojis: ['🎃', '👻', '🦇', '🕷️', '🧙‍♀️'],
    colors: ['#ff6b35', '#f7931e', '#8b4513', '#4a0e4e'],
    keywords: ['terrore', 'brivido', 'spettrale', 'mostruoso', 'spaventoso'],
    titles: [
      'Terrore in Palestra',
      'Allenamento da Brivido',
      'Sfida Spettrale',
      'Workout Mostruoso',
      'Halloween Horror Fitness'
    ]
  },
  
  christmas: {
    emojis: ['🎄', '🎅', '❄️', '🎁', '⛄'],
    colors: ['#c41e3a', '#2e8b57', '#ffd700', '#ffffff'],
    keywords: ['natalizio', 'festivo', 'magico', 'gioioso', 'speciale'],
    titles: [
      'Fitness sotto l\'Albero',
      'Regali di Muscoli',
      'Sfida di Natale',
      'Workout Natalizio',
      'Christmas Fitness Challenge'
    ]
  },
  
  newyear: {
    emojis: ['🎊', '🎉', '✨', '🥳', '🚀'],
    colors: ['#ffd700', '#ff6b9d', '#4ecdc4', '#45b7d1'],
    keywords: ['nuovo', 'inizio', 'obiettivi', 'trasformazione', 'motivazione'],
    titles: [
      'Nuovo Anno, Nuovo Te',
      'Obiettivi 2025',
      'Sfida del Cambiamento',
      'Resolution Workout',
      'Fresh Start Challenge'
    ]
  },
  
  summer: {
    emojis: ['☀️', '🏖️', '🌊', '🍉', '🕶️'],
    colors: ['#f39c12', '#e74c3c', '#3498db', '#2ecc71'],
    keywords: ['estate', 'spiaggia', 'vacanza', 'sole', 'energia'],
    titles: [
      'Summer Body Challenge',
      'Workout da Spiaggia',
      'Energia Estiva',
      'Beach Ready Fitness',
      'Sfida dell\'Estate'
    ]
  },
  
  // Achievement Events
  milestone: {
    emojis: ['🏆', '👑', '💎', '🌟', '⚡'],
    colors: ['#ffd700', '#ff6b35', '#8e44ad', '#e74c3c'],
    keywords: ['leggendario', 'epico', 'supremo', 'elite', 'campione'],
    titles: [
      'Sfida Leggendaria',
      'Elite Challenge',
      'Prova del Campione',
      'Legendary Workout',
      'Ultimate Fitness Test'
    ]
  },
  
  community: {
    emojis: ['🤝', '👥', '🌍', '💪', '❤️'],
    colors: ['#3498db', '#2ecc71', '#f39c12', '#e74c3c'],
    keywords: ['insieme', 'comunità', 'uniti', 'squadra', 'sociale'],
    titles: [
      'Sfida della Comunità',
      'Insieme per la Vittoria',
      'Team Challenge',
      'United We Sweat',
      'Community Power'
    ]
  }
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
// ADMIN AUTHENTICATION
// ====================================
async function checkAdminPermissions(supabase: any, userId: string): Promise<boolean> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !profile) return false
    
    return ['admin', 'moderator'].includes(profile.role)
  } catch (error) {
    console.error('Error checking admin permissions:', error)
    return false
  }
}

// ====================================
// EVENT MISSION GENERATION
// ====================================
async function generateEventMission(
  data: CreateEventMissionRequest,
  supabase: any
): Promise<EventMissionResponse> {
  try {
    // Calculate dates
    const startDate = data.start_date ? new Date(data.start_date) : new Date()
    const expiresAt = new Date(startDate)
    expiresAt.setDate(expiresAt.getDate() + data.duration_days)
    
    // Generate enhanced description with AI
    const enhancedDescription = await enhanceEventDescription(
      data.theme,
      data.description,
      data.category,
      data.difficulty
    )
    
    // Get theme data
    const themeData = EVENT_THEMES[data.theme as keyof typeof EVENT_THEMES]
    const selectedEmoji = data.icon_emoji || (themeData?.emojis?.[0] || '🎯')
    const selectedColor = data.banner_color || (themeData?.colors?.[0] || '#3498db')
    
    // Create event mission
    const { data: mission, error: insertError } = await supabase
      .from('event_missions')
      .insert({
        theme: data.theme,
        title: data.title,
        description: enhancedDescription,
        category: data.category,
        difficulty: data.difficulty,
        target_value: data.target_value,
        target_type: data.target_type,
        xp_reward: data.xp_reward,
        coins_reward: data.coins_reward,
        special_badge: data.special_badge,
        bonus_multiplier: data.bonus_multiplier,
        min_level: data.min_level,
        max_level: data.max_level,
        max_participants: data.max_participants,
        icon_emoji: selectedEmoji,
        banner_color: selectedColor,
        starts_at: startDate.toISOString(),
        expires_at: expiresAt.toISOString(),
        created_by: data.created_by,
        is_global: data.is_global,
        is_active: true,
        participants_count: 0,
        completion_count: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Calculate impact metrics
    const impact = await calculateEventImpact(data, supabase)
    
    // Create notification for all eligible users
    await notifyEligibleUsers(mission, supabase)
    
    // Log admin action
    await supabase
      .from('admin_logs')
      .insert({
        admin_id: data.created_by,
        action: 'create_event_mission',
        target_type: 'event_mission',
        target_id: mission.id,
        details: {
          theme: data.theme,
          title: data.title,
          duration_days: data.duration_days,
          estimated_participants: impact.estimated_participants
        },
        created_at: new Date().toISOString()
      })

    return {
      success: true,
      message: `Evento "${data.title}" creato con successo! 🎉`,
      data: {
        mission: {
          id: mission.id,
          theme: mission.theme,
          title: mission.title,
          description: mission.description,
          starts_at: mission.starts_at,
          expires_at: mission.expires_at,
          participants_count: 0,
          estimated_completion_rate: impact.engagement_score
        },
        impact
      }
    }

  } catch (error) {
    console.error('Error generating event mission:', error)
    return {
      success: false,
      message: 'Errore nella creazione dell\'evento',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    }
  }
}

// ====================================
// AI DESCRIPTION ENHANCEMENT
// ====================================
async function enhanceEventDescription(
  theme: string,
  baseDescription: string,
  category: string,
  difficulty: string
): Promise<string> {
  try {
    // Get theme-specific data
    const themeData = EVENT_THEMES[theme as keyof typeof EVENT_THEMES]
    
    if (!themeData) return baseDescription
    
    // Add motivational elements based on theme and difficulty
    const motivationalPhrases = {
      easy: ['Perfetto per iniziare!', 'Alla portata di tutti!', 'Un primo passo verso la vittoria!'],
      medium: ['Una sfida equilibrata!', 'Testa la tua determinazione!', 'Il giusto livello di challenge!'],
      hard: ['Solo per i coraggiosi!', 'Metterai alla prova i tuoi limiti!', 'Una sfida per veri atleti!'],
      extreme: ['Solo per leggende!', 'L\'ultima prova!', 'Riservato agli elit!']
    }
    
    const categoryActions = {
      duels: 'Sfida altri utenti',
      exercise: 'Completa gli esercizi',
      social: 'Coinvolgi la community',
      streak: 'Mantieni la costanza',
      performance: 'Supera i tuoi limiti',
      exploration: 'Scopri nuove funzionalità'
    }
    
    // Build enhanced description
    const motivation = motivationalPhrases[difficulty as keyof typeof motivationalPhrases]?.[0] || ''
    const action = categoryActions[category as keyof typeof categoryActions] || 'Partecipa'
    const keywords = themeData.keywords?.join(', ') || ''
    
    let enhanced = baseDescription
    
    // Add theme context
    if (theme === 'halloween') {
      enhanced += ` 🎃 Preparati per un allenamento da brivido! `
    } else if (theme === 'christmas') {
      enhanced += ` 🎄 Il regalo perfetto per il tuo corpo! `
    } else if (theme === 'newyear') {
      enhanced += ` ✨ Inizia l'anno con il piede giusto! `
    } else if (theme === 'summer') {
      enhanced += ` ☀️ Preparati per l'estate! `
    }
    
    enhanced += `${action} in questo evento ${theme}. ${motivation}`
    
    return enhanced
    
  } catch (error) {
    console.error('Error enhancing description:', error)
    return baseDescription
  }
}

// ====================================
// IMPACT CALCULATION
// ====================================
async function calculateEventImpact(
  data: CreateEventMissionRequest,
  supabase: any
): Promise<{ estimated_participants: number; xp_economy_impact: number; engagement_score: number }> {
  try {
    // Get total active users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Filter by level restrictions
    let eligibleUsers = totalUsers || 1000 // Default fallback
    
    if (data.min_level || data.max_level) {
      const { count: levelFilteredUsers } = await supabase
        .from('user_stats')
        .select('*', { count: 'exact', head: true })
        .gte('level', data.min_level || 1)
        .lte('level', data.max_level || 999)
      
      eligibleUsers = levelFilteredUsers || Math.floor(totalUsers * 0.7)
    }
    
    // Calculate participation rate based on difficulty and rewards
    const difficultyMultiplier = {
      easy: 0.8,
      medium: 0.6,
      hard: 0.4,
      extreme: 0.25
    }[data.difficulty]
    
    const rewardMultiplier = Math.min(data.xp_reward / 500, 2) // Higher rewards = more participation
    const durationMultiplier = Math.max(0.3, 1 - (data.duration_days - 1) * 0.05) // Shorter events = higher participation
    
    const participationRate = difficultyMultiplier * rewardMultiplier * durationMultiplier
    const estimatedParticipants = Math.floor(eligibleUsers * participationRate)
    
    // Calculate XP economy impact
    const completionRate = {
      easy: 0.75,
      medium: 0.6,
      hard: 0.4,
      extreme: 0.25
    }[data.difficulty]
    
    const totalXPDistribution = estimatedParticipants * completionRate * (data.xp_reward * data.bonus_multiplier)
    
    // Calculate engagement score (0-100)
    const baseEngagement = 50
    const difficultyBonus = { easy: 10, medium: 20, hard: 30, extreme: 40 }[data.difficulty]
    const rewardBonus = Math.min(data.xp_reward / 100, 30)
    const themeBonus = EVENT_THEMES[data.theme as keyof typeof EVENT_THEMES] ? 15 : 0
    
    const engagementScore = Math.min(100, baseEngagement + difficultyBonus + rewardBonus + themeBonus)
    
    return {
      estimated_participants: Math.min(estimatedParticipants, data.max_participants || 999999),
      xp_economy_impact: totalXPDistribution,
      engagement_score: Math.round(engagementScore)
    }
    
  } catch (error) {
    console.error('Error calculating impact:', error)
    return {
      estimated_participants: 100,
      xp_economy_impact: 5000,
      engagement_score: 70
    }
  }
}

// ====================================
// USER NOTIFICATIONS
// ====================================
async function notifyEligibleUsers(mission: any, supabase: any): Promise<void> {
  try {
    // Get eligible users based on level restrictions
    let userQuery = supabase
      .from('user_stats')
      .select('user_id, level')
    
    if (mission.min_level) {
      userQuery = userQuery.gte('level', mission.min_level)
    }
    
    if (mission.max_level) {
      userQuery = userQuery.lte('level', mission.max_level)
    }
    
    const { data: eligibleUsers, error } = await userQuery
    
    if (error || !eligibleUsers) {
      console.error('Error getting eligible users:', error)
      return
    }
    
    // Create notifications in batches
    const batchSize = 100
    const notifications = eligibleUsers.map(user => ({
      user_id: user.user_id,
      type: 'event_mission',
      title: `🎉 Nuovo Evento: ${mission.title}`,
      message: `Un nuovo evento speciale è disponibile! Partecipa entro ${new Date(mission.expires_at).toLocaleDateString('it-IT')}`,
      data: {
        event_mission_id: mission.id,
        theme: mission.theme,
        xp_reward: mission.xp_reward,
        expires_at: mission.expires_at
      },
      action_url: `/events/${mission.id}`,
      is_read: false,
      created_at: new Date().toISOString()
    }))
    
    // Insert notifications in batches
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize)
      await supabase.from('notifications').insert(batch)
    }
    
    console.log(`✅ Notified ${notifications.length} users about event: ${mission.title}`)
    
  } catch (error) {
    console.error('Error notifying users:', error)
  }
}

// ====================================
// DEMO MODE HANDLER
// ====================================
async function handleDemoMode(data: CreateEventMissionRequest): Promise<EventMissionResponse> {
  console.log('🎮 Creating event mission (demo mode)')
  
  // Simulate successful creation
  const mockMission = {
    id: `event_${Date.now()}`,
    theme: data.theme,
    title: data.title,
    description: data.description,
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + data.duration_days * 24 * 60 * 60 * 1000).toISOString(),
    participants_count: 0,
    estimated_completion_rate: 75
  }
  
  const mockImpact = {
    estimated_participants: Math.floor(Math.random() * 500) + 100,
    xp_economy_impact: data.xp_reward * 200,
    engagement_score: 85
  }
  
  return {
    success: true,
    message: `Evento "${data.title}" creato con successo! 🎉`,
    data: {
      mission: mockMission,
      impact: mockImpact
    }
  }
}

// ====================================
// MAIN POST HANDLER
// ====================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = createEventMissionSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return NextResponse.json({
        success: false,
        message: `Errore di validazione: ${firstError.message}`,
        error: 'VALIDATION_ERROR'
      }, { status: 400 })
    }

    const data = validation.data
    const supabase = getSupabaseClient()

    // Check if Supabase is available
    if (!supabase) {
      console.log('🎮 Using demo mode for event creation')
      const result = await handleDemoMode(data)
      return NextResponse.json(result)
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        message: 'Autenticazione richiesta',
        error: 'UNAUTHORIZED'
      }, { status: 401 })
    }

    // Verify user is the creator or has admin permissions
    if (data.created_by !== user.id) {
      const isAdmin = await checkAdminPermissions(supabase, user.id)
      if (!isAdmin) {
        return NextResponse.json({
          success: false,
          message: 'Permessi amministratore richiesti',
          error: 'FORBIDDEN'
        }, { status: 403 })
      }
    } else {
      // Check if user has at least moderator permissions
      const isAdmin = await checkAdminPermissions(supabase, user.id)
      if (!isAdmin) {
        return NextResponse.json({
          success: false,
          message: 'Permessi amministratore richiesti per creare eventi',
          error: 'INSUFFICIENT_PERMISSIONS'
        }, { status: 403 })
      }
    }

    // Generate event mission
    const result = await generateEventMission(data, supabase)

    return NextResponse.json(result, {
      status: result.success ? 201 : 400
    })

  } catch (error) {
    console.error('Event mission creation error:', error)
    return NextResponse.json({
      success: false,
      message: 'Errore del server',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 })
  }
}

// ====================================
// GET HANDLER - List Event Missions
// ====================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'
    const theme = searchParams.get('theme')
    const limit = parseInt(searchParams.get('limit') || '10')

    const supabase = getSupabaseClient()

    if (!supabase) {
      // Demo mode - return mock events
      const mockEvents = [
        {
          id: 'event_1',
          theme: 'halloween',
          title: 'Halloween Horror Workout',
          description: 'Allenamento da brivido per Halloween! 🎃',
          starts_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          participants_count: 156,
          completion_count: 89,
          xp_reward: 300,
          icon_emoji: '🎃'
        }
      ]

      return NextResponse.json({
        success: true,
        data: {
          events: mockEvents,
          total: mockEvents.length
        }
      })
    }

    let query = supabase
      .from('event_missions')
      .select('*')
      .eq('is_active', status === 'active')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (theme) {
      query = query.eq('theme', theme)
    }

    const { data: events, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: {
        events: events || [],
        total: events?.length || 0
      }
    })

  } catch (error) {
    console.error('Get event missions error:', error)
    return NextResponse.json({
      success: false,
      message: 'Errore nel recupero degli eventi',
      error: 'FETCH_ERROR'
    }, { status: 500 })
  }
}