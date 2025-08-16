'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useMousePosition, useFloatingAnimation } from '@/hooks/useParallaxEffects'

interface Reward {
  tier: number
  icon: string
  name: string
  premium: boolean
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

const rewards: Reward[] = [
  { tier: 1, icon: '💪', name: 'Avatar Base', premium: false, rarity: 'common' },
  { tier: 5, icon: '🎯', name: 'Emote Victory', premium: false, rarity: 'common' },
  { tier: 10, icon: '🔥', name: 'Skin Fire', premium: true, rarity: 'rare' },
  { tier: 15, icon: '⚡', name: 'Boost XP', premium: false, rarity: 'rare' },
  { tier: 20, icon: '🏆', name: 'Title Champion', premium: false, rarity: 'epic' },
  { tier: 25, icon: '👑', name: 'Crown Effect', premium: true, rarity: 'epic' },
  { tier: 30, icon: '💎', name: '1000 Coins', premium: false, rarity: 'epic' },
  { tier: 50, icon: '🌟', name: 'Legendary Skin', premium: true, rarity: 'legendary' }
]

const rarityColors = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-500'
}

const rarityGlow = {
  common: 'rgba(156, 163, 175, 0.5)',
  rare: 'rgba(96, 165, 250, 0.5)',
  epic: 'rgba(168, 85, 247, 0.5)',
  legendary: 'rgba(251, 191, 36, 0.5)'
}

