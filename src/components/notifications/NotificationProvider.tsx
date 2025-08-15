'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AnimatePresence, motion } from 'framer-motion'
import { 
  Bell, X, Check, AlertCircle, Trophy, Swords, Users, 
  Calendar, TrendingUp, MessageCircle, Volume2, VolumeX,
  ChevronRight, Trash2, CheckCheck, Sparkles
} from 'lucide-react'
import { cn } from '@/utils/cn'

// ====================================
// TYPES
// ====================================
interface Notification {
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

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  soundEnabled: boolean
  toggleSound: () => void
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  clearAll: () => Promise<void>
  refresh: () => Promise<void>
}

// ====================================
// NOTIFICATION CONTEXT
// ====================================
const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// ====================================
// NOTIFICATION PROVIDER
// ====================================
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const channelRef = useRef<any>(null)

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3')
    audioRef.current.volume = 0.5
  }, [])

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
      } else {
        // Check localStorage for demo user
        const savedUser = localStorage.getItem('fitduel_user')
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser))
        }
      }
    }
    getUser()
  }, [])

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!currentUser?.id) return

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.is_read).length)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentUser, supabase])

  // Setup realtime subscription
  useEffect(() => {
    if (!currentUser?.id) return

    // Load initial notifications
    loadNotifications()

    // Setup realtime channel
    channelRef.current = supabase
      .channel(`notifications:${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification
          
          // Add to state
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + 1)
          
          // Play sound
          if (soundEnabled && audioRef.current) {
            audioRef.current.play().catch(console.error)
          }
          
          // Show toast
          showToast(newNotification)
          
          // Show browser notification
          showBrowserNotification(newNotification)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          const updated = payload.new as Notification
          setNotifications(prev => 
            prev.map(n => n.id === updated.id ? updated : n)
          )
          setUnreadCount(prev => {
            const wasUnread = notifications.find(n => n.id === updated.id)?.is_read === false
            const isNowRead = updated.is_read
            if (wasUnread && isNowRead) return Math.max(0, prev - 1)
            return prev
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          const deleted = payload.old as Notification
          setNotifications(prev => prev.filter(n => n.id !== deleted.id))
          if (!deleted.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [currentUser, soundEnabled, supabase, loadNotifications])

  // Toggle sound
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev)
    localStorage.setItem('fitduel_sound', (!soundEnabled).toString())
  }, [soundEnabled])

  // Mark as read
  const markAsRead = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }, [supabase])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!currentUser?.id) return

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', currentUser.id)
      .eq('is_read', false)

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    }
  }, [currentUser, supabase])

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id))
      const wasUnread = notifications.find(n => n.id === id)?.is_read === false
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    }
  }, [supabase, notifications])

  // Clear all
  const clearAll = useCallback(async () => {
    if (!currentUser?.id) return

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', currentUser.id)

    if (!error) {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [currentUser, supabase])

  // Refresh
  const refresh = useCallback(async () => {
    await loadNotifications()
  }, [loadNotifications])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        soundEnabled,
        toggleSound,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        refresh
      }}
    >
      {children}
      <NotificationToastContainer />
    </NotificationContext.Provider>
  )
}

// ====================================
// USE NOTIFICATIONS HOOK
// ====================================
export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

// ====================================
// NOTIFICATION BADGE COMPONENT
// ====================================
export function NotificationBadge({ className }: { className?: string }) {
  const { unreadCount } = useNotifications()
  const [showDropdown, setShowDropdown] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={cn(
          "relative p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all",
          className
        )}
      >
        <Bell className="w-5 h-5 text-gray-300" />
        
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 rounded-full flex items-center justify-center"
          >
            <span className="text-xs font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {showDropdown && (
          <NotificationDropdown onClose={() => setShowDropdown(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

// ====================================
// NOTIFICATION DROPDOWN
// ====================================
function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const { 
    notifications, 
    soundEnabled, 
    toggleSound, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    clearAll 
  } = useNotifications()

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />

      {/* Dropdown */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute right-0 mt-2 w-96 max-h-[600px] bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Notifiche</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSound}
                className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-gray-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <button
                onClick={markAllAsRead}
                className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <CheckCheck className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={clearAll}
                className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[500px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nessuna notifica</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={() => markAsRead(notification.id)}
                  onDelete={() => deleteNotification(notification.id)}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}

// ====================================
// NOTIFICATION ITEM
// ====================================
function NotificationItem({ 
  notification, 
  onRead, 
  onDelete 
}: { 
  notification: Notification
  onRead: () => void
  onDelete: () => void
}) {
  const getIcon = () => {
    switch (notification.type) {
      case 'challenge': return <Swords className="w-5 h-5" />
      case 'achievement': return <Trophy className="w-5 h-5" />
      case 'level_up': return <TrendingUp className="w-5 h-5" />
      case 'friend_request': return <Users className="w-5 h-5" />
      case 'tournament': return <Trophy className="w-5 h-5" />
      case 'daily_reset': return <Calendar className="w-5 h-5" />
      case 'duel_result': return <Swords className="w-5 h-5" />
      default: return <Bell className="w-5 h-5" />
    }
  }

  const getIconColor = () => {
    switch (notification.type) {
      case 'challenge': return 'text-red-500'
      case 'achievement': return 'text-yellow-500'
      case 'level_up': return 'text-purple-500'
      case 'friend_request': return 'text-blue-500'
      case 'tournament': return 'text-orange-500'
      case 'daily_reset': return 'text-green-500'
      case 'duel_result': return 'text-indigo-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "p-4 hover:bg-gray-800/50 transition-all cursor-pointer group",
        !notification.is_read && "bg-indigo-500/5"
      )}
      onClick={onRead}
    >
      <div className="flex gap-3">
        <div className={cn("mt-0.5", getIconColor())}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={cn(
                "font-semibold text-sm",
                !notification.is_read ? "text-white" : "text-gray-300"
              )}>
                {notification.title}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {notification.message}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {formatTimeAgo(notification.created_at)}
              </p>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {!notification.is_read && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-500 rounded-full" />
      )}
    </motion.div>
  )
}

// ====================================
// TOAST CONTAINER
// ====================================
const toastQueue: Notification[] = []
let isShowingToast = false

function NotificationToastContainer() {
  const [currentToast, setCurrentToast] = useState<Notification | null>(null)

  useEffect(() => {
    const showNextToast = () => {
      if (toastQueue.length > 0 && !isShowingToast) {
        const next = toastQueue.shift()
        if (next) {
          isShowingToast = true
          setCurrentToast(next)
          
          setTimeout(() => {
            setCurrentToast(null)
            isShowingToast = false
            showNextToast()
          }, 5000)
        }
      }
    }

    const handleNewToast = (event: CustomEvent<Notification>) => {
      toastQueue.push(event.detail)
      showNextToast()
    }

    window.addEventListener('show-toast' as any, handleNewToast)
    return () => {
      window.removeEventListener('show-toast' as any, handleNewToast)
    }
  }, [])

  return (
    <AnimatePresence>
      {currentToast && (
        <NotificationToast
          notification={currentToast}
          onClose={() => {
            setCurrentToast(null)
            isShowingToast = false
          }}
        />
      )}
    </AnimatePresence>
  )
}

// ====================================
// NOTIFICATION TOAST
// ====================================
function NotificationToast({ 
  notification, 
  onClose 
}: { 
  notification: Notification
  onClose: () => void
}) {
  const getIcon = () => {
    switch (notification.type) {
      case 'challenge': return <Swords className="w-5 h-5 text-red-500" />
      case 'achievement': return <Trophy className="w-5 h-5 text-yellow-500" />
      case 'level_up': return <Sparkles className="w-5 h-5 text-purple-500" />
      default: return <Bell className="w-5 h-5 text-indigo-500" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className="fixed bottom-4 right-4 z-50 max-w-sm"
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          {getIcon()}
          
          <div className="flex-1">
            <p className="font-semibold text-white">
              {notification.title}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {notification.message}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {notification.action_url && (
          <a
            href={notification.action_url}
            className="mt-3 flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
          >
            Vai <ChevronRight className="w-3 h-3" />
          </a>
        )}
      </div>
    </motion.div>
  )
}

// ====================================
// UTILS
// ====================================
function showToast(notification: Notification) {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: notification }))
}

function showBrowserNotification(notification: Notification) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const browserNotif = new Notification(notification.title, {
    body: notification.message,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: notification.id,
    requireInteraction: notification.priority === 'high',
    silent: notification.priority === 'low'
  })

  browserNotif.onclick = () => {
    window.focus()
    if (notification.action_url) {
      window.location.href = notification.action_url
    }
    browserNotif.close()
  }

  if (notification.priority !== 'high') {
    setTimeout(() => browserNotif.close(), 10000)
  }
}

function formatTimeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  
  if (seconds < 60) return 'ora'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m fa`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h fa`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}g fa`
  
  return new Date(date).toLocaleDateString('it-IT', { 
    day: 'numeric', 
    month: 'short' 
  })
}

// ====================================
// EXPORTS
// ====================================
export {
  NotificationContext,
  NotificationToast,
  NotificationDropdown,
  NotificationItem,
  showToast,
  showBrowserNotification,
  formatTimeAgo
}