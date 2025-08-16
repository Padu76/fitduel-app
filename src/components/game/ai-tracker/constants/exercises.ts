// src/components/game/ai-tracker/constants/exercises.ts

import type { ExerciseConfig } from '../types'

export const EXERCISE_DEFINITIONS: Record<string, ExerciseConfig> = {
  // ====================================
  // STRENGTH EXERCISES
  // ====================================
  
  'push_up': {
    id: 'push_up',
    name: 'Push-Up',
    code: 'push_up',
    difficulty: 'medium',
    category: 'strength',
    muscleGroups: ['chest', 'shoulders', 'triceps', 'core'],
    caloriesPerRep: 0.32,
    perfectFormThreshold: 90,
    goodFormThreshold: 75,
    targetReps: 15,
    description: 'Esercizio fondamentale per petto e braccia',
    instructions: [
      'Posiziona le mani alla larghezza delle spalle',
      'Mantieni il corpo in linea retta',
      'Scendi fino a sfiorare il pavimento',
      'Spingi verso l\'alto controllando il movimento'
    ],
    commonMistakes: [
      'Schiena non allineata',
      'Gomiti troppo larghi',
      'Movimento troppo veloce'
    ]
  },

  'diamond_push_up': {
    id: 'diamond_push_up',
    name: 'Diamond Push-Up',
    code: 'diamond_push_up',
    difficulty: 'hard',
    category: 'strength',
    muscleGroups: ['triceps', 'chest', 'shoulders'],
    caloriesPerRep: 0.35,
    perfectFormThreshold: 85,
    goodFormThreshold: 70,
    targetReps: 10,
    description: 'Variante avanzata per tricipiti',
    instructions: [
      'Unisci le mani formando un diamante',
      'Gomiti vicini al corpo',
      'Movimento lento e controllato'
    ]
  },

  'wide_push_up': {
    id: 'wide_push_up',
    name: 'Wide Push-Up',
    code: 'wide_push_up',
    difficulty: 'medium',
    category: 'strength',
    muscleGroups: ['chest', 'shoulders'],
    caloriesPerRep: 0.33,
    perfectFormThreshold: 88,
    goodFormThreshold: 73,
    targetReps: 12,
    description: 'Push-up con presa larga per il petto'
  },

  'squat': {
    id: 'squat',
    name: 'Squat',
    code: 'squat',
    difficulty: 'easy',
    category: 'strength',
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings', 'core'],
    caloriesPerRep: 0.35,
    perfectFormThreshold: 85,
    goodFormThreshold: 70,
    targetReps: 20,
    description: 'Esercizio base per gambe e glutei',
    instructions: [
      'Piedi alla larghezza delle spalle',
      'Scendi come per sederti',
      'Ginocchia in linea con i piedi',
      'Schiena dritta durante tutto il movimento'
    ]
  },

  'jump_squat': {
    id: 'jump_squat',
    name: 'Jump Squat',
    code: 'jump_squat',
    difficulty: 'medium',
    category: 'strength',
    muscleGroups: ['quadriceps', 'glutes', 'calves'],
    caloriesPerRep: 0.5,
    perfectFormThreshold: 82,
    goodFormThreshold: 67,
    targetReps: 15,
    description: 'Squat esplosivo con salto'
  },

  'pistol_squat': {
    id: 'pistol_squat',
    name: 'Pistol Squat',
    code: 'pistol_squat',
    difficulty: 'extreme',
    category: 'strength',
    muscleGroups: ['quadriceps', 'glutes', 'core', 'balance'],
    caloriesPerRep: 0.6,
    perfectFormThreshold: 80,
    goodFormThreshold: 65,
    targetReps: 5,
    description: 'Squat su una gamba - massima difficoltà'
  },

  'lunge': {
    id: 'lunge',
    name: 'Lunge',
    code: 'lunge',
    difficulty: 'easy',
    category: 'strength',
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
    caloriesPerRep: 0.4,
    perfectFormThreshold: 85,
    goodFormThreshold: 70,
    targetReps: 20,
    description: 'Affondi alternati per gambe'
  },

  'reverse_lunge': {
    id: 'reverse_lunge',
    name: 'Reverse Lunge',
    code: 'reverse_lunge',
    difficulty: 'medium',
    category: 'strength',
    muscleGroups: ['glutes', 'quadriceps', 'hamstrings'],
    caloriesPerRep: 0.4,
    perfectFormThreshold: 85,
    goodFormThreshold: 70,
    targetReps: 16,
    description: 'Affondi all\'indietro'
  },

  'bulgarian_split_squat': {
    id: 'bulgarian_split_squat',
    name: 'Bulgarian Split Squat',
    code: 'bulgarian_split_squat',
    difficulty: 'hard',
    category: 'strength',
    muscleGroups: ['quadriceps', 'glutes', 'balance'],
    caloriesPerRep: 0.45,
    perfectFormThreshold: 83,
    goodFormThreshold: 68,
    targetReps: 12,
    description: 'Split squat con piede posteriore elevato'
  },

  // ====================================
  // CORE EXERCISES
  // ====================================

  'plank': {
    id: 'plank',
    name: 'Plank',
    code: 'plank',
    difficulty: 'medium',
    category: 'core',
    muscleGroups: ['core', 'shoulders', 'back'],
    caloriesPerRep: 0.05, // per secondo
    perfectFormThreshold: 90,
    goodFormThreshold: 80,
    targetTime: 60, // secondi
    description: 'Isometrico per core stability',
    instructions: [
      'Gomiti sotto le spalle',
      'Corpo in linea retta',
      'Addominali contratti',
      'Respira normalmente'
    ]
  },

  'side_plank': {
    id: 'side_plank',
    name: 'Side Plank',
    code: 'side_plank',
    difficulty: 'medium',
    category: 'core',
    muscleGroups: ['obliques', 'core', 'shoulders'],
    caloriesPerRep: 0.04,
    perfectFormThreshold: 88,
    goodFormThreshold: 78,
    targetTime: 45,
    description: 'Plank laterale per obliqui'
  },

  'crunch': {
    id: 'crunch',
    name: 'Crunch',
    code: 'crunch',
    difficulty: 'easy',
    category: 'core',
    muscleGroups: ['abs'],
    caloriesPerRep: 0.25,
    perfectFormThreshold: 90,
    goodFormThreshold: 75,
    targetReps: 30,
    description: 'Addominali classici'
  },

  'bicycle_crunch': {
    id: 'bicycle_crunch',
    name: 'Bicycle Crunch',
    code: 'bicycle_crunch',
    difficulty: 'medium',
    category: 'core',
    muscleGroups: ['abs', 'obliques'],
    caloriesPerRep: 0.3,
    perfectFormThreshold: 85,
    goodFormThreshold: 70,
    targetReps: 40,
    description: 'Crunch con movimento alternato'
  },

  'russian_twist': {
    id: 'russian_twist',
    name: 'Russian Twist',
    code: 'russian_twist',
    difficulty: 'medium',
    category: 'core',
    muscleGroups: ['obliques', 'abs'],
    caloriesPerRep: 0.28,
    perfectFormThreshold: 86,
    goodFormThreshold: 71,
    targetReps: 30,
    description: 'Rotazioni del busto per obliqui'
  },

  'leg_raise': {
    id: 'leg_raise',
    name: 'Leg Raise',
    code: 'leg_raise',
    difficulty: 'medium',
    category: 'core',
    muscleGroups: ['lower_abs', 'hip_flexors'],
    caloriesPerRep: 0.35,
    perfectFormThreshold: 87,
    goodFormThreshold: 72,
    targetReps: 15,
    description: 'Sollevamento gambe per addominali bassi'
  },

  'mountain_climber': {
    id: 'mountain_climber',
    name: 'Mountain Climber',
    code: 'mountain_climber',
    difficulty: 'medium',
    category: 'core',
    muscleGroups: ['core', 'shoulders', 'cardio'],
    caloriesPerRep: 0.4,
    perfectFormThreshold: 85,
    goodFormThreshold: 70,
    targetReps: 40,
    description: 'Esercizio dinamico core + cardio'
  },

  // ====================================
  // CARDIO EXERCISES
  // ====================================

  'jumping_jack': {
    id: 'jumping_jack',
    name: 'Jumping Jack',
    code: 'jumping_jack',
    difficulty: 'easy',
    category: 'cardio',
    muscleGroups: ['full_body'],
    caloriesPerRep: 0.2,
    perfectFormThreshold: 80,
    goodFormThreshold: 65,
    targetReps: 50,
    description: 'Cardio base - riscaldamento perfetto',
    instructions: [
      'Parti con piedi uniti e braccia lungo i fianchi',
      'Salta aprendo gambe e alzando le braccia',
      'Ritorna alla posizione iniziale',
      'Mantieni un ritmo costante'
    ]
  },

  'burpee': {
    id: 'burpee',
    name: 'Burpee',
    code: 'burpee',
    difficulty: 'hard',
    category: 'cardio',
    muscleGroups: ['full_body'],
    caloriesPerRep: 0.5,
    perfectFormThreshold: 85,
    goodFormThreshold: 70,
    targetReps: 10,
    description: 'Esercizio total body ad alta intensità',
    instructions: [
      'Parti in piedi',
      'Scendi in squat e appoggia le mani',
      'Salta indietro in plank',
      'Fai un push-up (opzionale)',
      'Salta i piedi verso le mani',
      'Salta in alto con braccia sopra la testa'
    ]
  },

  'high_knees': {
    id: 'high_knees',
    name: 'High Knees',
    code: 'high_knees',
    difficulty: 'easy',
    category: 'cardio',
    muscleGroups: ['legs', 'core', 'cardio'],
    caloriesPerRep: 0.15,
    perfectFormThreshold: 82,
    goodFormThreshold: 67,
    targetReps: 60,
    description: 'Corsa sul posto con ginocchia alte'
  },

  'butt_kicks': {
    id: 'butt_kicks',
    name: 'Butt Kicks',
    code: 'butt_kicks',
    difficulty: 'easy',
    category: 'cardio',
    muscleGroups: ['hamstrings', 'cardio'],
    caloriesPerRep: 0.12,
    perfectFormThreshold: 80,
    goodFormThreshold: 65,
    targetReps: 60,
    description: 'Corsa sul posto calciate dietro'
  },

  'star_jump': {
    id: 'star_jump',
    name: 'Star Jump',
    code: 'star_jump',
    difficulty: 'medium',
    category: 'cardio',
    muscleGroups: ['full_body'],
    caloriesPerRep: 0.25,
    perfectFormThreshold: 83,
    goodFormThreshold: 68,
    targetReps: 30,
    description: 'Salto a stella - jumping jack esplosivo'
  },

  'skater_jump': {
    id: 'skater_jump',
    name: 'Skater Jump',
    code: 'skater_jump',
    difficulty: 'medium',
    category: 'cardio',
    muscleGroups: ['legs', 'glutes', 'balance'],
    caloriesPerRep: 0.35,
    perfectFormThreshold: 84,
    goodFormThreshold: 69,
    targetReps: 30,
    description: 'Salti laterali stile pattinatore'
  },

  // ====================================
  // FLEXIBILITY & BALANCE
  // ====================================

  'wall_sit': {
    id: 'wall_sit',
    name: 'Wall Sit',
    code: 'wall_sit',
    difficulty: 'medium',
    category: 'strength',
    muscleGroups: ['quadriceps', 'glutes'],
    caloriesPerRep: 0.05, // per secondo
    perfectFormThreshold: 88,
    goodFormThreshold: 75,
    targetTime: 45,
    description: 'Isometrico per quadricipiti'
  },

  'calf_raise': {
    id: 'calf_raise',
    name: 'Calf Raise',
    code: 'calf_raise',
    difficulty: 'easy',
    category: 'strength',
    muscleGroups: ['calves'],
    caloriesPerRep: 0.15,
    perfectFormThreshold: 90,
    goodFormThreshold: 75,
    targetReps: 30,
    description: 'Sollevamento sui polpacci'
  },

  'glute_bridge': {
    id: 'glute_bridge',
    name: 'Glute Bridge',
    code: 'glute_bridge',
    difficulty: 'easy',
    category: 'strength',
    muscleGroups: ['glutes', 'hamstrings', 'core'],
    caloriesPerRep: 0.3,
    perfectFormThreshold: 88,
    goodFormThreshold: 73,
    targetReps: 20,
    description: 'Ponte per glutei'
  },

  'superman': {
    id: 'superman',
    name: 'Superman',
    code: 'superman',
    difficulty: 'easy',
    category: 'core',
    muscleGroups: ['lower_back', 'glutes'],
    caloriesPerRep: 0.25,
    perfectFormThreshold: 87,
    goodFormThreshold: 72,
    targetReps: 15,
    description: 'Estensione della schiena'
  }
}

