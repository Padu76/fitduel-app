// ====================================
// FITDUEL ANTI-CHEAT SYSTEM
// Complete multi-layer protection system
// Version: 2.0.0
// ====================================

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AIValidator } from '@/lib/validation/ai-validator'
import { MotionTracker } from '@/lib/validation/motion-tracker'

// ====================================
// TYPES & INTERFACES
// ====================================

export interface AntiCheatConfig {
  enabled: boolean
  strictMode: boolean
  layers: {
    aiValidation: boolean
    motionTracking: boolean
    videoVerification: boolean
    patternAnalysis: boolean
    deviceFingerprinting: boolean
    behavioralBiometrics: boolean
    challengeSystem: boolean
    reputationSystem: boolean
  }
}

export interface TrustScore {
  userId: string
  baseScore: number
  factors: {
    accountAge: number
    emailVerified: number
    socialLinked: number
    consistentPlay: number
    reportedByOthers: number
    videoVerified: number
    abnormalPatterns: number
    deviceTrust: number
  }
  totalScore: number
  trustLevel: 'untrusted' | 'low' | 'medium' | 'high' | 'verified'
  restrictions: string[]
  lastCalculated: string
}

export interface DeviceFingerprint {
  id: string
  userId: string
  deviceHash: string
  userAgent: string
  screen: {
    width: number
    height: number
    colorDepth: number
    pixelRatio: number
  }
  timezone: string
  language: string
  platform: string
  vendor: string
  webgl: {
    vendor: string
    renderer: string
  }
  canvas: string
  audio: string
  fonts: string[]
  plugins: string[]
  touchSupport: boolean
  cookies: boolean
  localStorage: boolean
  sessionStorage: boolean
  createdAt: string
}

export interface ValidationResult {
  isValid: boolean
  confidence: number
  layers: {
    ai: ValidationLayerResult
    motion: ValidationLayerResult
    video: ValidationLayerResult
    pattern: ValidationLayerResult
    device: ValidationLayerResult
    behavioral: ValidationLayerResult
  }
  violations: Violation[]
  trustScore: number
  requiresManualReview: boolean
  evidence: Evidence[]
}

export interface ValidationLayerResult {
  passed: boolean
  score: number
  details: string
  anomalies: string[]
}

export interface Violation {
  type: 'critical' | 'major' | 'minor' | 'warning'
  layer: string
  description: string
  timestamp: string
  evidence?: any
}

export interface Evidence {
  type: 'screenshot' | 'video' | 'metrics' | 'pattern'
  data: any
  timestamp: string
  hash: string
}

export interface BiometricProfile {
  userId: string
  exerciseId: string
  avgRhythm: number
  avgFormScore: number
  avgRestTime: number
  movementSignature: number[]
  consistency: number
  samples: number
  lastUpdated: string
}

export interface ChallengeVerification {
  id: string
  type: 'gesture' | 'position' | 'audio' | 'random'
  instruction: string
  expectedResponse: any
  timeLimit: number
  attempts: number
  passed: boolean
}

// ====================================
// CRYPTO HELPER FUNCTIONS
// ====================================

