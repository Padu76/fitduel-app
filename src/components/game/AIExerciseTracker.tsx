'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Camera, CameraOff, Volume2, VolumeX, Activity,
  CheckCircle, AlertCircle, TrendingUp, TrendingDown,
  Play, Pause, RotateCcw, X, Zap, Trophy, Target,
  ChevronUp, ChevronDown, Loader2, Shield, Sparkles
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// MediaPipe imports - these need to be loaded dynamically
declare global {
  interface Window {
    Pose: any
    Camera: any
    drawConnectors: any
    drawLandmarks: any
    POSE_CONNECTIONS: any
    POSE_LANDMARKS: any
  }
}

// ====================================
// TYPES & INTERFACES
// ====================================
export interface ExerciseConfig {
  name: string
  type: 'pushup' | 'squat' | 'plank' | 'jumping_jack' | 'burpee' | 'situp'
  targetReps?: number
  targetTime?: number // in seconds
  angleThresholds: {
    min: number
    max: number
    joint: 'elbow' | 'knee' | 'hip' | 'shoulder'
  }
  keyPoints: number[] // MediaPipe landmark indices
  formCriteria: {
    perfectRange: [number, number]
    goodRange: [number, number]
  }
}

export interface ExerciseResult {
  exerciseType: string
  reps: number
  duration: number
  formScore: number
  videoUrl?: string
  calories: number
  maxStreak: number
  timestamps: number[]
}

interface FormFeedback {
  type: 'perfect' | 'good' | 'warning' | 'error'
  message: string
  detail?: string
}

// ====================================
// EXERCISE CONFIGURATIONS
// ====================================
const EXERCISE_CONFIGS: Record<string, ExerciseConfig> = {
  pushup: {
    name: 'Push-Up',
    type: 'pushup',
    angleThresholds: { min: 60, max: 170, joint: 'elbow' },
    keyPoints: [11, 13, 15], // shoulder, elbow, wrist
    formCriteria: {
      perfectRange: [60, 90],
      goodRange: [50, 100]
    }
  },
  squat: {
    name: 'Squat',
    type: 'squat',
    angleThresholds: { min: 70, max: 170, joint: 'knee' },
    keyPoints: [23, 25, 27], // hip, knee, ankle
    formCriteria: {
      perfectRange: [70, 90],
      goodRange: [60, 100]
    }
  },
  plank: {
    name: 'Plank',
    type: 'plank',
    targetTime: 60,
    angleThresholds: { min: 160, max: 180, joint: 'hip' },
    keyPoints: [11, 23, 27], // shoulder, hip, ankle
    formCriteria: {
      perfectRange: [170, 180],
      goodRange: [160, 180]
    }
  },
  jumping_jack: {
    name: 'Jumping Jack',
    type: 'jumping_jack',
    angleThresholds: { min: 30, max: 180, joint: 'shoulder' },
    keyPoints: [11, 13, 15], // shoulder, elbow, wrist
    formCriteria: {
      perfectRange: [150, 180],
      goodRange: [120, 180]
    }
  }
}

// ====================================
// UTILITIES
// ====================================
const calculateAngle = (a: any, b: any, c: any): number => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
  let angle = Math.abs(radians * 180.0 / Math.PI)
  if (angle > 180.0) angle = 360 - angle
  return angle
}

const getFormScore = (angle: number, config: ExerciseConfig): number => {
  const { perfectRange, goodRange } = config.formCriteria
  
  if (angle >= perfectRange[0] && angle <= perfectRange[1]) {
    return 100
  } else if (angle >= goodRange[0] && angle <= goodRange[1]) {
    const distance = Math.min(
      Math.abs(angle - perfectRange[0]),
      Math.abs(angle - perfectRange[1])
    )
    return Math.max(70, 100 - distance)
  }
  return Math.max(0, 50 - Math.abs(angle - goodRange[0]))
}

const speakFeedback = (message: string, immediate = false) => {
  if ('speechSynthesis' in window) {
    if (immediate) speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(message)
    utterance.rate = 1.2
    utterance.pitch = 1.0
    utterance.volume = 0.8
    speechSynthesis.speak(utterance)
  }
}

