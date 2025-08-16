// src/components/game/ai-tracker/services/ExerciseAnalyzer.ts

export interface CalibrationData {
  userId: string
  exerciseId: string
  baselineAngles: Record<string, number>
  baselineDistances: Record<string, number>
  bodyProportions: Record<string, number>
  calibratedAt: string
}

export interface Point3D {
  x: number
  y: number
  z?: number
  visibility?: number
}

export interface AnalysisResult {
  formScore: number
  isInPosition: boolean
  mistakes: string[]
  suggestions: string[]
}

export class ExerciseAnalyzer {
  private landmarks: Point3D[] = []
  private prevLandmarks: Point3D[] = []
  private repCount: number = 0
  private inRep: boolean = false
  private formScores: number[] = []
  private mistakes: Set<string> = new Set()
  private calibrationData: CalibrationData | null = null
  
  // Exercise state tracking
  private exerciseState: 'idle' | 'up' | 'down' = 'idle'
  private stateHistory: string[] = []
  private lastStateChange: number = Date.now()
  private repStartTime: number = 0
  private repDurations: number[] = []

  constructor(private exerciseType: string) {}

  setCalibrationData(data: CalibrationData) {
    this.calibrationData = data
    console.log('Calibration data set for exercise:', this.exerciseType)
  }

  analyzePose(landmarks: Point3D[]): AnalysisResult {
    this.landmarks = landmarks
    
    let formScore = 100
    let isInPosition = false
    const currentMistakes: string[] = []
    const suggestions: string[] = []

    // Select analysis based on exercise type
    const analysisMethod = this.getAnalysisMethod()
    if (analysisMethod) {
      const result = analysisMethod.call(this, landmarks)
      formScore = result.score
      isInPosition = result.inPosition
      currentMistakes.push(...result.mistakes)
      suggestions.push(...result.suggestions)
    }

    // Update rep counting
    this.updateRepCount(isInPosition)
    
    // Store form score for averaging
    if (isInPosition) {
      this.formScores.push(formScore)
    }

    // Track mistakes
    currentMistakes.forEach(m => this.mistakes.add(m))

    // Update previous landmarks
    this.prevLandmarks = [...landmarks]

    return {
      formScore,
      isInPosition,
      mistakes: currentMistakes,
      suggestions
    }
  }

  private getAnalysisMethod() {
    const methods: Record<string, Function> = {
      'push_up': this.analyzePushUp,
      'squat': this.analyzeSquat,
      'plank': this.analyzePlank,
      'jumping_jack': this.analyzeJumpingJack,
      'burpee': this.analyzeBurpee,
      'lunge': this.analyzeLunge,
      'mountain_climber': this.analyzeMountainClimber,
      'crunch': this.analyzeCrunch,
      'wall_sit': this.analyzeWallSit,
      'high_knees': this.analyzeHighKnees
    }
    return methods[this.exerciseType]
  }

  // ====================================
  // EXERCISE ANALYSIS METHODS
  // ====================================

  private analyzePushUp(landmarks: Point3D[]) {
    let score = 100
    const mistakes: string[] = []
    const suggestions: string[] = []

    // Key points
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
    
    // Calculate elbow angles
    const leftElbowAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist)
    const rightElbowAngle = this.calculateAngle(rightShoulder, rightElbow, rightWrist)
    const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2

    // Determine position (up or down)
    const inPosition = shouldersAboveWrists
    const isDown = avgElbowAngle < 110
    const isUp = avgElbowAngle > 150

    // Update state for rep counting
    this.updateExerciseState(isUp ? 'up' : isDown ? 'down' : 'idle')

    // Check form - Back alignment
    const backAngle = this.calculateBodyAlignment(leftShoulder, rightShoulder, leftHip, rightHip)
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

    // Depth check
    if (isDown && avgElbowAngle > 90) {
      score -= 20
      mistakes.push('depth_insufficient')
      suggestions.push('Scendi di più, gomiti a 90 gradi')
    }

    // Hand position
    const handDistance = this.calculateDistance(leftWrist, rightWrist)
    const shoulderDistance = this.calculateDistance(leftShoulder, rightShoulder)
    
