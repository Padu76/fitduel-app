import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// ====================================
// TYPES
// ====================================
export interface Notification {
  id: string
  user_id: string
  type: 'challenge' | 'achievement' | 'level_up' | 'friend_request' | 'system' | 'tournament' | 'daily_reset' | 'duel_result'
  title: string
  message: string
  is_read: boolean
  metadata?: Record<string, any>
  action_url?: string
  priority: 'low' | 'normal' | 'high'
  icon?: string
  expires_at?: string
  created_at: string
  read_at?: string
}

interface CreateNotificationData {
  userId: string
  type: Notification['type']
  title: string
  message: string
  metadata?: Record<string, any>
  actionUrl?: string
  priority?: Notification['priority']
  icon?: string
  expiresAt?: string
}

// ====================================
// GET - Fetch notifications
// ====================================
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    const userId = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type') as Notification['type'] | null

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId is required' },
        { status: 400 }
      )
    }

    // Verify user exists and matches auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Build query
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    if (type) {
      query = query.eq('type', type)
    }

    // Filter out expired notifications
    query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())

    const { data: notifications, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())

    return NextResponse.json({
      success: true,
      data: {
        notifications: notifications || [],
        unreadCount: unreadCount || 0,
        pagination: {
          limit,
          offset,
          hasMore: notifications?.length === limit
        }
      }
    })
  } catch (error) {
    console.error('GET notifications error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ====================================
// POST - Create notification or mark as read
// ====================================
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { action } = body

    if (action === 'create') {
      // Create new notification
      const {
        userId,
        type,
        title,
        message,
        metadata,
        actionUrl,
        priority = 'normal',
        icon,
        expiresAt
      } = body as CreateNotificationData

      if (!userId || !type || !title || !message) {
        return NextResponse.json(
          { success: false, message: 'Missing required fields' },
          { status: 400 }
        )
      }

      // Verify user has permission (usually system or admin only)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        )
      }

      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          metadata,
          action_url: actionUrl,
          priority,
          icon,
          expires_at: expiresAt,
          is_read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating notification:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to create notification' },
          { status: 500 }
        )
      }

      // Trigger real-time update (if using Supabase Realtime)
      // This will be picked up by the client subscription

      return NextResponse.json({
        success: true,
        data: notification
      })
    } 
    
    else if (action === 'mark_read') {
      // Mark single notification as read
      const { notificationId, userId } = body

      if (!notificationId || !userId) {
        return NextResponse.json(
          { success: false, message: 'notificationId and userId are required' },
          { status: 400 }
        )
      }

      // Verify user owns the notification
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.id !== userId) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        )
      }

      const { data, error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error marking notification as read:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to mark notification as read' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data
      })
    }
    
    else {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('POST notifications error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ====================================
// PUT - Bulk operations
// ====================================
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { action, userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId is required' },
        { status: 400 }
      )
    }

    // Verify user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (action === 'mark_all_read') {
      // Mark all notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) {
        console.error('Error marking all as read:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to mark all as read' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      })
    }
    
    else if (action === 'delete_read') {
      // Delete all read notifications older than 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('is_read', true)
        .lt('read_at', sevenDaysAgo.toISOString())

      if (error) {
        console.error('Error deleting old notifications:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to delete old notifications' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Old notifications deleted'
      })
    }
    
    else if (action === 'delete_expired') {
      // Delete expired notifications
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .lt('expires_at', new Date().toISOString())

      if (error) {
        console.error('Error deleting expired notifications:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to delete expired notifications' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Expired notifications deleted'
      })
    }
    
    else {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('PUT notifications error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ====================================
// DELETE - Delete specific notification
// ====================================
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    const notificationId = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!notificationId || !userId) {
      return NextResponse.json(
        { success: false, message: 'id and userId are required' },
        { status: 400 }
      )
    }

    // Verify user owns the notification
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting notification:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to delete notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted'
    })
  } catch (error) {
    console.error('DELETE notification error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}