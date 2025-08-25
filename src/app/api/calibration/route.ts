import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client per API routes (service key)
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

// UTILITY: Ensure user profile exists
async function ensureUserProfile(userId: string, userData?: any) {
  try {
    console.log('🔍 Checking if user profile exists:', userId)
    
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching profile:', fetchError)
      throw fetchError
    }

    if (existingProfile) {
      console.log('✅ Profile exists:', existingProfile.username)
      return { data: existingProfile, error: null }
    }

    console.log('🆕 Profile does not exist, creating new one...')

    // Get user from auth.users to get email
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
    
    let email = userData?.email || 'unknown@example.com'
    if (authUser && !authError) {
      email = authUser.user.email || email
    }

    // Create new profile
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: userData?.username || `user_${userId.slice(0, 8)}`,
        display_name: userData?.display_name || userData?.username || `User ${userId.slice(0, 8)}`,
        email: email,
        is_active: true,
        is_verified: false,
        is_calibrated: false,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error creating profile:', insertError)
      throw insertError
    }

    console.log('✅ New profile created:', newProfile.username)

    // Also create user_stats entry
    const { error: statsError } = await supabase
      .from('user_stats')
      .insert({
        user_id: userId,
        level: 1,
        total_xp: 100,
        current_xp: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (statsError) {
      console.warn('⚠️ Could not create user_stats:', statsError)
      // Non-blocking error
    }

    return { data: newProfile, error: null }
  } catch (error) {
    console.error('❌ Error ensuring user profile:', error)
    return { data: null, error }
  }
}

// UTILITY: Parse calibration data from bio field
function parseCalibrationData(bioField: string | null) {
  if (!bioField) return null
  
  try {
    const parsed = JSON.parse(bioField)
    // Check if it looks like calibration data
    if (parsed && (parsed.calibrated_at || parsed.age || parsed.fitness_level)) {
      return parsed
    }
    return null
  } catch (error) {
    console.warn('Could not parse bio field as JSON:', error)
    return null
  }
}

