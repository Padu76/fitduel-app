'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Camera, Zap, Target, Trophy, 
  Flame, Timer, Activity, Eye, Settings,
  Play, Square, RotateCcw, CheckCircle,
  AlertTriangle, Dumbbell, Swords, TrendingUp,
  User, Calendar, Award, Star, Crown, Lock
} from 'lucide-react'

// Import your existing AI system
// NOTE: These imports will work when deployed in your project
// import { AIExerciseTracker } from '@/components/game/AIExerciseTracker'
// import { useGameStore } from '@/stores/useGameStore'

export default function TrainingPage() {
  // State for user and auth
  const [user, setUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<any>(null)
  const [duelMode, setDuelMode] = useState<any>(null)
  const [userStats, setUserStats] = useState<any>(null)

  // Your existing game store would be used here
  // const gameStore = useGameStore()

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

      // Load user stats
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
      // Mock stats - in real app would fetch from Supabase
      setUserStats({
        totalWorkouts: 42,
        totalCalories: 8470,
        averageFormScore: 87,
        currentStreak: 5,
        bestExercise: 'push_up',
        weeklyXP: 1240,
        completedChallenges: 18
      })
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
      description: 'Training avanzato con analisi AI in tempo reale',
      icon: Camera,
      color: 'from-blue-500 to-purple-500',
      difficulty: 'ADVANCED',
      duration: 'Variabile',
      calories: '300-600',
      features: ['Real-time Form Analysis', 'Rep Counting', 'Voice Coaching', 'Performance Recording'],
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

  const exercises = [
    {
      id: 'push_up',
      name: 'Push-Up',
      code: 'push_up',
      icon: '💪',
      description: 'Pettorali, spalle, tricipiti',
      difficulty: 'Medium',
      category: 'Upper Body',
      aiSupported: true
    },
    {
      id: 'squat',
      name: 'Squat',
      code: 'squat', 
      icon: '🦵',
      description: 'Gambe e glutei',
      difficulty: 'Easy',
      category: 'Lower Body',
      aiSupported: true
    },
    {
      id: 'plank',
      name: 'Plank',
      code: 'plank',
      icon: '🏃',
      description: 'Core e stabilità',
      difficulty: 'Medium',
      category: 'Core',
      aiSupported: true
    },
    {
      id: 'burpee',
      name: 'Burpee',
      code: 'burpee',
      icon: '🔥',
      description: 'Full body explosive',
      difficulty: 'Hard',
      category: 'Full Body',
      aiSupported: true
    }
  ]

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
      // Show exercise selection for AI mode
      return
    }
    
    // For other modes, redirect to specific training
    window.location.href = `/training/${mode.id}`
  }

  const handleExerciseSelect = (exercise: any) => {
    setSelectedExercise(exercise)
  }

  const handleStartAITraining = () => {
    if (!selectedExercise) return
    
    // Start AI tracking mode
    // In your real app, this would initialize AIExerciseTracker
    console.log('Starting AI training with:', selectedExercise)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-gray-400">Caricamento sistema training...</p>
        </div>
      </div>
    )
  }

  // AI Training Mode View
  if (selectedMode === 'ai_tracker' && selectedExercise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setSelectedExercise(null)
                  setSelectedMode(null)
                }}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">AI Motion Tracking</h1>
                <p className="text-gray-400">{selectedExercise.name} - Analisi in tempo reale</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* AI Exercise Tracker Component */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 mb-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Sistema AI Avanzato</h3>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Il nostro sistema AI analizza i tuoi movimenti in tempo reale, conta automaticamente le ripetizioni, 
                valuta la forma e fornisce feedback vocale per migliorare le tue performance.
              </p>
              
              {/* NOTE: In your real app, replace this with your AIExerciseTracker component */}
              {/* 
              <AIExerciseTracker
                exerciseId={selectedExercise.id}
                userId={user.id}
                duelId={duelMode?.id}
                onComplete={(data) => {
                  // Handle completion
                  console.log('Training completed:', data)
                }}
                onProgress={(progress) => {
                  // Handle progress updates
                  console.log('Progress:', progress)
                }}
              />
              */}
              
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                <h4 className="text-lg font-bold text-blue-400 mb-3">🚀 AI System Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Riconoscimento pose MediaPipe</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Conteggio ripetizioni automatico</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Analisi forma in tempo reale</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Feedback vocale intelligente</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Registrazione performance video</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Salvataggio database Supabase</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleStartAITraining}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                <Play className="w-5 h-5 inline mr-2" />
                Avvia Sistema AI
              </button>
            </div>
          </div>
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
                <h1 className="text-2xl font-bold text-white">Seleziona Esercizio</h1>
                <p className="text-gray-400">Scegli l'esercizio per il training AI</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {exercises.map((exercise) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleExerciseSelect(exercise)}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 cursor-pointer hover:border-blue-500/50 transition-all"
              >
                <div className="text-center space-y-4">
                  <div className="text-4xl mb-3">{exercise.icon}</div>
                  <h3 className="text-xl font-bold text-white">{exercise.name}</h3>
                  <p className="text-gray-400 text-sm">{exercise.description}</p>
                  
                  <div className="flex items-center justify-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      exercise.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                      exercise.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {exercise.difficulty}
                    </span>
                    {exercise.aiSupported && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold">
                        AI ✓
                      </span>
                    )}
                  </div>
                  
                  <div className="pt-2">
                    <button className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                      Seleziona
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
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
                <p className="text-gray-400">Modalità competitive - Nessun compromesso</p>
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
                <h3 className="text-lg font-bold text-white mb-1">Sfida Attiva!</h3>
                <p className="text-gray-300">
                  Hai una sfida in corso contro <span className="font-bold">{duelMode.opponent}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedMode('duel_training')}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Vai alla Sfida
              </button>
            </div>
          </motion.div>
        )}

        {/* Training Modes */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Modalità Elite</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {trainingModes.map((mode, index) => {
              const Icon = mode.icon
              const isLocked = mode.isPremium && user?.level < 10
              const requiresActive = mode.requiresActive && !duelMode
              
              return (
                <motion.div
                  key={mode.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => !isLocked && !requiresActive && handleModeSelect(mode)}
                  className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 transition-all duration-300 ${
                    isLocked || requiresActive 
                      ? 'opacity-60 cursor-not-allowed' 
                      : 'hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer group'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-16 h-16 bg-gradient-to-r ${mode.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isLocked && <Lock className="w-5 h-5 text-gray-500" />}
                      {mode.isPremium && <Crown className="w-5 h-5 text-yellow-400" />}
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
                  
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
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
                  
                  <div className={`w-full bg-gradient-to-r ${mode.color} text-white font-bold py-3 text-center rounded-xl transition-all duration-200 ${
                    isLocked || requiresActive 
                      ? 'opacity-50' 
                      : 'hover:shadow-lg'
                  }`}>
                    {mode.id === 'ai_tracker' ? 'AVVIA AI TRACKER' : 'INIZIA TRAINING'}
                  </div>
                </motion.div>
              )
            })}
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