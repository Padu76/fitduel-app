'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  User, 
  Flame, 
  ArrowRight, 
  Loader2, 
  GamepadIcon,
  Zap,
  Trophy,
  Star,
  Crown
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { cn } from '@/utils/cn'

// ====================================
// TYPES
// ====================================
interface QuickUser {
  id: string
  username: string
  level: number
  xp: number
  coins: number
  isGuest: boolean
  avatar: string
  tier: 'newbie' | 'user' | 'premium'
}

type AuthState = 'idle' | 'loading' | 'success' | 'error'

// ====================================
// DEMO USERS DATA
// ====================================
const DEMO_USERS: QuickUser[] = [
  {
    id: 'mario-demo',
    username: 'mario',
    level: 25,
    xp: 6250,
    coins: 1200,
    isGuest: false,
    avatar: '💪',
    tier: 'premium'
  },
  {
    id: 'giulia-demo',
    username: 'giulia',
    level: 12,
    xp: 1440,
    coins: 350,
    isGuest: false,
    avatar: '🏋️‍♀️',
    tier: 'user'
  },
  {
    id: 'luca-demo',
    username: 'luca',
    level: 3,
    xp: 225,
    coins: 80,
    isGuest: false,
    avatar: '🚀',
    tier: 'newbie'
  }
]

const TIER_CONFIG = {
  newbie: { 
    label: 'Newbie', 
    color: 'text-green-400', 
    icon: Star,
    bgColor: 'bg-green-500/10 border-green-500/20' 
  },
  user: { 
    label: 'User', 
    color: 'text-blue-400', 
    icon: User,
    bgColor: 'bg-blue-500/10 border-blue-500/20' 
  },
  premium: { 
    label: 'Premium', 
    color: 'text-yellow-400', 
    icon: Crown,
    bgColor: 'bg-yellow-500/10 border-yellow-500/20' 
  }
}

// ====================================
// MAIN COMPONENT
// ====================================
export default function LoginPage() {
  const router = useRouter()
  const [authState, setAuthState] = useState<AuthState>('idle')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Check if user is already logged in
  useEffect(() => {
    const savedUser = localStorage.getItem('fitduel_user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        console.log('👋 User già loggato:', user.username)
        router.push('/dashboard')
      } catch (err) {
        console.error('Error parsing saved user:', err)
        localStorage.removeItem('fitduel_user')
      }
    }
  }, [router])

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

    // Simple validation
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username può contenere solo lettere, numeri e underscore')
      return
    }

    setAuthState('loading')
    setError(null)

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800))

      // Check if user exists in demo users
      let user = DEMO_USERS.find(u => u.username.toLowerCase() === username.toLowerCase())

      if (!user) {
        // Create new user
        user = {
          id: `user_${Date.now()}`,
          username: username.toLowerCase(),
          level: 1,
          xp: 100, // Welcome bonus
          coins: 50, // Starting coins
          isGuest: false,
          avatar: getRandomAvatar(),
          tier: 'newbie'
        }
        
        console.log('🎉 Nuovo utente creato:', user)
      } else {
        console.log('👋 Bentornato:', user)
      }

      // Store user in localStorage
      localStorage.setItem('fitduel_user', JSON.stringify(user))
      
      setAuthState('success')
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)

    } catch (err: any) {
      console.error('Auth error:', err)
      setError('Errore durante l\'autenticazione')
      setAuthState('error')
    }
  }

  // ====================================
  // GUEST MODE
  // ====================================
  const handleGuestMode = async () => {
    setAuthState('loading')
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300))

      const guestUser: QuickUser = {
        id: `guest_${Date.now()}`,
        username: `Ospite${Math.floor(Math.random() * 1000)}`,
        level: 1,
        xp: 0,
        coins: 0,
        isGuest: true,
        avatar: '👤',
        tier: 'newbie'
      }

      localStorage.setItem('fitduel_user', JSON.stringify(guestUser))
      
      setAuthState('success')
      
      setTimeout(() => {
        router.push('/dashboard')
      }, 300)

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
      
      setTimeout(() => {
        router.push('/dashboard')
      }, 300)

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
    const avatars = ['💪', '🏋️‍♀️', '🏋️‍♂️', '🚀', '⚡', '🔥', '🏆', '⭐', '💎', '🎯', '🦾', '🌟']
    return avatars[Math.floor(Math.random() * avatars.length)]
  }

  // ====================================
  // RENDER
  // ====================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
              <span className="text-sm font-medium text-white">Account Demo Pronti</span>
            </div>
            
            <div className="space-y-2">
              {DEMO_USERS.map((user, index) => {
                const tierConfig = TIER_CONFIG[user.tier]
                const TierIcon = tierConfig.icon
                
                return (
                  <motion.button
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    onClick={() => handleDemoLogin(user)}
                    disabled={authState === 'loading'}
                    className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-all group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{user.avatar}</span>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{user.username}</p>
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full border',
                            tierConfig.bgColor,
                            tierConfig.color
                          )}>
                            <TierIcon className="w-3 h-3 inline mr-1" />
                            {tierConfig.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          Level {user.level} • {user.xp} XP • {user.coins} coins
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                  </motion.button>
                )
              })}
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
              <span className="text-sm font-medium text-white">Crea Nuovo Account</span>
            </div>

            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Scegli il tuo username..."
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
                  className="text-red-400 text-sm flex items-center gap-1"
                >
                  <span>⚠️</span> {error}
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
            
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <span className="text-green-400">⚡</span>
                <span>Sfide fitness</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-blue-400">🏆</span>
                <span>Sistema livelli</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-purple-400">👥</span>
                <span>Duelli 1v1</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">🏅</span>
                <span>Achievement</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-gray-500">
            Accedendo accetti i nostri termini di servizio
          </p>
        </motion.div>
      </div>
    </div>
  )
}