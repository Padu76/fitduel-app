'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Swords, Trophy, Clock, Users, Zap, Filter,
  Plus, Search, TrendingUp, Flame, Target,
  ChevronRight, Calendar, Medal, Star, Crown,
  Activity, Timer, AlertCircle, CheckCircle, XCircle
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

// Mock challenges data
const mockChallenges = [
  {
    id: '1',
    type: 'open',
    exercise: 'Push-Up',
    creator: 'FitMaster',
    creatorLevel: 15,
    creatorAvatar: '💪',
    xpReward: 100,
    wager: 50,
    participants: 0,
    maxParticipants: 1,
    difficulty: 'medium',
    timeLimit: '24h',
    createdAt: '10 min fa',
    status: 'open'
  },
  {
    id: '2',
    type: 'tournament',
    exercise: 'Plank',
    creator: 'IronWill',
    creatorLevel: 22,
    creatorAvatar: '🏋️',
    xpReward: 250,
    wager: 100,
    participants: 7,
    maxParticipants: 16,
    difficulty: 'hard',
    timeLimit: '48h',
    createdAt: '1 ora fa',
    status: 'open'
  },
  {
    id: '3',
    type: '1v1',
    exercise: 'Squat',
    creator: 'SpeedDemon',
    creatorLevel: 8,
    creatorAvatar: '⚡',
    xpReward: 75,
    wager: 30,
    participants: 1,
    maxParticipants: 1,
    difficulty: 'easy',
    timeLimit: '12h',
    createdAt: '2 ore fa',
    status: 'full'
  },
  {
    id: '4',
    type: 'mission',
    exercise: 'Burpee',
    creator: 'System',
    creatorLevel: 0,
    creatorAvatar: '🎯',
    xpReward: 300,
    wager: 0,
    participants: 45,
    maxParticipants: 100,
    difficulty: 'extreme',
    timeLimit: '7 giorni',
    createdAt: '1 giorno fa',
    status: 'open'
  }
]

// My active challenges
const myChallenges = [
  {
    id: 'a1',
    opponent: 'GymHero',
    exercise: 'Push-Up',
    status: 'active',
    myScore: 45,
    opponentScore: 38,
    timeLeft: '2h 15m',
    xpReward: 80
  },
  {
    id: 'a2',
    opponent: 'PowerLifter',
    exercise: 'Plank',
    status: 'pending',
    myScore: 0,
    opponentScore: 0,
    timeLeft: '5h 30m',
    xpReward: 100
  },
  {
    id: 'a3',
    opponent: 'RunnerX',
    exercise: 'Squat',
    status: 'completed',
    myScore: 62,
    opponentScore: 58,
    timeLeft: 'Completata',
    xpReward: 120,
    won: true
  }
]

const difficultyColors = {
  easy: 'text-green-500 bg-green-500/10 border-green-500/20',
  medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  hard: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  extreme: 'text-red-500 bg-red-500/10 border-red-500/20'
}

const typeIcons = {
  '1v1': Swords,
  open: Users,
  tournament: Trophy,
  mission: Target
}

const typeLabels = {
  '1v1': 'Duello 1v1',
  open: 'Sfida Aperta',
  tournament: 'Torneo',
  mission: 'Missione'
}

