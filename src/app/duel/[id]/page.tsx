'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Timer, Trophy, Flame, Users, Clock,
  Play, Pause, Square, RotateCcw, Upload, CheckCircle,
  Camera, Video, Zap, Target, Award, Coins, Star,
  AlertCircle, Loader2
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

// ====================================
// TYPES
// ====================================
interface DuelData {
  id: string
  challenger: {
    id: string
    username: string
    level: number
    avatar: string
  }
  opponent: {
    id: string
    username: string
    level: number
    avatar: string
  }
  exercise: {
    code: string
    name: string
    icon: string
    description: string
    repBased: boolean
    targetDuration: number
  }
  status: 'pending' | 'active' | 'recording' | 'completed'
  xpReward: number
  wagerCoins: number
  timeLeft: string
  myScore: number
  opponentScore: number
  myCompleted: boolean
  opponentCompleted: boolean
}

type DuelPhase = 'overview' | 'countdown' | 'recording' | 'uploading' | 'results'
type CameraState = 'idle' | 'ready' | 'recording' | 'paused' | 'completed'

// ====================================
// EXERCISE CONFIGURATIONS
// ====================================
const EXERCISES = {
  push_up: {
    code: 'push_up',
    name: 'Push-Up',
    icon: '💪',
    description: 'Posizionati in plank, abbassa il petto verso il suolo e spingiti su',
    repBased: true,
    targetDuration: 60,
    difficulty: 'medium'
  },
  squat: {
    code: 'squat',
    name: 'Squat',
    icon: '🏋️',
    description: 'Piedi alla larghezza delle spalle, scendi come se ti sedessi',
    repBased: true,
    targetDuration: 60,
    difficulty: 'easy'
  },
  plank: {
    code: 'plank',
    name: 'Plank',
    icon: '🔥',
    description: 'Mantieni la posizione di plank il più a lungo possibile',
    repBased: false,
    targetDuration: 120,
    difficulty: 'medium'
  },
  burpee: {
    code: 'burpee',
    name: 'Burpee',
    icon: '⚡',
    description: 'Squat, plank, push-up, jump squat - movimento completo',
    repBased: true,
    targetDuration: 90,
    difficulty: 'hard'
  },
  jumping_jack: {
    code: 'jumping_jack',
    name: 'Jumping Jack',
    icon: '🤸',
    description: 'Salta aprendo gambe e braccia simultaneamente',
    repBased: true,
    targetDuration: 60,
    difficulty: 'easy'
  },
  mountain_climber: {
    code: 'mountain_climber',
    name: 'Mountain Climber',
    icon: '🏔️',
    description: 'Posizione plank, alterna le ginocchia verso il petto',
    repBased: true,
    targetDuration: 60,
    difficulty: 'medium'
  }
}

// ====================================
// MOCK DATA
// ====================================
const getMockDuelData = (id: string): DuelData => {
  const exercises = Object.values(EXERCISES)
  const randomExercise = exercises[Math.floor(Math.random() * exercises.length)]
  
  return {
    id,
    challenger: {
      id: 'mario-demo',
      username: 'mario',
      level: 25,
      avatar: '💪'
    },
    opponent: {
      id: 'speedrunner',
      username: 'SpeedRunner',
      level: 18,
      avatar: '⚡'
    },
    exercise: randomExercise,
    status: 'active',
    xpReward: 150,
    wagerCoins: 50,
    timeLeft: '2h 15m',
    myScore: 0,
    opponentScore: Math.floor(Math.random() * 50),
    myCompleted: false,
    opponentCompleted: Math.random() > 0.5
  }
}

