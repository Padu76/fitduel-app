'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail,
  Lock,
  Flame, 
  ArrowRight, 
  Loader2, 
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { cn } from '@/utils/cn'

// ====================================
// TYPES
// ====================================
interface SimpleAuthProps {
  onAuthSuccess?: (user: AuthUser) => void
  onError?: (error: string) => void
  className?: string
}

interface AuthUser {
  id: string
  email: string
  username: string
  level: number
  xp: number
}

interface AuthResponse {
  success: boolean
  message: string
  data?: {
    user: AuthUser
    session: {
      access_token: string
      refresh_token: string
      expires_in: number
    }
  }
  error?: string
}

type AuthMode = 'login' | 'register'
type AuthState = 'idle' | 'loading' | 'success' | 'error'

// ====================================
// VALIDATION RULES (SIMPLIFIED FOR DEBUG)
// ====================================
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validateEmail = (email: string) => {
  if (!email) return 'Email richiesta'
  if (!emailRegex.test(email)) return 'Email non valida'
  return null
}

const validatePassword = (password: string) => {
  if (!password) return 'Password richiesta'
  if (password.length < 6) return 'Password deve essere almeno 6 caratteri'
  // Removed complex validation for debug
  return null
}

const validateUsername = (username: string) => {
  if (!username) return 'Username richiesto'
  if (username.length < 3) return 'Username deve essere almeno 3 caratteri'
  if (username.length > 20) return 'Username massimo 20 caratteri'
  // Simplified regex for debug
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username può contenere solo lettere, numeri e underscore'
  return null
}

