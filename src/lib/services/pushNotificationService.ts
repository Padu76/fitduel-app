// ================================================
// PUSH NOTIFICATIONS SERVICE
// Complete service for Web Push Notifications
// ================================================

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useState, useEffect } from 'react'

// ================================================
// TYPES
// ================================================

export interface NotificationPayload {
  title: string
  message: string
  type: NotificationType
  icon?: string
  badge?: string
  image?: string
  actionUrl?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  data?: Record<string, any>
  requireInteraction?: boolean
  silent?: boolean
}

export type NotificationType = 
  | 'duel_challenge'
  | 'duel_accepted'
  | 'duel_completed'
  | 'duel_reminder'
  | 'mission_available'
  | 'mission_completed'
  | 'achievement_unlocked'
  | 'friend_request'
  | 'team_invite'
  | 'streak_warning'
  | 'level_up'
  | 'leaderboard_update'
  | 'system'

export interface NotificationPreferences {
  push_enabled: boolean
  push_duels: boolean
  push_missions: boolean
  push_achievements: boolean
  push_social: boolean
  push_streaks: boolean
  sound_enabled: boolean
  vibration_enabled: boolean
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
}

// Extended NotificationOptions type to include image
interface ExtendedNotificationOptions extends NotificationOptions {
  image?: string
}

// ================================================
// CONSTANTS
// ================================================

// IMPORTANT: Replace with your actual Firebase config
export const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "YOUR_MEASUREMENT_ID"
}

export const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "YOUR_VAPID_KEY"

// Notification icons and badges
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  duel_challenge: '⚔️',
  duel_accepted: '🤝',
  duel_completed: '🏆',
  duel_reminder: '⏰',
  mission_available: '🎯',
  mission_completed: '✅',
  achievement_unlocked: '🏅',
  friend_request: '👥',
  team_invite: '👫',
  streak_warning: '🔥',
  level_up: '⬆️',
  leaderboard_update: '📊',
  system: '📢'
}

// ================================================
// MAIN SERVICE CLASS
// ================================================

class PushNotificationService {
  private supabase = createClientComponentClient()
  private fcmToken: string | null = null
  private isInitialized = false
  private messaging: any = null
  private registration: ServiceWorkerRegistration | null = null
  private userId: string | null = null

  // ================================================
  // INITIALIZATION
  // ================================================