// ====================================
// MAIN COMPONENT
// ====================================
export default function DuelPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [duel, setDuel] = useState<DuelData | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [duelPhase, setDuelPhase] = useState<DuelPhase>('overview')
  
  // Camera states
  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [repCount, setRepCount] = useState(0)
  const [finalScore, setFinalScore] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Loading states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ====================================
  // INITIALIZATION
  // ====================================
  useEffect(() => {
    // Load current user
    const savedUser = localStorage.getItem('fitduel_user')
    if (!savedUser) {
      router.push('/login')
      return
    }
    
    try {
      const userData = JSON.parse(savedUser)
      setCurrentUser(userData)
    } catch (err) {
      router.push('/login')
      return
    }

    // Load duel data (mock for now)
    setTimeout(() => {
      const mockDuel = getMockDuelData(params.id)
      setDuel(mockDuel)
      setLoading(false)
    }, 500)
  }, [params.id, router])

  // ====================================
  // DUEL FLOW HANDLERS
  // ====================================
  const startExercise = () => {
    setDuelPhase('countdown')
    setCountdown(3)
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          setDuelPhase('recording')
          setCameraState('recording')
          startRecordingTimer()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const startRecordingTimer = () => {
    const startTime = Date.now()
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setRecordingDuration(elapsed)
      
      // Simulate rep counting for rep-based exercises
      if (duel?.exercise.repBased && elapsed % 2 === 0) {
        setRepCount(prev => prev + 1)
      }
      
      // Auto-stop at target duration
      if (duel && elapsed >= duel.exercise.targetDuration) {
        stopRecording()
        clearInterval(timer)
      }
    }, 1000)
  }

  const stopRecording = () => {
    setCameraState('completed')
    setDuelPhase('uploading')
    
    // Calculate final score based on exercise type
    if (duel?.exercise.repBased) {
      setFinalScore(repCount)
    } else {
      setFinalScore(recordingDuration)
    }
    
    // Simulate upload
    simulateUpload()
  }

  const simulateUpload = () => {
    let progress = 0
    const uploadInterval = setInterval(() => {
      progress += Math.random() * 20
      setUploadProgress(Math.min(progress, 100))
      
      if (progress >= 100) {
        clearInterval(uploadInterval)
        setTimeout(() => {
          completeDuel()
        }, 500)
      }
    }, 200)
  }

  const completeDuel = () => {
    setDuelPhase('results')
    
    // Update duel data
    if (duel) {
      setDuel(prev => prev ? {
        ...prev,
        myScore: finalScore,
        myCompleted: true,
        status: 'completed'
      } : null)
    }
  }

  // ====================================
  // UTILITY FUNCTIONS
  // ====================================
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getWinner = () => {
    if (!duel) return null
    if (!duel.myCompleted || !duel.opponentCompleted) return null
    
    if (duel.myScore > duel.opponentScore) return 'user'
    if (duel.opponentScore > duel.myScore) return 'opponent'
    return 'tie'
  }

  // ====================================
  // LOADING STATE
  // ====================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Caricamento duello...</p>
        </div>
      </div>
    )
  }

  if (!duel || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <Card variant="glass" className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Duello non trovato</h2>
          <p className="text-gray-400 mb-4">Il duello richiesto non esiste o è stato rimosso.</p>
          <Button variant="secondary" onClick={() => router.push('/dashboard')}>
            Torna alla Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  // ====================================
  // RENDER
  // ====================================
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
                <h1 className="text-xl font-bold text-white">Duello</h1>
                <p className="text-sm text-gray-400">{duel.exercise.name} Challenge</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-yellow-500">+{duel.xpReward} XP</p>
                <p className="text-xs text-gray-400">{duel.timeLeft} rimasti</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* OVERVIEW PHASE */}
          {duelPhase === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              {/* Duel Header */}
              <Card variant="glass" className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{duel.exercise.icon}</span>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{duel.exercise.name}</h2>
                      <p className="text-gray-400">{duel.exercise.description}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Target</p>
                    <p className="text-xl font-bold text-white">
                      {duel.exercise.repBased ? 'Max Reps' : formatTime(duel.exercise.targetDuration)}
                    </p>
                  </div>
                </div>

                {/* Competitors */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Current User */}
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">{currentUser.avatar}</span>
                    </div>
                    <h3 className="font-bold text-white">{currentUser.username}</h3>
                    <p className="text-sm text-gray-400">Level {currentUser.level}</p>
                    <div className="mt-3">
                      <p className="text-2xl font-bold text-white">{duel.myScore}</p>
                      <p className="text-xs text-gray-400">Il tuo score</p>
                    </div>
                  </div>

                  {/* VS Divider */}
                  <div className="hidden md:flex items-center justify-center">
                    <div className="text-6xl font-bold text-gray-600">VS</div>
                  </div>

                  {/* Opponent */}
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">{duel.opponent.avatar}</span>
                    </div>
                    <h3 className="font-bold text-white">{duel.opponent.username}</h3>
                    <p className="text-sm text-gray-400">Level {duel.opponent.level}</p>
                    <div className="mt-3">
                      <p className="text-2xl font-bold text-white">{duel.opponentScore}</p>
                      <p className="text-xs text-gray-400">
                        {duel.opponentCompleted ? 'Score finale' : 'Score attuale'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rewards */}
                <div className="mt-6 p-4 bg-gray-800/30 rounded-lg">
                  <h4 className="font-medium text-white mb-3">Premi in palio:</h4>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <span className="text-white">+{duel.xpReward} XP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-yellow-600" />
                      <span className="text-white">+{duel.wagerCoins} Coins</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-purple-400" />
                      <span className="text-white">Achievement possibili</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Instructions */}
              <Card variant="glass" className="p-6">
                <h3 className="font-bold text-white mb-4">Istruzioni Esercizio</h3>
                <div className="space-y-3 text-gray-300">
                  <p>🎯 <strong>Obiettivo:</strong> {duel.exercise.repBased ? 'Fai più ripetizioni possibili' : 'Mantieni la posizione il più a lungo possibile'}</p>
                  <p>⏱️ <strong>Tempo limite:</strong> {formatTime(duel.exercise.targetDuration)}</p>
                  <p>📹 <strong>Registrazione:</strong> Il tuo allenamento verrà registrato per la valutazione</p>
                  <p>🏆 <strong>Vincitore:</strong> Chi ottiene il punteggio più alto vince il duello</p>
                </div>
              </Card>

              {/* Start Button */}
              <div className="text-center">
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={startExercise}
                  className="px-12 py-4 text-lg"
                >
                  <Play className="w-6 h-6 mr-3" />
                  Inizia Duello
                </Button>
              </div>
            </motion.div>
          )}

          {/* COUNTDOWN PHASE */}
          {duelPhase === 'countdown' && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="flex items-center justify-center min-h-[60vh]"
            >
              <div className="text-center">
                <motion.div
                  key={countdown}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-9xl font-bold text-white mb-4"
                >
                  {countdown || 'GO!'}
                </motion.div>
                <p className="text-xl text-gray-400">Preparati per {duel.exercise.name}</p>
              </div>
            </motion.div>
          )}

          {/* RECORDING PHASE */}
          {duelPhase === 'recording' && (
            <motion.div
              key="recording"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto"
            >
              <Card variant="glass" className="p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="font-bold text-white">REGISTRAZIONE IN CORSO</span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{formatTime(recordingDuration)}</p>
                    <p className="text-sm text-gray-400">/ {formatTime(duel.exercise.targetDuration)}</p>
                  </div>
                </div>

                {/* Video Placeholder */}
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Camera Recording</p>
                    <p className="text-sm text-gray-500">Video feed would appear here</p>
                  </div>
                </div>

                {/* Exercise Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">
                      {duel.exercise.repBased ? repCount : formatTime(recordingDuration)}
                    </p>
                    <p className="text-sm text-gray-400">
                      {duel.exercise.repBased ? 'Reps' : 'Durata'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">85%</p>
                    <p className="text-sm text-gray-400">Form Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-500">{Math.floor(recordingDuration * 0.8)}</p>
                    <p className="text-sm text-gray-400">Calorie</p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4">
                  <Button variant="secondary" onClick={stopRecording}>
                    <Square className="w-5 h-5 mr-2" />
                    Stop
                  </Button>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((recordingDuration / duel.exercise.targetDuration) * 100, 100)}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* UPLOADING PHASE */}
          {duelPhase === 'uploading' && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center min-h-[60vh]"
            >
              <Card variant="glass" className="p-8 text-center max-w-md">
                <Upload className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Caricamento in corso...</h3>
                <p className="text-gray-400 mb-6">Stiamo elaborando la tua performance</p>
                
                <div className="w-full bg-gray-800 rounded-full h-3 mb-4">
                  <motion.div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                
                <p className="text-sm text-gray-400">{Math.round(uploadProgress)}% completato</p>
              </Card>
            </motion.div>
          )}

          {/* RESULTS PHASE */}
          {duelPhase === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              {/* Result Header */}
              <Card variant="glass" className="p-8 text-center">
                <div className="mb-6">
                  {getWinner() === 'user' ? (
                    <>
                      <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                      <h2 className="text-3xl font-bold text-white mb-2">Vittoria! 🎉</h2>
                      <p className="text-gray-400">Hai vinto il duello!</p>
                    </>
                  ) : getWinner() === 'tie' ? (
                    <>
                      <Target className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                      <h2 className="text-3xl font-bold text-white mb-2">Pareggio! 🤝</h2>
                      <p className="text-gray-400">Entrambi avete dato il massimo!</p>
                    </>
                  ) : (
                    <>
                      <Award className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <h2 className="text-3xl font-bold text-white mb-2">Sconfitta 😔</h2>
                      <p className="text-gray-400">Ritenta, sarai più fortunato!</p>
                    </>
                  )}
                </div>

                {/* Final Scores */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-white">{finalScore}</p>
                    <p className="text-sm text-gray-400">{currentUser.username} (Tu)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-white">{duel.opponentScore}</p>
                    <p className="text-sm text-gray-400">{duel.opponent.username}</p>
                  </div>
                </div>

                {/* Rewards Earned */}
                <div className="p-4 bg-gray-800/30 rounded-lg mb-6">
                  <h4 className="font-medium text-white mb-3">Premi Ottenuti:</h4>
                  <div className="flex justify-center gap-6">
                    <div className="text-center">
                      <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                      <p className="text-white">+{getWinner() === 'user' ? duel.xpReward : 25} XP</p>
                    </div>
                    <div className="text-center">
                      <Coins className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                      <p className="text-white">+{getWinner() === 'user' ? duel.wagerCoins : 0} Coins</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  variant="secondary"
                  onClick={() => router.push('/dashboard')}
                  className="flex-1"
                >
                  Torna alla Dashboard
                </Button>
                <Button
                  variant="gradient"
                  onClick={() => router.push('/challenges')}
                  className="flex-1"
                >
                  Nuova Sfida
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}