'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Mail, Lock, Eye, EyeOff, LogIn, UserPlus, 
  Github, Chrome, Apple, Zap, Trophy, Users,
  CheckCircle, AlertCircle, Loader2, ArrowRight,
  Sparkles, Flame, Target, TrendingUp
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

// ====================================
// TYPES
// ====================================
interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

interface LoginError {
  field?: 'email' | 'password' | 'general'
  message: string
}

// ====================================
// LOGIN PAGE COMPONENT
// ====================================
export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<LoginError | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear errors when user types
    if (error) setError(null)
  }

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.email) {
      setError({ field: 'email', message: 'Email richiesta' })
      return false
    }
    if (!formData.email.includes('@')) {
      setError({ field: 'email', message: 'Email non valida' })
      return false
    }
    if (!formData.password) {
      setError({ field: 'password', message: 'Password richiesta' })
      return false
    }
    if (formData.password.length < 6) {
      setError({ field: 'password', message: 'Password deve essere almeno 6 caratteri' })
      return false
    }
    return true
  }

  // Handle login submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // })

      // For demo: simulate success
      setShowSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (err) {
      setError({ 
        field: 'general', 
        message: 'Credenziali non valide. Riprova.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle social login
  const handleSocialLogin = async (provider: 'google' | 'github' | 'apple') => {
    setIsLoading(true)
    try {
      // TODO: Implement social login
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/dashboard')
    } catch (err) {
      setError({ field: 'general', message: `Errore login con ${provider}` })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Branding */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden lg:block"
          >
            <div className="space-y-8">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">FitDuel</h1>
              </div>

              {/* Tagline */}
              <div className="space-y-4">
                <h2 className="text-5xl font-bold text-white leading-tight">
                  Trasforma il Fitness<br />
                  in una <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Sfida Epica</span>
                </h2>
                <p className="text-xl text-gray-300">
                  Compete con amici, sali di livello, diventa il campione!
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <FeatureItem
                  icon={Trophy}
                  title="Sfide 1v1"
                  description="Compete in duelli real-time"
                />
                <FeatureItem
                  icon={Zap}
                  title="Sistema XP"
                  description="Guadagna punti esperienza e sali di livello"
                />
                <FeatureItem
                  icon={Users}
                  title="Community"
                  description="Unisciti a migliaia di atleti"
                />
                <FeatureItem
                  icon={Target}
                  title="Obiettivi Personalizzati"
                  description="Traccia i tuoi progressi"
                />
              </div>

              {/* Stats */}
              <div className="flex gap-8">
                <div>
                  <p className="text-3xl font-bold text-white">10K+</p>
                  <p className="text-gray-400">Utenti Attivi</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">50K+</p>
                  <p className="text-gray-400">Sfide Completate</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">4.9★</p>
                  <p className="text-gray-400">Rating App</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right side - Login form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card variant="glass" className="p-8">
              {/* Mobile logo */}
              <div className="lg:hidden mb-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Flame className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">FitDuel</h1>
              </div>

              {/* Form header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Bentornato Campione! 
                </h3>
                <p className="text-gray-400">
                  Accedi per continuare la tua sfida
                </p>
              </div>

              {/* Social login buttons */}
              <div className="space-y-3 mb-6">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => handleSocialLogin('google')}
                  disabled={isLoading}
                >
                  <Chrome className="w-5 h-5 mr-2" />
                  Continua con Google
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => handleSocialLogin('github')}
                    disabled={isLoading}
                  >
                    <Github className="w-5 h-5 mr-2" />
                    GitHub
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => handleSocialLogin('apple')}
                    disabled={isLoading}
                  >
                    <Apple className="w-5 h-5 mr-2" />
                    Apple
                  </Button>
                </div>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-900 text-gray-400">
                    Oppure con email
                  </span>
                </div>
              </div>

              {/* Login form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="campione@fitduel.com"
                    icon={<Mail className="w-5 h-5" />}
                    error={error?.field === 'email'}
                    errorMessage={error?.field === 'email' ? error.message : undefined}
                    disabled={isLoading}
                    required
                  />
                </div>

                {/* Password input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    icon={<Lock className="w-5 h-5" />}
                    endIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    }
                    error={error?.field === 'password'}
                    errorMessage={error?.field === 'password' ? error.message : undefined}
                    disabled={isLoading}
                    required
                  />
                </div>

                {/* Remember me & Forgot password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                      disabled={isLoading}
                    />
                    <span className="ml-2 text-sm text-gray-300">
                      Ricordami
                    </span>
                  </label>
                  
                  <Link
                    href="/forgot-password"
                    className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Password dimenticata?
                  </Link>
                </div>

                {/* Error message */}
                {error?.field === 'general' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-sm text-red-400">{error.message}</p>
                  </motion.div>
                )}

                {/* Success message */}
                {showSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
                  >
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <p className="text-sm text-green-400">Login effettuato! Reindirizzamento...</p>
                  </motion.div>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  disabled={isLoading || showSuccess}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Accesso in corso...
                    </>
                  ) : showSuccess ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Accesso effettuato!
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 mr-2" />
                      Accedi
                    </>
                  )}
                </Button>

                {/* Sign up link */}
                <div className="text-center">
                  <p className="text-gray-400">
                    Non hai un account?{' '}
                    <Link
                      href="/register"
                      className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors inline-flex items-center gap-1"
                    >
                      Registrati ora
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </p>
                </div>
              </form>

              {/* Demo account info */}
              <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-indigo-400 mb-1">
                      Account Demo
                    </p>
                    <p className="text-xs text-gray-400">
                      Email: demo@fitduel.com<br />
                      Password: demo123
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// ====================================
// FEATURE ITEM COMPONENT
// ====================================
function FeatureItem({
  icon: Icon,
  title,
  description
}: {
  icon: any
  title: string
  description: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3"
    >
      <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-indigo-400" />
      </div>
      <div>
        <h4 className="font-semibold text-white">{title}</h4>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </motion.div>
  )
}