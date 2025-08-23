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
// MAIN COMPONENT
// ====================================

export default function ChallengesPage() {
  const router = useRouter()
  
  const [currentUser] = useState({ id: 'current_user', username: 'Tu' })
  const [exercises] = useState([])
  const [duels] = useState([])
  const [filteredDuels, setFilteredDuels] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [selectedTab, setSelectedTab] = useState<'available' | 'my-duels' | 'history'>('available')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterExercise, setFilterExercise] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

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

  const handleCreateDuel = async (duelData: any) => {
    try {
      setError(null)
      setSuccess('Sfida creata con successo!')
      
      // Here you would integrate with your backend API
      // const response = await createDuel(duelData)
      
    } catch (err: any) {
      console.error('Error creating duel:', err)
      setError(err.message || 'Errore nella creazione della sfida')
    }
  }

  const handleAcceptDuel = async (duelId: string) => {
    try {
      setError(null)
      setSuccess('Sfida accettata!')
      
      // Here you would integrate with your backend API
      // const response = await acceptDuel(duelId)
      
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
                onClick={() => {/* Add refresh logic here */}}
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

        {/* Integration Notice */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-6 bg-blue-500/10 border border-blue-500/20 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-lg font-medium text-blue-400 mb-2">Integrazione Backend Richiesta</p>
              <div className="text-sm text-blue-300 space-y-2">
                <p>Per completare la pagina delle sfide, è necessario integrare:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Database per salvare sfide e duelli</li>
                  <li>API per creare, accettare e gestire sfide</li>
                  <li>Autenticazione utenti</li>
                  <li>Sistema di notifiche in tempo reale</li>
                </ul>
                <p className="mt-3">
                  <strong>Tutti i dati mock sono stati rimossi come richiesto.</strong> 
                  La pagina è ora pronta per l'integrazione con il backend.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={selectedTab === 'available' ? 'gradient' : 'secondary'}
            onClick={() => setSelectedTab('available')}
          >
            Disponibili (0)
          </Button>
          <Button
            variant={selectedTab === 'my-duels' ? 'gradient' : 'secondary'}
            onClick={() => setSelectedTab('my-duels')}
          >
            Le Mie Sfide (0)
          </Button>
          <Button
            variant={selectedTab === 'history' ? 'gradient' : 'secondary'}
            onClick={() => setSelectedTab('history')}
          >
            Storico (0)
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

        {/* Empty State */}
        <Card className="p-12 text-center">
          <Swords className="w-20 h-20 text-gray-600 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-3">Nessuna sfida disponibile</h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Connetti il database e l'API backend per visualizzare e gestire le sfide tra utenti.
          </p>
          
          <div className="space-y-4">
            <Button variant="gradient" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Crea Nuova Sfida
            </Button>
            
            <div className="text-sm text-gray-500">
              <p>Questa pagina è pronta per l'integrazione backend</p>
            </div>
          </div>
        </Card>
      </main>

      {/* Create Duel Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Crea Nuova Sfida" size="md">
        <div className="space-y-4">
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Integrazione Backend Richiesta</h3>
            <p className="text-gray-400 mb-6">
              Per creare sfide è necessario configurare il database e l'API backend.
            </p>
            
            <div className="space-y-3 text-sm text-gray-500">
              <p>Componenti necessari:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Database per esercizi e sfide</li>
                <li>API per la creazione di duelli</li>
                <li>Sistema di autenticazione</li>
                <li>Gestione stati delle sfide</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1">
              Chiudi
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}