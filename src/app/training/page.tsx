'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, Timer, Zap, Trophy, Target, Flame, BarChart3,
  Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Settings,
  Volume2, VolumeX, Heart, TrendingUp, Award, Info, X
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

// ====================================
// TYPES
// ====================================
interface Exercise {
  id: string
  name: string
  icon: string
  description: string
  category: 'cardio' | 'strength' | 'flexibility' | 'balance'
  difficulty: 'easy' | 'medium' | 'hard'
  caloriesPerMinute: number
  muscleGroups: string[]
  defaultDuration: number // seconds
  defaultReps?: number
}

interface WorkoutSession {
  exerciseId: string
  duration: number
  reps: number
  calories: number
  formScore: number
  timestamp: string
}

interface WorkoutStats {
  totalTime: number
  totalCalories: number
  totalReps: number
  averageFormScore: number
  exercisesCompleted: number
}

// ====================================
// EXERCISES DATA
// ====================================
const EXERCISES: Exercise[] = [
  {
    id: 'push_up',
    name: 'Push-Up',
    icon: '💪',
    description: 'Classico esercizio per petto, spalle e tricipiti',
    category: 'strength',
    difficulty: 'medium',
    caloriesPerMinute: 8,
    muscleGroups: ['Petto', 'Spalle', 'Tricipiti', 'Core'],
    defaultDuration: 60,
    defaultReps: 20
  },
  {
    id: 'squat',
    name: 'Squat',
    icon: '🦵',
    description: 'Esercizio fondamentale per gambe e glutei',
    category: 'strength',
    difficulty: 'easy',
    caloriesPerMinute: 7,
    muscleGroups: ['Quadricipiti', 'Glutei', 'Polpacci', 'Core'],
    defaultDuration: 60,
    defaultReps: 25
  },
  {
    id: 'plank',
    name: 'Plank',
    icon: '🧘',
    description: 'Esercizio isometrico per il core',
    category: 'strength',
    difficulty: 'medium',
    caloriesPerMinute: 4,
    muscleGroups: ['Core', 'Spalle', 'Schiena'],
    defaultDuration: 45
  },
  {
    id: 'jumping_jack',
    name: 'Jumping Jack',
    icon: '⭐',
    description: 'Cardio total body ad alta intensità',
    category: 'cardio',
    difficulty: 'easy',
    caloriesPerMinute: 10,
    muscleGroups: ['Full Body'],
    defaultDuration: 60,
    defaultReps: 50
  },
  {
    id: 'burpee',
    name: 'Burpee',
    icon: '🔥',
    description: 'Esercizio completo ad alta intensità',
    category: 'cardio',
    difficulty: 'hard',
    caloriesPerMinute: 12,
    muscleGroups: ['Full Body'],
    defaultDuration: 60,
    defaultReps: 15
  },
  {
    id: 'mountain_climber',
    name: 'Mountain Climber',
    icon: '⛰️',
    description: 'Cardio e core training dinamico',
    category: 'cardio',
    difficulty: 'medium',
    caloriesPerMinute: 11,
    muscleGroups: ['Core', 'Spalle', 'Gambe'],
    defaultDuration: 45,
    defaultReps: 40
  },
  {
    id: 'lunges',
    name: 'Affondi',
    icon: '🚶',
    description: 'Esercizio per gambe e equilibrio',
    category: 'strength',
    difficulty: 'medium',
    caloriesPerMinute: 6,
    muscleGroups: ['Quadricipiti', 'Glutei', 'Polpacci'],
    defaultDuration: 60,
    defaultReps: 20
  },
  {
    id: 'sit_up',
    name: 'Sit-Up',
    icon: '🏋️',
    description: 'Classico esercizio per addominali',
    category: 'strength',
    difficulty: 'easy',
    caloriesPerMinute: 5,
    muscleGroups: ['Addominali', 'Core'],
    defaultDuration: 60,
    defaultReps: 30
  }
]

