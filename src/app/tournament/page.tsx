'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Crown, Medal, Target, Zap, Users, 
  Timer, Calendar, ArrowLeft, Gift, Star,
  TrendingUp, Award, Flame, ChevronRight,
  Clock, Lock, Unlock, Sparkles, Shield,
  Swords, AlertCircle, Info, Heart, Eye,
  Plus, Minus, Search, Filter, Settings,
  ChevronDown, ChevronUp, PlayCircle,
  UserPlus, MessageCircle, Share2, Coins,
  CheckCircle, XCircle, RefreshCw, Tv, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { cn } from '@/utils/cn'

// ====================================
// TYPES
// ====================================
type TournamentType = 'weekly' | 'bracket' | 'battle_royale' | 'custom'
type TournamentStatus = 'upcoming' | 'registration' | 'active' | 'completed'
type MatchStatus = 'pending' | 'ready' | 'live' | 'completed'

interface TournamentPlayer {
  id: string
  username: string
  avatar_url?: string
  total_points: number
  duels_won: number
  duels_total: number
  win_rate: number
  current_streak: number
  rank: number
  level: number
  badges: string[]
  last_active: string
  seed?: number
  eliminated?: boolean
}

interface Tournament {
  id: string
  name: string
  type: TournamentType
  status: TournamentStatus
  start_date: string
  end_date: string
  total_participants: number
  max_participants?: number
  entry_fee?: number
  prize_pool_xp: number
  prize_pool_coins: number
  rules: string[]
  exercises: string[]
  current_round?: number
  total_rounds?: number
  created_by?: string
}

interface BracketMatch {
  id: string
  tournament_id: string
  round: number
  match_number: number
  player1: TournamentPlayer | null
  player2: TournamentPlayer | null
  winner: TournamentPlayer | null
  status: MatchStatus
  scheduled_time?: string
  score1?: number
  score2?: number
  next_match_id?: string
}

interface TournamentReward {
  position: number
  xp: number
  coins: number
  badge?: string
  title?: string
}

