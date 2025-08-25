import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

// ====================================
// TYPES (PROFILE INTERFACE UPDATED)
// ====================================

export interface Profile {
  id: string
  username: string
  display_name: string | null
  email: string
  avatar_url: string | null
  bio: string | null
  date_of_birth: string | null
  country: string | null
  role: 'user' | 'premium' | 'moderator' | 'admin'
  is_active: boolean
  is_verified: boolean
  is_calibrated: boolean  // 👈 AGGIUNTA QUESTA PROPRIETÀ
  created_at: string
  updated_at: string
}

export interface UserStats {
  user_id: string
  level: number
  total_xp: number
  current_xp: number
  coins: number
  gems: number
  total_duels: number
  duels_won: number
  duels_lost: number
  duels_draw: number
  win_streak: number
  max_win_streak: number
  total_exercises: number
  total_reps: number
  total_duration: number
  total_calories: number
  average_form_score: number
  daily_streak: number
  max_daily_streak: number
  last_activity_date: string | null
}

export interface Exercise {
  id: string
  code: string
  name: string
  description: string | null
  category: string | null
  muscle_groups: string[]
  met_value: number
  icon: string | null
  video_url: string | null
  instructions: string[]
  common_mistakes: string[]
  is_active: boolean
}

export interface Duel {
  id: string
  type: 'duel' | 'open' | 'tournament' | 'mission'
  status: 'pending' | 'open' | 'active' | 'completed' | 'expired' | 'cancelled'
  challenger_id: string
  challenger?: Profile
  challenged_id: string | null
  challenged?: Profile
  exercise_id: string
  exercise?: Exercise
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  wager_xp: number
  reward_xp: number
  target_reps: number | null
  target_time: number | null
  target_form_score: number | null
  rules: any
  max_participants: number
  current_participants: number
  starts_at: string | null
  expires_at: string | null
  completed_at: string | null
  winner_id: string | null
  is_draw: boolean
  created_at: string
  updated_at: string
}

export interface Performance {
  id: string
  user_id: string
  exercise_id: string
  duel_id: string | null
  reps: number
  duration: number
  form_score: number
  calories_burned: number
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  video_url: string | null
  ai_feedback: any
  device_data: any
  performed_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'duel_invite' | 'duel_accepted' | 'duel_completed' | 'achievement_unlocked' | 'friend_request' | 'level_up' | 'reward'
  title: string
  message: string | null
  data: any
  is_read: boolean
  read_at: string | null
  created_at: string
}

// ====================================
// OPTIMIZED SUPABASE CLIENT - SINGLETON PATTERN
// ====================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables not found. Using demo mode.')
}

// Custom storage implementation with persistence guarantees
const createPersistentStorage = () => {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    }
  }

  return {
    getItem: (key: string) => {
      try {
        return localStorage.getItem(key)
      } catch (error) {
        console.warn('localStorage getItem failed:', error)
        return null
      }
    },
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(key, value)
        // Also try sessionStorage as backup
        sessionStorage.setItem(key + '_backup', value)
      } catch (error) {
        console.warn('localStorage setItem failed:', error)
        // Fallback to sessionStorage only
        try {
          sessionStorage.setItem(key, value)
        } catch (e) {
          console.error('Both localStorage and sessionStorage failed:', e)
        }
      }
    },
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key + '_backup')
      } catch (error) {
        console.warn('Storage removeItem failed:', error)
      }
    }
  }
}

// SINGLETON INSTANCE - QUESTO È IL FIX PRINCIPALE
let supabaseInstance: SupabaseClient | null = null

