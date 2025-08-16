'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Timer, Trophy, Flame, Users, Clock,
  Play, Pause, Square, RotateCcw, Upload, CheckCircle,
  Camera, Video, Zap, Target, Award, Coins, Star,
  AlertCircle, Loader2, Plus, Minus, Volume2, VolumeX,
  Info, Send, XCircle, Activity, Shield, Eye, Download, X,
  Wifi, WifiOff, Radio, Swords, CircleDot, RefreshCw
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'

// ====================================
// UPDATED IMPORT - NEW MODULAR AIEXERCISETRACKER
// ====================================
import { AIExerciseTracker } from '@/components/game/ai-tracker/AIExerciseTracker'
import type { PerformanceData } from '@/components/game/ai-tracker/types'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'

// ====================================
// TYPES - REALTIME ENHANCED
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

// Realtime types
interface LiveUpdate {
  type: 'reps' | 'form' | 'status' | 'complete' | 'presence'
  userId: string
  data: any
  timestamp: number
}

interface UserPresence {
  userId: string
  username: string
  status: 'online' | 'exercising' | 'idle' | 'offline'
  currentReps?: number
  currentFormScore?: number
  lastUpdate: number
}

interface LivePerformance {
  userId: string
  username: string
  avatar?: string
  reps: number
  formScore: number
  duration: number
  isActive: boolean
  isCompleted: boolean
  lastUpdate: number
}

type DuelPhase = 'overview' | 'waiting' | 'countdown' | 'live_exercise' | 'uploading' | 'results'

// ====================================
// REALTIME HOOK
// ====================================
function useRealtimeDuel(duelId: string, userId: string) {
  const supabase = createClientComponentClient()
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [presence, setPresence] = useState<RealtimePresenceState>({})
  const [opponentLive, setOpponentLive] = useState<LivePerformance | null>(null)
  const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([])

  // Initialize realtime channel
  useEffect(() => {
    if (!duelId || !userId) return

    // Create channel for this duel
    const duelChannel = supabase.channel(`duel:${duelId}`, {
      config: {
        presence: {
          key: userId,
        },
        broadcast: {
          self: true,
          ack: true
        }
      }
    })

    // Track presence
    duelChannel
      .on('presence', { event: 'sync' }, () => {
        const state = duelChannel.presenceState()
        setPresence(state)
        console.log('Presence sync:', state)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })

    // Listen for broadcast events
    duelChannel
      .on('broadcast', { event: 'live_update' }, ({ payload }) => {
        if (payload.userId !== userId) {
          console.log('Received live update:', payload)
          handleLiveUpdate(payload)
        }
      })
      .on('broadcast', { event: 'exercise_start' }, ({ payload }) => {
        if (payload.userId !== userId) {
          console.log('Opponent started exercise:', payload)
          handleOpponentStart(payload)
        }
      })
      .on('broadcast', { event: 'exercise_complete' }, ({ payload }) => {
        if (payload.userId !== userId) {
          console.log('Opponent completed exercise:', payload)
          handleOpponentComplete(payload)
        }
      })

    // Listen for database changes
    duelChannel
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'duels',
          filter: `id=eq.${duelId}`
        }, 
        (payload) => {
          console.log('Duel updated:', payload)
        }
      )
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'performances',
          filter: `duel_id=eq.${duelId}`
        },
        (payload) => {
          console.log('New performance:', payload)
        }
      )

    // Subscribe to channel
    duelChannel.subscribe((status) => {
      setIsConnected(status === 'SUBSCRIBED')
      console.log('Channel status:', status)
    })

    setChannel(duelChannel)

    // Cleanup
    return () => {
      duelChannel.unsubscribe()
      supabase.removeChannel(duelChannel)
    }
  }, [duelId, userId])

  // Handle live updates
  const handleLiveUpdate = (update: LiveUpdate) => {
    setLiveUpdates(prev => [...prev, update])
    
    // Update opponent live performance
    if (update.type === 'reps' || update.type === 'form') {
      setOpponentLive(prev => ({
        userId: update.userId,
        username: update.data.username || 'Opponent',
        avatar: update.data.avatar,
        reps: update.type === 'reps' ? update.data.reps : (prev?.reps || 0),
        formScore: update.type === 'form' ? update.data.formScore : (prev?.formScore || 0),
        duration: update.data.duration || (prev?.duration || 0),
        isActive: true,
        isCompleted: false,
        lastUpdate: update.timestamp
      }))
    }
  }

  const handleOpponentStart = (data: any) => {
    setOpponentLive({
      userId: data.userId,
      username: data.username || 'Opponent',
      avatar: data.avatar,
      reps: 0,
      formScore: 0,
      duration: 0,
      isActive: true,
      isCompleted: false,
      lastUpdate: Date.now()
    })
  }

  const handleOpponentComplete = (data: any) => {
    setOpponentLive(prev => prev ? {
      ...prev,
      reps: data.reps || prev.reps,
      formScore: data.formScore || prev.formScore,
      duration: data.duration || prev.duration,
      isActive: false,
      isCompleted: true,
      lastUpdate: Date.now()
    } : null)
  }

  // Send updates
  const sendLiveUpdate = useCallback((type: LiveUpdate['type'], data: any) => {
    if (!channel) return

    const update: LiveUpdate = {
      type,
      userId,
      data,
      timestamp: Date.now()
    }

    channel.send({
      type: 'broadcast',
      event: 'live_update',
      payload: update
    })
  }, [channel, userId])

  const sendExerciseStart = useCallback((username: string, avatar?: string) => {
    if (!channel) return

    channel.send({
      type: 'broadcast',
      event: 'exercise_start',
      payload: {
        userId,
        username,
        avatar,
        timestamp: Date.now()
      }
    })
  }, [channel, userId])

  const sendExerciseComplete = useCallback((performance: PerformanceData) => {
    if (!channel) return

    channel.send({
      type: 'broadcast',
      event: 'exercise_complete',
      payload: {
        userId,
        reps: performance.repsCompleted,
        formScore: performance.formScore,
        duration: performance.duration,
        timestamp: Date.now()
      }
    })
  }, [channel, userId])

  // Track presence
  const updatePresence = useCallback((status: UserPresence['status'], data?: any) => {
    if (!channel) return

    channel.track({
      status,
      lastUpdate: Date.now(),
      ...data
    })
  }, [channel])

  return {
    isConnected,
    presence,
    opponentLive,
    liveUpdates,
    sendLiveUpdate,
    sendExerciseStart,
    sendExerciseComplete,
    updatePresence
  }
}

