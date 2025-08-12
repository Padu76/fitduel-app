import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// ====================================
// TYPES
// ====================================
export type DuelType = '1v1' | 'open' | 'tournament' | 'mission'
export type DuelStatus = 'PENDING' | 'OPEN' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED'
export type ExerciseCode = 'push_up' | 'squat' | 'plank' | 'burpee' | 'jumping_jack' | 'mountain_climber'
export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme'

export interface Duel {
  id: string
  challengerId: string
  challengerUsername: string
  challengerAvatar?: string
  challengedId?: string
  challengedUsername?: string
  challengedAvatar?: string
  exerciseCode: ExerciseCode
  exerciseName: string
  duelType: DuelType
  status: DuelStatus
  wagerXP: number
  rewardXP: number
  duration: number // seconds
  difficulty: Difficulty
  maxParticipants: number
  currentParticipants: number
  timeLimit: string // e.g., "24h"
  expiresAt: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  winnerId?: string
  winnerUsername?: string
  rules?: DuelRules
  results?: DuelResult[]
}

export interface DuelRules {
  minReps?: number
  targetTime?: number
  formScoreRequired?: number
  allowRetry?: boolean
  maxAttempts?: number
}

export interface DuelResult {
  userId: string
  username: string
  score: number
  reps?: number
  duration?: number
  formScore?: number
  videoUrl?: string
  submittedAt: string
  verified: boolean
}

export interface DuelParticipant {
  userId: string
  username: string
  avatar?: string
  role: 'challenger' | 'challenged' | 'participant'
  status: 'ready' | 'in_progress' | 'completed' | 'forfeit'
  score?: number
  joinedAt: string
}

export interface ExerciseInfo {
  code: ExerciseCode
  name: string
  nameIt: string
  category: 'strength' | 'cardio' | 'core' | 'flexibility'
  muscleGroups: string[]
  difficulty: {
    easy: { reps?: number; time?: number }
    medium: { reps?: number; time?: number }
    hard: { reps?: number; time?: number }
    extreme: { reps?: number; time?: number }
  }
  description?: string
  tips?: string[]
}

interface DuelState {
  // Duels data
  duels: Duel[]
  activeDuels: Duel[]
  myDuels: Duel[]
  openDuels: Duel[]
  completedDuels: Duel[]
  
  // Current duel
  currentDuel: Duel | null
  currentParticipants: DuelParticipant[]
  
  // UI state
  isLoading: boolean
  error: string | null
  filters: {
    type: DuelType | 'all'
    status: DuelStatus | 'all'
    difficulty: Difficulty | 'all'
    exercise: ExerciseCode | 'all'
  }
  
  // Stats
  totalDuelsCreated: number
  totalDuelsWon: number
  totalDuelsLost: number
}

interface DuelActions {
  // CRUD operations
  setDuels: (duels: Duel[]) => void
  addDuel: (duel: Duel) => void
  updateDuel: (id: string, updates: Partial<Duel>) => void
  removeDuel: (id: string) => void
  
  // Current duel management
  setCurrentDuel: (duel: Duel | null) => void
  setCurrentParticipants: (participants: DuelParticipant[]) => void
  joinDuel: (duelId: string, userId: string) => Promise<boolean>
  leaveDuel: (duelId: string, userId: string) => Promise<boolean>
  
  // Duel actions
  createDuel: (data: CreateDuelData) => Promise<Duel | null>
  acceptDuel: (duelId: string, userId: string) => Promise<boolean>
  declineDuel: (duelId: string, userId: string) => Promise<boolean>
  startDuel: (duelId: string) => Promise<boolean>
  completeDuel: (duelId: string, result: DuelResult) => Promise<boolean>
  cancelDuel: (duelId: string) => Promise<boolean>
  
  // Fetching
  fetchDuels: (userId?: string) => Promise<void>
  fetchDuelById: (duelId: string) => Promise<Duel | null>
  fetchOpenDuels: () => Promise<void>
  fetchMyDuels: (userId: string) => Promise<void>
  
  // Filtering
  setFilter: (key: keyof DuelState['filters'], value: any) => void
  clearFilters: () => void
  getFilteredDuels: () => Duel[]
  
  // Utils
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  
  // Stats
  updateStats: (won: boolean) => void
}

type DuelStore = DuelState & DuelActions

