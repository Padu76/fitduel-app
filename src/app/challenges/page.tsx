'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Swords, Trophy, Zap, Users, Target, Timer, Shield,
  Plus, Search, Filter, ArrowLeft, Flame, Crown,
  Clock, Star, TrendingUp, CheckCircle, XCircle,
  AlertTriangle, Gamepad2, Award, Eye
} from 'lucide-react'

interface Challenge {
  id: string
  title: string
  challenger: string
  challenged?: string
  status: 'pending' | 'active' | 'completed' | 'expired'
  type: 'quick' | 'endurance' | 'strength' | 'cardio'
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  duration: number // minutes
  participants: number
  maxParticipants: number
  startTime: string
  endTime?: string
  prize: string
  description: string
}

export default function ChallengesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'available' | 'my-challenges' | 'completed'>('available')
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Check user authentication
  useEffect(() => {
    const userData = localStorage.getItem('fitduel_user')
    if (!userData) {
      router.push('/login')
      return
    }
    
    // Simulate loading challenges from backend
    setTimeout(() => {
      setChallenges([]) // Empty for now - will be populated by backend
      setIsLoading(false)
    }, 1500)
  }, [router])

  const challengeTypes = [
    { id: 'all', label: 'Tutti i tipi', icon: Swords, color: 'text-gray-400' },
    { id: 'quick', label: 'Sfida Rapida', icon: Zap, color: 'text-yellow-400' },
    { id: 'endurance', label: 'Resistenza', icon: Timer, color: 'text-blue-400' },
    { id: 'strength', label: 'Forza', icon: Trophy, color: 'text-red-400' },
    { id: 'cardio', label: 'Cardio', icon: Flame, color: 'text-orange-400' }
  ]

  const difficultyLevels = [
    { id: 'all', label: 'Tutti i livelli', color: 'bg-gray-500' },
    { id: 'easy', label: 'Facile', color: 'bg-green-500' },
    { id: 'medium', label: 'Medio', color: 'bg-yellow-500' },
    { id: 'hard', label: 'Difficile', color: 'bg-orange-500' },
    { id: 'extreme', label: 'Estremo', color: 'bg-red-500' }
  ]

  const handleCreateChallenge = () => {
    setShowCreateModal(true)
  }

  const handleJoinChallenge = (challengeId: string) => {
    // TODO: Implement join challenge logic with backend
    console.log('Joining challenge:', challengeId)
  }

  const CreateChallengeModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowCreateModal(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 rounded-2xl p-6 max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Backend Integration Richiesta</h3>
          <p className="text-gray-400">
            Per creare sfide è necessario configurare il database e l'API backend.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-800/50 rounded-xl p-4">
            <h4 className="font-medium text-white mb-2">Componenti necessari:</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>UI Sistema Sfide</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span>Database Supabase</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span>API Endpoint Sfide</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span>Sistema Matching</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span>Real-time Updates</span>
              </li>
            </ul>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(false)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 rounded-xl hover:shadow-lg transition-all"
        >
          Chiudi
        </button>
      </motion.div>
    </motion.div>
  )

  const EmptyState = ({ title, description, icon: Icon }: { title: string, description: string, icon: any }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <div className="w-24 h-24 bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Icon className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">{description}</p>
      
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-xl p-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <span className="text-yellow-400 font-medium">Sistema in Sviluppo</span>
        </div>
        <p className="text-gray-300 text-sm">
          Le sfide saranno disponibili una volta completata l'integrazione con il backend Supabase.
        </p>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Swords className="w-6 h-6 text-red-400" />
                  Sfide Elite
                </h1>
                <p className="text-gray-400">Combatti contro i migliori atleti</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateChallenge}
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Crea Sfida</span>
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-gray-400 text-sm">Sfide Attive</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-gray-400 text-sm">Vittorie</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">#--</div>
                <div className="text-gray-400 text-sm">Ranking</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-gray-400 text-sm">Punti XP</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex space-x-1 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-1">
            {[
              { id: 'available', label: 'Sfide Disponibili', icon: Target },
              { id: 'my-challenges', label: 'Le Mie Sfide', icon: Gamepad2 },
              { id: 'completed', label: 'Completate', icon: CheckCircle }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cerca sfide..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-1">
              <Filter className="w-4 h-4 text-gray-400 ml-2" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-transparent text-white border-none outline-none cursor-pointer pr-2"
              >
                {challengeTypes.map(type => (
                  <option key={type.id} value={type.id} className="bg-gray-900">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-1">
              <Target className="w-4 h-4 text-gray-400 ml-2" />
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-transparent text-white border-none outline-none cursor-pointer pr-2"
              >
                {difficultyLevels.map(level => (
                  <option key={level.id} value={level.id} className="bg-gray-900">
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === 'available' && (
                <EmptyState
                  title="Nessuna Sfida Disponibile"
                  description="Al momento non ci sono sfide attive. Il sistema di matchmaking sarà disponibile con l'integrazione backend."
                  icon={Target}
                />
              )}

              {activeTab === 'my-challenges' && (
                <EmptyState
                  title="Nessuna Sfida Creata"
                  description="Non hai ancora creato nessuna sfida. Crea la tua prima sfida quando il sistema sarà attivo!"
                  icon={Gamepad2}
                />
              )}

              {activeTab === 'completed' && (
                <EmptyState
                  title="Nessuna Sfida Completata"
                  description="Le tue sfide completate appariranno qui una volta che il sistema sarà operativo."
                  icon={CheckCircle}
                />
              )}
            </>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <h2 className="text-xl font-bold text-white mb-6">Preparati per le Sfide</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/training" className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">Allenamento Intensivo</h3>
              <p className="text-gray-400">Preparati per le sfide con sessioni di training elite</p>
            </Link>

            <Link href="/training/library" className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Perfeziona Tecniche</h3>
              <p className="text-gray-400">Migliora le tue abilità con la libreria tecniche</p>
            </Link>

            <Link href="/profile" className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-green-400 transition-colors">Analizza Performance</h3>
              <p className="text-gray-400">Monitora i tuoi progressi e statistiche</p>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Create Challenge Modal */}
      {showCreateModal && <CreateChallengeModal />}
    </div>
  )
}