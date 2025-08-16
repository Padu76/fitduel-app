'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Flame, Trophy, Zap, Users, Bell, X,
  Star, Crown, Swords, Timer,
  Target, ChevronRight, Settings, LogOut,
  Activity, Loader2, CheckCircle,
  Gamepad2, Coins, Gift, TrendingUp,
  Play, Sparkles, Clock, Award
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUserStore } from '@/stores/useUserStore'
import { useMousePosition, useFloatingAnimation } from '@/hooks/useParallaxEffects'

// ====================================
// TYPES
// ====================================
interface GameMode {
  id: string
  title: string
  subtitle: string
  description: string
  icon: string
  color: string
  players: string
  time: string
  path: string
  isHot?: boolean
  badge?: string
  playersOnline?: number
  reward?: string
}

interface ActiveChallenge {
  id: string
  opponent: string
  exercise: string
  icon: string
  timeLeft: string
  timeLeftMs: number
  status: 'winning' | 'losing' | 'tied' | 'waiting'
  score: { you: number; them: number }
}

interface Friend {
  id: string
  name: string
  avatar: string
  status: 'online' | 'in-game' | 'offline'
  level: number
  activity?: string
}

interface Notification {
  id: string
  type: 'challenge' | 'achievement' | 'friend_request' | 'tournament' | 'daily_mission'
  title: string
  message: string
  icon: string
  isRead: boolean
  createdAt: Date
}

