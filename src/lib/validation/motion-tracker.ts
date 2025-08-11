// ====================================
// FITDUEL MOTION TRACKER
// Accelerometer & Gyroscope validation system
// Detects real movement patterns for anti-cheat
// ====================================

import { ANTI_CHEAT_CONFIG } from '@/config/infrastructure'
import { EXERCISES } from '@/utils/constants'

// ====================================
// TYPES & INTERFACES
// ====================================
export interface MotionData {
  acceleration: {
    x: number
    y: number
    z: number
  }
  rotation: {
    alpha: number // Z axis
    beta: number  // X axis
    gamma: number // Y axis
  }
  timestamp: number
}

export interface MotionPattern {
  exercise: string
  duration: number
  intensity: number
  consistency: number
  isValid: boolean
  anomalies: string[]
}

export interface MovementMetrics {
  totalMovement: number
  peakAcceleration: number
  averageIntensity: number
  movementFrequency: number
  stillnessRatio: number
}

export interface ExercisePattern {
  expectedFrequency: number // Hz
  minAmplitude: number
  maxAmplitude: number
  primaryAxis: 'x' | 'y' | 'z'
  secondaryAxis?: 'x' | 'y' | 'z'
}

// ====================================
// EXERCISE MOVEMENT PATTERNS
// ====================================
const EXERCISE_PATTERNS: Record<string, ExercisePattern> = {
  [EXERCISES.PUSHUP]: {
    expectedFrequency: 0.5, // 0.5 Hz = 1 rep every 2 seconds
    minAmplitude: 0.3,
    maxAmplitude: 2.0,
    primaryAxis: 'y', // Up/down movement
    secondaryAxis: 'z'
  },
  [EXERCISES.SQUAT]: {
    expectedFrequency: 0.4,
    minAmplitude: 0.5,
    maxAmplitude: 2.5,
    primaryAxis: 'y', // Up/down movement
    secondaryAxis: 'x'
  },
  [EXERCISES.PLANK]: {
    expectedFrequency: 0, // Static hold
    minAmplitude: 0,
    maxAmplitude: 0.2, // Should be mostly still
    primaryAxis: 'y'
  },
  [EXERCISES.BURPEE]: {
    expectedFrequency: 0.3,
    minAmplitude: 1.0,
    maxAmplitude: 3.0,
    primaryAxis: 'y',
    secondaryAxis: 'z'
  },
  [EXERCISES.JUMPING_JACK]: {
    expectedFrequency: 1.0,
    minAmplitude: 0.8,
    maxAmplitude: 3.0,
    primaryAxis: 'y',
    secondaryAxis: 'x'
  },
  [EXERCISES.MOUNTAIN_CLIMBER]: {
    expectedFrequency: 1.5,
    minAmplitude: 0.4,
    maxAmplitude: 2.0,
    primaryAxis: 'z',
    secondaryAxis: 'x'
  }
}

// ====================================
// MOTION TRACKER CLASS
// ====================================
export class MotionTracker {
  private exercise: string
  private motionBuffer: MotionData[] = []
  private startTime: number = 0
  private lastMotionTime: number = 0
  private isTracking: boolean = false
  private anomalies: Set<string> = new Set()
  private repCount: number = 0
  private peakDetector: PeakDetector
  private stillnessCounter: number = 0
  private permissionGranted: boolean = false
  
  constructor(exercise: string) {
    this.exercise = exercise
    this.peakDetector = new PeakDetector(exercise)
  }

  // ====================================
  // INITIALIZATION
  // ====================================
  async initialize(): Promise<boolean> {
    try {
      // Check if device motion is available
      if (!this.isMotionAvailable()) {
        throw new Error('Motion sensors not available on this device')
      }

      // Request permission for iOS 13+
      if (typeof DeviceMotionEvent !== 'undefined' && 
          typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permission = await (DeviceMotionEvent as any).requestPermission()
        if (permission !== 'granted') {
          throw new Error('Motion sensor permission denied')
        }
      }

      this.permissionGranted = true
      return true
    } catch (error) {
      console.error('Failed to initialize motion tracker:', error)
      return false
    }
  }

  // ====================================
  // START/STOP TRACKING
  // ====================================
  startTracking(): void {
    if (!this.permissionGranted) {
      console.error('Motion tracking not initialized')
      return
    }

    this.isTracking = true
    this.startTime = Date.now()
    this.motionBuffer = []
    this.anomalies.clear()
    this.repCount = 0
    this.stillnessCounter = 0

    // Add event listeners
    window.addEventListener('devicemotion', this.handleMotion)
    window.addEventListener('deviceorientation', this.handleOrientation)
  }

