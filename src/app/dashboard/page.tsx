'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Home, Zap, Trophy, Target, Settings, LogOut,
  Flame, Clock, Users, TrendingUp, Camera,
  Swords, Dumbbell, BookOpen, Calendar,
  ChevronRight, Play, Award, Star
} from 'lucide-react'

interface UserData {
  email: string
  name: string
  loginTime: string
}

export default function MainDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [activeSection, setActiveSection] = useState('dashboard')

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('fitduel_user')
    if (!userData) {
      router.push('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    } catch (error) {
      router.push('/login')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('fitduel_user')
    localStorage.removeItem('fitduel_email')
    localStorage.removeItem('fitduel_password')
    router.push('/login')
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
    { id: 'training', label: 'Training', icon: Dumbbell, href: '/training' },
    { id: 'challenges', label: 'Sfide', icon: Swords, href: '/challenges' },
    { id: 'library', label: 'Libreria', icon: BookOpen, href: '/training/library' },
    { id: 'profile', label: 'Profilo', icon: Target, href: '/profile' },
    { id: 'settings', label: 'Impostazioni', icon: Settings, href: '/settings' }
  ]

  const quickActions = [
    {
      title: 'Allenamento Intensivo',
      description: 'Sessione HIIT ad alta intensità',
      icon: Flame,
      color: 'from-red-500 to-orange-500',
      href: '/training/intensive',
      duration: '25 min'
    },
    {
      title: 'Sfida Veloce',
      description: 'Trova avversario online',
      icon: Zap,
      color: 'from-yellow-500 to-orange-500',
      href: '/challenges/quick',
      duration: '10 min'
    },
    {
      title: 'Calibrazione AI',
      description: 'Ottimizza tracking movimento',
      icon: Camera,
      color: 'from-blue-500 to-purple-500',
      href: '/training/calibration',
      duration: '5 min'
    },
    {
      title: 'Torneo Elite',
      description: 'Competizione settimanale',
      icon: Trophy,
      color: 'from-purple-500 to-pink-500',
      href: '/tournaments',
      duration: 'Live'
    }
  ]

  const todayStats = [
    { label: 'Calorie', value: '847', unit: 'kcal', icon: Flame, color: 'text-red-400' },
    { label: 'Tempo', value: '42', unit: 'min', icon: Clock, color: 'text-blue-400' },
    { label: 'Sfide Vinte', value: '3', unit: '/5', icon: Trophy, color: 'text-yellow-400' },
    { label: 'Ranking', value: '#127', unit: 'Elite', icon: TrendingUp, color: 'text-green-400' }
  ]

  const recentChallenges = [
    { opponent: 'Marco_Warrior', result: 'WIN', score: '847 vs 623', time: '2h fa' },
    { opponent: 'Sara_Beast', result: 'WIN', score: '1205 vs 1089', time: '4h fa' },
    { opponent: 'Luca_Titan', result: 'LOSS', score: '723 vs 856', time: '1d fa' }
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Top Navigation */}
      <nav className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg">FitDuel</span>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-white font-medium capitalize">{user.name}</div>
                <div className="text-gray-400 text-sm">Elite Fighter</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-gray-900/50 backdrop-blur-sm border-r border-gray-800 min-h-[calc(100vh-4rem)] sticky top-16">
          <div className="p-4">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Welcome Header */}
          <div className="mb-8">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-white mb-2"
            >
              Bentornato, {user.name}! 💪
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400"
            >
              Pronto per dominare le sfide di oggi?
            </motion.p>
          </div>

          {/* Today's Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {todayStats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                    <span className="text-gray-400 text-sm">{stat.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">{stat.value}</span>
                    <span className="text-gray-400 text-sm">{stat.unit}</span>
                  </div>
                </div>
              )
            })}
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-white mb-6">Azioni Rapide</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">{action.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{action.duration}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Challenges */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Sfide Recenti</h3>
                <Link href="/challenges" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                  Vedi tutto →
                </Link>
              </div>
              <div className="space-y-4">
                {recentChallenges.map((challenge, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${challenge.result === 'WIN' ? 'bg-green-400' : 'bg-red-400'}`} />
                      <div>
                        <div className="font-medium text-white">{challenge.opponent}</div>
                        <div className="text-sm text-gray-400">{challenge.score}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${challenge.result === 'WIN' ? 'text-green-400' : 'text-red-400'}`}>
                        {challenge.result}
                      </div>
                      <div className="text-xs text-gray-500">{challenge.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Achievement & Progress */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Obiettivi Settimanali</h3>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Sfide Vinte</span>
                    <span className="text-blue-400 font-bold">7/10</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{width: '70%'}} />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Tempo Allenamento</span>
                    <span className="text-green-400 font-bold">240/300 min</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full" style={{width: '80%'}} />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Streak Giornaliero</span>
                    <span className="text-orange-400 font-bold">5/7 giorni</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full" style={{width: '71%'}} />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-yellow-400" />
                  <div>
                    <div className="text-white font-bold">Elite Status</div>
                    <div className="text-yellow-400 text-sm">Mantieni la posizione per 48h</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}