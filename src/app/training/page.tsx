'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, Trophy, Target, Flame, Timer, Calendar, TrendingUp,
  Play, Users, Zap, Star, Award, ChevronRight, Lock, Check,
  Brain, Dumbbell, Heart, Wind, BarChart3, Clock, Info,
  Settings, Volume2, VolumeX, Camera, Sparkles, Crown,
  ArrowLeft, RefreshCw, BookOpen, Medal, Shield, Swords,
  X, AlertCircle, ChevronLeft, Coins
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { AIExerciseTracker } from '@/components/game/AIExerciseTracker'
import { XPBar } from '@/components/game/XPBar'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ====================================
// TYPES & INTERFACES
// ====================================

type TrainingMode = 'free' | 'guided' | 'challenge' | 'mission'
type ExerciseCategory = 'all' | 'strength' | 'cardio' | 'flexibility' | 'balance' | 'core'
type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme'

interface Exercise {
  id: string
  code: string
  name: string
  description: string
  category: string
  difficulty: Difficulty
  muscleGroups: string[]
  caloriesPerRep: number
  xpReward: number
  coinsReward: number
  unlockLevel: number
  icon: string
  videoUrl?: string
  instructions: string[]
  isLocked?: boolean
  personalBest?: number
  lastPerformed?: string
}

interface TrainingProgram {
  id: string
  name: string
  description: string
  difficulty: Difficulty
  duration: number // minutes
  exercises: {
    exerciseId: string
    targetReps?: number
    targetTime?: number
    restTime: number
    order: number
  }[]
  totalXP: number
  totalCalories: number
  category: string
  icon: string
  unlockLevel: number
  completionRate?: number
}

interface TrainingSession {
  id: string
  userId: string
  mode: TrainingMode
  programId?: string
  exercises: {
    exerciseId: string
    reps: number
    duration: number
    formScore: number
    calories: number
    xpEarned: number
  }[]
  totalDuration: number
  totalCalories: number
  totalXP: number
  completedAt: string
}

interface UserStats {
  totalWorkouts: number
  totalCalories: number
  totalMinutes: number
  currentStreak: number
  bestStreak: number
  favoriteExercise: string
  lastWorkout: string
}

interface DailyChallenge {
  id: string
  name: string
  description: string
  exerciseId: string
  targetReps?: number
  targetTime?: number
  targetFormScore?: number
  reward: {
    xp: number
    coins: number
    badge?: string
  }
  expiresAt: string
  isCompleted: boolean
}

// ====================================
// MOCK DATA
// ====================================