  async initialize(userId: string): Promise<boolean> {
    if (this.isInitialized) {
      console.log('Push notifications already initialized')
      return true
    }

    this.userId = userId

    try {
      // Check browser support
      if (!this.checkBrowserSupport()) {
        console.warn('Browser does not support push notifications')
        return false
      }

      // Register service worker
      await this.registerServiceWorker()

      // Initialize Firebase
      await this.initializeFirebase()

      // Request permission
      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        console.warn('Push notification permission denied')
        return false
      }

      // Get FCM token
      await this.getFCMToken()

      // Setup message listeners
      this.setupMessageListeners()

      // Save token to database
      if (this.fcmToken) {
        await this.saveTokenToDatabase()
      }

      this.isInitialized = true
      console.log('Push notifications initialized successfully')
      return true

    } catch (error) {
      console.error('Error initializing push notifications:', error)
      return false
    }
  }

  // ================================================
  // BROWSER & PERMISSION CHECKS
  // ================================================

  private checkBrowserSupport(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window
  }

  private async requestPermission(): Promise<NotificationPermission> {
    const currentPermission = Notification.permission

    if (currentPermission === 'default') {
      const newPermission = await Notification.requestPermission()
      return newPermission
    }

    return currentPermission
  }

  // ================================================
  // SERVICE WORKER
  // ================================================

  private async registerServiceWorker(): Promise<void> {
    try {
      // First, check if service worker exists
      const swPath = '/firebase-messaging-sw.js'
      const swResponse = await fetch(swPath)
      
      if (!swResponse.ok) {
        console.warn('Service worker file not found, creating it...')
        // We'll need to create this file - see instructions below
      }

      this.registration = await navigator.serviceWorker.register(swPath)
      console.log('Service Worker registered:', this.registration)

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready

    } catch (error) {
      console.error('Service Worker registration failed:', error)
      throw error
    }
  }

  // ================================================
  // FIREBASE INITIALIZATION
  // ================================================

  private async initializeFirebase(): Promise<void> {
    try {
      // Dynamically import Firebase
      const { initializeApp } = await import('firebase/app')
      const { getMessaging, getToken, onMessage } = await import('firebase/messaging')

      // Initialize Firebase app
      const app = initializeApp(FIREBASE_CONFIG)

      // Initialize Firebase Cloud Messaging
      this.messaging = getMessaging(app)

      console.log('Firebase initialized')

    } catch (error) {
      console.error('Error initializing Firebase:', error)
      throw error
    }
  }

  // ================================================
  // FCM TOKEN MANAGEMENT
  // ================================================

  private async getFCMToken(): Promise<void> {
    if (!this.messaging || !this.registration) {
      throw new Error('Firebase or Service Worker not initialized')
    }

    try {
      const { getToken } = await import('firebase/messaging')
      
      this.fcmToken = await getToken(this.messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: this.registration
      })

      if (this.fcmToken) {
        console.log('FCM Token obtained:', this.fcmToken.substring(0, 20) + '...')
      } else {
        console.warn('No FCM token available')
      }

    } catch (error) {
      console.error('Error getting FCM token:', error)
      throw error
    }
  }

  private async saveTokenToDatabase(): Promise<void> {
    if (!this.fcmToken || !this.userId) return

    try {
      // Check if token already exists
      const { data: existingToken } = await this.supabase
        .from('fcm_tokens')
        .select('id')
        .eq('token', this.fcmToken)
        .single()

      if (existingToken) {
        // Update last used
        await this.supabase
          .from('fcm_tokens')
          .update({ 
            last_used_at: new Date().toISOString(),
            is_active: true 
          })
          .eq('id', existingToken.id)
      } else {
        // Insert new token
        await this.supabase
          .from('fcm_tokens')
          .insert({
            user_id: this.userId,
            token: this.fcmToken,
            device_type: 'web',
            device_info: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              language: navigator.language
            }
          })
      }

      console.log('FCM token saved to database')

    } catch (error) {
      console.error('Error saving FCM token:', error)
    }
  }

  // ================================================
  // MESSAGE LISTENERS
  // ================================================

  private setupMessageListeners(): void {
    if (!this.messaging) return

    import('firebase/messaging').then(({ onMessage }) => {
      // Handle foreground messages
      onMessage(this.messaging, (payload) => {
        console.log('Foreground message received:', payload)
        this.handleForegroundMessage(payload)
      })
    })

    // Handle background messages (via service worker)
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('Background message received:', event.data)
      this.handleBackgroundMessage(event.data)
    })
  }

  private handleForegroundMessage(payload: any): void {
    // Parse the payload
    const { notification, data } = payload

    // Check if we should show notification in foreground
    if (!this.shouldShowInForeground(data?.type)) return

    // Create and show notification
    this.showLocalNotification({
      title: notification?.title || 'FitDuel',
      message: notification?.body || '',
      type: data?.type || 'system',
      icon: notification?.icon,
      image: notification?.image,
      actionUrl: data?.actionUrl,
      data: data
    })

    // Play sound if enabled
    this.playNotificationSound(data?.type)

    // Trigger vibration if enabled
    this.triggerVibration()

    // Update UI (dispatch event for React components to listen)
    this.dispatchNotificationEvent(payload)
  }

  private handleBackgroundMessage(data: any): void {
    // Update badge count
    this.updateBadgeCount()

    // Dispatch event for UI updates
    this.dispatchNotificationEvent(data)
  }

  // ================================================
  // LOCAL NOTIFICATIONS
  // ================================================

  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    if (!this.registration) return

    const { title, message, icon, badge, image, actionUrl, data, requireInteraction } = payload

    // Create options object without image first
    const options: NotificationOptions = {
      body: message,
      icon: icon || '/icons/icon-192x192.png',
      badge: badge || '/icons/badge-72x72.png',
      tag: data?.tag || `notification-${Date.now()}`,
      requireInteraction: requireInteraction || false,
      silent: payload.silent || false,
      data: {
        ...data,
        actionUrl,
        timestamp: Date.now()
      },
      actions: this.getNotificationActions(payload.type),
      vibrate: [200, 100, 200]
    }

    // Add image property if provided (using type assertion to avoid TypeScript error)
    if (image) {
      (options as ExtendedNotificationOptions).image = image
    }

    try {
      await this.registration.showNotification(title, options)
    } catch (error) {
      console.error('Error showing notification:', error)
    }
  }

  private getNotificationActions(type: NotificationType): NotificationAction[] {
    switch (type) {
      case 'duel_challenge':
        return [
          { action: 'accept', title: 'Accetta' },
          { action: 'decline', title: 'Rifiuta' }
        ]
      case 'friend_request':
        return [
          { action: 'accept', title: 'Accetta' },
          { action: 'ignore', title: 'Ignora' }
        ]
      case 'mission_available':
        return [
          { action: 'view', title: 'Visualizza' },
          { action: 'later', title: 'Più tardi' }
        ]
      default:
        return [
          { action: 'view', title: 'Visualizza' }
        ]
    }
  }

  // ================================================
  // PREFERENCES
  // ================================================

  async loadPreferences(): Promise<NotificationPreferences | null> {
    if (!this.userId) return null

    try {
      const { data } = await this.supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', this.userId)
        .single()

      return data

    } catch (error) {
      console.error('Error loading preferences:', error)
      return null
    }
  }

  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    if (!this.userId) return

    try {
      await this.supabase
        .from('notification_preferences')
        .upsert({
          user_id: this.userId,
          ...preferences,
          updated_at: new Date().toISOString()
        })

      console.log('Preferences updated')

    } catch (error) {
      console.error('Error updating preferences:', error)
    }
  }

  private async shouldShowInForeground(type: NotificationType): Promise<boolean> {
    const prefs = await this.loadPreferences()
    if (!prefs?.push_enabled) return false

    // Check quiet hours
    if (prefs.quiet_hours_enabled) {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      
      if (currentTime >= prefs.quiet_hours_start || currentTime <= prefs.quiet_hours_end) {
        return false
      }
    }

    // Check type-specific preferences
    switch (type) {
      case 'duel_challenge':
      case 'duel_accepted':
      case 'duel_completed':
        return prefs.push_duels
      case 'mission_available':
      case 'mission_completed':
        return prefs.push_missions
      case 'achievement_unlocked':
      case 'level_up':
        return prefs.push_achievements
      case 'friend_request':
      case 'team_invite':
        return prefs.push_social
      case 'streak_warning':
        return prefs.push_streaks
      default:
        return true
    }
  }

  // ================================================
  // UTILITY FUNCTIONS
  // ================================================

  private playNotificationSound(type?: NotificationType): void {
    try {
      const audio = new Audio('/sounds/notification.mp3')
      audio.volume = 0.5
      audio.play().catch(e => console.log('Could not play sound:', e))
    } catch (error) {
      console.log('Error playing sound:', error)
    }
  }

  private triggerVibration(): void {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200])
    }
  }

  private updateBadgeCount(): void {
    if ('setAppBadge' in navigator) {
      // Get unread count from database and update badge
      this.getUnreadCount().then(count => {
        (navigator as any).setAppBadge(count)
      })
    }
  }

  private async getUnreadCount(): Promise<number> {
    if (!this.userId) return 0

    try {
      const { count } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .eq('is_read', false)

      return count || 0

    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  private dispatchNotificationEvent(data: any): void {
    const event = new CustomEvent('fitduel:notification', {
      detail: data
    })
    window.dispatchEvent(event)
  }

  // ================================================
  // PUBLIC API
  // ================================================

  async sendTestNotification(): Promise<void> {
    await this.showLocalNotification({
      title: '🎯 Test Notification',
      message: 'Le notifiche push sono attive!',
      type: 'system',
      requireInteraction: true
    })
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await this.supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      this.updateBadgeCount()

    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  async markAllAsRead(): Promise<void> {
    if (!this.userId) return

    try {
      await this.supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', this.userId)
        .eq('is_read', false)

      this.updateBadgeCount()

    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      this.updateBadgeCount()

    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  // Clean up
  async cleanup(): Promise<void> {
    if (this.fcmToken && this.userId) {
      try {
        await this.supabase
          .from('fcm_tokens')
          .update({ is_active: false })
          .eq('token', this.fcmToken)
      } catch (error) {
        console.error('Error cleaning up:', error)
      }
    }
  }

  // Get all notifications
  async getNotifications(limit = 20): Promise<any[]> {
    if (!this.userId) return []

    try {
      const { data } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      return data || []

    } catch (error) {
      console.error('Error getting notifications:', error)
      return []
    }
  }

  // Subscribe to realtime notifications
  subscribeToNotifications(callback: (notification: any) => void): any {
    if (!this.userId) return null

    const subscription = this.supabase
      .channel(`notifications:${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${this.userId}`
        },
        (payload) => {
          console.log('New notification:', payload.new)
          
          // Show local notification
          const notif = payload.new as any
          this.showLocalNotification({
            title: notif.title,
            message: notif.message,
            type: notif.type,
            icon: notif.icon,
            actionUrl: notif.action_url,
            data: notif.metadata
          })
          
          // Play sound
          this.playNotificationSound(notif.type)
          
          // Update badge
          this.updateBadgeCount()
          
          // Call callback
          callback(notif)
        }
      )
      .subscribe()

    return subscription
  }

  // Unsubscribe from notifications
  unsubscribeFromNotifications(subscription: any): void {
    if (subscription) {
      this.supabase.removeChannel(subscription)
    }
  }
}

// ================================================
// SINGLETON EXPORT
// ================================================

const pushNotificationService = new PushNotificationService()
export default pushNotificationService

// ================================================
// REACT HOOK
// ================================================

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Check support
    const supported = 'serviceWorker' in navigator && 
                     'PushManager' in window && 
                     'Notification' in window
    setIsSupported(supported)

    // Check permission
    if (supported) {
      setPermission(Notification.permission)
    }
  }, [])

  const initialize = async (userId: string) => {
    if (!isSupported) {
      console.warn('Push notifications not supported')
      return false
    }

    const result = await pushNotificationService.initialize(userId)
    setIsInitialized(result)
    setPermission(Notification.permission)
    return result
  }

  const requestPermission = async () => {
    if (!isSupported) return 'denied'
    
    const perm = await Notification.requestPermission()
    setPermission(perm)
    return perm
  }

  const sendTest = async () => {
    await pushNotificationService.sendTestNotification()
  }

  return {
    isSupported,
    permission,
    isInitialized,
    initialize,
    requestPermission,
    sendTest,
    service: pushNotificationService
  }
}

// ================================================
// USAGE EXAMPLE
// ================================================
/*
// In your component:
import { usePushNotifications } from '@/lib/services/pushNotificationService'

function MyComponent() {
  const { initialize, sendTest, permission } = usePushNotifications()
  const { user } = useUserStore()

  useEffect(() => {
    if (user?.id) {
      initialize(user.id)
    }
  }, [user])

  return (
    <div>
      <p>Permission: {permission}</p>
      <button onClick={sendTest}>Test Notification</button>
    </div>
  )
}
*/