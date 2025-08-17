'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Timer, Activity, Users, Zap, Target,
  Camera, CameraOff, Volume2, VolumeX, Loader2,
  CheckCircle, XCircle, AlertTriangle, TrendingUp,
  Heart, Shield, Award, Flame, Star, ChevronRight,
  Play, Pause, RotateCcw, Flag, Sparkles
} from 'lucide-react'
import AIExerciseTracker from '@/components/game/ai-tracker/AIExerciseTracker'
import { cn } from '@/utils/cn'
import { calculateXPBonus } from '@/utils/handicapSystem'
import confetti from 'canvas-confetti'

// ====================================
// TYPES
// ====================================

interface DuelData {
  id: string
  challenger: {
    id: string
    username: string
    avatar?: string
    level: number
    targetReps: number
    completedReps: number
    handicap: number
  }
  opponent: {
    id: string
    username: string
    avatar?: string
    level: number
    targetReps: number
    completedReps: number
    handicap: number
  }
  exercise: string
  fairnessScore: number
  status: 'waiting' | 'ready' | 'in-progress' | 'completed'
  timeLimit: number // secondi
  startedAt?: Date
  completedAt?: Date
}

interface ExerciseStats {
  reps: number
  accuracy: number
  speed: number
  form: number
}

// Import PerformanceData type from AIExerciseTracker
interface PerformanceData {
  exerciseId: string
  userId: string
  duelId?: string
  missionId?: string
  formScore: number
  repsCompleted: number
  duration: number
  caloriesBurned: number
  videoUrl?: string
  videoBlob?: Blob
  feedback: any
  deviceData?: any
  timestamp: string
}

// ====================================
// MOCK DATA
// ====================================

const MOCK_DUEL: DuelData = {
  id: 'duel-123',
  challenger: {
    id: 'user-1',
    username: 'Tu',
    level: 15,
    targetReps: 30,
    completedReps: 0,
    handicap: 1.0
  },
  opponent: {
    id: 'user-2', 
    username: 'Laura',
    level: 12,
    targetReps: 22,
    completedReps: 0,
    handicap: 0.73
  },
  exercise: 'squats',
  fairnessScore: 85,
  status: 'waiting',
  timeLimit: 60
}

// ====================================
// PAGE PROPS TYPE FOR NEXT.JS 14
// ====================================

interface PageProps {
  params: {
    id: string
  }
  searchParams?: { [key: string]: string | string[] | undefined }
}

// ====================================
// MAIN COMPONENT
// ====================================

