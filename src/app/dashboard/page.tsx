'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { 
  Flame, Trophy, Zap, Users, Bell, Plus, 
  TrendingUp, Star, Crown, Swords, Timer,
  Target, ChevronRight, Settings, LogOut,
  Activity, Heart, Shield, Loader2, Play,
  Gamepad2, Sparkles, Coins, ChevronUp
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUserStore } from '@/stores/useUserStore'
import { useMousePosition, useFloatingAnimation } from '@/hooks/useParallaxEffects'

// ====================================
// TYPES
// ====================================
interface QuickStat {
  icon: React.ReactNode
  value: string | number
  label: string
  color: string
  trend?: number
}

interface GameMode {
  id: string
  title: string
  subtitle: string
  icon: string
  color: string
  players: string
  time: string
  path: string
}

interface ActiveChallenge {
  id: string
  opponent: string
  exercise: string
  icon: string
  timeLeft: string
  status: 'winning' | 'losing' | 'tied'
  score: { you: number; them: number }
}

interface Friend {
  id: string
  name: string
  avatar: string
  status: 'online' | 'in-game' | 'offline'
  level: number
}

// ====================================
// COMPONENTS
// ====================================

// Animated Background Component
const AnimatedBackground = () => {
  const mousePosition = useMousePosition()
  const floatingRef1 = useFloatingAnimation(6, 50)
  const floatingRef2 = useFloatingAnimation(8, 40)
  const floatingRef3 = useFloatingAnimation(5, 60)

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 136, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 136, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: `translate(${mousePosition.normalizedX * 20}px, ${mousePosition.normalizedY * 20}px)`,
        }}
      />

      {/* Floating Orbs */}
      <div 
        ref={floatingRef1}
        className="absolute top-20 left-20 w-96 h-96 bg-green-400/10 rounded-full blur-3xl"
      />
      <div 
        ref={floatingRef2}
        className="absolute bottom-40 right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"
      />
      <div 
        ref={floatingRef3}
        className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"
      />

      {/* Animated Particles */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-green-400 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-20, 20],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 5 + 5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  )
}

