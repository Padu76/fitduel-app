'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useTilt, useMousePosition } from '@/hooks/useParallaxEffects'

interface GameMode {
  icon: string
  title: string
  players: string
  description: string
  bgImage: string
  glowColor: string
}

const gameModes: GameMode[] = [
  {
    icon: '⚡',
    title: 'SFIDA LAMPO',
    players: '1 VS 1 • 30 SECONDI',
    description: 'Sfida istantanea contro un amico. Chi fa più ripetizioni in 30 secondi vince!',
    bgImage: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400&h=500&fit=crop',
    glowColor: 'rgba(0, 255, 136, 0.6)'
  },
  {
    icon: '👥',
    title: 'TEAM BATTLE',
    players: '5 VS 5 • 5 MINUTI',
    description: 'Crea il tuo team e domina. Punti doppi per le vittorie di squadra!',
    bgImage: 'https://images.unsplash.com/photo-1552674605-db6894100b4f?w=400&h=500&fit=crop',
    glowColor: 'rgba(0, 136, 255, 0.6)'
  },
  {
    icon: '🏆',
    title: 'TORNEO DAILY',
    players: '100 PLAYERS • TUTTO IL GIORNO',
    description: 'Accumula punti durante il giorno. Top 3 vincono premi esclusivi!',
    bgImage: 'https://images.unsplash.com/photo-1571019613454-516006a1aa2?w=400&h=500&fit=crop',
    glowColor: 'rgba(255, 215, 0, 0.6)'
  },
  {
    icon: '🎯',
    title: 'MISSIONI SOLO',
    players: 'SINGLE PLAYER • QUANDO VUOI',
    description: 'Completa missioni giornaliere e sblocca rewards. Nuovo contenuto ogni giorno!',
    bgImage: 'https://images.unsplash.com/photo-1581009146145-a5de890ff157?w=400&h=500&fit=crop',
    glowColor: 'rgba(255, 0, 255, 0.6)'
  }
]

export default function GameModesSection() {
  const mousePosition = useMousePosition()
  
  return (
    <section className="py-24 px-4 bg-gray-950 relative overflow-hidden">
      {/* Animated background gradient that follows mouse */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 255, 136, 0.3), transparent 50%)`,
        }}
      />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl font-black text-center mb-16 uppercase text-white"
          style={{
            textShadow: `${mousePosition.normalizedX * 5}px ${mousePosition.normalizedY * 5}px 20px rgba(0, 255, 136, 0.3)`,
          }}
        >
          Modalità di Gioco
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {gameModes.map((mode, index) => (
            <GameModeCard3D 
              key={index} 
              mode={mode} 
              index={index}
              mousePosition={mousePosition}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// Enhanced 3D game mode card
function GameModeCard3D({ 
  mode, 
  index,
  mousePosition 
}: { 
  mode: GameMode
  index: number
  mousePosition: ReturnType<typeof useMousePosition>
}) {
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    const rotateX = ((y - centerY) / centerY) * -20
    const rotateY = ((x - centerX) / centerX) * 20
    
    cardRef.current.style.transform = `
      perspective(1000px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      translateZ(50px)
      scale(1.05)
    `
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    cardRef.current.style.transform = `
      perspective(1000px)
      rotateX(0deg)
      rotateY(0deg)
      translateZ(0px)
      scale(1)
    `
    setIsHovered(false)
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50, rotateX: -20 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true }}
      transition={{ 
        delay: index * 0.1,
        duration: 0.6,
        type: "spring",
        stiffness: 100
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative group cursor-pointer transform-gpu transition-all duration-300"
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      <div 
        className="relative h-80 rounded-2xl overflow-hidden"
        style={{
          boxShadow: isHovered 
            ? `0 20px 40px ${mode.glowColor}, 0 0 80px ${mode.glowColor}`
            : '0 10px 30px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Background Image with parallax */}
        <div 
          className="absolute inset-0"
          style={{
            transform: isHovered 
              ? `scale(1.2) translate(${mousePosition.normalizedX * 10}px, ${mousePosition.normalizedY * 10}px)`
              : 'scale(1)',
            transition: 'transform 0.3s ease-out',
          }}
        >
          <Image
            src={mode.bgImage}
            alt={mode.title}
            fill
            className="object-cover"
          />
        </div>
        
        {/* Animated Gradient Overlay */}
        <motion.div 
          className="absolute inset-0"
          animate={isHovered ? {
            background: [
              'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
              'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
              'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
            ]
          } : {
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Content with 3D depth */}
        <div 
          className="absolute inset-0 p-6 flex flex-col justify-end"
          style={{
            transform: 'translateZ(60px)',
          }}
        >
          <motion.div 
            className="text-5xl mb-4"
            animate={isHovered ? { 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            } : {}}
            transition={{ duration: 0.5 }}
          >
            {mode.icon}
          </motion.div>
          
          <h3 className="text-2xl font-black text-green-400 mb-2">
            {mode.title}
          </h3>
          
          <p className="text-xs text-blue-400 font-bold mb-3">
            {mode.players}
          </p>
          
          <p className="text-sm text-gray-300">
            {mode.description}
          </p>
        </div>

        {/* Holographic shimmer effect */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              background: [
                'linear-gradient(45deg, transparent 30%, rgba(0, 255, 136, 0.5), transparent 70%)',
                'linear-gradient(45deg, transparent 30%, rgba(0, 136, 255, 0.5), transparent 70%)',
                'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.5), transparent 70%)',
              ],
              backgroundPosition: ['-200% 0%', '200% 0%'],
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ 
              mixBlendMode: 'screen',
              backgroundSize: '200% 100%',
            }}
          />
        )}

        {/* Animated Border */}
        <div className="absolute inset-0 rounded-2xl">
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: `linear-gradient(45deg, ${mode.glowColor}, transparent, ${mode.glowColor})`,
              padding: '2px',
            }}
            animate={isHovered ? {
              opacity: [0, 1, 0],
              rotate: [0, 360],
            } : { opacity: 0 }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <div className="w-full h-full bg-black rounded-2xl" />
          </motion.div>
        </div>

        {/* Floating particles on hover */}
        {isHovered && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-green-400 rounded-full"
                initial={{
                  x: Math.random() * 100,
                  y: 100,
                  opacity: 0,
                }}
                animate={{
                  y: -20,
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1 + Math.random(),
                  repeat: Infinity,
                  delay: Math.random() * 0.5,
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}