export default function ActiveDuelPage({ params }: PageProps) {
  const duelId = params.id // Extract the id from params
  
  const [duel, setDuel] = useState<DuelData>(MOCK_DUEL)
  const [currentUserId] = useState('user-1') // Current user
  const [timeRemaining, setTimeRemaining] = useState(duel.timeLimit)
  const [isReady, setIsReady] = useState(false)
  const [showAITracker, setShowAITracker] = useState(false)
  const [exerciseStats, setExerciseStats] = useState<ExerciseStats>({
    reps: 0,
    accuracy: 100,
    speed: 0,
    form: 100
  })
  const [opponentProgress, setOpponentProgress] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const isChallenger = currentUserId === duel.challenger.id
  const myData = isChallenger ? duel.challenger : duel.opponent
  const opponentData = isChallenger ? duel.opponent : duel.challenger
  const myProgress = (exerciseStats.reps / myData.targetReps) * 100
  const oppProgress = (opponentProgress / opponentData.targetReps) * 100

  // ====================================
  // EFFECTS
  // ====================================

  // Load duel data based on duelId
  useEffect(() => {
    // In a real app, you would fetch the duel data based on duelId
    console.log('Loading duel with ID:', duelId)
    // For now, we're using mock data
    setDuel({ ...MOCK_DUEL, id: duelId })
  }, [duelId])

  // Timer countdown
  useEffect(() => {
    if (duel.status === 'in-progress' && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }
  }, [duel.status, timeRemaining])

  // Simulate opponent progress
  useEffect(() => {
    if (duel.status === 'in-progress') {
      const interval = setInterval(() => {
        setOpponentProgress(prev => {
          const increment = Math.random() * 2
          const newValue = Math.min(prev + increment, opponentData.targetReps)
          
          // Check if opponent completed
          if (newValue >= opponentData.targetReps) {
            handleOpponentComplete()
          }
          
          return newValue
        })
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [duel.status, opponentData.targetReps])

  // ====================================
  // HANDLERS
  // ====================================

  const handleReady = () => {
    setIsReady(true)
    // In real app, notify server
    setTimeout(() => {
      startDuel()
    }, 1000)
  }

  const startDuel = () => {
    setDuel(prev => ({ 
      ...prev, 
      status: 'in-progress',
      startedAt: new Date()
    }))
    setShowAITracker(true)
    playSound('start')
  }

  const handleExerciseComplete = (data: PerformanceData) => {
    // Extract reps from PerformanceData
    const reps = data.repsCompleted
    
    setExerciseStats(prev => ({ 
      ...prev, 
      reps,
      accuracy: Math.round(data.formScore),
      form: Math.round(data.formScore),
      speed: Math.round((reps / (data.duration || 1)) * 60) // reps per minute
    }))
    
    // Check if target reached
    if (reps >= myData.targetReps) {
      handleComplete()
    }
  }

  const handleExerciseProgress = (progress: number) => {
    // Update reps based on progress
    const estimatedReps = Math.floor((progress / 100) * myData.targetReps)
    setExerciseStats(prev => ({ ...prev, reps: estimatedReps }))
  }

  const handleComplete = () => {
    setDuel(prev => ({ 
      ...prev, 
      status: 'completed',
      completedAt: new Date()
    }))
    
    if (timerRef.current) clearInterval(timerRef.current)
    
    // Calculate results
    const myCompleted = exerciseStats.reps >= myData.targetReps
    const opponentCompleted = opponentProgress >= opponentData.targetReps
    
    if (myCompleted && !opponentCompleted) {
      handleVictory()
    } else if (!myCompleted && opponentCompleted) {
      handleDefeat()
    } else {
      handleDraw()
    }
  }

  const handleOpponentComplete = () => {
    // Opponent finished first
    if (exerciseStats.reps < myData.targetReps) {
      setTimeout(() => handleDefeat(), 1000)
    }
  }

  const handleTimeUp = () => {
    setDuel(prev => ({ ...prev, status: 'completed' }))
    setShowAITracker(false)
    
    // Compare progress
    if (myProgress > oppProgress) {
      handleVictory()
    } else if (myProgress < oppProgress) {
      handleDefeat()
    } else {
      handleDraw()
    }
  }

  const handleVictory = () => {
    playSound('victory')
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
    setShowResults(true)
  }

  const handleDefeat = () => {
    playSound('defeat')
    setShowResults(true)
  }

  const handleDraw = () => {
    playSound('draw')
    setShowResults(true)
  }

  const playSound = (type: string) => {
    if (!soundEnabled) return
    // Play sound effects
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getExerciseEmoji = (exercise: string) => {
    const emojis: Record<string, string> = {
      squats: '🦵',
      pushups: '💪',
      plank: '🧘',
      jumping_jacks: '⭐',
      burpees: '🔥'
    }
    return emojis[exercise] || '💪'
  }

  // ====================================
  // RENDER
  // ====================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 
      relative overflow-hidden">
      
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20" />
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-96 h-96 rounded-full blur-3xl opacity-20
              ${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-blue-500' : 'bg-purple-500'}`}
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
      <div className="relative z-10 max-w-6xl mx-auto p-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 mb-6 
            border border-slate-700/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{getExerciseEmoji(duel.exercise)}</div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Sfida {duel.exercise.charAt(0).toUpperCase() + duel.exercise.slice(1)}
                </h1>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span>Fairness: {duel.fairnessScore}%</span>
                  <span className="text-slate-600">•</span>
                  <Timer className="w-4 h-4 text-yellow-400" />
                  <span>Limite: {duel.timeLimit}s</span>
                </div>
              </div>
            </div>

            {/* Timer */}
            {duel.status === 'in-progress' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <div className={cn(
                  "text-3xl font-bold tabular-nums",
                  timeRemaining <= 10 ? "text-red-400 animate-pulse" : "text-white"
                )}>
                  {formatTime(timeRemaining)}
                </div>
                <p className="text-xs text-slate-400">Tempo Rimasto</p>
              </motion.div>
            )}

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-slate-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-400" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Players Progress */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* My Progress */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border",
              isChallenger ? "border-blue-500/30" : "border-purple-500/30"
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white",
                  isChallenger 
                    ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                    : "bg-gradient-to-br from-purple-500 to-pink-500"
                )}>
                  {myData.username[0]}
                </div>
                <div>
                  <p className="font-bold text-white flex items-center gap-2">
                    {myData.username}
                    {isChallenger && <span className="text-xs text-blue-400">(Tu)</span>}
                  </p>
                  <p className="text-sm text-slate-400">Level {myData.level}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">
                  {exerciseStats.reps}/{myData.targetReps}
                </p>
                <p className="text-xs text-slate-400">Ripetizioni</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Progresso</span>
                <span className={cn(
                  "font-bold",
                  myProgress >= 100 ? "text-green-400" : "text-white"
                )}>
                  {Math.round(myProgress)}%
                </span>
              </div>
              <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div 
                  className={cn(
                    "h-full rounded-full",
                    myProgress >= 100 
                      ? "bg-gradient-to-r from-green-400 to-emerald-400"
                      : "bg-gradient-to-r from-blue-400 to-cyan-400"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${myProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-900/50 rounded-lg p-2">
                <p className="text-xs text-slate-400">Precisione</p>
                <p className="text-sm font-bold text-green-400">{exerciseStats.accuracy}%</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-2">
                <p className="text-xs text-slate-400">Velocità</p>
                <p className="text-sm font-bold text-yellow-400">{exerciseStats.speed}/min</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-2">
                <p className="text-xs text-slate-400">Form</p>
                <p className="text-sm font-bold text-blue-400">{exerciseStats.form}%</p>
              </div>
            </div>

            {/* Handicap Info */}
            {myData.handicap !== 1.0 && (
              <div className="mt-3 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-xs text-blue-300">
                  Handicap: {Math.round((1 - myData.handicap) * 100)}% facilitazione
                </p>
              </div>
            )}
          </motion.div>

          {/* Opponent Progress */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 
              border border-red-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 
                  flex items-center justify-center text-xl font-bold text-white">
                  {opponentData.username[0]}
                </div>
                <div>
                  <p className="font-bold text-white">{opponentData.username}</p>
                  <p className="text-sm text-slate-400">Level {opponentData.level}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">
                  {Math.round(opponentProgress)}/{opponentData.targetReps}
                </p>
                <p className="text-xs text-slate-400">Ripetizioni</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Progresso</span>
                <span className={cn(
                  "font-bold",
                  oppProgress >= 100 ? "text-green-400" : "text-white"
                )}>
                  {Math.round(oppProgress)}%
                </span>
              </div>
              <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div 
                  className={cn(
                    "h-full rounded-full",
                    oppProgress >= 100 
                      ? "bg-gradient-to-r from-green-400 to-emerald-400"
                      : "bg-gradient-to-r from-red-400 to-orange-400"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${oppProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Live Status */}
            <div className="flex items-center justify-center gap-2 p-3 
              bg-slate-900/50 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-slate-300">In attività</span>
            </div>

            {/* Handicap Info */}
            {opponentData.handicap !== 1.0 && (
              <div className="mt-3 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                <p className="text-xs text-red-300">
                  Handicap: {Math.round((1 - opponentData.handicap) * 100)}% facilitazione
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          {/* WAITING STATE */}
          {duel.status === 'waiting' && !isReady && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 
                border border-slate-700/50 text-center"
            >
              <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">
                Sfida Pronta!
              </h2>
              
              {/* Challenge Details */}
              <div className="max-w-md mx-auto mb-6 space-y-3">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="text-sm text-slate-400 mb-2">I tuoi obiettivi calibrati:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-blue-400">{myData.targetReps}</p>
                      <p className="text-xs text-slate-400">Tue ripetizioni</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-400">{opponentData.targetReps}</p>
                      <p className="text-xs text-slate-400">Avversario</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span>Prepara la camera per il tracking AI</span>
                </div>
              </div>

              <motion.button
                onClick={handleReady}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 
                  rounded-xl text-white font-bold text-lg shadow-lg 
                  hover:shadow-green-500/25 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                SONO PRONTO!
              </motion.button>
            </motion.div>
          )}

          {/* READY STATE */}
          {duel.status === 'waiting' && isReady && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 
                backdrop-blur-xl rounded-2xl p-8 border border-yellow-500/30 text-center"
            >
              <Loader2 className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-2xl font-bold text-white mb-2">
                In attesa dell'avversario...
              </h3>
              <p className="text-yellow-300">
                La sfida inizierà appena entrambi sarete pronti
              </p>
            </motion.div>
          )}

          {/* IN PROGRESS STATE - AI Tracker */}
          {duel.status === 'in-progress' && showAITracker && (
            <motion.div
              key="in-progress"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 
                border border-slate-700/50"
            >
              <AIExerciseTracker
                exerciseId={duel.exercise}
                duelId={duel.id}
                targetReps={myData.targetReps}
                onComplete={handleExerciseComplete}
                onProgress={handleExerciseProgress}
                userId={currentUserId}
              />
              
              {/* Quick Stats */}
              <div className="mt-4 grid grid-cols-4 gap-3">
                <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                  <Zap className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">{exerciseStats.reps}</p>
                  <p className="text-xs text-slate-400">Completate</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                  <Target className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">{myData.targetReps - exerciseStats.reps}</p>
                  <p className="text-xs text-slate-400">Mancanti</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                  <Activity className="w-5 h-5 text-green-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">{exerciseStats.accuracy}%</p>
                  <p className="text-xs text-slate-400">Precisione</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                  <TrendingUp className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">{exerciseStats.form}%</p>
                  <p className="text-xs text-slate-400">Form</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* COMPLETED STATE - Results */}
          {showResults && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Result Banner */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className={cn(
                  "backdrop-blur-xl rounded-2xl p-8 border text-center",
                  myProgress > oppProgress 
                    ? "bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-500/30"
                    : myProgress < oppProgress
                    ? "bg-gradient-to-r from-red-900/50 to-orange-900/50 border-red-500/30"
                    : "bg-gradient-to-r from-yellow-900/50 to-amber-900/50 border-yellow-500/30"
                )}
              >
                {myProgress > oppProgress ? (
                  <>
                    <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-4" />
                    <h2 className="text-4xl font-bold text-white mb-2">VITTORIA!</h2>
                    <p className="text-green-300 text-lg">Hai vinto la sfida!</p>
                  </>
                ) : myProgress < oppProgress ? (
                  <>
                    <XCircle className="w-24 h-24 text-red-400 mx-auto mb-4" />
                    <h2 className="text-4xl font-bold text-white mb-2">SCONFITTA</h2>
                    <p className="text-red-300 text-lg">Riprova la prossima volta!</p>
                  </>
                ) : (
                  <>
                    <Users className="w-24 h-24 text-yellow-400 mx-auto mb-4" />
                    <h2 className="text-4xl font-bold text-white mb-2">PAREGGIO!</h2>
                    <p className="text-yellow-300 text-lg">Ottima performance da entrambi!</p>
                  </>
                )}
              </motion.div>

              {/* Stats Comparison */}
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 
                border border-slate-700/50">
                <h3 className="text-xl font-bold text-white mb-4 text-center">
                  Riepilogo Sfida
                </h3>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {/* Player 1 */}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br 
                      from-blue-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white">
                      {myData.username[0]}
                    </div>
                    <p className="font-bold text-white">{myData.username}</p>
                  </div>

                  {/* Stats */}
                  <div className="space-y-3">
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 text-center mb-2">Ripetizioni Completate</p>
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-xl font-bold text-blue-400">{exerciseStats.reps}</span>
                        <span className="text-slate-500">vs</span>
                        <span className="text-xl font-bold text-red-400">{Math.round(opponentProgress)}</span>
                      </div>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 text-center mb-2">Obiettivo Raggiunto</p>
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-xl font-bold text-blue-400">{Math.round(myProgress)}%</span>
                        <span className="text-slate-500">vs</span>
                        <span className="text-xl font-bold text-red-400">{Math.round(oppProgress)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Player 2 */}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br 
                      from-red-500 to-orange-500 flex items-center justify-center text-2xl font-bold text-white">
                      {opponentData.username[0]}
                    </div>
                    <p className="font-bold text-white">{opponentData.username}</p>
                  </div>
                </div>

                {/* XP Earned */}
                <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 
                  rounded-xl p-4 border border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Star className="w-6 h-6 text-yellow-400" />
                      <div>
                        <p className="text-sm text-purple-300">XP Guadagnati</p>
                        <p className="text-2xl font-bold text-white">
                          +{myProgress > oppProgress ? 150 : 50} XP
                        </p>
                      </div>
                    </div>
                    {myProgress > oppProgress && myData.handicap < opponentData.handicap && (
                      <div className="bg-yellow-500/20 rounded-lg px-3 py-1 border border-yellow-500/50">
                        <p className="text-xs text-yellow-400 font-bold">+50% Bonus Underdog!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="py-3 bg-slate-700/50 border border-slate-600 
                    rounded-xl text-white font-bold hover:bg-slate-700 
                    transition-all flex items-center justify-center gap-2"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                  Torna alla Home
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="py-3 bg-gradient-to-r from-green-500 to-emerald-500 
                    rounded-xl text-white font-bold shadow-lg hover:shadow-green-500/25 
                    transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Rivincita
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}