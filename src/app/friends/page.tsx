'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Users, UserPlus, Swords, MessageCircle,
  Trophy, Star, Flame, Activity, TrendingUp, Settings,
  Globe, Shield, Bell, Search, Filter, ChevronRight,
  Heart, Zap, Crown, Medal, Target, BarChart3
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FriendsSystem } from '@/components/social/FriendsSystem'
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
}

interface FriendStats {
  totalFriends: number
  onlineFriends: number
  pendingRequests: number
  duelsWithFriends: number
  friendsThisWeek: number
}

// ====================================
// FRIEND STATS WIDGET
// ====================================
const FriendStatsWidget = ({ stats }: { stats: FriendStats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card variant="glass" className="p-4 text-center">
          <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.totalFriends}</p>
          <p className="text-xs text-gray-400">Amici Totali</p>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass" className="p-4 text-center">
          <div className="relative">
            <Users className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <p className="text-2xl font-bold text-white">{stats.onlineFriends}</p>
          <p className="text-xs text-gray-400">Online Ora</p>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card variant="glass" className="p-4 text-center relative">
          <UserPlus className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.pendingRequests}</p>
          <p className="text-xs text-gray-400">Richieste</p>
          {stats.pendingRequests > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">{stats.pendingRequests}</span>
            </div>
          )}
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card variant="glass" className="p-4 text-center">
          <Swords className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.duelsWithFriends}</p>
          <p className="text-xs text-gray-400">Sfide Amici</p>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card variant="glass" className="p-4 text-center">
          <TrendingUp className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.friendsThisWeek}</p>
          <p className="text-xs text-gray-400">Nuovi 7gg</p>
        </Card>
      </motion.div>
    </div>
  )
}

// ====================================
// QUICK ACTIONS COMPONENT
// ====================================
const QuickActions = ({ onChallengeClick }: { onChallengeClick: (friendId: string) => void }) => {
  return (
    <Card variant="glass" className="p-6 mb-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-yellow-500" />
        Azioni Rapide
      </h3>
      
      <div className="grid md:grid-cols-4 gap-4">
        <Button variant="gradient" className="h-auto p-4 flex-col gap-2">
          <UserPlus className="w-6 h-6" />
          <span className="text-sm">Trova Amici</span>
        </Button>
        
        <Button variant="secondary" className="h-auto p-4 flex-col gap-2">
          <Swords className="w-6 h-6" />
          <span className="text-sm">Sfida Casuale</span>
        </Button>
        
        <Button variant="secondary" className="h-auto p-4 flex-col gap-2">
          <Trophy className="w-6 h-6" />
          <span className="text-sm">Torneo Amici</span>
        </Button>
        
        <Button variant="secondary" className="h-auto p-4 flex-col gap-2">
          <Crown className="w-6 h-6" />
          <span className="text-sm">Classifica Amici</span>
        </Button>
      </div>
    </Card>
  )
}

