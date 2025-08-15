'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Target, Trophy, Star, Clock, Flame, Zap, Award,
  Calendar, TrendingUp, Gift, CheckCircle, Filter,
  ChevronRight, Sparkles, BarChart3, Medal, Timer,
  Coins, Shield, Activity, RefreshCw, Info, Crown,
  Loader2, AlertCircle, Swords, Heart, Brain, Dumbbell
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUserStore } from '@/stores/useUserStore'

// ====================================
// TYPES
// ====================================
interface Mission {
  id: string
  title: string
  description: string
  type: 'daily' | 'weekly' | 'special'
  category: 'exercise' | 'duel' | 'streak' | 'social' | 'achievement'
  icon: string
  difficulty: 'easy' | 'medium' | 'hard'
  xpReward: number
  coinReward: number
  progress: number
  target: number
  isCompleted: boolean
  isClaimed: boolean
  expiresAt: string
  createdAt: string
  metadata?: {
    exerciseType?: string
    duelType?: string
    streakType?: string
  }
}

// ====================================
// AI MISSION GENERATOR
// ====================================
class MissionGenerator {
  private userLevel: number
  private userStats: any
  private currentDay: number
  private currentWeek: number

  constructor(userLevel: number = 1, userStats: any = {}) {
    this.userLevel = userLevel
    this.userStats = userStats
    this.currentDay = new Date().getDay()
    this.currentWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
  }

  // Generate daily missions based on user level and preferences
  generateDailyMissions(): Mission[] {
    const missions: Mission[] = []
    const baseId = `daily_${Date.now()}`
    
    // Exercise Mission (sempre presente)
    missions.push(this.generateExerciseMission(`${baseId}_ex`, 'daily'))
    
    // Duel Mission (sempre presente)
    missions.push(this.generateDuelMission(`${baseId}_duel`, 'daily'))
    
    // Random third mission based on level
    if (this.userLevel >= 5) {
      const missionTypes = ['streak', 'social', 'achievement']
      const randomType = missionTypes[Math.floor(Math.random() * missionTypes.length)]
      
      switch(randomType) {
        case 'streak':
          missions.push(this.generateStreakMission(`${baseId}_streak`, 'daily'))
          break
        case 'social':
          missions.push(this.generateSocialMission(`${baseId}_social`, 'daily'))
          break
        case 'achievement':
          missions.push(this.generateAchievementMission(`${baseId}_ach`, 'daily'))
          break
      }
    }
    
    // Special bonus mission for high level players
    if (this.userLevel >= 10 && Math.random() > 0.7) {
      missions.push(this.generateSpecialMission(`${baseId}_special`))
    }
    
    return missions
  }

  // Generate weekly missions
  generateWeeklyMissions(): Mission[] {
    const missions: Mission[] = []
    const baseId = `weekly_${this.currentWeek}`
    
    // Weekly Exercise Challenge
    missions.push({
      id: `${baseId}_ex`,
      title: 'Maestro del Fitness',
      description: 'Completa 20 esercizi questa settimana',
      type: 'weekly',
      category: 'exercise',
      icon: '💪',
      difficulty: 'hard',
      xpReward: 500,
      coinReward: 150,
      progress: 0,
      target: 20,
      isCompleted: false,
      isClaimed: false,
      expiresAt: this.getWeeklyExpiration(),
      createdAt: new Date().toISOString(),
      metadata: { exerciseType: 'any' }
    })
    
    // Weekly Duel Challenge
    missions.push({
      id: `${baseId}_duel`,
      title: 'Campione Settimanale',
      description: 'Vinci 10 duelli questa settimana',
      type: 'weekly',
      category: 'duel',
      icon: '🏆',
      difficulty: 'hard',
      xpReward: 600,
      coinReward: 200,
      progress: 0,
      target: 10,
      isCompleted: false,
      isClaimed: false,
      expiresAt: this.getWeeklyExpiration(),
      createdAt: new Date().toISOString(),
      metadata: { duelType: 'any' }
    })
    
    // Weekly Streak Challenge
    missions.push({
      id: `${baseId}_streak`,
      title: 'Costanza Leggendaria',
      description: 'Mantieni una streak di 7 giorni',
      type: 'weekly',
      category: 'streak',
      icon: '🔥',
      difficulty: 'medium',
      xpReward: 400,
      coinReward: 100,
      progress: 0,
      target: 7,
      isCompleted: false,
      isClaimed: false,
      expiresAt: this.getWeeklyExpiration(),
      createdAt: new Date().toISOString(),
      metadata: { streakType: 'daily_login' }
    })
    
    return missions
  }

