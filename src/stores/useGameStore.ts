import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// ====================================
// TYPES - UPDATED TO MATCH DATABASE
// ====================================
export type GameMode = 'training' | 'duel' | 'tournament' | 'mission'
export type GameStatus = 'idle' | 'ready' | 'countdown' | 'playing' | 'paused' | 'completed'
export type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid'

export interface GameSession {
  id: string
  mode: GameMode
  exerciseId: string // CHANGED: exercise_id instead of exerciseCode
  exerciseName: string
  exerciseCode?: string // Optional for backwards compatibility
  exerciseIcon?: string
  difficulty: string
  targetReps?: number
  targetTime?: number
  currentReps: number
  currentTime: number
  formScore: number
  calories: number
  startedAt?: string
  completedAt?: string
  isPaused: boolean
  pausedDuration: number
}

export interface ExercisePerformance {
  exerciseId: string // CHANGED: exercise_id
  exerciseCode?: string // Optional for backwards compatibility
  timestamp: string
  reps: number
  duration: number
  formScore: number
  calories: number
  difficulty: string
  mode: GameMode
  videoUrl?: string
}

export interface GameSettings {
  soundEnabled: boolean
  vibrationEnabled: boolean
  showTimer: boolean
  showFormScore: boolean
  showCalories: boolean
  autoStartCountdown: boolean
  countdownDuration: number // seconds
  restDuration: number // seconds between sets
  cameraPosition: 'front' | 'back'
  videoQuality: 'low' | 'medium' | 'high'
}

export interface FormValidation {
  isValid: boolean
  score: number
  feedback: string[]
  corrections: string[]
  timestamp: string
}

export interface GameAchievement {
  id: string
  achievement_id: string // ADDED: to match database
  type: 'milestone' | 'streak' | 'perfect' | 'speed' | 'endurance'
  title: string // CHANGED: from name to title to match database
  description: string
  icon?: string
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
  unlocked_at?: string // CHANGED: from unlockedAt
  progress: number
  target: number
}

export interface LeaderboardEntry {
  userId: string
  username: string
  avatar?: string
  score: number
  exerciseId: string // CHANGED: exercise_id
  exerciseCode?: string
  difficulty: string
  formScore: number
  timestamp: string
  rank?: number
}

interface GameState {
  // Current game session
  currentSession: GameSession | null
  gameStatus: GameStatus
  
  // Performance tracking
  performances: ExercisePerformance[]
  bestPerformances: Record<string, ExercisePerformance>
  
  // Validation
  validationStatus: ValidationStatus
  lastValidation: FormValidation | null
  validationHistory: FormValidation[]
  
  // Settings
  settings: GameSettings
  
  // Achievements & Leaderboard
  achievements: GameAchievement[]
  leaderboard: LeaderboardEntry[]
  globalLeaderboard: LeaderboardEntry[]
  
  // Stats
  totalExercises: number
  totalReps: number
  totalDuration: number // seconds
  totalCalories: number
  averageFormScore: number
  streakDays: number
  lastExerciseDate: string | null
  
  // UI State
  isLoading: boolean
  error: string | null
  isCameraReady: boolean
  isAudioReady: boolean
}

interface GameActions {
  // Session management
  startSession: (mode: GameMode, exerciseId: string, difficulty: string, targets?: { reps?: number; time?: number }) => void
  endSession: () => void
  pauseSession: () => void
  resumeSession: () => void
  resetSession: () => void
  
  // Game status
  setGameStatus: (status: GameStatus) => void
  startCountdown: () => Promise<void>
  
  // Performance tracking
  updatePerformance: (reps: number, time: number, formScore: number, calories: number) => void
  savePerformance: () => void
  getBestPerformance: (exerciseId: string) => ExercisePerformance | null
  
  // Validation
  validateForm: (videoFrame: any) => Promise<FormValidation>
  setValidationStatus: (status: ValidationStatus) => void
  updateFormScore: (score: number) => void
  
  // Settings
  updateSettings: (settings: Partial<GameSettings>) => void
  toggleSound: () => void
  toggleVibration: () => void
  setCameraPosition: (position: 'front' | 'back') => void
  
