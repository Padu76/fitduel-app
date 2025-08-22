'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Eye, EyeOff, Mail, Lock, ArrowRight, 
  Loader2, AlertCircle, CheckCircle, Flame,
  Gamepad2, ArrowLeft
} from 'lucide-react'
import { useUserStore } from '../store/useUserStore'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading, error, isAuthenticated, clearUser } = useUserStore()
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [formErrors, setFormErrors] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  // Clear any existing errors
  useEffect(() => {
    clearUser()
  }, [])

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev: any) => ({
        ...prev,
        [name]: null
      }))
    }
  }

  // Validate form
  const validateForm = () => {
    const errors: any = {}
    
    if (!formData.email) {
      errors.email = 'Email è richiesta'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email non valida'
    }
    
    if (!formData.password) {
      errors.password = 'Password è richiesta'
    } else if (formData.password.length < 6) {
      errors.password = 'Password deve essere almeno 6 caratteri'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      const success = await login(formData.email, formData.password, formData.rememberMe)
      
      if (success) {
        // Redirect to dashboard
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Quick demo login
  const handleDemoLogin = async () => {
    setFormData({
      email: 'demo@fitduel.com',
      password: 'demo123',
      rememberMe: false
    })
    
    setIsSubmitting(true)
    
    try {
      const success = await login('demo@fitduel.com', 'demo123', false)
      if (success) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Demo login error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden">
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
        <motion.div 
          className="absolute top-20 right-20 w-96 h-96 bg-green-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-20 p-6">
        <div className="flex items-center justify-between">
          <Link href="/auth">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-black" />
              </div>
              <h1 className="text-xl font-black bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                FITDUEL
              </h1>
            </motion.div>
          </Link>

          <Link 
            href="/auth"
            className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Indietro
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <Gamepad2 className="w-10 h-10 text-black" />
            </div>
            <h1 className="text-4xl font-black mb-3">
              BENTORNATO
            </h1>
            <p className="text-gray-400">
              Accedi al tuo account FitDuel
            </p>
          </motion.div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </motion.div>
          )}

          {/* Login Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Email Field */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full bg-gray-900/50 border rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                    formErrors.email 
                      ? 'border-red-500 focus:ring-red-500/50' 
                      : 'border-gray-700 focus:border-green-400 focus:ring-green-400/50'
                  }`}
                  placeholder="mario@email.com"
                  disabled={isSubmitting}
                />
              </div>
              {formErrors.email && (
                <p className="text-red-400 text-sm mt-2">{formErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full bg-gray-900/50 border rounded-xl py-4 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                    formErrors.password 
                      ? 'border-red-500 focus:ring-red-500/50' 
                      : 'border-gray-700 focus:border-green-400 focus:ring-green-400/50'
                  }`}
                  placeholder="La tua password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-400 transition-colors"
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-red-400 text-sm mt-2">{formErrors.password}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-900 text-green-400 focus:ring-green-400 focus:ring-2"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-400">Ricordami</span>
              </label>
              
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-green-400 hover:text-green-300 transition-colors"
              >
                Password dimenticata?
              </Link>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-black font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Accesso in corso...
                </>
              ) : (
                <>
                  ACCEDI
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gray-700"></div>
            <span className="text-gray-500 text-sm">OPPURE</span>
            <div className="flex-1 h-px bg-gray-700"></div>
          </div>

          {/* Demo Login */}
          <motion.button
            onClick={handleDemoLogin}
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gray-800 border border-gray-600 text-white font-bold py-4 rounded-xl transition-all hover:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Gamepad2 className="w-5 h-5" />
            Prova Demo Rapido
          </motion.button>

          {/* Register Link */}
          <div className="text-center mt-8">
            <p className="text-gray-400">
              Non hai un account?{' '}
              <Link 
                href="/register" 
                className="text-green-400 hover:text-green-300 font-bold transition-colors"
              >
                Registrati qui
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-auto p-6 text-center">
        <p className="text-sm text-gray-500">
          © 2024 FitDuel Arena. Game on, fit on.
        </p>
      </footer>
    </div>
  )
}