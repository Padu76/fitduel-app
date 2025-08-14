'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Swords, Trophy, Zap, Users, Target, Timer, Shield,
  Plus, Search, Filter, ChevronRight, Flame, Crown,
  Star, Medal, Activity, TrendingUp, Calendar, Bell,
  ArrowLeft, RefreshCw, AlertCircle, CheckCircle, Clock,
  Info
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ====================================
// TYPES - UPDATED TO MATCH DATABASE
// ====================================
interface Exercise {
  id: string
  name: string
  code: string
  category: string
  icon?: string
  met_value?: number
  is_active: boolean
}

interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  email: string
  level?: number
  xp?: number
  coins?: number
}

interface Duel {
  id: string
  type: '1v1' | 'open' | 'tournament' | 'mission'
  status: 'pending' | 'open' | 'active' | 'completed' | 'expired' | 'cancelled'
  challenger_id: string // CORRECT
  challenger?: Profile
  challenged_id: string | null // CORRECT: challenged_id, not opponent_id
  challenged?: Profile // CORRECT: challenged, not opponent
  exercise_id: string // CORRECT: exercise_id, not exercise_code
  exercise?: Exercise
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  wager_coins: number // CORRECT: coins, not xp
  xp_reward: number
  challenger_score?: number // CORRECT
  challenged_score?: number // CORRECT: challenged_score, not opponent_score
  winner_id?: string | null
  metadata?: { // CORRECT: using metadata for targets
    targetReps?: number
    targetTime?: number
    rules?: any
  }
  expires_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

// Helper function to check if exercise is time-based
const isExerciseTimeBased = (code: string): boolean => {
  const timeBasedExercises = ['plank', 'wall_sit', 'dead_hang', 'bridge_hold']
  return timeBasedExercises.includes(code)
}

// ====================================
// COMPONENTS
// ====================================
const DuelCard = ({ 
  duel, 
  currentUserId,
  onAccept,
  onView 
}: { 
  duel: Duel
  currentUserId: string
  onAccept: (duelId: string) => void
  onView: (duelId: string) => void
}) => {
  const isMyDuel = duel.challenger_id === currentUserId || duel.challenged_id === currentUserId
  const isChallenger = duel.challenger_id === currentUserId
  const canAccept = duel.status === 'open' && !isMyDuel
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-green-400 bg-green-500/10'
      case 'pending': return 'text-yellow-400 bg-yellow-500/10'
      case 'active': return 'text-blue-400 bg-blue-500/10'
      case 'completed': return 'text-purple-400 bg-purple-500/10'
      default: return 'text-gray-400 bg-gray-500/10'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'hard': return 'text-orange-400'
      case 'extreme': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getExerciseName = () => {
    return duel.exercise?.name || 'Esercizio'
  }

  const getChallengerName = () => {
    if (duel.challenger?.display_name) return duel.challenger.display_name
    if (duel.challenger?.username) return duel.challenger.username
    return 'Sfidante'
  }

  const getChallengedName = () => {
    if (duel.challenged?.display_name) return duel.challenged.display_name
    if (duel.challenged?.username) return duel.challenged.username
    return null
  }

  // Check if exercise is time-based
  const isTimeBased = duel.exercise?.code ? isExerciseTimeBased(duel.exercise.code) : 
                      (duel.metadata?.targetTime !== undefined && duel.metadata?.targetTime !== null)

  const formatTarget = () => {
    if (isTimeBased && duel.metadata?.targetTime) {
      return `${duel.metadata.targetTime}s`
    }
    return duel.metadata?.targetReps || '-'
  }

  return (
    <Card variant="glass" className="p-4 hover:bg-gray-800/30 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            {duel.exercise?.icon ? (
              <span className="text-xl">{duel.exercise.icon}</span>
            ) : (
              <Swords className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <p className="font-medium text-white">{getExerciseName()}</p>
            <p className="text-sm text-gray-400">
              {isMyDuel ? (
                isChallenger ? 'Creata da te' : `vs ${getChallengerName()}`
              ) : (
                `Creata da ${getChallengerName()}`
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={cn('text-xs px-2 py-1 rounded-full', getStatusColor(duel.status))}>
            {duel.status === 'open' ? 'Aperta' : 
             duel.status === 'pending' ? 'In attesa' :
             duel.status === 'active' ? 'In corso' :
             duel.status === 'completed' ? 'Completata' : duel.status}
          </span>
          <span className={cn('text-xs', getDifficultyColor(duel.difficulty))}>
            {duel.difficulty === 'easy' ? 'Facile' :
             duel.difficulty === 'medium' ? 'Media' :
             duel.difficulty === 'hard' ? 'Difficile' :
             duel.difficulty === 'extreme' ? 'Estrema' : duel.difficulty}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div>
          <p className="text-2xl font-bold text-white flex items-center justify-center gap-1">
            {isTimeBased && <Clock className="w-4 h-4 text-gray-400" />}
            {formatTarget()}
          </p>
          <p className="text-xs text-gray-400">
            {isTimeBased ? 'Tempo' : 'Ripetizioni'}
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold text-yellow-500">+{duel.xp_reward}</p>
          <p className="text-xs text-gray-400">XP Premio</p>
        </div>
        <div>
          <p className="text-lg font-bold text-indigo-400">{duel.wager_coins}</p>
          <p className="text-xs text-gray-400">Coins</p>
        </div>
      </div>

      <div className="flex gap-2">
        {canAccept ? (
          <Button 
            variant="gradient" 
            size="sm" 
            className="flex-1"
            onClick={() => onAccept(duel.id)}
          >
            Accetta Sfida
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex-1"
            onClick={() => onView(duel.id)}
          >
            {duel.status === 'active' ? 'Continua' : 'Visualizza'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </Card>
  )
}

const CreateDuelModal = ({ 
  isOpen, 
  onClose, 
  exercises,
  onCreate 
}: { 
  isOpen: boolean
  onClose: () => void
  exercises: Exercise[]
  onCreate: (duelData: any) => void
}) => {
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'extreme'>('medium')
  const [targetValue, setTargetValue] = useState<number>(20)
  const [wagerCoins, setWagerCoins] = useState<number>(50)
  const [xpReward, setXpReward] = useState<number>(100)
  const [duelType, setDuelType] = useState<'1v1' | 'open'>('open')

  // Get exercise data to check if time-based
  const selectedExerciseData = selectedExercise ? 
    exercises.find(e => e.id === selectedExercise) : null
  
  const isTimeBased = selectedExerciseData ? 
    isExerciseTimeBased(selectedExerciseData.code) : false

  // Update target value when exercise or difficulty changes
  useEffect(() => {
    if (selectedExerciseData && difficulty) {
      // Default targets based on difficulty
      const defaultTargets = {
        easy: isTimeBased ? 30 : 10,
        medium: isTimeBased ? 60 : 20,
        hard: isTimeBased ? 90 : 30,
        extreme: isTimeBased ? 120 : 50
      }
      setTargetValue(defaultTargets[difficulty])
    }
  }, [selectedExercise, difficulty, isTimeBased])

  const handleCreate = () => {
    if (!selectedExercise) return

    onCreate({
      exerciseId: selectedExercise, // CORRECT: using exerciseId
      type: duelType,
      difficulty,
      targetReps: isTimeBased ? null : targetValue,
      targetTime: isTimeBased ? targetValue : null,
      wagerCoins, // CORRECT: using coins
      xpReward,
      timeLimit: 72 // hours
    })

    // Reset form
    setSelectedExercise('')
    setDifficulty('medium')
    setTargetValue(20)
    setWagerCoins(50)
    setXpReward(100)
    setDuelType('open')
    onClose()
  }

  const getTargetRange = () => {
    if (isTimeBased) {
      // Time in seconds
      return { min: 10, max: 300, step: 5 }
    } else {
      // Repetitions
      return { min: 5, max: 100, step: 5 }
    }
  }

  const formatTargetDisplay = (value: number) => {
    if (isTimeBased) {
      const minutes = Math.floor(value / 60)
      const seconds = value % 60
      if (minutes > 0) {
        return `${minutes}m ${seconds}s`
      }
      return `${seconds} secondi`
    }
    return `${value} ripetizioni`
  }

  if (!isOpen) return null

  const range = getTargetRange()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crea Nuova Sfida" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Esercizio</label>
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Seleziona un esercizio</option>
            {exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name} {exercise.icon || ''} {isExerciseTimeBased(exercise.code) ? '⏱️' : '🔢'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Tipo di Sfida</label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={duelType === 'open' ? 'gradient' : 'secondary'}
              size="sm"
              onClick={() => setDuelType('open')}
            >
              Sfida Aperta
            </Button>
            <Button
              variant={duelType === '1v1' ? 'gradient' : 'secondary'}
              size="sm"
              onClick={() => setDuelType('1v1')}
            >
              1 vs 1
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Difficoltà</label>
          <div className="grid grid-cols-4 gap-2">
            {(['easy', 'medium', 'hard', 'extreme'] as const).map((level) => (
              <Button
                key={level}
                variant={difficulty === level ? 'gradient' : 'secondary'}
                size="sm"
                onClick={() => setDifficulty(level)}
              >
                {level === 'easy' ? 'Facile' :
                 level === 'medium' ? 'Media' :
                 level === 'hard' ? 'Difficile' : 'Estrema'}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <div className="flex items-center gap-2">
              {isTimeBased ? (
                <>
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Tempo Target: {formatTargetDisplay(targetValue)}
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 text-indigo-400" />
                  Ripetizioni Target: {targetValue}
                </>
              )}
            </div>
          </label>
          <input
            type="range"
            min={range.min}
            max={range.max}
            step={range.step}
            value={targetValue}
            onChange={(e) => setTargetValue(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTargetDisplay(range.min)}</span>
            <span>{formatTargetDisplay(range.max)}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🪙 Coins Puntata: {wagerCoins}
          </label>
          <input
            type="range"
            min="10"
            max="500"
            step="10"
            value={wagerCoins}
            onChange={(e) => setWagerCoins(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            ⚡ XP Premio: {xpReward}
          </label>
          <input
            type="range"
            min="50"
            max="1000"
            step="50"
            value={xpReward}
            onChange={(e) => setXpReward(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {isTimeBased && selectedExerciseData && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-300">
                <p className="font-medium mb-1">Sfida Isometrica</p>
                <p>Vince chi raggiunge il tempo target mantenendo la forma corretta. Se nessuno raggiunge il target, vince chi resiste più a lungo.</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Annulla
          </Button>
          <Button 
            variant="gradient" 
            onClick={handleCreate} 
            className="flex-1"
            disabled={!selectedExercise}
          >
            Crea Sfida
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ====================================
// MAIN COMPONENT
// ====================================
export default function ChallengesPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [duels, setDuels] = useState<Duel[]>([])
  const [filteredDuels, setFilteredDuels] = useState<Duel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [selectedTab, setSelectedTab] = useState<'available' | 'my-duels' | 'history'>('available')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterExercise, setFilterExercise] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  // Filter duels when filters change
  useEffect(() => {
    filterDuels()
  }, [duels, selectedTab, searchQuery, filterExercise, filterDifficulty])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setCurrentUser(user)

      // Load exercises
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (exercisesError) {
        console.error('Error loading exercises:', exercisesError)
        setError('Errore nel caricamento degli esercizi')
      } else {
        setExercises(exercisesData || [])
      }

      // Load duels with proper joins
      const { data: duelsData, error: duelsError } = await supabase
        .from('duels')
        .select(`
          *,
          challenger:profiles!challenger_id(
            id,
            username,
            display_name,
            avatar_url,
            level,
            xp,
            coins
          ),
          challenged:profiles!challenged_id(
            id,
            username,
            display_name,
            avatar_url,
            level,
            xp,
            coins
          ),
          exercise:exercises!exercise_id(
            id,
            name,
            code,
            category,
            icon
          )
        `)
        .order('created_at', { ascending: false })

      if (duelsError) {
        console.error('Error loading duels:', duelsError)
        setError('Errore nel caricamento delle sfide')
      } else {
        setDuels(duelsData || [])
      }
    } catch (err: any) {
      console.error('Error loading data:', err)
      setError('Errore nel caricamento dei dati')
    } finally {
      setLoading(false)
    }
  }

  const filterDuels = () => {
    let filtered = [...duels]

    // Filter by tab
    if (selectedTab === 'available') {
      filtered = filtered.filter(d => 
        d.status === 'open' && 
        d.challenger_id !== currentUser?.id
      )
    } else if (selectedTab === 'my-duels') {
      filtered = filtered.filter(d => 
        (d.challenger_id === currentUser?.id || d.challenged_id === currentUser?.id) &&
        ['pending', 'open', 'active'].includes(d.status)
      )
    } else if (selectedTab === 'history') {
      filtered = filtered.filter(d => 
        (d.challenger_id === currentUser?.id || d.challenged_id === currentUser?.id) &&
        ['completed', 'expired', 'cancelled'].includes(d.status)
      )
    }

    // Filter by exercise
    if (filterExercise !== 'all') {
      filtered = filtered.filter(d => d.exercise_id === filterExercise)
    }

    // Filter by difficulty
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(d => d.difficulty === filterDifficulty)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(d => 
        d.exercise?.name?.toLowerCase().includes(query) ||
        d.challenger?.username?.toLowerCase().includes(query) ||
        d.challenged?.username?.toLowerCase().includes(query)
      )
    }

    setFilteredDuels(filtered)
  }

  const handleCreateDuel = async (duelData: any) => {
    try {
      setError(null)
      
      // Call the API route to create duel
      const response = await fetch('/api/duels/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengerId: currentUser.id,
          challengedId: duelData.type === '1v1' ? duelData.challengedId : undefined,
          exerciseId: duelData.exerciseId,
          duelType: duelData.type,
          wagerCoins: duelData.wagerCoins,
          xpReward: duelData.xpReward,
          difficulty: duelData.difficulty,
          targetReps: duelData.targetReps,
          targetTime: duelData.targetTime,
          timeLimit: duelData.timeLimit
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Errore nella creazione della sfida')
      }

      setSuccess('Sfida creata con successo!')
      loadData() // Reload duels
    } catch (err: any) {
      console.error('Error creating duel:', err)
      setError(err.message || 'Errore nella creazione della sfida')
    }
  }

  const handleAcceptDuel = async (duelId: string) => {
    try {
      setError(null)
      
      const response = await fetch('/api/duels/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duelId: duelId,
          userId: currentUser.id
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Errore nell\'accettare la sfida')
      }

      setSuccess('Sfida accettata!')
      loadData() // Reload duels to update the status
      router.push(`/duel/${duelId}`)
    } catch (err: any) {
      console.error('Error accepting duel:', err)
      setError(err.message || 'Errore nell\'accettare la sfida')
    }
  }

  const handleViewDuel = (duelId: string) => {
    router.push(`/duel/${duelId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Caricamento sfide...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Swords className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Sfide</h1>
                  <p className="text-sm text-gray-400">Trova e crea duelli</p>
                </div>
              </div>
            </div>

            <Button variant="gradient" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Crea Sfida
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2"
          >
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-2"
          >
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
            <p className="text-sm text-green-400">{success}</p>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={selectedTab === 'available' ? 'gradient' : 'secondary'}
            onClick={() => setSelectedTab('available')}
          >
            Disponibili ({duels.filter(d => d.status === 'open' && d.challenger_id !== currentUser?.id).length})
          </Button>
          <Button
            variant={selectedTab === 'my-duels' ? 'gradient' : 'secondary'}
            onClick={() => setSelectedTab('my-duels')}
          >
            Le Mie Sfide ({duels.filter(d => 
              (d.challenger_id === currentUser?.id || d.challenged_id === currentUser?.id) &&
              ['pending', 'open', 'active'].includes(d.status)
            ).length})
          </Button>
          <Button
            variant={selectedTab === 'history' ? 'gradient' : 'secondary'}
            onClick={() => setSelectedTab('history')}
          >
            Storico
          </Button>
        </div>

        {/* Filters */}
        <Card variant="glass" className="p-4 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca sfide..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <select
              value={filterExercise}
              onChange={(e) => setFilterExercise(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">Tutti gli esercizi</option>
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name} {exercise.icon || ''} {isExerciseTimeBased(exercise.code) ? '⏱️' : ''}
                </option>
              ))}
            </select>

            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">Tutte le difficoltà</option>
              <option value="easy">Facile</option>
              <option value="medium">Media</option>
              <option value="hard">Difficile</option>
              <option value="extreme">Estrema</option>
            </select>
          </div>
        </Card>

        {/* Duels Grid */}
        {filteredDuels.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDuels.map((duel, index) => (
              <motion.div
                key={duel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <DuelCard
                  duel={duel}
                  currentUserId={currentUser?.id || ''}
                  onAccept={handleAcceptDuel}
                  onView={handleViewDuel}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <Card variant="glass" className="p-12 text-center">
            <Swords className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nessuna sfida trovata</h3>
            <p className="text-gray-400 mb-6">
              {selectedTab === 'available' ? 'Non ci sono sfide disponibili al momento.' :
               selectedTab === 'my-duels' ? 'Non hai sfide attive.' :
               'Non hai ancora completato nessuna sfida.'}
            </p>
            {selectedTab === 'available' && (
              <Button variant="gradient" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Crea la Prima Sfida
              </Button>
            )}
          </Card>
        )}
      </main>

      {/* Create Duel Modal */}
      <CreateDuelModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        exercises={exercises}
        onCreate={handleCreateDuel}
      />
    </div>
  )
}