'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUserStore } from '@/stores/useUserStore'
import { useDuelStore } from '@/stores/useDuelStore'
import { useGameStore } from '@/stores/useGameStore'
import { LogOut, Settings, User, Trophy, Target, Zap, Menu, X } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user, isAuthenticated, setUser, clearUser } = useUserStore()
  const { myDuels, fetchMyDuels, totalDuelsWon, totalDuelsLost } = useDuelStore()
  const { totalExercises, averageFormScore, streakDays, totalCalories } = useGameStore()
  const [isLoading, setIsLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log('✅ Authenticated:', session.user.email)
          
          if (!user) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User',
              avatar: session.user.user_metadata?.avatar_url,
              level: session.user.user_metadata?.level || 1,
              xp: session.user.user_metadata?.xp || 0,
              totalXp: session.user.user_metadata?.totalXp || 0,
              coins: session.user.user_metadata?.coins || 100,
              rank: session.user.user_metadata?.rank || 'Rookie',
              fitnessLevel: session.user.user_metadata?.fitnessLevel || 'beginner',
              goals: [],
              newsletter: false,
              createdAt: session.user.created_at || new Date().toISOString()
            })
          }
          
          if (session.user.id) {
            fetchMyDuels(session.user.id)
          }
          
          setIsLoading(false)
          return
        }

        if (isAuthenticated && user) {
          console.log('✅ Authenticated via store')
          setIsLoading(false)
          return
        }

        await new Promise(resolve => setTimeout(resolve, 1000))
        
        if (isAuthenticated && user) {
          setIsLoading(false)
          return
        }

        console.log('❌ No auth found')
        router.push('/login')

      } catch (error) {
        console.error('Auth error:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [isAuthenticated, user, router, setUser, fetchMyDuels, supabase])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      clearUser()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  const winRate = totalDuelsWon + totalDuelsLost > 0 
    ? Math.round((totalDuelsWon / (totalDuelsWon + totalDuelsLost)) * 100) 
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-black">
      {/* Header with Menu */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {user?.username || 'Warrior'}
                </h1>
                <p className="text-sm text-purple-400">Level {user?.level || 1}</p>
              </div>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-4 mr-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">{user?.coins || 0}</p>
                  <p className="text-xs text-gray-400">Coins</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">{user?.xp || 0}</p>
                  <p className="text-xs text-gray-400">XP</p>
                </div>
              </div>
              
              <button
                onClick={() => router.push('/profile')}
                className="p-2 hover:bg-purple-900/30 rounded-lg transition-colors"
                title="Profile"
              >
                <User className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
              
              <button
                onClick={() => router.push('/profile')}
                className="p-2 hover:bg-purple-900/30 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
              
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-900/30 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-gray-400 hover:text-red-400" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="md:hidden p-2"
            >
              {showMenu ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {showMenu && (
            <div className="md:hidden mt-4 py-4 border-t border-purple-500/20">
              <div className="flex justify-around mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">{user?.coins || 0}</p>
                  <p className="text-xs text-gray-400">Coins</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">{user?.xp || 0}</p>
                  <p className="text-xs text-gray-400">XP</p>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => { router.push('/profile'); setShowMenu(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-purple-900/30 rounded-lg transition-colors"
                >
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-white">Profile</span>
                </button>
                <button
                  onClick={() => { router.push('/profile'); setShowMenu(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-purple-900/30 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5 text-gray-400" />
                  <span className="text-white">Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5 text-red-400" />
                  <span className="text-red-400">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Stats Overview */}
          <div className="bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/40 transition-all">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Trophy className="w-6 h-6 mr-2 text-yellow-400" />
              Performance Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Exercises</span>
                <span className="text-white font-bold">{totalExercises}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Form Score</span>
                <span className="text-green-400 font-bold">{averageFormScore || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Current Streak</span>
                <span className="text-orange-400 font-bold">{streakDays} days 🔥</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Calories Burned</span>
                <span className="text-red-400 font-bold">{totalCalories} kcal</span>
              </div>
            </div>
          </div>

          {/* Duel Stats */}
          <div className="bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/40 transition-all">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Zap className="w-6 h-6 mr-2 text-purple-400" />
              Duel Record
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Wins</span>
                <span className="text-green-400 font-bold">{totalDuelsWon}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Losses</span>
                <span className="text-red-400 font-bold">{totalDuelsLost}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Win Rate</span>
                <span className="text-purple-400 font-bold">{winRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Active Duels</span>
                <span className="text-yellow-400 font-bold">
                  {myDuels.filter(d => d.status === 'active').length}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/40 transition-all">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Target className="w-6 h-6 mr-2 text-green-400" />
              Quick Start
            </h3>
            <div className="space-y-3">
              <button 
                onClick={() => router.push('/training')}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
              >
                Start Training
              </button>
              <button 
                onClick={() => router.push('/challenges')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-2 px-4 rounded-lg transition-all"
              >
                Find Duel
              </button>
              <button 
                onClick={() => router.push('/tournament')}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-semibold py-2 px-4 rounded-lg transition-all"
              >
                Join Tournament
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 md:col-span-2 lg:col-span-3 hover:border-purple-500/40 transition-all">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Duels</h3>
            {myDuels.length > 0 ? (
              <div className="space-y-2">
                {myDuels.slice(0, 5).map((duel) => (
                  <div 
                    key={duel.id}
                    onClick={() => router.push(`/duel/${duel.id}`)}
                    className="flex items-center justify-between p-3 rounded-lg bg-black/30 hover:bg-purple-900/20 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{duel.exerciseIcon || '💪'}</div>
                      <div>
                        <p className="text-white font-medium">
                          {duel.exerciseName || 'Challenge'}
                        </p>
                        <p className="text-xs text-gray-400">
                          vs {duel.challengedUsername || 'Open Challenge'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-semibold px-2 py-1 rounded ${
                        duel.status === 'completed' ? 'bg-green-900/50 text-green-400' :
                        duel.status === 'active' ? 'bg-yellow-900/50 text-yellow-400' :
                        duel.status === 'pending' ? 'bg-blue-900/50 text-blue-400' :
                        'bg-gray-900/50 text-gray-400'
                      }`}>
                        {duel.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {duel.wager_coins} coins
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">No duels yet!</p>
                <button 
                  onClick={() => router.push('/challenges')}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Start Your First Duel
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Bottom Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <button 
            onClick={() => router.push('/leaderboard')}
            className="bg-black/40 border border-purple-500/20 hover:bg-purple-900/20 text-white py-3 px-4 rounded-lg transition-all flex items-center justify-center"
          >
            🏆 Leaderboard
          </button>
          <button 
            onClick={() => router.push('/achievements')}
            className="bg-black/40 border border-purple-500/20 hover:bg-purple-900/20 text-white py-3 px-4 rounded-lg transition-all flex items-center justify-center"
          >
            🎖️ Achievements
          </button>
          <button 
            onClick={() => router.push('/missions')}
            className="bg-black/40 border border-purple-500/20 hover:bg-purple-900/20 text-white py-3 px-4 rounded-lg transition-all flex items-center justify-center"
          >
            🎯 Missions
          </button>
          <button 
            onClick={() => router.push('/friends')}
            className="bg-black/40 border border-purple-500/20 hover:bg-purple-900/20 text-white py-3 px-4 rounded-lg transition-all flex items-center justify-center"
          >
            👥 Friends
          </button>
        </div>
      </div>
    </div>
  )
}