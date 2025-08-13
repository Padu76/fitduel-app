'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Crown, Medal, Users, Timer, Zap, Coins,
  Calendar, TrendingUp, Award, Star, Target, Activity,
  Lock, Unlock, ChevronRight, ArrowLeft, Info, Gift,
  Swords, Flame, Shield, AlertCircle, CheckCircle,
  Clock, BarChart3, Sparkles, Hash, Filter, RefreshCw
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ====================================
// TYPES
// ====================================
interface Tournament {
  id: string
  name: string
  status: 'upcoming' | 'active' | 'completed'
  start_date: string
  end_date: string
  entry_fee: number
  prize_pool: number
  max_participants: number
  current_participants: number
  difficulty: 'all' | 'easy' | 'medium' | 'hard'
  rules: string[]
}

interface TournamentParticipant {
  id: string
  user_id: string
  username: string
  avatar?: string
  level: number
  total_score: number
  rank: number
  exercises_completed: number
  average_form_score: number
  best_streak: number
  last_activity: string
}

interface DailyChallenge {
  id: string
  exercise: string
  target_reps: number
  target_form_score: number
  completed: boolean
  user_score?: number
  user_reps?: number
  expires_at: string
}

interface Prize {
  rank: number
  xp: number
  coins: number
  badge: string
  color: string
}

// ====================================
// CONSTANTS
// ====================================
const PRIZES: Prize[] = [
  { rank: 1, xp: 500, coins: 200, badge: '🥇', color: 'from-yellow-400 to-yellow-600' },
  { rank: 2, xp: 300, coins: 100, badge: '🥈', color: 'from-gray-300 to-gray-500' },
  { rank: 3, xp: 150, coins: 50, badge: '🥉', color: 'from-orange-400 to-orange-600' },
]

const MOCK_TOURNAMENT: Tournament = {
  id: 't-1',
  name: 'Sfida dei Campioni',
  status: 'active',
  start_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  end_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
  entry_fee: 50,
  prize_pool: 500,
  max_participants: 100,
  current_participants: 67,
  difficulty: 'all',
  rules: [
    'Completa 3 sfide giornaliere',
    'Mantieni un form score minimo del 70%',
    'Accumula punti per salire in classifica',
    'I migliori 10 vincono premi'
  ]
}

const MOCK_LEADERBOARD: TournamentParticipant[] = [
  { id: '1', user_id: 'u1', username: 'IronChampion', level: 32, total_score: 2840, rank: 1, exercises_completed: 18, average_form_score: 92, best_streak: 12, last_activity: '10 min fa', avatar: '💪' },
  { id: '2', user_id: 'u2', username: 'FlexMaster', level: 28, total_score: 2720, rank: 2, exercises_completed: 17, average_form_score: 88, best_streak: 10, last_activity: '1h fa', avatar: '🏋️' },
  { id: '3', user_id: 'u3', username: 'SpeedDemon', level: 25, total_score: 2580, rank: 3, exercises_completed: 16, average_form_score: 85, best_streak: 8, last_activity: '2h fa', avatar: '⚡' },
  { id: '4', user_id: 'u4', username: 'PowerLifter', level: 24, total_score: 2450, rank: 4, exercises_completed: 15, average_form_score: 87, best_streak: 9, last_activity: '3h fa', avatar: '🦾' },
  { id: '5', user_id: 'demo', username: 'Tu', level: 20, total_score: 2100, rank: 5, exercises_completed: 14, average_form_score: 82, best_streak: 6, last_activity: 'Ora', avatar: '🎯' },
]

const MOCK_DAILY_CHALLENGES: DailyChallenge[] = [
  { id: 'dc1', exercise: 'Push-Up', target_reps: 30, target_form_score: 80, completed: true, user_score: 85, user_reps: 32, expires_at: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString() },
  { id: 'dc2', exercise: 'Squat', target_reps: 40, target_form_score: 75, completed: false, expires_at: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString() },
  { id: 'dc3', exercise: 'Plank', target_reps: 60, target_form_score: 85, completed: false, expires_at: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString() },
]

// ====================================
// COMPONENTS
// ====================================
const CountdownTimer = ({ endDate }: { endDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const end = new Date(endDate).getTime()
      const distance = end - now

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [endDate])

  return (
    <div className="grid grid-cols-4 gap-2">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center">
          <div className="bg-gray-800/50 rounded-lg p-2">
            <p className="text-2xl font-bold text-white">{value.toString().padStart(2, '0')}</p>
          </div>
          <p className="text-xs text-gray-400 mt-1 capitalize">{unit}</p>
        </div>
      ))}
    </div>
  )
}

