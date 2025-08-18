// src/app/page.tsx
'use client'

import { useEffect, useState } from 'react'
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
            className="mb-8"
          >
            <h1 className="text-6xl md:text-8xl font-black mb-4">
              <span className="bg-gradient-to-r from-green-400 via-blue-500 to-green-400 bg-clip-text text-transparent animate-gradient">
                FITDUEL
              </span>
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 font-bold">
              SFIDE FITNESS 30 SECONDI • BATTLE ROYALE SPORTIVO
            </p>
          </motion.div>

          {/* Subtitle explaining the concept */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto"
          >
            Sfida i tuoi amici in battaglie fitness di 30 secondi! 
            Push-ups, Squats, Burpees e molto altro. 
            L'AI conta le tue ripetizioni. Scegli il tuo avatar e sfrutta i suoi bonus unici!
          </motion.p>

          {/* Character Grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12 max-w-5xl mx-auto"
          >
            {characters.map((char, index) => (
              <motion.div
                key={char.id}
                whileHover={{ scale: 1.05, y: -10 }}
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

          {/* How It Works Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto"
          >
            <div className="bg-gray-900/50 backdrop-blur rounded-xl p-6 border border-gray-800">
              <div className="text-4xl mb-3">📱</div>
              <h3 className="text-lg font-bold text-green-400 mb-2">1. SCEGLI LA SFIDA</h3>
              <p className="text-sm text-gray-400">30 secondi di esercizio: Push-ups, Squats, Burpees</p>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur rounded-xl p-6 border border-gray-800">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="text-lg font-bold text-blue-400 mb-2">2. AI TRACKING</h3>
              <p className="text-sm text-gray-400">La nostra AI conta le ripetizioni in tempo reale</p>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur rounded-xl p-6 border border-gray-800">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="text-lg font-bold text-yellow-400 mb-2">3. VINCI REWARDS</h3>
              <p className="text-sm text-gray-400">Guadagna XP e sfrutta i bonus del tuo avatar</p>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
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
              className="px-12 py-6 border-2 border-green-400 rounded-full text-xl font-bold text-green-400 hover:bg-green-400/10 transition-colors"
            >
              COME FUNZIONA
            </motion.button>
          </motion.div>

          {/* Live Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            <div className="text-center">
              <div className="text-3xl font-black text-green-400">10K+</div>
              <div className="text-sm text-gray-500">Giocatori Attivi</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-blue-400">500K+</div>
              <div className="text-sm text-gray-500">Sfide Completate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-yellow-400">4.9★</div>
              <div className="text-sm text-gray-500">Rating App</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Game Modes Section Enhanced */}
      <section className="py-24 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl font-black text-center mb-16"
          >
            <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              MODALITÀ DI GIOCO
            </span>
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Sfida Lampo */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="relative group cursor-pointer"
            >
              <div className="relative h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-600 to-orange-600">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-8xl">⚡</div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 p-6">
                  <h3 className="text-2xl font-black text-yellow-400 mb-2">SFIDA LAMPO</h3>
                  <p className="text-xs text-white/80 font-bold mb-3">1 VS 1 • 30 SECONDI</p>
                  <p className="text-sm text-gray-300">Sfida istantanea contro un amico. Chi fa più ripetizioni vince!</p>
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
              <div className="relative h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-cyan-600">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-8xl">👥</div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 p-6">
                  <h3 className="text-2xl font-black text-blue-400 mb-2">TEAM BATTLE</h3>
                  <p className="text-xs text-white/80 font-bold mb-3">5 VS 5 • 5 MINUTI</p>
                  <p className="text-sm text-gray-300">Crea il tuo team e domina. Punti doppi per le vittorie!</p>
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
              <div className="relative h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-8xl">🏆</div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 p-6">
                  <h3 className="text-2xl font-black text-purple-400 mb-2">TORNEO DAILY</h3>
                  <p className="text-xs text-white/80 font-bold mb-3">100 PLAYERS • TUTTO IL GIORNO</p>
                  <p className="text-sm text-gray-300">Accumula punti. Top 3 vincono premi esclusivi!</p>
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
              <div className="relative h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-green-600 to-emerald-600">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-8xl">🎯</div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 p-6">
                  <h3 className="text-2xl font-black text-green-400 mb-2">MISSIONI SOLO</h3>
                  <p className="text-xs text-white/80 font-bold mb-3">SINGLE PLAYER • QUANDO VUOI</p>
                  <p className="text-sm text-gray-300">Completa missioni e sblocca rewards epici!</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Battle Pass Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl font-black text-center mb-8"
          >
            <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              BATTLE PASS
            </span>
          </motion.h2>

          {/* Season Timer */}
          <div className="flex justify-center mb-12">
            <div className="bg-gradient-to-r from-green-400 to-blue-500 px-8 py-3 rounded-full">
              <p className="text-black font-black text-xl">SEASON 1 - ORIGINS</p>
            </div>
          </div>

          {/* Rewards Track */}
          <div className="overflow-x-auto pb-6">
            <div className="flex gap-4 min-w-max px-4">
              {[
                { tier: 1, icon: '💪', name: 'Avatar Base', rarity: 'common' },
                { tier: 5, icon: '🎯', name: 'Emote Victory', rarity: 'common' },
                { tier: 10, icon: '🔥', name: 'Skin Fire', rarity: 'rare', premium: true },
                { tier: 15, icon: '⚡', name: 'Boost XP', rarity: 'rare' },
                { tier: 20, icon: '🏆', name: 'Title Champion', rarity: 'epic' },
                { tier: 25, icon: '👑', name: 'Crown Effect', rarity: 'epic', premium: true },
                { tier: 30, icon: '💎', name: '1000 Coins', rarity: 'epic' },
                { tier: 50, icon: '🌟', name: 'Legendary Skin', rarity: 'legendary', premium: true }
              ].map((reward, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.1, y: -10 }}
                  className={`
                    relative min-w-[160px] p-6 rounded-2xl text-center cursor-pointer
                    ${reward.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-600 to-orange-600' :
                      reward.rarity === 'epic' ? 'bg-gradient-to-br from-purple-600 to-pink-600' :
                      reward.rarity === 'rare' ? 'bg-gradient-to-br from-blue-600 to-cyan-600' :
                      'bg-gradient-to-br from-gray-700 to-gray-600'}
                    ${reward.premium ? 'ring-2 ring-green-400' : ''}
                  `}
                >
                  {/* Tier Badge */}
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-black px-3 py-1 rounded-full">
                    <span className="text-xs font-bold text-white">LV {reward.tier}</span>
                  </div>
                  
                  {/* Icon */}
                  <div className="text-5xl mb-3 mt-2">{reward.icon}</div>
                  
                  {/* Name */}
                  <div className="text-sm font-bold text-white">{reward.name}</div>
                  
                  {/* Premium Badge */}
                  {reward.premium && (
                    <div className="absolute top-2 right-2 bg-green-400 px-2 py-1 rounded-full">
                      <span className="text-xs font-black text-black">PRO</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Live Feed Section */}
      <LiveFeedSection />

      {/* Enhanced Features Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-black to-gray-900">
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
                image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&h=300&fit=crop'
              },
              {
                icon: '🦵',
                title: 'Squats Challenge',
                description: 'Gambe di ferro? Dimostralo! Squat perfetti contati dalla nostra AI.',
                gradient: 'from-blue-400 to-purple-500',
                image: 'https://images.unsplash.com/photo-1566479179817-0ddb5fa87cd9?w=400&h=300&fit=crop'
              },
              {
                icon: '🏃',
                title: 'Burpees Madness',
                description: 'L\'esercizio più temuto diventa una sfida epica. Resistenza al massimo!',
                gradient: 'from-green-400 to-emerald-500',
                image: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=400&h=300&fit=crop'
              },
              {
                icon: '⏱️',
                title: 'Plank Hold',
                description: 'Core di acciaio? Tieni la posizione più a lungo del tuo avversario!',
                gradient: 'from-purple-400 to-pink-500',
                image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop'
              },
              {
                icon: '🤸',
                title: 'Jumping Jacks',
                description: 'Velocità e coordinazione. Ogni ripetizione conta per la vittoria!',
                gradient: 'from-cyan-400 to-blue-500',
                image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=300&fit=crop'
              },
              {
                icon: '🎮',
                title: 'Avatar Bonus',
                description: 'Ogni avatar ha bonus unici per diversi esercizi. Scegli la tua strategia!',
                gradient: 'from-yellow-400 to-red-500',
                image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop'
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

          {/* Character Bonus System Explanation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 bg-gradient-to-r from-green-400/10 to-blue-500/10 rounded-3xl p-8 border border-green-400/30"
          >
            <h3 className="text-3xl font-black text-center mb-8 text-white">
              SISTEMA BONUS AVATAR
            </h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">🔥</div>
                <h4 className="font-bold text-green-400 mb-2">TITAN</h4>
                <p className="text-sm text-gray-400">+8% Push-ups, Pull-ups</p>
                <p className="text-xs text-gray-500">-5% Cardio</p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-3">⚡</div>
                <h4 className="font-bold text-yellow-400 mb-2">SPEEDSTER</h4>
                <p className="text-sm text-gray-400">+8% Burpees, Cardio</p>
                <p className="text-xs text-gray-500">-5% Forza</p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-3">🥷</div>
                <h4 className="font-bold text-purple-400 mb-2">NINJA</h4>
                <p className="text-sm text-gray-400">+8% Jump Rope, Agilità</p>
                <p className="text-xs text-gray-500">-5% Isometrici</p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-3">🦍</div>
                <h4 className="font-bold text-cyan-400 mb-2">SAGE</h4>
                <p className="text-sm text-gray-400">+8% Plank, Wall Sit</p>
                <p className="text-xs text-gray-500">-5% Esplosivi</p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-3">🐊</div>
                <h4 className="font-bold text-emerald-400 mb-2">WARRIOR</h4>
                <p className="text-sm text-gray-400">+8% Squats, Lunges</p>
                <p className="text-xs text-gray-500">-4% Cardio</p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-3">🦈</div>
                <h4 className="font-bold text-blue-400 mb-2">HYBRID</h4>
                <p className="text-sm text-gray-400">+5% Tutto</p>
                <p className="text-xs text-green-400">Nessun Malus!</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA and Footer */}
      <CTASection />
      <FooterSection />
    </div>
  )
}