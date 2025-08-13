'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, UserPlus, Search, MoreVertical, MessageCircle,
  Swords, Trophy, Star, Clock, Check, X, UserMinus,
  Shield, Heart, Zap, Crown, Activity, Eye, EyeOff,
  Mail, Phone, Calendar, MapPin, Settings, Ban,
  Filter, SortAsc, RefreshCw, Loader2, AlertCircle,
  CheckCircle, UserCheck, Send, Globe, Lock, Unlock
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ====================================
// TYPES & INTERFACES
// ====================================
export interface Friend {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'blocked' | 'rejected'
  created_at: string
  accepted_at?: string
  friend_profile: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    bio: string | null
    is_online: boolean
    last_seen: string
  }
  friend_stats: {
    level: number
    total_xp: number
    win_streak: number
    total_duels: number
    duels_won: number
  }
}

export interface FriendRequest {
  id: string
  requester_id: string
  requested_id: string
  status: 'pending' | 'accepted' | 'rejected'
  message: string | null
  created_at: string
  requester_profile: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    bio: string | null
  }
  requester_stats: {
    level: number
    total_xp: number
    total_duels: number
    duels_won: number
  }
}

export interface UserSearchResult {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  level: number
  total_xp: number
  is_friend: boolean
  friend_status: string | null
  friendship_id: string | null
}

