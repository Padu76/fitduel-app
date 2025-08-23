'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Mail, ArrowLeft, ArrowRight, Loader2, 
  CheckCircle, AlertCircle, Flame
} from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Email è richiesta')
      return
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email non valida')
      return
    }
    
    setIsSubmitting(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setIsSubmitted(true)
      } else {
        setError(data.message || 'Errore durante l\'invio')
      }
    } catch (error) {
      setError('Errore di rete. Riprova più tardi.')
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
            href="/login"
            className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna al Login
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          
          {!isSubmitted ? (
            <>
              {/* Hero */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <Mail className="w-10 h-10 text-black" />
                </div>
                <h1 className="text-4xl font-black mb-3">
                  PASSWORD DIMENTICATA?
                </h1>
                <p className="text-gray-400">
                  Inserisci la tua email e ti invieremo un link per reimpostare la password
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

              {/* Form */}
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-green-400 focus:ring-green-400/50 transition-all"
                      placeholder="mario@email.com"
                      disabled={isSubmitting}
                    />
                  </div>
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
                      Invio in corso...
                    </>
                  ) : (
                    <>
                      INVIA LINK
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            </>
          ) : (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-black" />
              </div>
              <h1 className="text-4xl font-black mb-3">
                EMAIL INVIATA!
              </h1>
              <p className="text-gray-400 mb-6">
                Controlla la tua casella email. Ti abbiamo inviato un link per reimpostare la password.
              </p>
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
                <p className="text-green-400 text-sm">
                  Se non ricevi l'email entro 5 minuti, controlla la cartella spam o riprova.
                </p>
              </div>
              <motion.button
                onClick={() => {
                  setIsSubmitted(false)
                  setEmail('')
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gray-800 border border-gray-600 text-white font-bold py-4 rounded-xl transition-all hover:border-green-400"
              >
                Invia di nuovo
              </motion.button>
            </motion.div>
          )}

          {/* Back to Login */}
          <div className="text-center mt-8">
            <p className="text-gray-400">
              Ricordi la password?{' '}
              <Link 
                href="/login" 
                className="text-green-400 hover:text-green-300 font-bold transition-colors"
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