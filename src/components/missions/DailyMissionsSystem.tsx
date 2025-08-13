'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Target, Trophy, Star, Clock, Flame, Zap, Award,
  CheckCircle, Lock, Gift, Calendar, TrendingUp,
  Users, Activity, Timer, Coins, Crown, Badge,
  RefreshCw, AlertCircle, Sparkles, ChevronRight,
  PlayCircle, Pause, RotateCcw, Eye, EyeOff
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ====================================
// TYPES & INTERFACES
// ====================================
export type MissionType = 'daily' | 'weekly' | 'special' | 'progressive'
export type MissionCategory = 'duels' | 'exercise' | 'social' | 'streak' | 'performance'
export type MissionDifficulty = 'easy' | 'medium' | 'hard' | 'extreme'
export type MissionStatus = 'active' | 'completed' | 'locked' | 'expired'

export interface Mission {
  id: string
  title: string
  description: string
  type: MissionType
  category: MissionCategory
  difficulty: MissionDifficulty
  status: MissionStatus
  target_value: number
  current_progress: number
  reward_xp: number
  reward_coins: number
  reward_badges?: string[]
  streak_bonus?: number
  expires_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
  metadata?: {
    icon?: string
    color?: string
    requirements?: string[]
    bonus_conditions?: string[]
  }
}

export interface UserMissionProgress {
  id: string
  user_id: string
  mission_id: string
  current_progress: number
  is_completed: boolean
  completed_at?: string
  streak_count: number
  last_reset_date: string
  created_at: string
  updated_at: string
}

export interface MissionReward {
  xp: number
  coins: number
  badges: string[]
  streak_bonus: number
  total_xp: number
  total_coins: number
}

// ====================================
// MISSION TEMPLATES
// ====================================
const DAILY_MISSIONS_TEMPLATES = [
  {
    id: 'daily_duels_3',
    title: 'Guerriero Quotidiano',
    description: 'Vinci 3 duelli oggi',
    category: 'duels' as MissionCategory,
    difficulty: 'easy' as MissionDifficulty,
    target_value: 3,
    reward_xp: 100,
    reward_coins: 25,
    metadata: { icon: '⚔️', color: 'blue' }
  },
  {
    id: 'daily_exercise_5',
    title: 'Atleta Costante',
    description: 'Completa 5 esercizi con form score >80%',
    category: 'performance' as MissionCategory,
    difficulty: 'medium' as MissionDifficulty,
    target_value: 5,
    reward_xp: 150,
    reward_coins: 40,
    metadata: { icon: '💪', color: 'green' }
  },
  {
    id: 'daily_friends_2',
    title: 'Sociale',
    description: 'Sfida 2 amici diversi',
    category: 'social' as MissionCategory,
    difficulty: 'medium' as MissionDifficulty,
    target_value: 2,
    reward_xp: 200,
    reward_coins: 50,
    metadata: { icon: '👥', color: 'purple' }
  },
  {
    id: 'daily_time_15',
    title: 'Endurance',
    description: 'Allenati per 15 minuti totali',
    category: 'exercise' as MissionCategory,
    difficulty: 'easy' as MissionDifficulty,
    target_value: 900, // seconds
    reward_xp: 75,
    reward_coins: 20,
    metadata: { icon: '⏱️', color: 'orange' }
  },
  {
    id: 'daily_streak_1',
    title: 'Dedizione',
    description: 'Mantieni lo streak giornaliero',
    category: 'streak' as MissionCategory,
    difficulty: 'easy' as MissionDifficulty,
    target_value: 1,
    reward_xp: 50,
    reward_coins: 15,
    streak_bonus: 25,
    metadata: { icon: '🔥', color: 'red' }
  }
]

