import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('🔧 Supabase URL:', supabaseUrl ? 'SET' : 'MISSING')
console.log('🔑 Service Key:', supabaseServiceKey ? 'SET' : 'MISSING')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ====================================
// TYPES - Updated for AI Personalized System
// ====================================

interface CalibrationData {
  // Base user info (from your current page.tsx)
  age: number
  gender: 'male' | 'female' | 'other'
  weight: number
  height: number
  fitness_level: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  training_frequency: number
  fitness_experience_years: number
  has_limitations: boolean
  limitations: string[]
  
  // Test results (from your current page.tsx)
  pushups_count: number
  squats_count: number
  plank_duration: number
  jumping_jacks_count: number
  burpees_count: number
  lunges_count: number
  mountain_climbers_count: number
  high_knees_count: number
  
  // AI Personalized fields (new)
  sport_category?: 'strength' | 'endurance' | 'power' | 'flexibility' | 'general'
  years_experience?: number
  baseline_angles?: Record<string, number>
  body_proportions?: Record<string, number>
  movement_preferences?: Record<string, any>
  calibration_score?: number
  assigned_level?: string
}

interface AICalibrationData {
  adaptive_thresholds?: Record<string, number>
  form_analysis_weights?: Record<string, number>
  personalized_feedback?: Record<string, string[]>
  xp_bonus_multipliers?: Record<string, number>
  performance_history?: any[]
}

