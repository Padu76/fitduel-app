import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// ====================================
// TYPES - UPDATED TO MATCH DATABASE
// ====================================
export type DuelType = '1v1' | 'open' | 'tournament' | 'mission'
export type DuelStatus = 'pending' | 'open' | 'active' | 'completed' | 'expired' | 'cancelled'
export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme'

export interface Duel {
  id: string
  // Participants - USING CORRECT COLUMN NAMES
  challenger_id: string
  challengerUsername?: string
  challengerAvatar?: string
  challenged_id?: string // CORRECT: challenged_id, not opponent_id
  challengedUsername?: string
  challengedAvatar?: string
  // Exercise
  exercise_id: string // CORRECT: exercise_id from exercises table
  exerciseName?: string
  exerciseCode?: string
  exerciseIcon?: string
  // Duel details
  type: DuelType
  status: DuelStatus
  difficulty: Difficulty
  // Rewards & Wagers
  wager_coins: number // CORRECT: coins, not XP
  xp_reward: number
  // Scores
  challenger_score?: number
  challenged_score?: number // CORRECT: challenged_score, not opponent_score
  // Timestamps
  created_at: string
  started_at?: string
  completed_at?: string
  expires_at: string
  updated_at?: string
  // Winner
  winner_id?: string
  // Metadata
  metadata?: any
}

export interface DuelParticipant {
  id?: string
  duel_id: string
  user_id: string
  username?: string
  avatar?: string
  score?: number
  form_score?: number
  completed?: boolean
  joined_at: string
  completed_at?: string
}

export interface Exercise {
  id: string
  code: string
  name: string
  description?: string
  category: string
  muscle_groups?: string
  met_value?: number
  icon?: string
  video_url?: string
  instructions?: string
  common_mistakes?: string
  is_active: boolean
  created_at: string
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
  
  // Exercises
  exercises: Exercise[]
  
