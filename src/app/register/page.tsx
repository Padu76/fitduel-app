'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Eye, EyeOff, Mail, Lock, User, ArrowRight, 
  Loader2, AlertCircle, CheckCircle, Flame,
  Rocket, ArrowLeft, Calendar, Target
} from 'lucide-react'
import { useUserStore } from '../store/useUserStore'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading, error, isAuthenticated, clearUser } = useUserStore()
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    birthDate: '',
    fitnessLevel: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    goals: [] as string[],
    newsletter: false,
    terms: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [formErrors, setFormErrors] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [usernameCheck, setUsernameCheck] = useState<{
    available: boolean | null,
    checking: boolean
  }>({ available: null, checking: false })

  // Available goals
  const availableGoals = [
    { id: 'lose_weight', label: 'Perdere peso', icon: '🎯' },
    { id: 'build_muscle', label: 'Aumentare muscoli', icon: '💪' },
    { id: 'improve_endurance', label: 'Resistenza', icon: '🏃' },
    { id: 'get_stronger', label: 'Diventare più forte', icon: '🔥' },
    { id: 'stay_healthy', label: 'Mantenersi in salute', icon: '❤️' },
    { id: 'compete', label: 'Competere', icon: '🏆' }
  ]

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

  // Check username availability
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) return
    
    setUsernameCheck({ available: null, checking: true })
    
    try {
      const response = await fetch(`/api/auth/register?username=${encodeURIComponent(username)}`)
      const data = await response.json()
      setUsernameCheck({ available: data.available, checking: false })
    } catch (error) {
      setUsernameCheck({ available: null, checking: false })
    }
  }

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
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

    // Check username availability
    if (name === 'username' && value.length >= 3) {
      checkUsernameAvailability(value)
    }
  }

  // Handle goal toggle
  const toggleGoal = (goalId: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(g => g !== goalId)
        : [...prev.goals, goalId]
    }))
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
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password = 'Password deve contenere almeno una maiuscola'
    } else if (!/[0-9]/.test(formData.password)) {
      errors.password = 'Password deve contenere almeno un numero'
    }
    
    if (!formData.username) {
      errors.username = 'Username è richiesto'
    } else if (formData.username.length < 3) {
      errors.username = 'Username deve essere almeno 3 caratteri'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Username può contenere solo lettere, numeri e underscore'
    } else if (usernameCheck.available === false) {
      errors.username = 'Username già in uso'
    }
    
    if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      if (age < 13) {
        errors.birthDate = 'Devi avere almeno 13 anni'
      }
    }
    
    if (!formData.terms) {
      errors.terms = 'Devi accettare i termini e condizioni'
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
      const success = await register(formData)
      
      if (success) {
        // Redirect to dashboard or welcome page
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Registration error:', error)
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
          className="absolute top-20 left-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
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
        <div className="max-w-lg mx-auto">
          
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <Rocket className="w-10 h-10 text-black" />
            </div>
            <h1 className="text-4xl font-black mb-3">
              UNISCITI ALLA BATTAGLIA
            </h1>
            <p className="text-gray-400">
              Crea il tuo account FitDuel
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

          {/* Registration Form */}
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
                Email *
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
                      : 'border-gray-700 focus:border-blue-400 focus:ring-blue-400/50'
                  }`}
                  placeholder="mario@email.com"
                  disabled={isSubmitting}
                />
              </div>
              {formErrors.email && (
                <p className="text-red-400 text-sm mt-2">{formErrors.email}</p>
              )}
            </div>

            {/* Username Field */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Username *
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full bg-gray-900/50 border rounded-xl py-4 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                    formErrors.username 
                      ? 'border-red-500 focus:ring-red-500/50' 
                      : usernameCheck.available === true
                      ? 'border-green-500 focus:ring-green-500/50'
                      : usernameCheck.available === false
                      ? 'border-red-500 focus:ring-red-500/50'
                      : 'border-gray-700 focus:border-blue-400 focus:ring-blue-400/50'
                  }`}
                  placeholder="mariothewarrior"
                  disabled={isSubmitting}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  {usernameCheck.checking ? (
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  ) : usernameCheck.available === true ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : usernameCheck.available === false ? (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  ) : null}
                </div>
              </div>
              {formErrors.username && (
                <p className="text-red-400 text-sm mt-2">{formErrors.username}</p>
              )}
              {usernameCheck.available === true && (
                <p className="text-green-400 text-sm mt-2">Username disponibile!</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Password *
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
                      : 'border-gray-700 focus:border-blue-400 focus:ring-blue-400/50'
                  }`}
                  placeholder="Almeno 6 caratteri, 1 maiuscola e 1 numero"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors"
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-red-400 text-sm mt-2">{formErrors.password}</p>
              )}
            </div>

            {/* Birth Date Field */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Data di nascita (opzionale)
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className={`w-full bg-gray-900/50 border rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 transition-all ${
                    formErrors.birthDate 
                      ? 'border-red-500 focus:ring-red-500/50' 
                      : 'border-gray-700 focus:border-blue-400 focus:ring-blue-400/50'
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              {formErrors.birthDate && (
                <p className="text-red-400 text-sm mt-2">{formErrors.birthDate}</p>
              )}
            </div>

            {/* Fitness Level */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Livello di fitness
              </label>
              <select
                name="fitnessLevel"
                value={formData.fitnessLevel}
                onChange={handleChange}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:border-blue-400 focus:ring-blue-400/50 transition-all"
                disabled={isSubmitting}
              >
                <option value="beginner">🌱 Principiante</option>
                <option value="intermediate">💪 Intermedio</option>
                <option value="advanced">🔥 Avanzato</option>
              </select>
            </div>

            {/* Goals Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                I tuoi obiettivi (opzionale)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {availableGoals.map(goal => (
                  <motion.button
                    key={goal.id}
                    type="button"
                    onClick={() => toggleGoal(goal.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-3 rounded-xl border transition-all text-left ${
                      formData.goals.includes(goal.id)
                        ? 'bg-blue-500/20 border-blue-400 text-blue-400'
                        : 'bg-gray-900/50 border-gray-700 text-gray-400 hover:border-blue-400/50'
                    }`}
                    disabled={isSubmitting}
                  >
                    <div className="text-lg mb-1">{goal.icon}</div>
                    <div className="text-sm font-medium">{goal.label}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Newsletter & Terms */}
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="newsletter"
                  checked={formData.newsletter}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-900 text-blue-400 focus:ring-blue-400 focus:ring-2"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-400">
                  Voglio ricevere aggiornamenti e offerte speciali
                </span>
              </label>
              
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleChange}
                  className="w-5 h-5 mt-0.5 rounded border-gray-600 bg-gray-900 text-blue-400 focus:ring-blue-400 focus:ring-2"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-400">
                  Accetto i{' '}
                  <Link href="/terms" className="text-blue-400 hover:text-blue-300 underline">
                    Termini e Condizioni
                  </Link>{' '}
                  e la{' '}
                  <Link href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
                    Privacy Policy
                  </Link>
                  *
                </span>
              </label>
              {formErrors.terms && (
                <p className="text-red-400 text-sm">{formErrors.terms}</p>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting || usernameCheck.checking}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-blue-400 to-purple-500 text-black font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creazione account...
                </>
              ) : (
                <>
                  CREA ACCOUNT
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Login Link */}
          <div className="text-center mt-8">
            <p className="text-gray-400">
              Hai già un account?{' '}
              <Link 
                href="/login" 
                className="text-blue-400 hover:text-blue-300 font-bold transition-colors"
              >
                Accedi qui
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