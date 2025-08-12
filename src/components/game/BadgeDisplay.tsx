'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Medal, Award, Star, Crown, Zap, Target, Flame, Shield, Heart, TrendingUp, Users, Timer, CheckCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Modal } from '@/components/ui/Modal'

// ====================================
// TYPES & INTERFACES
// ====================================
export interface Badge {
  id: string
  code: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
  category: 'achievement' | 'milestone' | 'special' | 'seasonal' | 'social'
  unlockedAt?: string
  progress?: number
  maxProgress?: number
  xpReward?: number
  featured?: boolean
}

export interface BadgeDisplayProps {
  badges: Badge[]
  variant?: 'grid' | 'list' | 'carousel' | 'compact'
  showLocked?: boolean
  showProgress?: boolean
  maxDisplay?: number
  className?: string
  onBadgeClick?: (badge: Badge) => void
}

// ====================================
// BADGE ICONS MAPPING
// ====================================
const badgeIcons: Record<string, any> = {
  trophy: Trophy,
  medal: Medal,
  award: Award,
  star: Star,
  crown: Crown,
  zap: Zap,
  target: Target,
  flame: Flame,
  shield: Shield,
  heart: Heart,
  trending: TrendingUp,
  users: Users,
  timer: Timer,
  check: CheckCircle,
}

// ====================================
// RARITY CONFIGURATION
// ====================================
const rarityConfig = {
  common: {
    color: 'from-gray-500 to-gray-600',
    borderColor: 'border-gray-600',
    glowColor: 'shadow-gray-500/20',
    bgColor: 'bg-gray-900/50',
    label: 'Comune',
    stars: 1,
  },
  rare: {
    color: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-600',
    glowColor: 'shadow-blue-500/30',
    bgColor: 'bg-blue-900/20',
    label: 'Raro',
    stars: 2,
  },
  epic: {
    color: 'from-purple-500 to-purple-600',
    borderColor: 'border-purple-600',
    glowColor: 'shadow-purple-500/40',
    bgColor: 'bg-purple-900/20',
    label: 'Epico',
    stars: 3,
  },
  legendary: {
    color: 'from-yellow-500 to-orange-500',
    borderColor: 'border-yellow-600',
    glowColor: 'shadow-yellow-500/50',
    bgColor: 'bg-yellow-900/20',
    label: 'Leggendario',
    stars: 4,
  },
  mythic: {
    color: 'from-red-500 via-purple-500 to-blue-500',
    borderColor: 'border-red-500',
    glowColor: 'shadow-red-500/60',
    bgColor: 'bg-gradient-to-br from-red-900/20 to-purple-900/20',
    label: 'Mitico',
    stars: 5,
  },
}

// ====================================
// BADGE DISPLAY COMPONENT
// ====================================
export function BadgeDisplay({
  badges,
  variant = 'grid',
  showLocked = true,
  showProgress = true,
  maxDisplay,
  className,
  onBadgeClick,
}: BadgeDisplayProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)
  
  const displayBadges = maxDisplay ? badges.slice(0, maxDisplay) : badges
  const unlockedBadges = displayBadges.filter(b => b.unlockedAt)
  const lockedBadges = displayBadges.filter(b => !b.unlockedAt)

  const handleBadgeClick = (badge: Badge) => {
    setSelectedBadge(badge)
    if (onBadgeClick) {
      onBadgeClick(badge)
    }
  }

  if (variant === 'list') {
    return (
      <>
        <BadgeList
          badges={displayBadges}
          showLocked={showLocked}
          showProgress={showProgress}
          onBadgeClick={handleBadgeClick}
          className={className}
        />
        <BadgeModal
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
        />
      </>
    )
  }

  if (variant === 'carousel') {
    return (
      <>
        <BadgeCarousel
          badges={displayBadges}
          showLocked={showLocked}
          onBadgeClick={handleBadgeClick}
          className={className}
        />
        <BadgeModal
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
        />
      </>
    )
  }

  if (variant === 'compact') {
    return (
      <>
        <CompactBadgeDisplay
          badges={unlockedBadges}
          totalBadges={badges.length}
          onViewAll={() => {}}
          className={className}
        />
        <BadgeModal
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
        />
      </>
    )
  }

  // Default grid variant
  return (
    <>
      <div className={cn('grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4', className)}>
        {/* Unlocked badges */}
        {unlockedBadges.map((badge) => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            onClick={() => handleBadgeClick(badge)}
            showProgress={showProgress}
          />
        ))}
        
        {/* Locked badges */}
        {showLocked && lockedBadges.map((badge) => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            onClick={() => handleBadgeClick(badge)}
            showProgress={showProgress}
            locked
          />
        ))}
      </div>
      
      <BadgeModal
        badge={selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />
    </>
  )
}

