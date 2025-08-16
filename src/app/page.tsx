'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function LandingPage() {
  const router = useRouter()
  const [onlineCount, setOnlineCount] = useState(0)
  const [battlesCount, setBattlesCount] = useState(0)
  const [dailyWins, setDailyWins] = useState(0)

  // Animate counters on mount
  useEffect(() => {
    // Animate counters
    const animateValue = (setter: Function, target: number, duration: number = 2000) => {
      const increment = target / (duration / 16)
      let current = 0
      
      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          current = target
          clearInterval(timer)
        }
        setter(Math.floor(current))
      }, 16)
    }

    animateValue(setOnlineCount, 2847)
    animateValue(setBattlesCount, 142)
    animateValue(setDailyWins, 8234)

    // Random updates for live feel
    const interval = setInterval(() => {
      setOnlineCount(prev => prev + Math.floor(Math.random() * 20) - 10)
      setBattlesCount(prev => Math.max(100, prev + Math.floor(Math.random() * 10) - 5))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Game modes data
  const gameModes = [
    {
      icon: '⚡',
      title: 'SFIDA LAMPO',
      players: '1 VS 1 • 30 SECONDI',
      description: 'Sfida istantanea contro un amico. Chi fa più ripetizioni in 30 secondi vince!',
      bgImage: '/images/mode-quick.jpg' // Placeholder path
    },
    {
      icon: '👥',
      title: 'TEAM BATTLE',
      players: '5 VS 5 • 5 MINUTI',
      description: 'Crea il tuo team e domina. Punti doppi per le vittorie di squadra!',
      bgImage: '/images/mode-team.jpg'
    },
    {
      icon: '🏆',
      title: 'TORNEO DAILY',
      players: '100 PLAYERS • TUTTO IL GIORNO',
      description: 'Accumula punti durante il giorno. Top 3 vincono premi esclusivi!',
      bgImage: '/images/mode-tournament.jpg'
    },
    {
      icon: '🎯',
      title: 'MISSIONI SOLO',
      players: 'SINGLE PLAYER • QUANDO VUOI',
      description: 'Completa missioni giornaliere e sblocca rewards. Nuovo contenuto ogni giorno!',
      bgImage: '/images/mode-solo.jpg'
    }
  ]

  // Battle pass rewards
  const rewards = [
    { tier: 1, icon: '💪', name: 'Avatar Base', premium: false },
    { tier: 5, icon: '🎯', name: 'Emote Victory', premium: false },
    { tier: 10, icon: '🔥', name: 'Skin Fire', premium: true },
    { tier: 15, icon: '⚡', name: 'Boost XP', premium: false },
    { tier: 20, icon: '🏆', name: 'Title Champion', premium: false },
    { tier: 25, icon: '👑', name: 'Crown Effect', premium: true },
    { tier: 30, icon: '💎', name: '1000 Coins', premium: false },
    { tier: 50, icon: '🌟', name: 'Legendary Skin', premium: true }
  ]

  // Features data
  const features = [
    {
      icon: '⚡',
      title: 'Sfide Veloci',
      description: '30 secondi per vincere. Niente allenamenti lunghi. Solo azione pura.'
    },
    {
      icon: '🤖',
      title: 'AI Tracking',
      description: 'La nostra AI conta le tue ripetizioni e valuta la forma. Zero trucchi.'
    },
    {
      icon: '🏆',
      title: 'Rewards Reali',
      description: 'Vinci skin, badge, titoli esclusivi. Mostra a tutti chi è il boss.'
    },
    {
      icon: '👥',
      title: 'Social Competition',
      description: 'Sfida amici, crea team, domina le classifiche. Il fitness è più divertente insieme.'
    },
    {
      icon: '📱',
      title: 'Cross-Platform',
      description: 'Gioca su telefono, tablet o PC. I tuoi progressi ti seguono ovunque.'
    },
    {
      icon: '🎮',
      title: 'Gaming Experience',
      description: 'Interfaccia gaming, effetti epici, progression system. Il fitness diventa un gioco.'
    }
  ]

  // Live feed data
  const liveFeed = [
    { avatar: 'M', name: 'Marco', action: 'ha battuto Luigi', detail: 'Push-ups +150 XP' },
    { avatar: 'S', name: 'Sara', action: 'streak 7 giorni!', detail: '+500 XP' },
    { avatar: 'T', name: 'Team Alpha', action: 'vince il torneo!', detail: '+1000 XP' },
    { avatar: 'L', name: 'Luca', action: 'nuovo record!', detail: '45 squats +200 XP' },
    { avatar: 'A', name: 'Anna', action: 'sblocca skin Epic!', detail: 'Level 25' }
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* HERO SECTION */}
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
              className="absolute w-1 h-1 bg-orange-500 rounded-full"
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
            className="inline-block bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider mb-8"
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
            className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-12 py-6 rounded-full text-2xl font-black uppercase tracking-wider shadow-2xl hover:shadow-orange-500/50 transition-all duration-300"
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
            <div className="bg-gray-900/50 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-6 hover:border-orange-500/50 transition-colors">
              <div className="text-4xl font-black text-orange-500">
                {onlineCount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wider mt-2">
                Online Ora
              </div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-6 hover:border-orange-500/50 transition-colors">
              <div className="text-4xl font-black text-orange-500">
                {battlesCount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wider mt-2">
                Sfide Live
              </div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-6 hover:border-orange-500/50 transition-colors">
              <div className="text-4xl font-black text-orange-500">
                {dailyWins.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wider mt-2">
                Vittorie Oggi
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* GAME MODES SECTION */}
      <section className="py-24 px-4 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl font-black text-center mb-16 uppercase"
          >
            Modalità di Gioco
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {gameModes.map((mode, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="relative group cursor-pointer"
              >
                <div className="relative h-80 rounded-2xl overflow-hidden">
                  {/* Background Image */}
                  <Image
                    src={`https://images.unsplash.com/photo-${
                      index === 0 ? '1549060279-7e168fcee0c2' :
                      index === 1 ? '1552674605-db6894100b4f' :
                      index === 2 ? '1571019613454-516006a1aa2' :
                      '1581009146145-a5de890ff157'
                    }?w=400&h=500&fit=crop`}
                    alt={mode.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <div className="text-5xl mb-4">{mode.icon}</div>
                    <h3 className="text-2xl font-black text-orange-500 mb-2">
                      {mode.title}
                    </h3>
                    <p className="text-xs text-orange-400 font-bold mb-3">
                      {mode.players}
                    </p>
                    <p className="text-sm text-gray-300">
                      {mode.description}
                    </p>
                  </div>

                  {/* Hover Border Effect */}
                  <div className="absolute inset-0 border-2 border-orange-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BATTLE PASS SECTION */}
      <section className="py-24 px-4 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <Image
            src="https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&h=600&fit=crop"
            alt="Battle Pass Background"
            fill
            className="object-cover"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl font-black text-center mb-8 uppercase"
          >
            Battle Pass
          </motion.h2>

          {/* Season Header */}
          <div className="flex flex-wrap justify-between items-center mb-12 gap-6">
            <div className="bg-orange-600 px-8 py-3 rounded-full font-black text-xl">
              SEASON 1 - ORIGINS
            </div>
            
            <div className="flex gap-4">
              {[
                { value: 28, label: 'Giorni' },
                { value: 14, label: 'Ore' },
                { value: 32, label: 'Min' }
              ].map((time, i) => (
                <div key={i} className="bg-gray-900 border border-orange-500/30 rounded-xl p-4 min-w-[80px] text-center">
                  <div className="text-3xl font-black text-orange-500">{time.value}</div>
                  <div className="text-xs text-gray-400 uppercase">{time.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rewards Track */}
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-orange-500 scrollbar-track-gray-900">
            {rewards.map((reward, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className={`
                  min-w-[140px] p-6 rounded-2xl text-center relative
                  ${reward.premium 
                    ? 'bg-gradient-to-br from-orange-600/30 to-orange-500/20 border-2 border-orange-500' 
                    : 'bg-gray-900 border border-gray-800'
                  }
                `}
              >
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-600 px-3 py-1 rounded-full text-xs font-bold">
                  LV {reward.tier}
                </div>
                <div className="text-4xl mb-3 mt-2">{reward.icon}</div>
                <div className="text-sm font-medium">{reward.name}</div>
                {reward.premium && (
                  <div className="absolute top-2 right-2 text-xs bg-orange-500 px-2 py-1 rounded-full">
                    PRO
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE FEED TICKER */}
      <section className="py-8 bg-orange-600/10 border-y border-orange-600/30 overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="px-6 font-black text-orange-500 whitespace-nowrap">
            🔴 LIVE NOW
          </div>
          <div className="flex gap-8 animate-scroll">
            {[...liveFeed, ...liveFeed].map((item, index) => (
              <div key={index} className="flex items-center gap-3 bg-gray-900/50 px-6 py-3 rounded-full whitespace-nowrap">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-orange-500 rounded-full flex items-center justify-center font-bold">
                  {item.avatar}
                </div>
                <div className="text-sm">
                  <span className="text-orange-500 font-bold">{item.name}</span>
                  {' '}{item.action} • {item.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-24 px-4 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl font-black text-center mb-16 uppercase"
          >
            Perché FitDuel?
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center group"
              >
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="w-24 h-24 bg-gradient-to-br from-orange-600 to-orange-500 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6 group-hover:shadow-2xl group-hover:shadow-orange-500/50 transition-shadow duration-300"
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-2xl font-black mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-32 px-4 relative">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=1920&h=800&fit=crop"
            alt="CTA Background"
            fill
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/50" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-4xl mx-auto text-center"
        >
          <h2 className="text-5xl md:text-7xl font-black mb-6 uppercase bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
            Pronto per la battaglia?
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-12">
            Unisciti a migliaia di giocatori. Prima vittoria garantita in 60 secondi.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/auth')}
            className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-12 py-6 rounded-full text-2xl font-black uppercase tracking-wider shadow-2xl hover:shadow-orange-500/50 transition-all duration-300"
          >
            INIZIA GRATIS
          </motion.button>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-4 bg-black border-t border-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            {['Privacy', 'Termini', 'Supporto', 'Discord', 'Twitter'].map((link) => (
              <a
                key={link}
                href="#"
                className="text-gray-400 hover:text-orange-500 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
          <div className="text-center text-gray-500 text-sm">
            © 2024 FitDuel. Game on, fit on.
          </div>
        </div>
      </footer>

      {/* Inline Styles for Animation */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }

        .scrollbar-thin::-webkit-scrollbar {
          height: 8px;
        }

        .scrollbar-thumb-orange-500::-webkit-scrollbar-thumb {
          background-color: #ff6b35;
          border-radius: 9999px;
        }

        .scrollbar-track-gray-900::-webkit-scrollbar-track {
          background-color: #111827;
          border-radius: 9999px;
        }
      `}</style>
    </div>
  )
}