'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Swords, Trophy, Clock, Users, Zap, Filter,
  Plus, Search, TrendingUp, Flame, Target,
  ChevronRight, Calendar, Medal, Star, Crown,
  Activity, Timer, AlertCircle, CheckCircle, XCircle,
  Loader2, RefreshCw
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/hooks/useAuth'

// Types
interface Challenge {
  id: string
  type: 'duel' | 'open' | 'tournament' | 'mission'
  exercise: string
  challenger_id: string
  opponent_id?: string
  status: 'pending' | 'active' | 'completed' | 'open'
  xp_reward: number
  wager_coins: number
  max_participants?: number
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  time_limit_hours: number
  created_at: string
  expires_at: string
  challenger?: {
    username: string
    level: number
    avatar_url?: string
  }
  opponent?: {
    username: string
    level: number
    avatar_url?: string
  }
  participants_count?: number
  my_score?: number
  opponent_score?: number
}

interface CreateChallengeData {
  type: 'duel' | 'open'
  exercise: string
  xp_reward: number
  wager_coins: number
  time_limit_hours: number
  max_participants?: number
}

const difficultyColors = {
  easy: 'text-green-500 bg-green-500/10 border-green-500/20',
  medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  hard: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  extreme: 'text-red-500 bg-red-500/10 border-red-500/20'
}

const typeIcons = {
  duel: Swords,
  open: Users,
  tournament: Trophy,
  mission: Target
}

const typeLabels = {
  duel: 'Duello 1v1',
  open: 'Sfida Aperta',
  tournament: 'Torneo',
  mission: 'Missione'
}

const exerciseOptions = [
  { value: 'push_up', label: 'Push-Up', difficulty: 'medium' },
  { value: 'squat', label: 'Squat', difficulty: 'easy' },
  { value: 'plank', label: 'Plank', difficulty: 'medium' },
  { value: 'burpee', label: 'Burpee', difficulty: 'hard' },
  { value: 'jumping_jack', label: 'Jumping Jack', difficulty: 'easy' },
  { value: 'mountain_climber', label: 'Mountain Climber', difficulty: 'hard' },
  { value: 'lunge', label: 'Lunge', difficulty: 'medium' },
  { value: 'high_knees', label: 'High Knees', difficulty: 'easy' }
]

