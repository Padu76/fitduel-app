import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('🔧 Supabase URL:', supabaseUrl ? 'SET' : 'MISSING')
console.log('🔑 Service Key:', supabaseServiceKey ? 'SET' : 'MISSING')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Fetch user calibration data
export async function GET(request: NextRequest) {
  try {
    console.log('📥 GET /api/calibration called')
    
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

    // Simplified query first
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
      needsCalibration: !calibration
    })

  } catch (error) {
    console.error('💥 GET /api/calibration unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create or update user calibration
export async function POST(request: NextRequest) {
  try {
    console.log('📥 POST /api/calibration called')

    // Step 1: Parse body
    let body
    try {
      body = await request.json()
      console.log('📋 Request body keys:', Object.keys(body))
      console.log('📋 Request body:', JSON.stringify(body, null, 2))
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

    // Step 3: Test database connection
    console.log('🔍 Testing database connection...')
    const { data: testConn, error: testError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (testError) {
      console.error('❌ Database connection test failed:', testError)
      return NextResponse.json(
        { error: 'Database connection failed', details: testError.message },
        { status: 500 }
      )
    }

    console.log('✅ Database connection OK, user exists:', !!testConn)

    // Step 4: Check existing calibration
    console.log('🔍 Checking existing calibration...')
    const { data: existingCalibration, error: checkError } = await supabase
      .from('user_calibrations')
      .select('id')
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

    // Step 5: Prepare minimal data for testing
    const minimalData = {
      user_id: userId,
      age: calibrationData.age || 25,
      weight: calibrationData.weight || 70,
      height: calibrationData.height || 175,
      gender: calibrationData.gender || 'male',
      fitness_level: calibrationData.fitness_level || 'intermediate',
      years_experience: calibrationData.years_experience || 0,
      primary_sport: calibrationData.primary_sport || 'fitness',
      sport_category: calibrationData.sport_category || 'mixed',
      goals: calibrationData.goals || [],
      workout_duration_preference: calibrationData.workout_duration_preference || 30,
      updated_at: new Date().toISOString()
    }

    console.log('💾 Prepared data:', JSON.stringify(minimalData, null, 2))

    let result
    if (existingCalibration) {
      console.log('🔄 Updating existing calibration...')
      const { data, error } = await supabase
        .from('user_calibrations')
        .update(minimalData)
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
          ...minimalData,
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

    console.log('🎉 Operation completed successfully')

    return NextResponse.json({
      success: true,
      message: existingCalibration ? 'Calibrazione aggiornata con successo!' : 'Calibrazione creata con successo!',
      calibration: result,
      xp_bonus: 100
    })

  } catch (error) {
    console.error('💥 POST /api/calibration unexpected error:', error)
    console.error('💥 Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Errore nel salvataggio dei dati di calibrazione', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Remove user calibration
export async function DELETE(request: NextRequest) {
  try {
    console.log('📥 DELETE /api/calibration called')

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID è richiesto' },
        { status: 400 }
      )
    }

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

    return NextResponse.json({
      success: true,
      message: 'Calibrazione cancellata con successo!'
    })

  } catch (error) {
    console.error('💥 DELETE /api/calibration unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}