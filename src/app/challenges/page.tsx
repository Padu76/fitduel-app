'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Swords, Trophy, Zap, Users, Target, Timer, Shield,
  Plus, Search, Filter, ArrowLeft, Clock, Flame, Star,
  AlertCircle, CheckCircle, User, Calendar, Crown,
  Gamepad2, Play, Eye, Dumbbell, TrendingUp
} from 'lucide-react'

// Types for real data
interface User {
  id: string
  username: string
  level: number
  xp: number
}

interface Exercise {
  id: string
  code: string
  name: string
  category: string
  difficulty: string
}

interface Duel {
  id: string
  type: string
  status: 'pending' | 'open' | 'active' | 'completed' | 'expired' | 'cancelled'
  challenger_id: string
  challenged_id: string | null
  exercise_id: string
  difficulty: string
  wager_xp: number
  reward_xp: number
  target_reps: number | null
  target_time: number | null
  max_participants: number
  current_participants: number
  created_at: string
  expires_at: string | null
  challenger?: User
  challenged?: User
  exercise?: Exercise
}

export default function ChallengesPage() {
  // State
  const [user, setUser] = useState<User | null>(null)
  const [myDuels, setMyDuels] = useState<Duel[]>([])
  const [openDuels, setOpenDuels] = useState<Duel[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'open' | 'my' | 'create'>('open')
  const [isCreating, setIsCreating] = useState(false)

  // Create duel form state
  const [createForm, setCreateForm] = useState({
    type: 'open',
    exercise_id: '',
    difficulty: 'medium',
    wager_xp: 100,
    target_reps: 20,
    target_time: 60,
    max_participants: 2
  })

  // Load data on component mount
  useEffect(() => {
    loadChallengesData()
  }, [])

  const loadChallengesData = async () => {
    try {
      setLoading(true)
      setError('')

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
        level: authData.user.level || 1,
        xp: authData.user.xp || 0
      })

      // Load data in parallel
      await Promise.all([
        loadMyDuels(authData.user.id),
        loadOpenDuels(authData.user.id),
        loadExercises()
      ])

    } catch (error) {
      console.error('Error loading challenges:', error)
      setError('Errore nel caricamento delle sfide')
    } finally {
      setLoading(false)
    }
  }

  const loadMyDuels = async (userId: string) => {
    try {
      // Try to call your existing API
      const response = await fetch('/api/duels/my', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        const data = await response.json()
        setMyDuels(data.duels || [])
      } else {
        // Mock data if API not ready
        setMyDuels([
          {
            id: '1',
            type: 'duel',
            status: 'active',
            challenger_id: userId,
            challenged_id: 'user2',
            exercise_id: 'pushups',
            difficulty: 'medium',
            wager_xp: 150,
            reward_xp: 300,
            target_reps: 30,
            target_time: null,
            max_participants: 2,
            current_participants: 2,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24*60*60*1000).toISOString(),
            challenged: { id: 'user2', username: 'Marco_Beast', level: 12, xp: 5420 },
            exercise: { id: 'pushups', code: 'pushups', name: 'Push-ups', category: 'strength', difficulty: 'medium' }
          },
          {
            id: '2',
            type: 'open',
            status: 'pending',
            challenger_id: userId,
            challenged_id: null,
            exercise_id: 'squats',
            difficulty: 'hard',
            wager_xp: 200,
            reward_xp: 400,
            target_reps: 50,
            target_time: null,
            max_participants: 4,
            current_participants: 1,
            created_at: new Date(Date.now() - 2*60*60*1000).toISOString(),
            expires_at: new Date(Date.now() + 22*60*60*1000).toISOString(),
            exercise: { id: 'squats', code: 'squats', name: 'Squats', category: 'legs', difficulty: 'hard' }
          }
        ])
      }
    } catch (error) {
      console.error('Error loading my duels:', error)
    }
  }

  const loadOpenDuels = async (userId: string) => {
    try {
      // Try to call your existing API
      const response = await fetch('/api/duels/open', {
        method: 'GET'
      })

      if (response.ok) {
        const data = await response.json()
        // Filter out user's own challenges
        setOpenDuels((data.duels || []).filter((duel: Duel) => duel.challenger_id !== userId))
      } else {
        // Mock data if API not ready
        setOpenDuels([
          {
            id: '3',
            type: 'open',
            status: 'open',
            challenger_id: 'user3',
            challenged_id: null,
            exercise_id: 'burpees',
            difficulty: 'extreme',
            wager_xp: 300,
            reward_xp: 600,
            target_reps: 15,
            target_time: null,
            max_participants: 2,
            current_participants: 1,
            created_at: new Date(Date.now() - 30*60*1000).toISOString(),
            expires_at: new Date(Date.now() + 23.5*60*60*1000).toISOString(),
            challenger: { id: 'user3', username: 'Sara_Titan', level: 18, xp: 8950 },
            exercise: { id: 'burpees', code: 'burpees', name: 'Burpees', category: 'cardio', difficulty: 'extreme' }
          },
          {
            id: '4',
            type: 'tournament',
            status: 'open',
            challenger_id: 'user4',
            challenged_id: null,
            exercise_id: 'plank',
            difficulty: 'hard',
            wager_xp: 250,
            reward_xp: 500,
            target_reps: null,
            target_time: 120,
            max_participants: 8,
            current_participants: 3,
            created_at: new Date(Date.now() - 60*60*1000).toISOString(),
            expires_at: new Date(Date.now() + 23*60*60*1000).toISOString(),
            challenger: { id: 'user4', username: 'Alex_Champion', level: 22, xp: 12450 },
            exercise: { id: 'plank', code: 'plank', name: 'Plank Hold', category: 'core', difficulty: 'hard' }
          }
        ])
      }
    } catch (error) {
      console.error('Error loading open duels:', error)
    }
  }

  const loadExercises = async () => {
    try {
      // Mock exercises data - replace with real API call
      setExercises([
        { id: 'pushups', code: 'pushups', name: 'Push-ups', category: 'strength', difficulty: 'medium' },
        { id: 'squats', code: 'squats', name: 'Squats', category: 'legs', difficulty: 'medium' },
        { id: 'burpees', code: 'burpees', name: 'Burpees', category: 'cardio', difficulty: 'extreme' },
        { id: 'plank', code: 'plank', name: 'Plank Hold', category: 'core', difficulty: 'hard' },
        { id: 'jumping_jacks', code: 'jumping_jacks', name: 'Jumping Jacks', category: 'cardio', difficulty: 'easy' },
        { id: 'lunges', code: 'lunges', name: 'Lunges', category: 'legs', difficulty: 'medium' }
      ])
    } catch (error) {
      console.error('Error loading exercises:', error)
    }
  }

  const handleAcceptDuel = async (duelId: string) => {
    if (!user) return

    try {
      const response = await fetch('/api/duels/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          duelId,
          userId: user.id 
        })
      })

      if (response.ok) {
        // Refresh data
        await loadChallengesData()
      } else {
        const error = await response.json()
        setError(error.message || 'Errore nell\'accettare la sfida')
      }
    } catch (error) {
      console.error('Error accepting duel:', error)
      setError('Errore di connessione')
    }
  }

  const handleCreateDuel = async () => {
    if (!user || !createForm.exercise_id) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/duels/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          challenger_id: user.id
        })
      })

      if (response.ok) {
        // Reset form and refresh data
        setCreateForm({
          type: 'open',
          exercise_id: '',
          difficulty: 'medium',
          wager_xp: 100,
          target_reps: 20,
          target_time: 60,
          max_participants: 2
        })
        setActiveTab('my')
        await loadChallengesData()
      } else {
        const error = await response.json()
        setError(error.message || 'Errore nella creazione della sfida')
      }
    } catch (error) {
      console.error('Error creating duel:', error)
      setError('Errore di connessione')
    } finally {
      setIsCreating(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-400/10'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10'
      case 'hard': return 'text-orange-400 bg-orange-400/10'
      case 'extreme': return 'text-red-400 bg-red-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-green-400 bg-green-400/10'
      case 'active': return 'text-blue-400 bg-blue-400/10'
      case 'pending': return 'text-yellow-400 bg-yellow-400/10'
      case 'completed': return 'text-purple-400 bg-purple-400/10'
      case 'expired': return 'text-gray-400 bg-gray-400/10'
      case 'cancelled': return 'text-red-400 bg-red-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return 'Scaduta'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/dashboard"
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </a>
              <div className="flex items-center gap-3">
                <Swords className="w-8 h-8 text-red-500" />
                <div>
                  <h1 className="text-2xl font-bold">Arena delle Sfide</h1>
                  <p className="text-gray-400 text-sm">Sfida i migliori atleti del mondo</p>
                </div>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-medium">{user.username}</div>
                  <div className="text-sm text-gray-400">Livello {user.level} • {user.xp} XP</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center p-4 bg-red-900/50 border border-red-500 rounded-lg"
          >
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <span className="text-red-200">{error}</span>
            <button 
              onClick={() => setError('')}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </motion.div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => setActiveTab('open')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'open'
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg'
                : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Sfide Aperte
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('my')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'my'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Le Mie Sfide
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Crea Sfida
            </div>
          </button>
        </div>

        {/* Open Challenges Tab */}
        {activeTab === 'open' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Sfide Disponibili</h2>
              <div className="text-sm text-gray-400">
                {openDuels.length} sfide disponibili
              </div>
            </div>

            {openDuels.length === 0 ? (
              <div className="text-center py-16 bg-gray-800/30 rounded-2xl border border-gray-700/50">
                <Swords className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-400 mb-2">Nessuna sfida aperta</h3>
                <p className="text-gray-500 mb-6">Sii il primo a creare una sfida!</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
                >
                  Crea Prima Sfida
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {openDuels.map((duel) => (
                  <motion.div
                    key={duel.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:shadow-2xl hover:shadow-red-500/10 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {duel.type === 'tournament' && <Crown className="w-5 h-5 text-yellow-400" />}
                        <div>
                          <div className="font-bold text-lg">{duel.exercise?.name}</div>
                          <div className="text-sm text-gray-400">
                            by {duel.challenger?.username} • Livello {duel.challenger?.level}
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(duel.difficulty)}`}>
                        {duel.difficulty.toUpperCase()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                        <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                        <div className="text-sm text-gray-400">Premio</div>
                        <div className="font-bold text-yellow-400">{duel.reward_xp} XP</div>
                      </div>
                      <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                        <Timer className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                        <div className="text-sm text-gray-400">Scade in</div>
                        <div className="font-bold text-blue-400">
                          {duel.expires_at ? formatTimeRemaining(duel.expires_at) : 'Mai'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {duel.target_reps && (
                          <div className="text-sm">
                            <span className="text-gray-400">Target: </span>
                            <span className="text-white font-medium">{duel.target_reps} reps</span>
                          </div>
                        )}
                        {duel.target_time && (
                          <div className="text-sm">
                            <span className="text-gray-400">Tempo: </span>
                            <span className="text-white font-medium">{duel.target_time}s</span>
                          </div>
                        )}
                        <div className="text-sm">
                          <span className="text-gray-400">Partecipanti: </span>
                          <span className="text-white font-medium">
                            {duel.current_participants}/{duel.max_participants}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAcceptDuel(duel.id)}
                        className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-all font-medium"
                      >
                        <div className="flex items-center gap-2">
                          <Play className="w-4 h-4" />
                          Accetta
                        </div>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* My Challenges Tab */}
        {activeTab === 'my' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Le Mie Sfide</h2>
              <div className="text-sm text-gray-400">
                {myDuels.length} sfide attive
              </div>
            </div>

            {myDuels.length === 0 ? (
              <div className="text-center py-16 bg-gray-800/30 rounded-2xl border border-gray-700/50">
                <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-400 mb-2">Nessuna sfida attiva</h3>
                <p className="text-gray-500 mb-6">Inizia la tua prima sfida ora!</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Crea Sfida
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myDuels.map((duel) => (
                  <motion.div
                    key={duel.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                          <Dumbbell className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-bold text-lg">{duel.exercise?.name}</div>
                          <div className="text-sm text-gray-400">
                            {duel.challenged ? `vs ${duel.challenged.username}` : 'Sfida aperta'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(duel.status)}`}>
                          {duel.status.toUpperCase()}
                        </div>
                        
                        {duel.status === 'active' && (
                          <button
                            onClick={() => window.location.href = `/training?duel=${duel.id}`}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium"
                          >
                            Inizia
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-4">
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Premio</div>
                        <div className="font-bold text-yellow-400">{duel.reward_xp} XP</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Difficoltà</div>
                        <div className="font-bold capitalize">{duel.difficulty}</div>
                      </div>
                      {duel.target_reps && (
                        <div className="text-center">
                          <div className="text-xs text-gray-400">Reps</div>
                          <div className="font-bold">{duel.target_reps}</div>
                        </div>
                      )}
                      {duel.expires_at && (
                        <div className="text-center">
                          <div className="text-xs text-gray-400">Scade</div>
                          <div className="font-bold text-orange-400">
                            {formatTimeRemaining(duel.expires_at)}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Create Challenge Tab */}
        {activeTab === 'create' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Crea una Nuova Sfida</h2>
                <p className="text-gray-400">Sfida altri atleti e mostra le tue abilità</p>
              </div>

              <div className="space-y-6">
                {/* Exercise Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">
                    Esercizio
                  </label>
                  <select
                    value={createForm.exercise_id}
                    onChange={(e) => setCreateForm({...createForm, exercise_id: e.target.value})}
                    className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                  >
                    <option value="">Seleziona esercizio</option>
                    {exercises.map(exercise => (
                      <option key={exercise.id} value={exercise.id}>
                        {exercise.name} ({exercise.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty & Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Difficoltà
                    </label>
                    <select
                      value={createForm.difficulty}
                      onChange={(e) => setCreateForm({...createForm, difficulty: e.target.value})}
                      className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                    >
                      <option value="easy">Facile</option>
                      <option value="medium">Medio</option>
                      <option value="hard">Difficile</option>
                      <option value="extreme">Estremo</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Tipo Sfida
                    </label>
                    <select
                      value={createForm.type}
                      onChange={(e) => setCreateForm({...createForm, type: e.target.value})}
                      className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                    >
                      <option value="open">Sfida Aperta</option>
                      <option value="tournament">Torneo</option>
                    </select>
                  </div>
                </div>

                {/* Targets */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Target Ripetizioni
                    </label>
                    <input
                      type="number"
                      value={createForm.target_reps}
                      onChange={(e) => setCreateForm({...createForm, target_reps: parseInt(e.target.value) || 0})}
                      className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                      min="1"
                      max="1000"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Target Tempo (sec)
                    </label>
                    <input
                      type="number"
                      value={createForm.target_time}
                      onChange={(e) => setCreateForm({...createForm, target_time: parseInt(e.target.value) || 0})}
                      className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                      min="10"
                      max="3600"
                    />
                  </div>
                </div>

                {/* Wager & Participants */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      XP in Palio
                    </label>
                    <input
                      type="number"
                      value={createForm.wager_xp}
                      onChange={(e) => setCreateForm({...createForm, wager_xp: parseInt(e.target.value) || 0})}
                      className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                      min="50"
                      max="1000"
                      step="25"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Max Partecipanti
                    </label>
                    <select
                      value={createForm.max_participants}
                      onChange={(e) => setCreateForm({...createForm, max_participants: parseInt(e.target.value)})}
                      className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                    >
                      <option value={2}>2 (Duello)</option>
                      <option value={4}>4 (Squadra)</option>
                      <option value={8}>8 (Torneo)</option>
                    </select>
                  </div>
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreateDuel}
                  disabled={isCreating || !createForm.exercise_id}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all ${
                    isCreating || !createForm.exercise_id
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-green-500/25'
                  }`}
                >
                  {isCreating ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Creazione in corso...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="w-5 h-5" />
                      Crea Sfida
                    </div>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}