'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, LogIn, Flame } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate login
    await new Promise(resolve => setTimeout(resolve, 1500))
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card variant="glass" className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">FitDuel</h1>
            <p className="text-gray-400 mt-2">Accedi al tuo account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              icon={<Mail className="w-5 h-5" />}
              required
            />

            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              icon={<Lock className="w-5 h-5" />}
              showPasswordToggle
              required
            />

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              <LogIn className="w-5 h-5 mr-2" />
              {isLoading ? 'Accesso...' : 'Accedi'}
            </Button>
          </form>

          <p className="text-center mt-4 text-gray-400">
            Non hai un account?{' '}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300">
              Registrati
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}