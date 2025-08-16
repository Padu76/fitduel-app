// src/app/api/anticheat/verify/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// ====================================
// TYPES
// ====================================

interface VerificationRequest {
  sessionId: string
  userId: string
  exerciseId: string
  duelId?: string
  missionId?: string
  tournamentId?: string
  performanceData: {
    reps: number
    duration: number
    formScore: number
    calories: number
  }
  validationLayers: {
    aiValidation?: {
      confidence: number
      landmarks: any[]
      anomalies: string[]
    }
    motionTracking?: {
      accelerometerData: number[]
      gyroscopeData: number[]
      patterns: any
    }
    videoVerification?: {
      videoHash: string
      frameCount: number
      watermarks: string[]
    }
    deviceFingerprint?: {
      deviceHash: string
      browserInfo: any
      screenResolution: string
      hardwareConcurrency: number
    }
    behavioralBiometrics?: {
      rhythmPattern: number[]
      formConsistency: number
      fatiguePattern: number[]
    }
  }
  evidence: {
    screenshots?: string[]
    videoChunks?: string[]
    performanceMetrics?: any
  }
}

interface VerificationResponse {
  success: boolean
  isValid: boolean
  confidence: number
  trustScore: number
  violations: string[]
  requiresManualReview: boolean
  validationId?: string
  message?: string
}

// ====================================
// VALIDATION FUNCTIONS
// ====================================

// Check if performance metrics are within human limits
function validateHumanLimits(data: VerificationRequest['performanceData']): {
  isValid: boolean
  violations: string[]
} {
  const violations: string[] = []
  
  // Check reps per minute (max ~120 for jumping jacks, ~60 for push-ups)
  const repsPerMinute = (data.reps / data.duration) * 60
  if (repsPerMinute > 150) {
    violations.push('IMPOSSIBLE_SPEED')
  }
  
  // Check form score consistency
  if (data.formScore > 100 || data.formScore < 0) {
    violations.push('INVALID_FORM_SCORE')
  }
  
  // Check calorie burn rate (max ~20 cal/min for intense exercise)
  const caloriesPerMinute = (data.calories / data.duration) * 60
  if (caloriesPerMinute > 25) {
    violations.push('IMPOSSIBLE_CALORIE_BURN')
  }
  
  return {
    isValid: violations.length === 0,
    violations
  }
}

// Analyze motion patterns for anomalies
function analyzeMotionPatterns(motionData?: any): {
  confidence: number
  anomalies: string[]
} {
  if (!motionData) {
    return { confidence: 50, anomalies: ['NO_MOTION_DATA'] }
  }
  
  const anomalies: string[] = []
  let confidence = 100
  
  // Check for mechanical patterns (too regular)
  if (motionData.accelerometerData) {
    const variance = calculateVariance(motionData.accelerometerData)
    if (variance < 0.01) {
      anomalies.push('MECHANICAL_PATTERN')
      confidence -= 30
    }
  }
  
  // Check for device shaking patterns
  if (motionData.gyroscopeData) {
    const avgRotation = average(motionData.gyroscopeData)
    if (Math.abs(avgRotation) > 5) {
      anomalies.push('DEVICE_SHAKING')
      confidence -= 40
    }
  }
  
  return { confidence, anomalies }
}

// Verify device fingerprint
async function verifyDeviceFingerprint(
  supabase: any,
  userId: string,
  deviceHash: string
): Promise<{
  isValid: boolean
  isTrusted: boolean
  violations: string[]
}> {
  const violations: string[] = []
  
  try {
    // Check if device is registered
    const { data: devices, error } = await supabase
      .from('device_fingerprints')
      .select('*')
      .eq('user_id', userId)
      .eq('device_hash', deviceHash)
      .single()
    
    if (error || !devices) {
      // New device - check device limit
      const { count } = await supabase
        .from('device_fingerprints')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_banned', false)
      
      if (count >= 3) {
        violations.push('DEVICE_LIMIT_EXCEEDED')
        return { isValid: false, isTrusted: false, violations }
      }
      
      // Register new device
      await supabase
        .from('device_fingerprints')
        .insert({
          user_id: userId,
          device_hash: deviceHash,
          is_trusted: false
        })
      
      return { isValid: true, isTrusted: false, violations: ['NEW_DEVICE'] }
    }
    
    // Check if device is banned
    if (devices.is_banned) {
      violations.push('DEVICE_BANNED')
      return { isValid: false, isTrusted: false, violations }
    }
    
    // Update last seen
    await supabase
      .from('device_fingerprints')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', devices.id)
    
    return {
      isValid: true,
      isTrusted: devices.is_trusted,
      violations
    }
  } catch (error) {
    console.error('Device fingerprint verification error:', error)
    violations.push('DEVICE_CHECK_ERROR')
    return { isValid: false, isTrusted: false, violations }
  }
}