  stopTracking(): MotionPattern {
    this.isTracking = false

    // Remove event listeners
    window.removeEventListener('devicemotion', this.handleMotion)
    window.removeEventListener('deviceorientation', this.handleOrientation)

    // Analyze collected data
    return this.analyzeMotionPattern()
  }

  // ====================================
  // MOTION EVENT HANDLERS
  // ====================================
  private handleMotion = (event: DeviceMotionEvent): void => {
    if (!this.isTracking) return

    const acceleration = event.accelerationIncludingGravity
    const rotation = event.rotationRate

    if (!acceleration) return

    const motionData: MotionData = {
      acceleration: {
        x: acceleration.x || 0,
        y: acceleration.y || 0,
        z: acceleration.z || 0
      },
      rotation: {
        alpha: rotation?.alpha || 0,
        beta: rotation?.beta || 0,
        gamma: rotation?.gamma || 0
      },
      timestamp: Date.now()
    }

    this.processMotionData(motionData)
  }

  private handleOrientation = (event: DeviceOrientationEvent): void => {
    if (!this.isTracking) return

    // Additional orientation data for validation
    const orientation = {
      alpha: event.alpha || 0,
      beta: event.beta || 0,
      gamma: event.gamma || 0
    }

    // Use for additional validation if needed
    this.validateOrientation(orientation)
  }

  // ====================================
  // MOTION PROCESSING
  // ====================================
  private processMotionData(data: MotionData): void {
    // Add to buffer
    this.motionBuffer.push(data)

    // Keep only last 1000 samples (memory optimization)
    if (this.motionBuffer.length > 1000) {
      this.motionBuffer.shift()
    }

    // Check for stillness
    this.detectStillness(data)

    // Detect repetitions
    const rep = this.peakDetector.detectPeak(data)
    if (rep) {
      this.repCount++
    }

    // Check for anomalies
    this.detectAnomalies(data)

    this.lastMotionTime = data.timestamp
  }

  // ====================================
  // STILLNESS DETECTION
  // ====================================
  private detectStillness(data: MotionData): void {
    const config = ANTI_CHEAT_CONFIG.MOTION_VALIDATION
    const magnitude = this.calculateMagnitude(data.acceleration)
    
    // Check if device is too still (possible cheating)
    if (magnitude < config.MIN_MOVEMENT_THRESHOLD) {
      this.stillnessCounter++
      
      if (this.stillnessCounter * 20 > config.MAX_STILLNESS_DURATION) {
        this.anomalies.add('Device too still - possible fake')
      }
    } else {
      this.stillnessCounter = 0
    }
  }

  // ====================================
  // ANOMALY DETECTION
  // ====================================
  private detectAnomalies(data: MotionData): void {
    const pattern = EXERCISE_PATTERNS[this.exercise]
    if (!pattern) return

    const magnitude = this.calculateMagnitude(data.acceleration)

    // Check for impossible acceleration
    if (magnitude > 30) {
      this.anomalies.add('Impossible acceleration detected')
    }

    // Check for pattern mismatch
    if (this.exercise === EXERCISES.PLANK && magnitude > pattern.maxAmplitude) {
      this.anomalies.add('Too much movement for plank')
    }

    // Check for mechanical patterns (too perfect)
    if (this.detectMechanicalPattern()) {
      this.anomalies.add('Mechanical pattern detected')
    }

    // Check for device shaking (fake movement)
    if (this.detectShaking(data)) {
      this.anomalies.add('Device shaking detected')
    }
  }

  // ====================================
  // PATTERN ANALYSIS
  // ====================================
  private analyzeMotionPattern(): MotionPattern {
    const duration = (Date.now() - this.startTime) / 1000
    const metrics = this.calculateMetrics()
    const pattern = EXERCISE_PATTERNS[this.exercise]

    // Calculate pattern consistency
    const consistency = this.calculateConsistency()
    
    // Calculate intensity
    const intensity = this.calculateIntensity(metrics)

    // Validate against expected pattern
    const isValid = this.validatePattern(metrics, pattern, duration)

    return {
      exercise: this.exercise,
      duration,
      intensity,
      consistency,
      isValid,
      anomalies: Array.from(this.anomalies)
    }
  }

