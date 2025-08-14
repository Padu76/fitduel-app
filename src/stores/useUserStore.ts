import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ====================================
// TYPES
// ====================================
export interface User {
  id: string
  email: string
  username: string
  avatar?: string
  bio?: string
  level: number
  xp: number
  totalXp: number
  coins: number
  rank: string
  birthDate?: string
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced'
  goals: string[]
  newsletter: boolean
  createdAt: string
  updatedAt?: string
}

export interface UserStats {
  totalDuels: number
  wins: number
  losses: number
  winRate: number
  currentStreak: number
  bestStreak: number
  totalExercises: number
  favoriteExercise?: string
  fitnessScore: number
  avgFormScore: number
  weeklyActivity: {
    day: string
    duels: number
    xp: number
  }[]
}

export interface UserAchievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: string
  progress?: number
  maxProgress?: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface UserBadge {
  id: string
  name: string
  icon: string
  color: string
  earnedAt: string
}

interface UserState {
  // User data
  user: User | null
  stats: UserStats | null
  achievements: UserAchievement[]
  badges: UserBadge[]
  notifications: number
  
  // Auth state
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Session
  accessToken: string | null
  refreshToken: string | null
  sessionExpiresAt: number | null
}

interface UserActions {
  // Auth actions
  setUser: (user: User) => void
  updateUser: (updates: Partial<User>) => void
  clearUser: () => void
  
  // Stats actions
  setStats: (stats: UserStats) => void
  updateStats: (updates: Partial<UserStats>) => void
  incrementStat: (stat: keyof UserStats, amount?: number) => void
  
  // Achievements & Badges
  addAchievement: (achievement: UserAchievement) => void
  updateAchievementProgress: (id: string, progress: number) => void
  addBadge: (badge: UserBadge) => void
  
  // XP & Level
  addXP: (amount: number) => void
  levelUp: () => void
  addCoins: (amount: number) => void
  spendCoins: (amount: number) => boolean
  
  // Session management
  setSession: (accessToken: string, refreshToken: string, expiresIn: number) => void
  clearSession: () => void
  isSessionValid: () => boolean
  
  // Notifications
  setNotifications: (count: number) => void
  incrementNotifications: () => void
  clearNotifications: () => void
  
  // Loading & Error
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // API calls
  fetchUserData: (userId: string) => Promise<void>
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>
  logout: () => Promise<void>
  register: (data: any) => Promise<boolean>
}

type UserStore = UserState & UserActions

