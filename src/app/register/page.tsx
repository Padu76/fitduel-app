'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mail, Lock, Eye, EyeOff, User, UserPlus,
  Github, Chrome, Apple, Zap, Trophy, Users,
  CheckCircle, AlertCircle, Loader2, ArrowRight,
  Sparkles, Flame, Target, TrendingUp, Calendar,
  Shield, Award, Heart, Activity
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

// ====================================
// TYPES
// ====================================
interface RegisterFormData {
  username: string
  email: string
  password: string
  confirmPassword: string
  birthDate: string
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced' | ''
  goals: string[]
  acceptTerms: boolean
  newsletter: boolean
}

interface RegisterError {
  field?: 'username' | 'email' | 'password' | 'confirmPassword' | 'birthDate' | 'terms' | 'general'
  message: string
}

// ====================================
// FITNESS LEVELS
// ====================================
const fitnessLevels = [
  {
    id: 'beginner',
    name: 'Principiante',
    description: 'Nuovo al fitness',
    icon: Heart,
    color: 'text-green-500 bg-green-500/10 border-green-500/20'
  },
  {
    id: 'intermediate',
    name: 'Intermedio',
    description: 'Allenamento regolare',
    icon: Activity,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
  },
  {
    id: 'advanced',
    name: 'Avanzato',
    description: 'Atleta esperto',
    icon: Trophy,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20'
  }
]

// ====================================
// FITNESS GOALS
// ====================================
const fitnessGoals = [
  { id: 'weight_loss', name: 'Perdere Peso', icon: TrendingUp },
  { id: 'muscle_gain', name: 'Aumentare Massa', icon: Shield },
  { id: 'endurance', name: 'Resistenza', icon: Zap },
  { id: 'strength', name: 'Forza', icon: Award },
  { id: 'flexibility', name: 'Flessibilità', icon: Activity },
  { id: 'competition', name: 'Competizione', icon: Trophy }
]

