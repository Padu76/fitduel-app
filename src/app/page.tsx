// src/app/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import HeroSection from '@/components/landing/HeroSection'
import GameModesSection from '@/components/landing/GameModesSection'
import BattlePassSection from '@/components/landing/BattlePassSection'
import LiveFeedSection from '@/components/landing/LiveFeedSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import { CTASection, FooterSection } from '@/components/landing/CTAFooter'

// Character data with their specific classes and colors
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
    icon: '🔥'
  },
  { 
    id: 2, 
    name: 'SPEED LEOPARD', 
    class: 'SPEEDSTER',
    power: '+8% Burpees, Cardio',
    ability: 'RUSH HOUR (+7 sec)',
    image: '/avatars/leopard.png', 
    color: 'from-yellow-500 to-amber-500',
    glow: 'rgba(250, 204, 21, 0.5)',
    icon: '⚡'
  },
  { 
    id: 3, 
    name: 'SHADOW PANTHER', 
    class: 'NINJA',
    power: '+8% Jump Rope, Box Jumps',
    ability: 'SWIFT STRIKE (x1.5)',
    image: '/avatars/panther.png', 
    color: 'from-purple-900 to-purple-600',
    glow: 'rgba(147, 51, 234, 0.5)',
    icon: '🥷'
  },
  { 
    id: 4, 
    name: 'STONE GORILLA', 
    class: 'SAGE',
    power: '+8% Plank, Wall Sit',
    ability: 'INNER FOCUS',
    image: '/avatars/gorilla.png', 
    color: 'from-gray-600 to-cyan-500',
    glow: 'rgba(6, 182, 212, 0.5)',
    icon: '🦍'
  },
  { 
    id: 5, 
    name: 'CRUSHER CROCODILE', 
    class: 'WARRIOR',
    power: '+8% Squats, Lunges',
    ability: 'LAST STAND (+30%)',
    image: '/avatars/crocodile.png', 
    color: 'from-green-600 to-emerald-500',
    glow: 'rgba(34, 197, 94, 0.5)',
    icon: '🐊'
  },
  { 
    id: 6, 
    name: 'CYBER SHARK', 
    class: 'HYBRID',
    power: '+5% Tutto, No Malus',
    ability: 'ADAPT',
    image: '/avatars/shark.png', 
    color: 'from-blue-600 to-purple-600',
    glow: 'rgba(79, 70, 229, 0.5)',
    icon: '🦈'
  }
]

