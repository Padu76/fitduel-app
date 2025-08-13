'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Target, Trophy, Star, Clock, Flame, Zap, Award,
  Calendar, TrendingUp, Gift, CheckCircle, Filter, Search,
  Bell, Settings, ChevronRight, Sparkles, BarChart3, Medal,
  Coins, Shield, Activity, RefreshCw, Info, Crown
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DailyMissionsSystem } from '@/components/missions/DailyMissionsSystem'
import { useUserStore } from '@/stores/useUserStore'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ====================================
// TYPES
// ====================================
interface MissionStats {
  totalCompleted: number
  dailyCompleted: number
  weeklyCompleted: number
  totalXpEarned: number
  totalCoinsEarned: number
  currentStreak: number
  bestStreak: number
  completionRate: number
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  progress: number
  maxProgress: number
  unlocked: boolean
  reward: {
    xp: number
    coins: number
    badge?: string
  }
}

// ====================================
// MOCK DATA
// ====================================
const MOCK_STATS: MissionStats = {
  totalCompleted: 47,
  dailyCompleted: 35,
  weeklyCompleted: 12,
  totalXpEarned: 4250,
  totalCoinsEarned: 1280,
  currentStreak: 5,
  bestStreak: 12,
  completionRate: 78
}

const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_mission',
    title: 'Prima Missione',
    description: 'Completa la tua prima missione',
    icon: '🎯',
    progress: 1,
    maxProgress: 1,
    unlocked: true,
    reward: { xp: 50, coins: 10 }
  },
  {
    id: 'streak_master',
    title: 'Maestro dello Streak',
    description: 'Mantieni uno streak di 7 giorni',
    icon: '🔥',
    progress: 5,
    maxProgress: 7,
    unlocked: false,
    reward: { xp: 200, coins: 50, badge: '🔥' }
  },
  {
    id: 'mission_veteran',
    title: 'Veterano delle Missioni',
    description: 'Completa 50 missioni totali',
    icon: '⭐',
    progress: 47,
    maxProgress: 50,
    unlocked: false,
    reward: { xp: 500, coins: 150, badge: '⭐' }
  },
  {
    id: 'weekly_warrior',
    title: 'Guerriero Settimanale',
    description: 'Completa tutte le missioni settimanali',
    icon: '👑',
    progress: 2,
    maxProgress: 3,
    unlocked: false,
    reward: { xp: 300, coins: 100, badge: '👑' }
  }
]

