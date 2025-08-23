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
  Info, Loader2, User, Play
} from 'lucide-react'

// ====================================
// SIMPLE UI COMPONENTS
// ====================================

const Card = ({ className, children, ...props }: any) => (
  <div 
    className={`rounded-lg border border-gray-800 bg-gray-900/50 backdrop-blur-sm ${className}`} 
    {...props}
  >
    {children}
  </div>
)

const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  disabled,
  onClick,
  ...props 
}: {
  variant?: 'primary' | 'secondary' | 'gradient' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: React.ReactNode
  disabled?: boolean
  onClick?: () => void
  [key: string]: any
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all'
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700',
    gradient: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white',
    ghost: 'hover:bg-gray-800 text-gray-400 hover:text-white'
  }
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  }
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

const Modal = ({ isOpen, onClose, title, size = 'md', children }: any) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className={`relative bg-gray-900 rounded-xl border border-gray-700 p-6 max-h-[90vh] overflow-y-auto ${
        size === 'sm' ? 'w-full max-w-sm' :
        size === 'lg' ? 'w-full max-w-4xl' :
        'w-full max-w-md'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ====================================
// MOCK DATA
// ====================================

const MOCK_EXERCISES = [
  { id: '1', name: 'Push-ups', code: 'pushups', icon: '💪', category: 'upper_body' },
  { id: '2', name: 'Squats', code: 'squats', icon: '🦵', category: 'lower_body' },
  { id: '3', name: 'Plank', code: 'plank', icon: '⏱️', category: 'core' },
  { id: '4', name: 'Burpees', code: 'burpees', icon: '🔥', category: 'full_body' },
  { id: '5', name: 'Jumping Jacks', code: 'jumping_jacks', icon: '⚡', category: 'cardio' },
  { id: '6', name: 'Lunges', code: 'lunges', icon: '🚀', category: 'lower_body' }
]

const MOCK_DUELS = [
  {
    id: '1',
    type: 'open',
    status: 'open',
    challenger_id: 'user1',
    challenger: { username: 'FitWarrior', display_name: 'Fit Warrior' },
    challenged_id: null,
    exercise_id: '1',
    exercise: { name: 'Push-ups', icon: '💪', code: 'pushups' },
    difficulty: 'medium',
    wager_coins: 100,
    xp_reward: 200,
    metadata: { targetReps: 30 },
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    type: 'open',
    status: 'open',
    challenger_id: 'user2',
    challenger: { username: 'SquatMaster', display_name: 'Squat Master' },
    challenged_id: null,
    exercise_id: '2',
    exercise: { name: 'Squats', icon: '🦵', code: 'squats' },
    difficulty: 'hard',
    wager_coins: 200,
    xp_reward: 400,
    metadata: { targetReps: 50 },
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    type: 'open',
    status: 'open',
    challenger_id: 'user3',
    challenger: { username: 'PlankPro', display_name: 'Plank Pro' },
    challenged_id: null,
    exercise_id: '3',
    exercise: { name: 'Plank', icon: '⏱️', code: 'plank' },
    difficulty: 'easy',
    wager_coins: 50,
    xp_reward: 100,
    metadata: { targetTime: 60 },
    created_at: new Date().toISOString()
  },
  {
    id: '4',
    type: 'open',
    status: 'completed',
    challenger_id: 'current_user',
    challenger: { username: 'Tu', display_name: 'Tu' },
    challenged_id: 'user4',
    exercise_id: '4',
    exercise: { name: 'Burpees', icon: '🔥', code: 'burpees' },
    difficulty: 'extreme',
    wager_coins: 300,
    xp_reward: 600,
    metadata: { targetReps: 25 },
    winner_id: 'current_user',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
]

// ====================================
// HELPER FUNCTIONS
// ====================================

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
}: any) => {
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

  const getChallengerName = () => {
    if (duel.challenger?.display_name) return duel.challenger.display_name
    if (duel.challenger?.username) return duel.challenger.username
    return 'Sfidante'
  }

  const isTimeBased = isExerciseTimeBased(duel.exercise?.code || '')

  const formatTarget = () => {
    if (isTimeBased && duel.metadata?.targetTime) {
      return `${duel.metadata.targetTime}s`
    }
    return duel.metadata?.targetReps || '-'
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Aperta'
      case 'pending': return 'In attesa'
      case 'active': return 'In corso'
      case 'completed': return 'Completata'
      default: return status
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Facile'
      case 'medium': return 'Media'
      case 'hard': return 'Difficile'
      case 'extreme': return 'Estrema'
      default: return difficulty
    }
  }

  return (
    <Card className="p-4 hover:bg-gray-800/30 transition-all">
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
            <p className="font-medium text-white">{duel.exercise?.name || 'Esercizio'}</p>
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
          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(duel.status)}`}>
            {getStatusText(duel.status)}
          </span>
          <span className={`text-xs ${getDifficultyColor(duel.difficulty)}`}>
            {getDifficultyText(duel.difficulty)}
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
}: any) => {
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'extreme'>('medium')
  const [targetValue, setTargetValue] = useState<number>(20)
  const [wagerCoins, setWagerCoins] = useState<number>(50)
  const [xpReward, setXpReward] = useState<number>(100)
  const [duelType, setDuelType] = useState<'1v1' | 'open'>('open')

  const selectedExerciseData = selectedExercise ? 
    exercises.find((e: any) => e.id === selectedExercise) : null
  
  const isTimeBased = selectedExerciseData ? 
    isExerciseTimeBased(selectedExerciseData.code) : false

  useEffect(() => {
    if (selectedExerciseData && difficulty) {
      const defaultTargets = {
        easy: isTimeBased ? 30 : 10,
        medium: isTimeBased ? 60 : 20,
        hard: isTimeBased ? 90 : 30,
        extreme: isTimeBased ? 120 : 50
      }
      setTargetValue(defaultTargets[difficulty])
    }
  }, [selectedExercise, difficulty, isTimeBased, selectedExerciseData])

  const handleCreate = () => {
    if (!selectedExercise) return

    onCreate({
      exerciseId: selectedExercise,
      type: duelType,
      difficulty,
      targetReps: isTimeBased ? null : targetValue,
      targetTime: isTimeBased ? targetValue : null,
      wagerCoins,
      xpReward,
      timeLimit: 72
    })

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
      return { min: 10, max: 300, step: 5 }
    } else {
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
            {exercises.map((exercise: any) => (
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
              disabled
            >
              1 vs 1 (Soon)
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
                <p>Vince chi raggiunge il tempo target mantenendo la forma corretta.</p>
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
  
  const [currentUser] = useState({ id: 'current_user', username: 'Tu' })
  const [exercises] = useState(MOCK_EXERCISES)
  const [duels] = useState(MOCK_DUELS)
  const [filteredDuels, setFilteredDuels] = useState(MOCK_DUELS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [selectedTab, setSelectedTab] = useState<'available' | 'my-duels' | 'history'>('available')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterExercise, setFilterExercise] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Filter duels when filters change
  useEffect(() => {
    filterDuels()
  }, [selectedTab, searchQuery, filterExercise, filterDifficulty])

  // Auto-hide messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const filterDuels = () => {
    let filtered = [...duels]

    // Filter by tab
    if (selectedTab === 'available') {
      filtered = filtered.filter(d => 
        d.status === 'open' && 
        d.challenger_id !== currentUser.id
      )
    } else if (selectedTab === 'my-duels') {
      filtered = filtered.filter(d => 
        (d.challenger_id === currentUser.id || d.challenged_id === currentUser.id) &&
        ['pending', 'open', 'active'].includes(d.status)
      )
    } else if (selectedTab === 'history') {
      filtered = filtered.filter(d => 
        (d.challenger_id === currentUser.id || d.challenged_id === currentUser.id) &&
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
      
      // Simulate API call
      const newDuel = {
        id: Date.now().toString(),
        type: duelData.type,
        status: 'open',
        challenger_id: currentUser.id,
        challenger: currentUser,
        challenged_id: null,
        exercise_id: duelData.exerciseId,
        exercise: exercises.find(e => e.id === duelData.exerciseId),
        difficulty: duelData.difficulty,
        wager_coins: duelData.wagerCoins,
        xp_reward: duelData.xpReward,
        metadata: {
          targetReps: duelData.targetReps,
          targetTime: duelData.targetTime
        },
        created_at: new Date().toISOString()
      }

      // Add to duels (in real app this would be via API)
      duels.unshift(newDuel as any)
      setSuccess('Sfida creata con successo!')
      filterDuels()
    } catch (err: any) {
      console.error('Error creating duel:', err)
      setError(err.message || 'Errore nella creazione della sfida')
    }
  }

  const handleAcceptDuel = async (duelId: string) => {
    try {
      setError(null)
      setSuccess('Sfida accettata!')
      
      // In real app, this would update the duel and redirect
      setTimeout(() => {
        router.push(`/duel/${duelId}`)
      }, 1000)
    } catch (err: any) {
      console.error('Error accepting duel:', err)
      setError(err.message || 'Errore nell\'accettare la sfida')
    }
  }

  const handleViewDuel = (duelId: string) => {
    router.push(`/duel/${duelId}`)
  }

  const availableCount = duels.filter(d => d.status === 'open' && d.challenger_id !== currentUser.id).length
  const myDuelsCount = duels.filter(d => 
    (d.challenger_id === currentUser.id || d.challenged_id === currentUser.id) &&
    ['pending', 'open', 'active'].includes(d.status)
  ).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
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

            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={filterDuels}
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
              <Button variant="gradient" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Crea Sfida
              </Button>
            </div>
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

        {/* Demo Info */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
        >
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm text-blue-400 font-medium">Modalità Demo</p>
              <p className="text-xs text-blue-300 mt-1">
                Stai visualizzando dati di esempio. In produzione, questi sarebbero collegati al database Supabase.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={selectedTab === 'available' ? 'gradient' : 'secondary'}
            onClick={() => setSelectedTab('available')}
          >
            Disponibili ({availableCount})
          </Button>
          <Button
            variant={selectedTab === 'my-duels' ? 'gradient' : 'secondary'}
            onClick={() => setSelectedTab('my-duels')}
          >
            Le Mie Sfide ({myDuelsCount})
          </Button>
          <Button
            variant={selectedTab === 'history' ? 'gradient' : 'secondary'}
            onClick={() => setSelectedTab('history')}
          >
            Storico
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
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
                  currentUserId={currentUser.id}
                  onAccept={handleAcceptDuel}
                  onView={handleViewDuel}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
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