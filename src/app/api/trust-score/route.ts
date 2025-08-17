// src/app/api/trust-score/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// ====================================
// TYPES
// ====================================

type TrustLevel = 'untrusted' | 'low' | 'medium' | 'high' | 'verified'

interface TrustScoreResponse {
  success: boolean
  trustScore?: {
    userId: string
    score: number
    level: TrustLevel
    factors: {
      accountAge: number
      emailVerified: boolean
      socialLinked: boolean
      playConsistency: number
      reportCount: number
      videoVerifications: number
      abnormalPatterns: number
      totalValidations: number
      failedValidations: number
      deviceSwitches: number
      vpnUsage: number
      communityReports: number
    }
    restrictions: string[]
    badges: string[]
    history?: TrustHistoryEntry[]
  }
  message?: string
}

interface TrustHistoryEntry {
  date: string
  score: number
  change: number
  reason: string
}

interface TrustUpdateRequest {
  userId?: string
  adjustment: number
  reason: string
  category: 'performance' | 'report' | 'verification' | 'behavior' | 'admin'
}

// ====================================
// HELPER FUNCTIONS
// ====================================

// Calculate trust level based on score
function getTrustLevel(score: number): TrustLevel {
  if (score >= 90) return 'verified'
  if (score >= 70) return 'high'
  if (score >= 50) return 'medium'
  if (score >= 30) return 'low'
  return 'untrusted'
}

// Get restrictions based on trust level
function getRestrictions(score: number, factors: any): string[] {
  const restrictions: string[] = []
  
  if (score < 20) {
    restrictions.push('no_tournaments', 'no_rewards', 'manual_review_required')
  } else if (score < 40) {
    restrictions.push('limited_tournaments', 'limited_rewards', 'video_recommended')
  } else if (score < 60) {
    restrictions.push('basic_tournaments_only')
  }
  
  // Additional restrictions based on specific factors
  if (factors.failedValidations > 5) {
    restrictions.push('increased_verification')
  }
  
  if (factors.deviceSwitches > 10) {
    restrictions.push('device_monitoring')
  }
  
  if (factors.communityReports > 3) {
    restrictions.push('under_review')
  }
  
  return restrictions
}

// Get badges based on trust achievements
function getTrustBadges(score: number, factors: any): string[] {
  const badges: string[] = []
  
  if (score >= 95) badges.push('elite_trusted')
  if (score >= 80) badges.push('highly_trusted')
  if (factors.videoVerifications >= 10) badges.push('video_verified')
  if (factors.totalValidations >= 50 && factors.failedValidations === 0) badges.push('perfect_record')
  if (factors.accountAge >= 365) badges.push('veteran')
  if (factors.playConsistency >= 0.8) badges.push('consistent_player')
  if (factors.communityReports === 0 && factors.totalValidations >= 20) badges.push('fair_player')
  
  return badges
}

// Calculate account age in days
async function getAccountAge(supabase: any, userId: string): Promise<number> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('id', userId)
      .single()
    
    if (!profile) return 0
    
    const createdDate = new Date(profile.created_at)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - createdDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  } catch (error) {
    console.error('Error getting account age:', error)
    return 0
  }
}

// Calculate play consistency (0-1)
async function getPlayConsistency(supabase: any, userId: string): Promise<number> {
  try {
    // Get performance history for last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const { data: performances } = await supabase
      .from('performances')
      .select('performed_at')
      .eq('user_id', userId)
      .gte('performed_at', thirtyDaysAgo)
      .order('performed_at', { ascending: true })
    
    if (!performances || performances.length === 0) return 0
    
    // Calculate days with activity
    const uniqueDays = new Set(
      performances.map(p => new Date(p.performed_at).toDateString())
    )
    
    // Consistency = active days / 30
    return Math.min(1, uniqueDays.size / 30)
  } catch (error) {
    console.error('Error calculating play consistency:', error)
    return 0
  }
}

// Get trust history
async function getTrustHistory(
  supabase: any, 
  userId: string, 
  limit: number = 10
): Promise<TrustHistoryEntry[]> {
  try {
    const { data: logs } = await supabase
      .from('anticheat_logs')
      .select('created_at, data')
      .eq('user_id', userId)
      .eq('log_type', 'trust_score_change')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (!logs) return []
    
    return logs.map(log => ({
      date: log.created_at,
      score: log.data.new_score || 0,
      change: log.data.adjustment || 0,
      reason: log.data.reason || 'Unknown'
    }))
  } catch (error) {
    console.error('Error getting trust history:', error)
    return []
  }
}

