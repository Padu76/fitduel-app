import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Types aligned with your updated database
interface CalibrationData {
  id?: string
  user_id: string
  
  // Personal data
  age: number
  weight: number
  height: number
  gender: 'male' | 'female' | 'other'
  
  // Fitness data (aligned with database)
  fitness_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  years_experience: number  // Changed from experience_years
  primary_sport: string     // Changed from sport_background
  sport_category: 'endurance' | 'strength' | 'power' | 'mixed' | 'flexibility'  // Changed from primary_activity_type
  goals: string[]           // Changed from target_goals
  workout_duration_preference: number  // Changed from preferred_workout_duration
  
  // AI personalization fields (new)
  baseline_angles?: Record<string, number>
  body_proportions?: Record<string, number>
  movement_range?: Record<string, number>
  ai_parameters?: Record<string, any>
  personalized_thresholds?: Record<string, any>
  
  // Legacy fields
  medical_conditions?: string[]
  ai_movement_calibrated?: boolean
  calibration_score?: number
}

// GET - Fetch user calibration data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID è richiesto' },
        { status: 400 }
      )
    }

    console.log('Fetching calibration for user:', userId)

    // Fetch calibration data with profile data for AI personalization
    const { data: calibration, error } = await supabase
      .from('user_calibrations')
      .select(`
        *,
        profiles!inner(
          age,
          gender
        )
      `)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching calibration:', error)
      return NextResponse.json(
        { error: 'Errore nel recupero dei dati di calibrazione' },
        { status: 500 }
      )
    }

    // If no calibration exists, return structured response
    if (!calibration) {
      return NextResponse.json({
        success: true,
        calibration: null,
        needsCalibration: true
      })
    }

    // Transform data for AI personalization system
    const personalizedData = {
      // Personal data
      age: calibration.profiles?.age || calibration.age || 25,
      weight: calibration.weight,
      height: calibration.height, 
      gender: calibration.profiles?.gender || calibration.gender,
      
      // Fitness data
      fitness_level: calibration.fitness_level,
      years_experience: calibration.years_experience,
      workout_duration: calibration.workout_duration_preference,
      
      // Sport categorization
      primary_sport: calibration.primary_sport,
      sport_category: calibration.sport_category,
      goals: calibration.goals || [],
      
      // AI personalization data
      baseline_angles: calibration.baseline_angles || {},
      body_proportions: calibration.body_proportions || {},
      movement_range: calibration.movement_range || {},
      ai_parameters: calibration.ai_parameters || {},
      personalized_thresholds: calibration.personalized_thresholds || {},
      
      // Metadata
      ai_calibrated_at: calibration.ai_calibrated_at,
      created_at: calibration.created_at,
      updated_at: calibration.updated_at
    }

    return NextResponse.json({
      success: true,
      calibration: personalizedData,
      needsCalibration: false
    })

  } catch (error) {
    console.error('GET /api/calibration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create or update user calibration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received calibration data:', body)

    // Extract user_id and calibration data
    const { userId, calibrationData, aiCalibrationData = {} } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID è richiesto' },
        { status: 400 }
      )
    }

    if (!calibrationData) {
      return NextResponse.json(
        { error: 'Dati di calibrazione richiesti' },
        { status: 400 }
      )
    }

    // Validate data
    const validationErrors = validateCalibrationData(calibrationData)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Dati non validi', details: validationErrors },
        { status: 400 }
      )
    }

    // Check if calibration already exists
    const { data: existingCalibration } = await supabase
      .from('user_calibrations')
      .select('id')
      .eq('user_id', userId)
      .single()

    // Prepare data for database (aligned with new schema)
    const dbData = {
      user_id: userId,
      age: calibrationData.age,
      weight: calibrationData.weight,
      height: calibrationData.height,
      gender: calibrationData.gender,
      fitness_level: calibrationData.fitness_level,
      years_experience: calibrationData.years_experience || 0,
      primary_sport: calibrationData.primary_sport || calibrationData.sport_background?.[0] || 'fitness',
      sport_category: calibrationData.sport_category || calibrationData.primary_activity_type || 'mixed',
      goals: calibrationData.goals || calibrationData.target_goals || [],
      workout_duration_preference: calibrationData.workout_duration_preference || calibrationData.preferred_workout_duration || 30,
      
      // AI personalization fields
      baseline_angles: aiCalibrationData.baseline_angles || {},
      body_proportions: aiCalibrationData.body_proportions || {},
      movement_range: aiCalibrationData.movement_range || {},
      ai_parameters: aiCalibrationData.ai_parameters || {},
      personalized_thresholds: aiCalibrationData.personalized_thresholds || {},
      ai_calibrated_at: aiCalibrationData.baseline_angles ? new Date().toISOString() : null,
      
      updated_at: new Date().toISOString()
    }

    let result
    if (existingCalibration) {
      // Update existing calibration
      const { data, error } = await supabase
        .from('user_calibrations')
        .update(dbData)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating calibration:', error)
        return NextResponse.json(
          { error: 'Errore nell\'aggiornamento della calibrazione' },
          { status: 500 }
        )
      }

      result = data
    } else {
      // Create new calibration
      const { data, error } = await supabase
        .from('user_calibrations')
        .insert({
          ...dbData,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating calibration:', error)
        return NextResponse.json(
          { error: 'Errore nella creazione della calibrazione' },
          { status: 500 }
        )
      }

      result = data
    }

    // Calculate XP bonus for calibration completion
    const xpBonus = calculateXPBonus(calibrationData, aiCalibrationData)

    // Update user XP and calibration status in profiles
    if (xpBonus > 0) {
      await updateUserProfile(userId, xpBonus)
    }

    return NextResponse.json({
      success: true,
      message: existingCalibration ? 'Calibrazione aggiornata con successo!' : 'Calibrazione creata con successo!',
      calibration: result,
      xp_bonus: xpBonus
    })

  } catch (error) {
    console.error('POST /api/calibration error:', error)
    return NextResponse.json(
      { error: 'Errore nel salvataggio dei dati di calibrazione' },
      { status: 500 }
    )
  }
}

