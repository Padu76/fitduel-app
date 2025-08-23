'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Mail, Lock, Eye, EyeOff, AlertCircle, 
  Gamepad2, Zap, Trophy, Target
} from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Load saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('fitduel_email')
    const savedPassword = localStorage.getItem('fitduel_password')
    const savedRemember = localStorage.getItem('fitduel_remember') === 'true'
    
    if (savedEmail && savedRemember) {
      setEmail(savedEmail)
      setRememberMe(savedRemember)
    }
    if (savedPassword && savedRemember) {
      setPassword(savedPassword)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Basic validation
    if (!email || !password) {
      setError('Email e password sono obbligatori')
      setIsLoading(false)
      return
    }

    if (!email.includes('@')) {
      setError('Inserisci un indirizzo email valido')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri')
      setIsLoading(false)
      return
    }

    try {
      // Simulate API call - Replace with real authentication
      await new Promise(resolve => setTimeout(resolve, 1500))

      // For now, accept any valid email/password format
      // TODO: Replace with real Supabase authentication
      
      // Save credentials if remember me is checked
      if (rememberMe) {
        localStorage.setItem('fitduel_email', email)
        localStorage.setItem('fitduel_password', password)
        localStorage.setItem('fitduel_remember', 'true')
      } else {
        localStorage.removeItem('fitduel_email')
        localStorage.removeItem('fitduel_password')
        localStorage.setItem('fitduel_remember', 'false')
      }

      // Set user session
      localStorage.setItem('fitduel_user', JSON.stringify({
        email: email,
        name: email.split('@')[0],
        loginTime: new Date().toISOString()
      }))

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError('Errore durante il login. Riprova.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-600/20 to-blue-600/20 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl flex items-center justify-center"
          >
            <Gamepad2 className="w-8 h-8 text-white" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-white mb-2"
          >
            BENTORNATO
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400"
          >
            Accedi al tuo account FitDuel
          </motion.p>
        </div>

        {/* Competitive Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 text-center">
            <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
            <div className="text-white font-bold text-lg">24/7</div>
            <div className="text-gray-400 text-xs">Sfide</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 text-center">
            <Trophy className="w-6 h-6 text-orange-400 mx-auto mb-1" />
            <div className="text-white font-bold text-lg">ELITE</div>
            <div className="text-gray-400 text-xs">Training</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 text-center">
            <Target className="w-6 h-6 text-red-400 mx-auto mb-1" />
            <div className="text-white font-bold text-lg">PRO</div>
            <div className="text-gray-400 text-xs">Level</div>
          </div>
        </motion.div>

        {/* Login Form */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onSubmit={handleLogin}
          className="space-y-6"
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-900/20 border border-red-500/20 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            </motion.div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="tuo@email.com"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl pl-10 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                rememberMe 
                  ? 'bg-blue-500 border-blue-500' 
                  : 'border-gray-600 hover:border-gray-500'
              }`}>
                {rememberMe && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-white rounded-sm"
                  />
                )}
              </div>
              <span className="ml-2 text-sm text-gray-300">Ricordami</span>
            </label>

            <Link 
              href="/forgot-password" 
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Password dimenticata?
            </Link>
          </div>

          {/* Login Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>ACCESSO IN CORSO...</span>
              </div>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>ACCEDI</span>
                <span>→</span>
              </span>
            )}
          </motion.button>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gray-900 px-4 text-sm text-gray-400">OPPURE</span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <span className="text-gray-400">Non hai un account? </span>
            <Link 
              href="/register" 
              className="text-green-400 hover:text-green-300 font-medium transition-colors"
            >
              Registrati qui
            </Link>
          </div>
        </motion.form>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8"
        >
          <p className="text-gray-500 text-sm">
            © 2024 FitDuel Arena. Game on, fit on.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}