// Create or get existing Supabase client with OPTIMIZED SINGLETON PATTERN
export function getSupabaseClient(): SupabaseClient {
  // SEMPRE restituisce la stessa istanza se esiste
  if (supabaseInstance) {
    return supabaseInstance
  }

  console.log('🔧 Creating SINGLE Supabase client instance with persistent session config')
  
  supabaseInstance = createClient(
    supabaseUrl || 'https://demo.supabase.co', 
    supabaseAnonKey || 'demo-key', 
    {
      auth: {
        // ENHANCED AUTH CONFIGURATION FOR PERSISTENCE
        autoRefreshToken: true,           // Auto refresh tokens
        persistSession: true,             // Always persist sessions
        detectSessionInUrl: true,         // Detect sessions from URL (useful for auth redirects)
        flowType: 'pkce',                // More secure auth flow
        
        // CUSTOM STORAGE WITH PERSISTENCE GUARANTEES
        storage: createPersistentStorage(),
        storageKey: 'fitduel-auth-token-v2', // Versioned key per evitare conflitti
        
        // EXTENDED SESSION CONFIGURATION
        debug: process.env.NODE_ENV === 'development' ? true : false,
      },
      
      // DATABASE OPTIMIZATIONS
      db: {
        schema: 'public'
      },
      
      // GLOBAL CONFIGURATION
      global: {
        headers: {
          'x-application-name': 'fitduel',
          'x-client-info': 'fitduel-web@1.0.0',
          'x-client-singleton': 'true' // Indica che è singleton
        }
      },
      
      // REALTIME CONFIGURATION
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    }
  )

  // ENHANCED SESSION MONITORING (solo se client-side)
  if (typeof window !== 'undefined') {
    // Monitor session health ogni 5 minuti
    const sessionHealthInterval = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabaseInstance!.auth.getSession()
        if (error) {
          console.warn('⚠️ Session check error:', error)
        } else if (session) {
          console.log('✅ Session healthy, expires at:', new Date(session.expires_at! * 1000))
        }
      } catch (error) {
        console.warn('Session health check failed:', error)
      }
    }, 5 * 60 * 1000)

    // Cleanup interval on page unload
    window.addEventListener('beforeunload', () => {
      clearInterval(sessionHealthInterval)
    })

    // Listen for session events con logging migliorato
    supabaseInstance.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change:', event, session ? `Session active (${session.user?.id})` : 'No session')
      
      switch (event) {
        case 'SIGNED_OUT':
          console.log('👋 User signed out - session cleared')
          break
        case 'SIGNED_IN':
          console.log('👋 User signed in - session established')
          break
        case 'TOKEN_REFRESHED':
          console.log('🔄 Token refreshed successfully')
          break
        case 'INITIAL_SESSION':
          console.log('🔄 Initial session loaded')
          break
      }
    })
  }
  
  return supabaseInstance
}

// Export singleton instance - SEMPRE LA STESSA ISTANZA
export const supabase = getSupabaseClient()

// UTILITY per forzare re-inizializzazione (solo per debug)
export function resetSupabaseClient() {
  console.log('🔄 Forcing Supabase client reset (debug only)')
  supabaseInstance = null
  return getSupabaseClient()
}

// ====================================
// ENHANCED AUTH FUNCTIONS WITH BETTER ERROR HANDLING
// ====================================