  // UI state
  isLoading: boolean
  error: string | null
  filters: {
    type: DuelType | 'all'
    status: DuelStatus | 'all'
    difficulty: Difficulty | 'all'
    exercise: string | 'all'
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
  
  // Exercises
  setExercises: (exercises: Exercise[]) => void
  fetchExercises: () => Promise<void>
  
  // Duel actions
  createDuel: (data: CreateDuelData) => Promise<Duel | null>
  acceptDuel: (duelId: string, userId: string) => Promise<boolean>
  declineDuel: (duelId: string, userId: string) => Promise<boolean>
  startDuel: (duelId: string) => Promise<boolean>
  completeDuel: (duelId: string, userId: string, score: number, data?: any) => Promise<boolean>
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
  challengedId?: string // CORRECT: challenged_id
  exerciseId: string // CORRECT: exercise_id
  duelType: DuelType
  wagerCoins: number // CORRECT: coins
  xpReward: number
  difficulty: Difficulty
  timeLimit?: number
  metadata?: any
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
      exercises: [],
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
        state.activeDuels = duels.filter((d: Duel) => d.status === 'active')
        state.openDuels = duels.filter((d: Duel) => d.status === 'open')
        state.completedDuels = duels.filter((d: Duel) => d.status === 'completed')
      }),

      addDuel: (duel) => set((state) => {
        state.duels.push(duel)
        if (duel.status === 'active') state.activeDuels.push(duel)
        if (duel.status === 'open') state.openDuels.push(duel)
      }),

      updateDuel: (id, updates) => set((state) => {
        const index = state.duels.findIndex((d: Duel) => d.id === id)
        if (index !== -1) {
          state.duels[index] = { ...state.duels[index], ...updates }
          
          // Update categorized arrays
          state.activeDuels = state.duels.filter((d: Duel) => d.status === 'active')
          state.openDuels = state.duels.filter((d: Duel) => d.status === 'open')
          state.completedDuels = state.duels.filter((d: Duel) => d.status === 'completed')
          
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
          const response = await fetch('/api/duels/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ duelId, userId })
          })

          const data = await response.json()
          
          if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to join duel')
          }
          
          if (data.data?.duel) {
            updateDuel(duelId, data.data.duel)
          }
          
          return true
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to join duel')
          return false
        } finally {
          setLoading(false)
        }
      },

      leaveDuel: async (duelId, userId) => {
        // Not implemented in current API
        return false
      },

      // Exercises
      setExercises: (exercises) => set((state) => {
        state.exercises = exercises
      }),

      fetchExercises: async () => {
        const { setLoading, setError, setExercises } = get()
        setLoading(true)
        setError(null)

        try {
          // This would need a new API endpoint
          // For now, we'll use hardcoded data
          const exercises: Exercise[] = [
            {
              id: '5951b877-daf8-4cf3-83cf-d8289a82e7e4',
              code: 'push_up',
              name: 'Push-Up',
              category: 'strength',
              icon: '💪',
              is_active: true,
              created_at: '2025-08-12T15:08:31.574524+00'
            },
            {
              id: 'e95a9adb-894a-4ae1-b9e1-282950e08261',
              code: 'squat',
              name: 'Squat',
              category: 'strength',
              icon: '🦵',
              is_active: true,
              created_at: '2025-08-12T15:08:31.574524+00'
            },
            {
              id: 'e15981c1-bb84-4fa4-aec9-73040d69d8af',
              code: 'plank',
              name: 'Plank',
              category: 'core',
              icon: '📏',
              is_active: true,
              created_at: '2025-08-12T15:08:31.574524+00'
            },
            {
              id: '8056563b-c178-4edc-8097-f48aa500f81a',
              code: 'burpee',
              name: 'Burpee',
              category: 'cardio',
              icon: '🔥',
              is_active: true,
              created_at: '2025-08-12T15:08:31.574524+00'
            },
            {
              id: '7ca84c3c-2a4d-450c-beed-144a7fa033a5',
              code: 'jumping_jack',
              name: 'Jumping Jack',
              category: 'cardio',
              icon: '⭐',
              is_active: true,
              created_at: '2025-08-12T15:08:31.574524+00'
            },
            {
              id: 'c6b883f3-4041-402c-974f-5fc59ebafccc',
              code: 'mountain_climber',
              name: 'Mountain Climber',
              category: 'cardio',
              icon: '⛰️',
              is_active: true,
              created_at: '2025-08-12T15:08:31.574524+00'
            }
          ]
          
          setExercises(exercises)
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to fetch exercises')
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
          const response = await fetch('/api/duels/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ duelId, userId })
          })

          const data = await response.json()
          
          if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to accept duel')
          }
          
          if (data.data?.duel) {
            updateDuel(duelId, { status: 'active', ...data.data.duel })
          }
          
          return true
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to accept duel')
          return false
        } finally {
          setLoading(false)
        }
      },

      declineDuel: async (duelId, userId) => {
        // Not implemented in current API
        const { removeDuel } = get()
        removeDuel(duelId)
        return true
      },

      startDuel: async (duelId) => {
        const { updateDuel } = get()
        updateDuel(duelId, { 
          status: 'active',
          started_at: new Date().toISOString()
        })
        return true
      },

      completeDuel: async (duelId, userId, score, data) => {
        const { setLoading, setError, updateDuel } = get()
        setLoading(true)
        setError(null)

        try {
          const response = await fetch('/api/duels/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              duelId, 
              userId, 
              score,
              ...data 
            })
          })

          const result = await response.json()
          
          if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to complete duel')
          }
          
          if (result.data?.duel) {
            updateDuel(duelId, { 
              status: 'completed',
              completed_at: new Date().toISOString(),
              ...result.data.duel 
            })
          }
          
          return true
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to complete duel')
          return false
        } finally {
          setLoading(false)
        }
      },

      cancelDuel: async (duelId) => {
        const { updateDuel } = get()
        updateDuel(duelId, { status: 'cancelled' })
        return true
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
        const { setLoading, setError } = get()
        setLoading(true)
        setError(null)

        try {
          const response = await fetch('/api/duels/create?status=open')
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
          if (filters.type !== 'all' && duel.type !== filters.type) return false
          if (filters.status !== 'all' && duel.status !== filters.status) return false
          if (filters.difficulty !== 'all' && duel.difficulty !== filters.difficulty) return false
          if (filters.exercise !== 'all' && duel.exercise_id !== filters.exercise) return false
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
        exercises: state.exercises,
        totalDuelsCreated: state.totalDuelsCreated,
        totalDuelsWon: state.totalDuelsWon,
        totalDuelsLost: state.totalDuelsLost,
        filters: state.filters,
      }),
    }
  )
)