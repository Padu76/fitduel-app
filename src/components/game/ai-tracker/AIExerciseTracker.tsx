'use client'

import { useState, useEffect, useRef } from 'react'
import { Activity, Settings, Volume2, VolumeX, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Hooks
import { useMediaPipe } from './hooks/useMediaPipe'
import { useCamera } from './hooks/useCamera'
import { useVideoRecorder } from './hooks/useVideoRecorder'
import { useExerciseAnalyzer } from './hooks/useExerciseAnalyzer'
import { useAntiCheat } from './hooks/useAntiCheat'

// Services
import { VoiceFeedbackSystem } from './services/VoiceFeedbackSystem'

// Components
import { CameraError } from './components/CameraError'
import { VideoFeed } from './components/VideoFeed'
import { ExerciseStats } from './components/ExerciseStats'
import { PerformanceSummary } from './components/PerformanceSummary'
import { ExerciseControls } from './components/ExerciseControls'
import { LoadingState } from './components/LoadingState'
import { CalibrationOverlay } from './components/CalibrationOverlay'

// Constants & Types
import { EXERCISE_DEFINITIONS } from './constants/exercises'
import type { PerformanceData, ExerciseConfig } from './types'

// ====================================
// MAIN AI EXERCISE TRACKER COMPONENT
// ====================================

interface AIExerciseTrackerProps {
  exerciseId: string
  duelId?: string
  missionId?: string
  targetReps?: number
  targetTime?: number
  onComplete?: (data: PerformanceData) => void
  onProgress?: (progress: number) => void
  userId: string
  strictMode?: boolean // For tournaments/competitions
}

export const AIExerciseTracker = ({
  exerciseId,
  duelId,
  missionId,
  targetReps,
  targetTime,
  onComplete,
  onProgress,
  userId,
  strictMode = false
}: AIExerciseTrackerProps) => {
  // State
  const [isLoading, setIsLoading] = useState(true)
  const [isTracking, setIsTracking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [showVideo, setShowVideo] = useState(true)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  
  // Performance state
  const [currentReps, setCurrentReps] = useState(0)
  const [currentFormScore, setCurrentFormScore] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [calories, setCalories] = useState(0)
  const [mistakes, setMistakes] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [perfectReps, setPerfectReps] = useState(0)
  const [goodReps, setGoodReps] = useState(0)
  const [badReps, setBadReps] = useState(0)

  // Refs
  const voiceRef = useRef<VoiceFeedbackSystem | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClientComponentClient()

  // Get exercise config
  const exerciseConfig = EXERCISE_DEFINITIONS[exerciseId] || EXERCISE_DEFINITIONS['push_up']

  // Custom Hooks
  const {
    videoRef,
    streamRef,
    cameraError,
    cameraActive,
    permissionDenied,
    initializeCamera,
    retryCamera,
    cleanup: cleanupCamera
  } = useCamera()

  const {
    canvasRef,
    poseRef,
    isMediaPipeLoaded,
    mediaPipeError,
    initializeMediaPipe,
    detectPose,
    cleanup: cleanupMediaPipe
  } = useMediaPipe()

  const {
    isRecording,
    recordedBlob,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording
  } = useVideoRecorder()

  const {
    analyzerRef,
    analyzePose,
    getRepCount,
    getAverageFormScore,
    getMistakes,
    reset: resetAnalyzer
  } = useExerciseAnalyzer(exerciseId)

  const {
    trustScore,
    violations,
    isValidPerformance,
    antiCheatRef,
    initializeAntiCheat,
    startValidation,
    stopValidation,
    validateFrame
  } = useAntiCheat({
    userId,
    exerciseId,
    duelId,
    strictMode
  })

  // ====================================
  // INITIALIZATION
  // ====================================

  useEffect(() => {
    initializeSystem()
    return () => cleanup()
  }, [])

  const initializeSystem = async () => {
    try {
      setIsLoading(true)
      
      // Initialize voice feedback
      voiceRef.current = new VoiceFeedbackSystem()
      
      // Initialize MediaPipe
      await initializeMediaPipe((results) => {
        if (isTracking && !isPaused) {
          processResults(results)
        }
      })
      
      // Initialize camera
      await initializeCamera()
      
      // Initialize anti-cheat if in strict mode
      if (strictMode) {
        await initializeAntiCheat()
      }
      
      // Load calibration data
      await loadCalibrationData()
      
      setIsLoading(false)
    } catch (error) {
      console.error('Initialization error:', error)
      setIsLoading(false)
    }
  }

  // ====================================
  // TRACKING CONTROL
  // ====================================

  const startTracking = async () => {
    if (!cameraActive || !isMediaPipeLoaded) {
      return
    }
    
    setIsTracking(true)
    setIsPaused(false)
    resetAnalyzer()
    
    // Start voice feedback
    voiceRef.current?.startExercise(exerciseConfig.name)
    
    // Start recording
    if (streamRef.current) {
      startRecording(streamRef.current)
    }

    // Start anti-cheat validation
    if (strictMode && antiCheatRef.current) {
      await startValidation()
    }

    // Start timer
    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1)
    }, 1000)

    // Start pose detection
    detectPose(videoRef.current, poseRef.current)
  }

  const pauseTracking = () => {
    setIsPaused(true)
    pauseRecording()
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const resumeTracking = () => {
    setIsPaused(false)
    resumeRecording()
    
    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1)
    }, 1000)
  }

  const stopTracking = async () => {
    setIsTracking(false)
    setIsPaused(false)

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Stop recording
    const videoBlob = await stopRecording()

    // Stop anti-cheat and get validation result
    let validationResult = { isValid: true, requiresManualReview: false }
    if (strictMode && antiCheatRef.current) {
      validationResult = await stopValidation()
      // REMOVED: setIsValidPerformance(validationResult.isValid) - This was the error!
      // isValidPerformance is already managed by the useAntiCheat hook
    }

    // Get final stats
    const finalFormScore = getAverageFormScore()
    const finalReps = getRepCount()
    const finalMistakes = getMistakes()

    // Voice feedback
    voiceRef.current?.endExercise(finalReps, finalFormScore)

    // Save performance if valid
    if (validationResult.isValid) {
      await savePerformance(videoBlob, validationResult)
    } else {
      // Handle invalid performance
      alert('Performance invalidata dal sistema anti-cheat. La sessione verrà revisionata.')
    }
  }

  const resetTracking = () => {
    setCurrentReps(0)
    setCurrentFormScore(0)
    setTimeElapsed(0)
    setCalories(0)
    setMistakes([])
    setSuggestions([])
    setPerfectReps(0)
    setGoodReps(0)
    setBadReps(0)
    resetAnalyzer()
  }

  // ====================================
  // POSE PROCESSING
  // ====================================

  const processResults = async (results: any) => {
    if (!results.poseLandmarks) return

    // Analyze pose
    const analysis = analyzePose(results.poseLandmarks)
    
    // Update form score
    setCurrentFormScore(analysis.formScore)
    
    // Update mistakes and suggestions
    setMistakes(analysis.mistakes)
    setSuggestions(analysis.suggestions)

    // Validate frame with anti-cheat
    if (strictMode && antiCheatRef.current) {
      await validateFrame(videoRef.current)
    }

    // Update rep count
    const newRepCount = getRepCount()
    if (newRepCount > currentReps) {
      setCurrentReps(newRepCount)
      
      // Voice feedback
      voiceRef.current?.countRep(newRepCount)
      
      // Update rep quality counts
      if (analysis.formScore >= exerciseConfig.perfectFormThreshold) {
        setPerfectReps(prev => prev + 1)
      } else if (analysis.formScore >= exerciseConfig.goodFormThreshold) {
        setGoodReps(prev => prev + 1)
      } else {
        setBadReps(prev => prev + 1)
      }

      // Calculate calories
      const caloriesPerRep = exerciseConfig.caloriesPerRep || 0.3
      setCalories(prev => prev + caloriesPerRep)

      // Check if target reached
      if (targetReps && newRepCount >= targetReps) {
        stopTracking()
      }

      // Progress callback
      if (onProgress && targetReps) {
        onProgress((newRepCount / targetReps) * 100)
      }
    }

    // Check time limit for time-based exercises
    if (targetTime && timeElapsed >= targetTime) {
      stopTracking()
    }
  }

  // ====================================
  // CALIBRATION
  // ====================================

  const startCalibration = async () => {
    setIsCalibrating(true)
    voiceRef.current?.speak('Calibrazione in corso. Mettiti in posizione e resta fermo per 3 secondi.', 'high')

    setTimeout(async () => {
      await saveCalibrationData()
      setIsCalibrating(false)
      voiceRef.current?.speak('Calibrazione completata!', 'high')
    }, 3000)
  }

  const saveCalibrationData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    try {
      const calibrationData = {
        userId: user.id,
        exerciseId,
        calibratedAt: new Date().toISOString()
      }

      const { error } = await supabase
        .from('user_calibrations')
        .upsert({
          user_id: user.id,
          exercise_id: exerciseId,
          calibrated_at: calibrationData.calibratedAt
        })

      if (error) throw error
    } catch (error) {
      console.error('Error saving calibration:', error)
    }
  }

  const loadCalibrationData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    try {
      const { data } = await supabase
        .from('user_calibrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('exercise_id', exerciseId)
        .single()

      if (data && analyzerRef.current) {
        // Apply calibration data
        console.log('Calibration data loaded')
      }
    } catch (error) {
      console.error('Error loading calibration:', error)
    }
  }

  // ====================================
  // DATA PERSISTENCE
  // ====================================

  const savePerformance = async (videoBlob: Blob | undefined, validationResult: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    try {
      let videoUrl: string | undefined

      // Upload video if available
      if (videoBlob) {
        const fileName = `${user.id}_${exerciseId}_${Date.now()}.webm`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('performance-videos')
          .upload(fileName, videoBlob)

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('performance-videos')
            .getPublicUrl(fileName)
          videoUrl = publicUrl
        }
      }

      // Prepare performance data
      const performanceData: PerformanceData = {
        exerciseId,
        userId: user.id,
        duelId,
        missionId,
        formScore: getAverageFormScore(),
        repsCompleted: currentReps,
        duration: timeElapsed,
        caloriesBurned: calories,
        videoUrl,
        feedback: {
          formScore: getAverageFormScore(),
          repsCount: currentReps,
          timeElapsed,
          calories,
          mistakes: getMistakes(),
          suggestions,
          perfectReps,
          goodReps,
          badReps
        },
        trustScore,
        validationResult,
        timestamp: new Date().toISOString()
      }

      // Save to database
      const { error } = await supabase
        .from('performances')
        .insert({
          user_id: user.id,
          exercise_id: exerciseId,
          duel_id: duelId,
          mission_id: missionId,
          reps: currentReps,
          duration: timeElapsed,
          form_score: performanceData.formScore,
          calories_burned: calories,
          video_url: videoUrl,
          ai_feedback: performanceData.feedback,
          trust_score: trustScore,
          is_valid: validationResult.isValid,
          performed_at: new Date().toISOString()
        })

      if (error) throw error

      // Call completion callback
      if (onComplete) {
        onComplete(performanceData)
      }

    } catch (error) {
      console.error('Error saving performance:', error)
    }
  }

  // ====================================
  // CLEANUP
  // ====================================

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    cleanupCamera()
    cleanupMediaPipe()
  }

  // ====================================
  // RENDER
  // ====================================

  // Error state
  if (cameraError || mediaPipeError) {
    return (
      <CameraError
        error={cameraError || mediaPipeError}
        permissionDenied={permissionDenied}
        onRetry={retryCamera}
      />
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <LoadingState
        isMediaPipeLoaded={isMediaPipeLoaded}
        cameraActive={cameraActive}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{exerciseConfig.name}</h2>
              <p className="text-gray-400">
                {targetReps ? `Target: ${targetReps} reps` : ''}
                {targetTime ? `Target: ${targetTime}s` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {strictMode && (
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-full">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                <span className="text-xs text-purple-400">Anti-Cheat ON</span>
              </div>
            )}
            
            {cameraActive && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-400">Camera Attiva</span>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVideo(!showVideo)}
            >
              {showVideo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVoiceEnabled(voiceRef.current?.toggle() || false)}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={startCalibration}
              disabled={isCalibrating}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Video Feed */}
      <VideoFeed
        videoRef={videoRef}
        canvasRef={canvasRef}
        showVideo={showVideo}
        isRecording={isRecording}
        currentReps={currentReps}
        targetReps={targetReps}
        currentFormScore={currentFormScore}
        timeElapsed={timeElapsed}
        calories={calories}
        suggestions={suggestions}
        isPaused={isPaused}
        trustScore={trustScore}
        violations={violations}
      />

      {/* Calibration Overlay */}
      {isCalibrating && <CalibrationOverlay />}

      {/* Exercise Stats (Live) */}
      {isTracking && (
        <ExerciseStats
          perfectReps={perfectReps}
          goodReps={goodReps}
          badReps={badReps}
          mistakes={mistakes}
          isValidPerformance={isValidPerformance}
        />
      )}

      {/* Controls */}
      <ExerciseControls
        isTracking={isTracking}
        isPaused={isPaused}
        cameraActive={cameraActive}
        isMediaPipeLoaded={isMediaPipeLoaded}
        hasData={currentReps > 0 || timeElapsed > 0}
        onStart={startTracking}
        onPause={pauseTracking}
        onResume={resumeTracking}
        onStop={stopTracking}
        onReset={resetTracking}
      />

      {/* Performance Summary */}
      {!isTracking && currentReps > 0 && (
        <PerformanceSummary
          currentReps={currentReps}
          formScore={getAverageFormScore()}
          calories={calories}
          timeElapsed={timeElapsed}
          perfectReps={perfectReps}
          goodReps={goodReps}
          badReps={badReps}
          recordedBlob={recordedBlob}
          exerciseName={exerciseConfig.name}
          trustScore={trustScore}
          isValidPerformance={isValidPerformance}
        />
      )}
    </div>
  )
}

export default AIExerciseTracker