export const auth = {
  // Sign up new user
  async signUp(email: string, password: string, username: string) {
    try {
      const client = getSupabaseClient()
      
      // Create auth user
      const { data: authData, error: authError } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: username
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      // Create profile
      const { error: profileError } = await client
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          username,
          display_name: username
        })

      if (profileError) throw profileError

      // Create user stats
      const { error: statsError } = await client
        .from('user_stats')
        .insert({
          user_id: authData.user.id,
          total_xp: 100 // Welcome bonus
        })

      if (statsError) console.warn('User stats creation failed:', statsError)

      return { user: authData.user, session: authData.session }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  },

  // Sign in existing user with enhanced persistence
  async signIn(email: string, password: string) {
    try {
      const client = getSupabaseClient()
      console.log('🔐 Attempting sign in with persistent session...')
      
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      
      console.log('✅ Sign in successful, session will persist')
      return data
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  },

  // Sign out with proper cleanup
  async signOut() {
    try {
      const client = getSupabaseClient()
      console.log('👋 Signing out and clearing session...')
      
      const { error } = await client.auth.signOut()
      if (error) throw error
      
      console.log('✅ Sign out successful')
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  },

  // Get current session with retry logic
  async getSession() {
    try {
      const client = getSupabaseClient()
      let retries = 3
      
      while (retries > 0) {
        try {
          const { data: { session }, error } = await client.auth.getSession()
          
          if (error) {
            console.warn(`Session fetch error (retries left: ${retries - 1}):`, error)
            retries--
            if (retries === 0) throw error
            await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1s before retry
            continue
          }
          
          return session
        } catch (error) {
          retries--
          if (retries === 0) throw error
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    } catch (error) {
      console.error('Get session error after retries:', error)
      return null
    }
  },

  // Get current user with session validation
  async getCurrentUser() {
    try {
      const client = getSupabaseClient()
      
      // First check if we have a valid session
      const session = await this.getSession()
      if (!session) {
        console.log('No session found, user not authenticated')
        return null
      }
      
      // Then get user details
      const { data: { user }, error } = await client.auth.getUser()
      if (error) throw error
      
      return user
    } catch (error) {
      console.error('Get user error:', error)
      return null
    }
  },

  // New: Refresh session manually
  async refreshSession() {
    try {
      const client = getSupabaseClient()
      console.log('🔄 Manually refreshing session...')
      
      const { data, error } = await client.auth.refreshSession()
      if (error) throw error
      
      console.log('✅ Session refreshed successfully')
      return data
    } catch (error) {
      console.error('Session refresh error:', error)
      throw error
    }
  },

  // NEW: Ensure user profile exists (per l'API calibration)
  async ensureUserProfile(userId: string, userData?: any) {
    try {
      const client = getSupabaseClient()
      
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (existingProfile) {
        return { data: existingProfile, error: null }
      }

      // Create new profile if not exists
      const { data: newProfile, error: insertError } = await client
        .from('profiles')
        .insert({
          id: userId,
          username: userData?.username || `user_${userId.slice(0, 8)}`,
          display_name: userData?.display_name || userData?.username || '',
          email: userData?.email || '',
          is_active: true,
          is_verified: false,
          is_calibrated: false, // 👈 AGGIUNTO DEFAULT VALUE
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      return { data: newProfile, error: insertError }
    } catch (error) {
      console.error('Error ensuring user profile:', error)
      return { data: null, error }
    }
  }
}

// ====================================
// DATABASE FUNCTIONS (MANTENUTE IDENTICHE)
// ====================================

export const db = {
  // Profiles
  profiles: {
    async get(userId: string) {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      return data as Profile
    },

    async getByUsername(username: string) {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()
      
      if (error) throw error
      return data as Profile
    },

    async update(userId: string, updates: Partial<Profile>) {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()
      
      if (error) throw error
      return data as Profile
    }
  },

  // User Stats
  stats: {
    async get(userId: string) {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error) throw error
      return data as UserStats
    },

    async update(userId: string, updates: Partial<UserStats>) {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('user_stats')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()
      
      if (error) throw error
      return data as UserStats
    },

    async addXP(userId: string, amount: number, reason: string) {
      const client = getSupabaseClient()
      const { data, error } = await client
        .rpc('add_xp', {
          p_user_id: userId,
          p_amount: amount,
          p_reason: reason
        })
      
      if (error) throw error
      return data
    }
  },

  // Exercises
  exercises: {
    async getAll() {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('exercises')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      return data as Exercise[]
    },

    async getByCode(code: string) {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('exercises')
        .select('*')
        .eq('code', code)
        .single()
      
      if (error) throw error
      return data as Exercise
    }
  },

  // Duels
  duels: {
    async create(duel: Partial<Duel>) {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('duels')
        .insert(duel)
        .select()
        .single()
      
      if (error) throw error
      return data as Duel
    },

    async get(duelId: string) {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('duels')
        .select(`
          *,
          challenger:profiles!challenger_id(*),
          challenged:profiles!challenged_id(*),
          exercise:exercises!exercise_id(*)
        `)
        .eq('id', duelId)
        .single()
      
      if (error) throw error
      return data as Duel
    },

    async getMyDuels(userId: string) {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('duels')
        .select(`
          *,
          challenger:profiles!challenger_id(*),
          challenged:profiles!challenged_id(*),
          exercise:exercises!exercise_id(*)
        `)
        .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Duel[]
    },

    async getOpenDuels() {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('duels')
        .select(`
          *,
          challenger:profiles!challenger_id(*),
          exercise:exercises!exercise_id(*)
        `)
        .in('status', ['open', 'pending'])
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Duel[]
    },

    async accept(duelId: string, userId: string) {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('duels')
        .update({
          challenged_id: userId,
          status: 'active',
          starts_at: new Date().toISOString()
        })
        .eq('id', duelId)
        .select()
        .single()
      
      if (error) throw error
      return data as Duel
    },

    async complete(duelId: string, winnerId: string | null, isDraw: boolean = false) {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('duels')
        .update({
          status: 'completed',
          winner_id: winnerId,
          is_draw: isDraw,
          completed_at: new Date().toISOString()
        })
        .eq('id', duelId)
        .select()
        .single()
      
      if (error) throw error
      return data as Duel
    }
  },

  // Performances
  performances: {
    async create(performance: Partial<Performance>) {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('performances')
        .insert(performance)
        .select()
        .single()
      
      if (error) throw error
      return data as Performance
    },

    async getMyPerformances(userId: string, limit: number = 10) {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('performances')
        .select('*')
        .eq('user_id', userId)
        .order('performed_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data as Performance[]
    },

    async getBestPerformance(userId: string, exerciseId: string) {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('performances')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId)
        .order('reps', { ascending: false })
        .limit(1)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error // Ignore "no rows" error
      return data as Performance | null
    }
  },

  // Notifications
  notifications: {
    async getUnread(userId: string) {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Notification[]
    },

    async markAsRead(notificationId: string) {
      const client = getSupabaseClient()
      const { error } = await client
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
      
      if (error) throw error
    },

    async create(notification: Partial<Notification>) {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('notifications')
        .insert(notification)
        .select()
        .single()
      
      if (error) throw error
      return data as Notification
    }
  },

  // Leaderboard
  leaderboard: {
    async getGlobal(period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'weekly') {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('leaderboard_global')
        .select(`
          *,
          user:profiles!user_id(username, display_name, avatar_url)
        `)
        .eq('period', period)
        .order('rank')
        .limit(100)
      
      if (error) throw error
      return data
    },

    async getByExercise(exerciseId: string, period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'weekly') {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('leaderboard_global')
        .select(`
          *,
          user:profiles!user_id(username, display_name, avatar_url)
        `)
        .eq('period', period)
        .eq('exercise_id', exerciseId)
        .order('rank')
        .limit(100)
      
      if (error) throw error
      return data
    }
  }
}

// ====================================
// REALTIME SUBSCRIPTIONS (MANTENUTE IDENTICHE)
// ====================================

export const realtime = {
  // Subscribe to notifications
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    const client = getSupabaseClient()
    return client
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Notification)
        }
      )
      .subscribe()
  },

  // Subscribe to duel updates
  subscribeToDuel(duelId: string, callback: (duel: Duel) => void) {
    const client = getSupabaseClient()
    return client
      .channel(`duel:${duelId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'duels',
          filter: `id=eq.${duelId}`
        },
        (payload) => {
          callback(payload.new as Duel)
        }
      )
      .subscribe()
  },

  // Unsubscribe from channel
  unsubscribe(channel: any) {
    const client = getSupabaseClient()
    client.removeChannel(channel)
  }
}

// ====================================
// STORAGE FUNCTIONS (MANTENUTE IDENTICHE)
// ====================================

export const storage = {
  // Upload video
  async uploadVideo(file: File, userId: string, performanceId: string) {
    const client = getSupabaseClient()
    const fileName = `${userId}/${performanceId}-${Date.now()}.${file.name.split('.').pop()}`
    
    const { data, error } = await client.storage
      .from('videos')
      .upload(fileName, file)
    
    if (error) throw error
    
    // Get public URL
    const { data: { publicUrl } } = client.storage
      .from('videos')
      .getPublicUrl(fileName)
    
    return publicUrl
  },

  // Upload avatar
  async uploadAvatar(file: File, userId: string) {
    const client = getSupabaseClient()
    const fileName = `${userId}/avatar-${Date.now()}.${file.name.split('.').pop()}`
    
    const { data, error } = await client.storage
      .from('avatars')
      .upload(fileName, file)
    
    if (error) throw error
    
    // Get public URL
    const { data: { publicUrl } } = client.storage
      .from('avatars')
      .getPublicUrl(fileName)
    
    return publicUrl
  },

  // Delete file
  async deleteFile(bucket: string, path: string) {
    const client = getSupabaseClient()
    const { error } = await client.storage
      .from(bucket)
      .remove([path])
    
    if (error) throw error
  }
}

// ====================================
// ENHANCED REACT HOOKS WITH SESSION PERSISTENCE
// ====================================

// Enhanced hook to get current user and profile with persistence
export function useUser() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = getSupabaseClient()
    
    // Get initial session with enhanced checking
    const initializeUser = async () => {
      try {
        console.log('🔍 Checking for existing session...')
        const session = await auth.getSession()
        
        if (session?.user) {
          console.log('✅ Found existing session, restoring user')
          setUser(session.user)
          
          // Fetch profile and stats
          try {
            const [profileData, statsData] = await Promise.all([
              db.profiles.get(session.user.id),
              db.stats.get(session.user.id)
            ])
            setProfile(profileData)
            setStats(statsData)
            console.log('✅ User data restored successfully')
          } catch (error) {
            console.error('Error fetching user data:', error)
          }
        } else {
          console.log('ℹ️ No existing session found')
        }
      } catch (error) {
        console.error('Session initialization error:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeUser()

    // Listen for auth changes with enhanced handling
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔄 Auth state changed: ${event}`)
        
        if (session?.user) {
          setUser(session.user)
          
          // Fetch profile and stats
          try {
            const [profileData, statsData] = await Promise.all([
              db.profiles.get(session.user.id),
              db.stats.get(session.user.id)
            ])
            setProfile(profileData)
            setStats(statsData)
          } catch (error) {
            console.error('Error fetching user data after auth change:', error)
          }
        } else {
          setUser(null)
          setProfile(null)
          setStats(null)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, profile, stats, loading }
}

// Hook for notifications (MANTENUTO IDENTICO)
export function useNotifications() {
  const { user } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return

    // Fetch initial notifications
    db.notifications.getUnread(user.id).then(data => {
      setNotifications(data)
      setUnreadCount(data.length)
    }).catch(console.error)

    // Subscribe to new notifications
    const channel = realtime.subscribeToNotifications(user.id, (notification) => {
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
    })

    return () => {
      realtime.unsubscribe(channel)
    }
  }, [user])

  const markAsRead = async (notificationId: string) => {
    try {
      await db.notifications.markAsRead(notificationId)
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  return { notifications, unreadCount, markAsRead }
}

// Hook for duels (MANTENUTO IDENTICO)
export function useDuels() {
  const { user } = useUser()
  const [myDuels, setMyDuels] = useState<Duel[]>([])
  const [openDuels, setOpenDuels] = useState<Duel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    // Fetch duels
    Promise.all([
      db.duels.getMyDuels(user.id),
      db.duels.getOpenDuels()
    ]).then(([my, open]) => {
      setMyDuels(my)
      setOpenDuels(open.filter(d => d.challenger_id !== user.id))
      setLoading(false)
    }).catch(error => {
      console.error('Error fetching duels:', error)
      setLoading(false)
    })
  }, [user])

  const createDuel = async (duel: Partial<Duel>) => {
    if (!user) throw new Error('User not authenticated')
    
    const newDuel = await db.duels.create({
      ...duel,
      challenger_id: user.id
    })
    
    setMyDuels(prev => [newDuel, ...prev])
    return newDuel
  }

  const acceptDuel = async (duelId: string) => {
    if (!user) throw new Error('User not authenticated')
    
    const updatedDuel = await db.duels.accept(duelId, user.id)
    
    setMyDuels(prev => [updatedDuel, ...prev.filter(d => d.id !== duelId)])
    setOpenDuels(prev => prev.filter(d => d.id !== duelId))
    
    return updatedDuel
  }

  return { myDuels, openDuels, loading, createDuel, acceptDuel }
}

// Export everything
export default {
  supabase,
  auth,
  db,
  realtime,
  storage,
  useUser,
  useNotifications,
  useDuels
}