import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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

export interface NotificationPreferences {
  push_enabled: boolean
  email_enabled: boolean
  in_app_enabled: boolean
  sound_enabled: boolean
  vibration_enabled: boolean
  notification_types: {
    challenges: boolean
    achievements: boolean
    level_ups: boolean
    friend_requests: boolean
    tournament_updates: boolean
    daily_resets: boolean
    system_messages: boolean
  }
}

// ====================================
// NOTIFICATION SERVICE CLASS
// ====================================
export class NotificationService {
  private supabase = createClientComponentClient()
  private userId: string | null = null
  private subscription: any = null
  private audioContext: AudioContext | null = null
  private notificationSound: AudioBuffer | null = null

  constructor() {
    this.initializeAudio()
  }

  // Initialize audio for notification sounds
  private async initializeAudio() {
    if (typeof window === 'undefined') return
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      // Load notification sound (you'll need to add this file)
      const response = await fetch('/sounds/notification.mp3')
      const arrayBuffer = await response.arrayBuffer()
      this.notificationSound = await this.audioContext.decodeAudioData(arrayBuffer)
    } catch (error) {
      console.error('Failed to initialize audio:', error)
    }
  }

  // Set current user
  async setUser(userId: string) {
    this.userId = userId
    await this.subscribeToRealtime()
  }

  // Clear user and unsubscribe
  async clearUser() {
    this.userId = null
    await this.unsubscribeFromRealtime()
  }

  // ====================================
  // FETCH NOTIFICATIONS
  // ====================================
  async fetchNotifications(options: {
    unreadOnly?: boolean
    limit?: number
    offset?: number
    type?: Notification['type']
  } = {}) {
    if (!this.userId) throw new Error('User not set')

    const params = new URLSearchParams({
      userId: this.userId,
      unreadOnly: (options.unreadOnly || false).toString(),
      limit: (options.limit || 50).toString(),
      offset: (options.offset || 0).toString()
    })

    if (options.type) {
      params.append('type', options.type)
    }

    const response = await fetch(`/api/notifications?${params}`)
    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch notifications')
    }

    return result.data
  }

  // ====================================
  // CREATE NOTIFICATION
  // ====================================
  async createNotification(data: {
    type: Notification['type']
    title: string
    message: string
    metadata?: Record<string, any>
    actionUrl?: string
    priority?: Notification['priority']
    icon?: string
    expiresAt?: string
  }) {
    if (!this.userId) throw new Error('User not set')

    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        userId: this.userId,
        ...data
      })
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message || 'Failed to create notification')
    }

    return result.data
  }

  // ====================================
  // MARK AS READ
  // ====================================
  async markAsRead(notificationId: string) {
    if (!this.userId) throw new Error('User not set')

    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'mark_read',
        notificationId,
        userId: this.userId
      })
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message || 'Failed to mark as read')
    }

    return result.data
  }

  // ====================================
  // MARK ALL AS READ
  // ====================================
  async markAllAsRead() {
    if (!this.userId) throw new Error('User not set')

    const response = await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'mark_all_read',
        userId: this.userId
      })
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message || 'Failed to mark all as read')
    }

    return result.success
  }

  // ====================================
  // DELETE NOTIFICATION
  // ====================================
  async deleteNotification(notificationId: string) {
    if (!this.userId) throw new Error('User not set')

    const params = new URLSearchParams({
      id: notificationId,
      userId: this.userId
    })

    const response = await fetch(`/api/notifications?${params}`, {
      method: 'DELETE'
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message || 'Failed to delete notification')
    }

    return result.success
  }

  // ====================================
  // CLEAN UP OLD NOTIFICATIONS
  // ====================================
  async cleanupOldNotifications() {
    if (!this.userId) throw new Error('User not set')

    const response = await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete_read',
        userId: this.userId
      })
    })

    const result = await response.json()
    return result.success
  }

  // ====================================
  // REALTIME SUBSCRIPTIONS
  // ====================================
  private async subscribeToRealtime() {
    if (!this.userId) return

    // Subscribe to notification inserts for this user
    this.subscription = this.supabase
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
          this.handleNewNotification(payload.new as Notification)
        }
      )
      .subscribe()
  }

  private async unsubscribeFromRealtime() {
    if (this.subscription) {
      await this.supabase.removeChannel(this.subscription)
      this.subscription = null
    }
  }

  // ====================================
  // HANDLE NEW NOTIFICATION
  // ====================================
  private handleNewNotification(notification: Notification) {
    // Play sound if enabled
    this.playNotificationSound()

    // Show browser notification if permitted
    this.showBrowserNotification(notification)

    // Trigger custom event for UI updates
    window.dispatchEvent(new CustomEvent('new-notification', { 
      detail: notification 
    }))
  }

  // ====================================
  // BROWSER NOTIFICATIONS
  // ====================================
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  private showBrowserNotification(notification: Notification) {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const browserNotif = new Notification(notification.title, {
      body: notification.message,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: notification.id,
      requireInteraction: notification.priority === 'high',
      silent: notification.priority === 'low',
      data: {
        actionUrl: notification.action_url
      }
    })

    browserNotif.onclick = () => {
      window.focus()
      if (notification.action_url) {
        window.location.href = notification.action_url
      }
      browserNotif.close()
    }

    // Auto close after 10 seconds for non-high priority
    if (notification.priority !== 'high') {
      setTimeout(() => browserNotif.close(), 10000)
    }
  }

  // ====================================
  // NOTIFICATION SOUND
  // ====================================
  private playNotificationSound() {
    if (!this.audioContext || !this.notificationSound) return

    try {
      const source = this.audioContext.createBufferSource()
      source.buffer = this.notificationSound
      source.connect(this.audioContext.destination)
      source.start()
    } catch (error) {
      console.error('Failed to play notification sound:', error)
    }
  }

  // ====================================
  // NOTIFICATION TEMPLATES
  // ====================================
  static createChallengeNotification(data: {
    challengerName: string
    exercise: string
    duelId: string
  }): Omit<Notification, 'id' | 'user_id' | 'created_at' | 'is_read'> {
    return {
      type: 'challenge',
      title: `⚔️ Nuova sfida da ${data.challengerName}!`,
      message: `Sei stato sfidato a ${data.exercise}. Accetta la sfida!`,
      priority: 'normal',
      action_url: `/duel/${data.duelId}`,
      icon: '⚔️',
      metadata: {
        challenger_name: data.challengerName,
        exercise: data.exercise,
        duel_id: data.duelId
      }
    }
  }

  static createAchievementNotification(data: {
    achievementName: string
    xpReward: number
    coinReward?: number
  }): Omit<Notification, 'id' | 'user_id' | 'created_at' | 'is_read'> {
    return {
      type: 'achievement',
      title: `🏅 Achievement Sbloccato!`,
      message: `Hai completato "${data.achievementName}"! +${data.xpReward} XP${data.coinReward ? ` +${data.coinReward} Coins` : ''}`,
      priority: 'high',
      action_url: '/achievements',
      icon: '🏅',
      metadata: {
        achievement_name: data.achievementName,
        xp_reward: data.xpReward,
        coin_reward: data.coinReward
      }
    }
  }

  static createLevelUpNotification(data: {
    newLevel: number
    newRank?: string
    rewards?: { xp?: number; coins?: number }
  }): Omit<Notification, 'id' | 'user_id' | 'created_at' | 'is_read'> {
    return {
      type: 'level_up',
      title: `⚡ Level ${data.newLevel} Raggiunto!`,
      message: `Complimenti! ${data.newRank ? `Nuovo rank: ${data.newRank}. ` : ''}${data.rewards ? `Ricompense: +${data.rewards.xp || 0} XP, +${data.rewards.coins || 0} Coins` : ''}`,
      priority: 'high',
      action_url: '/profile',
      icon: '⚡',
      metadata: {
        new_level: data.newLevel,
        new_rank: data.newRank,
        rewards: data.rewards
      }
    }
  }

  static createTournamentNotification(data: {
    position: number
    change: 'up' | 'down' | 'same'
    pointsToNext?: number
  }): Omit<Notification, 'id' | 'user_id' | 'created_at' | 'is_read'> {
    const icon = data.change === 'up' ? '📈' : data.change === 'down' ? '📉' : '➡️'
    const changeText = data.change === 'up' ? 'Sei salito' : data.change === 'down' ? 'Sei sceso' : 'Mantieni'
    
    return {
      type: 'tournament',
      title: `🏆 Aggiornamento Torneo`,
      message: `${changeText} al ${data.position}° posto! ${data.pointsToNext ? `Ancora ${data.pointsToNext} punti per salire.` : ''}`,
      priority: data.position <= 3 ? 'high' : 'normal',
      action_url: '/tournament',
      icon: icon,
      metadata: {
        position: data.position,
        change: data.change,
        points_to_next: data.pointsToNext
      }
    }
  }

  static createDailyResetNotification(data: {
    newChallenges: number
    bonusXP?: number
  }): Omit<Notification, 'id' | 'user_id' | 'created_at' | 'is_read'> {
    return {
      type: 'daily_reset',
      title: `🌅 Nuove Sfide Giornaliere!`,
      message: `${data.newChallenges} nuove sfide ti aspettano! ${data.bonusXP ? `Bonus completamento: +${data.bonusXP} XP` : ''}`,
      priority: 'normal',
      action_url: '/dashboard#daily-challenges',
      icon: '🌅',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        new_challenges: data.newChallenges,
        bonus_xp: data.bonusXP
      }
    }
  }

  static createDuelResultNotification(data: {
    opponentName: string
    result: 'win' | 'loss' | 'draw'
    xpGained: number
    coinsGained?: number
    duelId: string
  }): Omit<Notification, 'id' | 'user_id' | 'created_at' | 'is_read'> {
    const emoji = data.result === 'win' ? '🎉' : data.result === 'loss' ? '😔' : '🤝'
    const resultText = data.result === 'win' ? 'Hai vinto' : data.result === 'loss' ? 'Hai perso' : 'Pareggio'
    
    return {
      type: 'duel_result',
      title: `${emoji} ${resultText} contro ${data.opponentName}!`,
      message: `+${data.xpGained} XP${data.coinsGained ? ` +${data.coinsGained} Coins` : ''}`,
      priority: data.result === 'win' ? 'high' : 'normal',
      action_url: `/duel/${data.duelId}`,
      icon: emoji,
      metadata: {
        opponent_name: data.opponentName,
        result: data.result,
        xp_gained: data.xpGained,
        coins_gained: data.coinsGained,
        duel_id: data.duelId
      }
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService()