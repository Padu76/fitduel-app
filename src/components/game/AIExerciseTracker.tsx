'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Camera, Play, Pause, StopCircle, RotateCcw, Volume2, VolumeX,
  Trophy, Target, Activity, AlertCircle, CheckCircle, Zap,
  Download, Upload, Eye, EyeOff, Settings, Info, X,
  Loader2, Star, TrendingUp, Award, Flame, Timer
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ====================================
// TYPES & INTERFACES
// ====================================

export interface ExerciseConfig {
  id: string
  name: string
  code: string
  targetReps?: number
  targetTime?: number // seconds
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  category: 'strength' | 'cardio' | 'flexibility' | 'balance' | 'core'
  muscleGroups: string[]
  caloriesPerRep?: number
  perfectFormThreshold: number // 0-100
  goodFormThreshold: number // 0-100
}

export interface AIFeedback {
  formScore: number // 0-100
  repsCount: number
  timeElapsed: number // seconds
  calories: number
  mistakes: string[]
  suggestions: string[]
  perfectReps: number
  goodReps: number
  badReps: number
}

export interface PerformanceData {
  exerciseId: string
  userId: string
  duelId?: string
  missionId?: string
  formScore: number
  repsCompleted: number
  duration: number // seconds
  caloriesBurned: number
  videoUrl?: string
  videoBlob?: Blob
  feedback: AIFeedback
  deviceData?: any
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
// MEDIAPIPE CONFIGURATION
// ====================================

declare global {
  interface Window {
    Pose: any
    Camera: any
  }
}

const MEDIAPIPE_CONFIG = {
  locateFile: (file: string) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
  }
}

const POSE_CONFIG = {
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: false,
  smoothSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
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
// VOICE FEEDBACK SYSTEM
// ====================================

class VoiceFeedbackSystem {
  private synth: SpeechSynthesis | null = null
  private voice: SpeechSynthesisVoice | null = null
  private enabled: boolean = true
  private language: string = 'it-IT'

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis
      this.loadVoices()
    }
  }

  private loadVoices() {
    if (!this.synth) return

    const setVoice = () => {
      const voices = this.synth!.getVoices()
      this.voice = voices.find(v => v.lang === this.language) || voices[0]
    }

    setVoice()
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = setVoice
    }
  }

  speak(text: string, priority: 'high' | 'normal' | 'low' = 'normal') {
    if (!this.synth || !this.enabled) return

    // Cancel current speech for high priority
    if (priority === 'high') {
      this.synth.cancel()
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.voice = this.voice
    utterance.lang = this.language
    utterance.rate = 1.1
    utterance.pitch = 1.0
    utterance.volume = 0.9

    this.synth.speak(utterance)
  }

  // Feedback specifici per esercizi
  countRep(count: number) {
    this.speak(count.toString(), 'high')
  }

  encouragement() {
    const phrases = [
      'Ottimo lavoro!',
      'Continua così!',
      'Perfetto!',
      'Molto bene!',
      'Eccellente!',
      'Grande forma!'
    ]
    this.speak(phrases[Math.floor(Math.random() * phrases.length)], 'low')
  }

  correction(mistake: string) {
    const corrections: Record<string, string> = {
      'back_not_straight': 'Mantieni la schiena dritta',
      'elbows_too_wide': 'Avvicina i gomiti al corpo',
      'knees_inward': 'Ginocchia in linea con i piedi',
      'hips_too_high': 'Abbassa i fianchi',
      'hips_too_low': 'Alza i fianchi',
      'depth_insufficient': 'Scendi di più',
      'speed_too_fast': 'Rallenta il movimento',
      'speed_too_slow': 'Aumenta il ritmo'
    }
    
    if (corrections[mistake]) {
      this.speak(corrections[mistake], 'high')
    }
  }

  startExercise(exerciseName: string) {
    this.speak(`Iniziamo con ${exerciseName}. Preparati!`, 'high')
  }

  endExercise(reps: number, formScore: number) {
    this.speak(
      `Esercizio completato! ${reps} ripetizioni con forma ${Math.round(formScore)}%. ${formScore > 80 ? 'Ottimo lavoro!' : 'Continua a migliorare!'}`,
      'high'
    )
  }

  toggle() {
    this.enabled = !this.enabled
    return this.enabled
  }

  setLanguage(lang: string) {
    this.language = lang
    this.loadVoices()
  }
}

