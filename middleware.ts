import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ====================================
// MIDDLEWARE PER AUTENTICAZIONE E CALIBRAZIONE
// Supporta sia sessioni Supabase che cookie API
// ====================================

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  // Get current path
  const pathname = req.nextUrl.pathname
  
  // ====================================
  // PERCORSI PUBBLICI (no auth required)
  // ====================================
  const publicPaths = [
    '/',
    '/auth',
    '/terms',
    '/privacy'
  ]
  
  // Se è un percorso pubblico, permetti accesso
  if (publicPaths.includes(pathname)) {
    return res
  }
  
  // Se è un asset statico o API route, permetti accesso
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/public/') ||
    pathname.includes('.') // file statici
  ) {
    return res
  }

  // ====================================
  // CONTROLLO AUTENTICAZIONE
  // ====================================
  let userId: string | null = null
  let userEmail: string | null = null
  let isAuthenticated = false

  try {
    // 1. Prima controlla i cookie dell'API custom
    const accessToken = req.cookies.get('access_token')?.value
    const userInfo = req.cookies.get('user_info')?.value

    if (accessToken && userInfo) {
      try {
        const parsedUserInfo = JSON.parse(userInfo)
        
        // Verifica se è un token test mode
        if (accessToken.includes('eyJ') === false) { // Base64 test token
          const tokenData = JSON.parse(Buffer.from(accessToken, 'base64').toString())
          if (tokenData.exp > Date.now()) {
            userId = parsedUserInfo.id
            userEmail = parsedUserInfo.email
            isAuthenticated = true
            console.log('✅ Authenticated via API cookies (test mode):', userEmail)
          }
        } else {
          // Token Supabase - verifica con Supabase
          const { data: { user }, error } = await supabase.auth.getUser(accessToken)
          if (user && !error) {
            userId = user.id
            userEmail = user.email || null
            isAuthenticated = true
            console.log('✅ Authenticated via API cookies (Supabase):', userEmail)
          }
        }
      } catch (error) {
        console.log('❌ Invalid API cookie format:', error)
      }
    }

    // 2. Se non autenticato tramite API, controlla sessione Supabase
    if (!isAuthenticated) {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      
      if (session?.user) {
        userId = session.user.id
        userEmail = session.user.email || null
        isAuthenticated = true
        console.log('✅ Authenticated via Supabase session:', userEmail)
      }
    }

    // Se non autenticato con nessun metodo, redirect a auth
    if (!isAuthenticated || !userId) {
      console.log('❌ No authentication found, redirecting to auth')
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/auth'
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // ====================================
    // UTENTE AUTENTICATO - CONTROLLI AGGIUNTIVI
    // ====================================
    
    // Percorsi che NON richiedono calibrazione
    const calibrationExemptPaths = [
      '/calibration',
      '/logout'
    ]
    
    // Se siamo già nella pagina di calibrazione, permetti
    if (calibrationExemptPaths.some(path => pathname.startsWith(path))) {
      return res
    }

    // ====================================
    // CONTROLLO CALIBRAZIONE (solo per Supabase)
    // ====================================
    
    // Per utenti test mode, salta controllo calibrazione
    if (accessToken && !accessToken.includes('eyJ')) {
      console.log('ℹ️ Test mode user, skipping calibration check')
      return res
    }

    // Controlla se l'utente è calibrato (solo per utenti Supabase reali)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_calibrated, calibration_required, role')
      .eq('id', userId)
      .single()
    
    // Se errore nel recupero profilo, permetti accesso
    if (profileError) {
      console.log('ℹ️ Profile not found, allowing access:', profileError.message)
      return res
    }
    
    // Se il profilo non esiste, permetti accesso
    if (!profile) {
      console.log('ℹ️ No profile found, allowing access')
      return res
    }
    
    // Admin bypass - gli admin possono accedere senza calibrazione
    if (profile.role === 'admin') {
      console.log('ℹ️ Admin user, bypassing calibration')
      return res
    }
    
    // Se non è calibrato O calibrazione è richiesta
    if (!profile.is_calibrated || profile.calibration_required) {
      // Evita loop - se stiamo già andando a calibration, permetti
      if (pathname === '/calibration') {
        return res
      }
      
      console.log('📋 User needs calibration, redirecting:', userEmail)
      
      // Per tutti gli altri percorsi, forza calibrazione
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/calibration'
      
      // Salva dove voleva andare per redirect dopo calibrazione
      if (pathname !== '/dashboard') {
        redirectUrl.searchParams.set('redirectTo', pathname)
      }
      
      return NextResponse.redirect(redirectUrl)
    }

    // ====================================
    // CONTROLLO RECALIBRAZIONE PERIODICA
    // ====================================
    
    // Controlla se serve recalibrazione (ogni 3 mesi)
    const { data: calibration } = await supabase
      .from('user_calibration')
      .select('calibration_completed_at, last_recalibration')
      .eq('user_id', userId)
      .single()
    
    if (calibration) {
      const lastCalibration = calibration.last_recalibration || calibration.calibration_completed_at
      if (lastCalibration) {
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        
        if (new Date(lastCalibration) < threeMonthsAgo) {
          // Suggerisci recalibrazione (non forzare)
          res.headers.set('X-Recalibration-Suggested', 'true')
        }
      }
    }

    // ====================================
    // CONTROLLO RUOLI SPECIALI
    // ====================================
    
    // Admin paths protection
    if (pathname.startsWith('/admin')) {
      if (!profile || profile.role !== 'admin') {
        console.log('❌ Non-admin trying to access admin area')
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/dashboard'
        return NextResponse.redirect(redirectUrl)
      }
    }
    
    // Moderator paths protection (future)
    if (pathname.startsWith('/mod')) {
      if (!profile || (profile.role !== 'moderator' && profile.role !== 'admin')) {
        console.log('❌ Non-moderator trying to access mod area')
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/dashboard'
        return NextResponse.redirect(redirectUrl)
      }
    }

    console.log('✅ Access granted to:', pathname, 'for user:', userEmail)
    return res
    
  } catch (error) {
    // In caso di errore, redirect a auth per sicurezza
    console.error('❌ Middleware error:', error)
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth'
    return NextResponse.redirect(redirectUrl)
  }
}

// ====================================
// CONFIGURAZIONE MATCHER
// ====================================
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     * - images and other assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}