// ====================================
// BADGE CARD COMPONENT
// ====================================
function BadgeCard({
  badge,
  onClick,
  showProgress = true,
  locked = false,
}: {
  badge: Badge
  onClick: () => void
  showProgress?: boolean
  locked?: boolean
}) {
  const Icon = badgeIcons[badge.icon] || Trophy
  const rarity = rarityConfig[badge.rarity]

  return (
    <motion.button
      onClick={onClick}
      className="relative group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className={cn(
        'relative p-3 rounded-xl',
        'border-2 transition-all duration-300',
        locked ? 'border-gray-700 bg-gray-900/50' : `${rarity.borderColor} ${rarity.bgColor}`,
        !locked && `hover:shadow-lg ${rarity.glowColor}`,
        badge.featured && !locked && 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-gray-950'
      )}>
        {/* Badge icon */}
        <div className={cn(
          'w-12 h-12 mx-auto rounded-full flex items-center justify-center',
          locked ? 'bg-gray-800' : `bg-gradient-to-br ${rarity.color}`
        )}>
          <Icon className={cn(
            'w-6 h-6',
            locked ? 'text-gray-600' : 'text-white'
          )} />
        </div>

        {/* Progress bar */}
        {showProgress && badge.progress !== undefined && badge.maxProgress && (
          <div className="mt-2">
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full',
                  locked ? 'bg-gray-600' : `bg-gradient-to-r ${rarity.color}`
                )}
                initial={{ width: 0 }}
                animate={{ width: `${(badge.progress / badge.maxProgress) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* Lock overlay */}
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
            <Shield className="w-6 h-6 text-gray-500" />
          </div>
        )}

        {/* Featured indicator */}
        {badge.featured && !locked && (
          <div className="absolute -top-1 -right-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          </div>
        )}
      </div>

      {/* Badge name */}
      <p className={cn(
        'mt-1 text-xs truncate',
        locked ? 'text-gray-500' : 'text-gray-300'
      )}>
        {badge.name}
      </p>
    </motion.button>
  )
}

// ====================================
// BADGE LIST COMPONENT
// ====================================
function BadgeList({
  badges,
  showLocked,
  showProgress,
  onBadgeClick,
  className,
}: {
  badges: Badge[]
  showLocked: boolean
  showProgress: boolean
  onBadgeClick: (badge: Badge) => void
  className?: string
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {badges.map((badge) => {
        const Icon = badgeIcons[badge.icon] || Trophy
        const rarity = rarityConfig[badge.rarity]
        const isLocked = !badge.unlockedAt

        if (isLocked && !showLocked) return null

        return (
          <motion.button
            key={badge.id}
            onClick={() => onBadgeClick(badge)}
            className={cn(
              'w-full p-4 rounded-xl',
              'border transition-all duration-300',
              'flex items-center gap-4',
              'hover:transform hover:scale-[1.02]',
              isLocked 
                ? 'border-gray-800 bg-gray-900/50' 
                : `${rarity.borderColor} ${rarity.bgColor} hover:shadow-lg ${rarity.glowColor}`
            )}
            whileHover={{ x: 4 }}
          >
            {/* Badge icon */}
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0',
              isLocked ? 'bg-gray-800' : `bg-gradient-to-br ${rarity.color}`
            )}>
              <Icon className={cn(
                'w-8 h-8',
                isLocked ? 'text-gray-600' : 'text-white'
              )} />
            </div>

            {/* Badge info */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  'font-bold',
                  isLocked ? 'text-gray-500' : 'text-white'
                )}>
                  {badge.name}
                </h3>
                {badge.featured && !isLocked && (
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              
              <p className={cn(
                'text-sm',
                isLocked ? 'text-gray-600' : 'text-gray-400'
              )}>
                {badge.description}
              </p>

              {/* Progress */}
              {showProgress && badge.progress !== undefined && badge.maxProgress && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Progresso</span>
                    <span>{badge.progress}/{badge.maxProgress}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        'h-full',
                        isLocked ? 'bg-gray-600' : `bg-gradient-to-r ${rarity.color}`
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${(badge.progress / badge.maxProgress) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Lock indicator */}
            {isLocked && (
              <Shield className="w-6 h-6 text-gray-500" />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

// ====================================
// BADGE CAROUSEL COMPONENT
// ====================================
function BadgeCarousel({
  badges,
  showLocked,
  onBadgeClick,
  className,
}: {
  badges: Badge[]
  showLocked: boolean
  onBadgeClick: (badge: Badge) => void
  className?: string
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const displayBadges = badges.filter(b => showLocked || b.unlockedAt)

  const nextBadge = () => {
    setCurrentIndex((prev) => (prev + 1) % displayBadges.length)
  }

  const prevBadge = () => {
    setCurrentIndex((prev) => (prev - 1 + displayBadges.length) % displayBadges.length)
  }

  if (displayBadges.length === 0) return null

  const currentBadge = displayBadges[currentIndex]
  const Icon = badgeIcons[currentBadge.icon] || Trophy
  const rarity = rarityConfig[currentBadge.rarity]
  const isLocked = !currentBadge.unlockedAt

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-4">
        <button
          onClick={prevBadge}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          ←
        </button>

        <motion.div
          key={currentBadge.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex-1"
        >
          <button
            onClick={() => onBadgeClick(currentBadge)}
            className={cn(
              'w-full p-6 rounded-2xl',
              'border-2 transition-all',
              isLocked 
                ? 'border-gray-800 bg-gray-900/50' 
                : `${rarity.borderColor} ${rarity.bgColor} shadow-lg ${rarity.glowColor}`
            )}
          >
            <div className={cn(
              'w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4',
              isLocked ? 'bg-gray-800' : `bg-gradient-to-br ${rarity.color}`
            )}>
              <Icon className={cn(
                'w-10 h-10',
                isLocked ? 'text-gray-600' : 'text-white'
              )} />
            </div>

            <h3 className={cn(
              'text-lg font-bold mb-2',
              isLocked ? 'text-gray-500' : 'text-white'
            )}>
              {currentBadge.name}
            </h3>

            <p className={cn(
              'text-sm',
              isLocked ? 'text-gray-600' : 'text-gray-400'
            )}>
              {currentBadge.description}
            </p>

            {isLocked && (
              <div className="mt-4 text-gray-500">
                <Shield className="w-5 h-5 mx-auto" />
                <p className="text-xs mt-1">Bloccato</p>
              </div>
            )}
          </button>
        </motion.div>

        <button
          onClick={nextBadge}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          →
        </button>
      </div>

      {/* Indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {displayBadges.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              index === currentIndex 
                ? 'w-8 bg-indigo-500' 
                : 'bg-gray-700 hover:bg-gray-600'
            )}
          />
        ))}
      </div>
    </div>
  )
}

// ====================================
// COMPACT BADGE DISPLAY
// ====================================
function CompactBadgeDisplay({
  badges,
  totalBadges,
  onViewAll,
  className,
}: {
  badges: Badge[]
  totalBadges: number
  onViewAll: () => void
  className?: string
}) {
  const displayLimit = 5
  const displayBadges = badges.slice(0, displayLimit)
  const remaining = totalBadges - displayLimit

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex -space-x-3">
        {displayBadges.map((badge, index) => {
          const Icon = badgeIcons[badge.icon] || Trophy
          const rarity = rarityConfig[badge.rarity]

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                'border-2 border-gray-950',
                `bg-gradient-to-br ${rarity.color}`
              )}
              style={{ zIndex: displayLimit - index }}
            >
              <Icon className="w-5 h-5 text-white" />
            </motion.div>
          )
        })}

        {remaining > 0 && (
          <button
            onClick={onViewAll}
            className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-950 flex items-center justify-center hover:bg-gray-700 transition-colors"
            style={{ zIndex: 0 }}
          >
            <span className="text-xs font-bold">+{remaining}</span>
          </button>
        )}
      </div>

      <div className="text-sm">
        <span className="font-bold">{badges.length}</span>
        <span className="text-gray-500">/{totalBadges} Badge</span>
      </div>
    </div>
  )
}

// ====================================
// BADGE MODAL COMPONENT
// ====================================
function BadgeModal({
  badge,
  onClose,
}: {
  badge: Badge | null
  onClose: () => void
}) {
  if (!badge) return null

  const Icon = badgeIcons[badge.icon] || Trophy
  const rarity = rarityConfig[badge.rarity]
  const isLocked = !badge.unlockedAt

  return (
    <Modal
      isOpen={!!badge}
      onClose={onClose}
      size="sm"
      centered
    >
      <div className="text-center">
        {/* Badge icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className={cn(
            'w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6',
            isLocked ? 'bg-gray-800' : `bg-gradient-to-br ${rarity.color}`,
            !isLocked && `shadow-2xl ${rarity.glowColor}`
          )}
        >
          <Icon className={cn(
            'w-16 h-16',
            isLocked ? 'text-gray-600' : 'text-white'
          )} />
        </motion.div>

        {/* Rarity stars */}
        <div className="flex justify-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                'w-5 h-5',
                i < rarity.stars 
                  ? isLocked ? 'text-gray-600' : 'text-yellow-500 fill-yellow-500'
                  : 'text-gray-700'
              )}
            />
          ))}
        </div>

        {/* Badge info */}
        <h2 className="text-2xl font-bold mb-2">{badge.name}</h2>
        <p className={cn(
          'inline-px px-3 py-1 rounded-full text-sm mb-4',
          rarity.bgColor,
          rarity.borderColor,
          'border'
        )}>
          {rarity.label}
        </p>

        <p className="text-gray-400 mb-6">{badge.description}</p>

        {/* Progress */}
        {badge.progress !== undefined && badge.maxProgress && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Progresso</span>
              <span>{badge.progress}/{badge.maxProgress}</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full',
                  isLocked ? 'bg-gray-600' : `bg-gradient-to-r ${rarity.color}`
                )}
                initial={{ width: 0 }}
                animate={{ width: `${(badge.progress / badge.maxProgress) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Unlock info */}
        {badge.unlockedAt ? (
          <div className="text-sm text-gray-500">
            <CheckCircle className="w-4 h-4 inline mr-1 text-green-500" />
            Sbloccato il {new Date(badge.unlockedAt).toLocaleDateString('it-IT')}
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            <Shield className="w-4 h-4 inline mr-1" />
            Badge bloccato
          </div>
        )}

        {/* XP Reward */}
        {badge.xpReward && !isLocked && (
          <div className="mt-4 text-sm text-indigo-400">
            <Zap className="w-4 h-4 inline mr-1" />
            +{badge.xpReward} XP
          </div>
        )}
      </div>
    </Modal>
  )
}

// ====================================
// EXPORTS
// ====================================
export default BadgeDisplay