// ====================================
// GET - Fetch user calibration data
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

    console.log('🔍 Fetching calibration for user:', userId)

    // Test Supabase connection first
    const { data: testConnection, error: testError } = await supabase
      .from('user_calibrations')
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

    // Query the CORRECT table: user_calibrations (updated schema)
    const { data: calibration, error } = await supabase
      .from('user_calibrations')
      .select('*')
      .eq('user_id', userId)
      .single()

    console.log('📊 Query result:', { data: calibration, error })

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
      calibration: calibration || null,
      needsCalibration: !calibration,
      supportsAI: true // Flag for AI features
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
// POST - Create or update user calibration (FIXED)
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

    // Step 4: Check existing calibration
    console.log('🔍 Checking existing calibration...')
    const { data: existingCalibration, error: checkError } = await supabase
      .from('user_calibrations')
      .select('id, user_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (checkError) {
      console.error('❌ Error checking existing calibration:', checkError)
      return NextResponse.json(
        { error: 'Error checking existing calibration', details: checkError.message },
        { status: 500 }
      )
    }

    console.log('📋 Existing calibration:', existingCalibration ? 'EXISTS' : 'NEW')

    // Step 5: Prepare calibration record - MAPPED TO NEW SCHEMA
    const calibrationRecord = {
      user_id: userId,
      
      // Basic user info (from your page.tsx)
      age: calibrationData.age || 25,
      gender: calibrationData.gender || 'male',
      weight: calibrationData.weight || 70,
      height: calibrationData.height || 175,
      fitness_level: calibrationData.fitness_level || 'intermediate',
      training_frequency: calibrationData.training_frequency || 3,
      fitness_experience_years: calibrationData.fitness_experience_years || 1,
      has_limitations: calibrationData.has_limitations || false,
      limitations: calibrationData.limitations || [],
      
      // Test results (from your page.tsx)
      pushups_count: calibrationData.pushups_count || 20,
      squats_count: calibrationData.squats_count || 30,
      plank_duration: calibrationData.plank_duration || 45,
      jumping_jacks_count: calibrationData.jumping_jacks_count || 35,
      burpees_count: calibrationData.burpees_count || 15,
      lunges_count: calibrationData.lunges_count || 20,
      mountain_climbers_count: calibrationData.mountain_climbers_count || 25,
      high_knees_count: calibrationData.high_knees_count || 35,
      
      // AI Personalized fields (NEW)
      sport_category: calibrationData.sport_category || mapFitnessLevelToSportCategory(calibrationData.fitness_level),
      years_experience: calibrationData.years_experience || calibrationData.fitness_experience_years || 1,
      baseline_angles: calibrationData.baseline_angles || aiCalibrationData.baseline_angles || {},
      body_proportions: calibrationData.body_proportions || aiCalibrationData.body_proportions || {},
      movement_preferences: calibrationData.movement_preferences || aiCalibrationData.movement_preferences || {},
      calibration_score: calibrationData.calibration_score || calculateCalibrationScore(calibrationData),
      assigned_level: calibrationData.assigned_level || determineAssignedLevel(calibrationData),
      
      // AI specific data
      adaptive_thresholds: aiCalibrationData.adaptive_thresholds || generateAdaptiveThresholds(calibrationData),
      form_analysis_weights: aiCalibrationData.form_analysis_weights || generateFormAnalysisWeights(calibrationData),
      personalized_feedback: aiCalibrationData.personalized_feedback || generatePersonalizedFeedback(calibrationData),
      xp_bonus_multipliers: aiCalibrationData.xp_bonus_multipliers || generateXPBonusMultipliers(calibrationData),
      performance_history: aiCalibrationData.performance_history || [],
      
      // Metadata
      is_ai_enabled: true,
      updated_at: new Date().toISOString()
    }

    console.log('💾 Prepared calibration record keys:', Object.keys(calibrationRecord))

    let result
    if (existingCalibration) {
      console.log('🔄 Updating existing calibration...')
      const { data, error } = await supabase
        .from('user_calibrations')
        .update({
          ...calibrationRecord,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating calibration:', error)
        return NextResponse.json(
          { error: 'Errore nell\'aggiornamento della calibrazione', details: error.message },
          { status: 500 }
        )
      }

      result = data
      console.log('✅ Update successful')
    } else {
      console.log('➕ Creating new calibration...')
      const { data, error } = await supabase
        .from('user_calibrations')
        .insert({
          ...calibrationRecord,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating calibration:', error)
        return NextResponse.json(
          { error: 'Errore nella creazione della calibrazione', details: error.message },
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
        // Add AI personalized fields to profile
        sport_category: calibrationRecord.sport_category,
        years_experience: calibrationRecord.years_experience,
        fitness_level: calibrationRecord.fitness_level,
        total_personalized_sessions: 0, // Initialize counter
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
    const personalizedMultiplier = calibrationRecord.xp_bonus_multipliers?.calibration_complete || 1
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

    console.log('🎉 Calibration operation completed successfully')

    return NextResponse.json({
      success: true,
      message: existingCalibration ? 'Calibrazione aggiornata con successo!' : 'Calibrazione creata con successo!',
      calibration: result,
      xp_bonus: xpBonus,
      is_calibrated: true,
      ai_enabled: true,
      personalized_features: {
        sport_category: calibrationRecord.sport_category,
        adaptive_thresholds: !!calibrationRecord.adaptive_thresholds,
        personalized_feedback: !!calibrationRecord.personalized_feedback,
        xp_multipliers: !!calibrationRecord.xp_bonus_multipliers
      }
    })

  } catch (error) {
    console.error('💥 POST /api/calibration unexpected error:', error)
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Errore nel salvataggio dei dati di calibrazione', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ====================================
// DELETE - Remove user calibration
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

    // Delete from user_calibrations table (CORRECTED TABLE NAME)
    const { error } = await supabase
      .from('user_calibrations')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('❌ Error deleting calibration:', error)
      return NextResponse.json(
        { error: 'Errore nella cancellazione della calibrazione', details: error.message },
        { status: 500 }
      )
    }

    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        is_calibrated: false,
        calibration_required: true,
        sport_category: null,
        years_experience: null,
        total_personalized_sessions: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (profileError) {
      console.error('⚠️ Error updating profile after deletion:', profileError)
    }

    return NextResponse.json({
      success: true,
      message: 'Calibrazione cancellata con successo!'
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

function mapFitnessLevelToSportCategory(fitnessLevel: string): 'strength' | 'endurance' | 'power' | 'flexibility' | 'general' {
  const mapping = {
    'beginner': 'general',
    'intermediate': 'general', 
    'advanced': 'strength',
    'elite': 'power'
  } as const
  
  return mapping[fitnessLevel as keyof typeof mapping] || 'general'
}

function calculateCalibrationScore(data: CalibrationData): number {
  const pushupScore = (data.pushups_count || 0) * 2
  const squatScore = (data.squats_count || 0) * 1.5
  const plankScore = (data.plank_duration || 0) * 1
  const experienceScore = (data.fitness_experience_years || 0) * 10
  
  return Math.round(pushupScore + squatScore + plankScore + experienceScore)
}

function determineAssignedLevel(data: CalibrationData): string {
  const score = calculateCalibrationScore(data)
  
  if (score > 300) return 'elite'
  if (score > 200) return 'gold'  
  if (score > 120) return 'silver'
  if (score > 60) return 'bronze'
  return 'rookie'
}

function generateAdaptiveThresholds(data: CalibrationData): Record<string, number> {
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
    'elite': { form_score_min: 0.85, angle_tolerance: 8 }
  }
  
  const levelAdjustments = adjustments[data.fitness_level as keyof typeof adjustments] || adjustments.intermediate
  
  return { ...baseThresholds, ...levelAdjustments }
}

function generateFormAnalysisWeights(data: CalibrationData): Record<string, number> {
  const sportCategory = data.sport_category || mapFitnessLevelToSportCategory(data.fitness_level)
  
  const weightsByCategory = {
    'strength': { form: 0.4, tempo: 0.3, range: 0.3 },
    'endurance': { form: 0.3, tempo: 0.4, range: 0.3 },
    'power': { form: 0.3, tempo: 0.5, range: 0.2 },
    'flexibility': { form: 0.2, tempo: 0.3, range: 0.5 },
    'general': { form: 0.35, tempo: 0.35, range: 0.3 }
  }
  
  return weightsByCategory[sportCategory] || weightsByCategory.general
}

function generatePersonalizedFeedback(data: CalibrationData): Record<string, string[]> {
  const sportCategory = data.sport_category || mapFitnessLevelToSportCategory(data.fitness_level)
  
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

function generateXPBonusMultipliers(data: CalibrationData): Record<string, number> {
  const fitnessLevel = data.fitness_level || 'intermediate'
  const sportCategory = data.sport_category || 'general'
  
  // Base multipliers by fitness level
  const levelMultipliers = {
    'beginner': 1.2,    // +20% for encouragement
    'intermediate': 1.0, // Standard
    'advanced': 0.9,    // Slightly less (higher standards)
    'elite': 0.8        // Even higher standards
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