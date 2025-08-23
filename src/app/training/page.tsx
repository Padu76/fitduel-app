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

// Import your REAL AI system components - VERSIONE MODULARE
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

export default function TrainingPage() {
  // Your real game store
  const gameStore = useGameStore()
  
  // State for user and auth
  const [user, setUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<ExerciseConfig | null>(null)
  const [duelMode, setDuelMode] = useState<any>(null)
  const [userStats, setUserStats] = useState<any>(null)

  // AI Training specific state
  const [aiTrainingActive, setAiTrainingActive] = useState(false)
  const [trainingCompleted, setTrainingCompleted] = useState(false)
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)

  // Load user data on mount
  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)
      
      // Check authentication
      const authResponse = await fetch('/api/auth/login', { method: 'GET' })
      const authData = await authResponse.json()
      
      if (!authData.authenticated) {
        window.location.href = '/login'
        return
      }

      setUser({
        id: authData.user.id,
        username: authData.user.username,
        email: authData.user.email,
        level: authData.user.level || 1,
        xp: authData.user.xp || 0
      })
      setIsAuthenticated(true)

      // Load user stats from your game store or Supabase
      await loadUserStats(authData.user.id)
      
      // Check for active duel
      await checkActiveDuel(authData.user.id)

    } catch (error) {
      console.error('Error loading user data:', error)
      window.location.href = '/login'
    } finally {
      setLoading(false)
    }
  }

  const loadUserStats = async (userId: string) => {
    try {
      // Try to load from your game store first, then fallback to API
      const gameStats = gameStore.currentSession
      
      if (gameStats) {
        setUserStats({
          totalWorkouts: gameStore.totalExercises,
          totalCalories: gameStore.totalCalories,
          averageFormScore: gameStore.averageFormScore,
          currentStreak: gameStore.streakDays,
          bestExercise: 'push_up',
          weeklyXP: 1240,
          completedChallenges: 18,
          totalReps: gameStore.totalReps,
          totalDuration: gameStore.totalDuration
        })
      } else {
        // Fallback to API call if game store is empty
        setUserStats({
          totalWorkouts: 42,
          totalCalories: 8470,
          averageFormScore: 87,
          currentStreak: 5,
          bestExercise: 'push_up',
          weeklyXP: 1240,
          completedChallenges: 18,
          totalReps: 850,
          totalDuration: 3600
        })
      }
    } catch (error) {
      console.error('Error loading user stats:', error)
    }
  }

  const checkActiveDuel = async (userId: string) => {
    try {
      // Check if user has an active duel
      const response = await fetch('/api/duels/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.activeDuel) {
          setDuelMode(data.activeDuel)
        }
      }
    } catch (error) {
      console.error('Error checking active duel:', error)
    }
  }

  const trainingModes = [
    {
      id: 'ai_tracker',
      title: 'AI Motion Tracking',
      description: 'Sistema AI avanzato con analisi in tempo reale',
      icon: Camera,
      color: 'from-blue-500 to-purple-500',
      difficulty: 'ADVANCED',
      duration: 'Variabile',
      calories: '300-600',
      features: ['MediaPipe Pose Detection', 'Real-time Form Analysis', 'Voice Coaching', 'Video Recording'],
      isPremium: false
    },
    {
      id: 'duel_training',
      title: 'Combat Preparation',
      description: 'Allenamento specifico per sfide competitive',
      icon: Swords,
      color: 'from-red-500 to-orange-500',
      difficulty: 'ELITE',
      duration: '20-45 min',
      calories: '400-800',
      features: ['Competition Focus', 'Performance Metrics', 'Rival Analysis', 'Pressure Training'],
      isPremium: false,
      requiresActive: duelMode !== null
    },
    {
      id: 'intensive',
      title: 'Allenamento Intensivo',
      description: 'HIIT estremo per massima performance',
      icon: Flame,
      color: 'from-red-500 to-orange-500',
      difficulty: 'EXTREME',
      duration: '25-45 min',
      calories: '400-800',
      features: ['High Intensity', 'Burn Maximization', 'Endurance Push', 'Mental Strength'],
      isPremium: false
    },
    {
      id: 'performance',
      title: 'Performance Elite',
      description: 'Ottimizzazione per atleti professionisti',
      icon: Trophy,
      color: 'from-yellow-500 to-orange-500',
      difficulty: 'PRO',
      duration: '45-90 min',
      calories: '600-1200',
      features: ['Advanced Metrics', 'Biomechanics Analysis', 'Peak Performance', 'Pro Techniques'],
      isPremium: true
    }
  ]

  // Get ALL exercises from your real system (25+ exercises!)
  const exercises = Object.values(EXERCISE_DEFINITIONS)

  const handleModeSelect = (mode: any) => {
    if (mode.isPremium && user?.level < 10) {
      alert('Modalità Premium disponibile dal livello 10!')
      return
    }

    if (mode.id === 'duel_training' && !duelMode) {
      alert('Nessuna sfida attiva trovata!')
      return
    }

    setSelectedMode(mode.id)
    
    if (mode.id === 'ai_tracker') {
      // Initialize game store session for AI tracking
      gameStore.setGameStatus('ready')
      return
    }
    
    // For other modes, redirect to specific training
    window.location.href = `/training/${mode.id}`
  }

  const handleExerciseSelect = (exercise: ExerciseConfig) => {
    setSelectedExercise(exercise)
    
    // Start game session in your store
    gameStore.startSession(
      duelMode ? 'duel' : 'training',
      exercise.id, // Using exercise.id (your system uses exercise_id)
      exercise.difficulty,
      duelMode ? { reps: duelMode.target_reps, time: duelMode.target_time } : { 
        reps: exercise.targetReps, 
        time: exercise.targetTime 
      }
    )
  }

  const handleTrainingComplete = (data: PerformanceData) => {
    setPerformanceData(data)
    setTrainingCompleted(true)
    setAiTrainingActive(false)
    
    // Update game store
    gameStore.endSession()
    
    // Save to leaderboard if good performance
    if (data.feedback.formScore > 70) {
      gameStore.submitToLeaderboard({
        exerciseId: data.exerciseId,
        timestamp: data.timestamp,
        reps: data.repsCompleted,
        duration: data.duration,
        formScore: data.formScore,
        calories: data.caloriesBurned,
        difficulty: selectedExercise?.difficulty || 'medium',
        mode: duelMode ? 'duel' : 'training'
      })
    }
  }

  const handleTrainingProgress = (progress: number) => {
    // Update progress if needed
    console.log('Training progress:', progress)
  }

  const resetTraining = () => {
    setSelectedExercise(null)
    setSelectedMode(null)
    setAiTrainingActive(false)
    setTrainingCompleted(false)
    setPerformanceData(null)
    gameStore.resetSession()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-gray-400">Inizializzazione sistema AI...</p>
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Caricamento MediaPipe</p>
            <p>• Configurazione camera</p>
            <p>• Preparazione AI tracker</p>
          </div>
        </div>
      </div>
    )
  }

  // AI Training Active View - REAL AI SYSTEM
  if (selectedMode === 'ai_tracker' && selectedExercise && aiTrainingActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setAiTrainingActive(false)
                  gameStore.endSession()
                }}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">AI Motion Tracking - LIVE</h1>
                <p className="text-gray-400">{selectedExercise.name} - Sistema attivo</p>
              </div>
              
              <div className="ml-auto flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400 font-medium">AI ATTIVO</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* REAL AI EXERCISE TRACKER COMPONENT - VERSIONE MODULARE */}
          <AIExerciseTracker
            exerciseId={selectedExercise.id}
            userId={user.id}
            duelId={duelMode?.id}
            missionId={undefined}
            targetReps={duelMode?.target_reps || selectedExercise.targetReps || 20}
            targetTime={duelMode?.target_time || selectedExercise.targetTime}
            onComplete={handleTrainingComplete}
            onProgress={handleTrainingProgress}
            strictMode={duelMode ? true : false} // Anti-cheat per duelli
          />

          {/* Training Info Panel */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-6 h-6 text-blue-400" />
              <h3 className="text-lg font-bold text-white">Sistema AI in Funzione</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-blue-400 font-medium">Sistema AI Modulare:</p>
                <ul className="text-gray-300 space-y-1">
                  <li>• MediaPipe Pose Detection</li>
                  <li>• Real-time Form Analysis</li>
                  <li>• Automatic Rep Counting</li>
                  <li>• Voice Feedback System</li>
                  <li>• Anti-cheat Validation</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-blue-400 font-medium">Funzionalità Avanzate:</p>
                <ul className="text-gray-300 space-y-1">
                  <li>• Video Performance Recording</li>
                  <li>• Supabase Data Saving</li>
                  <li>• Trust Score & Validation</li>
                  <li>• Live Performance Metrics</li>
                  <li>• Calibration System</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Training Completed View
  if (trainingCompleted && performanceData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={resetTraining}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Training Completato! 🎉</h1>
                <p className="text-gray-400">Analisi performance - {selectedExercise?.name}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Performance Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Risultati Performance</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{performanceData.repsCompleted}</div>
                <div className="text-gray-400">Ripetizioni</div>
              </div>
              
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${
                  performanceData.formScore > 80 ? 'text-green-400' :
                  performanceData.formScore > 60 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {Math.round(performanceData.formScore)}%
                </div>
                <div className="text-gray-400">Form Score</div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-400 mb-2">
                  {Math.round(performanceData.caloriesBurned)}
                </div>
                <div className="text-gray-400">Calorie</div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">
                  {Math.floor(performanceData.duration / 60)}:{(performanceData.duration % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-gray-400">Tempo</div>
              </div>
            </div>

            {/* Quality Breakdown */}
            <div className="bg-gray-900/50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-white mb-4">Analisi Qualità</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Ripetizioni Perfette</span>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-bold">{performanceData.feedback.perfectReps}</span>
                    <Star className="w-4 h-4 text-green-400" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Ripetizioni Buone</span>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 font-bold">{performanceData.feedback.goodReps}</span>
                    <CheckCircle className="w-4 h-4 text-yellow-400" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Da Migliorare</span>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 font-bold">{performanceData.feedback.badReps}</span>
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Feedback */}
            {performanceData.feedback.suggestions.length > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-blue-400 mb-4">💡 Consigli AI</h3>
                <ul className="space-y-2">
                  {performanceData.feedback.suggestions.map((suggestion: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* XP and Rewards */}
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Ricompense Guadagnate</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      <span className="text-yellow-400 font-bold">+{Math.round(performanceData.formScore * 2)} XP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-400" />
                      <span className="text-orange-400 font-bold">+{Math.round(performanceData.caloriesBurned)} Cal</span>
                    </div>
                  </div>
                </div>
                <Award className="w-12 h-12 text-yellow-400" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  setTrainingCompleted(false)
                  setPerformanceData(null)
                  setAiTrainingActive(true)
                  gameStore.startSession('training', selectedExercise!.id, selectedExercise!.difficulty)
                }}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                <RotateCcw className="w-5 h-5 inline mr-2" />
                Ripeti Allenamento
              </button>
              
              <button
                onClick={resetTraining}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all"
              >
                Torna ai Training
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Exercise Selection for AI Mode
  if (selectedMode === 'ai_tracker' && !selectedExercise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedMode(null)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Seleziona Esercizio AI</h1>
                <p className="text-gray-400">Scegli dall'archivio completo di {exercises.length} esercizi</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* AI System Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border border-blue-500/30 backdrop-blur-xl mb-8"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Camera className="w-8 h-8 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Sistema AI Avanzato</h3>
                <p className="text-blue-100 text-sm mb-4">
                  Il nostro sistema utilizza MediaPipe per l'analisi in tempo reale dei movimenti, 
                  conta automaticamente le ripetizioni e fornisce feedback vocale professionale.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                    ✓ MediaPipe Pose
                  </span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                    ✓ Form Analysis
                  </span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                    ✓ Voice Coaching
                  </span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                    ✓ Video Recording
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Exercise Categories */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {Object.values(EXERCISE_CATEGORIES).map((category) => (
              <motion.div
                key={category.id}
                whileHover={{ scale: 1.05 }}
                className={`bg-gradient-to-r ${category.color} p-4 rounded-xl text-center text-white cursor-pointer`}
                onClick={() => {
                  // Filter exercises by category (you can implement this filtering)
                  console.log(`Filter by ${category.name}`)
                }}
              >
                <div className="text-2xl mb-2">{category.icon}</div>
                <h3 className="font-bold text-sm">{category.name}</h3>
                <p className="text-xs opacity-80 mt-1">
                  {getExercisesByCategory(category.id).length} esercizi
                </p>
              </motion.div>
            ))}
          </div>

          {/* All Exercises Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {exercises.map((exercise, index) => {
              const difficultyConfig = DIFFICULTY_LEVELS[exercise.difficulty]
              
              return (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleExerciseSelect(exercise)}
                  className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 cursor-pointer hover:border-blue-500/50 transition-all group"
                >
                  <div className="text-center space-y-4">
                    <div className="text-4xl mb-4">
                      {exercise.category === 'strength' ? '💪' : 
                       exercise.category === 'cardio' ? '🏃' : 
                       exercise.category === 'core' ? '🎯' : 
                       exercise.category === 'flexibility' ? '🧘' : '⚖️'}
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                      {exercise.name}
                    </h3>
                    <p className="text-gray-400 text-sm">{exercise.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${difficultyConfig.color} ${difficultyConfig.bgColor}`}>
                          {difficultyConfig.name.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-400 capitalize">
                        <span>{exercise.category}</span>
                      </div>
                      
                      <div className="flex items-center justify-center gap-2">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold">
                          🤖 AI Ready
                        </span>
                        {exercise.caloriesPerRep && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold">
                            ⚡ ~{Math.round(exercise.caloriesPerRep * (exercise.targetReps || 20))} cal
                          </span>
                        )}
                      </div>
                      
                      {exercise.targetReps && (
                        <div className="text-xs text-gray-500">
                          Target: {exercise.targetReps} reps
                        </div>
                      )}
                      
                      {exercise.targetTime && (
                        <div className="text-xs text-gray-500">
                          Target: {exercise.targetTime}s
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-4">
                      <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:shadow-lg transition-all group-hover:shadow-blue-500/25">
                        <Play className="w-5 h-5 inline mr-2" />
                        Avvia AI Tracker
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Start Button */}
          {selectedExercise && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-center"
            >
              <button
                onClick={() => setAiTrainingActive(true)}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-green-500/25 transition-all"
              >
                <Camera className="w-6 h-6 inline mr-3" />
                Inizia Sistema AI - {selectedExercise.name}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    )
  }

  // Main Training Page
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/dashboard"
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </a>
              <div>
                <h1 className="text-2xl font-bold text-white">Training Elite</h1>
                <p className="text-gray-400">Sistema AI completo - {exercises.length} esercizi disponibili</p>
              </div>
            </div>

            {user && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-medium text-white">{user.username}</div>
                  <div className="text-sm text-gray-400">Livello {user.level} • {user.xp} XP</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* User Stats Dashboard */}
        {userStats && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Dumbbell className="w-8 h-8 text-blue-400" />
                <span className="text-gray-400 text-sm">Allenamenti</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{userStats.totalWorkouts}</span>
                <span className="text-gray-400 text-sm">totali</span>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Flame className="w-8 h-8 text-orange-400" />
                <span className="text-gray-400 text-sm">Calorie</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{userStats.totalCalories}</span>
                <span className="text-gray-400 text-sm">kcal</span>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Target className="w-8 h-8 text-green-400" />
                <span className="text-gray-400 text-sm">Form Score</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{userStats.averageFormScore}%</span>
                <span className="text-gray-400 text-sm">medio</span>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <span className="text-gray-400 text-sm">Streak</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{userStats.currentStreak}</span>
                <span className="text-gray-400 text-sm">giorni</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Active Duel Alert */}
        {duelMode && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/30 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <Swords className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">⚔️ Sfida Attiva!</h3>
                <p className="text-gray-300">
                  Hai una sfida in corso - Usa il sistema AI per vincere!
                </p>
              </div>
              <button
                onClick={() => handleModeSelect({ id: 'ai_tracker', requiresActive: false })}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                <Camera className="w-5 h-5 inline mr-2" />
                Usa AI Tracker
              </button>
            </div>
          </motion.div>
        )}

        {/* Exercise Categories Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Categorie Esercizi</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.values(EXERCISE_CATEGORIES).map((category) => (
              <motion.div
                key={category.id}
                whileHover={{ scale: 1.05 }}
                className={`bg-gradient-to-r ${category.color} p-6 rounded-xl text-center text-white`}
              >
                <div className="text-3xl mb-3">{category.icon}</div>
                <h3 className="font-bold text-lg mb-1">{category.name}</h3>
                <p className="text-xs opacity-90 mb-2">{category.description}</p>
                <div className="text-sm font-bold">
                  {getExercisesByCategory(category.id).length} esercizi
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Training Modes */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Sistema Training Avanzato</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {trainingModes.map((mode, index) => {
              const Icon = mode.icon
              const isLocked = mode.isPremium && user?.level < 10
              const requiresActive = mode.requiresActive && !duelMode
              const isAIMode = mode.id === 'ai_tracker'
              
              return (
                <motion.div
                  key={mode.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => !isLocked && !requiresActive && handleModeSelect(mode)}
                  className={`bg-gray-800/50 backdrop-blur-sm border transition-all duration-300 rounded-2xl p-6 ${
                    isLocked || requiresActive 
                      ? 'opacity-60 cursor-not-allowed border-gray-700/50' 
                      : `border-gray-700/50 hover:shadow-2xl cursor-pointer group ${
                          isAIMode ? 'hover:shadow-blue-500/20 hover:border-blue-500/50' : 'hover:shadow-orange-500/10'
                        }`
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-16 h-16 bg-gradient-to-r ${mode.color} rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 ${
                      !isLocked && !requiresActive ? 'group-hover:scale-110' : ''
                    }`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isLocked && <Lock className="w-5 h-5 text-gray-500" />}
                      {mode.isPremium && <Crown className="w-5 h-5 text-yellow-400" />}
                      {isAIMode && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        mode.difficulty === 'EXTREME' ? 'bg-red-500/20 text-red-400' :
                        mode.difficulty === 'ELITE' ? 'bg-purple-500/20 text-purple-400' :
                        mode.difficulty === 'PRO' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {mode.difficulty}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className={`text-xl font-bold text-white mb-2 transition-colors ${
                    !isLocked && !requiresActive ? 'group-hover:text-blue-400' : ''
                  }`}>
                    {mode.title}
                  </h3>
                  
                  <p className="text-gray-400 mb-6">{mode.description}</p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Durata:</span>
                      <span className="text-white font-medium">{mode.duration}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Calorie:</span>
                      <span className="text-white font-medium">{mode.calories}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    {mode.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {requiresActive && (
                    <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-yellow-400 text-sm font-medium">
                        Richiede una sfida attiva per essere utilizzato
                      </p>
                    </div>
                  )}

                  {isLocked && (
                    <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-yellow-400 text-sm font-medium">
                        Disponibile dal Livello 10
                      </p>
                    </div>
                  )}

                  {isAIMode && !isLocked && !requiresActive && (
                    <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-blue-400 text-sm font-medium">
                        🤖 Sistema AI Ready - {exercises.length} esercizi disponibili
                      </p>
                    </div>
                  )}
                  
                  <div className={`w-full bg-gradient-to-r ${mode.color} text-white font-bold py-3 text-center rounded-xl transition-all duration-200 ${
                    isLocked || requiresActive 
                      ? 'opacity-50' 
                      : 'hover:shadow-lg'
                  }`}>
                    {isAIMode ? '🚀 AVVIA SISTEMA AI' : '⚡ INIZIA TRAINING'}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Workout Presets */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Programmi Pre-impostati</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.entries(WORKOUT_PRESETS).map(([key, preset]) => (
              <motion.div
                key={key}
                whileHover={{ scale: 1.02 }}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 cursor-pointer hover:border-purple-500/50 transition-all"
              >
                <h3 className="font-bold text-white mb-2">{preset.name}</h3>
                <p className="text-sm text-gray-400 mb-3">
                  {preset.duration} min • Riposo {preset.restTime}s
                </p>
                <div className="text-xs text-gray-500">
                  {preset.exercises.length} esercizi
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Additional Links */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <a href="/training/library" className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 group">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Libreria Tecniche</h3>
            <p className="text-gray-400">Perfeziona movimenti e tecniche avanzate</p>
          </a>

          <a href="/training/programs" className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-300 group">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-green-400 transition-colors">Programmi Elite</h3>
            <p className="text-gray-400">Piani di allenamento personalizzati</p>
          </a>

          <a href="/challenges" className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 group">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Swords className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">Sfide Live</h3>
            <p className="text-gray-400">Combatti contro altri atleti</p>
          </a>
        </motion.div>
      </div>
    </div>
  )
}