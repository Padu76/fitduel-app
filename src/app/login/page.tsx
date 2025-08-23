'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Mail, Lock, Eye, EyeOff, AlertCircle, 
  Gamepad2, Zap, Trophy, Target, CheckCircle 
} from 'lucide-react'

export default function LoginPage() {
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  
  // UI state
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setError('') // Clear error when user types
  }

  // Handle form submission with API call
  const handleSubmit = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validate form
      if (!formData.email || !formData.password) {
        throw new Error('Inserisci email e password')
      }

      // Call login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe
        })
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('Login effettuato con successo! 🎉')
        
        // Store remember me preference
        if (formData.rememberMe) {
          localStorage.setItem('fitduel-remember', 'true')
        }
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
      } else {
        setError(result.message || 'Errore durante il login')
      }

    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || 'Errore durante il login')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit()
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-orange-900/20" />
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-red-500/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center mb-6">
              <Gamepad2 className="h-16 w-16 text-red-500 mr-4" />
              <h1 className="text-6xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                FITDUEL
              </h1>
            </div>
            <p className="text-2xl text-gray-300 font-semibold mb-8">
              DOVE I CAMPIONI SI SFIDANO
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6 max-w-md"
          >
            <div className="flex items-center text-gray-300">
              <Zap className="h-6 w-6 text-yellow-500 mr-4" />
              <span className="text-lg">Sfide in tempo reale</span>
            </div>
            <div className="flex items-center text-gray-300">
              <Trophy className="h-6 w-6 text-yellow-500 mr-4" />
              <span className="text-lg">Classifiche competitive</span>
            </div>
            <div className="flex items-center text-gray-300">
              <Target className="h-6 w-6 text-yellow-500 mr-4" />
              <span className="text-lg">Training personalizzato</span>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-md space-y-8"
          >
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Gamepad2 className="h-12 w-12 text-red-500 mr-3" />
                <h1 className="text-4xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                  FITDUEL
                </h1>
              </div>
            </div>

            {/* Header */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">
                Accedi al Combat
              </h2>
              <p className="text-gray-400">
                Entra nell'arena e domina la competizione
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center p-4 bg-green-900/50 border border-green-500 rounded-lg"
              >
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-green-200">{success}</span>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center p-4 bg-red-900/50 border border-red-500 rounded-lg"
              >
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <span className="text-red-200">{error}</span>
              </motion.div>
            )}

            {/* Login Form */}
            <div className="space-y-6" onKeyPress={handleKeyPress}>
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-300">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white placeholder-gray-400"
                    placeholder="Il tuo indirizzo email"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white placeholder-gray-400"
                    placeholder="La tua password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-white"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-red-500 bg-gray-900 border-gray-600 rounded focus:ring-red-500"
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-gray-300">Ricordami</span>
                </label>
                <a 
                  href="/forgot-password"
                  className="text-sm text-red-500 hover:text-red-400 transition-colors"
                >
                  Password dimenticata?
                </a>
              </div>

              {/* Login Button */}
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                  isLoading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-red-500/25'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Accesso in corso...
                  </div>
                ) : (
                  'ENTRA IN BATTAGLIA'
                )}
              </motion.button>
            </div>

            {/* Register Link */}
            <div className="text-center pt-6 border-t border-gray-800">
              <p className="text-gray-400">
                Non hai ancora un account?{' '}
                <a 
                  href="/register"
                  className="text-red-500 hover:text-red-400 font-semibold transition-colors"
                >
                  Registrati ora
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}