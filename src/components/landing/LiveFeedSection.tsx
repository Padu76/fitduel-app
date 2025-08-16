'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { useMousePosition } from '@/hooks/useParallaxEffects'

interface FeedItem {
  avatar: string
  name: string
  action: string
  detail: string
  color: string
}

const liveFeed: FeedItem[] = [
  { avatar: 'M', name: 'Marco', action: 'ha battuto Luigi', detail: 'Push-ups +150 XP', color: 'from-green-400 to-emerald-600' },
  { avatar: 'S', name: 'Sara', action: 'streak 7 giorni!', detail: '+500 XP', color: 'from-blue-400 to-cyan-600' },
  { avatar: 'T', name: 'Team Alpha', action: 'vince il torneo!', detail: '+1000 XP', color: 'from-purple-400 to-pink-600' },
  { avatar: 'L', name: 'Luca', action: 'nuovo record!', detail: '45 squats +200 XP', color: 'from-yellow-400 to-orange-600' },
  { avatar: 'A', name: 'Anna', action: 'sblocca skin Epic!', detail: 'Level 25', color: 'from-red-400 to-rose-600' },
  { avatar: 'G', name: 'Giovanni', action: 'completa missione!', detail: 'Warrior Badge +300 XP', color: 'from-indigo-400 to-blue-600' },
  { avatar: 'F', name: 'Francesca', action: '10 vittorie oggi!', detail: 'Fire Streak +750 XP', color: 'from-orange-400 to-red-600' },
  { avatar: 'R', name: 'Roberto', action: 'perfect form!', detail: '100% accuracy +400 XP', color: 'from-teal-400 to-green-600' }
]

export default function LiveFeedSection() {
  const mousePosition = useMousePosition()
  const [scrollSpeed, setScrollSpeed] = useState(30)
  const containerRef = useRef<HTMLDivElement>(null)
  const controls = useAnimationControls()
  
  // Dynamic speed based on mouse position
  useEffect(() => {
    // Speed increases when mouse is on the right, decreases on the left
    const newSpeed = 30 - (mousePosition.normalizedX * 20)
    setScrollSpeed(Math.max(10, Math.min(50, newSpeed)))
  }, [mousePosition.normalizedX])

  // Hover pause effect
  const handleMouseEnter = () => {
    controls.stop()
  }

  const handleMouseLeave = () => {
    controls.start({
      x: [0, -50 + '%'],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: "loop",
          duration: scrollSpeed,
          ease: "linear",
        },
      },
    })
  }

  useEffect(() => {
    controls.start({
      x: [0, -50 + '%'],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: "loop",
          duration: scrollSpeed,
          ease: "linear",
        },
      },
    })
  }, [scrollSpeed, controls])

  return (
    <section className="py-8 bg-gradient-to-r from-green-400/10 to-blue-500/10 border-y border-green-400/30 overflow-hidden relative">
      {/* Gradient overlay that follows mouse */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px 50%, rgba(0, 255, 136, 0.2), transparent 30%)`,
        }}
      />

      {/* Speed indicator */}
      <motion.div 
        className="absolute top-2 right-4 text-xs text-green-400 font-mono z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        SPEED: {Math.round(51 - scrollSpeed)}x
      </motion.div>

      <div className="flex items-center gap-4">
        {/* Live indicator with pulse */}
        <div className="px-6 font-black text-green-400 whitespace-nowrap flex items-center gap-2 relative z-10">
          <motion.span 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [1, 0.5, 1]
            }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-red-500"
          >
            🔴
          </motion.span>
          <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            LIVE NOW
          </span>
        </div>
        
        {/* Scrolling feed with enhanced cards */}
        <motion.div 
          ref={containerRef}
          className="flex gap-8"
          animate={controls}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Triple the feed for seamless loop */}
          {[...liveFeed, ...liveFeed, ...liveFeed].map((item, index) => (
            <FeedCard3D key={index} item={item} index={index} />
          ))}
        </motion.div>
      </div>

      {/* Gradient borders */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent pointer-events-none z-10" />
    </section>
  )
}

// Enhanced 3D feed card
function FeedCard3D({ item, index }: { item: FeedItem; index: number }) {
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  return (
    <motion.div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ 
        scale: 1.05,
        y: -5,
        zIndex: 10
      }}
      className="relative flex items-center gap-3 bg-gray-900/50 px-6 py-3 rounded-full whitespace-nowrap backdrop-blur-sm border border-gray-800 hover:border-green-400/50 transition-all duration-300 cursor-pointer"
      style={{
        boxShadow: isHovered 
          ? '0 10px 30px rgba(0, 255, 136, 0.3), 0 0 40px rgba(0, 136, 255, 0.2)'
          : '0 5px 15px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Avatar with gradient background */}
      <motion.div 
        className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center font-bold text-black shadow-lg relative`}
        animate={isHovered ? {
          rotate: [0, 360],
        } : {}}
        transition={{ duration: 0.5 }}
      >
        {item.avatar}
        
        {/* Glowing ring on hover */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{
              border: '2px solid rgba(0, 255, 136, 0.5)',
            }}
          />
        )}
      </motion.div>

      {/* Content with animated text */}
      <div className="text-sm">
        <motion.span 
          className="text-green-400 font-bold"
          animate={isHovered ? {
            textShadow: [
              '0 0 0px rgba(0, 255, 136, 0)',
              '0 0 10px rgba(0, 255, 136, 0.8)',
              '0 0 0px rgba(0, 255, 136, 0)',
            ]
          } : {}}
          transition={{ duration: 1 }}
        >
          {item.name}
        </motion.span>
        <span className="text-gray-300"> {item.action}</span>
        <span className="text-gray-500"> • </span>
        <motion.span 
          className="text-blue-400"
          animate={isHovered ? {
            color: ['#0088FF', '#00FF88', '#0088FF']
          } : {}}
          transition={{ duration: 1 }}
        >
          {item.detail}
        </motion.span>
      </div>

      {/* Floating particles on hover */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-green-400 rounded-full"
              initial={{
                x: 40,
                y: 20,
                opacity: 0,
              }}
              animate={{
                x: 40 + Math.random() * 100,
                y: Math.random() * 40,
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}