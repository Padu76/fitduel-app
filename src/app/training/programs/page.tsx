'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Play, Clock, Target, Award, BookOpen, 
  CheckCircle, Lock, Star, Calendar, TrendingUp,
  Users, Zap, Activity, Info, ChevronRight,
  Flame, Trophy, Camera, Settings, Eye
} from 'lucide-react'

// ====================================
// IMPORTS FROM REAL SYSTEM
// ====================================
import { 
  EXERCISE_DEFINITIONS, 
  EXERCISE_CATEGORIES,
  DIFFICULTY_LEVELS,
  WORKOUT_PRESETS,
  getExercisesByCategory,
  getExercisesByDifficulty
} from '@/components/game/ai-tracker/constants/exercises'
import type { ExerciseConfig } from '@/components/game/ai-tracker/types'
import { AIExerciseTracker } from '@/components/game/ai-tracker/AIExerciseTracker'
import { Card } from '@/components/ui/Card'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ====================================
// DIFFICULTY MAPPING
// ====================================
const difficultyMapping = {
  'beginner': 'easy',
  'intermediate': 'medium', 
  'advanced': 'hard',
  'expert': 'extreme'
} as const

type ProgramDifficulty = keyof typeof difficultyMapping

// ====================================
// TYPES
// ====================================
interface ProgramSession {
  day: number
  title: string
  exercises: string[] // Exercise IDs from real system
  duration: number
  completed: boolean
  targetReps?: number
  targetTime?: number
  focus: string
  description: string
}

interface TrainingProgram {
  id: string
  title: string
  subtitle: string
  description: string
  duration: number // days
  dailyTime: number // minutes
  difficulty: ProgramDifficulty
  category: string
  icon: string
  color: string
  completed: number
  totalSessions: number
  locked: boolean
  unlockRequirement?: string
  features: string[]
  exercises: string[] // Real exercise IDs
  benefits: string[]
  sessions: ProgramSession[]
  xpReward: number
  caloriesTotal: number
}

