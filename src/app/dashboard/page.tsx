'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '../../stores/useUserStore'
import { useDuelStore } from '../../stores/useDuelStore'
import { useGameStore } from '../../stores/useGameStore'
import { LogOut, Settings, Activity, Target, Award, TrendingUp } from 'lucide-react'

// Simple Card Component
const Card = ({ className, children, ...props }: any) => (
  <div className={`rounded-lg ${className}`} {...props}>
    {children}
  </div>
)

// Simple Button Component  
const Button = ({ className, children, variant, onClick, ...props }: any) => (
  <button 
    className={`px-4 py-2 rounded-lg font-medium transition-all ${
      variant === 'ghost' 
        ? 'hover:bg-gray-700' 
        : 'bg-purple-600 hover:bg-purple-700 text-white'
    } ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
)

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, setUser, clearUser } = useUserStore()
  const { myDuels, fetchMyDuels, totalDuelsWon, totalDuelsLost } = useDuelStore()
  const { totalExercises, averageFormScore, streakDays, totalCalories } = useGameStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Simulate auth check
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('fitduel-user-storage')
          if (storedUser) {
            const userData = JSON.parse(storedUser)
            if (userData.state?.user && userData.state?.isAuthenticated) {
              console.log('✅ User found in storage')
              setIsLoading(false)
              return
            }
          }
        }

        if (isAuthenticated && user) {
          console.log('✅ Authenticated via store')
          if (user.id) {
            fetchMyDuels(user.id)
          }
          setIsLoading(false)
          return
        }

        // Wait a bit for store to hydrate
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        if (isAuthenticated && user) {
          setIsLoading(false)
          return
        }

        console.log('❌ No auth found, redirecting to login')
        router.push('/login')

      } catch (error) {
        console.error('Auth error:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [isAuthenticated, user, router, setUser, fetchMyDuels])

  const handleLogout = async () => {
    try {
      clearUser()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fitduel-user-storage')
      }
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
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Welcome back, {user?.username || 'Warrior'}!
                </h1>
                <p className="text-purple-400">Level {user?.level || 1} • {user?.rank || 'Rookie'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-400">{user?.coins || 0}</p>
                <p className="text-xs text-gray-400">Coins</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-400">{user?.xp || 0}</p>
                <p className="text-xs text-gray-400">XP</p>
              </div>
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
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Stats Overview */}
          <Card className="bg-black/40 backdrop-blur-sm border border-purple-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="text-2xl mr-2">📊</span> Performance Stats
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
          </Card>

          {/* Duel Stats */}
          <Card className="bg-black/40 backdrop-blur-sm border border-purple-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="text-2xl mr-2">⚔️</span> Duel Record
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
                  {myDuels?.filter(d => d.status === 'active').length || 0}
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-black/40 backdrop-blur-sm border border-purple-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="text-2xl mr-2">🚀</span> Quick Start
            </h3>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/training')}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600"
              >
                Start Training
              </Button>
              <Button 
                onClick={() => router.push('/challenges')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              >
                Find Duel
              </Button>
              <Button 
                onClick={() => router.push('/calibration')}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
              >
                🎯 Calibration AI
              </Button>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-black/40 backdrop-blur-sm border border-purple-500/20 p-6 md:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="text-2xl mr-2">📜</span> Recent Duels
            </h3>
            {myDuels && myDuels.length > 0 ? (
              <div className="space-y-2">
                {myDuels.slice(0, 5).map((duel: any) => (
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
                <Button 
                  onClick={() => router.push('/challenges')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Start Your First Duel
                </Button>
              </div>
            )}
          </Card>

          {/* Level Progress */}
          <Card className="bg-black/40 backdrop-blur-sm border border-purple-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="text-2xl mr-2">📈</span> Progress
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Level {user?.level || 1}</span>
                <span className="text-purple-400">Level {(user?.level || 1) + 1}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                  style={{ width: `${((user?.xp || 0) % 100)}%` }}
                />
              </div>
              <p className="text-center text-xs text-gray-400">
                {user?.xp || 0} / 100 XP
              </p>
            </div>
          </Card>

        </div>

        {/* Bottom Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Button 
            onClick={() => router.push('/leaderboard')}
            variant="ghost"
            className="border border-purple-500/30 hover:bg-purple-900/20 bg-transparent text-white"
          >
            🏆 Leaderboard
          </Button>
          <Button 
            onClick={() => router.push('/achievements')}
            variant="ghost"
            className="border border-purple-500/30 hover:bg-purple-900/20 bg-transparent text-white"
          >
            🎖️ Achievements
          </Button>
          <Button 
            onClick={() => router.push('/missions')}
            variant="ghost"
            className="border border-purple-500/30 hover:bg-purple-900/20 bg-transparent text-white"
          >
            🎯 Missions
          </Button>
          <Button 
            onClick={() => router.push('/profile')}
            variant="ghost"
            className="border border-purple-500/30 hover:bg-purple-900/20 bg-transparent text-white"
          >
            👤 Profile
          </Button>
        </div>
      </div>
    </div>
  )
}