    if (handDistance < shoulderDistance * 0.8 || handDistance > shoulderDistance * 1.5) {
      score -= 10
      mistakes.push('hand_position_incorrect')
      suggestions.push('Posiziona le mani alla larghezza delle spalle')
    }

    return {
      score: Math.max(0, score),
      inPosition,
      mistakes,
      suggestions
    }
  }

  private analyzeSquat(landmarks: Point3D[]) {
    let score = 100
    const mistakes: string[] = []
    const suggestions: string[] = []

    // Key points
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
    const isDown = avgKneeAngle < 100
    const isUp = avgKneeAngle > 160

    // Update state
    this.updateExerciseState(isUp ? 'up' : isDown ? 'down' : 'idle')

    // Check knee alignment over toes
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
    const hipDistance = Math.abs(leftHip.x - rightHip.x)

    if (kneeDistance < ankleDistance * 0.8) {
      score -= 20
      mistakes.push('knees_inward')
      suggestions.push('Mantieni le ginocchia in linea con i piedi')
    } else if (kneeDistance > hipDistance * 1.2) {
      score -= 15
      mistakes.push('knees_outward')
      suggestions.push('Non allargare troppo le ginocchia')
    }

    // Depth check
    if (inPosition && avgKneeAngle > 90) {
      score -= 15
      mistakes.push('squat_not_deep')
      suggestions.push('Scendi di più, cerca di raggiungere 90 gradi')
    }

    // Back angle check
    const spine = this.calculateSpineAngle(landmarks)
    if (spine < 70 || spine > 110) {
      score -= 15
      mistakes.push('back_angle_incorrect')
      suggestions.push('Mantieni il busto più eretto')
    }

    return {
      score: Math.max(0, score),
      inPosition,
      mistakes,
      suggestions
    }
  }

  private analyzePlank(landmarks: Point3D[]) {
    let score = 100
    const mistakes: string[] = []
    const suggestions: string[] = []

    // Key points
    const leftShoulder = landmarks[11]
    const rightShoulder = landmarks[12]
    const leftElbow = landmarks[13]
    const rightElbow = landmarks[14]
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

    // Check elbow position (for forearm plank)
    const elbowAngle = this.calculateAngle(leftShoulder, leftElbow, leftHip)
    if (elbowAngle < 70 || elbowAngle > 110) {
      score -= 10
      mistakes.push('elbow_position_incorrect')
      suggestions.push('Posiziona i gomiti sotto le spalle')
    }

    // Check head position
    const nose = landmarks[0]
    if (nose && (nose.y < shoulder.y - 0.15 || nose.y > shoulder.y + 0.05)) {
      score -= 10
      mistakes.push('head_position')
      suggestions.push('Mantieni la testa allineata con la colonna')
    }

    return {
      score: Math.max(0, score),
      inPosition,
      mistakes,
      suggestions
    }
  }

  private analyzeJumpingJack(landmarks: Point3D[]) {
    let score = 100
    const mistakes: string[] = []
    const suggestions: string[] = []

    // Key points
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

    // Determine state
    const isOpen = armsUp && armsWide && legsWide
    const isClosed = !armsUp && !legsWide

    const inPosition = isOpen || isClosed
    
    // Update state
    this.updateExerciseState(isOpen ? 'up' : isClosed ? 'down' : 'idle')

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

    // Check synchronization
    if ((armsUp && !legsWide) || (!armsUp && legsWide)) {
      score -= 20
      mistakes.push('not_synchronized')
      suggestions.push('Sincronizza braccia e gambe')
    }

    return {
      score: Math.max(0, score),
      inPosition,
      mistakes,
      suggestions
    }
  }

  private analyzeBurpee(landmarks: Point3D[]) {
    // Burpee is complex with multiple phases
    let score = 85 // Base score for attempting
    const mistakes: string[] = []
    const suggestions: string[] = []

    // This would need a state machine for different phases:
    // 1. Standing
    // 2. Squat down
    // 3. Plank/push-up position
    // 4. Push-up (optional)
    // 5. Jump back to squat
    // 6. Jump up

    // For now, simplified detection
    const inPosition = true

    // Track phases based on body position
    const hips = landmarks[23]
    const shoulders = landmarks[11]
    const ankles = landmarks[27]

    if (hips && shoulders && ankles) {
      // Add basic form checks
      const bodyAngle = this.calculateAngle(shoulders, hips, ankles)
      
      if (Math.abs(bodyAngle - 180) > 45) {
        // Likely in squat or plank phase
        score = 90
      }
    }

    return {
      score: Math.max(0, score),
      inPosition,
      mistakes,
      suggestions
    }
  }

  private analyzeLunge(landmarks: Point3D[]) {
    let score = 100
    const mistakes: string[] = []
    const suggestions: string[] = []

    const leftHip = landmarks[23]
    const rightHip = landmarks[24]
    const leftKnee = landmarks[25]
    const rightKnee = landmarks[26]
    const leftAnkle = landmarks[27]
    const rightAnkle = landmarks[28]

    // Calculate knee angles
    const leftKneeAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle)
    const rightKneeAngle = this.calculateAngle(rightHip, rightKnee, rightAnkle)

    // Check which leg is forward
    const leftForward = leftAnkle.y > rightAnkle.y
    const frontKneeAngle = leftForward ? leftKneeAngle : rightKneeAngle
    const backKneeAngle = leftForward ? rightKneeAngle : leftKneeAngle

    const inPosition = frontKneeAngle < 110 && backKneeAngle < 110

    // Check front knee angle
    if (frontKneeAngle < 85) {
      score -= 15
      mistakes.push('front_knee_too_bent')
      suggestions.push('Non piegare troppo il ginocchio anteriore')
    }

    // Check back knee
    if (backKneeAngle > 120) {
      score -= 15
      mistakes.push('back_knee_not_bent')
      suggestions.push('Piega di più il ginocchio posteriore')
    }

    return {
      score: Math.max(0, score),
      inPosition,
      mistakes,
      suggestions
    }
  }

  private analyzeMountainClimber(landmarks: Point3D[]) {
    let score = 100
    const mistakes: string[] = []
    const suggestions: string[] = []

    // Similar to plank but with alternating knee drives
    const leftKnee = landmarks[25]
    const rightKnee = landmarks[26]
    const leftHip = landmarks[23]
    const rightHip = landmarks[24]

    // Check if one knee is driven forward
    const leftKneeForward = leftKnee.y < leftHip.y - 0.1
    const rightKneeForward = rightKnee.y < rightHip.y - 0.1

    const inPosition = leftKneeForward || rightKneeForward

    return {
      score: Math.max(0, score),
      inPosition,
      mistakes,
      suggestions
    }
  }

  private analyzeCrunch(landmarks: Point3D[]) {
    let score = 100
    const mistakes: string[] = []
    const suggestions: string[] = []

    const shoulders = landmarks[11]
    const hips = landmarks[23]
    
    // Check if shoulders are lifted
    const shouldersLifted = shoulders.y < hips.y - 0.05
    const inPosition = shouldersLifted

    return {
      score: Math.max(0, score),
      inPosition,
      mistakes,
      suggestions
    }
  }

  private analyzeWallSit(landmarks: Point3D[]) {
    let score = 100
    const mistakes: string[] = []
    const suggestions: string[] = []

    // Similar to squat but static
    const leftKnee = landmarks[25]
    const rightKnee = landmarks[26]
    const leftHip = landmarks[23]
    const rightHip = landmarks[24]
    const leftAnkle = landmarks[27]
    const rightAnkle = landmarks[28]

    const leftKneeAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle)
    const rightKneeAngle = this.calculateAngle(rightHip, rightKnee, rightAnkle)
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2

    const inPosition = avgKneeAngle > 80 && avgKneeAngle < 100

    if (avgKneeAngle > 100) {
      score -= 20
      mistakes.push('not_low_enough')
      suggestions.push('Scendi di più, cerca 90 gradi')
    }

    return {
      score: Math.max(0, score),
      inPosition,
      mistakes,
      suggestions
    }
  }

  private analyzeHighKnees(landmarks: Point3D[]) {
    let score = 100
    const mistakes: string[] = []
    const suggestions: string[] = []

    const leftKnee = landmarks[25]
    const rightKnee = landmarks[26]
    const leftHip = landmarks[23]
    const rightHip = landmarks[24]

    // Check if knees are raised high enough
    const leftKneeHigh = leftKnee.y < leftHip.y
    const rightKneeHigh = rightKnee.y < rightHip.y

    const inPosition = leftKneeHigh || rightKneeHigh

    if (inPosition && !leftKneeHigh && !rightKneeHigh) {
      score -= 15
      mistakes.push('knees_not_high_enough')
      suggestions.push('Alza di più le ginocchia')
    }

    return {
      score: Math.max(0, score),
      inPosition,
      mistakes,
      suggestions
    }
  }

  // ====================================
  // UTILITY METHODS
  // ====================================

  private calculateAngle(a: Point3D, b: Point3D, c: Point3D): number {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
    let angle = Math.abs(radians * 180 / Math.PI)
    if (angle > 180) angle = 360 - angle
    return angle
  }

  private calculateDistance(a: Point3D, b: Point3D): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
  }

  private calculateBodyAlignment(leftShoulder: Point3D, rightShoulder: Point3D, 
                                 leftHip: Point3D, rightHip: Point3D): number {
    const shoulder = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    }
    const hip = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    }
    const virtualPoint = {
      x: hip.x,
      y: hip.y + 0.1
    }
    
    return this.calculateAngle(shoulder, hip, virtualPoint)
  }

  private calculateSpineAngle(landmarks: Point3D[]): number {
    const nose = landmarks[0]
    const leftShoulder = landmarks[11]
    const rightShoulder = landmarks[12]
    const leftHip = landmarks[23]
    const rightHip = landmarks[24]

    const shoulder = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    }
    const hip = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    }

    return this.calculateAngle(nose, shoulder, hip)
  }

  private updateExerciseState(newState: 'idle' | 'up' | 'down') {
    const now = Date.now()
    
    if (newState !== this.exerciseState) {
      // State transition logic for rep counting
      if (this.exerciseState === 'down' && newState === 'up') {
        // Completed a rep
        this.repCount++
        
        // Calculate rep duration
        if (this.repStartTime > 0) {
          const repDuration = now - this.repStartTime
          this.repDurations.push(repDuration)
        }
        
        this.repStartTime = now
      } else if (this.exerciseState === 'up' && newState === 'down') {
        // Starting a new rep
        this.inRep = true
      }

      // Update state
      this.exerciseState = newState
      this.lastStateChange = now
      this.stateHistory.push(newState)
      
      // Keep only last 10 states
      if (this.stateHistory.length > 10) {
        this.stateHistory.shift()
      }
    }
  }

  private updateRepCount(isInPosition: boolean) {
    // Legacy rep counting for backward compatibility
    if (isInPosition && !this.inRep) {
      this.inRep = true
    } else if (!isInPosition && this.inRep) {
      this.inRep = false
    }
  }

  // ====================================
  // PUBLIC METHODS
  // ====================================

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

  getAverageRepDuration(): number {
    if (this.repDurations.length === 0) return 0
    return this.repDurations.reduce((a, b) => a + b, 0) / this.repDurations.length
  }

  getRepConsistency(): number {
    if (this.repDurations.length < 2) return 100

    const avg = this.getAverageRepDuration()
    const variance = this.repDurations.reduce((sum, duration) => {
      return sum + Math.pow(duration - avg, 2)
    }, 0) / this.repDurations.length

    const stdDev = Math.sqrt(variance)
    const coefficientOfVariation = (stdDev / avg) * 100

    // Convert to consistency score (0-100)
    return Math.max(0, 100 - coefficientOfVariation)
  }

  reset() {
    this.repCount = 0
    this.inRep = false
    this.formScores = []
    this.mistakes.clear()
    this.landmarks = []
    this.prevLandmarks = []
    this.exerciseState = 'idle'
    this.stateHistory = []
    this.lastStateChange = Date.now()
    this.repStartTime = 0
    this.repDurations = []
  }
}