// ====================================
// REAL PROGRAMS WITH EXERCISE SYSTEM
// ====================================
const REAL_PROGRAMS: TrainingProgram[] = [
  {
    id: 'beginner-foundation',
    title: 'Foundation Basics',
    subtitle: 'Le basi del movimento',
    description: 'Programma perfetto per principianti. Impara i movimenti fondamentali con il sistema AI che analizza ogni tuo movimento.',
    duration: 7,
    dailyTime: 15,
    difficulty: 'beginner',
    category: 'Foundation',
    icon: '🌱',
    color: 'from-green-500 to-emerald-500',
    completed: 0,
    totalSessions: 7,
    locked: false,
    features: ['AI Motion Tracking', 'Progressione Graduale', 'Form Analysis', 'Voice Coaching'],
    exercises: ['jumping_jack', 'squat', 'push_up', 'plank', 'lunge'],
    benefits: [
      'Apprendi i movimenti base con feedback AI',
      'Costruisci forza fondamentale', 
      'Migliora la coordinazione',
      'Crea una routine quotidiana con tracking'
    ],
    sessions: [
      {
        day: 1, title: 'Primo Contatto AI', exercises: ['jumping_jack', 'squat'], 
        duration: 15, completed: false, targetReps: 10, focus: 'Movimento Base',
        description: 'Introduzione al sistema AI con esercizi semplici'
      },
      {
        day: 2, title: 'Core Foundation', exercises: ['plank', 'crunch'], 
        duration: 15, completed: false, targetTime: 30, focus: 'Stabilità Core',
        description: 'Sviluppo della stabilità centrale'
      },
      {
        day: 3, title: 'Upper Body Start', exercises: ['push_up', 'mountain_climber'], 
        duration: 15, completed: false, targetReps: 8, focus: 'Parte Superiore',
        description: 'Primi esercizi per braccia e petto'
      },
      {
        day: 4, title: 'Lower Body Power', exercises: ['squat', 'lunge'], 
        duration: 15, completed: false, targetReps: 12, focus: 'Gambe e Glutei',
        description: 'Rinforzo delle gambe con feedback AI'
      },
      {
        day: 5, title: 'Cardio Integration', exercises: ['jumping_jack', 'high_knees'], 
        duration: 15, completed: false, targetReps: 20, focus: 'Resistenza',
        description: 'Introduzione al lavoro cardiovascolare'
      },
      {
        day: 6, title: 'Full Body Flow', exercises: ['burpee', 'mountain_climber'], 
        duration: 15, completed: false, targetReps: 6, focus: 'Coordinazione',
        description: 'Combinazione di movimenti complessi'
      },
      {
        day: 7, title: 'Assessment Test', exercises: ['push_up', 'squat', 'plank'], 
        duration: 20, completed: false, targetReps: 10, focus: 'Valutazione',
        description: 'Test finale con analisi AI completa'
      }
    ],
    xpReward: 500,
    caloriesTotal: 800
  },
  {
    id: 'strength-builder',
    title: 'Strength Builder',
    subtitle: 'Costruisci forza reale',
    description: 'Due settimane dedicate allo sviluppo della forza con progressione intelligente guidata dall\'AI.',
    duration: 14,
    dailyTime: 25,
    difficulty: 'intermediate',
    category: 'Strength',
    icon: '💪',
    color: 'from-orange-500 to-red-500',
    completed: 0,
    totalSessions: 14,
    locked: false,
    features: ['Progressive Overload', 'Strength Analytics', 'Form Perfection', 'Recovery Tracking'],
    exercises: ['push_up', 'diamond_push_up', 'squat', 'jump_squat', 'plank', 'glute_bridge'],
    benefits: [
      'Incremento forza misurabile',
      'Progressione scientifica',
      'Analisi biomeccanica AI',
      'Prevenzione infortuni'
    ],
    sessions: Array.from({length: 14}, (_, i) => ({
      day: i + 1,
      title: `Strength Day ${i + 1}`,
      exercises: i < 7 ? ['push_up', 'squat'] : ['diamond_push_up', 'jump_squat'],
      duration: 25,
      completed: false,
      targetReps: 8 + Math.floor(i / 2),
      focus: i < 7 ? 'Base Strength' : 'Power Development',
      description: `Sessione forza progressiva - livello ${Math.floor(i/2) + 1}`
    })),
    xpReward: 1000,
    caloriesTotal: 1600
  },
  {
    id: 'cardio-endurance',
    title: 'Cardio Endurance',
    subtitle: 'Resistenza cardiovascolare',
    description: 'Programma intensivo per migliorare drasticamente la tua resistenza con monitoraggio AI.',
    duration: 10,
    dailyTime: 20,
    difficulty: 'intermediate',
    category: 'Cardio',
    icon: '🔥',
    color: 'from-red-500 to-pink-500',
    completed: 0,
    totalSessions: 10,
    locked: false,
    features: ['Heart Rate Zones', 'VO2 Max Estimation', 'Recovery Analysis', 'Performance Curves'],
    exercises: ['jumping_jack', 'burpee', 'high_knees', 'mountain_climber', 'skater_jump'],
    benefits: [
      'VO2 Max migliorato',
      'Resistenza cardiopolmonare',
      'Metabolismo accelerato',
      'Recovery più veloce'
    ],
    sessions: Array.from({length: 10}, (_, i) => ({
      day: i + 1,
      title: `Cardio Session ${i + 1}`,
      exercises: ['jumping_jack', 'burpee', 'high_knees'][i % 3] ? ['jumping_jack', 'burpee'] : ['high_knees', 'mountain_climber'],
      duration: 20,
      completed: false,
      targetReps: 15 + i * 2,
      focus: 'Cardiovascular Endurance',
      description: `Sessione cardio progressiva ad alta intensità`
    })),
    xpReward: 800,
    caloriesTotal: 2000
  },
  {
    id: 'core-mastery',
    title: 'Core Mastery',
    subtitle: 'Addominali di acciaio',
    description: '21 giorni per sviluppare un core forte e stabile con analisi AI della stabilità.',
    duration: 21,
    dailyTime: 18,
    difficulty: 'advanced',
    category: 'Core',
    icon: '💎',
    color: 'from-blue-500 to-purple-500',
    completed: 0,
    totalSessions: 21,
    locked: true,
    unlockRequirement: 'Completa Foundation Basics',
    features: ['Core Stability Analysis', 'Isometric Tracking', 'Breathing Coaching', 'Postural Assessment'],
    exercises: ['plank', 'side_plank', 'russian_twist', 'leg_raise', 'bicycle_crunch', 'mountain_climber'],
    benefits: [
      'Core stability superiore',
      'Postura migliorata',
      'Performance atletiche migliori',
      'Riduzione mal di schiena'
    ],
    sessions: Array.from({length: 21}, (_, i) => {
      const week = Math.floor(i / 7) + 1
      const coreExercises = ['plank', 'side_plank', 'russian_twist', 'leg_raise', 'bicycle_crunch', 'mountain_climber']
      return {
        day: i + 1,
        title: `Core Week ${week} - Day ${(i % 7) + 1}`,
        exercises: [coreExercises[i % 6]],
        duration: 18,
        completed: false,
        targetTime: week === 1 ? 30 : week === 2 ? 45 : 60,
        targetReps: week === 1 ? 10 : week === 2 ? 15 : 20,
        focus: `Core Strength Level ${week}`,
        description: `Sessione core intensiva - settimana ${week}`
      }
    }),
    xpReward: 1500,
    caloriesTotal: 1200
  },
  {
    id: 'elite-performance',
    title: 'Elite Performance',
    subtitle: 'Livello professionale',
    description: 'Programma avanzato per atleti seri. Combina forza, potenza e resistenza con AI analysis completa.',
    duration: 28,
    dailyTime: 35,
    difficulty: 'expert',
    category: 'Elite',
    icon: '🏆',
    color: 'from-yellow-500 to-orange-500',
    completed: 0,
    totalSessions: 28,
    locked: true,
    unlockRequirement: 'Livello 15 + Completa 2 programmi',
    features: ['Biomechanical Analysis', 'Power Output Tracking', 'Recovery Optimization', 'Performance Periodization'],
    exercises: ['pistol_squat', 'diamond_push_up', 'bulgarian_split_squat', 'burpee', 'russian_twist', 'mountain_climber'],
    benefits: [
      'Performance atletiche elite',
      'Forza funzionale massima',
      'Resistenza superiore',
      'Controllo motorio avanzato'
    ],
    sessions: Array.from({length: 28}, (_, i) => {
      const phase = Math.floor(i / 7) + 1 // 4 phases
      const eliteExercises = ['pistol_squat', 'diamond_push_up', 'bulgarian_split_squat', 'burpee']
      return {
        day: i + 1,
        title: `Elite Phase ${phase} - Day ${(i % 7) + 1}`,
        exercises: [eliteExercises[i % 4]],
        duration: 35,
        completed: false,
        targetReps: Math.min(5 + Math.floor(i / 4), 20),
        focus: `Elite Training Phase ${phase}`,
        description: `Sessione elite ad altissima intensità`
      }
    }),
    xpReward: 2500,
    caloriesTotal: 3500
  }
]

