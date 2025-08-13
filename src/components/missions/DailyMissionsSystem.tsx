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
// API RESPONSE TYPES
// ====================================
interface ClaimMissionResponse {
  success: boolean
  message: string
  data?: {
    reward: MissionReward
    mission: {
      id: string
      title: string
      completed_at: string
    }
    user_stats: {
      new_xp: number
      new_coins: number
      new_level?: number
      level_up?: boolean
    }
  }
  error?: string
}

// ====================================
// MISSION TEMPLATE INTERFACE
// ====================================
interface MissionTemplate {
  id: string
  title: string
  description: string
  category: MissionCategory
  difficulty: MissionDifficulty
  target_value: number
  reward_xp: number
  reward_coins: number
  reward_badges?: string[]
  streak_bonus?: number
  metadata?: {
    icon?: string
    color?: string
    requirements?: string[]
    bonus_conditions?: string[]
  }
}

// ====================================
// MISSION TEMPLATES
// ====================================
const DAILY_MISSIONS_TEMPLATES: MissionTemplate[] = [
  {
    id: 'daily_duels_3',
    title: 'Guerriero Quotidiano',
    description: 'Vinci 3 duelli oggi',
    category: 'duels',
    difficulty: 'easy',
    target_value: 3,
    reward_xp: 100,
    reward_coins: 25,
    metadata: { icon: '⚔️', color: 'blue' }
  },
  {
    id: 'daily_exercise_5',
    title: 'Atleta Costante',
    description: 'Completa 5 esercizi con form score >80%',
    category: 'performance',
    difficulty: 'medium',
    target_value: 5,
    reward_xp: 150,
    reward_coins: 40,
    metadata: { icon: '💪', color: 'green' }
  },
  {
    id: 'daily_friends_2',
    title: 'Sociale',
    description: 'Sfida 2 amici diversi',
    category: 'social',
    difficulty: 'medium',
    target_value: 2,
    reward_xp: 200,
    reward_coins: 50,
    metadata: { icon: '👥', color: 'purple' }
  },
  {
    id: 'daily_time_15',
    title: 'Endurance',
    description: 'Allenati per 15 minuti totali',
    category: 'exercise',
    difficulty: 'easy',
    target_value: 900, // seconds
    reward_xp: 75,
    reward_coins: 20,
    metadata: { icon: '⏱️', color: 'orange' }
  },
  {
    id: 'daily_streak_1',
    title: 'Dedizione',
    description: 'Mantieni lo streak giornaliero',
    category: 'streak',
    difficulty: 'easy',
    target_value: 1,
    reward_xp: 50,
    reward_coins: 15,
    streak_bonus: 25,
    metadata: { icon: '🔥', color: 'red' }
  }
]

const WEEKLY_MISSIONS_TEMPLATES: MissionTemplate[] = [
  {
    id: 'weekly_duels_20',
    title: 'Campione Settimanale',
    description: 'Vinci 20 duelli questa settimana',
    category: 'duels',
    difficulty: 'hard',
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
    category: 'performance',
    difficulty: 'extreme',
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
    category: 'social',
    difficulty: 'hard',
    target_value: 10,
    reward_xp: 600,
    reward_coins: 175,
    reward_badges: ['social_king'],
    metadata: { icon: '🤝', color: 'indigo' }
  }
]

