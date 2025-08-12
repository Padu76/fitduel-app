'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, LogIn, Flame, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { auth } from '@/lib/supabase-client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDemoInfo, setShowDemoInfo] = useState(true)

  // Check if user is already logged in
  useEffect(() => {
    auth.getSession().then(session => {
      if (session) {
        router.push('/dashboard')
      }
    })
  }, [router])

  // Demo account quick fill
  const fillDemoAccount = (accountType: 'mario' | 'giulia' | 'luca') => {
    const accounts = {
      mario: { email: 'mario@demo.fitduel', name: 'Mario (Level 25)' },
      giulia: { email: 'giulia@demo.fitduel', name: 'Giulia (Level 12)' },
      luca: { email: 'luca@demo.fitduel', name: 'Luca (Level 3)' }
    }
    
    const account = accounts[accountType]
    setEmail(account.email)
    setPassword('Demo123!')
    setSuccess(`Account demo ${account.name} selezionato`)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Attempt to sign in with Supabase
      const { session, user } = await auth.signIn(email, password)
      
      if (!session || !user) {
        throw new Error('Login fallito. Verifica le credenziali.')
      }

      // Success!
      setSuccess('Login effettuato con successo! Reindirizzamento...')
      
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('fitduel_remember', 'true')
      } else {
        localStorage.removeItem('fitduel_remember')
      }
      
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
      
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Handle specific error messages
      if (error.message?.includes('Invalid login credentials')) {
        setError('Email o password non corretti')
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Devi confermare la tua email prima di accedere')
      } else if (error.message?.includes('Network')) {
        setError('Errore di connessione. Verifica la tua connessione internet')
      } else {
        setError(error.message || 'Errore durante il login. Riprova più tardi')
      }
      
      // If Supabase is not configured, fallback to demo mode
      if (email === 'demo@fitduel.com' && password === 'demo123') {
        setSuccess('Modalità demo attivata. Reindirizzamento...')
        setError(null)
        
        // Store demo session
        localStorage.setItem('fitduel_demo_user', JSON.stringify({
          id: 'demo-user',
          email: 'demo@fitduel.com',
          username: 'DemoUser'
        }))
        
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Demo Info Card */}
        {showDemoInfo && (
          <Card variant="glass" className="p-4 mb-4 border-indigo-500/20">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-indigo-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-300 font-medium mb-2">Account Demo Disponibili:</p>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => fillDemoAccount('mario')}
                      className="block text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      • mario@demo.fitduel (Level 25 - Premium)
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoAccount('giulia')}
                      className="block text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      • giulia@demo.fitduel (Level 12 - User)
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoAccount('luca')}
                      className="block text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      • luca@demo.fitduel (Level 3 - Newbie)
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Password: Demo123!</p>
                </div>
              </div>
              <button
                onClick={() => setShowDemoInfo(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                ×
              </button>
            </div>
          </Card>
        )}

        {/* Login Card */}
        <Card variant="glass" className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">FitDuel</h1>
            <p className="text-gray-400 mt-2">Accedi al tuo account</p>
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
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              icon={<Mail className="w-5 h-5" />}
              required
              disabled={isLoading}
            />

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

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-400">Ricordami</span>
              </label>
              
              <Link 
                href="/forgot-password" 
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Password dimenticata?
              </Link>
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={isLoading || !email || !password}
            >
              <LogIn className="w-5 h-5 mr-2" />
              {isLoading ? 'Accesso in corso...' : 'Accedi'}
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
            Non hai un account?{' '}
            <Link 
              href="/register" 
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Registrati ora
            </Link>
          </p>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <p className="text-center text-xs text-gray-500">
              Effettuando l'accesso, accetti i nostri{' '}
              <Link href="/terms" className="text-indigo-400 hover:text-indigo-300">
                Termini di Servizio
              </Link>{' '}
              e la{' '}
              <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300">
                Privacy Policy
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}