'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, X, Check, Trash2, ChevronRight,
  Swords, Target, Trophy, Users, Flame,
  Star, TrendingUp, MessageCircle, Settings,
  Clock, AlertCircle
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUserStore } from '@/stores/useUserStore'
import Link from 'next/link'

// ================================================
// TYPES
// ================================================

interface Notification {
  id: string
  title: string
  message: string
  type: string
  icon?: string
  action_url?: string
  is_read: boolean
  created_at: string
  metadata?: any
}

// ================================================
// NOTIFICATION BELL COMPONENT
// ================================================

export function NotificationBell() {
  const supabase = createClientComponentClient()
  const { user } = useUserStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLButtonElement>(null)

  // ================================================
  // LOAD NOTIFICATIONS
  // ================================================

  useEffect(() => {
    if (user?.id) {
      loadNotifications()
      subscribeToNotifications()
    }
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadNotifications = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (data && !error) {
        setNotifications(data)
        const unread = data.filter(n => !n.is_read).length
        setUnreadCount(unread)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToNotifications = () => {
    if (!user?.id) return

    const subscription = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New notification:', payload.new)
          
          // Add new notification to the list
          const newNotif = payload.new as Notification
          setNotifications(prev => [newNotif, ...prev].slice(0, 10))
          setUnreadCount(prev => prev + 1)
          
          // Play sound
          playNotificationSound()
          
          // Show browser notification if permission granted
          if (Notification.permission === 'granted') {
            showBrowserNotification(newNotif)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }

  // ================================================
  // ACTIONS
  // ================================================

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user?.id) return

    try {
      await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_read', false)

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      const notif = notifications.find(n => n.id === notificationId)
      if (notif && !notif.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  // ================================================
  // UTILITIES
  // ================================================

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {})
    } catch (error) {
      console.log('Could not play sound')
    }
  }

  const showBrowserNotification = (notif: Notification) => {
    if (!('Notification' in window)) return

    const notification = new Notification(notif.title, {
      body: notif.message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: notif.id,
      requireInteraction: false
    })

    notification.onclick = () => {
      window.focus()
      if (notif.action_url) {
        window.location.href = notif.action_url
      }
      notification.close()
    }
  }

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, any> = {
      'duel_challenge': Swords,
      'duel_accepted': Swords,
      'duel_completed': Trophy,
      'mission_available': Target,
      'mission_completed': Check,
      'achievement_unlocked': Star,
      'friend_request': Users,
      'team_invite': Users,
      'streak_warning': Flame,
      'level_up': TrendingUp,
      'leaderboard_update': Trophy,
      'system': Bell
    }
    return icons[type] || Bell
  }

  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      'duel_challenge': 'text-red-500',
      'duel_accepted': 'text-blue-500',
      'duel_completed': 'text-yellow-500',
      'mission_available': 'text-purple-500',
      'mission_completed': 'text-green-500',
      'achievement_unlocked': 'text-yellow-500',
      'friend_request': 'text-blue-500',
      'team_invite': 'text-indigo-500',
      'streak_warning': 'text-orange-500',
      'level_up': 'text-green-500',
      'leaderboard_update': 'text-yellow-500',
      'system': 'text-gray-400'
    }
    return colors[type] || 'text-gray-400'
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Ora'
    if (minutes < 60) return `${minutes}m fa`
    if (hours < 24) return `${hours}h fa`
    if (days < 7) return `${days}g fa`
    
    return date.toLocaleDateString('it-IT')
  }

  // ================================================
  // RENDER
  // ================================================

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={bellRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors"
        aria-label="Notifiche"
      >
        <Bell className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
        
        {/* Badge */}
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
        
        {/* Pulse animation for new notifications */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-96 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-yellow-500" />
                  Notifiche
                  {unreadCount > 0 && (
                    <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
                      {unreadCount} nuove
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Segna tutte come lette
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
                  </div>
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y divide-gray-800">
                  {notifications.map((notif) => {
                    const Icon = getNotificationIcon(notif.type)
                    const color = getNotificationColor(notif.type)
                    
                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className={cn(
                          "p-4 hover:bg-gray-800/50 transition-colors cursor-pointer group",
                          !notif.is_read && "bg-gray-800/30"
                        )}
                        onClick={() => {
                          if (!notif.is_read) markAsRead(notif.id)
                          if (notif.action_url) {
                            window.location.href = notif.action_url
                            setIsOpen(false)
                          }
                        }}
                      >
                        <div className="flex gap-3">
                          {/* Icon */}
                          <div className={cn("mt-1", color)}>
                            <Icon className="w-5 h-5" />
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className={cn(
                                  "font-medium text-sm",
                                  notif.is_read ? "text-gray-300" : "text-white"
                                )}>
                                  {notif.title}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {notif.message}
                                </p>
                              </div>
                              
                              {/* Time */}
                              <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                                {formatTime(notif.created_at)}
                              </span>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center justify-between mt-2">
                              {notif.action_url && (
                                <Link
                                  href={notif.action_url}
                                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Visualizza
                                  <ChevronRight className="w-3 h-3" />
                                </Link>
                              )}
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNotification(notif.id)
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Unread indicator */}
                          {!notif.is_read && (
                            <div className="mt-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-400">Nessuna notifica</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Le tue notifiche appariranno qui
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
                <Link
                  href="/notifications"
                  className="text-sm text-center text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1"
                  onClick={() => setIsOpen(false)}
                >
                  Vedi tutte le notifiche
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ================================================
// NOTIFICATION PERMISSION PROMPT
// ================================================

export function NotificationPermissionPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
      
      // Show prompt after 30 seconds if permission not granted
      if (Notification.permission === 'default') {
        const timer = setTimeout(() => setShowPrompt(true), 30000)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) return

    const result = await Notification.requestPermission()
    setPermission(result)
    setShowPrompt(false)
  }

  if (!showPrompt || permission !== 'default') return null

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 z-50"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-yellow-500/20 rounded-lg">
          <Bell className="w-6 h-6 text-yellow-500" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-white mb-1">Attiva le notifiche</h4>
          <p className="text-sm text-gray-400 mb-3">
            Ricevi notifiche per sfide, missioni e aggiornamenti importanti
          </p>
          <div className="flex gap-2">
            <Button
              onClick={requestPermission}
              variant="primary"
              size="sm"
            >
              Attiva
            </Button>
            <Button
              onClick={() => setShowPrompt(false)}
              variant="ghost"
              size="sm"
            >
              Più tardi
            </Button>
          </div>
        </div>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-gray-500 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}