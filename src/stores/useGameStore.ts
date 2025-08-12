import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// ====================================
// TYPES
// ====================================
export type GameMode = 'training' | 'duel' | 'tournament' | 'mission'
export type GameStatus = 'idle' | 'ready' | 'countdown' | 'playing' | 'paused' | 'completed'
export type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid'

export interface GameSession {
  id: string
  mode: GameMode
  exerciseCode: string
  exerciseName: string
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
  exerciseCode: string
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
  type: 'milestone' | 'streak' | 'perfect' | 'speed' | 'endurance'
  name: string
  description: string
  unlockedAt?: string
  progress: number
  target: number
}

export interface LeaderboardEntry {
  userId: string
  username: string
  avatar?: string
  score: number
  exerciseCode: string
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
  startSession: (mode: GameMode, exerciseCode: string, difficulty: string, targets?: { reps?: number; time?: number }) => void
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
  getBestPerformance: (exerciseCode: string) => ExercisePerformance | null
  
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
  fetchLeaderboard: (exerciseCode?: string, timeframe?: 'daily' | 'weekly' | 'monthly' | 'all') => Promise<void>
  submitToLeaderboard: (performance: ExercisePerformance) => Promise<void>
  getUserRank: (userId: string, exerciseCode: string) => number | null
  
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
      startSession: (mode, exerciseCode, difficulty, targets) => set((state) => {
        state.currentSession = {
          id: generateSessionId(),
          mode,
          exerciseCode,
          exerciseName: exerciseCode.replace('_', ' '),
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
          const exerciseCode = performance.exerciseCode
          const currentBest = state.bestPerformances[exerciseCode]
          
          if (!currentBest || performance.reps > currentBest.reps ||
              (performance.reps === currentBest.reps && performance.formScore > currentBest.formScore)) {
            state.bestPerformances[exerciseCode] = performance
          }
        })

        // Update stats
        const { updateStats } = get()
        updateStats(performance)
      },

      getBestPerformance: (exerciseCode) => {
        return get().bestPerformances[exerciseCode] || null
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
        if (state.streakDays >= 7 && !state.achievements.find((a: GameAchievement) => a.id === 'week-streak')) {
          get().unlockAchievement('week-streak')
        }
        
        // Check total exercises achievement
        if (state.totalExercises >= 100 && !state.achievements.find((a: GameAchievement) => a.id === '100-exercises')) {
          get().unlockAchievement('100-exercises')
        }
        
        // Check perfect form achievement
        const perfectForms = state.performances.filter(p => p.formScore >= 95).length
        if (perfectForms >= 10 && !state.achievements.find((a: GameAchievement) => a.id === 'perfect-10')) {
          get().unlockAchievement('perfect-10')
        }
      },

      unlockAchievement: (achievementId) => set((state) => {
        const achievement = state.achievements.find((a: GameAchievement) => a.id === achievementId)
        if (achievement && !achievement.unlockedAt) {
          achievement.unlockedAt = new Date().toISOString()
        }
      }),

      updateAchievementProgress: (achievementId, progress) => set((state) => {
        const achievement = state.achievements.find((a: GameAchievement) => a.id === achievementId)
        if (achievement) {
          achievement.progress = progress
          if (progress >= achievement.target && !achievement.unlockedAt) {
            achievement.unlockedAt = new Date().toISOString()
          }
        }
      }),

      // Leaderboard
      fetchLeaderboard: async (exerciseCode, timeframe = 'all') => {
        const { setLoading, setError } = get()
        setLoading(true)
        setError(null)

        try {
          const params = new URLSearchParams()
          if (exerciseCode) params.append('exercise', exerciseCode)
          params.append('timeframe', timeframe)

          const response = await fetch(`/api/leaderboard?${params}`)
          if (!response.ok) throw new Error('Failed to fetch leaderboard')
          
          const data = await response.json()
          set((state) => {
            state.leaderboard = data.leaderboard || []
            state.globalLeaderboard = data.global || []
          })
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

      getUserRank: (userId, exerciseCode) => {
        const { leaderboard } = get()
        const entry = leaderboard.find(e => e.userId === userId && e.exerciseCode === exerciseCode)
        return entry?.rank || null
      },

      // Stats
      updateStats: (performance) => set((state) => {
        state.totalExercises += 1
        state.totalReps += performance.reps
        state.totalDuration += performance.duration
        state.totalCalories += performance.calories
        
        // Update average form score - FIX: Added type annotation for 'sum'
        const totalFormScore = state.performances.reduce((sum: number, p) => sum + p.formScore, 0)
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