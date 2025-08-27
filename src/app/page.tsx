// src/app/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const { scrollY } = useScroll()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [activeCharacter, setActiveCharacter] = useState(0)
  const router = useRouter()
  
  // Ref per la sezione "Come Funziona"
  const howItWorksRef = useRef<HTMLElement>(null)
  
  // Scroll to How It Works section
  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Characters data with bonuses
  const characters = [
    { 
      id: 1, 
      name: 'BULL RAGE', 
      class: 'TITAN',
      power: '+8% Push-ups, Pull-ups',
      ability: 'POWER SURGE',
      image: '/avatars/bull.png', 
      color: 'from-red-600 to-orange-500',
      glow: 'rgba(239, 68, 68, 0.5)',
      description: 'Domina gli esercizi di forza pura'
    },
    { 
      id: 2, 
      name: 'SPEED LEOPARD', 
      class: 'SPEEDSTER',
      power: '+8% Burpees, Jumping Jacks',
      ability: 'RUSH HOUR',
      image: '/avatars/leopard.png', 
      color: 'from-yellow-500 to-amber-500',
      glow: 'rgba(251, 191, 36, 0.5)',
      description: 'VelocitÃ  e resistenza imbattibili'
    },
    { 
      id: 3, 
      name: 'SHADOW PANTHER', 
      class: 'NINJA',
      power: '+8% Jump Rope, Box Jumps',
      ability: 'SWIFT STRIKE',
      image: '/avatars/panther.png', 
      color: 'from-purple-600 to-pink-500',
      glow: 'rgba(147, 51, 234, 0.5)',
      description: 'AgilitÃ  e precisione letali'
    },
    { 
      id: 4, 
      name: 'STONE GORILLA', 
      class: 'SAGE',
      power: '+8% Plank, Wall Sit',
      ability: 'INNER FOCUS',
      image: '/avatars/gorilla.png', 
      color: 'from-gray-600 to-cyan-500',
      glow: 'rgba(107, 114, 128, 0.5)',
      description: 'StabilitÃ  e controllo assoluti'
    },
    { 
      id: 5, 
      name: 'CRUSHER CROCODILE', 
      class: 'WARRIOR',
      power: '+8% Squats, Lunges',
      ability: 'LAST STAND',
      image: '/avatars/crocodile.png', 
      color: 'from-green-600 to-emerald-500',
      glow: 'rgba(34, 197, 94, 0.5)',
      description: 'Potenza devastante nelle gambe'
    },
    { 
      id: 6, 
      name: 'CYBER SHARK', 
      class: 'HYBRID',
      power: '+5% ALL STATS',
      ability: 'ADAPT',
      image: '/avatars/shark.png', 
      color: 'from-blue-600 to-violet-500',
      glow: 'rgba(59, 130, 246, 0.5)',
      description: 'Versatile e imprevedibile'
    }
  ]

  // Mouse tracking effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove)
      return () => window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Auto-rotate characters
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCharacter((prev) => (prev + 1) % characters.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [characters.length])

  // Parallax transforms
  const y1 = useTransform(scrollY, [0, 300], [0, -50])
  const y2 = useTransform(scrollY, [0, 300], [0, -100])
  const opacity = useTransform(scrollY, [0, 300], [1, 0.5])

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background Grid */}
      <motion.div 
        className="fixed inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 255, 136, 0.15) 0%, transparent 50%)`,
        }}
      />
      
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
      
      {/* Floating Particles */}
      <div className="fixed inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-green-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Hero Section with Fixed Background */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black z-10" />
          <img 
            src="/exercises/fitness-hero.jpg" 
            alt="Fitness Background"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 text-center px-4 max-w-7xl mx-auto">
          {/* Main Title */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ y: y1, opacity }}
          >
            <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
                FITDUEL
              </span>
              <span className="block text-3xl md:text-4xl mt-2 text-white">
                ARENA
              </span>
            </h1>
          </motion.div>

          {/* Main Description Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-12 max-w-3xl mx-auto"
          >
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-md 
              rounded-2xl p-6 border-2 border-green-400/50 shadow-2xl shadow-green-500/20">
              <p className="text-xl md:text-3xl font-bold text-white leading-relaxed">
                Sfida i tuoi amici in battaglie fitness di 30 secondi!
              </p>
              <p className="text-lg md:text-xl text-green-300 mt-2">
                Push-ups, Squats, Burpees e molto altro.
              </p>
              <p className="text-lg md:text-xl text-blue-300">
                L'AI conta le tue ripetizioni. Vinci e domina la classifica!
              </p>
            </div>
          </motion.div>

          {/* CTA Buttons - CORREZIONE QUI! */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/dashboard')}
              className="px-12 py-6 bg-gradient-to-r from-green-500 to-emerald-500 
                rounded-full text-xl font-bold text-white shadow-2xl 
                hover:shadow-green-500/50 transition-all duration-300"
            >
              INIZIA ORA
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/auth')}
              className="px-12 py-6 border-2 border-green-400 rounded-full text-xl font-bold text-green-400 
                hover:bg-green-400/10 transition-all duration-300"
            >
              REGISTRATI
            </motion.button>
          </motion.div>

          {/* Motivational Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-gray-400 text-lg"
          >
            Unisciti a <span className="text-green-400 font-bold">10.000+</span> atleti digitali
          </motion.p>
        </div>
      </section>

      {/* How It Works Detailed Section */}
      <section ref={howItWorksRef} className="py-24 px-4 bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
                COME FUNZIONA FITDUEL
              </span>
            </h2>
            <p className="text-xl text-gray-400">Il fitness gaming che ti farÃ  sudare davvero!</p>
          </motion.div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { 
                step: '01', 
                title: 'REGISTRATI', 
                desc: 'Crea il tuo account gratuito in 30 secondi', 
                icon: 'LOGIN',
                color: 'from-green-500 to-emerald-500' 
              },
              { 
                step: '02', 
                title: 'SCEGLI AVATAR', 
                desc: 'Seleziona il tuo guerriero e sblocca i bonus', 
                icon: 'AVATAR',
                color: 'from-blue-500 to-cyan-500' 
              },
              { 
                step: '03', 
                title: 'LANCIA SFIDE', 
                desc: '30 secondi di pura adrenalina fitness', 
                icon: 'BATTLE',
                color: 'from-purple-500 to-pink-500' 
              },
              { 
                step: '04', 
                title: 'VINCI REWARDS', 
                desc: 'Accumula XP, sblocca skin e domina', 
                icon: 'TROPHY',
                color: 'from-yellow-500 to-orange-500' 
              }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative group"
              >
                <div className="bg-gray-900/50 backdrop-blur rounded-2xl p-6 border border-gray-800 
                  hover:border-green-500/50 transition-all duration-300 h-full">
                  <div className={`bg-gradient-to-r ${item.color} text-transparent bg-clip-text 
                    text-6xl font-black mb-2`}>
                    {item.step}
                  </div>
                  <div className="text-sm font-bold text-gray-400 mb-3">{item.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* AI Tracking Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-3xl p-8 md:p-12 
              border border-green-500/30 mb-12"
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-3xl font-bold text-white mb-4">
                  AI TRACKING INTELLIGENTE
                </h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 text-xl">+</span>
                    <span>Riconoscimento automatico degli esercizi</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 text-xl">+</span>
                    <span>Conteggio preciso delle ripetizioni</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 text-xl">+</span>
                    <span>Valutazione della forma in tempo reale</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 text-xl">+</span>
                    <span>Nessun dispositivo esterno richiesto</span>
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className="aspect-video bg-gradient-to-br from-green-500/20 to-blue-500/20 
                  rounded-2xl flex items-center justify-center border border-green-500/30">
                  <span className="text-2xl font-bold text-white">VIDEO TRACKING</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Rewards System */}
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gray-900/50 backdrop-blur rounded-2xl p-6 border border-yellow-500/30"
            >
              <div className="text-sm font-bold text-gray-400 mb-3">REWARDS</div>
              <h3 className="text-xl font-bold text-yellow-400 mb-2">XP & LIVELLI</h3>
              <p className="text-gray-400 text-sm">
                Ogni rep conta! Accumula esperienza e sali di livello
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gray-900/50 backdrop-blur rounded-2xl p-6 border border-purple-500/30"
            >
              <div className="text-sm font-bold text-gray-400 mb-3">ACHIEVEMENTS</div>
              <h3 className="text-xl font-bold text-purple-400 mb-2">BADGE ESCLUSIVI</h3>
              <p className="text-gray-400 text-sm">
                Sblocca achievement e mostra i tuoi trofei
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gray-900/50 backdrop-blur rounded-2xl p-6 border border-blue-500/30"
            >
              <div className="text-sm font-bold text-gray-400 mb-3">COSMETICS</div>
              <h3 className="text-xl font-bold text-blue-400 mb-2">SKIN AVATAR</h3>
              <p className="text-gray-400 text-sm">
                Personalizza il tuo guerriero con skin epiche
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Characters Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
                SCEGLI IL TUO AVATAR
              </span>
            </h2>
            <p className="text-xl text-gray-400">E sfrutta i suoi bonus unici durante le sfide!</p>
          </motion.div>

          {/* Characters Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {characters.map((char, index) => (
              <motion.div
                key={char.id}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -10 }}
                onClick={() => setActiveCharacter(index)}
                className={`relative cursor-pointer group ${
                  activeCharacter === index ? 'ring-4 ring-green-400' : ''
                } rounded-2xl overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${char.color} opacity-20 
                  group-hover:opacity-40 transition-opacity`} />
                
                <div className="bg-gray-900/80 backdrop-blur p-4 border border-gray-800 
                  hover:border-green-500/50 transition-all rounded-2xl">
                  {/* Character Avatar */}
                  <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 
                    rounded-xl mb-3 flex items-center justify-center text-2xl font-bold text-white">
                    {char.name[0]}
                  </div>
                  
                  {/* Character Info */}
                  <h3 className="text-sm font-black text-white mb-1">{char.name}</h3>
                  <p className="text-xs text-white/80 mb-1">{char.power}</p>
                  <p className="text-xs text-yellow-400 font-bold">{char.ability}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Active Character Details */}
          <motion.div
            key={activeCharacter}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur 
              rounded-3xl p-8 border border-green-500/30"
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className={`text-3xl font-black bg-gradient-to-r ${characters[activeCharacter].color} 
                  bg-clip-text text-transparent mb-2`}>
                  {characters[activeCharacter].name}
                </h3>
                <p className="text-xl text-white mb-4">
                  Classe: {characters[activeCharacter].class}
                </p>
                <p className="text-gray-300 mb-4">
                  {characters[activeCharacter].description}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">Bonus:</span>
                    <span className="text-white">{characters[activeCharacter].power}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-400">AbilitÃ :</span>
                    <span className="text-white">{characters[activeCharacter].ability}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-9xl font-bold text-white/20"
                >
                  {characters[activeCharacter].name[0]}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why FitDuel Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-6xl font-black text-center mb-12"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
              PERCHÃ‰ FITDUEL?
            </span>
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: 'PUSH',
                title: 'Push-ups Battle',
                description: 'Sfida i tuoi amici a colpi di piegamenti. Chi ne fa di piÃ¹ in 30 secondi vince!',
                gradient: 'from-red-400 to-orange-500',
                image: '/exercises/pushups.jpg'
              },
              {
                icon: 'SQUAT',
                title: 'Squats Challenge', 
                description: 'Gambe d\'acciaio? Dimostralo! Squat perfetti contati dall\'AI.',
                gradient: 'from-blue-400 to-cyan-500',
                image: '/exercises/squats.jpg'
              },
              {
                icon: 'BURPEE',
                title: 'Burpees Madness',
                description: 'L\'esercizio definitivo per i veri guerrieri. Resisti o soccumbi!',
                gradient: 'from-yellow-400 to-amber-500',
                image: '/exercises/burpees.jpg'
              },
              {
                icon: 'PLANK',
                title: 'Plank Hold',
                description: 'StabilitÃ  e resistenza. Mantieni la posizione piÃ¹ a lungo del tuo avversario.',
                gradient: 'from-purple-400 to-pink-500',
                image: '/exercises/plank.jpg'
              },
              {
                icon: 'JUMP',
                title: 'Jumping Jacks',
                description: 'VelocitÃ  e coordinazione. Ogni movimento conta nel punteggio finale.',
                gradient: 'from-green-400 to-emerald-500',
                image: '/exercises/jumping-jacks.jpg'
              },
              {
                icon: 'BONUS',
                title: 'Avatar Bonus',
                description: 'Ogni personaggio ha bonus unici. Scegli la strategia vincente!',
                gradient: 'from-indigo-400 to-violet-500',
                image: '/graphics/power-bonus.png'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="relative group overflow-hidden rounded-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-90 z-10" />
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-20 
                  group-hover:opacity-30 transition-opacity z-20`} />
                
                {/* Background Image */}
                {feature.image && (
                  <div className="absolute inset-0">
                    <div className="w-full h-full bg-gray-800" />
                  </div>
                )}
                
                <div className="relative z-30 p-6">
                  <div className="text-sm font-bold text-gray-400 mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-300 text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Game Modes Section - Enhanced */}
      <section className="py-24 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-6xl font-black text-center mb-4"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
              MODALITÃ€ DI GIOCO
            </span>
          </motion.h2>
          
          <p className="text-xl text-gray-400 text-center mb-12">
            Scegli la tua battaglia e domina l'arena!
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: 'QUICK',
                title: 'SFIDA LAMPO',
                subtitle: '1v1 â€¢ 30 secondi',
                description: 'Duello rapido con matchmaking istantaneo',
                gradient: 'from-yellow-500 to-orange-500',
                xp: '+150 XP',
                players: '2.3K online'
              },
              {
                icon: 'TEAM',
                title: 'TEAM BATTLE',
                subtitle: '3v3 â€¢ 5 minuti',
                description: 'Squadra contro squadra, coordinazione Ã¨ tutto',
                gradient: 'from-blue-500 to-cyan-500',
                xp: '+300 XP',
                players: '1.8K online'
              },
              {
                icon: 'TOURNEY',
                title: 'TORNEO DAILY',
                subtitle: '100 players â€¢ 24h',
                description: 'Scala la classifica e vinci premi esclusivi',
                gradient: 'from-purple-500 to-pink-500',
                xp: '+500 XP',
                players: '5.2K online'
              },
              {
                icon: 'SOLO',
                title: 'MISSIONI SOLO',
                subtitle: 'PvE â€¢ Vari',
                description: 'Completa obiettivi e sblocca ricompense',
                gradient: 'from-green-500 to-emerald-500',
                xp: '+200 XP',
                players: '3.1K online'
              }
            ].map((mode, index) => (
              <motion.div
                key={mode.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="relative group h-96"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-10 
                  group-hover:opacity-20 transition-opacity rounded-3xl`} />
                
                <div className="h-full bg-gray-900/80 backdrop-blur border border-gray-800 
                  hover:border-green-500/50 transition-all rounded-3xl p-6 flex flex-col">
                  {/* Icon */}
                  <motion.div 
                    className="text-sm font-bold text-gray-400 mb-4 mx-auto"
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      delay: index * 0.2
                    }}
                  >
                    {mode.icon}
                  </motion.div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-black text-white mb-1">{mode.title}</h3>
                  <p className="text-sm text-gray-400 mb-2">{mode.subtitle}</p>
                  <p className="text-xs text-gray-500 mb-4 flex-grow">{mode.description}</p>
                  
                  {/* Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Reward:</span>
                      <span className="text-yellow-400 font-bold">{mode.xp}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Online:</span>
                      <span className="text-green-400 font-bold">{mode.players}</span>
                    </div>
                  </div>
                  
                  {/* Play Button */}
                  <button className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 
                    rounded-xl text-white font-bold opacity-0 group-hover:opacity-100 
                    transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    GIOCA ORA
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Battle Pass Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
                BATTLE PASS
              </span>
            </h2>
            <p className="text-xl text-gray-400">Sblocca ricompense esclusive ogni settimana!</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { level: 1, reward: '100 Coins', icon: 'COINS', rarity: 'common' },
              { level: 5, reward: 'Skin Bull Rage', icon: 'SKIN', rarity: 'rare' },
              { level: 10, reward: 'Emote Victory', icon: 'EMOTE', rarity: 'epic' },
              { level: 15, reward: 'Title Champion', icon: 'TITLE', rarity: 'legendary' },
              { level: 20, reward: '500 Gems', icon: 'GEMS', rarity: 'epic' },
              { level: 25, reward: 'Avatar Frame', icon: 'FRAME', rarity: 'rare' },
              { level: 30, reward: 'Skin Cyber', icon: 'CYBER', rarity: 'legendary' },
              { level: 35, reward: 'Premium Pass', icon: 'PASS', rarity: 'legendary' }
            ].map((item, index) => (
              <motion.div
                key={item.level}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className={`relative p-4 rounded-xl border-2 ${
                  item.rarity === 'legendary' ? 'border-yellow-500 bg-yellow-900/20' :
                  item.rarity === 'epic' ? 'border-purple-500 bg-purple-900/20' :
                  item.rarity === 'rare' ? 'border-blue-500 bg-blue-900/20' :
                  'border-gray-600 bg-gray-900/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Level {item.level}</p>
                    <p className="text-sm font-bold text-white">{item.reward}</p>
                  </div>
                  <div className="text-xs font-bold text-gray-400">{item.icon}</div>
                </div>
                {item.rarity === 'legendary' && (
                  <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs 
                    font-bold px-2 py-1 rounded">
                    PREMIUM
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Motivational CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-6xl md:text-7xl font-black mb-8">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-yellow-500 to-green-500">
                SEI PRONTO A DOMINARE?
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                title: 'NO EXCUSES',
                desc: 'Solo 30 secondi ti separano dalla vittoria',
                icon: 'FIGHT',
                color: 'from-red-500 to-orange-500'
              },
              {
                title: 'LEVEL UP',
                desc: 'Ogni rep ti rende piÃ¹ forte',
                icon: 'GROWTH',
                color: 'from-green-500 to-emerald-500'
              },
              {
                title: 'BE A LEGEND',
                desc: 'Scrivi il tuo nome nella hall of fame',
                icon: 'STAR',
                color: 'from-purple-500 to-pink-500'
              }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <motion.div
                  animate={{ 
                    y: [0, -20, 0],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.3
                  }}
                  className="text-sm font-bold text-gray-400 mb-4"
                >
                  {item.icon}
                </motion.div>
                <h3 className={`text-3xl font-black bg-gradient-to-r ${item.color} 
                  bg-clip-text text-transparent mb-2`}>
                  {item.title}
                </h3>
                <p className="text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Final CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/auth')}
              className="px-16 py-8 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 
                rounded-full text-2xl font-black text-white shadow-2xl 
                hover:shadow-green-500/50 transition-all duration-300"
            >
              INIZIA LA TUA LEGGENDA
            </motion.button>
            
            <p className="mt-6 text-gray-500">
              Gratis per sempre â€¢ Nessuna carta richiesta â€¢ Unisciti a 10.000+ atleti
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-black border-t border-gray-900">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            Â© 2024 FitDuel Arena. Transform your body. Level up your life.
          </p>
        </div>
      </footer>
    </div>
  )
}