// ====================================
// COMPONENTS
// ====================================
const StatsOverview = ({ stats }: { stats: MissionStats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card variant="glass" className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-400">Completate</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalCompleted}</p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.dailyCompleted} daily • {stats.weeklyCompleted} weekly
          </p>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass" className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-400">XP Totali</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalXpEarned}</p>
          <p className="text-xs text-gray-500 mt-1">
            Level up prossimo: 750 XP
          </p>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card variant="glass" className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Coins className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-gray-400">Coins Totali</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalCoinsEarned}</p>
          <p className="text-xs text-gray-500 mt-1">
            Saldo attuale: 320
          </p>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card variant="glass" className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <span className="text-sm text-gray-400">Completion</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.completionRate}%</p>
          <div className="w-full h-1 bg-gray-700 rounded-full mt-2">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
  const progressPercentage = (achievement.progress / achievement.maxProgress) * 100

  return (
    <Card 
      variant="glass" 
      className={cn(
        "p-4 transition-all",
        achievement.unlocked && "bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/30"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "text-3xl p-2 rounded-lg",
          achievement.unlocked ? "bg-green-500/20" : "bg-gray-800"
        )}>
          {achievement.icon}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-white">{achievement.title}</h4>
            {achievement.unlocked && (
              <CheckCircle className="w-4 h-4 text-green-400" />
            )}
          </div>
          
          <p className="text-xs text-gray-400 mb-2">{achievement.description}</p>
          
          {!achievement.unlocked && (
            <>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500">
                  {achievement.progress}/{achievement.maxProgress}
                </span>
                <span className="text-xs text-indigo-400">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </>
          )}
          
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span className="text-gray-400">{achievement.reward.xp} XP</span>
            </span>
            <span className="flex items-center gap-1">
              <Coins className="w-3 h-3 text-yellow-600" />
              <span className="text-gray-400">{achievement.reward.coins}</span>
            </span>
            {achievement.reward.badge && (
              <span className="text-lg">{achievement.reward.badge}</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

const MissionTipsWidget = () => {
  const tips = [
    {
      icon: '💡',
      title: 'Suggerimento Pro',
      text: 'Completa le missioni giornaliere prima di mezzogiorno per massimizzare il tuo streak!'
    },
    {
      icon: '🎯',
      title: 'Focus Settimanale',
      text: 'Le missioni settimanali danno 5x più XP delle giornaliere'
    },
    {
      icon: '🔥',
      title: 'Streak Bonus',
      text: 'Ogni 7 giorni di streak consecutivo sblocchi un bonus speciale'
    }
  ]

  const [currentTip, setCurrentTip] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card variant="gradient" className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{tips[currentTip].icon}</span>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-white mb-1">
            {tips[currentTip].title}
          </h4>
          <p className="text-xs text-gray-300">
            {tips[currentTip].text}
          </p>
        </div>
      </div>
    </Card>
  )
}

const ProgressWidget = ({ stats }: { stats: MissionStats }) => {
  return (
    <Card variant="glass" className="p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-500" />
        I Tuoi Progressi
      </h3>
      
      <div className="space-y-4">
        {/* Current Streak */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Streak Attuale</span>
            <span className="text-sm font-bold text-orange-400 flex items-center gap-1">
              <Flame className="w-4 h-4" />
              {stats.currentStreak} giorni
            </span>
          </div>
          <div className="flex gap-1">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 h-2 rounded-full",
                  i < stats.currentStreak
                    ? "bg-gradient-to-r from-orange-500 to-red-500"
                    : "bg-gray-800"
                )}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Record: {stats.bestStreak} giorni
          </p>
        </div>

        {/* Weekly Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Progress Settimanale</span>
            <span className="text-sm font-bold text-indigo-400">
              12/21 missioni
            </span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: '57%' }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Level Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Prossimo Level</span>
            <span className="text-sm font-bold text-yellow-400">
              Level 21
            </span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
              initial={{ width: 0 }}
              animate={{ width: '65%' }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            750 XP rimanenti
          </p>
        </div>
      </div>
    </Card>
  )
}

// ====================================
// MAIN COMPONENT
// ====================================
export default function MissionsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user } = useUserStore()
  
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<MissionStats>(MOCK_STATS)
  const [achievements, setAchievements] = useState<Achievement[]>(MOCK_ACHIEVEMENTS)
  const [currentUserId, setCurrentUserId] = useState<string>('')

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)
      
      // Check for authenticated user
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        setCurrentUserId(authUser.id)
        // Load real stats from database
        await loadMissionStats(authUser.id)
      } else {
        // Use demo mode
        const savedUser = localStorage.getItem('fitduel_user')
        if (savedUser) {
          const userData = JSON.parse(savedUser)
          setCurrentUserId(userData.id || 'demo-user')
        } else {
          router.push('/login')
          return
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      // Use demo mode as fallback
      setCurrentUserId('demo-user')
    } finally {
      setLoading(false)
    }
  }

  const loadMissionStats = async (userId: string) => {
    try {
      // Load real mission statistics from database
      // For now using mock data
      setStats(MOCK_STATS)
      setAchievements(MOCK_ACHIEVEMENTS)
    } catch (error) {
      console.error('Error loading mission stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <Target className="w-12 h-12 text-indigo-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Caricamento missioni...</p>
        </div>
      </div>
    )
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
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Missioni</h1>
                  <p className="text-sm text-gray-400">Obiettivi e ricompense</p>
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
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
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
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-2">
            Benvenuto nelle Missioni! 🎯
          </h2>
          <p className="text-gray-400">
            Completa obiettivi giornalieri e settimanali per guadagnare XP e coins
          </p>
        </motion.div>

        {/* Stats Overview */}
        <StatsOverview stats={stats} />

        {/* Mission Tips */}
        <div className="mb-6">
          <MissionTipsWidget />
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Missions System - Main Content */}
          <div className="lg:col-span-2">
            <DailyMissionsSystem currentUserId={currentUserId} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Widget */}
            <ProgressWidget stats={stats} />

            {/* Achievements */}
            <Card variant="glass" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Achievement
                </h3>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                {achievements.map((achievement) => (
                  <AchievementCard 
                    key={achievement.id} 
                    achievement={achievement}
                  />
                ))}
              </div>
            </Card>

            {/* Leaderboard Widget */}
            <Card variant="glass" className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                Top Completatori
              </h3>
              
              <div className="space-y-3">
                {[
                  { rank: 1, name: 'MissionMaster', completed: 142, badge: '🥇' },
                  { rank: 2, name: 'TaskKiller', completed: 128, badge: '🥈' },
                  { rank: 3, name: 'GoalGetter', completed: 115, badge: '🥉' },
                  { rank: 4, name: 'Tu', completed: 47, badge: '🎯', isYou: true }
                ].map((player) => (
                  <div
                    key={player.rank}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      player.isYou ? "bg-indigo-500/20 border border-indigo-500/30" : "bg-gray-800/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{player.badge}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {player.name}
                          {player.isYou && (
                            <span className="ml-2 text-xs bg-indigo-500/30 px-2 py-0.5 rounded">TU</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">#{player.rank} Classifica</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{player.completed}</p>
                      <p className="text-xs text-gray-400">missioni</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button variant="ghost" size="sm" className="w-full mt-4">
                Vedi Classifica Completa
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Card>

            {/* Quick Stats */}
            <Card variant="glass" className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Statistiche Rapide
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Media Form Score</span>
                  <span className="text-white font-medium">82%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tempo Medio</span>
                  <span className="text-white font-medium">12 min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Missione Preferita</span>
                  <span className="text-white font-medium">Guerriero</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Orario Preferito</span>
                  <span className="text-white font-medium">18:00</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}