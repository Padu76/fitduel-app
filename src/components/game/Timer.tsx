'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, Pause, RotateCcw, Square, Plus, Minus,
  Volume2, VolumeX, Timer as TimerIcon, Zap, Trophy,
  AlertCircle, CheckCircle, Clock, TrendingUp, Flame,
  Maximize, Minimize, Target, Activity, BarChart3
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

// ====================================
// TYPES & INTERFACES
// ====================================
export interface AdvancedTimerProps {
  duration?: number // in seconds
  onComplete?: () => void
  onTick?: (timeLeft: number) => void
  onStart?: () => void
  onPause?: () => void
  onReset?: () => void
  onRepComplete?: (count: number) => void
  variant?: 'default' | 'compact' | 'minimal' | 'fullscreen' | 'immersive'
  mode?: 'countdown' | 'stopwatch' | 'interval' | 'exercise'
  autoStart?: boolean
  showMilliseconds?: boolean
  showControls?: boolean
  soundEnabled?: boolean
  voiceEnabled?: boolean
  vibrationEnabled?: boolean
  targetReps?: number | null
  enableAutoCount?: boolean
  className?: string
}

export interface TimerState {
  isRunning: boolean
  isPaused: boolean
  timeLeft: number
  elapsed: number
  repCount: number
  laps: number[]
  phase: 'ready' | 'countdown' | 'active' | 'paused' | 'completed'
}

export interface TimerStats {
  averageRepTime: number
  currentPace: number
  consistency: number
  peakPerformance: number
  caloriesBurned: number
}

// ====================================
// iOS-OPTIMIZED AUDIO SYSTEM
// ====================================
class iOSAudioManager {
  private audioContext: AudioContext | null = null
  private synthesis: SpeechSynthesis | null = null
  private isInitialized = false
  private soundQueue: Array<{ type: string; frequency?: number; duration?: number }> = []
  private voiceQueue: Array<{ text: string; options?: any }> = []
  private isProcessing = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis
      // iOS requires user interaction to initialize audio
      this.setupUserInteractionListener()
    }
  }

  private setupUserInteractionListener() {
    const initAudio = () => {
      if (!this.isInitialized) {
        this.initializeAudioContext()
        // Remove listeners after first interaction
        document.removeEventListener('touchstart', initAudio)
        document.removeEventListener('click', initAudio)
        document.removeEventListener('keydown', initAudio)
      }
    }

    document.addEventListener('touchstart', initAudio, { once: true })
    document.addEventListener('click', initAudio, { once: true })
    document.addEventListener('keydown', initAudio, { once: true })
  }

  private async initializeAudioContext() {
    try {
      // Create and immediately resume audio context for iOS
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // Create a silent audio buffer to "unlock" iOS audio
      const buffer = this.audioContext.createBuffer(1, 1, 22050)
      const source = this.audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(this.audioContext.destination)
      source.start(0)

      this.isInitialized = true
      console.log('iOS Audio Context initialized successfully')
      
      // Process any queued sounds
      this.processQueue()
    } catch (error) {
      console.warn('Failed to initialize audio context:', error)
    }
  }

  private processQueue() {
    if (this.isProcessing) return
    this.isProcessing = true

    // Process sound queue
    while (this.soundQueue.length > 0) {
      const sound = this.soundQueue.shift()
      if (sound) {
        this.playBeepImmediate(sound.frequency || 800, sound.duration || 200)
      }
    }

    // Process voice queue
    while (this.voiceQueue.length > 0) {
      const voice = this.voiceQueue.shift()
      if (voice) {
        this.speakImmediate(voice.text, voice.options)
      }
    }

    this.isProcessing = false
  }

  playBeep(frequency: number = 800, duration: number = 200) {
    if (!this.isInitialized) {
      // Queue the sound for later
      this.soundQueue.push({ type: 'beep', frequency, duration })
      return
    }

    this.playBeepImmediate(frequency, duration)
  }

  private playBeepImmediate(frequency: number, duration: number) {
    if (!this.audioContext || this.audioContext.state !== 'running') return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)
      
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
      oscillator.type = 'sine'
      
      // Smooth envelope to prevent clicks
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000)
      
      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + duration / 1000)
    } catch (error) {
      console.warn('Failed to play beep:', error)
    }
  }

  speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }) {
    if (!this.synthesis) return

    if (!this.isInitialized) {
      // Queue the voice for later
      this.voiceQueue.push({ text, options })
      return
    }

    this.speakImmediate(text, options)
  }

  private speakImmediate(text: string, options?: { rate?: number; pitch?: number; volume?: number }) {
    if (!this.synthesis) return

    try {
      // Cancel any ongoing speech
      this.synthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = options?.rate || 1.2
      utterance.pitch = options?.pitch || 1
      utterance.volume = options?.volume || 0.8
      utterance.lang = 'it-IT' // Italian voice for better UX
      
      // Add error handling
      utterance.onerror = (event) => {
        console.warn('Speech synthesis error:', event.error)
      }
      
      this.synthesis.speak(utterance)
    } catch (error) {
      console.warn('Failed to speak:', error)
    }
  }

  playCountdownSound(count: number) {
    const frequencies = { 3: 600, 2: 700, 1: 800, 0: 1000 }
    const frequency = frequencies[count as keyof typeof frequencies] || 800
    const duration = count === 0 ? 500 : 300
    this.playBeep(frequency, duration)
  }

  playRepSound() {
    this.playBeep(900, 150)
  }

  playCompleteSound() {
    // Victory fanfare
    setTimeout(() => this.playBeep(800, 200), 0)
    setTimeout(() => this.playBeep(1000, 200), 200)
    setTimeout(() => this.playBeep(1200, 300), 400)
  }

  triggerVibration(pattern: number | number[]) {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern)
      } catch (error) {
        console.warn('Vibration not supported:', error)
      }
    }
  }
}

// ====================================
// MOTION DETECTION HOOK (MEDIAPOINT READY)
// ====================================
const useMotionDetection = (enabled: boolean = false) => {
  const [motionData, setMotionData] = useState({
    repDetected: false,
    confidence: 0,
    formScore: 85,
    isActive: false
  })

  useEffect(() => {
    if (!enabled) return

    // Placeholder for MediaPipe integration
    // This will be replaced with actual pose detection
    const mockMotionDetection = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance of rep detection
        setMotionData(prev => ({
          ...prev,
          repDetected: true,
          confidence: 80 + Math.random() * 20,
          formScore: 70 + Math.random() * 30
        }))
        
        // Reset detection after brief moment
        setTimeout(() => {
          setMotionData(prev => ({ ...prev, repDetected: false }))
        }, 500)
      }
    }, 2000)

    return () => clearInterval(mockMotionDetection)
  }, [enabled])

  return motionData
}

// ====================================
// ADVANCED TIMER COMPONENT
// ====================================
export function AdvancedTimer({
  duration = 60,
  onComplete,
  onTick,
  onStart,
  onPause,
  onReset,
  onRepComplete,
  variant = 'default',
  mode = 'countdown',
  autoStart = false,
  showMilliseconds = false,
  showControls = true,
  soundEnabled = true,
  voiceEnabled = true,
  vibrationEnabled = true,
  targetReps = null,
  enableAutoCount = false,
  className
}: AdvancedTimerProps) {
  const [state, setState] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    timeLeft: mode === 'countdown' ? duration : 0,
    elapsed: 0,
    repCount: 0,
    laps: [],
    phase: 'ready'
  })

  const [stats, setStats] = useState<TimerStats>({
    averageRepTime: 0,
    currentPace: 0,
    consistency: 100,
    peakPerformance: 0,
    caloriesBurned: 0
  })

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [countdownValue, setCountdownValue] = useState(0)
  const [repTimes, setRepTimes] = useState<number[]>([])

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const lastRepTimeRef = useRef<number>(0)
  const audioManager = useRef(new iOSAudioManager())
  const motionData = useMotionDetection(enableAutoCount)

  // Format time display
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    
    if (showMilliseconds) {
      return `${minutes}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
    }
    
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }, [showMilliseconds])

  // Calculate progress percentage
  const getProgress = useCallback((): number => {
    if (mode === 'countdown') {
      return ((duration - state.timeLeft) / duration) * 100
    }
    return Math.min((state.elapsed / duration) * 100, 100)
  }, [mode, duration, state.timeLeft, state.elapsed])

  // Update stats in real-time
  const updateStats = useCallback(() => {
    if (repTimes.length === 0) return

    const avgTime = repTimes.reduce((a, b) => a + b, 0) / repTimes.length
    const currentPace = repTimes.length > 0 ? (state.elapsed / repTimes.length) : 0
    const consistency = repTimes.length > 1 ? 
      100 - (Math.max(...repTimes) - Math.min(...repTimes)) / avgTime * 100 : 100
    
    setStats({
      averageRepTime: avgTime,
      currentPace,
      consistency: Math.max(0, consistency),
      peakPerformance: Math.max(...repTimes.map((_, i) => (i + 1) / repTimes.slice(0, i + 1).reduce((a, b) => a + b, 0) * repTimes.length)),
      caloriesBurned: Math.round(state.repCount * 0.5 + state.elapsed / 60 * 3)
    })
  }, [repTimes, state.elapsed, state.repCount])

  // Handle rep increment (manual or auto)
  const addRep = useCallback(() => {
    const currentTime = Date.now()
    const timeSinceLastRep = lastRepTimeRef.current ? 
      (currentTime - lastRepTimeRef.current) / 1000 : state.elapsed

    setState(prev => ({ ...prev, repCount: prev.repCount + 1 }))
    setRepTimes(prev => [...prev, timeSinceLastRep])
    lastRepTimeRef.current = currentTime

    // Audio feedback
    if (soundEnabled) audioManager.current.playRepSound()
    if (voiceEnabled && state.repCount > 0 && (state.repCount + 1) % 5 === 0) {
      audioManager.current.speak(`${state.repCount + 1}`)
    }
    if (vibrationEnabled) audioManager.current.triggerVibration(50)

    onRepComplete?.(state.repCount + 1)
  }, [state.repCount, state.elapsed, soundEnabled, voiceEnabled, vibrationEnabled, onRepComplete])

  // Auto-detection of reps via motion
  useEffect(() => {
    if (enableAutoCount && motionData.repDetected && state.isRunning) {
      addRep()
    }
  }, [enableAutoCount, motionData.repDetected, state.isRunning, addRep])

  // Timer tick logic
  const tick = useCallback(() => {
    setState(prev => {
      const now = Date.now()
      const delta = (now - startTimeRef.current) / 1000

      let newState = { ...prev }

      if (mode === 'countdown') {
        newState.timeLeft = Math.max(0, duration - delta)
        newState.elapsed = delta

        // Warning sounds for countdown
        if (soundEnabled && newState.timeLeft <= 10 && newState.timeLeft > 0) {
          const secondsLeft = Math.floor(newState.timeLeft)
          if (secondsLeft !== Math.floor(prev.timeLeft) && secondsLeft <= 3) {
            audioManager.current.playCountdownSound(secondsLeft)
            if (voiceEnabled) {
              audioManager.current.speak(secondsLeft.toString())
            }
          }
        }

        // Check completion
        if (newState.timeLeft === 0 && prev.timeLeft > 0) {
          newState.isRunning = false
          newState.phase = 'completed'
          if (soundEnabled) audioManager.current.playCompleteSound()
          if (voiceEnabled) audioManager.current.speak('Tempo scaduto!')
          if (vibrationEnabled) audioManager.current.triggerVibration([200, 100, 200])
          if (onComplete) onComplete()
        }
      } else {
        // Stopwatch mode
        newState.elapsed = delta
        newState.timeLeft = delta
      }

      // Callback
      if (onTick) onTick(mode === 'countdown' ? newState.timeLeft : newState.elapsed)

      return newState
    })
  }, [mode, duration, soundEnabled, voiceEnabled, vibrationEnabled, onComplete, onTick])

  // Countdown before start
  const startCountdown = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'countdown' }))
    setCountdownValue(3)
    
    if (voiceEnabled) audioManager.current.speak('Preparati')
    
    const countdownInterval = setInterval(() => {
      setCountdownValue(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          // Start actual timer
          startTimeRef.current = Date.now()
          setState(prevState => ({ 
            ...prevState, 
            isRunning: true, 
            isPaused: false,
            phase: 'active'
          }))
          
          if (soundEnabled) audioManager.current.playCountdownSound(0)
          if (voiceEnabled) audioManager.current.speak('Via!')
          if (onStart) onStart()
          
          return 0
        } else {
          if (soundEnabled) audioManager.current.playCountdownSound(prev - 1)
          if (voiceEnabled) audioManager.current.speak((prev - 1).toString())
          return prev - 1
        }
      })
    }, 1000)
  }, [soundEnabled, voiceEnabled, onStart])

  // Control functions
  const start = useCallback(() => {
    if (state.phase === 'completed') {
      reset()
      return
    }
    startCountdown()
  }, [state.phase, startCountdown])

  const pause = useCallback(() => {
    if (state.isRunning) {
      setState(prev => ({ ...prev, isRunning: false, isPaused: true, phase: 'paused' }))
      if (onPause) onPause()
    }
  }, [state.isRunning, onPause])

  const resume = useCallback(() => {
    if (state.isPaused) {
      startTimeRef.current = Date.now() - (state.elapsed * 1000)
      setState(prev => ({ ...prev, isRunning: true, isPaused: false, phase: 'active' }))
    }
  }, [state.isPaused, state.elapsed])

  const reset = useCallback(() => {
    setState({
      isRunning: false,
      isPaused: false,
      timeLeft: mode === 'countdown' ? duration : 0,
      elapsed: 0,
      repCount: 0,
      laps: [],
      phase: 'ready'
    })
    setRepTimes([])
    setCountdownValue(0)
    startTimeRef.current = 0
    lastRepTimeRef.current = 0
    if (onReset) onReset()
  }, [mode, duration, onReset])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  // Auto start
  useEffect(() => {
    if (autoStart && state.phase === 'ready') {
      const timer = setTimeout(start, 500)
      return () => clearTimeout(timer)
    }
  }, [autoStart, state.phase, start])

  // Timer interval
  useEffect(() => {
    if (state.isRunning) {
      intervalRef.current = setInterval(tick, showMilliseconds ? 10 : 100)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [state.isRunning, tick, showMilliseconds])

  // Update stats
  useEffect(() => {
    updateStats()
  }, [updateStats])

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Get timer color based on state
  const getTimerColor = (): string => {
    if (state.phase === 'completed') return 'text-green-500'
    if (mode === 'countdown') {
      const percentage = (state.timeLeft / duration) * 100
      if (percentage > 50) return 'text-green-500'
      if (percentage > 25) return 'text-yellow-500'
      if (percentage > 10) return 'text-orange-500'
      return 'text-red-500'
    }
    return 'text-indigo-500'
  }

  // Countdown Overlay
  const CountdownOverlay = () => (
    <AnimatePresence>
      {state.phase === 'countdown' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center"
        >
          <motion.div
            key={countdownValue}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-9xl font-bold text-white"
          >
            {countdownValue === 0 ? 'VIA!' : countdownValue}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Render based on variant
  switch (variant) {
    case 'minimal':
      return (
        <div className={cn('inline-flex items-center gap-2', className)}>
          <TimerIcon className="w-4 h-4 text-muted-foreground" />
          <span className={cn('font-mono font-bold', getTimerColor())}>
            {formatTime(state.timeLeft)}
          </span>
          {targetReps && (
            <span className="text-sm text-gray-400">
              {state.repCount}/{targetReps}
            </span>
          )}
        </div>
      )

    case 'compact':
      return (
        <div className={cn('flex items-center gap-3', className)}>
          <div className="relative">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-gray-700"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - getProgress() / 100)}`}
                className={cn('transition-all duration-100', getTimerColor())}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold">{Math.floor(state.timeLeft)}s</span>
            </div>
          </div>
          {showControls && (
            <div className="flex gap-1">
              {state.isRunning ? (
                <Button size="sm" variant="ghost" onClick={pause}>
                  <Pause className="w-4 h-4" />
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={state.isPaused ? resume : start}>
                  <Play className="w-4 h-4" />
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={reset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )

    case 'immersive':
    case 'fullscreen':
      return (
        <>
          <CountdownOverlay />
          <motion.div 
            className={cn(
              isFullscreen || variant === 'immersive' 
                ? 'fixed inset-0 bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 z-40' 
                : '',
              'flex flex-col items-center justify-center min-h-screen p-8',
              className
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Header Controls */}
            <div className="absolute top-6 right-6 flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => audioManager.current.speak('Test audio')}>
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
              {variant !== 'immersive' && (
                <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </Button>
              )}
            </div>

            {/* Main Timer Display */}
            <div className="text-center mb-12">
              <div className="relative mb-8">
                <svg className="w-80 h-80 transform -rotate-90">
                  <circle
                    cx="160"
                    cy="160"
                    r="150"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-800/30"
                  />
                  <motion.circle
                    cx="160"
                    cy="160"
                    r="150"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 150}`}
                    strokeDashoffset={`${2 * Math.PI * 150 * (1 - getProgress() / 100)}`}
                    className={cn('transition-all duration-300', getTimerColor())}
                  />
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span 
                    className={cn('text-8xl font-mono font-bold mb-4', getTimerColor())}
                    animate={{ 
                      scale: state.isRunning && state.timeLeft <= 10 ? [1, 1.1, 1] : 1 
                    }}
                    transition={{ duration: 1, repeat: state.isRunning && state.timeLeft <= 10 ? Infinity : 0 }}
                  >
                    {formatTime(state.timeLeft)}
                  </motion.span>
                  
                  {targetReps && (
                    <div className="text-center">
                      <span className="text-4xl font-bold text-white">{state.repCount}</span>
                      <span className="text-2xl text-gray-400">/{targetReps}</span>
                      <p className="text-sm text-gray-500 mt-1">ripetizioni</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Phase Status */}
              <motion.p
                className="text-xl font-medium text-gray-300 mb-8"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {state.phase === 'ready' && 'Pronto per iniziare'}
                {state.phase === 'countdown' && 'Preparati...'}
                {state.phase === 'active' && 'Esercizio in corso'}
                {state.phase === 'paused' && 'In pausa'}
                {state.phase === 'completed' && 'Completato!'}
              </motion.p>
            </div>

            {/* Rep Counter (if target reps) */}
            {targetReps && state.phase === 'active' && (
              <Card variant="glass" className="p-6 mb-8">
                <div className="flex items-center justify-center gap-6">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => state.repCount > 0 && setState(prev => ({ ...prev, repCount: prev.repCount - 1 }))}
                    disabled={state.repCount === 0 || !state.isRunning}
                  >
                    <Minus className="w-6 h-6" />
                  </Button>
                  
                  <div className="text-center min-w-[120px]">
                    <p className="text-5xl font-bold text-white">{state.repCount}</p>
                    <p className="text-sm text-gray-400">ripetizioni</p>
                  </div>
                  
                  <Button
                    variant="gradient"
                    size="lg"
                    onClick={addRep}
                    disabled={!state.isRunning}
                  >
                    <Plus className="w-6 h-6" />
                  </Button>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 h-3 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full transition-all",
                      (state.repCount / targetReps) >= 1 ? "bg-green-500" : "bg-gradient-to-r from-indigo-500 to-purple-500"
                    )}
                    animate={{ width: `${Math.min((state.repCount / targetReps) * 100, 100)}%` }}
                  />
                </div>
              </Card>
            )}

            {/* Real-time Stats */}
            {state.repCount > 0 && (
              <Card variant="glass" className="p-4 mb-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.averageRepTime.toFixed(1)}s</p>
                    <p className="text-xs text-gray-400">Tempo Medio</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.currentPace.toFixed(1)}</p>
                    <p className="text-xs text-gray-400">Ritmo</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.consistency.toFixed(0)}%</p>
                    <p className="text-xs text-gray-400">Consistenza</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-500">{stats.caloriesBurned}</p>
                    <p className="text-xs text-gray-400">Calorie</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Controls */}
            {showControls && (
              <div className="flex gap-4">
                {state.isRunning ? (
                  <Button variant="secondary" size="lg" onClick={pause}>
                    <Pause className="w-6 h-6 mr-3" />
                    Pausa
                  </Button>
                ) : state.isPaused ? (
                  <Button variant="gradient" size="lg" onClick={resume}>
                    <Play className="w-6 h-6 mr-3" />
                    Riprendi
                  </Button>
                ) : (
                  <Button variant="gradient" size="lg" onClick={start}>
                    <Play className="w-6 h-6 mr-3" />
                    {state.phase === 'completed' ? 'Ricomincia' : 'Inizia'}
                  </Button>
                )}
                
                <Button variant="secondary" size="lg" onClick={reset}>
                  <RotateCcw className="w-6 h-6 mr-3" />
                  Reset
                </Button>
                
                {state.phase === 'active' && (
                  <Button 
                    variant="success" 
                    size="lg" 
                    onClick={() => setState(prev => ({ ...prev, phase: 'completed', isRunning: false }))}
                  >
                    <CheckCircle className="w-6 h-6 mr-3" />
                    Completa
                  </Button>
                )}
              </div>
            )}

            {/* Motion Detection Indicator */}
            {enableAutoCount && (
              <div className="absolute bottom-6 left-6">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg",
                  motionData.isActive ? "bg-green-500/20 text-green-400" : "bg-gray-800/50 text-gray-400"
                )}>
                  <Activity className={cn("w-4 h-4", motionData.repDetected && "animate-pulse")} />
                  <span className="text-sm">AI Detection</span>
                  {motionData.confidence > 0 && (
                    <span className="text-xs">({motionData.confidence.toFixed(0)}%)</span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )

    default:
      return (
        <>
          <CountdownOverlay />
          <Card variant="glass" className={cn('p-6', className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: state.isRunning ? 360 : 0 }}
                  transition={{ duration: 2, repeat: state.isRunning ? Infinity : 0, ease: "linear" }}
                >
                  <TimerIcon className="w-6 h-6 text-indigo-500" />
                </motion.div>
                <h3 className="text-lg font-semibold text-white">
                  {mode === 'exercise' ? 'Exercise Timer' : 'Timer'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => audioManager.current.speak('Audio test')}
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                  <Maximize className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Timer Display */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-gray-700/30"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - getProgress() / 100)}`}
                    className={cn('transition-all duration-100', getTimerColor())}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn('text-3xl font-mono font-bold', getTimerColor())}>
                    {formatTime(state.timeLeft)}
                  </span>
                  {targetReps && (
                    <span className="text-sm text-gray-400 mt-1">
                      {state.repCount}/{targetReps}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Rep Counter */}
            {targetReps && (
              <div className="flex items-center justify-center gap-4 mb-4">
                <Button
                  variant="secondary"
                  onClick={() => state.repCount > 0 && setState(prev => ({ ...prev, repCount: prev.repCount - 1 }))}
                  disabled={state.repCount === 0 || !state.isRunning}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="text-center min-w-[80px]">
                  <p className="text-2xl font-bold text-white">{state.repCount}</p>
                  <p className="text-xs text-gray-400">reps</p>
                </div>
                <Button
                  variant="gradient"
                  onClick={addRep}
                  disabled={!state.isRunning}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="h-2 bg-gray-700/30 rounded-full overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full', getTimerColor().replace('text-', 'bg-'))}
                  style={{ width: `${getProgress()}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>

            {/* Controls */}
            {showControls && (
              <div className="flex justify-center gap-2">
                {state.isRunning ? (
                  <Button variant="secondary" onClick={pause}>
                    <Pause className="w-4 h-4 mr-2" />
                    Pausa
                  </Button>
                ) : (
                  <Button variant="gradient" onClick={state.isPaused ? resume : start}>
                    <Play className="w-4 h-4 mr-2" />
                    {state.isPaused ? 'Riprendi' : state.phase === 'completed' ? 'Ricomincia' : 'Inizia'}
                  </Button>
                )}
                
                <Button variant="secondary" onClick={reset}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            )}

            {/* Stats */}
            {state.repCount > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700/30">
                <div className="grid grid-cols-2 gap-4 text-center text-sm">
                  <div>
                    <p className="text-white font-semibold">{stats.averageRepTime.toFixed(1)}s</p>
                    <p className="text-gray-400">Tempo Medio</p>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{stats.caloriesBurned}</p>
                    <p className="text-gray-400">Calorie</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </>
      )
  }
}

// ====================================
// EXPORTS
// ====================================
export { AdvancedTimer as Timer }
export default AdvancedTimer

// Re-export existing components for compatibility
export { ExerciseTimer, CountdownOverlay } from './Timer'