  private generateExerciseMission(id: string, type: 'daily' | 'weekly'): Mission {
    const exercises = [
      { name: 'Push-Up', icon: '💪', difficulty: 'medium', reps: [20, 30, 50] },
      { name: 'Squat', icon: '🦵', difficulty: 'easy', reps: [30, 50, 75] },
      { name: 'Plank', icon: '🏋️', difficulty: 'hard', time: [30, 60, 90] },
      { name: 'Burpee', icon: '🔥', difficulty: 'hard', reps: [10, 15, 25] },
      { name: 'Jumping Jack', icon: '⭐', difficulty: 'easy', reps: [50, 75, 100] }
    ]
    
    const exercise = exercises[Math.floor(Math.random() * exercises.length)]
    const difficultyIndex = this.userLevel < 5 ? 0 : this.userLevel < 10 ? 1 : 2
    const target = exercise.time ? exercise.time[difficultyIndex] : exercise.reps![difficultyIndex]
    const unit = exercise.time ? 'secondi' : 'ripetizioni'
    
    return {
      id,
      title: `${exercise.name} Master`,
      description: `Completa ${target} ${unit} di ${exercise.name}`,
      type,
      category: 'exercise',
      icon: exercise.icon,
      difficulty: exercise.difficulty as 'easy' | 'medium' | 'hard',
      xpReward: type === 'daily' ? 50 + (difficultyIndex * 25) : 200 + (difficultyIndex * 50),
      coinReward: type === 'daily' ? 10 + (difficultyIndex * 10) : 50 + (difficultyIndex * 25),
      progress: 0,
      target,
      isCompleted: false,
      isClaimed: false,
      expiresAt: type === 'daily' ? this.getDailyExpiration() : this.getWeeklyExpiration(),
      createdAt: new Date().toISOString(),
      metadata: { exerciseType: exercise.name.toLowerCase().replace(' ', '_') }
    }
  }

  private generateDuelMission(id: string, type: 'daily' | 'weekly'): Mission {
    const duelMissions = [
      { title: 'Guerriero', desc: 'Vinci {target} duelli', target: [1, 2, 3] },
      { title: 'Sfidante', desc: 'Partecipa a {target} duelli', target: [2, 3, 5] },
      { title: 'Vincitore', desc: 'Vinci {target} duelli consecutivi', target: [2, 3, 4] },
      { title: 'Combattente', desc: 'Completa {target} duelli', target: [2, 4, 6] }
    ]
    
    const mission = duelMissions[Math.floor(Math.random() * duelMissions.length)]
    const difficultyIndex = this.userLevel < 5 ? 0 : this.userLevel < 10 ? 1 : 2
    const target = mission.target[difficultyIndex]
    
    return {
      id,
      title: mission.title,
      description: mission.desc.replace('{target}', target.toString()),
      type,
      category: 'duel',
      icon: '⚔️',
      difficulty: difficultyIndex === 0 ? 'easy' : difficultyIndex === 1 ? 'medium' : 'hard',
      xpReward: type === 'daily' ? 75 + (difficultyIndex * 25) : 300 + (difficultyIndex * 100),
      coinReward: type === 'daily' ? 20 + (difficultyIndex * 10) : 75 + (difficultyIndex * 25),
      progress: 0,
      target,
      isCompleted: false,
      isClaimed: false,
      expiresAt: type === 'daily' ? this.getDailyExpiration() : this.getWeeklyExpiration(),
      createdAt: new Date().toISOString(),
      metadata: { duelType: 'any' }
    }
  }

  private generateStreakMission(id: string, type: 'daily' | 'weekly'): Mission {
    return {
      id,
      title: 'Streak Builder',
      description: 'Mantieni una streak di vittorie di almeno 3',
      type,
      category: 'streak',
      icon: '🔥',
      difficulty: 'medium',
      xpReward: 100,
      coinReward: 30,
      progress: 0,
      target: 3,
      isCompleted: false,
      isClaimed: false,
      expiresAt: type === 'daily' ? this.getDailyExpiration() : this.getWeeklyExpiration(),
      createdAt: new Date().toISOString(),
      metadata: { streakType: 'win_streak' }
    }
  }

