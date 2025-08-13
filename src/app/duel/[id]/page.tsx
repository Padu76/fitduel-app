'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Timer, Trophy, Flame, Users, Clock,
  Play, Pause, Square, RotateCcw, Upload, CheckCircle,
  Camera, Video, Zap, Target, Award, Coins, Star,
  AlertCircle, Loader2, Plus, Minus, Volume2, VolumeX,
  Info, Send, XCircle
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ====================================
// TYPES
// ====================================
interface Duel {
  id: string
  type: '1v1' | 'open' | 'tournament' | 'mission'
  status: 'pending' | 'open' | 'active' | 'completed' | 'expired' | 'cancelled'
  challenger_id: string
  challenger?: any
  challenged_id: string | null
  challenged?: any
  exercise_id: string
  exercise?: any
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  wager_xp: number
  reward_xp: number
  target_reps: number | null
  target_time: number | null
  target_form_score: number | null
  winner_id: string | null
  is_draw: boolean
  created_at: string
  completed_at: string | null
  expires_at: string | null
}

interface Performance {
  user_id: string
  duel_id: string
  reps: number
  duration: number
  form_score: number
  video_url?: string
  performed_at: string
}

type DuelPhase = 'overview' | 'countdown' | 'recording' | 'uploading' | 'results'
type ExerciseState = 'ready' | 'active' | 'paused' | 'completed'

