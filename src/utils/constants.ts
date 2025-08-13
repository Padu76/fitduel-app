// ====================================
// APP CONFIGURATION
// ====================================
export const APP_NAME = 'FitDuel'
export const APP_VERSION = '0.1.0'
export const APP_DOMAIN = 'fit-duel.com'
export const APP_DOMAIN_IT = 'fit-duel.it'

// ====================================
// API CONFIGURATION
// ====================================
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// ====================================
// EXERCISE DATA
// ====================================
export interface ExerciseData {
  name: string
  nameIt: string
  icon: string
  measurement: string
  unit: string
  color: string
  difficulty: number
  isTimeBased: boolean
  defaultTargets: {
    easy: number
    medium: number
    hard: number
    extreme: number
  }
}

export const EXERCISE_DATA: Record<string, ExerciseData> = {
  pushup: {
    name: 'Push-Up',
    nameIt: 'Flessioni',
    icon: '💪',
    measurement: 'Ripetizioni',
    unit: 'reps',
    color: 'from-red-500 to-orange-500',
    difficulty: 3,
    isTimeBased: false,
    defaultTargets: {
      easy: 10,
      medium: 20,
      hard: 30,
      extreme: 50
    }
  },
  plank: {
    name: 'Plank',
    nameIt: 'Plank',
    icon: '🏋️',
    measurement: 'Tempo',
    unit: 'seconds',
    color: 'from-blue-500 to-indigo-500',
    difficulty: 4,
    isTimeBased: true,
    defaultTargets: {
      easy: 30,
      medium: 60,
      hard: 120,
      extreme: 300
    }
  },
  squat: {
    name: 'Squat',
    nameIt: 'Squat',
    icon: '🦵',
    measurement: 'Ripetizioni',
    unit: 'reps',
    color: 'from-green-500 to-emerald-500',
    difficulty: 2,
    isTimeBased: false,
    defaultTargets: {
      easy: 15,
      medium: 25,
      hard: 40,
      extreme: 60
    }
  },
  burpee: {
    name: 'Burpee',
    nameIt: 'Burpee',
    icon: '🔥',
    measurement: 'Ripetizioni',
    unit: 'reps',
    color: 'from-purple-500 to-pink-500',
    difficulty: 5,
    isTimeBased: false,
    defaultTargets: {
      easy: 5,
      medium: 10,
      hard: 20,
      extreme: 30
    }
  },
  situp: {
    name: 'Sit-Up',
    nameIt: 'Addominali',
    icon: '🎯',
    measurement: 'Ripetizioni',
    unit: 'reps',
    color: 'from-yellow-500 to-orange-500',
    difficulty: 2,
    isTimeBased: false,
    defaultTargets: {
      easy: 15,
      medium: 25,
      hard: 40,
      extreme: 60
    }
  },
  pullup: {
    name: 'Pull-Up',
    nameIt: 'Trazioni',
    icon: '🏆',
    measurement: 'Ripetizioni',
    unit: 'reps',
    color: 'from-cyan-500 to-blue-500',
    difficulty: 5,
    isTimeBased: false,
    defaultTargets: {
      easy: 3,
      medium: 8,
      hard: 15,
      extreme: 25
    }
  },
  wall_sit: {
    name: 'Wall Sit',
    nameIt: 'Wall Sit',
    icon: '🧱',
    measurement: 'Tempo',
    unit: 'seconds',
    color: 'from-gray-500 to-slate-500',
    difficulty: 3,
    isTimeBased: true,
    defaultTargets: {
      easy: 30,
      medium: 60,
      hard: 120,
      extreme: 180
    }
  },
  dead_hang: {
    name: 'Dead Hang',
    nameIt: 'Sospensione',
    icon: '🏃',
    measurement: 'Tempo',
    unit: 'seconds',
    color: 'from-teal-500 to-green-500',
    difficulty: 4,
    isTimeBased: true,
    defaultTargets: {
      easy: 15,
      medium: 30,
      hard: 60,
      extreme: 120
    }
  },
  bridge_hold: {
    name: 'Bridge Hold',
    nameIt: 'Ponte',
    icon: '🌉',
    measurement: 'Tempo',
    unit: 'seconds',
    color: 'from-rose-500 to-pink-500',
    difficulty: 3,
    isTimeBased: true,
    defaultTargets: {
      easy: 20,
      medium: 45,
      hard: 90,
      extreme: 150
    }
  },
  mountain_climber: {
    name: 'Mountain Climber',
    nameIt: 'Scalata in Montagna',
    icon: '⛰️',
    measurement: 'Ripetizioni',
    unit: 'reps',
    color: 'from-amber-500 to-yellow-500',
    difficulty: 4,
    isTimeBased: false,
    defaultTargets: {
      easy: 20,
      medium: 30,
      hard: 50,
      extreme: 80
    }
  }
}