// ====================================
// LIVE PERFORMANCE COMPONENT
// ====================================
function LivePerformanceCard({ 
  performance, 
  isUser = false 
}: { 
  performance: LivePerformance | null
  isUser?: boolean 
}) {
  if (!performance) {
    return (
      <Card variant="glass" className="p-4 opacity-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full mx-auto mb-2 animate-pulse" />
          <p className="text-gray-400 text-sm">In attesa...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card variant={isUser ? 'gradient' : 'glass'} className="p-4 relative overflow-hidden">
      {/* Live indicator */}
      {performance.isActive && (
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <CircleDot className="w-3 h-3 text-red-500 animate-pulse" />
          <span className="text-xs text-red-500 font-medium">LIVE</span>
        </div>
      )}

      {/* Avatar and name */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
            {performance.avatar ? (
              <img src={performance.avatar} alt={performance.username} className="w-full h-full rounded-full" />
            ) : (
              <span className="text-xl">💪</span>
            )}
          </div>
          {performance.isActive && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900" />
          )}
        </div>
        <div>
          <p className="font-bold text-white">{performance.username}</p>
          <p className="text-xs text-gray-400">
            {performance.isCompleted ? 'Completato' : performance.isActive ? 'In esercizio' : 'Pronto'}
          </p>
        </div>
      </div>

      {/* Live stats */}
      <div className="space-y-3">
        {/* Reps counter */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Ripetizioni</span>
          <motion.span 
            key={performance.reps}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold text-white"
          >
            {performance.reps}
          </motion.span>
        </div>

        {/* Form score */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-400">Form Score</span>
            <span className="text-sm font-medium text-white">{Math.round(performance.formScore)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <motion.div
              className={cn(
                "h-2 rounded-full transition-all",
                performance.formScore >= 80 ? "bg-green-500" :
                performance.formScore >= 60 ? "bg-yellow-500" : "bg-red-500"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${performance.formScore}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Tempo</span>
          <span className="text-sm font-medium text-white">
            {formatTime(performance.duration)}
          </span>
        </div>
      </div>

      {/* Completed badge */}
      {performance.isCompleted && (
        <div className="mt-4 p-2 bg-green-500/20 rounded-lg flex items-center justify-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400 font-medium">Esercizio Completato!</span>
        </div>
      )}
    </Card>
  )
}

// ====================================
// COUNTDOWN COMPONENT
// ====================================
function CountdownTimer({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(3)

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => setCount(count - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      onComplete()
    }
  }, [count, onComplete])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.5 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div className="text-center">
        {count > 0 ? (
          <motion.div
            key={count}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="text-9xl font-bold text-white"
          >
            {count}
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-6xl font-bold text-green-500"
          >
            GO!
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// ====================================
// MAIN COMPONENT - ENHANCED WITH REALTIME
// ====================================
export default function DuelLivePage() {
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
  const [showCountdown, setShowCountdown] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [showAITracker, setShowAITracker] = useState(false)
  
  // Performance data from AI
  const [performanceResult, setPerformanceResult] = useState<PerformanceData | null>(null)
  const [myLivePerformance, setMyLivePerformance] = useState<LivePerformance | null>(null)

  // Tournament mode flag
  const [isTournament, setIsTournament] = useState(false)

  // Realtime hook
  const {
    isConnected,
    presence,
    opponentLive,
    liveUpdates,
    sendLiveUpdate,
    sendExerciseStart,
    sendExerciseComplete,
    updatePresence
  } = useRealtimeDuel(duelId, currentUser?.id || '')

  // Load duel data
  useEffect(() => {
    loadDuelData()
  }, [duelId])

  // Update presence when phase changes
  useEffect(() => {
    if (!currentUser) return

    let status: UserPresence['status'] = 'online'
    if (duelPhase === 'live_exercise') status = 'exercising'
    if (duelPhase === 'waiting') status = 'idle'
    
    updatePresence(status, {
      username: currentUser.username || currentUser.email,
      phase: duelPhase
    })
  }, [duelPhase, currentUser, updatePresence])

  const loadDuelData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        const savedUser = localStorage.getItem('fitduel_user')
        if (savedUser) {
          const userData = JSON.parse(savedUser)
          setCurrentUser(userData)
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
        loadMockData()
        return
      }

      setDuel(duelData)
      
      // Check if it's a tournament duel
      setIsTournament(duelData.type === 'tournament')

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
          
          if (myPerf && oppPerf) {
            setDuelPhase('results')
          } else if (myPerf) {
            setDuelPhase('waiting')
          }
        }
      }
    } catch (err: any) {
      console.error('Error loading duel:', err)
      setError('Errore nel caricamento del duello')
      loadMockData()
    } finally {
      setLoading(false)
    }
  }

  const loadMockData = () => {
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

  // Start exercise with countdown
  const startExercise = () => {
    setShowCountdown(true)
    sendExerciseStart(
      currentUser?.username || currentUser?.email || 'Player',
      currentUser?.avatar_url
    )
  }

  // After countdown, start AI tracker
  const onCountdownComplete = () => {
    setShowCountdown(false)
    setDuelPhase('live_exercise')
    setShowAITracker(true)
    
    // Initialize my live performance
    setMyLivePerformance({
      userId: currentUser?.id || 'demo',
      username: currentUser?.username || currentUser?.email || 'Player',
      avatar: currentUser?.avatar_url,
      reps: 0,
      formScore: 0,
      duration: 0,
      isActive: true,
      isCompleted: false,
      lastUpdate: Date.now()
    })
  }

  // Handle AI exercise progress - send live updates
  const handleExerciseProgress = useCallback((progress: any) => {
    console.log('Exercise progress:', progress)
    
    // Update my live performance
    setMyLivePerformance(prev => prev ? {
      ...prev,
      reps: progress.reps || prev.reps,
      formScore: progress.formScore || prev.formScore,
      duration: progress.duration || prev.duration,
      lastUpdate: Date.now()
    } : null)

    // Send live update to opponent
    if (progress.reps !== undefined) {
      sendLiveUpdate('reps', {
        reps: progress.reps,
        username: currentUser?.username || 'Player',
        avatar: currentUser?.avatar_url
      })
    }
    
    if (progress.formScore !== undefined) {
      sendLiveUpdate('form', {
        formScore: progress.formScore,
        duration: progress.duration
      })
    }
  }, [currentUser, sendLiveUpdate])

  // Handle AI exercise completion
  const handleExerciseComplete = (result: PerformanceData) => {
    console.log('Exercise completed:', result)
    setPerformanceResult(result)
    setShowAITracker(false)
    
    // Update my live performance as completed
    setMyLivePerformance(prev => prev ? {
      ...prev,
      reps: result.repsCompleted,
      formScore: result.formScore,
      duration: result.duration,
      isActive: false,
      isCompleted: true,
      lastUpdate: Date.now()
    } : null)

    // Send completion to opponent
    sendExerciseComplete(result)
    
    setDuelPhase('uploading')
    simulateUpload()
  }

  // Handle AI exercise cancel
  const handleExerciseCancel = () => {
    setShowAITracker(false)
    setShowCountdown(false)
    setDuelPhase('overview')
    updatePresence('online', { phase: 'overview' })
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
            trust_score: performanceResult.trustScore,
            is_valid: performanceResult.validationResult?.isValid,
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

          // Update duel status
          await supabase
            .from('duels')
            .update({
              status: 'completed',
              winner_id: winnerId,
              completed_at: new Date().toISOString()
            })
            .eq('id', duel.id)

          setDuelPhase('results')
        } else {
          // Wait for opponent
          setDuelPhase('waiting')
        }
      } else {
        // Demo mode
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
        setDuelPhase('results')
      }
    } catch (err: any) {
      console.error('Error saving performance:', err)
      setError('Errore nel salvare la performance')
      setDuelPhase('results')
    } finally {
      setIsSaving(false)
    }
  }

  // Utility functions
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
  if (showAITracker && duelPhase === 'live_exercise') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950">
        <div className="container mx-auto px-4 py-8">
          {/* Live header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">{duel.exercise?.name || 'Esercizio'}</h1>
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full">
                <CircleDot className="w-4 h-4 text-red-500 animate-pulse" />
                <span className="text-sm text-red-500 font-medium">LIVE</span>
              </div>
              {isTournament && (
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-full">
                  <Shield className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-purple-500 font-medium">TOURNAMENT MODE</span>
                </div>
              )}
            </div>
            <Button variant="ghost" onClick={handleExerciseCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Live performances side by side */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <LivePerformanceCard performance={myLivePerformance} isUser={true} />
            <LivePerformanceCard performance={opponentLive} isUser={false} />
          </div>

          {/* AI Tracker with strictMode for tournaments */}
          <AIExerciseTracker
            exerciseId={duel.exercise?.code || 'push_up'}
            userId={currentUser?.id || 'demo_user'}
            duelId={duel.id}
            targetReps={duel.metadata?.targetReps}
            targetTime={duel.metadata?.targetTime}
            onComplete={handleExerciseComplete}
            onProgress={handleExerciseProgress}
            strictMode={isTournament} // Enable anti-cheat for tournaments
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950">
      {/* Header with connection status */}
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
                  {duel.challenger?.username} vs {duel.challenged?.username || 'In attesa'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Tournament badge */}
              {isTournament && (
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-full">
                  <Trophy className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-purple-400 font-medium">TORNEO</span>
                </div>
              )}

              {/* Connection status */}
              <div className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full text-sm",
                isConnected 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-red-500/20 text-red-400"
              )}>
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span>Connesso</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4" />
                    <span>Disconnesso</span>
                  </>
                )}
              </div>

              {/* Online users */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">
                  {Object.keys(presence).length} online
                </span>
              </div>
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
                    <p className="text-gray-400">{duel.exercise?.description}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-500">+{duel.xp_reward}</p>
                    <p className="text-sm text-gray-400">XP Premio</p>
                  </div>
                </div>

                {/* Live Competitors */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <LivePerformanceCard 
                    performance={myLivePerformance || {
                      userId: currentUser?.id || 'user',
                      username: currentUser?.username || 'Tu',
                      avatar: currentUser?.avatar_url,
                      reps: 0,
                      formScore: 0,
                      duration: 0,
                      isActive: false,
                      isCompleted: false,
                      lastUpdate: Date.now()
                    }} 
                    isUser={true} 
                  />
                  <LivePerformanceCard 
                    performance={opponentLive} 
                    isUser={false} 
                  />
                </div>

                {/* Realtime Features */}
                <Card variant="gradient" className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Radio className="w-5 h-5 text-indigo-400" />
                    <span className="font-bold text-white">Duello Live con Realtime</span>
                    {isTournament && (
                      <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-full">
                        <Shield className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-purple-400">Anti-Cheat Attivo</span>
                      </div>
                    )}
                  </div>
                  <div className="grid md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CircleDot className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">Vedi l'avversario in tempo reale</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300">Aggiornamenti istantanei</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Swords className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-300">Competizione dal vivo</span>
                    </div>
                  </div>
                </Card>
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
                      Inizia Duello Live
                    </Button>
                    <p className="text-sm text-gray-400">
                      Il tuo avversario vedrà i tuoi progressi in tempo reale
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* WAITING PHASE */}
          {duelPhase === 'waiting' && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center min-h-[60vh]"
            >
              <Card variant="glass" className="p-8 text-center max-w-md">
                <Clock className="w-16 h-16 text-indigo-500 mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-bold text-white mb-2">In attesa dell'avversario...</h3>
                <p className="text-gray-400 mb-6">
                  Hai completato la tua performance. Aspettiamo che {duel.challenged?.username || 'l\'avversario'} finisca.
                </p>
                
                {/* Your score */}
                <div className="p-4 bg-gray-800/50 rounded-lg mb-4">
                  <p className="text-sm text-gray-400 mb-1">Il tuo punteggio</p>
                  <p className="text-3xl font-bold text-white">
                    {performanceResult?.repsCompleted || myPerformance?.reps || 0} reps
                  </p>
                  <p className="text-sm text-gray-400">
                    Form: {Math.round(performanceResult?.formScore || myPerformance?.form_score || 0)}%
                  </p>
                  {performanceResult?.trustScore && (
                    <p className="text-sm text-purple-400 mt-1">
                      Trust Score: {performanceResult.trustScore}%
                    </p>
                  )}
                </div>

                {/* Opponent status */}
                {opponentLive && (
                  <div className="p-4 bg-indigo-500/10 rounded-lg">
                    <p className="text-sm text-indigo-400 mb-2">
                      {opponentLive.isActive ? 'Avversario in esercizio...' : 'Avversario online'}
                    </p>
                    {opponentLive.isActive && (
                      <div className="flex items-center justify-center gap-4">
                        <div>
                          <p className="text-2xl font-bold text-white">{opponentLive.reps}</p>
                          <p className="text-xs text-gray-400">reps</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white">{Math.round(opponentLive.formScore)}%</p>
                          <p className="text-xs text-gray-400">form</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Button variant="secondary" onClick={() => router.push('/dashboard')} className="mt-6">
                  Torna alla Dashboard
                </Button>
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
                <h2 className="text-3xl font-bold text-white mb-6">Risultati Duello Live</h2>
                
                {/* Final Scores */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-white">
                      {performanceResult?.repsCompleted || myPerformance?.reps || duel.challenger_score || 0}
                    </p>
                    <p className="text-sm text-gray-400">Tu</p>
                    {performanceResult?.trustScore && (
                      <p className="text-xs text-purple-400 mt-1">
                        Trust: {performanceResult.trustScore}%
                      </p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-white">
                      {duel.challenged_score !== null ? duel.challenged_score : 
                       opponentPerformance ? opponentPerformance.reps : '?'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {duel.challenged?.username || 'Avversario'}
                    </p>
                  </div>
                </div>

                {/* Anti-cheat validation result for tournaments */}
                {isTournament && performanceResult?.validationResult && (
                  <div className={cn(
                    "p-4 rounded-lg mb-4",
                    performanceResult.validationResult.isValid 
                      ? "bg-green-500/10 border border-green-500/20"
                      : "bg-red-500/10 border border-red-500/20"
                  )}>
                    <div className="flex items-center gap-2">
                      <Shield className={cn(
                        "w-5 h-5",
                        performanceResult.validationResult.isValid ? "text-green-400" : "text-red-400"
                      )} />
                      <span className={cn(
                        "font-medium",
                        performanceResult.validationResult.isValid ? "text-green-400" : "text-red-400"
                      )}>
                        {performanceResult.validationResult.isValid 
                          ? "Performance Verificata" 
                          : "Performance Sotto Revisione"}
                      </span>
                    </div>
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
                  Dashboard
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

        {/* Countdown overlay */}
        <AnimatePresence>
          {showCountdown && (
            <CountdownTimer onComplete={onCountdownComplete} />
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

// Helper function for time formatting
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}