// ====================================
// COMPONENTS
// ====================================
const ProgramCard = ({ 
  program, 
  onSelect, 
  userLevel = 1 
}: { 
  program: TrainingProgram
  onSelect: (program: TrainingProgram) => void
  userLevel?: number
}) => {
  const difficultyKey = difficultyMapping[program.difficulty]
  const difficulty = DIFFICULTY_LEVELS[difficultyKey] || DIFFICULTY_LEVELS.easy
  const progress = (program.completed / program.totalSessions) * 100
  const isLocked = program.locked // We'll implement unlock logic later

  return (
    <motion.div
      whileHover={{ scale: isLocked ? 1 : 1.02 }}
      whileTap={{ scale: isLocked ? 1 : 0.98 }}
      onClick={() => !isLocked && onSelect(program)}
      className={`relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl 
        rounded-2xl p-6 border transition-all duration-300 overflow-hidden
        ${isLocked 
          ? 'border-slate-700/30 opacity-60 cursor-not-allowed' 
          : 'border-slate-700/50 hover:border-green-500/50 cursor-pointer'}`}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${program.color} opacity-5`} />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-gradient-to-br ${program.color} rounded-xl flex items-center justify-center`}>
              <span className="text-2xl">{program.icon}</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{program.title}</h3>
              <p className="text-sm text-green-400">{program.subtitle}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <span className={`px-2 py-1 rounded-full text-xs ${difficulty.bgColor} ${difficulty.color} border ${difficulty.borderColor}`}>
              {difficulty.name}
            </span>
            <span className="text-xs text-slate-400">{program.category}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-300 mb-4">{program.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{program.duration}</p>
            <p className="text-xs text-gray-400">Giorni</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{program.dailyTime}</p>
            <p className="text-xs text-gray-400">Min/Giorno</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{program.totalSessions}</p>
            <p className="text-xs text-gray-400">Sessioni</p>
          </div>
        </div>

        {/* Real Exercise Preview */}
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2">Esercizi AI inclusi:</p>
          <div className="flex flex-wrap gap-1">
            {program.exercises.slice(0, 3).map((exerciseId) => {
              const exercise = EXERCISE_DEFINITIONS[exerciseId]
              return exercise ? (
                <span key={exerciseId} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                  {exercise.name}
                </span>
              ) : null
            })}
            {program.exercises.length > 3 && (
              <span className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-400">
                +{program.exercises.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {program.completed > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progresso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${program.color} transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Rewards */}
        <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
          <div className="flex items-center gap-1">
            <Trophy className="w-3 h-3 text-yellow-400" />
            <span className="text-yellow-400">{program.xpReward} XP</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-400" />
            <span className="text-orange-400">{program.caloriesTotal} cal</span>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-1 mb-4">
          {program.features.slice(0, 2).map((feature: string, i: number) => (
            <span key={i} className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-400">
              {feature}
            </span>
          ))}
        </div>

        {/* Action */}
        <div className="flex items-center justify-center">
          {isLocked ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Lock className="w-4 h-4" />
              <span className="text-sm">{program.unlockRequirement}</span>
            </div>
          ) : program.completed > 0 ? (
            <div className="flex items-center gap-2 text-green-400">
              <Camera className="w-5 h-5" />
              <span className="font-medium">Continua con AI</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-400">
              <Camera className="w-5 h-5" />
              <span className="font-medium">Inizia con AI</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

const ProgramDetail = ({ 
  program, 
  onBack, 
  onStartSession,
  userId 
}: { 
  program: TrainingProgram
  onBack: () => void
  onStartSession: (session: ProgramSession) => void
  userId: string
}) => {
  const [selectedWeek, setSelectedWeek] = useState(1)
  
  const progress = (program.completed / program.totalSessions) * 100
  const weeks = Math.ceil(program.duration / 7)
  const difficultyKey = difficultyMapping[program.difficulty]
  const difficulty = DIFFICULTY_LEVELS[difficultyKey] || DIFFICULTY_LEVELS.easy
  
  const getWeekSessions = (week: number) => {
    const startDay = (week - 1) * 7 + 1
    const endDay = Math.min(week * 7, program.duration)
    return program.sessions.filter((session: ProgramSession) => session.day >= startDay && session.day <= endDay)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`w-16 h-16 bg-gradient-to-br ${program.color} rounded-xl flex items-center justify-center`}>
          <span className="text-3xl">{program.icon}</span>
        </div>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-white">{program.title}</h2>
          <p className="text-gray-400">{program.subtitle}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {program.duration} giorni
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {program.dailyTime} min/giorno
            </span>
            <span className={`px-2 py-1 rounded-full text-xs ${difficulty.bgColor} ${difficulty.color}`}>
              {difficulty.name}
            </span>
            <span className="flex items-center gap-1">
              <Camera className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400">AI Tracking</span>
            </span>
          </div>
        </div>
        
        {program.completed > 0 && (
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{Math.round(progress)}%</div>
            <div className="text-xs text-gray-400">Completato</div>
          </div>
        )}
      </div>

      {/* AI System Info */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <Camera className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1">Sistema AI Integrato</h3>
            <p className="text-gray-400 text-sm">
              Ogni sessione utilizza il sistema AI completo per tracking movimenti, 
              analisi della forma e feedback in tempo reale.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {program.features.map((feature, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">{feature}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Progress Overview */}
      {program.completed > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">I Tuoi Progressi AI</h3>
          <div className="grid grid-cols-4 gap-6 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{program.completed}</div>
              <div className="text-sm text-gray-400">Sessioni Completate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{program.totalSessions - program.completed}</div>
              <div className="text-sm text-gray-400">Rimanenti</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{program.completed * program.dailyTime}</div>
              <div className="text-sm text-gray-400">Min con AI</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {Math.round((program.completed / program.totalSessions) * program.xpReward)}
              </div>
              <div className="text-sm text-gray-400">XP Guadagnati</div>
            </div>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${program.color} transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </Card>
      )}

      {/* Program Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Description & Benefits */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Cosa Otterrai</h3>
          <p className="text-gray-300 mb-4">{program.description}</p>
          <ul className="space-y-2">
            {program.benefits.map((benefit: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm">{benefit}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Exercise System Integration */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Esercizi AI Inclusi</h3>
          <div className="space-y-3">
            {program.exercises.map((exerciseId) => {
              const exercise = EXERCISE_DEFINITIONS[exerciseId]
              if (!exercise) return null
              
              const exerciseDifficultyKey = difficultyMapping[exercise.difficulty as ProgramDifficulty] || 'easy'
              const exerciseDifficulty = DIFFICULTY_LEVELS[exerciseDifficultyKey]
              
              return (
                <div key={exerciseId} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Camera className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{exercise.name}</p>
                      <p className="text-gray-400 text-xs">{exercise.category}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${exerciseDifficulty.bgColor} ${exerciseDifficulty.color}`}>
                    {exerciseDifficulty.name}
                  </span>
                </div>
              )
            })}
          </div>
          
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm font-medium">Sistema AI Completo</span>
            </div>
            <p className="text-blue-100 text-xs">
              Ogni esercizio viene tracciato con MediaPipe, analisi forma in tempo reale, 
              conteggio automatico ripetizioni e feedback vocale professionale.
            </p>
          </div>
        </Card>
      </div>

      {/* Weekly Schedule */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Programma Settimanale</h3>
          {weeks > 1 && (
            <div className="flex gap-2">
              {Array.from({length: weeks}, (_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedWeek(i + 1)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    selectedWeek === i + 1
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                  }`}
                >
                  Week {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-3">
          {getWeekSessions(selectedWeek).map((session: ProgramSession) => {
            const sessionExercises = session.exercises.map(id => EXERCISE_DEFINITIONS[id]).filter(Boolean)
            
            return (
              <div
                key={session.day}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  session.completed
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-slate-700/30 border-slate-600 hover:border-green-500/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    session.completed ? 'bg-green-500' : 'bg-slate-600'
                  }`}>
                    {session.completed ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-white font-bold">{session.day}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium">{session.title}</p>
                      <Camera className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                      <Clock className="w-3 h-3" />
                      <span>{session.duration} min</span>
                      <span>•</span>
                      <span className="text-purple-400">{session.focus}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {sessionExercises.map((exercise) => (
                        <span key={exercise.id} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                          {exercise.name}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{session.description}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => onStartSession(session)}
                  disabled={session.completed}
                  className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                    session.completed 
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {session.completed ? 'Completata' : (
                    <>
                      <Camera className="w-4 h-4 inline mr-1" />
                      AI Start
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Torna ai Programmi
        </button>
        
        <button
          onClick={() => {
            const nextSession = program.sessions.find((s: ProgramSession) => !s.completed)
            if (nextSession) onStartSession(nextSession)
          }}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
        >
          <Camera className="w-5 h-5" />
          {program.completed > 0 ? 'Continua con AI' : 'Inizia Programma AI'}
        </button>
      </div>
    </div>
  )
}

const ProgramSession = ({ 
  session, 
  program, 
  onBack,
  userId 
}: { 
  session: ProgramSession
  program: TrainingProgram
  onBack: () => void
  userId: string
}) => {
  // Get the first exercise for the AI tracker
  const mainExerciseId = session.exercises[0]
  const mainExercise = EXERCISE_DEFINITIONS[mainExerciseId]
  
  if (!mainExercise) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Errore: Esercizio non trovato</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
          Torna al Programma
        </button>
      </div>
    )
  }

  const handleComplete = async (data: any) => {
    // Mark session as completed
    session.completed = true
    program.completed += 1
    
    // In real app, save to database
    console.log('Session completed:', data)
    
    // Return to program view
    onBack()
  }

  const handleProgress = (progress: any) => {
    console.log('Session progress:', progress)
  }

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${program.color} rounded-xl flex items-center justify-center`}>
            <span className="text-xl">{program.icon}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{session.title}</h2>
            <p className="text-gray-400">{program.title} • Giorno {session.day}</p>
            <div className="flex items-center gap-2 mt-1">
              <Camera className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm">AI Tracking Attivo</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna
        </button>
      </div>

      {/* Session Info */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{session.duration}</p>
            <p className="text-xs text-gray-400">Minuti</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{session.targetReps || session.targetTime}</p>
            <p className="text-xs text-gray-400">{session.targetReps ? 'Reps Target' : 'Secondi Target'}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-purple-400">{session.focus}</p>
            <p className="text-xs text-gray-400">Focus</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-400">AI</p>
            <p className="text-xs text-gray-400">Tracking</p>
          </div>
        </div>
      </Card>

      {/* AI Tracker Component */}
      <AIExerciseTracker
        exerciseId={mainExerciseId}
        userId={userId}
        targetReps={session.targetReps}
        targetTime={session.targetTime}
        onComplete={handleComplete}
        onProgress={handleProgress}
        strictMode={false} // Program mode, not competition
      />

      {/* Session Notes */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-white">Note della Sessione</h3>
        </div>
        <p className="text-gray-300 text-sm mb-3">{session.description}</p>
        <div className="flex flex-wrap gap-2">
          {session.exercises.map((exerciseId) => {
            const exercise = EXERCISE_DEFINITIONS[exerciseId]
            return exercise ? (
              <span key={exerciseId} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                {exercise.name}
              </span>
            ) : null
          })}
        </div>
      </Card>
    </div>
  )
}

// ====================================
// MAIN COMPONENT
// ====================================
export default function TrainingProgramsPageOptimized() {
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null)
  const [activeSession, setActiveSession] = useState<ProgramSession | null>(null)
  const [userId, setUserId] = useState('mock-user-id')

  // Mock user data - in real app, get from auth
  const userLevel = 5

  const supabase = createClientComponentClient()

  useEffect(() => {
    // Load user data and program progress
    loadUserProgress()
  }, [])

  const loadUserProgress = async () => {
    try {
      // In real app, load from Supabase
      console.log('Loading user program progress...')
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }

  const handleStartSession = (session: ProgramSession) => {
    setActiveSession(session)
  }

  const handleBackToProgram = () => {
    setActiveSession(null)
  }

  const handleBackToList = () => {
    setSelectedProgram(null)
    setActiveSession(null)
  }

  // Active session view
  if (activeSession && selectedProgram) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <ProgramSession
            session={activeSession}
            program={selectedProgram}
            onBack={handleBackToProgram}
            userId={userId}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/training">
              <motion.button
                className="p-3 bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 hover:border-green-500/50 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-6 h-6 text-green-400" />
              </motion.button>
            </Link>
            
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                Programmi AI Guidati
              </h1>
              <p className="text-slate-400 mt-1">
                {selectedProgram ? selectedProgram.subtitle : 'Percorsi strutturati con sistema AI completo'}
              </p>
            </div>
          </div>

          {!selectedProgram && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <p className="text-blue-400 text-sm font-medium">Sistema AI Integrato 🤖</p>
              <p className="text-blue-100 text-xs">Tracking • Progressione • Risultati</p>
            </div>
          )}
        </div>

        {/* Content */}
        {selectedProgram ? (
          <ProgramDetail 
            program={selectedProgram}
            onBack={handleBackToList}
            onStartSession={handleStartSession}
            userId={userId}
          />
        ) : (
          <div className="space-y-8">
            {/* AI System Info */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border border-blue-500/30 backdrop-blur-xl"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Camera className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">Programmi con AI Tracking Completo</h3>
                  <p className="text-slate-300 text-sm">
                    Ogni sessione integra il sistema MediaPipe per analisi movimento in tempo reale, 
                    feedback vocale personalizzato e tracking automatico delle performance.
                    Sistema enterprise con {Object.keys(EXERCISE_DEFINITIONS).length} esercizi AI-ready.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-400">{REAL_PROGRAMS.length}</div>
                  <div className="text-xs text-blue-300">programmi</div>
                </div>
              </div>
            </motion.div>

            {/* Programs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {REAL_PROGRAMS.map((program, index) => (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProgramCard
                    program={program}
                    onSelect={setSelectedProgram}
                    userLevel={userLevel}
                  />
                </motion.div>
              ))}
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">AI Tracking Completo</h3>
                <p className="text-slate-400 text-sm">
                  MediaPipe, analisi forma, feedback vocale e video recording integrati
                </p>
              </Card>

              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Progressione Scientifica</h3>
                <p className="text-slate-400 text-sm">
                  Algoritmi avanzati per incremento graduale dell'intensità
                </p>
              </Card>

              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Award className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Risultati Misurabili</h3>
                <p className="text-slate-400 text-sm">
                  Metriche precise e tracking performance per ogni sessione
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}