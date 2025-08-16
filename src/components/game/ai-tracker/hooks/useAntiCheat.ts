// src/components/game/ai-tracker/hooks/useAntiCheat.ts

import { useState, useRef, useCallback, useEffect } from 'react'
import { createAntiCheatManager } from '@/lib/security/anticheat-system'

export interface AntiCheatConfig {
  userId: string
  exerciseId: string
  duelId?: string
  strictMode: boolean
}

export interface ValidationResult {
  isValid: boolean
  confidence: number
  trustScore: number
  violations: string[]
  requiresManualReview: boolean
  evidence: {
    videoChunks?: string[]
    screenshots?: string[]
    performanceMetrics?: any
  }
}

export interface UseAntiCheatReturn {
  trustScore: number
  violations: string[]
  isValidPerformance: boolean
  antiCheatRef: React.MutableRefObject<any>
  initializeAntiCheat: () => Promise<void>
  startValidation: () => Promise<void>
  stopValidation: () => Promise<ValidationResult>
  validateFrame: (videoElement: HTMLVideoElement | null) => Promise<void>
  reportViolation: (type: string, severity: 'low' | 'medium' | 'high' | 'critical') => void
  checkDeviceFingerprint: () => Promise<boolean>
}

export const useAntiCheat = (config: AntiCheatConfig): UseAntiCheatReturn => {
  const [trustScore, setTrustScore] = useState(100)
  const [violations, setViolations] = useState<string[]>([])
  const [isValidPerformance, setIsValidPerformance] = useState(true)
  
  const antiCheatRef = useRef<any>(null)
  const frameCountRef = useRef(0)
  const lastValidationTimeRef = useRef(Date.now())
  const deviceFingerprintRef = useRef<string | null>(null)

  const initializeAntiCheat = useCallback(async () => {
    if (!config.strictMode) {
      console.log('Anti-cheat disabled (not in strict mode)')
      return
    }

    try {
      console.log('🛡️ Initializing Anti-Cheat System...')
      
      // Create anti-cheat manager
      antiCheatRef.current = createAntiCheatManager(
        config.userId,
        config.exerciseId,
        {
          strictMode: true,
          layers: {
            aiValidation: true,
            motionTracking: true,
            videoVerification: true,
            deviceFingerprinting: true,
            behavioralBiometrics: true,
            patternAnalysis: true,
            challengeSystem: config.duelId ? true : false, // Only for duels
            reputationSystem: true,
            evidenceCollection: true
          }
        }
      )

      // Get initial trust score
      const initialTrustScore = await antiCheatRef.current.getTrustScore()
      setTrustScore(initialTrustScore)

      // Check device fingerprint
      const fingerprintValid = await checkDeviceFingerprint()
      if (!fingerprintValid) {
        reportViolation('MULTIPLE_DEVICES_DETECTED', 'high')
      }

      console.log('✅ Anti-Cheat initialized with trust score:', initialTrustScore)
    } catch (error) {
      console.error('❌ Anti-Cheat initialization failed:', error)
    }
  }, [config])

  const checkDeviceFingerprint = useCallback(async (): Promise<boolean> => {
    if (!antiCheatRef.current) return true

    try {
      const fingerprint = await antiCheatRef.current.getDeviceFingerprint()
      
      if (deviceFingerprintRef.current && deviceFingerprintRef.current !== fingerprint) {
        console.warn('⚠️ Device fingerprint changed!')
        return false
      }
      
      deviceFingerprintRef.current = fingerprint
      return true
    } catch (error) {
      console.error('Error checking device fingerprint:', error)
      return true
    }
  }, [])

  const startValidation = useCallback(async () => {
    if (!antiCheatRef.current) return

    try {
      console.log('🎬 Starting anti-cheat validation...')
      await antiCheatRef.current.startValidation()
      
      // Reset counters
      frameCountRef.current = 0
      lastValidationTimeRef.current = Date.now()
      setViolations([])
      
    } catch (error) {
      console.error('Error starting validation:', error)
    }
  }, [])

  const validateFrame = useCallback(async (videoElement: HTMLVideoElement | null) => {
    if (!antiCheatRef.current || !videoElement) return

    frameCountRef.current++

    // Validate every 10th frame to reduce overhead
    if (frameCountRef.current % 10 !== 0) return

    try {
      const now = Date.now()
      const timeSinceLastValidation = now - lastValidationTimeRef.current

      // Create canvas to capture frame
      const canvas = document.createElement('canvas')
      canvas.width = videoElement.videoWidth
      canvas.height = videoElement.videoHeight
      const ctx = canvas.getContext('2d')
      
      if (!ctx) return

      ctx.drawImage(videoElement, 0, 0)
      
      // Validate frame
      const frameValidation = await antiCheatRef.current.validateFrame(canvas)
      
      // Check for anomalies
      if (frameValidation.anomalies) {
        frameValidation.anomalies.forEach((anomaly: any) => {
          reportViolation(anomaly.type, anomaly.severity)
        })
      }

      // Update trust score periodically
      if (timeSinceLastValidation > 5000) { // Every 5 seconds
        const currentTrustScore = await antiCheatRef.current.getTrustScore()
        setTrustScore(currentTrustScore)
        lastValidationTimeRef.current = now
      }

      // Check for rapid movements (potential video playback)
      if (frameValidation.movementSpeed && frameValidation.movementSpeed > 2.0) {
        reportViolation('ABNORMAL_MOVEMENT_SPEED', 'medium')
      }

      // Check for static frames (potential image)
      if (frameValidation.isStatic && frameCountRef.current > 30) {
        reportViolation('STATIC_FRAME_DETECTED', 'low')
      }

    } catch (error) {
      console.error('Error validating frame:', error)
    }
  }, [])

  const reportViolation = useCallback((type: string, severity: 'low' | 'medium' | 'high' | 'critical') => {
    console.warn(`⚠️ Violation detected: ${type} (${severity})`)
    
    setViolations(prev => [...prev, type])
    
    // Update trust score based on severity
    const scoreReduction = {
      low: 5,
      medium: 10,
      high: 20,
      critical: 50
    }
    
    setTrustScore(prev => Math.max(0, prev - scoreReduction[severity]))
    
    // Mark performance as invalid for critical violations
    if (severity === 'critical') {
      setIsValidPerformance(false)
    }

    // Report to anti-cheat manager
    if (antiCheatRef.current) {
      antiCheatRef.current.reportViolation({
        type,
        severity,
        timestamp: Date.now()
      })
    }
  }, [])

  const stopValidation = useCallback(async (): Promise<ValidationResult> => {
    if (!antiCheatRef.current) {
      return {
        isValid: true,
        confidence: 100,
        trustScore: 100,
        violations: [],
        requiresManualReview: false,
        evidence: {}
      }
    }

    try {
      console.log('🏁 Stopping anti-cheat validation...')
      const result = await antiCheatRef.current.stopValidation()
      
      // Log final results
      console.log('📊 Validation Results:', {
        isValid: result.isValid,
        confidence: result.confidence,
        trustScore: result.trustScore,
        violations: result.violations,
        requiresReview: result.requiresManualReview
      })

      // Update state
      setIsValidPerformance(result.isValid)
      setTrustScore(result.trustScore)
      
      return result
    } catch (error) {
      console.error('Error stopping validation:', error)
      return {
        isValid: isValidPerformance,
        confidence: 50,
        trustScore,
        violations,
        requiresManualReview: true,
        evidence: {}
      }
    }
  }, [isValidPerformance, trustScore, violations])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (antiCheatRef.current) {
        antiCheatRef.current.cleanup()
      }
    }
  }, [])

  return {
    trustScore,
    violations,
    isValidPerformance,
    antiCheatRef,
    initializeAntiCheat,
    startValidation,
    stopValidation,
    validateFrame,
    reportViolation,
    checkDeviceFingerprint
  }
}