// ====================================
// COMPONENTS
// ====================================
const ExerciseCard = ({ 
  exercise, 
  isSelected, 
  onClick 
}: { 
  exercise: Exercise
  isSelected: boolean
  onClick: () => void 
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500 bg-green-500/10'
      case 'medium': return 'text-yellow-500 bg-yellow-500/10'
      case 'hard': return 'text-red-500 bg-red-500/10'
      default: return 'text-gray-500 bg-gray-500/10'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cardio': return 'from-red-500 to-orange-500'
      case 'strength': return 'from-blue-500 to-purple-500'
      case 'flexibility': return 'from-green-500 to-teal-500'
      case 'balance': return 'from-yellow-500 to-amber-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full text-left transition-all',
        isSelected && 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-950'
      )}
    >
      <Card variant="glass" className={cn(
        'p-4',
        isSelected ? 'bg-indigo-500/10' : 'hover:bg-gray-800/30'
      )}>
        <div className="flex items-start gap-4">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
            `bg-gradient-to-br ${getCategoryColor(exercise.category)}`
          )}>
            {exercise.icon}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-white">{exercise.name}</h3>
              <span className={cn(
                'text-xs px-2 py-1 rounded-full',
                getDifficultyColor(exercise.difficulty)
              )}>
                {exercise.difficulty === 'easy' ? 'Facile' :
                 exercise.difficulty === 'medium' ? 'Medio' : 'Difficile'}
              </span>
            </div>
            
            <p className="text-sm text-gray-400 mb-2">{exercise.description}</p>
            
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-gray-800 px-2 py-1 rounded-full">
                🔥 {exercise.caloriesPerMinute} cal/min
              </span>
              {exercise.defaultReps && (
                <span className="text-xs bg-gray-800 px-2 py-1 rounded-full">
                  🔢 {exercise.defaultReps} reps
                </span>
              )}
              <span className="text-xs bg-gray-800 px-2 py-1 rounded-full">
                ⏱️ {exercise.defaultDuration}s
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.button>
  )
}

const WorkoutTimer = ({ 
  exercise,
  onComplete,
  onCancel
}: {
  exercise: Exercise
  onComplete: (session: WorkoutSession) => void
  onCancel: () => void
}) => {
  const [timeLeft, setTimeLeft] = useState(exercise.defaultDuration)
  const [reps, setReps] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    if (isPaused || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, isPaused])

  const handleComplete = () => {
    const calories = Math.round((exercise.defaultDuration - timeLeft) / 60 * exercise.caloriesPerMinute)
    const formScore = Math.random() * 20 + 80 // Mock form score 80-100
    
    onComplete({
      exerciseId: exercise.id,
      duration: exercise.defaultDuration - timeLeft,
      reps: reps || exercise.defaultReps || 0,
      calories,
      formScore,
      timestamp: new Date().toISOString()
    })
  }

  const progress = ((exercise.defaultDuration - timeLeft) / exercise.defaultDuration) * 100

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-800"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{exercise.icon}</div>
          <h2 className="text-3xl font-bold text-white mb-2">{exercise.name}</h2>
          <p className="text-gray-400">{exercise.description}</p>
        </div>

        {/* Timer */}
        <div className="relative mb-8">
          <svg className="w-48 h-48 mx-auto transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-800"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
              className="text-indigo-500 transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold text-white">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-sm text-gray-400 mt-2">Tempo rimanente</div>
          </div>
        </div>

        {/* Reps Counter */}
        {exercise.defaultReps && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Ripetizioni completate</span>
              <span className="text-sm text-gray-400">Target: {exercise.defaultReps}</span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setReps(Math.max(0, reps - 1))}
              >
                -
              </Button>
              <div className="flex-1 text-center">
                <div className="text-3xl font-bold text-white">{reps}</div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setReps(reps + 1)}
              >
                +
              </Button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
          >
            <X className="w-5 h-5 mr-2" />
            Annulla
          </Button>
          
          <Button
            variant={isPaused ? 'gradient' : 'secondary'}
            className="flex-1"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? (
              <>
                <Play className="w-5 h-5 mr-2" />
                Riprendi
              </>
            ) : (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Pausa
              </>
            )}
          </Button>

          <Button
            variant="gradient"
            onClick={handleComplete}
          >
            Completa
          </Button>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </motion.div>
    </div>
  )
}