const WEEKLY_MISSIONS_TEMPLATES = [
  {
    id: 'weekly_duels_20',
    title: 'Campione Settimanale',
    description: 'Vinci 20 duelli questa settimana',
    category: 'duels' as MissionCategory,
    difficulty: 'hard' as MissionDifficulty,
    target_value: 20,
    reward_xp: 500,
    reward_coins: 150,
    reward_badges: ['weekly_champion'],
    metadata: { icon: '👑', color: 'gold' }
  },
  {
    id: 'weekly_perfect_10',
    title: 'Perfezionista',
    description: 'Ottieni 10 form score perfetti (>95%)',
    category: 'performance' as MissionCategory,
    difficulty: 'extreme' as MissionDifficulty,
    target_value: 10,
    reward_xp: 800,
    reward_coins: 200,
    reward_badges: ['perfectionist'],
    metadata: { icon: '⭐', color: 'yellow' }
  },
  {
    id: 'weekly_social_10',
    title: 'Re Sociale',
    description: 'Aggiungi 5 nuovi amici e vinci 10 sfide con amici',
    category: 'social' as MissionCategory,
    difficulty: 'hard' as MissionDifficulty,
    target_value: 10,
    reward_xp: 600,
    reward_coins: 175,
    metadata: { icon: '🤝', color: 'indigo' }
  }
]

