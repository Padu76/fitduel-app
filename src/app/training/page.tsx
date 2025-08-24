'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Camera, Zap, Target, Trophy, 
  Flame, Timer, Activity, Eye, Settings,
  Play, Square, RotateCcw, CheckCircle,
  AlertTriangle, Dumbbell, Swords, TrendingUp,
  User, Calendar, Award, Star, Crown, Lock,
  Loader2, AlertCircle, Volume2, VolumeX,
  Pause, StopCircle, Info, CameraOff, Wifi
} from 'lucide-react'

// Import your REAL AI system components
import { AIExerciseTracker } from '@/components/game/ai-tracker/AIExerciseTracker'
import { useGameStore } from '@/stores/useGameStore'

// Import REAL exercise system
import { 
  EXERCISE_DEFINITIONS, 
  EXERCISE_CATEGORIES, 
  DIFFICULTY_LEVELS,
  WORKOUT_PRESETS,
  getExercisesByCategory,
  getExercisesByDifficulty
} from '@/components/game/ai-tracker/constants/exercises'

// Import REAL types
import type { 
  ExerciseConfig, 
  PerformanceData, 
  AIFeedback 
} from '@/components/game/ai-tracker/types'

interface Exercise {
  id: string
  name: string
  category: string
  description: string
  difficulty: string
  targetReps?: number
  targetTime?: number
  caloriesPerRep?: number
  muscleGroups: string[]
  mediaType: string
}

