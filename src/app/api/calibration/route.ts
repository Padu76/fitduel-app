import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('🔧 Supabase URL:', supabaseUrl ? 'SET' : 'MISSING')
console.log('🔑 Service Key:', supabaseServiceKey ? 'SET' : 'MISSING')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ====================================
// TYPES - Aligned with Settings Page + New Table
// ====================================

interface SettingsCalibrationData {
  // Basic personal info (from Settings page)
  age: number
  gender: 'male' | 'female' | 'other'
  weight: number
  height: number
  
  // Fitness info (from Settings page)
  fitness_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  training_frequency: number
  fitness_experience_years: number
  has_limitations: boolean
  limitations: string[]
  preferred_workout_duration: number
  
  // Sport background (from Settings page)
  sport_background: string[] // ['gym', 'crossfit', 'running', etc.]
  primary_activity_type: 'endurance' | 'strength' | 'power' | 'mixed' | 'flexibility'
  target_goals: string[] // ['weight_loss', 'muscle_gain', etc.]
  
  // Test results (from Settings page)
  pushups_count: number
  squats_count: number
  plank_duration: number
  jumping_jacks_count: number
  burpees_count: number
  lunges_count: number
  mountain_climbers_count: number
  high_knees_count: number
  
  // AI Movement calibration
  ai_movement_calibrated: boolean
  calibration_score: number
  last_updated?: string
}

interface AICalibrationData {
  baseline_angles?: Record<string, number>
  body_proportions?: Record<string, number>
  movement_patterns?: Record<string, any>
  range_of_motion?: Record<string, any>
  form_preferences?: Record<string, any>
}

// ====================================
// GET - Fetch user fitness profile
// ====================================