// ====================================
// EXERCISE CATEGORIES
// ====================================

export const EXERCISE_CATEGORIES = {
  strength: {
    id: 'strength',
    name: 'Forza',
    icon: '💪',
    color: 'from-red-500 to-orange-500',
    description: 'Esercizi per costruire massa muscolare e forza'
  },
  cardio: {
    id: 'cardio',
    name: 'Cardio',
    icon: '🏃',
    color: 'from-blue-500 to-cyan-500',
    description: 'Esercizi per migliorare resistenza e sistema cardiovascolare'
  },
  core: {
    id: 'core',
    name: 'Core',
    icon: '🎯',
    color: 'from-purple-500 to-pink-500',
    description: 'Esercizi per addominali e stabilità del core'
  },
  flexibility: {
    id: 'flexibility',
    name: 'Flessibilità',
    icon: '🧘',
    color: 'from-green-500 to-teal-500',
    description: 'Esercizi per migliorare flessibilità e mobilità'
  },
  balance: {
    id: 'balance',
    name: 'Equilibrio',
    icon: '⚖️',
    color: 'from-indigo-500 to-purple-500',
    description: 'Esercizi per migliorare equilibrio e coordinazione'
  }
}

// ====================================
// DIFFICULTY LEVELS
// ====================================

export const DIFFICULTY_LEVELS = {
  easy: {
    id: 'easy',
    name: 'Facile',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    multiplier: 1.0,
    minLevel: 1
  },
  medium: {
    id: 'medium',
    name: 'Medio',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    multiplier: 1.5,
    minLevel: 5
  },
  hard: {
    id: 'hard',
    name: 'Difficile',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    multiplier: 2.0,
    minLevel: 10
  },
  extreme: {
    id: 'extreme',
    name: 'Estremo',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    multiplier: 3.0,
    minLevel: 20
  }
}