export default function TrainingPage() {
  // Your real game store
  const gameStore = useGameStore()
  
  // State for user and auth
  const [user, setUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Training session state
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [sessionActive, setSessionActive] = useState(false)
  const [currentReps, setCurrentReps] = useState(0)
  const [currentSets, setCurrentSets] = useState(0)
  const [sessionTime, setSessionTime] = useState(0)
  const [totalCalories, setTotalCalories] = useState(0)
  const [isAIActive, setIsAIActive] = useState(false)
  
  // Performance tracking
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null)
  const [formScore, setFormScore] = useState(0)
  
  // UI state
  const [showAIOptions, setShowAIOptions] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected')

  // Enhanced exercises list with real data
  const exercises: Exercise[] = [
    {
      id: 'pushups',
      name: 'Push-ups',
      category: 'strength',
      description: 'Esercizio per pettorali, spalle e tricipiti',
      difficulty: 'medium',
      targetReps: 20,
      caloriesPerRep: 0.5,
      muscleGroups: ['Pettorali', 'Spalle', 'Tricipiti'],
      mediaType: 'video'
    },
    {
      id: 'squats',
      name: 'Squats',
      category: 'strength',
      description: 'Esercizio per quadricipiti e glutei',
      difficulty: 'medium',
      targetReps: 25,
      caloriesPerRep: 0.6,
      muscleGroups: ['Quadricipiti', 'Glutei', 'Core'],
      mediaType: 'video'
    },
    {
      id: 'plank',
      name: 'Plank',
      category: 'core',
      description: 'Esercizio isometrico per il core',
      difficulty: 'medium',
      targetTime: 60,
      caloriesPerRep: 0.8,
      muscleGroups: ['Core', 'Spalle', 'Addominali'],
      mediaType: 'video'
    },
    {
      id: 'burpees',
      name: 'Burpees',
      category: 'cardio',
      description: 'Esercizio total body ad alta intensità',
      difficulty: 'hard',
      targetReps: 15,
      caloriesPerRep: 1.2,
      muscleGroups: ['Total Body', 'Core', 'Cardio'],
      mediaType: 'video'
    },
    {
      id: 'mountain-climbers',
      name: 'Mountain Climbers',
      category: 'cardio',
      description: 'Esercizio cardio per core e resistenza',
      difficulty: 'medium',
      targetTime: 45,
      caloriesPerRep: 0.9,
      muscleGroups: ['Core', 'Spalle', 'Cardio'],
      mediaType: 'video'
    },
    {
      id: 'jumping-jacks',
      name: 'Jumping Jacks',
      category: 'cardio',
      description: 'Esercizio cardio per riscaldamento',
      difficulty: 'easy',
      targetReps: 30,
      caloriesPerRep: 0.4,
      muscleGroups: ['Total Body', 'Cardio'],
      mediaType: 'video'
    },
    {
      id: 'lunges',
      name: 'Lunges',
      category: 'strength',
      description: 'Esercizio unilaterale per gambe e glutei',
      difficulty: 'medium',
      targetReps: 20,
      caloriesPerRep: 0.7,
      muscleGroups: ['Quadricipiti', 'Glutei', 'Core'],
      mediaType: 'video'
    },
    {
      id: 'crunches',
      name: 'Crunches',
      category: 'core',
      description: 'Esercizio per addominali superiori',
      difficulty: 'easy',
      targetReps: 25,
      caloriesPerRep: 0.3,
      muscleGroups: ['Addominali', 'Core'],
      mediaType: 'video'
    }
  ]

  // Mock authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Simulate auth check
        setUser({ id: 'user-123', name: 'Utente Demo' })
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Auth error:', error)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  // Session timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (sessionActive) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [sessionActive])

  // Camera permission check
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        setCameraPermission('granted')
        stream.getTracks().forEach(track => track.stop())
      } catch (error) {
        setCameraPermission('denied')
      }
    }
    checkCameraPermission()
  }, [])

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise)
    setShowAIOptions(true)
  }

  const handleStartTraining = async () => {
    if (!selectedExercise) return
    
    setSessionActive(true)
    setCurrentReps(0)
    setCurrentSets(0)
    setSessionTime(0)
    setTotalCalories(0)
    setShowAIOptions(false)
    
    // Initialize AI if camera permission granted
    if (cameraPermission === 'granted') {
      setIsAIActive(true)
    }
  }

  const handleStopTraining = () => {
    setSessionActive(false)
    setIsAIActive(false)
    
    // Save session data
    const sessionData = {
      exercise: selectedExercise?.name,
      reps: currentReps,
      sets: currentSets,
      time: sessionTime,
      calories: totalCalories,
      timestamp: new Date()
    }
    console.log('Session completed:', sessionData)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'hard': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strength': return 'from-blue-500 to-purple-500'
      case 'cardio': return 'from-red-500 to-orange-500'
      case 'core': return 'from-green-500 to-teal-500'
      default: return 'from-gray-500 to-slate-500'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Caricamento sistema AI...</p>
        </div>
      </div>
    )
  }

  // AI Training Session View
  if (sessionActive && selectedExercise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Session Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Sessione AI Training</h2>
                <p className="text-gray-400">{selectedExercise.name} • Live Session</p>
              </div>
            </div>
            
            <button
              onClick={handleStopTraining}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <StopCircle className="w-4 h-4" />
              Termina Sessione
            </button>
          </div>

          {/* Real-time Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="w-5 h-5 text-blue-400" />
                <span className="text-gray-400 text-sm">Tempo</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatTime(sessionTime)}</p>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-400" />
                <span className="text-gray-400 text-sm">Reps</span>
              </div>
              <p className="text-2xl font-bold text-white">{currentReps}</p>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-purple-400" />
                <span className="text-gray-400 text-sm">Form Score</span>
              </div>
              <p className="text-2xl font-bold text-white">{formScore}%</p>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-gray-400 text-sm">Calorie</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalCalories}</p>
            </div>
          </div>

          {/* AI Tracker Component */}
          {isAIActive && (
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700/50 mb-6">
              <AIExerciseTracker
                exerciseId={selectedExercise.id}
                userId={user?.id || 'demo'}
                targetReps={selectedExercise.targetReps}
                targetTime={selectedExercise.targetTime}
                onComplete={(data) => {
                  setPerformanceData(prev => [...prev, data])
                  setTotalCalories(prev => prev + ((data as any).calories || 0))
                }}
                onProgress={(progress) => {
                  setCurrentReps(progress.reps || 0)
                  setFormScore(progress.formScore || 0)
                }}
                strictMode={false}
              />
            </div>
          )}

          {/* Exercise Info Card */}
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 bg-gradient-to-br ${getCategoryColor(selectedExercise.category)} rounded-xl flex items-center justify-center`}>
                <Dumbbell className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">{selectedExercise.name}</h3>
                <p className="text-gray-400 text-sm mb-2">{selectedExercise.description}</p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs border ${getDifficultyColor(selectedExercise.difficulty)}`}>
                    {selectedExercise.difficulty}
                  </span>
                  {selectedExercise.targetReps && (
                    <span className="text-blue-400 text-sm">Target: {selectedExercise.targetReps} reps</span>
                  )}
                  {selectedExercise.targetTime && (
                    <span className="text-blue-400 text-sm">Target: {selectedExercise.targetTime}s</span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Status */}
            <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-blue-100 text-sm font-medium">
                  Sistema AI MediaPipe Attivo
                </span>
              </div>
              <div className="flex items-center gap-2 text-blue-400 text-xs">
                <Camera className="w-4 h-4" />
                <span>Real-time Analysis</span>
              </div>
            </div>
          </div>
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
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                  <Dumbbell className="w-8 h-8 text-white" />
                </div>
                Training AI Hub
              </h1>
              <p className="text-slate-400 mt-1">
                Sistema AI completo con {exercises.length} esercizi e tracking real-time
              </p>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-blue-400 text-sm font-medium">Sistema Enterprise 🎯</p>
            <p className="text-blue-100 text-xs">MediaPipe • AI Tracking • Performance</p>
          </div>
        </div>

        {/* AI System Status */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border border-blue-500/30 backdrop-blur-xl mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Camera className="w-8 h-8 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">Sistema AI MediaPipe Ready</h3>
              <p className="text-blue-100 text-sm mb-4">
                Tracciamento pose in tempo reale, analisi del movimento e feedback intelligente 
                per ogni esercizio. Sistema enterprise con precisione scientifica.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${cameraPermission === 'granted' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-white text-sm">
                    Camera {cameraPermission === 'granted' ? 'Ready' : 'Richiesta permesso'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-white text-sm">AI Models Loaded</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-white text-sm">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Exercises Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {exercises.map((exercise, index) => (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all cursor-pointer group"
              onClick={() => handleExerciseSelect(exercise)}
            >
              {/* Exercise Header */}
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${getCategoryColor(exercise.category)} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
                <span className={`px-2 py-1 rounded-full text-xs border ${getDifficultyColor(exercise.difficulty)}`}>
                  {exercise.difficulty}
                </span>
              </div>
              
              {/* Exercise Info */}
              <h3 className="text-xl font-bold text-white mb-2">{exercise.name}</h3>
              <p className="text-sm text-gray-300 mb-4 line-clamp-2">{exercise.description}</p>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Target className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-blue-400">Target</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {exercise.targetReps || `${exercise.targetTime}s`}
                  </p>
                </div>
                
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-orange-400">Cal/rep</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {exercise.caloriesPerRep?.toFixed(1)}
                  </p>
                </div>
              </div>
              
              {/* Muscle Groups */}
              <div className="flex flex-wrap gap-1 mb-4">
                {exercise.muscleGroups.slice(0, 2).map((muscle, i) => (
                  <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                    {muscle}
                  </span>
                ))}
                {exercise.muscleGroups.length > 2 && (
                  <span className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-400">
                    +{exercise.muscleGroups.length - 2}
                  </span>
                )}
              </div>

              {/* AI Ready Badge */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                  <Camera className="w-3 h-3" />
                  <span>AI Ready</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-center group-hover:bg-blue-500/10 rounded-lg p-2 transition-all">
                <Play className="w-5 h-5 text-blue-400 mr-2 group-hover:scale-110 transition-transform" />
                <span className="text-blue-400 font-medium">Avvia Training AI</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* AI Options Modal */}
        <AnimatePresence>
          {showAIOptions && selectedExercise && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowAIOptions(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 rounded-2xl overflow-hidden max-w-md w-full border border-slate-700"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${getCategoryColor(selectedExercise.category)} rounded-xl flex items-center justify-center`}>
                      <Dumbbell className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{selectedExercise.name}</h3>
                      <p className="text-gray-400 text-sm">{selectedExercise.description}</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Camera className="w-5 h-5 text-blue-400" />
                        <span className="font-medium text-white">Sistema AI MediaPipe</span>
                      </div>
                      <p className="text-blue-100 text-sm">
                        Tracciamento pose real-time, conteggio automatico ripetizioni e 
                        analisi forma con feedback istantaneo.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                        <Target className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                        <p className="text-white font-bold">
                          {selectedExercise.targetReps || selectedExercise.targetTime}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {selectedExercise.targetReps ? 'Reps Target' : 'Seconds'}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                        <Flame className="w-6 h-6 text-orange-400 mx-auto mb-1" />
                        <p className="text-white font-bold">
                          {((selectedExercise.caloriesPerRep || 0) * (selectedExercise.targetReps || selectedExercise.targetTime || 10)).toFixed(0)}
                        </p>
                        <p className="text-gray-400 text-xs">Cal. Stimate</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowAIOptions(false)}
                      className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
                    >
                      Annulla
                    </button>
                    <motion.div 
                      className="flex-1"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <button
                        onClick={handleStartTraining}
                        className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        Inizia Sistema AI - {selectedExercise.name}
                      </button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-2xl p-6 border border-green-500/30 cursor-pointer"
          >
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Training Programs</h3>
            <p className="text-green-100 text-sm">
              Programmi strutturati con progressioni AI-driven
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30 cursor-pointer"
          >
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
              <Eye className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Exercise Library</h3>
            <p className="text-purple-100 text-sm">
              Libreria completa con guide dettagliate
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-6 border border-orange-500/30 cursor-pointer"
          >
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Performance Analytics</h3>
            <p className="text-orange-100 text-sm">
              Analisi dettagliate e progressi nel tempo
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}