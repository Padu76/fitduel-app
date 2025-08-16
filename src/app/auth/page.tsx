'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Gamepad2, Trophy, Zap, Users, Shield, 
  ChevronRight, Sparkles, Flame, Target,
  ArrowRight, Check, X, Loader2
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ====================================
// COMPONENTS
// ====================================

// Animated Background
const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 136, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 136, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Floating Orbs */}
      <motion.div 
        className="absolute top-20 left-20 w-96 h-96 bg-green-400/20 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -100, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"
        animate={{
          x: [0, -100, 0],
          y: [0, 100, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Animated Particles */}
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-green-400 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-20, -100],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 5 + 5,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  )
}

// Feature Card
const FeatureCard = ({ icon, title, description, delay }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring" }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-green-400/50 transition-all"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </motion.div>
  )
}

// Stats Counter
const StatsCounter = ({ value, label, delay }: any) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setCount(prev => {
          if (prev >= value) {
            clearInterval(interval)
            return value
          }
          return prev + Math.ceil(value / 50)
        })
      }, 30)
    }, delay * 1000)

    return () => clearTimeout(timer)
  }, [value, delay])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring" }}
      className="text-center"
    >
      <div className="text-3xl font-black text-white">{count.toLocaleString()}+</div>
      <div className="text-sm text-gray-400">{label}</div>
    </motion.div>
  )
}

// ====================================
// MAIN COMPONENT
// ====================================
export default function AuthPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [authMode, setAuthMode] = useState<'choice' | 'login' | 'register'>('choice')

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      // Check Supabase auth
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // User is logged in, redirect to dashboard
        router.push('/dashboard')
        return
      }

      // Check localStorage for demo user
      const savedUser = localStorage.getItem('fitduel_user')
      if (savedUser) {
        router.push('/dashboard')
        return
      }

      // No user found, show auth options
      setLoading(false)
    } catch (error) {
      console.error('Auth check error:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-green-400" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <header className="relative z-20 p-6">
        <Link href="/">
          <motion.div 
            className="flex items-center gap-3 w-fit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
              <Flame className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              FITDUEL ARENA
            </h1>
          </motion.div>
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {authMode === 'choice' && (
            <motion.div
              key="choice"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto"
            >
              {/* Hero Section */}
              <div className="text-center mb-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-block bg-gradient-to-r from-green-400 to-blue-500 px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider mb-6 text-black"
                >
                  🔥 Season 1 Live Now
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-5xl md:text-7xl font-black mb-6 uppercase"
                >
                  <span className="bg-gradient-to-r from-green-400 via-white to-blue-500 bg-clip-text text-transparent">
                    Unisciti alla Battaglia
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto"
                >
                  Sfida i tuoi amici, vinci trofei epici, domina la classifica globale.
                  Il fitness diventa un gioco!
                </motion.p>

                {/* Auth Options */}
                <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12">
                  {/* Login Card */}
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => router.push('/login')}
                    className="relative group cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                    <div className="relative bg-gray-900/90 backdrop-blur-sm border border-green-400/50 rounded-2xl p-8 hover:border-green-400 transition-all">
                      <div className="text-5xl mb-4">🎮</div>
                      <h3 className="text-2xl font-black mb-2 text-white">HO GIÀ UN ACCOUNT</h3>
                      <p className="text-gray-400 mb-6">Accedi e continua la tua avventura</p>
                      <div className="flex items-center justify-center gap-2 text-green-400 font-bold">
                        LOGIN
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Register Card */}
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, type: "spring" }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => router.push('/register')}
                    className="relative group cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                    <div className="relative bg-gray-900/90 backdrop-blur-sm border border-blue-400/50 rounded-2xl p-8 hover:border-blue-400 transition-all">
                      <div className="text-5xl mb-4">🚀</div>
                      <h3 className="text-2xl font-black mb-2 text-white">SONO NUOVO</h3>
                      <p className="text-gray-400 mb-6">Crea un account e inizia a giocare</p>
                      <div className="flex items-center justify-center gap-2 text-blue-400 font-bold">
                        REGISTRATI
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Quick Demo */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mb-12"
                >
                  <button
                    onClick={() => {
                      // Create demo user
                      const demoUser = {
                        id: 'demo-' + Date.now(),
                        username: 'DemoPlayer',
                        email: 'demo@fitduel.com',
                        level: 1,
                        xp: 0,
                        coins: 100
                      }
                      localStorage.setItem('fitduel_user', JSON.stringify(demoUser))
                      router.push('/dashboard')
                    }}
                    className="text-gray-400 hover:text-green-400 transition-colors text-sm flex items-center gap-2 mx-auto"
                  >
                    <Gamepad2 className="w-4 h-4" />
                    Prova Demo Veloce
                  </button>
                </motion.div>
              </div>

              {/* Stats Section */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-16"
              >
                <StatsCounter value={10000} label="Giocatori Attivi" delay={0.7} />
                <StatsCounter value={50000} label="Sfide Completate" delay={0.8} />
                <StatsCounter value={1000} label="Tornei Giocati" delay={0.9} />
              </motion.div>

              {/* Features Grid */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto"
              >
                <FeatureCard 
                  icon="⚡" 
                  title="Sfide Rapide" 
                  description="30 secondi per vincere"
                  delay={0.9}
                />
                <FeatureCard 
                  icon="🏆" 
                  title="Tornei Epici" 
                  description="Competizioni globali"
                  delay={1.0}
                />
                <FeatureCard 
                  icon="🤖" 
                  title="AI Tracking" 
                  description="Conta automatica rep"
                  delay={1.1}
                />
                <FeatureCard 
                  icon="💎" 
                  title="Rewards Reali" 
                  description="Vinci premi esclusivi"
                  delay={1.2}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-auto p-6 text-center">
        <p className="text-sm text-gray-500">
          © 2024 FitDuel Arena. Game on, fit on.
        </p>
      </footer>

      {/* Floating Elements */}
      <motion.div
        className="fixed bottom-8 right-8"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, type: "spring" }}
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="bg-gradient-to-r from-green-400 to-blue-500 p-4 rounded-2xl shadow-2xl"
        >
          <Trophy className="w-8 h-8 text-black" />
        </motion.div>
      </motion.div>
    </div>
  )
}