// ====================================
// MUSCLE GROUPS
// ====================================

export const MUSCLE_GROUPS = {
  // Upper Body
  chest: { name: 'Petto', icon: '🎯' },
  shoulders: { name: 'Spalle', icon: '🎯' },
  triceps: { name: 'Tricipiti', icon: '💪' },
  biceps: { name: 'Bicipiti', icon: '💪' },
  back: { name: 'Schiena', icon: '🔙' },
  lower_back: { name: 'Lombari', icon: '🔙' },
  
  // Core
  core: { name: 'Core', icon: '🎯' },
  abs: { name: 'Addominali', icon: '🎯' },
  lower_abs: { name: 'Addominali Bassi', icon: '🎯' },
  obliques: { name: 'Obliqui', icon: '🎯' },
  
  // Lower Body
  quadriceps: { name: 'Quadricipiti', icon: '🦵' },
  hamstrings: { name: 'Femorali', icon: '🦵' },
  glutes: { name: 'Glutei', icon: '🍑' },
  calves: { name: 'Polpacci', icon: '🦵' },
  hip_flexors: { name: 'Flessori Anca', icon: '🦵' },
  
  // Other
  full_body: { name: 'Total Body', icon: '🏃' },
  cardio: { name: 'Cardio', icon: '❤️' },
  balance: { name: 'Equilibrio', icon: '⚖️' }
}

