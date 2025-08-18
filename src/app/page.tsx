// src/app/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
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
    image: '/avatars/bull.png', 
    color: 'from-red-600 to-orange-500',
    glow: 'rgba(239, 68, 68, 0.5)',
    icon: '🔥'
  },
  { 
    id: 2, 
    name: 'SPEED LEOPARD', 
    class: 'SPEEDSTER',
    image: '/avatars/leopard.png', 
    color: 'from-yellow-500 to-amber-500',
    glow: 'rgba(250, 204, 21, 0.5)',
    icon: '⚡'
  },
  { 
    id: 3, 
    name: 'SHADOW PANTHER', 
    class: 'NINJA',
    image: '/avatars/panther.png', 
    color: 'from-purple-900 to-purple-600',
    glow: 'rgba(147, 51, 234, 0.5)',
    icon: '🥷'
  },
  { 
    id: 4, 
    name: 'STONE GORILLA', 
    class: 'SAGE',
    image: '/avatars/gorilla.png', 
    color: 'from-gray-600 to-cyan-500',
    glow: 'rgba(6, 182, 212, 0.5)',
    icon: '🦍'
  },
  { 
    id: 5, 
    name: 'CRUSHER CROCODILE', 
    class: 'WARRIOR',
    image: '/avatars/crocodile.png', 
    color: 'from-green-600 to-emerald-500',
    glow: 'rgba(34, 197, 94, 0.5)',
    icon: '🐊'
  },
  { 
    id: 6, 
    name: 'CYBER SHARK', 
    class: 'HYBRID',
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
  const [windowWidth, setWindowWidth] = useState(1920)
  const [windowHeight, setWindowHeight] = useState(1080)
  const router = useRouter()
  
  // Parallax transforms for different layers
  const heroParallax = useTransform(scrollY, [0, 1000], [0, -500])
  const charactersParallax = useTransform(scrollY, [0, 1000], [0, -200])
  const backgroundParallax = useTransform(scrollY, [0, 1000], [0, 300])
  
  // Handle window dimensions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth)
      setWindowHeight(window.innerHeight)
      
      const handleResize = () => {
        setWindowWidth(window.innerWidth)
        setWindowHeight(window.innerHeight)
      }
      
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])
  
  // Mouse tracking for interactive effects
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleMouseMove = (e: MouseEvent) => {
        setMousePosition({ x: e.clientX, y: e.clientY })
      }
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
  }, [])

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Enhanced Gaming Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Fixed Background with Parallax */}
        <motion.div 
          className="absolute inset-0 z-0"
          style={{ y: backgroundParallax }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black" />
          <Image
            src="https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1920&h=1080&fit=crop"
            alt="Arena Background"
            fill
            className="object-cover opacity-20"
            priority
          />
        </motion.div>

        {/* Animated Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-30 z-1"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 136, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 136, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
          }}
        />

        {/* Character Showcase with Parallax */}
        <motion.div 
          className="absolute inset-0 z-5"
          style={{ y: charactersParallax }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCharacter}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.3, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.5 }}
              className="absolute right-0 top-1/2 transform -translate-y-1/2"
            >
              <div className="relative w-[600px] h-[600px]">
                <Image
                  src={characters[activeCharacter].image}
                  alt={characters[activeCharacter].name}
                  fill
                  className="object-contain"
                  style={{
                    filter: `drop-shadow(0 0 50px ${characters[activeCharacter].glow})`,
                  }}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Hero Content */}
        <motion.div 
          className="relative z-20 text-center px-4 max-w-6xl mx-auto"
          style={{ y: heroParallax }}
        >
          {/* Live Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-red-600/20 border border-red-600 px-6 py-2 rounded-full mb-8"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-red-400 font-bold">SEASON 1 LIVE</span>
          </motion.div>

          {/* Main Title with Glitch Effect */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-7xl md:text-9xl font-black mb-6 relative"
          >
            <span className="relative">
              <span className="absolute inset-0 text-green-400 animate-pulse">FITDUEL</span>
              <span className="absolute inset-0 text-blue-500" style={{ clipPath: 'inset(0 50% 0 0)' }}>FITDUEL</span>
              <span className="relative bg-gradient-to-r from-green-400 via-white to-blue-500 bg-clip-text text-transparent">
                FITDUEL
              </span>
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl md:text-3xl text-gray-300 mb-12 font-bold"
          >
            SCEGLI IL TUO FIGHTER. DOMINA L'ARENA.
          </motion.p>

          {/* Character Selection Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center gap-4 mb-12"
          >
            {characters.map((char, index) => (
              <motion.div
                key={char.id}
                whileHover={{ scale: 1.1, y: -5 }}
                onClick={() => setActiveCharacter(index)}
                className={`cursor-pointer relative ${
                  activeCharacter === index ? 'ring-2 ring-green-400' : ''
                }`}
              >
                <div className={`w-20 h-20 bg-gradient-to-br ${char.color} rounded-xl flex items-center justify-center text-3xl shadow-2xl`}>
                  {char.icon}
                </div>
                {activeCharacter === index && (
                  <motion.div
                    layoutId="selector"
                    className="absolute inset-0 border-2 border-green-400 rounded-xl"
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/auth')}
              className="relative group px-12 py-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full text-2xl font-black text-black overflow-hidden"
            >
              <span className="relative z-10">GIOCA ORA</span>
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
              GUARDA TRAILER
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Floating Particles */}
        <div className="absolute inset-0 z-15 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-green-400 rounded-full"
              initial={{
                x: Math.random() * windowWidth,
                y: Math.random() * windowHeight,
              }}
              animate={{
                y: [null, -100],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 5 + 5,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>
      </section>

      {/* Live Battle Arena Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/50 to-black" />
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-6xl font-black text-center mb-16"
          >
            <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              BATTAGLIE LIVE
            </span>
          </motion.h2>

          {/* Battle Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((battle, index) => (
              <motion.div
                key={battle}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-green-400 transition-all duration-300 cursor-pointer group"
              >
                {/* Live Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="text-xs text-red-400 font-bold">LIVE</span>
                </div>

                {/* VS Match */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-2xl mb-2">
                      {characters[index % 6].icon}
                    </div>
                    <p className="text-xs font-bold text-gray-400">Player{index + 1}</p>
                  </div>
                  
                  <div className="text-2xl font-black text-green-400">VS</div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-2xl mb-2">
                      {characters[(index + 3) % 6].icon}
                    </div>
                    <p className="text-xs font-bold text-gray-400">Player{index + 7}</p>
                  </div>
                </div>

                {/* Exercise Type */}
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-500">SFIDA</p>
                  <p className="text-lg font-bold text-white">
                    {['Push-ups', 'Squats', 'Burpees', 'Plank', 'Jump Rope', 'Lunges'][index]}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute h-full bg-gradient-to-r from-green-400 to-blue-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.random() * 100}%` }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                  />
                </div>

                {/* Watch Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full mt-4 py-2 bg-gray-800 group-hover:bg-green-400/20 border border-gray-700 group-hover:border-green-400 rounded-lg text-sm font-bold text-gray-400 group-hover:text-green-400 transition-all"
                >
                  GUARDA
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Original Sections with Enhanced Styling */}
      <GameModesSection />
      <BattlePassSection />
      <LiveFeedSection />
      <FeaturesSection />
      <CTASection />
      <FooterSection />
    </div>
  )
}