// ====================================
// SOCIAL FEED COMPONENT
// ====================================
const SocialFeedWidget = () => {
  const activities = [
    {
      id: '1',
      user: 'Mario85',
      action: 'ha vinto una sfida contro',
      target: 'Luigi90',
      time: '2 min fa',
      icon: '🏆',
      color: 'text-yellow-500'
    },
    {
      id: '2', 
      user: 'FitQueen',
      action: 'ha raggiunto Level 15',
      target: '',
      time: '15 min fa',
      icon: '⭐',
      color: 'text-blue-500'
    },
    {
      id: '3',
      user: 'WorkoutKing',
      action: 'ha aggiunto',
      target: 'FlexMaster',
      time: '1h fa',
      icon: '👥',
      color: 'text-green-500'
    },
    {
      id: '4',
      user: 'SpeedRunner',
      action: 'ha completato 100 flessioni',
      target: '',
      time: '2h fa',
      icon: '💪',
      color: 'text-purple-500'
    }
  ]

  return (
    <Card variant="glass" className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          Attività Amici
        </h3>
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
          >
            <span className="text-2xl">{activity.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">
                <span className="font-semibold text-indigo-400">{activity.user}</span>
                {' '}{activity.action}{' '}
                {activity.target && (
                  <span className="font-semibold text-indigo-400">{activity.target}</span>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800">
        <Button variant="ghost" size="sm" className="w-full">
          Vedi tutte le attività
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  )
}

// ====================================
// MAIN FRIENDS PAGE COMPONENT
// ====================================
export default function FriendsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<FriendStats>({
    totalFriends: 0,
    onlineFriends: 0,
    pendingRequests: 0,
    duelsWithFriends: 0,
    friendsThisWeek: 0
  })

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      // Get current user from Supabase
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        // Check localStorage for demo user
        const savedUser = localStorage.getItem('fitduel_user')
        if (savedUser) {
          const userData = JSON.parse(savedUser)
          setUser({
            id: userData.id || 'demo-user',
            email: userData.email || 'demo@fitduel.com',
            username: userData.username || 'DemoUser',
            level: userData.level || 1,
            xp: userData.xp || 0,
            coins: userData.coins || 0
          })
          
          // Load mock stats for demo
          setStats({
            totalFriends: 12,
            onlineFriends: 4,
            pendingRequests: 2,
            duelsWithFriends: 25,
            friendsThisWeek: 3
          })
        } else {
          router.push('/login')
          return
        }
      } else {
        // Real user - load from database
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          username: authUser.email?.split('@')[0] || 'User',
          level: 1,
          xp: 0,
          coins: 0
        })
        
        // Load real stats
        await loadFriendStats(authUser.id)
      }
    } catch (error) {
      console.error('Error loading user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadFriendStats = async (userId: string) => {
    try {
      // Load friend statistics from database
      const [friendsCount, pendingCount, duelsCount] = await Promise.all([
        // Total friends
        supabase
          .from('friendships')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .eq('status', 'accepted'),
        
        // Pending requests
        supabase
          .from('friendships')
          .select('id', { count: 'exact' })
          .eq('requested_id', userId)
          .eq('status', 'pending'),
        
        // Duels with friends (mock for now)
        Promise.resolve({ count: 15 })
      ])

      setStats({
        totalFriends: friendsCount.count || 0,
        onlineFriends: Math.floor((friendsCount.count || 0) * 0.3), // Mock online percentage
        pendingRequests: pendingCount.count || 0,
        duelsWithFriends: duelsCount.count || 0,
        friendsThisWeek: Math.floor((friendsCount.count || 0) * 0.2) // Mock new friends
      })
    } catch (error) {
      console.error('Error loading friend stats:', error)
    }
  }

  const handleChallengeClick = (friendId: string) => {
    router.push(`/challenges?friend=${friendId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Caricamento amici...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Amici</h1>
                  <p className="text-sm text-gray-400">Connettiti e sfida</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm">
                <Search className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <Filter className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">
              Ciao, {user.username}! 👋
            </h2>
            <p className="text-gray-400">
              Gestisci i tuoi amici e organizza sfide epiche insieme
            </p>
          </div>
        </motion.div>

        {/* Friend Stats */}
        <FriendStatsWidget stats={stats} />

        {/* Quick Actions */}
        <QuickActions onChallengeClick={handleChallengeClick} />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Friends System - Main Content */}
          <div className="lg:col-span-2">
            <FriendsSystem 
              currentUserId={user.id}
              onChallengeClick={handleChallengeClick}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Social Feed */}
            <SocialFeedWidget />

            {/* Friend Suggestions */}
            <Card variant="glass" className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-green-500" />
                Suggerimenti
              </h3>
              
              <div className="space-y-3">
                {[
                  { name: 'GymBeast', level: 18, mutual: 3 },
                  { name: 'FlexPro', level: 22, mutual: 1 },
                  { name: 'CardioMaster', level: 15, mutual: 5 }
                ].map((suggestion, index) => (
                  <motion.div
                    key={suggestion.name}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {suggestion.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{suggestion.name}</p>
                        <p className="text-xs text-gray-400">
                          Level {suggestion.level} • {suggestion.mutual} amici in comune
                        </p>
                      </div>
                    </div>
                    
                    <Button size="sm" variant="gradient">
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
              
              <Button variant="ghost" size="sm" className="w-full mt-4">
                Vedi altri suggerimenti
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Card>

            {/* Privacy Settings */}
            <Card variant="glass" className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                Privacy
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Profilo Pubblico</p>
                    <p className="text-xs text-gray-400">Visibile a tutti</p>
                  </div>
                  <Globe className="w-4 h-4 text-green-500" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Richieste Amicizia</p>
                    <p className="text-xs text-gray-400">Solo amici di amici</p>
                  </div>
                  <Users className="w-4 h-4 text-yellow-500" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Attività Online</p>
                    <p className="text-xs text-gray-400">Visibile agli amici</p>
                  </div>
                  <Activity className="w-4 h-4 text-blue-500" />
                </div>
              </div>
              
              <Button variant="secondary" size="sm" className="w-full mt-4">
                <Settings className="w-4 h-4 mr-2" />
                Gestisci Privacy
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}