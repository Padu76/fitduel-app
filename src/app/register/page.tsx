'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle,
  User, Gamepad2, Zap, Trophy, Target, Calendar
} from 'lucide-react'

export default function RegisterPage() {
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    birthDate: '',
    fitnessLevel: 'beginner',
    goals: [] as string[],
    newsletter: false,
    terms: false
  })
  
  // UI state
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)

  // Fitness goals options
  const fitnessGoals = [
    'Perdere peso',
    'Aumentare massa muscolare',
    'Migliorare resistenza',
    'Tonificare corpo',
    'Aumentare forza',
    'Flessibilità'
  ]

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const target = e.target as HTMLInputElement
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? target.checked : value
    }))
    setError('') // Clear error when user types
  }

  // Handle goals selection
  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }))
  }

  // Check username availability
  const checkUsername = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setCheckingUsername(true)
    try {
      const response = await fetch(`/api/auth/register?username=${encodeURIComponent(username)}`)
      const result = await response.json()
      setUsernameAvailable(result.available)
    } catch (error) {
      console.error('Username check error:', error)
      setUsernameAvailable(null)
    } finally {
      setCheckingUsername(false)
    }
  }

  // Username check with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username && formData.username.length >= 3) {
        checkUsername(formData.username)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.username])

  // Validate form
  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.username) {
      throw new Error('Compila tutti i campi obbligatori')
    }

    if (formData.password.length < 6) {
      throw new Error('Password deve essere almeno 6 caratteri')
    }

    if (formData.password !== formData.confirmPassword) {
      throw new Error('Le password non coincidono')
    }

    if (!formData.terms) {
      throw new Error('Devi accettare i termini e condizioni')
    }

    if (usernameAvailable === false) {
      throw new Error('Username non disponibile')
    }

    // Age validation if birth date provided
    if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      
      if (age < 13) {
        throw new Error('Devi avere almeno 13 anni per registrarti')
      }
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validate form
      validateForm()

      // Call register API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          birthDate: formData.birthDate || null,
          fitnessLevel: formData.fitnessLevel,
          goals: formData.goals,
          newsletter: formData.newsletter,
          terms: formData.terms
        })
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('Registrazione completata con successo! 🎉')
        
        // If auto-login successful, redirect to dashboard
        if (result.data?.session) {
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 2000)
        } else {
          // Email confirmation required
          setTimeout(() => {
            window.location.href = '/login?message=confirm-email'
          }, 3000)
        }
      } else {
        setError(result.message || 'Errore durante la registrazione')
      }

    } catch (error: any) {
      console.error('Registration error:', error)
      setError(error.message || 'Errore durante la registrazione')
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
        {[...Array(30)].map((_, i) => (
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
        <div className="hidden lg:flex lg:w-2/5 flex-col justify-center items-center p-8">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center mb-6">
              <Gamepad2 className="h-14 w-14 text-red-500 mr-3" />
              <h1 className="text-5xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                FITDUEL
              </h1>
            </div>
            <p className="text-xl text-gray-300 font-semibold mb-6">
              INIZIA LA TUA BATTAGLIA
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-4 max-w-sm"
          >
            <div className="flex items-center text-gray-300">
              <Zap className="h-5 w-5 text-yellow-500 mr-3" />
              <span>Compete con atleti globali</span>
            </div>
            <div className="flex items-center text-gray-300">
              <Trophy className="h-5 w-5 text-yellow-500 mr-3" />
              <span>Scala le classifiche</span>
            </div>
            <div className="flex items-center text-gray-300">
              <Target className="h-5 w-5 text-yellow-500 mr-3" />
              <span>Raggiungi i tuoi obiettivi</span>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="w-full lg:w-3/5 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-lg space-y-6"
          >
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <Gamepad2 className="h-10 w-10 text-red-500 mr-3" />
                <h1 className="text-3xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                  FITDUEL
                </h1>
              </div>
            </div>

            {/* Header */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                Entra nell'Arena
              </h2>
              <p className="text-gray-400 text-sm">
                Crea il tuo account e inizia la sfida
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center p-3 bg-green-900/50 border border-green-500 rounded-lg"
              >
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-green-200 text-sm">{success}</span>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center p-3 bg-red-900/50 border border-red-500 rounded-lg"
              >
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <span className="text-red-200 text-sm">{error}</span>
              </motion.div>
            )}

            {/* Registration Form */}
            <div className="space-y-4" onKeyPress={handleKeyPress}>
              {/* Email & Username Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email Input */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-300">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white placeholder-gray-400 text-sm"
                      placeholder="email@example.com"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Username Input */}
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-gray-300">
                    Username *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white placeholder-gray-400 text-sm"
                      placeholder="TuoUsername"
                      disabled={isLoading}
                    />
                    {/* Username availability indicator */}
                    {formData.username.length >= 3 && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {checkingUsername ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                        ) : usernameAvailable === true ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : usernameAvailable === false ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : null}
                      </div>
                    )}
                  </div>
                  {formData.username.length >= 3 && usernameAvailable !== null && (
                    <p className={`text-xs ${usernameAvailable ? 'text-green-400' : 'text-red-400'}`}>
                      {usernameAvailable ? 'Username disponibile' : 'Username già in uso'}
                    </p>
                  )}
                </div>
              </div>

              {/* Password Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password Input */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-300">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-10 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white placeholder-gray-400 text-sm"
                      placeholder="Almeno 6 caratteri"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-white"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                    Conferma Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-10 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white placeholder-gray-400 text-sm"
                      placeholder="Ripeti password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-white"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Birth Date & Fitness Level Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Birth Date */}
                <div className="space-y-2">
                  <label htmlFor="birthDate" className="text-sm font-medium text-gray-300">
                    Data di Nascita
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="birthDate"
                      name="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Fitness Level */}
                <div className="space-y-2">
                  <label htmlFor="fitnessLevel" className="text-sm font-medium text-gray-300">
                    Livello Fitness
                  </label>
                  <select
                    id="fitnessLevel"
                    name="fitnessLevel"
                    value={formData.fitnessLevel}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-sm"
                    disabled={isLoading}
                  >
                    <option value="beginner">Principiante</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzato</option>
                  </select>
                </div>
              </div>

              {/* Fitness Goals */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Obiettivi Fitness (opzionale)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {fitnessGoals.map((goal) => (
                    <label key={goal} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.goals.includes(goal)}
                        onChange={() => handleGoalToggle(goal)}
                        className="h-3 w-3 text-red-500 bg-gray-900 border-gray-600 rounded focus:ring-red-500"
                        disabled={isLoading}
                      />
                      <span className="ml-2 text-xs text-gray-300">{goal}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="newsletter"
                    checked={formData.newsletter}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-red-500 bg-gray-900 border-gray-600 rounded focus:ring-red-500"
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-gray-300">
                    Ricevi newsletter con tips e sfide
                  </span>
                </label>

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="terms"
                    checked={formData.terms}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-red-500 bg-gray-900 border-gray-600 rounded focus:ring-red-500 mt-0.5"
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-gray-300">
                    Accetto i{' '}
                    <a href="/terms" className="text-red-500 hover:text-red-400">
                      termini e condizioni
                    </a>{' '}
                    e la{' '}
                    <a href="/privacy" className="text-red-500 hover:text-red-400">
                      privacy policy
                    </a>{' '}
                    *
                  </span>
                </label>
              </div>

              {/* Register Button */}
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || usernameAvailable === false}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                  isLoading || usernameAvailable === false
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-red-500/25'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Registrazione in corso...
                  </div>
                ) : (
                  'ENTRA NELL\'ARENA'
                )}
              </motion.button>
            </div>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-gray-800">
              <p className="text-gray-400 text-sm">
                Hai già un account?{' '}
                <a 
                  href="/login"
                  className="text-red-500 hover:text-red-400 font-semibold transition-colors"
                >
                  Accedi qui
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}