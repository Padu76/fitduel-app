'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Trophy, Shield, Users, Flame, Check
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import SimpleAuth from '@/components/auth/SimpleAuth'

// ====================================
// TYPES
// ====================================
interface AuthUser {
  id: string
  email: string
  username: string
  level: number
  xp: number
}

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
      {[...Array(20)].map((_, i) => (
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

// ====================================
// MAIN COMPONENT
// ====================================
export default function AuthPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleAuthSuccess = (user: AuthUser) => {
    console.log('Auth successful, redirecting to dashboard:', user)
    // Small delay to ensure cookies are set
    setTimeout(() => {
      router.push('/dashboard')
    }, 500)
  }

  const handleAuthError = (error: string) => {
    console.error('Auth error:', error)
    // Error handling is managed by SimpleAuth component
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
      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Info */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-block bg-gradient-to-r from-green-400 to-blue-500 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider mb-6 text-black"
                >
                  Season 1 Live Now
                </motion.div>

                <h2 className="text-4xl font-black mb-4">
                  <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                    Entra nell'Arena
                  </span>
                </h2>
                <p className="text-xl text-gray-400 mb-8">
                  Crea il tuo account o accedi per iniziare a dominare le classifiche!
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-400/20 rounded-lg flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-white">Account sincronizzato su tutti i dispositivi</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-400/20 rounded-lg flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-white">Progressi e statistiche salvate</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-400/20 rounded-lg flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-white">Partecipazione a tornei esclusivi</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-400/20 rounded-lg flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-white">Classifiche globali e achievements</span>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-6">
                <div className="flex items-center gap-2 text-green-400">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm">Dati Protetti</span>
                </div>
                <div className="flex items-center gap-2 text-blue-400">
                  <Users className="w-5 h-5" />
                  <span className="text-sm">10K+ Giocatori</span>
                </div>
                <div className="flex items-center gap-2 text-purple-400">
                  <Trophy className="w-5 h-5" />
                  <span className="text-sm">Premi Reali</span>
                </div>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-2 gap-4 pt-6">
                <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="text-sm font-medium text-white">Sfide Rapide</div>
                  <div className="text-xs text-gray-400">30 secondi per vincere</div>
                </div>
                <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
                  <div className="text-2xl mb-2">🏆</div>
                  <div className="text-sm font-medium text-white">Tornei Epici</div>
                  <div className="text-xs text-gray-400">Competizioni globali</div>
                </div>
                <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
                  <div className="text-2xl mb-2">🤖</div>
                  <div className="text-sm font-medium text-white">AI Tracking</div>
                  <div className="text-xs text-gray-400">Conta automatica rep</div>
                </div>
                <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
                  <div className="text-2xl mb-2">💎</div>
                  <div className="text-sm font-medium text-white">Rewards Reali</div>
                  <div className="text-xs text-gray-400">Vinci premi esclusivi</div>
                </div>
              </div>
            </motion.div>

            {/* Right Side - Auth Component */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center lg:justify-end"
            >
              <SimpleAuth 
                onAuthSuccess={handleAuthSuccess}
                onError={handleAuthError}
                className="w-full max-w-md"
              />
            </motion.div>
          </div>
        </div>
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