// ====================================
// FITDUEL VALIDATION HOOK
// Combines AI + Motion tracking for complete validation
// Real-time exercise validation with zero video storage
// ====================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { AIValidator, ExerciseValidation } from '@/lib/validation/ai-validator'
import { MotionTracker, MotionPattern } from '@/lib/validation/motion-tracker'
import { ANTI_CHEAT_CONFIG, MEDIA_CONFIG } from '@/config/infrastructure'
import { EXERCISES, XP_REWARDS, FORM_SCORE_THRESHOLDS } from '@/utils/constants'
import { calculateXPForDuel, hashString, generateChallengeCode } from '@/utils/helpers'

// ====================================
// TYPES & INTERFACES
// ====================================
export interface DuelValidationState {
  // Status
  isReady: boolean
  isValidating: boolean
  isCompleted: boolean
  error: string | null
  
  // Real-time data
  currentReps: number
  currentDuration: number
  currentFormScore: number
  
  // Validation results
  finalResults: DuelResults | null
  
  // Device compatibility
  hasCamera: boolean
  hasMotionSensors: boolean
  permissionsGranted: boolean
}

export interface DuelResults {
  // Core metrics
  exercise: string
  repCount: number
  duration: number
  formScore: number
  
  // Validation
  isValid: boolean
  confidence: number
  validationHash: string
  
  // XP & Rewards
  xpEarned: number
  badges: string[]
  
  // Feedback
  feedback: string[]
  violations: string[]
  improvements: string[]
  
  // Proof
  proof: ValidationProof
}

export interface ValidationProof {
  timestamp: number
  deviceId: string
  exerciseCode: string
  score: number
  duration: number
  hash: string
  signature: string
  snapshots?: string[] // Base64 thumbnails
}

export interface DuelValidationOptions {
  exercise: string
  targetReps?: number
  targetDuration?: number
  opponentScore?: number
  enableAI?: boolean
  enableMotion?: boolean
  strictMode?: boolean
}