// Recalculate trust score based on all factors
async function recalculateTrustScore(supabase: any, userId: string): Promise<number> {
  try {
    let baseScore = 50 // Start with neutral score
    
    // Get current factors
    const { data: trustData } = await supabase
      .from('trust_scores')
      .select('factors')
      .eq('user_id', userId)
      .single()
    
    const factors = trustData?.factors || {}
    
    // Account age bonus (up to +10)
    const accountAge = await getAccountAge(supabase, userId)
    baseScore += Math.min(10, Math.floor(accountAge / 30))
    
    // Email verification (+5)
    if (factors.emailVerified) baseScore += 5
    
    // Play consistency bonus (up to +10)
    const consistency = await getPlayConsistency(supabase, userId)
    baseScore += Math.floor(consistency * 10)
    
    // Video verifications (up to +15)
    baseScore += Math.min(15, factors.videoVerifications || 0)
    
    // Validation success rate
    const totalValidations = factors.totalValidations || 0
    const failedValidations = factors.failedValidations || 0
    if (totalValidations > 0) {
      const successRate = 1 - (failedValidations / totalValidations)
      baseScore += Math.floor(successRate * 20) - 10 // -10 to +10
    }
    
    // Penalties
    baseScore -= (factors.abnormalPatterns || 0) * 5
    baseScore -= (factors.communityReports || 0) * 10
    baseScore -= Math.min(20, (factors.deviceSwitches || 0) * 2)
    baseScore -= (factors.vpnUsage || 0) * 3
    
    // Ensure score is within bounds
    return Math.max(0, Math.min(100, baseScore))
  } catch (error) {
    console.error('Error recalculating trust score:', error)
    return 50
  }
}

// ====================================
// MAIN API HANDLERS
// ====================================

