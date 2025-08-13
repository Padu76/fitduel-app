'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Zap, Trophy, Crown, Star } from 'lucide-react'
import { cn } from '@/utils/cn'
import { calculateLevel, calculateProgress, getLevelData } from '@/utils/helpers'
import { LEVELS } from '@/utils/constants'

// ====================================
// TYPES & INTERFACES
// ====================================
// Create a type for any level data
type LevelData = typeof LEVELS[keyof typeof LEVELS]

export interface XPBarProps {
  currentXP: number
  previousXP?: number
  showLevel?: boolean
  showProgress?: boolean
  showAnimation?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'gradient' | 'segmented' | 'circular'
  className?: string
  onLevelUp?: (newLevel: number) => void
}

interface LevelUpModalProps {
  isOpen: boolean
  newLevel: number
  levelData: LevelData  // Changed from typeof LEVELS[0]
  onClose: () => void
}

// ====================================
// STYLES CONFIGURATION
// ====================================
const sizes = {
  sm: {
    bar: 'h-2',
    text: 'text-xs',
    icon: 'w-3 h-3',
    level: 'text-sm',
  },
  md: {
    bar: 'h-3',
    text: 'text-sm',
    icon: 'w-4 h-4',
    level: 'text-base',
  },
  lg: {
    bar: 'h-4',
    text: 'text-base',
    icon: 'w-5 h-5',
    level: 'text-lg',
  },
  xl: {
    bar: 'h-6',
    text: 'text-lg',
    icon: 'w-6 h-6',
    level: 'text-xl',
  },
}

const levelIcons = {
  1: Star,
  2: Star,
  3: Star,
  4: Zap,
  5: Zap,
  6: Zap,
  7: Trophy,
  8: Trophy,
  9: Trophy,
  10: Crown,
  11: Crown,
  12: Crown,
}

// ====================================
// XP BAR COMPONENT
// ====================================
export function XPBar({
  currentXP,
  previousXP = 0,
  showLevel = true,
  showProgress = true,
  showAnimation = true,
  size = 'md',
  variant = 'default',
  className,
  onLevelUp,
}: XPBarProps) {
  const [displayXP, setDisplayXP] = useState(previousXP || currentXP)
  const [showLevelUpModal, setShowLevelUpModal] = useState(false)
  
  const currentLevel = calculateLevel(displayXP)
  const previousLevel = calculateLevel(previousXP)
  const progress = calculateProgress(displayXP)
  const levelData = getLevelData(currentLevel)
  
  const sizeConfig = sizes[size]
  const LevelIcon = levelIcons[currentLevel as keyof typeof levelIcons] || Star

  // Animate XP change
  useEffect(() => {
    if (!showAnimation) {
      setDisplayXP(currentXP)
      return
    }

    const difference = currentXP - displayXP
    const steps = 30
    const increment = difference / steps
    let step = 0

    const timer = setInterval(() => {
      step++
      if (step >= steps) {
        setDisplayXP(currentXP)
        clearInterval(timer)
        
        // Check for level up
        const newLevel = calculateLevel(currentXP)
        if (newLevel > currentLevel && onLevelUp) {
          onLevelUp(newLevel)
          setShowLevelUpModal(true)
        }
      } else {
        setDisplayXP(prev => prev + increment)
      }
    }, 20)

    return () => clearInterval(timer)
  }, [currentXP])

  // Check for level up on mount
  useEffect(() => {
    if (currentLevel > previousLevel && onLevelUp) {
      onLevelUp(currentLevel)
      setShowLevelUpModal(true)
    }
  }, [])

  if (variant === 'circular') {
    return (
      <CircularXPBar
        currentXP={displayXP}
        progress={progress}
        levelData={levelData}
        size={size}
        className={className}
      />
    )
  }

  if (variant === 'segmented') {
    return (
      <SegmentedXPBar
        currentXP={displayXP}
        progress={progress}
        levelData={levelData}
        size={size}
        className={className}
      />
    )
  }

  return (
    <>
      <div className={cn('w-full', className)}>
        {/* Level and progress info */}
        {(showLevel || showProgress) && (
          <div className="flex items-center justify-between mb-2">
            {showLevel && (
              <div className="flex items-center gap-2">
                <div className={cn(
                  'flex items-center justify-center',
                  'w-8 h-8 rounded-full',
                  'bg-gradient-to-r from-indigo-500 to-purple-500',
                  'shadow-lg shadow-indigo-500/25'
                )}>
                  <LevelIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className={cn('font-bold', sizeConfig.level)}>
                    Livello {currentLevel}
                  </div>
                  <div className={cn('text-gray-500', sizeConfig.text)}>
                    {levelData.titleIt}
                  </div>
                </div>
              </div>
            )}
            
            {showProgress && (
              <div className={cn('text-gray-400', sizeConfig.text)}>
                {Math.floor(displayXP).toLocaleString()} / {progress.next + progress.current} XP
              </div>
            )}
          </div>
        )}

        {/* XP Bar */}
        <div className="relative">
          <div className={cn(
            'w-full bg-gray-800 rounded-full overflow-hidden',
            sizeConfig.bar
          )}>
            {/* Background segments */}
            <div className="absolute inset-0 flex">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="flex-1 border-r border-gray-700 last:border-r-0"
                />
              ))}
            </div>

            {/* Progress bar */}
            <motion.div
              className={cn(
                'h-full relative',
                variant === 'gradient' 
                  ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ 
                duration: showAnimation ? 0.5 : 0,
                ease: 'easeOut' 
              }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
              
              {/* Shine animation */}
              {showAnimation && (
                <motion.div
                  className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{
                    x: ['-100%', '500%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: 'easeInOut',
                  }}
                />
              )}
            </motion.div>
          </div>

          {/* XP gain indicator */}
          <AnimatePresence>
            {currentXP > previousXP && showAnimation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute -top-8 right-0"
              >
                <span className="text-green-400 font-bold">
                  +{Math.floor(currentXP - previousXP)} XP
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Next level indicator */}
        {progress.percentage >= 80 && (
          <div className={cn(
            'mt-2 text-center',
            'text-yellow-400',
            sizeConfig.text
          )}>
            <TrendingUp className={cn('inline mr-1', sizeConfig.icon)} />
            Prossimo livello vicino! ({100 - progress.percentage}% rimanente)
          </div>
        )}
      </div>

      {/* Level up modal */}
      <LevelUpModal
        isOpen={showLevelUpModal}
        newLevel={currentLevel}
        levelData={levelData}
        onClose={() => setShowLevelUpModal(false)}
      />
    </>
  )
}