// ====================================
// MAIN COMPONENT
// ====================================
export default function TournamentPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  // State
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [leaderboard, setLeaderboard] = useState<TournamentPlayer[]>([])
  const [bracketMatches, setBracketMatches] = useState<BracketMatch[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'bracket' | 'leaderboard' | 'rewards' | 'rules'>('overview')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [tournamentView, setTournamentView] = useState<'list' | 'detail'>('list')
  const [filterType, setFilterType] = useState<TournamentType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Tournament rewards structure
  const rewards: TournamentReward[] = [
    { position: 1, xp: 5000, coins: 2500, badge: '🏆', title: 'Campione' },
    { position: 2, xp: 3000, coins: 1500, badge: '🥈', title: 'Vice Campione' },
    { position: 3, xp: 2000, coins: 1000, badge: '🥉', title: 'Terzo' },
    { position: 4, xp: 1000, coins: 500, badge: '⭐', title: 'Semifinalista' },
    { position: 8, xp: 500, coins: 250 },
    { position: 16, xp: 250, coins: 100 }
  ]

  useEffect(() => {
    loadTournamentData()
    const timer = setInterval(updateTimeRemaining, 1000)
    return () => clearInterval(timer)
  }, [])

  const loadTournamentData = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
        
        // Load tournaments from database
        const { data: tournamentsData, error: tournamentsError } = await supabase
          .from('tournaments')
          .select('*')
          .order('created_at', { ascending: false })

        if (tournamentsError) {
          console.error('Error loading tournaments:', tournamentsError)
        } else if (tournamentsData) {
          setTournaments(tournamentsData)
        }

        // Load bracket matches if a tournament is selected
        if (selectedTournament) {
          const { data: matchesData, error: matchesError } = await supabase
            .from('tournament_matches')
            .select(`
              *,
              player1:profiles!player1_id(*),
              player2:profiles!player2_id(*),
              winner:profiles!winner_id(*)
            `)
            .eq('tournament_id', selectedTournament.id)
            .order('round', { ascending: true })
            .order('match_number', { ascending: true })

          if (matchesError) {
            console.error('Error loading matches:', matchesError)
          } else if (matchesData) {
            setBracketMatches(matchesData)
          }
        }
      } else {
        const savedUser = localStorage.getItem('fitduel_user')
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser))
        } else {
          router.push('/login')
        }
      }
      
    } catch (error) {
      console.error('Error loading tournaments:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateTimeRemaining = () => {
    if (!selectedTournament) return
    
    const end = new Date(selectedTournament.end_date).getTime()
    const now = Date.now()
    const diff = end - now

    if (diff <= 0) {
      setTimeRemaining('Terminato')
      return
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    setTimeRemaining(`${days}g ${hours}h ${minutes}m`)
  }

  const getTournamentIcon = (type: TournamentType) => {
    switch (type) {
      case 'weekly': return '📅'
      case 'bracket': return '🏆'
      case 'battle_royale': return '⚔️'
      case 'custom': return '⭐'
      default: return '🎮'
    }
  }

  const getTournamentColor = (type: TournamentType) => {
    switch (type) {
      case 'weekly': return 'from-blue-500 to-indigo-500'
      case 'bracket': return 'from-yellow-500 to-orange-500'
      case 'battle_royale': return 'from-red-500 to-pink-500'
      case 'custom': return 'from-purple-500 to-pink-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case 'upcoming': return 'text-gray-400'
      case 'registration': return 'text-yellow-400'
      case 'active': return 'text-green-400'
      case 'completed': return 'text-gray-500'
      default: return 'text-gray-400'
    }
  }

  const getRoundName = (round: number, totalRounds: number) => {
    const roundsFromEnd = totalRounds - round
    switch (roundsFromEnd) {
      case 0: return 'Finale'
      case 1: return 'Semifinale'
      case 2: return 'Quarti di Finale'
      case 3: return 'Ottavi di Finale'
      case 4: return 'Sedicesimi'
      default: return `Round ${round}`
    }
  }

  const handleJoinTournament = async (tournament: Tournament) => {
    // Implement join logic with real API
    console.log('Joining tournament:', tournament.id)
  }

  const handleSpectateMatch = (match: BracketMatch) => {
    setSelectedMatch(match)
    setShowMatchModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Caricamento tornei...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-indigo-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  {tournamentView === 'list' ? 'Tornei' : selectedTournament?.name}
                </h1>
                {tournamentView === 'detail' && (
                  <p className="text-sm text-gray-400">
                    {selectedTournament?.total_participants} partecipanti
                    {selectedTournament?.max_participants && ` / ${selectedTournament.max_participants} max`}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {tournamentView === 'detail' && selectedTournament && (
                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    {selectedTournament.status === 'active' ? 'Termina tra' : 'Inizia tra'}
                  </p>
                  <p className="text-sm font-bold text-white flex items-center gap-1">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    {timeRemaining}
                  </p>
                </div>
              )}
              
              {tournamentView === 'list' && (
                <Button 
                  variant="gradient" 
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Crea Torneo
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tournamentView === 'list' ? (
          // TOURNAMENT LIST VIEW
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="container mx-auto px-4 py-6"
          >
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={filterType === 'all' ? 'gradient' : 'secondary'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                Tutti
              </Button>
              <Button
                variant={filterType === 'weekly' ? 'gradient' : 'secondary'}
                size="sm"
                onClick={() => setFilterType('weekly')}
              >
                📅 Settimanali
              </Button>
              <Button
                variant={filterType === 'bracket' ? 'gradient' : 'secondary'}
                size="sm"
                onClick={() => setFilterType('bracket')}
              >
                🏆 Bracket
              </Button>
              <Button
                variant={filterType === 'battle_royale' ? 'gradient' : 'secondary'}
                size="sm"
                onClick={() => setFilterType('battle_royale')}
              >
                ⚔️ Battle Royale
              </Button>
            </div>

            {/* Tournament Cards or Empty State */}
            {tournaments.length > 0 ? (
              <div className="grid gap-4">
                {tournaments
                  .filter(t => filterType === 'all' || t.type === filterType)
                  .map((tournament, index) => (
                    <motion.div
                      key={tournament.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card variant="glass" className="p-6 hover:border-indigo-500/50 transition-all cursor-pointer"
                        onClick={() => {
                          setSelectedTournament(tournament)
                          setTournamentView('detail')
                        }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl',
                              getTournamentColor(tournament.type)
                            )}>
                              {getTournamentIcon(tournament.type)}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">{tournament.name}</h3>
                              <p className={cn('text-sm', getStatusColor(tournament.status))}>
                                {tournament.status === 'upcoming' && '📜 In arrivo'}
                                {tournament.status === 'registration' && '📝 Iscrizioni aperte'}
                                {tournament.status === 'active' && '🔥 In corso'}
                                {tournament.status === 'completed' && '✅ Completato'}
                              </p>
                            </div>
                          </div>

                          {tournament.entry_fee && (
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Entry fee</p>
                              <p className="text-lg font-bold text-yellow-500 flex items-center gap-1">
                                <Coins className="w-4 h-4" />
                                {tournament.entry_fee}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                            <p className="text-2xl font-bold text-white">
                              {tournament.total_participants}
                              {tournament.max_participants && `/${tournament.max_participants}`}
                            </p>
                            <p className="text-xs text-gray-400">Partecipanti</p>
                          </div>
                          <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                            <p className="text-2xl font-bold text-yellow-500">{tournament.prize_pool_xp.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">XP Pool</p>
                          </div>
                          <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                            <p className="text-2xl font-bold text-yellow-500">{tournament.prize_pool_coins.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">💰 Pool</p>
                          </div>
                          <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-400">
                              {tournament.status === 'active' ? 'Termina' : 'Inizia'}
                            </p>
                            <p className="text-sm font-bold text-white">
                              {new Date(tournament.status === 'active' ? tournament.end_date : tournament.start_date)
                                .toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            {tournament.exercises.slice(0, 3).map((exercise) => (
                              <span key={exercise} className="px-2 py-1 bg-gray-800/50 rounded text-xs text-gray-300">
                                {exercise}
                              </span>
                            ))}
                            {tournament.exercises.length > 3 && (
                              <span className="px-2 py-1 bg-gray-800/50 rounded text-xs text-gray-300">
                                +{tournament.exercises.length - 3}
                              </span>
                            )}
                          </div>

                          <Button 
                            variant={tournament.status === 'registration' ? 'gradient' : 'secondary'}
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (tournament.status === 'registration') {
                                handleJoinTournament(tournament)
                              } else {
                                setSelectedTournament(tournament)
                                setTournamentView('detail')
                              }
                            }}
                          >
                            {tournament.status === 'registration' && 'Iscriviti'}
                            {tournament.status === 'active' && 'Visualizza'}
                            {tournament.status === 'upcoming' && 'Dettagli'}
                            {tournament.status === 'completed' && 'Risultati'}
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
              </div>
            ) : (
              // Empty State
              <Card variant="glass" className="p-12 text-center">
                <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Nessun torneo disponibile</h3>
                <p className="text-gray-400 mb-6">
                  I tornei saranno presto disponibili. Resta sintonizzato!
                </p>
                <Button variant="gradient" onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-5 h-5 mr-2" />
                  Crea il Primo Torneo
                </Button>
              </Card>
            )}
          </motion.div>
        ) : (
          // TOURNAMENT DETAIL VIEW
          <motion.div
            key="detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="container mx-auto px-4 py-6"
          >
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTournamentView('list')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Torna ai tornei
            </Button>

            {/* Tournament Info Banner */}
            {selectedTournament && (
              <Card variant="gradient" className="p-6 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{selectedTournament.prize_pool_xp.toLocaleString()}</p>
                    <p className="text-xs text-gray-300">XP Pool</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{selectedTournament.prize_pool_coins.toLocaleString()}</p>
                    <p className="text-xs text-gray-300">💰 Pool</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">
                      {selectedTournament.total_participants}
                      {selectedTournament.max_participants && `/${selectedTournament.max_participants}`}
                    </p>
                    <p className="text-xs text-gray-300">Partecipanti</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">
                      {selectedTournament.type === 'bracket' && selectedTournament.current_round 
                        ? `${selectedTournament.current_round}/${selectedTournament.total_rounds}`
                        : '-'}
                    </p>
                    <p className="text-xs text-gray-300">Round</p>
                  </div>
                  <div className="text-center">
                    <p className={cn('text-sm font-bold', getStatusColor(selectedTournament.status))}>
                      {selectedTournament.status.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-300">Stato</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              <Button
                variant={selectedTab === 'overview' ? 'gradient' : 'secondary'}
                size="sm"
                onClick={() => setSelectedTab('overview')}
              >
                <Info className="w-4 h-4 mr-1" />
                Overview
              </Button>
              {selectedTournament?.type === 'bracket' && (
                <Button
                  variant={selectedTab === 'bracket' ? 'gradient' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedTab('bracket')}
                >
                  <Trophy className="w-4 h-4 mr-1" />
                  Tabellone
                </Button>
              )}
              <Button
                variant={selectedTab === 'leaderboard' ? 'gradient' : 'secondary'}
                size="sm"
                onClick={() => setSelectedTab('leaderboard')}
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                Classifica
              </Button>
              <Button
                variant={selectedTab === 'rewards' ? 'gradient' : 'secondary'}
                size="sm"
                onClick={() => setSelectedTab('rewards')}
              >
                <Gift className="w-4 h-4 mr-1" />
                Premi
              </Button>
              <Button
                variant={selectedTab === 'rules' ? 'gradient' : 'secondary'}
                size="sm"
                onClick={() => setSelectedTab('rules')}
              >
                <Shield className="w-4 h-4 mr-1" />
                Regole
              </Button>
            </div>

            <AnimatePresence mode="wait">
              {/* OVERVIEW TAB */}
              {selectedTab === 'overview' && selectedTournament && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <Card variant="glass" className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Informazioni Torneo</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Tipo</span>
                        <span className="text-white font-semibold">
                          {getTournamentIcon(selectedTournament.type)} {selectedTournament.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Inizio</span>
                        <span className="text-white">
                          {new Date(selectedTournament.start_date).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Fine</span>
                        <span className="text-white">
                          {new Date(selectedTournament.end_date).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                      {selectedTournament.entry_fee && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Entry Fee</span>
                          <span className="text-yellow-500 font-bold">
                            {selectedTournament.entry_fee} 💰
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    {selectedTournament.status === 'registration' && (
                      <Button variant="gradient" onClick={() => handleJoinTournament(selectedTournament)}>
                        <UserPlus className="w-4 h-4 mr-1" />
                        Iscriviti
                      </Button>
                    )}
                    {selectedTournament.status === 'active' && (
                      <Button variant="primary" onClick={() => router.push('/challenges')}>
                        <Swords className="w-4 h-4 mr-1" />
                        Gioca
                      </Button>
                    )}
                    <Button variant="secondary">
                      <Share2 className="w-4 h-4 mr-1" />
                      Condividi
                    </Button>
                    <Button variant="secondary">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Chat
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* BRACKET TAB */}
              {selectedTab === 'bracket' && selectedTournament?.type === 'bracket' && (
                <motion.div
                  key="bracket"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {bracketMatches.length > 0 ? (
                    [4, 3, 2, 1].map(round => {
                      const roundMatches = bracketMatches.filter(m => m.round === round)
                      if (roundMatches.length === 0) return null

                      return (
                        <div key={round} className="space-y-3">
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            {getRoundName(round, 4)}
                          </h3>
                          
                          <div className="grid gap-3">
                            {roundMatches.map((match) => (
                              <Card 
                                key={match.id} 
                                variant="glass" 
                                className="p-4 hover:border-indigo-500/50 transition-all cursor-pointer"
                                onClick={() => handleSpectateMatch(match)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    {/* Player 1 */}
                                    <div className={cn(
                                      "flex items-center justify-between p-2 rounded-lg mb-2",
                                      match.winner?.id === match.player1?.id && "bg-green-500/10 border border-green-500/30"
                                    )}>
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                                          <span className="text-xs">{match.player1?.badges[0] || '👤'}</span>
                                        </div>
                                        <div>
                                          <p className="font-semibold text-white">
                                            {match.player1?.username || 'TBD'}
                                          </p>
                                          {match.player1 && (
                                            <p className="text-xs text-gray-400">
                                              Lv.{match.player1.level} • Seed #{match.player1.seed || match.player1.rank}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      {match.status === 'completed' && (
                                        <span className="text-xl font-bold text-white">{match.score1}</span>
                                      )}
                                    </div>

                                    {/* VS */}
                                    <div className="text-center text-xs text-gray-500 my-1">VS</div>

                                    {/* Player 2 */}
                                    <div className={cn(
                                      "flex items-center justify-between p-2 rounded-lg",
                                      match.winner?.id === match.player2?.id && "bg-green-500/10 border border-green-500/30"
                                    )}>
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                                          <span className="text-xs">{match.player2?.badges[0] || '👤'}</span>
                                        </div>
                                        <div>
                                          <p className="font-semibold text-white">
                                            {match.player2?.username || 'TBD'}
                                          </p>
                                          {match.player2 && (
                                            <p className="text-xs text-gray-400">
                                              Lv.{match.player2.level} • Seed #{match.player2.seed || match.player2.rank}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      {match.status === 'completed' && (
                                        <span className="text-xl font-bold text-white">{match.score2}</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Match Status */}
                                  <div className="ml-4 text-center">
                                    {match.status === 'pending' && (
                                      <div className="text-gray-500">
                                        <Clock className="w-5 h-5 mx-auto mb-1" />
                                        <p className="text-xs">In attesa</p>
                                      </div>
                                    )}
                                    {match.status === 'ready' && (
                                      <div className="text-yellow-500">
                                        <PlayCircle className="w-5 h-5 mx-auto mb-1" />
                                        <p className="text-xs">Pronto</p>
                                      </div>
                                    )}
                                    {match.status === 'live' && (
                                      <div className="text-red-500 animate-pulse">
                                        <Tv className="w-5 h-5 mx-auto mb-1" />
                                        <p className="text-xs">LIVE</p>
                                      </div>
                                    )}
                                    {match.status === 'completed' && (
                                      <div className="text-green-500">
                                        <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                                        <p className="text-xs">Finito</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Spectate Button */}
                                {(match.status === 'live' || match.status === 'completed') && (
                                  <div className="mt-3 pt-3 border-t border-gray-800">
                                    <Button variant="secondary" size="sm" className="w-full">
                                      <Eye className="w-4 h-4 mr-1" />
                                      {match.status === 'live' ? 'Guarda Live' : 'Rivedi Match'}
                                    </Button>
                                  </div>
                                )}
                              </Card>
                            ))}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <Card variant="glass" className="p-8 text-center">
                      <Swords className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">Il tabellone sarà disponibile quando il torneo inizierà</p>
                    </Card>
                  )}
                </motion.div>
              )}

              {/* LEADERBOARD TAB */}
              {selectedTab === 'leaderboard' && (
                <motion.div
                  key="leaderboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card variant="glass" className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Classifica Live</h3>
                    <p className="text-center text-gray-500 py-8">
                      Classifica disponibile quando il torneo è attivo
                    </p>
                  </Card>
                </motion.div>
              )}

              {/* REWARDS TAB */}
              {selectedTab === 'rewards' && (
                <motion.div
                  key="rewards"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card variant="glass" className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Gift className="w-5 h-5 text-yellow-500" />
                      Premi del Torneo
                    </h3>
                    
                    <div className="space-y-3">
                      {rewards.map((reward) => (
                        <div
                          key={reward.position}
                          className="p-3 rounded-lg border bg-gray-800/30 border-gray-700"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">
                                {reward.badge || '🎯'}
                              </div>
                              <div>
                                <p className="font-bold text-white">
                                  {reward.position === 1 ? '1° Posto' :
                                   reward.position === 2 ? '2° Posto' :
                                   reward.position === 3 ? '3° Posto' :
                                   `Top ${reward.position}`}
                                </p>
                                {reward.title && (
                                  <p className="text-xs text-gray-400">{reward.title}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm font-bold text-yellow-500">+{reward.xp}</p>
                                <p className="text-xs text-gray-400">XP</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-yellow-500">+{reward.coins}</p>
                                <p className="text-xs text-gray-400">Coins</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* RULES TAB */}
              {selectedTab === 'rules' && selectedTournament && (
                <motion.div
                  key="rules"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <Card variant="glass" className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-400" />
                      Regolamento
                    </h3>
                    
                    <div className="space-y-3">
                      {selectedTournament.rules.map((rule, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <span className="text-blue-400 font-bold">{index + 1}.</span>
                          <p className="text-sm text-gray-300">{rule}</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card variant="glass" className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-400" />
                      Esercizi Validi
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {selectedTournament.exercises.map((exercise) => (
                        <div
                          key={exercise}
                          className="p-2 bg-gray-800/50 rounded-lg text-center"
                        >
                          <p className="text-sm text-white">{exercise}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Tournament Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crea Torneo Personalizzato"
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-500/10 rounded-lg">
            <p className="text-sm text-yellow-400">
              🏆 Funzionalità Premium: Crea tornei personalizzati per la tua community!
            </p>
          </div>
          
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nome del torneo"
              className="w-full px-4 py-2 bg-gray-800 rounded-lg text-white"
            />
            
            <select className="w-full px-4 py-2 bg-gray-800 rounded-lg text-white">
              <option>Tipo: Bracket (8 giocatori)</option>
              <option>Tipo: Bracket (16 giocatori)</option>
              <option>Tipo: Bracket (32 giocatori)</option>
              <option>Tipo: Battle Royale</option>
            </select>
            
            <input
              type="number"
              placeholder="Entry fee (coins)"
              className="w-full px-4 py-2 bg-gray-800 rounded-lg text-white"
            />
            
            <input
              type="datetime-local"
              className="w-full px-4 py-2 bg-gray-800 rounded-lg text-white"
            />
          </div>
          
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1">
              Annulla
            </Button>
            <Button variant="gradient" className="flex-1">
              Crea Torneo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Match Details Modal */}
      <Modal
        isOpen={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        title="Dettagli Match"
      >
        {selectedMatch && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">{selectedMatch.player1?.badges[0] || '👤'}</span>
                </div>
                <p className="font-bold text-white">{selectedMatch.player1?.username || 'TBD'}</p>
                <p className="text-xs text-gray-400">Lv.{selectedMatch.player1?.level}</p>
              </div>
              
              <div className="text-center">
                <p className="text-3xl font-bold text-white">
                  {selectedMatch.score1 || 0} - {selectedMatch.score2 || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">Best of 3</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">{selectedMatch.player2?.badges[0] || '👤'}</span>
                </div>
                <p className="font-bold text-white">{selectedMatch.player2?.username || 'TBD'}</p>
                <p className="text-xs text-gray-400">Lv.{selectedMatch.player2?.level}</p>
              </div>
            </div>
            
            {selectedMatch.status === 'live' && (
              <Button variant="gradient" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                Guarda Live
              </Button>
            )}
            
            {selectedMatch.status === 'completed' && (
              <Button variant="secondary" className="w-full">
                <PlayCircle className="w-4 h-4 mr-2" />
                Rivedi Highlights
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}