// ====================================
// MAIN COMPONENT
// ====================================
export const AIExerciseTracker = ({
  exerciseType = 'pushup',
  targetReps = 20,
  targetTime,
  onComplete,
  onCancel,
  duelId,
  userId
}: {
  exerciseType: string
  targetReps?: number
  targetTime?: number
  onComplete?: (result: ExerciseResult) => void
  onCancel?: () => void
  duelId?: string
  userId?: string
}) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const poseRef = useRef<any>(null)
  const animationFrameRef = useRef<number>()
  const recordedChunksRef = useRef<Blob[]>([])

  // State
  const [isLoading, setIsLoading] = useState(true)
  const [cameraActive, setCameraActive] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  
  // Exercise state
  const [repCount, setRepCount] = useState(0)
  const [currentAngle, setCurrentAngle] = useState(0)
  const [formScore, setFormScore] = useState(100)
  const [averageFormScore, setAverageFormScore] = useState(100)
  const [isInPosition, setIsInPosition] = useState(false)
  const [lastPosition, setLastPosition] = useState<'up' | 'down'>('up')
  const [repTimestamps, setRepTimestamps] = useState<number[]>([])
  const [currentStreak, setCurrentStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  
  // UI state
  const [countdown, setCountdown] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [feedback, setFeedback] = useState<FormFeedback | null>(null)
  const [showStats, setShowStats] = useState(true)
  const [calibrating, setCalibrating] = useState(false)

  const supabase = createClientComponentClient()
  const config = EXERCISE_CONFIGS[exerciseType] || EXERCISE_CONFIGS.pushup
  const isTimeBasedExercise = config.type === 'plank'
  const target = isTimeBasedExercise ? (targetTime || config.targetTime || 60) : targetReps

  // ====================================
  // MEDIAPIPE SETUP
  // ====================================
  useEffect(() => {
    loadMediaPipe()
  }, [])

  const loadMediaPipe = async () => {
    try {
      setIsLoading(true)
      
      // Load MediaPipe scripts
      const script1 = document.createElement('script')
      script1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js'
      script1.async = true
      
      const script2 = document.createElement('script')
      script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js'
      script2.async = true
      
      const script3 = document.createElement('script')
      script3.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js'
      script3.async = true

      document.body.appendChild(script1)
      document.body.appendChild(script2)
      document.body.appendChild(script3)

      // Wait for scripts to load
      await new Promise(resolve => {
        script3.onload = resolve
      })

      // Initialize Pose
      if (window.Pose) {
        const pose = new window.Pose({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
          }
        })

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        })

        pose.onResults(onPoseResults)
        poseRef.current = pose
      }

      setIsLoading(false)
    } catch (error) {
      console.error('Error loading MediaPipe:', error)
      setIsLoading(false)
    }
  }

  // ====================================
  // CAMERA SETUP
  // ====================================
  const startCamera = async () => {
    try {
      setCalibrating(true)
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)

        // Setup MediaRecorder for video recording
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp8,opus'
        })
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data)
          }
        }
        
        mediaRecorderRef.current = mediaRecorder

        // Start MediaPipe processing
        if (window.Camera && poseRef.current) {
          const camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (poseRef.current && !isPaused) {
                await poseRef.current.send({ image: videoRef.current })
              }
            },
            width: 1280,
            height: 720
          })
          camera.start()
        }

        // Calibration period
        setTimeout(() => {
          setCalibrating(false)
          speakFeedback('Calibrazione completata. Pronto per iniziare!')
        }, 3000)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setFeedback({
        type: 'error',
        message: 'Impossibile accedere alla camera',
        detail: 'Verifica i permessi del browser'
      })
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    
    setCameraActive(false)
    setIsTracking(false)
  }

  // ====================================
  // POSE DETECTION
  // ====================================
  const onPoseResults = (results: any) => {
    if (!canvasRef.current || !videoRef.current || isPaused) return

    const canvasCtx = canvasRef.current.getContext('2d')
    if (!canvasCtx) return

    canvasCtx.save()
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    
    // Draw video frame
    canvasCtx.globalAlpha = 0.3
    canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height)
    canvasCtx.globalAlpha = 1.0

    if (results.poseLandmarks) {
      // Draw skeleton
      if (window.drawConnectors && window.POSE_CONNECTIONS) {
        window.drawConnectors(canvasCtx, results.poseLandmarks, window.POSE_CONNECTIONS, {
          color: formScore > 80 ? '#10b981' : formScore > 60 ? '#f59e0b' : '#ef4444',
          lineWidth: 4
        })
      }
      
      if (window.drawLandmarks) {
        window.drawLandmarks(canvasCtx, results.poseLandmarks, {
          color: '#8b5cf6',
          lineWidth: 2,
          radius: 6
        })
      }

      // Process exercise tracking
      if (isTracking) {
        trackExercise(results.poseLandmarks)
      }
    }

    canvasCtx.restore()
  }

  // ====================================
  // EXERCISE TRACKING LOGIC
  // ====================================
  const trackExercise = (landmarks: any[]) => {
    const jointIndices = getJointIndices(config.type)
    if (!jointIndices) return

    const angle = calculateAngle(
      landmarks[jointIndices[0]],
      landmarks[jointIndices[1]],
      landmarks[jointIndices[2]]
    )

    setCurrentAngle(Math.round(angle))
    
    const score = getFormScore(angle, config)
    setFormScore(score)
    
    // Update average form score
    setAverageFormScore(prev => (prev * 0.95 + score * 0.05))

    // Check exercise position and count reps
    if (!isTimeBasedExercise) {
      countReps(angle, score)
    }

    // Provide feedback
    provideFeedback(angle, score)
  }

  const getJointIndices = (exerciseType: string): number[] | null => {
    switch (exerciseType) {
      case 'pushup':
        return [11, 13, 15] // shoulder, elbow, wrist
      case 'squat':
        return [23, 25, 27] // hip, knee, ankle
      case 'plank':
        return [11, 23, 27] // shoulder, hip, ankle
      case 'jumping_jack':
        return [11, 13, 15] // shoulder, elbow, wrist
      default:
        return null
    }
  }

  const countReps = (angle: number, score: number) => {
    const { min, max } = config.angleThresholds
    
    // Determine current position
    const currentPos = angle < (min + max) / 2 ? 'down' : 'up'
    
    // Count rep when moving from down to up with good form
    if (lastPosition === 'down' && currentPos === 'up' && score > 60) {
      const newCount = repCount + 1
      setRepCount(newCount)
      setRepTimestamps([...repTimestamps, Date.now()])
      
      // Update streak
      if (score > 80) {
        setCurrentStreak(prev => {
          const newStreak = prev + 1
          setMaxStreak(Math.max(maxStreak, newStreak))
          return newStreak
        })
      } else {
        setCurrentStreak(0)
      }
      
      // Voice feedback
      if (soundEnabled) {
        if (newCount % 5 === 0) {
          speakFeedback(`${newCount} ripetizioni!`, true)
        } else if (score > 90) {
          speakFeedback('Perfetto!', true)
        }
      }
      
      // Check if target reached
      if (newCount >= targetReps) {
        completeExercise()
      }
    }
    
    setLastPosition(currentPos)
  }

  const provideFeedback = (angle: number, score: number) => {
    if (score > 90) {
      setFeedback({
        type: 'perfect',
        message: 'Forma perfetta!',
        detail: 'Continua così'
      })
    } else if (score > 70) {
      setFeedback({
        type: 'good',
        message: 'Buona forma',
        detail: 'Mantieni la posizione'
      })
    } else if (score > 50) {
      setFeedback({
        type: 'warning',
        message: 'Attenzione alla forma',
        detail: config.type === 'pushup' ? 'Scendi di più' : 'Controlla la postura'
      })
    } else {
      setFeedback({
        type: 'error',
        message: 'Forma scorretta',
        detail: 'Correggi la posizione'
      })
    }
  }

  // ====================================
  // EXERCISE CONTROL
  // ====================================
  const startExercise = async () => {
    if (!cameraActive) {
      await startCamera()
      return
    }

    // Start countdown
    setCountdown(3)
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval)
          
          // Start tracking
          setIsTracking(true)
          setCountdown(null)
          
          // Start recording
          if (mediaRecorderRef.current) {
            recordedChunksRef.current = []
            mediaRecorderRef.current.start()
          }
          
          // Voice feedback
          if (soundEnabled) {
            speakFeedback('Via!', true)
          }
          
          // Start timer
          startTimer()
          
          return null
        }
        
        if (soundEnabled && prev > 0) {
          speakFeedback(prev.toString(), true)
        }
        
        return prev - 1
      })
    }, 1000)
  }

  const startTimer = () => {
    const startTime = Date.now()
    
    const timerInterval = setInterval(() => {
      if (isPaused) return
      
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setElapsedTime(elapsed)
      
      // Check time limit for time-based exercises
      if (isTimeBasedExercise && elapsed >= (targetTime || 60)) {
        clearInterval(timerInterval)
        completeExercise()
      }
    }, 100)
  }

  const pauseExercise = () => {
    setIsPaused(!isPaused)
    
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause()
    } else if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume()
    }
  }

  const resetExercise = () => {
    setRepCount(0)
    setElapsedTime(0)
    setCurrentStreak(0)
    setMaxStreak(0)
    setRepTimestamps([])
    setAverageFormScore(100)
    setIsTracking(false)
    setIsPaused(false)
    
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  const completeExercise = async () => {
    setIsTracking(false)
    
    // Stop recording
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    
    // Calculate calories (rough estimate)
    const calories = Math.round((repCount * 0.3) + (elapsedTime * 0.05))
    
    // Upload video to Supabase if available
    let videoUrl: string | undefined
    
    if (recordedChunksRef.current.length > 0 && userId && duelId) {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
      const fileName = `${userId}/${duelId}/${Date.now()}.webm`
      
      try {
        const { data, error } = await supabase.storage
          .from('exercise-videos')
          .upload(fileName, blob, {
            contentType: 'video/webm',
            upsert: true
          })
        
        if (data) {
          const { data: urlData } = supabase.storage
            .from('exercise-videos')
            .getPublicUrl(fileName)
          
          videoUrl = urlData.publicUrl
        }
      } catch (error) {
        console.error('Error uploading video:', error)
      }
    }
    
    // Create result object
    const result: ExerciseResult = {
      exerciseType: config.name,
      reps: repCount,
      duration: elapsedTime,
      formScore: Math.round(averageFormScore),
      videoUrl,
      calories,
      maxStreak,
      timestamps: repTimestamps
    }
    
    // Voice feedback
    if (soundEnabled) {
      speakFeedback(
        `Complimenti! Hai completato ${repCount} ripetizioni con un punteggio forma di ${Math.round(averageFormScore)}%`,
        true
      )
    }
    
    // Callback
    if (onComplete) {
      onComplete(result)
    }
  }

  // ====================================
  // RENDER
  // ====================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-white text-lg">Caricamento sistema AI...</p>
          <p className="text-gray-400 text-sm mt-2">Preparazione MediaPipe</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">{config.name}</h1>
            <p className="text-gray-400">
              Target: {isTimeBasedExercise ? `${target}s` : `${target} ripetizioni`}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              <Activity className="w-5 h-5" />
            </Button>
            
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Camera View */}
          <div className="lg:col-span-2">
            <Card variant="glass" className="relative overflow-hidden">
              <div className="relative aspect-video bg-gray-900">
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover mirror"
                  autoPlay
                  playsInline
                  muted
                />
                
                <canvas
                  ref={canvasRef}
                  width={1280}
                  height={720}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Overlay UI */}
                {!cameraActive && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Button
                      variant="gradient"
                      size="lg"
                      onClick={startCamera}
                      className="gap-2"
                    >
                      <Camera className="w-6 h-6" />
                      Attiva Camera
                    </Button>
                  </div>
                )}
                
                {calibrating && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-center">
                      <Shield className="w-12 h-12 text-indigo-500 animate-pulse mx-auto mb-4" />
                      <p className="text-white text-lg font-medium">Calibrazione in corso...</p>
                      <p className="text-gray-300 text-sm mt-2">Posizionati al centro dello schermo</p>
                    </div>
                  </div>
                )}
                
                {countdown !== null && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <motion.div
                      key={countdown}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      className="text-8xl font-bold text-white"
                    >
                      {countdown}
                    </motion.div>
                  </div>
                )}
                
                {/* Live Stats Overlay */}
                {isTracking && showStats && (
                  <div className="absolute top-4 left-4 right-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3">
                        <p className="text-xs text-gray-400">Ripetizioni</p>
                        <p className="text-2xl font-bold text-white">{repCount}/{target}</p>
                      </div>
                      
                      <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3">
                        <p className="text-xs text-gray-400">Form Score</p>
                        <p className={cn(
                          "text-2xl font-bold",
                          formScore > 80 ? "text-green-400" :
                          formScore > 60 ? "text-yellow-400" : "text-red-400"
                        )}>
                          {Math.round(formScore)}%
                        </p>
                      </div>
                      
                      <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3">
                        <p className="text-xs text-gray-400">Tempo</p>
                        <p className="text-2xl font-bold text-white">
                          {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Form Feedback */}
                {feedback && isTracking && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className={cn(
                        "rounded-lg p-4 backdrop-blur-sm",
                        feedback.type === 'perfect' && "bg-green-500/20 border border-green-500/50",
                        feedback.type === 'good' && "bg-blue-500/20 border border-blue-500/50",
                        feedback.type === 'warning' && "bg-yellow-500/20 border border-yellow-500/50",
                        feedback.type === 'error' && "bg-red-500/20 border border-red-500/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {feedback.type === 'perfect' && <CheckCircle className="w-6 h-6 text-green-400" />}
                        {feedback.type === 'good' && <TrendingUp className="w-6 h-6 text-blue-400" />}
                        {feedback.type === 'warning' && <AlertCircle className="w-6 h-6 text-yellow-400" />}
                        {feedback.type === 'error' && <TrendingDown className="w-6 h-6 text-red-400" />}
                        
                        <div>
                          <p className="text-white font-medium">{feedback.message}</p>
                          {feedback.detail && (
                            <p className="text-gray-300 text-sm">{feedback.detail}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
              
              {/* Control Bar */}
              <div className="p-4 bg-gray-900/50 border-t border-gray-800">
                <div className="flex items-center justify-center gap-3">
                  {!isTracking ? (
                    <Button
                      variant="gradient"
                      size="lg"
                      onClick={startExercise}
                      disabled={!cameraActive || calibrating}
                      className="gap-2"
                    >
                      <Play className="w-5 h-5" />
                      Inizia Esercizio
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        onClick={pauseExercise}
                      >
                        {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                      </Button>
                      
                      <Button
                        variant="secondary"
                        onClick={resetExercise}
                      >
                        <RotateCcw className="w-5 h-5" />
                      </Button>
                      
                      <Button
                        variant="gradient"
                        onClick={completeExercise}
                        disabled={repCount < 1}
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Completa
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Stats Panel */}
          <div className="space-y-4">
            {/* Progress Card */}
            <Card variant="glass" className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-500" />
                Progresso
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Completamento</span>
                    <span className="text-white font-medium">
                      {Math.round((repCount / targetReps) * 100)}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((repCount / targetReps) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Ripetizioni</p>
                    <p className="text-xl font-bold text-white">{repCount}</p>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Target</p>
                    <p className="text-xl font-bold text-indigo-400">{targetReps}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Form Analysis */}
            <Card variant="glass" className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" />
                Analisi Forma
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Form Score</span>
                  <span className={cn(
                    "text-2xl font-bold",
                    averageFormScore > 80 ? "text-green-400" :
                    averageFormScore > 60 ? "text-yellow-400" : "text-red-400"
                  )}>
                    {Math.round(averageFormScore)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Angolo Corrente</span>
                  <span className="text-lg font-medium text-white">{currentAngle}°</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Range Ottimale</span>
                  <span className="text-sm text-gray-300">
                    {config.formCriteria.perfectRange[0]}° - {config.formCriteria.perfectRange[1]}°
                  </span>
                </div>
              </div>
            </Card>

            {/* Streak & Bonus */}
            <Card variant="glass" className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Streak & Bonus
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Streak Attuale</span>
                  <div className="flex items-center gap-1">
                    <Flame className={cn(
                      "w-5 h-5",
                      currentStreak > 0 ? "text-orange-500" : "text-gray-600"
                    )} />
                    <span className="text-lg font-bold text-white">{currentStreak}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Max Streak</span>
                  <div className="flex items-center gap-1">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="text-lg font-bold text-white">{maxStreak}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Tempo/Rep</span>
                  <span className="text-lg font-medium text-white">
                    {repCount > 0 ? (elapsedTime / repCount).toFixed(1) : '0'}s
                  </span>
                </div>
              </div>
            </Card>

            {/* Tips */}
            <Card variant="gradient" className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white mb-1">Suggerimento</p>
                  <p className="text-xs text-gray-300">
                    {config.type === 'pushup' && "Mantieni il corpo dritto e scendi fino a 90°"}
                    {config.type === 'squat' && "Scendi fino a quando le cosce sono parallele al pavimento"}
                    {config.type === 'plank' && "Mantieni la schiena dritta e contrai gli addominali"}
                    {config.type === 'jumping_jack' && "Salta con le braccia sopra la testa"}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIExerciseTracker