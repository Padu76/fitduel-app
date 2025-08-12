'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, Pause, RotateCcw, Square, ChevronUp, ChevronDown,
  Volume2, VolumeX, Timer as TimerIcon, Zap, Trophy,
  AlertCircle, CheckCircle, Clock, TrendingUp, Flame
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

// ====================================
// TYPES & INTERFACES
// ====================================
export interface TimerProps {
  duration?: number // in seconds
  onComplete?: () => void
  onTick?: (timeLeft: number) => void
  onStart?: () => void
  onPause?: () => void
  onReset?: () => void
  variant?: 'default' | 'compact' | 'minimal' | 'fullscreen'
  mode?: 'countdown' | 'stopwatch' | 'interval'
  intervals?: number[]
  autoStart?: boolean
  showMilliseconds?: boolean
  showControls?: boolean
  soundEnabled?: boolean
  vibrationEnabled?: boolean
  className?: string
}

export interface TimerState {
  isRunning: boolean
  isPaused: boolean
  timeLeft: number
  elapsed: number
  currentInterval: number
  laps: number[]
}

// ====================================
// TIMER SOUNDS
// ====================================
const playSound = (type: 'tick' | 'warning' | 'complete' | 'start') => {
  // In production, use actual audio files
  if (typeof window !== 'undefined' && 'Audio' in window) {
    try {
      const audio = new Audio()
      // Set different frequencies for different sounds
      const frequencies = {
        tick: 800,
        warning: 1000,
        complete: 1200,
        start: 600
      }
      
      // Create a simple beep using AudioContext (for demo)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = frequencies[type]
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (e) {
      console.log('Audio not supported')
    }
  }
}

const triggerVibration = (pattern: number | number[]) => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

// ====================================
// TIMER COMPONENT
// ====================================
export function Timer({
  duration = 60,
  onComplete,
  onTick,
  onStart,
  onPause,
  onReset,
  variant = 'default',
  mode = 'countdown',
  intervals = [],
  autoStart = false,
  showMilliseconds = false,
  showControls = true,
  soundEnabled = true,
  vibrationEnabled = true,
  className
}: TimerProps) {
  const [state, setState] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    timeLeft: mode === 'countdown' ? duration : 0,
    elapsed: 0,
    currentInterval: 0,
    laps: []
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

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

  // Timer tick logic
  const tick = useCallback(() => {
    setState(prev => {
      const now = Date.now()
      const delta = (now - startTimeRef.current) / 1000

      let newState = { ...prev }

      if (mode === 'countdown') {
        newState.timeLeft = Math.max(0, duration - delta)
        newState.elapsed = delta

        // Warning sounds
        if (soundEnabled) {
          if (newState.timeLeft <= 10 && newState.timeLeft > 0 && Math.floor(newState.timeLeft) === newState.timeLeft) {
            playSound('warning')
          }
          if (newState.timeLeft <= 3 && newState.timeLeft > 0) {
            if (vibrationEnabled) triggerVibration(100)
          }
        }

        // Check completion
        if (newState.timeLeft === 0) {
          newState.isRunning = false
          if (soundEnabled) playSound('complete')
          if (vibrationEnabled) triggerVibration([200, 100, 200])
          if (onComplete) onComplete()
        }
      } else {
        // Stopwatch mode
        newState.elapsed = delta
        newState.timeLeft = delta
      }

      // Handle intervals
      if (intervals.length > 0 && newState.currentInterval < intervals.length) {
        if (newState.elapsed >= intervals[newState.currentInterval]) {
          newState.currentInterval++
          if (soundEnabled) playSound('tick')
          if (vibrationEnabled) triggerVibration(50)
        }
      }

      // Callback
      if (onTick) onTick(mode === 'countdown' ? newState.timeLeft : newState.elapsed)

      return newState
    })
  }, [mode, duration, intervals, soundEnabled, vibrationEnabled, onComplete, onTick])

  // Start timer
  const start = useCallback(() => {
    if (!state.isRunning) {
      startTimeRef.current = Date.now() - (state.elapsed * 1000)
      setState(prev => ({ ...prev, isRunning: true, isPaused: false }))
      if (soundEnabled) playSound('start')
      if (onStart) onStart()
    }
  }, [state.isRunning, state.elapsed, soundEnabled, onStart])

  // Pause timer
  const pause = useCallback(() => {
    if (state.isRunning) {
      setState(prev => ({ ...prev, isRunning: false, isPaused: true }))
      if (onPause) onPause()
    }
  }, [state.isRunning, onPause])

  // Reset timer
  const reset = useCallback(() => {
    setState({
      isRunning: false,
      isPaused: false,
      timeLeft: mode === 'countdown' ? duration : 0,
      elapsed: 0,
      currentInterval: 0,
      laps: []
    })
    startTimeRef.current = 0
    if (onReset) onReset()
  }, [mode, duration, onReset])

  // Add lap (for stopwatch mode)
  const addLap = useCallback(() => {
    if (mode === 'stopwatch' && state.isRunning) {
      setState(prev => ({
        ...prev,
        laps: [...prev.laps, prev.elapsed]
      }))
    }
  }, [mode, state.isRunning])

  // Auto start
  useEffect(() => {
    if (autoStart && !state.isRunning) {
      start()
    }
  }, [autoStart])

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

  // Get timer color based on time left
  const getTimerColor = (): string => {
    if (mode === 'countdown') {
      const percentage = (state.timeLeft / duration) * 100
      if (percentage > 50) return 'text-green-500'
      if (percentage > 25) return 'text-yellow-500'
      if (percentage > 10) return 'text-orange-500'
      return 'text-red-500'
    }
    return 'text-primary'
  }

  // Render based on variant
  switch (variant) {
    case 'minimal':
      return (
        <div className={cn('inline-flex items-center gap-2', className)}>
          <TimerIcon className="w-4 h-4 text-muted-foreground" />
          <span className={cn('font-mono font-bold', getTimerColor())}>
            {formatTime(state.timeLeft)}
          </span>
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
                className="text-secondary"
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
                <Button size="sm" variant="ghost" onClick={start}>
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

    case 'fullscreen':
      return (
        <motion.div 
          className={cn(
            'fixed inset-0 bg-background/95 backdrop-blur-xl z-50',
            'flex flex-col items-center justify-center',
            className
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Large Timer Display */}
          <div className="relative mb-12">
            <svg className="w-64 h-64 transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-secondary/30"
              />
              <motion.circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 120}`}
                strokeDashoffset={`${2 * Math.PI * 120 * (1 - getProgress() / 100)}`}
                className={cn('transition-all duration-100', getTimerColor())}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-6xl font-mono font-bold mb-2', getTimerColor())}>
                {formatTime(state.timeLeft)}
              </span>
              {mode === 'countdown' && (
                <span className="text-sm text-muted-foreground">
                  {Math.round(getProgress())}% Complete
                </span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4">
            {state.isRunning ? (
              <Button size="lg" variant="gradient" onClick={pause}>
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
            ) : (
              <Button size="lg" variant="gradient" onClick={start}>
                <Play className="w-5 h-5 mr-2" />
                {state.isPaused ? 'Resume' : 'Start'}
              </Button>
            )}
            <Button size="lg" variant="secondary" onClick={reset}>
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset
            </Button>
            <Button 
              size="lg" 
              variant="danger" 
              onClick={() => {
                reset()
                // Close fullscreen (you'd implement this based on your app logic)
              }}
            >
              <Square className="w-5 h-5 mr-2" />
              Exit
            </Button>
          </div>
        </motion.div>
      )

    default:
      return (
        <Card variant="glass" className={cn('p-6', className)}>
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
                  className="text-secondary/30"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - getProgress() / 100)}`}
                  className={cn('transition-all duration-100', getTimerColor())}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn('text-3xl font-mono font-bold', getTimerColor())}>
                  {formatTime(state.timeLeft)}
                </span>
                {mode === 'stopwatch' && state.laps.length > 0 && (
                  <span className="text-xs text-muted-foreground mt-1">
                    Lap {state.laps.length}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full', 
                  getProgress() > 75 ? 'bg-red-500' :
                  getProgress() > 50 ? 'bg-orange-500' :
                  getProgress() > 25 ? 'bg-yellow-500' :
                  'bg-green-500'
                )}
                style={{ width: `${getProgress()}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>

          {/* Controls */}
          {showControls && (
            <div className="flex justify-center gap-2">
              {state.isRunning ? (
                <Button variant="gradient" onClick={pause}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button variant="gradient" onClick={start}>
                  <Play className="w-4 h-4 mr-2" />
                  {state.isPaused ? 'Resume' : 'Start'}
                </Button>
              )}
              
              <Button variant="secondary" onClick={reset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>

              {mode === 'stopwatch' && (
                <Button 
                  variant="secondary" 
                  onClick={addLap}
                  disabled={!state.isRunning}
                >
                  Lap
                </Button>
              )}
            </div>
          )}

          {/* Laps Display (for stopwatch) */}
          {mode === 'stopwatch' && state.laps.length > 0 && (
            <div className="mt-4 max-h-32 overflow-y-auto">
              <h4 className="text-sm font-semibold mb-2">Laps</h4>
              <div className="space-y-1">
                {state.laps.map((lap, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lap {index + 1}</span>
                    <span className="font-mono">{formatTime(lap)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )
  }
}

// ====================================
// EXERCISE TIMER COMPONENT
// ====================================
export function ExerciseTimer({
  exercise,
  reps,
  onComplete,
  className
}: {
  exercise: string
  reps: number
  onComplete: () => void
  className?: string
}) {
  const [currentRep, setCurrentRep] = useState(0)
  const [phase, setPhase] = useState<'ready' | 'exercise' | 'rest' | 'complete'>('ready')

  const handlePhaseComplete = useCallback(() => {
    if (phase === 'ready') {
      setPhase('exercise')
    } else if (phase === 'exercise') {
      if (currentRep < reps - 1) {
        setCurrentRep(prev => prev + 1)
        setPhase('rest')
      } else {
        setPhase('complete')
        onComplete()
      }
    } else if (phase === 'rest') {
      setPhase('exercise')
    }
  }, [phase, currentRep, reps, onComplete])

  const getPhaseInfo = () => {
    switch (phase) {
      case 'ready':
        return { text: 'Get Ready!', duration: 3, color: 'text-yellow-500' }
      case 'exercise':
        return { text: exercise, duration: 30, color: 'text-green-500' }
      case 'rest':
        return { text: 'Rest', duration: 10, color: 'text-blue-500' }
      case 'complete':
        return { text: 'Complete!', duration: 0, color: 'text-primary' }
      default:
        return { text: '', duration: 0, color: '' }
    }
  }

  const phaseInfo = getPhaseInfo()

  if (phase === 'complete') {
    return (
      <Card variant="gradient" className={cn('p-8 text-center', className)}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-2xl font-bold mb-2">Workout Complete!</h3>
          <p className="text-muted-foreground">
            You completed {reps} sets of {exercise}
          </p>
        </motion.div>
      </Card>
    )
  }

  return (
    <Card variant="glass" className={cn('p-6', className)}>
      {/* Phase Indicator */}
      <div className="text-center mb-4">
        <h3 className={cn('text-2xl font-bold mb-2', phaseInfo.color)}>
          {phaseInfo.text}
        </h3>
        <p className="text-sm text-muted-foreground">
          Set {currentRep + 1} of {reps}
        </p>
      </div>

      {/* Timer */}
      <Timer
        duration={phaseInfo.duration}
        onComplete={handlePhaseComplete}
        autoStart={true}
        variant="default"
        mode="countdown"
        showControls={false}
      />

      {/* Progress Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: reps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              i < currentRep ? 'bg-primary w-8' :
              i === currentRep ? 'bg-primary animate-pulse' :
              'bg-secondary'
            )}
          />
        ))}
      </div>
    </Card>
  )
}

// ====================================
// COUNTDOWN OVERLAY COMPONENT
// ====================================
export function CountdownOverlay({
  isVisible,
  onComplete,
  duration = 3
}: {
  isVisible: boolean
  onComplete: () => void
  duration?: number
}) {
  const [count, setCount] = useState(duration)

  useEffect(() => {
    if (isVisible) {
      setCount(duration)
      const interval = setInterval(() => {
        setCount(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            onComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isVisible, duration, onComplete])

  return (
    <AnimatePresence>
      {isVisible && count > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/90 backdrop-blur-lg z-50 flex items-center justify-center"
        >
          <motion.div
            key={count}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-9xl font-bold text-primary"
          >
            {count === 0 ? 'GO!' : count}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}