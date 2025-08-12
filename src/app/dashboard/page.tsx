'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Flame, Trophy, Zap, Users, Calendar, Bell, Plus, 
  TrendingUp, Medal, Star, Crown, Swords, Timer,
  BarChart3, Target, ChevronRight, Settings, LogOut,
  Activity, Coins
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

// ====================================
// TYPES
// ====================================
interface User {
  id: string
  username: string
  level: number
  xp: number
  coins: number
  isGuest: boolean
  avatar: string
  tier: 'newbie' | 'user' | 'premium'
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
  { rank: 1, username: 'FitMaster', level: 25, xp: 6250, avatar: '💪' },
  { rank: 2, username: 'IronWill', level: 22, xp: 4840, avatar: '🏋️' },
  { rank: 3, username: 'SpeedDemon', level: 20, xp: 4000, avatar: '⚡' },
  { rank: 4, username: 'FlexGuru', level: 18, xp: 3240, avatar: '🤸' },
  { rank: 5, username: 'CardioKing', level: 16, xp: 2560, avatar: '🏃' }
]

const MOCK_RECENT_ACHIEVEMENTS: Achievement[] = [
  { id: '1', name: 'Prima Vittoria', icon: '🏆', unlockedAt: '2 ore fa' },
  { id: '2', name: 'Streak di Fuoco', icon: '🔥', unlockedAt: '1 giorno fa' },
  { id: '3', name: 'Forma Perfetta', icon: '✨', unlockedAt: '3 giorni fa' }
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
    // Se il duello è attivo o completato, vai alla pagina del duello
    if (duel.status === 'active' || duel.status === 'completed') {
      router.push(`/duel/${duel.id}`)
    } else {
      // Se è pending, vai alla pagina challenges per accettare
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
          e.stopPropagation() // Previene il doppio click
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

const NotificationModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-800"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Notifiche</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="p-3 bg-gray-800 rounded-lg">
            <p className="text-sm text-white">🎯 FitGuru ti ha sfidato!</p>
            <p className="text-xs text-gray-400">2 minuti fa</p>
          </div>
          <div className="p-3 bg-gray-800 rounded-lg">
            <p className="text-sm text-white">🏆 Hai sbloccato un nuovo achievement!</p>
            <p className="text-xs text-gray-400">1 ora fa</p>
          </div>
          <div className="p-3 bg-gray-800 rounded-lg">
            <p className="text-sm text-white">⚡ Sei salito di livello!</p>
            <p className="text-xs text-gray-400">3 ore fa</p>
          </div>
        </div>

        <Button variant="gradient" className="w-full mt-4" onClick={onClose}>
          Chiudi
        </Button>
      </motion.div>
    </div>
  )
}

// ====================================
// MAIN COMPONENT
// ====================================
export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)

  // Load user from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('fitduel_user')
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        setUser(userData)
      } else {
        // No user found, redirect to login
        router.push('/login')
      }
    } catch (error) {
      console.error('Error loading user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('fitduel_user')
    router.push('/login')
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

  // Calculate stats
  const winRate = 78.3 // Mock data
  const totalDuels = 45 // Mock data
  const currentStreak = 8 // Mock data

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
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowNotifications(true)}
                >
                  <Bell className="w-5 h-5" />
                </Button>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
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
                    <p className="text-3xl font-bold text-white">Level {user.level}</p>
                    <p className="text-sm text-gray-400">{user.xp} XP totali</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <XPBar currentXP={user.xp} level={user.level} />
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
                <p className="text-2xl font-bold text-white">{user.coins}</p>
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

                <Button 
                  variant="secondary"
                  onClick={() => {
                    // Per ora vai alla pagina challenges
                    router.push('/challenges')
                  }}
                >
                  <Activity className="w-5 h-5 mr-2" />
                  Allenamento Libero
                </Button>

                <Button 
                  variant="secondary"
                  onClick={() => {
                    // Coming soon
                    alert('Torneo settimanale - Coming Soon! 🏆')
                  }}
                >
                  <Trophy className="w-5 h-5 mr-2" />
                  Torneo Settimanale
                </Button>
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
                        <span className="text-lg">{player.avatar}</span>
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

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card variant="glass" className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-green-500" />
                  <h3 className="font-bold text-white">Attività Recente</h3>
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
        onClose={() => setShowNotifications(false)} 
      />
    </div>
  )
}