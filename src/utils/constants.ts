// ====================================
// APP CONFIGURATION
// ====================================
export const APP_NAME = 'FitDuel'
export const APP_VERSION = '0.1.0'
export const APP_DOMAIN = 'fit-duel.com'
export const APP_DOMAIN_IT = 'fit-duel.it'
export const APP_TAGLINE = 'Sfida. Allenati. Domina.'

// ====================================
// EXERCISES CONFIGURATION
// ====================================
export const EXERCISES = {
  PUSHUP: 'pushup',
  SQUAT: 'squat',
  PLANK: 'plank',
  BURPEE: 'burpee',
  JUMPING_JACK: 'jumping_jack',
  MOUNTAIN_CLIMBER: 'mountain_climber',
  WALL_SIT: 'wall_sit',
  DEAD_HANG: 'dead_hang',
  BRIDGE_HOLD: 'bridge_hold',
} as const

export const EXERCISE_DATA = {
  [EXERCISES.PUSHUP]: {
    name: 'Push-Up',
    nameIt: 'Flessioni',
    icon: '💪',
    measurement: 'reps',
    unit: 'ripetizioni',
    color: 'indigo',
    difficulty: 2,
    isTimeBased: false,
    defaultTargets: {
      easy: 10,
      medium: 20,
      hard: 30,
      extreme: 50
    }
  },
  [EXERCISES.SQUAT]: {
    name: 'Squat',
    nameIt: 'Squat',
    icon: '🦵',
    measurement: 'reps',
    unit: 'ripetizioni',
    color: 'purple',
    difficulty: 1,
    isTimeBased: false,
    defaultTargets: {
      easy: 15,
      medium: 30,
      hard: 45,
      extreme: 60
    }
  },
  [EXERCISES.PLANK]: {
    name: 'Plank',
    nameIt: 'Plank',
    icon: '🏋️',
    measurement: 'duration',
    unit: 'secondi',
    color: 'green',
    difficulty: 3,
    isTimeBased: true,
    defaultTargets: {
      easy: 30,
      medium: 60,
      hard: 90,
      extreme: 120
    }
  },
  [EXERCISES.WALL_SIT]: {
    name: 'Wall Sit',
    nameIt: 'Seduta al Muro',
    icon: '🪑',
    measurement: 'duration',
    unit: 'secondi',
    color: 'orange',
    difficulty: 2,
    isTimeBased: true,
    defaultTargets: {
      easy: 20,
      medium: 45,
      hard: 60,
      extreme: 90
    }
  },
  [EXERCISES.DEAD_HANG]: {
    name: 'Dead Hang',
    nameIt: 'Appeso alla Sbarra',
    icon: '🤸',
    measurement: 'duration',
    unit: 'secondi',
    color: 'cyan',
    difficulty: 3,
    isTimeBased: true,
    defaultTargets: {
      easy: 15,
      medium: 30,
      hard: 45,
      extreme: 60
    }
  },
  [EXERCISES.BRIDGE_HOLD]: {
    name: 'Bridge Hold',
    nameIt: 'Ponte Isometrico',
    icon: '🌉',
    measurement: 'duration',
    unit: 'secondi',
    color: 'pink',
    difficulty: 2,
    isTimeBased: true,
    defaultTargets: {
      easy: 20,
      medium: 40,
      hard: 60,
      extreme: 90
    }
  },
  [EXERCISES.BURPEE]: {
    name: 'Burpee',
    nameIt: 'Burpee',
    icon: '🔥',
    measurement: 'reps',
    unit: 'ripetizioni',
    color: 'red',
    difficulty: 4,
    isTimeBased: false,
    defaultTargets: {
      easy: 5,
      medium: 10,
      hard: 15,
      extreme: 25
    }
  },
  [EXERCISES.JUMPING_JACK]: {
    name: 'Jumping Jack',
    nameIt: 'Jumping Jack',
    icon: '⭐',
    measurement: 'reps',
    unit: 'ripetizioni',
    color: 'yellow',
    difficulty: 1,
    isTimeBased: false,
    defaultTargets: {
      easy: 20,
      medium: 40,
      hard: 60,
      extreme: 100
    }
  },
  [EXERCISES.MOUNTAIN_CLIMBER]: {
    name: 'Mountain Climber',
    nameIt: 'Mountain Climber',
    icon: '⛰️',
    measurement: 'reps',
    unit: 'ripetizioni',
    color: 'blue',
    difficulty: 3,
    isTimeBased: false,
    defaultTargets: {
      easy: 10,
      medium: 20,
      hard: 30,
      extreme: 50
    }
  },
}

