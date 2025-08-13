// ====================================
// FITDUEL AI VALIDATOR
// Real-time exercise validation using MediaPipe
// No video storage - only live analysis
// ====================================

import { ANTI_CHEAT_CONFIG } from '@/config/infrastructure'
import { EXERCISES, FORM_SCORE_THRESHOLDS } from '@/utils/constants'

// ====================================
// TYPES & INTERFACES
// ====================================
export interface Keypoint {
  x: number
  y: number
  z?: number
  score: number // Confidence 0-1
  name: string
}

export interface Pose {
  keypoints: Keypoint[]
  score: number
  timestamp: number
}

export interface ExerciseValidation {
  isValid: boolean
  formScore: number
  repCount: number
  duration: number
  feedback: string[]
  violations: string[]
  confidence: number
}

export interface ValidationFrame {
  timestamp: number
  pose: Pose | null
  isValidRep: boolean
  formScore: number
}

export interface ExerciseAngles {
  elbow?: number
  shoulder?: number
  hip?: number
  knee?: number
  spine?: number
}

// ====================================
// MEDIAPIPE POSE LANDMARK INDICES
// ====================================
const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
}

// ====================================
// AI VALIDATOR CLASS
// ====================================
export class AIValidator {
  private exercise: string
  private frames: ValidationFrame[] = []
  private repCount: number = 0
  private currentRep: Partial<ValidationFrame>[] = []
  private startTime: number = 0
  private lastFrameTime: number = 0
  private isExercising: boolean = false
  private previousPosition: 'up' | 'down' | null = null
  private formViolations: Set<string> = new Set()
  private mediaPipe: any = null
  private isInitialized: boolean = false

  constructor(exercise: string) {
    this.exercise = exercise
    this.startTime = Date.now()
  }

