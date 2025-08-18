'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuthStore } from '@/stores/authStore'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)

  // ====================================
  // CHECK AUTHENTICATION - NO AUTO GUEST
  // ====================================
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1. PRIMA controlla Supabase direttamente
        const supabase = createClientComponentClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log('✅ Authenticated with Supabase:', session.user.email)
          setIsLoading(false)
          return
        }

        // 2. Controlla lo store Zustand
        if (isAuthenticated) {
          console.log('✅ Authenticated via store')
          setIsLoading(false)
          return
        }

        // 3. Aspetta un attimo per dare tempo allo store di inizializzarsi
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 4. Ricontrolla dopo il delay
        if (isAuthenticated) {
          console.log('✅ Authentication found after delay')
          setIsLoading(false)
          return
        }

        // 5. NO GUEST CREATION - REDIRECT TO LOGIN
        console.log('❌ No authentication found, redirecting to /login')
        router.push('/login')

      } catch (error) {
        console.error('Auth check error:', error)
        // In caso di errore, redirect a login per sicurezza
        router.push('/login')
      }
    }

    checkAuth()
  }, [isAuthenticated, router])

  // ====================================
  // LOADING STATE
  // ====================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // ====================================
  // RENDER DASHBOARD
  // ====================================
  return <DashboardContent />
}