  // ====================================
  // METRICS CALCULATION
  // ====================================
  private calculateMetrics(): MovementMetrics {
    if (this.motionBuffer.length === 0) {
      return {
        totalMovement: 0,
        peakAcceleration: 0,
        averageIntensity: 0,
        movementFrequency: 0,
        stillnessRatio: 1
      }
    }

    let totalMovement = 0
    let peakAcceleration = 0
    let stillFrames = 0

    for (const data of this.motionBuffer) {
      const magnitude = this.calculateMagnitude(data.acceleration)
      totalMovement += magnitude
      peakAcceleration = Math.max(peakAcceleration, magnitude)
      
      if (magnitude < ANTI_CHEAT_CONFIG.MOTION_VALIDATION.MIN_MOVEMENT_THRESHOLD) {
        stillFrames++
      }
    }

    const averageIntensity = totalMovement / this.motionBuffer.length
    const stillnessRatio = stillFrames / this.motionBuffer.length
    const movementFrequency = this.calculateFrequency()

    return {
      totalMovement,
      peakAcceleration,
      averageIntensity,
      movementFrequency,
      stillnessRatio
    }
  }

  // ====================================
  // FREQUENCY ANALYSIS
  // ====================================
  private calculateFrequency(): number {
    if (this.motionBuffer.length < 10) return 0

    // Simple FFT approximation for dominant frequency
    const samples = this.motionBuffer.slice(-100).map(d => 
      this.calculateMagnitude(d.acceleration)
    )

    // Count zero crossings
    let crossings = 0
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length

    for (let i = 1; i < samples.length; i++) {
      if ((samples[i - 1] - mean) * (samples[i] - mean) < 0) {
        crossings++
      }
    }

    // Frequency = crossings / (2 * duration)
    const duration = (this.motionBuffer[this.motionBuffer.length - 1].timestamp - 
                     this.motionBuffer[this.motionBuffer.length - 100]?.timestamp || 1) / 1000
    
    return crossings / (2 * duration)
  }

  // ====================================
  // CONSISTENCY CALCULATION
  // ====================================
  private calculateConsistency(): number {
    if (this.motionBuffer.length < 20) return 0

    const magnitudes = this.motionBuffer.map(d => 
      this.calculateMagnitude(d.acceleration)
    )

    // Calculate standard deviation
    const mean = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length
    const variance = magnitudes.reduce((sum, val) => 
      sum + Math.pow(val - mean, 2), 0
    ) / magnitudes.length
    const stdDev = Math.sqrt(variance)

    // Consistency = 1 - (stdDev / mean)
    // Clamped between 0 and 1
    return Math.max(0, Math.min(1, 1 - (stdDev / (mean + 0.01))))
  }

