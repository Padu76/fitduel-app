'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ====================================
// TYPES & INTERFACES
// ====================================

export type TrackingMode = 'training' | 'duel' | 'challenge' | 'mission'
export type TrackingStatus = 'idle' | 'loading' | 'ready' | 'tracking' | 'paused' | 'completed' | 'error'

export interface ExerciseConfig {
  id: string
  name: string
  code: string
  targetReps?: number
  targetTime?: number
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  category: 'strength' | 'cardio' | 'flexibility' | 'balance' | 'core'
  muscleGroups: string[]
  caloriesPerRep?: number
  perfectFormThreshold: number
  goodFormThreshold: number
}

export interface PerformanceMetrics {
  reps: number
  formScore: number
  timeElapsed: number
  calories: number
  perfectReps: number
  goodReps: number
  badReps: number
  mistakes: string[]
  suggestions: string[]
}

export interface AITrackerConfig {
  exerciseId: string
  userId: string
  mode?: TrackingMode
  duelId?: string
  missionId?: string
  targetReps?: number
  targetTime?: number
  voiceEnabled?: boolean
  videoRecording?: boolean
  autoSave?: boolean
  onComplete?: (data: PerformanceData) => void
  onProgress?: (metrics: PerformanceMetrics) => void
  onMilestone?: (milestone: string, value: number) => void
  onError?: (error: Error) => void
}

export interface PerformanceData {
  exerciseId: string
  userId: string
  duelId?: string
  missionId?: string
  mode: TrackingMode
  formScore: number
  repsCompleted: number
  duration: number
  caloriesBurned: number
  videoUrl?: string
  videoBlob?: Blob
  feedback: {
    formScore: number
    repsCount: number
    timeElapsed: number
    calories: number
    mistakes: string[]
    suggestions: string[]
    perfectReps: number
    goodReps: number
    badReps: number
  }
  timestamp: string
}

export interface CalibrationData {
  userId: string
  exerciseId: string
  baselineAngles: Record<string, number>
  baselineDistances: Record<string, number>
  bodyProportions: Record<string, number>
  calibratedAt: string
}

// ====================================
// EXERCISE DEFINITIONS
// ====================================

const EXERCISE_DEFINITIONS: Record<string, ExerciseConfig> = {
  'push_up': {
    id: 'push_up',
    name: 'Push-Up',
    code: 'push_up',
    difficulty: 'medium',
    category: 'strength',
    muscleGroups: ['chest', 'shoulders', 'triceps', 'core'],
    caloriesPerRep: 0.32,
    perfectFormThreshold: 90,
    goodFormThreshold: 75
  },
  'squat': {
    id: 'squat',
    name: 'Squat',
    code: 'squat',
    difficulty: 'easy',
    category: 'strength',
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings', 'core'],
    caloriesPerRep: 0.35,
    perfectFormThreshold: 85,
    goodFormThreshold: 70
  },
  'plank': {
    id: 'plank',
    name: 'Plank',
    code: 'plank',
    difficulty: 'medium',
    category: 'core',
    muscleGroups: ['core', 'shoulders', 'back'],
    caloriesPerRep: 0.05, // per second
    perfectFormThreshold: 90,
    goodFormThreshold: 80
  },
  'jumping_jack': {
    id: 'jumping_jack',
    name: 'Jumping Jack',
    code: 'jumping_jack',
    difficulty: 'easy',
    category: 'cardio',
    muscleGroups: ['full_body'],
    caloriesPerRep: 0.2,
    perfectFormThreshold: 80,
    goodFormThreshold: 65
  },
  'burpee': {
    id: 'burpee',
    name: 'Burpee',
    code: 'burpee',
    difficulty: 'hard',
    category: 'cardio',
    muscleGroups: ['full_body'],
    caloriesPerRep: 0.5,
    perfectFormThreshold: 85,
    goodFormThreshold: 70
  }
}

// ====================================
// MAIN HOOK
// ====================================

