// src/app/api/anticheat/report/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// ====================================
// TYPES
// ====================================

interface ReportRequest {
  reportedUserId: string
  performanceId?: string
  duelId?: string
  reportType: 'cheating' | 'macro' | 'bot' | 'video_fake' | 'impossible_performance' | 'account_sharing' | 'boosting' | 'other'
  description: string
  evidenceUrls?: string[]
}

interface ReportResponse {
  success: boolean
  reportId?: string
  message: string
  trustImpact?: {
    reporter: number
    reported: number
  }
}

interface ReportHistoryItem {
  status: string
}

// ====================================
// VALIDATION FUNCTIONS
// ====================================

// Check if reporter is eligible to report
async function validateReporter(
  supabase: any,
  reporterId: string
): Promise<{ eligible: boolean; reason?: string }> {
  try {
    // Get reporter's trust score
    const { data: trustData } = await supabase
      .from('trust_scores')
      .select('score, trust_level')
      .eq('user_id', reporterId)
      .single()
    
    if (!trustData) {
      return { eligible: false, reason: 'No trust score found' }
    }
    
    // Minimum trust score to report
    if (trustData.score < 30) {
      return { eligible: false, reason: 'Trust score too low to submit reports' }
    }
    
    // Check recent report history
    const { count: recentReports } = await supabase
      .from('community_reports')
      .select('*', { count: 'exact', head: true })
      .eq('reporter_id', reporterId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
    
    // Rate limit: max 5 reports per day
    if (recentReports >= 5) {
      return { eligible: false, reason: 'Daily report limit reached' }
    }
    
    // Check false positive rate
    const { data: reportHistory } = await supabase
      .from('community_reports')
      .select('status')
      .eq('reporter_id', reporterId)
      .in('status', ['confirmed', 'rejected'])
      .limit(10)
    
    if (reportHistory && reportHistory.length >= 5) {
      const falsePositives = reportHistory.filter((r: ReportHistoryItem) => r.status === 'rejected').length
      const falsePositiveRate = falsePositives / reportHistory.length
      
      if (falsePositiveRate > 0.6) {
        return { eligible: false, reason: 'Too many false reports in history' }
      }
    }
    
    return { eligible: true }
  } catch (error) {
    console.error('Reporter validation error:', error)
    return { eligible: false, reason: 'Validation error' }
  }
}

// Check if the report is duplicate
async function checkDuplicateReport(
  supabase: any,
  reporterId: string,
  reportedUserId: string,
  performanceId?: string,
  duelId?: string
): Promise<boolean> {
  try {
    let query = supabase
      .from('community_reports')
      .select('id')
      .eq('reporter_id', reporterId)
      .eq('reported_user_id', reportedUserId)
      .in('status', ['pending', 'reviewing'])
    
    if (performanceId) {
      query = query.eq('performance_id', performanceId)
    }
    
    if (duelId) {
      query = query.eq('duel_id', duelId)
    }
    
    const { data } = await query
    
    return data && data.length > 0
  } catch (error) {
    console.error('Duplicate check error:', error)
    return false
  }
}

// Analyze report severity
function analyzeReportSeverity(reportType: string): {
  severity: 'low' | 'medium' | 'high' | 'critical'
  trustImpact: number
} {
  const severityMap: Record<string, { severity: 'low' | 'medium' | 'high' | 'critical'; trustImpact: number }> = {
    'cheating': { severity: 'high' as const, trustImpact: 15 },
    'macro': { severity: 'high' as const, trustImpact: 20 },
    'bot': { severity: 'critical' as const, trustImpact: 30 },
    'video_fake': { severity: 'critical' as const, trustImpact: 25 },
    'impossible_performance': { severity: 'high' as const, trustImpact: 15 },
    'account_sharing': { severity: 'medium' as const, trustImpact: 10 },
    'boosting': { severity: 'medium' as const, trustImpact: 10 },
    'other': { severity: 'low' as const, trustImpact: 5 }
  }
  
  return severityMap[reportType] || { severity: 'low', trustImpact: 5 }
}

// Update trust scores based on report
async function updateTrustScores(
  supabase: any,
  reporterId: string,
  reportedUserId: string,
  reportType: string,
  isPreliminaryAction: boolean = false
): Promise<{ reporterImpact: number; reportedImpact: number }> {
  try {
    const { trustImpact } = analyzeReportSeverity(reportType)
    
    if (isPreliminaryAction) {
      // Preliminary trust impact (can be reversed if report is false)
      const reportedImpact = Math.floor(trustImpact / 2) // Half impact until confirmed
      
      // Reduce reported user's trust score temporarily
      const { data: reportedTrust } = await supabase
        .from('trust_scores')
        .select('score')
        .eq('user_id', reportedUserId)
        .single()
      
      if (reportedTrust) {
        const newScore = Math.max(0, reportedTrust.score - reportedImpact)
        
        await supabase
          .from('trust_scores')
          .update({
            score: newScore,
            review_required: newScore < 50,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', reportedUserId)
        
        // Add restriction if score too low
        if (newScore < 30) {
          await supabase
            .from('trust_scores')
            .update({
              restrictions: ['limited_tournaments', 'video_required']
            })
            .eq('user_id', reportedUserId)
        }
      }
      
      return { reporterImpact: 0, reportedImpact }
    }
    
    // Small reward for reporter (will be adjusted based on report outcome)
    const reporterImpact = 1
    
    await supabase
      .from('trust_scores')
      .update({
        score: supabase.raw('LEAST(100, score + ?)', [reporterImpact]),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', reporterId)
    
    return { reporterImpact, reportedImpact: 0 }
  } catch (error) {
    console.error('Trust score update error:', error)
    return { reporterImpact: 0, reportedImpact: 0 }
  }
}

// Trigger automatic review for serious reports
async function triggerAutomaticReview(
  supabase: any,
  reportId: string,
  reportType: string,
  reportedUserId: string
): Promise<void> {
  try {
    const { severity } = analyzeReportSeverity(reportType)
    
    if (severity === 'critical' || severity === 'high') {
      // Check if multiple reports exist for this user
      const { count } = await supabase
        .from('community_reports')
        .select('*', { count: 'exact', head: true })
        .eq('reported_user_id', reportedUserId)
        .eq('status', 'pending')
      
      if (count >= 3) {
        // Auto-flag for immediate review
        await supabase
          .from('community_reports')
          .update({
            status: 'reviewing',
            updated_at: new Date().toISOString()
          })
          .eq('reported_user_id', reportedUserId)
          .eq('status', 'pending')
        
        // Flag user for review
        await supabase
          .from('trust_scores')
          .update({
            review_required: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', reportedUserId)
        
        // Log automatic action
        await supabase
          .from('anticheat_logs')
          .insert({
            user_id: reportedUserId,
            log_type: 'automatic_review',
            log_level: 'warning',
            component: 'report_system',
            message: 'User flagged for automatic review due to multiple reports',
            data: {
              report_count: count,
              latest_report_id: reportId,
              severity
            },
            created_at: new Date().toISOString()
          })
      }
    }
  } catch (error) {
    console.error('Automatic review trigger error:', error)
  }
}

// ====================================
// MAIN API HANDLERS
// ====================================

// POST - Submit a new report
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
    
    const body: ReportRequest = await request.json()
    
    // Validate request
    if (!body.reportedUserId || !body.reportType || !body.description) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Prevent self-reporting
    if (body.reportedUserId === session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Cannot report yourself' },
        { status: 400 }
      )
    }
    
    // Validate reporter eligibility
    const { eligible, reason } = await validateReporter(supabase, session.user.id)
    if (!eligible) {
      return NextResponse.json(
        { success: false, message: reason || 'Not eligible to submit reports' },
        { status: 403 }
      )
    }
    
    // Check for duplicate report
    const isDuplicate = await checkDuplicateReport(
      supabase,
      session.user.id,
      body.reportedUserId,
      body.performanceId,
      body.duelId
    )
    
    if (isDuplicate) {
      return NextResponse.json(
        { success: false, message: 'You have already reported this incident' },
        { status: 409 }
      )
    }
    
    // Create report
    const { data: report, error: reportError } = await supabase
      .from('community_reports')
      .insert({
        reporter_id: session.user.id,
        reported_user_id: body.reportedUserId,
        performance_id: body.performanceId,
        duel_id: body.duelId,
        report_type: body.reportType,
        description: body.description,
        evidence_urls: body.evidenceUrls || [],
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (reportError || !report) {
      console.error('Report creation error:', reportError)
      return NextResponse.json(
        { success: false, message: 'Failed to create report' },
        { status: 500 }
      )
    }
    
    // Update trust scores (preliminary action)
    const trustImpact = await updateTrustScores(
      supabase,
      session.user.id,
      body.reportedUserId,
      body.reportType,
      true
    )
    
    // Trigger automatic review if needed
    await triggerAutomaticReview(
      supabase,
      report.id,
      body.reportType,
      body.reportedUserId
    )
    
    // Log the report
    await supabase
      .from('anticheat_logs')
      .insert({
        user_id: body.reportedUserId,
        session_id: `report_${report.id}`,
        log_type: 'report_submitted',
        log_level: 'info',
        component: 'report_system',
        message: `Report submitted: ${body.reportType}`,
        data: {
          report_id: report.id,
          reporter_id: session.user.id,
          report_type: body.reportType
        },
        created_at: new Date().toISOString()
      })
    
    const response: ReportResponse = {
      success: true,
      reportId: report.id,
      message: 'Report submitted successfully and will be reviewed',
      trustImpact
    }
    
    return NextResponse.json(response, { status: 201 })
    
  } catch (error) {
    console.error('Report submission error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get user's reports
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
    const type = searchParams.get('type') || 'submitted' // 'submitted' or 'received'
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    let query = supabase
      .from('community_reports')
      .select(`
        *,
        reporter:profiles!reporter_id(id, username, avatar_url),
        reported:profiles!reported_user_id(id, username, avatar_url),
        performance:performances!performance_id(id, reps, form_score),
        duel:duels!duel_id(id, exercise_id)
      `)
    
    if (type === 'submitted') {
      query = query.eq('reporter_id', session.user.id)
    } else {
      query = query.eq('reported_user_id', session.user.id)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    const { data: reports, error, count } = await query
    
    if (error) {
      console.error('Reports fetch error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch reports' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      reports,
      total: count,
      limit,
      offset
    }, { status: 200 })
    
  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update report status (admin only)
export async function PATCH(request: NextRequest) {
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
    
    // Check if user is admin (you should implement proper admin check)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { reportId, status, reviewNotes, actionTaken } = body
    
    if (!reportId || !status) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Get the report
    const { data: report } = await supabase
      .from('community_reports')
      .select('*')
      .eq('id', reportId)
      .single()
    
    if (!report) {
      return NextResponse.json(
        { success: false, message: 'Report not found' },
        { status: 404 }
      )
    }
    
    // Update report
    const { error: updateError } = await supabase
      .from('community_reports')
      .update({
        status,
        reviewed_by: session.user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes,
        action_taken: actionTaken,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
    
    if (updateError) {
      console.error('Report update error:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update report' },
        { status: 500 }
      )
    }
    
    // Handle trust score adjustments based on outcome
    if (status === 'confirmed') {
      // Penalize reported user
      await supabase.rpc('update_trust_score', {
        p_user_id: report.reported_user_id,
        p_adjustment: -20,
        p_reason: `Report confirmed: ${report.report_type}`
      })
      
      // Reward reporter
      await supabase.rpc('update_trust_score', {
        p_user_id: report.reporter_id,
        p_adjustment: 5,
        p_reason: 'Accurate report confirmed'
      })
    } else if (status === 'rejected') {
      // Restore reported user's trust if it was reduced
      await supabase.rpc('update_trust_score', {
        p_user_id: report.reported_user_id,
        p_adjustment: 10,
        p_reason: 'False report cleared'
      })
      
      // Penalize false reporter
      await supabase.rpc('update_trust_score', {
        p_user_id: report.reporter_id,
        p_adjustment: -10,
        p_reason: 'False report submitted'
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Report updated successfully'
    }, { status: 200 })
    
  } catch (error) {
    console.error('Update report error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}