// Helper function to get exercise by any identifier
export const getExerciseData = (exerciseKey: string) => {
  // Try direct lookup
  if (EXERCISE_DATA[exerciseKey]) {
    return EXERCISE_DATA[exerciseKey]
  }
  
  // Try to find by name or code variations
  const normalizedKey = exerciseKey.toLowerCase().replace(/[_-]/g, '')
  for (const [key, data] of Object.entries(EXERCISE_DATA)) {
    const normalizedDataKey = key.toLowerCase().replace(/[_-]/g, '')
    const normalizedName = data.name.toLowerCase().replace(/[_-\s]/g, '')
    const normalizedNameIt = data.nameIt.toLowerCase().replace(/[_-\s]/g, '')
    
    if (normalizedDataKey === normalizedKey || 
        normalizedName === normalizedKey || 
        normalizedNameIt === normalizedKey) {
      return data
    }
  }
  
  return null
}

// Get all time-based exercises
export const getTimeBasedExercises = () => {
  return Object.entries(EXERCISE_DATA)
    .filter(([_, data]) => data.isTimeBased)
    .map(([key, data]) => ({ key, ...data }))
}

// Get all rep-based exercises
export const getRepBasedExercises = () => {
  return Object.entries(EXERCISE_DATA)
    .filter(([_, data]) => !data.isTimeBased)
    .map(([key, data]) => ({ key, ...data }))
}

// ====================================
// DUEL CONFIGURATION
// ====================================
export const DUEL_STATUS = {
  PENDING: 'pending',      // In attesa di accettazione
  ACCEPTED: 'accepted',    // Accettato, in attesa di completamento
  ACTIVE: 'active',       // In corso
  COMPLETED: 'completed', // Completato
  CANCELLED: 'cancelled', // Annullato
  EXPIRED: 'expired',     // Scaduto
  REJECTED: 'rejected',   // Rifiutato
  OPEN: 'open',          // Aperto a tutti
} as const

export const DUEL_TYPES = {
  CLASSIC: '1v1',           // Duello classico 1 contro 1
  OPEN: 'open',            // Sfida aperta a tutti
  TOURNAMENT: 'tournament',  // Torneo
  MISSION: 'mission',       // Missione giornaliera
  TEAM: 'team',            // Sfida a squadre
  ROYALE: 'royale',        // Battle royale (multipli partecipanti)
} as const

export const DUEL_MODES = {
  LIVE: 'live',           // In tempo reale
  ASYNC: 'async',         // Asincrono (entro tempo limite)
  TIMED: 'timed',         // Con timer fisso
} as const

// ====================================
// XP & REWARDS SYSTEM
// ====================================
export const XP_REWARDS = {
  // Duel rewards
  DUEL_WIN: 100,
  DUEL_LOSE: 25,
  DUEL_DRAW: 50,
  DUEL_PERFECT: 150,        // Vittoria con form perfetta
  DUEL_COMEBACK: 200,       // Vittoria in rimonta
  DUEL_STREAK_3: 50,        // 3 vittorie di fila
  DUEL_STREAK_5: 100,       // 5 vittorie di fila
  DUEL_STREAK_10: 250,      // 10 vittorie di fila
  
  // Exercise rewards
  EXERCISE_COMPLETE: 50,
  PERSONAL_BEST: 100,
  FORM_EXCELLENT: 75,       // Form score > 90%
  FORM_GOOD: 35,            // Form score > 70%
  
  // Daily rewards
  DAILY_LOGIN: 10,
  DAILY_FIRST_DUEL: 25,
  DAILY_THREE_DUELS: 50,
  DAILY_MISSION: 75,
  
  // Social rewards
  FRIEND_INVITED: 100,
  FRIEND_ACCEPTED: 50,
  SHARED_VICTORY: 25,
} as const

// ====================================
// LEVELS & RANKS
// ====================================
export const LEVELS = [
  { level: 1, minXP: 0, title: 'Rookie', titleIt: 'Principiante', badge: '🥉' },
  { level: 2, minXP: 200, title: 'Beginner', titleIt: 'Novizio', badge: '🥉' },
  { level: 3, minXP: 500, title: 'Apprentice', titleIt: 'Apprendista', badge: '🥉' },
  { level: 4, minXP: 900, title: 'Fighter', titleIt: 'Combattente', badge: '🥈' },
  { level: 5, minXP: 1500, title: 'Warrior', titleIt: 'Guerriero', badge: '🥈' },
  { level: 6, minXP: 2500, title: 'Veteran', titleIt: 'Veterano', badge: '🥈' },
  { level: 7, minXP: 4000, title: 'Elite', titleIt: 'Elite', badge: '🥇' },
  { level: 8, minXP: 6000, title: 'Master', titleIt: 'Maestro', badge: '🥇' },
  { level: 9, minXP: 9000, title: 'Champion', titleIt: 'Campione', badge: '🏆' },
  { level: 10, minXP: 13000, title: 'Legend', titleIt: 'Leggenda', badge: '👑' },
  { level: 11, minXP: 18000, title: 'Mythic', titleIt: 'Mitico', badge: '⚔️' },
  { level: 12, minXP: 25000, title: 'Immortal', titleIt: 'Immortale', badge: '🔥' },
]