const LeaderboardRow = ({ 
  participant, 
  isCurrentUser,
  onClick 
}: { 
  participant: TournamentParticipant
  isCurrentUser: boolean
  onClick: () => void
}) => {
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400'
    if (rank === 2) return 'text-gray-300'
    if (rank === 3) return 'text-orange-400'
    if (rank <= 10) return 'text-indigo-400'
    return 'text-gray-400'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    if (rank <= 10) return '🏆'
    return null
  }

  return (
    <motion.div
      whileHover={{ x: 4 }}
      onClick={onClick}
      className={cn(
        "flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all",
        isCurrentUser ? "bg-indigo-500/20 border border-indigo-500/30" : "bg-gray-800/30 hover:bg-gray-800/50"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Rank */}
        <div className="flex items-center gap-2 min-w-[60px]">
          <span className={cn("text-2xl font-bold", getRankColor(participant.rank))}>
            #{participant.rank}
          </span>
          {getRankIcon(participant.rank) && (
            <span className="text-xl">{getRankIcon(participant.rank)}</span>
          )}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-xl">{participant.avatar || '👤'}</span>
          </div>
          <div>
            <p className="font-semibold text-white flex items-center gap-2">
              {participant.username}
              {isCurrentUser && <span className="text-xs bg-indigo-500/30 px-2 py-0.5 rounded">TU</span>}
            </p>
            <p className="text-xs text-gray-400">Level {participant.level}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-400">Esercizi</p>
            <p className="text-sm font-bold text-white">{participant.exercises_completed}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Form</p>
            <p className="text-sm font-bold text-white">{participant.average_form_score}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Streak</p>
            <p className="text-sm font-bold text-white">{participant.best_streak}</p>
          </div>
        </div>
        
        {/* Score */}
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{participant.total_score}</p>
          <p className="text-xs text-gray-400">punti</p>
        </div>
      </div>
    </motion.div>
  )
}

