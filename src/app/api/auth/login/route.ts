import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// ====================================
// TYPES & VALIDATION
// ====================================
const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Password deve essere almeno 6 caratteri'),
  rememberMe: z.boolean().optional()
})

type LoginRequest = z.infer<typeof loginSchema>

interface LoginResponse {
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
    session: {
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
async function handleTestMode(email: string, password: string): Promise<LoginResponse> {
  // Account demo per testing
  const testAccounts = [
    {
      email: 'demo@fitduel.com',
      password: 'demo123',
      user: {
        id: 'test-user-1',
        email: 'demo@fitduel.com',
        username: 'DemoChampion',
        level: 12,
        xp: 15840,
        createdAt: new Date('2024-01-01').toISOString()
      }
    },
    {
      email: 'test@fitduel.com',
      password: 'test123',
      user: {
        id: 'test-user-2',
        email: 'test@fitduel.com',
        username: 'TestWarrior',
        level: 5,
        xp: 3250,
        createdAt: new Date('2024-02-01').toISOString()
      }
    }
  ]

  const account = testAccounts.find(
    acc => acc.email === email && acc.password === password
  )

  if (!account) {
    return {
      success: false,
      message: 'Credenziali non valide',
      error: 'INVALID_CREDENTIALS'
    }
  }

  // Genera token fittizio per test
  const mockToken = Buffer.from(JSON.stringify({
    user_id: account.user.id,
    email: account.user.email,
    exp: Date.now() + 3600000 // 1 ora
  })).toString('base64')

  return {
    success: true,
    message: 'Login effettuato con successo (modalità test)',
    data: {
      user: account.user,
      session: {
        access_token: mockToken,
        refresh_token: mockToken,
        expires_in: 3600
      }
    }
  }
}

// ====================================
// SUPABASE AUTH HANDLER
// ====================================
async function handleSupabaseLogin(
  supabase: any,
  email: string,
  password: string
): Promise<LoginResponse> {
  try {
    // Attempt login with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      console.error('Supabase auth error:', authError)
      
      // Handle specific error cases
      if (authError.message.includes('Invalid login credentials')) {
        return {
          success: false,
          message: 'Email o password non corretti',
          error: 'INVALID_CREDENTIALS'
        }
      }
      
      if (authError.message.includes('Email not confirmed')) {
        return {
          success: false,
          message: 'Per favore conferma la tua email prima di accedere',
          error: 'EMAIL_NOT_CONFIRMED'
        }
      }

      return {
        success: false,
        message: 'Errore durante il login',
        error: authError.message
      }
    }

    if (!authData.user || !authData.session) {
      return {
        success: false,
        message: 'Errore nella risposta di autenticazione',
        error: 'INVALID_RESPONSE'
      }
    }

    // Fetch additional user data from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, level, xp, created_at')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      // Continue even if profile fetch fails
    }

    return {
      success: true,
      message: 'Login effettuato con successo',
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email || email,
          username: profile?.username || email.split('@')[0],
          level: profile?.level || 1,
          xp: profile?.xp || 0,
          createdAt: profile?.created_at || authData.user.created_at
        },
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_in: authData.session.expires_in || 3600
        }
      }
    }
  } catch (error) {
    console.error('Unexpected error during login:', error)
    return {
      success: false,
      message: 'Si è verificato un errore inaspettato',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    }
  }
}

// ====================================
// MAIN LOGIN HANDLER
// ====================================
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate input
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Dati non validi',
          error: validation.error.errors[0].message
        },
        { status: 400 }
      )
    }

    const { email, password, rememberMe } = validation.data

    // Check if Supabase is configured
    const supabase = getSupabaseClient()
    
    let result: LoginResponse

    if (!supabase) {
      // Use test mode if Supabase is not configured
      console.log('📧 Login attempt (test mode):', email)
      result = await handleTestMode(email, password)
    } else {
      // Use real Supabase authentication
      console.log('📧 Login attempt (Supabase):', email)
      result = await handleSupabaseLogin(supabase, email, password)
    }

    // Set cookies if login successful
    if (result.success && result.data) {
      const response = NextResponse.json(result)
      
      // Set auth cookies
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        // Remember me extends cookie life to 30 days, otherwise 1 day
        maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24
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

    // Return error response
    return NextResponse.json(result, { 
      status: result.success ? 200 : 401 
    })

  } catch (error) {
    console.error('Login route error:', error)
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

// ====================================
// LOGOUT HANDLER
// ====================================
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    
    // Sign out from Supabase if configured
    if (supabase) {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Supabase signout error:', error)
      }
    }

    // Clear cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logout effettuato con successo'
    })

    response.cookies.delete('access_token')
    response.cookies.delete('refresh_token')
    response.cookies.delete('user_info')

    return response

  } catch (error) {
    console.error('Logout route error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Errore durante il logout',
        error: 'LOGOUT_ERROR'
      },
      { status: 500 }
    )
  }
}

// ====================================
// CHECK AUTH STATUS
// ====================================
export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('access_token')?.value
    const userInfo = request.cookies.get('user_info')?.value

    if (!accessToken || !userInfo) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'Non autenticato'
      })
    }

    const supabase = getSupabaseClient()
    
    // If Supabase is configured, verify the token
    if (supabase) {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      
      if (error || !user) {
        return NextResponse.json({
          success: false,
          authenticated: false,
          message: 'Token non valido'
        })
      }

      return NextResponse.json({
        success: true,
        authenticated: true,
        user: JSON.parse(userInfo)
      })
    }

    // Test mode: just check if token exists and not expired
    try {
      const tokenData = JSON.parse(Buffer.from(accessToken, 'base64').toString())
      if (tokenData.exp < Date.now()) {
        return NextResponse.json({
          success: false,
          authenticated: false,
          message: 'Token scaduto'
        })
      }

      return NextResponse.json({
        success: true,
        authenticated: true,
        user: JSON.parse(userInfo)
      })
    } catch {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'Token non valido'
      })
    }

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        message: 'Errore verifica autenticazione'
      },
      { status: 500 }
    )
  }
}