interface DailyMission {
  id: string
  name: string
  progress: number
  target: number
  xp: number
  icon: string
  completed: boolean
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

// Notification System Component
const NotificationSystem = () => {
  const [showModal, setShowModal] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'challenge',
      title: 'Nuova Sfida!',
      message: 'Marco ti ha sfidato a Push-ups',
      icon: '⚔️',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 5)
    },
    {
      id: '2',
      type: 'achievement',
      title: 'Achievement Sbloccato!',
      message: 'Hai completato 10 sfide consecutive',
      icon: '🏆',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30)
    },
    {
      id: '3',
      type: 'daily_mission',
      title: 'Missioni Completate!',
      message: 'Hai completato tutte le missioni giornaliere',
      icon: '⭐',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60)
    }
  ])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'challenge': return 'border-red-500/30 bg-red-500/10'
      case 'achievement': return 'border-yellow-500/30 bg-yellow-500/10'
      case 'friend_request': return 'border-blue-500/30 bg-blue-500/10'
      case 'tournament': return 'border-purple-500/30 bg-purple-500/10'
      case 'daily_mission': return 'border-green-500/30 bg-green-500/10'
      default: return 'border-gray-500/30 bg-gray-500/10'
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Ora'
    if (minutes < 60) return `${minutes}m fa`
    if (hours < 24) return `${hours}h fa`
    return `${days}g fa`
  }

  // Auto show toast for new notifications
  useEffect(() => {
    if (unreadCount > 0 && !showModal) {
      setShowToast(true)
      const timer = setTimeout(() => setShowToast(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [unreadCount, showModal])

  return (
    <>
      {/* Notification Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowModal(true)}
        className="relative p-2 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-green-400/50 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-400" />
        {unreadCount > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold px-1"
          >
            {unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && unreadCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-20 left-1/2 z-50 max-w-sm"
          >
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-xl p-4 border border-green-400/30 shadow-2xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{notifications.find(n => !n.isRead)?.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-white text-sm">
                    {notifications.find(n => !n.isRead)?.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {notifications.find(n => !n.isRead)?.message}
                  </p>
                </div>
                <button 
                  onClick={() => setShowToast(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 rounded-2xl p-6 max-w-md w-full max-h-[80vh] flex flex-col border border-gray-800"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-white">NOTIFICHE</h3>
                  <p className="text-sm text-gray-400">
                    {unreadCount > 0 ? `${unreadCount} non lette` : 'Tutte lette'}
                  </p>
                </div>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mark all as read button */}
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-4"
                  onClick={markAllAsRead}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Segna tutte come lette
                </Button>
              )}

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <motion.button
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={cn(
                        'w-full p-4 rounded-xl text-left transition-all border',
                        getNotificationColor(notification.type),
                        notification.isRead ? 'opacity-60' : ''
                      )}
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">
                          {notification.icon}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              'text-sm font-bold',
                              notification.isRead ? 'text-gray-300' : 'text-white'
                            )}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Nessuna notifica</p>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="mt-4 pt-4 border-t border-gray-800">
                <Button 
                  variant="gradient" 
                  className="w-full" 
                  onClick={() => setShowModal(false)}
                >
                  Chiudi
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Hero Profile Card with CTA
const HeroProfileCard = ({ user, stats }: any) => {
  const [isHovered, setIsHovered] = useState(false)
  const [hasClaimedDaily, setHasClaimedDaily] = useState(false)
  const mousePosition = useMousePosition()
  const router = useRouter()

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
              {/* Avatar with progress ring */}
              <motion.div 
                className="relative"
                animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
              >
                {/* Progress Ring */}
                <svg className="absolute -inset-2 w-24 h-24">
                  <circle
                    cx="48"
                    cy="48"
                    r="42"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="4"
                    fill="none"
                  />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="42"
                    stroke="url(#gradient)"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: ((user?.xp || 0) % 1000) / 1000 }}
                    transition={{ duration: 1 }}
                    style={{
                      transform: 'rotate(-90deg)',
                      transformOrigin: '50% 50%'
                    }}
                  />
                  <defs>
                    <linearGradient id="gradient">
                      <stop offset="0%" stopColor="#00FF88" />
                      <stop offset="100%" stopColor="#0088FF" />
                    </linearGradient>
                  </defs>
                </svg>

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
                
                {/* Challenge Friend Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/challenges')}
                  className="mt-2 bg-gradient-to-r from-green-400 to-blue-500 text-black px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1"
                >
                  <Swords className="w-3 h-3" />
                  SFIDA UN AMICO
                </motion.button>
              </div>
            </div>

            <div className="flex gap-2">
              {/* Daily Bonus */}
              {!hasClaimedDaily && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setHasClaimedDaily(true)}
                  className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl border border-yellow-400/50 transition-colors"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Gift className="w-5 h-5 text-black" />
                </motion.button>
              )}

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
          </div>

          {/* XP Bar with next level preview */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Level {user?.level || 1} → {(user?.level || 0) + 1}</span>
              <span className="text-green-400 font-bold">{user?.xp || 0} / 1000 XP</span>
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
            <p className="text-xs text-gray-500 mt-1">Prossimo reward: Skin "Thunder" 🌩️</p>
          </div>

          {/* Quick Stats with trends */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: <Trophy className="w-5 h-5" />, value: stats?.wins || 0, label: 'Wins', color: 'text-yellow-500', trend: '+12%' },
              { icon: <Flame className="w-5 h-5" />, value: stats?.currentStreak || 0, label: 'Streak', color: 'text-orange-500', trend: '🔥' },
              { icon: <Target className="w-5 h-5" />, value: `${stats?.winRate || 0}%`, label: 'Win Rate', color: 'text-green-500', trend: '+5%' },
              { icon: <Coins className="w-5 h-5" />, value: user?.coins || 0, label: 'Coins', color: 'text-yellow-600', trend: '+50' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -2 }}
                className="bg-gray-800/50 rounded-xl p-3 text-center border border-gray-700 hover:border-green-400/30 transition-colors relative"
              >
                {stat.trend && (
                  <span className="absolute -top-2 -right-2 text-xs bg-green-400/20 text-green-400 px-1 rounded">
                    {stat.trend}
                  </span>
                )}
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