  // Achievements
  checkAchievements: () => void
  unlockAchievement: (achievementId: string) => void
  updateAchievementProgress: (achievementId: string, progress: number) => void
  
  // Leaderboard
  fetchLeaderboard: (exerciseId?: string, timeframe?: 'daily' | 'weekly' | 'monthly' | 'all') => Promise<void>
  submitToLeaderboard: (performance: ExercisePerformance) => Promise<void>
  getUserRank: (userId: string, exerciseId: string) => number | null
  
  // Stats
  updateStats: (performance: ExercisePerformance) => void
  calculateStreak: () => void
  resetStats: () => void
  
  // Camera & Audio
  setCameraReady: (ready: boolean) => void
  setAudioReady: (ready: boolean) => void
  
  // Utils
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

type GameStore = GameState & GameActions

// ====================================
// HELPER FUNCTIONS
// ====================================
const calculateCalories = (exerciseCode: string, reps: number, duration: number): number => {
  // Simplified calorie calculation based on MET values
  const metValues: Record<string, number> = {
    push_up: 8.0,
    squat: 5.0,
    plank: 3.0,
    burpee: 10.0,
    jumping_jack: 8.0,
    mountain_climber: 8.0
  }
  
  const met = metValues[exerciseCode] || 5.0
  const weightKg = 70 // Average weight, should be from user profile
  const hours = duration / 3600
  
  return Math.round(met * weightKg * hours)
}

const generateSessionId = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// ====================================
// STORE
// ====================================
export const useGameStore = create<GameStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      currentSession: null,
      gameStatus: 'idle',
      performances: [],
      bestPerformances: {},
      validationStatus: 'idle',
      lastValidation: null,
      validationHistory: [],
      settings: {
        soundEnabled: true,
        vibrationEnabled: true,
        showTimer: true,
        showFormScore: true,
        showCalories: true,
        autoStartCountdown: true,
        countdownDuration: 3,
        restDuration: 30,
        cameraPosition: 'front',
        videoQuality: 'medium'
      },
      achievements: [],
      leaderboard: [],
      globalLeaderboard: [],
      totalExercises: 0,
      totalReps: 0,
      totalDuration: 0,
      totalCalories: 0,
      averageFormScore: 0,
      streakDays: 0,
      lastExerciseDate: null,
      isLoading: false,
      error: null,
      isCameraReady: false,
      isAudioReady: false,

      // Session management
      startSession: (mode, exerciseId, difficulty, targets) => set((state) => {
        state.currentSession = {
          id: generateSessionId(),
          mode,
          exerciseId, // Using exercise_id
          exerciseName: '', // Should be fetched from exercises table
          difficulty,
          targetReps: targets?.reps,
          targetTime: targets?.time,
          currentReps: 0,
          currentTime: 0,
          formScore: 0,
          calories: 0,
          startedAt: new Date().toISOString(),
          isPaused: false,
          pausedDuration: 0
        }
        state.gameStatus = 'ready'
        state.validationHistory = []
      }),

      endSession: () => set((state) => {
        if (state.currentSession) {
          state.currentSession.completedAt = new Date().toISOString()
          const { savePerformance } = get()
          savePerformance()
        }
        state.currentSession = null
        state.gameStatus = 'idle'
        state.validationStatus = 'idle'
        state.lastValidation = null
      }),

      pauseSession: () => set((state) => {
        if (state.currentSession) {
          state.currentSession.isPaused = true
          state.gameStatus = 'paused'
        }
      }),

      resumeSession: () => set((state) => {
        if (state.currentSession) {
          state.currentSession.isPaused = false
          state.gameStatus = 'playing'
        }
      }),

      resetSession: () => set((state) => {
        if (state.currentSession) {
          state.currentSession.currentReps = 0
          state.currentSession.currentTime = 0
          state.currentSession.formScore = 0
          state.currentSession.calories = 0
          state.gameStatus = 'ready'
          state.validationHistory = []
        }
      }),

