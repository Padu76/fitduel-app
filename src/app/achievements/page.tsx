'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Trophy, Medal, Award, Star, Crown, Zap, Target, Flame, Shield, 
  Heart, TrendingUp, Users, Timer, CheckCircle, Lock, ChevronLeft,
  Filter, Search, X, Sparkles, Progress
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

// ====================================
// TYPES
// ====================================
interface Achievement {
  id: string
  name: string
  description: string
  category: 'wins' | 'streak' | 'form' | 'participation' | 'special'
  icon: string
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary'
  xpReward: number
  coinsReward: number
  requirement: {
    type: string
    value: number
    condition?: string
  }
  isUnlocked?: boolean
  unlockedAt?: string
  progress?: {
    current: number
    target: number
    percentage: number
  }
}

interface AchievementsData {
  achievements: Achievement[]
  unlockedCount: number
  totalCount: number
  categories: {
    [key: string]: {
      unlocked: number
      total: number
    }
  }
  recentUnlocks?: Achievement[]
  nextToUnlock?: Achievement[]
}

// ====================================
// ICONS MAPPING
// ====================================
const categoryIcons = {
  wins: Trophy,
  streak: Flame,
  form: Sparkles,
  participation: Users,
  special: Star
}

const difficultyConfig = {
  bronze: {
    color: 'from-orange-600 to-orange-700',
    borderColor: 'border-orange-600',
    bgColor: 'bg-orange-950/20',
    textColor: 'text-orange-400',
    label: 'Bronzo'
  },
  silver: {
    color: 'from-gray-400 to-gray-500',
    borderColor: 'border-gray-500',
    bgColor: 'bg-gray-900/30',
    textColor: 'text-gray-400',
    label: 'Argento'
  },
  gold: {
    color: 'from-yellow-500 to-yellow-600',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-950/20',
    textColor: 'text-yellow-400',
    label: 'Oro'
  },
  platinum: {
    color: 'from-cyan-400 to-cyan-500',
    borderColor: 'border-cyan-500',
    bgColor: 'bg-cyan-950/20',
    textColor: 'text-cyan-400',
    label: 'Platino'
  },
  legendary: {
    color: 'from-purple-500 via-pink-500 to-red-500',
    borderColor: 'border-purple-500',
    bgColor: 'bg-purple-950/20',
    textColor: 'text-purple-400',
    label: 'Leggendario'
  }
}

