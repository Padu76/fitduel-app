'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Flame, AlertCircle, CheckCircle, Info, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { auth } from '@/lib/supabase-client'

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Check if user is already logged in
  useEffect(() => {
    auth.getSession().then(session => {
      if (session) {
        router.push('/dashboard')
      }
    })
  }, [router])

  // Real-time validation
  useEffect(() => {
    const errors: Record<string, string> = {}
    
    // Username validation
    if (username && username.length < 3) {
      errors.username = 'Username deve essere almeno 3 caratteri'
    } else if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username = 'Username può contenere solo lettere, numeri e underscore'
    }
    
    // Email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Email non valida'
    }
    
    // Password validation
    if (password) {
      if (password.length < 6) {
        errors.password = 'Password deve essere almeno 6 caratteri'
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        errors.password = 'Password deve contenere maiuscole, minuscole e numeri'
      }
    }
    
    // Confirm password validation
    if (confirmPassword && password !== confirmPassword) {
      errors.confirmPassword = 'Le password non corrispondono'
    }
    
    // Birth date validation (must be at least 13 years old)
    if (birthDate) {
      const birth = new Date(birthDate)
      const today = new Date()
      const age = today.getFullYear() - birth.getFullYear()
      if (age < 13) {
        errors.birthDate = 'Devi avere almeno 13 anni'
      } else if (age > 100) {
        errors.birthDate = 'Data di nascita non valida'
      }
    }
    
    setValidationErrors(errors)
  }, [username, email, password, confirmPassword, birthDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Final validation
    if (Object.keys(validationErrors).length > 0) {
      setError('Correggi gli errori nel form')
      return
    }
    
    if (!acceptTerms) {
      setError('Devi accettare i termini e condizioni')
      return
    }
    
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Register with Supabase
      const { user, session } = await auth.signUp(email, password, username)
      
      if (!user) {
        throw new Error('Registrazione fallita. Riprova.')
      }
      
      // Success!
      setSuccess('Account creato con successo! 🎉')
      
      // Note: Supabase might require email confirmation
      // If email confirmation is disabled, auto-login will work
      if (session) {
        // Auto-login successful
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      } else {
        // Email confirmation required
        setSuccess('Account creato! Controlla la tua email per confermare la registrazione.')
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
      
    } catch (error: any) {
      console.error('Registration error:', error)
      
      // Handle specific error messages
      if (error.message?.includes('already registered')) {
        setError('Questa email è già registrata')
      } else if (error.message?.includes('Username already taken')) {
        setError('Username già in uso')
      } else if (error.message?.includes('Password')) {
        setError('Password non abbastanza sicura')
      } else if (error.message?.includes('rate limit')) {
        setError('Troppi tentativi. Riprova tra qualche minuto')
      } else {
        setError(error.message || 'Errore durante la registrazione. Riprova.')
      }
      
      // Fallback to demo mode if Supabase not configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        setSuccess('Modalità demo - Registrazione simulata')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-purple-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card variant="glass" className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Unisciti a FitDuel</h1>
            <p className="text-gray-400 mt-2">Inizia il tuo viaggio fitness</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <p className="text-sm text-green-400">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="Username"
                icon={<User className="w-5 h-5" />}
                required
                disabled={isLoading}
                maxLength={20}
              />
              {validationErrors.username && (
                <p className="text-xs text-red-400 mt-1">{validationErrors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                icon={<Mail className="w-5 h-5" />}
                required
                disabled={isLoading}
              />
              {validationErrors.email && (
                <p className="text-xs text-red-400 mt-1">{validationErrors.email}</p>
              )}
            </div>

            {/* Birth Date */}
            <div>
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                placeholder="Data di nascita"
                icon={<Calendar className="w-5 h-5" />}
                required
                disabled={isLoading}
                max={new Date().toISOString().split('T')[0]}
              />
              {validationErrors.birthDate && (
                <p className="text-xs text-red-400 mt-1">{validationErrors.birthDate}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                icon={<Lock className="w-5 h-5" />}
                showPasswordToggle
                required
                disabled={isLoading}
              />
              {validationErrors.password && (
                <p className="text-xs text-red-400 mt-1">{validationErrors.password}</p>
              )}
              {!validationErrors.password && password && (
                <div className="mt-1 flex gap-1">
                  <div className={`h-1 flex-1 rounded ${password.length >= 6 ? 'bg-green-500' : 'bg-gray-700'}`} />
                  <div className={`h-1 flex-1 rounded ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-700'}`} />
                  <div className={`h-1 flex-1 rounded ${/[0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-700'}`} />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Conferma Password"
                icon={<Lock className="w-5 h-5" />}
                showPasswordToggle
                required
                disabled={isLoading}
              />
              {validationErrors.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">{validationErrors.confirmPassword}</p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 mt-0.5"
                disabled={isLoading}
              />
              <label htmlFor="terms" className="text-sm text-gray-400">
                Accetto i{' '}
                <Link href="/terms" className="text-indigo-400 hover:text-indigo-300">
                  Termini di Servizio
                </Link>{' '}
                e la{' '}
                <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Info Box */}
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-start space-x-2">
              <Info className="w-5 h-5 text-indigo-400 mt-0.5" />
              <div className="text-xs text-indigo-300">
                <p className="font-semibold mb-1">Perché registrarsi?</p>
                <ul className="space-y-0.5">
                  <li>• 100 XP bonus di benvenuto 🎁</li>
                  <li>• Sfida giocatori da tutto il mondo</li>
                  <li>• Traccia i tuoi progressi</li>
                  <li>• Partecipa ai tornei settimanali</li>
                </ul>
              </div>
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={isLoading || Object.keys(validationErrors).length > 0 || !acceptTerms}
            >
              {isLoading ? 'Creazione account...' : 'Crea Account'}
            </Button>
          </form>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400">oppure</span>
            </div>
          </div>

          <p className="text-center mt-6 text-gray-400">
            Hai già un account?{' '}
            <Link 
              href="/login" 
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Accedi ora
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}