      // Game status
      setGameStatus: (status) => set((state) => {
        state.gameStatus = status
      }),

      startCountdown: async () => {
        const { settings, setGameStatus } = get()
        setGameStatus('countdown')
        
        return new Promise((resolve) => {
          setTimeout(() => {
            setGameStatus('playing')
            resolve()
          }, settings.countdownDuration * 1000)
        })
      },

      // Performance tracking
      updatePerformance: (reps, time, formScore, calories) => set((state) => {
        if (state.currentSession) {
          state.currentSession.currentReps = reps
          state.currentSession.currentTime = time
          state.currentSession.formScore = formScore
          state.currentSession.calories = calories
        }
      }),

      savePerformance: () => {
        const state = get()
        if (!state.currentSession) return

        const performance: ExercisePerformance = {
          exerciseId: state.currentSession.exerciseId,
          exerciseCode: state.currentSession.exerciseCode,
          timestamp: new Date().toISOString(),
          reps: state.currentSession.currentReps,
          duration: state.currentSession.currentTime,
          formScore: state.currentSession.formScore,
          calories: state.currentSession.calories,
          difficulty: state.currentSession.difficulty,
          mode: state.currentSession.mode
        }

        set((state) => {
          state.performances.push(performance)
          
          // Update best performance
          const exerciseId = performance.exerciseId
          const currentBest = state.bestPerformances[exerciseId]
          
          if (!currentBest || performance.reps > currentBest.reps ||
              (performance.reps === currentBest.reps && performance.formScore > currentBest.formScore)) {
            state.bestPerformances[exerciseId] = performance
          }
        })

        // Update stats
        const { updateStats } = get()
        updateStats(performance)
      },

      getBestPerformance: (exerciseId) => {
        return get().bestPerformances[exerciseId] || null
      },

      // Validation
      validateForm: async (videoFrame) => {
        const { setValidationStatus } = get()
        setValidationStatus('validating')

        try {
          // TODO: Implement actual AI validation
          // For now, return mock validation
          const mockScore = Math.floor(Math.random() * 30) + 70
          const validation: FormValidation = {
            isValid: mockScore >= 70,
            score: mockScore,
            feedback: mockScore >= 90 ? ['Forma perfetta!'] : 
                     mockScore >= 70 ? ['Buona forma'] : 
                     ['Migliora la postura'],
            corrections: mockScore < 70 ? ['Mantieni la schiena dritta'] : [],
            timestamp: new Date().toISOString()
          }

          set((state) => {
            state.lastValidation = validation
            state.validationHistory.push(validation)
            state.validationStatus = validation.isValid ? 'valid' : 'invalid'
          })

          return validation
        } catch (error) {
          setValidationStatus('invalid')
          throw error
        }
      },

      setValidationStatus: (status) => set((state) => {
        state.validationStatus = status
      }),

      updateFormScore: (score) => set((state) => {
        if (state.currentSession) {
          state.currentSession.formScore = score
        }
      }),

      // Settings
      updateSettings: (settings) => set((state) => {
        state.settings = { ...state.settings, ...settings }
      }),

      toggleSound: () => set((state) => {
        state.settings.soundEnabled = !state.settings.soundEnabled
      }),

      toggleVibration: () => set((state) => {
        state.settings.vibrationEnabled = !state.settings.vibrationEnabled
      }),

      setCameraPosition: (position) => set((state) => {
        state.settings.cameraPosition = position
      }),

      // Achievements
      checkAchievements: () => {
        const state = get()
        
        // Check streak achievement
        if (state.streakDays >= 7 && !state.achievements.find((a: GameAchievement) => a.achievement_id === 'week-streak')) {
          get().unlockAchievement('week-streak')
        }
        
        // Check total exercises achievement
        if (state.totalExercises >= 100 && !state.achievements.find((a: GameAchievement) => a.achievement_id === '100-exercises')) {
          get().unlockAchievement('100-exercises')
        }
        
        // Check perfect form achievement
        const perfectForms = state.performances.filter(p => p.formScore >= 95).length
        if (perfectForms >= 10 && !state.achievements.find((a: GameAchievement) => a.achievement_id === 'perfect-10')) {
          get().unlockAchievement('perfect-10')
        }
      },

