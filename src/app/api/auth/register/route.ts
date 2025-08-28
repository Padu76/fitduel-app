import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// ====================================
// TYPES & VALIDATION - PASSWORD SEMPLIFICATA
// ====================================
const registerSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(5, 'Password deve essere almeno 5 caratteri'),
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
    xp: 100, // Welcome bonus
    totalXp: 100,
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
    message: 'Registrazione completata con successo! Benvenuto in FitDuel!',
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
// SUPABASE REGISTRATION HANDLER - SIMPLIFIED (TRIGGER HANDLES PROFILE)
// ====================================
async function handleSupabaseRegister(
  supabase: any,
  data: RegisterRequest
): Promise<RegisterResponse> {
  try {
    console.log('🔍 DEBUG: Starting Supabase registration for:', data.email)
    console.log('🔍 DEBUG: Username:', data.username)
    console.log('🔍 DEBUG: Password length:', data.password.length)

    // Create auth user with Supabase Auth - trigger will handle profile creation
    console.log('🔍 DEBUG: Calling supabase.auth.signUp...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username,
          birth_date: data.birthDate,
          fitness_level: data.fitnessLevel,
          goals: data.goals,
          newsletter: data.newsletter,
          display_name: data.username
        }
      }
    })

    if (authError) {
      console.error('❌ DETAILED Supabase auth error:', {
        message: authError.message,
        status: authError.status,
        code: authError.code,
        email: data.email,
        usernameLength: data.username.length,
        passwordLength: data.password.length,
        fullError: authError
      })
      
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        return {
          success: false,
          message: 'Email già registrata',
          error: 'EMAIL_EXISTS'
        }
      }

      if (authError.message.includes('Password')) {
        return {
          success: false,
          message: 'Password non valida: deve essere almeno 6 caratteri',
          error: 'WEAK_PASSWORD'
        }
      }

      return {
        success: false,
        message: `Auth error: ${authError.message} (Code: ${authError.code})`,
        error: authError.message
      }
    }

    if (!authData.user) {
      console.error('❌ DEBUG: No user data returned from signUp')
      return {
        success: false,
        message: 'Errore nella creazione utente',
        error: 'USER_CREATION_FAILED'
      }
    }

    console.log('✅ DEBUG: Auth user created:', authData.user.id)
    console.log('🔍 DEBUG: Auth session:', authData.session ? 'Present' : 'Missing (email confirmation required)')

    // Profile creation is now handled by the trigger automatically
    console.log('✅ DEBUG: Profile and stats created by trigger')

    // Wait a moment to ensure trigger has completed
    await new Promise(resolve => setTimeout(resolve, 100))

    // Fetch the created profile to get the actual username (which may have been modified for uniqueness)
    let finalUsername = data.username
    let finalXp = 100
    let finalLevel = 1

    try {
      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('username, xp, level')
        .eq('id', authData.user.id)
        .single()
      
      if (profile) {
        finalUsername = profile.username
        finalXp = profile.xp
        finalLevel = profile.level
        console.log('✅ DEBUG: Retrieved profile data:', { username: finalUsername, xp: finalXp, level: finalLevel })
      } else {
        console.log('⚠️ DEBUG: Could not fetch profile data, using defaults')
      }
    } catch (profileFetchError) {
      console.log('⚠️ DEBUG: Profile fetch failed, using defaults:', profileFetchError)
    }

    // Return response based on email confirmation requirement
    if (authData.session) {
      console.log('✅ DEBUG: Registration completed with auto-login')
      // Auto-login if email confirmation is disabled
      return {
        success: true,
        message: 'Registrazione completata! Benvenuto in FitDuel!',
        data: {
          user: {
            id: authData.user.id,
            email: authData.user.email || data.email,
            username: finalUsername,
            level: finalLevel,
            xp: finalXp,
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
      console.log('✅ DEBUG: Registration completed, email confirmation required')
      // Email confirmation required
      return {
        success: true,
        message: 'Registrazione completata! Controlla la tua email per confermare l\'account.',
        data: {
          user: {
            id: authData.user.id,
            email: authData.user.email || data.email,
            username: finalUsername,
            level: finalLevel,
            xp: finalXp,
            createdAt: authData.user.created_at
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ DEBUG: Unexpected error during registration:', error)
    return {
      success: false,
      message: 'Si è verificato un errore durante la registrazione',
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
    console.log('🔍 DEBUG: Registration POST request received')
    
    // Parse request body
    const body = await request.json()
    console.log('🔍 DEBUG: Request body parsed:', { 
      email: body.email, 
      username: body.username,
      hasPassword: !!body.password,
      passwordLength: body.password?.length 
    })
    
    // Validate input
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      console.log('❌ DEBUG: Validation failed:', firstError.message)
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
    console.log('✅ DEBUG: Validation passed')

    // Calculate age if birthDate provided
    if (data.birthDate) {
      const birthDate = new Date(data.birthDate)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      
      if (age < 13) {
        console.log('❌ DEBUG: Age requirement not met:', age)
        return NextResponse.json(
          {
            success: false,
            message: 'Devi avere almeno 13 anni per registrarti',
            error: 'AGE_REQUIREMENT'
          },
          { status: 400 }
        )
      }
      console.log('✅ DEBUG: Age check passed:', age)
    }

    // Check if Supabase is configured
    const supabase = getSupabaseClient()
    
    let result: RegisterResponse

    if (!supabase) {
      // Use test mode if Supabase is not configured
      console.log('🔧 DEBUG: Using test mode - Supabase not configured')
      result = await handleTestMode(data)
    } else {
      // Use real Supabase registration
      console.log('🔧 DEBUG: Using Supabase mode')
      result = await handleSupabaseRegister(supabase, data)
    }

    console.log('🔍 DEBUG: Registration result:', { 
      success: result.success, 
      message: result.message,
      hasSession: !!result.data?.session 
    })

    // Set cookies if registration successful with session
    if (result.success && result.data?.session) {
      console.log('🔍 DEBUG: Setting authentication cookies')
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

      console.log('✅ DEBUG: Cookies set successfully')
      return response
    }

    // Return response
    console.log('🔍 DEBUG: Returning response with status:', result.success ? 201 : 400)
    return NextResponse.json(result, { 
      status: result.success ? 201 : 400 
    })

  } catch (error) {
    console.error('❌ DEBUG: Registration route error:', error)
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