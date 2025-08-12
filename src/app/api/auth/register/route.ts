import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// ====================================
// TYPES & VALIDATION
// ====================================
const registerSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string()
    .min(6, 'Password deve essere almeno 6 caratteri')
    .regex(/[A-Z]/, 'Password deve contenere almeno una maiuscola')
    .regex(/[0-9]/, 'Password deve contenere almeno un numero'),
  username: z.string()
    .min(3, 'Username deve essere almeno 3 caratteri')
    .max(20, 'Username massimo 20 caratteri')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username può contenere solo lettere, numeri e underscore'),
  birthDate: z.string().optional(),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  goals: z.array(z.string()).optional(),
  newsletter: z.boolean().optional(),
  terms: z.boolean().refine(val => val === true, {
    message: 'Devi accettare i termini e condizioni'
  })
})

type RegisterRequest = z.infer<typeof registerSchema>

interface RegisterResponse {
  success: boolean
  message: string
  data?: {
    user: {
      id: string
      email: string
      username: string
      level: number
      xp: number
      createdAt: string
    }
    session?: {
      access_token: string
      refresh_token: string
      expires_in: number
    }
  }
  error?: string
}

// ====================================
// SUPABASE CLIENT
// ====================================
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase non configurato - usando modalità test')
    return null
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

// ====================================
// TEST MODE HANDLER
// ====================================
const testUsers: any[] = [] // Store test users in memory

async function handleTestMode(data: RegisterRequest): Promise<RegisterResponse> {
  // Check if email already exists
  if (testUsers.some(u => u.email === data.email)) {
    return {
      success: false,
      message: 'Email già registrata',
      error: 'EMAIL_EXISTS'
    }
  }

  // Check if username already exists
  if (testUsers.some(u => u.username === data.username)) {
    return {
      success: false,
      message: 'Username già in uso',
      error: 'USERNAME_EXISTS'
    }
  }

  // Create new test user
  const newUser = {
    id: `test-user-${Date.now()}`,
    email: data.email,
    username: data.username,
    password: data.password, // In test mode only!
    level: 1,
    xp: 0,
    totalXp: 0,
    birthDate: data.birthDate,
    fitnessLevel: data.fitnessLevel || 'beginner',
    goals: data.goals || [],
    newsletter: data.newsletter || false,
    createdAt: new Date().toISOString(),
    stats: {
      totalDuels: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      streak: 0,
      bestStreak: 0
    }
  }

  // Add to test users
  testUsers.push(newUser)

  // Generate mock token
  const mockToken = Buffer.from(JSON.stringify({
    user_id: newUser.id,
    email: newUser.email,
    exp: Date.now() + 3600000 // 1 ora
  })).toString('base64')

  console.log('✅ Test user created:', newUser.username)

  return {
    success: true,
    message: 'Registrazione completata con successo (modalità test)',
    data: {
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        level: newUser.level,
        xp: newUser.xp,
        createdAt: newUser.createdAt
      },
      session: {
        access_token: mockToken,
        refresh_token: mockToken,
        expires_in: 3600
      }
    }
  }
}