const EXERCISES_DATA: Exercise[] = [
  {
    id: 'push_up',
    code: 'push_up',
    name: 'Push-Up',
    description: 'Esercizio classico per petto, spalle e tricipiti',
    category: 'strength',
    difficulty: 'medium',
    muscleGroups: ['Petto', 'Spalle', 'Tricipiti', 'Core'],
    caloriesPerRep: 0.32,
    xpReward: 10,
    coinsReward: 2,
    unlockLevel: 1,
    icon: '💪',
    instructions: [
      'Posiziona le mani a terra alla larghezza delle spalle',
      'Mantieni il corpo dritto dalla testa ai piedi',
      'Abbassa il corpo fino a sfiorare il pavimento',
      'Spingi verso l\'alto tornando alla posizione iniziale'
    ]
  },
  {
    id: 'squat',
    code: 'squat',
    name: 'Squat',
    description: 'Esercizio fondamentale per le gambe',
    category: 'strength',
    difficulty: 'easy',
    muscleGroups: ['Quadricipiti', 'Glutei', 'Hamstring', 'Core'],
    caloriesPerRep: 0.35,
    xpReward: 8,
    coinsReward: 2,
    unlockLevel: 1,
    icon: '🦵',
    instructions: [
      'Piedi alla larghezza delle spalle',
      'Scendi come se ti stessi sedendo',
      'Ginocchia in linea con i piedi',
      'Risali spingendo sui talloni'
    ]
  },
  {
    id: 'plank',
    code: 'plank',
    name: 'Plank',
    description: 'Rafforza il core e migliora la stabilità',
    category: 'core',
    difficulty: 'medium',
    muscleGroups: ['Core', 'Spalle', 'Schiena'],
    caloriesPerRep: 0.05, // per secondo
    xpReward: 15,
    coinsReward: 3,
    unlockLevel: 2,
    icon: '🧘',
    instructions: [
      'Gomiti a terra sotto le spalle',
      'Corpo dritto dalla testa ai piedi',
      'Contrai addominali e glutei',
      'Mantieni la posizione respirando regolarmente'
    ]
  },
  {
    id: 'jumping_jack',
    code: 'jumping_jack',
    name: 'Jumping Jack',
    description: 'Cardio total body per riscaldamento',
    category: 'cardio',
    difficulty: 'easy',
    muscleGroups: ['Full Body'],
    caloriesPerRep: 0.2,
    xpReward: 5,
    coinsReward: 1,
    unlockLevel: 1,
    icon: '⭐',
    instructions: [
      'Parti con piedi uniti e braccia lungo i fianchi',
      'Salta aprendo le gambe e alzando le braccia',
      'Torna alla posizione iniziale con un salto',
      'Mantieni un ritmo costante'
    ]
  },
  {
    id: 'burpee',
    code: 'burpee',
    name: 'Burpee',
    description: 'Esercizio completo ad alta intensità',
    category: 'cardio',
    difficulty: 'hard',
    muscleGroups: ['Full Body'],
    caloriesPerRep: 0.5,
    xpReward: 20,
    coinsReward: 4,
    unlockLevel: 5,
    icon: '🔥',
    instructions: [
      'Parti in piedi',
      'Scendi in posizione squat e appoggia le mani a terra',
      'Porta i piedi indietro in posizione plank',
      'Fai un push-up (opzionale)',
      'Riporta i piedi vicino alle mani',
      'Salta verso l\'alto con le braccia sopra la testa'
    ]
  },
  {
    id: 'mountain_climber',
    code: 'mountain_climber',
    name: 'Mountain Climber',
    description: 'Cardio intenso che coinvolge tutto il corpo',
    category: 'cardio',
    difficulty: 'medium',
    muscleGroups: ['Core', 'Spalle', 'Gambe'],
    caloriesPerRep: 0.25,
    xpReward: 12,
    coinsReward: 3,
    unlockLevel: 3,
    icon: '⛰️',
    instructions: [
      'Posizione di plank con braccia tese',
      'Porta un ginocchio verso il petto',
      'Alterna rapidamente le gambe',
      'Mantieni il core contratto'
    ]
  },
  {
    id: 'lunges',
    code: 'lunges',
    name: 'Affondi',
    description: 'Rafforza gambe e glutei',
    category: 'strength',
    difficulty: 'medium',
    muscleGroups: ['Quadricipiti', 'Glutei', 'Hamstring'],
    caloriesPerRep: 0.3,
    xpReward: 10,
    coinsReward: 2,
    unlockLevel: 2,
    icon: '🏃',
    instructions: [
      'Fai un passo avanti',
      'Scendi piegando entrambe le ginocchia a 90°',
      'Spingi sul tallone anteriore per tornare su',
      'Alterna le gambe'
    ]
  },
  {
    id: 'sit_up',
    code: 'sit_up',
    name: 'Sit-Up',
    description: 'Classico esercizio per gli addominali',
    category: 'core',
    difficulty: 'easy',
    muscleGroups: ['Addominali'],
    caloriesPerRep: 0.15,
    xpReward: 6,
    coinsReward: 1,
    unlockLevel: 1,
    icon: '🎯',
    instructions: [
      'Sdraiati sulla schiena con ginocchia piegate',
      'Mani dietro la testa o incrociate sul petto',
      'Solleva il busto verso le ginocchia',
      'Scendi controllando il movimento'
    ]
  }
]

