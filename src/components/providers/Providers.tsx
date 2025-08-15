'use client'

import { ReactNode } from 'react'
import { NotificationProvider } from '@/components/notifications/NotificationProvider'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      {/* Notification Provider - Real-time notifications */}
      <NotificationProvider>
        {/* Future: SupabaseProvider */}
        {/* Future: AuthProvider */}
        {/* Future: ThemeProvider */}
        {/* Future: StoreProvider (Zustand) */}
        {/* Future: AnalyticsProvider */}
        
        {children}
      </NotificationProvider>
    </>
  )
}