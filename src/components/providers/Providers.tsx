'use client'

import { ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  // Qui aggiungeremo i vari provider man mano che sviluppiamo
  // Per ora è un wrapper semplice che prepara la struttura
  
  return (
    <>
      {/* Future: SupabaseProvider */}
      {/* Future: AuthProvider */}
      {/* Future: ThemeProvider */}
      {/* Future: StoreProvider (Zustand) */}
      {/* Future: ToastProvider */}
      {/* Future: AnalyticsProvider */}
      
      {children}
    </>
  )
}