'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Trophy, Zap, Users, Target, Sparkles, Timer, Shield, TrendingUp, 
  Swords, Flame, Medal, Crown, Bell, LogOut, User, Plus, Activity,
  Calendar, ChevronRight, Loader2, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { XPBar } from '@/components/game/XPBar'
import { DuelCard } from '@/components/game/DuelCard'
import { useUser, useNotifications, useDuels, auth, db } from '@/lib/supabase-client'

export default function HomePage() {
  const router = useRouter()
  const { user, profile, stats, loading: userLoading } = useUser()
  const { notifications, unreadCount } = useNotifications()
  const { myDuels, openDuels, loading: duelsLoading } = useDuels()
  
  const [recentPerformances, setRecentPerformances] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true)

  // Check authentication
  useEffect(() => {
    if (!userLoading && !user) {
      // User not logged in - show landing page
      return
    }
  }, [user, userLoading])

  // Fetch additional data for logged-in users
  useEffect(() => {
    if (user) {
      // Fetch recent performances
      db.performances.getMyPerformances(user.id, 5).then(setRecentPerformances).catch(console.error)
      
      // Fetch leaderboard
      db.leaderboard.getGlobal('weekly').then(data => {
        setLeaderboard(data)
        setLoadingLeaderboard(false)
      }).catch(error => {
        console.error('Error fetching leaderboard:', error)
        setLoadingLeaderboard(false)
      })
    }
  }, [user])

  const handleLogout = async () => {
    await auth.signOut()
    router.push('/login')
  }

  // Calculate stats
  const activeDuels = myDuels.filter(d => d.status === 'active').length
  const pendingDuels = myDuels.filter(d => d.status === 'pending').length
  const winRate = stats && stats.total_duels > 0 
    ? Math.round((stats.duels_won / stats.total_duels) * 100) 
    : 0

  // Loading state
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Caricamento...</p>
        </div>
      </div>
    )
  }

  // Landing page for non-authenticated users
  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-950">
        {/* Original landing page content */}
        <div className="container mx-auto px-4 py-6">
          <nav className="flex justify-between items-center mb-16">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Swords className="w-8 h-8 text-indigo-500" />
                <Flame className="w-4 h-4 text-orange-500 absolute -top-1 -right-1" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                FitDuel
              </span>
            </div>
            <div className="flex gap-4">
              <Link href="/login" className="px-4 py-2 text-gray-300 hover:text-white transition">
                Accedi
              </Link>
              <Link href="/register" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition transform hover:scale-105">
                Inizia a Sfidare
              </Link>
            </div>
          </nav>

          {/* Hero Section */}
          <div className="max-w-6xl mx-auto text-center py-20">
            <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-indigo-400">Nuovo: Tornei Settimanali con Premi Reali!</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Sfida. Allenati.
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Domina.
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Trasforma ogni workout in un duello epico. Sfida amici e rivali, 
              conquista la classifica, diventa il campione definitivo del fitness!
            </p>
            
            <div className="flex gap-4 justify-center">
              <Link href="/register" className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl font-bold text-lg transition transform hover:scale-105 shadow-lg shadow-indigo-500/25 flex items-center gap-2">
                Accetta la Sfida
                <Swords className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Dashboard for authenticated users
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-950">
      {/* Navbar */}
      <div className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Swords className="w-8 h-8 text-indigo-500" />
              <Flame className="w-4 h-4 text-orange-500 absolute -top-1 -right-1" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              FitDuel
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-white transition">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <Link href="/profile" className="flex items-center gap-2 text-gray-300 hover:text-white transition">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span className="font-medium">{profile?.username || 'User'}</span>
              </Link>
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-white transition">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </nav>

        {/* Welcome Section */}
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Bentornato, <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {profile?.display_name || profile?.username}!
              </span>
            </h1>
            <p className="text-gray-400">
              {stats?.daily_streak ? `🔥 ${stats.daily_streak} giorni di streak!` : 'Inizia il tuo streak oggi!'}
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card variant="glass" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <span className="text-2xl font-bold">{stats?.level || 1}</span>
              </div>
              <p className="text-sm text-gray-400 mb-2">Livello</p>
              <XPBar currentXP={stats?.total_xp || 0} size="sm" />
            </Card>

            <Card variant="glass" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Swords className="w-8 h-8 text-indigo-500" />
                <span className="text-2xl font-bold">{activeDuels}</span>
              </div>
              <p className="text-sm text-gray-400">Duelli Attivi</p>
              {pendingDuels > 0 && (
                <p className="text-xs text-indigo-400 mt-1">+{pendingDuels} in attesa</p>
              )}
            </Card>

            <Card variant="glass" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Medal className="w-8 h-8 text-green-500" />
                <span className="text-2xl font-bold">{winRate}%</span>
              </div>
              <p className="text-sm text-gray-400">Win Rate</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.duels_won || 0}W - {stats?.duels_lost || 0}L
              </p>
            </Card>

            <Card variant="glass" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Flame className="w-8 h-8 text-orange-500" />
                <span className="text-2xl font-bold">{stats?.total_calories || 0}</span>
              </div>
              <p className="text-sm text-gray-400">Calorie Bruciate</p>
              <p className="text-xs text-gray-500 mt-1">Totale</p>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link href="/challenges">
              <Card variant="glass" className="p-6 hover:border-indigo-500 transition cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-1">Crea Duello</h3>
                    <p className="text-sm text-gray-400">Sfida un amico o trova un rivale</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center group-hover:bg-indigo-500/30 transition">
                    <Plus className="w-6 h-6 text-indigo-400" />
                  </div>
                </div>
              </Card>
            </Link>

            <Card variant="glass" className="p-6 hover:border-purple-500 transition cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Allenamento Libero</h3>
                  <p className="text-sm text-gray-400">Migliora la tua forma</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition">
                  <Activity className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </Card>

            <Card variant="glass" className="p-6 hover:border-green-500 transition cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Torneo Settimanale</h3>
                  <p className="text-sm text-gray-400">Inizia Lunedì</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition">
                  <Crown className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Active Duels */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">I Tuoi Duelli</h2>
                <Link href="/challenges" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  Vedi tutti
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {duelsLoading ? (
                <Card variant="glass" className="p-8 text-center">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto mb-2" />
                  <p className="text-gray-400">Caricamento duelli...</p>
                </Card>
              ) : myDuels.length > 0 ? (
                <div className="space-y-4">
                  {myDuels.slice(0, 3).map(duel => (
                    <DuelCard
                      key={duel.id}
                      duel={{
                        id: duel.id,
                        type: duel.type as any,
                        status: duel.status as any,
                        exercise: duel.exercise?.name || 'Unknown',
                        opponent: duel.challenged?.username || duel.challenger?.username || 'Unknown',
                        timeLeft: duel.expires_at ? new Date(duel.expires_at).toLocaleString() : '',
                        xpReward: duel.reward_xp,
                        difficulty: duel.difficulty as any
                      }}
                      onClick={() => router.push(`/duel/${duel.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <Card variant="glass" className="p-8 text-center">
                  <Swords className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 mb-4">Nessun duello attivo</p>
                  <Link href="/challenges">
                    <Button variant="gradient" size="sm">
                      Inizia un Duello
                    </Button>
                  </Link>
                </Card>
              )}
            </div>

            {/* Leaderboard */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Classifica</h2>
                <span className="text-xs text-gray-400">Settimanale</span>
              </div>

              <Card variant="glass" className="p-4">
                {loadingLeaderboard ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                  </div>
                ) : leaderboard.length > 0 ? (
                  <div className="space-y-3">
                    {leaderboard.slice(0, 5).map((entry, index) => (
                      <div key={entry.user_id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`font-bold ${
                            index === 0 ? 'text-yellow-500' :
                            index === 1 ? 'text-gray-400' :
                            index === 2 ? 'text-orange-600' :
                            'text-gray-500'
                          }`}>
                            #{index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-sm">{entry.user?.username || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">Level {Math.floor(Math.sqrt(entry.score / 100))}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-indigo-400">{entry.score} XP</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 py-4">Nessun dato disponibile</p>
                )}
              </Card>

              {/* Recent Activity */}
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-3">Attività Recente</h3>
                <Card variant="glass" className="p-4">
                  {recentPerformances.length > 0 ? (
                    <div className="space-y-2">
                      {recentPerformances.slice(0, 3).map(perf => (
                        <div key={perf.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-400">
                              {perf.reps} {perf.exercise_id}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(perf.performed_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 text-sm py-2">Nessuna attività recente</p>
                  )}
                </Card>
              </div>
            </div>
          </div>

          {/* Notifications Alert */}
          {notifications.length > 0 && (
            <div className="fixed bottom-4 right-4 max-w-sm">
              <Card variant="glass" className="p-4 border-indigo-500/50">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-indigo-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{notifications[0].title}</p>
                    <p className="text-xs text-gray-400 mt-1">{notifications[0].message}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}