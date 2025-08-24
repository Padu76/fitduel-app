'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'

interface Friend {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  xp: number
  level: number
  is_online: boolean
}

interface ChallengeFriendsModalProps {
  isOpen: boolean
  onClose: () => void
  currentUserId: string
  currentUserXp: number
  onChallengeSuccess: (challengedUser: Friend, wagerXp: number) => void
}

export default function ChallengeFriendsModal({
  isOpen,
  onClose,
  currentUserId,
  currentUserXp,
  onChallengeSuccess
}: ChallengeFriendsModalProps) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [wagerAmount, setWagerAmount] = useState<number>(10)
  const [challengeMessage, setChallengeMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Load friends when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFriends()
    }
  }, [isOpen])

  const loadFriends = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get user's friends from friendships table
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select(`
          friend_id,
          profiles!friendships_friend_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            xp,
            level,
            last_seen
          )
        `)
        .eq('user_id', currentUserId)
        .eq('status', 'accepted')

      if (friendshipsError) throw friendshipsError

      // Format friends data
      const formattedFriends: Friend[] = (friendships || []).map((friendship: any) => ({
        id: friendship.profiles.id,
        username: friendship.profiles.username,
        display_name: friendship.profiles.display_name,
        avatar_url: friendship.profiles.avatar_url,
        xp: friendship.profiles.xp || 0,
        level: friendship.profiles.level || 1,
        is_online: friendship.profiles.last_seen 
          ? (new Date(friendship.profiles.last_seen) > new Date(Date.now() - 5 * 60 * 1000))
          : false
      }))

      setFriends(formattedFriends)
    } catch (err: any) {
      console.error('Error loading friends:', err)
      setError('Failed to load friends')
    } finally {
      setLoading(false)
    }
  }

  const handleSendChallenge = async () => {
    if (!selectedFriend) return

    try {
      setSubmitting(true)
      setError(null)

      // Validate wager amount
      if (wagerAmount <= 0 || wagerAmount > currentUserXp) {
        setError('Invalid wager amount')
        return
      }

      // Create challenge in database
      const { data, error } = await supabase
        .from('challenges')
        .insert({
          challenger_id: currentUserId,
          challenged_id: selectedFriend.id,
          wager_xp: wagerAmount,
          message: challengeMessage.trim() || null,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Create notification for challenged user
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedFriend.id,
          type: 'challenge_received',
          title: 'New Challenge!',
          message: `${selectedFriend.display_name || selectedFriend.username} challenged you to a duel!`,
          data: {
            challenge_id: data.id,
            challenger_id: currentUserId,
            wager_xp: wagerAmount
          }
        })

      // Success callback
      onChallengeSuccess(selectedFriend, wagerAmount)
      
      // Reset form and close
      resetForm()
      onClose()
    } catch (err: any) {
      console.error('Error sending challenge:', err)
      setError('Failed to send challenge')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedFriend(null)
    setWagerAmount(10)
    setChallengeMessage('')
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Challenge Friends
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Friends List */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Friend to Challenge
            </label>
            
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-16 rounded-lg" />
                ))}
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No friends available to challenge</p>
                <p className="text-sm mt-1">Add some friends first!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => setSelectedFriend(friend)}
                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                      selectedFriend?.id === friend.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative">
                      {friend.avatar_url ? (
                        <img
                          src={friend.avatar_url}
                          alt={friend.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {friend.display_name?.[0] || friend.username[0]}
                        </div>
                      )}
                      {/* Online status */}
                      {friend.is_online && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                      )}
                    </div>

                    {/* Friend Info */}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {friend.display_name || friend.username}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>Level {friend.level}</span>
                        <span>•</span>
                        <span>{friend.xp} XP</span>
                        {friend.is_online && (
                          <>
                            <span>•</span>
                            <span className="text-green-500">Online</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Wager Amount */}
          {selectedFriend && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Wager Amount (XP)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={wagerAmount}
                    onChange={(e) => setWagerAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max={currentUserXp}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    Max: {currentUserXp}
                  </div>
                </div>
              </div>

              {/* Challenge Message */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Challenge Message (Optional)
                </label>
                <textarea
                  value={challengeMessage}
                  onChange={(e) => setChallengeMessage(e.target.value)}
                  placeholder="Add a personal message to your challenge..."
                  maxLength={200}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                  {challengeMessage.length}/200
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSendChallenge}
            disabled={!selectedFriend || submitting || wagerAmount <= 0 || wagerAmount > currentUserXp}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Sending...</span>
              </div>
            ) : (
              'Send Challenge'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}