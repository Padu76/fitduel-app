'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Swords, Users, Zap, Trophy, Clock, 
  Search, Star, Circle, ChevronRight, 
  Flame, Target, Crown
} from 'lucide-react'

interface User {
  id: string
  username: string
  display_name: string | null
  level: number
  xp: number
  avatar_url: string | null
  last_seen: string | null
}

interface ChallengeFriendsModalProps {
  isOpen: boolean
  onClose: () => void
  currentUserId: string
  currentUserXp: number
  onChallengeSuccess: (challengedUser: User, wagerXp: number) => void
}

export default function ChallengeFriendsModal({
  isOpen,
  onClose,
  currentUserId,
  currentUserXp,
  onChallengeSuccess
}: ChallengeFriendsModalProps) {
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [friends, setFriends] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [wagerXp, setWagerXp] = useState(100)
  const [challenging, setChallenging] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchAvailableUsers()
    }
  }, [isOpen, currentUserId])

  const fetchAvailableUsers = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`/api/duels/recent?userId=${currentUserId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setAvailableUsers(data.data.availableUsers || [])
        setFriends(data.data.friends || [])
      } else {
        throw new Error(data.error || 'Failed to load users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Errore nel caricamento utenti disponibili')
      // Fallback mock data for development
      setAvailableUsers([
        {
          id: 'mock1',
          username: 'GymWarrior',
          display_name: 'Marco Rossi',
          level: 15,
          xp: 2350,
          avatar_url: null,
          last_seen: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        {
          id: 'mock2',
          username: 'FitnessBeast',
          display_name: 'Sara Verdi',
          level: 22,
          xp: 4800,
          avatar_url: null,
          last_seen: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: 'mock3',
          username: 'MuscleKing',
          display_name: 'Luca Bianchi',
          level: 18,
          xp: 3200,
          avatar_url: null,
          last_seen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleChallenge = async () => {
    if (!selectedUser) return

    try {
      setChallenging(true)
      setError('')

      const response = await fetch('/api/duels/recent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          action: 'challenge',
          targetUserId: selectedUser.id,
          wagerXp: wagerXp
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        onChallengeSuccess(selectedUser, wagerXp)
        onClose()
        setSelectedUser(null)
      } else {
        throw new Error(data.error || 'Failed to send challenge')
      }
    } catch (error) {
      console.error('Error sending challenge:', error)
      setError(error instanceof Error ? error.message : 'Errore nell\'invio della sfida')
    } finally {
      setChallenging(false)
    }
  }

  const filteredUsers = availableUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.display_name && user.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const calculateLevel = (xp: number) => Math.floor(Math.sqrt(xp / 100)) + 1

  const getRank = (level: number) => {
    if (level >= 50) return { name: 'Legend', color: 'text-purple-400', icon: Crown }
    if (level >= 40) return { name: 'Master', color: 'text-yellow-400', icon: Trophy }
    if (level >= 30) return { name: 'Diamond', color: 'text-blue-400', icon: Star }
    if (level >= 20) return { name: 'Gold', color: 'text-yellow-300', icon: Flame }
    if (level >= 10) return { name: 'Silver', color: 'text-gray-300', icon: Target }
    return { name: 'Bronze', color: 'text-orange-400', icon: Circle }
  }

  const getUserInitials = (user: User) => {
    if (user.username) return user.username.charAt(0).toUpperCase()
    return 'U'
  }

  const getOnlineStatus = (lastSeen: string | null) => {
    if (!lastSeen) return { status: 'offline', text: 'Offline', color: 'bg-gray-500' }
    
    const now = new Date()
    const lastSeenDate = new Date(lastSeen)
    const minutesAgo = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60))
    
    if (minutesAgo < 5) return { status: 'online', text: 'Online', color: 'bg-green-500' }
    if (minutesAgo < 30) return { status: 'away', text: `${minutesAgo}m fa`, color: 'bg-yellow-500' }
    if (minutesAgo < 1440) return { status: 'offline', text: `${Math.floor(minutesAgo / 60)}h fa`, color: 'bg-gray-500' }
    return { status: 'offline', text: 'Offline', color: 'bg-gray-500' }
  }

  const wagerOptions = [50, 100, 200, 500, 1000].filter(amount => amount <= currentUserXp)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-green-500/20 
            shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Swords className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Sfida un Amico</h2>
                  <p className="text-slate-400">Scegli il tuo avversario e inizia la battaglia!</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cerca utenti..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 
                    rounded-xl text-white placeholder-slate-400 focus:outline-none 
                    focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Users List */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Utenti Disponibili ({filteredUsers.length})
                </h3>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
                    </div>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => {
                      const rank = getRank(user.level)
                      const RankIcon = rank.icon
                      const onlineStatus = getOnlineStatus(user.last_seen)
                      
                      return (
                        <motion.div
                          key={user.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-4 rounded-xl border transition-all cursor-pointer
                            ${selectedUser?.id === user.id
                              ? 'bg-green-500/20 border-green-500/50'
                              : 'bg-slate-800/50 border-slate-600/50 hover:border-green-500/30'
                            }`}
                          onClick={() => setSelectedUser(user)}
                        >
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="relative">
                              {user.avatar_url ? (
                                <img
                                  src={user.avatar_url}
                                  alt={user.username}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 
                                  flex items-center justify-center text-lg font-bold text-white">
                                  {getUserInitials(user)}
                                </div>
                              )}
                              <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${onlineStatus.color} 
                                rounded-full border-2 border-slate-900`} />
                            </div>

                            {/* User Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-white">
                                  {user.display_name || user.username}
                                </h4>
                                <RankIcon className={`w-4 h-4 ${rank.color}`} />
                              </div>
                              <p className="text-sm text-slate-400">@{user.username}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-blue-400">LV {user.level}</span>
                                <span className="text-xs text-yellow-400">{user.xp.toLocaleString()} XP</span>
                                <span className="text-xs text-slate-500">{onlineStatus.text}</span>
                              </div>
                            </div>

                            {/* Selection Indicator */}
                            {selectedUser?.id === user.id && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="p-2 bg-green-500 rounded-full"
                              >
                                <Swords className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nessun utente trovato</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Challenge Setup */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-400" />
                  Configura Sfida
                </h3>

                {selectedUser ? (
                  <div className="space-y-4">
                    {/* Selected User Display */}
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-600/50">
                      <h4 className="text-white font-semibold mb-2">Avversario Selezionato:</h4>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 
                          flex items-center justify-center text-sm font-bold text-white">
                          {getUserInitials(selectedUser)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{selectedUser.display_name || selectedUser.username}</p>
                          <p className="text-sm text-slate-400">LV {selectedUser.level} • {selectedUser.xp.toLocaleString()} XP</p>
                        </div>
                      </div>
                    </div>

                    {/* Wager Selection */}
                    <div>
                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        Puntata XP
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {wagerOptions.map(amount => (
                          <button
                            key={amount}
                            onClick={() => setWagerXp(amount)}
                            className={`p-3 rounded-lg border font-semibold transition-all
                              ${wagerXp === amount
                                ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                                : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:border-yellow-500/30'
                              }`}
                          >
                            {amount} XP
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        Hai {currentUserXp.toLocaleString()} XP disponibili
                      </p>
                    </div>

                    {/* Challenge Info */}
                    <div className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 
                      rounded-xl border border-green-500/20">
                      <h4 className="text-green-400 font-semibold mb-2">Info Sfida:</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-300">Puntata:</span>
                          <span className="text-yellow-400 font-semibold">{wagerXp} XP</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-300">Premio Vincitore:</span>
                          <span className="text-green-400 font-semibold">{wagerXp * 2} XP</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-300">Tipo:</span>
                          <span className="text-blue-400">1v1 Training Battle</span>
                        </div>
                      </div>
                    </div>

                    {/* Challenge Button */}
                    <button
                      onClick={handleChallenge}
                      disabled={challenging}
                      className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 
                        rounded-xl text-white font-bold hover:shadow-lg hover:shadow-green-500/25 
                        transition-all duration-300 hover:scale-105 disabled:opacity-50 
                        disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {challenging ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Inviando Sfida...
                        </>
                      ) : (
                        <>
                          <Swords className="w-5 h-5" />
                          Invia Sfida
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h4 className="text-lg font-semibold mb-2">Seleziona un Avversario</h4>
                    <p className="text-sm">Scegli un utente dalla lista per configurare la sfida</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}