async function sha256(message: string): Promise<string> {
  // Encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message)
  
  // Hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  
  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

// ====================================
// ANTI-CHEAT MANAGER CLASS
// ====================================

export class AntiCheatManager {
  private config: AntiCheatConfig
  private supabase = createClientComponentClient()
  private aiValidator: AIValidator | null = null
  private motionTracker: MotionTracker | null = null
  private deviceFingerprint: DeviceFingerprint | null = null
  private trustScore: TrustScore | null = null
  private biometricProfile: BiometricProfile | null = null
  private violations: Violation[] = []
  private evidence: Evidence[] = []
  private sessionId: string
  private userId: string
  private exerciseId: string
  private isRecording: boolean = false
  private videoChunks: Blob[] = []
  private mediaRecorder: MediaRecorder | null = null
  private performanceMetrics: any[] = []
  private challengesPassed: number = 0
  private challengesFailed: number = 0

  constructor(userId: string, exerciseId: string, config?: Partial<AntiCheatConfig>) {
    this.userId = userId
    this.exerciseId = exerciseId
    this.sessionId = this.generateSessionId()
    
    // Default config with all layers enabled
    this.config = {
      enabled: true,
      strictMode: false,
      layers: {
        aiValidation: true,
        motionTracking: true,
        videoVerification: true,
        patternAnalysis: true,
        deviceFingerprinting: true,
        behavioralBiometrics: true,
        challengeSystem: true,
        reputationSystem: true
      },
      ...config
    }
  }

  // ====================================
  // INITIALIZATION
  // ====================================

  async initialize(): Promise<boolean> {
    if (!this.config.enabled) return true

    try {
      // 1. Device Fingerprinting
      if (this.config.layers.deviceFingerprinting) {
        await this.captureDeviceFingerprint()
      }

      // 2. Load Trust Score
      if (this.config.layers.reputationSystem) {
        await this.loadTrustScore()
      }

      // 3. Load Biometric Profile
      if (this.config.layers.behavioralBiometrics) {
        await this.loadBiometricProfile()
      }

      // 4. Initialize AI Validator
      if (this.config.layers.aiValidation) {
        this.aiValidator = new AIValidator(this.exerciseId)
        await this.aiValidator.initialize()
      }

      // 5. Initialize Motion Tracker
      if (this.config.layers.motionTracking && this.isMotionAvailable()) {
        this.motionTracker = new MotionTracker(this.exerciseId)
        await this.motionTracker.initialize()
      }

      // 6. Start Video Recording
      if (this.config.layers.videoVerification) {
        await this.startVideoRecording()
      }

      // 7. Log session start
      await this.logSessionStart()

      return true
    } catch (error) {
      console.error('Anti-cheat initialization failed:', error)
      return false
    }
  }

  // ====================================
  // DEVICE FINGERPRINTING
  // ====================================

  private async captureDeviceFingerprint(): Promise<void> {
    const fingerprint: DeviceFingerprint = {
      id: '',
      userId: this.userId,
      deviceHash: '',
      userAgent: navigator.userAgent,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio || 1
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      vendor: navigator.vendor,
      webgl: this.getWebGLInfo(),
      canvas: await this.getCanvasFingerprint(),
      audio: await this.getAudioFingerprint(),
      fonts: await this.getInstalledFonts(),
      plugins: this.getPlugins(),
      touchSupport: 'ontouchstart' in window,
      cookies: navigator.cookieEnabled,
      localStorage: this.storageAvailable('localStorage'),
      sessionStorage: this.storageAvailable('sessionStorage'),
      createdAt: new Date().toISOString()
    }

    // Generate device hash
    fingerprint.deviceHash = await this.generateDeviceHash(fingerprint)
    fingerprint.id = fingerprint.deviceHash

    this.deviceFingerprint = fingerprint

    // Check for device changes
    await this.checkDeviceConsistency()
  }

  private getWebGLInfo(): { vendor: string; renderer: string } {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      
      if (!gl) return { vendor: 'unknown', renderer: 'unknown' }

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      if (!debugInfo) return { vendor: 'unknown', renderer: 'unknown' }

      return {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown',
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown'
      }
    } catch {
      return { vendor: 'unknown', renderer: 'unknown' }
    }
  }

  private async getCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return 'unknown'

      // Draw unique pattern
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillStyle = '#f60'
      ctx.fillRect(125, 1, 62, 20)
      ctx.fillStyle = '#069'
      ctx.fillText('FitDuel 🏋️', 2, 15)
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
      ctx.fillText('FitDuel 🏋️', 4, 17)

      return canvas.toDataURL()
    } catch {
      return 'unknown'
    }
  }

  private async getAudioFingerprint(): Promise<string> {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) return 'unknown'

      const context = new AudioContext()
      const oscillator = context.createOscillator()
      const analyser = context.createAnalyser()
      const gain = context.createGain()
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1)

      gain.gain.value = 0 // Mute
      oscillator.connect(analyser)
      analyser.connect(scriptProcessor)
      scriptProcessor.connect(gain)
      gain.connect(context.destination)

      oscillator.start(0)
      
      return new Promise((resolve) => {
        scriptProcessor.onaudioprocess = (event) => {
          const fingerprint = event.inputBuffer.getChannelData(0)
            .slice(0, 100)
            .reduce((acc, val) => acc + Math.abs(val), 0)
            .toString()
          
          oscillator.stop()
          context.close()
          resolve(fingerprint)
        }
      })
    } catch {
      return 'unknown'
    }
  }

  private async getInstalledFonts(): Promise<string[]> {
    // Simplified font detection
    const baseFonts = ['monospace', 'sans-serif', 'serif']
    const testFonts = [
      'Arial', 'Verdana', 'Times New Roman', 'Courier New',
      'Georgia', 'Palatino', 'Garamond', 'Comic Sans MS',
      'Impact', 'Lucida Console', 'Tahoma', 'Trebuchet MS'
    ]

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return []

    const detected: string[] = []

    for (const font of testFonts) {
      for (const baseFont of baseFonts) {
        ctx.font = `72px ${baseFont}`
        const baseWidth = ctx.measureText('mmmmmmmmmmlli').width

        ctx.font = `72px ${font}, ${baseFont}`
        const testWidth = ctx.measureText('mmmmmmmmmmlli').width

        if (baseWidth !== testWidth) {
          detected.push(font)
          break
        }
      }
    }

    return detected
  }

  private getPlugins(): string[] {
    const plugins: string[] = []
    if (navigator.plugins) {
      for (let i = 0; i < navigator.plugins.length; i++) {
        plugins.push(navigator.plugins[i].name)
      }
    }
    return plugins
  }

  private storageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
    try {
      const storage = window[type]
      const x = '__storage_test__'
      storage.setItem(x, x)
      storage.removeItem(x)
      return true
    } catch {
      return false
    }
  }

  private async generateDeviceHash(fingerprint: DeviceFingerprint): Promise<string> {
    const data = JSON.stringify({
      ua: fingerprint.userAgent,
      screen: fingerprint.screen,
      webgl: fingerprint.webgl,
      canvas: fingerprint.canvas,
      audio: fingerprint.audio,
      fonts: fingerprint.fonts
    })
    
    return await sha256(data)
  }

  private async checkDeviceConsistency(): Promise<void> {
    if (!this.deviceFingerprint) return

    try {
      // Check if device has been seen before
      const { data: existingDevices } = await this.supabase
        .from('device_fingerprints')
        .select('*')
        .eq('user_id', this.userId)
        .eq('device_hash', this.deviceFingerprint.deviceHash)

      if (!existingDevices || existingDevices.length === 0) {
        // New device
        await this.supabase
          .from('device_fingerprints')
          .insert({
            user_id: this.userId,
            device_hash: this.deviceFingerprint.deviceHash,
            device_data: this.deviceFingerprint,
            first_seen: new Date().toISOString(),
            last_seen: new Date().toISOString()
          })

        // Check for multiple devices
        const { data: allDevices } = await this.supabase
          .from('device_fingerprints')
          .select('*')
          .eq('user_id', this.userId)

        if (allDevices && allDevices.length > 3) {
          this.addViolation('warning', 'device', 'Multiple devices detected')
        }
      } else {
        // Update last seen
        await this.supabase
          .from('device_fingerprints')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', existingDevices[0].id)
      }
    } catch (error) {
      console.error('Device consistency check failed:', error)
    }
  }

  // ====================================
  // TRUST SCORE SYSTEM
  // ====================================

  private async loadTrustScore(): Promise<void> {
    try {
      const { data: userData } = await this.supabase
        .from('profiles')
        .select('created_at, is_verified')
        .eq('id', this.userId)
        .single()

      const { data: statsData } = await this.supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', this.userId)
        .single()

      const { data: reportsData } = await this.supabase
        .from('cheat_reports')
        .select('*')
        .eq('reported_user_id', this.userId)

      const { data: verificationsData } = await this.supabase
        .from('video_verifications')
        .select('*')
        .eq('user_id', this.userId)
        .eq('verified', true)

      // Calculate trust score
      const accountAge = userData ? 
        Math.floor((Date.now() - new Date(userData.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0

      const factors = {
        accountAge: Math.min(10, accountAge / 3), // Max 10 points for 30+ days
        emailVerified: userData?.is_verified ? 5 : 0,
        socialLinked: 0, // TODO: Check social links
        consistentPlay: this.calculateConsistencyScore(statsData),
        reportedByOthers: reportsData ? Math.max(0, 20 - reportsData.length * 5) : 20,
        videoVerified: verificationsData && verificationsData.length > 0 ? 30 : 0,
        abnormalPatterns: 0, // Will be updated during validation
        deviceTrust: 10 // Default, will be adjusted
      }

      const totalScore = Object.values(factors).reduce((a, b) => a + b, 0)

      this.trustScore = {
        userId: this.userId,
        baseScore: 100,
        factors,
        totalScore,
        trustLevel: this.getTrustLevel(totalScore),
        restrictions: this.getTrustRestrictions(totalScore),
        lastCalculated: new Date().toISOString()
      }

      // Save to database
      await this.saveTrustScore()
    } catch (error) {
      console.error('Failed to load trust score:', error)
      
      // Default trust score
      this.trustScore = {
        userId: this.userId,
        baseScore: 50,
        factors: {
          accountAge: 0,
          emailVerified: 0,
          socialLinked: 0,
          consistentPlay: 0,
          reportedByOthers: 0,
          videoVerified: 0,
          abnormalPatterns: 0,
          deviceTrust: 0
        },
        totalScore: 50,
        trustLevel: 'low',
        restrictions: ['video_required', 'limited_rewards'],
        lastCalculated: new Date().toISOString()
      }
    }
  }

  private calculateConsistencyScore(stats: any): number {
    if (!stats) return 0

    // Check for consistent play patterns
    let score = 10

    // Penalize impossible stats
    if (stats.average_form_score > 95) score -= 5
    if (stats.total_duels > 0 && stats.duels_won / stats.total_duels > 0.95) score -= 3
    
    // Reward regular play
    if (stats.daily_streak > 7) score += 5
    if (stats.total_exercises > 100) score += 5

    return Math.max(0, Math.min(15, score))
  }

  private getTrustLevel(score: number): TrustScore['trustLevel'] {
    if (score >= 80) return 'verified'
    if (score >= 60) return 'high'
    if (score >= 40) return 'medium'
    if (score >= 20) return 'low'
    return 'untrusted'
  }

  private getTrustRestrictions(score: number): string[] {
    const restrictions: string[] = []

    if (score < 20) {
      restrictions.push('no_tournaments', 'no_rewards', 'video_required', 'manual_review')
    } else if (score < 40) {
      restrictions.push('limited_tournaments', 'limited_rewards', 'video_required')
    } else if (score < 60) {
      restrictions.push('video_recommended')
    }

    return restrictions
  }

  private async saveTrustScore(): Promise<void> {
    if (!this.trustScore) return

    try {
      await this.supabase
        .from('trust_scores')
        .upsert({
          user_id: this.userId,
          score: this.trustScore.totalScore,
          trust_level: this.trustScore.trustLevel,
          factors: this.trustScore.factors,
          restrictions: this.trustScore.restrictions,
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to save trust score:', error)
    }
  }

  // ====================================
  // BEHAVIORAL BIOMETRICS
  // ====================================

  private async loadBiometricProfile(): Promise<void> {
    try {
      const { data } = await this.supabase
        .from('biometric_profiles')
        .select('*')
        .eq('user_id', this.userId)
        .eq('exercise_id', this.exerciseId)
        .single()

      if (data) {
        this.biometricProfile = data
      }
    } catch (error) {
      console.error('Failed to load biometric profile:', error)
    }
  }

  private async updateBiometricProfile(metrics: any): Promise<void> {
    if (!this.biometricProfile) {
      // Create new profile
      this.biometricProfile = {
        userId: this.userId,
        exerciseId: this.exerciseId,
        avgRhythm: metrics.rhythm,
        avgFormScore: metrics.formScore,
        avgRestTime: metrics.restTime,
        movementSignature: metrics.signature,
        consistency: 1.0,
        samples: 1,
        lastUpdated: new Date().toISOString()
      }
    } else {
      // Update existing profile
      const samples = this.biometricProfile.samples
      this.biometricProfile.avgRhythm = 
        (this.biometricProfile.avgRhythm * samples + metrics.rhythm) / (samples + 1)
      this.biometricProfile.avgFormScore = 
        (this.biometricProfile.avgFormScore * samples + metrics.formScore) / (samples + 1)
      this.biometricProfile.avgRestTime = 
        (this.biometricProfile.avgRestTime * samples + metrics.restTime) / (samples + 1)
      this.biometricProfile.samples++
      this.biometricProfile.lastUpdated = new Date().toISOString()
    }

    // Save to database
    await this.saveBiometricProfile()
  }

  private async saveBiometricProfile(): Promise<void> {
    if (!this.biometricProfile) return

    try {
      await this.supabase
        .from('biometric_profiles')
        .upsert({
          user_id: this.userId,
          exercise_id: this.exerciseId,
          avg_rhythm: this.biometricProfile.avgRhythm,
          avg_form_score: this.biometricProfile.avgFormScore,
          avg_rest_time: this.biometricProfile.avgRestTime,
          movement_signature: this.biometricProfile.movementSignature,
          consistency: this.biometricProfile.consistency,
          samples: this.biometricProfile.samples,
          updated_at: this.biometricProfile.lastUpdated
        })
    } catch (error) {
      console.error('Failed to save biometric profile:', error)
    }
  }

  private checkBiometricConsistency(currentMetrics: any): number {
    if (!this.biometricProfile || this.biometricProfile.samples < 5) {
      return 1.0 // Not enough data
    }

    let deviations = 0

    // Check rhythm deviation
    const rhythmDev = Math.abs(currentMetrics.rhythm - this.biometricProfile.avgRhythm) / 
                      this.biometricProfile.avgRhythm
    if (rhythmDev > 0.3) deviations++

    // Check form score deviation
    const formDev = Math.abs(currentMetrics.formScore - this.biometricProfile.avgFormScore) / 
                    this.biometricProfile.avgFormScore
    if (formDev > 0.3) deviations++

    // Check rest time deviation
    const restDev = Math.abs(currentMetrics.restTime - this.biometricProfile.avgRestTime) / 
                    this.biometricProfile.avgRestTime
    if (restDev > 0.5) deviations++

    // Calculate consistency score (0-1)
    return Math.max(0, 1 - (deviations * 0.33))
  }

  // ====================================
  // VIDEO VERIFICATION
  // ====================================

  private async startVideoRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 } // Lower framerate to save bandwidth
        }, 
        audio: false 
      })

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 500000 // 500 kbps
      })

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.videoChunks.push(event.data)
        }
      }

      // Record in 5-second chunks
      this.mediaRecorder.start(5000)
      this.isRecording = true

      // Random spot checks
      this.scheduleRandomVideoCaptures()
    } catch (error) {
      console.error('Failed to start video recording:', error)
      this.addViolation('warning', 'video', 'Video recording failed')
    }
  }

  private scheduleRandomVideoCaptures(): void {
    // Capture random 5-second clips at random intervals
    const captureRandomClip = () => {
      if (!this.isRecording) return

      const delay = 10000 + Math.random() * 20000 // 10-30 seconds
      setTimeout(() => {
        this.captureVideoSnapshot()
        captureRandomClip()
      }, delay)
    }

    captureRandomClip()
  }

  private async captureVideoSnapshot(): Promise<void> {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') return

    // Take a snapshot for immediate analysis
    const stream = this.mediaRecorder.stream
    const video = document.createElement('video')
    video.srcObject = stream
    video.play()

    await new Promise(resolve => setTimeout(resolve, 100))

    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Add watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.font = '12px Arial'
    ctx.fillText(`FitDuel ${this.sessionId} ${new Date().toISOString()}`, 10, 20)

    // Convert to blob and add to evidence
    canvas.toBlob((blob) => {
      if (blob) {
        this.addEvidence('screenshot', blob)
      }
    }, 'image/jpeg', 0.7)

    video.remove()
  }

  private async stopVideoRecording(): Promise<Blob | null> {
    if (!this.mediaRecorder) return null

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = () => {
        const blob = new Blob(this.videoChunks, { type: 'video/webm' })
        this.videoChunks = []
        this.isRecording = false
        resolve(blob)
      }

      this.mediaRecorder!.stop()
      
      // Stop all tracks
      this.mediaRecorder!.stream.getTracks().forEach(track => track.stop())
    })
  }

  // ====================================
  // PATTERN ANALYSIS
  // ====================================

  private analyzePatterns(data: any): ValidationLayerResult {
    const anomalies: string[] = []
    let score = 100

    // Check rep speed
    if (data.repsPerMinute > 60) {
      anomalies.push('Impossible rep speed')
      score -= 30
    }

    // Check consistency
    if (data.formScoreVariance < 5) {
      anomalies.push('Form too consistent (mechanical)')
      score -= 20
    }

    // Check fatigue pattern
    if (!this.detectFatiguePattern(data)) {
      anomalies.push('No fatigue detected')
      score -= 25
    }

    // Check timing patterns
    if (this.detectMechanicalTiming(data)) {
      anomalies.push('Mechanical timing pattern')
      score -= 30
    }

    return {
      passed: score >= 50,
      score: Math.max(0, score),
      details: 'Pattern analysis completed',
      anomalies
    }
  }

  private detectFatiguePattern(data: any): boolean {
    // Performance should degrade over time
    const reps = data.reps || []
    if (reps.length < 10) return true // Not enough data

    const firstQuarter = reps.slice(0, Math.floor(reps.length / 4))
    const lastQuarter = reps.slice(-Math.floor(reps.length / 4))

    const avgFirst = firstQuarter.reduce((a: number, b: any) => a + b.formScore, 0) / firstQuarter.length
    const avgLast = lastQuarter.reduce((a: number, b: any) => a + b.formScore, 0) / lastQuarter.length

    // Expect at least 5% degradation
    return avgLast < avgFirst * 0.95
  }

  private detectMechanicalTiming(data: any): boolean {
    const intervals = data.repIntervals || []
    if (intervals.length < 5) return false

    // Calculate standard deviation
    const mean = intervals.reduce((a: number, b: number) => a + b, 0) / intervals.length
    const variance = intervals.reduce((sum: number, val: number) => 
      sum + Math.pow(val - mean, 2), 0
    ) / intervals.length
    const stdDev = Math.sqrt(variance)

    // If standard deviation is too low, it's mechanical
    return stdDev < 50 // Less than 50ms variation is suspicious
  }

  // ====================================
  // CHALLENGE SYSTEM
  // ====================================

  async issueChallenge(): Promise<ChallengeVerification> {
    const challenges = [
      {
        type: 'gesture' as const,
        instruction: 'Tocca il naso con la mano destra',
        expectedResponse: 'nose_touch_right'
      },
      {
        type: 'position' as const,
        instruction: 'Girati a sinistra',
        expectedResponse: 'turn_left'
      },
      {
        type: 'audio' as const,
        instruction: 'Di "FitDuel"',
        expectedResponse: 'fitduel'
      },
      {
        type: 'random' as const,
        instruction: 'Alza 3 dita',
        expectedResponse: 'three_fingers'
      }
    ]

    const challenge = challenges[Math.floor(Math.random() * challenges.length)]

    const verification: ChallengeVerification = {
      id: this.generateChallengeId(),
      type: challenge.type,
      instruction: challenge.instruction,
      expectedResponse: challenge.expectedResponse,
      timeLimit: 5000,
      attempts: 0,
      passed: false
    }

    // Show challenge to user
    await this.showChallengeUI(verification)

    return verification
  }

  private async showChallengeUI(challenge: ChallengeVerification): Promise<void> {
    // This would show a popup with the challenge
    // Implementation depends on UI framework
    console.log('Challenge issued:', challenge.instruction)
  }

  async verifyChallenge(
    challenge: ChallengeVerification, 
    response: any
  ): Promise<boolean> {
    challenge.attempts++

    // Verify based on challenge type
    switch (challenge.type) {
      case 'gesture':
        challenge.passed = await this.verifyGesture(response, challenge.expectedResponse)
        break
      case 'position':
        challenge.passed = await this.verifyPosition(response, challenge.expectedResponse)
        break
      case 'audio':
        challenge.passed = await this.verifyAudio(response, challenge.expectedResponse)
        break
      case 'random':
        challenge.passed = await this.verifyRandom(response, challenge.expectedResponse)
        break
    }

    if (challenge.passed) {
      this.challengesPassed++
    } else {
      this.challengesFailed++
      if (challenge.attempts >= 3) {
        this.addViolation('major', 'challenge', `Failed challenge: ${challenge.instruction}`)
      }
    }

    return challenge.passed
  }

  private async verifyGesture(response: any, expected: any): Promise<boolean> {
    // Use AI to verify gesture
    // Simplified implementation
    return response === expected
  }

  private async verifyPosition(response: any, expected: any): Promise<boolean> {
    // Verify body position change
    return response === expected
  }

  private async verifyAudio(response: any, expected: any): Promise<boolean> {
    // Verify audio response
    return response?.toLowerCase() === expected.toLowerCase()
  }

  private async verifyRandom(response: any, expected: any): Promise<boolean> {
    // Verify random action
    return response === expected
  }

  // ====================================
  // FRAME VALIDATION
  // ====================================

  async validateFrame(imageData: ImageData | HTMLVideoElement): Promise<void> {
    if (!this.config.enabled) return

    const frameValidation: any = {}

    // 1. AI Validation
    if (this.config.layers.aiValidation && this.aiValidator) {
      const aiResult = await this.aiValidator.processFrame(imageData)
      frameValidation.ai = aiResult
      
      // Store metrics
      this.performanceMetrics.push({
        timestamp: Date.now(),
        formScore: aiResult.formScore,
        isValidRep: aiResult.isValidRep
      })
    }

    // 2. Motion Validation
    if (this.config.layers.motionTracking && this.motionTracker) {
      // Motion data would come from device sensors
      // This is handled separately via motion events
    }

    // Check for anomalies
    this.checkFrameAnomalies(frameValidation)
  }

  private checkFrameAnomalies(frameData: any): void {
    // Check for sudden changes
    if (this.performanceMetrics.length > 1) {
      const current = this.performanceMetrics[this.performanceMetrics.length - 1]
      const previous = this.performanceMetrics[this.performanceMetrics.length - 2]
      
      // Sudden form improvement
      if (current.formScore - previous.formScore > 30) {
        this.addViolation('warning', 'pattern', 'Sudden form improvement')
      }
    }

    // Check for impossible patterns
    if (frameData.ai?.formScore === 100 && this.performanceMetrics.length > 50) {
      this.addViolation('major', 'ai', 'Perfect form for too long')
    }
  }

  // ====================================
  // FINAL VALIDATION
  // ====================================

  async finalizeValidation(): Promise<ValidationResult> {
    const layers: ValidationResult['layers'] = {
      ai: await this.validateAILayer(),
      motion: await this.validateMotionLayer(),
      video: await this.validateVideoLayer(),
      pattern: this.analyzePatterns(this.performanceMetrics),
      device: await this.validateDeviceLayer(),
      behavioral: await this.validateBehavioralLayer()
    }

    // Calculate overall confidence
    const layerScores = Object.values(layers).map(l => l.score)
    const avgScore = layerScores.reduce((a, b) => a + b, 0) / layerScores.length
    const confidence = avgScore / 100

    // Determine if valid
    const criticalViolations = this.violations.filter(v => v.type === 'critical')
    const majorViolations = this.violations.filter(v => v.type === 'major')
    
    const isValid = criticalViolations.length === 0 && 
                   majorViolations.length < 2 &&
                   confidence > 0.6

    // Check if manual review needed
    const requiresManualReview = 
      (this.trustScore?.trustLevel === 'untrusted') ||
      (majorViolations.length > 0) ||
      (confidence < 0.7 && confidence > 0.4)

    // Save validation result
    await this.saveValidationResult({
      isValid,
      confidence,
      layers,
      violations: this.violations,
      trustScore: this.trustScore?.totalScore || 0,
      requiresManualReview,
      evidence: this.evidence
    })

    return {
      isValid,
      confidence,
      layers,
      violations: this.violations,
      trustScore: this.trustScore?.totalScore || 0,
      requiresManualReview,
      evidence: this.evidence
    }
  }

  private async validateAILayer(): Promise<ValidationLayerResult> {
    if (!this.aiValidator) {
      return {
        passed: true,
        score: 50,
        details: 'AI validation not available',
        anomalies: []
      }
    }

    const result = this.aiValidator.getValidationResult()
    
    return {
      passed: result.isValid && result.formScore > 60,
      score: result.formScore,
      details: `${result.repCount} reps completed with ${result.formScore}% average form`,
      anomalies: result.violations
    }
  }

  private async validateMotionLayer(): Promise<ValidationLayerResult> {
    if (!this.motionTracker) {
      return {
        passed: true,
        score: 50,
        details: 'Motion tracking not available',
        anomalies: []
      }
    }

    const pattern = this.motionTracker.stopTracking()
    
    return {
      passed: pattern.isValid,
      score: Math.round(pattern.consistency * 100),
      details: `Motion pattern analyzed: ${pattern.intensity} intensity`,
      anomalies: pattern.anomalies
    }
  }

  private async validateVideoLayer(): Promise<ValidationLayerResult> {
    const videoBlob = await this.stopVideoRecording()
    
    if (!videoBlob) {
      return {
        passed: false,
        score: 0,
        details: 'No video recorded',
        anomalies: ['Video recording failed']
      }
    }

    // Upload video for verification
    const videoUrl = await this.uploadVideo(videoBlob)
    
    return {
      passed: true,
      score: 80,
      details: 'Video recorded and uploaded',
      anomalies: []
    }
  }

  private async validateDeviceLayer(): Promise<ValidationLayerResult> {
    if (!this.deviceFingerprint) {
      return {
        passed: false,
        score: 0,
        details: 'Device fingerprint not captured',
        anomalies: ['Device fingerprinting failed']
      }
    }

    const anomalies: string[] = []
    let score = 100

    // Check for VPN/Proxy
    if (await this.detectVPN()) {
      anomalies.push('VPN/Proxy detected')
      score -= 30
    }

    // Check for emulator
    if (this.detectEmulator()) {
      anomalies.push('Emulator detected')
      score -= 50
    }

    // Check for developer tools
    if (this.detectDevTools()) {
      anomalies.push('Developer tools open')
      score -= 20
    }

    return {
      passed: score >= 50,
      score: Math.max(0, score),
      details: 'Device validation completed',
      anomalies
    }
  }

  private async validateBehavioralLayer(): Promise<ValidationLayerResult> {
    if (!this.biometricProfile) {
      return {
        passed: true,
        score: 70,
        details: 'No biometric profile available',
        anomalies: []
      }
    }

    const currentMetrics = this.calculateCurrentBiometrics()
    const consistency = this.checkBiometricConsistency(currentMetrics)
    
    const anomalies: string[] = []
    if (consistency < 0.7) {
      anomalies.push('Behavioral pattern mismatch')
    }

    return {
      passed: consistency > 0.5,
      score: Math.round(consistency * 100),
      details: `Behavioral consistency: ${Math.round(consistency * 100)}%`,
      anomalies
    }
  }

  // ====================================
  // HELPER METHODS
  // ====================================

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateChallengeId(): string {
    return `ch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }

  private addViolation(
    type: Violation['type'], 
    layer: string, 
    description: string
  ): void {
    this.violations.push({
      type,
      layer,
      description,
      timestamp: new Date().toISOString()
    })

    // Update trust score
    if (this.trustScore) {
      if (type === 'critical') {
        this.trustScore.factors.abnormalPatterns -= 10
      } else if (type === 'major') {
        this.trustScore.factors.abnormalPatterns -= 5
      }
      this.trustScore.totalScore = Object.values(this.trustScore.factors)
        .reduce((a, b) => a + b, 0)
    }
  }

  private async addEvidence(type: Evidence['type'], data: any): Promise<void> {
    const evidence: Evidence = {
      type,
      data,
      timestamp: new Date().toISOString(),
      hash: await sha256(JSON.stringify(data))
    }
    
    this.evidence.push(evidence)
    
    // Keep only last 20 pieces of evidence
    if (this.evidence.length > 20) {
      this.evidence.shift()
    }
  }

  private isMotionAvailable(): boolean {
    return typeof window !== 'undefined' && 
           'DeviceMotionEvent' in window &&
           'DeviceOrientationEvent' in window
  }

  private async detectVPN(): Promise<boolean> {
    try {
      // Check timezone vs IP location
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const ipTimezone = data.timezone
      
      // If timezones don't match, might be VPN
      return browserTimezone !== ipTimezone
    } catch {
      return false
    }
  }

  private detectEmulator(): boolean {
    // Check for emulator characteristics
    const checks = [
      // Check for common emulator user agents
      /Android.*Emulator/i.test(navigator.userAgent),
      /Android.*SDK/i.test(navigator.userAgent),
      
      // Check for suspicious screen dimensions
      window.screen.width === 0 || window.screen.height === 0,
      
      // Check for missing touch support on mobile
      /Android|iPhone/i.test(navigator.userAgent) && !('ontouchstart' in window),
      
      // Check for perfect battery level
      (navigator as any).battery?.level === 1 && (navigator as any).battery?.charging === true
    ]
    
    return checks.some(check => check === true)
  }

  private detectDevTools(): boolean {
    // Multiple methods to detect dev tools
    const checks = [
      // Check if console.log has been overridden
      console.log.toString().includes('[native code]') === false,
      
      // Check window dimensions (dev tools docked)
      window.outerHeight - window.innerHeight > 100,
      window.outerWidth - window.innerWidth > 100,
      
      // Performance check
      (() => {
        const start = performance.now()
        debugger // This line will pause if dev tools are open
        return performance.now() - start > 100
      })()
    ]
    
    return checks.some(check => check === true)
  }

  private calculateCurrentBiometrics(): any {
    if (this.performanceMetrics.length === 0) {
      return {
        rhythm: 0,
        formScore: 0,
        restTime: 0,
        signature: []
      }
    }

    // Calculate rhythm (reps per minute)
    const duration = (Date.now() - this.performanceMetrics[0].timestamp) / 1000 / 60
    const reps = this.performanceMetrics.filter(m => m.isValidRep).length
    const rhythm = reps / duration

    // Calculate average form score
    const formScore = this.performanceMetrics.reduce((sum, m) => sum + m.formScore, 0) / 
                     this.performanceMetrics.length

    // Calculate rest time between reps
    const repTimestamps = this.performanceMetrics
      .filter(m => m.isValidRep)
      .map(m => m.timestamp)
    
    let totalRestTime = 0
    for (let i = 1; i < repTimestamps.length; i++) {
      totalRestTime += repTimestamps[i] - repTimestamps[i - 1]
    }
    const avgRestTime = repTimestamps.length > 1 ? 
      totalRestTime / (repTimestamps.length - 1) : 0

    // Create movement signature (simplified)
    const signature = this.performanceMetrics
      .slice(0, 10)
      .map(m => m.formScore)

    return {
      rhythm,
      formScore,
      restTime: avgRestTime,
      signature
    }
  }

  private async uploadVideo(blob: Blob): Promise<string> {
    try {
      const fileName = `verifications/${this.userId}/${this.sessionId}.webm`
      
      const { data, error } = await this.supabase.storage
        .from('verification-videos')
        .upload(fileName, blob)

      if (error) throw error

      const { data: { publicUrl } } = this.supabase.storage
        .from('verification-videos')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Failed to upload video:', error)
      return ''
    }
  }

  private async logSessionStart(): Promise<void> {
    try {
      await this.supabase
        .from('anticheat_sessions')
        .insert({
          session_id: this.sessionId,
          user_id: this.userId,
          exercise_id: this.exerciseId,
          device_hash: this.deviceFingerprint?.deviceHash,
          trust_score: this.trustScore?.totalScore,
          config: this.config,
          started_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to log session start:', error)
    }
  }

  private async saveValidationResult(result: ValidationResult): Promise<void> {
    try {
      await this.supabase
        .from('validation_results')
        .insert({
          session_id: this.sessionId,
          user_id: this.userId,
          exercise_id: this.exerciseId,
          is_valid: result.isValid,
          confidence: result.confidence,
          trust_score: result.trustScore,
          violations: result.violations,
          requires_review: result.requiresManualReview,
          evidence_hashes: result.evidence.map(e => e.hash),
          created_at: new Date().toISOString()
        })

      // Update user stats if cheating detected
      if (!result.isValid) {
        await this.handleCheatingDetected()
      }
    } catch (error) {
      console.error('Failed to save validation result:', error)
    }
  }

  private async handleCheatingDetected(): Promise<void> {
    // Update trust score
    if (this.trustScore) {
      this.trustScore.totalScore = Math.max(0, this.trustScore.totalScore - 20)
      await this.saveTrustScore()
    }

    // Log incident
    await this.supabase
      .from('cheat_incidents')
      .insert({
        user_id: this.userId,
        session_id: this.sessionId,
        exercise_id: this.exerciseId,
        violations: this.violations,
        severity: this.violations.some(v => v.type === 'critical') ? 'critical' : 'major',
        action_taken: 'performance_invalidated',
        created_at: new Date().toISOString()
      })

    // Notify user
    console.warn('Cheating detected - performance invalidated')
  }

  // ====================================
  // PUBLIC API
  // ====================================

  async startValidation(): Promise<boolean> {
    const initialized = await this.initialize()
    
    if (!initialized) {
      console.error('Anti-cheat initialization failed')
      return false
    }

    // Start motion tracking if available
    if (this.motionTracker) {
      this.motionTracker.startTracking()
    }

    // Issue random challenges during exercise
    if (this.config.layers.challengeSystem && Math.random() < 0.3) {
      setTimeout(() => {
        this.issueChallenge()
      }, 10000 + Math.random() * 20000)
    }

    return true
  }

  async stopValidation(): Promise<ValidationResult> {
    const result = await this.finalizeValidation()
    
    // Update biometric profile if valid
    if (result.isValid) {
      const metrics = this.calculateCurrentBiometrics()
      await this.updateBiometricProfile(metrics)
    }

    // Cleanup
    this.dispose()

    return result
  }

  getViolations(): Violation[] {
    return this.violations
  }

  getTrustScore(): number {
    return this.trustScore?.totalScore || 0
  }

  isHighRisk(): boolean {
    return this.trustScore?.trustLevel === 'untrusted' || 
           this.trustScore?.trustLevel === 'low'
  }

  dispose(): void {
    if (this.aiValidator) {
      this.aiValidator.dispose()
    }
    
    if (this.motionTracker) {
      this.motionTracker.dispose()
    }

    if (this.mediaRecorder && this.isRecording) {
      this.stopVideoRecording()
    }

    this.performanceMetrics = []
    this.violations = []
    this.evidence = []
  }
}

// ====================================
// EXPORT FACTORY FUNCTION
// ====================================

export function createAntiCheatManager(
  userId: string,
  exerciseId: string,
  config?: Partial<AntiCheatConfig>
): AntiCheatManager {
  return new AntiCheatManager(userId, exerciseId, config)
}