  // ====================================
  // INITIALIZATION
  // ====================================
  async initialize(): Promise<boolean> {
    try {
      // Check if MediaPipe is available
      if (typeof window === 'undefined') {
        throw new Error('AI Validator requires browser environment')
      }

      // Load MediaPipe Pose
      // In production, this would load from CDN
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js'
      document.head.appendChild(script)

      await new Promise((resolve) => {
        script.onload = resolve
      })

      // Initialize pose detector
      // @ts-ignore - MediaPipe types
      this.mediaPipe = new window.Pose({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        }
      })

      this.mediaPipe.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      })

      this.isInitialized = true
      return true
    } catch (error) {
      console.error('Failed to initialize AI Validator:', error)
      return false
    }
  }

  // ====================================
  // FRAME PROCESSING
  // ====================================
  async processFrame(imageData: ImageData | HTMLVideoElement): Promise<ValidationFrame> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const timestamp = Date.now()
    const pose = await this.detectPose(imageData)
    
    if (!pose) {
      return {
        timestamp,
        pose: null,
        isValidRep: false,
        formScore: 0
      }
    }

    // Calculate form score
    const formScore = this.calculateFormScore(pose)
    
    // Check if this is a valid rep
    const isValidRep = this.checkRepetition(pose, formScore)
    
    // Store frame
    const frame: ValidationFrame = {
      timestamp,
      pose,
      isValidRep,
      formScore
    }
    
    this.frames.push(frame)
    
    // Keep only last 100 frames (memory optimization)
    if (this.frames.length > 100) {
      this.frames.shift()
    }
    
    return frame
  }

  // ====================================
  // POSE DETECTION
  // ====================================
  private async detectPose(imageData: ImageData | HTMLVideoElement): Promise<Pose | null> {
    try {
      // Simulated pose detection
      // In production, this would use actual MediaPipe
      
      // For now, return mock pose data
      const mockKeypoints: Keypoint[] = Object.entries(POSE_LANDMARKS).map(([name, index]) => ({
        x: Math.random() * 640,
        y: Math.random() * 480,
        z: Math.random() * 100,
        score: 0.8 + Math.random() * 0.2,
        name
      }))

      return {
        keypoints: mockKeypoints,
        score: 0.85,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('Pose detection failed:', error)
      return null
    }
  }

  // ====================================
  // FORM SCORING
  // ====================================
  private calculateFormScore(pose: Pose): number {
    const angles = this.calculateAngles(pose)
    let score = 100
    const violations: string[] = []

    // Fix: Compare with strings instead of EXERCISES objects
    switch (this.exercise) {
      case 'pushup':  // Changed from EXERCISES.PUSHUP
        score = this.validatePushupForm(angles, violations)
        break
      case 'squat':   // Changed from EXERCISES.SQUAT
        score = this.validateSquatForm(angles, violations)
        break
      case 'plank':   // Changed from EXERCISES.PLANK
        score = this.validatePlankForm(angles, violations)
        break
      default:
        score = this.validateGeneralForm(pose, violations)
    }

    // Store violations
    violations.forEach(v => this.formViolations.add(v))

    return Math.max(0, Math.min(100, score))
  }

  // ====================================
  // EXERCISE-SPECIFIC VALIDATION
  // ====================================
  private validatePushupForm(angles: ExerciseAngles, violations: string[]): number {
    let score = 100

    // Check elbow angle (should go below 90 degrees)
    if (angles.elbow && angles.elbow > 120) {
      score -= 20
      violations.push('Piega di più i gomiti')
    }

    // Check spine alignment
    if (angles.spine && (angles.spine < 160 || angles.spine > 200)) {
      score -= 15
      violations.push('Mantieni la schiena dritta')
    }

    // Check hip position
    if (angles.hip && angles.hip < 160) {
      score -= 15
      violations.push('Non alzare i fianchi')
    }

    return score
  }

  private validateSquatForm(angles: ExerciseAngles, violations: string[]): number {
    let score = 100

    // Check knee angle (should go below 90 degrees for full squat)
    if (angles.knee && angles.knee > 100) {
      score -= 20
      violations.push('Scendi di più')
    }

    // Check knee alignment (shouldn't go past toes too much)
    if (angles.knee && angles.knee < 70) {
      score -= 10
      violations.push('Ginocchia troppo avanti')
    }

    // Check spine alignment
    if (angles.spine && (angles.spine < 160 || angles.spine > 200)) {
      score -= 15
      violations.push('Mantieni la schiena dritta')
    }

    return score
  }

  private validatePlankForm(angles: ExerciseAngles, violations: string[]): number {
    let score = 100

    // Check spine alignment (should be straight)
    if (angles.spine && (angles.spine < 170 || angles.spine > 190)) {
      score -= 25
      violations.push('Mantieni il corpo allineato')
    }

    // Check hip position
    if (angles.hip && (angles.hip < 170 || angles.hip > 190)) {
      score -= 20
      violations.push('Non alzare o abbassare i fianchi')
    }

    // Check shoulder position
    if (angles.shoulder && angles.shoulder < 80) {
      score -= 10
      violations.push('Spalle sopra i gomiti')
    }

    return score
  }

  private validateGeneralForm(pose: Pose, violations: string[]): number {
    let score = 100

    // Check if enough keypoints are visible
    const visibleKeypoints = pose.keypoints.filter(kp => kp.score > 0.5)
    if (visibleKeypoints.length < ANTI_CHEAT_CONFIG.AI_VALIDATION.MIN_VISIBLE_KEYPOINTS) {
      score -= 30
      violations.push('Posizionati meglio davanti alla camera')
    }

    // Check overall confidence
    if (pose.score < ANTI_CHEAT_CONFIG.AI_VALIDATION.MIN_CONFIDENCE_SCORE) {
      score -= 20
      violations.push('Migliora la visibilità')
    }

    return score
  }

  // ====================================
  // ANGLE CALCULATIONS
  // ====================================
  private calculateAngles(pose: Pose): ExerciseAngles {
    const getKeypoint = (name: string) => 
      pose.keypoints.find(kp => kp.name === name)

    const calculateAngle = (p1: Keypoint, p2: Keypoint, p3: Keypoint): number => {
      const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - 
                     Math.atan2(p1.y - p2.y, p1.x - p2.x)
      let degrees = Math.abs(radians * 180 / Math.PI)
      if (degrees > 180) degrees = 360 - degrees
      return degrees
    }

    const angles: ExerciseAngles = {}

    // Calculate elbow angle
    const shoulder = getKeypoint('LEFT_SHOULDER')
    const elbow = getKeypoint('LEFT_ELBOW')
    const wrist = getKeypoint('LEFT_WRIST')
    if (shoulder && elbow && wrist) {
      angles.elbow = calculateAngle(shoulder, elbow, wrist)
    }

    // Calculate knee angle
    const hip = getKeypoint('LEFT_HIP')
    const knee = getKeypoint('LEFT_KNEE')
    const ankle = getKeypoint('LEFT_ANKLE')
    if (hip && knee && ankle) {
      angles.knee = calculateAngle(hip, knee, ankle)
    }

    // Calculate hip angle
    if (shoulder && hip && knee) {
      angles.hip = calculateAngle(shoulder, hip, knee)
    }

    // Calculate spine angle (simplified)
    const rightShoulder = getKeypoint('RIGHT_SHOULDER')
    const rightHip = getKeypoint('RIGHT_HIP')
    if (shoulder && rightShoulder && hip && rightHip) {
      const midShoulder = {
        x: (shoulder.x + rightShoulder.x) / 2,
        y: (shoulder.y + rightShoulder.y) / 2,
        score: (shoulder.score + rightShoulder.score) / 2,
        name: 'MID_SHOULDER'
      }
      const midHip = {
        x: (hip.x + rightHip.x) / 2,
        y: (hip.y + rightHip.y) / 2,
        score: (hip.score + rightHip.score) / 2,
        name: 'MID_HIP'
      }
      
      // Spine angle relative to vertical
      const vertical = { x: midHip.x, y: midHip.y - 100, score: 1, name: 'VERTICAL' }
      angles.spine = calculateAngle(midShoulder, midHip, vertical)
    }

    return angles
  }

  // ====================================
  // REPETITION COUNTING
  // ====================================
  private checkRepetition(pose: Pose, formScore: number): boolean {
    const angles = this.calculateAngles(pose)
    let isRep = false

    // Fix: Compare with strings instead of EXERCISES objects
    switch (this.exercise) {
      case 'pushup':  // Changed from EXERCISES.PUSHUP
        isRep = this.checkPushupRep(angles, formScore)
        break
      case 'squat':   // Changed from EXERCISES.SQUAT
        isRep = this.checkSquatRep(angles, formScore)
        break
      case 'plank':   // Changed from EXERCISES.PLANK
        // Plank doesn't have reps, just duration
        isRep = formScore > FORM_SCORE_THRESHOLDS.DECENT
        break
      default:
        isRep = false
    }

    if (isRep) {
      this.repCount++
    }

    return isRep
  }

  private checkPushupRep(angles: ExerciseAngles, formScore: number): boolean {
    if (!angles.elbow || formScore < FORM_SCORE_THRESHOLDS.DECENT) {
      return false
    }

    const currentPosition = angles.elbow < 90 ? 'down' : 'up'
    
    // Count rep when going from down to up
    if (this.previousPosition === 'down' && currentPosition === 'up') {
      this.previousPosition = currentPosition
      return true
    }

    this.previousPosition = currentPosition
    return false
  }

  private checkSquatRep(angles: ExerciseAngles, formScore: number): boolean {
    if (!angles.knee || formScore < FORM_SCORE_THRESHOLDS.DECENT) {
      return false
    }

    const currentPosition = angles.knee < 90 ? 'down' : 'up'
    
    // Count rep when going from down to up
    if (this.previousPosition === 'down' && currentPosition === 'up') {
      this.previousPosition = currentPosition
      return true
    }

    this.previousPosition = currentPosition
    return false
  }

  // ====================================
  // FINAL VALIDATION
  // ====================================
  getValidationResult(): ExerciseValidation {
    const duration = Math.floor((Date.now() - this.startTime) / 1000)
    const validFrames = this.frames.filter(f => f.formScore > FORM_SCORE_THRESHOLDS.DECENT)
    const avgFormScore = validFrames.length > 0
      ? validFrames.reduce((sum, f) => sum + f.formScore, 0) / validFrames.length
      : 0

    const feedback: string[] = []
    const violations = Array.from(this.formViolations)

    // Generate feedback with fixed emojis
    if (avgFormScore >= FORM_SCORE_THRESHOLDS.PERFECT) {
      feedback.push('Esecuzione perfetta! 🔥')  // Fixed emoji
    } else if (avgFormScore >= FORM_SCORE_THRESHOLDS.EXCELLENT) {
      feedback.push('Ottima forma! Continua così 💪')  // Fixed emoji
    } else if (avgFormScore >= FORM_SCORE_THRESHOLDS.GOOD) {
      feedback.push('Buona esecuzione, puoi migliorare ancora')
    } else {
      feedback.push('Attenzione alla forma per evitare infortuni')
    }

    // Check for cheating patterns
    const isValid = this.validateAgainstCheating(duration)

    return {
      isValid,
      formScore: Math.round(avgFormScore),
      repCount: this.repCount,
      duration,
      feedback,
      violations,
      confidence: this.calculateConfidence()
    }
  }

  // ====================================
  // ANTI-CHEAT VALIDATION
  // ====================================
  private validateAgainstCheating(duration: number): boolean {
    const config = ANTI_CHEAT_CONFIG.VALIDATION

    // Check minimum duration
    const minDuration = config.MIN_EXERCISE_DURATION[this.exercise as keyof typeof config.MIN_EXERCISE_DURATION]
    if (duration < minDuration) {
      this.formViolations.add('Durata troppo breve')
      return false
    }

    // Check rep rate
    // Fix: Compare with string instead of EXERCISES object
    if (this.exercise !== 'plank') {  // Changed from EXERCISES.PLANK
      const repsPerMinute = (this.repCount / duration) * 60
      const maxRate = config.MAX_REPS_PER_MINUTE[this.exercise as keyof typeof config.MAX_REPS_PER_MINUTE]
      
      if (maxRate && repsPerMinute > maxRate) {
        this.formViolations.add('Velocità sospetta')
        return false
      }
    }

    // Check frame consistency
    if (this.frames.length < 10) {
      this.formViolations.add('Dati insufficienti')
      return false
    }

    return true
  }

  // ====================================
  // CONFIDENCE CALCULATION
  // ====================================
  private calculateConfidence(): number {
    let confidence = 1.0

    // Reduce confidence if not enough frames
    if (this.frames.length < 30) {
      confidence *= 0.8
    }

    // Reduce confidence if form scores vary too much
    const formScores = this.frames.map(f => f.formScore)
    const variance = this.calculateVariance(formScores)
    if (variance > 20) {
      confidence *= 0.9
    }

    // Reduce confidence if too many violations
    if (this.formViolations.size > 3) {
      confidence *= 0.85
    }

    return Math.round(confidence * 100) / 100
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2))
    return squaredDiffs.reduce((sum, d) => sum + d, 0) / numbers.length
  }

  // ====================================
  // CLEANUP
  // ====================================
  dispose(): void {
    this.frames = []
    this.currentRep = []
    this.formViolations.clear()
    if (this.mediaPipe) {
      this.mediaPipe.close()
      this.mediaPipe = null
    }
    this.isInitialized = false
  }
}

// ====================================
// EXPORT FACTORY FUNCTION
// ====================================
export function createAIValidator(exercise: string): AIValidator {
  return new AIValidator(exercise)
}