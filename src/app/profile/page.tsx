'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  User, Trophy, Zap, Shield, Target, Activity,
  Medal, Crown, Star, Flame, TrendingUp, Calendar,
  Settings, Edit2, Camera, Award, Users, Swords,
  ChevronRight, Clock, Heart, BarChart3, Share2,
  LogOut, Bell, Lock, Palette, Globe, Mail
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { XPBar } from '@/components/game/XPBar'
import { formatNumber, calculateLevel, calculateProgress } from '@/utils/helpers'

// Mock user data
const userData = {
  username: 'Campione123',
  email: 'campione@fitduel.com',
  bio: 'Fitness enthusiast | Level 12 Fighter | Never give up! 💪',
  avatar: '👤',
  level: 12,
  currentXP: 2840,
  nextLevelXP: 3500,
  totalXP: 15840,
  rank: 'Gold II',
  joinDate: '15 Marzo 2024',
  stats: {
    totalDuels: 59,
    wins: 47,
    losses: 12,
    winRate: 79.7,
    streak: 5,
    bestStreak: 12,
    totalExercises: 3420,
    favoriteExercise: 'Push-Up',
    fitnessScore: 842,
    avgFormScore: 92
  },
  achievements: {
    total: 24,
    recent: [
      { id: '1', name: 'Prima Vittoria', icon: '🏆', date: '2 giorni fa', description: 'Vinci il tuo primo duello' },
      { id: '2', name: 'Streak Master', icon: '🔥', date: '5 giorni fa', description: '5 giorni di streak' },
      { id: '3', name: 'Forma Perfetta', icon: '⭐', date: '1 settimana fa', description: 'Ottieni 100% form score' },
      { id: '4', name: 'Early Bird', icon: '🌅', date: '2 settimane fa', description: 'Completa sfida alle 6am' },
      { id: '5', name: 'Social Butterfly', icon: '🦋', date: '3 settimane fa', description: 'Sfida 10 amici diversi' }
    ]
  },
  badges: [
    { name: 'Beginner', icon: '🌱', color: 'bg-green-500' },
    { name: 'Warrior', icon: '⚔️', color: 'bg-red-500' },
    { name: 'Champion', icon: '👑', color: 'bg-yellow-500' },
    { name: 'Legend', icon: '🌟', color: 'bg-purple-500' },
    { name: 'Speed Demon', icon: '⚡', color: 'bg-blue-500' },
    { name: 'Iron Will', icon: '🛡️', color: 'bg-gray-500' }
  ],
  weeklyActivity: [
    { day: 'Lun', duels: 3, xp: 240 },
    { day: 'Mar', duels: 2, xp: 180 },
    { day: 'Mer', duels: 4, xp: 320 },
    { day: 'Gio', duels: 1, xp: 80 },
    { day: 'Ven', duels: 5, xp: 400 },
    { day: 'Sab', duels: 3, xp: 260 },
    { day: 'Dom', duels: 2, xp: 160 }
  ]
}