  private generateSocialMission(id: string, type: 'daily' | 'weekly'): Mission {
    const socialMissions = [
      { title: 'Socializzatore', desc: 'Aggiungi 2 nuovi amici', target: 2, icon: '👥' },
      { title: 'Supporter', desc: 'Incoraggia 3 amici', target: 3, icon: '💬' },
      { title: 'Team Player', desc: 'Partecipa a 1 sfida di gruppo', target: 1, icon: '🤝' }
    ]
    
    const mission = socialMissions[Math.floor(Math.random() * socialMissions.length)]
    
    return {
      id,
      title: mission.title,
      description: mission.desc,
      type,
      category: 'social',
      icon: mission.icon,
      difficulty: 'easy',
      xpReward: 50,
      coinReward: 15,
      progress: 0,
      target: mission.target,
      isCompleted: false,
      isClaimed: false,
      expiresAt: type === 'daily' ? this.getDailyExpiration() : this.getWeeklyExpiration(),
      createdAt: new Date().toISOString()
    }
  }

  private generateAchievementMission(id: string, type: 'daily' | 'weekly'): Mission {
    return {
      id,
      title: 'Perfezionista',
      description: 'Ottieni un Form Score di almeno 90% in 3 esercizi',
      type,
      category: 'achievement',
      icon: '⭐',
      difficulty: 'hard',
      xpReward: 150,
      coinReward: 50,
      progress: 0,
      target: 3,
      isCompleted: false,
      isClaimed: false,
      expiresAt: type === 'daily' ? this.getDailyExpiration() : this.getWeeklyExpiration(),
      createdAt: new Date().toISOString()
    }
  }

  private generateSpecialMission(id: string): Mission {
    const specials = [
      { 
        title: 'Sfida Epica', 
        desc: 'Completa 100 burpees in una sessione',
        icon: '💎',
        xp: 300,
        coins: 100
      },
      { 
        title: 'Iron Will', 
        desc: 'Mantieni un plank per 3 minuti',
        icon: '🛡️',
        xp: 250,
        coins: 75
      },
      { 
        title: 'Speed Demon', 
        desc: 'Completa 50 push-up in 60 secondi',
        icon: '⚡',
        xp: 200,
        coins: 60
      }
    ]
    
    const special = specials[Math.floor(Math.random() * specials.length)]
    
    return {
      id,
      title: special.title,
      description: special.desc,
      type: 'special',
      category: 'achievement',
      icon: special.icon,
      difficulty: 'hard',
      xpReward: special.xp,
      coinReward: special.coins,
      progress: 0,
      target: 1,
      isCompleted: false,
      isClaimed: false,
      expiresAt: this.getDailyExpiration(),
      createdAt: new Date().toISOString()
    }
  }

  private getDailyExpiration(): string {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow.toISOString()
  }

  private getWeeklyExpiration(): string {
    const nextWeek = new Date()
    const daysUntilMonday = (8 - nextWeek.getDay()) % 7 || 7
    nextWeek.setDate(nextWeek.getDate() + daysUntilMonday)
    nextWeek.setHours(0, 0, 0, 0)
    return nextWeek.toISOString()
  }
}