export interface CreateDuelData {
  challengerId: string
  challengedId?: string
  exerciseCode: ExerciseCode
  duelType: DuelType
  wagerXP: number
  duration: number
  difficulty: Difficulty
  maxParticipants?: number
  timeLimit?: number
  rules?: DuelRules
}

// ====================================
// EXERCISES DATA
// ====================================
export const EXERCISES: Record<ExerciseCode, ExerciseInfo> = {
  push_up: {
    code: 'push_up',
    name: 'Push-Up',
    nameIt: 'Flessioni',
    category: 'strength',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    difficulty: {
      easy: { reps: 10 },
      medium: { reps: 20 },
      hard: { reps: 30 },
      extreme: { reps: 50 }
    },
    tips: ['Mantieni il corpo dritto', 'Scendi fino a 90°', 'Respira regolarmente']
  },
  squat: {
    code: 'squat',
    name: 'Squat',
    nameIt: 'Squat',
    category: 'strength',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
    difficulty: {
      easy: { reps: 15 },
      medium: { reps: 30 },
      hard: { reps: 45 },
      extreme: { reps: 60 }
    },
    tips: ['Schiena dritta', 'Ginocchia allineate', 'Scendi fino alle cosce parallele']
  },
  plank: {
    code: 'plank',
    name: 'Plank',
    nameIt: 'Plank',
    category: 'core',
    muscleGroups: ['core', 'shoulders', 'back'],
    difficulty: {
      easy: { time: 30 },
      medium: { time: 60 },
      hard: { time: 90 },
      extreme: { time: 120 }
    },
    tips: ['Corpo dritto come una tavola', 'Addome contratto', 'Respira normalmente']
  },
  burpee: {
    code: 'burpee',
    name: 'Burpee',
    nameIt: 'Burpee',
    category: 'cardio',
    muscleGroups: ['full body'],
    difficulty: {
      easy: { reps: 5 },
      medium: { reps: 10 },
      hard: { reps: 15 },
      extreme: { reps: 25 }
    },
    tips: ['Movimento fluido', 'Salto esplosivo', 'Atterraggio morbido']
  },
  jumping_jack: {
    code: 'jumping_jack',
    name: 'Jumping Jack',
    nameIt: 'Jumping Jack',
    category: 'cardio',
    muscleGroups: ['full body'],
    difficulty: {
      easy: { reps: 20 },
      medium: { reps: 40 },
      hard: { reps: 60 },
      extreme: { reps: 100 }
    },
    tips: ['Ritmo costante', 'Braccia completamente estese', 'Atterraggio sulle punte']
  },
  mountain_climber: {
    code: 'mountain_climber',
    name: 'Mountain Climber',
    nameIt: 'Mountain Climber',
    category: 'cardio',
    muscleGroups: ['core', 'shoulders', 'legs'],
    difficulty: {
      easy: { reps: 10 },
      medium: { reps: 20 },
      hard: { reps: 30 },
      extreme: { reps: 50 }
    },
    tips: ['Core sempre attivo', 'Ginocchia al petto', 'Ritmo veloce ma controllato']
  }
}