// GET - Get trust score
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
    const targetUserId = searchParams.get('userId') || session.user.id
    const includeHistory = searchParams.get('includeHistory') === 'true'
    
    // Users can only view their own detailed trust score
    // For other users, only show basic info
    const isOwnScore = targetUserId === session.user.id
    
    // Get trust score
    let { data: trustData, error } = await supabase
      .from('trust_scores')
      .select('*')
      .eq('user_id', targetUserId)
      .single()
    
    // If no trust score exists, create one
    if (!trustData) {
      const accountAge = await getAccountAge(supabase, targetUserId)
      const initialScore = 50 + Math.min(10, Math.floor(accountAge / 30))
      
      const { data: newTrust, error: createError } = await supabase
        .from('trust_scores')
        .insert({
          user_id: targetUserId,
          score: initialScore,
          trust_level: getTrustLevel(initialScore),
          factors: {
            accountAge,
            emailVerified: false,
            socialLinked: false,
            playConsistency: 0,
            reportCount: 0,
            videoVerifications: 0,
            abnormalPatterns: 0,
            totalValidations: 0,
            failedValidations: 0,
            deviceSwitches: 0,
            vpnUsage: 0,
            communityReports: 0
          },
          restrictions: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating trust score:', createError)
        return NextResponse.json(
          { success: false, message: 'Failed to create trust score' },
          { status: 500 }
        )
      }
      
      trustData = newTrust
    }
    
    // Update dynamic factors if viewing own score
    if (isOwnScore) {
      const accountAge = await getAccountAge(supabase, targetUserId)
      const playConsistency = await getPlayConsistency(supabase, targetUserId)
      
      trustData.factors.accountAge = accountAge
      trustData.factors.playConsistency = playConsistency
    }
    
    // Get restrictions and badges
    const restrictions = getRestrictions(trustData.score, trustData.factors)
    const badges = getTrustBadges(trustData.score, trustData.factors)
    
    // Get history if requested and authorized
    let history: TrustHistoryEntry[] = []
    if (includeHistory && isOwnScore) {
      history = await getTrustHistory(supabase, targetUserId)
    }
    
    // Prepare response
    const response: TrustScoreResponse = {
      success: true,
      trustScore: {
        userId: targetUserId,
        score: trustData.score,
        level: trustData.trust_level as TrustLevel,
        factors: isOwnScore ? trustData.factors : {
          // Limited info for other users
          accountAge: trustData.factors.accountAge,
          emailVerified: trustData.factors.emailVerified,
          socialLinked: false,
          playConsistency: 0,
          reportCount: 0,
          videoVerifications: trustData.factors.videoVerifications,
          abnormalPatterns: 0,
          totalValidations: 0,
          failedValidations: 0,
          deviceSwitches: 0,
          vpnUsage: 0,
          communityReports: 0
        },
        restrictions: isOwnScore ? restrictions : [],
        badges,
        history: isOwnScore ? history : undefined
      }
    }
    
    return NextResponse.json(response, { status: 200 })
    
  } catch (error) {
    console.error('Get trust score error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Update trust score (internal use)
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
    
    const body: TrustUpdateRequest = await request.json()
    
    // Validate request
    if (!body.adjustment || !body.reason || !body.category) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const targetUserId = body.userId || session.user.id
    
    // Only allow self-updates for performance category
    // Admin updates would need separate validation
    if (targetUserId !== session.user.id && body.category !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Cannot update other users trust scores' },
        { status: 403 }
      )
    }
    
    // Get current trust score
    const { data: currentTrust } = await supabase
      .from('trust_scores')
      .select('*')
      .eq('user_id', targetUserId)
      .single()
    
    if (!currentTrust) {
      return NextResponse.json(
        { success: false, message: 'Trust score not found' },
        { status: 404 }
      )
    }
    
    // Calculate new score
    const newScore = Math.max(0, Math.min(100, currentTrust.score + body.adjustment))
    const newLevel = getTrustLevel(newScore)
    
    // Update factors based on category
    const updatedFactors = { ...currentTrust.factors }
    
    switch (body.category) {
      case 'performance':
        if (body.adjustment > 0) {
          updatedFactors.totalValidations = (updatedFactors.totalValidations || 0) + 1
        } else {
          updatedFactors.failedValidations = (updatedFactors.failedValidations || 0) + 1
        }
        break
      case 'report':
        if (body.adjustment < 0) {
          updatedFactors.communityReports = (updatedFactors.communityReports || 0) + 1
        }
        break
      case 'verification':
        if (body.adjustment > 0) {
          updatedFactors.videoVerifications = (updatedFactors.videoVerifications || 0) + 1
        }
        break
      case 'behavior':
        if (body.adjustment < 0) {
          updatedFactors.abnormalPatterns = (updatedFactors.abnormalPatterns || 0) + 1
        }
        break
    }
    
    // Update trust score
    const { error: updateError } = await supabase
      .from('trust_scores')
      .update({
        score: newScore,
        trust_level: newLevel,
        factors: updatedFactors,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', targetUserId)
    
    if (updateError) {
      console.error('Trust score update error:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update trust score' },
        { status: 500 }
      )
    }
    
    // Log the change
    await supabase
      .from('anticheat_logs')
      .insert({
        user_id: targetUserId,
        log_type: 'trust_score_change',
        log_level: 'info',
        component: 'trust_system',
        message: `Trust score updated: ${currentTrust.score} → ${newScore}`,
        data: {
          old_score: currentTrust.score,
          new_score: newScore,
          adjustment: body.adjustment,
          reason: body.reason,
          category: body.category,
          new_level: newLevel
        },
        created_at: new Date().toISOString()
      })
    
    // Check for automatic actions based on new score
    if (newScore < 30 && currentTrust.score >= 30) {
      // User dropped below threshold - apply restrictions
      await supabase
        .from('trust_scores')
        .update({
          restrictions: ['limited_tournaments', 'video_required', 'manual_review'],
          review_required: true
        })
        .eq('user_id', targetUserId)
    } else if (newScore >= 30 && currentTrust.score < 30) {
      // User recovered - remove some restrictions
      await supabase
        .from('trust_scores')
        .update({
          restrictions: [],
          review_required: false
        })
        .eq('user_id', targetUserId)
    }
    
    return NextResponse.json({
      success: true,
      trustScore: {
        userId: targetUserId,
        score: newScore,
        level: newLevel,
        previousScore: currentTrust.score,
        change: body.adjustment,
        reason: body.reason
      }
    }, { status: 200 })
    
  } catch (error) {
    console.error('Update trust score error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Recalculate trust score
export async function PUT(request: NextRequest) {
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
    const targetUserId = searchParams.get('userId') || session.user.id
    
    // Users can only recalculate their own score
    if (targetUserId !== session.user.id) {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      
      if (!profile || profile.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Cannot recalculate other users trust scores' },
          { status: 403 }
        )
      }
    }
    
    // Recalculate score
    const newScore = await recalculateTrustScore(supabase, targetUserId)
    const newLevel = getTrustLevel(newScore)
    
    // Update trust score
    const { error: updateError } = await supabase
      .from('trust_scores')
      .update({
        score: newScore,
        trust_level: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', targetUserId)
    
    if (updateError) {
      console.error('Trust score recalculation error:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to recalculate trust score' },
        { status: 500 }
      )
    }
    
    // Log the recalculation
    await supabase
      .from('anticheat_logs')
      .insert({
        user_id: targetUserId,
        log_type: 'trust_score_recalculation',
        log_level: 'info',
        component: 'trust_system',
        message: `Trust score recalculated: ${newScore} (${newLevel})`,
        data: {
          new_score: newScore,
          new_level: newLevel,
          triggered_by: session.user.id
        },
        created_at: new Date().toISOString()
      })
    
    return NextResponse.json({
      success: true,
      message: 'Trust score recalculated successfully',
      trustScore: {
        userId: targetUserId,
        score: newScore,
        level: newLevel
      }
    }, { status: 200 })
    
  } catch (error) {
    console.error('Recalculate trust score error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}