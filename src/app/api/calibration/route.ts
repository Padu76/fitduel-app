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

    // Get user stats
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (statsError && statsError.code !== 'PGRST116') {
      console.warn('⚠️ Stats fetch error:', statsError)
    }

    console.log('✅ GET Success - Current calibration status:', profile.is_calibrated)

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        username: profile.username,
        is_calibrated: profile.is_calibrated || false,
        current_xp: userStats?.total_xp || 0,
        level: userStats?.level || 1
      },
      calibration_data: {
        // Se in futuro vuoi recuperare dati dalla tabella user_calibrations
        // puoi aggiungerli qui
        is_calibrated: profile.is_calibrated,
        calibrated_at: profile.updated_at
      }
    })

  } catch (error) {
    console.error('❌ GET Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Save calibration data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('💾 POST Calibration - Received data:', Object.keys(body))

    const { 
      userId,
      // User info from calibration
      age,
      gender,
      weight,
      height,
      fitness_level,
      training_frequency,
      fitness_experience_years,
      has_limitations,
      limitations,
      // Test results
      pushups_count,
      squats_count,
      plank_duration,
      jumping_jacks_count,
      burpees_count,
      lunges_count,
      mountain_climbers_count,
      high_knees_count,
      // Calculated values
      calibration_score,
      assigned_level,
      ...otherData
    } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    console.log('💾 POST Calibration for user:', userId)
    console.log('🏋️ Fitness level:', fitness_level)
    console.log('📊 Calibration score:', calibration_score)

    // Ensure user profile exists FIRST
    const { data: currentProfile, error: profileError } = await ensureUserProfile(userId)

    if (profileError || !currentProfile) {
      console.error('❌ Could not ensure profile exists:', profileError)
      return NextResponse.json({ error: 'Could not create user profile' }, { status: 500 })
    }

    // Determine if this is first-time calibration
    const isFirstTimeCalibration = !currentProfile.is_calibrated
    
    console.log('📊 Calibration Status:')
    console.log('  - Is first time:', isFirstTimeCalibration)
    console.log('  - Current profile calibrated:', currentProfile.is_calibrated)

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

    // Prepare calibration data to store in profile as JSON
    const calibrationData = {
      // User physical info
      age: age || null,
      gender: gender || null,
      weight: weight || null,
      height: height || null,
      
      // Fitness info
      fitness_level: fitness_level || 'beginner',
      training_frequency: training_frequency || null,
      fitness_experience_years: fitness_experience_years || 0,
      has_limitations: has_limitations || false,
      limitations: Array.isArray(limitations) ? limitations : (limitations ? [limitations] : []),
      
      // Test results
      test_results: {
        pushups_count: pushups_count || 0,
        squats_count: squats_count || 0,
        plank_duration: plank_duration || 0,
        jumping_jacks_count: jumping_jacks_count || 0,
        burpees_count: burpees_count || 0,
        lunges_count: lunges_count || 0,
        mountain_climbers_count: mountain_climbers_count || 0,
        high_knees_count: high_knees_count || 0
      },
      
      // Calculated values
      calibration_score: calibration_score || 0,
      assigned_level: assigned_level || 'rookie',
      
      // Timestamps
      calibrated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('💾 Saving calibration data to profile...')

    // Update profile with calibration status and data
    const profileUpdateData: any = {
      is_calibrated: true,
      // Store calibration data in a bio field or add a new JSONB field if available
      bio: JSON.stringify(calibrationData), // Using bio field to store calibration data
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

    // Update or create user stats with XP
    if (shouldAwardXP) {
      const { data: currentStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      const newXP = (currentStats?.total_xp || 0) + xpReward
      const newCurrentXP = (currentStats?.current_xp || 0) + xpReward

      const { error: statsUpdateError } = await supabase
        .from('user_stats')
        .upsert({
          user_id: userId,
          total_xp: newXP,
          current_xp: newCurrentXP,
          level: currentStats?.level || 1,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (statsUpdateError) {
        console.warn('⚠️ Stats update error:', statsUpdateError)
        // Non-blocking error
      } else {
        console.log('✅ Stats updated - New XP:', newXP)
      }
    }

    // Success response
    return NextResponse.json({
      success: true,
      message: shouldAwardXP 
        ? `Calibrazione completata! Hai guadagnato ${xpReward} XP! 🎉`
        : 'Calibrazione aggiornata con successo! 📊',
      data: {
        user: updatedProfile,
        calibration_data: calibrationData,
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
  if (data.age) score += 10
  if (data.gender) score += 5
  if (data.weight) score += 10
  if (data.height) score += 10
  if (data.fitness_level) score += 5
  
  // Experience and frequency (30 points max)
  if (data.training_frequency > 0) score += 15
  if (data.fitness_experience_years >= 0) score += 15
  
  // Test results (30 points max)
  const testResults = data.test_results || {}
  const testCount = Object.values(testResults).filter(val => (val as number) > 0).length
  score += Math.min(30, testCount * 5)
  
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