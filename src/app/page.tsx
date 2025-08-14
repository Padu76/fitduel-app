'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Trophy, Target, Users, Activity, TrendingUp, 
  Zap, Swords, Clock, ChevronRight, ArrowRight,
  Flame, Crown, Star, Medal, Shield, Calendar
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DuelCard, DuelData } from '@/components/game/DuelCard'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ====================================
// HERO SECTION
// ====================================
const HeroSection = () => {
  const router = useRouter()
  
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 py-20 px-4">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              FitDuel Arena
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Sfida amici e atleti da tutto il mondo in duelli fitness epici
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Button 
              variant="gradient" 
              size="lg"
              onClick={() => router.push('/register')}
              className="group"
            >
              Inizia Ora
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => router.push('/login')}
            >
              Accedi
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-3 gap-4 max-w-2xl mx-auto"
          >
            <Card variant="glass" className="p-4">
              <p className="text-3xl font-bold text-indigo-400">10K+</p>
              <p className="text-sm text-gray-400">Atleti Attivi</p>
            </Card>
            <Card variant="glass" className="p-4">
              <p className="text-3xl font-bold text-purple-400">50K+</p>
              <p className="text-sm text-gray-400">Duelli Completati</p>
            </Card>
            <Card variant="glass" className="p-4">
              <p className="text-3xl font-bold text-pink-400">1M+</p>
              <p className="text-sm text-gray-400">XP Guadagnati</p>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ====================================
