'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Timer, Trophy, Flame, Users, Clock,
  Play, Pause, Square, RotateCcw, Upload, CheckCircle,
  Camera, Video, Zap, Target, Award, Coins, Star,
  AlertCircle, Loader2, Plus, Minus, Volume2, VolumeX,
  Info, Send, XCircle, Activity, Shield, Eye, Download, X
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { AIExerciseTracker, type PerformanceData } from '@/components/game/AIExerciseTracker'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ====================================
// TYPES - UPDATED TO MATCH DATABASE
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
  wager_coins: number
  xp_reward: number
  challenger_score?: number | null
  challenged_score?: number | null
  winner_id: string | null
  metadata?: {
    targetReps?: number
    targetTime?: number
    targetFormScore?: number
    rules?: any
  } | null
  created_at: string
  completed_at: string | null
  expires_at: string | null
  updated_at: string
}

interface Performance {
  user_id: string
  duel_id: string
  reps: number
  duration: number
  form_score: number
  video_url?: string
  performed_at: string
  calories_burned?: number
}

type DuelPhase = 'overview' | 'ai_exercise' | 'uploading' | 'results'

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
  
  // Phase state
  const [duelPhase, setDuelPhase] = useState<DuelPhase>('overview')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [showAITracker, setShowAITracker] = useState(false)
  
  // Performance data from AI
  const [performanceResult, setPerformanceResult] = useState<PerformanceData | null>(null)

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
          exercise:exercises!exercise_id(
            id,
            name,
            code,
            category,
            description,
            icon
          ),
          challenger:profiles!challenger_id(
            id,
            username,
            display_name,
            avatar_url,
            level,
            xp,
            coins
          ),
          challenged:profiles!challenged_id(
            id,
            username,
            display_name,
            avatar_url,
            level,
            xp,
            coins
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

      setDuel(duelData)

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
      challenger: { 
        username: 'Mario', 
        display_name: 'Super Mario',
        level: 25,
        xp: 2500,
        coins: 1000
      },
      challenged_id: 'demo-2',
      challenged: { 
        username: 'Luigi', 
        display_name: 'Luigi Bros',
        level: 20,
        xp: 2000,
        coins: 800
      },
      exercise_id: 'ex-1',
      exercise: {
        id: 'ex-1',
        name: 'Push-Up',
        code: 'push_up',
        icon: '💪',
        description: 'Esegui più flessioni possibili mantenendo la forma corretta'
      },
      difficulty: 'medium',
      wager_coins: 50,
      xp_reward: 150,
      challenger_score: null,
      challenged_score: null,
      metadata: {
        targetReps: 30,
        targetTime: 60,
        targetFormScore: 80
      },
      winner_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    })
    setLoading(false)
  }

  // Start exercise with AI
  const startExercise = () => {
    setDuelPhase('ai_exercise')
    setShowAITracker(true)
  }

  // Handle AI exercise completion - FIXED TYPE
  const handleExerciseComplete = (result: PerformanceData) => {
    console.log('Exercise completed:', result)
    setPerformanceResult(result)
    setShowAITracker(false)
    setDuelPhase('uploading')
    simulateUpload()
  }

  // Handle AI exercise cancel
  const handleExerciseCancel = () => {
    setShowAITracker(false)
    setDuelPhase('overview')
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
    if (!duel || !currentUser || !performanceResult) return

    try {
      setIsSaving(true)
      setError(null)

      // Check if we have a real Supabase user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Upload video if available
        let videoUrl: string | undefined
        if (performanceResult.videoBlob) {
          const fileName = `performances/${user.id}_${duel.id}_${Date.now()}.webm`
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('performance-videos')
            .upload(fileName, performanceResult.videoBlob)

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('performance-videos')
              .getPublicUrl(fileName)
            
            videoUrl = publicUrl
          }
        }

        // Save to performances table
        const { data: perfData, error: perfError } = await supabase
          .from('performances')
          .insert({
            user_id: user.id,
            duel_id: duel.id,
            exercise_id: duel.exercise_id,
            reps: performanceResult.repsCompleted,
            duration: performanceResult.duration,
            form_score: performanceResult.formScore,
            video_url: videoUrl || performanceResult.videoUrl,
            difficulty: duel.difficulty,
            calories_burned: performanceResult.caloriesBurned,
            ai_feedback: performanceResult.feedback,
            performed_at: new Date().toISOString()
          })
          .select()
          .single()

        if (perfError) throw perfError

        setMyPerformance(perfData)

        // Update my score in duel
        const scoreUpdate = duel.challenger_id === user.id
          ? { challenger_score: performanceResult.repsCompleted }
          : { challenged_score: performanceResult.repsCompleted }

        await supabase
          .from('duels')
          .update(scoreUpdate)
          .eq('id', duel.id)

        // Check if both users have completed
        const { data: updatedDuel } = await supabase
          .from('duels')
          .select('*')
          .eq('id', duel.id)
          .single()

        if (updatedDuel && 
            updatedDuel.challenger_score !== null && 
            updatedDuel.challenged_score !== null) {
          // Determine winner
          let winnerId = null
          
          if (updatedDuel.challenger_score > updatedDuel.challenged_score) {
            winnerId = updatedDuel.challenger_id
          } else if (updatedDuel.challenged_score > updatedDuel.challenger_score) {
            winnerId = updatedDuel.challenged_id
          }
          // If scores are equal, it's a draw (winner_id remains null)

          // Update duel status
          await supabase
            .from('duels')
            .update({
              status: 'completed',
              winner_id: winnerId,
              completed_at: new Date().toISOString()
            })
            .eq('id', duel.id)

          // Award XP
          if (winnerId === user.id) {
            // Winner gets full XP
            await awardXP(user.id, duel.xp_reward)
          } else {
            // Loser gets partial XP (1/3)
            await awardXP(user.id, Math.round(duel.xp_reward / 3))
          }
        }

        // Update missions progress if missionId is present
        if (performanceResult.missionId) {
          await updateMissionProgress(performanceResult.missionId, performanceResult.repsCompleted)
        }

      } else {
        // Demo mode - just save locally
        setMyPerformance({
          user_id: currentUser.id,
          duel_id: duel.id,
          reps: performanceResult.repsCompleted,
          duration: performanceResult.duration,
          form_score: performanceResult.formScore,
          video_url: performanceResult.videoUrl,
          performed_at: new Date().toISOString(),
          calories_burned: performanceResult.caloriesBurned
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

  // Award XP to user
  const awardXP = async (userId: string, xpAmount: number) => {
    try {
      // Update user_stats table
      const { data: stats } = await supabase
        .from('user_stats')
        .select('total_xp')
        .eq('user_id', userId)
        .single()

      if (stats) {
        const newXP = (stats.total_xp || 0) + xpAmount

        await supabase
          .from('user_stats')
          .update({
            total_xp: newXP
          })
          .eq('user_id', userId)

        // Log XP transaction
        await supabase
          .from('xp_transactions')
          .insert({
            user_id: userId,
            amount: xpAmount,
            reason: `Duel ${duel?.id} reward`,
            reference_type: 'duel',
            reference_id: duel?.id
          })
      }
    } catch (err) {
      console.error('Error awarding XP:', err)
    }
  }

  // Update mission progress
  const updateMissionProgress = async (missionId: string, progress: number) => {
    try {
      const { data: mission } = await supabase
        .from('user_missions')
        .select('*')
        .eq('mission_id', missionId)
        .eq('user_id', currentUser?.id)
        .single()

      if (mission && !mission.is_completed) {
        const newValue = mission.current_value + progress
        
        await supabase
          .from('user_missions')
          .update({
            current_value: newValue
          })
          .eq('mission_id', missionId)
          .eq('user_id', currentUser?.id)
      }
    } catch (err) {
      console.error('Error updating mission:', err)
    }
  }

  // Utility functions
  const calculateScore = (perf: Performance) => {
    const baseScore = perf.reps * (perf.form_score / 100)
    const timeBonus = Math.max(0, 300 - perf.duration) * 0.1
    return Math.round(baseScore + timeBonus)
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

  const getWinner = () => {
    if (!duel || !myPerformance) return null
    
    if (duel.winner_id) {
      const userId = currentUser.id || currentUser.email
      if (duel.winner_id === userId) return 'user'
      if (duel.winner_id === null && duel.status === 'completed') return 'tie'
      return 'opponent'
    }
    
    // Calculate based on scores
    const myScore = calculateScore(myPerformance)
    const oppScore = opponentPerformance ? calculateScore(opponentPerformance) : 0
    
    if (myScore > oppScore) return 'user'
    if (oppScore > myScore) return 'opponent'
    return 'tie'
  }

  const getDisplayName = (user: any) => {
    return user?.display_name || user?.username || 'Giocatore'
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
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-white mb-2">Duello non trovato</h2>
          <p className="text-gray-400 mb-6">Il duello richiesto non esiste o è stato cancellato.</p>
          <Button variant="gradient" onClick={() => router.push('/challenges')}>
            Torna alle Sfide
          </Button>
        </Card>
      </div>
    )
  }

  // Show AI Exercise Tracker in full screen when active
  if (showAITracker && duelPhase === 'ai_exercise') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">{duel.exercise?.name || 'Esercizio'}</h1>
            <Button variant="ghost" onClick={handleExerciseCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <AIExerciseTracker
            exerciseId={duel.exercise?.code || 'push_up'}
            userId={currentUser?.id || 'demo_user'}
            duelId={duel.id}
            targetReps={duel.metadata?.targetReps}
            targetTime={duel.metadata?.targetTime}
            onComplete={handleExerciseComplete}
            onProgress={(progress) => console.log('Progress:', progress)}
          />
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
              <Button variant="ghost" size="sm" onClick={() => router.push('/challenges')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">{duel.exercise?.name || 'Duello'}</h1>
                <p className="text-sm text-gray-400">
                  {getDisplayName(duel.challenger)} vs {getDisplayName(duel.challenged) || 'In attesa'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                      {duel.exercise?.icon && <span className="text-3xl">{duel.exercise.icon}</span>}
                      {duel.exercise?.name}
                    </h2>
                    <p className="text-gray-400">{duel.exercise?.description || 'Completa l\'esercizio per vincere il duello!'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-500">+{duel.xp_reward}</p>
                    <p className="text-sm text-gray-400">XP Premio</p>
                  </div>
                </div>

                {/* Competitors */}
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  {/* Challenger */}
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      {duel.challenger?.avatar_url ? (
                        <img 
                          src={duel.challenger.avatar_url} 
                          alt={getDisplayName(duel.challenger)}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">💪</span>
                      )}
                    </div>
                    <h3 className="font-bold text-white">{getDisplayName(duel.challenger)}</h3>
                    {duel.challenger?.level && (
                      <p className="text-xs text-gray-400">Livello {duel.challenger.level}</p>
                    )}
                    {duel.challenger_score !== null && (
                      <div className="mt-2">
                        <p className="text-2xl font-bold text-white">{duel.challenger_score}</p>
                        <p className="text-xs text-gray-400">reps</p>
                      </div>
                    )}
                  </div>

                  {/* VS */}
                  <div className="flex items-center justify-center">
                    <span className="text-4xl font-bold text-gray-600">VS</span>
                  </div>

                  {/* Challenged */}
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      {duel.challenged?.avatar_url ? (
                        <img 
                          src={duel.challenged.avatar_url} 
                          alt={getDisplayName(duel.challenged)}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">🏋️</span>
                      )}
                    </div>
                    <h3 className="font-bold text-white">{getDisplayName(duel.challenged) || 'In attesa...'}</h3>
                    {duel.challenged?.level && (
                      <p className="text-xs text-gray-400">Livello {duel.challenged.level}</p>
                    )}
                    {duel.challenged_score !== null && (
                      <div className="mt-2">
                        <p className="text-2xl font-bold text-white">{duel.challenged_score}</p>
                        <p className="text-xs text-gray-400">reps</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Target Info */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-800/30 rounded-lg">
                  {duel.metadata?.targetReps && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{duel.metadata.targetReps}</p>
                      <p className="text-xs text-gray-400">Target Reps</p>
                    </div>
                  )}
                  {duel.metadata?.targetTime && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{formatTime(duel.metadata.targetTime)}</p>
                      <p className="text-xs text-gray-400">Tempo Max</p>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">🪙 {duel.wager_coins}</p>
                    <p className="text-xs text-gray-400">Coins Puntata</p>
                  </div>
                </div>
              </Card>

              {/* AI Features Info */}
              <Card variant="gradient" className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <Activity className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Sistema AI Avanzato</h3>
                    <p className="text-sm text-gray-300">MediaPipe per il conteggio automatico</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <Camera className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">Auto-Count</p>
                      <p className="text-xs text-gray-400">Conta automaticamente le ripetizioni</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">Form Score</p>
                      <p className="text-xs text-gray-400">Valutazione forma in tempo reale</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">Feedback Live</p>
                      <p className="text-xs text-gray-400">Correzioni postura istantanee</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Instructions */}
              <Card variant="glass" className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-white">Come funziona con l'AI</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400">1.</span>
                    <span>Clicca "Inizia con AI" e consenti l'accesso alla camera</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400">2.</span>
                    <span>Posizionati al centro dello schermo per la calibrazione</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400">3.</span>
                    <span>L'AI conterà automaticamente le ripetizioni e valuterà la forma</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400">4.</span>
                    <span>Riceverai feedback vocale e visivo in tempo reale</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400">5.</span>
                    <span>Il video verrà salvato automaticamente per la verifica</span>
                  </li>
                </ul>
              </Card>

              {/* Start Button */}
              <div className="text-center">
                {myPerformance ? (
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-gray-400 mb-4">Hai già completato questo duello</p>
                    <Button variant="secondary" onClick={() => setDuelPhase('results')}>
                      Vedi Risultati
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button
                      variant="gradient"
                      size="lg"
                      onClick={startExercise}
                      className="px-12 py-4 text-lg gap-3"
                    >
                      <Activity className="w-6 h-6" />
                      Inizia con AI
                    </Button>
                    <p className="text-sm text-gray-400">
                      Completa l'esercizio per registrare il tuo punteggio
                    </p>
                  </div>
                )}
              </div>
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
                <p className="text-gray-400 mb-6">Stiamo elaborando la tua performance AI</p>
                
                <div className="w-full bg-gray-800 rounded-full h-3 mb-4">
                  <motion.div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                
                <p className="text-sm text-gray-400">{Math.round(uploadProgress)}% completato</p>
                
                {performanceResult && (
                  <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-400">Reps</p>
                        <p className="text-white font-bold">{performanceResult.repsCompleted}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Form</p>
                        <p className="text-white font-bold">{Math.round(performanceResult.formScore)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Tempo</p>
                        <p className="text-white font-bold">{formatTime(performanceResult.duration)}</p>
                      </div>
                    </div>
                  </div>
                )}
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
                    <p className="text-4xl font-bold text-white">
                      {performanceResult?.repsCompleted || myPerformance?.reps || duel.challenger_score || 0}
                    </p>
                    <p className="text-sm text-gray-400">
                      {currentUser?.id === duel.challenger_id ? 'Il tuo score' : getDisplayName(duel.challenger)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTime(performanceResult?.duration || myPerformance?.duration || 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-white">
                      {duel.challenged_score !== null ? duel.challenged_score : 
                       opponentPerformance ? opponentPerformance.reps : '?'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {currentUser?.id === duel.challenged_id ? 'Il tuo score' : getDisplayName(duel.challenged) || 'Avversario'}
                    </p>
                    {opponentPerformance && (
                      <p className="text-xs text-gray-500">{formatTime(opponentPerformance.duration)}</p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-800/30 rounded-lg">
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">
                      {Math.round(performanceResult?.formScore || myPerformance?.form_score || 0)}%
                    </p>
                    <p className="text-xs text-gray-400">Form Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">
                      {performanceResult?.caloriesBurned || myPerformance?.calories_burned || 0}
                    </p>
                    <p className="text-xs text-gray-400">Calorie</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-yellow-500">
                      +{getWinner() === 'user' ? duel.xp_reward : Math.round(duel.xp_reward / 3)} XP
                    </p>
                    <p className="text-xs text-gray-400">Guadagnati</p>
                  </div>
                </div>

                {/* AI Stats */}
                {performanceResult && (
                  <div className="mt-4 p-4 bg-indigo-500/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-5 h-5 text-indigo-400" />
                      <span className="text-sm font-medium text-indigo-400">Statistiche AI</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {performanceResult.feedback.perfectReps > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Reps Perfette:</span>
                          <span className="text-green-400 font-medium">{performanceResult.feedback.perfectReps}</span>
                        </div>
                      )}
                      {performanceResult.feedback.goodReps > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Reps Buone:</span>
                          <span className="text-yellow-400 font-medium">{performanceResult.feedback.goodReps}</span>
                        </div>
                      )}
                      {performanceResult.feedback.mistakes.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-gray-400 mb-1">Suggerimenti:</p>
                          <ul className="text-xs text-gray-500 space-y-1">
                            {performanceResult.feedback.suggestions.slice(0, 2).map((s, i) => (
                              <li key={i}>• {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Video Download */}
                {(performanceResult?.videoUrl || myPerformance?.video_url) && (
                  <div className="mt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        const url = performanceResult?.videoUrl || myPerformance?.video_url
                        if (url) window.open(url, '_blank')
                      }}
                    >
                      <Eye className="w-4 h-4" />
                      Guarda Video Performance
                    </Button>
                  </div>
                )}
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