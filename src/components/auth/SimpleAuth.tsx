'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Flame, 
  ArrowRight, 
  Loader2, 
  GamepadIcon,
  Zap,
  Trophy
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { cn } from '@/utils/cn'

// ====================================
// TYPES
// ====================================
interface SimpleAuthProps {
  onAuthSuccess?: (user: QuickUser) => void
  onError?: (error: string) => void
  className?: string
}

interface QuickUser {
  id: string
  username: string
  level: number
  xp: number
  isGuest: boolean
  avatar?: string
}

type AuthState = 'idle' | 'loading' | 'success' | 'error'

// ====================================
// MOCK USER DATA (for demo)
// ====================================
const DEMO_USERS: QuickUser[] = [
  {
    id: '1',
    username: 'mario',
    level: 25,
    xp: 6250,
    isGuest: false,
    avatar: '💪'
  },
  {
    id: '2',
    username: 'giulia',
    level: 12,
    xp: 1440,
    isGuest: false,
    avatar: '🏋️‍♀️'
  },
  {
    id: '3',
    username: 'luca',
    level: 3,
    xp: 225,
    isGuest: false,
    avatar: '🚀'
  }
]

// ====================================
// COMPONENT
// ====================================
export default function SimpleAuth({ 
  onAuthSuccess, 
  onError,
  className 
}: SimpleAuthProps) {
  const [authState, setAuthState] = useState<AuthState>('idle')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)

  // ====================================
  // QUICK LOGIN/REGISTER
  // ====================================
  const handleQuickAuth = async () => {
    if (!username.trim()) {
      setError('Inserisci un username')
      return
    }

    if (username.length < 3) {
      setError('Username deve essere almeno 3 caratteri')
      return
    }

    setAuthState('loading')
    setError(null)

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Check if user exists (demo logic)
      let user = DEMO_USERS.find(u => u.username.toLowerCase() === username.toLowerCase())

      if (!user) {
        // Create new user
        user = {
          id: `user_${Date.now()}`,
          username: username.toLowerCase(),
          level: 1,
          xp: 100, // Welcome bonus
          isGuest: false,
          avatar: getRandomAvatar()
        }
        
        console.log('🎉 Nuovo utente creato:', user)
      } else {
        console.log('👋 Bentornato:', user)
      }

      setAuthState('success')
      
      // Store user in localStorage for demo
      localStorage.setItem('fitduel_user', JSON.stringify(user))
      
      // Call success callback
      onAuthSuccess?.(user)

    } catch (err: any) {
      console.error('Auth error:', err)
      setError('Errore durante l\'autenticazione')
      setAuthState('error')
      onError?.(err.message)
    }
  }

  // ====================================
  // GUEST MODE
  // ====================================
  const handleGuestMode = async () => {
    setAuthState('loading')
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500))

      const guestUser: QuickUser = {
        id: `guest_${Date.now()}`,
        username: `Ospite${Math.floor(Math.random() * 1000)}`,
        level: 1,
        xp: 0,
        isGuest: true,
        avatar: '👤'
      }

      localStorage.setItem('fitduel_user', JSON.stringify(guestUser))
      
      setAuthState('success')
      onAuthSuccess?.(guestUser)

    } catch (err: any) {
      console.error('Guest mode error:', err)
      setError('Errore modalità ospite')
      setAuthState('error')
    }
  }

  // ====================================
  // DEMO USERS LOGIN
  // ====================================
  const handleDemoLogin = async (demoUser: QuickUser) => {
    setAuthState('loading')
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      localStorage.setItem('fitduel_user', JSON.stringify(demoUser))
      setAuthState('success')
      onAuthSuccess?.(demoUser)

    } catch (err: any) {
      console.error('Demo login error:', err)
      setError('Errore demo login')
      setAuthState('error')
    }
  }

  // ====================================
  // UTILITY FUNCTIONS
  // ====================================
  const getRandomAvatar = () => {
    const avatars = ['💪', '🏋️‍♀️', '🏋️‍♂️', '🚀', '⚡', '🔥', '🏆', '⭐', '💎', '🎯']
    return avatars[Math.floor(Math.random() * avatars.length)]
  }

  // ====================================
  // RENDER
  // ====================================
  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6"
        >
          <Flame className="w-10 h-10 text-white" />
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-white mb-2"
        >
          FitDuel
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-400"
        >
          Inizia la tua avventura fitness
        </motion.p>
      </div>

      {/* Demo Users */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-6"
      >
        <Card variant="glass" className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-white">Account Demo</span>
          </div>
          
          <div className="space-y-2">
            {DEMO_USERS.map((user, index) => (
              <motion.button
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                onClick={() => handleDemoLogin(user)}
                disabled={authState === 'loading'}
                className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{user.avatar}</span>
                  <div className="text-left">
                    <p className="text-white font-medium">{user.username}</p>
                    <p className="text-xs text-gray-400">Level {user.level} • {user.xp} XP</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </motion.button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Quick Auth */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-4"
      >
        <Card variant="glass" className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium text-white">Accesso Rapido</span>
          </div>

          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Il tuo username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAuth()}
              disabled={authState === 'loading'}
              icon={<User className="w-5 h-5" />}
              className="text-lg"
            />

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm"
              >
                {error}
              </motion.p>
            )}

            <Button
              variant="gradient"
              size="lg"
              onClick={handleQuickAuth}
              disabled={authState === 'loading' || !username.trim()}
              className="w-full"
            >
              {authState === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Accesso...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Inizia Subito
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">oppure</p>
              <Button
                variant="secondary"
                onClick={handleGuestMode}
                disabled={authState === 'loading'}
                className="w-full"
              >
                <GamepadIcon className="w-4 h-4 mr-2" />
                Gioca come Ospite
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-6"
      >
        <Card variant="glass" className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-white">Perché FitDuel?</span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Sfide fitness divertenti</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Sistema livelli e XP</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Competizione con amici</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Achievement e badge</span>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}