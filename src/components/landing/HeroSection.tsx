'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useMousePosition, useScrollParallax, useFloatingAnimation, useGlowEffect } from '@/hooks/useParallaxEffects'

interface LiveStats {
  onlineCount: number
  battlesCount: number
  dailyWins: number
}

export default function HeroSection() {
  const router = useRouter()
  const mousePosition = useMousePosition()
  const { scrollYProgress } = useScroll()
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const backgroundRef = useScrollParallax(0.5)
  const floatingRef1 = useFloatingAnimation(4, 30)
  const floatingRef2 = useFloatingAnimation(5, 25)
  const floatingRef3 = useFloatingAnimation(3, 35)
  const glowButtonRef = useGlowEffect<HTMLButtonElement>()
  
  const [stats, setStats] = useState<LiveStats>({
    onlineCount: 0,
    battlesCount: 0,
    dailyWins: 0
  })

  // Particle system with mouse interaction
  const particlesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!particlesRef.current) return
    
    const particles = particlesRef.current.children
    Array.from(particles).forEach((particle, index) => {
      const speed = 0.5 + (index % 3) * 0.3
      const offsetX = (mousePosition.normalizedX * 50 * speed)
      const offsetY = (mousePosition.normalizedY * 50 * speed);
      (particle as HTMLElement).style.transform = `translate(${offsetX}px, ${offsetY}px)`
    })
  }, [mousePosition])

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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Multi-layer Parallax Background */}
      <motion.div 
        className="absolute inset-0 z-0"
        style={{ y: backgroundY }}
      >
        <div ref={backgroundRef} className="relative w-full h-full">
          <Image
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop"
            alt="Hero Background"
            fill
            className="object-cover opacity-30"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-black" />
      </motion.div>

      {/* Floating Gradient Orbs */}
      <div className="absolute inset-0 z-5">
        <div 
          ref={floatingRef1}
          className="absolute top-20 left-20 w-96 h-96 bg-green-400/20 rounded-full blur-3xl"
        />
        <div 
          ref={floatingRef2}
          className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
        />
        <div 
          ref={floatingRef3}
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-green-400/30 to-blue-500/30 rounded-full blur-2xl"
        />
      </div>

      {/* Interactive Particles */}
      <div ref={particlesRef} className="absolute inset-0 z-10">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: Math.random() * 4 + 1 + 'px',
              height: Math.random() * 4 + 1 + 'px',
              background: i % 2 === 0 
                ? 'linear-gradient(45deg, #00FF88, #0088FF)' 
                : 'linear-gradient(45deg, #0088FF, #00FF88)',
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Hero Content with 3D depth */}
      <div className="relative z-20 text-center px-4 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20, rotateX: -20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-block bg-gradient-to-r from-green-400 to-blue-500 px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider mb-8 text-black transform perspective-1000"
          style={{
            transform: `rotateX(${mousePosition.normalizedY * 5}deg) rotateY(${mousePosition.normalizedX * 5}deg)`,
          }}
        >
          🔥 Season 1 Live Now
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-6xl md:text-8xl font-black uppercase mb-6 tracking-tight"
          style={{
            transform: `perspective(1000px) rotateX(${mousePosition.normalizedY * -2}deg) rotateY(${mousePosition.normalizedX * 2}deg)`,
            textShadow: `${mousePosition.normalizedX * 10}px ${mousePosition.normalizedY * 10}px 30px rgba(0, 255, 136, 0.3)`,
          }}
        >
          <span className="bg-gradient-to-r from-green-400 via-white to-blue-500 bg-clip-text text-transparent">
            FitDuel Arena
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-300 mb-12"
          style={{
            transform: `translateX(${mousePosition.normalizedX * 10}px) translateY(${mousePosition.normalizedY * 5}px)`,
          }}
        >
          Sfida i tuoi amici. Vinci in 30 secondi. Domina la classifica.
        </motion.p>

        <motion.button
          ref={glowButtonRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/auth')}
          className="relative bg-gradient-to-r from-green-400 to-blue-500 text-black px-12 py-6 rounded-full text-2xl font-black uppercase tracking-wider shadow-2xl hover:shadow-green-400/50 transition-all duration-300 transform-gpu"
          style={{
            transform: `perspective(1000px) rotateX(${mousePosition.normalizedY * -5}deg) rotateY(${mousePosition.normalizedX * 5}deg)`,
          }}
        >
          <span className="relative z-10">GIOCA ORA</span>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-green-300 to-blue-400 rounded-full blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.button>

        {/* Live Stats with 3D cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto"
        >
          <StatCard3D
            value={stats.onlineCount}
            label="Online Ora"
            delay={0.5}
            mousePosition={mousePosition}
          />
          <StatCard3D
            value={stats.battlesCount}
            label="Sfide Live"
            delay={0.6}
            mousePosition={mousePosition}
          />
          <StatCard3D
            value={stats.dailyWins}
            label="Vittorie Oggi"
            delay={0.7}
            mousePosition={mousePosition}
          />
        </motion.div>
      </div>

      {/* Animated Grid Background */}
      <div className="absolute inset-0 z-1">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 136, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 136, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            transform: `translate(${mousePosition.normalizedX * 20}px, ${mousePosition.normalizedY * 20}px)`,
          }}
        />
      </div>
    </section>
  )
}

// Enhanced 3D stat card component
function StatCard3D({ 
  value, 
  label, 
  delay,
  mousePosition 
}: { 
  value: number
  label: string
  delay: number
  mousePosition: ReturnType<typeof useMousePosition>
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20, rotateX: -20 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.6, delay }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative bg-gray-900/50 backdrop-blur-sm border border-green-400/20 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300"
      style={{
        transform: isHovered 
          ? `perspective(1000px) rotateX(${mousePosition.normalizedY * -10}deg) rotateY(${mousePosition.normalizedX * 10}deg) translateZ(20px)`
          : 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)',
        boxShadow: isHovered
          ? '0 20px 40px rgba(0, 255, 136, 0.3), 0 0 60px rgba(0, 136, 255, 0.2)'
          : '0 10px 20px rgba(0, 0, 0, 0.5)',
      }}
    >
      <motion.div 
        className="text-4xl font-black text-green-400"
        animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {value.toLocaleString()}
      </motion.div>
      <div className="text-sm text-gray-400 uppercase tracking-wider mt-2">
        {label}
      </div>
      
      {/* Holographic effect */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          animate={{
            background: [
              'linear-gradient(45deg, transparent, rgba(0, 255, 136, 0.1), transparent)',
              'linear-gradient(45deg, transparent, rgba(0, 136, 255, 0.1), transparent)',
              'linear-gradient(45deg, transparent, rgba(0, 255, 136, 0.1), transparent)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ mixBlendMode: 'screen' }}
        />
      )}
    </motion.div>
  )
}