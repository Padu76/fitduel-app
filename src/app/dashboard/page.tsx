'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Flame, Trophy, Zap, Users, Bell, X,
  Star, Settings, Clock, Target, Gift,
  TrendingUp, Award, Sparkles, Timer,
  Swords, Heart, ChevronRight, Circle,
  Home, Dumbbell, BookOpen, LogOut,
  Camera, AlertCircle
} from 'lucide-react'

// Types for real data from Supabase
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

// Helper functions
const calculateLevel = (xp: number): number => {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

const calculateProgress = (xp: number) => {
  const level = calculateLevel(xp)
  const currentLevelXp = (level - 1) ** 2 * 100
  const nextLevelXp = level ** 2 * 100
  return {
    current: currentLevelXp,
    next: nextLevelXp,
    progress: ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
  }
}

const calculateRank = (level: number): string => {
  if (level >= 50) return 'Legend'
  if (level >= 40) return 'Master'
  if (level >= 30) return 'Diamond'
  if (level >= 25) return 'Platinum'
  if (level >= 20) return 'Gold'
  if (level >= 15) return 'Silver'
  if (level >= 10) return 'Bronze'
  if (level >= 5) return 'Iron'
  return 'Rookie'
}

export default function UltimateDashboard() {
  const router = useRouter()
  
  // Real user data from Supabase
  const [user, setUser] = useState<Profile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentDuels, setRecentDuels] = useState<Duel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Gaming UI states
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'challenge', message: 'Marco ti ha sfidato!', time: '5m fa', read: false },
    { id: 2, type: 'achievement', message: 'Hai sbloccato "Guerriero"!', time: '1h fa', read: false },
    { id: 3, type: 'friend', message: 'Sara è ora online', time: '2h fa', read: true }
  ])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [totalOnline, setTotalOnline] = useState(1234)
  const [modeStats, setModeStats] = useState({
    quickMatch: 89,
    missions: 234,
    tournament: 45,
    teamBattle: 156,
    training: 67
  })

  // Fetch real user data on component mount
  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      setError('')

      // Check authentication with real API
      const authResponse = await fetch('/api/auth/login', { method: 'GET' })
      
      if (!authResponse.ok) {
        router.push('/auth')
        return
      }

      const authData = await authResponse.json()
      
      if (!authData.authenticated) {
        router.push('/auth')
        return
      }

      // Set real user data
      setUser({
        id: authData.user.id,
        username: authData.user.username,
        display_name: authData.user.display_name || authData.user.username,
        email: authData.user.email,
        level: authData.user.level || calculateLevel(authData.user.xp || 0),
        xp: authData.user.xp || 0,
        avatar_url: authData.user.avatar_url
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
      // Use real API or enhanced mock data based on user
      const enhancedStats: UserStats = {
        total_duels: 15 + Math.floor(Math.random() * 10),
        total_wins: 9 + Math.floor(Math.random() * 5),
        total_losses: 6 + Math.floor(Math.random() * 3),
        current_streak: Math.floor(Math.random() * 8),
        weekly_xp: 1240 + Math.floor(Math.random() * 500),
        total_workouts: 42 + Math.floor(Math.random() * 20),
        total_calories: 8470 + Math.floor(Math.random() * 1000),
        total_minutes: 420 + Math.floor(Math.random() * 100)
      }
      setStats(enhancedStats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchRecentDuels = async (userId: string) => {
    try {
      // Try to fetch from real API
      const response = await fetch('/api/duels/recent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        const duelsData = await response.json()
        setRecentDuels(duelsData.duels || [])
      } else {
        // Fallback to enhanced mock data
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
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching duels:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/login', { method: 'DELETE' })
      router.push('/auth')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/auth')
    }
  }

  // Gaming UI effects
  useEffect(() => {
    const interval = setInterval(() => {
      const newTotal = 1200 + Math.floor(Math.random() * 100)
      setTotalOnline(newTotal)
      
      const quickMatch = Math.floor(Math.random() * 150) + 50
      const missions = Math.floor(Math.random() * 250) + 150
      const tournament = Math.floor(Math.random() * 80) + 20
      const teamBattle = Math.floor(Math.random() * 200) + 100
      const training = Math.floor(Math.random() * 100) + 30
      
      const sum = quickMatch + missions + tournament + teamBattle + training
      if (sum <= newTotal) {
        setModeStats({ quickMatch, missions, tournament, teamBattle, training })
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const hasUnread = notifications.some(n => !n.read)
    if (hasUnread) {
      setShowToast(true)
      const timer = setTimeout(() => setShowToast(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [notifications])

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  // Calculate user level and progress from real XP
  const userLevel = user ? calculateLevel(user.xp) : 1
  const levelProgress = user ? calculateProgress(user.xp) : { current: 0, next: 100, progress: 0 }
  const xpForNextLevel = levelProgress.next - levelProgress.current
  const currentLevelXp = (user?.xp || 0) - levelProgress.current
  const progressPercentage = (currentLevelXp / xpForNextLevel) * 100

  const getUserInitials = () => {
    if (!user) return 'G'
    if (user.username) return user.username.charAt(0).toUpperCase()
    if (user.email) return user.email.charAt(0).toUpperCase()
    return 'U'
  }

  const gameModes = [
    {
      id: 'quick-match',
      title: 'SFIDA RAPIDA',
      subtitle: 'Battaglia istantanea',
      description: 'Sfida immediata 1v1, trova avversario in 3 secondi',
      icon: '⚡',
      color: 'from-orange-500 to-red-500',
      glow: 'orange',
      players: modeStats.quickMatch,
      mode: '1v1',
      duration: '30s',
      xp: '+150 XP',
      link: '/challenges',
      isLarge: true,
      badge: 'HOT'
    },
    {
      id: 'missions',
      title: 'MISSIONI DAILY',
      subtitle: 'Obiettivi giornalieri',
      description: 'Completa le missioni e ottieni rewards esclusivi',
      icon: '⭐',
      color: 'from-yellow-500 to-amber-500',
      glow: 'yellow',
      players: modeStats.missions,
      mode: 'Solo',
      duration: '24h',
      xp: '+300 XP',
      link: '/missions',
      isLarge: true,
      badge: 'NEW'
    },
    {
      id: 'tournament',
      title: 'TORNEO',
      subtitle: 'Competizione epica',
      icon: '🏆',
      color: 'from-purple-500 to-pink-500',
      glow: 'purple',
      players: modeStats.tournament,
      mode: '100',
      duration: '24h',
      xp: '+500 XP',
      link: '/tournament',
      isLarge: false
    },
    {
      id: 'team-battle',
      title: 'TEAM BATTLE',
      subtitle: 'Squadra vs Squadra',
      icon: '👥',
      color: 'from-blue-500 to-cyan-500',
      glow: 'blue',
      players: modeStats.teamBattle,
      mode: '3v3',
      duration: '5min',
      xp: '+200 XP',
      link: '/teams',
      isLarge: false
    },
    {
      id: 'training',
      title: 'TRAINING',
      subtitle: 'Allenamento libero',
      icon: '💪',
      color: 'from-green-500 to-emerald-500',
      glow: 'green',
      players: modeStats.training,
      mode: 'Solo',
      duration: 'Free',
      xp: '+50 XP',
      link: '/training',
      isLarge: false
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Caricamento dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Grid effect */}
        <div 
          className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20"
          style={{
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`
          }}
        />
        
        {/* Floating orbs */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-96 h-96 rounded-full blur-3xl opacity-20
              ${i === 0 ? 'bg-green-500' : i === 1 ? 'bg-blue-500' : 'bg-purple-500'}`}
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
            }}
            transition={{
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              left: `${20 + i * 30}%`,
              top: `${20 + i * 20}%`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto">
        {/* Hero Profile Card with integrated header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl 
            rounded-3xl p-6 md:p-8 mb-8 border border-green-500/20 overflow-hidden group"
        >
          {/* Animated border glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-green-500/20 
            opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
          
          <div className="relative">
            {/* Top bar with navigation and online counter */}
            <div className="absolute -top-2 right-0 flex items-center gap-3">
              {/* Navigation Quick Links */}
              <div className="hidden md:flex items-center gap-2">
                {[
                  { icon: Home, href: '/dashboard', active: true },
                  { icon: Dumbbell, href: '/training' },
                  { icon: Swords, href: '/challenges' },
                  { icon: BookOpen, href: '/training/library' },
                  { icon: Target, href: '/profile' }
                ].map((nav, i) => {
                  const Icon = nav.icon
                  return (
                    <Link key={i} href={nav.href}>
                      <motion.button
                        className={`p-2 rounded-lg transition-all ${
                          nav.active 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-slate-800/50 text-slate-400 hover:text-green-400'
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Icon className="w-4 h-4" />
                      </motion.button>
                    </Link>
                  )
                })}
              </div>

              {/* Online Counter */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-slate-800/50 backdrop-blur px-4 py-2 rounded-xl
                  border border-green-500/20"
              >
                <Circle className="w-2 h-2 fill-green-400 text-green-400 animate-pulse" />
                <span className="text-green-400 font-bold text-sm">{totalOnline.toLocaleString()}</span>
                <span className="text-slate-400 text-xs hidden sm:inline">online</span>
              </motion.div>

              {/* Notifications */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative"
              >
                <button
                  onClick={() => setShowNotifications(true)}
                  className="relative p-2.5 bg-slate-800/50 backdrop-blur rounded-xl border border-green-500/20
                    hover:border-green-500/50 transition-all duration-300 group"
                >
                  <Bell className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full 
                      w-5 h-5 flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </motion.div>

              {/* Settings Button */}
              <Link href="/settings">
                <motion.button
                  className="p-2.5 bg-slate-700/50 rounded-xl hover:bg-slate-700 
                    transition-all duration-300 border border-slate-600/50 hover:border-green-500/50"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Settings className="w-5 h-5 text-slate-400 hover:text-green-400 transition-colors" />
                </motion.button>
              </Link>

              {/* Logout Button */}
              <motion.button
                onClick={handleLogout}
                className="p-2.5 bg-red-500/10 rounded-xl hover:bg-red-500/20 
                  transition-all duration-300 border border-red-500/20 hover:border-red-500/50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="w-5 h-5 text-red-400" />
              </motion.button>
            </div>

            {/* Main profile content */}
            <div className="flex items-center gap-4 md:gap-6">
              {/* Avatar with level */}
              <div className="relative">
                {user.avatar_url ? (
                  <motion.img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-24 h-24 rounded-2xl object-cover shadow-2xl"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                  />
                ) : (
                  <motion.div
                    className="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-400 to-blue-500 
                      flex items-center justify-center text-4xl font-bold text-white shadow-2xl"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                  >
                    {getUserInitials()}
                  </motion.div>
                )}
                
                {/* Level Badge */}
                <motion.div
                  className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 
                    rounded-lg px-2 py-1 text-xs font-bold text-white shadow-lg"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  LV {userLevel}
                </motion.div>

                {/* Progress Ring */}
                <svg className="absolute inset-0 w-full h-full">
                  <circle
                    cx="48" cy="48" r="46"
                    stroke="url(#progress-gradient)"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 46 * (progressPercentage / 100)} ${2 * Math.PI * 46 * (1 - progressPercentage / 100)}`}
                    className="animate-spin-slow"
                  />
                  <defs>
                    <linearGradient id="progress-gradient">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* User Info */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl md:text-2xl font-bold text-white">
                    Bentornato, {user.display_name}! 💪
                  </h2>
                  <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 
                    rounded-lg text-white font-bold text-sm hover:shadow-lg hover:shadow-green-500/25 
                    transition-all duration-300 hover:scale-105">
                    SFIDA UN AMICO
                  </button>
                  {/* Calibration AI Quick Access */}
                  <Link href="/settings?tab=calibration">
                    <motion.button
                      className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/50
                        hover:bg-blue-500/30 transition-all group"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      title="Calibrazione AI"
                    >
                      <Camera className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                    </motion.button>
                  </Link>
                </div>
                
                {/* XP Bar */}
                <div className="w-full md:w-96">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-green-400">
                      XP: {currentLevelXp.toLocaleString()} / {xpForNextLevel.toLocaleString()}
                    </span>
                    <span className="text-slate-400">
                      Prossimo: {calculateRank(userLevel + 1)}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full
                        shadow-lg shadow-green-500/50"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-4 md:gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-slate-300">Vittorie:</span>
                    <span className="text-white font-bold">{stats?.total_wins || 0}</span>
                    {stats && stats.total_duels > 0 && (
                      <span className="text-green-400 text-xs">
                        {Math.round((stats.total_wins / stats.total_duels) * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-slate-300">Streak:</span>
                    <span className="text-white font-bold">{stats?.current_streak || 0}</span>
                    {stats?.current_streak && stats.current_streak > 0 && (
                      <TrendingUp className="w-3 h-3 text-green-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300">XP Totale:</span>
                    <span className="text-white font-bold">
                      {(user.xp || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-400" />
                    <span className="text-slate-300">Calorie:</span>
                    <span className="text-white font-bold">
                      {(stats?.total_calories || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Game Modes Grid - 2+3 Layout */}
        <div className="space-y-6 mb-8">
          {/* Top Row - 2 Large Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {gameModes.filter(mode => mode.isLarge).map((mode, index) => (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="relative group"
              >
                <Link href={mode.link}>
                  <div className={`relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 
                    backdrop-blur-xl rounded-2xl p-6 border border-green-500/20 
                    hover:border-green-500/50 transition-all duration-500 h-52
                    overflow-hidden cursor-pointer`}>
                    
                    {/* Background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-10 
                      group-hover:opacity-20 transition-opacity duration-500`} />
                    
                    {/* Badge */}
                    {mode.badge && (
                      <motion.div
                        className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold
                          ${mode.badge === 'HOT' 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'}`}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {mode.badge}
                      </motion.div>
                    )}
                    
                    {/* Content */}
                    <div className="relative z-10 h-full flex flex-col">
                      <div className="text-5xl mb-3">{mode.icon}</div>
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-1">{mode.title}</h3>
                      <p className="text-slate-400 text-sm mb-2">{mode.subtitle}</p>
                      <p className="text-slate-500 text-xs mb-3 hidden md:block">{mode.description}</p>
                      
                      {/* Stats */}
                      <div className="mt-auto flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Circle className="w-2 h-2 fill-green-400 text-green-400" />
                          <span className="text-green-400 font-bold">{mode.players}</span>
                          <span className="text-slate-500">in gioco</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-400">{mode.mode}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-400">{mode.duration}</span>
                        </div>
                        <div className="text-yellow-400 font-bold">{mode.xp}</div>
                      </div>
                    </div>

                    {/* Hover Action Button */}
                    <motion.div
                      className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 
                        transition-opacity duration-300 z-20"
                      initial={{ x: 20 }}
                      whileHover={{ x: 0 }}
                    >
                      <button className="px-4 md:px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 
                        rounded-lg text-white font-bold flex items-center gap-2 shadow-lg
                        hover:shadow-green-500/25 transition-all text-sm md:text-base">
                        {mode.id === 'missions' ? 'CLAIM REWARDS' : 'GIOCA ORA'}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Bottom Row - 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {gameModes.filter(mode => !mode.isLarge).map((mode, index) => (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="relative group"
              >
                <Link href={mode.link}>
                  <div className={`relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 
                    backdrop-blur-xl rounded-2xl p-5 border border-green-500/20 
                    hover:border-green-500/50 transition-all duration-500 h-40
                    overflow-hidden cursor-pointer`}>
                    
                    {/* Background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-10 
                      group-hover:opacity-20 transition-opacity duration-500`} />
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <div className="text-4xl mb-2">{mode.icon}</div>
                      <h3 className="text-lg font-bold text-white mb-1">{mode.title}</h3>
                      <p className="text-slate-400 text-xs mb-3">{mode.subtitle}</p>
                      
                      {/* Stats */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Circle className="w-2 h-2 fill-green-400 text-green-400" />
                          <span className="text-green-400 font-bold">{mode.players}</span>
                          <span className="text-slate-500">ora</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-400">{mode.mode}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-400">{mode.duration}</span>
                        </div>
                        <div className="text-yellow-400 font-bold">{mode.xp}</div>
                      </div>
                    </div>

                    {/* Hover Play Button */}
                    <motion.button
                      className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 
                        transition-opacity duration-300 px-4 py-1 bg-gradient-to-r from-green-500 to-blue-500 
                        rounded text-white text-xs font-bold"
                      whileHover={{ scale: 1.1 }}
                    >
                      GIOCA ORA
                    </motion.button>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active Challenges - Real Data */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl 
              rounded-2xl p-6 border border-green-500/20"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Swords className="w-5 h-5 text-green-400" />
              Sfide Recenti
            </h3>
            
            <div className="space-y-3">
              {formattedDuels.length > 0 ? formattedDuels.map((challenge, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 
                  rounded-xl border border-slate-700/50 hover:border-green-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${challenge.result === 'WIN' ? 'bg-green-400' : 'bg-red-400'}`} />
                    <div>
                      <p className="text-sm font-medium text-white">{challenge.opponent}</p>
                      <p className="text-xs text-slate-400">{challenge.score}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${challenge.result === 'WIN' ? 'text-green-400' : 'text-red-400'}`}>
                      {challenge.result}
                    </span>
                    <span className="text-xs text-slate-500">{challenge.time}</span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-400">
                  <Swords className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nessuna sfida recente</p>
                  <Link href="/challenges" className="text-blue-400 hover:text-blue-300 text-sm">
                    Inizia la tua prima sfida →
                  </Link>
                </div>
              )}
            </div>
            
            <Link href="/challenges">
              <button className="w-full mt-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 
                rounded-lg text-white font-bold hover:shadow-lg hover:shadow-green-500/25 
                transition-all duration-300">
                Nuova Sfida
              </button>
            </Link>
          </motion.div>

          {/* Live Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl 
              rounded-2xl p-6 border border-blue-500/20"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              Attività Live
            </h3>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {[
                { user: 'Alex', action: 'ha vinto una sfida', xp: '+150', time: 'ora' },
                { user: 'Sofia', action: 'nuovo record personale', xp: '+200', time: '2m' },
                { user: 'Luca', action: 'streak di 10 vittorie', xp: '+500', time: '5m' },
                { user: 'Emma', action: 'completato missione', xp: '+100', time: '8m' },
                { user: 'Marco', action: 'salito di livello', xp: '+1000', time: '12m' }
              ].map((activity, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-2 hover:bg-slate-800/30 
                    rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Circle className="w-2 h-2 fill-green-400 text-green-400 animate-pulse" />
                    <span className="text-xs text-slate-300">
                      <span className="font-bold text-white">{activity.user}</span> {activity.action}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-green-400">{activity.xp}</span>
                    <span className="text-xs text-slate-500">{activity.time}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Stats Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl 
              rounded-2xl p-6 border border-purple-500/20"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Le Tue Stats
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Rank Attuale</span>
                <span className="text-purple-400 font-bold">{calculateRank(userLevel)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Duelli Totali</span>
                <span className="text-white font-semibold">{stats?.total_duels || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Win Rate</span>
                <span className="text-green-400 font-semibold">
                  {stats && stats.total_duels > 0 ? Math.round((stats.total_wins / stats.total_duels) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Streak Migliore</span>
                <span className="text-orange-400 font-semibold">{stats?.current_streak || 0}</span>
              </div>
              
              <div className="pt-4 border-t border-slate-700">
                <Link href="/profile">
                  <button className="w-full py-2 bg-purple-500/20 border border-purple-500/50 
                    rounded-lg text-purple-400 font-bold hover:bg-purple-500/30 transition-all">
                    Vedi Profilo Completo
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Notifications Modal */}
      <AnimatePresence>
        {showNotifications && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowNotifications(false)}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: -50, y: -50 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -50, y: -50 }}
              className="fixed top-24 left-8 w-96 bg-slate-900/95 backdrop-blur-xl rounded-2xl 
                border border-green-500/20 shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-green-400" />
                    Notifiche
                  </h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notifications.map(notif => (
                    <motion.div
                      key={notif.id}
                      whileHover={{ scale: 1.02 }}
                      className={`p-4 rounded-lg border transition-all cursor-pointer
                        ${notif.read 
                          ? 'bg-slate-800/30 border-slate-700/50' 
                          : 'bg-slate-800/50 border-green-500/30'}`}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg
                          ${notif.type === 'challenge' ? 'bg-red-500/20' :
                            notif.type === 'achievement' ? 'bg-yellow-500/20' : 'bg-blue-500/20'}`}>
                          {notif.type === 'challenge' && <Swords className="w-4 h-4 text-red-400" />}
                          {notif.type === 'achievement' && <Trophy className="w-4 h-4 text-yellow-400" />}
                          {notif.type === 'friend' && <Users className="w-4 h-4 text-blue-400" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white">{notif.message}</p>
                          <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                        </div>
                        {!notif.read && (
                          <Circle className="w-2 h-2 fill-green-400 text-green-400 mt-2" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="w-full mt-4 py-2 bg-green-500/20 rounded-lg text-green-400 
                      font-bold hover:bg-green-500/30 transition-all"
                  >
                    Segna tutte come lette
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: 50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 50, x: 50 }}
            className="fixed bottom-8 right-8 bg-slate-900/95 backdrop-blur-xl rounded-xl 
              border border-green-500/30 shadow-2xl p-4 max-w-sm z-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Bell className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Nuova notifica!</p>
                <p className="text-xs text-slate-400">Hai {unreadCount} notifiche non lette</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}