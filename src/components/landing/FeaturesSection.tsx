'use client'

import { useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useMousePosition, useFloatingAnimation } from '@/hooks/useParallaxEffects'

interface Feature {
  icon: string
  title: string
  description: string
  gradient: string
  delay: number
}

const features: Feature[] = [
  {
    icon: '⚡',
    title: 'Sfide Veloci',
    description: '30 secondi per vincere. Niente allenamenti lunghi. Solo azione pura.',
    gradient: 'from-yellow-400 to-orange-500',
    delay: 0
  },
  {
    icon: '🤖',
    title: 'AI Tracking',
    description: 'La nostra AI conta le tue ripetizioni e valuta la forma. Zero trucchi.',
    gradient: 'from-blue-400 to-purple-500',
    delay: 0.1
  },
  {
    icon: '🏆',
    title: 'Rewards Reali',
    description: 'Vinci skin, badge, titoli esclusivi. Mostra a tutti chi è il boss.',
    gradient: 'from-green-400 to-emerald-500',
    delay: 0.2
  },
  {
    icon: '👥',
    title: 'Social Competition',
    description: 'Sfida amici, crea team, domina le classifiche. Il fitness è più divertente insieme.',
    gradient: 'from-purple-400 to-pink-500',
    delay: 0.3
  },
  {
    icon: '📱',
    title: 'Cross-Platform',
    description: 'Gioca su telefono, tablet o PC. I tuoi progressi ti seguono ovunque.',
    gradient: 'from-cyan-400 to-blue-500',
    delay: 0.4
  },
  {
    icon: '🎮',
    title: 'Gaming Experience',
    description: 'Interfaccia gaming, effetti epici, progression system. Il fitness diventa un gioco.',
    gradient: 'from-red-400 to-rose-500',
    delay: 0.5
  }
]

export default function FeaturesSection() {
  const mousePosition = useMousePosition()
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  })
  
  const backgroundRotate = useTransform(scrollYProgress, [0, 1], [0, 360])

  return (
    <section ref={sectionRef} className="py-24 px-4 bg-gray-950 relative overflow-hidden">
      {/* Rotating gradient background */}
      <motion.div 
        className="absolute inset-0 opacity-10"
        style={{
          rotate: backgroundRotate,
          background: 'conic-gradient(from 0deg, #00FF88, #0088FF, #FF00FF, #00FF88)',
        }}
      />

      {/* Floating geometric shapes */}
      <FloatingShapes />

      {/* Mouse-following spotlight */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(circle 600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 255, 136, 0.15), transparent)`,
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl font-black text-center mb-16 uppercase text-white"
          style={{
            textShadow: `${mousePosition.normalizedX * 15}px ${mousePosition.normalizedY * 15}px 40px rgba(0, 255, 136, 0.3)`,
          }}
        >
          <span className="bg-gradient-to-r from-green-400 via-blue-500 to-green-400 bg-clip-text text-transparent">
            Perché FitDuel?
          </span>
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard3D 
              key={index} 
              feature={feature} 
              index={index}
              mousePosition={mousePosition}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// Floating geometric shapes component
function FloatingShapes() {
  const shape1Ref = useFloatingAnimation(6, 40)
  const shape2Ref = useFloatingAnimation(8, 50)
  const shape3Ref = useFloatingAnimation(5, 35)

  return (
    <>
      <div 
        ref={shape1Ref}
        className="absolute top-20 left-10 w-32 h-32 border-2 border-green-400/20 rotate-45"
        style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}
      />
      <div 
        ref={shape2Ref}
        className="absolute bottom-20 right-20 w-40 h-40 border-2 border-blue-500/20 rotate-12"
        style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}
      />
      <div 
        ref={shape3Ref}
        className="absolute top-1/2 right-1/3 w-24 h-24 border-2 border-purple-400/20 rounded-full"
      />
    </>
  )
}

// Enhanced 3D feature card
function FeatureCard3D({ 
  feature, 
  index,
  mousePosition 
}: { 
  feature: Feature
  index: number
  mousePosition: ReturnType<typeof useMousePosition>
}) {
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !iconRef.current) return
    
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    const rotateX = ((y - centerY) / centerY) * -10
    const rotateY = ((x - centerX) / centerX) * 10
    
    cardRef.current.style.transform = `
      perspective(1000px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      translateZ(20px)
    `

    // Icon follows mouse more dramatically
    iconRef.current.style.transform = `
      perspective(500px)
      rotateX(${rotateX * 2}deg)
      rotateY(${rotateY * 2}deg)
      translateZ(50px)
      scale(1.2)
    `
  }

  const handleMouseLeave = () => {
    if (!cardRef.current || !iconRef.current) return
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)'
    iconRef.current.style.transform = 'perspective(500px) rotateX(0) rotateY(0) translateZ(0) scale(1)'
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50, rotateX: -30 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true }}
      transition={{ 
        delay: feature.delay,
        duration: 0.8,
        type: "spring",
        stiffness: 100
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative text-center group cursor-pointer transform-gpu transition-all duration-300"
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Background glow effect */}
      <div 
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
        style={{
          background: `linear-gradient(135deg, ${isHovered ? 'rgba(0, 255, 136, 0.3)' : 'transparent'}, ${isHovered ? 'rgba(0, 136, 255, 0.3)' : 'transparent'})`,
        }}
      />

      {/* Icon container with 3D effect */}
      <motion.div
        ref={iconRef}
        className={`relative w-24 h-24 bg-gradient-to-br ${feature.gradient} rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6 shadow-2xl transform-gpu transition-all duration-300`}
        style={{
          transformStyle: 'preserve-3d',
          boxShadow: isHovered 
            ? '0 30px 60px rgba(0, 0, 0, 0.5), 0 0 100px rgba(0, 255, 136, 0.3)'
            : '0 10px 30px rgba(0, 0, 0, 0.3)',
        }}
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.6 }}
      >
        {/* Icon with floating animation */}
        <motion.span
          animate={isHovered ? {
            y: [-5, 5, -5],
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            transform: 'translateZ(30px)',
          }}
        >
          {feature.icon}
        </motion.span>

        {/* Rotating ring around icon */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 rounded-3xl"
            style={{
              border: '2px solid rgba(255, 255, 255, 0.3)',
            }}
            animate={{
              rotate: [0, 360],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        )}

        {/* Pulse effect */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 rounded-3xl bg-white/20"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Title with gradient animation */}
      <motion.h3 
        className="text-2xl font-black mb-4"
        style={{
          background: isHovered 
            ? 'linear-gradient(90deg, #00FF88, #0088FF, #00FF88)' 
            : 'linear-gradient(90deg, #FFFFFF, #FFFFFF)',
          backgroundSize: isHovered ? '200% 100%' : '100% 100%',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
        }}
        animate={isHovered ? {
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {feature.title}
      </motion.h3>

      {/* Description with fade effect */}
      <motion.p 
        className="text-gray-400 leading-relaxed"
        animate={isHovered ? {
          color: '#FFFFFF',
        } : {
          color: '#9CA3AF',
        }}
        transition={{ duration: 0.3 }}
      >
        {feature.description}
      </motion.p>

      {/* Corner decorations */}
      {isHovered && (
        <>
          <motion.div
            className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-green-400 rounded-tl-xl"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500 rounded-tr-xl"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500 rounded-bl-xl"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-green-400 rounded-br-xl"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          />
        </>
      )}

      {/* Floating particles */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: `linear-gradient(45deg, ${i % 2 === 0 ? '#00FF88' : '#0088FF'}, ${i % 2 === 0 ? '#0088FF' : '#00FF88'})`,
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                y: [0, -30, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}