// Enhanced Game Mode Card with live indicators
const GameModeCard = ({ mode, index, size = 'medium' }: { mode: GameMode; index: number; size?: 'large' | 'medium' }) => {
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
        "relative cursor-pointer transition-all duration-300",
        "bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm",
        "border border-gray-700 hover:border-green-400/50",
        "transform-gpu rounded-2xl",
        size === 'large' ? 'p-8' : 'p-6'
      )}
      style={{
        transformStyle: 'preserve-3d',
        boxShadow: isHovered 
          ? `0 20px 40px ${mode.color}40, 0 0 60px ${mode.color}20`
          : '0 10px 30px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Badges */}
      {mode.badge && (
        <motion.div
          className="absolute -top-2 -right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {mode.badge}
        </motion.div>
      )}

      {mode.isHot && (
        <motion.div
          className="absolute top-3 right-3 flex items-center gap-1 bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full text-xs font-bold"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Flame className="w-3 h-3" />
          HOT
        </motion.div>
      )}

      {/* Icon */}
      <motion.div 
        className={size === 'large' ? "text-6xl mb-4" : "text-5xl mb-4"}
        animate={isHovered ? { 
          rotate: [0, -10, 10, 0],
          scale: [1, 1.2, 1],
        } : {}}
        transition={{ duration: 0.5 }}
      >
        {mode.icon}
      </motion.div>

      {/* Title & Subtitle */}
      <h3 className={cn(
        "font-black mb-1",
        size === 'large' ? 'text-2xl' : 'text-xl',
        isHovered ? 'text-green-400' : 'text-white'
      )}>
        {mode.title}
      </h3>
      <p className="text-sm text-gray-400 mb-2">{mode.subtitle}</p>
      
      {/* Description (only for large cards) */}
      {size === 'large' && (
        <p className="text-xs text-gray-500 mb-3">{mode.description}</p>
      )}

      {/* Live Players */}
      {mode.playersOnline && (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-400 font-bold">{mode.playersOnline} online ora</span>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="flex items-center gap-4 text-xs mb-3">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3 text-gray-500" />
          <span className="text-gray-400">{mode.players}</span>
        </div>
        <div className="flex items-center gap-1">
          <Timer className="w-3 h-3 text-gray-500" />
          <span className="text-gray-400">{mode.time}</span>
        </div>
        {mode.reward && (
          <div className="flex items-center gap-1">
            <Award className="w-3 h-3 text-yellow-500" />
            <span className="text-yellow-400">{mode.reward}</span>
          </div>
        )}
      </div>

      {/* Quick Play Button on Hover */}
      {isHovered && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={(e) => {
            e.stopPropagation()
            router.push(mode.path)
          }}
          className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-black py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          {mode.id === '5' ? 'CLAIM REWARDS' : 'GIOCA ORA'}
        </motion.button>
      )}

      {/* Hover Effect Overlay */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-blue-500/10 rounded-2xl" />
        </motion.div>
      )}
    </motion.div>
  )
}

// Active Challenges Widget with countdown
const ActiveChallengesWidget = ({ challenges }: { challenges: ActiveChallenge[] }) => {
  const router = useRouter()
  const [, forceUpdate] = useState({})

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => forceUpdate({}), 1000)
    return () => clearInterval(interval)
  }, [])

  const getTimeColor = (ms: number) => {
    const hours = ms / (1000 * 60 * 60)
    if (hours < 1) return 'text-red-400'
    if (hours < 6) return 'text-yellow-400'
    return 'text-gray-400'
  }

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
          className="p-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-700 hover:border-green-400/50 cursor-pointer transition-all relative overflow-hidden"
        >
          {/* Waiting indicator */}
          {challenge.status === 'waiting' && (
            <motion.div
              className="absolute top-2 right-2"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-bold">
                RISPONDI ORA
              </span>
            </motion.div>
          )}

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
                challenge.status === 'losing' ? 'text-red-400' : 
                challenge.status === 'waiting' ? 'text-yellow-400' : 'text-gray-400'
              )}>
                {challenge.score.you} - {challenge.score.them}
              </p>
              <p className={cn("text-xs font-bold", getTimeColor(challenge.timeLeftMs))}>
                <Clock className="w-3 h-3 inline mr-1" />
                {challenge.timeLeft}
              </p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full",
                challenge.status === 'winning' ? 'bg-green-400' :
                challenge.status === 'losing' ? 'bg-red-400' : 
                challenge.status === 'waiting' ? 'bg-yellow-400' : 'bg-gray-400'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${(challenge.score.you / (challenge.score.you + challenge.score.them)) * 100}%` }}
            />
          </div>

          {/* Quick Actions */}
          {challenge.status === 'losing' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/duel/${challenge.id}`)
              }}
              className="mt-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold"
            >
              RIVINCITA
            </motion.button>
          )}
        </motion.div>
      ))}
    </div>
  )
}