// FEATURES SECTION
// ====================================
const FeaturesSection = () => {
  const features = [
    {
      icon: Swords,
      title: "Duelli in Tempo Reale",
      description: "Sfida altri atleti in competizioni 1v1 intense",
      color: "from-red-500 to-orange-500"
    },
    {
      icon: Activity,
      title: "AI Form Validation",
      description: "Tecnologia AI che valida la forma corretta degli esercizi",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Trophy,
      title: "Sistema di Livelli",
      description: "Sali di livello e sblocca nuove sfide e ricompense",
      color: "from-yellow-500 to-amber-500"
    },
    {
      icon: Users,
      title: "Community Globale",
      description: "Unisciti a migliaia di atleti da tutto il mondo",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Shield,
      title: "Anti-Cheat Avanzato",
      description: "Sistema multi-livello per garantire competizioni eque",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Zap,
      title: "Missioni Giornaliere",
      description: "Completa missioni per guadagnare XP e ricompense extra",
      color: "from-indigo-500 to-purple-500"
    }
  ]

  return (
    <section className="py-20 px-4 bg-gray-900/50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Perché FitDuel?
          </h2>
          <p className="text-gray-400 text-lg">
            La piattaforma definitiva per il fitness competitivo
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card variant="glass" className="p-6 hover:bg-gray-800/50 transition-all">
                <div className={cn(
                  "w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center mb-4",
                  feature.color
                )}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ====================================
// LIVE DUELS SECTION
// ====================================
const LiveDuelsSection = () => {
  const [duels, setDuels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadLiveDuels()
  }, [])

  const loadLiveDuels = async () => {
    try {
      // Get recent active duels with proper joins
      const { data, error } = await supabase
        .from('duels')
        .select(`
          *,
          challenger:profiles!challenger_id(
            id,
            username,
            display_name,
            avatar_url,
            xp
          ),
          challenged:profiles!challenged_id(
            id,
            username,
            display_name,
            avatar_url,
            xp
          ),
          exercise:exercises!exercise_id(
            id,
            name,
            code,
            icon
          )
        `)
        .in('status', ['active', 'completed'])
        .order('updated_at', { ascending: false })
        .limit(3)

      if (!error && data) {
        setDuels(data)
      }
    } catch (err) {
      console.error('Error loading live duels:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateLevel = (xp: number) => {
    return Math.floor(Math.sqrt(xp / 10)) || 1
  }

  if (loading) {
    return (
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </section>
    )
  }

  if (duels.length === 0) {
    return null
  }

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Duelli Live
          </h2>
          <p className="text-gray-400 text-lg">
            Guarda le sfide in corso in tempo reale
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {duels.map((duel, index) => (
            <motion.div
              key={duel.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <DuelCard
                duel={{
                  id: duel.id,
                  challengerId: duel.challenger_id,
                  challengerName: duel.challenger?.username || 'Unknown',
                  challengerLevel: Math.floor(Math.sqrt((duel.challenger as any)?.xp || 0) / 10) || 1,
                  challengerXP: (duel.challenger as any)?.xp || 0,
                  challengerAvatar: duel.challenger?.avatar_url || '/avatars/default.png',
                  challengedId: duel.challenged_id,
                  challengedName: duel.challenged?.username || null,
                  challengedLevel: duel.challenged ? Math.floor(Math.sqrt((duel.challenged as any)?.xp || 0) / 10) || 1 : null,
                  challengedXP: duel.challenged ? (duel.challenged as any)?.xp || 0 : null,
                  challengedAvatar: duel.challenged?.avatar_url || null,
                  exerciseId: duel.exercise_id,
                  exerciseName: duel.exercise?.name || 'Unknown Exercise',
                  exerciseIcon: duel.exercise?.icon || '💪',
                  status: duel.status,
                  type: duel.type,
                  wagerCoins: duel.wager_coins,
                  xpReward: duel.xp_reward,
                  difficulty: duel.difficulty,
                  targetReps: duel.metadata?.targetReps,
                  targetTime: duel.metadata?.targetTime,
                  challengerScore: duel.challenger_score,
                  challengedScore: duel.challenged_score,
                  winnerId: duel.winner_id,
                  expiresAt: duel.expires_at,
                  createdAt: duel.created_at
                }}
                isLive={duel.status === 'active'}
              />
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/challenges">
            <Button variant="secondary">
              Vedi Tutte le Sfide
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ====================================
// LEADERBOARD PREVIEW
// ====================================
const LeaderboardPreview = () => {
  const [leaders, setLeaders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadLeaders()
  }, [])

  const loadLeaders = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('xp', { ascending: false })
        .limit(5)

      if (!error && data) {
        setLeaders(data)
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />
      case 2: return <Medal className="w-5 h-5 text-gray-400" />
      case 3: return <Medal className="w-5 h-5 text-orange-600" />
      default: return <span className="text-gray-500 font-bold">#{rank}</span>
    }
  }

  if (loading || leaders.length === 0) {
    return null
  }

  return (
    <section className="py-20 px-4 bg-gray-900/50">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Top Atleti
          </h2>
          <p className="text-gray-400 text-lg">
            I migliori competitori della settimana
          </p>
        </div>

        <Card variant="glass" className="overflow-hidden">
          <div className="divide-y divide-gray-800">
            {leaders.map((leader, index) => (
              <motion.div
                key={leader.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                className="p-4 hover:bg-gray-800/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 flex items-center justify-center">
                      {getRankIcon(index + 1)}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-bold">
                        {leader.username?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {leader.display_name || leader.username || 'Anonimo'}
                      </p>
                      <p className="text-sm text-gray-400">
                        Livello {Math.floor(Math.sqrt((leader.xp || 0) / 10)) || 1}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-400">
                      {(leader.xp || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">XP Totali</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        <div className="text-center mt-8">
          <Link href="/leaderboard">
            <Button variant="secondary">
              Classifica Completa
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ====================================
// CTA SECTION
// ====================================
const CTASection = () => {
  const router = useRouter()
  
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-10"></div>
      
      <div className="container mx-auto max-w-4xl relative z-10">
        <Card variant="glass" className="p-12 text-center border-indigo-500/20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Pronto a Dominare l'Arena?
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Unisciti a migliaia di atleti che stanno già trasformando il loro allenamento in competizioni epiche
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="gradient" 
                size="lg"
                onClick={() => router.push('/register')}
                className="group"
              >
                Crea Account Gratis
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => router.push('/login')}
              >
                Ho già un account
              </Button>
            </div>

            <p className="text-sm text-gray-400 mt-6">
              Nessuna carta di credito richiesta • Setup in 30 secondi
            </p>
          </motion.div>
        </Card>
      </div>
    </section>
  )
}

// ====================================
// MAIN COMPONENT
// ====================================
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Swords className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">FitDuel</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Accedi
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="gradient" size="sm">
                  Registrati
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <HeroSection />
        <FeaturesSection />
        <LiveDuelsSection />
        <LeaderboardPreview />
        <CTASection />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/50 py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Swords className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-gray-400">
                © 2024 FitDuel. Tutti i diritti riservati.
              </span>
            </div>
            
            <div className="flex gap-6">
              <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
                Termini
              </Link>
              <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
                Privacy
              </Link>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                Supporto
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}