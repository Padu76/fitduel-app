'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Target, Trophy, Flame, Clock, CheckCircle,
  Star, Zap, Award, Gift, Lock, AlertCircle, ChevronRight,
  Sparkles, Timer, TrendingUp, Activity, Shield, Eye,
  Coins, XCircle, Info, RefreshCw, Loader2, Play,
  Swords, Users, Calendar, BarChart3
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'

// ====================================
// UPDATED IMPORTS FOR ANTI-CHEAT
// ====================================
import { AIExerciseTracker } from '@/components/game/ai-tracker/AIExerciseTracker'
import type { PerformanceData } from '@/components/game/ai-tracker/types'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { DailyMissionsSystem } from '@/components/missions/DailyMissionsSystem'

// ====================================
// TYPES
// ====================================
interface Mission {
  id: string
  type: 'daily' | 'weekly' | 'special' | 'event'
  category: 'exercise' | 'duels' | 'social' | 'performance' | 'variety'
  title: string
  description: string
  icon: string
  targetValue: number
  currentValue: number
  reward: {
    xp: number
    coins: number
    items?: string[]
    badges?: string[]
  }
  difficulty: number // 1-5
  expiresAt: string
  completedAt?: string
  claimedAt?: string
  isActive: boolean
  requiresAntiCheat?: boolean // New field for anti-cheat requirement
  minimumTrustScore?: number // Minimum trust score required
  exerciseId?: string
  exerciseCode?: string
}

interface MissionExercise {
  missionId: string
  exerciseId: string
  exerciseCode: string
  exerciseName: string
  targetReps?: number
  targetTime?: number
  targetFormScore?: number
  requiresAntiCheat: boolean
}