// ====================================
// TIMER COMPONENT
// ====================================
const ExerciseTimer = ({ 
  isRunning, 
  onTimeUpdate,
  maxTime = 300
}: { 
  isRunning: boolean
  onTimeUpdate: (time: number) => void
  maxTime?: number
}) => {
  const [time, setTime] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning && time < maxTime) {
      intervalRef.current = setInterval(() => {
        setTime(prev => {
          const newTime = prev + 1
          onTimeUpdate(newTime)
          return newTime
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, time, maxTime, onTimeUpdate])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = (time / maxTime) * 100

  return (
    <div className="space-y-2">
      <div className="text-center">
        <p className="text-5xl font-bold text-white font-mono">{formatTime(time)}</p>
        <p className="text-sm text-gray-400 mt-1">Tempo / {formatTime(maxTime)}</p>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  )
}

// ====================================
// REP COUNTER COMPONENT
// ====================================
const RepCounter = ({ 
  count, 
  onCountChange,
  target,
  isActive
}: { 
  count: number
  onCountChange: (count: number) => void
  target: number | null
  isActive: boolean
}) => {
  const handleIncrement = () => {
    if (isActive) {
      onCountChange(count + 1)
    }
  }

  const handleDecrement = () => {
    if (isActive && count > 0) {
      onCountChange(count - 1)
    }
  }

  const progress = target ? (count / target) * 100 : 0

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-white">{count}</p>
        {target && (
          <p className="text-sm text-gray-400 mt-1">Target: {target}</p>
        )}
      </div>

      {target && (
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full transition-all",
              progress >= 100 ? "bg-green-500" : "bg-gradient-to-r from-indigo-500 to-purple-500"
            )}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      <div className="flex gap-4">
        <Button
          variant="secondary"
          size="lg"
          onClick={handleDecrement}
          disabled={!isActive || count === 0}
          className="flex-1"
        >
          <Minus className="w-6 h-6" />
        </Button>
        <Button
          variant="gradient"
          size="lg"
          onClick={handleIncrement}
          disabled={!isActive}
          className="flex-1"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  )
}

// ====================================
// MAIN COMPONENT
// ====================================
export default function DuelPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const duelId = params.id as string
  
  // State
  const [duel, setDuel] = useState<Duel | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [myPerformance, setMyPerformance] = useState<Performance | null>(null)
  const [opponentPerformance, setOpponentPerformance] = useState<Performance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Phase and exercise state
  const [duelPhase, setDuelPhase] = useState<DuelPhase>('overview')
  const [exerciseState, setExerciseState] = useState<ExerciseState>('ready')
  const [countdown, setCountdown] = useState(0)
  const [repCount, setRepCount] = useState(0)
  const [exerciseTime, setExerciseTime] = useState(0)
  const [formScore, setFormScore] = useState(85) // Mock form score for now
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  
  // Audio feedback
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Load duel data
  useEffect(() => {
    loadDuelData()
  }, [duelId])

  const loadDuelData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      // If no Supabase user, check localStorage for demo user
      if (!user) {
        const savedUser = localStorage.getItem('fitduel_user')
        if (savedUser) {
          const userData = JSON.parse(savedUser)
          setCurrentUser(userData)
          // Load mock data for demo user
          loadMockData()
          return
        } else {
          router.push('/login')
          return
        }
      }
      
      setCurrentUser(user)

      // Load duel with exercise info
      const { data: duelData, error: duelError } = await supabase
        .from('duels')
        .select(`
          *,
          exercises (
            id,
            name,
            code,
            category,
            description
          )
        `)
        .eq('id', duelId)
        .single()

      if (duelError) {
        console.error('Error loading duel:', duelError)
        // Fallback to mock data
        loadMockData()
        return
      }
      
      // Transform data
      const transformedDuel = {
        ...duelData,
        exercise: duelData.exercises
      }

      // Load profiles
      const profileIds = []
      if (duelData.challenger_id) profileIds.push(duelData.challenger_id)
      if (duelData.challenged_id) profileIds.push(duelData.challenged_id)

      if (profileIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', profileIds)

        const profilesMap = new Map(
          (profilesData || []).map(profile => [profile.id, profile])
        )

        transformedDuel.challenger = profilesMap.get(duelData.challenger_id)
        transformedDuel.challenged = profilesMap.get(duelData.challenged_id)
      }

      setDuel(transformedDuel)

      // Load performances if duel is active or completed
      if (['active', 'completed'].includes(duelData.status)) {
        const { data: performancesData } = await supabase
          .from('performances')
          .select('*')
          .eq('duel_id', duelId)

        if (performancesData) {
          const myPerf = performancesData.find(p => p.user_id === user.id)
          const oppPerf = performancesData.find(p => p.user_id !== user.id)
          
          if (myPerf) setMyPerformance(myPerf)
          if (oppPerf) setOpponentPerformance(oppPerf)
          
          // If already completed, go to results
          if (myPerf) {
            setDuelPhase('results')
          }
        }
      }
    } catch (err: any) {
      console.error('Error loading duel:', err)
      setError('Errore nel caricamento del duello')
      // Fallback to mock data
      loadMockData()
    } finally {
      setLoading(false)
    }
  }

  const loadMockData = () => {
    // Mock duel data for demo mode
    setDuel({
      id: duelId,
      type: '1v1',
      status: 'active',
      challenger_id: 'demo-1',
      challenger: { username: 'Mario', level: 25 },
      challenged_id: 'demo-2',
      challenged: { username: 'Luigi', level: 20 },
      exercise_id: 'ex-1',
      exercise: {
        name: 'Push-Up',
        code: 'push_up',
        description: 'Esegui più flessioni possibili mantenendo la forma corretta'
      },
      difficulty: 'medium',
      wager_xp: 50,
      reward_xp: 150,
      target_reps: 30,
      target_time: 60,
      target_form_score: 80,
      winner_id: null,
      is_draw: false,
      created_at: new Date().toISOString(),
      completed_at: null,
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    })
    setLoading(false)
  }

  // Exercise flow
  const startExercise = () => {
    setDuelPhase('countdown')
    setCountdown(3)
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          setDuelPhase('recording')
          setExerciseState('active')
          playSound('start')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const pauseExercise = () => {
    setExerciseState('paused')
  }

  const resumeExercise = () => {
    setExerciseState('active')
  }

  const resetExercise = () => {
    setExerciseState('ready')
    setRepCount(0)
    setExerciseTime(0)
    setDuelPhase('overview')
  }

  const completeExercise = () => {
    setExerciseState('completed')
    setDuelPhase('uploading')
    playSound('complete')
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
          savePerformance()
        }, 500)
      }
    }, 200)
  }

  // Save performance to database
  const savePerformance = async () => {
    if (!duel || !currentUser) return

    try {
      setIsSaving(true)
      setError(null)

      // Check if we have a real Supabase user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Save to database
        const { data: perfData, error: perfError } = await supabase
          .from('performances')
          .insert({
            user_id: user.id,
            duel_id: duel.id,
            exercise_id: duel.exercise_id,
            reps: repCount,
            duration: exerciseTime,
            form_score: formScore,
            difficulty: duel.difficulty,
            calories_burned: calculateCalories(),
            performed_at: new Date().toISOString()
          })
          .select()
          .single()

        if (perfError) throw perfError

        setMyPerformance(perfData)

        // Check if both users have completed
        const { data: allPerformances } = await supabase
          .from('performances')
          .select('*')
          .eq('duel_id', duel.id)

        if (allPerformances && allPerformances.length >= 2) {
          // Determine winner
          const myScore = calculateScore(perfData)
          const oppPerf = allPerformances.find(p => p.user_id !== user.id)
          const oppScore = oppPerf ? calculateScore(oppPerf) : 0

          let winnerId = null
          let isDraw = false

          if (myScore > oppScore) {
            winnerId = user.id
          } else if (oppScore > myScore) {
            winnerId = oppPerf?.user_id
          } else {
            isDraw = true
          }

          // Update duel status
          await supabase
            .from('duels')
            .update({
              status: 'completed',
              winner_id: winnerId,
              is_draw: isDraw,
              completed_at: new Date().toISOString()
            })
            .eq('id', duel.id)
        }
      } else {
        // Demo mode - just save locally
        setMyPerformance({
          user_id: currentUser.id,
          duel_id: duel.id,
          reps: repCount,
          duration: exerciseTime,
          form_score: formScore,
          performed_at: new Date().toISOString()
        })
      }

      setDuelPhase('results')
    } catch (err: any) {
      console.error('Error saving performance:', err)
      setError('Errore nel salvare la performance')
      // Continue to results anyway
      setDuelPhase('results')
    } finally {
      setIsSaving(false)
    }
  }

  // Utility functions
  const calculateCalories = () => {
    const difficultyMultiplier = {
      easy: 0.5,
      medium: 1,
      hard: 1.5,
      extreme: 2
    }[duel?.difficulty || 'medium']
    
    return Math.round(repCount * difficultyMultiplier * (1 + exerciseTime / 60))
  }

  const calculateScore = (perf: Performance) => {
    const baseScore = perf.reps * (perf.form_score / 100)
    const timeBonus = Math.max(0, 300 - perf.duration) * 0.1
    return Math.round(baseScore + timeBonus)
  }

  const playSound = (type: 'start' | 'complete' | 'rep') => {
    if (!soundEnabled) return
    // Add sound effects here
  }

  const isMyTurn = () => {
    if (!duel || !currentUser) return false
    const userId = currentUser.id || currentUser.email
    return (duel.challenger_id === userId && !myPerformance) ||
           (duel.challenged_id === userId && !myPerformance)
  }

  const getWinner = () => {
    if (!duel || !myPerformance) return null
    
    if (duel.winner_id) {
      const userId = currentUser.id || currentUser.email
      if (duel.winner_id === userId) return 'user'
      if (duel.is_draw) return 'tie'
      return 'opponent'
    }
    
    // Calculate based on scores
    const myScore = calculateScore(myPerformance)
    const oppScore = opponentPerformance ? calculateScore(opponentPerformance) : 0
    
    if (myScore > oppScore) return 'user'
    if (oppScore > myScore) return 'opponent'
    return 'tie'
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'hard': return 'text-orange-400'
      case 'extreme': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  // Loading state
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

  if (!duel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <Card variant="glass" className="p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Duello non trovato</h2>
          <p className="text-gray-400 mb-6">Il duello richiesto non esiste o è stato cancellato.</p>
          <Button variant="gradient" onClick={() => router.push('/challenges')}>
            Torna alle Sfide
          </Button>
        </Card>
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
              <Button variant="ghost" size="sm" onClick={() => router.push('/challenges')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">{duel.exercise?.name || 'Duello'}</h1>
                <p className="text-sm text-gray-400">
                  {duel.challenger?.username || 'Sfidante'} vs {duel.challenged?.username || 'In attesa'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
              <span className={cn('text-sm font-medium px-2 py-1 rounded', getDifficultyColor(duel.difficulty))}>
                {duel.difficulty === 'easy' ? 'Facile' :
                 duel.difficulty === 'medium' ? 'Media' :
                 duel.difficulty === 'hard' ? 'Difficile' : 'Estrema'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2"
          >
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

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
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{duel.exercise?.name}</h2>
                    <p className="text-gray-400">{duel.exercise?.description || 'Completa l\'esercizio per vincere il duello!'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-500">+{duel.reward_xp}</p>
                    <p className="text-sm text-gray-400">XP Premio</p>
                  </div>
                </div>

                {/* Competitors */}
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  {/* Current User */}
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">💪</span>
                    </div>
                    <h3 className="font-bold text-white">{currentUser?.username || currentUser?.email?.split('@')[0] || 'Tu'}</h3>
                    {myPerformance && (
                      <div className="mt-2">
                        <p className="text-2xl font-bold text-white">{myPerformance.reps}</p>
                        <p className="text-xs text-gray-400">reps</p>
                      </div>
                    )}
                  </div>

                  {/* VS */}
                  <div className="flex items-center justify-center">
                    <span className="text-4xl font-bold text-gray-600">VS</span>
                  </div>

                  {/* Opponent */}
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">🏋️</span>
                    </div>
                    <h3 className="font-bold text-white">{duel.challenged?.username || 'In attesa...'}</h3>
                    {opponentPerformance && (
                      <div className="mt-2">
                        <p className="text-2xl font-bold text-white">{opponentPerformance.reps}</p>
                        <p className="text-xs text-gray-400">reps</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Target Info */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-800/30 rounded-lg">
                  {duel.target_reps && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{duel.target_reps}</p>
                      <p className="text-xs text-gray-400">Target Reps</p>
                    </div>
                  )}
                  {duel.target_time && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{formatTime(duel.target_time)}</p>
                      <p className="text-xs text-gray-400">Tempo Max</p>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{duel.wager_xp}</p>
                    <p className="text-xs text-gray-400">XP Puntata</p>
                  </div>
                </div>
              </Card>

              {/* Instructions */}
              <Card variant="glass" className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-white">Come funziona</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400">1.</span>
                    <span>Clicca "Inizia Duello" quando sei pronto</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400">2.</span>
                    <span>Conta le ripetizioni con i pulsanti +/- durante l'esercizio</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400">3.</span>
                    <span>Completa quando hai finito o al tempo massimo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400">4.</span>
                    <span>Il risultato verrà salvato e confrontato con l'avversario</span>
                  </li>
                </ul>
              </Card>

              {/* Start Button */}
              <div className="text-center">
                {isMyTurn() ? (
                  <Button
                    variant="gradient"
                    size="lg"
                    onClick={startExercise}
                    className="px-12 py-4 text-lg"
                  >
                    <Play className="w-6 h-6 mr-3" />
                    Inizia Duello
                  </Button>
                ) : myPerformance ? (
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-gray-400">Hai già completato questo duello</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                    <p className="text-gray-400">Non è il tuo turno</p>
                  </div>
                )}
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
                <p className="text-xl text-gray-400">Preparati per {duel.exercise?.name}</p>
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
              className="max-w-4xl mx-auto"
            >
              <Card variant="glass" className="p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="font-bold text-white">ESERCIZIO IN CORSO</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                  >
                    {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </Button>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Video Placeholder */}
                  <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">Camera Recording</p>
                      <p className="text-sm text-gray-500">Coming Soon - MediaPipe Integration</p>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="space-y-6">
                    {/* Timer */}
                    <ExerciseTimer
                      isRunning={exerciseState === 'active'}
                      onTimeUpdate={setExerciseTime}
                      maxTime={duel.target_time || 300}
                    />

                    {/* Rep Counter */}
                    <RepCounter
                      count={repCount}
                      onCountChange={setRepCount}
                      target={duel.target_reps}
                      isActive={exerciseState === 'active'}
                    />

                    {/* Form Score Mock */}
                    <div className="p-4 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Form Score (Mock)</span>
                        <span className="text-lg font-bold text-white">{formScore}%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className={cn(
                            "h-full",
                            formScore >= 80 ? "bg-green-500" :
                            formScore >= 60 ? "bg-yellow-500" : "bg-red-500"
                          )}
                          animate={{ width: `${formScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex gap-3">
                      {exerciseState === 'active' && (
                        <>
                          <Button
                            variant="secondary"
                            size="lg"
                            onClick={pauseExercise}
                            className="flex-1"
                          >
                            <Pause className="w-5 h-5 mr-2" />
                            Pausa
                          </Button>
                          <Button
                            variant="gradient"
                            size="lg"
                            onClick={completeExercise}
                            className="flex-1"
                            disabled={repCount === 0}
                          >
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Completa
                          </Button>
                        </>
                      )}

                      {exerciseState === 'paused' && (
                        <>
                          <Button
                            variant="secondary"
                            size="lg"
                            onClick={resetExercise}
                            className="flex-1"
                          >
                            <RotateCcw className="w-5 h-5 mr-2" />
                            Reset
                          </Button>
                          <Button
                            variant="gradient"
                            size="lg"
                            onClick={resumeExercise}
                            className="flex-1"
                          >
                            <Play className="w-5 h-5 mr-2" />
                            Riprendi
                          </Button>
                        </>
                      )}
                    </div>
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
                <h3 className="text-xl font-bold text-white mb-2">Salvataggio in corso...</h3>
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
                      <Users className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                      <h2 className="text-3xl font-bold text-white mb-2">Pareggio! 🤝</h2>
                      <p className="text-gray-400">Entrambi avete dato il massimo!</p>
                    </>
                  ) : getWinner() === 'opponent' ? (
                    <>
                      <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                      <h2 className="text-3xl font-bold text-white mb-2">Sconfitta 😔</h2>
                      <p className="text-gray-400">Riprova, sarai più fortunato!</p>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h2 className="text-3xl font-bold text-white mb-2">Completato! ✅</h2>
                      <p className="text-gray-400">In attesa del risultato dell'avversario</p>
                    </>
                  )}
                </div>

                {/* Final Scores */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-white">{repCount}</p>
                    <p className="text-sm text-gray-400">Il tuo score</p>
                    <p className="text-xs text-gray-500">{formatTime(exerciseTime)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-white">
                      {opponentPerformance ? opponentPerformance.reps : '?'}
                    </p>
                    <p className="text-sm text-gray-400">Score avversario</p>
                    {opponentPerformance && (
                      <p className="text-xs text-gray-500">{formatTime(opponentPerformance.duration)}</p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-800/30 rounded-lg">
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{formScore}%</p>
                    <p className="text-xs text-gray-400">Form Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{calculateCalories()}</p>
                    <p className="text-xs text-gray-400">Calorie</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-yellow-500">
                      +{getWinner() === 'user' ? duel.reward_xp : Math.round(duel.reward_xp / 3)} XP
                    </p>
                    <p className="text-xs text-gray-400">Guadagnati</p>
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