export async function GET(request: NextRequest) {
  try {
    console.log('🔥 GET /api/calibration called')
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    console.log('👤 User ID:', userId)

    if (!userId) {
      console.log('❌ No userId provided')
      return NextResponse.json(
        { error: 'User ID è richiesto' },
        { status: 400 }
      )
    }

    console.log('🔍 Fetching fitness profile for user:', userId)

    // Test Supabase connection first
    const { data: testConnection, error: testError } = await supabase
      .from('user_fitness_profiles')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('❌ Supabase connection test failed:', testError)
      return NextResponse.json(
        { error: 'Database connection failed', details: testError.message },
        { status: 500 }
      )
    }

    console.log('✅ Supabase connection OK')

    // Query the user_fitness_profiles table
    const { data: fitnessProfile, error } = await supabase
      .from('user_fitness_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    console.log('📊 Query result:', { data: fitnessProfile, error })

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Database query error:', error)
      return NextResponse.json(
        { error: 'Errore nel recupero dei dati di calibrazione', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ GET successful')

    return NextResponse.json({
      success: true,
      calibration: fitnessProfile || null,
      needsCalibration: !fitnessProfile,
      supportsAI: true
    })

  } catch (error) {
    console.error('💥 GET /api/calibration unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ====================================
// POST - Create or update user fitness profile
// ====================================

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 POST /api/calibration called')

    // Step 1: Parse body
    let body
    try {
      body = await request.json()
      console.log('📋 Request body keys:', Object.keys(body))
      console.log('📋 Request body sample:', JSON.stringify({
        userId: body.userId,
        calibrationDataKeys: body.calibrationData ? Object.keys(body.calibrationData) : 'MISSING',
        hasAIData: !!body.aiCalibrationData
      }, null, 2))
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Step 2: Extract data
    const { userId, calibrationData, aiCalibrationData = {} } = body

    console.log('👤 UserId:', userId)
    console.log('📊 CalibrationData keys:', calibrationData ? Object.keys(calibrationData) : 'MISSING')

    if (!userId) {
      console.log('❌ Missing userId')
      return NextResponse.json(
        { error: 'User ID è richiesto' },
        { status: 400 }
      )
    }

    if (!calibrationData) {
      console.log('❌ Missing calibrationData')
      return NextResponse.json(
        { error: 'Dati di calibrazione richiesti' },
        { status: 400 }
      )
    }

    // Step 3: Test database connection and verify user exists
    console.log('🔍 Testing database connection...')
    const { data: userExists, error: testError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (testError) {
      console.error('❌ Database connection test failed:', testError)
      return NextResponse.json(
        { error: 'User not found or database connection failed', details: testError.message },
        { status: 500 }
      )
    }

    console.log('✅ Database connection OK, user exists:', !!userExists)

    // Step 4: Check existing fitness profile
    console.log('🔍 Checking existing fitness profile...')
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_fitness_profiles')
      .select('id, user_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (checkError) {
      console.error('❌ Error checking existing profile:', checkError)
      return NextResponse.json(
        { error: 'Error checking existing profile', details: checkError.message },
        { status: 500 }
      )
    }

    console.log('📋 Existing profile:', existingProfile ? 'EXISTS' : 'NEW')

    // Step 5: Prepare fitness profile record - PERFECTLY MAPPED
    const fitnessProfileRecord = {
      user_id: userId,
      
      // Basic personal info (EXACT mapping from Settings)
      age: calibrationData.age || 25,
      gender: calibrationData.gender || 'male',
      weight: calibrationData.weight || 70,
      height: calibrationData.height || 175,
      
      // Fitness info (EXACT mapping from Settings)
      fitness_level: calibrationData.fitness_level || 'intermediate',
      training_frequency: calibrationData.training_frequency || 3,
      fitness_experience_years: calibrationData.fitness_experience_years || 1,
      has_limitations: calibrationData.has_limitations || false,
      limitations: calibrationData.limitations || [],
      preferred_workout_duration: calibrationData.preferred_workout_duration || 30,
      
      // Sport background (EXACT mapping from Settings)
      sport_background: calibrationData.sport_background || [],
      primary_activity_type: calibrationData.primary_activity_type || 'mixed',
      target_goals: calibrationData.target_goals || [],
      
      // Test results (EXACT mapping from Settings)
      pushups_count: calibrationData.pushups_count || 0,
      squats_count: calibrationData.squats_count || 0,
      plank_duration: calibrationData.plank_duration || 0,
      jumping_jacks_count: calibrationData.jumping_jacks_count || 0,
      burpees_count: calibrationData.burpees_count || 0,
      lunges_count: calibrationData.lunges_count || 0,
      mountain_climbers_count: calibrationData.mountain_climbers_count || 0,
      high_knees_count: calibrationData.high_knees_count || 0,
      
      // AI Movement calibration (from Settings)
      ai_movement_calibrated: calibrationData.ai_movement_calibrated || false,
      calibration_score: calibrationData.calibration_score || 0,
      
      // AI Personalized fields (COMPUTED from Settings data)
      sport_category: mapPrimaryActivityToSportCategory(calibrationData.primary_activity_type),
      years_experience: calibrationData.fitness_experience_years || 1,
      assigned_level: determineAssignedLevel(calibrationData),
      
      // AI Calibration data (from aiCalibrationData)
      baseline_angles: aiCalibrationData.baseline_angles || {},
      body_proportions: aiCalibrationData.body_proportions || {},
      movement_preferences: aiCalibrationData.movement_patterns || {},
      adaptive_thresholds: generateAdaptiveThresholds(calibrationData),
      form_analysis_weights: generateFormAnalysisWeights(calibrationData),
      personalized_feedback: generatePersonalizedFeedback(calibrationData),
      xp_bonus_multipliers: generateXPBonusMultipliers(calibrationData),
      performance_history: [],
      
      // Metadata
      is_ai_enabled: true,
      last_updated: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('💾 Prepared fitness profile record keys:', Object.keys(fitnessProfileRecord))
    console.log('🎯 Sport category mapped:', fitnessProfileRecord.sport_category)
    console.log('🏆 Assigned level:', fitnessProfileRecord.assigned_level)

    let result
    if (existingProfile) {
      console.log('🔄 Updating existing fitness profile...')
      const { data, error } = await supabase
        .from('user_fitness_profiles')
        .update({
          ...fitnessProfileRecord,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating fitness profile:', error)
        return NextResponse.json(
          { error: 'Errore nell\'aggiornamento del profilo fitness', details: error.message },
          { status: 500 }
        )
      }

      result = data
      console.log('✅ Update successful')
    } else {
      console.log('➕ Creating new fitness profile...')
      const { data, error } = await supabase
        .from('user_fitness_profiles')
        .insert({
          ...fitnessProfileRecord,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating fitness profile:', error)
        return NextResponse.json(
          { error: 'Errore nella creazione del profilo fitness', details: error.message },
          { status: 500 }
        )
      }

      result = data
      console.log('✅ Creation successful')
    }

    // Step 6: Update user profile to mark as calibrated
    console.log('🔄 Updating user profile...')
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ 
        is_calibrated: true,
        calibration_required: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (profileUpdateError) {
      console.error('❌ Error updating user profile:', profileUpdateError)
      // Don't fail the entire operation for this
    } else {
      console.log('✅ User profile updated successfully')
    }

    // Step 7: Add XP bonus with personalized multiplier
    const baseXpBonus = 100
    const personalizedMultiplier = fitnessProfileRecord.xp_bonus_multipliers?.calibration_complete || 1.5
    const xpBonus = Math.round(baseXpBonus * personalizedMultiplier)
    
    try {
      // First get current XP
      const { data: currentProfile, error: getError } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', userId)
        .single()

      if (!getError && currentProfile) {
        const newXp = (currentProfile.xp || 0) + xpBonus
        const { error: xpError } = await supabase
          .from('profiles')
          .update({ xp: newXp })
          .eq('id', userId)

        if (!xpError) {
          console.log(`✅ Added ${xpBonus} XP bonus (${currentProfile.xp} → ${newXp})`)
        }
      }
    } catch (xpError) {
      console.log('⚠️ XP bonus failed, but calibration successful')
    }

    console.log('🎉 Fitness profile operation completed successfully')

    return NextResponse.json({
      success: true,
      message: existingProfile ? 'Profilo fitness aggiornato con successo!' : 'Profilo fitness creato con successo!',
      calibration: result,
      xp_bonus: xpBonus,
      is_calibrated: true,
      ai_enabled: true,
      personalized_features: {
        sport_category: fitnessProfileRecord.sport_category,
        assigned_level: fitnessProfileRecord.assigned_level,
        adaptive_thresholds: !!fitnessProfileRecord.adaptive_thresholds,
        personalized_feedback: !!fitnessProfileRecord.personalized_feedback,
        xp_multipliers: !!fitnessProfileRecord.xp_bonus_multipliers
      }
    })

  } catch (error) {
    console.error('💥 POST /api/calibration unexpected error:', error)
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Errore nel salvataggio del profilo fitness', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ====================================
// DELETE - Remove user fitness profile
// ====================================

export async function DELETE(request: NextRequest) {
  try {
    console.log('🔥 DELETE /api/calibration called')

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID è richiesto' },
        { status: 400 }
      )
    }

    // Delete from user_fitness_profiles table
    const { error } = await supabase
      .from('user_fitness_profiles')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('❌ Error deleting fitness profile:', error)
      return NextResponse.json(
        { error: 'Errore nella cancellazione del profilo fitness', details: error.message },
        { status: 500 }
      )
    }

    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        is_calibrated: false,
        calibration_required: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (profileError) {
      console.error('⚠️ Error updating profile after deletion:', profileError)
    }

    return NextResponse.json({
      success: true,
      message: 'Profilo fitness cancellato con successo!'
    })

  } catch (error) {
    console.error('💥 DELETE /api/calibration unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ====================================
// HELPER FUNCTIONS - AI Personalization
// ====================================

function mapPrimaryActivityToSportCategory(primaryActivity: string): 'strength' | 'endurance' | 'power' | 'flexibility' | 'general' {
  const mapping = {
    'strength': 'strength',
    'endurance': 'endurance',
    'power': 'power',
    'flexibility': 'flexibility',
    'mixed': 'general'
  } as const
  
  return mapping[primaryActivity as keyof typeof mapping] || 'general'
}

function calculateCalibrationScore(data: SettingsCalibrationData): number {
  const pushupScore = (data.pushups_count || 0) * 2
  const squatScore = (data.squats_count || 0) * 1.5
  const plankScore = (data.plank_duration || 0) * 1
  const experienceScore = (data.fitness_experience_years || 0) * 10
  
  return Math.round(pushupScore + squatScore + plankScore + experienceScore)
}

function determineAssignedLevel(data: SettingsCalibrationData): string {
  const score = calculateCalibrationScore(data)
  
  if (score > 300) return 'elite'
  if (score > 200) return 'gold'  
  if (score > 120) return 'silver'
  if (score > 60) return 'bronze'
  return 'rookie'
}

function generateAdaptiveThresholds(data: SettingsCalibrationData): Record<string, number> {
  const baseThresholds = {
    form_score_min: 0.7,
    rep_speed_min: 0.5,
    rep_speed_max: 2.0,
    angle_tolerance: 15
  }
  
  // Adjust based on fitness level
  const adjustments = {
    'beginner': { form_score_min: 0.6, angle_tolerance: 20 },
    'intermediate': { form_score_min: 0.7, angle_tolerance: 15 },
    'advanced': { form_score_min: 0.8, angle_tolerance: 10 },
    'expert': { form_score_min: 0.85, angle_tolerance: 8 }
  }
  
  const levelAdjustments = adjustments[data.fitness_level as keyof typeof adjustments] || adjustments.intermediate
  
  return { ...baseThresholds, ...levelAdjustments }
}

function generateFormAnalysisWeights(data: SettingsCalibrationData): Record<string, number> {
  const sportCategory = mapPrimaryActivityToSportCategory(data.primary_activity_type)
  
  const weightsByCategory = {
    'strength': { form: 0.4, tempo: 0.3, range: 0.3 },
    'endurance': { form: 0.3, tempo: 0.4, range: 0.3 },
    'power': { form: 0.3, tempo: 0.5, range: 0.2 },
    'flexibility': { form: 0.2, tempo: 0.3, range: 0.5 },
    'general': { form: 0.35, tempo: 0.35, range: 0.3 }
  }
  
  return weightsByCategory[sportCategory] || weightsByCategory.general
}

function generatePersonalizedFeedback(data: SettingsCalibrationData): Record<string, string[]> {
  const sportCategory = mapPrimaryActivityToSportCategory(data.primary_activity_type)
  
  const feedbackByCategory = {
    'strength': {
      good: ['Controllo perfetto!', 'Forza eccellente!', 'Movimento controllato!'],
      improvement: ['Rallenta per più controllo', 'Focus sulla contrazione', 'Mantieni la tensione']
    },
    'endurance': {
      good: ['Mantieni il ritmo!', 'Resistenza fantastica!', 'Costanza eccellente!'],
      improvement: ['Ritmo più costante', 'Respira regolarmente', 'Mantieni l\'intensità']
    },
    'power': {
      good: ['Esplosivo!', 'Potenza massima!', 'Velocità perfetta!'],
      improvement: ['Più potenza!', 'Accelera il movimento', 'Sfrutta la velocità']
    },
    'flexibility': {
      good: ['Range perfetto!', 'Flessibilità ottima!', 'Movimento fluido!'],
      improvement: ['Aumenta il range', 'Movimento più ampio', 'Stretching profondo']
    },
    'general': {
      good: ['Ottimo lavoro!', 'Forma eccellente!', 'Continua così!'],
      improvement: ['Migliora la forma', 'Focus sul movimento', 'Mantieni il controllo']
    }
  }
  
  return feedbackByCategory[sportCategory] || feedbackByCategory.general
}

function generateXPBonusMultipliers(data: SettingsCalibrationData): Record<string, number> {
  const fitnessLevel = data.fitness_level || 'intermediate'
  const sportCategory = mapPrimaryActivityToSportCategory(data.primary_activity_type)
  
  // Base multipliers by fitness level
  const levelMultipliers = {
    'beginner': 1.2,    // +20% for encouragement
    'intermediate': 1.0, // Standard
    'advanced': 0.9,    // Slightly less (higher standards)
    'expert': 0.8        // Even higher standards
  }
  
  // Category-specific bonuses
  const categoryBonuses = {
    'strength': { perfect_form: 1.3, combo: 1.2 },
    'endurance': { consistency: 1.3, duration: 1.2 },
    'power': { speed: 1.3, explosiveness: 1.2 },
    'flexibility': { range: 1.3, control: 1.2 },
    'general': { overall: 1.2, improvement: 1.1 }
  }
  
  return {
    base_multiplier: levelMultipliers[fitnessLevel as keyof typeof levelMultipliers] || 1.0,
    calibration_complete: 1.5,
    first_session: 1.3,
    consistency_bonus: 1.2,
    ...categoryBonuses[sportCategory as keyof typeof categoryBonuses] || categoryBonuses.general
  }
}