const TRAINING_PROGRAMS: TrainingProgram[] = [
  {
    id: 'beginner_start',
    name: 'Principiante - Inizia Qui',
    description: 'Programma perfetto per iniziare il tuo percorso fitness',
    difficulty: 'easy',
    duration: 15,
    exercises: [
      { exerciseId: 'jumping_jack', targetReps: 20, restTime: 30, order: 1 },
      { exerciseId: 'squat', targetReps: 15, restTime: 30, order: 2 },
      { exerciseId: 'push_up', targetReps: 10, restTime: 30, order: 3 },
      { exerciseId: 'sit_up', targetReps: 15, restTime: 30, order: 4 },
      { exerciseId: 'plank', targetTime: 20, restTime: 30, order: 5 }
    ],
    totalXP: 100,
    totalCalories: 80,
    category: 'full_body',
    icon: '🌟',
    unlockLevel: 1
  },
  {
    id: 'cardio_blast',
    name: 'Cardio Blast',
    description: 'Brucia calorie e migliora la resistenza',
    difficulty: 'medium',
    duration: 20,
    exercises: [
      { exerciseId: 'jumping_jack', targetReps: 30, restTime: 20, order: 1 },
      { exerciseId: 'burpee', targetReps: 10, restTime: 30, order: 2 },
      { exerciseId: 'mountain_climber', targetReps: 20, restTime: 30, order: 3 },
      { exerciseId: 'squat', targetReps: 20, restTime: 20, order: 4 },
      { exerciseId: 'jumping_jack', targetReps: 30, restTime: 20, order: 5 }
    ],
    totalXP: 150,
    totalCalories: 120,
    category: 'cardio',
    icon: '💨',
    unlockLevel: 3
  },
  {
    id: 'strength_builder',
    name: 'Costruttore di Forza',
    description: 'Sviluppa forza e massa muscolare',
    difficulty: 'hard',
    duration: 25,
    exercises: [
      { exerciseId: 'push_up', targetReps: 20, restTime: 45, order: 1 },
      { exerciseId: 'squat', targetReps: 25, restTime: 45, order: 2 },
      { exerciseId: 'lunges', targetReps: 20, restTime: 45, order: 3 },
      { exerciseId: 'push_up', targetReps: 15, restTime: 45, order: 4 },
      { exerciseId: 'plank', targetTime: 45, restTime: 45, order: 5 }
    ],
    totalXP: 200,
    totalCalories: 150,
    category: 'strength',
    icon: '💪',
    unlockLevel: 5
  },
  {
    id: 'core_focus',
    name: 'Core Power',
    description: 'Rafforza il core per una migliore stabilità',
    difficulty: 'medium',
    duration: 18,
    exercises: [
      { exerciseId: 'plank', targetTime: 30, restTime: 30, order: 1 },
      { exerciseId: 'sit_up', targetReps: 20, restTime: 30, order: 2 },
      { exerciseId: 'mountain_climber', targetReps: 20, restTime: 30, order: 3 },
      { exerciseId: 'plank', targetTime: 45, restTime: 30, order: 4 },
      { exerciseId: 'sit_up', targetReps: 25, restTime: 30, order: 5 }
    ],
    totalXP: 130,
    totalCalories: 90,
    category: 'core',
    icon: '🎯',
    unlockLevel: 2
  },
  {
    id: 'hiit_extreme',
    name: 'HIIT Estremo',
    description: 'Alta intensità per risultati rapidi',
    difficulty: 'extreme',
    duration: 30,
    exercises: [
      { exerciseId: 'burpee', targetReps: 15, restTime: 20, order: 1 },
      { exerciseId: 'mountain_climber', targetReps: 30, restTime: 20, order: 2 },
      { exerciseId: 'push_up', targetReps: 20, restTime: 20, order: 3 },
      { exerciseId: 'squat', targetReps: 30, restTime: 20, order: 4 },
      { exerciseId: 'burpee', targetReps: 15, restTime: 20, order: 5 },
      { exerciseId: 'plank', targetTime: 60, restTime: 30, order: 6 }
    ],
    totalXP: 300,
    totalCalories: 250,
    category: 'hiit',
    icon: '🔥',
    unlockLevel: 10
  }
]

