'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Flame, Trophy, Zap, Users, Calendar, Bell, Plus, 
  TrendingUp, Medal, Star, Crown, Swords, Timer,
  BarChart3, Target, ChevronRight, Settings, LogOut,
  Activity, Coins, CheckCircle, ExternalLink, RefreshCw,
  Shield, Heart, Sparkles, AlertTriangle, Info, X, Loader2
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUserStore } from '@/stores/useUserStore'
import { MissionsWidget } from '@/components/missions/MissionsWidget'

// ====================================
// TYPES
// ====================================
interface DuelCardData {
  id: string
  challengerName: string
  challengedName: string | null
  exerciseName: string
  exerciseIcon?: string
  status: 'pending' | 'open' | 'active' | 'completed' | 'expired' | 'cancelled'
  challengerScore: number | null
  challengedScore: number | null
  timeLeft: string
  xpReward: number
  wagerCoins: number
  type: '1v1' | 'open' | 'tournament' | 'mission'
}

interface DailyChallenge {
  id: string
  exercise: string
  exerciseIcon?: string
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  targetReps?: number
  targetTime?: number
  xpReward: number
  coinReward: number
  description: string
  completedBy: number
  totalPlayers: number
  expiresIn: string
  isCompleted: boolean
}

interface Notification {
  id: string
  userId: string
  type: 'challenge' | 'achievement' | 'level_up' | 'friend_request' | 'system' | 'tournament' | 'daily_reset'
  title: string
  message: string
  isRead: boolean
  metadata?: Record<string, any>
  actionUrl?: string
  createdAt: string
  readAt?: string
  priority?: 'low' | 'normal' | 'high'
  icon?: string
}