// ====================================
// HELPER FUNCTIONS
// ====================================
const calculateLevel = (xp: number): number => {
  // Level formula: each level requires more XP
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

const calculateRank = (level: number): string => {
  if (level >= 50) return 'Legend'
  if (level >= 40) return 'Master'
  if (level >= 30) return 'Diamond'
  if (level >= 25) return 'Platinum'
  if (level >= 20) return 'Gold'
  if (level >= 15) return 'Silver'
  if (level >= 10) return 'Bronze'
  if (level >= 5) return 'Iron'
  return 'Rookie'
}

// ====================================
// STORE
// ====================================
export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      stats: null,
      achievements: [],
      badges: [],
      notifications: 0,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      accessToken: null,
      refreshToken: null,
      sessionExpiresAt: null,

      // Auth actions
      setUser: (user) => set(() => ({
        user: { ...user, coins: user.coins || 0 },
        isAuthenticated: true,
        error: null
      })),

      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates, updatedAt: new Date().toISOString() } : null
      })),

      clearUser: () => set(() => ({
        user: null,
        stats: null,
        achievements: [],
        badges: [],
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        sessionExpiresAt: null
      })),

      // Stats actions
      setStats: (stats) => set(() => ({
        stats
      })),

      updateStats: (updates) => set((state) => ({
        stats: state.stats ? { ...state.stats, ...updates } : null
      })),

      incrementStat: (stat, amount = 1) => set((state) => {
        if (state.stats && typeof state.stats[stat] === 'number') {
          const newStats = { ...state.stats }
          ;(newStats[stat] as number) += amount
          
          // Update win rate if wins or losses changed
          if (stat === 'wins' || stat === 'losses') {
            const total = newStats.wins + newStats.losses
            newStats.winRate = total > 0 ? Math.round((newStats.wins / total) * 100) : 0
          }
          
          return { stats: newStats }
        }
        return state
      }),

      // Achievements & Badges
      addAchievement: (achievement) => set((state) => {
        if (!state.achievements.find((a) => a.id === achievement.id)) {
          return { achievements: [...state.achievements, achievement] }
        }
        return state
      }),

      updateAchievementProgress: (id, progress) => set((state) => {
        const achievements = state.achievements.map((a) => {
          if (a.id === id) {
            const updated = { ...a, progress }
            if (a.maxProgress && progress >= a.maxProgress && !a.unlockedAt) {
              updated.unlockedAt = new Date().toISOString()
            }
            return updated
          }
          return a
        })
        return { achievements }
      }),

      addBadge: (badge) => set((state) => {
        if (!state.badges.find((b) => b.id === badge.id)) {
          return { badges: [...state.badges, badge] }
        }
        return state
      }),

      // XP & Level
      addXP: (amount) => set((state) => {
        if (state.user) {
          const user = { ...state.user }
          user.xp += amount
          user.totalXp += amount
          
          const newLevel = calculateLevel(user.totalXp)
          if (newLevel > user.level) {
            user.level = newLevel
            user.rank = calculateRank(newLevel)
          }
          
          return { user }
        }
        return state
      }),

      levelUp: () => set((state) => {
        if (state.user) {
          const user = { ...state.user }
          user.level += 1
          user.rank = calculateRank(user.level)
          return { user }
        }
        return state
      }),

      addCoins: (amount) => set((state) => {
        if (state.user) {
          const user = { ...state.user }
          user.coins = (user.coins || 0) + amount
          return { user }
        }
        return state
      }),

      spendCoins: (amount) => {
        const state = get()
        if (state.user && state.user.coins >= amount) {
          set({ user: { ...state.user, coins: state.user.coins - amount } })
          return true
        }
        return false
      },

      // Session management
      setSession: (accessToken, refreshToken, expiresIn) => set(() => ({
        accessToken,
        refreshToken,
        sessionExpiresAt: Date.now() + (expiresIn * 1000),
        isAuthenticated: true
      })),

      clearSession: () => set(() => ({
        accessToken: null,
        refreshToken: null,
        sessionExpiresAt: null,
        isAuthenticated: false
      })),

      isSessionValid: () => {
        const state = get()
        if (!state.accessToken || !state.sessionExpiresAt) return false
        return Date.now() < state.sessionExpiresAt
      },

      // Notifications
      setNotifications: (count) => set(() => ({
        notifications: count
      })),

      incrementNotifications: () => set((state) => ({
        notifications: state.notifications + 1
      })),

      clearNotifications: () => set(() => ({
        notifications: 0
      })),

      // Loading & Error
      setLoading: (loading) => set(() => ({
        isLoading: loading
      })),

      setError: (error) => set(() => ({
        error
      })),

      // API calls
      fetchUserData: async (userId) => {
        const { setLoading, setError, setUser, setStats } = get()
        setLoading(true)
        setError(null)

        try {
          const response = await fetch(`/api/users/${userId}`)
          if (!response.ok) throw new Error('Failed to fetch user data')
          
          const data = await response.json()
          if (data.user) setUser(data.user)
          if (data.stats) setStats(data.stats)
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Unknown error')
        } finally {
          setLoading(false)
        }
      },

      login: async (email, password, rememberMe = false) => {
        const { setLoading, setError, setUser, setSession } = get()
        setLoading(true)
        setError(null)

        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, rememberMe })
          })

          const data = await response.json()
          
          if (!response.ok || !data.success) {
            throw new Error(data.message || 'Login failed')
          }

          if (data.data) {
            setUser(data.data.user)
            if (data.data.session) {
              setSession(
                data.data.session.access_token,
                data.data.session.refresh_token,
                data.data.session.expires_in
              )
            }
          }

          return true
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Login failed')
          return false
        } finally {
          setLoading(false)
        }
      },

      logout: async () => {
        const { clearUser, clearSession, setLoading } = get()
        setLoading(true)

        try {
          await fetch('/api/auth/logout', { method: 'POST' })
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          clearUser()
          clearSession()
          setLoading(false)
        }
      },

      register: async (data) => {
        const { setLoading, setError, setUser, setSession } = get()
        setLoading(true)
        setError(null)

        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })

          const result = await response.json()
          
          if (!response.ok || !result.success) {
            throw new Error(result.message || 'Registration failed')
          }

          if (result.data) {
            setUser(result.data.user)
            if (result.data.session) {
              setSession(
                result.data.session.access_token,
                result.data.session.refresh_token,
                result.data.session.expires_in
              )
            }
          }

          return true
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Registration failed')
          return false
        } finally {
          setLoading(false)
        }
      },
    }),
    {
      name: 'fitduel-user-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        stats: state.stats,
        achievements: state.achievements,
        badges: state.badges,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        sessionExpiresAt: state.sessionExpiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)