// ====================================
// COMPONENTS
// ====================================

// Exercise Card Component
const ExerciseCard = ({ 
  exercise, 
  isLocked, 
  onSelect,
  userLevel 
}: { 
  exercise: Exercise
  isLocked: boolean
  onSelect: (exercise: Exercise) => void
  userLevel: number
}) => {
  const canUnlock = userLevel >= exercise.unlockLevel

  return (
    <motion.div
      whileHover={{ scale: isLocked ? 1 : 1.02 }}
      whileTap={{ scale: isLocked ? 1 : 0.98 }}
    >
      <Card 
        className={cn(
          "relative p-4 cursor-pointer transition-all",
          isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800/50",
          "border-2 border-transparent",
          !isLocked && "hover:border-indigo-500/50"
        )}
        onClick={() => !isLocked && onSelect(exercise)}
      >
        {/* Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Livello {exercise.unlockLevel}</p>
            </div>
          </div>
        )}

        {/* Personal Best Badge */}
        {exercise.personalBest && (
          <div className="absolute top-2 right-2 bg-yellow-500/20 px-2 py-1 rounded-full">
            <div className="flex items-center gap-1">
              <Trophy className="w-3 h-3 text-yellow-500" />
              <span className="text-xs text-yellow-400">{exercise.personalBest}</span>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="text-3xl">{exercise.icon}</div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">{exercise.name}</h3>
            <p className="text-xs text-gray-400 mb-2">{exercise.description}</p>

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-500" />
                <span className="text-gray-300">{exercise.caloriesPerRep} cal</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span className="text-gray-300">{exercise.xpReward} XP</span>
              </div>
              <div className={cn(
                "px-2 py-0.5 rounded-full",
                exercise.difficulty === 'easy' && "bg-green-500/20 text-green-400",
                exercise.difficulty === 'medium' && "bg-yellow-500/20 text-yellow-400",
                exercise.difficulty === 'hard' && "bg-orange-500/20 text-orange-400",
                exercise.difficulty === 'extreme' && "bg-red-500/20 text-red-400"
              )}>
                {exercise.difficulty}
              </div>
            </div>

            {/* Muscle Groups */}
            <div className="flex flex-wrap gap-1 mt-2">
              {exercise.muscleGroups.slice(0, 3).map((muscle, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-gray-800 rounded-full text-gray-400">
                  {muscle}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

// Program Card Component
const ProgramCard = ({ 
  program, 
  isLocked,
  onSelect,
  userLevel 
}: { 
  program: TrainingProgram
  isLocked: boolean
  onSelect: (program: TrainingProgram) => void
  userLevel: number
}) => {
  return (
    <motion.div
      whileHover={{ scale: isLocked ? 1 : 1.02 }}
      whileTap={{ scale: isLocked ? 1 : 0.98 }}
    >
      <Card 
        className={cn(
          "relative p-4 cursor-pointer transition-all",
          isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800/50",
          "border-2 border-transparent",
          !isLocked && "hover:border-purple-500/50"
        )}
        onClick={() => !isLocked && onSelect(program)}
      >
        {/* Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Livello {program.unlockLevel}</p>
            </div>
          </div>
        )}

        {/* Completion Rate */}
        {program.completionRate !== undefined && (
          <div className="absolute top-2 right-2">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-green-400">{program.completionRate}%</span>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="text-3xl">{program.icon}</div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">{program.name}</h3>
            <p className="text-xs text-gray-400 mb-3">{program.description}</p>

            {/* Exercises Preview */}
            <div className="flex items-center gap-2 mb-3">
              {program.exercises.slice(0, 3).map((ex, i) => {
                const exercise = EXERCISES_DATA.find(e => e.id === ex.exerciseId)
                return (
                  <span key={i} className="text-lg">{exercise?.icon}</span>
                )
              })}
              {program.exercises.length > 3 && (
                <span className="text-xs text-gray-500">+{program.exercises.length - 3}</span>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <p className="text-gray-400">Durata</p>
                <p className="text-white font-semibold">{program.duration} min</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">XP</p>
                <p className="text-yellow-400 font-semibold">{program.totalXP}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">Calorie</p>
                <p className="text-orange-400 font-semibold">{program.totalCalories}</p>
              </div>
            </div>

            {/* Difficulty Badge */}
            <div className="mt-3 flex justify-center">
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-medium",
                program.difficulty === 'easy' && "bg-green-500/20 text-green-400",
                program.difficulty === 'medium' && "bg-yellow-500/20 text-yellow-400",
                program.difficulty === 'hard' && "bg-orange-500/20 text-orange-400",
                program.difficulty === 'extreme' && "bg-red-500/20 text-red-400"
              )}>
                {program.difficulty.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

// Training Stats Widget
const TrainingStatsWidget = ({ stats }: { stats: UserStats }) => {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">Le Tue Statistiche</h3>
        <BarChart3 className="w-5 h-5 text-indigo-400" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-400 text-xs">Allenamenti Totali</p>
          <p className="text-2xl font-bold text-white">{stats.totalWorkouts}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Calorie Bruciate</p>
          <p className="text-2xl font-bold text-orange-400">{stats.totalCalories}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Tempo Totale</p>
          <p className="text-2xl font-bold text-blue-400">{stats.totalMinutes} min</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Streak Attuale</p>
          <div className="flex items-center gap-1">
            <p className="text-2xl font-bold text-red-400">{stats.currentStreak}</p>
            <Flame className="w-5 h-5 text-red-400" />
          </div>
        </div>
      </div>

      {stats.favoriteExercise && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <p className="text-gray-400 text-xs mb-1">Esercizio Preferito</p>
          <p className="text-white font-medium">{stats.favoriteExercise}</p>
        </div>
      )}
    </Card>
  )
}

// Daily Challenge Card
const DailyChallengeCard = ({ 
  challenge,
  onStart 
}: { 
  challenge: DailyChallenge
  onStart: (challenge: DailyChallenge) => void
}) => {
  const exercise = EXERCISES_DATA.find(e => e.id === challenge.exerciseId)
  
  return (
    <Card className="p-4 border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-white">Sfida del Giorno</h3>
        </div>
        {challenge.isCompleted && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full">
            <Check className="w-3 h-3 text-green-400" />
            <span className="text-xs text-green-400">Completata</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{exercise?.icon}</span>
          <div>
            <p className="font-semibold text-white">{challenge.name}</p>
            <p className="text-sm text-gray-400">{challenge.description}</p>
          </div>
        </div>

        {/* Target */}
        <div className="flex items-center gap-4 p-3 bg-black/30 rounded-lg">
          <Target className="w-4 h-4 text-indigo-400" />
          <span className="text-white">
            {challenge.targetReps && `${challenge.targetReps} ripetizioni`}
            {challenge.targetTime && `${challenge.targetTime} secondi`}
            {challenge.targetFormScore && `Form score >${challenge.targetFormScore}%`}
          </span>
        </div>

        {/* Rewards */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-white font-medium">{challenge.reward.xp} XP</span>
          </div>
          <div className="flex items-center gap-1">
            <Coins className="w-4 h-4 text-yellow-600" />
            <span className="text-white font-medium">{challenge.reward.coins}</span>
          </div>
          {challenge.reward.badge && (
            <div className="flex items-center gap-1">
              <Medal className="w-4 h-4 text-purple-500" />
              <span className="text-purple-400 text-sm">Badge Speciale</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button 
          variant="gradient" 
          className="w-full"
          onClick={() => onStart(challenge)}
          disabled={challenge.isCompleted}
        >
          {challenge.isCompleted ? 'Completata' : 'Inizia Sfida'}
        </Button>
      </div>
    </Card>
  )
}

// ====================================
// MAIN TRAINING PAGE COMPONENT
// ====================================

export default function TrainingPage() {
  // State
  const [selectedMode, setSelectedMode] = useState<TrainingMode>('free')
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory>('all')
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [showInstructions, setShowInstructions] = useState(false)
  const [userLevel, setUserLevel] = useState(5) // Mock user level
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userStats, setUserStats] = useState<UserStats>({
    totalWorkouts: 42,
    totalCalories: 3250,
    totalMinutes: 485,
    currentStreak: 7,
    bestStreak: 14,
    favoriteExercise: 'Push-Up',
    lastWorkout: new Date().toISOString()
  })

  // Mock daily challenge
  const [dailyChallenge] = useState<DailyChallenge>({
    id: 'daily_1',
    name: 'Push-Up Master',
    description: 'Completa 50 push-up con form score >80%',
    exerciseId: 'push_up',
    targetReps: 50,
    targetFormScore: 80,
    reward: {
      xp: 200,
      coins: 50,
      badge: 'push_up_master'
    },
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    isCompleted: false
  })

  const router = useRouter()
  const supabase = createClientComponentClient()

  // Load user data
  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setCurrentUserId(user.id)
        
        // Load user stats from database
        const { data: stats } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (stats) {
          setUserLevel(stats.level || 1)
        }

        // Load training history
        const { data: sessions } = await supabase
          .from('training_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(10)

        // Calculate stats from sessions
        if (sessions && sessions.length > 0) {
          const totalCalories = sessions.reduce((sum, s) => sum + (s.total_calories || 0), 0)
          const totalMinutes = sessions.reduce((sum, s) => sum + (s.total_duration || 0), 0) / 60
          
          setUserStats(prev => ({
            ...prev,
            totalWorkouts: sessions.length,
            totalCalories,
            totalMinutes: Math.round(totalMinutes)
          }))
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  // Filter exercises
  const filteredExercises = EXERCISES_DATA.filter(exercise => {
    if (selectedCategory === 'all') return true
    return exercise.category === selectedCategory
  })

  // Mode selection handler
  const handleModeSelect = (mode: TrainingMode) => {
    setSelectedMode(mode)
    setSelectedExercise(null)
    setSelectedProgram(null)
  }

  // Exercise selection handler
  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise)
    setShowInstructions(true)
  }

  // Program selection handler
  const handleProgramSelect = (program: TrainingProgram) => {
    setSelectedProgram(program)
    setCurrentExerciseIndex(0)
    setShowInstructions(true)
  }

  // Start training
  const handleStartTraining = () => {
    setShowInstructions(false)
    setIsTracking(true)
  }

  // Handle exercise completion
  const handleExerciseComplete = async (performanceData: any) => {
    console.log('Exercise completed:', performanceData)
    
    // If in program mode, move to next exercise
    if (selectedProgram && currentExerciseIndex < selectedProgram.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1)
      const nextExercise = EXERCISES_DATA.find(
        e => e.id === selectedProgram.exercises[currentExerciseIndex + 1].exerciseId
      )
      setSelectedExercise(nextExercise || null)
    } else {
      // Training complete
      setIsTracking(false)
      // Show completion modal or redirect
      router.push('/dashboard')
    }
  }

  // Handle daily challenge start
  const handleChallengeStart = (challenge: DailyChallenge) => {
    const exercise = EXERCISES_DATA.find(e => e.id === challenge.exerciseId)
    if (exercise) {
      setSelectedMode('challenge')
      setSelectedExercise(exercise)
      setShowInstructions(true)
    }
  }

  // Get current exercise for program mode
  const getCurrentProgramExercise = () => {
    if (!selectedProgram) return null
    const exerciseConfig = selectedProgram.exercises[currentExerciseIndex]
    return EXERCISES_DATA.find(e => e.id === exerciseConfig.exerciseId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900/20 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Training Center</h1>
              <p className="text-gray-400">Allenati e migliora le tue performance</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-black/30 rounded-lg">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-white font-medium">Livello {userLevel}</span>
            </div>
          </div>
        </div>

        {/* AI Tracker Active */}
        {isTracking && selectedExercise && currentUserId && (
          <div className="fixed inset-0 z-50 bg-black/90 p-4 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">{selectedExercise.name}</h2>
                <Button
                  variant="ghost"
                  onClick={() => setIsTracking(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <AIExerciseTracker
                exerciseId={selectedExercise.id}
                userId={currentUserId} // Use real user ID
                targetReps={
                  selectedMode === 'challenge' && dailyChallenge.targetReps 
                    ? dailyChallenge.targetReps 
                    : selectedProgram?.exercises[currentExerciseIndex]?.targetReps
                }
                targetTime={
                  selectedProgram?.exercises[currentExerciseIndex]?.targetTime
                }
                onComplete={handleExerciseComplete}
                onProgress={(progress) => console.log('Progress:', progress)}
              />

              {/* Program Progress */}
              {selectedProgram && (
                <Card className="mt-4 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">
                      Esercizio {currentExerciseIndex + 1} di {selectedProgram.exercises.length}
                    </span>
                    <div className="flex gap-1">
                      {selectedProgram.exercises.map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-2 h-2 rounded-full",
                            i < currentExerciseIndex ? "bg-green-500" :
                            i === currentExerciseIndex ? "bg-indigo-500" : "bg-gray-600"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Instructions Modal */}
        <Modal
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
          title={selectedExercise?.name || selectedProgram?.name || ''}
          size="md"
        >
          <div className="space-y-4">
            {selectedExercise && (
              <>
                <div className="text-center text-4xl mb-4">{selectedExercise.icon}</div>
                
                <div>
                  <h3 className="font-semibold text-white mb-2">Istruzioni:</h3>
                  <ol className="space-y-2">
                    {selectedExercise.instructions.map((instruction, i) => (
                      <li key={i} className="flex gap-2 text-gray-300">
                        <span className="text-indigo-400">{i + 1}.</span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Muscoli Coinvolti:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedExercise.muscleGroups.map((muscle, i) => (
                      <span key={i} className="px-3 py-1 bg-indigo-500/20 rounded-full text-indigo-400 text-sm">
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {selectedProgram && (
              <div>
                <h3 className="font-semibold text-white mb-2">Esercizi del Programma:</h3>
                <div className="space-y-2">
                  {selectedProgram.exercises.map((ex, i) => {
                    const exercise = EXERCISES_DATA.find(e => e.id === ex.exerciseId)
                    return (
                      <div key={i} className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg">
                        <span className="text-xl">{exercise?.icon}</span>
                        <span className="text-white flex-1">{exercise?.name}</span>
                        <span className="text-gray-400 text-sm">
                          {ex.targetReps && `${ex.targetReps} reps`}
                          {ex.targetTime && `${ex.targetTime}s`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <Button 
              variant="gradient" 
              className="w-full"
              onClick={handleStartTraining}
            >
              <Play className="w-4 h-4 mr-2" />
              Inizia Allenamento
            </Button>
          </div>
        </Modal>

        {/* Main Content */}
        {!isTracking && (
          <>
            {/* Daily Challenge */}
            <DailyChallengeCard 
              challenge={dailyChallenge}
              onStart={handleChallengeStart}
            />

            {/* Training Modes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: 'free', name: 'Allenamento Libero', icon: Dumbbell, color: 'indigo' },
                { id: 'guided', name: 'Programmi Guidati', icon: BookOpen, color: 'purple' },
                { id: 'challenge', name: 'Sfide', icon: Trophy, color: 'yellow' },
                { id: 'mission', name: 'Missioni', icon: Target, color: 'green' }
              ].map((mode) => {
                const Icon = mode.icon
                const isActive = selectedMode === mode.id
                
                return (
                  <Card
                    key={mode.id}
                    className={cn(
                      "p-4 cursor-pointer transition-all",
                      isActive ? `border-${mode.color}-500 bg-${mode.color}-500/10` : "hover:bg-gray-800/50"
                    )}
                    onClick={() => handleModeSelect(mode.id as TrainingMode)}
                  >
                    <div className="text-center">
                      <Icon className={cn(
                        "w-8 h-8 mx-auto mb-2",
                        isActive ? `text-${mode.color}-400` : "text-gray-400"
                      )} />
                      <p className={cn(
                        "text-sm font-medium",
                        isActive ? "text-white" : "text-gray-300"
                      )}>
                        {mode.name}
                      </p>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Content based on selected mode */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Content Area */}
              <div className="lg:col-span-2 space-y-4">
                {selectedMode === 'free' && (
                  <>
                    {/* Category Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {['all', 'strength', 'cardio', 'core', 'flexibility', 'balance'].map((cat) => (
                        <Button
                          key={cat}
                          variant={selectedCategory === cat ? 'gradient' : 'ghost'}
                          size="sm"
                          onClick={() => setSelectedCategory(cat as ExerciseCategory)}
                          className="whitespace-nowrap"
                        >
                          {cat === 'all' ? 'Tutti' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </Button>
                      ))}
                    </div>

                    {/* Exercises Grid */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {filteredExercises.map((exercise) => (
                        <ExerciseCard
                          key={exercise.id}
                          exercise={exercise}
                          isLocked={exercise.unlockLevel > userLevel}
                          onSelect={handleExerciseSelect}
                          userLevel={userLevel}
                        />
                      ))}
                    </div>
                  </>
                )}

                {selectedMode === 'guided' && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white">Programmi di Allenamento</h2>
                    <div className="grid gap-4">
                      {TRAINING_PROGRAMS.map((program) => (
                        <ProgramCard
                          key={program.id}
                          program={program}
                          isLocked={program.unlockLevel > userLevel}
                          onSelect={handleProgramSelect}
                          userLevel={userLevel}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {selectedMode === 'challenge' && (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Modalità Sfide</h2>
                    <p className="text-gray-400 mb-6">
                      Completa la sfida giornaliera sopra o attendi le nuove sfide!
                    </p>
                  </div>
                )}

                {selectedMode === 'mission' && (
                  <div className="text-center py-12">
                    <Target className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Allenamento Missioni</h2>
                    <p className="text-gray-400 mb-6">
                      Vai alla pagina Missioni per vedere gli obiettivi da completare
                    </p>
                    <Button 
                      variant="gradient"
                      onClick={() => router.push('/missions')}
                    >
                      Vai alle Missioni
                    </Button>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* User Stats */}
                <TrainingStatsWidget stats={userStats} />

                {/* Quick Actions */}
                <Card className="p-4">
                  <h3 className="font-semibold text-white mb-3">Azioni Rapide</h3>
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => router.push('/profile')}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Profilo & Statistiche
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => router.push('/achievements')}
                    >
                      <Award className="w-4 h-4 mr-2" />
                      Achievements
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => router.push('/leaderboard')}
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Classifica
                    </Button>
                  </div>
                </Card>

                {/* Recent Achievements */}
                <Card className="p-4">
                  <h3 className="font-semibold text-white mb-3">Achievement Recenti</h3>
                  <div className="space-y-3">
                    {[
                      { icon: '🔥', name: '7 Giorni di Fila', date: 'Oggi' },
                      { icon: '💪', name: '100 Push-up', date: 'Ieri' },
                      { icon: '⚡', name: 'Velocista', date: '2 giorni fa' }
                    ].map((achievement, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-2xl">{achievement.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm text-white">{achievement.name}</p>
                          <p className="text-xs text-gray-500">{achievement.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}