const DailyChallengeCard = ({ 
  challenge,
  onStart
}: { 
  challenge: DailyChallenge
  onStart: () => void
}) => {
  const getTimeLeft = () => {
    const now = new Date().getTime()
    const expires = new Date(challenge.expires_at).getTime()
    const hours = Math.floor((expires - now) / (1000 * 60 * 60))
    const minutes = Math.floor((expires - now) / (1000 * 60)) % 60
    return `${hours}h ${minutes}m`
  }

  return (
    <Card 
      variant="glass" 
      className={cn(
        "p-4",
        challenge.completed && "bg-green-500/10 border-green-500/30"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            challenge.completed ? "bg-green-500/20" : "bg-indigo-500/20"
          )}>
            {challenge.completed ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <Target className="w-5 h-5 text-indigo-400" />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-white">{challenge.exercise}</h4>
            <p className="text-xs text-gray-400">
              {challenge.target_reps} reps • Form {challenge.target_form_score}%
            </p>
          </div>
        </div>
        
        <div className="text-right">
          {challenge.completed ? (
            <div>
              <p className="text-sm font-bold text-green-400">Completato!</p>
              <p className="text-xs text-gray-400">
                {challenge.user_reps} reps • {challenge.user_score}%
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-400">Scade in</p>
              <p className="text-xs font-medium text-white">{getTimeLeft()}</p>
            </div>
          )}
        </div>
      </div>

      {!challenge.completed && (
        <Button 
          variant="gradient" 
          size="sm" 
          className="w-full"
          onClick={onStart}
        >
          <Swords className="w-4 h-4 mr-2" />
          Inizia Sfida
        </Button>
      )}
    </Card>
  )
}

const PrizePoolCard = () => {
  return (
    <Card variant="gradient" className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Gift className="w-6 h-6 text-yellow-400" />
        <h3 className="text-lg font-bold text-white">Montepremi</h3>
      </div>

      <div className="space-y-3">
        {PRIZES.map((prize) => (
          <div 
            key={prize.rank}
            className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{prize.badge}</span>
              <div>
                <p className="text-sm font-medium text-white">
                  {prize.rank}° Posto
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <span className="text-gray-400">{prize.xp} XP</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Coins className="w-3 h-3 text-yellow-600" />
                    <span className="text-gray-400">{prize.coins} coins</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            💡 Top 10 ricevono XP bonus basato sulla posizione
          </p>
        </div>
      </div>
    </Card>
  )
}

// ====================================
// MAIN COMPONENT
// ====================================
export default function TournamentPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [loading, setLoading] = useState(true)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [leaderboard, setLeaderboard] = useState<TournamentParticipant[]>([])
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([])
  const [userParticipation, setUserParticipation] = useState<TournamentParticipant | null>(null)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'leaderboard' | 'challenges' | 'rules'>('leaderboard')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadTournamentData()
  }, [])

  const loadTournamentData = async () => {
    try {
      setLoading(true)
      
      // Check for real user
      const { data: { user } } = await supabase.auth.getUser()
      
      // Load mock data for now
      setTournament(MOCK_TOURNAMENT)
      setLeaderboard(MOCK_LEADERBOARD)
      setDailyChallenges(MOCK_DAILY_CHALLENGES)
      
      // Find user participation
      const userRank = MOCK_LEADERBOARD.find(p => p.user_id === 'demo')
      setUserParticipation(userRank || null)
      
    } catch (error) {
      console.error('Error loading tournament:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinTournament = async () => {
    // TODO: Implement join logic with payment
    console.log('Joining tournament...')
    setShowJoinModal(false)
    setUserParticipation(MOCK_LEADERBOARD[4]) // Mock join
  }

  const handleStartChallenge = (challengeId: string) => {
    // Navigate to duel page with tournament context
    router.push(`/duel/${challengeId}?tournament=true`)
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadTournamentData()
    setTimeout(() => setRefreshing(false), 1000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-yellow-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Caricamento torneo...</p>
        </div>
      </div>
    )
  }

  const isUserParticipating = !!userParticipation

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Torneo Settimanale</h1>
                  <p className="text-sm text-gray-400">{tournament?.name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshData}
                disabled={refreshing}
              >
                <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
              </Button>
              {!isUserParticipating && (
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => setShowJoinModal(true)}
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  Partecipa
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Tournament Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card variant="gradient" className="p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Tournament Info */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-yellow-400" />
                  <h3 className="font-bold text-white">Stato Torneo</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-3 h-3 rounded-full animate-pulse",
                    tournament?.status === 'active' ? "bg-green-500" : "bg-gray-500"
                  )} />
                  <span className="text-sm text-white capitalize">{tournament?.status}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {tournament?.current_participants}/{tournament?.max_participants} partecipanti
                </p>
              </div>

              {/* Timer */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-white">Tempo Rimanente</h3>
                </div>
                {tournament && <CountdownTimer endDate={tournament.end_date} />}
              </div>

              {/* User Position */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                  <h3 className="font-bold text-white">La Tua Posizione</h3>
                </div>
                {isUserParticipating ? (
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-white">#{userParticipation?.rank}</p>
                      <p className="text-xs text-gray-400">Rank</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-indigo-400">{userParticipation?.total_score}</p>
                      <p className="text-xs text-gray-400">Punti</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Non iscritto</p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={selectedTab === 'leaderboard' ? 'gradient' : 'ghost'}
            onClick={() => setSelectedTab('leaderboard')}
          >
            <Trophy className="w-4 h-4 mr-2" />
            Classifica
          </Button>
          <Button
            variant={selectedTab === 'challenges' ? 'gradient' : 'ghost'}
            onClick={() => setSelectedTab('challenges')}
            className="relative"
          >
            <Swords className="w-4 h-4 mr-2" />
            Sfide Giornaliere
            {dailyChallenges.filter(c => !c.completed).length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                {dailyChallenges.filter(c => !c.completed).length}
              </span>
            )}
          </Button>
          <Button
            variant={selectedTab === 'rules' ? 'gradient' : 'ghost'}
            onClick={() => setSelectedTab('rules')}
          >
            <Info className="w-4 h-4 mr-2" />
            Regole & Premi
          </Button>
        </div>

        {/* Content based on tab */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* LEADERBOARD TAB */}
              {selectedTab === 'leaderboard' && (
                <motion.div
                  key="leaderboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-3"
                >
                  {leaderboard.map((participant) => (
                    <LeaderboardRow
                      key={participant.id}
                      participant={participant}
                      isCurrentUser={participant.user_id === 'demo'}
                      onClick={() => console.log('View profile:', participant.username)}
                    />
                  ))}
                  
                  {leaderboard.length === 0 && (
                    <Card variant="glass" className="p-12 text-center">
                      <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">Nessun partecipante ancora</p>
                    </Card>
                  )}
                </motion.div>
              )}

              {/* CHALLENGES TAB */}
              {selectedTab === 'challenges' && (
                <motion.div
                  key="challenges"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {!isUserParticipating ? (
                    <Card variant="glass" className="p-8 text-center">
                      <Lock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-white mb-2">Partecipa al Torneo</h3>
                      <p className="text-gray-400 mb-6">
                        Devi essere iscritto al torneo per accedere alle sfide giornaliere
                      </p>
                      <Button variant="gradient" onClick={() => setShowJoinModal(true)}>
                        <Unlock className="w-4 h-4 mr-2" />
                        Iscriviti Ora
                      </Button>
                    </Card>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white">Sfide di Oggi</h3>
                          <p className="text-sm text-gray-400">
                            Completa tutte e 3 per il bonus giornaliero!
                          </p>
                        </div>
                        {dailyChallenges.every(c => c.completed) && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-lg">
                            <Sparkles className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-green-400">+50 Bonus!</span>
                          </div>
                        )}
                      </div>
                      
                      {dailyChallenges.map((challenge) => (
                        <DailyChallengeCard
                          key={challenge.id}
                          challenge={challenge}
                          onStart={() => handleStartChallenge(challenge.id)}
                        />
                      ))}
                    </>
                  )}
                </motion.div>
              )}

              {/* RULES TAB */}
              {selectedTab === 'rules' && (
                <motion.div
                  key="rules"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <Card variant="glass" className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-indigo-400" />
                      Regole del Torneo
                    </h3>
                    <ul className="space-y-3">
                      {tournament?.rules.map((rule, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="text-indigo-400 font-bold">{index + 1}.</span>
                          <span className="text-gray-300 text-sm">{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <Card variant="glass" className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-yellow-400" />
                      Sistema Punteggio
                    </h3>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex justify-between">
                        <span>Completamento esercizio</span>
                        <span className="text-white font-medium">+100 punti</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Form score perfetto (95%+)</span>
                        <span className="text-white font-medium">+50 punti</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Superamento target reps</span>
                        <span className="text-white font-medium">+2 punti/rep</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Streak giornaliero (3 sfide)</span>
                        <span className="text-white font-medium">+50 punti</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Record personale</span>
                        <span className="text-white font-medium">+25 punti</span>
                      </div>
                    </div>
                  </Card>

                  <Card variant="glass" className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-green-400" />
                      Programma
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-300">
                        <span>Inizio Torneo</span>
                        <span className="text-white">Lunedì 00:00</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Fine Torneo</span>
                        <span className="text-white">Domenica 23:59</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Premiazione</span>
                        <span className="text-white">Lunedì 10:00</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Reset Sfide</span>
                        <span className="text-white">Ogni giorno 00:00</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Prize Pool */}
            <PrizePoolCard />

            {/* Quick Stats */}
            {isUserParticipating && (
              <Card variant="glass" className="p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-400" />
                  Le Tue Statistiche
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Posizione</span>
                    <span className="text-white font-bold">#{userParticipation?.rank}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Punti Totali</span>
                    <span className="text-white font-bold">{userParticipation?.total_score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Esercizi</span>
                    <span className="text-white font-bold">{userParticipation?.exercises_completed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Form Medio</span>
                    <span className="text-white font-bold">{userParticipation?.average_form_score}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Best Streak</span>
                    <span className="text-white font-bold">{userParticipation?.best_streak}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Hall of Fame */}
            <Card variant="glass" className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                Hall of Fame
              </h3>
              <div className="space-y-2">
                <div className="text-sm">
                  <p className="text-gray-400">Settimana Scorsa</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg">🥇</span>
                    <span className="text-white font-medium">FlexKing</span>
                    <span className="text-gray-500 text-xs">3420 pts</span>
                  </div>
                </div>
                <div className="text-sm">
                  <p className="text-gray-400">Record Assoluto</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg">👑</span>
                    <span className="text-white font-medium">LegendaryLifter</span>
                    <span className="text-gray-500 text-xs">4280 pts</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Tournament Info */}
            <Card variant="glass" className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                Info Torneo
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Entry Fee</span>
                  <span className="text-white font-medium flex items-center gap-1">
                    <Coins className="w-3 h-3 text-yellow-600" />
                    {tournament?.entry_fee}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Montepremi</span>
                  <span className="text-white font-medium flex items-center gap-1">
                    <Coins className="w-3 h-3 text-yellow-600" />
                    {tournament?.prize_pool}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Difficoltà</span>
                  <span className="text-white font-medium capitalize">{tournament?.difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Partecipanti</span>
                  <span className="text-white font-medium">
                    {tournament?.current_participants}/{tournament?.max_participants}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Join Tournament Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Partecipa al Torneo"
        size="md"
      >
        <div className="space-y-6">
          <div className="text-center">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">{tournament?.name}</h3>
            <p className="text-gray-400">Sei pronto a competere con i migliori?</p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400">Entry Fee</span>
              <span className="text-xl font-bold text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-600" />
                {tournament?.entry_fee}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Il tuo saldo: 150 coins
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-white">Cosa ottieni:</h4>
            <ul className="space-y-1 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Accesso a 3 sfide giornaliere esclusive
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Possibilità di vincere fino a 500 XP
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Badge esclusivi per i top 3
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Montepremi garantito di {tournament?.prize_pool} coins
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowJoinModal(false)}
              className="flex-1"
            >
              Annulla
            </Button>
            <Button
              variant="gradient"
              onClick={handleJoinTournament}
              className="flex-1"
            >
              <Unlock className="w-4 h-4 mr-2" />
              Paga e Partecipa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}