const SessionSummary = ({ 
  session,
  exercise,
  onClose
}: {
  session: WorkoutSession
  exercise: Exercise
  onClose: () => void
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-800"
      >
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Ottimo lavoro!</h2>
          <p className="text-gray-400 mb-6">Hai completato {exercise.name}</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card variant="glass" className="p-4">
              <Timer className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{session.duration}s</p>
              <p className="text-xs text-gray-400">Durata</p>
            </Card>

            <Card variant="glass" className="p-4">
              <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{session.calories}</p>
              <p className="text-xs text-gray-400">Calorie</p>
            </Card>

            {session.reps > 0 && (
              <Card variant="glass" className="p-4">
                <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{session.reps}</p>
                <p className="text-xs text-gray-400">Ripetizioni</p>
              </Card>
            )}

            <Card variant="glass" className="p-4">
              <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{session.formScore.toFixed(0)}%</p>
              <p className="text-xs text-gray-400">Form Score</p>
            </Card>
          </div>

          <Button variant="gradient" className="w-full" onClick={onClose}>
            Continua Allenamento
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// ====================================
// MAIN COMPONENT
// ====================================
export default function TrainingPage() {
  const router = useRouter()
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [isWorkingOut, setIsWorkingOut] = useState(false)
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null)
  const [todaySessions, setTodaySessions] = useState<WorkoutSession[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showInfo, setShowInfo] = useState(false)

  // Calculate today's stats
  const todayStats: WorkoutStats = todaySessions.reduce((acc, session) => ({
    totalTime: acc.totalTime + session.duration,
    totalCalories: acc.totalCalories + session.calories,
    totalReps: acc.totalReps + session.reps,
    averageFormScore: (acc.averageFormScore * acc.exercisesCompleted + session.formScore) / (acc.exercisesCompleted + 1),
    exercisesCompleted: acc.exercisesCompleted + 1
  }), {
    totalTime: 0,
    totalCalories: 0,
    totalReps: 0,
    averageFormScore: 0,
    exercisesCompleted: 0
  })

  const handleStartWorkout = () => {
    if (!selectedExercise) return
    setIsWorkingOut(true)
  }

  const handleCompleteWorkout = (session: WorkoutSession) => {
    setCurrentSession(session)
    setTodaySessions([...todaySessions, session])
    setIsWorkingOut(false)
    
    // Save XP (mock)
    const xpGained = Math.round(session.calories * 2 + session.formScore / 10)
    console.log(`Gained ${xpGained} XP!`)
  }

  const handleCancelWorkout = () => {
    setIsWorkingOut(false)
  }

  const filteredExercises = selectedCategory === 'all' 
    ? EXERCISES 
    : EXERCISES.filter(e => e.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Allenamento Libero</h1>
                <p className="text-sm text-gray-400">Allenati al tuo ritmo</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInfo(!showInfo)}
            >
              <Info className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column - Exercise List */}
          <div className="lg:col-span-8">
            {/* Today's Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card variant="glass" className="p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                <h2 className="text-lg font-bold text-white mb-4">Statistiche di Oggi</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <Timer className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                    <p className="text-xl font-bold text-white">
                      {Math.floor(todayStats.totalTime / 60)}:{(todayStats.totalTime % 60).toString().padStart(2, '0')}
                    </p>
                    <p className="text-xs text-gray-400">Tempo Totale</p>
                  </div>
                  <div className="text-center">
                    <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                    <p className="text-xl font-bold text-white">{todayStats.totalCalories}</p>
                    <p className="text-xs text-gray-400">Calorie</p>
                  </div>
                  <div className="text-center">
                    <Activity className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <p className="text-xl font-bold text-white">{todayStats.exercisesCompleted}</p>
                    <p className="text-xs text-gray-400">Esercizi</p>
                  </div>
                  <div className="text-center">
                    <Target className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                    <p className="text-xl font-bold text-white">{todayStats.totalReps}</p>
                    <p className="text-xs text-gray-400">Ripetizioni</p>
                  </div>
                  <div className="text-center">
                    <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                    <p className="text-xl font-bold text-white">
                      {todayStats.averageFormScore.toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-400">Form Media</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Category Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === 'all' ? 'gradient' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                Tutti
              </Button>
              <Button
                variant={selectedCategory === 'cardio' ? 'gradient' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategory('cardio')}
              >
                🏃 Cardio
              </Button>
              <Button
                variant={selectedCategory === 'strength' ? 'gradient' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategory('strength')}
              >
                💪 Forza
              </Button>
              <Button
                variant={selectedCategory === 'flexibility' ? 'gradient' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategory('flexibility')}
              >
                🧘 Flessibilità
              </Button>
              <Button
                variant={selectedCategory === 'balance' ? 'gradient' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategory('balance')}
              >
                ⚖️ Equilibrio
              </Button>
            </div>

            {/* Exercise List */}
            <div className="space-y-3">
              {filteredExercises.map((exercise, index) => (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ExerciseCard
                    exercise={exercise}
                    isSelected={selectedExercise?.id === exercise.id}
                    onClick={() => setSelectedExercise(exercise)}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Column - Exercise Details */}
          <div className="lg:col-span-4">
            <div className="sticky top-20">
              {selectedExercise ? (
                <motion.div
                  key={selectedExercise.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card variant="glass" className="p-6">
                    <div className="text-center mb-6">
                      <div className="text-6xl mb-4">{selectedExercise.icon}</div>
                      <h2 className="text-2xl font-bold text-white mb-2">{selectedExercise.name}</h2>
                      <p className="text-gray-400">{selectedExercise.description}</p>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Difficoltà</span>
                        <span className={cn(
                          'text-sm px-3 py-1 rounded-full',
                          selectedExercise.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                          selectedExercise.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        )}>
                          {selectedExercise.difficulty === 'easy' ? 'Facile' :
                           selectedExercise.difficulty === 'medium' ? 'Medio' : 'Difficile'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Calorie/min</span>
                        <span className="text-sm text-white">🔥 {selectedExercise.caloriesPerMinute}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Durata</span>
                        <span className="text-sm text-white">⏱️ {selectedExercise.defaultDuration}s</span>
                      </div>

                      {selectedExercise.defaultReps && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Ripetizioni</span>
                          <span className="text-sm text-white">🔢 {selectedExercise.defaultReps}</span>
                        </div>
                      )}
                    </div>

                    <div className="mb-6">
                      <p className="text-sm text-gray-400 mb-2">Muscoli coinvolti</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedExercise.muscleGroups.map(muscle => (
                          <span
                            key={muscle}
                            className="text-xs bg-gray-800 px-2 py-1 rounded-full text-gray-300"
                          >
                            {muscle}
                          </span>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="gradient"
                      size="lg"
                      className="w-full"
                      onClick={handleStartWorkout}
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Inizia Allenamento
                    </Button>
                  </Card>
                </motion.div>
              ) : (
                <Card variant="glass" className="p-8 text-center">
                  <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Seleziona un esercizio per iniziare</p>
                </Card>
              )}

              {/* Recent Sessions */}
              {todaySessions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <Card variant="glass" className="p-6">
                    <h3 className="font-bold text-white mb-4">Sessioni di Oggi</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {todaySessions.slice().reverse().map((session, index) => {
                        const exercise = EXERCISES.find(e => e.id === session.exerciseId)
                        if (!exercise) return null
                        
                        return (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{exercise.icon}</span>
                              <div>
                                <p className="text-sm text-white">{exercise.name}</p>
                                <p className="text-xs text-gray-400">
                                  {new Date(session.timestamp).toLocaleTimeString('it-IT', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-yellow-500">{session.calories} cal</p>
                              <p className="text-xs text-gray-400">{session.duration}s</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-800"
            >
              <h3 className="text-lg font-bold text-white mb-4">Come funziona</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <p>🎯 Seleziona un esercizio dalla lista</p>
                <p>⏱️ Segui il timer e conta le ripetizioni</p>
                <p>📊 Monitora i tuoi progressi in tempo reale</p>
                <p>🏆 Guadagna XP per ogni sessione completata</p>
                <p>💪 Nessuna competizione, solo tu e i tuoi obiettivi!</p>
              </div>
              <Button
                variant="gradient"
                className="w-full mt-6"
                onClick={() => setShowInfo(false)}
              >
                Ho capito!
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Workout Timer Modal */}
      {isWorkingOut && selectedExercise && (
        <WorkoutTimer
          exercise={selectedExercise}
          onComplete={handleCompleteWorkout}
          onCancel={handleCancelWorkout}
        />
      )}

      {/* Session Summary Modal */}
      {currentSession && selectedExercise && (
        <SessionSummary
          session={currentSession}
          exercise={EXERCISES.find(e => e.id === currentSession.exerciseId)!}
          onClose={() => setCurrentSession(null)}
        />
      )}
    </div>
  )
}