export default function BattlePassSection() {
  const mousePosition = useMousePosition()
  const scrollRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start end", "end start"]
  })
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const floatingRef1 = useFloatingAnimation(3, 20)
  const floatingRef2 = useFloatingAnimation(4, 25)

  return (
    <section ref={scrollRef} className="py-24 px-4 relative overflow-hidden">
      {/* Parallax Background Pattern */}
      <motion.div 
        className="absolute inset-0 opacity-10"
        style={{ y: backgroundY }}
      >
        <Image
          src="https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&h=600&fit=crop"
          alt="Battle Pass Background"
          fill
          className="object-cover"
        />
      </motion.div>

      {/* Floating gradient orbs */}
      <div className="absolute inset-0">
        <div 
          ref={floatingRef1}
          className="absolute top-10 left-1/4 w-64 h-64 bg-gradient-to-r from-green-400/30 to-blue-500/30 rounded-full blur-3xl"
        />
        <div 
          ref={floatingRef2}
          className="absolute bottom-10 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-400/30 to-yellow-400/30 rounded-full blur-3xl"
        />
      </div>

      {/* Grid pattern that moves with mouse */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 136, 0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 136, 255, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px',
          transform: `translate(${mousePosition.normalizedX * 30}px, ${mousePosition.normalizedY * 30}px)`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          className="text-5xl font-black text-center mb-8 uppercase text-white"
          style={{
            textShadow: `${mousePosition.normalizedX * 10}px ${mousePosition.normalizedY * 10}px 30px rgba(0, 255, 136, 0.4)`,
          }}
        >
          Battle Pass
        </motion.h2>

        {/* Season Header with 3D effect */}
        <SeasonHeader3D mousePosition={mousePosition} />

        {/* Rewards Track with parallax scroll */}
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
            {rewards.map((reward, index) => (
              <RewardItem3D 
                key={index} 
                reward={reward} 
                index={index}
                mousePosition={mousePosition}
              />
            ))}
          </div>
          
          {/* Scroll indicators */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 pr-4">
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-green-400 text-3xl"
            >
              →
            </motion.div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}

// Enhanced Season Header with 3D depth
function SeasonHeader3D({ mousePosition }: { mousePosition: ReturnType<typeof useMousePosition> }) {
  const timeBlocks = [
    { value: 28, label: 'Giorni' },
    { value: 14, label: 'Ore' },
    { value: 32, label: 'Min' }
  ]

  return (
    <div className="flex flex-wrap justify-between items-center mb-12 gap-6">
      <motion.div 
        whileHover={{ scale: 1.05 }}
        className="bg-gradient-to-r from-green-400 to-blue-500 px-8 py-3 rounded-full font-black text-xl text-black transform"
        style={{
          transform: `perspective(1000px) rotateX(${mousePosition.normalizedY * -5}deg) rotateY(${mousePosition.normalizedX * 5}deg)`,
          boxShadow: '0 10px 30px rgba(0, 255, 136, 0.5)',
        }}
      >
        <motion.span
          animate={{ 
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            backgroundImage: 'linear-gradient(90deg, #000, #333, #000)',
            backgroundSize: '200% 100%',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          SEASON 1 - ORIGINS
        </motion.span>
      </motion.div>
      
      <div className="flex gap-4">
        {timeBlocks.map((time, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ 
              scale: 1.1,
              rotateY: 180,
            }}
            className="bg-gray-900 border border-green-400/30 rounded-xl p-4 min-w-[80px] text-center transform-gpu"
            style={{
              transformStyle: 'preserve-3d',
              perspective: '1000px',
            }}
          >
            <motion.div 
              className="text-3xl font-black text-blue-500"
              animate={{ 
                color: ['#0088FF', '#00FF88', '#0088FF']
              }}
              transition={{ duration: 2 + i, repeat: Infinity }}
            >
              {time.value}
            </motion.div>
            <div className="text-xs text-gray-400 uppercase">{time.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Enhanced 3D Reward Item
function RewardItem3D({ 
  reward, 
  index,
  mousePosition 
}: { 
  reward: Reward
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
    
    const rotateX = ((y - centerY) / centerY) * -15
    const rotateY = ((x - centerX) / centerX) * 15
    
    cardRef.current.style.transform = `
      perspective(1000px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      translateZ(30px)
      scale(1.1)
    `
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0) scale(1)'
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
      whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
      viewport={{ once: true }}
      transition={{ 
        delay: index * 0.05,
        type: "spring",
        stiffness: 100
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={`
        min-w-[140px] p-6 rounded-2xl text-center relative cursor-pointer
        transform-gpu transition-all duration-300
        ${reward.premium 
          ? 'bg-gradient-to-br from-green-400/30 to-blue-500/20 border-2 border-green-400' 
          : 'bg-gray-900 border border-gray-800'
        }
      `}
      style={{
        transformStyle: 'preserve-3d',
        boxShadow: isHovered 
          ? `0 20px 40px ${rarityGlow[reward.rarity]}, 0 0 60px ${rarityGlow[reward.rarity]}`
          : '0 5px 15px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Tier badge with floating animation */}
      <motion.div 
        className={`absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r ${rarityColors[reward.rarity]} px-3 py-1 rounded-full text-xs font-bold text-black`}
        animate={isHovered ? {
          y: [-3, -8, -3],
        } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      >
        LV {reward.tier}
      </motion.div>
      
      {/* Icon with rotation animation */}
      <motion.div 
        className="text-4xl mb-3 mt-2"
        animate={isHovered ? {
          rotate: [0, 10, -10, 0],
          scale: [1, 1.2, 1],
        } : {}}
        transition={{ duration: 0.5 }}
      >
        {reward.icon}
      </motion.div>
      
      <div className="text-sm font-medium text-white">{reward.name}</div>
      
      {/* Premium badge */}
      {reward.premium && (
        <motion.div 
          className="absolute top-2 right-2 text-xs bg-green-400 px-2 py-1 rounded-full text-black font-bold"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          PRO
        </motion.div>
      )}

      {/* Rarity particles */}
      {isHovered && reward.rarity === 'legendary' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full"
              initial={{ scale: 0 }}
              animate={{
                scale: [0, 1, 0],
                x: [0, (Math.random() - 0.5) * 50],
                y: [0, (Math.random() - 0.5) * 50],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.1,
              }}
              style={{
                left: '50%',
                top: '50%',
              }}
            />
          ))}
        </div>
      )}

      {/* Holographic effect for rare items */}
      {isHovered && (reward.rarity === 'epic' || reward.rarity === 'legendary') && (
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-50"
          animate={{
            background: [
              'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
              'linear-gradient(45deg, transparent, rgba(0, 255, 136, 0.3), transparent)',
              'linear-gradient(45deg, transparent, rgba(0, 136, 255, 0.3), transparent)',
            ],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ 
            mixBlendMode: 'screen',
            backgroundSize: '200% 200%',
          }}
        />
      )}
    </motion.div>
  )
}