export default function ChallengesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()

  // State
  const [selectedTab, setSelectedTab] = useState<'available' | 'active' | 'history'>('available')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'duel' | 'open' | 'tournament' | 'mission'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  // Data state
  const [availableChallenges, setAvailableChallenges] = useState<Challenge[]>([])
  const [myChallenges, setMyChallenges] = useState<Challenge[]>([])
  const [challengeHistory, setChallengeHistory] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Create form state
  const [createForm, setCreateForm] = useState<CreateChallengeData>({
    type: 'duel',
    exercise: 'push_up',
    xp_reward: 100,
    wager_coins: 50,
    time_limit_hours: 24,
    max_participants: 2
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Load data
  useEffect(() => {
    if (user) {
      loadAllData()
    }
  }, [user])

  const loadAllData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      await Promise.all([
        loadAvailableChallenges(),
        loadMyChallenges(),
        loadChallengeHistory()
      ])
    } catch (err: any) {
      console.error('Error loading challenges:', err)
      setError(err.message || 'Errore nel caricamento delle sfide')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('duels')
        .select(`
          *,
          challenger:profiles!duels_challenger_id_fkey(username, level, avatar_url),
          opponent:profiles!duels_opponent_id_fkey(username, level, avatar_url)
        `)
        .in('status', ['pending', 'open'])
        .neq('challenger_id', user?.id)
        .is('opponent_id', null)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setAvailableChallenges(data || [])
    } catch (err: any) {
      console.error('Error loading available challenges:', err)
      throw err
    }
  }

  const loadMyChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('duels')
        .select(`
          *,
          challenger:profiles!duels_challenger_id_fkey(username, level, avatar_url),
          opponent:profiles!duels_opponent_id_fkey(username, level, avatar_url)
        `)
        .or(`challenger_id.eq.${user?.id},opponent_id.eq.${user?.id}`)
        .in('status', ['pending', 'active'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setMyChallenges(data || [])
    } catch (err: any) {
      console.error('Error loading my challenges:', err)
      throw err
    }
  }

  const loadChallengeHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('duels')
        .select(`
          *,
          challenger:profiles!duels_challenger_id_fkey(username, level, avatar_url),
          opponent:profiles!duels_opponent_id_fkey(username, level, avatar_url)
        `)
        .or(`challenger_id.eq.${user?.id},opponent_id.eq.${user?.id}`)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setChallengeHistory(data || [])
    } catch (err: any) {
      console.error('Error loading challenge history:', err)
      throw err
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAllData()
    setRefreshing(false)
  }

  const createChallenge = async () => {
    if (!user) return
    
    setCreating(true)
    setError(null)

    try {
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + createForm.time_limit_hours)

      const selectedExercise = exerciseOptions.find(ex => ex.value === createForm.exercise)
      
      const { data, error } = await supabase
        .from('duels')
        .insert({
          challenger_id: user.id,
          type: createForm.type,
          exercise: createForm.exercise,
          status: createForm.type === 'duel' ? 'pending' : 'open',
          xp_reward: createForm.xp_reward,
          wager_coins: createForm.wager_coins,
          time_limit_hours: createForm.time_limit_hours,
          max_participants: createForm.max_participants,
          difficulty: selectedExercise?.difficulty || 'medium',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Refresh data
      await loadAllData()
      
      setShowCreateModal(false)
      setCreateForm({
        type: 'duel',
        exercise: 'push_up',
        xp_reward: 100,
        wager_coins: 50,
        time_limit_hours: 24,
        max_participants: 2
      })

    } catch (err: any) {
      console.error('Error creating challenge:', err)
      setError(err.message || 'Errore nella creazione della sfida')
    } finally {
      setCreating(false)
    }
  }

  const acceptChallenge = async (challengeId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('duels')
        .update({ 
          opponent_id: user.id,
          status: 'active'
        })
        .eq('id', challengeId)

      if (error) throw error

      // Refresh data
      await loadAllData()
      
    } catch (err: any) {
      console.error('Error accepting challenge:', err)
      setError(err.message || 'Errore nell\'accettare la sfida')
    }
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return 'Scaduta'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}g ${hours % 24}h`
    }
    
    return `${hours}h ${minutes}m`
  }

  const getMyScoreForChallenge = (challenge: Challenge) => {
    if (challenge.challenger_id === user?.id) {
      return challenge.my_score || 0
    } else {
      return challenge.opponent_score || 0
    }
  }

  const getOpponentScoreForChallenge = (challenge: Challenge) => {
    if (challenge.challenger_id === user?.id) {
      return challenge.opponent_score || 0
    } else {
      return challenge.my_score || 0
    }
  }

  const didIWin = (challenge: Challenge) => {
    const myScore = getMyScoreForChallenge(challenge)
    const opponentScore = getOpponentScoreForChallenge(challenge)
    return myScore > opponentScore
  }

  // Filter challenges
  const filteredAvailableChallenges = availableChallenges.filter(challenge => {
    if (selectedFilter !== 'all' && challenge.type !== selectedFilter) return false
    if (searchQuery && !challenge.exercise.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const activeChallenges = myChallenges.filter(c => c.status !== 'completed')
  const completedChallenges = challengeHistory

  if (authLoading || loading) {
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
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">FitDuel</span>
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-600" />
              <span className="text-white font-medium">Sfide</span>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="secondary"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              </Button>
              <Button 
                variant="gradient" 
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Crea Sfida
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="container mx-auto px-4 pt-4">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="ml-auto"
              >
                ✕
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'available', label: 'Disponibili', count: filteredAvailableChallenges.length },
            { id: 'active', label: 'Le Mie Sfide', count: activeChallenges.length },
            { id: 'history', label: 'Storico', count: completedChallenges.length }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={selectedTab === tab.id ? 'gradient' : 'ghost'}
              onClick={() => setSelectedTab(tab.id as any)}
              className="relative"
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Available Challenges Tab */}
        {selectedTab === 'available' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="search"
                  placeholder="Cerca sfide per esercizio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="w-5 h-5" />}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'duel', 'open', 'tournament', 'mission'] as const).map((filter) => (
                  <Button
                    key={filter}
                    variant={selectedFilter === filter ? 'gradient' : 'secondary'}
                    size="sm"
                    onClick={() => setSelectedFilter(filter)}
                  >
                    {filter === 'all' ? 'Tutte' : typeLabels[filter] || filter}
                  </Button>
                ))}
              </div>
            </div>

            {/* Challenges Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAvailableChallenges.map((challenge, index) => {
                const TypeIcon = typeIcons[challenge.type as keyof typeof typeIcons] || Swords
                const exerciseLabel = exerciseOptions.find(ex => ex.value === challenge.exercise)?.label || challenge.exercise
                const timeRemaining = getTimeRemaining(challenge.expires_at)
                const isExpired = timeRemaining === 'Scaduta'
                
                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      variant="glass" 
                      className={cn(
                        "p-5 cursor-pointer transition-all hover:scale-[1.02]",
                        isExpired && "opacity-60"
                      )}
                    >
                      {/* Challenge Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <TypeIcon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white">{exerciseLabel}</h3>
                            <p className="text-xs text-gray-400">{typeLabels[challenge.type as keyof typeof typeLabels]}</p>
                          </div>
                        </div>
                        <span className={cn(
                          'text-xs px-2 py-1 rounded-full border',
                          difficultyColors[challenge.difficulty as keyof typeof difficultyColors]
                        )}>
                          {challenge.difficulty}
                        </span>
                      </div>

                      {/* Creator Info */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {challenge.challenger?.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white">{challenge.challenger?.username}</p>
                          <p className="text-xs text-gray-500">Livello {challenge.challenger?.level}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-yellow-500">+{challenge.xp_reward} XP</p>
                          {challenge.wager_coins > 0 && (
                            <p className="text-xs text-gray-500">Wager: {challenge.wager_coins}</p>
                          )}
                        </div>
                      </div>

                      {/* Challenge Info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400 flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            Partecipanti
                          </span>
                          <span className="text-white">
                            {challenge.participants_count || 0}/{challenge.max_participants || 2}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400 flex items-center gap-1">
                            <Timer className="w-4 h-4" />
                            Tempo rimanente
                          </span>
                          <span className={cn(
                            "text-white",
                            isExpired && "text-red-400"
                          )}>
                            {timeRemaining}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        variant={isExpired ? 'secondary' : 'gradient'}
                        className="w-full"
                        disabled={isExpired}
                        onClick={() => !isExpired && acceptChallenge(challenge.id)}
                      >
                        {isExpired ? 'Scaduta' : 'Accetta Sfida'}
                        {!isExpired && <Swords className="w-4 h-4 ml-2" />}
                      </Button>

                      {/* Created Time */}
                      <p className="text-xs text-gray-500 text-center mt-3">
                        Creata {new Date(challenge.created_at).toLocaleDateString('it-IT')}
                      </p>
                    </Card>
                  </motion.div>
                )
              })}
            </div>

            {filteredAvailableChallenges.length === 0 && !loading && (
              <Card variant="glass" className="p-12 text-center">
                <Swords className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">
                  {searchQuery || selectedFilter !== 'all' 
                    ? 'Nessuna sfida trovata con i filtri attuali'
                    : 'Nessuna sfida disponibile al momento'
                  }
                </p>
                <Button variant="gradient" onClick={() => setShowCreateModal(true)}>
                  Crea la Prima Sfida
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* Active Challenges Tab */}
        {selectedTab === 'active' && (
          <div className="space-y-4">
            {activeChallenges.map((challenge, index) => {
              const isMyChallenge = challenge.challenger_id === user?.id
              const opponent = isMyChallenge ? challenge.opponent : challenge.challenger
              const myScore = getMyScoreForChallenge(challenge)
              const opponentScore = getOpponentScoreForChallenge(challenge)
              const exerciseLabel = exerciseOptions.find(ex => ex.value === challenge.exercise)?.label || challenge.exercise
              const timeRemaining = getTimeRemaining(challenge.expires_at)
              
              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card variant="glass" className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                          <Swords className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">
                            {exerciseLabel} vs {opponent?.username || 'In attesa...'}
                          </h3>
                          <div className="flex items-center gap-4 mt-1">
                            <span className={cn(
                              'text-sm px-2 py-1 rounded-full',
                              challenge.status === 'active' 
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            )}>
                              {challenge.status === 'active' ? 'In corso' : 'In attesa'}
                            </span>
                            <span className="text-sm text-gray-400 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {timeRemaining}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">Tu</p>
                          <p className="text-2xl font-bold text-white">{myScore}</p>
                        </div>
                        <div className="text-gray-600">VS</div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">Avversario</p>
                          <p className="text-2xl font-bold text-white">{opponentScore}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-bold text-yellow-500">+{challenge.xp_reward} XP</p>
                          <p className="text-xs text-gray-500">Premio</p>
                        </div>
                        <Link href={`/duel/${challenge.id}`}>
                          <Button variant="gradient">
                            {challenge.status === 'active' ? 'Gioca' : 'Dettagli'}
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}

            {activeChallenges.length === 0 && (
              <Card variant="glass" className="p-12 text-center">
                <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Non hai sfide attive</p>
                <div className="flex gap-3 justify-center">
                  <Button variant="gradient" onClick={() => setSelectedTab('available')}>
                    Trova Sfide
                  </Button>
                  <Button variant="secondary" onClick={() => setShowCreateModal(true)}>
                    Crea Sfida
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* History Tab */}
        {selectedTab === 'history' && (
          <div className="space-y-4">
            {completedChallenges.map((challenge, index) => {
              const isMyChallenge = challenge.challenger_id === user?.id
              const opponent = isMyChallenge ? challenge.opponent : challenge.challenger
              const myScore = getMyScoreForChallenge(challenge)
              const opponentScore = getOpponentScoreForChallenge(challenge)
              const won = didIWin(challenge)
              const exerciseLabel = exerciseOptions.find(ex => ex.value === challenge.exercise)?.label || challenge.exercise
              
              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card variant="glass" className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {won ? (
                          <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                            <Trophy className="w-7 h-7 text-white" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center">
                            <XCircle className="w-7 h-7 text-white" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-white text-lg">
                            {exerciseLabel} vs {opponent?.username}
                          </h3>
                          <p className={cn(
                            'text-sm mt-1',
                            won ? 'text-green-400' : 'text-red-400'
                          )}>
                            {won ? '✨ Vittoria!' : '❌ Sconfitta'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-white">{myScore}</p>
                          <p className="text-xs text-gray-400">Tu</p>
                        </div>
                        <div className="text-gray-600">-</div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-white">{opponentScore}</p>
                          <p className="text-xs text-gray-400">Avversario</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={cn(
                          'text-lg font-bold',
                          won ? 'text-green-400' : 'text-gray-500'
                        )}>
                          {won ? `+${challenge.xp_reward} XP` : '0 XP'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(challenge.created_at).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}

            {completedChallenges.length === 0 && (
              <Card variant="glass" className="p-12 text-center">
                <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Nessuna sfida completata</p>
                <Button variant="gradient" onClick={() => setSelectedTab('available')}>
                  Inizia a Giocare
                </Button>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Create Challenge Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crea Nuova Sfida"
        size="md"
      >
        <div className="space-y-4">
          {/* Challenge Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo di Sfida
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={createForm.type === 'duel' ? 'gradient' : 'secondary'}
                onClick={() => setCreateForm(prev => ({ ...prev, type: 'duel' }))}
              >
                <Swords className="w-4 h-4 mr-2" />
                Duello 1v1
              </Button>
              <Button
                variant={createForm.type === 'open' ? 'gradient' : 'secondary'}
                onClick={() => setCreateForm(prev => ({ ...prev, type: 'open' }))}
              >
                <Users className="w-4 h-4 mr-2" />
                Sfida Aperta
              </Button>
            </div>
          </div>

          {/* Exercise Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Esercizio
            </label>
            <select
              value={createForm.exercise}
              onChange={(e) => setCreateForm(prev => ({ ...prev, exercise: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            >
              {exerciseOptions.map(exercise => (
                <option key={exercise.value} value={exercise.value}>
                  {exercise.label} ({exercise.difficulty})
                </option>
              ))}
            </select>
          </div>

          {/* XP Reward */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Premio XP: {createForm.xp_reward}
            </label>
            <input
              type="range"
              min="50"
              max="500"
              step="25"
              value={createForm.xp_reward}
              onChange={(e) => setCreateForm(prev => ({ ...prev, xp_reward: Number(e.target.value) }))}
              className="w-full"
            />
          </div>

          {/* Wager Coins */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Wager Coins: {createForm.wager_coins}
            </label>
            <input
              type="range"
              min="0"
              max="200"
              step="10"
              value={createForm.wager_coins}
              onChange={(e) => setCreateForm(prev => ({ ...prev, wager_coins: Number(e.target.value) }))}
              className="w-full"
            />
          </div>

          {/* Time Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tempo Limite
            </label>
            <select
              value={createForm.time_limit_hours}
              onChange={(e) => setCreateForm(prev => ({ ...prev, time_limit_hours: Number(e.target.value) }))}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value={6}>6 ore</option>
              <option value={12}>12 ore</option>
              <option value={24}>24 ore</option>
              <option value={48}>48 ore</option>
              <option value={72}>3 giorni</option>
            </select>
          </div>

          {/* Max Participants (for open challenges) */}
          {createForm.type === 'open' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Partecipanti: {createForm.max_participants}
              </label>
              <input
                type="range"
                min="2"
                max="20"
                step="1"
                value={createForm.max_participants}
                onChange={(e) => setCreateForm(prev => ({ ...prev, max_participants: Number(e.target.value) }))}
                className="w-full"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
              disabled={creating}
            >
              Annulla
            </Button>
            <Button
              variant="gradient"
              onClick={createChallenge}
              className="flex-1"
              disabled={creating}
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  Crea Sfida
                  <Swords className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}