// ====================================
// CUSTOM HOOK
// ====================================
export function useDuelValidation(options: DuelValidationOptions) {
  // State
  const [state, setState] = useState<DuelValidationState>({
    isReady: false,
    isValidating: false,
    isCompleted: false,
    error: null,
    currentReps: 0,
    currentDuration: 0,
    currentFormScore: 0,
    finalResults: null,
    hasCamera: false,
    hasMotionSensors: false,
    permissionsGranted: false,
  })

  // Refs
  const aiValidator = useRef<AIValidator | null>(null)
  const motionTracker = useRef<MotionTracker | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const snapshotsRef = useRef<string[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // ====================================
  // INITIALIZATION
  // ====================================
  useEffect(() => {
    checkDeviceCapabilities()
    return cleanup
  }, [])

  const checkDeviceCapabilities = async () => {
    const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    const hasMotionSensors = 
      typeof window !== 'undefined' && 
      'DeviceMotionEvent' in window && 
      'DeviceOrientationEvent' in window

    setState(prev => ({
      ...prev,
      hasCamera,
      hasMotionSensors,
    }))
  }

  // ====================================
  // SETUP VALIDATION
  // ====================================
  const setupValidation = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }))

      // Initialize AI Validator if enabled and camera available
      if (options.enableAI !== false && state.hasCamera) {
        const validator = new AIValidator(options.exercise)
        const initialized = await validator.initialize()
        
        if (!initialized) {
          throw new Error('Failed to initialize AI validator')
        }
        
        aiValidator.current = validator
      }

      // Initialize Motion Tracker if enabled and sensors available
      if (options.enableMotion !== false && state.hasMotionSensors) {
        const tracker = new MotionTracker(options.exercise)
        const initialized = await tracker.initialize()
        
        if (initialized) {
          motionTracker.current = tracker
        }
      }

      // Request camera permission
      if (state.hasCamera) {
        await requestCameraPermission()
      }

      setState(prev => ({
        ...prev,
        isReady: true,
        permissionsGranted: true,
      }))

    } catch (error) {
      console.error('Setup validation error:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Setup failed',
        isReady: false,
      }))
    }
  }, [options, state.hasCamera, state.hasMotionSensors])

  // ====================================
  // CAMERA PERMISSION
  // ====================================
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        }
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
      return true
    } catch (error) {
      console.error('Camera permission error:', error)
      throw new Error('Camera permission denied')
    }
  }

  // ====================================
  // START VALIDATION
  // ====================================
  const startValidation = useCallback(async () => {
    if (!state.isReady) {
      await setupValidation()
    }

    setState(prev => ({
      ...prev,
      isValidating: true,
      isCompleted: false,
      currentReps: 0,
      currentDuration: 0,
      currentFormScore: 0,
      finalResults: null,
    }))

    startTimeRef.current = Date.now()
    snapshotsRef.current = []

    // Start motion tracking
    if (motionTracker.current) {
      motionTracker.current.startTracking()
    }

    // Start AI validation loop
    if (aiValidator.current && videoRef.current) {
      startAIValidationLoop()
    }

    // Start duration counter
    intervalRef.current = setInterval(() => {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setState(prev => ({ ...prev, currentDuration: duration }))
      
      // Take snapshots at intervals
      if (MEDIA_CONFIG.SNAPSHOTS.ENABLE_SNAPSHOTS && canvasRef.current) {
        takeSnapshot()
      }
    }, 1000)

  }, [state.isReady, setupValidation])

  // ====================================
  // AI VALIDATION LOOP
  // ====================================
  const startAIValidationLoop = () => {
    const processFrame = async () => {
      if (!aiValidator.current || !videoRef.current || !state.isValidating) {
        return
      }

      try {
        // Process current video frame
        const frame = await aiValidator.current.processFrame(videoRef.current)
        
        // Update real-time metrics
        if (frame.isValidRep) {
          setState(prev => ({ 
            ...prev, 
            currentReps: prev.currentReps + 1 
          }))
        }
        
        setState(prev => ({ 
          ...prev, 
          currentFormScore: frame.formScore 
        }))

      } catch (error) {
        console.error('Frame processing error:', error)
      }

      // Continue loop
      animationFrameRef.current = requestAnimationFrame(processFrame)
    }

    processFrame()
  }

  // ====================================
  // STOP VALIDATION
  // ====================================
  const stopValidation = useCallback(async () => {
    setState(prev => ({ ...prev, isValidating: false }))

    // Stop timers
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Get final results
    const results = await compileFinalResults()
    
    setState(prev => ({
      ...prev,
      isCompleted: true,
      finalResults: results,
    }))

    // Cleanup
    cleanup()

    return results
  }, [])

  // ====================================
  // COMPILE RESULTS
  // ====================================
  const compileFinalResults = async (): Promise<DuelResults> => {
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
    
    // Get AI validation results
    let aiValidation: ExerciseValidation | null = null
    if (aiValidator.current) {
      aiValidation = aiValidator.current.getValidationResult()
    }

    // Get motion tracking results
    let motionPattern: MotionPattern | null = null
    if (motionTracker.current) {
      motionPattern = motionTracker.current.stopTracking()
    }

    // Combine results
    const repCount = aiValidation?.repCount || motionTracker.current?.getRepCount() || state.currentReps
    const formScore = aiValidation?.formScore || state.currentFormScore
    
    // Calculate validity
    const isValid = validateResults(aiValidation, motionPattern, duration)
    
    // Calculate confidence
    const confidence = calculateConfidence(aiValidation, motionPattern)
    
    // Generate proof
    const proof = await generateProof(options.exercise, repCount, duration, formScore)
    
    // Calculate XP
    const xpEarned = calculateXP(formScore, options.opponentScore)
    
    // Generate feedback
    const feedback = generateFeedback(aiValidation, motionPattern)
    const violations = [...(aiValidation?.violations || []), ...(motionPattern?.anomalies || [])]
    const improvements = generateImprovements(formScore, violations)
    
    // Check for badges
    const badges = checkBadges(repCount, duration, formScore)

    return {
      exercise: options.exercise,
      repCount,
      duration,
      formScore,
      isValid,
      confidence,
      validationHash: proof.hash,
      xpEarned,
      badges,
      feedback,
      violations,
      improvements,
      proof,
    }
  }

  // ====================================
  // VALIDATION LOGIC
  // ====================================
  const validateResults = (
    ai: ExerciseValidation | null,
    motion: MotionPattern | null,
    duration: number
  ): boolean => {
    // Strict mode requires both AI and motion validation
    if (options.strictMode) {
      return (ai?.isValid && motion?.isValid) || false
    }

    // Check minimum requirements
    const config = ANTI_CHEAT_CONFIG.VALIDATION
    const minDuration = config.MIN_EXERCISE_DURATION[options.exercise as keyof typeof config.MIN_EXERCISE_DURATION]
    
    if (duration < minDuration) {
      return false
    }

    // At least one validation method must pass
    return ai?.isValid || motion?.isValid || false
  }

  const calculateConfidence = (
    ai: ExerciseValidation | null,
    motion: MotionPattern | null
  ): number => {
    let confidence = 0
    let sources = 0

    if (ai) {
      confidence += ai.confidence
      sources++
    }

    if (motion && motion.consistency > 0) {
      confidence += motion.consistency
      sources++
    }

    return sources > 0 ? confidence / sources : 0
  }

  // ====================================
  // PROOF GENERATION
  // ====================================
  const generateProof = async (
    exercise: string,
    score: number,
    duration: number,
    formScore: number
  ): Promise<ValidationProof> => {
    const timestamp = Date.now()
    const deviceId = await getDeviceId()
    
    // Create proof data
    const proofData = {
      timestamp,
      deviceId,
      exerciseCode: exercise,
      score,
      duration,
      formScore,
      random: Math.random().toString(36),
    }

    // Generate hash
    const hash = await hashString(JSON.stringify(proofData))
    
    // Generate signature (simplified - in production use proper signing)
    const signature = await hashString(`${hash}:${deviceId}:${timestamp}`)

    return {
      timestamp,
      deviceId,
      exerciseCode: exercise,
      score,
      duration,
      hash,
      signature,
      snapshots: snapshotsRef.current.slice(0, 3), // Max 3 snapshots
    }
  }

  const getDeviceId = async (): Promise<string> => {
    // In production, use a proper device fingerprinting library
    const data = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
    ].join(':')
    
    return await hashString(data)
  }

  // ====================================
  // SNAPSHOT SYSTEM
  // ====================================
  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return
    if (snapshotsRef.current.length >= MEDIA_CONFIG.SNAPSHOTS.SNAPSHOT_COUNT) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    // Set canvas size
    canvas.width = 160  // Small thumbnail
    canvas.height = 120

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to base64 (low quality for size)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.5)
    
    // Store snapshot
    snapshotsRef.current.push(dataUrl)
  }

  // ====================================
  // XP CALCULATION
  // ====================================
  const calculateXP = (formScore: number, opponentScore?: number): number => {
    const isWinner = opponentScore ? state.currentReps > opponentScore : true
    return calculateXPForDuel(isWinner, formScore, 0)
  }

  // ====================================
  // FEEDBACK GENERATION
  // ====================================
  const generateFeedback = (
    ai: ExerciseValidation | null,
    motion: MotionPattern | null
  ): string[] => {
    const feedback: string[] = []

    // AI feedback
    if (ai?.feedback) {
      feedback.push(...ai.feedback)
    }

    // Motion feedback
    if (motion) {
      if (motion.consistency > 0.8) {
        feedback.push('Movimento molto consistente! 💪')
      } else if (motion.consistency < 0.5) {
        feedback.push('Cerca di mantenere un ritmo più costante')
      }

      if (motion.intensity > 0.8) {
        feedback.push('Ottima intensità! 🔥')
      }
    }

    // General feedback
    if (state.currentFormScore >= FORM_SCORE_THRESHOLDS.PERFECT) {
      feedback.push('Esecuzione perfetta!')
    }

    return feedback
  }

  const generateImprovements = (formScore: number, violations: string[]): string[] => {
    const improvements: string[] = []

    if (formScore < FORM_SCORE_THRESHOLDS.GOOD) {
      improvements.push('Concentrati sulla forma corretta')
    }

    if (violations.includes('Piega di più i gomiti')) {
      improvements.push('Cerca di scendere di più nei push-up')
    }

    if (violations.includes('Mantieni la schiena dritta')) {
      improvements.push('Fai attenzione alla postura della schiena')
    }

    return improvements
  }

  // ====================================
  // BADGE CHECKING
  // ====================================
  const checkBadges = (reps: number, duration: number, formScore: number): string[] => {
    const badges: string[] = []

    // Form badges
    if (formScore >= 95) badges.push('perfect_form')
    if (formScore >= 85) badges.push('great_form')

    // Rep badges
    if (reps >= 50) badges.push('fifty_club')
    if (reps >= 100) badges.push('century')

    // Duration badges
    if (duration >= 180) badges.push('three_minutes')
    if (duration >= 300) badges.push('five_minutes')

    // Exercise specific - FIXED: Use string comparison instead of object comparison
    if (options.exercise === 'plank' && duration >= 120) {
      badges.push('plank_master')
    }

    return badges
  }

  // ====================================
  // CLEANUP
  // ====================================
  const cleanup = () => {
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    // Dispose validators
    if (aiValidator.current) {
      aiValidator.current.dispose()
      aiValidator.current = null
    }

    if (motionTracker.current) {
      motionTracker.current.dispose()
      motionTracker.current = null
    }

    // Clear timers
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  // ====================================
  // PUBLIC API
  // ====================================
  return {
    // State
    ...state,
    
    // Refs for UI
    videoRef,
    canvasRef,
    
    // Actions
    setupValidation,
    startValidation,
    stopValidation,
    
    // Utilities
    isSupported: state.hasCamera || state.hasMotionSensors,
    canStart: state.isReady && !state.isValidating,
    canStop: state.isValidating,
  }
}

// ====================================
// EXPORT TYPE
// ====================================
export type UseDuelValidationReturn = ReturnType<typeof useDuelValidation>