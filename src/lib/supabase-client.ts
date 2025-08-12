import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

// ====================================
// TYPES
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
// SUPABASE CLIENT
// ====================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables not found. Using demo mode.')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl || 'https://demo.supabase.co', supabaseAnonKey || 'demo-key', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// ====================================
// AUTH FUNCTIONS
// ====================================

export const auth = {
  // Sign up new user
  async signUp(email: string, password: string, username: string) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
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
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          username,
          display_name: username
        })

      if (profileError) throw profileError

      // Create user stats
      const { error: statsError } = await supabase
        .from('user_stats')
        .insert({
          user_id: authData.user.id,
          total_xp: 100 // Welcome bonus
        })

      if (statsError) throw statsError

      return { user: authData.user, session: authData.session }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  },

  // Sign in existing user
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  },

  // Get current session
  async getSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return session
    } catch (error) {
      console.error('Get session error:', error)
      return null
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (error) {
      console.error('Get user error:', error)
      return null
    }
  }
}

// ====================================
// DATABASE FUNCTIONS
// ====================================

export const db = {
  // Profiles
  profiles: {
    async get(userId: string) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      return data as Profile
    },

    async getByUsername(username: string) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()
      
      if (error) throw error
      return data as Profile
    },

    async update(userId: string, updates: Partial<Profile>) {
      const { data, error } = await supabase
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
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error) throw error
      return data as UserStats
    },

    async update(userId: string, updates: Partial<UserStats>) {
      const { data, error } = await supabase
        .from('user_stats')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()
      
      if (error) throw error
      return data as UserStats
    },

    async addXP(userId: string, amount: number, reason: string) {
      const { data, error } = await supabase
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
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      return data as Exercise[]
    },

    async getByCode(code: string) {
      const { data, error } = await supabase
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
      const { data, error } = await supabase
        .from('duels')
        .insert(duel)
        .select()
        .single()
      
      if (error) throw error
      return data as Duel
    },

    async get(duelId: string) {
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
      const { data, error } = await supabase
        .from('performances')
        .insert(performance)
        .select()
        .single()
      
      if (error) throw error
      return data as Performance
    },

    async getMyPerformances(userId: string, limit: number = 10) {
      const { data, error } = await supabase
        .from('performances')
        .select('*')
        .eq('user_id', userId)
        .order('performed_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data as Performance[]
    },

    async getBestPerformance(userId: string, exerciseId: string) {
      const { data, error } = await supabase
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
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Notification[]
    },

    async markAsRead(notificationId: string) {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
      
      if (error) throw error
    },

    async create(notification: Partial<Notification>) {
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
// REALTIME SUBSCRIPTIONS
// ====================================

export const realtime = {
  // Subscribe to notifications
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    return supabase
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
    return supabase
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
    supabase.removeChannel(channel)
  }
}

// ====================================
// STORAGE FUNCTIONS
// ====================================

export const storage = {
  // Upload video
  async uploadVideo(file: File, userId: string, performanceId: string) {
    const fileName = `${userId}/${performanceId}-${Date.now()}.${file.name.split('.').pop()}`
    
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(fileName, file)
    
    if (error) throw error
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(fileName)
    
    return publicUrl
  },

  // Upload avatar
  async uploadAvatar(file: File, userId: string) {
    const fileName = `${userId}/avatar-${Date.now()}.${file.name.split('.').pop()}`
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file)
    
    if (error) throw error
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)
    
    return publicUrl
  },

  // Delete file
  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])
    
    if (error) throw error
  }
}

// ====================================
// REACT HOOKS
// ====================================

// Hook to get current user and profile
export function useUser() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    auth.getSession().then(session => {
      if (session?.user) {
        setUser(session.user)
        // Fetch profile and stats
        Promise.all([
          db.profiles.get(session.user.id),
          db.stats.get(session.user.id)
        ]).then(([profileData, statsData]) => {
          setProfile(profileData)
          setStats(statsData)
        }).catch(console.error)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
            console.error('Error fetching user data:', error)
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

// Hook for notifications
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

// Hook for duels
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