// ====================================
// REGISTER PAGE COMPONENT
// ====================================
export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: Basic Info, 2: Fitness Profile, 3: Complete
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    fitnessLevel: '',
    goals: [],
    acceptTerms: false,
    newsletter: true
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<RegisterError | null>(null)
  const [passwordStrength, setPasswordStrength] = useState(0)

  // Calculate password strength
  const calculatePasswordStrength = (password: string): number => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++
    return Math.min(strength, 5)
  }

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value))
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear errors when user types
    if (error) setError(null)
  }

  // Handle fitness level selection
  const handleFitnessLevel = (level: 'beginner' | 'intermediate' | 'advanced') => {
    setFormData(prev => ({ ...prev, fitnessLevel: level }))
    if (error) setError(null)
  }

  // Handle goals selection
  const handleGoalToggle = (goalId: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(g => g !== goalId)
        : [...prev.goals, goalId]
    }))
  }

  // Validate step 1
  const validateStep1 = (): boolean => {
    if (!formData.username) {
      setError({ field: 'username', message: 'Username richiesto' })
      return false
    }
    if (formData.username.length < 3) {
      setError({ field: 'username', message: 'Username deve essere almeno 3 caratteri' })
      return false
    }
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
    if (formData.password.length < 8) {
      setError({ field: 'password', message: 'Password deve essere almeno 8 caratteri' })
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError({ field: 'confirmPassword', message: 'Le password non corrispondono' })
      return false
    }
    if (!formData.birthDate) {
      setError({ field: 'birthDate', message: 'Data di nascita richiesta' })
      return false
    }
    
    // Check age (must be at least 13)
    const birthDate = new Date(formData.birthDate)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    if (age < 13) {
      setError({ field: 'birthDate', message: 'Devi avere almeno 13 anni' })
      return false
    }
    
    return true
  }

  // Validate step 2
  const validateStep2 = (): boolean => {
    if (!formData.fitnessLevel) {
      setError({ field: 'general', message: 'Seleziona il tuo livello fitness' })
      return false
    }
    if (formData.goals.length === 0) {
      setError({ field: 'general', message: 'Seleziona almeno un obiettivo' })
      return false
    }
    if (!formData.acceptTerms) {
      setError({ field: 'terms', message: 'Devi accettare i termini e condizioni' })
      return false
    }
    return true
  }

  // Handle next step
  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      handleSubmit()
    }
  }

  // Handle registration submission
  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // })

      // Show success step
      setStep(3)
      
      // Redirect after delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    } catch (err) {
      setError({ 
        field: 'general', 
        message: 'Errore durante la registrazione. Riprova.' 
      })
      setIsLoading(false)
    }
  }

  // Handle social registration
  const handleSocialRegister = async (provider: 'google' | 'github' | 'apple') => {
    setIsLoading(true)
    try {
      // TODO: Implement social registration
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/onboarding')
    } catch (err) {
      setError({ field: 'general', message: `Errore registrazione con ${provider}` })
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

      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo and header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Flame className="w-8 h-8 text-white" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">
              {step === 3 ? 'Benvenuto in FitDuel!' : 'Unisciti a FitDuel'}
            </h1>
            <p className="text-gray-400">
              {step === 1 && 'Crea il tuo account e inizia la sfida'}
              {step === 2 && 'Personalizza il tuo profilo fitness'}
              {step === 3 && 'Il tuo account è pronto!'}
            </p>
          </div>

          {/* Progress indicator */}
          {step < 3 && (
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                  step >= 1 ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-400'
                )}>
                  1
                </div>
                <div className={cn(
                  'w-24 h-1',
                  step >= 2 ? 'bg-indigo-500' : 'bg-gray-700'
                )} />
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                  step >= 2 ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-400'
                )}>
                  2
                </div>
              </div>
            </div>
          )}

          <Card variant="glass" className="p-8">
            <AnimatePresence mode="wait">
              {/* Step 1: Basic Information */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Social registration */}
                  <div className="space-y-3">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full"
                      onClick={() => handleSocialRegister('google')}
                      disabled={isLoading}
                    >
                      <Chrome className="w-5 h-5 mr-2" />
                      Registrati con Google
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => handleSocialRegister('github')}
                        disabled={isLoading}
                      >
                        <Github className="w-5 h-5 mr-2" />
                        GitHub
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleSocialRegister('apple')}
                        disabled={isLoading}
                      >
                        <Apple className="w-5 h-5 mr-2" />
                        Apple
                      </Button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-gray-900 text-gray-400">
                        Oppure con email
                      </span>
                    </div>
                  </div>

                  {/* Registration form - Step 1 */}
                  <div className="space-y-4">
                    {/* Username */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Username
                      </label>
                      <Input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="campione123"
                        icon={<User className="w-5 h-5" />}
                        error={error?.field === 'username'}
                        errorMessage={error?.field === 'username' ? error.message : undefined}
                        disabled={isLoading}
                        required
                      />
                    </div>

                    {/* Email */}
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

                    {/* Password */}
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
                      
                      {/* Password strength indicator */}
                      {formData.password && (
                        <div className="mt-2">
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  'h-1 flex-1 rounded-full transition-colors',
                                  i < passwordStrength
                                    ? passwordStrength <= 2 ? 'bg-red-500'
                                    : passwordStrength <= 3 ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                    : 'bg-gray-700'
                                )}
                              />
                            ))}
                          </div>
                          <p className={cn(
                            'text-xs mt-1',
                            passwordStrength <= 2 ? 'text-red-400'
                            : passwordStrength <= 3 ? 'text-yellow-400'
                            : 'text-green-400'
                          )}>
                            {passwordStrength <= 2 ? 'Password debole'
                            : passwordStrength <= 3 ? 'Password media'
                            : 'Password forte'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Conferma Password
                      </label>
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        icon={<Lock className="w-5 h-5" />}
                        endIcon={
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        }
                        error={error?.field === 'confirmPassword'}
                        errorMessage={error?.field === 'confirmPassword' ? error.message : undefined}
                        disabled={isLoading}
                        required
                      />
                    </div>

                    {/* Birth Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Data di Nascita
                      </label>
                      <Input
                        type="date"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleChange}
                        icon={<Calendar className="w-5 h-5" />}
                        error={error?.field === 'birthDate'}
                        errorMessage={error?.field === 'birthDate' ? error.message : undefined}
                        disabled={isLoading}
                        required
                      />
                    </div>
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

                  {/* Next button */}
                  <Button
                    variant="gradient"
                    size="lg"
                    className="w-full"
                    onClick={handleNextStep}
                    disabled={isLoading}
                  >
                    Continua
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>

                  {/* Login link */}
                  <div className="text-center">
                    <p className="text-gray-400">
                      Hai già un account?{' '}
                      <Link
                        href="/login"
                        className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                      >
                        Accedi
                      </Link>
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Fitness Profile */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Fitness Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-4">
                      Qual è il tuo livello fitness attuale?
                    </label>
                    <div className="grid gap-3">
                      {fitnessLevels.map((level) => {
                        const Icon = level.icon
                        return (
                          <button
                            key={level.id}
                            type="button"
                            onClick={() => handleFitnessLevel(level.id as any)}
                            className={cn(
                              'p-4 rounded-xl border-2 transition-all text-left',
                              formData.fitnessLevel === level.id
                                ? level.color + ' border-current'
                                : 'border-gray-700 hover:border-gray-600'
                            )}
                            disabled={isLoading}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-6 h-6" />
                              <div>
                                <p className="font-semibold">{level.name}</p>
                                <p className="text-sm text-gray-400">{level.description}</p>
                              </div>
                              {formData.fitnessLevel === level.id && (
                                <CheckCircle className="w-5 h-5 ml-auto" />
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Fitness Goals */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-4">
                      Quali sono i tuoi obiettivi? (Seleziona tutti quelli pertinenti)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {fitnessGoals.map((goal) => {
                        const Icon = goal.icon
                        const isSelected = formData.goals.includes(goal.id)
                        return (
                          <button
                            key={goal.id}
                            type="button"
                            onClick={() => handleGoalToggle(goal.id)}
                            className={cn(
                              'p-3 rounded-lg border transition-all',
                              isSelected
                                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                                : 'border-gray-700 hover:border-gray-600 text-gray-300'
                            )}
                            disabled={isLoading}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="w-5 h-5" />
                              <span className="text-sm font-medium">{goal.name}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Terms and Newsletter */}
                  <div className="space-y-3">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        name="acceptTerms"
                        checked={formData.acceptTerms}
                        onChange={handleChange}
                        className="w-4 h-4 mt-1 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                        disabled={isLoading}
                      />
                      <span className="text-sm text-gray-300">
                        Accetto i{' '}
                        <Link href="/terms" className="text-indigo-400 hover:text-indigo-300">
                          Termini e Condizioni
                        </Link>
                        {' '}e la{' '}
                        <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300">
                          Privacy Policy
                        </Link>
                      </span>
                    </label>
                    
                    {error?.field === 'terms' && (
                      <p className="text-sm text-red-400 ml-7">{error.message}</p>
                    )}
                    
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        name="newsletter"
                        checked={formData.newsletter}
                        onChange={handleChange}
                        className="w-4 h-4 mt-1 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                        disabled={isLoading}
                      />
                      <span className="text-sm text-gray-300">
                        Voglio ricevere tips fitness e aggiornamenti via email
                      </span>
                    </label>
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

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => setStep(1)}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Indietro
                    </Button>
                    <Button
                      variant="gradient"
                      size="lg"
                      onClick={handleNextStep}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Creazione...
                        </>
                      ) : (
                        <>
                          Crea Account
                          <Sparkles className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Success */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle className="w-12 h-12 text-white" />
                  </motion.div>

                  <h2 className="text-2xl font-bold text-white mb-2">
                    Account Creato con Successo! 🎉
                  </h2>
                  <p className="text-gray-400 mb-8">
                    Benvenuto nella community FitDuel, {formData.username}!
                  </p>

                  <div className="space-y-4 max-w-sm mx-auto">
                    <div className="flex items-center gap-3 p-3 bg-indigo-500/10 rounded-lg">
                      <Trophy className="w-5 h-5 text-indigo-400" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">100 XP di Benvenuto</p>
                        <p className="text-xs text-gray-400">Inizia con un bonus!</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-purple-500/10 rounded-lg">
                      <Zap className="w-5 h-5 text-purple-400" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">Prima Sfida Sbloccata</p>
                        <p className="text-xs text-gray-400">Pronto per il tuo primo duello?</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
                      <Users className="w-5 h-5 text-green-400" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">+1000 Atleti Online</p>
                        <p className="text-xs text-gray-400">Trova il tuo avversario!</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <p className="text-sm text-gray-400 mb-4">
                      Reindirizzamento alla dashboard in corso...
                    </p>
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}