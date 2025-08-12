import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// ====================================
// TYPES & VALIDATION
// ====================================
const notificationQuerySchema = z.object({
  userId: z.string().min(1),
  unreadOnly: z.boolean().optional().default(false),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0)
})

const markReadSchema = z.object({
  notificationId: z.string().min(1),
  userId: z.string().min(1)
})

const createNotificationSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(['challenge', 'achievement', 'level_up', 'friend_request', 'system']),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  metadata: z.record(z.any()).optional(),
  actionUrl: z.string().optional()
})

type NotificationQuery = z.infer<typeof notificationQuerySchema>
type MarkReadRequest = z.infer<typeof markReadSchema>
type CreateNotificationRequest = z.infer<typeof createNotificationSchema>

interface Notification {
  id: string
  userId: string
  type: 'challenge' | 'achievement' | 'level_up' | 'friend_request' | 'system'
  title: string
  message: string
  isRead: boolean
  metadata?: Record<string, any>
  actionUrl?: string
  createdAt: string
  readAt?: string
}

interface NotificationResponse {
  success: boolean
  message: string
  data?: {
    notifications: Notification[]
    unreadCount: number
    totalCount: number
  }
  error?: string
}

// ====================================
// MOCK DATA FOR TEST MODE
// ====================================
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_1',
    userId: 'user_123',
    type: 'challenge',
    title: '🎯 Nuova Sfida!',
    message: 'FitGuru ti ha sfidato in Push-Up! Accetta la sfida ora.',
    isRead: false,
    actionUrl: '/challenges',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
    metadata: { challengeId: 'challenge_456', opponent: 'FitGuru', exercise: 'push_up' }
  },
  {
    id: 'notif_2',
    userId: 'user_123',
    type: 'achievement',
    title: '🏆 Achievement Sbloccato!',
    message: 'Hai sbloccato "Streak di Fuoco" - 5 vittorie consecutive!',
    isRead: false,
    actionUrl: '/achievements',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    metadata: { achievementId: 'hot_streak', xpReward: 150, coinsReward: 30 }
  },
  {
    id: 'notif_3',
    userId: 'user_123',
    type: 'level_up',
    title: '⚡ Level Up!',
    message: 'Congratulazioni! Sei salito al livello 12!',
    isRead: false,
    actionUrl: '/profile',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    metadata: { newLevel: 12, xpGained: 200 }
  },
  {
    id: 'notif_4',
    userId: 'user_123',
    type: 'challenge',
    title: '✅ Sfida Completata',
    message: 'Hai vinto la sfida contro SpeedRunner! +150 XP',
    isRead: true,
    actionUrl: '/duel/123',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    metadata: { duelId: '123', result: 'win', xpGained: 150 }
  },
  {
    id: 'notif_5',
    userId: 'user_123',
    type: 'system',
    title: '📢 Torneo Settimanale',
    message: 'Il torneo settimanale inizia domani! Preparati per grandi premi.',
    isRead: true,
    actionUrl: '/tournaments',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    metadata: { tournamentId: 'weekly_001' }
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
// TEST MODE HANDLERS
// ====================================
let mockNotifications = [...MOCK_NOTIFICATIONS]

async function handleTestModeGet(query: NotificationQuery): Promise<NotificationResponse> {
  let notifications = mockNotifications.filter(n => n.userId === query.userId)
  
  if (query.unreadOnly) {
    notifications = notifications.filter(n => !n.isRead)
  }

  // Sort by date (newest first)
  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const totalCount = notifications.length
  const unreadCount = notifications.filter(n => !n.isRead).length
  
  // Apply pagination
  const paginatedNotifications = notifications.slice(query.offset, query.offset + query.limit)

  return {
    success: true,
    message: 'Notifiche caricate con successo',
    data: {
      notifications: paginatedNotifications,
      unreadCount,
      totalCount
    }
  }
}

async function handleTestModeMarkRead(data: MarkReadRequest): Promise<NotificationResponse> {
  const notificationIndex = mockNotifications.findIndex(
    n => n.id === data.notificationId && n.userId === data.userId
  )

  if (notificationIndex === -1) {
    return {
      success: false,
      message: 'Notifica non trovata',
      error: 'NOT_FOUND'
    }
  }

  mockNotifications[notificationIndex] = {
    ...mockNotifications[notificationIndex],
    isRead: true,
    readAt: new Date().toISOString()
  }

  return {
    success: true,
    message: 'Notifica segnata come letta',
    data: {
      notifications: [mockNotifications[notificationIndex]],
      unreadCount: mockNotifications.filter(n => n.userId === data.userId && !n.isRead).length,
      totalCount: mockNotifications.filter(n => n.userId === data.userId).length
    }
  }
}

async function handleTestModeCreate(data: CreateNotificationRequest): Promise<NotificationResponse> {
  const newNotification: Notification = {
    id: `notif_${Date.now()}`,
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    isRead: false,
    metadata: data.metadata,
    actionUrl: data.actionUrl,
    createdAt: new Date().toISOString()
  }

  mockNotifications.unshift(newNotification)

  return {
    success: true,
    message: 'Notifica creata con successo',
    data: {
      notifications: [newNotification],
      unreadCount: mockNotifications.filter(n => n.userId === data.userId && !n.isRead).length,
      totalCount: mockNotifications.filter(n => n.userId === data.userId).length
    }
  }
}

// ====================================
// SUPABASE HANDLERS
// ====================================
async function handleSupabaseGet(
  supabase: any,
  query: NotificationQuery
): Promise<NotificationResponse> {
  try {
    let dbQuery = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', query.userId)
      .order('created_at', { ascending: false })

    if (query.unreadOnly) {
      dbQuery = dbQuery.eq('is_read', false)
    }

    const { data: notifications, error, count } = await dbQuery
      .range(query.offset, query.offset + query.limit - 1)

    if (error) {
      console.error('Error fetching notifications:', error)
      return {
        success: false,
        message: 'Errore nel caricamento delle notifiche',
        error: 'FETCH_ERROR'
      }
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', query.userId)
      .eq('is_read', false)

    return {
      success: true,
      message: 'Notifiche caricate con successo',
      data: {
        notifications: notifications || [],
        unreadCount: unreadCount || 0,
        totalCount: count || 0
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      success: false,
      message: 'Si è verificato un errore inaspettato',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    }
  }
}

async function handleSupabaseMarkRead(
  supabase: any,
  data: MarkReadRequest
): Promise<NotificationResponse> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', data.notificationId)
      .eq('user_id', data.userId)

    if (error) {
      console.error('Error marking notification as read:', error)
      return {
        success: false,
        message: 'Errore nell\'aggiornamento della notifica',
        error: 'UPDATE_ERROR'
      }
    }

    // Get updated counts
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', data.userId)
      .eq('is_read', false)

    return {
      success: true,
      message: 'Notifica segnata come letta',
      data: {
        notifications: [],
        unreadCount: unreadCount || 0,
        totalCount: 0
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      success: false,
      message: 'Si è verificato un errore inaspettato',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    }
  }
}

async function handleSupabaseCreate(
  supabase: any,
  data: CreateNotificationRequest
): Promise<NotificationResponse> {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata,
        action_url: data.actionUrl,
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return {
        success: false,
        message: 'Errore nella creazione della notifica',
        error: 'CREATE_ERROR'
      }
    }

    return {
      success: true,
      message: 'Notifica creata con successo',
      data: {
        notifications: [notification],
        unreadCount: 0,
        totalCount: 0
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      success: false,
      message: 'Si è verificato un errore inaspettato',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    }
  }
}

// ====================================
// API HANDLERS
// ====================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const queryParams = {
      userId: searchParams.get('userId') || '',
      unreadOnly: searchParams.get('unreadOnly') === 'true',
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    }

    const validation = notificationQuerySchema.safeParse(queryParams)
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: validation.error.errors[0].message,
        error: 'VALIDATION_ERROR'
      }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    
    let result: NotificationResponse
    if (!supabase) {
      console.log('🔔 Loading notifications (test mode)')
      result = await handleTestModeGet(validation.data)
    } else {
      console.log('🔔 Loading notifications (Supabase)')
      result = await handleSupabaseGet(supabase, validation.data)
    }

    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    })

  } catch (error) {
    console.error('Notifications error:', error)
    return NextResponse.json({
      success: false,
      message: 'Errore del server',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'mark_read') {
      const validation = markReadSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json({
          success: false,
          message: validation.error.errors[0].message,
          error: 'VALIDATION_ERROR'
        }, { status: 400 })
      }

      const supabase = getSupabaseClient()
      
      let result: NotificationResponse
      if (!supabase) {
        result = await handleTestModeMarkRead(validation.data)
      } else {
        result = await handleSupabaseMarkRead(supabase, validation.data)
      }

      return NextResponse.json(result, { 
        status: result.success ? 200 : 400 
      })
    }

    if (action === 'create') {
      const validation = createNotificationSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json({
          success: false,
          message: validation.error.errors[0].message,
          error: 'VALIDATION_ERROR'
        }, { status: 400 })
      }

      const supabase = getSupabaseClient()
      
      let result: NotificationResponse
      if (!supabase) {
        result = await handleTestModeCreate(validation.data)
      } else {
        result = await handleSupabaseCreate(supabase, validation.data)
      }

      return NextResponse.json(result, { 
        status: result.success ? 200 : 400 
      })
    }

    return NextResponse.json({
      success: false,
      message: 'Azione non valida',
      error: 'INVALID_ACTION'
    }, { status: 400 })

  } catch (error) {
    console.error('Notifications error:', error)
    return NextResponse.json({
      success: false,
      message: 'Errore del server',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Mark all as read
    if (body.action === 'mark_all_read' && body.userId) {
      const supabase = getSupabaseClient()
      
      if (!supabase) {
        // Test mode - mark all as read
        mockNotifications = mockNotifications.map(n => 
          n.userId === body.userId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
        
        return NextResponse.json({
          success: true,
          message: 'Tutte le notifiche sono state segnate come lette'
        })
      }

      // Supabase mode
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', body.userId)
        .eq('is_read', false)

      if (error) {
        return NextResponse.json({
          success: false,
          message: 'Errore nell\'aggiornamento delle notifiche',
          error: 'UPDATE_ERROR'
        }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: 'Tutte le notifiche sono state segnate come lette'
      })
    }

    return NextResponse.json({
      success: false,
      message: 'Azione non valida',
      error: 'INVALID_ACTION'
    }, { status: 400 })

  } catch (error) {
    console.error('Notifications error:', error)
    return NextResponse.json({
      success: false,
      message: 'Errore del server',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 })
  }
}