// ====================================
// MISSIONS WIDGET COMPONENT
// ====================================
const MissionsWidget = () => {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user, addXP, addCoins } = useUserStore()
  const [missions, setMissions] = useState<Mission[]>([])
  const [claiming, setClaiming] = useState<string | null>(null)
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadMissions()
  }, [user])

  const loadMissions = async () => {
    // Mock missions for now - replace with real data from Supabase
    const mockMissions: Mission[] = [
      {
        id: 'm1',
        title: 'Guerriero',
        description: 'Vinci 3 duelli',
        icon: '⚔️',
        type: 'daily',
        xpReward: 100,
        progress: 2,
        target: 3,
        isCompleted: false,
        isClaimed: false
      },
      {
        id: 'm2',
        title: 'Streak',
        description: 'Mantieni una streak di 3 vittorie',
        icon: '🔥',
        type: 'daily',
        xpReward: 50,
        coinReward: 25,
        progress: 3,
        target: 3,
        isCompleted: true,
        isClaimed: false
      },
      {
        id: 'm3',
        title: 'Atleta',
        description: 'Completa 5 esercizi oggi',
        icon: '💪',
        type: 'daily',
        xpReward: 75,
        progress: 1,
        target: 5,
        isCompleted: false,
        isClaimed: false
      }
    ]

    // If real user, try to load from database
    if (user?.id && user.id !== 'demo') {
      try {
        const { data, error } = await supabase
          .from('user_missions')
          .select(`
            *,
            mission:missions(*)
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)

        if (data && !error) {
          const realMissions = data.map(um => ({
            id: um.mission.id,
            title: um.mission.title,
            description: um.mission.description,
            icon: um.mission.icon || '🎯',
            type: um.mission.type,
            xpReward: um.mission.xp_reward,
            coinReward: um.mission.coin_reward,
            progress: um.progress || 0,
            target: um.mission.target_value,
            isCompleted: um.is_completed,
            isClaimed: um.is_claimed
          }))
          setMissions(realMissions.length > 0 ? realMissions : mockMissions)
        } else {
          setMissions(mockMissions)
        }
      } catch (error) {
        console.error('Error loading missions:', error)
        setMissions(mockMissions)
      }
    } else {
      setMissions(mockMissions)
    }
  }

  const handleClaimReward = async (mission: Mission) => {
    if (!mission.isCompleted || mission.isClaimed || claiming) return

    setClaiming(mission.id)
    setClaimSuccess(null)

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update user stats
      if (mission.xpReward) {
        addXP(mission.xpReward)
      }
      if (mission.coinReward) {
        addCoins(mission.coinReward)
      }

      // Update mission state
      setMissions(prev => prev.map(m => 
        m.id === mission.id ? { ...m, isClaimed: true } : m
      ))

      // Show success message
      setClaimSuccess(mission.id)
      setTimeout(() => setClaimSuccess(null), 3000)

      // If real user, update in database
      if (user?.id && user.id !== 'demo') {
        try {
          // Update mission claim status
          await supabase
            .from('user_missions')
            .update({ 
              is_claimed: true,
              claimed_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('mission_id', mission.id)

          // Update user profile with new XP and coins
          const { data: profile } = await supabase
            .from('profiles')
            .select('xp, coins')
            .eq('id', user.id)
            .single()

          if (profile) {
            await supabase
              .from('profiles')
              .update({
                xp: (profile.xp || 0) + mission.xpReward,
                coins: (profile.coins || 0) + (mission.coinReward || 0)
              })
              .eq('id', user.id)
          }

          // Call API to handle additional rewards logic
          await fetch('/api/missions/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              missionId: mission.id,
              xpReward: mission.xpReward,
              coinReward: mission.coinReward
            })
          })
        } catch (error) {
          console.error('Error updating database:', error)
        }
      }
    } catch (error) {
      console.error('Error claiming reward:', error)
    } finally {
      setClaiming(null)
    }
  }

  const activeMissions = missions.filter(m => !m.isClaimed)
  const completedUnclaimed = missions.filter(m => m.isCompleted && !m.isClaimed)

  return (
    <Card variant="glass" className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-white">Missioni</h3>
        </div>
        <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full">
          {activeMissions.length} attive
        </span>
      </div>
      
      <div className="space-y-3">
        {missions.slice(0, 3).map((mission) => (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "p-3 rounded-lg transition-all",
              mission.isCompleted && !mission.isClaimed ? "bg-green-500/10 border border-green-500/30" :
              mission.isClaimed ? "bg-gray-800/30 opacity-60" :
              "bg-gray-800/50"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{mission.icon}</span>
                <p className="text-sm font-medium text-white">{mission.title}</p>
              </div>
              <div className="flex items-center gap-2">
                {mission.xpReward > 0 && (
                  <span className="text-xs text-yellow-500">+{mission.xpReward} XP</span>
                )}
                {mission.coinReward && mission.coinReward > 0 && (
                  <span className="text-xs text-yellow-600">+{mission.coinReward} 💰</span>
                )}
                {mission.isClaimed && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </div>
            </div>

            {!mission.isCompleted && (
              <>
                <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                  <motion.div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(mission.progress / mission.target) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-xs text-gray-400">{mission.progress}/{mission.target} {mission.description}</p>
              </>
            )}

            {mission.isCompleted && !mission.isClaimed && (
              <Button 
                variant="gradient" 
                size="sm" 
                className="w-full"
                disabled={claiming === mission.id}
                onClick={() => handleClaimReward(mission)}
              >
                {claiming === mission.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Riscattando...
                  </>
                ) : claimSuccess === mission.id ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Riscattato!
                  </>
                ) : (
                  <>
                    Riscatta +{mission.xpReward} XP
                    {mission.coinReward && ` +${mission.coinReward} 💰`}
                  </>
                )}
              </Button>
            )}

            {mission.isClaimed && (
              <p className="text-xs text-gray-500 text-center">Ricompensa riscattata ✓</p>
            )}
          </motion.div>
        ))}

        {completedUnclaimed.length > 0 && claimSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-2 bg-green-500/10 border border-green-500/30 rounded-lg"
          >
            <p className="text-xs text-green-400 text-center">
              🎉 Ricompensa riscattata con successo!
            </p>
          </motion.div>
        )}
      </div>

      <Link href="/missions">
        <Button variant="secondary" size="sm" className="w-full mt-4">
          Tutte le Missioni
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </Link>
    </Card>
  )
}

// ====================================
// MOCK DATA
// ====================================
const MOCK_ACTIVE_DUELS: DuelCardData[] = [
  {
    id: '1',
    challengerName: 'Tu',
    challengedName: 'SpeedRunner',
    exerciseName: 'Push-Up',
    exerciseIcon: '💪',
    status: 'active',
    challengerScore: 45,
    challengedScore: 38,
    timeLeft: '2h 15m',
    xpReward: 150,
    wagerCoins: 50,
    type: '1v1'
  },
  {
    id: '2',
    challengerName: 'FitGuru',
    challengedName: 'Tu',
    exerciseName: 'Plank',
    exerciseIcon: '🏋️',
    status: 'pending',
    challengerScore: null,
    challengedScore: null,
    timeLeft: '5h 30m',
    xpReward: 200,
    wagerCoins: 75,
    type: '1v1'
  }
]

const MOCK_DAILY_CHALLENGES: DailyChallenge[] = [
  {
    id: 'dc1',
    exercise: 'Squat',
    exerciseIcon: '🦵',
    difficulty: 'medium',
    targetReps: 50,
    xpReward: 200,
    coinReward: 50,
    description: 'Completa 50 squat con forma perfetta',
    completedBy: 234,
    totalPlayers: 500,
    expiresIn: '18h 30m',
    isCompleted: false
  },
  {
    id: 'dc2',
    exercise: 'Plank',
    exerciseIcon: '🏋️',
    difficulty: 'hard',
    targetTime: 120,
    xpReward: 300,
    coinReward: 75,
    description: 'Mantieni il plank per 2 minuti',
    completedBy: 156,
    totalPlayers: 500,
    expiresIn: '18h 30m',
    isCompleted: false
  }
]

const MOCK_LEADERBOARD = [
  { rank: 1, username: 'FitMaster', level: 25, xp: 6250, avatar: '👑' },
  { rank: 2, username: 'IronWill', level: 22, xp: 4840, avatar: '💪' },
  { rank: 3, username: 'SpeedDemon', level: 20, xp: 4000, avatar: '⚡' },
  { rank: 4, username: 'Tu', level: 12, xp: 1890, avatar: '🔥' },
  { rank: 5, username: 'CardioKing', level: 16, xp: 2560, avatar: '🏃' }
]

// ====================================
// COMPONENTS
// ====================================
const XPBar = ({ currentXP, level }: { currentXP: number; level: number }) => {
  const xpForCurrentLevel = level > 1 ? Math.pow(level - 1, 2) * 100 : 0
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
      case 'open': return 'text-blue-400 bg-blue-500/10'
      case 'completed': return 'text-purple-400 bg-purple-500/10'
      case 'expired': return 'text-red-400 bg-red-500/10'
      case 'cancelled': return 'text-gray-400 bg-gray-500/10'
      default: return 'text-gray-400 bg-gray-500/10'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'In corso'
      case 'pending': return 'In attesa'
      case 'open': return 'Aperta'
      case 'completed': return 'Completata'
      case 'expired': return 'Scaduta'
      case 'cancelled': return 'Annullata'
      default: return status
    }
  }

  return (
    <Card 
      variant="glass" 
      className="p-4 hover:bg-gray-800/30 transition-all cursor-pointer"
      onClick={() => router.push(`/duel/${duel.id}`)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            {duel.exerciseIcon ? (
              <span className="text-xl">{duel.exerciseIcon}</span>
            ) : (
              <Swords className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <p className="font-medium text-white">{duel.exerciseName}</p>
            <p className="text-sm text-gray-400">
              {duel.type === 'open' ? 'Sfida aperta' : 
               duel.challengedName ? `vs ${duel.challengedName}` : 
               `da ${duel.challengerName}`}
            </p>
          </div>
        </div>
        <span className={cn('text-xs px-2 py-1 rounded-full', getStatusColor(duel.status))}>
          {getStatusLabel(duel.status)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {duel.challengerScore !== null || duel.challengedScore !== null ? (
            <>
              <div className="text-center">
                <p className="text-lg font-bold text-white">{duel.challengerScore || 0}</p>
                <p className="text-xs text-gray-400">{duel.challengerName}</p>
              </div>
              <span className="text-gray-600">VS</span>
              <div className="text-center">
                <p className="text-lg font-bold text-white">{duel.challengedScore || 0}</p>
                <p className="text-xs text-gray-400">{duel.challengedName || '---'}</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">Non ancora iniziata</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-yellow-500">+{duel.xpReward} XP</p>
          <p className="text-xs text-gray-400">🪙 {duel.wagerCoins}</p>
          <p className="text-xs text-gray-500">{duel.timeLeft}</p>
        </div>
      </div>
    </Card>
  )
}

const DailyChallengeCard = ({ challenge }: { challenge: DailyChallenge }) => {
  const router = useRouter()
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 border-green-500/30'
      case 'medium': return 'text-yellow-400 border-yellow-500/30'
      case 'hard': return 'text-orange-400 border-orange-500/30'
      case 'extreme': return 'text-red-400 border-red-500/30'
      default: return 'text-gray-400 border-gray-500/30'
    }
  }

  const completionRate = Math.round((challenge.completedBy / challenge.totalPlayers) * 100)

  return (
    <Card 
      variant={challenge.isCompleted ? 'gradient' : 'glass'} 
      className="p-4 hover:bg-gray-800/30 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {challenge.exerciseIcon && <span className="text-xl">{challenge.exerciseIcon}</span>}
            <h4 className="font-bold text-white">{challenge.exercise}</h4>
            <span className={cn('text-xs px-2 py-0.5 rounded-full border', getDifficultyColor(challenge.difficulty))}>
              {challenge.difficulty === 'easy' ? 'Facile' :
               challenge.difficulty === 'medium' ? 'Media' :
               challenge.difficulty === 'hard' ? 'Difficile' : 'Estrema'}
            </span>
          </div>
          <p className="text-sm text-gray-400">{challenge.description}</p>
        </div>
        {challenge.isCompleted && (
          <CheckCircle className="w-5 h-5 text-green-500" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-400" />
          <span className="text-sm text-white">
            {challenge.targetTime ? `${challenge.targetTime}s` : `${challenge.targetReps} reps`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">{challenge.expiresIn}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500">+{challenge.xpReward} XP</span>
          </div>
          <div className="flex items-center gap-1">
            <Coins className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-600">+{challenge.coinReward}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">{completionRate}% completato</p>
          <p className="text-xs text-gray-500">{challenge.completedBy}/{challenge.totalPlayers} giocatori</p>
        </div>
      </div>

      <Button 
        variant={challenge.isCompleted ? 'secondary' : 'gradient'}
        size="sm" 
        className="w-full"
        onClick={() => router.push(`/duel/daily-${challenge.id}`)}
      >
        {challenge.isCompleted ? 'Completato ✔' : 'Inizia Sfida'}
      </Button>
    </Card>
  )
}

const NotificationSystem = () => {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [currentToast, setCurrentToast] = useState<Notification | null>(null)
  const { user, incrementNotifications, clearNotifications } = useUserStore()
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadNotifications()
  }, [user])

  const loadNotifications = async () => {
    if (!user?.id) {
      const mockNotifications: Notification[] = [
        {
          id: '1',
          userId: 'demo',
          type: 'tournament',
          title: '🏆 Torneo in corso!',
          message: 'Sei al 12° posto. Continua così per entrare nella top 10!',
          isRead: false,
          priority: 'high',
          actionUrl: '/tournament',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          icon: '🏆'
        },
        {
          id: '2',
          userId: 'demo',
          type: 'daily_reset',
          title: '🌅 Nuove Sfide Giornaliere!',
          message: '3 nuove sfide ti aspettano. Completale entro mezzanotte!',
          isRead: false,
          priority: 'normal',
          actionUrl: '#daily-challenges',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          icon: '🎯'
        }
      ]
      setNotifications(mockNotifications)
      return
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data && !error) {
        setNotifications(data.map(n => ({
          id: n.id,
          userId: n.user_id,
          type: n.type,
          title: n.title,
          message: n.message,
          isRead: n.is_read,
          metadata: n.metadata,
          actionUrl: n.action_url,
          createdAt: n.created_at,
          readAt: n.read_at,
          priority: n.priority || 'normal',
          icon: n.metadata?.icon
        })))
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const markAsRead = async (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    )

    if (user?.id && user.id !== 'demo') {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id)
    }
  }

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    clearNotifications()

    if (user?.id && user.id !== 'demo') {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false)
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'tournament': return 'border-yellow-500/30 bg-yellow-500/10'
      case 'achievement': return 'border-green-500/30 bg-green-500/10'
      case 'challenge': return 'border-indigo-500/30 bg-indigo-500/10'
      case 'daily_reset': return 'border-purple-500/30 bg-purple-500/10'
      default: return 'border-gray-500/30 bg-gray-500/10'
    }
  }

  const formatTime = (date: string) => {
    const now = new Date()
    const notifDate = new Date(date)
    const diffMs = now.getTime() - notifDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Ora'
    if (diffMins < 60) return `${diffMins}m fa`
    if (diffHours < 24) return `${diffHours}h fa`
    if (diffDays < 7) return `${diffDays}g fa`
    return notifDate.toLocaleDateString('it-IT')
  }

  return (
    <>
      <div className="relative">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowModal(true)}
        >
          <Bell className="w-5 h-5" />
        </Button>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>

      <AnimatePresence>
        {showToast && currentToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-20 left-1/2 z-50 max-w-sm"
          >
            <Card variant="glass" className={cn('p-4 border', getNotificationColor(currentToast.type))}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{currentToast.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-white text-sm">{currentToast.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{currentToast.message}</p>
                </div>
                <button 
                  onClick={() => setShowToast(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {showModal && (
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
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="mb-4"
                onClick={markAllAsRead}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Segna tutte come lette
              </Button>
            )}
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <motion.button
                    key={notification.id}
                    onClick={() => {
                      markAsRead(notification.id)
                      if (notification.actionUrl) {
                        setShowModal(false)
                        if (notification.actionUrl.startsWith('#')) {
                          const element = document.querySelector(notification.actionUrl)
                          element?.scrollIntoView({ behavior: 'smooth' })
                        } else {
                          router.push(notification.actionUrl)
                        }
                      }
                    }}
                    className={cn(
                      'w-full p-3 rounded-lg text-left transition-all border',
                      getNotificationColor(notification.type),
                      notification.isRead ? 'opacity-60' : ''
                    )}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">
                        {notification.icon}
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

            <div className="mt-4 pt-4 border-t border-gray-800">
              <Button variant="gradient" className="w-full" onClick={() => setShowModal(false)}>
                Chiudi
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}

// ====================================
// MAIN COMPONENT  
// ====================================
export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { 
    user, 
    stats,
    setUser, 
    setStats,
    isAuthenticated,
    setLoading: setStoreLoading
  } = useUserStore()
  
  const [loading, setLoading] = useState(true)
  const [activeDuels, setActiveDuels] = useState<DuelCardData[]>([])
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>(MOCK_DAILY_CHALLENGES)
  const [leaderboard, setLeaderboard] = useState(MOCK_LEADERBOARD)

  useEffect(() => {
    loadUserData()
    loadActiveDuels()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)
      setStoreLoading(true)
      
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        const savedUser = localStorage.getItem('fitduel_user')
        if (savedUser) {
          const userData = JSON.parse(savedUser)
          setUser({
            id: userData.id,
            email: userData.email || 'demo@fitduel.com',
            username: userData.username || 'DemoUser',
            level: userData.level || 1,
            xp: userData.xp || 100,
            totalXp: userData.totalXp || 100,
            coins: userData.coins || 0,
            rank: 'Rookie',
            fitnessLevel: 'beginner',
            goals: [],
            newsletter: false,
            createdAt: new Date().toISOString()
          })
          setActiveDuels(MOCK_ACTIVE_DUELS)
        } else {
          router.push('/login')
          return
        }
      } else {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()
        
        const { data: statsData } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', authUser.id)
          .single()
        
        if (profileData) {
          const userLevel = profileData.level || Math.floor(Math.sqrt((profileData.xp || 0) / 10)) || 1
          
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            username: profileData.username || profileData.display_name || authUser.email?.split('@')[0] || 'User',
            level: userLevel,
            xp: profileData.xp || 0,
            totalXp: profileData.xp || 0,
            coins: profileData.coins || 0,
            rank: userLevel < 10 ? 'Rookie' : userLevel < 20 ? 'Pro' : 'Master',
            fitnessLevel: 'intermediate',
            goals: [],
            newsletter: false,
            createdAt: profileData.created_at
          })
        }
        
        if (statsData) {
          setStats({
            totalDuels: statsData.total_duels_completed || 0,
            wins: statsData.total_wins || 0,
            losses: statsData.total_losses || 0,
            winRate: statsData.total_duels_completed > 0 
              ? Math.round((statsData.total_wins / statsData.total_duels_completed) * 100) 
              : 0,
            currentStreak: statsData.current_win_streak || 0,
            bestStreak: statsData.max_win_streak || 0,
            totalExercises: 0,
            fitnessScore: 85,
            avgFormScore: 82,
            weeklyActivity: []
          })
        }
      }
    } catch (error) {
      console.error('Error loading user:', error)
    } finally {
      setLoading(false)
      setStoreLoading(false)
    }
  }

  const loadActiveDuels = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data: duelsData, error } = await supabase
        .from('duels')
        .select(`
          *,
          challenger:profiles!challenger_id(
            id,
            username,
            display_name,
            avatar_url
          ),
          challenged:profiles!challenged_id(
            id,
            username,
            display_name,
            avatar_url
          ),
          exercise:exercises!exercise_id(
            id,
            name,
            icon
          )
        `)
        .or(`challenger_id.eq.${authUser.id},challenged_id.eq.${authUser.id}`)
        .in('status', ['pending', 'open', 'active'])
        .order('created_at', { ascending: false })
        .limit(5)

      if (duelsData && !error) {
        const formattedDuels: DuelCardData[] = duelsData.map(duel => {
          const isChallenger = duel.challenger_id === authUser.id
          const timeLeft = duel.expires_at ? 
            formatTimeLeft(new Date(duel.expires_at).getTime() - Date.now()) : 
            'No limit'

          return {
            id: duel.id,
            challengerName: isChallenger ? 'Tu' : 
              duel.challenger?.display_name || duel.challenger?.username || 'Sfidante',
            challengedName: !isChallenger && duel.challenged_id === authUser.id ? 'Tu' :
              duel.challenged?.display_name || duel.challenged?.username || null,
            exerciseName: duel.exercise?.name || 'Esercizio',
            exerciseIcon: duel.exercise?.icon,
            status: duel.status,
            challengerScore: duel.challenger_score,
            challengedScore: duel.challenged_score,
            timeLeft,
            xpReward: duel.xp_reward,
            wagerCoins: duel.wager_coins,
            type: duel.type
          }
        })

        setActiveDuels(formattedDuels)
      }
    } catch (error) {
      console.error('Error loading duels:', error)
    }
  }

  const formatTimeLeft = (ms: number): string => {
    if (ms <= 0) return 'Scaduto'
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}g ${hours % 24}h`
    }
    return `${hours}h ${minutes}m`
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      localStorage.removeItem('fitduel_user')
      router.push('/login')
    } catch (error) {
      console.error('Error during logout:', error)
      localStorage.removeItem('fitduel_user')
      router.push('/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Caricamento dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

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
              <Link href="/friends">
                <Button variant="ghost" size="sm">
                  <Users className="w-5 h-5" />
                  <span className="hidden md:inline ml-2">Amici</span>
                </Button>
              </Link>

              <NotificationSystem />
              
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
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-3xl">💪</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Ciao, {user.username}!</h2>
                      <p className="text-gray-400">Pronto per dominare la classifica?</p>
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
                <p className="text-2xl font-bold text-white">{stats?.totalDuels || 0}</p>
                <p className="text-sm text-gray-400">Duelli Totali</p>
              </Card>

              <Card variant="glass" className="p-4 text-center">
                <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stats?.winRate || 0}%</p>
                <p className="text-sm text-gray-400">Win Rate</p>
              </Card>

              <Card variant="glass" className="p-4 text-center">
                <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stats?.currentStreak || 0}</p>
                <p className="text-sm text-gray-400">Streak Attuale</p>
              </Card>

              <Card variant="glass" className="p-4 text-center">
                <Coins className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{user.coins || 0}</p>
                <p className="text-sm text-gray-400">Coins</p>
              </Card>
            </motion.div>

            {/* Daily Challenges Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              id="daily-challenges"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <h3 className="text-xl font-bold text-white">Sfide Giornaliere</h3>
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                    Resetta in 18h 30m
                  </span>
                </div>
                <Button variant="ghost" size="sm">
                  <Info className="w-4 h-4 mr-1" />
                  Info
                </Button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {dailyChallenges.map((challenge, index) => (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  >
                    <DailyChallengeCard challenge={challenge} />
                  </motion.div>
                ))}
              </div>

              <Card variant="gradient" className="mt-4 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-sm font-bold text-white">Bonus Completamento</p>
                      <p className="text-xs text-gray-300">Completa tutte le sfide giornaliere</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-500">+500 XP</p>
                    <p className="text-xs text-gray-400">0/2 completate</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h3 className="text-lg font-bold text-white mb-3">Azioni Rapide</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link href="/challenges">
                  <Button variant="gradient" className="w-full">
                    <Plus className="w-4 h-4 mr-1" />
                    Crea Sfida
                  </Button>
                </Link>
                
                <Link href="/tournament">
                  <Button variant="secondary" className="w-full">
                    <Trophy className="w-4 h-4 mr-1" />
                    Torneo
                  </Button>
                </Link>

                <Link href="/training">
                  <Button variant="secondary" className="w-full">
                    <Activity className="w-4 h-4 mr-1" />
                    Training
                  </Button>
                </Link>

                <Link href="/missions">
                  <Button variant="secondary" className="w-full">
                    <Target className="w-4 h-4 mr-1" />
                    Missioni
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Active Duels */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Duelli Attivi</h3>
                <Link href="/challenges">
                  <Button variant="ghost" size="sm">
                    Vedi tutti <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-3">
                {activeDuels.length > 0 ? (
                  activeDuels.map((duel, index) => (
                    <motion.div
                      key={duel.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                    >
                      <DuelCard duel={duel} />
                    </motion.div>
                  ))
                ) : (
                  <Card variant="glass" className="p-8 text-center">
                    <Swords className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Nessun duello attivo</p>
                    <Link href="/challenges">
                      <Button variant="gradient" size="sm" className="mt-4">
                        Crea il tuo primo duello
                      </Button>
                    </Link>
                  </Card>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 space-y-6">
            {/* Tournament Widget */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card variant="gradient" className="p-6 border-yellow-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <h3 className="font-bold text-white">Torneo Settimanale</h3>
                  </div>
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full animate-pulse">
                    LIVE
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">La tua posizione</span>
                    <span className="text-xl font-bold text-white">#12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Punti torneo</span>
                    <span className="text-xl font-bold text-yellow-500">1,890</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Termina tra</span>
                    <span className="text-sm font-medium text-white">4g 18h</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg">
                  <p className="text-xs text-yellow-400">
                    🎯 Ancora 3 duelli per entrare nella Top 10!
                  </p>
                </div>

                <Link href="/tournament">
                  <Button variant="secondary" className="w-full mt-4">
                    Vai al Torneo
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </Card>
            </motion.div>

            {/* Leaderboard */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card variant="glass" className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-white">Top Giocatori</h3>
                </div>
                
                <div className="space-y-3">
                  {leaderboard.slice(0, 5).map((player) => (
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
                          <p className={cn(
                            'text-sm font-medium',
                            player.username === 'Tu' ? 'text-yellow-500' : 'text-white'
                          )}>
                            {player.username}
                          </p>
                          <p className="text-xs text-gray-400">Lv.{player.level}</p>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-yellow-500">{player.xp}</p>
                    </div>
                  ))}
                </div>

                <Link href="/leaderboard">
                  <Button variant="secondary" size="sm" className="w-full mt-4">
                    Classifica Completa
                  </Button>
                </Link>
              </Card>
            </motion.div>

            {/* Daily Missions Widget - UPDATED */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <MissionsWidget />
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}
          