// GET - Retrieve existing calibration data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    console.log('🔍 GET Calibration for user:', userId)

    // Ensure user profile exists FIRST
    const { data: profile, error: profileError } = await ensureUserProfile(userId)

    if (profileError || !profile) {
      console.error('❌ Could not ensure profile exists:', profileError)
      return NextResponse.json({ error: 'Could not create or get user profile' }, { status: 500 })
    }

    // Get user stats
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (statsError && statsError.code !== 'PGRST116') {
      console.warn('⚠️ Stats fetch error:', statsError)
    }

    // Parse calibration data from bio field
    const savedCalibrationData = parseCalibrationData(profile.bio)

    console.log('✅ GET Success - Current calibration status:', profile.is_calibrated)
    console.log('📊 Saved calibration data:', savedCalibrationData ? 'Found' : 'Not found')

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        username: profile.username,
        is_calibrated: profile.is_calibrated || false,
        current_xp: userStats?.total_xp || 0,
        level: userStats?.level || 1
      },
      calibration_data: savedCalibrationData,
      // For settings page compatibility
      calibration: savedCalibrationData
    })

  } catch (error) {
    console.error('❌ GET Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Save calibration data (supports both formats)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('💾 POST Calibration - Received keys:', Object.keys(body))

    let userId: string
    let calibrationData: any

    // 🔥 SUPPORT BOTH FORMATS
    if (body.calibrationData && body.userId) {
      // Format from settings page
      console.log('📱 Settings format detected')
      userId = body.userId
      calibrationData = body.calibrationData
    } else {
      // Format from calibration page
      console.log('🏋️ Calibration page format detected')
      userId = body.userId
      calibrationData = body
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    console.log('💾 POST Calibration for user:', userId)

    // Ensure user profile exists FIRST
    const { data: currentProfile, error: profileError } = await ensureUserProfile(userId)

    if (profileError || !currentProfile) {
      console.error('❌ Could not ensure profile exists:', profileError)
      return NextResponse.json({ error: 'Could not create user profile' }, { status: 500 })
    }

    // 🔥 IMPROVED XP LOGIC - Check if user has EVER been calibrated
    let hasEverBeenCalibrated = currentProfile.is_calibrated
    
    // Also check if there's existing calibration data in bio
    const existingCalibrationData = parseCalibrationData(currentProfile.bio)
    if (existingCalibrationData && existingCalibrationData.calibrated_at) {
      hasEverBeenCalibrated = true
    }

    const isFirstTimeCalibration = !hasEverBeenCalibrated
    
    console.log('📊 Calibration Status:')
    console.log('  - Is first time:', isFirstTimeCalibration)
    console.log('  - Profile is_calibrated:', currentProfile.is_calibrated)
    console.log('  - Has existing data:', !!existingCalibrationData)

    // Calculate XP reward
    let xpReward = 0
    let shouldAwardXP = false

    if (isFirstTimeCalibration) {
      xpReward = XP_REWARDS.BASE
      shouldAwardXP = true
      console.log('🎁 First calibration - awarding XP:', xpReward)
    } else {
      console.log('♻️ Updating existing calibration - no XP reward')
    }

    // 🔥 PREPARE STRUCTURED CALIBRATION DATA
    const structuredCalibrationData = {
      // User physical info
      age: calibrationData.age || null,
      gender: calibrationData.gender || null,
      weight: calibrationData.weight || null,
      height: calibrationData.height || null,
      
      // Fitness info
      fitness_level: calibrationData.fitness_level || 'beginner',
      experience_years: calibrationData.experience_years || calibrationData.fitness_experience_years || 0,
      training_frequency: calibrationData.training_frequency || null,
      has_limitations: calibrationData.has_limitations || false,
      limitations: Array.isArray(calibrationData.limitations) ? calibrationData.limitations : (calibrationData.limitations ? [calibrationData.limitations] : []),
      
      // Settings page specific fields
      sport_background: calibrationData.sport_background || [],
      primary_activity_type: calibrationData.primary_activity_type || 'mixed',
      target_goals: calibrationData.target_goals || [],
      medical_conditions: calibrationData.medical_conditions || [],
      preferred_workout_duration: calibrationData.preferred_workout_duration || 30,
      
      // Test results (from calibration page)
      test_results: {
        pushups_count: calibrationData.pushups_count || 0,
        squats_count: calibrationData.squats_count || 0,
        plank_duration: calibrationData.plank_duration || 0,
        jumping_jacks_count: calibrationData.jumping_jacks_count || 0,
        burpees_count: calibrationData.burpees_count || 0,
        lunges_count: calibrationData.lunges_count || 0,
        mountain_climbers_count: calibrationData.mountain_climbers_count || 0,
        high_knees_count: calibrationData.high_knees_count || 0
      },
      
      // AI Calibration
      ai_movement_calibrated: calibrationData.ai_movement_calibrated || false,
      
      // Calculated values
      calibration_score: calibrationData.calibration_score || 0,
      assigned_level: calibrationData.assigned_level || 'rookie',
      
      // Timestamps
      calibrated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      
      // Keep track of calibration source
      calibration_source: body.calibrationData ? 'settings' : 'calibration_page'
    }

    console.log('💾 Saving structured calibration data...')

    // 🔥 UPDATE PROFILE WITH CALIBRATION DATA
    const profileUpdateData: any = {
      is_calibrated: true,
      bio: JSON.stringify(structuredCalibrationData),
      updated_at: new Date().toISOString()
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(profileUpdateData)
      .eq('id', userId)
      .select('id, username, email, is_calibrated, bio, created_at, updated_at')
      .single()

    if (updateError) {
      console.error('❌ Profile update error:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    console.log('✅ Profile updated successfully')

    // 🔥 UPDATE USER STATS WITH XP (only if awarding XP)
    if (shouldAwardXP) {
      const { data: currentStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      const newTotalXP = (currentStats?.total_xp || 0) + xpReward
      const newCurrentXP = (currentStats?.current_xp || 0) + xpReward

      const { error: statsUpdateError } = await supabase
        .from('user_stats')
        .upsert({
          user_id: userId,
          total_xp: newTotalXP,
          current_xp: newCurrentXP,
          level: currentStats?.level || 1,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (statsUpdateError) {
        console.warn('⚠️ Stats update error:', statsUpdateError)
      } else {
        console.log('✅ Stats updated - New total XP:', newTotalXP)
      }
    }

    // 🔥 SUCCESS RESPONSE
    const responseMessage = shouldAwardXP 
      ? `Calibrazione completata! Hai guadagnato ${xpReward} XP! 🎉`
      : 'Calibrazione aggiornata con successo! 📊'

    return NextResponse.json({
      success: true,
      message: responseMessage,
      data: {
        user: updatedProfile,
        calibration_data: structuredCalibrationData,
        // For settings page compatibility
        calibration: structuredCalibrationData,
        xp_awarded: shouldAwardXP ? xpReward : 0,
        is_first_time: isFirstTimeCalibration
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
  
  // Basic info completeness (40 points max)
  if (data.age && data.age > 0) score += 10
  if (data.gender) score += 5
  if (data.weight && data.weight > 0) score += 10
  if (data.height && data.height > 0) score += 10
  if (data.fitness_level) score += 5
  
  // Experience and preferences (30 points max)
  if (data.experience_years >= 0) score += 10
  if (data.sport_background && data.sport_background.length > 0) score += 10
  if (data.target_goals && data.target_goals.length > 0) score += 10
  
  // Test results and AI (30 points max)
  if (data.test_results) {
    const testCount = Object.values(data.test_results).filter(val => (val as number) > 0).length
    score += Math.min(20, testCount * 2.5)
  }
  if (data.ai_movement_calibrated) score += 10
  
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
    return NextResponse.json({ 
      message: 'Advanced AI calibration coming soon! 🚀',
      current_level: CALIBRATION_LEVELS.BASE,
      next_level: CALIBRATION_LEVELS.ADVANCED_AI,
      features_coming: [
        'AI-powered workout recommendations',
        'Personalized difficulty scaling',
        'Real-time form feedback',
        'Adaptive goal setting'
      ]
    }, { status: 501 })

  } catch (error) {
    console.error('❌ PUT Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE method to reset calibration (for testing/admin)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    console.log('🗑️ Resetting calibration for user:', userId)

    // Reset profile calibration status
    const { data: resetProfile, error: profileError } = await supabase
      .from('profiles')
      .update({
        is_calibrated: false,
        bio: null, // Clear calibration data
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, username, is_calibrated')
      .single()

    if (profileError) {
      console.error('❌ Error resetting profile:', profileError)
      return NextResponse.json({ error: 'Failed to reset profile' }, { status: 500 })
    }

    console.log('✅ Calibration reset successfully')

    return NextResponse.json({
      success: true,
      message: 'Calibration reset successfully! 🔄',
      data: {
        user: resetProfile
      }
    })

  } catch (error) {
    console.error('❌ DELETE Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}