// ====================================
// FRIEND SEARCH COMPONENT
// ====================================
const FriendSearch = ({ 
  isOpen, 
  onClose, 
  currentUserId,
  onFriendAdded 
}: { 
  isOpen: boolean
  onClose: () => void
  currentUserId: string
  onFriendAdded: () => void
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const supabase = createClientComponentClient()

  const searchUsers = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      // Search users by username or display_name
      const { data: users, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          display_name,
          avatar_url,
          bio,
          user_stats (
            level,
            total_xp
          )
        `)
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .neq('id', currentUserId)
        .limit(10)

      if (error) throw error

      // Check friendship status for each user
      const userIds = users?.map(u => u.id) || []
      const { data: friendships } = await supabase
        .from('friendships')
        .select('friend_id, status, id')
        .eq('user_id', currentUserId)
        .in('friend_id', userIds)

      const friendshipMap = new Map(
        friendships?.map(f => [f.friend_id, { status: f.status, id: f.id }]) || []
      )

      const results: UserSearchResult[] = users?.map(user => {
        const friendship = friendshipMap.get(user.id)
        return {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          bio: user.bio,
          level: user.user_stats?.[0]?.level || 1,
          total_xp: user.user_stats?.[0]?.total_xp || 0,
          is_friend: friendship?.status === 'accepted',
          friend_status: friendship?.status || null,
          friendship_id: friendship?.id || null
        }
      }) || []

      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }, [currentUserId, supabase])

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchQuery, searchUsers])

  const sendFriendRequest = async (targetUserId: string) => {
    setSending(targetUserId)
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: currentUserId,
          friend_id: targetUserId,
          status: 'pending',
          message: message.trim() || null
        })

      if (error) throw error

      // Update search results
      setSearchResults(prev => 
        prev.map(user => 
          user.id === targetUserId 
            ? { ...user, friend_status: 'pending', is_friend: false }
            : user
        )
      )

      // Create notification for target user
      await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          type: 'friend_request',
          title: 'Nuova richiesta di amicizia',
          message: `${currentUserId} ti ha inviato una richiesta di amicizia`,
          data: { requester_id: currentUserId, message }
        })

      setMessage('')
      onFriendAdded()
    } catch (error) {
      console.error('Error sending friend request:', error)
    } finally {
      setSending(null)
    }
  }

  const removeFriend = async (targetUserId: string, friendshipId: string) => {
    setSending(targetUserId)
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)

      if (error) throw error

      // Also remove reverse friendship
      await supabase
        .from('friendships')
        .delete()
        .eq('user_id', targetUserId)
        .eq('friend_id', currentUserId)

      // Update search results
      setSearchResults(prev => 
        prev.map(user => 
          user.id === targetUserId 
            ? { ...user, friend_status: null, is_friend: false, friendship_id: null }
            : user
        )
      )

      onFriendAdded()
    } catch (error) {
      console.error('Error removing friend:', error)
    } finally {
      setSending(null)
    }
  }

  const getActionButton = (user: UserSearchResult) => {
    if (sending === user.id) {
      return (
        <Button size="sm" disabled>
          <Loader2 className="w-4 h-4 animate-spin" />
        </Button>
      )
    }

    if (user.is_friend) {
      return (
        <Button 
          size="sm" 
          variant="danger"
          onClick={() => removeFriend(user.id, user.friendship_id!)}
        >
          <UserMinus className="w-4 h-4 mr-1" />
          Rimuovi
        </Button>
      )
    }

    if (user.friend_status === 'pending') {
      return (
        <Button size="sm" disabled variant="secondary">
          <Clock className="w-4 h-4 mr-1" />
          In attesa
        </Button>
      )
    }

    return (
      <Button 
        size="sm" 
        variant="gradient"
        onClick={() => sendFriendRequest(user.id)}
      >
        <UserPlus className="w-4 h-4 mr-1" />
        Aggiungi
      </Button>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Trova Amici"
      size="lg"
    >
      <div className="space-y-6">
        {/* Search Input */}
        <div className="relative">
          <Input
            placeholder="Cerca per username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>

        {/* Optional Message */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Messaggio opzionale
          </label>
          <Input
            placeholder="Ciao! Vogliamo allenarci insieme?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={200}
          />
        </div>

        {/* Search Results */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {searchResults.length === 0 && searchQuery.length >= 2 && !loading && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">Nessun utente trovato</p>
            </div>
          )}

          {searchResults.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg"
            >
              {/* Avatar */}
              <div className="relative">
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-800 rounded-full flex items-center justify-center">
                  <Crown className="w-3 h-3 text-yellow-500" />
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">
                    {user.display_name || user.username}
                  </h3>
                  <span className="text-sm text-gray-400">@{user.username}</span>
                </div>
                <p className="text-sm text-gray-400 line-clamp-1">
                  {user.bio || 'Nessuna bio'}
                </p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-indigo-400">
                    Level {user.level}
                  </span>
                  <span className="text-xs text-gray-500">
                    {user.total_xp.toLocaleString()} XP
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {getActionButton(user)}
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-800">
          <Button variant="secondary" onClick={onClose} className="w-full">
            Chiudi
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ====================================
// FRIEND REQUESTS COMPONENT
// ====================================
const FriendRequests = ({ 
  currentUserId, 
  onRequestHandled 
}: { 
  currentUserId: string
  onRequestHandled: () => void
}) => {
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadRequests()
  }, [currentUserId])

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          requester_id,
          requested_id,
          status,
          message,
          created_at,
          requester_profile:profiles!requester_id (
            id,
            username,
            display_name,
            avatar_url,
            bio
          ),
          requester_stats:user_stats!requester_id (
            level,
            total_xp,
            total_duels,
            duels_won
          )
        `)
        .eq('requested_id', currentUserId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      setRequests(data as any || [])
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequest = async (requestId: string, action: 'accept' | 'reject') => {
    setProcessing(requestId)
    
    try {
      const request = requests.find(r => r.id === requestId)
      if (!request) return

      if (action === 'accept') {
        // Update the original request
        const { error: updateError } = await supabase
          .from('friendships')
          .update({ 
            status: 'accepted',
            accepted_at: new Date().toISOString()
          })
          .eq('id', requestId)

        if (updateError) throw updateError

        // Create reverse friendship
        const { error: reverseError } = await supabase
          .from('friendships')
          .insert({
            user_id: currentUserId,
            friend_id: request.requester_id,
            status: 'accepted',
            accepted_at: new Date().toISOString()
          })

        if (reverseError) throw reverseError

        // Send notification
        await supabase
          .from('notifications')
          .insert({
            user_id: request.requester_id,
            type: 'friend_request',
            title: 'Richiesta di amicizia accettata',
            message: `${currentUserId} ha accettato la tua richiesta di amicizia!`,
            data: { friend_id: currentUserId }
          })
      } else {
        // Reject the request
        const { error } = await supabase
          .from('friendships')
          .update({ status: 'rejected' })
          .eq('id', requestId)

        if (error) throw error
      }

      // Remove from local state
      setRequests(prev => prev.filter(r => r.id !== requestId))
      onRequestHandled()
    } catch (error) {
      console.error('Error handling request:', error)
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <UserCheck className="w-12 h-12 text-gray-600 mx-auto mb-2" />
        <p className="text-gray-400">Nessuna richiesta di amicizia</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <motion.div
          key={request.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gray-800/50 rounded-lg"
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative">
              {request.requester_profile.avatar_url ? (
                <img 
                  src={request.requester_profile.avatar_url} 
                  alt={request.requester_profile.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {request.requester_profile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-white">
                  {request.requester_profile.display_name || request.requester_profile.username}
                </h3>
                <span className="text-sm text-gray-400">
                  @{request.requester_profile.username}
                </span>
              </div>
              
              <p className="text-sm text-gray-400 mb-2">
                {request.message || 'Ti ha inviato una richiesta di amicizia'}
              </p>

              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <span>Level {request.requester_stats?.level || 1}</span>
                <span>{request.requester_stats?.total_xp?.toLocaleString() || 0} XP</span>
                <span>{new Date(request.created_at).toLocaleDateString()}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="gradient"
                  onClick={() => handleRequest(request.id, 'accept')}
                  disabled={processing === request.id}
                >
                  {processing === request.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-1" />
                  )}
                  Accetta
                </Button>
                
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleRequest(request.id, 'reject')}
                  disabled={processing === request.id}
                >
                  <X className="w-4 h-4 mr-1" />
                  Rifiuta
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ====================================
// FRIENDS LIST COMPONENT
// ====================================
const FriendsList = ({ 
  currentUserId,
  onChallengeClick 
}: { 
  currentUserId: string
  onChallengeClick: (friendId: string) => void
}) => {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'level' | 'last_seen'>('name')
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadFriends()
    
    // Set up realtime subscription for online status
    const channel = supabase
      .channel('friend-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          // Update friend online status
          setFriends(prev => 
            prev.map(friend => 
              friend.friend_profile.id === payload.new.id
                ? {
                    ...friend,
                    friend_profile: {
                      ...friend.friend_profile,
                      is_online: payload.new.is_online,
                      last_seen: payload.new.last_seen
                    }
                  }
                : friend
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId])

  const loadFriends = async () => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          accepted_at,
          friend_profile:profiles!friend_id (
            id,
            username,
            display_name,
            avatar_url,
            bio,
            is_online,
            last_seen
          ),
          friend_stats:user_stats!friend_id (
            level,
            total_xp,
            win_streak,
            total_duels,
            duels_won
          )
        `)
        .eq('user_id', currentUserId)
        .eq('status', 'accepted')
        .order('accepted_at', { ascending: false })

      if (error) throw error

      setFriends(data as any || [])
    } catch (error) {
      console.error('Error loading friends:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedFriends = friends
    .filter(friend => {
      if (filter === 'online') return friend.friend_profile.is_online
      if (filter === 'offline') return !friend.friend_profile.is_online
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.friend_profile.display_name || a.friend_profile.username)
            .localeCompare(b.friend_profile.display_name || b.friend_profile.username)
        case 'level':
          return (b.friend_stats?.level || 0) - (a.friend_stats?.level || 0)
        case 'last_seen':
          return new Date(b.friend_profile.last_seen).getTime() - 
                 new Date(a.friend_profile.last_seen).getTime()
        default:
          return 0
      }
    })

  const getWinRate = (stats: any) => {
    if (!stats || stats.total_duels === 0) return 0
    return Math.round((stats.duels_won / stats.total_duels) * 100)
  }

  const formatLastSeen = (lastSeen: string, isOnline: boolean) => {
    if (isOnline) return 'Online ora'
    
    const date = new Date(lastSeen)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMinutes < 60) return `${diffMinutes}m fa`
    if (diffHours < 24) return `${diffHours}h fa`
    if (diffDays < 7) return `${diffDays}g fa`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters and Sort */}
      <div className="flex flex-wrap gap-2 justify-between">
        <div className="flex gap-2">
          {(['all', 'online', 'offline'] as const).map((filterOption) => (
            <Button
              key={filterOption}
              size="sm"
              variant={filter === filterOption ? 'gradient' : 'ghost'}
              onClick={() => setFilter(filterOption)}
            >
              {filterOption === 'all' && <Users className="w-4 h-4 mr-1" />}
              {filterOption === 'online' && <Eye className="w-4 h-4 mr-1" />}
              {filterOption === 'offline' && <EyeOff className="w-4 h-4 mr-1" />}
              {filterOption === 'all' ? 'Tutti' : 
               filterOption === 'online' ? 'Online' : 'Offline'}
              {filterOption !== 'all' && (
                <span className="ml-1 text-xs">
                  ({friends.filter(f => 
                    filterOption === 'online' ? f.friend_profile.is_online : !f.friend_profile.is_online
                  ).length})
                </span>
              )}
            </Button>
          ))}
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const sortOptions = ['name', 'level', 'last_seen'] as const
            const currentIndex = sortOptions.indexOf(sortBy)
            const nextIndex = (currentIndex + 1) % sortOptions.length
            setSortBy(sortOptions[nextIndex])
          }}
        >
          <SortAsc className="w-4 h-4 mr-1" />
          {sortBy === 'name' ? 'Nome' : 
           sortBy === 'level' ? 'Livello' : 'Ultimo accesso'}
        </Button>
      </div>

      {/* Friends Grid */}
      {filteredAndSortedFriends.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400">
            {filter === 'all' ? 'Nessun amico ancora' :
             filter === 'online' ? 'Nessun amico online' :
             'Nessun amico offline'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedFriends.map((friend) => (
            <motion.div
              key={friend.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              layout
            >
              <Card 
                variant="glass" 
                className="p-4 hover:bg-gray-800/30 transition-all"
                interactive
              >
                <div className="flex items-start gap-3 mb-3">
                  {/* Avatar with status */}
                  <div className="relative">
                    {friend.friend_profile.avatar_url ? (
                      <img 
                        src={friend.friend_profile.avatar_url} 
                        alt={friend.friend_profile.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {friend.friend_profile.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {/* Online status indicator */}
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-gray-900",
                      friend.friend_profile.is_online ? "bg-green-500" : "bg-gray-500"
                    )} />
                  </div>

                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">
                      {friend.friend_profile.display_name || friend.friend_profile.username}
                    </h3>
                    <p className="text-sm text-gray-400 truncate">
                      @{friend.friend_profile.username}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatLastSeen(friend.friend_profile.last_seen, friend.friend_profile.is_online)}
                    </p>
                  </div>

                  {/* Actions dropdown */}
                  <Button size="sm" variant="ghost">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-white">
                      {friend.friend_stats?.level || 1}
                    </p>
                    <p className="text-xs text-gray-400">Level</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">
                      {getWinRate(friend.friend_stats)}%
                    </p>
                    <p className="text-xs text-gray-400">Win Rate</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">
                      {friend.friend_stats?.win_streak || 0}
                    </p>
                    <p className="text-xs text-gray-400">Streak</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="gradient"
                    className="flex-1"
                    onClick={() => onChallengeClick(friend.friend_id)}
                  >
                    <Swords className="w-4 h-4 mr-1" />
                    Sfida
                  </Button>
                  
                  <Button size="sm" variant="secondary">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ====================================
// MAIN FRIENDS SYSTEM COMPONENT
// ====================================
export const FriendsSystem = ({ 
  currentUserId,
  onChallengeClick 
}: { 
  currentUserId: string
  onChallengeClick?: (friendId: string) => void
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends')
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [requestCount, setRequestCount] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const supabase = createClientComponentClient()

  // Load pending requests count
  useEffect(() => {
    loadRequestCount()
  }, [currentUserId, refreshKey])

  const loadRequestCount = async () => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('id', { count: 'exact' })
        .eq('requested_id', currentUserId)
        .eq('status', 'pending')

      if (error) throw error
      setRequestCount(data?.length || 0)
    } catch (error) {
      console.error('Error loading request count:', error)
    }
  }

  const handleFriendAdded = () => {
    setRefreshKey(prev => prev + 1)
    setShowAddFriend(false)
  }

  const handleRequestHandled = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleChallengeClick = (friendId: string) => {
    if (onChallengeClick) {
      onChallengeClick(friendId)
    } else {
      // Default: navigate to challenges page with friend pre-selected
      window.location.href = `/challenges?friend=${friendId}`
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Amici</h2>
          <p className="text-gray-400">Gestisci i tuoi amici e le sfide private</p>
        </div>
        
        <Button 
          variant="gradient"
          onClick={() => setShowAddFriend(true)}
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Aggiungi Amico
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'friends' ? 'gradient' : 'ghost'}
          onClick={() => setActiveTab('friends')}
        >
          <Users className="w-4 h-4 mr-2" />
          Amici
        </Button>
        
        <Button
          variant={activeTab === 'requests' ? 'gradient' : 'ghost'}
          onClick={() => setActiveTab('requests')}
          className="relative"
        >
          <UserCheck className="w-4 h-4 mr-2" />
          Richieste
          {requestCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold px-1">
              {requestCount > 9 ? '9+' : requestCount}
            </span>
          )}
        </Button>
      </div>

      {/* Tab Content */}
      <Card variant="glass" className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'friends' && (
            <motion.div
              key="friends"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <FriendsList 
                currentUserId={currentUserId}
                onChallengeClick={handleChallengeClick}
              />
            </motion.div>
          )}

          {activeTab === 'requests' && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <FriendRequests 
                currentUserId={currentUserId}
                onRequestHandled={handleRequestHandled}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Add Friend Modal */}
      <FriendSearch
        isOpen={showAddFriend}
        onClose={() => setShowAddFriend(false)}
        currentUserId={currentUserId}
        onFriendAdded={handleFriendAdded}
      />
    </div>
  )
}

// ====================================
// FRIENDS CONSTANTS (for constants.ts)
// ====================================
export const FRIENDS_CONSTANTS = {
  FRIEND_STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    BLOCKED: 'blocked',
    REJECTED: 'rejected',
  } as const,

  FRIEND_PRIVACY: {
    PUBLIC: 'public',      // Chiunque può inviarmi richieste
    FRIENDS: 'friends',    // Solo amici di amici
    PRIVATE: 'private',    // Nessuno può inviarmi richieste
  } as const,

  FRIEND_NOTIFICATIONS: {
    REQUEST_SENT: 'friend_request_sent',
    REQUEST_RECEIVED: 'friend_request_received', 
    REQUEST_ACCEPTED: 'friend_request_accepted',
    FRIEND_ONLINE: 'friend_online',
    FRIEND_CHALLENGE: 'friend_challenge',
  } as const,

  SUCCESS_MESSAGES: {
    FRIEND_ADDED: 'Richiesta di amicizia inviata!',
    FRIEND_ACCEPTED: 'Amico aggiunto con successo!',
    FRIEND_REMOVED: 'Amico rimosso dalla lista',
    REQUEST_SENT: 'Richiesta inviata con successo!',
  } as const,

  ERROR_MESSAGES: {
    ALREADY_FRIENDS: 'Siete già amici!',
    REQUEST_PENDING: 'Richiesta già inviata',
    USER_NOT_FOUND: 'Utente non trovato',
    SELF_ADD: 'Non puoi aggiungere te stesso!',
    PRIVACY_BLOCKED: 'Questo utente non accetta richieste',
  } as const
}

// Export everything
export default FriendsSystem