'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Flame, Trophy, Zap, Users, Calendar, Bell, Plus, 
  TrendingUp, Medal, Star, Crown, Swords, Timer,
  BarChart3, Target, ChevronRight, Settings, LogOut,
  Activity, Coins, CheckCircle, ExternalLink, RefreshCw
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ====================================
// TYPES
// ====================================
interface User {
  id: string
  email: string
  username: string
  level: number
  xp: number
  coins: number
  avatar: string
}

interface Profile {
  id: string
  username: string
  display_name: string | null
  email: string
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

interface UserStats {
  user_id: string
  level: number
  total_xp: number
  coins: number
  daily_streak: number
  total_duels: number
  duels_won: number
}

interface DuelCardData {
  id: string
  opponent: string
  exercise: string
  status: 'active' | 'pending' | 'completed'
  myScore: number
  opponentScore: number
  timeLeft: string
  xpReward: number
}

interface Achievement {
  id: string
  name: string
  icon: string
  unlockedAt: string
}

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

// ====================================
// MOCK DATA
// ====================================
const MOCK_ACTIVE_DUELS: DuelCardData[] = [
  {
    id: '1',
    opponent: 'SpeedRunner',
    exercise: 'Push-Up',
    status: 'active',
    myScore: 45,
    opponentScore: 38,
    timeLeft: '2h 15m',
    xpReward: 150
  },
  {
    id: '2',
    opponent: 'FitGuru',
    exercise: 'Plank',
    status: 'pending',
    myScore: 0,
    opponentScore: 0,
    timeLeft: '5h 30m',
    xpReward: 200
  },
  {
    id: '3',
    opponent: 'IronWill',
    exercise: 'Squat',
    status: 'active',
    myScore: 62,
    opponentScore: 58,
    timeLeft: '45m',
    xpReward: 120
  }
]

const MOCK_LEADERBOARD = [
  { rank: 1, username: 'FitMaster', level: 25, xp: 6250, avatar: 'FM' },
  { rank: 2, username: 'IronWill', level: 22, xp: 4840, avatar: 'IW' },
  { rank: 3, username: 'SpeedDemon', level: 20, xp: 4000, avatar: 'SD' },
  { rank: 4, username: 'FlexGuru', level: 18, xp: 3240, avatar: 'FG' },
  { rank: 5, username: 'CardioKing', level: 16, xp: 2560, avatar: 'CK' }
]

const MOCK_RECENT_ACHIEVEMENTS: Achievement[] = [
  { id: '1', name: 'Prima Vittoria', icon: 'W', unlockedAt: '2 ore fa' },
  { id: '2', name: 'Streak di Fuoco', icon: 'F', unlockedAt: '1 giorno fa' },
  { id: '3', name: 'Forma Perfetta', icon: 'S', unlockedAt: '3 giorni fa' }
]

const MOCK_RECENT_ACTIVITY = [
  { action: 'Vittoria contro SpeedRunner', type: 'win', time: '30m fa', xp: 150 },
  { action: 'Achievement sbloccato: Streak Master', type: 'achievement', time: '2h fa', xp: 100 },
  { action: 'Sfida creata vs FitGuru', type: 'challenge', time: '4h fa', xp: 0 },
  { action: 'Livello 12 raggiunto!', type: 'levelup', time: '1g fa', xp: 200 }
]

// ====================================
// COMPONENTS
// ====================================
const XPBar = ({ currentXP, level }: { currentXP: number; level: number }) => {
  const xpForCurrentLevel = Math.pow(level - 1, 2) * 100
  const xpForNextLevel = Math.pow(level, 2) * 100
  const xpInCurrentLevel = currentXP - xpForCurrentLevel
  const xpNeededForCurrentLevel = xpForNextLevel - xpForCurrentLevel
  const progress = (xpInCurrentLevel / xpNeededForCurrentLevel) * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Level {level}</span>
        <span className="text-gray-400">{xpInCurrentLevel}/{xpNeededForCurrentLevel} XP</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

const DuelCard = ({ duel }: { duel: DuelCardData }) => {
  const router = useRouter()
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10'
      case 'pending': return 'text-yellow-400 bg-yellow-500/10'
      case 'completed': return 'text-blue-400 bg-blue-500/10'
      default: return 'text-gray-400 bg-gray-500/10'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'In corso'
      case 'pending': return 'In attesa'
      case 'completed': return 'Completata'
      default: return status
    }
  }

  const handleCardClick = () => {
    if (duel.status === 'active' || duel.status === 'completed') {
      router.push(`/duel/${duel.id}`)
    } else {
      router.push('/challenges')
    }
  }