// ====================================
// MISSION CARD COMPONENT
// ====================================
const MissionCard = ({ 
  mission, 
  onClaim,
  isClaimingId 
}: { 
  mission: Mission
  onClaim: (mission: Mission) => void
  isClaimingId: string | null
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 border-green-500/30'
      case 'medium': return 'text-yellow-400 border-yellow-500/30'
      case 'hard': return 'text-orange-400 border-orange-500/30'
      default: return 'text-gray-400 border-gray-500/30'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'exercise': return <Dumbbell className="w-4 h-4" />
      case 'duel': return <Swords className="w-4 h-4" />
      case 'streak': return <Flame className="w-4 h-4" />
      case 'social': return <Heart className="w-4 h-4" />
      case 'achievement': return <Trophy className="w-4 h-4" />
      default: return <Target className="w-4 h-4" />
    }
  }

  const progressPercentage = (mission.progress / mission.target) * 100
  const timeLeft = new Date(mission.expiresAt).getTime() - Date.now()
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60))
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "relative overflow-hidden",
        mission.type === 'special' && "animate-pulse"
      )}
    >
      <Card 
        variant={mission.isCompleted && !mission.isClaimed ? 'gradient' : 'glass'}
        className={cn(
          "p-4 transition-all",
          mission.isClaimed && "opacity-60",
          mission.type === 'special' && "border-yellow-500/50"
        )}
      >
        {/* Special Mission Badge */}
        {mission.type === 'special' && (
          <div className="absolute -top-2 -right-2">
            <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full">
              SPECIAL
            </span>
          </div>
        )}

        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <div className="text-2xl">{mission.icon}</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-white">{mission.title}</h4>
                <span className={cn('text-xs px-2 py-0.5 rounded-full border', getDifficultyColor(mission.difficulty))}>
                  {mission.difficulty === 'easy' ? 'Facile' :
                   mission.difficulty === 'medium' ? 'Media' : 'Difficile'}
                </span>
              </div>
              <p className="text-sm text-gray-400">{mission.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-gray-500">
            {getCategoryIcon(mission.category)}
            {mission.isCompleted && !mission.isClaimed && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {!mission.isCompleted && (
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">
                {mission.progress}/{mission.target}
              </span>
              <span className="text-xs text-indigo-400">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-500">+{mission.xpReward} XP</span>
            </div>
            <div className="flex items-center gap-1">
              <Coins className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-600">+{mission.coinReward}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!mission.isClaimed && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>
                  {hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`}
                </span>
              </div>
            )}

            {mission.isCompleted && !mission.isClaimed && (
              <Button
                variant="gradient"
                size="sm"
                onClick={() => onClaim(mission)}
                disabled={isClaimingId === mission.id}
              >
                {isClaimingId === mission.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Riscattando...
                  </>
                ) : (
                  'Riscatta'
                )}
              </Button>
            )}

            {mission.isClaimed && (
              <span className="text-xs text-gray-500">Riscattato ✓</span>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

// ====================================
// MAIN COMPONENT
// ====================================
export function DailyMissionsSystem({ currentUserId }: { currentUserId: string }) {
  const supabase = createClientComponentClient()
  const { user, addXP, addCoins } = useUserStore()
  
  const [dailyMissions, setDailyMissions] = useState<Mission[]>([])
  const [weeklyMissions, setWeeklyMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<'daily' | 'weekly'>('daily')
  const [lastGenerated, setLastGenerated] = useState<string | null>(null)

  useEffect(() => {
    checkAndGenerateMissions()
  }, [currentUserId])

  const checkAndGenerateMissions = async () => {
    setLoading(true)
    
    try {
      // Check localStorage for last generation time
      const lastGen = localStorage.getItem('fitduel_missions_generated')
      const lastGenDate = lastGen ? new Date(lastGen) : null
      const now = new Date()
      
      // Check if we need to generate new missions (daily reset at midnight)
      const needsNewMissions = !lastGenDate || 
        lastGenDate.getDate() !== now.getDate() ||
        lastGenDate.getMonth() !== now.getMonth() ||
        lastGenDate.getFullYear() !== now.getFullYear()
      
      if (needsNewMissions) {
        await generateNewMissions()
      } else {
        // Load existing missions from localStorage
        loadExistingMissions()
      }
    } catch (error) {
      console.error('Error checking missions:', error)
      // Generate new missions as fallback
      await generateNewMissions()
    } finally {
      setLoading(false)
    }
  }

  const loadExistingMissions = () => {
    const savedDaily = localStorage.getItem('fitduel_daily_missions')
    const savedWeekly = localStorage.getItem('fitduel_weekly_missions')
    
    if (savedDaily) {
      const dailyData = JSON.parse(savedDaily)
      setDailyMissions(dailyData)
    }
    
    if (savedWeekly) {
      const weeklyData = JSON.parse(savedWeekly)
      setWeeklyMissions(weeklyData)
    }
  }

  const generateNewMissions = async () => {
    setIsGenerating(true)
    
    try {
      // Get user level and stats
      const userLevel = user?.level || 1
      const userStats = {} // Can be expanded with real stats
      
      // Initialize generator
      const generator = new MissionGenerator(userLevel, userStats)
      
      // Generate missions
      const newDailyMissions = generator.generateDailyMissions()
      const newWeeklyMissions = generator.generateWeeklyMissions()
      
      // Save to state
      setDailyMissions(newDailyMissions)
      setWeeklyMissions(newWeeklyMissions)
      
      // Save to localStorage
      localStorage.setItem('fitduel_daily_missions', JSON.stringify(newDailyMissions))
      localStorage.setItem('fitduel_weekly_missions', JSON.stringify(newWeeklyMissions))
      localStorage.setItem('fitduel_missions_generated', new Date().toISOString())
      
      setLastGenerated(new Date().toISOString())
      
      // If user is authenticated, also save to database
      if (currentUserId && currentUserId !== 'demo-user') {
        await saveMissionsToDatabase(newDailyMissions, newWeeklyMissions)
      }
    } catch (error) {
      console.error('Error generating missions:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const saveMissionsToDatabase = async (daily: Mission[], weekly: Mission[]) => {
    try {
      // Call API to save missions
      await fetch('/api/missions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          dailyMissions: daily,
          weeklyMissions: weekly
        })
      })
    } catch (error) {
      console.error('Error saving missions to database:', error)
    }
  }

  const handleClaimReward = async (mission: Mission) => {
    setClaimingId(mission.id)
    
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
      const updateMission = (missions: Mission[]) =>
        missions.map(m => m.id === mission.id ? { ...m, isClaimed: true } : m)
      
      if (mission.type === 'daily' || mission.type === 'special') {
        const updated = updateMission(dailyMissions)
        setDailyMissions(updated)
        localStorage.setItem('fitduel_daily_missions', JSON.stringify(updated))
      } else {
        const updated = updateMission(weeklyMissions)
        setWeeklyMissions(updated)
        localStorage.setItem('fitduel_weekly_missions', JSON.stringify(updated))
      }
      
      // Call API if authenticated
      if (currentUserId && currentUserId !== 'demo-user') {
        await fetch('/api/missions/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUserId,
            missionId: mission.id,
            xpReward: mission.xpReward,
            coinReward: mission.coinReward
          })
        })
      }
    } catch (error) {
      console.error('Error claiming reward:', error)
    } finally {
      setClaimingId(null)
    }
  }

  const handleRefreshMissions = async () => {
    if (confirm('Vuoi generare nuove missioni? Perderai i progressi non salvati.')) {
      await generateNewMissions()
    }
  }

  const completedDaily = dailyMissions.filter(m => m.isCompleted).length
  const completedWeekly = weeklyMissions.filter(m => m.isCompleted).length
  const displayMissions = selectedTab === 'daily' ? dailyMissions : weeklyMissions

  if (loading) {
    return (
      <Card variant="glass" className="p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Caricamento missioni...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card variant="glass" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-indigo-500" />
              Missioni {selectedTab === 'daily' ? 'Giornaliere' : 'Settimanali'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Completa le missioni per guadagnare XP e coins
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {isGenerating ? (
              <div className="flex items-center gap-2 text-sm text-indigo-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando...
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshMissions}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={selectedTab === 'daily' ? 'gradient' : 'secondary'}
            size="sm"
            onClick={() => setSelectedTab('daily')}
            className="flex-1"
          >
            <Calendar className="w-4 h-4 mr-1" />
            Giornaliere ({completedDaily}/{dailyMissions.length})
          </Button>
          <Button
            variant={selectedTab === 'weekly' ? 'gradient' : 'secondary'}
            size="sm"
            onClick={() => setSelectedTab('weekly')}
            className="flex-1"
          >
            <Trophy className="w-4 h-4 mr-1" />
            Settimanali ({completedWeekly}/{weeklyMissions.length})
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ 
              width: `${(displayMissions.filter(m => m.isCompleted).length / displayMissions.length) * 100}%` 
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </Card>

      {/* Missions List */}
      <div className="space-y-3">
        {displayMissions.length === 0 ? (
          <Card variant="glass" className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-4">
              Nessuna missione disponibile al momento
            </p>
            <Button variant="gradient" onClick={generateNewMissions}>
              Genera Nuove Missioni
            </Button>
          </Card>
        ) : (
          <AnimatePresence>
            {displayMissions.map((mission, index) => (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <MissionCard
                  mission={mission}
                  onClaim={handleClaimReward}
                  isClaimingId={claimingId}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Completion Bonus */}
      {displayMissions.length > 0 && displayMissions.every(m => m.isCompleted) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card variant="gradient" className="p-6 text-center">
            <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">
              🎉 Tutte le Missioni Completate!
            </h3>
            <p className="text-gray-300 mb-4">
              Hai completato tutte le missioni {selectedTab === 'daily' ? 'giornaliere' : 'settimanali'}!
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-1">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="text-lg font-bold text-yellow-500">
                  +{selectedTab === 'daily' ? 100 : 500} XP Bonus
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Coins className="w-5 h-5 text-yellow-600" />
                <span className="text-lg font-bold text-yellow-600">
                  +{selectedTab === 'daily' ? 50 : 200} Coins Bonus
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}