  // ====================================
  // INTENSITY CALCULATION
  // ====================================
  private calculateIntensity(metrics: MovementMetrics): number {
    const pattern = EXERCISE_PATTERNS[this.exercise]
    if (!pattern) return 0

    // Normalize intensity based on expected amplitude
    const expectedAmplitude = (pattern.minAmplitude + pattern.maxAmplitude) / 2
    const intensity = metrics.averageIntensity / expectedAmplitude

    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, intensity))
  }

  // ====================================
  // PATTERN VALIDATION
  // ====================================
  private validatePattern(
    metrics: MovementMetrics, 
    pattern: ExercisePattern | undefined,
    duration: number
  ): boolean {
    if (!pattern) return false

    const config = ANTI_CHEAT_CONFIG.VALIDATION

    // Check minimum duration
    const minDuration = config.MIN_EXERCISE_DURATION[this.exercise as keyof typeof config.MIN_EXERCISE_DURATION]
    if (duration < minDuration) {
      this.anomalies.add('Duration too short')
      return false
    }

    // For static exercises (plank)
    if (pattern.expectedFrequency === 0) {
      return metrics.stillnessRatio > 0.7 && metrics.averageIntensity < pattern.maxAmplitude
    }

    // For dynamic exercises
    // Check frequency is within reasonable range
    const freqDiff = Math.abs(metrics.movementFrequency - pattern.expectedFrequency)
    if (freqDiff > pattern.expectedFrequency * 0.5) {
      this.anomalies.add('Movement frequency mismatch')
      return false
    }

    // Check amplitude is reasonable
    if (metrics.averageIntensity < pattern.minAmplitude * 0.5 ||
        metrics.averageIntensity > pattern.maxAmplitude * 2) {
      this.anomalies.add('Movement amplitude out of range')
      return false
    }

    // Check for too many anomalies
    if (this.anomalies.size > 2) {
      return false
    }

    return true
  }

  // ====================================
  // HELPER FUNCTIONS
  // ====================================
  private calculateMagnitude(vector: { x: number; y: number; z: number }): number {
    return Math.sqrt(
      vector.x * vector.x +
      vector.y * vector.y +
      vector.z * vector.z
    )
  }

  private calculateRotationMagnitude(rotation: { alpha: number; beta: number; gamma: number }): number {
    // Convert rotation angles to a magnitude value
    return Math.sqrt(
      rotation.alpha * rotation.alpha +
      rotation.beta * rotation.beta +
      rotation.gamma * rotation.gamma
    )
  }

  private detectMechanicalPattern(): boolean {
    if (this.motionBuffer.length < 50) return false

    // Check if movements are too regular (mechanical)
    const intervals: number[] = []
    for (let i = 1; i < this.motionBuffer.length; i++) {
      intervals.push(this.motionBuffer[i].timestamp - this.motionBuffer[i - 1].timestamp)
    }

    // Calculate variance in intervals
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const variance = intervals.reduce((sum, val) => 
      sum + Math.pow(val - mean, 2), 0
    ) / intervals.length

    // If variance is too low, pattern is mechanical
    return variance < 5 // Less than 5ms variance is suspicious
  }

  private detectShaking(data: MotionData): boolean {
    // High frequency + high rotation = shaking
    // Fixed: Use the new calculateRotationMagnitude method for rotation
    const rotationMagnitude = this.calculateRotationMagnitude(data.rotation)
    const accelerationMagnitude = this.calculateMagnitude(data.acceleration)

    return rotationMagnitude > 200 && accelerationMagnitude > 15
  }

  private validateOrientation(orientation: { alpha: number; beta: number; gamma: number }): void {
    // Additional validation based on device orientation
    // Can be used to detect if phone is in pocket, on table, etc.
    
    if (this.exercise === EXERCISES.PLANK) {
      // Device should be relatively horizontal
      if (Math.abs(orientation.beta) > 45) {
        this.anomalies.add('Device orientation wrong for plank')
      }
    }
  }

  private isMotionAvailable(): boolean {
    return typeof window !== 'undefined' && 
           'DeviceMotionEvent' in window &&
           'DeviceOrientationEvent' in window
  }

  // ====================================
  // GETTERS
  // ====================================
  getRepCount(): number {
    return this.repCount
  }

  getAnomalies(): string[] {
    return Array.from(this.anomalies)
  }

  isDeviceCompatible(): boolean {
    return this.isMotionAvailable()
  }

  // ====================================
  // CLEANUP
  // ====================================
  dispose(): void {
    this.stopTracking()
    this.motionBuffer = []
    this.anomalies.clear()
  }
}

// ====================================
// PEAK DETECTOR CLASS
// ====================================
class PeakDetector {
  private exercise: string
  private lastPeak: number = 0
  private threshold: number
  private cooldown: number
  private buffer: number[] = []

  constructor(exercise: string) {
    this.exercise = exercise
    const pattern = EXERCISE_PATTERNS[exercise]
    
    // Set threshold and cooldown based on exercise
    this.threshold = pattern?.minAmplitude || 0.5
    this.cooldown = pattern?.expectedFrequency ? 
      (1000 / pattern.expectedFrequency) * 0.5 : 500 // Half period as cooldown
  }

  detectPeak(data: MotionData): boolean {
    const magnitude = Math.sqrt(
      data.acceleration.x ** 2 +
      data.acceleration.y ** 2 +
      data.acceleration.z ** 2
    )

    this.buffer.push(magnitude)
    if (this.buffer.length > 10) {
      this.buffer.shift()
    }

    // Need at least 5 samples
    if (this.buffer.length < 5) return false

    // Check if we're at a peak
    const current = this.buffer[this.buffer.length - 3] // Check 3 samples ago (smoothing)
    const before = this.buffer[this.buffer.length - 4]
    const after = this.buffer[this.buffer.length - 2]

    // Peak detection
    if (current > this.threshold &&
        current > before &&
        current > after &&
        Date.now() - this.lastPeak > this.cooldown) {
      
      this.lastPeak = Date.now()
      return true
    }

    return false
  }
}

// ====================================
// EXPORT FACTORY FUNCTION
// ====================================
export function createMotionTracker(exercise: string): MotionTracker {
  return new MotionTracker(exercise)
}