// ====================================
// CIRCULAR XP BAR COMPONENT
// ====================================
function CircularXPBar({
  currentXP,
  progress,
  levelData,
  size,
  className,
}: {
  currentXP: number
  progress: ReturnType<typeof calculateProgress>
  levelData: LevelData  // Changed from typeof LEVELS[0]
  size: keyof typeof sizes
  className?: string
}) {
  const radius = size === 'sm' ? 40 : size === 'md' ? 50 : size === 'lg' ? 60 : 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress.percentage / 100) * circumference

  const svgSize = radius * 2 + 20
  const strokeWidth = size === 'sm' ? 4 : size === 'md' ? 6 : size === 'lg' ? 8 : 10

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={svgSize} height={svgSize} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-800"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          style={{
            strokeDasharray: circumference,
          }}
          transition={{
            duration: 0.5,
            ease: 'easeOut',
          }}
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Center content */}
      <div className="absolute flex flex-col items-center">
        <div className={cn('font-bold', sizes[size].level)}>
          {levelData.level}
        </div>
        <div className={cn('text-gray-400', sizes[size].text)}>
          Level
        </div>
        <div className={cn('text-gray-500', sizes[size].text)}>
          {progress.percentage}%
        </div>
      </div>
    </div>
  )
}

// ====================================
// SEGMENTED XP BAR COMPONENT
// ====================================
function SegmentedXPBar({
  currentXP,
  progress,
  levelData,
  size,
  className,
}: {
  currentXP: number
  progress: ReturnType<typeof calculateProgress>
  levelData: LevelData  // Changed from typeof LEVELS[0]
  size: keyof typeof sizes
  className?: string
}) {
  const segments = 10
  const filledSegments = Math.floor((progress.percentage / 100) * segments)
  const partialFill = ((progress.percentage / 100) * segments) % 1

  return (
    <div className={cn('w-full', className)}>
      <div className="flex gap-1">
        {[...Array(segments)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex-1 rounded-full relative overflow-hidden',
              'bg-gray-800',
              sizes[size].bar
            )}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{
                width: i < filledSegments ? '100%' : 
                       i === filledSegments ? `${partialFill * 100}%` : '0%'
              }}
              transition={{
                duration: 0.3,
                delay: i * 0.05,
                ease: 'easeOut',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ====================================
// LEVEL UP MODAL COMPONENT
// ====================================
function LevelUpModal({ isOpen, newLevel, levelData, onClose }: LevelUpModalProps) {
  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-gray-900 border border-gray-800 rounded-3xl p-8 max-w-md w-full text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Celebration animation */}
        <motion.div
          initial={{ rotate: 0, scale: 0 }}
          animate={{ rotate: 360, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/50"
        >
          <Trophy className="w-12 h-12 text-white" />
        </motion.div>

        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
          LEVEL UP!
        </h2>
        
        <p className="text-5xl font-bold mb-2">{newLevel}</p>
        
        <p className="text-xl text-gray-400 mb-6">
          {levelData.titleIt}
        </p>

        <div className="flex items-center justify-center gap-2 text-yellow-400 mb-8">
          <Star className="w-5 h-5 fill-current" />
          <span className="font-semibold">{levelData.badge}</span>
          <Star className="w-5 h-5 fill-current" />
        </div>

        <button
          onClick={onClose}
          className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl font-bold transition-all transform hover:scale-105"
        >
          Continua
        </button>
      </motion.div>
    </motion.div>
  )
}

// ====================================
// MINI XP INDICATOR
// ====================================
export function MiniXPIndicator({ 
  xp, 
  showLevel = true,
  className 
}: { 
  xp: number
  showLevel?: boolean
  className?: string 
}) {
  const level = calculateLevel(xp)
  const progress = calculateProgress(xp)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showLevel && (
        <div className="flex items-center gap-1 px-2 py-1 bg-indigo-500/20 rounded-full">
          <Trophy className="w-3 h-3 text-indigo-400" />
          <span className="text-xs font-bold text-indigo-400">Lv.{level}</span>
        </div>
      )}
      <div className="flex items-center gap-1">
        <Zap className="w-3 h-3 text-yellow-400" />
        <span className="text-sm font-semibold">{xp.toLocaleString()}</span>
      </div>
    </div>
  )
}

// ====================================
// EXPORTS
// ====================================
export default XPBar