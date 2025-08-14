'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Crown, Medal, Target, Zap, Users, 
  Timer, Calendar, ArrowLeft, Gift, Star,
  TrendingUp, Award, Flame, ChevronRight,
  Clock, Lock, Unlock, Sparkles, Shield,
  Swords, AlertCircle, Info, Heart
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { cn } from '@/utils/cn'

// ====================================
// TYPES
// ====================================
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
}

interface Tournament {
  id: string
  name: string
  status: 'upcoming' | 'active' | 'completed'
  start_date: string
  end_date: string
  total_participants: number
  prize_pool_xp: number
  prize_pool_coins: number
  rules: string[]
  exercises: string[]
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
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [leaderboard, setLeaderboard] = useState<TournamentPlayer[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'leaderboard' | 'rewards' | 'rules'>('leaderboard')
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  // Mock data for current tournament
  const mockTournament: Tournament = {
    id: 't-weekly-1',
    name: 'Torneo Settimanale Elite',
    status: 'active',
    start_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    total_participants: 347,
    prize_pool_xp: 10000,
    prize_pool_coins: 5000,
    rules: [
      'Minimo 10 duelli per qualificarsi',
      'Solo esercizi di difficoltà Media o superiore',
      'Bonus x2 punti per streak di 5+ vittorie',
      'Penalità -50 punti per forfait',
      'Form Score minimo 70% per validare il duello'
    ],
    exercises: ['Push-Up', 'Squat', 'Plank', 'Burpee', 'Mountain Climber']
  }

  // Mock leaderboard data
  const mockLeaderboard: TournamentPlayer[] = [
    {
      id: '1',
      username: 'FitChampion',
      total_points: 2840,
      duels_won: 28,
      duels_total: 32,
      win_rate: 87.5,
      current_streak: 12,
      rank: 1,
      level: 42,
      badges: ['🔥', '👑', '💪'],
      last_active: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      username: 'IronWarrior',
      total_points: 2720,
      duels_won: 26,
      duels_total: 31,
      win_rate: 83.8,
      current_streak: 8,
      rank: 2,
      level: 38,
      badges: ['💎', '⚡', '🏆'],
      last_active: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      username: 'FlexMaster',
      total_points: 2650,
      duels_won: 25,
      duels_total: 30,
      win_rate: 83.3,
      current_streak: 6,
      rank: 3,
      level: 35,
      badges: ['🌟', '💪', '🎯'],
      last_active: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '4',
      username: 'Tu',
      total_points: 1890,
      duels_won: 18,
      duels_total: 24,
      win_rate: 75.0,
      current_streak: 3,
      rank: 12,
      level: 25,
      badges: ['🔥', '💪'],
      last_active: new Date().toISOString()
    }
  ]

  // Tournament rewards
  const rewards: TournamentReward[] = [
    { position: 1, xp: 5000, coins: 2500, badge: '🏆', title: 'Campione Settimanale' },
    { position: 2, xp: 3000, coins: 1500, badge: '🥈', title: 'Vice Campione' },
    { position: 3, xp: 2000, coins: 1000, badge: '🥉', title: 'Terzo Classificato' },
    { position: 10, xp: 1000, coins: 500, badge: '⭐', title: 'Top 10' },
    { position: 25, xp: 500, coins: 250, badge: '✨', title: 'Top 25' },
    { position: 50, xp: 250, coins: 100 },
    { position: 100, xp: 100, coins: 50 }
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
        // Load real data from Supabase if needed
      } else {
        // Demo mode
        const savedUser = localStorage.getItem('fitduel_user')
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser))
        }
      }

      // Use mock data for now
      setTournament(mockTournament)
      setLeaderboard(mockLeaderboard)
      setUserRank(12)
      
    } catch (error) {
      console.error('Error loading tournament:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateTimeRemaining = () => {
    if (!tournament) return
    
    const end = new Date(tournament.end_date).getTime()
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

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500'
    if (rank === 2) return 'text-gray-300'
    if (rank === 3) return 'text-orange-500'
    if (rank <= 10) return 'text-purple-400'
    if (rank <= 25) return 'text-blue-400'
    return 'text-gray-400'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '👑'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    if (rank <= 10) return '⭐'
    if (rank <= 25) return '✨'
    return '🎯'
  }

  const getRewardForRank = (rank: number): TournamentReward | null => {
    for (const reward of rewards) {
      if (rank <= reward.position) return reward
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-yellow-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Caricamento torneo...</p>
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
                  {tournament?.name}
                </h1>
                <p className="text-sm text-gray-400">
                  {tournament?.total_participants} partecipanti
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-400">Termina tra</p>
                <p className="text-sm font-bold text-white flex items-center gap-1">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  {timeRemaining}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowInfoModal(true)}>
                <Info className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tournament Stats Banner */}
      <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-b border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-500">{tournament?.prize_pool_xp.toLocaleString()}</p>
              <p className="text-xs text-gray-400">XP Totali</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-500">{tournament?.prize_pool_coins.toLocaleString()}</p>
              <p className="text-xs text-gray-400">💰 Coins</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">#{userRank || '?'}</p>
              <p className="text-xs text-gray-400">La tua posizione</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{tournament?.total_participants}</p>
              <p className="text-xs text-gray-400">Giocatori</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-2 mb-6">
          <Button
            variant={selectedTab === 'leaderboard' ? 'gradient' : 'secondary'}
            size="sm"
            onClick={() => setSelectedTab('leaderboard')}
            className="flex-1"
          >
            <Trophy className="w-4 h-4 mr-1" />
            Classifica
          </Button>
          <Button
            variant={selectedTab === 'rewards' ? 'gradient' : 'secondary'}
            size="sm"
            onClick={() => setSelectedTab('rewards')}
            className="flex-1"
          >
            <Gift className="w-4 h-4 mr-1" />
            Premi
          </Button>
          <Button
            variant={selectedTab === 'rules' ? 'gradient' : 'secondary'}
            size="sm"
            onClick={() => setSelectedTab('rules')}
            className="flex-1"
          >
            <Shield className="w-4 h-4 mr-1" />
            Regole
          </Button>
        </div>

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
              {/* Your Position Card */}
              {userRank && (
                <Card variant="gradient" className="p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getRankIcon(userRank)}</div>
                      <div>
                        <p className="text-sm text-gray-300">La tua posizione</p>
                        <p className="text-2xl font-bold text-white">#{userRank}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-300">Punti totali</p>
                      <p className="text-2xl font-bold text-yellow-500">1,890</p>
                    </div>
                  </div>
                  
                  {getRewardForRank(userRank) && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-xs text-gray-400 mb-1">Se mantieni questa posizione:</p>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-yellow-500">
                          +{getRewardForRank(userRank)?.xp} XP
                        </span>
                        <span className="text-sm text-yellow-500">
                          +{getRewardForRank(userRank)?.coins} 💰
                        </span>
                        {getRewardForRank(userRank)?.badge && (
                          <span className="text-sm">
                            {getRewardForRank(userRank)?.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* Leaderboard List */}
              {leaderboard.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    variant={player.username === 'Tu' ? 'gradient' : 'glass'} 
                    className="p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Rank */}
                        <div className={cn(
                          'text-2xl font-bold w-10 text-center',
                          getRankColor(player.rank)
                        )}>
                          {player.rank <= 3 ? getRankIcon(player.rank) : `#${player.rank}`}
                        </div>

                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-xl">
                            {player.badges[0] || '💪'}
                          </span>
                        </div>

                        {/* Player Info */}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-white">{player.username}</p>
                            <span className="text-xs text-gray-400">Lv.{player.level}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>{player.duels_won}W/{player.duels_total - player.duels_won}L</span>
                            <span className="text-green-400">{player.win_rate}%</span>
                            {player.current_streak >= 3 && (
                              <span className="text-orange-400 flex items-center gap-1">
                                <Flame className="w-3 h-3" />
                                {player.current_streak}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Points */}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{player.total_points.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">punti</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}

              {/* Load More */}
              <Button variant="secondary" className="w-full">
                Carica altri giocatori
              </Button>
            </motion.div>
          )}

          {/* REWARDS TAB */}
          {selectedTab === 'rewards' && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
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
                      className={cn(
                        'p-3 rounded-lg border',
                        userRank && userRank <= reward.position
                          ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-500/30'
                          : 'bg-gray-800/30 border-gray-700'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">
                            {reward.badge || getRankIcon(reward.position)}
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

                <div className="mt-4 p-3 bg-indigo-500/10 rounded-lg">
                  <p className="text-xs text-indigo-400">
                    💡 I premi vengono distribuiti automaticamente alla fine del torneo
                  </p>
                </div>
              </Card>
            </motion.div>
          )}

          {/* RULES TAB */}
          {selectedTab === 'rules' && (
            <motion.div
              key="rules"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              <Card variant="glass" className="p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  Regolamento Torneo
                </h3>
                
                <div className="space-y-3">
                  {tournament?.rules.map((rule, index) => (
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
                  {tournament?.exercises.map((exercise) => (
                    <div
                      key={exercise}
                      className="p-2 bg-gray-800/50 rounded-lg text-center"
                    >
                      <p className="text-sm text-white">{exercise}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card variant="glass" className="p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Sistema Punteggio
                </h3>
                
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between items-center p-2 bg-gray-800/30 rounded">
                    <span>Vittoria Base</span>
                    <span className="text-white font-bold">+100 punti</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-800/30 rounded">
                    <span>Bonus Form Score 90%+</span>
                    <span className="text-white font-bold">+25 punti</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-800/30 rounded">
                    <span>Bonus Streak (per vittoria)</span>
                    <span className="text-white font-bold">+10 punti</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-800/30 rounded">
                    <span>Bonus Difficoltà Estrema</span>
                    <span className="text-white font-bold">x1.5</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-800/30 rounded">
                    <span>Sconfitta</span>
                    <span className="text-gray-400">+25 punti</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-900/20 rounded">
                    <span>Forfait/Abbandono</span>
                    <span className="text-red-400 font-bold">-50 punti</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Join/Play Button */}
        <div className="mt-8 mb-4">
          <Button
            variant="gradient"
            size="lg"
            onClick={() => router.push('/challenges')}
            className="w-full py-4 text-lg"
          >
            <Swords className="w-5 h-5 mr-2" />
            Gioca Duelli del Torneo
          </Button>
          <p className="text-xs text-gray-400 text-center mt-2">
            I duelli completati contano automaticamente per il torneo
          </p>
        </div>
      </div>

      {/* Info Modal */}
      <Modal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Informazioni Torneo"
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-white mb-2">Come Funziona</h4>
            <p className="text-sm text-gray-400">
              Il Torneo Settimanale è una competizione che dura 7 giorni dove i giocatori 
              competono per accumulare il maggior numero di punti attraverso i duelli.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">Come Partecipare</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Completa almeno 10 duelli durante la settimana</li>
              <li>• Scegli difficoltà Media o superiore per punti validi</li>
              <li>• Mantieni un Form Score minimo del 70%</li>
              <li>• Accumula punti vincendo i duelli</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">Strategia</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Costruisci streak di vittorie per bonus punti</li>
              <li>• Sfida giocatori di livello simile o superiore</li>
              <li>• Usa la difficoltà Estrema per moltiplicatore x1.5</li>
              <li>• Evita forfait che causano penalità</li>
            </ul>
          </div>

          <div className="p-3 bg-yellow-500/10 rounded-lg">
            <p className="text-sm text-yellow-400">
              🏆 I premi vengono distribuiti automaticamente ogni domenica alle 23:59
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}