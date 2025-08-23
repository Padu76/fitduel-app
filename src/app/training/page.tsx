'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Play, Settings, Camera, Zap, Award,
  BookOpen, Dumbbell, Activity, Target, Gauge,
  CheckCircle, Lock, ChevronRight, Info, Volume2,
  MonitorPlay, Timer, TrendingUp, BarChart3, Sparkles
} from 'lucide-react'

export default function TrainingCenter() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [userStats, setUserStats] = useState({
    totalSessions: 42,
    perfectForms: 28,
    exercisesLearned: 15,
    calibrationScore: 85
  })

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const trainingCategories = [
    {
      id: 'free-training',
      title: 'ALLENAMENTO LIBERO',
      subtitle: 'Pratica senza pressione',
      description: 'Esercitati al tuo ritmo, senza timer o punteggi',
      icon: <Dumbbell className="w-8 h-8" />,
      color: 'from-green-500 to-emerald-500',
      glow: 'green',
      features: ['No Timer', 'No Score', 'Form Focus'],
      locked: false,
      route: '/training/free',
      items: [
        { name: 'Push-Up Practice', difficulty: 'Facile', duration: 'Libero' },
        { name: 'Squat Form', difficulty: 'Facile', duration: 'Libero' },
        { name: 'Burpees Slow', difficulty: 'Medio', duration: 'Libero' },
        { name: 'Plank Hold', difficulty: 'Facile', duration: 'Libero' }
      ]
    },
    {
      id: 'guided-programs',
      title: 'PROGRAMMI GUIDATI',
      subtitle: 'Percorsi strutturati',
      description: 'Segui programmi progressivi per migliorare la tecnica',
      icon: <BookOpen className="w-8 h-8" />,
      color: 'from-blue-500 to-cyan-500',
      glow: 'blue',
      features: ['Video Guide', 'Step by Step', 'Progress Track'],
      locked: false,
      route: '/training/programs',
      items: [
        { name: 'Beginner Basics', difficulty: '7 giorni', duration: '15 min/giorno' },
        { name: 'Form Perfection', difficulty: '14 giorni', duration: '20 min/giorno' },
        { name: 'Flexibility Flow', difficulty: '7 giorni', duration: '10 min/giorno' },
        { name: 'Core Stability', difficulty: '21 giorni', duration: '15 min/giorno' }
      ]
    },
    {
      id: 'ai-calibration',
      title: 'CALIBRAZIONE AI',
      subtitle: 'Ottimizza il riconoscimento',
      description: 'Configura e testa il motion detection per risultati perfetti',
      icon: <Settings className="w-8 h-8" />,
      color: 'from-purple-500 to-pink-500',
      glow: 'purple',
      features: ['Motion Test', 'Light Check', 'Distance Setup'],
      locked: false,
      route: '/calibration',
      items: [
        { name: 'Camera Setup', difficulty: 'Quick', duration: '2 min' },
        { name: 'Motion Sensitivity', difficulty: 'Test', duration: '3 min' },
        { name: 'Light Optimization', difficulty: 'Check', duration: '1 min' },
        { name: 'Full Calibration', difficulty: 'Complete', duration: '5 min' }
      ]
    },
    {
      id: 'technique-library',
      title: 'LIBRERIA TECNICHE',
      subtitle: 'Enciclopedia esercizi',
      description: 'Video tutorial dettagliati per ogni esercizio',
      icon: <MonitorPlay className="w-8 h-8" />,
      color: 'from-orange-500 to-red-500',
      glow: 'orange',
      features: ['HD Videos', 'Slow Motion', 'Common Mistakes'],
      locked: false,
      route: '/training/library',
      items: [
        { name: 'Upper Body', difficulty: '12 esercizi', duration: 'Video' },
        { name: 'Lower Body', difficulty: '15 esercizi', duration: 'Video' },
        { name: 'Core & Abs', difficulty: '10 esercizi', duration: 'Video' },
        { name: 'Full Body', difficulty: '8 esercizi', duration: 'Video' }
      ]
    }
  ]

  const achievements = [
    { name: 'Prima Sessione', icon: '🌟', unlocked: true },
    { name: 'Forma Perfetta', icon: '🎯', unlocked: true },
    { name: 'Settimana Completa', icon: '📅', unlocked: false },
    { name: 'Master Technique', icon: '🏆', unlocked: false }
  ]

  const handleCategoryClick = (category: any) => {
    router.push(category.route)
  }

  const handleRecalibrate = () => {
    router.push('/calibration')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20"
          style={{
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`
          }}
        />
        
        {/* Floating orbs */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-96 h-96 rounded-full blur-3xl opacity-20
              ${i === 0 ? 'bg-green-500' : i === 1 ? 'bg-blue-500' : 'bg-purple-500'}`}
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
            }}
            transition={{
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              left: `${20 + i * 30}%`,
              top: `${20 + i * 20}%`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <motion.button
                className="p-3 bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50
                  hover:border-green-500/50 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-6 h-6 text-green-400" />
              </motion.button>
            </Link>
            
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
                  <Dumbbell className="w-8 h-8 text-white" />
                </div>
                Training Center
              </h1>
              <p className="text-slate-400 mt-1">Allenati e migliora la tua tecnica</p>
            </div>
          </div>

          {/* Stats Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-4"
          >
            {[
              { label: 'Sessioni', value: userStats.totalSessions, icon: Activity },
              { label: 'Form Perfette', value: userStats.perfectForms, icon: Target },
              { label: 'Esercizi', value: userStats.exercisesLearned, icon: Award }
            ].map((stat, i) => (
              <div key={i} className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <stat.icon className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-slate-400">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-6 mb-8
            border border-blue-500/30 backdrop-blur-xl"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Info className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">Zona Training - No Competition</h3>
              <p className="text-slate-300 text-sm">
                Qui puoi allenarti liberamente senza timer o punteggi. Concentrati sulla forma perfetta e migliora la tua tecnica.
                <span className="text-yellow-400 ml-2">Nessun XP o Coins in questa sezione.</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Training Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {trainingCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div 
                className={`relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 
                  backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50
                  hover:border-green-500/50 transition-all duration-500
                  cursor-pointer overflow-hidden ${selectedCategory === category.id ? 'ring-2 ring-green-500' : ''}`}
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-5 
                  group-hover:opacity-10 transition-opacity duration-500`} />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 bg-gradient-to-br ${category.color} rounded-xl
                      shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {category.icon}
                    </div>
                    
                    {/* Features badges */}
                    <div className="flex gap-2">
                      {category.features.map((feature, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-700/50 rounded-lg text-xs text-slate-400">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-1">{category.title}</h3>
                  <p className="text-green-400 text-sm mb-2">{category.subtitle}</p>
                  <p className="text-slate-400 text-sm mb-4">{category.description}</p>
                  
                  {/* Items Preview */}
                  <div className="space-y-2">
                    {category.items.slice(0, 2).map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-slate-800/30 
                        rounded-lg border border-slate-700/30">
                        <span className="text-sm text-white">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">{item.difficulty}</span>
                          <span className="text-xs text-green-400">{item.duration}</span>
                        </div>
                      </div>
                    ))}
                    {category.items.length > 2 && (
                      <div className="text-center text-xs text-slate-500">
                        +{category.items.length - 2} altri
                      </div>
                    )}
                  </div>
                  
                  {/* Action Button */}
                  <motion.button
                    onClick={() => handleCategoryClick(category)}
                    className={`w-full mt-4 py-3 bg-gradient-to-r ${category.color} 
                      rounded-xl text-white font-bold flex items-center justify-center gap-2
                      shadow-lg hover:shadow-lg transition-all duration-300`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Play className="w-5 h-5" />
                    INIZIA
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Calibration Status */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl 
              rounded-2xl p-6 border border-purple-500/20"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-purple-400" />
              Stato Calibrazione
            </h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Motion Detection</span>
                  <span className="text-green-400">95%</span>
                </div>
                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                    style={{ width: '95%' }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Illuminazione</span>
                  <span className="text-yellow-400">75%</span>
                </div>
                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"
                    style={{ width: '75%' }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Distanza Camera</span>
                  <span className="text-green-400">Ottimale</span>
                </div>
                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                    style={{ width: '100%' }} />
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleRecalibrate}
              className="w-full mt-4 py-2 bg-purple-500/20 border border-purple-500/50 
                rounded-lg text-purple-400 font-bold hover:bg-purple-500/30 transition-all"
            >
              Ricalibra
            </button>
          </motion.div>

          {/* Recent Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl 
              rounded-2xl p-6 border border-green-500/20"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Progressi Recenti
            </h3>
            
            <div className="space-y-3">
              {[
                { exercise: 'Push-Up', improvement: '+15%', badge: '🎯' },
                { exercise: 'Squat', improvement: '+8%', badge: '📈' },
                { exercise: 'Plank', improvement: '+20s', badge: '⏱️' },
                { exercise: 'Burpees', improvement: 'New!', badge: '✨' }
              ].map((progress, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-800/30 
                  rounded-lg hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{progress.badge}</span>
                    <span className="text-sm text-white">{progress.exercise}</span>
                  </div>
                  <span className="text-sm font-bold text-green-400">{progress.improvement}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl 
              rounded-2xl p-6 border border-yellow-500/20"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Achievement Tecnici
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {achievements.map((achievement, i) => (
                <div key={i} className={`flex flex-col items-center p-3 rounded-lg border
                  ${achievement.unlocked 
                    ? 'bg-yellow-500/10 border-yellow-500/30' 
                    : 'bg-slate-800/30 border-slate-700/30 opacity-50'}`}>
                  <span className="text-2xl mb-1">{achievement.icon}</span>
                  <span className="text-xs text-center text-slate-300">{achievement.name}</span>
                  {!achievement.unlocked && <Lock className="w-3 h-3 text-slate-500 mt-1" />}
                </div>
              ))}
            </div>
            
            <Link href="/achievements">
              <button className="w-full mt-4 py-2 bg-yellow-500/20 border border-yellow-500/50 
                rounded-lg text-yellow-400 font-bold hover:bg-yellow-500/30 transition-all">
                Vedi Tutti
              </button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  )
}