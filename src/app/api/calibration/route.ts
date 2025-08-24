import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Calibration levels and XP rewards
const CALIBRATION_LEVELS = {
  NONE: 'none',
  BASE: 'base', 
  ADVANCED_AI: 'advanced_ai'
} as const

const XP_REWARDS = {
  BASE: 250,
  ADVANCED_AI: 500
} as const

// GET - Retrieve existing calibration data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    console.log('🔍 GET Calibration for user:', userId)

    // Check if user exists and get current calibration status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, is_calibrated, calibration_level, xp')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('❌ Profile error:', profileError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get existing calibration data
    const { data: calibrationData, error: calibrationError } = await supabase
      .from('user_fitness_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (calibrationError && calibrationError.code !== 'PGRST116') {
      console.error('❌ Calibration fetch error:', calibrationError)
      return NextResponse.json({ error: 'Failed to fetch calibration data' }, { status: 500 })
    }

    console.log('✅ GET Success - Current level:', profile.calibration_level || 'none')

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        is_calibrated: profile.is_calibrated || false,
        calibration_level: profile.calibration_level || CALIBRATION_LEVELS.NONE,
        current_xp: profile.xp || 0
      },
      calibration_data: calibrationData || null
    })

  } catch (error) {
    console.error('❌ GET Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Save calibration data with XP control
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...calibrationData } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    console.log('💾 POST Calibration for user:', userId)

    // Get current user state
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, is_calibrated, calibration_level, xp')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('❌ Profile not found:', profileError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Determine if this is first-time calibration
    const isFirstTimeCalibration = !currentProfile.is_calibrated || currentProfile.calibration_level === CALIBRATION_LEVELS.NONE
    const currentLevel = currentProfile.calibration_level || CALIBRATION_LEVELS.NONE
    const newLevel = CALIBRATION_LEVELS.BASE // For now, always base level (AI will be separate)

    console.log('📊 Calibration Status:')
    console.log('  - Current level:', currentLevel)
    console.log('  - New level:', newLevel)  
    console.log('  - Is first time:', isFirstTimeCalibration)
    console.log('  - Current XP:', currentProfile.xp)

    // Calculate XP reward
    let xpReward = 0
    let shouldAwardXP = false

    if (isFirstTimeCalibration) {
      xpReward = XP_REWARDS.BASE
      shouldAwardXP = true
      console.log('🎁 First calibration - awarding XP:', xpReward)
    } else if (currentLevel !== newLevel) {
      // Level upgrade - could award difference, but for now just update
      console.log('📈 Level upgrade detected but no XP for same level')
    } else {
      console.log('♻️ Updating existing calibration - no XP reward')
    }

    // Prepare calibration data for user_fitness_profiles
    const fitnessProfileData = {
      user_id: userId,
      // Basic info
      age: calibrationData.age || null,
      weight: calibrationData.weight || null,
      height: calibrationData.height || null,
      gender: calibrationData.gender || null,
      
      // Fitness details
      fitness_level: calibrationData.fitness_level || 'beginner',
      sport_category: calibrationData.sport_background || calibrationData.sport_category || 'general',
      years_experience: calibrationData.years_experience || calibrationData.experience_years || 0,
      primary_activity_type: calibrationData.primary_activity_type || null,
      
      // Goals and limitations
      target_goals: Array.isArray(calibrationData.target_goals) 
        ? calibrationData.target_goals 
        : (calibrationData.target_goals ? [calibrationData.target_goals] : []),
      physical_limitations: Array.isArray(calibrationData.physical_limitations)
        ? calibrationData.physical_limitations
        : (calibrationData.physical_limitations ? [calibrationData.physical_limitations] : []),
        
      // Test results
      pushups_count: calibrationData.pushups_count || null,
      squats_count: calibrationData.squats_count || null,
      plank_duration: calibrationData.plank_duration || null,
      flexibility_score: calibrationData.flexibility_score || null,
      
      // Preferences
      workout_frequency: calibrationData.workout_frequency || null,
      session_duration: calibrationData.session_duration || null,
      preferred_time: calibrationData.preferred_time || null,
      equipment_available: Array.isArray(calibrationData.equipment_available)
        ? calibrationData.equipment_available
        : (calibrationData.equipment_available ? [calibrationData.equipment_available] : []),
        
      // AI-specific data
      calibration_level: newLevel,
      calibration_score: calculateCalibrationScore(calibrationData),
      ai_preferences: {
        motivation_style: calibrationData.motivation_style || 'balanced',
        feedback_frequency: calibrationData.feedback_frequency || 'normal',
        challenge_level: calibrationData.challenge_level || 'progressive'
      },
      
      // Timestamps
      updated_at: new Date().toISOString()
    }

    // Use upsert to handle both insert and update
    const { data: fitnessProfile, error: fitnessError } = await supabase
      .from('user_fitness_profiles')
      .upsert(fitnessProfileData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (fitnessError) {
      console.error('❌ Fitness profile upsert error:', fitnessError)
      return NextResponse.json({ error: 'Failed to save fitness profile' }, { status: 500 })
    }

    // Update user profile with calibration status and XP
    const profileUpdateData: any = {
      is_calibrated: true,
      calibration_level: newLevel,
      updated_at: new Date().toISOString()
    }

    if (shouldAwardXP) {
      profileUpdateData.xp = (currentProfile.xp || 0) + xpReward
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(profileUpdateData)
      .eq('id', userId)
      .select('id, xp, is_calibrated, calibration_level')
      .single()

    if (updateError) {
      console.error('❌ Profile update error:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    console.log('✅ Calibration saved successfully')
    console.log('  - Final XP:', updatedProfile.xp)
    console.log('  - XP awarded this session:', shouldAwardXP ? xpReward : 0)

    return NextResponse.json({
      success: true,
      message: shouldAwardXP 
        ? `Calibrazione completata! Hai guadagnato ${xpReward} XP! 🎉`
        : 'Calibrazione aggiornata con successo! 📊',
      data: {
        user: updatedProfile,
        fitness_profile: fitnessProfile,
        xp_awarded: shouldAwardXP ? xpReward : 0,
        is_first_time: isFirstTimeCalibration,
        calibration_level: newLevel
      }
    })

  } catch (error) {
    console.error('❌ POST Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to calculate calibration score
function calculateCalibrationScore(data: any): number {
  let score = 0
  
  // Basic completeness (40 points max)
  if (data.age) score += 5
  if (data.weight) score += 5
  if (data.height) score += 5
  if (data.gender) score += 5
  if (data.fitness_level) score += 5
  if (data.sport_background || data.sport_category) score += 5
  if (data.years_experience || data.experience_years) score += 5
  if (data.target_goals?.length > 0) score += 5
  
  // Test results (40 points max)  
  if (data.pushups_count) score += 10
  if (data.squats_count) score += 10
  if (data.plank_duration) score += 10
  if (data.flexibility_score) score += 10
  
  // Preferences and details (20 points max)
  if (data.workout_frequency) score += 5
  if (data.session_duration) score += 5  
  if (data.preferred_time) score += 5
  if (data.equipment_available?.length > 0) score += 5
  
  return Math.min(score, 100) // Cap at 100
}

// PUT method for future advanced AI calibration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, aiCalibrationData } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // This will handle advanced AI calibration in the future
    // For now, return not implemented
    return NextResponse.json({ 
      message: 'Advanced AI calibration coming soon!',
      current_level: CALIBRATION_LEVELS.BASE,
      next_level: CALIBRATION_LEVELS.ADVANCED_AI
    }, { status: 501 })

  } catch (error) {
    console.error('❌ PUT Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}