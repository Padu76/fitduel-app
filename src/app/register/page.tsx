'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle,
  User, Gamepad2, Zap, Trophy, Target, Shield
} from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const passwordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 2) return 'bg-red-500'
    if (strength < 4) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthLabel = (strength: number) => {
    if (strength < 2) return 'Debole'
    if (strength < 4) return 'Media'
    return 'Forte'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Tutti i campi sono obbligatori')
      setIsLoading(false)
      return
    }

    if (!formData.email.includes('@')) {
      setError('Inserisci un indirizzo email valido')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('La password deve essere di almeno 8 caratteri')
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Le password non coincidono')
      setIsLoading(false)
      return
    }

    if (passwordStrength(formData.password) < 3) {
      setError('La password deve essere più sicura')
      setIsLoading(false)
      return
    }

    if (!acceptTerms) {
      setError('Devi accettare i termini e condizioni')
      setIsLoading(false)
      return
    }

    try {
      // Simulate API call - Replace with real Supabase registration
      await new Promise(resolve => setTimeout(resolve, 2000))

      // TODO: Replace with real Supabase authentication
      
      // Set user session
      localStorage.setItem('fitduel_user', JSON.stringify({
        email: formData.email,
        name: formData.name,
        loginTime: new Date().toISOString()
      }))

      // Save credentials
      localStorage.setItem('fitduel_email', formData.email)
      localStorage.setItem('fitduel_remember', 'true')

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError('Errore durante la registrazione. Riprova.')
    } finally {
      setIsLoading(false)
    }
  }

  const strength = passwordStrength(formData.password)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full blur-3xl" />
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
            className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center"
          >
            <Gamepad2 className="w-8 h-8 text-white" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-white mb-2"
          >
            UNISCITI ALLA ELITE
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400"
          >
            Crea il tuo account FitDuel
          </motion.p>
        </div>

        {/* Elite Features */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 text-center">
            <Shield className="w-6 h-6 text-blue-400 mx-auto mb-1" />
            <div className="text-white font-bold text-sm">SICURO</div>
            <div className="text-gray-400 text-xs">Encrypted</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 text-center">
            <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
            <div className="text-white font-bold text-sm">VELOCE</div>
            <div className="text-gray-400 text-xs">Setup</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 text-center">
            <Trophy className="w-6 h-6 text-orange-400 mx-auto mb-1" />
            <div className="text-white font-bold text-sm">ELITE</div>
            <div className="text-gray-400 text-xs">Access</div>
          </div>
        </motion.div>

        {/* Registration Form */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onSubmit={handleSubmit}
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

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome Utente
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Il tuo nome da fighter"
                required
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl pl-10 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 bg-gray-700 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full transition-all duration-300 ${getPasswordStrengthColor(strength)}`}
                      style={{ width: `${(strength / 5) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    strength < 2 ? 'text-red-400' : 
                    strength < 4 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {getPasswordStrengthLabel(strength)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Conferma Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl pl-10 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {/* Password Match Indicator */}
            {formData.confirmPassword && (
              <div className="mt-2">
                {formData.password === formData.confirmPassword ? (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Le password coincidono</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Le password non coincidono</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="sr-only"
            />
            <div 
              onClick={() => setAcceptTerms(!acceptTerms)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                acceptTerms 
                  ? 'bg-purple-500 border-purple-500' 
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              {acceptTerms && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2 h-2 bg-white rounded-sm"
                />
              )}
            </div>
            <div className="text-sm text-gray-300">
              Accetto i{' '}
              <Link href="/terms" className="text-purple-400 hover:text-purple-300 underline">
                termini e condizioni
              </Link>
              {' '}e la{' '}
              <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline">
                privacy policy
              </Link>
            </div>
          </div>

          {/* Register Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>CREAZIONE ACCOUNT...</span>
              </div>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>ENTRA NELLA ELITE</span>
                <Target className="w-5 h-5" />
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

          {/* Login Link */}
          <div className="text-center">
            <span className="text-gray-400">Hai già un account? </span>
            <Link 
              href="/login" 
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Accedi qui
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