// Live Activity Feed with social proof
const LiveActivityFeed = () => {
  const activities = [
    { id: 1, user: 'Marco', action: 'ha vinto contro', target: 'Luigi', xp: 150, icon: '🏆', time: '2m fa' },
    { id: 2, user: 'Sara', action: 'nuovo record', target: '45 squats', xp: 200, icon: '🔥', time: '5m fa' },
    { id: 3, user: 'Team Alpha', action: 'domina il torneo', target: '', xp: 500, icon: '👑', time: '8m fa' },
    { id: 4, user: '3 amici', action: 'stanno giocando ora', target: '', xp: 0, icon: '🎮', time: 'ora' },
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
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
            {activity.xp > 0 && (
              <span className="text-xs text-yellow-500 font-bold">+{activity.xp} XP</span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Friends Online Widget with activity
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
              <p className="text-xs text-gray-500">
                {friend.status === 'in-game' ? friend.activity || 'In sfida' : `Lv ${friend.level}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {friend.status === 'in-game' && (
              <Gamepad2 className="w-4 h-4 text-yellow-400" />
            )}
            {friend.status === 'online' && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                className="text-xs bg-green-400/20 text-green-400 px-2 py-1 rounded-full font-bold"
              >
                SFIDA
              </motion.button>
            )}
          </div>
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
  const [dailyStreak, setDailyStreak] = useState(7)

  // Game modes data - 5 CARDS LAYOUT
  const gameModes: GameMode[] = [
    {
      id: '1',
      title: 'SFIDA RAPIDA',
      subtitle: 'Battaglia istantanea',
      description: 'Sfida immediata 1v1, trova avversario in 3 secondi',
      icon: '⚡',
      color: '#00FF88',
      players: '1v1',
      time: '30s',
      path: '/challenges',
      isHot: true,
      playersOnline: 234,
      reward: '+150 XP'
    },
    {
      id: '5',
      title: 'MISSIONI DAILY',
      subtitle: 'Obiettivi giornalieri',
      description: 'Completa le missioni e ottieni rewards esclusivi',
      icon: '⭐',
      color: '#FFD700',
      players: 'Solo',
      time: '24h',
      path: '/missions',
      badge: 'NEW',
      playersOnline: 567,
      reward: '+300 XP'
    },
    {
      id: '2',
      title: 'TORNEO',
      subtitle: 'Competizione epica',
      description: 'Battaglia royale fitness, solo i migliori sopravvivono',
      icon: '🏆',
      color: '#FF6B35',
      players: '100',
      time: '24h',
      path: '/tournament',
      playersOnline: 89,
      reward: '+500 XP'
    },
    {
      id: '3',
      title: 'TEAM BATTLE',
      subtitle: 'Squadra vs Squadra',
      description: 'Unisci le forze con i tuoi amici per dominare',
      icon: '👥',
      color: '#0088FF',
      players: '3v3',
      time: '5min',
      path: '/teams',
      playersOnline: 156,
      reward: '+200 XP'
    },
    {
      id: '4',
      title: 'TRAINING',
      subtitle: 'Allenamento libero',
      description: 'Perfeziona la tua tecnica con l\'AI coach',
      icon: '💪',
      color: '#FF00FF',
      players: 'Solo',
      time: 'Free',
      path: '/training',
      playersOnline: 45,
      reward: '+50 XP'
    }
  ]

  const activeChallenges: ActiveChallenge[] = [
    {
      id: '1',
      opponent: 'Marco',
      exercise: 'Push-ups',
      icon: '💪',
      timeLeft: '2h left',
      timeLeftMs: 7200000,
      status: 'waiting',
      score: { you: 0, them: 32 }
    },
    {
      id: '2',
      opponent: 'Luigi',
      exercise: 'Squats',
      icon: '🦵',
      timeLeft: '45m left',
      timeLeftMs: 2700000,
      status: 'losing',
      score: { you: 28, them: 35 }
    }
  ]

  const onlineFriends: Friend[] = [
    { id: '1', name: 'Sara', avatar: '👧', status: 'online', level: 15 },
    { id: '2', name: 'Marco', avatar: '👨', status: 'in-game', level: 23, activity: 'Torneo Daily' },
    { id: '3', name: 'Anna', avatar: '👩', status: 'online', level: 8 },
    { id: '4', name: 'Luca', avatar: '🧑', status: 'offline', level: 12 }
  ]

  const dailyMissions: DailyMission[] = [
    { id: '1', name: '10 Push-ups', progress: 7, target: 10, xp: 50, icon: '💪', completed: false },
    { id: '2', name: '20 Squats', progress: 20, target: 20, xp: 75, icon: '🦵', completed: true },
    { id: '3', name: 'Vinci 3 sfide', progress: 1, target: 3, xp: 150, icon: '🏆', completed: false },
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
              
              {/* Daily Streak */}
              <motion.div 
                className="flex items-center gap-2 bg-orange-500/20 px-3 py-1 rounded-full"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-bold text-orange-400">{dailyStreak} giorni</span>
              </motion.div>
            </motion.div>

            <div className="flex items-center gap-3">
              <NotificationSystem />

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

            {/* Game Modes - 2+3 Layout */}
            <div>
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-black mb-4 flex items-center gap-2"
              >
                <Gamepad2 className="w-5 h-5 text-green-400" />
                SCEGLI LA TUA BATTAGLIA
              </motion.h3>
              
              {/* Top Row - 2 Large Cards (Quick Actions) */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <GameModeCard mode={gameModes[0]} index={0} size="large" />
                <GameModeCard mode={gameModes[1]} index={1} size="large" />
              </div>
              
              {/* Bottom Row - 3 Medium Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                <GameModeCard mode={gameModes[2]} index={2} />
                <GameModeCard mode={gameModes[3]} index={3} />
                <GameModeCard mode={gameModes[4]} index={4} />
              </div>
            </div>

            {/* Active Challenges with CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <Swords className="w-5 h-5 text-red-400" />
                  SFIDE ATTIVE
                  {activeChallenges.filter(c => c.status === 'waiting').length > 0 && (
                    <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                      {activeChallenges.filter(c => c.status === 'waiting').length} IN ATTESA
                    </span>
                  )}
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
            {/* Sfida del Giorno */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/30"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  SFIDA DEL GIORNO
                </h3>
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full font-bold"
                >
                  2X XP
                </motion.span>
              </div>
              
              <div className="bg-gray-900/50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">🔥</span>
                  <div>
                    <p className="font-bold text-white">100 Burpees Challenge</p>
                    <p className="text-xs text-gray-400">Completa in meno di 10 minuti</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">Premio:</span>
                  <span className="text-sm font-bold text-yellow-400">1000 XP + Skin Rara</span>
                </div>
                <Button variant="gradient" size="sm" className="w-full">
                  ACCETTA SFIDA
                </Button>
              </div>
            </motion.div>

            {/* Live Activity with social proof */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
            >
              <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                ATTIVITÀ LIVE
              </h3>
              <LiveActivityFeed />
            </motion.div>

            {/* Friends Online with quick challenge */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
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

            {/* Next Level Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30"
            >
              <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                PROSSIMO LIVELLO
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl flex items-center justify-center text-2xl">
                    🎭
                  </div>
                  <div>
                    <p className="font-bold text-white">Skin "Shadow Warrior"</p>
                    <p className="text-xs text-gray-400">Sblocca al Level {(user?.level || 0) + 1}</p>
                  </div>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((user?.xp || 0) % 1000) / 10}%` }}
                  />
                </div>
                <p className="text-xs text-center text-gray-400">
                  Mancano {1000 - ((user?.xp || 0) % 1000)} XP
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}