// Hero Profile Card
const HeroProfileCard = ({ user, stats }: any) => {
  const [isHovered, setIsHovered] = useState(false)
  const mousePosition = useMousePosition()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
      style={{
        transform: isHovered 
          ? `perspective(1000px) rotateX(${mousePosition.normalizedY * -5}deg) rotateY(${mousePosition.normalizedX * 5}deg)`
          : 'perspective(1000px) rotateX(0) rotateY(0)',
      }}
    >
      <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-3xl p-8 border border-green-400/20 overflow-hidden">
        {/* Animated Border */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: 'linear-gradient(45deg, rgba(0, 255, 136, 0.3), transparent, rgba(0, 136, 255, 0.3))',
            padding: '2px',
          }}
          animate={isHovered ? {
            rotate: [0, 360],
          } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Avatar with glow */}
              <motion.div 
                className="relative"
                animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
              >
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center text-4xl shadow-2xl">
                  👤
                </div>
                {/* Level Badge */}
                <motion.div 
                  className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full px-2 py-1 text-xs font-black text-black"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  LV {user?.level || 1}
                </motion.div>
              </motion.div>

              <div>
                <h2 className="text-3xl font-black text-white">{user?.username || 'Player'}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className="text-yellow-500 font-bold">{user?.rank || 'Rookie'}</span>
                </div>
              </div>
            </div>

            {/* Settings Button */}
            <Link href="/profile">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-green-400/50 transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-400" />
              </motion.button>
            </Link>
          </div>

          {/* XP Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Progress to Level {(user?.level || 0) + 1}</span>
              <span className="text-green-400 font-bold">{user?.xp || 0} XP</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-400 to-blue-500 relative"
                initial={{ width: 0 }}
                animate={{ width: `${((user?.xp || 0) % 1000) / 10}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: <Trophy className="w-5 h-5" />, value: stats?.wins || 0, label: 'Wins', color: 'text-yellow-500' },
              { icon: <Flame className="w-5 h-5" />, value: stats?.currentStreak || 0, label: 'Streak', color: 'text-orange-500' },
              { icon: <Target className="w-5 h-5" />, value: `${stats?.winRate || 0}%`, label: 'Win Rate', color: 'text-green-500' },
              { icon: <Coins className="w-5 h-5" />, value: user?.coins || 0, label: 'Coins', color: 'text-yellow-600' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -2 }}
                className="bg-gray-800/50 rounded-xl p-3 text-center border border-gray-700 hover:border-green-400/30 transition-colors"
              >
                <div className={cn("mx-auto mb-1", stat.color)}>{stat.icon}</div>
                <p className="text-xl font-black text-white">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Background decoration */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-green-400 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// Game Mode Card
const GameModeCard = ({ mode, index }: { mode: GameMode; index: number }) => {
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    const rotateX = ((y - centerY) / centerY) * -15
    const rotateY = ((x - centerX) / centerX) * 15
    
    cardRef.current.style.transform = `
      perspective(1000px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      translateZ(20px)
      scale(1.02)
    `
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0) scale(1)'
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={() => router.push(mode.path)}
      className={cn(
        "relative p-6 rounded-2xl cursor-pointer transition-all duration-300",
        "bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm",
        "border border-gray-700 hover:border-green-400/50",
        "transform-gpu"
      )}
      style={{
        transformStyle: 'preserve-3d',
        boxShadow: isHovered 
          ? `0 20px 40px ${mode.color}40, 0 0 60px ${mode.color}20`
          : '0 10px 30px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Icon */}
      <motion.div 
        className="text-5xl mb-4"
        animate={isHovered ? { 
          rotate: [0, -10, 10, 0],
          scale: [1, 1.2, 1],
        } : {}}
        transition={{ duration: 0.5 }}
      >
        {mode.icon}
      </motion.div>

      {/* Title */}
      <h3 className={cn(
        "text-xl font-black mb-1",
        isHovered ? 'text-green-400' : 'text-white'
      )}>
        {mode.title}
      </h3>
      <p className="text-sm text-gray-400 mb-4">{mode.subtitle}</p>

      {/* Info */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3 text-gray-500" />
          <span className="text-gray-400">{mode.players}</span>
        </div>
        <div className="flex items-center gap-1">
          <Timer className="w-3 h-3 text-gray-500" />
          <span className="text-gray-400">{mode.time}</span>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-blue-500/10 rounded-2xl" />
          <motion.div
            className="absolute top-4 right-4"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <ChevronRight className="w-6 h-6 text-green-400" />
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}

// Live Activity Feed
const LiveActivityFeed = () => {
  const activities = [
    { id: 1, user: 'Marco', action: 'ha vinto contro', target: 'Luigi', xp: 150, icon: '🏆' },
    { id: 2, user: 'Sara', action: 'nuovo record', target: '45 squats', xp: 200, icon: '🔥' },
    { id: 3, user: 'Team Alpha', action: 'domina il torneo', target: '', xp: 500, icon: '👑' },
    { id: 4, user: 'Giovanni', action: 'streak 7 giorni', target: '', xp: 300, icon: '⚡' },
  ]

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-xl border border-gray-700/50 hover:border-green-400/30 transition-colors"
          >
            <span className="text-2xl">{activity.icon}</span>
            <div className="flex-1">
              <p className="text-sm">
                <span className="text-green-400 font-bold">{activity.user}</span>
                <span className="text-gray-400"> {activity.action} </span>
                {activity.target && <span className="text-blue-400">{activity.target}</span>}
              </p>
            </div>
            <span className="text-xs text-yellow-500 font-bold">+{activity.xp} XP</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Active Challenges Widget
const ActiveChallengesWidget = ({ challenges }: { challenges: ActiveChallenge[] }) => {
  const router = useRouter()

  return (
    <div className="space-y-3">
      {challenges.map((challenge, index) => (
        <motion.div
          key={challenge.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => router.push(`/duel/${challenge.id}`)}
          className="p-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-700 hover:border-green-400/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{challenge.icon}</span>
              <div>
                <p className="text-sm font-bold text-white">{challenge.exercise}</p>
                <p className="text-xs text-gray-400">vs {challenge.opponent}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "text-lg font-black",
                challenge.status === 'winning' ? 'text-green-400' :
                challenge.status === 'losing' ? 'text-red-400' : 'text-yellow-400'
              )}>
                {challenge.score.you} - {challenge.score.them}
              </p>
              <p className="text-xs text-gray-500">{challenge.timeLeft}</p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full",
                challenge.status === 'winning' ? 'bg-green-400' :
                challenge.status === 'losing' ? 'bg-red-400' : 'bg-yellow-400'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${(challenge.score.you / (challenge.score.you + challenge.score.them)) * 100}%` }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Friends Online Widget
const FriendsOnlineWidget = ({ friends }: { friends: Friend[] }) => {
  return (
    <div className="space-y-2">
      {friends.map((friend, index) => (
        <motion.div
          key={friend.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ x: 5 }}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/30 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-lg">
                {friend.avatar}
              </div>
              <div className={cn(
                "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900",
                friend.status === 'online' ? 'bg-green-400' :
                friend.status === 'in-game' ? 'bg-yellow-400' : 'bg-gray-600'
              )} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{friend.name}</p>
              <p className="text-xs text-gray-500">Lv {friend.level}</p>
            </div>
          </div>
          {friend.status === 'in-game' && (
            <Gamepad2 className="w-4 h-4 text-yellow-400" />
          )}
        </motion.div>
      ))}
    </div>
  )
}

// ====================================
// MAIN COMPONENT
// ====================================
export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user, stats, setUser, setStats } = useUserStore()
  const [loading, setLoading] = useState(true)

  // Sample data
  const gameModes: GameMode[] = [
    {
      id: '1',
      title: 'SFIDA RAPIDA',
      subtitle: 'Battaglia istantanea',
      icon: '⚡',
      color: '#00FF88',
      players: '1v1',
      time: '30s',
      path: '/challenges'
    },
    {
      id: '2',
      title: 'TORNEO',
      subtitle: 'Competizione epica',
      icon: '🏆',
      color: '#FFD700',
      players: '100',
      time: '24h',
      path: '/tournament'
    },
    {
      id: '3',
      title: 'TEAM BATTLE',
      subtitle: 'Squadra vs Squadra',
      icon: '👥',
      color: '#0088FF',
      players: '5v5',
      time: '5min',
      path: '/teams'
    },
    {
      id: '4',
      title: 'TRAINING',
      subtitle: 'Allenamento libero',
      icon: '💪',
      color: '#FF00FF',
      players: 'Solo',
      time: 'Free',
      path: '/training'
    }
  ]

  const activeChallenges: ActiveChallenge[] = [
    {
      id: '1',
      opponent: 'Marco',
      exercise: 'Push-ups',
      icon: '💪',
      timeLeft: '2h left',
      status: 'winning',
      score: { you: 45, them: 32 }
    },
    {
      id: '2',
      opponent: 'Luigi',
      exercise: 'Squats',
      icon: '🦵',
      timeLeft: '5h left',
      status: 'losing',
      score: { you: 28, them: 35 }
    }
  ]

  const onlineFriends: Friend[] = [
    { id: '1', name: 'Sara', avatar: '👧', status: 'online', level: 15 },
    { id: '2', name: 'Marco', avatar: '👨', status: 'in-game', level: 23 },
    { id: '3', name: 'Anna', avatar: '👩', status: 'online', level: 8 },
    { id: '4', name: 'Luca', avatar: '🧑', status: 'offline', level: 12 }
  ]

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    setLoading(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        const savedUser = localStorage.getItem('fitduel_user')
        if (savedUser) {
          const userData = JSON.parse(savedUser)
          setUser(userData)
        } else {
          router.push('/login')
          return
        }
      }
    } catch (error) {
      console.error('Error loading user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('fitduel_user')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-green-400" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <header className="relative z-40 border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-black bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                  FITDUEL ARENA
                </h1>
              </div>
            </motion.div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-green-400/50 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="p-2 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-red-400/50 transition-colors"
              >
                <LogOut className="w-5 h-5 text-gray-400" />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Hero Profile */}
            <HeroProfileCard user={user} stats={stats} />

            {/* Central Play Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="relative"
            >
              <Link href="/challenges">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-3xl relative overflow-hidden group"
                >
                  <div className="relative z-10 flex items-center justify-center gap-4">
                    <Play className="w-12 h-12 text-black" />
                    <span className="text-4xl font-black text-black uppercase tracking-wider">
                      GIOCA ORA
                    </span>
                  </div>
                  
                  {/* Animated shimmer */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  
                  {/* Pulse effect */}
                  <motion.div
                    className="absolute inset-0 bg-white/10"
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </motion.button>
              </Link>
            </motion.div>

            {/* Game Modes Grid */}
            <div>
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-black mb-4 flex items-center gap-2"
              >
                <Gamepad2 className="w-5 h-5 text-green-400" />
                MODALITÀ DI GIOCO
              </motion.h3>
              <div className="grid md:grid-cols-2 gap-4">
                {gameModes.map((mode, index) => (
                  <GameModeCard key={mode.id} mode={mode} index={index} />
                ))}
              </div>
            </div>

            {/* Active Challenges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <Swords className="w-5 h-5 text-red-400" />
                  SFIDE ATTIVE
                </h3>
                <Link href="/challenges">
                  <motion.button
                    whileHover={{ x: 5 }}
                    className="text-sm text-gray-400 hover:text-green-400 flex items-center gap-1"
                  >
                    Vedi tutte
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </Link>
              </div>
              
              {activeChallenges.length > 0 ? (
                <ActiveChallengesWidget challenges={activeChallenges} />
              ) : (
                <div className="text-center py-12 bg-gray-900/30 rounded-2xl border border-gray-800">
                  <Swords className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500">Nessuna sfida attiva</p>
                  <Link href="/challenges">
                    <Button variant="gradient" size="sm" className="mt-4">
                      Crea Sfida
                    </Button>
                  </Link>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Daily Missions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
            >
              <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                MISSIONI GIORNALIERE
              </h3>
              
              <div className="space-y-3">
                {[
                  { name: '10 Push-ups', progress: 70, xp: 50, icon: '💪' },
                  { name: '20 Squats', progress: 100, xp: 75, icon: '🦵' },
                  { name: 'Vinci 3 sfide', progress: 33, xp: 150, icon: '🏆' },
                ].map((mission, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="p-3 bg-gray-800/50 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{mission.icon}</span>
                        <span className="text-sm text-white">{mission.name}</span>
                      </div>
                      <span className="text-xs text-yellow-500 font-bold">+{mission.xp} XP</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className={cn(
                          "h-full",
                          mission.progress === 100 ? "bg-green-400" : "bg-blue-500"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${mission.progress}%` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <Link href="/missions">
                <Button variant="secondary" size="sm" className="w-full mt-4">
                  Tutte le Missioni
                </Button>
              </Link>
            </motion.div>

            {/* Live Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
            >
              <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                ATTIVITÀ LIVE
              </h3>
              <LiveActivityFeed />
            </motion.div>

            {/* Friends Online */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  AMICI ONLINE
                </h3>
                <span className="text-xs bg-green-400/20 text-green-400 px-2 py-1 rounded-full">
                  {onlineFriends.filter(f => f.status !== 'offline').length} online
                </span>
              </div>
              <FriendsOnlineWidget friends={onlineFriends} />
              
              <Link href="/friends">
                <Button variant="secondary" size="sm" className="w-full mt-4">
                  Tutti gli Amici
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => router.push('/challenges')}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full shadow-2xl flex items-center justify-center group"
      >
        <Plus className="w-8 h-8 text-black group-hover:rotate-90 transition-transform" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>
    </div>
  )
}