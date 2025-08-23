import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for server operations

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Types
interface CalibrationData {
  id?: string
  user_id: string
  age: number
  weight: number
  height: number
  gender: 'male' | 'female' | 'other'
  fitness_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  experience_years: number
  sport_background: string[]
  primary_activity_type: 'endurance' | 'strength' | 'power' | 'mixed' | 'flexibility'
  target_goals: string[]
  medical_conditions: string[]
  preferred_workout_duration: number
  ai_movement_calibrated: boolean
  calibration_score: number
  last_updated: string
}

// Helper function to verify user authentication
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.split(' ')[1]
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return null
  }

  return user
}

// GET - Fetch user calibration data
export async function GET(request: NextRequest) {
  try {
    // Get user ID from URL path
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const userId = pathParts[pathParts.length - 1] // Extract user ID from /api/calibration/[userId]

    if (!userId || userId === 'calibration') {
      return NextResponse.json(
        { error: 'User ID è richiesto' },
        { status: 400 }
      )
    }

    // Fetch calibration data from Supabase
    const { data: calibration, error } = await supabase
      .from('user_calibrations')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching calibration:', error)
      return NextResponse.json(
        { error: 'Errore nel recupero dei dati di calibrazione' },
        { status: 500 }
      )
    }

    // Return calibration data or null if not found
    return NextResponse.json({
      success: true,
      calibration: calibration || null
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
    const calibrationData: CalibrationData = body

    // Validate required fields
    if (!calibrationData.user_id) {
      return NextResponse.json(
        { error: 'User ID è richiesto' },
        { status: 400 }
      )
    }

    // Validate data types and ranges
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
      .eq('user_id', calibrationData.user_id)
      .single()

    let result
    if (existingCalibration) {
      // Update existing calibration
      const { data, error } = await supabase
        .from('user_calibrations')
        .update({
          age: calibrationData.age,
          weight: calibrationData.weight,
          height: calibrationData.height,
          gender: calibrationData.gender,
          fitness_level: calibrationData.fitness_level,
          experience_years: calibrationData.experience_years,
          sport_background: calibrationData.sport_background,
          primary_activity_type: calibrationData.primary_activity_type,
          target_goals: calibrationData.target_goals,
          medical_conditions: calibrationData.medical_conditions,
          preferred_workout_duration: calibrationData.preferred_workout_duration,
          ai_movement_calibrated: calibrationData.ai_movement_calibrated,
          calibration_score: calibrationData.calibration_score,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', calibrationData.user_id)
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
          user_id: calibrationData.user_id,
          age: calibrationData.age,
          weight: calibrationData.weight,
          height: calibrationData.height,
          gender: calibrationData.gender,
          fitness_level: calibrationData.fitness_level,
          experience_years: calibrationData.experience_years,
          sport_background: calibrationData.sport_background,
          primary_activity_type: calibrationData.primary_activity_type,
          target_goals: calibrationData.target_goals,
          medical_conditions: calibrationData.medical_conditions || [],
          preferred_workout_duration: calibrationData.preferred_workout_duration,
          ai_movement_calibrated: calibrationData.ai_movement_calibrated,
          calibration_score: calibrationData.calibration_score,
          last_updated: new Date().toISOString(),
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
    const xpBonus = calculateXPBonus(calibrationData)

    // Update user XP if there's a bonus
    if (xpBonus > 0) {
      await updateUserXP(calibrationData.user_id, xpBonus)
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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to validate calibration data
function validateCalibrationData(data: CalibrationData): string[] {
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
  if (data.experience_years < 0 || data.experience_years > 50) {
    errors.push('Anni di esperienza devono essere tra 0 e 50')
  }

  // Primary activity type validation
  if (!['endurance', 'strength', 'power', 'mixed', 'flexibility'].includes(data.primary_activity_type)) {
    errors.push('Tipo di attività principale non valido')
  }

  // Workout duration validation
  if (!data.preferred_workout_duration || data.preferred_workout_duration < 10 || data.preferred_workout_duration > 180) {
    errors.push('Durata allenamento deve essere tra 10 e 180 minuti')
  }

  // Calibration score validation
  if (data.ai_movement_calibrated && (data.calibration_score < 0 || data.calibration_score > 100)) {
    errors.push('Score calibrazione deve essere tra 0 e 100')
  }

  return errors
}

// Helper function to calculate XP bonus
function calculateXPBonus(data: CalibrationData): number {
  let bonus = 0

  // Base completion bonuses
  if (data.age > 0) bonus += 50
  if (data.weight > 0) bonus += 50
  if (data.height > 0) bonus += 50
  if (data.sport_background && data.sport_background.length > 0) bonus += 75
  if (data.target_goals && data.target_goals.length > 0) bonus += 50
  if (data.ai_movement_calibrated) bonus += 100

  // Completion multiplier bonus
  const completionFields = [
    data.age > 0,
    data.weight > 0,
    data.height > 0,
    data.sport_background?.length > 0,
    data.target_goals?.length > 0,
    data.ai_movement_calibrated
  ].filter(Boolean).length

  if (completionFields === 6) {
    bonus += 100 // Full completion bonus
  }

  return bonus
}

// Helper function to update user XP
async function updateUserXP(userId: string, xpBonus: number): Promise<void> {
  try {
    // Get current user XP
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('xp, level')
      .eq('id', userId)
      .single()

    if (fetchError || !user) {
      console.error('Error fetching user for XP update:', fetchError)
      return
    }

    const newXP = (user.xp || 0) + xpBonus
    const newLevel = calculateLevel(newXP)

    // Update user XP and level
    const { error: updateError } = await supabase
      .from('users')
      .update({
        xp: newXP,
        level: newLevel
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user XP:', updateError)
    }

  } catch (error) {
    console.error('Error in updateUserXP:', error)
  }
}

// Helper function to calculate level from XP
function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

// DELETE - Remove user calibration (optional)
export async function DELETE(request: NextRequest) {
  try {
    // Get user ID from URL path
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const userId = pathParts[pathParts.length - 1]

    if (!userId || userId === 'calibration') {
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