// ====================================
// EXERCISE ANALYZER
// ====================================

class ExerciseAnalyzer {
  private landmarks: any[] = []
  private prevLandmarks: any[] = []
  private repCount: number = 0
  private inRep: boolean = false
  private formScores: number[] = []
  private mistakes: Set<string> = new Set()
  private calibrationData: CalibrationData | null = null

  constructor(private exerciseType: string) {}

  setCalibrationData(data: CalibrationData) {
    this.calibrationData = data
  }

  analyzePose(landmarks: any[]): {
    formScore: number
    isInPosition: boolean
    mistakes: string[]
    suggestions: string[]
  } {
    this.landmarks = landmarks
    
    let formScore = 100
    let isInPosition = false
    const currentMistakes: string[] = []
    const suggestions: string[] = []

    switch (this.exerciseType) {
      case 'push_up':
        const pushUpAnalysis = this.analyzePushUp(landmarks)
        formScore = pushUpAnalysis.score
        isInPosition = pushUpAnalysis.inPosition
        currentMistakes.push(...pushUpAnalysis.mistakes)
        suggestions.push(...pushUpAnalysis.suggestions)
        break
      
      case 'squat':
        const squatAnalysis = this.analyzeSquat(landmarks)
        formScore = squatAnalysis.score
        isInPosition = squatAnalysis.inPosition
        currentMistakes.push(...squatAnalysis.mistakes)
        suggestions.push(...squatAnalysis.suggestions)
        break

      case 'plank':
        const plankAnalysis = this.analyzePlank(landmarks)
        formScore = plankAnalysis.score
        isInPosition = plankAnalysis.inPosition
        currentMistakes.push(...plankAnalysis.mistakes)
        suggestions.push(...plankAnalysis.suggestions)
        break

      case 'jumping_jack':
        const jackAnalysis = this.analyzeJumpingJack(landmarks)
        formScore = jackAnalysis.score
        isInPosition = jackAnalysis.inPosition
        currentMistakes.push(...jackAnalysis.mistakes)
        suggestions.push(...jackAnalysis.suggestions)
        break

      case 'burpee':
        const burpeeAnalysis = this.analyzeBurpee(landmarks)
        formScore = burpeeAnalysis.score
        isInPosition = burpeeAnalysis.inPosition
        currentMistakes.push(...burpeeAnalysis.mistakes)
        suggestions.push(...burpeeAnalysis.suggestions)
        break
    }

    // Update rep counting
    this.updateRepCount(isInPosition)
    
    // Store form score for averaging
    if (isInPosition) {
      this.formScores.push(formScore)
    }

    // Track mistakes
    currentMistakes.forEach(m => this.mistakes.add(m))

    this.prevLandmarks = landmarks

    return {
      formScore,
      isInPosition,
      mistakes: currentMistakes,
      suggestions
    }
  }

  private analyzePushUp(landmarks: any[]) {
    let score = 100
    const mistakes: string[] = []
    const suggestions: string[] = []

    // Get key points
    const leftShoulder = landmarks[11]
    const rightShoulder = landmarks[12]
    const leftElbow = landmarks[13]
    const rightElbow = landmarks[14]
    const leftWrist = landmarks[15]
    const rightWrist = landmarks[16]
    const leftHip = landmarks[23]
    const rightHip = landmarks[24]

    // Check if in push-up position
    const shouldersAboveWrists = 
      (leftShoulder.y < leftWrist.y) && (rightShoulder.y < rightWrist.y)
    
    // Calculate elbow angle
    const leftElbowAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist)
    const rightElbowAngle = this.calculateAngle(rightShoulder, rightElbow, rightWrist)
    const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2