  return (
    <Card 
      variant="glass" 
      className="p-4 hover:bg-gray-800/30 transition-all cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Swords className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-white">{duel.exercise}</p>
            <p className="text-sm text-gray-400">vs {duel.opponent}</p>
          </div>
        </div>
        <span className={cn('text-xs px-2 py-1 rounded-full', getStatusColor(duel.status))}>
          {getStatusLabel(duel.status)}
        </span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{duel.myScore}</p>
            <p className="text-xs text-gray-400">Tu</p>
          </div>
          <span className="text-gray-600">VS</span>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{duel.opponentScore}</p>
            <p className="text-xs text-gray-400">Avversario</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-yellow-500">+{duel.xpReward} XP</p>
          <p className="text-xs text-gray-400">{duel.timeLeft}</p>
        </div>
      </div>

      <Button 
        variant="gradient" 
        size="sm" 
        className="w-full"
        onClick={(e) => {
          e.stopPropagation()
          handleCardClick()
        }}
      >
        {duel.status === 'active' ? 'Continua' : 
         duel.status === 'pending' ? 'Accetta Sfida' : 'Visualizza'}
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </Card>
  )
}

const NotificationModal = ({ 
  isOpen, 
  onClose,
  userId 
}: { 
  isOpen: boolean
  onClose: () => void
  userId: string
}) => {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showOnlyUnread, setShowOnlyUnread] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications()
    }
  }, [isOpen, userId, showOnlyUnread])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        userId,
        unreadOnly: showOnlyUnread.toString()
      })

      const response = await fetch(`/api/notifications?${params}`)
      const result = await response.json()

      if (result.success && result.data) {
        setNotifications(result.data.notifications)
        setUnreadCount(result.data.unreadCount)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          notificationId,
          userId
        })
      })

      const result = await response.json()
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_all_read',
          userId
        })
      })

      const result = await response.json()
      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    if (notification.actionUrl) {
      onClose()
      router.push(notification.actionUrl)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'challenge': return 'ðŸŽ¯'
      case 'achievement': return 'ðŸ†'
      case 'level_up': return 'âš¡'
      case 'friend_request': return 'ðŸ'¥'
      case 'system': return 'ðŸ"¢'
      default: return 'ðŸ""'
    }
  }

  const formatTime = (date: string) => {
    const now = new Date()
    const notifDate = new Date(date)
    const diffMs = now.getTime() - notifDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} min fa`
    if (diffHours < 24) return `${diffHours} ore fa`
    if (diffDays < 7) return `${diffDays} giorni fa`
    return notifDate.toLocaleDateString('it-IT')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-xl p-6 max-w-md w-full max-h-[80vh] flex flex-col border border-gray-800"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Notifiche</h3>
            <p className="text-sm text-gray-400">
              {unreadCount > 0 ? `${unreadCount} non lette` : 'Tutte lette'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            âœ•
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            variant={!showOnlyUnread ? 'gradient' : 'secondary'}
            size="sm"
            onClick={() => setShowOnlyUnread(false)}
          >
            Tutte
          </Button>
          <Button
            variant={showOnlyUnread ? 'gradient' : 'secondary'}
            size="sm"
            onClick={() => setShowOnlyUnread(true)}
          >
            Non lette ({unreadCount})
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={markAllAsRead}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Segna tutte come lette
            </Button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Caricamento...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">
                {showOnlyUnread ? 'Nessuna notifica non letta' : 'Nessuna notifica'}
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <motion.button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  'w-full p-3 rounded-lg text-left transition-all',
                  'hover:bg-gray-700',
                  notification.isRead ? 'bg-gray-800/50' : 'bg-gray-800'
                )}
                whileHover={{ x: 4 }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        'text-sm font-medium',
                        notification.isRead ? 'text-gray-300' : 'text-white'
                      )}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1"></span>
                      )}
                    </div>
                    <p className={cn(
                      'text-xs mt-1',
                      notification.isRead ? 'text-gray-500' : 'text-gray-400'
                    )}>
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-gray-500">
                        {formatTime(notification.createdAt)}
                      </p>
                      {notification.actionUrl && (
                        <ExternalLink className="w-3 h-3 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-800">
          <Button variant="gradient" className="w-full" onClick={onClose}>
            Chiudi
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// ====================================
// MAIN COMPONENT
// ====================================
export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  // Load user from Supabase
  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      // Get current user from Supabase
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        // No Supabase user, check localStorage for demo user
        const savedUser = localStorage.getItem('fitduel_user')
        if (savedUser) {
          const userData = JSON.parse(savedUser)
          setUser({
            id: userData.id,
            email: userData.email || 'demo@fitduel.com',
            username: userData.username || 'User',
            level: userData.level || 1,
            xp: userData.xp || 0,
            coins: userData.coins || 0,
            avatar: userData.avatar || 'U1'
          })
          setLoading(false)
          return
        }
        
        // No user at all, redirect to login
        router.push('/login')
        return
      }
      
      // We have a Supabase user
      console.log('ðŸ'¤ User loggato:', authUser.email)
      
      // Get profile from database
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()
      
      if (profileData) {
        setProfile(profileData)
      }
      
      // Get user stats
      const { data: statsData } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', authUser.id)
        .single()
      
      if (statsData) {
        setStats(statsData)
      }
      
      // Set user data with proper defaults
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        username: profileData?.username || profileData?.display_name || authUser.email?.split('@')[0] || 'User',
        level: statsData?.level || 1,
        xp: statsData?.total_xp || 100,
        coins: statsData?.coins || 50,
        avatar: profileData?.avatar_url || 'U1'
      })
      
      // Check unread notifications count
      if (authUser.id) {
        checkUnreadNotifications(authUser.id)
      }
      
    } catch (error) {
      console.error('Error loading user:', error)
      // On error, check localStorage as fallback
      const savedUser = localStorage.getItem('fitduel_user')
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        setUser({
          id: userData.id,
          email: userData.email || 'demo@fitduel.com',
          username: userData.username || 'User',
          level: userData.level || 1,
          xp: userData.xp || 0,
          coins: userData.coins || 0,
          avatar: userData.avatar || 'U1'
        })
      } else {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const checkUnreadNotifications = async (userId: string) => {
    try {
      const params = new URLSearchParams({
        userId,
        unreadOnly: 'true'
      })

      const response = await fetch(`/api/notifications?${params}`)
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setUnreadNotifications(result.data.unreadCount)
        }
      }
    } catch (error) {
      console.error('Error checking notifications:', error)
    }
  }

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut()
      // Clear localStorage
      localStorage.removeItem('fitduel_user')
      // Redirect to login
      router.push('/login')
    } catch (error) {
      console.error('Error during logout:', error)
      // Force redirect anyway
      localStorage.removeItem('fitduel_user')
      router.push('/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Caricamento dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Calculate stats with proper defaults
  const winRate = stats ? Math.round((stats.duels_won / Math.max(stats.total_duels, 1)) * 100) : 78
  const totalDuels = stats?.total_duels || 0
  const currentStreak = stats?.daily_streak || 0
  
  // Ensure user level and xp are always numbers
  const userLevel = user.level || 1
  const userXP = user.xp || 0
  const userCoins = user.coins || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">FitDuel</h1>
                <p className="text-sm text-gray-400">Bentornato, {user.username}!</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Friends Button */}
              <Link href="/friends">
                <Button variant="ghost" size="sm">
                  <Users className="w-5 h-5" />
                  <span className="hidden md:inline ml-2">Amici</span>
                </Button>
              </Link>

              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowNotifications(true)}
                >
                  <Bell className="w-5 h-5" />
                </Button>
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold px-1">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </div>
              
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>

              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card variant="glass" className="p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{user.avatar}</span>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Ciao, {user.username}!</h2>
                      <p className="text-gray-400">Pronto per una nuova sfida?</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">Level {userLevel}</p>
                    <p className="text-sm text-gray-400">{userXP} XP totali</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <XPBar currentXP={userXP} level={userLevel} />
                </div>
              </Card>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid md:grid-cols-4 gap-4"
            >
              <Card variant="glass" className="p-4 text-center">
                <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{totalDuels}</p>
                <p className="text-sm text-gray-400">Duelli Totali</p>
              </Card>

              <Card variant="glass" className="p-4 text-center">
                <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{winRate}%</p>
                <p className="text-sm text-gray-400">Win Rate</p>
              </Card>

              <Card variant="glass" className="p-4 text-center">
                <Zap className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{currentStreak}</p>
                <p className="text-sm text-gray-400">Streak Attuale</p>
              </Card>

              <Card variant="glass" className="p-4 text-center">
                <Coins className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{userCoins}</p>
                <p className="text-sm text-gray-400">Coins</p>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex flex-wrap gap-3">
                <Link href="/challenges">
                  <Button variant="gradient" size="lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Crea Sfida
                  </Button>
                </Link>
                
                <Link href="/challenges">
                  <Button variant="secondary">
                    <Swords className="w-5 h-5 mr-2" />
                    Trova Avversari
                  </Button>
                </Link>

                <Link href="/training">
                  <Button variant="secondary">
                    <Activity className="w-5 h-5 mr-2" />
                    Allenamento Libero
                  </Button>
                </Link>

                <Link href="/friends">
                  <Button variant="secondary">
                    <Users className="w-5 h-5 mr-2" />
                    Gestisci Amici
                  </Button>
                </Link>

                <Link href="/tournament">
                  <Button variant="secondary">
                    <Trophy className="w-5 h-5 mr-2" />
                    Torneo Settimanale
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Active Duels */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">I Tuoi Duelli</h3>
                <Link href="/challenges">
                  <Button variant="ghost" size="sm">
                    Vedi tutti <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {MOCK_ACTIVE_DUELS.slice(0, 4).map((duel, index) => (
                  <motion.div
                    key={duel.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  >
                    <DuelCard duel={duel} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 space-y-6">
            {/* Leaderboard */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card variant="glass" className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-bold text-white">Classifica Settimanale</h3>
                </div>
                
                <div className="space-y-3">
                  {MOCK_LEADERBOARD.map((player, index) => (
                    <div key={player.rank} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                          player.rank === 1 ? 'bg-yellow-500 text-black' :
                          player.rank === 2 ? 'bg-gray-400 text-black' :
                          player.rank === 3 ? 'bg-orange-600 text-white' :
                          'bg-gray-700 text-gray-300'
                        )}>
                          {player.rank}
                        </span>
                        <span className="text-lg font-bold">{player.avatar}</span>
                        <div>
                          <p className="text-sm font-medium text-white">{player.username}</p>
                          <p className="text-xs text-gray-400">Level {player.level}</p>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-yellow-500">{player.xp} XP</p>
                    </div>
                  ))}
                </div>

                <Link href="/leaderboard">
                  <Button variant="secondary" size="sm" className="w-full mt-4">
                    Vedi Classifica Completa
                  </Button>
                </Link>
              </Card>
            </motion.div>

            {/* Recent Achievements */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card variant="glass" className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Medal className="w-5 h-5 text-purple-500" />
                  <h3 className="font-bold text-white">Achievement Recenti</h3>
                </div>
                
                <div className="space-y-3">
                  {MOCK_RECENT_ACHIEVEMENTS.map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-3">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{achievement.name}</p>
                        <p className="text-xs text-gray-400">{achievement.unlockedAt}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Link href="/achievements">
                  <Button variant="secondary" size="sm" className="w-full mt-4">
                    Vedi Tutti gli Achievement
                  </Button>
                </Link>
              </Card>
            </motion.div>

            {/* Daily Missions Widget */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
            >
              <Card variant="glass" className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-bold text-white">Missioni del Giorno</h3>
                  </div>
                  <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full">
                    3 attive
                  </span>
                </div>
                
                <div className="space-y-3">
                  {/* Mission 1 - Active */}
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">âš"ï¸</span>
                        <div>
                          <p className="text-sm font-medium text-white">Guerriero Quotidiano</p>
                          <p className="text-xs text-gray-400">Vinci 3 duelli oggi</p>
                        </div>
                      </div>
                      <span className="text-xs text-yellow-500 font-medium">+100 XP</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full" 
                           style={{ width: '66%' }}>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">2/3 completati</p>
                  </div>

                  {/* Mission 2 - Completed */}
                  <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">ðŸ"¥</span>
                        <div>
                          <p className="text-sm font-medium text-white">Dedizione</p>
                          <p className="text-xs text-gray-400">Mantieni lo streak</p>
                        </div>
                      </div>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <Button variant="gradient" size="sm" className="w-full">
                      Riscatta +50 XP
                    </Button>
                  </div>

                  {/* Mission 3 - Active */}
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">ðŸ'ª</span>
                        <div>
                          <p className="text-sm font-medium text-white">Atleta Costante</p>
                          <p className="text-xs text-gray-400">5 esercizi con form score superiore 80%</p>
                        </div>
                      </div>
                      <span className="text-xs text-yellow-500 font-medium">+150 XP</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full" 
                           style={{ width: '20%' }}>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">1/5 completati</p>
                  </div>
                </div>

                <Link href="/missions">
                  <Button variant="secondary" size="sm" className="w-full mt-4">
                    Vedi Tutte le Missioni
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </Card>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card variant="glass" className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-green-500" />
                  <h3 className="font-bold text-white">AttivitÃ  Recente</h3>
                </div>
                
                <div className="space-y-3">
                  {MOCK_RECENT_ACTIVITY.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-white">{activity.action}</p>
                        <p className="text-xs text-gray-400">{activity.time}</p>
                      </div>
                      {activity.xp > 0 && (
                        <span className="text-xs font-medium text-yellow-500">+{activity.xp} XP</span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Notification Modal */}
      <NotificationModal 
        isOpen={showNotifications} 
        onClose={() => {
          setShowNotifications(false)
          if (user) {
            checkUnreadNotifications(user.id)
          }
        }}
        userId={user?.id || ''}
      />
    </div>
  )
}