// ====================================
// MISSION CARD COMPONENT
// ====================================
const MissionCard = ({ 
  mission, 
  userProgress, 
  onClaim,
  isClaimingReward 
}: { 
  mission: Mission
  userProgress?: UserMissionProgress
  onClaim: (missionId: string) => Promise<void>
  isClaimingReward: boolean
}) => {
  const progress = userProgress ? userProgress.current_progress : mission.current_progress
  const isCompleted = userProgress ? userProgress.is_completed : mission.status === 'completed'
  const isClaimed = userProgress?.completed_at && userProgress.completed_at !== null
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

  const handleClaimClick = async () => {
    if (!isCompleted || isClaimed || isClaimingReward) return
    await onClaim(mission.id)
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
          isCompleted && !isClaimed ? "border-green-500/50 bg-green-500/5" : "hover:bg-gray-800/30",
          isClaimed && "border-blue-500/50 bg-blue-500/5",
          mission.status === 'locked' && "opacity-50"
        )}
      >
        {/* Background glow effect for completed missions */}
        {isCompleted && !isClaimed && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 pointer-events-none" />
        )}

        {/* Background glow effect for claimed missions */}
        {isClaimed && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
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
            {isClaimed ? (
              <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Riscattata
              </div>
            ) : isCompleted ? (
              <Button
                size="sm"
                variant="gradient"
                onClick={handleClaimClick}
                disabled={isClaimingReward}
                className="gap-1"
              >
                {isClaimingReward ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Gift className="w-4 h-4" />
                )}
                {isClaimingReward ? 'Riscatto...' : 'Riscatta +50 XP'}
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
        {isCompleted && !isClaimed && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-2 right-2"
          >
            <CheckCircle className="w-6 h-6 text-green-500" />
          </motion.div>
        )}

        {/* Claimed Effect */}
        {isClaimed && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-2 right-2"
          >
            <Badge className="w-6 h-6 text-blue-500" />
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
  reward,
  missionTitle,
  levelUp
}: {
  isOpen: boolean
  onClose: () => void
  reward: MissionReward | null
  missionTitle?: string
  levelUp?: boolean
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
          className={cn(
            "w-24 h-24 mx-auto rounded-full flex items-center justify-center",
            levelUp 
              ? "bg-gradient-to-r from-yellow-500 to-orange-500"
              : "bg-gradient-to-r from-green-500 to-blue-500"
          )}
        >
          {levelUp ? (
            <Crown className="w-12 h-12 text-white" />
          ) : (
            <Trophy className="w-12 h-12 text-white" />
          )}
        </motion.div>

        <div>
          <h3 className="text-2xl font-bold text-white mb-2">
            {levelUp ? 'Level Up!' : 'Fantastico!'}
          </h3>
          <p className="text-gray-400">
            {missionTitle ? `Hai completato "${missionTitle}" e ottenuto:` : 'Hai completato la missione e ottenuto:'}
          </p>
        </div>

        {/* Rewards List */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3 p-4 bg-gray-800/50 rounded-lg">
            <Zap className="w-6 h-6 text-yellow-500" />
            <div className="text-left">
              <p className="text-white font-bold text-lg">{reward.total_xp} XP</p>
              <p className="text-gray-400 text-sm">
                {reward.xp} base{reward.streak_bonus > 0 && ` + ${reward.streak_bonus} streak bonus`}
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

          {levelUp && (
            <div className="p-4 bg-yellow-500/20 rounded-lg">
              <div className="flex items-center justify-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-medium">Level Up Achieved!</span>
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
// API FUNCTIONS
// ====================================
async function claimMissionRewardAPI(missionId: string): Promise<ClaimMissionResponse> {
  try {
    const response = await fetch('/api/missions/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ missionId }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Errore nella richiesta')
    }

    return data
  } catch (error) {
    console.error('Error claiming mission reward:', error)
    throw error
  }
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
  const [currentMissionTitle, setCurrentMissionTitle] = useState<string>('')
  const [isLevelUp, setIsLevelUp] = useState(false)
  const [currentStreak, setCurrentStreak] = useState(5)
  const [bestStreak, setBestStreak] = useState(12)
  const [refreshing, setRefreshing] = useState(false)
  const [claimingRewards, setClaimingRewards] = useState<Set<string>>(new Set())

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
          .from('daily_missions')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true })

        if (error) throw error
        
        // Convert database format to component format
        const formattedMissions: Mission[] = (data || []).map(mission => ({
          id: mission.id,
          title: mission.name,
          description: mission.description,
          type: selectedTab,
          category: 'streak' as MissionCategory, // Default, could be dynamic
          difficulty: 'easy' as MissionDifficulty, // Default, could be dynamic
          status: 'active' as MissionStatus,
          target_value: mission.target_value || 1,
          current_progress: 0, // Will be updated from user progress
          reward_xp: mission.xp_reward || 50,
          reward_coins: mission.coins_reward || 10,
          created_at: mission.created_at,
          updated_at: mission.updated_at,
          metadata: { icon: '🔥', color: 'red' }
        }))
        
        setMissions(formattedMissions)
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
    
    const mockMissions: Mission[] = templates.map((template) => ({
      id: template.id,
      title: template.title,
      description: template.description,
      type: selectedTab,
      category: template.category,
      difficulty: template.difficulty,
      status: 'active' as MissionStatus,
      target_value: template.target_value,
      current_progress: template.id === 'daily_streak_1' ? 1 : Math.floor(Math.random() * template.target_value * 0.8), // Make "Dedizione" completed
      reward_xp: template.reward_xp,
      reward_coins: template.reward_coins,
      reward_badges: template.reward_badges || [],
      streak_bonus: template.streak_bonus || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: template.metadata
    }))

    // Set "Dedizione" mission as completed but not claimed
    const dedicazioneMission = mockMissions.find(m => m.id === 'daily_streak_1')
    if (dedicazioneMission) {
      dedicazioneMission.current_progress = dedicazioneMission.target_value
      dedicazioneMission.status = 'completed'
    }

    setMissions(mockMissions)
  }

  const loadUserProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data, error } = await supabase
          .from('user_missions')
          .select('*')
          .eq('user_id', user.id)

        if (error) throw error
        
        const progressMap = new Map<string, UserMissionProgress>()
        data?.forEach(progress => {
          progressMap.set(progress.mission_id, progress)
        })
        
        setUserProgress(progressMap)
      } else {
        // Mock progress for demo mode
        const mockProgress = new Map<string, UserMissionProgress>()
        
        // Make "Dedizione" mission appear completed but not claimed
        mockProgress.set('daily_streak_1', {
          id: 'progress_1',
          user_id: currentUserId,
          mission_id: 'daily_streak_1',
          current_progress: 1,
          is_completed: true,
          streak_count: 5,
          last_reset_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        
        setUserProgress(mockProgress)
      }
    } catch (error) {
      console.error('Error loading user progress:', error)
    }
  }

  const claimMissionReward = async (missionId: string) => {
    try {
      setClaimingRewards(prev => new Set(prev).add(missionId))
      
      const mission = missions.find(m => m.id === missionId)
      if (!mission) {
        throw new Error('Missione non trovata')
      }

      // Call API to claim reward
      const response = await claimMissionRewardAPI(missionId)
      
      if (!response.success) {
        throw new Error(response.message || 'Errore nel riscattare la ricompensa')
      }

      // Update local state
      const progress = userProgress.get(missionId)
      if (progress) {
        const updatedProgress = {
          ...progress,
          completed_at: new Date().toISOString()
        }
        
        setUserProgress(prev => {
          const newMap = new Map(prev)
          newMap.set(missionId, updatedProgress)
          return newMap
        })
      }

      // Show reward modal
      if (response.data) {
        setCurrentReward(response.data.reward)
        setCurrentMissionTitle(response.data.mission.title)
        setIsLevelUp(response.data.user_stats.level_up || false)
        setShowRewardModal(true)
      }

    } catch (error) {
      console.error('Error claiming reward:', error)
      // Show error notification (you could add a toast here)
      alert(error instanceof Error ? error.message : 'Errore nel riscattare la ricompensa')
    } finally {
      setClaimingRewards(prev => {
        const newSet = new Set(prev)
        newSet.delete(missionId)
        return newSet
      })
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
                isClaimingReward={claimingRewards.has(mission.id)}
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
        missionTitle={currentMissionTitle}
        levelUp={isLevelUp}
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