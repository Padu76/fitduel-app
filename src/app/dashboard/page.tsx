'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Home, Zap, Trophy, Target, Settings, LogOut,
  Flame, Clock, Users, TrendingUp, Camera,
  Swords, Dumbbell, BookOpen, Calendar,
  ChevronRight, Play, Award, Star, AlertCircle
} from 'lucide-react'

// Types for real data
interface Profile {
  id: string
  username: string
  display_name: string | null
  email: string
  level: number
  xp: number
  avatar_url: string | null
}

interface UserStats {
  total_duels: number
  total_wins: number
  total_losses: number
  current_streak: number
  weekly_xp: number
  total_workouts: number
  total_calories: number
  total_minutes: number
}

interface Duel {
  id: string
  status: string
  challenger_id: string
  challenged_id: string | null
  winner_id: string | null
  created_at: string
  challenger?: { username: string }
  challenged?: { username: string }
  wager_xp: number
  reward_xp: number
}

export default function MainDashboard() {
  // State for real user data
  const [user, setUser] = useState<Profile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentDuels, setRecentDuels] = useState<Duel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState('dashboard')

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      setError('')

      // Check authentication
      const authResponse = await fetch('/api/auth/login', { method: 'GET' })
      
      if (!authResponse.ok) {
        window.location.href = '/login'
        return
      }

      const authData = await authResponse.json()
      
      if (!authData.authenticated) {
        window.location.href = '/login'
        return
      }

      // Set user from auth data
      setUser({
        id: authData.user.id,
        username: authData.user.username,
        display_name: authData.user.display_name || authData.user.username,
        email: authData.user.email,
        level: authData.user.level || 1,
        xp: authData.user.xp || 0,
        avatar_url: null
      })

      // Fetch user stats and duels in parallel
      await Promise.all([
        fetchUserStats(authData.user.id),
        fetchRecentDuels(authData.user.id)
      ])

    } catch (error) {
      console.error('Error fetching user data:', error)
      setError('Errore nel caricamento dati utente')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStats = async (userId: string) => {
    try {
      // In a real implementation, you'd have an API endpoint for user stats
      // For now, we'll use mock data that could come from your existing API routes
      const mockStats: UserStats = {
        total_duels: 15,
        total_wins: 9,
        total_losses: 6,
        current_streak: 3,
        weekly_xp: 1240,
        total_workouts: 42,
        total_calories: 8470,
        total_minutes: 420
      }
      setStats(mockStats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchRecentDuels = async (userId: string) => {
    try {
      // Fetch recent duels from your existing duels API
      const response = await fetch('/api/duels/recent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        const duelsData = await response.json()
        setRecentDuels(duelsData.duels || [])
      }
    } catch (error) {
      console.error('Error fetching duels:', error)
      // Set mock data if API fails
      setRecentDuels([
        {
          id: '1',
          status: 'completed',
          challenger_id: userId,
          challenged_id: 'user2',
          winner_id: userId,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          challenged: { username: 'Marco_Warrior' },
          wager_xp: 100,
          reward_xp: 200
        },
        {
          id: '2', 
          status: 'completed',
          challenger_id: 'user3',
          challenged_id: userId,
          winner_id: userId,
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          challenger: { username: 'Sara_Beast' },
          wager_xp: 150,
          reward_xp: 300
        },
        {
          id: '3',
          status: 'completed', 
          challenger_id: userId,
          challenged_id: 'user4',
          winner_id: 'user4',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          challenged: { username: 'Luca_Titan' },
          wager_xp: 120,
          reward_xp: 0
        }
      ])
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/login', { method: 'DELETE' })
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      // Force redirect even if API fails
      window.location.href = '/login'
    }
  }

  // Calculate today's stats based on real data
  const todayStats = [
    { 
      label: 'Calorie', 
      value: stats ? Math.floor(stats.total_calories / 10).toString() : '847', 
      unit: 'kcal', 
      icon: Flame, 
      color: 'text-red-400' 
    },
    { 
      label: 'Tempo', 
      value: stats ? Math.floor(stats.total_minutes / 10).toString() : '42', 
      unit: 'min', 
      icon: Clock, 
      color: 'text-blue-400' 
    },
    { 
      label: 'Sfide Vinte', 
      value: stats ? stats.total_wins.toString() : '3', 
      unit: `/${stats ? stats.total_duels : 5}`, 
      icon: Trophy, 
      color: 'text-yellow-400' 
    },
    { 
      label: 'Livello', 
      value: user ? user.level.toString() : '1', 
      unit: `(${user ? user.xp : 0} XP)`, 
      icon: TrendingUp, 
      color: 'text-green-400' 
    }
  ]

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
    { id: 'training', label: 'Training', icon: Dumbbell, href: '/training' },
    { id: 'challenges', label: 'Sfide', icon: Swords, href: '/challenges' },
    { id: 'library', label: 'Libreria', icon: BookOpen, href: '/training/library' },
    { id: 'profile', label: 'Profilo', icon: Target, href: '/profile' },
    { id: 'settings', label: 'Impostazioni', icon: Settings, href: '/settings' }
  ]

  const quickActions = [
    {
      title: 'Allenamento Intensivo',
      description: 'Sessione HIIT ad alta intensità',
      icon: Flame,
      color: 'from-red-500 to-orange-500',
      href: '/training',
      duration: '25 min'
    },
    {
      title: 'Sfida Veloce',
      description: 'Trova avversario online',
      icon: Zap,
      color: 'from-yellow-500 to-orange-500',
      href: '/challenges',
      duration: '10 min'
    },
    {
      title: 'Calibrazione AI',
      description: 'Ottimizza tracking movimento',
      icon: Camera,
      color: 'from-blue-500 to-purple-500',
      href: '/training',
      duration: '5 min'
    },
    {
      title: 'Torneo Elite',
      description: 'Competizione settimanale',
      icon: Trophy,
      color: 'from-purple-500 to-pink-500',
      href: '/challenges',
      duration: 'Live'
    }
  ]

  // Format recent duels for display
  const formattedDuels = recentDuels.slice(0, 3).map(duel => {
    const isWin = duel.winner_id === user?.id
    const opponent = duel.challenger_id === user?.id 
      ? duel.challenged?.username || 'Sconosciuto'
      : duel.challenger?.username || 'Sconosciuto'
    
    const timeAgo = new Date(duel.created_at)
    const now = new Date()
    const hoursAgo = Math.floor((now.getTime() - timeAgo.getTime()) / (1000 * 60 * 60))
    
    return {
      opponent,
      result: isWin ? 'WIN' : 'LOSS',
      score: `${duel.reward_xp} XP ${isWin ? 'guadagnati' : 'persi'}`,
      time: hoursAgo < 24 ? `${hoursAgo}h fa` : `${Math.floor(hoursAgo / 24)}d fa`
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl text-white mb-2">Errore di Caricamento</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Riprova
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Top Navigation */}
      <nav className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg">FitDuel</span>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-white font-medium">{user.display_name}</div>
                <div className="text-gray-400 text-sm">Livello {user.level} Fighter</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-gray-900/50 backdrop-blur-sm border-r border-gray-800 min-h-[calc(100vh-4rem)] sticky top-16">
          <div className="p-4">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault()
                      setActiveSection(item.id)
                      window.location.href = item.href
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </a>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Welcome Header */}
          <div className="mb-8">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-white mb-2"
            >
              Bentornato, {user.display_name}! 💪
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400"
            >
              Pronto per dominare le sfide di oggi?
            </motion.p>
          </div>

          {/* Today's Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {todayStats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                    <span className="text-gray-400 text-sm">{stat.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">{stat.value}</span>
                    <span className="text-gray-400 text-sm">{stat.unit}</span>
                  </div>
                </div>
              )
            })}
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-white mb-6">Azioni Rapide</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <a
                    key={action.title}
                    href={action.href}
                    className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">{action.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{action.duration}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </a>
                )
              })}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Challenges */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Sfide Recenti</h3>
                <a href="/challenges" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                  Vedi tutto →
                </a>
              </div>
              <div className="space-y-4">
                {formattedDuels.length > 0 ? formattedDuels.map((challenge, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${challenge.result === 'WIN' ? 'bg-green-400' : 'bg-red-400'}`} />
                      <div>
                        <div className="font-medium text-white">{challenge.opponent}</div>
                        <div className="text-sm text-gray-400">{challenge.score}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${challenge.result === 'WIN' ? 'text-green-400' : 'text-red-400'}`}>
                        {challenge.result}
                      </div>
                      <div className="text-xs text-gray-500">{challenge.time}</div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-400">
                    <Swords className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nessuna sfida recente</p>
                    <a href="/challenges" className="text-blue-400 hover:text-blue-300 text-sm">
                      Inizia la tua prima sfida →
                    </a>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Achievement & Progress */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Obiettivi Settimanali</h3>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Sfide Vinte</span>
                    <span className="text-blue-400 font-bold">{stats?.total_wins || 0}/10</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{width: `${Math.min((stats?.total_wins || 0) * 10, 100)}%`}} />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Tempo Allenamento</span>
                    <span className="text-green-400 font-bold">{stats?.total_minutes || 0}/300 min</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full" style={{width: `${Math.min(((stats?.total_minutes || 0) / 300) * 100, 100)}%`}} />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Streak Giornaliero</span>
                    <span className="text-orange-400 font-bold">{stats?.current_streak || 0}/7 giorni</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full" style={{width: `${Math.min(((stats?.current_streak || 0) / 7) * 100, 100)}%`}} />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-yellow-400" />
                  <div>
                    <div className="text-white font-bold">Livello {user.level} Status</div>
                    <div className="text-yellow-400 text-sm">{user.xp} XP totali guadagnati</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}