      unlockAchievement: (achievementId) => set((state) => {
        const achievement = state.achievements.find((a: GameAchievement) => a.achievement_id === achievementId)
        if (achievement && !achievement.unlocked_at) {
          achievement.unlocked_at = new Date().toISOString()
        }
      }),

      updateAchievementProgress: (achievementId, progress) => set((state) => {
        const achievement = state.achievements.find((a: GameAchievement) => a.achievement_id === achievementId)
        if (achievement) {
          achievement.progress = progress
          if (progress >= achievement.target && !achievement.unlocked_at) {
            achievement.unlocked_at = new Date().toISOString()
          }
        }
      }),

      // Leaderboard
      fetchLeaderboard: async (exerciseId, timeframe = 'all') => {
        const { setLoading, setError } = get()
        setLoading(true)
        setError(null)

        try {
          const params = new URLSearchParams()
          if (exerciseId) params.append('exercise', exerciseId)
          params.append('timeframe', timeframe)

          const response = await fetch(`/api/leaderboard?${params}`)
          if (!response.ok) throw new Error('Failed to fetch leaderboard')
          
          const data = await response.json()
          if (data.success && data.data) {
            set((state) => {
              state.leaderboard = data.data.leaderboard || []
              state.globalLeaderboard = data.data.leaderboard || []
            })
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to fetch leaderboard')
        } finally {
          setLoading(false)
        }
      },

      submitToLeaderboard: async (performance) => {
        const { setLoading, setError } = get()
        setLoading(true)
        setError(null)

        try {
          const response = await fetch('/api/leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(performance)
          })

          if (!response.ok) throw new Error('Failed to submit to leaderboard')
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to submit to leaderboard')
        } finally {
          setLoading(false)
        }
      },

      getUserRank: (userId, exerciseId) => {
        const { leaderboard } = get()
        const entry = leaderboard.find(e => e.userId === userId && e.exerciseId === exerciseId)
        return entry?.rank || null
      },

      // Stats
      updateStats: (performance) => set((state) => {
        state.totalExercises += 1
        state.totalReps += performance.reps
        state.totalDuration += performance.duration
        state.totalCalories += performance.calories
        
        // Update average form score
        const totalFormScore = state.performances.reduce((sum: number, p: ExercisePerformance) => sum + p.formScore, 0)
        state.averageFormScore = Math.round(totalFormScore / state.performances.length)
        
        // Update last exercise date
        state.lastExerciseDate = new Date().toISOString()
        
        // Check streak
        get().calculateStreak()
      }),

      calculateStreak: () => set((state) => {
        if (!state.lastExerciseDate) {
          state.streakDays = 0
          return
        }

        const lastDate = new Date(state.lastExerciseDate)
        const today = new Date()
        const diffTime = Math.abs(today.getTime() - lastDate.getTime())
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 0 || diffDays === 1) {
          state.streakDays += 1
        } else {
          state.streakDays = 1
        }
      }),

      resetStats: () => set((state) => {
        state.totalExercises = 0
        state.totalReps = 0
        state.totalDuration = 0
        state.totalCalories = 0
        state.averageFormScore = 0
        state.streakDays = 0
        state.performances = []
        state.bestPerformances = {}
      }),

      // Camera & Audio
      setCameraReady: (ready) => set((state) => {
        state.isCameraReady = ready
      }),

      setAudioReady: (ready) => set((state) => {
        state.isAudioReady = ready
      }),

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
    })),
    {
      name: 'fitduel-game-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        performances: state.performances.slice(-100), // Keep last 100
        bestPerformances: state.bestPerformances,
        settings: state.settings,
        achievements: state.achievements,
        totalExercises: state.totalExercises,
        totalReps: state.totalReps,
        totalDuration: state.totalDuration,
        totalCalories: state.totalCalories,
        averageFormScore: state.averageFormScore,
        streakDays: state.streakDays,
        lastExerciseDate: state.lastExerciseDate,
      }),
    }
  )
)