// Check behavioral biometrics
function checkBehavioralBiometrics(
  biometrics?: any,
  exerciseId?: string
): {
  confidence: number
  anomalies: string[]
} {
  if (!biometrics) {
    return { confidence: 50, anomalies: ['NO_BIOMETRIC_DATA'] }
  }
  
  const anomalies: string[] = []
  let confidence = 100
  
  // Check rhythm consistency
  if (biometrics.rhythmPattern) {
    const rhythmVariance = calculateVariance(biometrics.rhythmPattern)
    if (rhythmVariance < 0.05) {
      anomalies.push('RHYTHM_TOO_CONSISTENT')
      confidence -= 20
    }
  }
  
  // Check fatigue pattern (should show degradation over time)
  if (biometrics.fatiguePattern && biometrics.fatiguePattern.length > 10) {
    const firstHalf = biometrics.fatiguePattern.slice(0, Math.floor(biometrics.fatiguePattern.length / 2))
    const secondHalf = biometrics.fatiguePattern.slice(Math.floor(biometrics.fatiguePattern.length / 2))
    
    const firstAvg = average(firstHalf)
    const secondAvg = average(secondHalf)
    
    // No fatigue detected (second half should be slower/worse)
    if (secondAvg >= firstAvg * 1.05) {
      anomalies.push('NO_FATIGUE_PATTERN')
      confidence -= 15
    }
  }
  
  return { confidence, anomalies }
}

// Calculate overall trust score
async function calculateTrustScore(
  supabase: any,
  userId: string,
  validationResult: any
): Promise<number> {
  try {
    // Get current trust score
    const { data: trustData } = await supabase
      .from('trust_scores')
      .select('score, factors')
      .eq('user_id', userId)
      .single()
    
    let currentScore = trustData?.score || 50
    const factors = trustData?.factors || {}
    
    // Adjust based on validation result
    if (validationResult.isValid) {
      // Increase trust for valid performance
      currentScore = Math.min(100, currentScore + 1)
      factors.total_validations = (factors.total_validations || 0) + 1
    } else {
      // Decrease trust for invalid performance
      currentScore = Math.max(0, currentScore - 10)
      factors.failed_validations = (factors.failed_validations || 0) + 1
    }
    
    // Update trust score
    await supabase
      .from('trust_scores')
      .upsert({
        user_id: userId,
        score: currentScore,
        factors,
        updated_at: new Date().toISOString()
      })
    
    return currentScore
  } catch (error) {
    console.error('Trust score calculation error:', error)
    return 50
  }
}

// ====================================
// UTILITY FUNCTIONS
// ====================================

function calculateVariance(data: number[]): number {
  const mean = average(data)
  const squaredDiffs = data.map(value => Math.pow(value - mean, 2))
  return average(squaredDiffs)
}

function average(data: number[]): number {
  if (data.length === 0) return 0
  return data.reduce((sum, value) => sum + value, 0) / data.length
}

function generateValidationId(): string {
  return crypto.randomBytes(16).toString('hex')
}