// ====================================
// HELPER FUNCTIONS
// ====================================
export const getExerciseData = (exerciseKey: string): ExerciseData | null => {
  // Use type assertion with proper checking
  const exercise = EXERCISE_DATA[exerciseKey as keyof typeof EXERCISE_DATA]
  return exercise || null
}

export const getTimeBasedExercises = (): string[] => {
  return Object.keys(EXERCISE_DATA).filter(
    key => EXERCISE_DATA[key as keyof typeof EXERCISE_DATA]?.isTimeBased
  )
}

export const getRepBasedExercises = (): string[] => {
  return Object.keys(EXERCISE_DATA).filter(
    key => !EXERCISE_DATA[key as keyof typeof EXERCISE_DATA]?.isTimeBased
  )
}

export const getAllExercises = (): string[] => {
  return Object.keys(EXERCISE_DATA)
}

export const getExercisesByDifficulty = (difficulty: number): string[] => {
  return Object.keys(EXERCISE_DATA).filter(
    key => EXERCISE_DATA[key as keyof typeof EXERCISE_DATA]?.difficulty === difficulty
  )
}

// ====================================
// DIFFICULTY LEVELS
// ====================================
export const DIFFICULTY_LEVELS = {
  easy: { name: 'Facile', color: 'text-green-500', multiplier: 1 },
  medium: { name: 'Medio', color: 'text-yellow-500', multiplier: 1.5 },
  hard: { name: 'Difficile', color: 'text-orange-500', multiplier: 2 },
  extreme: { name: 'Estremo', color: 'text-red-500', multiplier: 3 }
} as const

export type DifficultyLevel = keyof typeof DIFFICULTY_LEVELS

// ====================================
// GAME CONSTANTS
// ====================================
export const GAME_CONFIG = {
  XP_PER_VICTORY: 100,
  COINS_PER_VICTORY: 25,
  STREAK_BONUS_MULTIPLIER: 1.1,
  MAX_DAILY_STREAK: 365,
  LEVEL_XP_BASE: 100,
  DUEL_DURATION_HOURS: 24,
  TOURNAMENT_DURATION_DAYS: 7
}

// ====================================
// UI CONSTANTS
// ====================================
export const THEME_COLORS = {
  primary: 'from-indigo-500 to-purple-500',
  secondary: 'from-gray-700 to-gray-800',
  success: 'from-green-500 to-emerald-500',
  warning: 'from-yellow-500 to-orange-500',
  danger: 'from-red-500 to-pink-500',
  info: 'from-blue-500 to-cyan-500'
}

// ====================================
// ANIMATION CONSTANTS
// ====================================
export const ANIMATION_DURATIONS = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  verySlow: 1.0
}

// ====================================
// VALIDATION CONSTANTS
// ====================================
export const VALIDATION_RULES = {
  username: {
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/
  },
  password: {
    minLength: 8,
    maxLength: 100
  },
  duelDuration: {
    min: 1,
    max: 168 // 7 days in hours
  },
  repsRange: {
    min: 1,
    max: 1000
  },
  timeRange: {
    min: 5, // 5 seconds
    max: 600 // 10 minutes
  }
}

// ====================================
// LOCAL STORAGE KEYS
// ====================================
export const STORAGE_KEYS = {
  user: 'fitduel_user',
  preferences: 'fitduel_preferences',
  tutorial: 'fitduel_tutorial_completed',
  theme: 'fitduel_theme'
}

// ====================================
// ERROR MESSAGES
// ====================================
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Errore di connessione. Riprova più tardi.',
  INVALID_CREDENTIALS: 'Credenziali non valide.',
  USER_NOT_FOUND: 'Utente non trovato.',
  DUEL_NOT_FOUND: 'Duello non trovato.',
  UNAUTHORIZED: 'Non autorizzato.',
  VALIDATION_ERROR: 'Dati non validi.',
  GENERIC_ERROR: 'Si è verificato un errore. Riprova più tardi.'
}

// ====================================
// SUCCESS MESSAGES
// ====================================
export const SUCCESS_MESSAGES = {
  DUEL_CREATED: 'Duello creato con successo!',
  DUEL_ACCEPTED: 'Duello accettato!',
  DUEL_COMPLETED: 'Duello completato!',
  FRIEND_ADDED: 'Amico aggiunto!',
  PROFILE_UPDATED: 'Profilo aggiornato!',
  ACHIEVEMENT_UNLOCKED: 'Achievement sbloccato!'
}

// ====================================
// NOTIFICATION TYPES
// ====================================
export const NOTIFICATION_TYPES = {
  DUEL_INVITATION: 'duel_invitation',
  DUEL_COMPLETED: 'duel_completed',
  FRIEND_REQUEST: 'friend_request',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  LEVEL_UP: 'level_up',
  TOURNAMENT_UPDATE: 'tournament_update'
} as const

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES]