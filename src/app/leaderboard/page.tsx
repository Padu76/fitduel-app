'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Trophy, Medal, Award, Star, Crown, Zap, Target, Flame, 
  TrendingUp, Users, Timer, ChevronLeft, Filter, Calendar,
  BarChart3, ArrowUp, ArrowDown, Minus, Swords, Activity,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

// ====================================
// TYPES
// ====================================
interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  displayName?: string
  avatarUrl?: string
  level: number
  xp: number
  totalWins: number
  totalLosses: number
  winRate: number
  currentStreak: number
  maxStreak: number
  totalDuels: number
  weeklyXP?: number
  monthlyXP?: number
  favoriteExercise?: string
  joinedAt: string
  lastActive: string
  isCurrentUser?: boolean
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[]
  userPosition?: {
    rank: number
    entry: LeaderboardEntry
  }
  metadata: {
    type: string
    timeframe: string
    totalEntries: number
    limit: number
    offset: number
    generatedAt: string
  }
  stats?: {
    topXP: number
    topLevel: number
    topWins: number
    topStreak: number
    averageLevel: number
    totalActivePlayers: number
  }
}

// ====================================
// MOCK AVATARS
// ====================================
const getAvatar = (username: string) => {
  const avatars = ['💪', '🏋️', '⚡', '🤸', '🏃', '🥊', '🎯', '🔥', '💯', '👊']
  const index = username.charCodeAt(0) % avatars.length
  return avatars[index]
}

// ====================================
// COMPONENTS
// ====================================
const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) {
    return (
      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/30">
        <Crown className="w-5 h-5 text-white" />
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center shadow-lg shadow-gray-400/30">
        <Medal className="w-5 h-5 text-white" />
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30">
        <Award className="w-5 h-5 text-white" />
      </div>
    )
  }
  
  return (
    <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
      <span className="text-sm font-bold text-gray-400">#{rank}</span>
    </div>
  )
}

const LeaderboardRow = ({ entry, index }: { entry: LeaderboardEntry; index: number }) => {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card 
        variant="glass" 
        className={cn(
          'p-4 transition-all duration-300',
          entry.isCurrentUser && 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/30',
          'hover:bg-gray-800/30'
        )}
      >
        <div className="flex items-center justify-between">
          {/* Left: Rank & User Info */}
          <div className="flex items-center gap-4">
            <RankBadge rank={entry.rank} />
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-xl">
                {entry.avatarUrl || getAvatar(entry.username)}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white">{entry.displayName || entry.username}</p>
                  {entry.isCurrentUser && (
                    <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full">
                      Tu
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span>Livello {entry.level}</span>
                  <span>•</span>
                  <span>{entry.totalDuels} duelli</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center hidden sm:block">
              <p className="text-xs text-gray-500">Win Rate</p>
              <p className="text-lg font-bold text-white">{entry.winRate}%</p>
            </div>
            
            <div className="text-center hidden md:block">
              <p className="text-xs text-gray-500">Streak</p>
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <p className="text-lg font-bold text-white">{entry.currentStreak}</p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-gray-500">XP Totali</p>
              <p className="text-xl font-bold text-yellow-500">{entry.xp.toLocaleString()}</p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="sm:hidden"
            >
              <ChevronDown className={cn(
                'w-4 h-4 transition-transform',
                expanded && 'rotate-180'
              )} />
            </Button>
          </div>
        </div>

        {/* Expanded Stats (mobile) */}
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-3 gap-4 sm:hidden"
          >
            <div className="text-center">
              <p className="text-xs text-gray-500">Win Rate</p>
              <p className="font-bold text-white">{entry.winRate}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Streak</p>
              <p className="font-bold text-white">{entry.currentStreak}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Vittorie</p>
              <p className="font-bold text-white">{entry.totalWins}</p>
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  )
}

const StatCard = ({ icon: Icon, label, value, color }: {
  icon: any
  label: string
  value: string | number
  color: string
}) => {
  return (
    <Card variant="glass" className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          color
        )}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-lg font-bold text-white">{value}</p>
        </div>
      </div>
    </Card>
  )
}