export default function ProfilePage() {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'stats' | 'achievements' | 'settings'>('overview')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    username: userData.username,
    bio: userData.bio,
    email: userData.email
  })

  const maxActivity = Math.max(...userData.weeklyActivity.map(d => d.duels))
  
  // Calculate level data from totalXP
  const userLevel = calculateLevel(userData.totalXP)
  const progress = calculateProgress(userData.totalXP)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2">
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
              <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center text-6xl border-4 border-white/20">
                {userData.avatar}
              </div>
              <button className="absolute bottom-0 right-0 w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-white">
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <h1 className="text-3xl font-bold text-white">{userData.username}</h1>
                <button onClick={() => setShowEditModal(true)}>
                  <Edit2 className="w-5 h-5 text-white/70 hover:text-white" />
                </button>
              </div>
              <p className="text-white/80 mt-2 max-w-md">{userData.bio}</p>
              <div className="flex items-center gap-4 mt-4 justify-center md:justify-start">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-semibold">{userData.rank}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-white/60" />
                  <span className="text-white/80 text-sm">Iscritto dal {userData.joinDate}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{userData.stats.wins}</p>
                <p className="text-white/70 text-sm">Vittorie</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{userData.stats.winRate}%</p>
                <p className="text-white/70 text-sm">Win Rate</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{userData.stats.streak}</p>
                <p className="text-white/70 text-sm">Streak</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{formatNumber(userData.totalXP)}</p>
                <p className="text-white/70 text-sm">XP Totali</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 -mt-24">
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
                  currentXP={userData.totalXP}
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
                <div className="flex items-end justify-between gap-2 h-32">
                  {userData.weeklyActivity.map((day, index) => (
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
              </Card>

              {/* Recent Achievements */}
              <Card variant="glass" className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Achievement Recenti</h2>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTab('achievements')}>
                    Vedi tutti
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {userData.achievements.recent.slice(0, 3).map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-white">{achievement.name}</p>
                        <p className="text-xs text-gray-400">{achievement.description}</p>
                      </div>
                      <span className="text-xs text-gray-500">{achievement.date}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Badges */}
              <Card variant="glass" className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Badge</h2>
                <div className="grid grid-cols-3 gap-3">
                  {userData.badges.map((badge) => (
                    <div
                      key={badge.name}
                      className="text-center p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors cursor-pointer"
                    >
                      <div className="text-2xl mb-1">{badge.icon}</div>
                      <p className="text-xs text-white">{badge.name}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Fitness Score */}
              <Card variant="gradient" className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Fitness Score</h3>
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-center">
                  <p className="text-5xl font-bold text-white mb-2">{userData.stats.fitnessScore}</p>
                  <div className="flex items-center justify-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-5 h-5',
                          i < Math.floor(userData.stats.fitnessScore / 200)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-600'
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-white/80">Top 10% dei giocatori</p>
                </div>
              </Card>

              {/* Quick Stats */}
              <Card variant="glass" className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Statistiche Rapide</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sfide Totali</span>
                    <span className="text-white font-semibold">{userData.stats.totalDuels}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Miglior Streak</span>
                    <span className="text-white font-semibold">{userData.stats.bestStreak} giorni</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Esercizi Totali</span>
                    <span className="text-white font-semibold">{formatNumber(userData.stats.totalExercises)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Esercizio Preferito</span>
                    <span className="text-white font-semibold">{userData.stats.favoriteExercise}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Form Score Medio</span>
                    <span className="text-white font-semibold">{userData.stats.avgFormScore}%</span>
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
              { icon: Trophy, label: 'Vittorie Totali', value: userData.stats.wins, color: 'text-yellow-500' },
              { icon: Swords, label: 'Sfide Totali', value: userData.stats.totalDuels, color: 'text-blue-500' },
              { icon: TrendingUp, label: 'Win Rate', value: `${userData.stats.winRate}%`, color: 'text-green-500' },
              { icon: Flame, label: 'Streak Attuale', value: `${userData.stats.streak} giorni`, color: 'text-orange-500' },
              { icon: Activity, label: 'Esercizi Totali', value: formatNumber(userData.stats.totalExercises), color: 'text-purple-500' },
              { icon: Star, label: 'Form Score', value: `${userData.stats.avgFormScore}%`, color: 'text-indigo-500' }
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
                <h2 className="text-xl font-bold text-white">Tutti gli Achievement</h2>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span className="text-white font-semibold">{userData.achievements.total} / 50</span>
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userData.achievements.recent.map((achievement, index) => (
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
            </Card>

            {/* Locked Achievements */}
            <Card variant="glass" className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Achievement Bloccati</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-50">
                {[
                  { name: 'Elite Warrior', icon: '🎖️', description: 'Raggiungi livello 50' },
                  { name: 'Unstoppable', icon: '🚀', description: '30 giorni di streak' },
                  { name: 'Perfectionist', icon: '💯', description: '100% form score per 10 sfide' }
                ].map((achievement) => (
                  <div key={achievement.name} className="p-4 bg-gray-800/30 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl grayscale">{achievement.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-400">{achievement.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{achievement.description}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <Lock className="w-3 h-3 text-gray-600" />
                          <span className="text-xs text-gray-600">Bloccato</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                    value={userData.email}
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
                  <Button variant="danger" className="w-full">
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
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
            <textarea
              value={editForm.bio}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none resize-none"
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowEditModal(false)} className="flex-1">
              Annulla
            </Button>
            <Button variant="gradient" onClick={() => setShowEditModal(false)} className="flex-1">
              Salva Modifiche
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}