// Helper function to validate calibration data
function validateCalibrationData(data: any): string[] {
  const errors: string[] = []

  // Age validation
  if (!data.age || data.age < 13 || data.age > 100) {
    errors.push('Età deve essere tra 13 e 100 anni')
  }

  // Weight validation
  if (!data.weight || data.weight < 30 || data.weight > 300) {
    errors.push('Peso deve essere tra 30 e 300 kg')
  }

  // Height validation
  if (!data.height || data.height < 100 || data.height > 250) {
    errors.push('Altezza deve essere tra 100 e 250 cm')
  }

  // Gender validation
  if (!['male', 'female', 'other'].includes(data.gender)) {
    errors.push('Sesso non valido')
  }

  // Fitness level validation
  if (!['beginner', 'intermediate', 'advanced', 'expert'].includes(data.fitness_level)) {
    errors.push('Livello fitness non valido')
  }

  // Experience years validation
  if (data.years_experience < 0 || data.years_experience > 50) {
    errors.push('Anni di esperienza devono essere tra 0 e 50')
  }

  // Sport category validation
  const validCategories = ['endurance', 'strength', 'power', 'mixed', 'flexibility']
  if (data.sport_category && !validCategories.includes(data.sport_category)) {
    errors.push('Categoria sportiva non valida')
  }

  return errors
}

// Helper function to calculate XP bonus (enhanced for AI system)
function calculateXPBonus(calibrationData: any, aiData: any = {}): number {
  let bonus = 0

  // Base completion bonuses
  if (calibrationData.age > 0) bonus += 50
  if (calibrationData.weight > 0) bonus += 50
  if (calibrationData.height > 0) bonus += 50
  if (calibrationData.fitness_level) bonus += 50
  if (calibrationData.primary_sport) bonus += 75
  if (calibrationData.goals?.length > 0) bonus += 50

  // AI calibration bonus
  if (aiData.baseline_angles && Object.keys(aiData.baseline_angles).length > 0) {
    bonus += 150 // Big bonus for AI calibration
  }

  // Full completion bonus
  const completionFields = [
    calibrationData.age > 0,
    calibrationData.weight > 0,
    calibrationData.height > 0,
    calibrationData.fitness_level,
    calibrationData.primary_sport,
    calibrationData.goals?.length > 0
  ].filter(Boolean).length

  if (completionFields >= 5) {
    bonus += 100 // Full completion bonus
  }

  // AI system bonus
  if (aiData.baseline_angles) {
    bonus += 100 // Additional bonus for AI calibration
  }

  return Math.min(bonus, 500) // Cap at 500 XP
}

// Helper function to update user profile (correct table)
async function updateUserProfile(userId: string, xpBonus: number): Promise<void> {
  try {
    // Update profiles table (not users)
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('xp, level')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('Error fetching profile for XP update:', fetchError)
      return
    }

    const currentXP = profile?.xp || 0
    const newXP = currentXP + xpBonus
    const newLevel = calculateLevel(newXP)

    // Update profile with new XP, level, and calibration status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        xp: newXP,
        level: newLevel,
        is_calibrated: true,
        calibration_required: false
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating profile XP:', updateError)
    } else {
      console.log(`Updated user ${userId}: +${xpBonus} XP, level ${newLevel}`)
    }

  } catch (error) {
    console.error('Error in updateUserProfile:', error)
  }
}

// Helper function to calculate level from XP
function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

// DELETE - Remove user calibration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID è richiesto' },
        { status: 400 }
      )
    }

    // Delete calibration from Supabase
    const { error } = await supabase
      .from('user_calibrations')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting calibration:', error)
      return NextResponse.json(
        { error: 'Errore nella cancellazione della calibrazione' },
        { status: 500 }
      )
    }

    // Update profile to reflect calibration removal
    await supabase
      .from('profiles')
      .update({
        is_calibrated: false,
        calibration_required: true
      })
      .eq('id', userId)

    return NextResponse.json({
      success: true,
      message: 'Calibrazione cancellata con successo!'
    })

  } catch (error) {
    console.error('DELETE /api/calibration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}