// ====================================
// SUPABASE REGISTRATION HANDLER
// ====================================
async function handleSupabaseRegister(
  supabase: any,
  data: RegisterRequest
): Promise<RegisterResponse> {
  try {
    // Check if username is already taken
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', data.username)
      .single()

    if (existingUser) {
      return {
        success: false,
        message: 'Username già in uso',
        error: 'USERNAME_EXISTS'
      }
    }

    // Create auth user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username,
          birth_date: data.birthDate,
          fitness_level: data.fitnessLevel,
          goals: data.goals,
          newsletter: data.newsletter
        }
      }
    })

    if (authError) {
      console.error('Supabase auth error:', authError)
      
      if (authError.message.includes('already registered')) {
        return {
          success: false,
          message: 'Email già registrata',
          error: 'EMAIL_EXISTS'
        }
      }

      if (authError.message.includes('weak password')) {
        return {
          success: false,
          message: 'Password troppo debole',
          error: 'WEAK_PASSWORD'
        }
      }

      return {
        success: false,
        message: 'Errore durante la registrazione',
        error: authError.message
      }
    }

    if (!authData.user) {
      return {
        success: false,
        message: 'Errore nella creazione utente',
        error: 'USER_CREATION_FAILED'
      }
    }

    // Create profile in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: data.username,
        email: data.email,
        level: 1,
        xp: 0,
        total_xp: 0,
        birth_date: data.birthDate,
        fitness_level: data.fitnessLevel || 'beginner',
        goals: data.goals || [],
        newsletter: data.newsletter || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Continue even if profile creation fails
      // Supabase might handle this with triggers
    }

    // Initialize user stats
    const { error: statsError } = await supabase
      .from('user_stats')
      .insert({
        user_id: authData.user.id,
        total_duels: 0,
        wins: 0,
        losses: 0,
        win_rate: 0,
        current_streak: 0,
        best_streak: 0,
        total_exercises: 0,
        favorite_exercise: null,
        fitness_score: 0,
        avg_form_score: 0
      })

    if (statsError) {
      console.error('Stats creation error:', statsError)
      // Non-critical, continue
    }

    // Add welcome bonus XP
    const welcomeBonus = 100
    await supabase
      .from('xp_transactions')
      .insert({
        user_id: authData.user.id,
        amount: welcomeBonus,
        type: 'bonus',
        description: 'Bonus di benvenuto',
        created_at: new Date().toISOString()
      })

    // Update profile with bonus XP
    await supabase
      .from('profiles')
      .update({ 
        xp: welcomeBonus,
        total_xp: welcomeBonus
      })
      .eq('id', authData.user.id)

    // Return response based on email confirmation requirement
    if (authData.session) {
      // Auto-login if email confirmation is disabled
      return {
        success: true,
        message: 'Registrazione completata! Benvenuto in FitDuel!',
        data: {
          user: {
            id: authData.user.id,
            email: authData.user.email || data.email,
            username: data.username,
            level: 1,
            xp: welcomeBonus,
            createdAt: authData.user.created_at
          },
          session: {
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
            expires_in: authData.session.expires_in || 3600
          }
        }
      }
    } else {
      // Email confirmation required
      return {
        success: true,
        message: 'Registrazione completata! Controlla la tua email per confermare l\'account.',
        data: {
          user: {
            id: authData.user.id,
            email: authData.user.email || data.email,
            username: data.username,
            level: 1,
            xp: welcomeBonus,
            createdAt: authData.user.created_at
          }
        }
      }
    }

  } catch (error) {
    console.error('Unexpected error during registration:', error)
    return {
      success: false,
      message: 'Si è verificato un errore inaspettato',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    }
  }
}

// ====================================
// CHECK USERNAME AVAILABILITY
// ====================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username || username.length < 3) {
      return NextResponse.json({
        available: false,
        message: 'Username non valido'
      })
    }

    const supabase = getSupabaseClient()

    if (!supabase) {
      // Test mode: check in memory
      const exists = testUsers.some(u => u.username.toLowerCase() === username.toLowerCase())
      return NextResponse.json({
        available: !exists,
        message: exists ? 'Username già in uso' : 'Username disponibile'
      })
    }

    // Check in Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Username check error:', error)
      return NextResponse.json({
        available: false,
        message: 'Errore nel controllo username'
      })
    }

    return NextResponse.json({
      available: !data,
      message: data ? 'Username già in uso' : 'Username disponibile'
    })

  } catch (error) {
    console.error('Username check error:', error)
    return NextResponse.json(
      {
        available: false,
        message: 'Errore del server'
      },
      { status: 500 }
    )
  }
}

// ====================================
// MAIN REGISTRATION HANDLER
// ====================================
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate input
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return NextResponse.json(
        {
          success: false,
          message: firstError.message,
          error: 'VALIDATION_ERROR'
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // Calculate age if birthDate provided
    if (data.birthDate) {
      const birthDate = new Date(data.birthDate)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      
      if (age < 13) {
        return NextResponse.json(
          {
            success: false,
            message: 'Devi avere almeno 13 anni per registrarti',
            error: 'AGE_REQUIREMENT'
          },
          { status: 400 }
        )
      }
    }

    // Check if Supabase is configured
    const supabase = getSupabaseClient()
    
    let result: RegisterResponse

    if (!supabase) {
      // Use test mode if Supabase is not configured
      console.log('📝 Registration attempt (test mode):', data.email)
      result = await handleTestMode(data)
    } else {
      // Use real Supabase registration
      console.log('📝 Registration attempt (Supabase):', data.email)
      result = await handleSupabaseRegister(supabase, data)
    }

    // Set cookies if registration successful with session
    if (result.success && result.data?.session) {
      const response = NextResponse.json(result)
      
      // Set auth cookies
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days for new users
      }

      response.cookies.set('access_token', result.data.session.access_token, cookieOptions)
      response.cookies.set('refresh_token', result.data.session.refresh_token, cookieOptions)
      
      // Set user info cookie (not httpOnly so client can read it)
      response.cookies.set('user_info', JSON.stringify({
        id: result.data.user.id,
        email: result.data.user.email,
        username: result.data.user.username,
        level: result.data.user.level
      }), {
        ...cookieOptions,
        httpOnly: false
      })

      return response
    }

    // Return response
    return NextResponse.json(result, { 
      status: result.success ? 201 : 400 
    })

  } catch (error) {
    console.error('Registration route error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Errore del server',
        error: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    )
  }
}