export default function LandingPage() {
  const { scrollY } = useScroll()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [activeCharacter, setActiveCharacter] = useState(0)
  const router = useRouter()
  
  // Ref per lo scroll alla sezione
  const howItWorksRef = useRef<HTMLDivElement>(null)
  
  // Funzione per scrollare alla sezione
  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  // Parallax transforms
  const backgroundParallax = useTransform(scrollY, [0, 1000], [0, 300])
  
  // Mouse tracking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleMouseMove = (e: MouseEvent) => {
        setMousePosition({ x: e.clientX, y: e.clientY })
      }
      window.addEventListener('mousemove', handleMouseMove)
      return () => window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Hero Section Redesigned */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 255, 136, 0.1) 2px, transparent 2px),
                linear-gradient(90deg, rgba(0, 136, 255, 0.1) 2px, transparent 2px)
              `,
              backgroundSize: '60px 60px',
              transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
            }}
          />
        </div>

        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-green-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />

        {/* Hero Content */}
        <div className="relative z-20 text-center px-4 max-w-7xl mx-auto">
          {/* Main Title */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <h1 className="text-6xl md:text-8xl font-black mb-6">
              <span className="bg-gradient-to-r from-green-400 via-blue-500 to-green-400 bg-clip-text text-transparent animate-gradient">
                FITDUEL
              </span>
            </h1>
            
            {/* Main Description - EMPHASIZED */}
            <div className="bg-gradient-to-r from-green-400/20 to-blue-500/20 backdrop-blur rounded-3xl p-8 border-2 border-green-400/50 max-w-4xl mx-auto mb-8">
              <p className="text-2xl md:text-3xl font-bold text-white mb-4">
                🎮 SFIDA I TUOI AMICI IN BATTAGLIE FITNESS DI 30 SECONDI! 🎮
              </p>
              <p className="text-xl md:text-2xl text-gray-300">
                Push-ups, Squats, Burpees e molto altro.
              </p>
              <p className="text-xl md:text-2xl text-green-400 font-bold mt-2">
                L'AI conta le tue ripetizioni in tempo reale!
              </p>
            </div>

            {/* Background Fitness Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="relative w-full h-64 md:h-96 rounded-3xl overflow-hidden mb-8"
            >
              <Image
                src="https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1200&h=400&fit=crop"
                alt="Fitness Battle"
                fill
                className="object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              <div className="absolute bottom-8 left-0 right-0">
                <p className="text-3xl font-black text-white">
                  TRASFORMA IL FITNESS IN UN GIOCO EPICO
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/auth')}
              className="relative group px-12 py-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full text-2xl font-black text-black overflow-hidden shadow-2xl"
            >
              <span className="relative z-10">INIZIA GRATIS</span>
              <motion.div
                className="absolute inset-0 bg-white"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.5 }}
                style={{ opacity: 0.2 }}
              />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToHowItWorks}
              className="px-12 py-6 border-2 border-green-400 rounded-full text-xl font-bold text-green-400 hover:bg-green-400/10 transition-colors"
            >
              COME FUNZIONA
            </motion.button>
          </motion.div>
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
              <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                COME FUNZIONA FITDUEL
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Trasforma il fitness in un gioco epico. Ecco come iniziare la tua avventura!
            </p>
          </motion.div>

          {/* Step by Step Guide */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-green-400/20 to-transparent backdrop-blur rounded-3xl p-8 border border-green-400/30 h-full">
                <div className="text-6xl mb-4">1️⃣</div>
                <h3 className="text-2xl font-bold text-green-400 mb-3">REGISTRATI</h3>
                <p className="text-gray-400">
                  Crea il tuo account in 30 secondi. Scegli username e sei subito pronto!
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-blue-400/20 to-transparent backdrop-blur rounded-3xl p-8 border border-blue-400/30 h-full">
                <div className="text-6xl mb-4">2️⃣</div>
                <h3 className="text-2xl font-bold text-blue-400 mb-3">SCEGLI L'AVATAR</h3>
                <p className="text-gray-400">
                  6 personaggi unici con bonus specifici. Trova quello che si adatta al tuo stile!
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-purple-400/20 to-transparent backdrop-blur rounded-3xl p-8 border border-purple-400/30 h-full">
                <div className="text-6xl mb-4">3️⃣</div>
                <h3 className="text-2xl font-bold text-purple-400 mb-3">LANCIA SFIDE</h3>
                <p className="text-gray-400">
                  Sfida amici o avversari casuali. 30 secondi di pura adrenalina!
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-yellow-400/20 to-transparent backdrop-blur rounded-3xl p-8 border border-yellow-400/30 h-full">
                <div className="text-6xl mb-4">4️⃣</div>
                <h3 className="text-2xl font-bold text-yellow-400 mb-3">VINCI E SALI</h3>
                <p className="text-gray-400">
                  Guadagna XP, sali di livello, scala le classifiche e diventa una leggenda!
                </p>
              </div>
            </motion.div>
          </div>

          {/* AI Tracking Explanation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-green-400/10 to-blue-500/10 rounded-3xl p-12 border border-green-400/30 mb-16"
          >
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-black text-white mb-6">
                  🤖 AI TRACKING RIVOLUZIONARIO
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 text-xl">✓</span>
                    <p className="text-gray-300">
                      <strong className="text-white">Conta automatica:</strong> L'AI riconosce e conta ogni ripetizione
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 text-xl">✓</span>
                    <p className="text-gray-300">
                      <strong className="text-white">Valutazione forma:</strong> Ricevi feedback sulla correttezza dell'esecuzione
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 text-xl">✓</span>
                    <p className="text-gray-300">
                      <strong className="text-white">Zero trucchi:</strong> Impossibile barare, solo skill reale conta
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 text-xl">✓</span>
                    <p className="text-gray-300">
                      <strong className="text-white">Privacy garantita:</strong> Tutto processato localmente sul tuo dispositivo
                    </p>
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <div className="text-center">
                    <div className="text-8xl mb-4">📸</div>
                    <p className="text-xl font-bold text-white">
                      Posiziona il telefono, inizia l'esercizio e l'AI fa il resto!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* XP and Rewards System */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h3 className="text-3xl font-black text-center text-white mb-12">
              SISTEMA RICOMPENSE
            </h3>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-900/50 backdrop-blur rounded-2xl p-8 border border-gray-800">
                <div className="text-4xl mb-4">⭐</div>
                <h4 className="text-xl font-bold text-green-400 mb-3">XP & LIVELLI</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>• Sfida completata: +50 XP</li>
                  <li>• Vittoria: +100 XP</li>
                  <li>• Form perfetta: +150 XP</li>
                  <li>• Streak giornaliero: +200 XP</li>
                </ul>
              </div>

              <div className="bg-gray-900/50 backdrop-blur rounded-2xl p-8 border border-gray-800">
                <div className="text-4xl mb-4">🏅</div>
                <h4 className="text-xl font-bold text-blue-400 mb-3">BADGE & TITOLI</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>• "Prima Vittoria"</li>
                  <li>• "7 Giorni di Fila"</li>
                  <li>• "Maestro del Plank"</li>
                  <li>• "Leggenda Fitness"</li>
                </ul>
              </div>

              <div className="bg-gray-900/50 backdrop-blur rounded-2xl p-8 border border-gray-800">
                <div className="text-4xl mb-4">🎨</div>
                <h4 className="text-xl font-bold text-purple-400 mb-3">SKIN & AVATAR</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>• Personalizzazioni esclusive</li>
                  <li>• Effetti speciali vittoria</li>
                  <li>• Cornici profilo uniche</li>
                  <li>• Emote personalizzate</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Game Modes Quick Overview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h3 className="text-3xl font-black text-center text-white mb-8">
              MODALITÀ DI GIOCO
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-yellow-600/20 to-transparent backdrop-blur rounded-xl p-4 border border-yellow-600/30">
                <div className="text-3xl mb-2">⚡</div>
                <p className="font-bold text-yellow-400">1v1 LAMPO</p>
                <p className="text-xs text-gray-400">30 secondi</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-600/20 to-transparent backdrop-blur rounded-xl p-4 border border-blue-600/30">
                <div className="text-3xl mb-2">👥</div>
                <p className="font-bold text-blue-400">TEAM 3v3</p>
                <p className="text-xs text-gray-400">5 minuti</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-600/20 to-transparent backdrop-blur rounded-xl p-4 border border-purple-600/30">
                <div className="text-3xl mb-2">🏆</div>
                <p className="font-bold text-purple-400">TORNEO</p>
                <p className="text-xs text-gray-400">Daily</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-600/20 to-transparent backdrop-blur rounded-xl p-4 border border-green-600/30">
                <div className="text-3xl mb-2">🎯</div>
                <p className="font-bold text-green-400">MISSIONI</p>
                <p className="text-xs text-gray-400">Solo</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Avatar Selection Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl font-black mb-4">
              <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                SCEGLI IL TUO AVATAR
              </span>
            </h2>
            <p className="text-xl text-gray-400">
              Ogni avatar ha bonus unici per diversi esercizi. Scegli la tua strategia!
            </p>
          </motion.div>

          {/* Character Grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto"
          >
            {characters.map((char, index) => (
              <motion.div
                key={char.id}
                whileHover={{ scale: 1.05, y: -10 }}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 50 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setActiveCharacter(index)}
                className={`relative cursor-pointer ${
                  activeCharacter === index ? 'ring-2 ring-green-400' : ''
                }`}
              >
                <div className={`bg-gradient-to-br ${char.color} rounded-2xl p-4 transform transition-all duration-300 hover:shadow-2xl`}
                  style={{
                    boxShadow: activeCharacter === index ? `0 20px 40px ${char.glow}` : '',
                  }}
                >
                  {/* Character Image */}
                  <div className="relative h-32 mb-3">
                    <Image
                      src={char.image}
                      alt={char.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  
                  {/* Character Info */}
                  <h3 className="text-sm font-black text-white mb-1">{char.name}</h3>
                  <p className="text-xs text-white/80 mb-1">{char.power}</p>
                  <p className="text-xs text-yellow-300 font-bold">{char.ability}</p>
                  
                  {/* Class Badge */}
                  <div className="mt-2 bg-black/30 rounded-full px-2 py-1">
                    <span className="text-xs font-bold">{char.class}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why FitDuel Section - Right After Avatars */}
      <section className="py-24 px-4 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl font-black text-center mb-16"
          >
            <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              PERCHÉ FITDUEL?
            </span>
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '💪',
                title: 'Push-ups Battle',
                description: 'Sfida i tuoi amici a colpi di piegamenti. Chi ne fa di più in 30 secondi vince!',
                gradient: 'from-red-400 to-orange-500',
                image: '/exercises/pushups.jpg'
              },
              {
                icon: '🦵',
                title: 'Squats Challenge',
                description: 'Gambe di ferro? Dimostralo! Squat perfetti contati dalla nostra AI.',
                gradient: 'from-blue-400 to-purple-500',
                image: '/exercises/squats.jpg'
              },
              {
                icon: '🏃',
                title: 'Burpees Madness',
                description: 'L\'esercizio più temuto diventa una sfida epica. Resistenza al massimo!',
                gradient: 'from-green-400 to-emerald-500',
                image: '/exercises/burpees.jpg'
              },
              {
                icon: '⏱️',
                title: 'Plank Hold',
                description: 'Core di acciaio? Tieni la posizione più a lungo del tuo avversario!',
                gradient: 'from-purple-400 to-pink-500',
                image: '/exercises/plank.jpg'
              },
              {
                icon: '🤸',
                title: 'Jumping Jacks',
                description: 'Velocità e coordinazione. Ogni ripetizione conta per la vittoria!',
                gradient: 'from-cyan-400 to-blue-500',
                image: '/exercises/jumping-jacks.jpg'
              },
              {
                icon: '💥',
                title: 'Avatar Power-Up',
                description: 'Ogni avatar ha bonus unici per diversi esercizi. Scegli la tua strategia!',
                gradient: 'from-yellow-400 to-red-500',
                image: '/graphics/power-bonus.png'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="relative group cursor-pointer"
              >
                <div className="bg-gray-900/50 backdrop-blur rounded-2xl overflow-hidden border border-gray-800 hover:border-green-400 transition-all duration-300">
                  {/* Exercise Image */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    {/* Icon overlay */}
                    <div className={`absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center text-3xl shadow-2xl`}>
                      {feature.icon}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {/* Title */}
                    <h3 className="text-2xl font-black mb-3 text-white">
                      {feature.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Game Modes Section - ENHANCED */}
      <section className="py-24 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-6xl font-black text-center mb-16"
          >
            <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              MODALITÀ DI GIOCO EPICHE
            </span>
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Sfida Lampo */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="relative group cursor-pointer"
            >
              <div className="relative h-96 rounded-3xl overflow-hidden bg-gradient-to-br from-yellow-600 to-orange-600 shadow-2xl">
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div 
                    className="text-9xl"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    ⚡
                  </motion.div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                <div className="absolute bottom-0 p-8">
                  <h3 className="text-3xl font-black text-yellow-400 mb-3">SFIDA LAMPO</h3>
                  <p className="text-sm text-white/90 font-bold mb-3">1 VS 1 • 30 SECONDI</p>
                  <p className="text-base text-gray-300">Sfida istantanea contro un amico. Chi fa più ripetizioni vince!</p>
                  <motion.div
                    className="mt-4 bg-yellow-400/20 rounded-full px-4 py-2 inline-block"
                    whileHover={{ scale: 1.1 }}
                  >
                    <span className="text-yellow-400 font-bold">GIOCA ORA →</span>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Team Battle */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="relative group cursor-pointer"
            >
              <div className="relative h-96 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 to-cyan-600 shadow-2xl">
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div 
                    className="text-9xl"
                    animate={{ 
                      y: [0, -10, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    👥
                  </motion.div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                <div className="absolute bottom-0 p-8">
                  <h3 className="text-3xl font-black text-blue-400 mb-3">TEAM BATTLE</h3>
                  <p className="text-sm text-white/90 font-bold mb-3">3 VS 3 • 5 MINUTI</p>
                  <p className="text-base text-gray-300">Crea il tuo team e domina. Punti doppi per le vittorie!</p>
                  <motion.div
                    className="mt-4 bg-blue-400/20 rounded-full px-4 py-2 inline-block"
                    whileHover={{ scale: 1.1 }}
                  >
                    <span className="text-blue-400 font-bold">CREA TEAM →</span>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Torneo Daily */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="relative group cursor-pointer"
            >
              <div className="relative h-96 rounded-3xl overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600 shadow-2xl">
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div 
                    className="text-9xl"
                    animate={{ 
                      rotate: [0, 360]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  >
                    🏆
                  </motion.div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                <div className="absolute bottom-0 p-8">
                  <h3 className="text-3xl font-black text-purple-400 mb-3">TORNEO DAILY</h3>
                  <p className="text-sm text-white/90 font-bold mb-3">100 PLAYERS • TUTTO IL GIORNO</p>
                  <p className="text-base text-gray-300">Accumula punti. Top 3 vincono premi esclusivi!</p>
                  <motion.div
                    className="mt-4 bg-purple-400/20 rounded-full px-4 py-2 inline-block"
                    whileHover={{ scale: 1.1 }}
                  >
                    <span className="text-purple-400 font-bold">ENTRA →</span>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Missioni Solo */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="relative group cursor-pointer"
            >
              <div className="relative h-96 rounded-3xl overflow-hidden bg-gradient-to-br from-green-600 to-emerald-600 shadow-2xl">
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div 
                    className="text-9xl"
                    animate={{ 
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🎯
                  </motion.div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                <div className="absolute bottom-0 p-8">
                  <h3 className="text-3xl font-black text-green-400 mb-3">MISSIONI SOLO</h3>
                  <p className="text-sm text-white/90 font-bold mb-3">SINGLE PLAYER • QUANDO VUOI</p>
                  <p className="text-base text-gray-300">Completa missioni e sblocca rewards epici!</p>
                  <motion.div
                    className="mt-4 bg-green-400/20 rounded-full px-4 py-2 inline-block"
                    whileHover={{ scale: 1.1 }}
                  >
                    <span className="text-green-400 font-bold">INIZIA →</span>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Battle Pass Section */}
      <BattlePassSection />

      {/* Live Feed Section */}
      <LiveFeedSection />

      {/* Motivational CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-8">
              <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                SEI PRONTO A DOMINARE?
              </span>
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-green-400/20 to-transparent backdrop-blur rounded-2xl p-8 border border-green-400/30"
              >
                <div className="text-5xl mb-4">💯</div>
                <h3 className="text-2xl font-bold text-green-400 mb-2">NO EXCUSES</h3>
                <p className="text-gray-400">Solo 30 secondi. Non hai scuse per non allenarti!</p>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-blue-400/20 to-transparent backdrop-blur rounded-2xl p-8 border border-blue-400/30"
              >
                <div className="text-5xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold text-blue-400 mb-2">LEVEL UP</h3>
                <p className="text-gray-400">Ogni sfida ti rende più forte. Evolvi ogni giorno!</p>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-purple-400/20 to-transparent backdrop-blur rounded-2xl p-8 border border-purple-400/30"
              >
                <div className="text-5xl mb-4">🔥</div>
                <h3 className="text-2xl font-bold text-purple-400 mb-2">BE A LEGEND</h3>
                <p className="text-gray-400">Entra nella Hall of Fame. Diventa una leggenda!</p>
              </motion.div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-2xl text-gray-300 mb-12 max-w-3xl mx-auto"
            >
              Unisciti a migliaia di atleti che stanno trasformando il fitness in un gioco epico!
            </motion.p>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/auth')}
              className="relative group px-16 py-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full text-3xl font-black text-black overflow-hidden shadow-2xl"
            >
              <span className="relative z-10">INIZIA LA TUA LEGGENDA</span>
              <motion.div
                className="absolute inset-0 bg-white"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'loop',
                }}
                style={{ opacity: 0.2 }}
              />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* CTA and Footer */}
      <CTASection />
      <FooterSection />
    </div>
  )
}