// ====================================
// COMPONENTS
// ====================================
const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
  const difficulty = difficultyConfig[achievement.difficulty]
  const isLocked = !achievement.isUnlocked
  const IconComponent = categoryIcons[achievement.category]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        'relative rounded-xl border-2 p-4 transition-all duration-300',
        isLocked 
          ? 'border-gray-800 bg-gray-900/50' 
          : `${difficulty.borderColor} ${difficulty.bgColor}`,
        !isLocked && 'hover:shadow-lg hover:shadow-current/20'
      )}
    >
      {/* Lock overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl z-10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-gray-600" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            isLocked ? 'bg-gray-800' : `bg-gradient-to-br ${difficulty.color}`
          )}>
            <span className="text-2xl">{achievement.icon}</span>
          </div>
          <div>
            <h3 className={cn(
              'font-bold',
              isLocked ? 'text-gray-500' : 'text-white'
            )}>
              {achievement.name}
            </h3>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full inline-block mt-1',
              isLocked ? 'bg-gray-800 text-gray-600' : `${difficulty.bgColor} ${difficulty.textColor}`
            )}>
              {difficulty.label}
            </span>
          </div>
        </div>
        <IconComponent className={cn(
          'w-5 h-5',
          isLocked ? 'text-gray-700' : difficulty.textColor
        )} />
      </div>

      {/* Description */}
      <p className={cn(
        'text-sm mb-3',
        isLocked ? 'text-gray-600' : 'text-gray-400'
      )}>
        {achievement.description}
      </p>

      {/* Progress */}
      {achievement.progress && !isLocked && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progresso</span>
            <span>{achievement.progress.current}/{achievement.progress.target}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${difficulty.color}`}
              initial={{ width: 0 }}
              animate={{ width: `${achievement.progress.percentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Rewards */}
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-1">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span className={isLocked ? 'text-gray-600' : 'text-yellow-500'}>
            +{achievement.xpReward} XP
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Medal className="w-4 h-4 text-orange-500" />
          <span className={isLocked ? 'text-gray-600' : 'text-orange-500'}>
            +{achievement.coinsReward} Coins
          </span>
        </div>
      </div>

      {/* Unlock date */}
      {achievement.unlockedAt && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <div className="flex items-center gap-1 text-xs text-green-500">
            <CheckCircle className="w-3 h-3" />
            <span>Sbloccato il {new Date(achievement.unlockedAt).toLocaleDateString('it-IT')}</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

const CategoryStats = ({ category, stats }: { category: string; stats: { unlocked: number; total: number } }) => {
  const IconComponent = categoryIcons[category as keyof typeof categoryIcons]
  const percentage = (stats.unlocked / stats.total) * 100

  const getCategoryName = (cat: string) => {
    switch (cat) {
      case 'wins': return 'Vittorie'
      case 'streak': return 'Streak'
      case 'form': return 'Forma'
      case 'participation': return 'Partecipazione'
      case 'special': return 'Speciali'
      default: return cat
    }
  }

  return (
    <Card variant="glass" className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
          <IconComponent className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{getCategoryName(category)}</p>
          <p className="text-xs text-gray-400">{stats.unlocked}/{stats.total} completati</p>
        </div>
        <span className="text-lg font-bold text-white">{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </Card>
  )
}

// ====================================
// MAIN COMPONENT
// ====================================
export default function AchievementsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AchievementsData | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchAchievements()
  }, [selectedCategory, showOnlyUnlocked])

  const fetchAchievements = async () => {
    try {
      setLoading(true)
      
      // Get user from localStorage
      const savedUser = localStorage.getItem('fitduel_user')
      if (!savedUser) {
        router.push('/login')
        return
      }
      
      const user = JSON.parse(savedUser)
      
      // Build query params
      const params = new URLSearchParams({
        userId: user.id,
        category: selectedCategory,
        ...(showOnlyUnlocked && { unlocked: 'true' })
      })

      const response = await fetch(`/api/achievements?${params}`)
      const result = await response.json()

      if (result.success && result.data) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Error fetching achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter achievements by search
  const filteredAchievements = data?.achievements.filter(achievement => 
    achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    achievement.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Caricamento achievements...</p>
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
                <h1 className="text-xl font-bold text-white">Achievements</h1>
                <p className="text-sm text-gray-400">
                  {data?.unlockedCount || 0}/{data?.totalCount || 0} sbloccati
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Cerca achievement..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 hidden md:block"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Overall Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card variant="glass" className="p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Il Tuo Progresso</h2>
                <p className="text-gray-400">Continua così, stai andando alla grande!</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">
                  {data ? Math.round((data.unlockedCount / data.totalCount) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-400">Completato</p>
              </div>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: data ? `${(data.unlockedCount / data.totalCount) * 100}%` : '0%' }}
                transition={{ duration: 1 }}
              />
            </div>
          </Card>
        </motion.div>

        {/* Category Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {data?.categories && Object.entries(data.categories).map(([category, stats], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <CategoryStats category={category} stats={stats} />
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button
            variant={selectedCategory === 'all' ? 'gradient' : 'secondary'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            Tutti
          </Button>
          {['wins', 'streak', 'form', 'participation', 'special'].map(category => {
            const IconComponent = categoryIcons[category as keyof typeof categoryIcons]
            return (
              <Button
                key={category}
                variant={selectedCategory === category ? 'gradient' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                <IconComponent className="w-4 h-4 mr-1" />
                {category === 'wins' ? 'Vittorie' :
                 category === 'streak' ? 'Streak' :
                 category === 'form' ? 'Forma' :
                 category === 'participation' ? 'Partecipazione' :
                 'Speciali'}
              </Button>
            )
          })}
          
          <div className="ml-auto">
            <Button
              variant={showOnlyUnlocked ? 'gradient' : 'secondary'}
              size="sm"
              onClick={() => setShowOnlyUnlocked(!showOnlyUnlocked)}
            >
              {showOnlyUnlocked ? <CheckCircle className="w-4 h-4 mr-1" /> : <Lock className="w-4 h-4 mr-1" />}
              {showOnlyUnlocked ? 'Sbloccati' : 'Mostra tutti'}
            </Button>
          </div>
        </div>

        {/* Recently Unlocked */}
        {data?.recentUnlocks && data.recentUnlocks.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-white mb-4">Sbloccati di Recente</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {data.recentUnlocks.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
        )}

        {/* Next to Unlock */}
        {data?.nextToUnlock && data.nextToUnlock.length > 0 && !showOnlyUnlocked && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-white mb-4">Prossimi da Sbloccare</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {data.nextToUnlock.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
        )}

        {/* All Achievements */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">
            {selectedCategory === 'all' ? 'Tutti gli Achievement' : `Achievement ${
              selectedCategory === 'wins' ? 'Vittorie' :
              selectedCategory === 'streak' ? 'Streak' :
              selectedCategory === 'form' ? 'Forma' :
              selectedCategory === 'participation' ? 'Partecipazione' :
              'Speciali'
            }`}
          </h3>
          
          {filteredAchievements.length === 0 ? (
            <Card variant="glass" className="p-8 text-center">
              <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Nessun achievement trovato</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAchievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}