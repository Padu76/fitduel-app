'use client'

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { getSupabaseClient, auth, db } from '@/lib/supabase-client'
import type { Profile, UserStats } from '@/lib/supabase-client'

// Extended user type with profile and stats
export interface AuthUser extends User {
  profile?: Profile | null
  stats?: UserStats | null
}

export interface AuthState {
  user: AuthUser | null
  profile: Profile | null
  stats: UserStats | null
  session: Session | null
  loading: boolean
  initialized: boolean
  isAuthenticated: boolean
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  refreshUserData: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  
  const supabase = getSupabaseClient()

  // Fetch user profile and stats
  const fetchUserData = useCallback(async (userId: string) => {
    try {
      console.log('🔍 Fetching user data for:', userId)
      
      const [profileResult, statsResult] = await Promise.allSettled([
        db.profiles.get(userId),
        db.stats.get(userId)
      ])

      let profileData = null
      let statsData = null

      if (profileResult.status === 'fulfilled') {
        profileData = profileResult.value
        console.log('✅ Profile fetched:', profileData.username)
      } else {
        console.error('❌ Profile fetch failed:', profileResult.reason)
      }

      if (statsResult.status === 'fulfilled') {
        statsData = statsResult.value
        console.log('✅ Stats fetched - Level:', statsData.level)
      } else {
        console.warn('⚠️ Stats fetch failed:', statsResult.reason)
        // Stats might not exist for new users, that's ok
      }

      return { profile: profileData, stats: statsData }
    } catch (error) {
      console.error('❌ Error fetching user data:', error)
      return { profile: null, stats: null }
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing auth state...')
        setLoading(true)

        // Get current session
        const currentSession = await auth.getSession()
        
        if (currentSession?.user && mounted) {
          console.log('✅ Found existing session for user:', currentSession.user.id)
          
          setSession(currentSession)
          setUser(currentSession.user)

          // Fetch user profile and stats
          const { profile: profileData, stats: statsData } = await fetchUserData(currentSession.user.id)
          
          if (mounted) {
            setProfile(profileData)
            setStats(statsData)
            
            // Enhance user object with profile and stats
            setUser(prev => prev ? {
              ...prev,
              profile: profileData,
              stats: statsData
            } as AuthUser : null)
          }
        } else {
          console.log('ℹ️ No existing session found')
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error)
      } finally {
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, [fetchUserData])

  // Listen for auth state changes
  useEffect(() => {
    console.log('👂 Setting up auth state listener...')
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔄 Auth state change: ${event}`, session?.user?.id || 'No user')
        
        try {
          setLoading(true)
          setSession(session)

          if (session?.user) {
            // User signed in or session restored
            console.log('✅ User session active')
            
            setUser(session.user)
            
            // Fetch fresh user data
            const { profile: profileData, stats: statsData } = await fetchUserData(session.user.id)
            
            setProfile(profileData)
            setStats(statsData)
            
            // Enhance user object
            setUser({
              ...session.user,
              profile: profileData,
              stats: statsData
            } as AuthUser)

          } else {
            // User signed out or no session
            console.log('❌ No user session')
            setUser(null)
            setProfile(null)
            setStats(null)
          }
        } catch (error) {
          console.error('❌ Error handling auth state change:', error)
        } finally {
          setLoading(false)
          setInitialized(true)
        }
      }
    )

    return () => {
      console.log('🧹 Cleaning up auth listener')
      subscription.unsubscribe()
    }
  }, [supabase.auth, fetchUserData])

  // Sign in function
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true)
      console.log('🔐 Signing in user...')
      
      const result = await auth.signIn(email, password)
      
      if (result.session?.user) {
        console.log('✅ Sign in successful')
        // The auth state change listener will handle updating state
      }
    } catch (error) {
      console.error('❌ Sign in failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Sign up function
  const signUp = useCallback(async (email: string, password: string, username: string) => {
    try {
      setLoading(true)
      console.log('🔐 Signing up new user...')
      
      const result = await auth.signUp(email, password, username)
      
      if (result.user) {
        console.log('✅ Sign up successful')
        // The auth state change listener will handle updating state
      }
    } catch (error) {
      console.error('❌ Sign up failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      console.log('👋 Signing out user...')
      
      await auth.signOut()
      
      // Clear state immediately
      setUser(null)
      setProfile(null)
      setStats(null)
      setSession(null)
      
      console.log('✅ Sign out successful')
    } catch (error) {
      console.error('❌ Sign out failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      console.log('🔄 Refreshing session...')
      
      const result = await auth.refreshSession()
      
      if (result.session) {
        console.log('✅ Session refreshed successfully')
        // The auth state change listener will handle updating state
      }
    } catch (error) {
      console.error('❌ Session refresh failed:', error)
      throw error
    }
  }, [])

  // Refresh user data
  const refreshUserData = useCallback(async () => {
    if (!user?.id) {
      console.warn('⚠️ Cannot refresh user data - no user ID')
      return
    }

    try {
      console.log('🔄 Refreshing user data...')
      
      const { profile: profileData, stats: statsData } = await fetchUserData(user.id)
      
      setProfile(profileData)
      setStats(statsData)
      
      // Update enhanced user object
      setUser(prev => prev ? {
        ...prev,
        profile: profileData,
        stats: statsData
      } as AuthUser : null)
      
      console.log('✅ User data refreshed')
    } catch (error) {
      console.error('❌ Failed to refresh user data:', error)
      throw error
    }
  }, [user?.id, fetchUserData])

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user?.id) {
      throw new Error('User not authenticated')
    }

    try {
      console.log('💾 Updating profile...', Object.keys(updates))
      
      const updatedProfile = await db.profiles.update(user.id, updates)
      
      setProfile(updatedProfile)
      
      // Update enhanced user object
      setUser(prev => prev ? {
        ...prev,
        profile: updatedProfile
      } as AuthUser : null)
      
      console.log('✅ Profile updated successfully')
    } catch (error) {
      console.error('❌ Profile update failed:', error)
      throw error
    }
  }, [user?.id])

  return {
    // State
    user,
    profile,
    stats,
    session,
    loading,
    initialized,
    isAuthenticated: !!user && !!session,
    
    // Actions
    signIn,
    signUp,
    signOut,
    refreshSession,
    refreshUserData,
    updateProfile
  }
}

// Higher-order component to require authentication
export function withAuth<T extends object>(WrappedComponent: React.ComponentType<T>) {
  return function AuthenticatedComponent(props: T) {
    const { isAuthenticated, loading, initialized } = useAuth()

    if (!initialized || loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-8">Please sign in to access this page.</p>
            <button 
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/login'
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Go to Login
            </button>
          </div>
        </div>
      )
    }

    return <WrappedComponent {...props} />
  }
}

// Hook to check specific auth requirements
export function useAuthRequirement() {
  const auth = useAuth()

  const requireAuth = useCallback((redirectTo = '/login') => {
    if (!auth.initialized) {
      return { allowed: false, reason: 'loading' }
    }

    if (!auth.isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo
      }
      return { allowed: false, reason: 'not_authenticated' }
    }

    return { allowed: true, reason: null }
  }, [auth.initialized, auth.isAuthenticated])

  const requireProfile = useCallback((redirectTo = '/profile') => {
    const authCheck = requireAuth()
    if (!authCheck.allowed) {
      return authCheck
    }

    if (!auth.profile) {
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo
      }
      return { allowed: false, reason: 'no_profile' }
    }

    return { allowed: true, reason: null }
  }, [requireAuth, auth.profile])

  const requireCalibration = useCallback((redirectTo = '/calibration') => {
    const profileCheck = requireProfile()
    if (!profileCheck.allowed) {
      return profileCheck
    }

    if (!auth.profile?.is_calibrated) {
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo
      }
      return { allowed: false, reason: 'not_calibrated' }
    }

    return { allowed: true, reason: null }
  }, [requireProfile, auth.profile?.is_calibrated])

  return {
    requireAuth,
    requireProfile,
    requireCalibration,
    auth
  }
}

// Context provider for auth (optional, for complex apps)
const AuthContext = createContext<(AuthState & AuthActions) | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}

// Export types for use in other components
export type { AuthUser, AuthState, AuthActions }
