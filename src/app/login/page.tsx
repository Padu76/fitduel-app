'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail,
  Lock,
  Flame, 
  ArrowRight, 
  Loader2, 
  Gamepad2,
  Zap,
  Trophy,
  Star,
  Crown,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { cn } from '@/utils/cn'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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
type AuthMode = 'login' | 'demo'

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
  const supabase = createClientComponentClient()
  const [authState, setAuthState] = useState<AuthState>('idle')
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasCheckedAuth = useRef(false)
  
  // Login form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Check if user is already logged in - ONLY ONCE
  useEffect(() => {
    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true
      checkUser()
    }
  }, [])

  const checkUser = async () => {
    try {
      // Check Supabase auth
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        console.log('👋 User già loggato con Supabase:', user.email)
        router.push('/dashboard')
        return
      }

      // Check demo user
      const savedUser = localStorage.getItem('fitduel_user')
      if (savedUser) {
        const demoUser = JSON.parse(savedUser)
        console.log('👋 User demo già loggato:', demoUser.username)
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Error checking user:', err)
    }
  }

  // ====================================
  // SUPABASE LOGIN
  // ====================================
  const handleSupabaseLogin = async () => {
    if (!email || !password) {
      setError('Inserisci email e password')
      return
    }

    setAuthState('loading')
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Login error:', error)
        
        // Better error messages in Italian
        if (error.message === 'Invalid login credentials') {
          setError('Email o password non corretti')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Devi confermare la tua email prima di accedere')
        } else if (error.message.includes('rate limit')) {
          setError('Troppi tentativi. Riprova tra qualche minuto')
        } else {
          setError('Errore durante il login. Riprova.')
        }
        
        setAuthState('error')
        return
      }

      if (data.user) {
        console.log('✅ Login con Supabase riuscito:', data.user.email)
        setAuthState('success')
        
        // Clear any demo user data
        localStorage.removeItem('fitduel_user')
        
        // Navigate to dashboard
        router.push('/dashboard')
      }
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
      router.push('/dashboard')

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
      router.push('/dashboard')

    } catch (err: any) {
      console.error('Demo login error:', err)
      setError('Errore demo login')
      setAuthState('error')
    }
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
            {authMode === 'login' ? 'Accedi al tuo account' : 'Inizia la tua avventura fitness'}
          </motion.p>
        </div>

        {/* Auth Mode Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex gap-2 mb-6"
        >
          <Button
            variant={authMode === 'login' ? 'gradient' : 'ghost'}
            onClick={() => {
              setAuthMode('login')
              setError(null)
            }}
            className="flex-1"
            size="sm"
            disabled={authState === 'loading'}
          >
            Accedi
          </Button>
          <Button
            variant={authMode === 'demo' ? 'gradient' : 'ghost'}
            onClick={() => {
              setAuthMode('demo')
              setError(null)
            }}
            className="flex-1"
            size="sm"
            disabled={authState === 'loading'}
          >
            Account Demo
          </Button>
        </motion.div>

        {/* Login Form */}
        {authMode === 'login' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <Card variant="glass" className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="tua@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && password && handleSupabaseLogin()}
                    disabled={authState === 'loading'}
                    icon={<Mail className="w-5 h-5" />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && email && handleSupabaseLogin()}
                      disabled={authState === 'loading'}
                      icon={<Lock className="w-5 h-5" />}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      disabled={authState === 'loading'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                  </motion.div>
                )}

                <Button
                  variant="gradient"
                  size="lg"
                  onClick={handleSupabaseLogin}
                  disabled={authState === 'loading' || !email || !password}
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
                      Accedi
                    </>
                  )}
                </Button>

                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-400">
                    Non hai un account?{' '}
                    <a 
                      href="/register" 
                      className="text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Registrati
                    </a>
                  </p>
                  <p className="text-xs text-gray-500">oppure</p>
                  <Button
                    variant="secondary"
                    onClick={handleGuestMode}
                    disabled={authState === 'loading'}
                    className="w-full"
                  >
                    <Gamepad2 className="w-4 h-4 mr-2" />
                    Gioca come Ospite
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Demo Users */}
        {authMode === 'demo' && (
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

              <div className="mt-4 pt-4 border-t border-gray-800">
                <Button
                  variant="secondary"
                  onClick={handleGuestMode}
                  disabled={authState === 'loading'}
                  className="w-full"
                >
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  Gioca come Ospite
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

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
            Accedendo accetti i nostri{' '}
            <a href="/terms" className="text-indigo-400 hover:text-indigo-300">
              termini di servizio
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}