import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ====================================
// MIDDLEWARE PER CALIBRAZIONE OBBLIGATORIA
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
    '/login',
    '/register',
    '/auth',
    '/terms',
    '/privacy',
    '/api/auth/login',
    '/api/auth/register'
  ]
  
  // Se è un percorso pubblico, permetti accesso
  if (publicPaths.includes(pathname)) {
    return res
  }
  
  // Se è un asset statico o API route, permetti accesso
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') // file statici
  ) {
    return res
  }
  
  // ====================================
  // CONTROLLO AUTENTICAZIONE
  // ====================================
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  // Se non autenticato, redirect al login
  if (!session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // ====================================
  // CONTROLLO CALIBRAZIONE
  // ====================================
  
  // Percorsi che NON richiedono calibrazione
  const calibrationExemptPaths = [
    '/calibration',
    '/api/calibration',
    '/logout'
  ]
  
  // Se siamo già nella pagina di calibrazione, permetti
  if (calibrationExemptPaths.some(path => pathname.startsWith(path))) {
    return res
  }
  
  // Controlla se l'utente è calibrato
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_calibrated, calibration_required, role')
    .eq('id', session.user.id)
    .single()
  
  // Se il profilo non esiste ancora, permetti accesso (verrà creato)
  if (!profile) {
    return res
  }
  
  // ====================================
  // REDIRECT BASATO SU CALIBRAZIONE
  // ====================================
  
  // Se non è calibrato O calibrazione è richiesta
  if (!profile.is_calibrated || profile.calibration_required) {
    // Eccezione per admin - possono accedere senza calibrazione
    if (profile.role === 'admin' && pathname.startsWith('/admin')) {
      return res
    }
    
    // Per tutti gli altri, forza calibrazione
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/calibration'
    
    // Salva dove voleva andare per redirect dopo calibrazione
    if (pathname !== '/dashboard' && pathname !== '/calibration') {
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
    .eq('user_id', session.user.id)
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
    if (profile.role !== 'admin') {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  // Moderator paths protection (future)
  if (pathname.startsWith('/mod')) {
    if (profile.role !== 'moderator' && profile.role !== 'admin') {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  return res
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
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}