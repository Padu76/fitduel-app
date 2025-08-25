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
        role: 'user',
        xp: 100, // Starting XP
        level: 1, // Starting level
        coins: 100, // Starting coins
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

    // Get existing calibration data from user_calibrations table
    const { data: calibrationData, error: calibrationError } = await supabase
      .from('user_calibrations')
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
        username: profile.username,
        is_calibrated: profile.is_calibrated || false,
        calibration_level: profile.calibration_level || CALIBRATION_LEVELS.NONE,
        current_xp: profile.xp || 0,
        level: profile.level || 1
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
    console.log('📊 Received calibration data keys:', Object.keys(calibrationData))

    // Ensure user profile exists FIRST
    const { data: currentProfile, error: profileError } = await ensureUserProfile(userId, {
      username: calibrationData.username
    })

    if (profileError || !currentProfile) {
      console.error('❌ Could not ensure profile exists:', profileError)
      return NextResponse.json({ error: 'Could not create user profile' }, { status: 500 })
    }

    // Determine if this is first-time calibration
    const isFirstTimeCalibration = !currentProfile.is_calibrated || currentProfile.calibration_level === CALIBRATION_LEVELS.NONE
    const currentLevel = currentProfile.calibration_level || CALIBRATION_LEVELS.NONE
    const newLevel = CALIBRATION_LEVELS.BASE // For now, always base level

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

    // Prepare calibration data for user_calibrations table (based on actual schema)
    const calibrationPayload = {
      user_id: userId,
      
      // Basic fitness data
      fitness_level: calibrationData.fitness_level || 'beginner',
      experience_level: calibrationData.experience_level || 'beginner',
      
      // Goals (ensure it's an array)
      goals: Array.isArray(calibrationData.goals) 
        ? calibrationData.goals 
        : (calibrationData.goals ? [calibrationData.goals] : []),
        
      // Workout preferences
      preferred_workout_types: Array.isArray(calibrationData.preferred_workout_types)
        ? calibrationData.preferred_workout_types
        : (calibrationData.preferred_workout_types ? [calibrationData.preferred_workout_types] : []),
        
      available_equipment: Array.isArray(calibrationData.available_equipment)
        ? calibrationData.available_equipment
        : (calibrationData.available_equipment ? [calibrationData.available_equipment] : []),
        
      workout_frequency: calibrationData.workout_frequency || null,
      workout_duration: calibrationData.workout_duration || null,
      
      // Physical limitations
      physical_limitations: Array.isArray(calibrationData.physical_limitations)
        ? calibrationData.physical_limitations
        : (calibrationData.physical_limitations ? [calibrationData.physical_limitations] : []),
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log('💾 Saving calibration payload:', calibrationPayload)

    // Use upsert to handle both insert and update for user_calibrations
    const { data: calibrationResult, error: calibrationError } = await supabase
      .from('user_calibrations')
      .upsert(calibrationPayload, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (calibrationError) {
      console.error('❌ Calibration upsert error:', calibrationError)
      return NextResponse.json({ 
        error: `Failed to save calibration: ${calibrationError.message}`,
        details: calibrationError 
      }, { status: 500 })
    }

    console.log('✅ Calibration saved successfully')

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
      .select('id, username, xp, level, is_calibrated, calibration_level')
      .single()

    if (updateError) {
      console.error('❌ Profile update error:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    console.log('✅ Profile updated successfully')
    console.log('  - Final XP:', updatedProfile.xp)
    console.log('  - XP awarded this session:', shouldAwardXP ? xpReward : 0)

    // Success response
    return NextResponse.json({
      success: true,
      message: shouldAwardXP 
        ? `Calibrazione completata! Hai guadagnato ${xpReward} XP! 🎉`
        : 'Calibrazione aggiornata con successo! 📊',
      data: {
        user: updatedProfile,
        calibration: calibrationResult,
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
  if (data.fitness_level) score += 10
  if (data.experience_level) score += 10
  if (data.goals?.length > 0) score += 10
  if (data.preferred_workout_types?.length > 0) score += 10
  
  // Preferences (40 points max)
  if (data.workout_frequency) score += 10
  if (data.workout_duration) score += 10
  if (data.available_equipment?.length > 0) score += 10
  if (data.physical_limitations !== undefined) score += 10 // Even empty array counts
  
  // Additional details (20 points max)
  // Could add more specific scoring here
  score += Math.min(20, Object.keys(data).length * 2)
  
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

    // Reset calibration data
    const { error: calibrationError } = await supabase
      .from('user_calibrations')
      .delete()
      .eq('user_id', userId)

    if (calibrationError) {
      console.error('❌ Error deleting calibration:', calibrationError)
    }

    // Reset profile calibration status
    const { data: resetProfile, error: profileError } = await supabase
      .from('profiles')
      .update({
        is_calibrated: false,
        calibration_level: CALIBRATION_LEVELS.NONE,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, username, is_calibrated, calibration_level')
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