// ====================================
// BADGES & ACHIEVEMENTS
// ====================================
export const BADGE_CATEGORIES = {
  ACHIEVEMENT: 'achievement',
  MILESTONE: 'milestone',
  SPECIAL: 'special',
  SEASONAL: 'seasonal',
  SOCIAL: 'social',
} as const

export const BADGE_RARITY = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
  MYTHIC: 'mythic',
} as const

// ====================================
// MISSIONS & CHALLENGES
// ====================================
export const MISSION_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  SPECIAL: 'special',
  EVENT: 'event',
} as const

export const MISSION_DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  EXTREME: 'extreme',
} as const

// ====================================
// LEADERBOARD TYPES
// ====================================
export const LEADERBOARD_TYPES = {
  GLOBAL: 'global',           // Classifica globale
  WEEKLY: 'weekly',           // Classifica settimanale
  MONTHLY: 'monthly',         // Classifica mensile
  FRIENDS: 'friends',         // Solo amici
  NATIONAL: 'national',       // Nazionale (Italia)
  EXERCISE: 'exercise',       // Per esercizio specifico
} as const

// ====================================
// NOTIFICATIONS
// ====================================
export const NOTIFICATION_TYPES = {
  DUEL_RECEIVED: 'duel_received',
  DUEL_ACCEPTED: 'duel_accepted',
  DUEL_REJECTED: 'duel_rejected',
  DUEL_COMPLETED: 'duel_completed',
  DUEL_WON: 'duel_won',
  DUEL_LOST: 'duel_lost',
  FRIEND_REQUEST: 'friend_request',
  BADGE_UNLOCKED: 'badge_unlocked',
  LEVEL_UP: 'level_up',
  TOURNAMENT_START: 'tournament_start',
  MISSION_COMPLETE: 'mission_complete',
  PERSONAL_BEST: 'personal_best',
} as const

// ====================================
// AI FORM VALIDATION
// ====================================
export const FORM_SCORE_THRESHOLDS = {
  PERFECT: 95,
  EXCELLENT: 85,
  GOOD: 70,
  ACCEPTABLE: 50,
  POOR: 30,
} as const

export const FORM_FEEDBACK = {
  PERFECT: 'Forma perfetta! Esecuzione impeccabile! 🔥',
  EXCELLENT: 'Ottima forma! Continua così! 💪',
  GOOD: 'Buona esecuzione, piccoli miglioramenti possibili 👍',
  ACCEPTABLE: 'Forma accettabile, ma puoi fare meglio 💡',
  POOR: 'Attenzione alla forma, rischi infortuni ⚠️',
} as const

// ====================================
// TIMER PRESETS
// ====================================
export const TIMER_PRESETS = {
  QUICK: 30,          // 30 secondi
  STANDARD: 60,       // 1 minuto
  EXTENDED: 120,      // 2 minuti
  MARATHON: 180,      // 3 minuti
  EPIC: 300,         // 5 minuti
} as const

// ====================================
// SOCIAL FEATURES
// ====================================
export const FRIEND_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  BLOCKED: 'blocked',
  REJECTED: 'rejected',
} as const

export const PRIVACY_LEVELS = {
  PUBLIC: 'public',
  FRIENDS: 'friends',
  PRIVATE: 'private',
} as const

// ====================================
// ERROR MESSAGES
// ====================================
export const ERROR_MESSAGES = {
  GENERIC: 'Ops! Qualcosa è andato storto. Riprova.',
  NETWORK: 'Errore di connessione. Controlla la tua rete.',
  AUTH_REQUIRED: 'Devi effettuare il login per continuare.',
  DUEL_NOT_FOUND: 'Duello non trovato.',
  USER_NOT_FOUND: 'Utente non trovato.',
  INVALID_FORM: 'Compila tutti i campi richiesti.',
  DUEL_EXPIRED: 'Questo duello è scaduto.',
  ALREADY_COMPLETED: 'Hai già completato questo duello.',
} as const

// ====================================
// SUCCESS MESSAGES
// ====================================
export const SUCCESS_MESSAGES = {
  DUEL_CREATED: 'Duello creato! In attesa dell\'avversario...',
  DUEL_ACCEPTED: 'Duello accettato! Che vinca il migliore!',
  DUEL_COMPLETED: 'Duello completato! Controlla i risultati.',
  FRIEND_ADDED: 'Amico aggiunto con successo!',
  PROFILE_UPDATED: 'Profilo aggiornato!',
  BADGE_UNLOCKED: 'Nuovo badge sbloccato! 🎉',
  LEVEL_UP: 'Level Up! Sei salito di livello! 🚀',
} as const