// ====================================
// WORKOUT PRESETS
// ====================================

export const WORKOUT_PRESETS = {
  beginner: {
    name: 'Principiante',
    exercises: ['jumping_jack', 'squat', 'push_up', 'crunch', 'plank'],
    duration: 15, // minuti
    restTime: 30 // secondi
  },
  intermediate: {
    name: 'Intermedio',
    exercises: ['burpee', 'jump_squat', 'diamond_push_up', 'bicycle_crunch', 'mountain_climber'],
    duration: 20,
    restTime: 20
  },
  advanced: {
    name: 'Avanzato',
    exercises: ['burpee', 'pistol_squat', 'diamond_push_up', 'leg_raise', 'bulgarian_split_squat'],
    duration: 30,
    restTime: 15
  },
  hiit: {
    name: 'HIIT',
    exercises: ['burpee', 'jump_squat', 'mountain_climber', 'high_knees', 'star_jump'],
    duration: 20,
    restTime: 10
  },
  strength: {
    name: 'Forza',
    exercises: ['push_up', 'squat', 'lunge', 'plank', 'glute_bridge'],
    duration: 25,
    restTime: 30
  },
  cardio: {
    name: 'Cardio Blast',
    exercises: ['jumping_jack', 'burpee', 'high_knees', 'skater_jump', 'star_jump'],
    duration: 20,
    restTime: 15
  },
  core: {
    name: 'Core Focus',
    exercises: ['plank', 'crunch', 'russian_twist', 'leg_raise', 'bicycle_crunch'],
    duration: 15,
    restTime: 20
  }
}

// ====================================
// ACHIEVEMENTS & MILESTONES
// ====================================

export const EXERCISE_ACHIEVEMENTS = {
  first_perfect: {
    name: 'Prima Perfetta',
    description: 'Completa la tua prima ripetizione perfetta',
    icon: '⭐',
    xp: 50
  },
  perfect_set: {
    name: 'Set Perfetto',
    description: 'Completa 10 ripetizioni perfette di fila',
    icon: '🌟',
    xp: 100
  },
  form_master: {
    name: 'Master della Forma',
    description: 'Mantieni 90%+ form score per un intero esercizio',
    icon: '🏆',
    xp: 200
  },
  hundred_club: {
    name: 'Club dei 100',
    description: 'Completa 100 ripetizioni in un giorno',
    icon: '💯',
    xp: 150
  },
  streak_week: {
    name: 'Settimana di Fuoco',
    description: '7 giorni di allenamento consecutivi',
    icon: '🔥',
    xp: 300
  },
  calorie_crusher: {
    name: 'Brucia Calorie',
    description: 'Brucia 500 calorie in una sessione',
    icon: '🔥',
    xp: 250
  },
  variety_king: {
    name: 'Re della Varietà',
    description: 'Prova 10 esercizi diversi',
    icon: '👑',
    xp: 200
  },
  endurance_beast: {
    name: 'Bestia della Resistenza',
    description: 'Allenati per 30 minuti senza pause',
    icon: '🦾',
    xp: 400
  }
}

// ====================================
// HELPER FUNCTIONS
// ====================================

export const getExerciseById = (id: string): ExerciseConfig | undefined => {
  return EXERCISE_DEFINITIONS[id]
}

export const getExercisesByCategory = (category: string): ExerciseConfig[] => {
  return Object.values(EXERCISE_DEFINITIONS).filter(ex => ex.category === category)
}

export const getExercisesByDifficulty = (difficulty: string): ExerciseConfig[] => {
  return Object.values(EXERCISE_DEFINITIONS).filter(ex => ex.difficulty === difficulty)
}

export const getExercisesByMuscleGroup = (muscleGroup: string): ExerciseConfig[] => {
  return Object.values(EXERCISE_DEFINITIONS).filter(ex => 
    ex.muscleGroups.includes(muscleGroup)
  )
}

export const calculateWorkoutCalories = (exercises: string[], reps: Record<string, number>): number => {
  let totalCalories = 0
  
  exercises.forEach(exerciseId => {
    const exercise = EXERCISE_DEFINITIONS[exerciseId]
    const exerciseReps = reps[exerciseId] || 0
    
    if (exercise) {
      totalCalories += (exercise.caloriesPerRep || 0) * exerciseReps
    }
  })
  
  return Math.round(totalCalories)
}

export const getRecommendedExercises = (userLevel: number, category?: string): ExerciseConfig[] => {
  return Object.values(EXERCISE_DEFINITIONS).filter(exercise => {
    const difficultyLevel = DIFFICULTY_LEVELS[exercise.difficulty]
    const levelMatch = userLevel >= difficultyLevel.minLevel
    const categoryMatch = !category || exercise.category === category
    
    return levelMatch && categoryMatch
  }).slice(0, 5) // Return top 5 recommendations
}