export const useAITracker = (config: AITrackerConfig) => {
  // ====================================
  // STATE
  // ====================================
  
  // Tracking state
  const [status, setStatus] = useState<TrackingStatus>('idle')
  const [isTracking, setIsTracking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Performance metrics
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    reps: 0,
    formScore: 0,
    timeElapsed: 0,
    calories: 0,
    perfectReps: 0,
    goodReps: 0,
    badReps: 0,
    mistakes: [],
    suggestions: []
  })
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  
  // Features state
  const [voiceEnabled, setVoiceEnabled] = useState(config.voiceEnabled ?? true)
  const [videoEnabled, setVideoEnabled] = useState(config.videoRecording ?? true)
  const [showVideo, setShowVideo] = useState(true)
  
  // Refs for internal management
  const streamRef = useRef<MediaStream | null>(null)
  const poseRef = useRef<any>(null)
  const analyzerRef = useRef<any>(null)
  const voiceRef = useRef<any>(null)
  const recorderRef = useRef<any>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const milestonesRef = useRef<Set<string>>(new Set())
  
  // Supabase client
  const supabase = createClientComponentClient()
  
  // Get exercise config
  const exerciseConfig = EXERCISE_DEFINITIONS[config.exerciseId] || EXERCISE_DEFINITIONS['push_up']

  // ====================================
  // INITIALIZATION
  // ====================================

  useEffect(() => {
    initializeTracker()
    
    return () => {
      cleanup()
    }
  }, [config.exerciseId])

  const initializeTracker = useCallback(async () => {
    try {
      setStatus('loading')
      setError(null)
      
      // Load MediaPipe and initialize camera
      // This would be the actual initialization code
      // For now, simulate async loading
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Load calibration data
      await loadCalibrationData()
      
      setStatus('ready')
    } catch (err) {
      console.error('Error initializing tracker:', err)
      setError(err as Error)
      setStatus('error')
      config.onError?.(err as Error)
    }
  }, [config.exerciseId, config.userId])

  // ====================================
  // CALIBRATION
  // ====================================

  const startCalibration = useCallback(async () => {
    try {
      setIsCalibrating(true)
      
      // Simulate calibration process
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const calibrationData: CalibrationData = {
        userId: config.userId,
        exerciseId: config.exerciseId,
        baselineAngles: {},
        baselineDistances: {},
        bodyProportions: {},
        calibratedAt: new Date().toISOString()
      }
      
      // Save calibration to Supabase
      if (config.autoSave !== false) {
        await saveCalibrationData(calibrationData)
      }
      
      setIsCalibrating(false)
    } catch (err) {
      console.error('Calibration error:', err)
      setError(err as Error)
      setIsCalibrating(false)
    }
  }, [config.userId, config.exerciseId, config.autoSave])

  const loadCalibrationData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_calibrations')
        .select('*')
        .eq('user_id', config.userId)
        .eq('exercise_id', config.exerciseId)
        .single()
      
      if (data && analyzerRef.current) {
        // Apply calibration data to analyzer
        analyzerRef.current.setCalibrationData(data)
      }
    } catch (err) {
      console.error('Error loading calibration:', err)
    }
  }

  const saveCalibrationData = async (data: CalibrationData) => {
    try {
      const { error } = await supabase
        .from('user_calibrations')
        .upsert(data)
      
      if (error) throw error
    } catch (err) {
      console.error('Error saving calibration:', err)
      throw err
    }
  }

  // ====================================
  // TRACKING CONTROL
  // ====================================

  const startTracking = useCallback(() => {
    if (status !== 'ready') {
      console.warn('Tracker not ready')
      return
    }
    
    setStatus('tracking')
    setIsTracking(true)
    setIsPaused(false)
    
    // Reset metrics
    setMetrics({
      reps: 0,
      formScore: 0,
      timeElapsed: 0,
      calories: 0,
      perfectReps: 0,
      goodReps: 0,
      badReps: 0,
      mistakes: [],
      suggestions: []
    })
    
    // Reset milestones
    milestonesRef.current.clear()
    
    // Start timer
    timerRef.current = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        timeElapsed: prev.timeElapsed + 1
      }))
    }, 1000)
    
    // Start recording if enabled
    if (videoEnabled && streamRef.current) {
      setIsRecording(true)
      // Start actual recording
    }
    
    // Voice feedback
    if (voiceEnabled) {
      // Announce start
      announceStart()
    }
  }, [status, videoEnabled, voiceEnabled])

  const pauseTracking = useCallback(() => {
    if (!isTracking || isPaused) return
    
    setIsPaused(true)
    setStatus('paused')
    
    // Pause timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    // Pause recording
    if (isRecording) {
      // Pause actual recording
    }
  }, [isTracking, isPaused, isRecording])

  const resumeTracking = useCallback(() => {
    if (!isTracking || !isPaused) return
    
    setIsPaused(false)
    setStatus('tracking')
    
    // Resume timer
    timerRef.current = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        timeElapsed: prev.timeElapsed + 1
      }))
    }, 1000)
    
    // Resume recording
    if (isRecording) {
      // Resume actual recording
    }
  }, [isTracking, isPaused, isRecording])

  const stopTracking = useCallback(async () => {
    if (!isTracking) return
    
    setIsTracking(false)
    setIsPaused(false)
    setStatus('completed')
    
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    // Stop recording and get blob
    let videoBlob: Blob | undefined
    if (isRecording) {
      // Stop actual recording and get blob
      setIsRecording(false)
    }
    
    // Prepare performance data
    const performanceData: PerformanceData = {
      exerciseId: config.exerciseId,
      userId: config.userId,
      duelId: config.duelId,
      missionId: config.missionId,
      mode: config.mode || 'training',
      formScore: metrics.formScore,
      repsCompleted: metrics.reps,
      duration: metrics.timeElapsed,
      caloriesBurned: metrics.calories,
      videoBlob,
      feedback: {
        formScore: metrics.formScore,
        repsCount: metrics.reps,
        timeElapsed: metrics.timeElapsed,
        calories: metrics.calories,
        mistakes: metrics.mistakes,
        suggestions: metrics.suggestions,
        perfectReps: metrics.perfectReps,
        goodReps: metrics.goodReps,
        badReps: metrics.badReps
      },
      timestamp: new Date().toISOString()
    }
    
    // Auto-save if enabled
    if (config.autoSave !== false) {
      await savePerformance(performanceData)
    }
    
    // Voice feedback
    if (voiceEnabled) {
      announceComplete()
    }
    
    // Trigger completion callback
    config.onComplete?.(performanceData)
  }, [isTracking, isRecording, metrics, config, voiceEnabled])

  const resetTracking = useCallback(() => {
    setStatus('ready')
    setIsTracking(false)
    setIsPaused(false)
    setIsRecording(false)
    setRecordedBlob(null)
    setError(null)
    
    // Reset metrics
    setMetrics({
      reps: 0,
      formScore: 0,
      timeElapsed: 0,
      calories: 0,
      perfectReps: 0,
      goodReps: 0,
      badReps: 0,
      mistakes: [],
      suggestions: []
    })
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    // Reset milestones
    milestonesRef.current.clear()
  }, [])

  // ====================================
  // PERFORMANCE TRACKING
  // ====================================

  const updateMetrics = useCallback((newMetrics: Partial<PerformanceMetrics>) => {
    setMetrics(prev => {
      const updated = { ...prev, ...newMetrics }
      
      // Check for milestones
      checkMilestones(updated)
      
      // Check if target reached
      if (config.targetReps && updated.reps >= config.targetReps) {
        stopTracking()
      }
      
      if (config.targetTime && updated.timeElapsed >= config.targetTime) {
        stopTracking()
      }
      
      // Trigger progress callback
      config.onProgress?.(updated)
      
      return updated
    })
  }, [config.targetReps, config.targetTime, config.onProgress])

  const checkMilestones = (currentMetrics: PerformanceMetrics) => {
    // Check rep milestones
    const repMilestones = [10, 25, 50, 100, 200, 500]
    for (const milestone of repMilestones) {
      const key = `reps_${milestone}`
      if (currentMetrics.reps >= milestone && !milestonesRef.current.has(key)) {
        milestonesRef.current.add(key)
        config.onMilestone?.('reps', milestone)
        
        if (voiceEnabled) {
          announceMilestone(milestone)
        }
      }
    }
    
    // Check time milestones
    const timeMilestones = [60, 120, 300, 600] // seconds
    for (const milestone of timeMilestones) {
      const key = `time_${milestone}`
      if (currentMetrics.timeElapsed >= milestone && !milestonesRef.current.has(key)) {
        milestonesRef.current.add(key)
        config.onMilestone?.('time', milestone)
      }
    }
    
    // Check calorie milestones
    const calorieMilestones = [50, 100, 200, 500]
    for (const milestone of calorieMilestones) {
      const key = `calories_${milestone}`
      if (currentMetrics.calories >= milestone && !milestonesRef.current.has(key)) {
        milestonesRef.current.add(key)
        config.onMilestone?.('calories', milestone)
      }
    }
  }

  // ====================================
  // DATA PERSISTENCE
  // ====================================

  const savePerformance = async (data: PerformanceData) => {
    try {
      let videoUrl: string | undefined
      
      // Upload video if available
      if (data.videoBlob) {
        const fileName = `${config.userId}_${config.exerciseId}_${Date.now()}.webm`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('performance-videos')
          .upload(fileName, data.videoBlob)
        
        if (uploadError) throw uploadError
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('performance-videos')
          .getPublicUrl(fileName)
        
        videoUrl = publicUrl
      }
      
      // Save to performances table
      const { error } = await supabase
        .from('performances')
        .insert({
          user_id: config.userId,
          exercise_id: config.exerciseId,
          duel_id: config.duelId,
          reps: data.repsCompleted,
          duration: data.duration,
          form_score: data.formScore,
          calories_burned: data.caloriesBurned,
          video_url: videoUrl,
          ai_feedback: data.feedback,
          performed_at: new Date().toISOString()
        })
      
      if (error) throw error
      
      // Update mission progress if applicable
      if (config.missionId) {
        await updateMissionProgress(data.repsCompleted)
      }
      
    } catch (err) {
      console.error('Error saving performance:', err)
      throw err
    }
  }

  const updateMissionProgress = async (reps: number) => {
    if (!config.missionId) return
    
    try {
      // Get current mission progress
      const { data: mission, error: fetchError } = await supabase
        .from('user_missions')
        .select('*')
        .eq('mission_id', config.missionId)
        .eq('user_id', config.userId)
        .single()
      
      if (fetchError) throw fetchError
      
      // Update progress
      let progressIncrement = 0
      
      if (mission.category === 'exercise' || mission.category === 'duels') {
        progressIncrement = reps
      } else if (mission.category === 'performance' && metrics.formScore > 80) {
        progressIncrement = 1
      }
      
      // Update mission
      const { error: updateError } = await supabase
        .from('user_missions')
        .update({
          current_value: mission.current_value + progressIncrement,
          updated_at: new Date().toISOString()
        })
        .eq('mission_id', config.missionId)
        .eq('user_id', config.userId)
      
      if (updateError) throw updateError
      
    } catch (err) {
      console.error('Error updating mission:', err)
    }
  }

  // ====================================
  // VOICE FEEDBACK
  // ====================================

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => !prev)
    return !voiceEnabled
  }, [voiceEnabled])

  const announceStart = () => {
    // Voice announcement for start
    console.log(`Starting ${exerciseConfig.name}`)
  }

  const announceComplete = () => {
    // Voice announcement for completion
    console.log(`Completed! ${metrics.reps} reps with ${Math.round(metrics.formScore)}% form`)
  }

  const announceMilestone = (milestone: number) => {
    // Voice announcement for milestone
    console.log(`Great job! ${milestone} reps!`)
  }

  // ====================================
  // CLEANUP
  // ====================================

  const cleanup = () => {
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    // Clean up MediaPipe
    if (poseRef.current) {
      poseRef.current.close()
      poseRef.current = null
    }
  }

  // ====================================
  // RETURN API
  // ====================================

  return {
    // State
    status,
    isTracking,
    isPaused,
    isCalibrating,
    isRecording,
    error,
    metrics,
    recordedBlob,
    
    // Settings
    voiceEnabled,
    videoEnabled,
    showVideo,
    
    // Exercise info
    exerciseConfig,
    
    // Actions
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
    resetTracking,
    startCalibration,
    updateMetrics,
    
    // Settings actions
    toggleVoice,
    setShowVideo,
    
    // Utility
    isReady: status === 'ready',
    isCompleted: status === 'completed',
    canStart: status === 'ready' && !isTracking,
    canPause: isTracking && !isPaused,
    canResume: isTracking && isPaused,
    canStop: isTracking,
    canReset: status === 'completed' || (status === 'ready' && metrics.reps > 0)
  }
}

// ====================================
// HOOK UTILITIES
// ====================================

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const getFormScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-yellow-400'
  return 'text-red-400'
}

export const getFormScoreEmoji = (score: number): string => {
  if (score >= 90) return '🔥'
  if (score >= 80) return '💪'
  if (score >= 70) return '👍'
  if (score >= 60) return '💛'
  return '😅'
}

export default useAITracker