// ====================================
// MAIN API HANDLER
// ====================================

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Authenticate user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body: VerificationRequest = await request.json()
    
    // Validate request data
    if (!body.sessionId || !body.userId || !body.performanceData) {
      return NextResponse.json(
        { success: false, message: 'Invalid request data' },
        { status: 400 }
      )
    }
    
    // Ensure user is verifying their own performance
    if (body.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Cannot verify other users performances' },
        { status: 403 }
      )
    }
    
    const allViolations: string[] = []
    let totalConfidence = 100
    let requiresManualReview = false
    
    // 1. Validate human limits
    const humanLimits = validateHumanLimits(body.performanceData)
    if (!humanLimits.isValid) {
      allViolations.push(...humanLimits.violations)
      totalConfidence -= 50
    }
    
    // 2. Analyze motion patterns
    const motionAnalysis = analyzeMotionPatterns(body.validationLayers.motionTracking)
    allViolations.push(...motionAnalysis.anomalies)
    totalConfidence = Math.min(totalConfidence, motionAnalysis.confidence)
    
    // 3. Verify device fingerprint
    if (body.validationLayers.deviceFingerprint) {
      const deviceResult = await verifyDeviceFingerprint(
        supabase,
        body.userId,
        body.validationLayers.deviceFingerprint.deviceHash
      )
      
      if (!deviceResult.isValid) {
        allViolations.push(...deviceResult.violations)
        totalConfidence -= 40
      } else if (!deviceResult.isTrusted) {
        requiresManualReview = true
      }
    }
    
    // 4. Check behavioral biometrics
    const biometricCheck = checkBehavioralBiometrics(
      body.validationLayers.behavioralBiometrics,
      body.exerciseId
    )
    allViolations.push(...biometricCheck.anomalies)
    totalConfidence = Math.min(totalConfidence, biometricCheck.confidence)
    
    // 5. AI Validation check
    if (body.validationLayers.aiValidation) {
      const aiConfidence = body.validationLayers.aiValidation.confidence
      if (aiConfidence < 70) {
        allViolations.push('LOW_AI_CONFIDENCE')
        requiresManualReview = true
      }
      totalConfidence = Math.min(totalConfidence, aiConfidence)
    }
    
    // Determine if performance is valid
    const isValid = totalConfidence >= 60 && !allViolations.includes('DEVICE_BANNED')
    
    // Calculate trust score
    const trustScore = await calculateTrustScore(supabase, body.userId, {
      isValid,
      confidence: totalConfidence,
      violations: allViolations
    })
    
    // Save validation result to database
    const validationId = generateValidationId()
    const { error: saveError } = await supabase
      .from('validation_results')
      .insert({
        id: validationId,
        session_id: body.sessionId,
        user_id: body.userId,
        exercise_id: body.exerciseId,
        duel_id: body.duelId,
        mission_id: body.missionId,
        tournament_id: body.tournamentId,
        is_valid: isValid,
        confidence: totalConfidence,
        trust_score: trustScore,
        violations: allViolations,
        validation_layers: body.validationLayers,
        performance_metrics: body.performanceData,
        requires_manual_review: requiresManualReview,
        evidence_hashes: body.evidence.screenshots || [],
        video_chunks_urls: body.evidence.videoChunks || [],
        created_at: new Date().toISOString()
      })
    
    if (saveError) {
      console.error('Error saving validation result:', saveError)
    }
    
    // Log incident if violations found
    if (allViolations.length > 0) {
      const severity = totalConfidence < 30 ? 'critical' : 
                      totalConfidence < 50 ? 'high' :
                      totalConfidence < 70 ? 'medium' : 'low'
      
      await supabase
        .from('cheat_incidents')
        .insert({
          user_id: body.userId,
          session_id: body.sessionId,
          exercise_id: body.exerciseId,
          duel_id: body.duelId,
          mission_id: body.missionId,
          tournament_id: body.tournamentId,
          incident_type: allViolations[0] === 'DEVICE_BANNED' ? 'device_anomaly' : 'abnormal_movement',
          severity,
          confidence: totalConfidence,
          violations: allViolations,
          evidence: body.evidence,
          action_taken: isValid ? 'none' : 'performance_invalidated',
          created_at: new Date().toISOString()
        })
    }
    
    // Prepare response
    const response: VerificationResponse = {
      success: true,
      isValid,
      confidence: totalConfidence,
      trustScore,
      violations: allViolations,
      requiresManualReview,
      validationId,
      message: isValid 
        ? 'Performance verified successfully' 
        : 'Performance validation failed'
    }
    
    return NextResponse.json(response, { status: 200 })
    
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        isValid: false,
        confidence: 0,
        trustScore: 0,
        violations: ['SERVER_ERROR'],
        requiresManualReview: true
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check verification status
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Authenticate user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const validationId = searchParams.get('validationId')
    const sessionId = searchParams.get('sessionId')
    
    if (!validationId && !sessionId) {
      return NextResponse.json(
        { success: false, message: 'Validation ID or Session ID required' },
        { status: 400 }
      )
    }
    
    // Query validation result
    let query = supabase
      .from('validation_results')
      .select('*')
      .eq('user_id', session.user.id)
    
    if (validationId) {
      query = query.eq('id', validationId)
    } else if (sessionId) {
      query = query.eq('session_id', sessionId)
    }
    
    const { data, error } = await query.single()
    
    if (error || !data) {
      return NextResponse.json(
        { success: false, message: 'Validation not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      validation: data
    }, { status: 200 })
    
  } catch (error) {
    console.error('Get verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}