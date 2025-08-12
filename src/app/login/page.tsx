'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Mail, Lock, Eye, EyeOff, LogIn,
  Github, Chrome, Apple, Loader2,
  CheckCircle, AlertCircle, Flame
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (error) setError(null)
  }

  const validateForm = () => {
    if (!formData.email || !formData.email.includes('@')) {
      setError({ field: 'email', message: 'Email non valida' })
      return false
    }
    if (!formData.password || formData.password.length < 6) {
      setError({ field: 'password', message: 'Password min 6 caratteri' })
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setError(null)

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setShowSuccess(true)
      setTimeout(() => router.push('/dashboard'), 1000)
    } catch (err) {
      setError({ field: 'general', message: 'Credenziali non valide' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/dashboard')
    } catch (err) {
      setError({ field: 'general', message: `Errore con ${provider}` })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card variant="glass" className="p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Flame className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">FitDuel</h1>
              <p className="text-gray-400 mt-2">Accedi al tuo account</p>
            </div>

            {/* Social login */}
            <div className="space-y-3 mb-6">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
              >
                <Chrome className="w-5 h-5 mr-2" />
                Google
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="secondary"
                  onClick={() => handleSocialLogin('github')}
                  disabled={isLoading}
                >
                  <Github className="w-5 h-5 mr-2" />
                  GitHub
                </Button>
                <Button
                  variant="secondary"
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
                <span className="px-4 bg-gray-900 text-gray-400">O</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  icon={<Mail className="w-5 h-5" />}
                  error={error?.field === 'email' ? error.message : undefined}
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  icon={<Lock className="w-5 h-5" />}
                  showPasswordToggle={true}
                  error={error?.field === 'password' ? error.message : undefined}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-500"
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-gray-300">Ricordami</span>
                </label>
                
                <Link href="/forgot-password" className="text-sm text-indigo-400 hover:text-indigo-300">
                  Password?
                </Link>
              </div>

              {error?.field === 'general' && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-sm text-red-400">{error.message}</p>
                </div>
              )}

              {showSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <p className="text-sm text-green-400">Login effettuato!</p>
                </div>
              )}

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
                    Accesso...
                  </>
                ) : showSuccess ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Completato!
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Accedi
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-gray-400">
                  Non hai un account?{' '}
                  <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
                    Registrati
                  </Link>
                </p>
              </div>
            </form>

            {/* Demo info */}
            <div className="mt-6 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <p className="text-xs text-center text-gray-400">
                Demo: demo@fitduel.com / demo123
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}