// ====================================
// STORE
// ====================================
export const useDuelStore = create<DuelStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      duels: [],
      activeDuels: [],
      myDuels: [],
      openDuels: [],
      completedDuels: [],
      currentDuel: null,
      currentParticipants: [],
      isLoading: false,
      error: null,
      filters: {
        type: 'all',
        status: 'all',
        difficulty: 'all',
        exercise: 'all'
      },
      totalDuelsCreated: 0,
      totalDuelsWon: 0,
      totalDuelsLost: 0,

      // CRUD operations
      setDuels: (duels) => set((state) => {
        state.duels = duels
        state.activeDuels = duels.filter((d: Duel) => d.status === 'ACTIVE')
        state.openDuels = duels.filter((d: Duel) => d.status === 'OPEN')
        state.completedDuels = duels.filter((d: Duel) => d.status === 'COMPLETED')
      }),

      addDuel: (duel) => set((state) => {
        state.duels.push(duel)
        if (duel.status === 'ACTIVE') state.activeDuels.push(duel)
        if (duel.status === 'OPEN') state.openDuels.push(duel)
      }),

      updateDuel: (id, updates) => set((state) => {
        const index = state.duels.findIndex((d: Duel) => d.id === id)
        if (index !== -1) {
          state.duels[index] = { ...state.duels[index], ...updates }
          
          // Update categorized arrays
          state.activeDuels = state.duels.filter((d: Duel) => d.status === 'ACTIVE')
          state.openDuels = state.duels.filter((d: Duel) => d.status === 'OPEN')
          state.completedDuels = state.duels.filter((d: Duel) => d.status === 'COMPLETED')
          
          // Update current duel if it's the one being updated
          if (state.currentDuel?.id === id) {
            state.currentDuel = { ...state.currentDuel, ...updates }
          }
        }
      }),

      removeDuel: (id) => set((state) => {
        state.duels = state.duels.filter((d: Duel) => d.id !== id)
        state.activeDuels = state.activeDuels.filter((d: Duel) => d.id !== id)
        state.openDuels = state.openDuels.filter((d: Duel) => d.id !== id)
        state.completedDuels = state.completedDuels.filter((d: Duel) => d.id !== id)
        if (state.currentDuel?.id === id) state.currentDuel = null
      }),

      // Current duel management
      setCurrentDuel: (duel) => set((state) => {
        state.currentDuel = duel
      }),

      setCurrentParticipants: (participants) => set((state) => {
        state.currentParticipants = participants
      }),

      joinDuel: async (duelId, userId) => {
        const { setLoading, setError, updateDuel } = get()
        setLoading(true)
        setError(null)

        try {
          const response = await fetch(`/api/duels/${duelId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          })

          if (!response.ok) throw new Error('Failed to join duel')
          
          const data = await response.json()
          updateDuel(duelId, data.duel)
          return true
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to join duel')
          return false
        } finally {
          setLoading(false)
        }
      },

      leaveDuel: async (duelId, userId) => {
        const { setLoading, setError, updateDuel } = get()
        setLoading(true)
        setError(null)

        try {
          const response = await fetch(`/api/duels/${duelId}/leave`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          })

          if (!response.ok) throw new Error('Failed to leave duel')
          
          const data = await response.json()
          updateDuel(duelId, data.duel)
          return true
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to leave duel')
          return false
        } finally {
          setLoading(false)
        }
      },

      // Duel actions
      createDuel: async (data) => {
        const { setLoading, setError, addDuel } = get()
        setLoading(true)
        setError(null)

        try {
          const response = await fetch('/api/duels/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })

          const result = await response.json()
          
          if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to create duel')
          }

          if (result.data?.duel) {
            addDuel(result.data.duel)
            return result.data.duel
          }
          
          return null
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to create duel')
          return null
        } finally {
          setLoading(false)
        }
      },

      acceptDuel: async (duelId, userId) => {
        const { setLoading, setError, updateDuel } = get()
        setLoading(true)
        setError(null)

        try {
          const response = await fetch(`/api/duels/${duelId}/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          })

          if (!response.ok) throw new Error('Failed to accept duel')
          
          const data = await response.json()
          updateDuel(duelId, { status: 'ACTIVE', ...data.duel })
          return true
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to accept duel')
          return false
        } finally {
          setLoading(false)
        }
      },

      declineDuel: async (duelId, userId) => {
        const { setLoading, setError, removeDuel } = get()
        setLoading(true)
        setError(null)

        try {
          const response = await fetch(`/api/duels/${duelId}/decline`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          })

          if (!response.ok) throw new Error('Failed to decline duel')
          
          removeDuel(duelId)
          return true
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to decline duel')
          return false
        } finally {
          setLoading(false)
        }
      },

      startDuel: async (duelId) => {
        const { setLoading, setError, updateDuel } = get()
        setLoading(true)
        setError(null)

        try {
          const response = await fetch(`/api/duels/${duelId}/start`, {
            method: 'POST'
          })

          if (!response.ok) throw new Error('Failed to start duel')
          
          const data = await response.json()
          updateDuel(duelId, { 
            status: 'ACTIVE', 
            startedAt: new Date().toISOString(),
            ...data.duel 
          })
          return true
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to start duel')
          return false
        } finally {
          setLoading(false)
        }
      },

      completeDuel: async (duelId, result) => {
        const { setLoading, setError, updateDuel } = get()
        setLoading(true)
        setError(null)

        try {
          const response = await fetch(`/api/duels/${duelId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ result })
          })

          if (!response.ok) throw new Error('Failed to complete duel')
          
          const data = await response.json()
          updateDuel(duelId, { 
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
            ...data.duel 
          })
          return true
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to complete duel')
          return false
        } finally {
          setLoading(false)
        }
      },

      cancelDuel: async (duelId) => {
        const { setLoading, setError, updateDuel } = get()
        setLoading(true)
        setError(null)

        try {
          const response = await fetch(`/api/duels/${duelId}/cancel`, {
            method: 'POST'
          })

          if (!response.ok) throw new Error('Failed to cancel duel')
          
          updateDuel(duelId, { status: 'CANCELLED' })
          return true
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to cancel duel')
          return false
        } finally {
          setLoading(false)
        }
      },

      // Fetching
      fetchDuels: async (userId) => {
        const { setLoading, setError, setDuels } = get()
        setLoading(true)
        setError(null)

        try {
          const url = userId 
            ? `/api/duels/create?userId=${userId}`
            : '/api/duels/create'
          
          const response = await fetch(url)
          if (!response.ok) throw new Error('Failed to fetch duels')
          
          const data = await response.json()
          if (data.success && data.data) {
            setDuels(Array.isArray(data.data) ? data.data : [data.data])
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to fetch duels')
        } finally {
          setLoading(false)
        }
      },

      fetchDuelById: async (duelId) => {
        const { setLoading, setError } = get()
        setLoading(true)
        setError(null)

        try {
          const response = await fetch(`/api/duels/create?id=${duelId}`)
          if (!response.ok) throw new Error('Failed to fetch duel')
          
          const data = await response.json()
          if (data.success && data.data) {
            return data.data
          }
          return null
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to fetch duel')
          return null
        } finally {
          setLoading(false)
        }
      },

      fetchOpenDuels: async () => {
        const { setLoading, setError, setDuels } = get()
        setLoading(true)
        setError(null)

        try {
          const response = await fetch('/api/duels/create?status=OPEN')
          if (!response.ok) throw new Error('Failed to fetch open duels')
          
          const data = await response.json()
          if (data.success && data.data) {
            const openDuels = Array.isArray(data.data) ? data.data : [data.data]
            set((state) => {
              state.openDuels = openDuels
            })
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to fetch open duels')
        } finally {
          setLoading(false)
        }
      },

      fetchMyDuels: async (userId) => {
        const { setLoading, setError } = get()
        setLoading(true)
        setError(null)

        try {
          const response = await fetch(`/api/duels/create?userId=${userId}`)
          if (!response.ok) throw new Error('Failed to fetch my duels')
          
          const data = await response.json()
          if (data.success && data.data) {
            const myDuels = Array.isArray(data.data) ? data.data : [data.data]
            set((state) => {
              state.myDuels = myDuels
            })
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to fetch my duels')
        } finally {
          setLoading(false)
        }
      },

      // Filtering
      setFilter: (key, value) => set((state) => {
        state.filters[key] = value
      }),

      clearFilters: () => set((state) => {
        state.filters = {
          type: 'all',
          status: 'all',
          difficulty: 'all',
          exercise: 'all'
        }
      }),

      getFilteredDuels: () => {
        const { duels, filters } = get()
        
        return duels.filter((duel: Duel) => {
          if (filters.type !== 'all' && duel.duelType !== filters.type) return false
          if (filters.status !== 'all' && duel.status !== filters.status) return false
          if (filters.difficulty !== 'all' && duel.difficulty !== filters.difficulty) return false
          if (filters.exercise !== 'all' && duel.exerciseCode !== filters.exercise) return false
          return true
        })
      },

      // Utils
      setLoading: (loading) => set((state) => {
        state.isLoading = loading
      }),

      setError: (error) => set((state) => {
        state.error = error
      }),

      clearError: () => set((state) => {
        state.error = null
      }),

      // Stats
      updateStats: (won) => set((state) => {
        if (won) {
          state.totalDuelsWon += 1
        } else {
          state.totalDuelsLost += 1
        }
      }),
    })),
    {
      name: 'fitduel-duel-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        myDuels: state.myDuels,
        completedDuels: state.completedDuels,
        totalDuelsCreated: state.totalDuelsCreated,
        totalDuelsWon: state.totalDuelsWon,
        totalDuelsLost: state.totalDuelsLost,
        filters: state.filters,
      }),
    }
  )
)