    // Check form
    const inPosition = shouldersAboveWrists && avgElbowAngle < 120

    // Back alignment (shoulders to hips)
    const backAngle = this.calculateAngle(
      { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 },
      { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 },
      { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 + 0.1 }
    )

    if (Math.abs(backAngle - 180) > 20) {
      score -= 15
      mistakes.push('back_not_straight')
      suggestions.push('Mantieni la schiena dritta')
    }

    // Elbow position
    const elbowWidth = Math.abs(leftElbow.x - rightElbow.x)
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x)
    
    if (elbowWidth > shoulderWidth * 1.3) {
      score -= 10
      mistakes.push('elbows_too_wide')
      suggestions.push('Tieni i gomiti più vicini al corpo')
    }

    // Depth check (for down position)
    if (inPosition && avgElbowAngle > 90) {
      score -= 20
      mistakes.push('depth_insufficient')
      suggestions.push('Scendi di più, gomiti a 90 gradi')
    }

    return {
      score: Math.max(0, score),
      inPosition,
      mistakes,
      suggestions
    }
  }

  private analyzeSquat(landmarks: any[]) {
    let score = 100
    const mistakes: string[] = []
    const suggestions: string[] = []

    // Get key points
    const leftHip = landmarks[23]
    const rightHip = landmarks[24]
    const leftKnee = landmarks[25]
    const rightKnee = landmarks[26]
    const leftAnkle = landmarks[27]
    const rightAnkle = landmarks[28]

    // Calculate knee angles
    const leftKneeAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle)
    const rightKneeAngle = this.calculateAngle(rightHip, rightKnee, rightAnkle)
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2

    // Check if in squat position
    const inPosition = avgKneeAngle < 130

    // Check knee alignment
    const leftKneeOverToe = leftKnee.x > leftAnkle.x + 0.05
    const rightKneeOverToe = rightKnee.x > rightAnkle.x + 0.05

    if (leftKneeOverToe || rightKneeOverToe) {
      score -= 15
      mistakes.push('knees_past_toes')
      suggestions.push('Non far superare le ginocchia le punte dei piedi')
    }

    // Check knee tracking (valgus/varus)
    const kneeDistance = Math.abs(leftKnee.x - rightKnee.x)
    const ankleDistance = Math.abs(leftAnkle.x - rightAnkle.x)

    if (kneeDistance < ankleDistance * 0.8) {
      score -= 20
      mistakes.push('knees_inward')
      suggestions.push('Mantieni le ginocchia in linea con i piedi')
    }

    // Depth check
    if (inPosition && avgKneeAngle > 90) {
      score -= 15
      mistakes.push('squat_not_deep')
      suggestions.push('Scendi di più, cerca di raggiungere 90 gradi')
    }

    return {
      score: Math.max(0, score),
      inPosition,
      mistakes,
      suggestions
    }
  }

  private analyzePlank(landmarks: any[]) {
    let score = 100
    const mistakes: string[] = []
    const suggestions: string[] = []

    // Get key points
    const leftShoulder = landmarks[11]
    const rightShoulder = landmarks[12]
    const leftHip = landmarks[23]
    const rightHip = landmarks[24]
    const leftAnkle = landmarks[27]
    const rightAnkle = landmarks[28]

    // Calculate body alignment
    const shoulder = { 
      x: (leftShoulder.x + rightShoulder.x) / 2, 
      y: (leftShoulder.y + rightShoulder.y) / 2 
    }
    const hip = { 
      x: (leftHip.x + rightHip.x) / 2, 
      y: (leftHip.y + rightHip.y) / 2 
    }
    const ankle = { 
      x: (leftAnkle.x + rightAnkle.x) / 2, 
      y: (leftAnkle.y + rightAnkle.y) / 2 
    }

    // Check alignment
    const bodyAngle = this.calculateAngle(shoulder, hip, ankle)
    const inPosition = Math.abs(bodyAngle - 180) < 30

    // Check hip position
    if (hip.y < shoulder.y - 0.1) {
      score -= 20
      mistakes.push('hips_too_high')
      suggestions.push('Abbassa i fianchi')
    } else if (hip.y > shoulder.y + 0.1) {
      score -= 20
      mistakes.push('hips_too_low')
      suggestions.push('Alza i fianchi, mantieni il corpo dritto')
    }

    // Check if body is straight
    if (Math.abs(bodyAngle - 180) > 15) {
      score -= 15
      mistakes.push('body_not_straight')
      suggestions.push('Mantieni il corpo in linea retta')
    }

    return {
      score: Math.max(0, score),
      inPosition,
      mistakes,
      suggestions
    }
  }

  private analyzeJumpingJack(landmarks: any[]) {
    let score = 100
    const mistakes: string[] = []
    const suggestions: string[] = []

    // Get key points
    const leftWrist = landmarks[15]
    const rightWrist = landmarks[16]
    const leftAnkle = landmarks[27]
    const rightAnkle = landmarks[28]
    const leftShoulder = landmarks[11]
    const rightShoulder = landmarks[12]

    // Check arm position
    const armsUp = leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y
    const armsWide = Math.abs(leftWrist.x - rightWrist.x) > Math.abs(leftShoulder.x - rightShoulder.x) * 2

    // Check leg position
    const legsWide = Math.abs(leftAnkle.x - rightAnkle.x) > 0.15

    const inPosition = (armsUp && armsWide && legsWide) || (!armsUp && !legsWide)

    // Check form
    if (inPosition && armsUp && !armsWide) {
      score -= 15
      mistakes.push('arms_not_wide')
      suggestions.push('Apri di più le braccia')
    }

    if (inPosition && legsWide && !armsUp) {
      score -= 15
      mistakes.push('arms_not_up')
      suggestions.push('Alza le braccia sopra la testa')
    }

    return {
      score: Math.max(0, score),
      inPosition,
      mistakes,
      suggestions
    }
  }

  private analyzeBurpee(landmarks: any[]) {
    // Burpee is complex, simplified analysis
    let score = 85 // Base score for attempting
    const mistakes: string[] = []
    const suggestions: string[] = []

    // This would need state machine for different phases
    // For now, simplified detection
    const inPosition = true

    return {
      score,
      inPosition,
      mistakes,
      suggestions
    }
  }

  private calculateAngle(a: any, b: any, c: any): number {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
    let angle = Math.abs(radians * 180 / Math.PI)
    if (angle > 180) angle = 360 - angle
    return angle
  }

  private updateRepCount(isInPosition: boolean) {
    if (isInPosition && !this.inRep) {
      this.repCount++
      this.inRep = true
    } else if (!isInPosition && this.inRep) {
      this.inRep = false
    }
  }

  getRepCount(): number {
    return this.repCount
  }

  getAverageFormScore(): number {
    if (this.formScores.length === 0) return 0
    return this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length
  }

  getMistakes(): string[] {
    return Array.from(this.mistakes)
  }

  reset() {
    this.repCount = 0
    this.inRep = false
    this.formScores = []
    this.mistakes.clear()
    this.landmarks = []
    this.prevLandmarks = []
  }
}

