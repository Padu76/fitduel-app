'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface LiveStats {
  onlineCount: number
  battlesCount: number
  dailyWins: number
}

export default function HeroSection() {
  const router = useRouter()
  const [stats, setStats] = useState<LiveStats>({
    onlineCount: 0,
    battlesCount: 0,
    dailyWins: 0
  })

  useEffect(() => {
    // Animate counters
    const animateValue = (key: keyof LiveStats, target: number, duration: number = 2000) => {
      const increment = target / (duration / 16)
      let current = 0
      
      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          current = target
          clearInterval(timer)
        }
        setStats(prev => ({ ...prev, [key]: Math.floor(current) }))
      }, 16)
    }

    animateValue('onlineCount', 2847)
    animateValue('battlesCount', 142)
    animateValue('dailyWins', 8234)

    // Random updates for live feel
    const interval = setInterval(() => {
      setStats(prev => ({
        onlineCount: Math.max(100, prev.onlineCount + Math.floor(Math.random() * 20) - 10),
        battlesCount: Math.max(50, prev.battlesCount + Math.floor(Math.random() * 10) - 5),
        dailyWins: prev.dailyWins + Math.floor(Math.random() * 5)
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop"
          alt="Hero Background"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-black" />
      </div>

      {/* Animated Particles */}
      <div className="absolute inset-0 z-10">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-green-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20],
              x: [-20, 20],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Hero Content */}
      <div className="relative z-20 text-center px-4 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-block bg-gradient-to-r from-green-400 to-blue-500 px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider mb-8 text-black"
        >
          🔥 Season 1 Live Now
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-6xl md:text-8xl font-black uppercase mb-6 tracking-tight"
        >
          FitDuel Arena
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-300 mb-12"
        >
          Sfida i tuoi amici. Vinci in 30 secondi. Domina la classifica.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/auth')}
          className="bg-gradient-to-r from-green-400 to-blue-500 text-black px-12 py-6 rounded-full text-2xl font-black uppercase tracking-wider shadow-2xl hover:shadow-green-400/50 transition-all duration-300"
        >
          GIOCA ORA
        </motion.button>

        {/* Live Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto"
        >
          <StatCard
            value={stats.onlineCount}
            label="Online Ora"
          />
          <StatCard
            value={stats.battlesCount}
            label="Sfide Live"
          />
          <StatCard
            value={stats.dailyWins}
            label="Vittorie Oggi"
          />
        </motion.div>
      </div>
    </section>
  )
}

// Sub-component for stat cards
function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-green-400/20 rounded-2xl p-6 hover:border-blue-500/50 transition-colors">
      <div className="text-4xl font-black text-green-400">
        {value.toLocaleString()}
      </div>
      <div className="text-sm text-gray-400 uppercase tracking-wider mt-2">
        {label}
      </div>
    </div>
  )
}