// ====================================
// MISSION EXERCISE MODAL
// ====================================
function MissionExerciseModal({ 
  mission, 
  isOpen, 
  onClose,
  onComplete 
}: { 
  mission: MissionExercise | null
  isOpen: boolean
  onClose: () => void
  onComplete: (data: PerformanceData) => void
}) {
  const [showTracker, setShowTracker] = useState(false)
  const [showCountdown, setShowCountdown] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const supabase = createClientComponentClient()
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getUser()
  }, [])

  useEffect(() => {
    if (showCountdown && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (showCountdown && countdown === 0) {
      setShowCountdown(false)
      setShowTracker(true)
    }
  }, [showCountdown, countdown])

  const startExercise = () => {
    setShowCountdown(true)
    setCountdown(3)
  }

  const handleExerciseComplete = async (performanceData: PerformanceData) => {
    console.log('Mission exercise completed:', performanceData)
    
    // Check if performance meets requirements
    const meetsRequirements = checkMissionRequirements(mission, performanceData)
    
    if (meetsRequirements) {
      onComplete(performanceData)
      
      // Save to database
      if (currentUser && mission) {
        await saveMissionPerformance(mission.missionId, performanceData)
      }
    } else {
      alert('Performance non soddisfa i requisiti della missione!')
    }
    
    setShowTracker(false)
    onClose()
  }

  const checkMissionRequirements = (
    mission: MissionExercise | null, 
    performance: PerformanceData
  ): boolean => {
    if (!mission) return false
    
    // Check reps requirement
    if (mission.targetReps && performance.repsCompleted < mission.targetReps) {
      return false
    }
    
    // Check time requirement
    if (mission.targetTime && performance.duration < mission.targetTime) {
      return false
    }
    
    // Check form score requirement
    if (mission.targetFormScore && performance.formScore < mission.targetFormScore) {
      return false
    }
    
    // Check anti-cheat validation
    if (mission.requiresAntiCheat && performance.validationResult) {
      if (!performance.validationResult.isValid) {
        return false
      }
    }
    
    return true
  }

  const saveMissionPerformance = async (missionId: string, performance: PerformanceData) => {
    try {
      // Save performance
      const { data: perfData, error: perfError } = await supabase
        .from('performances')
        .insert({
          user_id: currentUser.id,
          mission_id: missionId,
          exercise_id: mission?.exerciseId,
          reps: performance.repsCompleted,
          duration: performance.duration,
          form_score: performance.formScore,
          calories_burned: performance.caloriesBurned,
          ai_feedback: performance.feedback,
          trust_score: performance.trustScore,
          is_valid: performance.validationResult?.isValid,
          performed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (perfError) throw perfError

      // Update mission progress
      const { error: updateError } = await supabase
        .from('user_missions')
        .update({
          current_value: performance.repsCompleted,
          updated_at: new Date().toISOString()
        })
        .eq('mission_id', missionId)
        .eq('user_id', currentUser.id)

      if (updateError) throw updateError

      console.log('Mission performance saved successfully')
    } catch (error) {
      console.error('Error saving mission performance:', error)
    }
  }

  if (!mission || !isOpen) return null

  // Show AI Tracker full screen
  if (showTracker) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">{mission.exerciseName}</h1>
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 rounded-full">
                <Target className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-yellow-500 font-medium">MISSIONE</span>
              </div>
              {mission.requiresAntiCheat && (
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-full">
                  <Shield className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-purple-500 font-medium">VERIFICATA</span>
                </div>
              )}
            </div>
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowTracker(false)
                onClose()
              }}
            >
              <XCircle className="w-5 h-5" />
            </Button>
          </div>

          {/* Mission Requirements */}
          <Card variant="glass" className="p-4 mb-6">
            <h3 className="font-bold text-white mb-3">Requisiti Missione</h3>
            <div className="grid grid-cols-3 gap-4">
              {mission.targetReps && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{mission.targetReps}</p>
                  <p className="text-xs text-gray-400">Ripetizioni Min.</p>
                </div>
              )}
              {mission.targetTime && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{mission.targetTime}s</p>
                  <p className="text-xs text-gray-400">Tempo Min.</p>
                </div>
              )}
              {mission.targetFormScore && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{mission.targetFormScore}%</p>
                  <p className="text-xs text-gray-400">Form Score Min.</p>
                </div>
              )}
            </div>
          </Card>

          {/* AI Exercise Tracker with Anti-Cheat */}
          <AIExerciseTracker
            exerciseId={mission.exerciseCode}
            userId={currentUser?.id || 'demo_user'}
            missionId={mission.missionId}
            targetReps={mission.targetReps}
            targetTime={mission.targetTime}
            onComplete={handleExerciseComplete}
            strictMode={mission.requiresAntiCheat} // Enable anti-cheat for special missions
          />
        </div>
      </div>
    )
  }

  // Show countdown
  if (showCountdown) {
    return (
      <Modal isOpen={true} onClose={() => {}} className="max-w-sm">
        <div className="text-center py-12">
          <motion.div
            key={countdown}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="text-8xl font-bold text-white mb-4"
          >
            {countdown > 0 ? countdown : 'GO!'}
          </motion.div>
          <p className="text-gray-400">Preparati per {mission.exerciseName}</p>
        </div>
      </Modal>
    )
  }

  // Show start modal
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{mission.exerciseName}</h2>
            <p className="text-gray-400">Completa l'esercizio per la missione</p>
          </div>
        </div>

        {/* Requirements */}
        <Card variant="glass" className="p-4 mb-6">
          <h3 className="font-semibold text-white mb-3">Requisiti per completare:</h3>
          <div className="space-y-2">
            {mission.targetReps && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Ripetizioni minime</span>
                <span className="font-bold text-white">{mission.targetReps}</span>
              </div>
            )}
            {mission.targetTime && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Tempo minimo</span>
                <span className="font-bold text-white">{mission.targetTime}s</span>
              </div>
            )}
            {mission.targetFormScore && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Form Score minimo</span>
                <span className="font-bold text-white">{mission.targetFormScore}%</span>
              </div>
            )}
          </div>
        </Card>

        {/* Anti-cheat notice */}
        {mission.requiresAntiCheat && (
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-purple-400 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-purple-400">Verifica Anti-Cheat Attiva</p>
                <p className="text-xs text-gray-400 mt-1">
                  Questa missione richiede la verifica completa della performance. 
                  Assicurati di avere buona illuminazione e di essere ben visibile.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Annulla
          </Button>
          <Button variant="gradient" onClick={startExercise} className="flex-1 gap-2">
            <Play className="w-4 h-4" />
            Inizia Esercizio
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ====================================
// MAIN MISSIONS PAGE
// ====================================
export default function MissionsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [missions, setMissions] = useState<Mission[]>([])
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<MissionExercise | null>(null)
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userTrustScore, setUserTrustScore] = useState(100)
  
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'special' | 'event'>('daily')
  
  useEffect(() => {
    loadUserAndMissions()
  }, [])

  const loadUserAndMissions = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setCurrentUser(user)
        
        // Load user's trust score
        const { data: trustData } = await supabase
          .from('trust_scores')
          .select('score, trust_level')
          .eq('user_id', user.id)
          .single()
        
        if (trustData) {
          setUserTrustScore(trustData.score)
        }
        
        // Load missions
        await loadMissions(user.id)
      } else {
        // Demo data
        loadDemoMissions()
      }
    } catch (error) {
      console.error('Error loading missions:', error)
      loadDemoMissions()
    } finally {
      setLoading(false)
    }
  }

  const loadMissions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_missions')
        .select(`
          *,
          mission:missions!mission_id(
            id,
            type,
            category,
            title,
            description,
            icon,
            target_value,
            reward,
            difficulty,
            expires_at,
            requires_anticheat,
            minimum_trust_score,
            exercise_id,
            exercise_code
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedMissions = data?.map(item => ({
        id: item.mission.id,
        type: item.mission.type,
        category: item.mission.category,
        title: item.mission.title,
        description: item.mission.description,
        icon: item.mission.icon,
        targetValue: item.mission.target_value,
        currentValue: item.current_value,
        reward: item.mission.reward,
        difficulty: item.mission.difficulty,
        expiresAt: item.mission.expires_at,
        completedAt: item.completed_at,
        claimedAt: item.claimed_at,
        isActive: item.is_active,
        requiresAntiCheat: item.mission.requires_anticheat,
        minimumTrustScore: item.mission.minimum_trust_score,
        exerciseId: item.mission.exercise_id,
        exerciseCode: item.mission.exercise_code
      })) || []

      setMissions(formattedMissions)
    } catch (error) {
      console.error('Error loading missions:', error)
      loadDemoMissions()
    }
  }

  const loadDemoMissions = () => {
    const demoMissions: Mission[] = [
      // Daily missions
      {
        id: 'daily-1',
        type: 'daily',
        category: 'exercise',
        title: '30 Push-Up Perfetti',
        description: 'Completa 30 push-up con form score minimo 80%',
        icon: '💪',
        targetValue: 30,
        currentValue: 0,
        reward: { xp: 100, coins: 50 },
        difficulty: 2,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        requiresAntiCheat: false,
        exerciseCode: 'push_up'
      },
      {
        id: 'daily-2',
        type: 'daily',
        category: 'duels',
        title: 'Vinci 3 Duelli',
        description: 'Vinci 3 duelli contro altri giocatori',
        icon: '⚔️',
        targetValue: 3,
        currentValue: 1,
        reward: { xp: 150, coins: 75 },
        difficulty: 3,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        requiresAntiCheat: false
      },
      
      // Weekly missions
      {
        id: 'weekly-1',
        type: 'weekly',
        category: 'performance',
        title: 'Form Master',
        description: 'Mantieni 90%+ form score per 10 esercizi',
        icon: '🎯',
        targetValue: 10,
        currentValue: 3,
        reward: { xp: 500, coins: 250, badges: ['form_master'] },
        difficulty: 4,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        requiresAntiCheat: true,
        minimumTrustScore: 60
      },
      
      // Special missions
      {
        id: 'special-1',
        type: 'special',
        category: 'exercise',
        title: 'Sfida Burpee Elite',
        description: '50 burpee in 5 minuti con verifica anti-cheat',
        icon: '🔥',
        targetValue: 50,
        currentValue: 0,
        reward: { xp: 1000, coins: 500, items: ['elite_badge'] },
        difficulty: 5,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        requiresAntiCheat: true,
        minimumTrustScore: 70,
        exerciseCode: 'burpee'
      },
      
      // Event missions
      {
        id: 'event-1',
        type: 'event',
        category: 'social',
        title: 'Weekend Warrior',
        description: 'Completa 5 sfide questo weekend',
        icon: '🏆',
        targetValue: 5,
        currentValue: 2,
        reward: { xp: 300, coins: 150, badges: ['weekend_warrior'] },
        difficulty: 3,
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        requiresAntiCheat: false
      }
    ]
    
    setMissions(demoMissions)
  }

  const startMission = (mission: Mission) => {
    // Check trust score requirement
    if (mission.minimumTrustScore && userTrustScore < mission.minimumTrustScore) {
      alert(`Trust Score insufficiente! Richiesto: ${mission.minimumTrustScore}, Tuo: ${userTrustScore}`)
      return
    }
    
    if (mission.exerciseCode) {
      // Mission requires exercise
      const exerciseMission: MissionExercise = {
        missionId: mission.id,
        exerciseId: mission.exerciseId || mission.id,
        exerciseCode: mission.exerciseCode,
        exerciseName: mission.title.split(' ').slice(-1)[0], // Extract exercise name
        targetReps: mission.category === 'exercise' ? mission.targetValue : undefined,
        targetFormScore: mission.category === 'performance' ? 80 : undefined,
        requiresAntiCheat: mission.requiresAntiCheat || false
      }
      
      setSelectedExercise(exerciseMission)
      setShowExerciseModal(true)
    } else {
      // Other mission types
      setSelectedMission(mission)
    }
  }

  const handleMissionComplete = async (performanceData: PerformanceData) => {
    console.log('Mission completed with performance:', performanceData)
    
    // Update mission progress
    setMissions(prev => prev.map(m => {
      if (m.id === selectedExercise?.missionId) {
        const newValue = Math.min(m.targetValue, m.currentValue + performanceData.repsCompleted)
        return {
          ...m,
          currentValue: newValue,
          completedAt: newValue >= m.targetValue ? new Date().toISOString() : undefined
        }
      }
      return m
    }))
    
    setShowExerciseModal(false)
    setSelectedExercise(null)
  }

  const claimReward = async (missionId: string) => {
    const mission = missions.find(m => m.id === missionId)
    if (!mission || !mission.completedAt || mission.claimedAt) return
    
    // Update mission as claimed
    setMissions(prev => prev.map(m => 
      m.id === missionId 
        ? { ...m, claimedAt: new Date().toISOString() }
        : m
    ))
    
    // Award rewards (in real app, this would be server-side)
    console.log('Claiming reward:', mission.reward)
  }

  const refreshMissions = async () => {
    setRefreshing(true)
    await loadUserAndMissions()
    setRefreshing(false)
  }

  const getMissionsByType = (type: string) => {
    return missions.filter(m => m.type === type)
  }

  const getDifficultyColor = (difficulty: number) => {
    const colors = [
      'text-green-400',
      'text-blue-400',
      'text-yellow-400',
      'text-orange-400',
      'text-red-400'
    ]
    return colors[difficulty - 1] || 'text-gray-400'
  }

  const getDifficultyStars = (difficulty: number) => {
    return '⭐'.repeat(difficulty)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
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
              <div>
                <h1 className="text-xl font-bold text-white">Missioni</h1>
                <p className="text-sm text-gray-400">Completa obiettivi e guadagna ricompense</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Trust Score Display */}
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-full">
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-400">Trust: {userTrustScore}%</span>
              </div>
              
              <Button variant="ghost" size="sm" onClick={refreshMissions} disabled={refreshing}>
                <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'daily', label: 'Giornaliere', icon: Calendar },
            { id: 'weekly', label: 'Settimanali', icon: TrendingUp },
            { id: 'special', label: 'Speciali', icon: Star },
            { id: 'event', label: 'Eventi', icon: Sparkles }
          ].map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'gradient' : 'secondary'}
              onClick={() => setActiveTab(tab.id as any)}
              className="gap-2 whitespace-nowrap"
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {getMissionsByType(tab.id).length}
              </span>
            </Button>
          ))}
        </div>

        {/* Anti-cheat Info */}
        <AnimatePresence>
          {activeTab === 'special' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <Card variant="gradient" className="p-4 border-purple-500/20">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Missioni Verificate</h3>
                    <p className="text-sm text-gray-300">
                      Le missioni speciali richiedono verifica anti-cheat per garantire fair play. 
                      Assicurati di avere un Trust Score adeguato per partecipare.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Missions Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {getMissionsByType(activeTab).map((mission, index) => {
              const progress = (mission.currentValue / mission.targetValue) * 100
              const isCompleted = mission.currentValue >= mission.targetValue
              const isClaimed = !!mission.claimedAt
              const canStart = !mission.minimumTrustScore || userTrustScore >= mission.minimumTrustScore
              
              return (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    variant="glass" 
                    className={cn(
                      "p-4 relative overflow-hidden",
                      !canStart && "opacity-50"
                    )}
                  >
                    {/* Background gradient based on type */}
                    <div className={cn(
                      "absolute inset-0 opacity-5",
                      mission.type === 'daily' && "bg-gradient-to-br from-blue-500 to-cyan-500",
                      mission.type === 'weekly' && "bg-gradient-to-br from-purple-500 to-pink-500",
                      mission.type === 'special' && "bg-gradient-to-br from-yellow-500 to-orange-500",
                      mission.type === 'event' && "bg-gradient-to-br from-green-500 to-emerald-500"
                    )} />
                    
                    {/* Content */}
                    <div className="relative">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{mission.icon}</span>
                          <div>
                            <h3 className="font-bold text-white">{mission.title}</h3>
                            <p className="text-xs text-gray-400">{mission.description}</p>
                          </div>
                        </div>
                        
                        {/* Anti-cheat badge */}
                        {mission.requiresAntiCheat && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 rounded-full">
                            <Shield className="w-3 h-3 text-purple-400" />
                            <span className="text-xs text-purple-400">Verificata</span>
                          </div>
                        )}
                      </div>

                      {/* Progress */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-400">Progresso</span>
                          <span className="text-white font-medium">
                            {mission.currentValue}/{mission.targetValue}
                          </span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <motion.div
                            className={cn(
                              "h-2 rounded-full",
                              isCompleted ? "bg-green-500" : "bg-gradient-to-r from-indigo-500 to-purple-500"
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, progress)}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </div>
                      </div>

                      {/* Difficulty & Rewards */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">Difficoltà</span>
                          <span className={cn("text-sm", getDifficultyColor(mission.difficulty))}>
                            {getDifficultyStars(mission.difficulty)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm text-white">+{mission.reward.xp}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm text-white">+{mission.reward.coins}</span>
                          </div>
                        </div>
                      </div>

                      {/* Trust Score Requirement */}
                      {mission.minimumTrustScore && (
                        <div className={cn(
                          "text-xs mb-3 p-2 rounded-lg",
                          canStart 
                            ? "bg-green-500/10 text-green-400" 
                            : "bg-red-500/10 text-red-400"
                        )}>
                          {canStart 
                            ? `✓ Trust Score sufficiente (${userTrustScore}/${mission.minimumTrustScore})`
                            : `✗ Trust Score richiesto: ${mission.minimumTrustScore} (Tuo: ${userTrustScore})`
                          }
                        </div>
                      )}

                      {/* Timer */}
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                        <Timer className="w-3 h-3" />
                        <span>
                          Scade tra {Math.ceil((new Date(mission.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))}h
                        </span>
                      </div>

                      {/* Action Button */}
                      {isClaimed ? (
                        <Button variant="secondary" disabled className="w-full gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Ricompensa Riscossa
                        </Button>
                      ) : isCompleted ? (
                        <Button 
                          variant="gradient" 
                          onClick={() => claimReward(mission.id)}
                          className="w-full gap-2"
                        >
                          <Gift className="w-4 h-4" />
                          Riscuoti Ricompensa
                        </Button>
                      ) : canStart ? (
                        <Button 
                          variant="secondary"
                          onClick={() => startMission(mission)}
                          className="w-full gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Inizia Missione
                        </Button>
                      ) : (
                        <Button variant="secondary" disabled className="w-full gap-2">
                          <Lock className="w-4 h-4" />
                          Trust Score Insufficiente
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {getMissionsByType(activeTab).length === 0 && (
          <Card variant="glass" className="p-12 text-center">
            <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              Nessuna missione {activeTab}
            </h3>
            <p className="text-gray-400 mb-6">
              Torna più tardi per nuove missioni!
            </p>
            <Button variant="gradient" onClick={refreshMissions}>
              Aggiorna Missioni
            </Button>
          </Card>
        )}
      </main>

      {/* Mission Exercise Modal */}
      <MissionExerciseModal
        mission={selectedExercise}
        isOpen={showExerciseModal}
        onClose={() => {
          setShowExerciseModal(false)
          setSelectedExercise(null)
        }}
        onComplete={handleMissionComplete}
      />
    </div>
  )
}