// ====================================
// VIDEO RECORDER
// ====================================

class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private stream: MediaStream | null = null

  startRecording(stream: MediaStream) {
    this.stream = stream
    this.chunks = []

    const options = {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 2500000
    }

    try {
      this.mediaRecorder = new MediaRecorder(stream, options)
    } catch (e) {
      // Fallback to default codecs
      this.mediaRecorder = new MediaRecorder(stream)
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data)
      }
    }

    this.mediaRecorder.start(1000) // Capture in 1-second chunks
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(new Blob())
        return
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'video/webm' })
        this.chunks = []
        resolve(blob)
      }

      this.mediaRecorder.stop()
    })
  }

  pauseRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause()
    }
  }

  resumeRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume()
    }
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording' || false
  }
}

// ====================================
// MAIN AI EXERCISE TRACKER COMPONENT
// ====================================

export const AIExerciseTracker = ({
  exerciseId,
  duelId,
  missionId,
  targetReps,
  targetTime,
  onComplete,
  onProgress,
  userId
}: {
  exerciseId: string
  duelId?: string
  missionId?: string
  targetReps?: number
  targetTime?: number
  onComplete?: (data: PerformanceData) => void
  onProgress?: (progress: number) => void
  userId: string
}) => {
  // State
  const [isLoading, setIsLoading] = useState(true)
  const [isTracking, setIsTracking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [showVideo, setShowVideo] = useState(true)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)

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
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const poseRef = useRef<any>(null)
  const analyzerRef = useRef<ExerciseAnalyzer | null>(null)
  const voiceRef = useRef<VoiceFeedbackSystem | null>(null)
  const recorderRef = useRef<VideoRecorder | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Supabase
  const supabase = createClientComponentClient()

  // Get exercise config
  const exerciseConfig = EXERCISE_DEFINITIONS[exerciseId] || EXERCISE_DEFINITIONS['push_up']

  // ====================================
  // INITIALIZATION
  // ====================================

  useEffect(() => {
    initializeAI()
    return () => {
      cleanup()
    }
  }, [])

  const initializeAI = async () => {
    try {
      setIsLoading(true)

      // Initialize voice feedback
      voiceRef.current = new VoiceFeedbackSystem()

      // Initialize video recorder
      recorderRef.current = new VideoRecorder()

      // Initialize exercise analyzer
      analyzerRef.current = new ExerciseAnalyzer(exerciseId)

      // Load MediaPipe Pose
      await loadMediaPipe()

      // Initialize camera
      await initializeCamera()

      // Load calibration data if exists
      await loadCalibrationData()

      setIsLoading(false)
    } catch (error) {
      console.error('Error initializing AI:', error)
      setIsLoading(false)
    }
  }

  const loadMediaPipe = async () => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js'
    script.async = true
    
    await new Promise((resolve, reject) => {
      script.onload = resolve
      script.onerror = reject
      document.body.appendChild(script)
    })

    const { Pose } = window as any
    
    poseRef.current = new Pose({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      }
    })

    poseRef.current.setOptions(POSE_CONFIG)

    poseRef.current.onResults((results: any) => {
      if (results.poseLandmarks && isTracking && !isPaused) {
        processResults(results)
      }
      
      // Draw skeleton
      if (canvasRef.current && results.poseLandmarks) {
        drawSkeleton(results)
      }
    })

    await poseRef.current.initialize()
  }

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          facingMode: 'user'
        },
        audio: false
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      // Start pose detection loop
      detectPose()
    } catch (error) {
      console.error('Error accessing camera:', error)
      voiceRef.current?.speak('Errore nell\'accesso alla fotocamera', 'high')
    }
  }

  const detectPose = async () => {
    if (videoRef.current && poseRef.current && videoRef.current.readyState === 4) {
      await poseRef.current.send({ image: videoRef.current })
    }
    animationFrameRef.current = requestAnimationFrame(detectPose)
  }

  // ====================================
  // CALIBRATION
  // ====================================

  const startCalibration = async () => {
    setIsCalibrating(true)
    voiceRef.current?.speak('Calibrazione in corso. Mettiti in posizione e resta fermo per 3 secondi.', 'high')

    setTimeout(() => {
      // Capture calibration data
      // This would analyze current pose and save baseline measurements
      saveCalibrationData()
      setIsCalibrating(false)
      voiceRef.current?.speak('Calibrazione completata!', 'high')
    }, 3000)
  }

  const saveCalibrationData = async () => {
    // Save calibration to Supabase
    try {
      const calibrationData: CalibrationData = {
        userId,
        exerciseId,
        baselineAngles: {}, // Would be filled with actual data
        baselineDistances: {},
        bodyProportions: {},
        calibratedAt: new Date().toISOString()
      }

      const { error } = await supabase
        .from('user_calibrations')
        .upsert(calibrationData)

      if (error) throw error
    } catch (error) {
      console.error('Error saving calibration:', error)
    }
  }

  const loadCalibrationData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_calibrations')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId)
        .single()

      if (data && analyzerRef.current) {
        analyzerRef.current.setCalibrationData(data)
      }
    } catch (error) {
      console.error('Error loading calibration:', error)
    }
  }

  // ====================================
  // TRACKING CONTROL
  // ====================================

  const startTracking = () => {
    setIsTracking(true)
    setIsPaused(false)
    analyzerRef.current?.reset()
    
    // Start voice feedback
    voiceRef.current?.startExercise(exerciseConfig.name)
    
    // Start recording if enabled
    if (streamRef.current) {
      recorderRef.current?.startRecording(streamRef.current)
      setIsRecording(true)
    }

    // Start timer
    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1)
    }, 1000)
  }

  const pauseTracking = () => {
    setIsPaused(true)
    recorderRef.current?.pauseRecording()
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const resumeTracking = () => {
    setIsPaused(false)
    recorderRef.current?.resumeRecording()
    
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
    let videoBlob: Blob | undefined = undefined
    if (isRecording) {
      videoBlob = await recorderRef.current?.stopRecording() || undefined
      setRecordedBlob(videoBlob || null)
      setIsRecording(false)
    }

    // Get final stats
    const finalFormScore = analyzerRef.current?.getAverageFormScore() || 0
    const finalReps = analyzerRef.current?.getRepCount() || 0
    const finalMistakes = analyzerRef.current?.getMistakes() || []

    // Voice feedback
    voiceRef.current?.endExercise(finalReps, finalFormScore)

    // Save performance
    await savePerformance(videoBlob)

    // Update missions progress
    await updateMissionProgress(finalReps)
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
    setRecordedBlob(null)
    analyzerRef.current?.reset()
  }

  // ====================================
  // POSE PROCESSING
  // ====================================

  const processResults = (results: any) => {
    if (!analyzerRef.current || !results.poseLandmarks) return

    const analysis = analyzerRef.current.analyzePose(results.poseLandmarks)
    
    // Update form score
    setCurrentFormScore(analysis.formScore)
    
    // Update mistakes and suggestions
    setMistakes(analysis.mistakes)
    setSuggestions(analysis.suggestions)

    // Update rep count
    const newRepCount = analyzerRef.current.getRepCount()
    if (newRepCount > currentReps) {
      setCurrentReps(newRepCount)
      
      // Voice feedback
      voiceRef.current?.countRep(newRepCount)
      
      // Encouragement
      if (newRepCount % 5 === 0) {
        voiceRef.current?.encouragement()
      }

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

    // Voice corrections
    if (analysis.mistakes.length > 0 && Math.random() < 0.1) { // 10% chance to avoid spam
      voiceRef.current?.correction(analysis.mistakes[0])
    }

    // Check time limit for plank
    if (exerciseId === 'plank' && targetTime && timeElapsed >= targetTime) {
      stopTracking()
    }
  }

  // ====================================
  // DRAWING
  // ====================================

  const drawSkeleton = (results: any) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw connections
    const connections = [
      [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
      [11, 23], [12, 24], [23, 24], [23, 25], [24, 26],
      [25, 27], [26, 28]
    ]

    ctx.strokeStyle = currentFormScore > 80 ? '#10b981' : 
                      currentFormScore > 60 ? '#f59e0b' : '#ef4444'
    ctx.lineWidth = 3

    results.poseLandmarks.forEach((landmark: any, i: number) => {
      connections.forEach(([start, end]) => {
        if (i === start) {
          const endLandmark = results.poseLandmarks[end]
          ctx.beginPath()
          ctx.moveTo(landmark.x * canvas.width, landmark.y * canvas.height)
          ctx.lineTo(endLandmark.x * canvas.width, endLandmark.y * canvas.height)
          ctx.stroke()
        }
      })
    })

    // Draw landmarks
    ctx.fillStyle = '#3b82f6'
    results.poseLandmarks.forEach((landmark: any) => {
      ctx.beginPath()
      ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 5, 0, 2 * Math.PI)
      ctx.fill()
    })
  }

  // ====================================
  // DATA PERSISTENCE
  // ====================================

  const savePerformance = async (videoBlob: Blob | undefined) => {
    try {
      let videoUrl: string | undefined

      // Upload video to Supabase Storage if available
      if (videoBlob) {
        const fileName = `${userId}_${exerciseId}_${Date.now()}.webm`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('performance-videos')
          .upload(fileName, videoBlob)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('performance-videos')
          .getPublicUrl(fileName)

        videoUrl = publicUrl
      }

      // Prepare performance data
      const performanceData: PerformanceData = {
        exerciseId,
        userId,
        duelId,
        missionId,
        formScore: analyzerRef.current?.getAverageFormScore() || 0,
        repsCompleted: currentReps,
        duration: timeElapsed,
        caloriesBurned: calories,
        videoUrl,
        videoBlob,
        feedback: {
          formScore: analyzerRef.current?.getAverageFormScore() || 0,
          repsCount: currentReps,
          timeElapsed,
          calories,
          mistakes: analyzerRef.current?.getMistakes() || [],
          suggestions,
          perfectReps,
          goodReps,
          badReps
        },
        timestamp: new Date().toISOString()
      }

      // Save to database
      const { error } = await supabase
        .from('performances')
        .insert({
          user_id: userId,
          exercise_id: exerciseId,
          duel_id: duelId,
          reps: currentReps,
          duration: timeElapsed,
          form_score: performanceData.formScore,
          calories_burned: calories,
          video_url: videoUrl,
          ai_feedback: performanceData.feedback,
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

  const updateMissionProgress = async (reps: number) => {
    if (!missionId) return

    try {
      // Get current mission progress
      const { data: mission, error: fetchError } = await supabase
        .from('user_missions')
        .select('*')
        .eq('mission_id', missionId)
        .eq('user_id', userId)
        .single()

      if (fetchError) throw fetchError

      // Update progress based on mission type
      let progressIncrement = 0
      
      if (mission.category === 'exercise' || mission.category === 'duels') {
        progressIncrement = reps
      } else if (mission.category === 'performance' && currentFormScore > 80) {
        progressIncrement = 1
      }

      // Update mission progress
      const { error: updateError } = await supabase
        .from('user_missions')
        .update({
          current_value: mission.current_value + progressIncrement,
          updated_at: new Date().toISOString()
        })
        .eq('mission_id', missionId)
        .eq('user_id', userId)

      if (updateError) throw updateError

    } catch (error) {
      console.error('Error updating mission progress:', error)
    }
  }

  // ====================================
  // CLEANUP
  // ====================================

  const cleanup = () => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }

    // Clean up MediaPipe
    if (poseRef.current) {
      poseRef.current.close()
    }
  }

  // ====================================
  // RENDER
  // ====================================

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-gray-400">Inizializzazione AI Tracker...</p>
        </div>
      </Card>
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
      <Card className="relative overflow-hidden bg-gray-900">
        <div className="aspect-video relative">
          <video
            ref={videoRef}
            className={cn(
              "absolute inset-0 w-full h-full object-cover mirror",
              !showVideo && "opacity-0"
            )}
            playsInline
            muted
          />
          
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            width={1280}
            height={720}
          />

          {/* Overlay Stats */}
          <div className="absolute top-4 left-4 space-y-2">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                <span className="text-white font-bold text-lg">{currentReps}</span>
                {targetReps && (
                  <span className="text-gray-400">/ {targetReps}</span>
                )}
              </div>
            </div>

            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className={cn(
                  "font-bold text-lg",
                  currentFormScore > 80 ? "text-green-400" :
                  currentFormScore > 60 ? "text-yellow-400" : "text-red-400"
                )}>
                  {Math.round(currentFormScore)}%
                </span>
              </div>
            </div>

            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-blue-400" />
                <span className="text-white font-mono">
                  {Math.floor(timeElapsed / 60).toString().padStart(2, '0')}:
                  {(timeElapsed % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-white">{Math.round(calories)} cal</span>
              </div>
            </div>
          </div>

          {/* Recording Indicator */}
          {isRecording && (
            <div className="absolute top-4 right-4">
              <div className="flex items-center gap-2 bg-red-500/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 text-sm font-medium">REC</span>
              </div>
            </div>
          )}

          {/* Calibration Overlay */}
          {isCalibrating && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto" />
                <p className="text-white text-lg">Calibrazione in corso...</p>
                <p className="text-gray-400">Resta in posizione</p>
              </div>
            </div>
          )}

          {/* Suggestions Overlay */}
          {suggestions.length > 0 && !isPaused && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    {suggestions.map((suggestion, i) => (
                      <p key={i} className="text-yellow-200 text-sm">{suggestion}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-center gap-4">
          {!isTracking ? (
            <Button
              variant="gradient"
              size="lg"
              onClick={startTracking}
              className="gap-2"
            >
              <Play className="w-5 h-5" />
              Inizia
            </Button>
          ) : (
            <>
              {!isPaused ? (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={pauseTracking}
                  className="gap-2"
                >
                  <Pause className="w-5 h-5" />
                  Pausa
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={resumeTracking}
                  className="gap-2"
                >
                  <Play className="w-5 h-5" />
                  Riprendi
                </Button>
              )}
              
              <Button
                variant="danger"
                size="lg"
                onClick={stopTracking}
                className="gap-2"
              >
                <StopCircle className="w-5 h-5" />
                Stop
              </Button>
            </>
          )}

          {(currentReps > 0 || timeElapsed > 0) && !isTracking && (
            <Button
              variant="ghost"
              size="lg"
              onClick={resetTracking}
              className="gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </Button>
          )}
        </div>
      </Card>

      {/* Performance Summary */}
      {!isTracking && currentReps > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Riepilogo Performance</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{currentReps}</p>
              <p className="text-gray-400 text-sm">Ripetizioni</p>
            </div>
            
            <div className="text-center">
              <p className={cn(
                "text-3xl font-bold",
                analyzerRef.current?.getAverageFormScore() || 0 > 80 ? "text-green-400" :
                analyzerRef.current?.getAverageFormScore() || 0 > 60 ? "text-yellow-400" : "text-red-400"
              )}>
                {Math.round(analyzerRef.current?.getAverageFormScore() || 0)}%
              </p>
              <p className="text-gray-400 text-sm">Form Score</p>
            </div>
            
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-400">{Math.round(calories)}</p>
              <p className="text-gray-400 text-sm">Calorie</p>
            </div>
            
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-400">
                {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
              </p>
              <p className="text-gray-400 text-sm">Tempo</p>
            </div>
          </div>

          {/* Quality Breakdown */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Ripetizioni Perfette</span>
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-bold">{perfectReps}</span>
                <Star className="w-4 h-4 text-green-400" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Ripetizioni Buone</span>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 font-bold">{goodReps}</span>
                <CheckCircle className="w-4 h-4 text-yellow-400" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Ripetizioni da Migliorare</span>
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-bold">{badReps}</span>
                <AlertCircle className="w-4 h-4 text-red-400" />
              </div>
            </div>
          </div>

          {/* Recorded Video */}
          {recordedBlob && (
            <div className="mt-6">
              <Button
                variant="secondary"
                className="w-full gap-2"
                onClick={() => {
                  const url = URL.createObjectURL(recordedBlob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${exerciseConfig.name}_${Date.now()}.webm`
                  a.click()
                }}
              >
                <Download className="w-4 h-4" />
                Scarica Video Performance
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default AIExerciseTracker