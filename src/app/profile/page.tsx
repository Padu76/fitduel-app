'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  User, Trophy, Zap, Shield, Target, Activity,
  Medal, Crown, Star, Flame, TrendingUp, Calendar,
  Settings, Edit2, Camera, Award, Users, Swords,
  ChevronRight, Clock, Heart, BarChart3, Share2,
  LogOut, Bell, Lock, Palette, Globe, Mail,
  Loader2, AlertCircle, CheckCircle, Upload
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { XPBar } from '@/components/game/XPBar'
import { formatNumber, calculateLevel, calculateProgress } from '@/utils/helpers'
import { useUser, auth, db, storage } from '@/lib/supabase-client'

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, stats, loading: userLoading } = useUser()
  
  const [selectedTab, setSelectedTab] = useState<'overview' | 'stats' | 'achievements' | 'settings'>('overview')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form data
  const [editForm, setEditForm] = useState({
    username: '',
    display_name: '',
    bio: '',
    email: ''
  })
  
  // Performance data
  const [performances, setPerformances] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [weeklyActivity, setWeeklyActivity] = useState<any[]>([])
  const [loadingPerformances, setLoadingPerformances] = useState(true)

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        username: profile.username || '',
        display_name: profile.display_name || profile.username || '',
        bio: profile.bio || '',
        email: profile.email || ''
      })
    }
  }, [profile])

  // Check authentication
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login')
    }
  }, [user, userLoading, router])

  // Fetch additional data
  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    if (!user) return
    
    try {
      // Fetch recent performances
      const perfs = await db.performances.getMyPerformances(user.id, 10)
      setPerformances(perfs)
      
      // Calculate weekly activity
      const weekData = calculateWeeklyActivity(perfs)
      setWeeklyActivity(weekData)
      
      // Fetch achievements (mock for now)
      setAchievements([
        { id: '1', name: 'Prima Vittoria', icon: '🏆', date: '2 giorni fa', description: 'Vinci il tuo primo duello' },
        { id: '2', name: 'Streak Master', icon: '🔥', date: '5 giorni fa', description: '5 giorni di streak' },
        { id: '3', name: 'Forma Perfetta', icon: '⭐', date: '1 settimana fa', description: 'Ottieni 100% form score' }
      ])
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoadingPerformances(false)
    }
  }

  const calculateWeeklyActivity = (performances: any[]) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
    const weekData = days.map(day => ({ day, duels: 0, xp: 0 }))
    
    performances.forEach(perf => {
      const date = new Date(perf.performed_at)
      const dayIndex = date.getDay()
      weekData[dayIndex].duels += 1
      weekData[dayIndex].xp += Math.round(perf.calories_burned * 0.5) // Approximate XP
    })
    
    // Rotate to start from Monday
    const sunday = weekData.shift()!
    weekData.push(sunday)
    
    return weekData
  }

  const handleEditProfile = async () => {
    if (!user) return
    
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      await db.profiles.update(user.id, {
        username: editForm.username,
        display_name: editForm.display_name,
        bio: editForm.bio
      })
      
      setSuccess('Profilo aggiornato con successo!')
      setShowEditModal(false)
      
      // Refresh profile data
      window.location.reload()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setError(error.message || 'Errore durante l\'aggiornamento del profilo')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Seleziona un\'immagine valida')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('L\'immagine deve essere inferiore a 5MB')
      return
    }
    
    setIsUploading(true)
    setError(null)
    
    try {
      // Upload to storage
      const avatarUrl = await storage.uploadAvatar(file, user.id)
      
      // Update profile
      await db.profiles.update(user.id, { avatar_url: avatarUrl })
      
      setSuccess('Avatar aggiornato con successo!')
      setShowAvatarModal(false)
      
      // Refresh page to show new avatar
      window.location.reload()
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      setError('Errore durante il caricamento dell\'avatar')
    } finally {
      setIsUploading(false)
    }
  }

  const handleLogout = async () => {
    await auth.signOut()
    router.push('/login')
  }

  // Calculate stats
  const winRate = stats && stats.total_duels > 0 
    ? Math.round((stats.duels_won / stats.total_duels) * 100) 
    : 0
  
  const maxActivity = Math.max(...weeklyActivity.map(d => d.duels), 1)
  
  // Calculate level data from totalXP
  const userLevel = calculateLevel(stats?.total_xp || 0)
  const progress = calculateProgress(stats?.total_xp || 0)

  // Loading state
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Caricamento profilo...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">FitDuel</span>
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-600" />
              <span className="text-white font-medium">Profilo</span>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Condividi
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTab('settings')}>
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 pt-8 pb-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center gap-6"
          >
            {/* Avatar */}
            <div className="relative">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.username}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white/20"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center text-6xl border-4 border-white/20">
                  <User className="w-16 h-16 text-gray-600" />
                </div>
              )}
              <button 
                onClick={() => setShowAvatarModal(true)}
                className="absolute bottom-0 right-0 w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-white hover:bg-indigo-600 transition"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <h1 className="text-3xl font-bold text-white">
                  {profile.display_name || profile.username}
                </h1>
                <button onClick={() => setShowEditModal(true)}>
                  <Edit2 className="w-5 h-5 text-white/70 hover:text-white" />
                </button>
              </div>
              <p className="text-white/80 mt-2 max-w-md">
                {profile.bio || 'Nessuna bio ancora. Clicca per aggiungerne una!'}
              </p>
              <div className="flex items-center gap-4 mt-4 justify-center md:justify-start">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-semibold">
                    Level {stats?.level || 1}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-white/60" />
                  <span className="text-white/80 text-sm">
                    Iscritto dal {new Date(profile.created_at).toLocaleDateString('it-IT')}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{stats?.duels_won || 0}</p>
                <p className="text-white/70 text-sm">Vittorie</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{winRate}%</p>
                <p className="text-white/70 text-sm">Win Rate</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{stats?.daily_streak || 0}</p>
                <p className="text-white/70 text-sm">Streak</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{formatNumber(stats?.total_xp || 0)}</p>
                <p className="text-white/70 text-sm">XP Totali</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 -mt-24">
        {/* Success/Error Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'overview', label: 'Panoramica', icon: BarChart3 },
            { id: 'stats', label: 'Statistiche', icon: TrendingUp },
            { id: 'achievements', label: 'Achievements', icon: Award },
            { id: 'settings', label: 'Impostazioni', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <Button
                key={tab.id}
                variant={selectedTab === tab.id ? 'gradient' : 'ghost'}
                onClick={() => setSelectedTab(tab.id as any)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </Button>
            )
          })}
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Level Progress */}
              <Card variant="glass" className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Progresso Livello</h2>
                <XPBar
                  currentXP={stats?.total_xp || 0}
                  showLevel
                  showProgress
                  showAnimation
                  size="lg"
                />
                <p className="text-sm text-gray-400 mt-2">
                  {progress.next - progress.current} XP al prossimo livello
                </p>
              </Card>

              {/* Weekly Activity */}
              <Card variant="glass" className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Attività Settimanale</h2>
                {loadingPerformances ? (
                  <div className="h-32 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                  </div>
                ) : (
                  <div className="flex items-end justify-between gap-2 h-32">
                    {weeklyActivity.map((day, index) => (
                      <motion.div
                        key={day.day}
                        initial={{ height: 0 }}
                        animate={{ height: `${(day.duels / maxActivity) * 100}%` }}
                        transition={{ delay: index * 0.1 }}
                        className="flex-1 flex flex-col items-center gap-2"
                      >
                        <div className="flex-1 w-full flex items-end">
                          <div
                            className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg relative group"
                            style={{ height: '100%' }}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {day.duels} sfide • {day.xp} XP
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{day.day}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Recent Performances */}
              <Card variant="glass" className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Performance Recenti</h2>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTab('stats')}>
                    Vedi tutte
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                {performances.length > 0 ? (
                  <div className="space-y-3">
                    {performances.slice(0, 3).map((perf) => (
                      <div key={perf.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                        <div className="text-2xl">💪</div>
                        <div className="flex-1">
                          <p className="font-semibold text-white">
                            {perf.reps} ripetizioni
                          </p>
                          <p className="text-xs text-gray-400">
                            Form score: {perf.form_score}% • {perf.calories_burned} cal
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(perf.performed_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 py-4">
                    Nessuna performance registrata
                  </p>
                )}
              </Card>
            </div>

            <div className="space-y-6">
              {/* Fitness Score */}
              <Card variant="gradient" className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Fitness Score</h3>
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-center">
                  <p className="text-5xl font-bold text-white mb-2">
                    {Math.round((stats?.average_form_score || 0) * 10)}
                  </p>
                  <div className="flex items-center justify-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-5 h-5',
                          i < Math.floor((stats?.average_form_score || 0) / 20)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-600'
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-white/80">
                    {(stats?.average_form_score || 0) >= 80 ? 'Top 10% dei giocatori' : 'Continua a migliorare!'}
                  </p>
                </div>
              </Card>

              {/* Quick Stats */}
              <Card variant="glass" className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Statistiche Rapide</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sfide Totali</span>
                    <span className="text-white font-semibold">{stats?.total_duels || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Miglior Streak</span>
                    <span className="text-white font-semibold">{stats?.max_daily_streak || 0} giorni</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Esercizi Totali</span>
                    <span className="text-white font-semibold">{formatNumber(stats?.total_exercises || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Calorie Bruciate</span>
                    <span className="text-white font-semibold">{formatNumber(stats?.total_calories || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Form Score Medio</span>
                    <span className="text-white font-semibold">{stats?.average_form_score || 0}%</span>
                  </div>
                </div>
              </Card>

              {/* Coins & Gems */}
              <Card variant="glass" className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Risorse</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Monete</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🪙</span>
                      <span className="text-white font-bold text-xl">{stats?.coins || 0}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Gemme</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">💎</span>
                      <span className="text-white font-bold text-xl">{stats?.gems || 0}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {selectedTab === 'stats' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Trophy, label: 'Vittorie Totali', value: stats?.duels_won || 0, color: 'text-yellow-500' },
              { icon: Swords, label: 'Sfide Totali', value: stats?.total_duels || 0, color: 'text-blue-500' },
              { icon: TrendingUp, label: 'Win Rate', value: `${winRate}%`, color: 'text-green-500' },
              { icon: Flame, label: 'Streak Attuale', value: `${stats?.daily_streak || 0} giorni`, color: 'text-orange-500' },
              { icon: Activity, label: 'Esercizi Totali', value: formatNumber(stats?.total_exercises || 0), color: 'text-purple-500' },
              { icon: Star, label: 'Form Score', value: `${stats?.average_form_score || 0}%`, color: 'text-indigo-500' },
              { icon: Zap, label: 'XP Totali', value: formatNumber(stats?.total_xp || 0), color: 'text-yellow-500' },
              { icon: Medal, label: 'Livello', value: stats?.level || 1, color: 'text-blue-500' },
              { icon: Heart, label: 'Calorie', value: formatNumber(stats?.total_calories || 0), color: 'text-red-500' }
            ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card variant="glass" className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={cn('p-3 rounded-xl bg-gray-800', stat.color)}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">{stat.label}</p>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Achievements Tab */}
        {selectedTab === 'achievements' && (
          <div>
            <Card variant="glass" className="p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Achievement Sbloccati</h2>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span className="text-white font-semibold">{achievements.length} / 50</span>
                </div>
              </div>
              {achievements.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{achievement.name}</h3>
                          <p className="text-xs text-gray-400 mt-1">{achievement.description}</p>
                          <p className="text-xs text-gray-500 mt-2">{achievement.date}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-8">
                  Nessun achievement sbloccato ancora. Continua a giocare!
                </p>
              )}
            </Card>
          </div>
        )}

        {/* Settings Tab */}
        {selectedTab === 'settings' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card variant="glass" className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Impostazioni Account</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <Input
                    type="email"
                    value={profile.email}
                    disabled
                    icon={<Mail className="w-5 h-5" />}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <Button variant="secondary" className="w-full">
                    <Lock className="w-4 h-4 mr-2" />
                    Cambia Password
                  </Button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Notifiche</label>
                  <Button variant="secondary" className="w-full">
                    <Bell className="w-4 h-4 mr-2" />
                    Gestisci Notifiche
                  </Button>
                </div>
              </div>
            </Card>

            <Card variant="glass" className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Preferenze</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Lingua</label>
                  <Button variant="secondary" className="w-full">
                    <Globe className="w-4 h-4 mr-2" />
                    Italiano
                  </Button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tema</label>
                  <Button variant="secondary" className="w-full">
                    <Palette className="w-4 h-4 mr-2" />
                    Scuro
                  </Button>
                </div>
                <div className="pt-4 border-t border-gray-800">
                  <Button variant="danger" className="w-full" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifica Profilo"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <Input
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              icon={<User className="w-5 h-5" />}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nome Visualizzato</label>
            <Input
              value={editForm.display_name}
              onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
              icon={<User className="w-5 h-5" />}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
            <textarea
              value={editForm.bio}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none resize-none"
              rows={3}
              disabled={isSaving}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              {editForm.bio.length}/200 caratteri
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setShowEditModal(false)} 
              className="flex-1"
              disabled={isSaving}
            >
              Annulla
            </Button>
            <Button 
              variant="gradient" 
              onClick={handleEditProfile} 
              className="flex-1"
              disabled={isSaving}
            >
              {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Avatar Upload Modal */}
      <Modal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        title="Cambia Avatar"
        size="sm"
      >
        <div className="space-y-4">
          <div className="text-center">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Current avatar"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
            ) : (
              <div className="w-32 h-32 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User className="w-16 h-16 text-gray-600" />
              </div>
            )}
            
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={isUploading}
              />
              <Button 
                variant="gradient" 
                className="w-full"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Caricamento...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Scegli Immagine
                  </>
                )}
              </Button>
            </label>
            
            <p className="text-xs text-gray-400 mt-2">
              Max 5MB • JPG, PNG, GIF
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}