// ====================================
// MISSION CARD COMPONENT
// ====================================
const MissionCard = ({ 
  mission, 
  userProgress, 
  onClaim 
}: { 
  mission: Mission
  userProgress?: UserMissionProgress
  onClaim: (missionId: string) => void
}) => {
  const progress = userProgress ? userProgress.current_progress : mission.current_progress
  const isCompleted = userProgress ? userProgress.is_completed : mission.status === 'completed'
  const progressPercentage = Math.min((progress / mission.target_value) * 100, 100)
  
  const getDifficultyColor = (difficulty: MissionDifficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20'
      case 'hard': return 'text-orange-400 bg-orange-500/20'
      case 'extreme': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getTypeIcon = (type: MissionType) => {
    switch (type) {
      case 'daily': return <Calendar className="w-4 h-4" />
      case 'weekly': return <Clock className="w-4 h-4" />
      case 'special': return <Sparkles className="w-4 h-4" />
      case 'progressive': return <TrendingUp className="w-4 h-4" />
    }
  }

  const getCategoryIcon = (category: MissionCategory) => {
    switch (category) {
      case 'duels': return <Target className="w-5 h-5" />
      case 'exercise': return <Activity className="w-5 h-5" />
      case 'social': return <Users className="w-5 h-5" />
      case 'streak': return <Flame className="w-5 h-5" />
      case 'performance': return <Trophy className="w-5 h-5" />
      default: return <Star className="w-5 h-5" />
    }
  }

  const formatProgress = (current: number, target: number, category: MissionCategory) => {
    if (category === 'exercise' && mission.id.includes('time')) {
      // Convert seconds to minutes for time-based missions
      const currentMins = Math.floor(current / 60)
      const targetMins = Math.floor(target / 60)
      return `${currentMins}/${targetMins} min`
    }
    return `${current}/${target}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <Card 
        variant="glass" 
        className={cn(
          "p-4 relative overflow-hidden transition-all duration-300",
          isCompleted ? "border-green-500/50 bg-green-500/5" : "hover:bg-gray-800/30",
          mission.status === 'locked' && "opacity-50"
        )}
      >
        {/* Background glow effect for completed missions */}
        {isCompleted && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 pointer-events-none" />
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              mission.metadata?.color === 'blue' && "bg-blue-500/20 text-blue-400",
              mission.metadata?.color === 'green' && "bg-green-500/20 text-green-400",
              mission.metadata?.color === 'purple' && "bg-purple-500/20 text-purple-400",
              mission.metadata?.color === 'orange' && "bg-orange-500/20 text-orange-400",
              mission.metadata?.color === 'red' && "bg-red-500/20 text-red-400",
              mission.metadata?.color === 'gold' && "bg-yellow-500/20 text-yellow-400",
              mission.metadata?.color === 'yellow' && "bg-yellow-500/20 text-yellow-400",
              mission.metadata?.color === 'indigo' && "bg-indigo-500/20 text-indigo-400",
              !mission.metadata?.color && "bg-gray-500/20 text-gray-400"
            )}>
              {getCategoryIcon(mission.category)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">{mission.title}</h3>
                {getTypeIcon(mission.type)}
              </div>
              <p className="text-sm text-gray-400 mt-1">{mission.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-xs px-2 py-1 rounded-full font-medium',
              getDifficultyColor(mission.difficulty)
            )}>
              {mission.difficulty.charAt(0).toUpperCase() + mission.difficulty.slice(1)}
            </span>
            {mission.status === 'locked' && <Lock className="w-4 h-4 text-gray-500" />}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-300">
              {formatProgress(progress, mission.target_value, mission.category)}
            </span>
            <span className="text-sm font-medium text-indigo-400">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isCompleted ? "bg-green-500" : "bg-gradient-to-r from-indigo-500 to-purple-500"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Rewards */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-white font-medium">{mission.reward_xp} XP</span>
            </div>
            <div className="flex items-center gap-1">
              <Coins className="w-4 h-4 text-yellow-600" />
              <span className="text-white font-medium">{mission.reward_coins}</span>
            </div>
            {mission.streak_bonus && (
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-orange-400 text-xs">+{mission.streak_bonus}</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div>
            {isCompleted ? (
              <Button
                size="sm"
                variant="gradient"
                onClick={() => onClaim(mission.id)}
                className="gap-1"
              >
                <Gift className="w-4 h-4" />
                Riscatta
              </Button>
            ) : mission.status === 'locked' ? (
              <Button size="sm" variant="ghost" disabled>
                <Lock className="w-4 h-4" />
              </Button>
            ) : (
              <div className="px-3 py-1 bg-gray-800 rounded-lg">
                <span className="text-xs text-gray-400">In Corso</span>
              </div>
            )}
          </div>
        </div>

        {/* Completion Effect */}
        {isCompleted && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-2 right-2"
          >
            <CheckCircle className="w-6 h-6 text-green-500" />
          </motion.div>
        )}
      </Card>
    </motion.div>
  )
}

// ====================================
// MISSION REWARDS MODAL
// ====================================
const MissionRewardsModal = ({
  isOpen,
  onClose,
  reward
}: {
  isOpen: boolean
  onClose: () => void
  reward: MissionReward | null
}) => {
  if (!reward) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🎉 Missione Completata!"
      size="md"
    >
      <div className="text-center space-y-6">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-24 h-24 mx-auto bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center"
        >
          <Trophy className="w-12 h-12 text-white" />
        </motion.div>

        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Fantastico!</h3>
          <p className="text-gray-400">Hai completato la missione e ottenuto:</p>
        </div>

        {/* Rewards List */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3 p-4 bg-gray-800/50 rounded-lg">
            <Zap className="w-6 h-6 text-yellow-500" />
            <div className="text-left">
              <p className="text-white font-bold text-lg">{reward.total_xp} XP</p>
              <p className="text-gray-400 text-sm">
                {reward.xp} base + {reward.streak_bonus} streak bonus
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 p-4 bg-gray-800/50 rounded-lg">
            <Coins className="w-6 h-6 text-yellow-600" />
            <div className="text-left">
              <p className="text-white font-bold text-lg">{reward.total_coins} Coins</p>
              <p className="text-gray-400 text-sm">Spendili nel negozio</p>
            </div>
          </div>

          {reward.badges.length > 0 && (
            <div className="p-4 bg-purple-500/20 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Badge className="w-5 h-5 text-purple-400" />
                <span className="text-purple-400 font-medium">Badge Sbloccati</span>
              </div>
              <div className="flex gap-2 justify-center">
                {reward.badges.map((badge, i) => (
                  <span key={i} className="text-2xl">{badge}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button variant="gradient" onClick={onClose} className="w-full">
          Continua
        </Button>
      </div>
    </Modal>
  )
}

// ====================================
// DAILY STREAK COMPONENT
// ====================================
const DailyStreakWidget = ({
  currentStreak,
  bestStreak
}: {
  currentStreak: number
  bestStreak: number
}) => {
  const streakDays = 7
  const days = ['L', 'M', 'M', 'G', 'V', 'S', 'D']
  
  return (
    <Card variant="gradient" className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-orange-500/20 rounded-lg">
          <Flame className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <h3 className="font-bold text-white">Streak Giornaliero</h3>
          <p className="text-sm text-gray-400">Mantieni la costanza</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{currentStreak}</p>
          <p className="text-xs text-gray-400">Giorni Attuali</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-500">{bestStreak}</p>
          <p className="text-xs text-gray-400">Record</p>
        </div>
      </div>

      {/* Streak Visual */}
      <div className="flex gap-1 justify-center">
        {days.map((day, index) => (
          <div
            key={index}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
              index < currentStreak
                ? "bg-orange-500 text-white"
                : "bg-gray-800 text-gray-500"
            )}
          >
            {day}
          </div>
        ))}
      </div>
    </Card>
  )
}

// ====================================
// MAIN MISSIONS SYSTEM COMPONENT
// ====================================
export const DailyMissionsSystem = ({
  currentUserId
}: {
  currentUserId: string
}) => {
  const [missions, setMissions] = useState<Mission[]>([])
  const [userProgress, setUserProgress] = useState<Map<string, UserMissionProgress>>(new Map())
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<MissionType>('daily')
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [currentReward, setCurrentReward] = useState<MissionReward | null>(null)
  const [currentStreak, setCurrentStreak] = useState(5)
  const [bestStreak, setBestStreak] = useState(12)
  const [refreshing, setRefreshing] = useState(false)

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadMissions()
    loadUserProgress()
  }, [currentUserId, selectedTab])

  const loadMissions = async () => {
    try {
      setLoading(true)
      
      // Check if we have Supabase connection
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Load real missions from database
        const { data, error } = await supabase
          .from('missions')
          .select('*')
          .eq('type', selectedTab)
          .eq('status', 'active')
          .order('created_at', { ascending: true })

        if (error) throw error
        setMissions(data || [])
      } else {
        // Load mock missions for demo mode
        loadMockMissions()
      }
    } catch (error) {
      console.error('Error loading missions:', error)
      // Fallback to mock missions
      loadMockMissions()
    } finally {
      setLoading(false)
    }
  }

  const loadMockMissions = () => {
    const templates = selectedTab === 'daily' ? DAILY_MISSIONS_TEMPLATES : 
                     selectedTab === 'weekly' ? WEEKLY_MISSIONS_TEMPLATES : []
    
    const mockMissions: Mission[] = templates.map((template, index) => ({
      id: template.id,
      title: template.title,
      description: template.description,
      type: selectedTab,
      category: template.category,
      difficulty: template.difficulty,
      status: 'active' as MissionStatus,
      target_value: template.target_value,
      current_progress: Math.floor(Math.random() * template.target_value * 0.8), // Random progress
      reward_xp: template.reward_xp,
      reward_coins: template.reward_coins,
      reward_badges: template.reward_badges,
      streak_bonus: template.streak_bonus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: template.metadata
    }))

    setMissions(mockMissions)
  }

  const loadUserProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data, error } = await supabase
          .from('user_mission_progress')
          .select('*')
          .eq('user_id', user.id)

        if (error) throw error
        
        const progressMap = new Map<string, UserMissionProgress>()
        data?.forEach(progress => {
          progressMap.set(progress.mission_id, progress)
        })
        
        setUserProgress(progressMap)
      }
    } catch (error) {
      console.error('Error loading user progress:', error)
    }
  }

  const claimMissionReward = async (missionId: string) => {
    try {
      const mission = missions.find(m => m.id === missionId)
      if (!mission) return

      const progress = userProgress.get(missionId)
      const streakBonus = (progress?.streak_count || 0) * (mission.streak_bonus || 0)
      
      const reward: MissionReward = {
        xp: mission.reward_xp,
        coins: mission.reward_coins,
        badges: mission.reward_badges || [],
        streak_bonus: streakBonus,
        total_xp: mission.reward_xp + streakBonus,
        total_coins: mission.reward_coins
      }

      // Update user stats in database
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Add XP and coins to user
        await supabase.rpc('add_user_rewards', {
          p_user_id: user.id,
          p_xp: reward.total_xp,
          p_coins: reward.total_coins
        })

        // Mark mission as claimed
        await supabase
          .from('user_mission_progress')
          .update({ 
            is_completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('mission_id', missionId)
      }

      // Show reward modal
      setCurrentReward(reward)
      setShowRewardModal(true)

      // Update local state
      setMissions(prev => 
        prev.map(m => 
          m.id === missionId 
            ? { ...m, status: 'completed' as MissionStatus }
            : m
        )
      )

    } catch (error) {
      console.error('Error claiming reward:', error)
    }
  }

  const refreshMissions = async () => {
    setRefreshing(true)
    await loadMissions()
    await loadUserProgress()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const getTabStats = (type: MissionType) => {
    const typeMissions = missions.filter(m => m.type === type)
    const completed = typeMissions.filter(m => {
      const progress = userProgress.get(m.id)
      return progress?.is_completed || m.status === 'completed'
    }).length
    
    return { total: typeMissions.length, completed }
  }

  const filteredMissions = missions.filter(m => m.type === selectedTab)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Missioni</h2>
          <p className="text-gray-400">Completa obiettivi e ottieni ricompense</p>
        </div>
        
        <Button 
          variant="ghost"
          onClick={refreshMissions}
          disabled={refreshing}
        >
          <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
        </Button>
      </div>

      {/* Daily Streak Widget */}
      <DailyStreakWidget
        currentStreak={currentStreak}
        bestStreak={bestStreak}
      />

      {/* Mission Tabs */}
      <div className="flex gap-2">
        {([
          { id: 'daily', label: 'Giornaliere', icon: Calendar },
          { id: 'weekly', label: 'Settimanali', icon: Clock },
          { id: 'special', label: 'Speciali', icon: Sparkles },
          { id: 'progressive', label: 'Progressive', icon: TrendingUp }
        ] as const).map((tab) => {
          const Icon = tab.icon
          const stats = getTabStats(tab.id)
          
          return (
            <Button
              key={tab.id}
              variant={selectedTab === tab.id ? 'gradient' : 'ghost'}
              onClick={() => setSelectedTab(tab.id)}
              className="relative"
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
              {stats.total > 0 && (
                <span className="ml-2 text-xs bg-gray-800 px-2 py-0.5 rounded-full">
                  {stats.completed}/{stats.total}
                </span>
              )}
            </Button>
          )
        })}
      </div>

      {/* Missions Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Caricamento missioni...</p>
            </div>
          </div>
        ) : filteredMissions.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Nessuna missione disponibile
            </h3>
            <p className="text-gray-400 mb-6">
              Le missioni {selectedTab === 'daily' ? 'giornaliere' : 'settimanali'} si resettano automaticamente.
            </p>
            <Button variant="gradient" onClick={refreshMissions}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Ricarica
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                userProgress={userProgress.get(mission.id)}
                onClaim={claimMissionReward}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reward Modal */}
      <MissionRewardsModal
        isOpen={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        reward={currentReward}
      />
    </div>
  )
}

// ====================================
// MISSION CONSTANTS (for constants.ts)
// ====================================
export const MISSION_CONSTANTS = {
  TYPES: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    SPECIAL: 'special',
    PROGRESSIVE: 'progressive',
  } as const,

  CATEGORIES: {
    DUELS: 'duels',
    EXERCISE: 'exercise',
    SOCIAL: 'social',
    STREAK: 'streak',
    PERFORMANCE: 'performance',
  } as const,

  DIFFICULTIES: {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
    EXTREME: 'extreme',
  } as const,

  STATUS: {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    LOCKED: 'locked',
    EXPIRED: 'expired',
  } as const,

  RESET_TIMES: {
    DAILY: '00:00:00',
    WEEKLY: 'Monday 00:00:00',
  } as const,

  SUCCESS_MESSAGES: {
    MISSION_COMPLETED: 'Missione completata! 🎉',
    REWARD_CLAIMED: 'Ricompensa riscattata con successo!',
    STREAK_MAINTAINED: 'Streak mantenuto! Continua così! 🔥',
    NEW_RECORD: 'Nuovo record personale! 🏆',
  } as const,

  ERROR_MESSAGES: {
    MISSION_NOT_FOUND: 'Missione non trovata',
    ALREADY_COMPLETED: 'Missione già completata',
    NOT_COMPLETED: 'Missione non ancora completata',
    REWARD_ALREADY_CLAIMED: 'Ricompensa già riscattata',
  } as const
}

// Export everything
export default DailyMissionsSystem