// ====================================
// COMPONENT
// ====================================
export default function SimpleAuth({ 
  onAuthSuccess, 
  onError,
  className 
}: SimpleAuthProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [authState, setAuthState] = useState<AuthState>('idle')
  const [showPassword, setShowPassword] = useState(false)
  
  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  
  // Validation & errors
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)

  // Debug logging
  const debugLog = (message: string, data?: any) => {
    console.log(`🔍 [SimpleAuth Debug] ${message}`, data || '')
  }

  // ====================================
  // VALIDATION HELPERS
  // ====================================
  const validateForm = () => {
    debugLog('🔍 Starting form validation...')
    const newErrors: Record<string, string> = {}
    
    const emailError = validateEmail(email)
    if (emailError) newErrors.email = emailError
    
    const passwordError = validatePassword(password)
    if (passwordError) newErrors.password = passwordError
    
    if (mode === 'register') {
      const usernameError = validateUsername(username)
      if (usernameError) newErrors.username = usernameError
      
      if (!acceptTerms) newErrors.terms = 'Devi accettare i termini e condizioni'
      
      if (usernameAvailable === false) newErrors.username = 'Username non disponibile'
    }
    
    debugLog('🔍 Validation results:', { newErrors, hasErrors: Object.keys(newErrors).length > 0 })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ====================================
  // USERNAME AVAILABILITY CHECK
  // ====================================
  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setUsernameAvailable(null)
      return
    }

    debugLog('🔍 Checking username availability:', usernameToCheck)
    setCheckingUsername(true)
    
    try {
      const response = await fetch(`/api/auth/register?username=${encodeURIComponent(usernameToCheck)}`)
      const data = await response.json()
      debugLog('🔍 Username check response:', data)
      setUsernameAvailable(data.available)
    } catch (error) {
      debugLog('❌ Username check error:', error)
      setUsernameAvailable(null)
    } finally {
      setCheckingUsername(false)
    }
  }

  // ====================================
  // LOGIN HANDLER
  // ====================================
  const handleLogin = async () => {
    debugLog('🔍 Starting login process...')
    
    if (!validateForm()) {
      debugLog('❌ Login validation failed')
      return
    }

    setAuthState('loading')
    setGeneralError(null)

    const loginData = {
      email,
      password,
      rememberMe
    }

    debugLog('🔍 Login data:', loginData)

    try {
      debugLog('🔍 Making login API call...')
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      })

      debugLog('🔍 Login response status:', response.status)
      const data: AuthResponse = await response.json()
      debugLog('🔍 Login response data:', data)

      if (data.success && data.data) {
        setAuthState('success')
        debugLog('✅ Login successful:', data.data.user)
        onAuthSuccess?.(data.data.user)
      } else {
        setAuthState('error')
        const errorMessage = data.message || 'Errore durante il login'
        setGeneralError(errorMessage)
        debugLog('❌ Login failed:', errorMessage)
        onError?.(data.error || 'LOGIN_FAILED')
      }
    } catch (error) {
      debugLog('❌ Login network error:', error)
      setAuthState('error')
      setGeneralError('Errore di connessione. Riprova.')
      onError?.('NETWORK_ERROR')
    }
  }

  // ====================================
  // REGISTER HANDLER
  // ====================================
  const handleRegister = async () => {
    debugLog('🔍 Starting registration process...')

    if (!validateForm()) {
      debugLog('❌ Registration validation failed')
      return
    }

    setAuthState('loading')
    setGeneralError(null)

    const registerData = {
      email,
      password,
      username,
      terms: acceptTerms,
      fitnessLevel: 'beginner',
      goals: ['general_fitness'],
      newsletter: false
    }

    debugLog('🔍 Registration data:', registerData)

    try {
      debugLog('🔍 Making registration API call...')
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData)
      })

      debugLog('🔍 Registration response status:', response.status)
      const data: AuthResponse = await response.json()
      debugLog('🔍 Registration response data:', data)

      if (data.success) {
        if (data.data?.session) {
          // Auto-login successful
          setAuthState('success')
          debugLog('✅ Registration with auto-login successful:', data.data.user)
          onAuthSuccess?.(data.data.user)
        } else {
          // Email confirmation required
          setAuthState('success')
          setGeneralError(null)
          debugLog('✅ Registration successful, email confirmation required')
          alert(data.message || 'Registrazione completata! Controlla la tua email.')
        }
      } else {
        setAuthState('error')
        const errorMessage = data.message || 'Errore durante la registrazione'
        setGeneralError(errorMessage)
        debugLog('❌ Registration failed:', errorMessage)
        onError?.(data.error || 'REGISTER_FAILED')
      }
    } catch (error) {
      debugLog('❌ Registration network error:', error)
      setAuthState('error')
      setGeneralError('Errore di connessione. Riprova.')
      onError?.('NETWORK_ERROR')
    }
  }

  // ====================================
  // EVENT HANDLERS
  // ====================================
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    debugLog('🔍 Submit triggered, mode:', mode)
    debugLog('🔍 Form state:', { email, password, username, acceptTerms, authState })
    
    // Force debug - always proceed even with validation errors for now
    if (mode === 'login') {
      await handleLogin()
    } else {
      await handleRegister()
    }
  }

  const handleModeSwitch = () => {
    debugLog(`🔍 Switching mode from ${mode} to ${mode === 'login' ? 'register' : 'login'}`)
    setMode(mode === 'login' ? 'register' : 'login')
    setErrors({})
    setGeneralError(null)
    setAuthState('idle')
    setUsernameAvailable(null)
  }

  const handleUsernameChange = (value: string) => {
    debugLog('🔍 Username changed to:', value)
    setUsername(value)
    setErrors(prev => ({ ...prev, username: '' }))
    
    // Debounce username check
    const timer = setTimeout(() => {
      if (value && value.length >= 3) {
        checkUsernameAvailability(value)
      }
    }, 500)

    return () => clearTimeout(timer)
  }

  // ====================================
  // RENDER HELPERS
  // ====================================
  const renderUsernameStatus = () => {
    if (checkingUsername) {
      return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
    }
    if (usernameAvailable === true) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    }
    if (usernameAvailable === false) {
      return <XCircle className="w-4 h-4 text-red-500" />
    }
    return null
  }

  const isFormValid = () => {
    if (mode === 'login') {
      return email && password
    } else {
      return email && password && username && acceptTerms
    }
  }

  // Add debug info to see what's happening
  debugLog('🔍 Component render:', { mode, authState, isFormValid: isFormValid(), errors })

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
          {mode === 'login' ? 'Bentornato, campione!' : 'Inizia la tua avventura fitness'}
        </motion.p>
      </div>

      {/* Auth Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card variant="glass" className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mode Switcher */}
            <div className="flex bg-gray-800/50 rounded-lg p-1">
              <button
                type="button"
                onClick={() => mode !== 'login' && handleModeSwitch()}
                className={cn(
                  "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                  mode === 'login' 
                    ? "bg-indigo-600 text-white shadow-lg" 
                    : "text-gray-400 hover:text-white"
                )}
              >
                Accedi
              </button>
              <button
                type="button"
                onClick={() => mode !== 'register' && handleModeSwitch()}
                className={cn(
                  "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                  mode === 'register' 
                    ? "bg-indigo-600 text-white shadow-lg" 
                    : "text-gray-400 hover:text-white"
                )}
              >
                Registrati
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Email */}
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErrors(prev => ({ ...prev, email: '' }))
                  }}
                  disabled={authState === 'loading'}
                  icon={<Mail className="w-5 h-5" />}
                  error={errors.email}
                />
              </div>

              {/* Username (solo per registrazione) */}
              {mode === 'register' && (
                <div>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      disabled={authState === 'loading'}
                      icon={<User className="w-5 h-5" />}
                      error={errors.username}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {renderUsernameStatus()}
                    </div>
                  </div>
                  {username.length >= 3 && usernameAvailable === true && (
                    <p className="text-sm text-green-500 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Username disponibile
                    </p>
                  )}
                </div>
              )}

              {/* Password */}
              <div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setErrors(prev => ({ ...prev, password: '' }))
                    }}
                    disabled={authState === 'loading'}
                    icon={<Lock className="w-5 h-5" />}
                    error={errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me (solo per login) */}
              {mode === 'login' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-600 rounded focus:ring-indigo-500 focus:ring-2"
                  />
                  <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-300">
                    Ricordami
                  </label>
                </div>
              )}

              {/* Terms (solo per registrazione) */}
              {mode === 'register' && (
                <div>
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-600 rounded focus:ring-indigo-500 focus:ring-2 mt-0.5"
                    />
                    <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-300">
                      Accetto i{' '}
                      <a href="#" className="text-indigo-400 hover:text-indigo-300">
                        termini e condizioni
                      </a>
                    </label>
                  </div>
                  {errors.terms && (
                    <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.terms}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* General Error */}
            {generalError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <p className="text-sm text-red-300">{generalError}</p>
                </div>
              </motion.div>
            )}

            {/* Debug Info */}
            <div className="text-xs text-gray-500 p-2 bg-gray-800/30 rounded">
              Debug: Mode={mode}, Valid={isFormValid().toString()}, State={authState}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="gradient"
              size="lg"
              disabled={authState === 'loading'}
              onClick={(e) => {
                e.preventDefault()
                debugLog('🔍 Button clicked!')
                handleSubmit()
              }}
              className="w-full"
            >
              {authState === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {mode === 'login' ? 'Accesso...' : 'Registrazione...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Accedi' : 'Registrati'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            {/* Mode Switch Link */}
            <div className="text-center">
              <p className="text-sm text-gray-400">
                {mode === 'login' ? 'Non hai un account?' : 'Hai già un account?'}
                {' '}
                <button
                  type="button"
                  onClick={handleModeSwitch}
                  disabled={authState === 'loading'}
                  className="text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  {mode === 'login' ? 'Registrati' : 'Accedi'}
                </button>
              </p>
            </div>
          </form>
        </Card>
      </motion.div>

      {/* Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
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
              <span>Sfide fitness con AI computer vision</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Sistema livelli e XP personalizzato</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Duelli in tempo reale</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Community competitiva</span>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}