// ====================================
// MAIN COMPONENT
// ====================================
export default function LeaderboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [leaderboardType, setLeaderboardType] = useState<string>('xp')
  const [timeframe, setTimeframe] = useState<string>('all')
  const [currentUserId, setCurrentUserId] = useState<string>('')

  useEffect(() => {
    // Get user from localStorage
    const savedUser = localStorage.getItem('fitduel_user')
    if (!savedUser) {
      router.push('/login')
      return
    }
    const user = JSON.parse(savedUser)
    setCurrentUserId(user.id)
  }, [router])

  useEffect(() => {
    if (currentUserId) {
      fetchLeaderboard()
    }
  }, [leaderboardType, timeframe, currentUserId])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        type: leaderboardType,
        timeframe: timeframe,
        userId: currentUserId,
        limit: '50'
      })

      const response = await fetch(`/api/leaderboard?${params}`)
      const result = await response.json()

      if (result.success && result.data) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'xp': return 'XP Totali'
      case 'level': return 'Livello'
      case 'wins': return 'Vittorie'
      case 'streak': return 'Streak Attuale'
      case 'weekly': return 'XP Settimanali'
      case 'monthly': return 'XP Mensili'
      default: return type
    }
  }

  const getTimeframeLabel = (tf: string) => {
    switch (tf) {
      case 'all': return 'Sempre'
      case 'week': return 'Settimana'
      case 'month': return 'Mese'
      case 'year': return 'Anno'
      default: return tf
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Caricamento classifica...</p>
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
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Classifica</h1>
                <p className="text-sm text-gray-400">
                  {data?.metadata.totalEntries || 0} giocatori attivi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Your Position */}
        {data?.userPosition && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card variant="glass" className="p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
              <h2 className="text-lg font-bold text-white mb-4">La Tua Posizione</h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <RankBadge rank={data.userPosition.rank} />
                  <div>
                    <p className="text-2xl font-bold text-white">#{data.userPosition.rank}</p>
                    <p className="text-sm text-gray-400">nella classifica {getTypeLabel(leaderboardType)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-xs text-gray-500">XP</p>
                    <p className="text-lg font-bold text-yellow-500">{data.userPosition.entry.xp}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Livello</p>
                    <p className="text-lg font-bold text-white">{data.userPosition.entry.level}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Win Rate</p>
                    <p className="text-lg font-bold text-green-500">{data.userPosition.entry.winRate}%</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Global Stats */}
        {data?.stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <StatCard 
                icon={Zap} 
                label="Top XP" 
                value={data.stats.topXP.toLocaleString()}
                color="bg-gradient-to-br from-yellow-500 to-orange-500"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <StatCard 
                icon={Star} 
                label="Top Level" 
                value={data.stats.topLevel}
                color="bg-gradient-to-br from-purple-500 to-pink-500"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <StatCard 
                icon={Trophy} 
                label="Top Vittorie" 
                value={data.stats.topWins}
                color="bg-gradient-to-br from-green-500 to-teal-500"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <StatCard 
                icon={Flame} 
                label="Top Streak" 
                value={data.stats.topStreak}
                color="bg-gradient-to-br from-red-500 to-orange-500"
              />
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Tipo:</span>
            <div className="flex gap-2">
              {['xp', 'level', 'wins', 'streak'].map(type => (
                <Button
                  key={type}
                  variant={leaderboardType === type ? 'gradient' : 'secondary'}
                  size="sm"
                  onClick={() => setLeaderboardType(type)}
                >
                  {getTypeLabel(type)}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-400">Periodo:</span>
            <div className="flex gap-2">
              {['all', 'week', 'month'].map(tf => (
                <Button
                  key={tf}
                  variant={timeframe === tf ? 'gradient' : 'secondary'}
                  size="sm"
                  onClick={() => setTimeframe(tf)}
                >
                  {getTimeframeLabel(tf)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-3">
          {data?.leaderboard.map((entry, index) => (
            <LeaderboardRow key={entry.userId} entry={entry} index={index} />
          ))}
        </div>

        {/* Load More */}
        {data && data.leaderboard.length < data.metadata.totalEntries && (
          <div className="text-center mt-8">
            <Button variant="secondary">
              Carica Altri
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}