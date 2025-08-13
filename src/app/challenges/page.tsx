'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Swords, Trophy, Zap, Users, Target, Timer, Shield,
  Plus, Search, Filter, ChevronRight, Flame, Crown,
  Star, Medal, Activity, TrendingUp, Calendar, Bell,
  ArrowLeft, RefreshCw, AlertCircle, CheckCircle
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ====================================
// TYPES
// ====================================
interface Exercise {
  id: string
  name: string
  code: string
  category: string
  difficulty: string
}

interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  email: string
}

interface Duel {
  id: string
  type: '1v1' | 'open' | 'tournament' | 'mission'
  status: 'pending' | 'open' | 'active' | 'completed' | 'expired' | 'cancelled'
  challenger_id: string
  challenger?: Profile
  challenged_id: string | null
  challenged?: Profile
  exercise_id: string
  exercise?: Exercise
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  wager_xp: number
  reward_xp: number
  target_reps: number | null
  target_time: number | null
  target_form_score: number | null
  rules: any
  max_participants: number
  current_participants: number
  starts_at: string | null
  expires_at: string | null
  completed_at: string | null
  winner_id: string | null
  is_draw: boolean
  created_at: string
  updated_at: string
}

// Mock exercises for fallback
const MOCK_EXERCISES = [
  { id: '1', name: 'Push-Up', code: 'push_up', category: 'strength', difficulty: 'medium' },
  { id: '2', name: 'Squat', code: 'squat', category: 'strength', difficulty: 'easy' },
  { id: '3', name: 'Plank', code: 'plank', category: 'core', difficulty: 'medium' },
  { id: '4', name: 'Burpee', code: 'burpee', category: 'cardio', difficulty: 'hard' },
  { id: '5', name: 'Mountain Climber', code: 'mountain_climber', category: 'cardio', difficulty: 'hard' },
  { id: '6', name: 'Jumping Jack', code: 'jumping_jack', category: 'cardio', difficulty: 'easy' }
]

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
    if (duel.exercise?.name) return duel.exercise.name
    // Fallback to mock data if exercise not loaded
    const mockExercise = MOCK_EXERCISES.find(e => e.id === duel.exercise_id)
    return mockExercise?.name || 'Esercizio'
  }

  const getChallengerName = () => {
    if (duel.challenger?.username) return duel.challenger.username
    if (duel.challenger?.display_name) return duel.challenger.display_name
    return 'Sfidante'
  }

  return (
    <Card variant="glass" className="p-4 hover:bg-gray-800/30 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Swords className="w-5 h-5 text-white" />
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
          <p className="text-2xl font-bold text-white">{duel.target_reps || '-'}</p>
          <p className="text-xs text-gray-400">Ripetizioni</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-yellow-500">+{duel.reward_xp}</p>
          <p className="text-xs text-gray-400">XP Premio</p>
        </div>
        <div>
          <p className="text-lg font-bold text-indigo-400">{duel.wager_xp}</p>
          <p className="text-xs text-gray-400">XP Puntata</p>
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
  const [difficulty, setDifficulty] = useState<string>('medium')
  const [targetReps, setTargetReps] = useState<number>(20)
  const [wagerXP, setWagerXP] = useState<number>(50)
  const [duelType, setDuelType] = useState<'1v1' | 'open'>('open')

  const handleCreate = () => {
    if (!selectedExercise) return

    onCreate({
      exercise_id: selectedExercise,
      type: duelType,
      difficulty,
      target_reps: targetReps,
      wager_xp: wagerXP,
      reward_xp: wagerXP * 2,
      max_participants: 2,
      expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() // 72 hours
    })

    // Reset form
    setSelectedExercise('')
    setDifficulty('medium')
    setTargetReps(20)
    setWagerXP(50)
    setDuelType('open')
    onClose()
  }

  if (!isOpen) return null

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
                {exercise.name}
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
            {['easy', 'medium', 'hard', 'extreme'].map((level) => (
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
            Ripetizioni Target: {targetReps}
          </label>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={targetReps}
            onChange={(e) => setTargetReps(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            XP Puntata: {wagerXP} (Premio: {wagerXP * 2} XP)
          </label>
          <input
            type="range"
            min="10"
            max="200"
            step="10"
            value={wagerXP}
            onChange={(e) => setWagerXP(Number(e.target.value))}
            className="w-full"
          />
        </div>

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
        .order('name')

      if (exercisesError) {
        console.error('Error loading exercises:', exercisesError)
        // Use mock exercises as fallback
        setExercises(MOCK_EXERCISES)
      } else {
        setExercises(exercisesData || MOCK_EXERCISES)
      }

      // Load duels with proper joins
      const { data: duelsData, error: duelsError } = await supabase
        .from('duels')
        .select(`
          *,
          exercises (
            id,
            name,
            code,
            category
          )
        `)
        .order('created_at', { ascending: false })

      if (duelsError) {
        console.error('Error loading duels:', duelsError)
        setError('Errore nel caricamento delle sfide')
      } else {
        // Transform the data to match our interface
        const transformedDuels = (duelsData || []).map(duel => ({
          ...duel,
          exercise: duel.exercises
        }))
        
        // Load challenger and challenged profiles separately
        const profileIds = new Set<string>()
        transformedDuels.forEach(duel => {
          if (duel.challenger_id) profileIds.add(duel.challenger_id)
          if (duel.challenged_id) profileIds.add(duel.challenged_id)
        })

        if (profileIds.size > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .in('id', Array.from(profileIds))

          const profilesMap = new Map(
            (profilesData || []).map(profile => [profile.id, profile])
          )

          transformedDuels.forEach(duel => {
            if (duel.challenger_id) {
              duel.challenger = profilesMap.get(duel.challenger_id)
            }
            if (duel.challenged_id) {
              duel.challenged = profilesMap.get(duel.challenged_id)
            }
          })
        }

        setDuels(transformedDuels)
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
      
      const { data, error } = await supabase
        .from('duels')
        .insert({
          ...duelData,
          challenger_id: currentUser.id,
          status: 'open',
          current_participants: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      setSuccess('Sfida creata con successo!')
      loadData() // Reload duels
    } catch (err: any) {
      console.error('Error creating duel:', err)
      setError('Errore nella creazione della sfida')
    }
  }

  const handleAcceptDuel = async (duelId: string) => {
    try {
      setError(null)
      
      const { error } = await supabase
        .from('duels')
        .update({
          challenged_id: currentUser.id,
          status: 'active',
          current_participants: 2,
          starts_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', duelId)

      if (error) throw error

      setSuccess('Sfida accettata!')
      router.push(`/duel/${duelId}`)
    } catch (err: any) {
      console.error('Error accepting duel:', err)
      setError('Errore nell\'accettare la sfida')
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
                  {exercise.name}
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