export default function ChallengesPage() {
  const [selectedTab, setSelectedTab] = useState<'available' | 'active' | 'history'>('available')
  const [selectedFilter, setSelectedFilter] = useState<'all' | '1v1' | 'open' | 'tournament' | 'mission'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState('push_up')
  const [challengeType, setChallengeType] = useState<'1v1' | 'open'>('1v1')
  const [xpWager, setXpWager] = useState(50)

  const filteredChallenges = mockChallenges.filter(challenge => {
    if (selectedFilter !== 'all' && challenge.type !== selectedFilter) return false
    if (searchQuery && !challenge.exercise.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

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

            <Button 
              variant="gradient" 
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              Crea Sfida
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'available', label: 'Disponibili', count: mockChallenges.length },
            { id: 'active', label: 'Le Mie Sfide', count: myChallenges.filter(c => c.status !== 'completed').length },
            { id: 'history', label: 'Storico', count: myChallenges.filter(c => c.status === 'completed').length }
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
                  placeholder="Cerca sfide..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="w-5 h-5" />}
                />
              </div>
              <div className="flex gap-2">
                {(['all', '1v1', 'open', 'tournament', 'mission'] as const).map((filter) => (
                  <Button
                    key={filter}
                    variant={selectedFilter === filter ? 'gradient' : 'secondary'}
                    size="sm"
                    onClick={() => setSelectedFilter(filter)}
                  >
                    {filter === 'all' ? 'Tutte' : typeLabels[filter]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Challenges Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChallenges.map((challenge, index) => {
                const TypeIcon = typeIcons[challenge.type as keyof typeof typeIcons]
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
                        challenge.status === 'full' && "opacity-60"
                      )}
                    >
                      {/* Challenge Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <TypeIcon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white">{challenge.exercise}</h3>
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
                        <span className="text-2xl">{challenge.creatorAvatar}</span>
                        <div className="flex-1">
                          <p className="text-sm text-white">{challenge.creator}</p>
                          <p className="text-xs text-gray-500">Livello {challenge.creatorLevel}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-yellow-500">+{challenge.xpReward} XP</p>
                          {challenge.wager > 0 && (
                            <p className="text-xs text-gray-500">Wager: {challenge.wager}</p>
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
                            {challenge.participants}/{challenge.maxParticipants}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400 flex items-center gap-1">
                            <Timer className="w-4 h-4" />
                            Tempo limite
                          </span>
                          <span className="text-white">{challenge.timeLimit}</span>
                        </div>
                      </div>

                      {/* Progress Bar for Tournament */}
                      {challenge.type === 'tournament' && (
                        <div className="mb-4">
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                              style={{ width: `${(challenge.participants / challenge.maxParticipants) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <Button
                        variant={challenge.status === 'full' ? 'secondary' : 'gradient'}
                        className="w-full"
                        disabled={challenge.status === 'full'}
                      >
                        {challenge.status === 'full' ? 'Pieno' : 'Partecipa'}
                        {challenge.status !== 'full' && <Swords className="w-4 h-4 ml-2" />}
                      </Button>

                      {/* Created Time */}
                      <p className="text-xs text-gray-500 text-center mt-3">
                        Creata {challenge.createdAt}
                      </p>
                    </Card>
                  </motion.div>
                )
              })}
            </div>

            {filteredChallenges.length === 0 && (
              <Card variant="glass" className="p-12 text-center">
                <Swords className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Nessuna sfida disponibile</p>
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
            {myChallenges.filter(c => c.status !== 'completed').map((challenge, index) => (
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
                          {challenge.exercise} vs {challenge.opponent}
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
                            {challenge.timeLeft}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-1">Tu</p>
                        <p className="text-2xl font-bold text-white">{challenge.myScore}</p>
                      </div>
                      <div className="text-gray-600">VS</div>
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-1">Avversario</p>
                        <p className="text-2xl font-bold text-white">{challenge.opponentScore}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-yellow-500">+{challenge.xpReward} XP</p>
                        <p className="text-xs text-gray-500">Premio</p>
                      </div>
                      <Button variant="gradient">
                        {challenge.status === 'active' ? 'Aggiorna' : 'Inizia'}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* History Tab */}
        {selectedTab === 'history' && (
          <div className="space-y-4">
            {myChallenges.filter(c => c.status === 'completed').map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="glass" className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {challenge.won ? (
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
                          {challenge.exercise} vs {challenge.opponent}
                        </h3>
                        <p className={cn(
                          'text-sm mt-1',
                          challenge.won ? 'text-green-400' : 'text-red-400'
                        )}>
                          {challenge.won ? '✨ Vittoria!' : '❌ Sconfitta'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">{challenge.myScore}</p>
                        <p className="text-xs text-gray-400">Tu</p>
                      </div>
                      <div className="text-gray-600">-</div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">{challenge.opponentScore}</p>
                        <p className="text-xs text-gray-400">Avversario</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={cn(
                        'text-lg font-bold',
                        challenge.won ? 'text-green-400' : 'text-gray-500'
                      )}>
                        {challenge.won ? `+${challenge.xpReward} XP` : '0 XP'}
                      </p>
                      <p className="text-xs text-gray-500">Completata</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
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
                variant={challengeType === '1v1' ? 'gradient' : 'secondary'}
                onClick={() => setChallengeType('1v1')}
              >
                <Swords className="w-4 h-4 mr-2" />
                Duello 1v1
              </Button>
              <Button
                variant={challengeType === 'open' ? 'gradient' : 'secondary'}
                onClick={() => setChallengeType('open')}
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
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="push_up">Push-Up</option>
              <option value="squat">Squat</option>
              <option value="plank">Plank</option>
              <option value="burpee">Burpee</option>
              <option value="jumping_jack">Jumping Jack</option>
            </select>
          </div>

          {/* XP Wager */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Wager XP
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="200"
                step="10"
                value={xpWager}
                onChange={(e) => setXpWager(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-white font-bold w-12">{xpWager}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Annulla
            </Button>
            <Button
              variant="gradient"
              onClick={() => {
                setShowCreateModal(false)
                // TODO: Create challenge logic
              }}
              className="flex-1"
            >
              Crea Sfida
              <Swords className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}