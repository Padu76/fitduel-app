'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Swords, Trophy, Clock, Users, Zap, TrendingUp, 
  CheckCircle, XCircle, Timer, AlertCircle, ChevronRight,
  User, Calendar, Target, Flame, Shield, Crown
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatTimeAgo, formatDuration, formatNumber } from '@/utils/helpers'
import { EXERCISE_DATA, DUEL_STATUS } from '@/utils/constants'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

// ====================================
// TYPES & INTERFACES
// ====================================
export interface DuelData {
  id: string
  creatorId: string
  creatorName: string
  creatorAvatar?: string
  creatorLevel: number
  creatorXP: number
  opponentId?: string
  opponentName?: string
  opponentAvatar?: string
  opponentLevel?: number
  opponentXP?: number
  exerciseCode: string
  status: string
  challengeType: '1v1' | 'open' | 'tournament' | 'mission'
  mode: 'live' | 'async'
  targetValue?: number
  targetDescription?: string
  creatorScore?: number
  opponentScore?: number
  winnerId?: string
  xpReward: number
  wagerCoins?: number
  createdAt: string
  expiresAt?: string
  completedAt?: string
  isPublic?: boolean
  viewers?: number
}

export interface DuelCardProps {
  duel: DuelData
  currentUserId: string
  variant?: 'default' | 'compact' | 'detailed' | 'live'
  showActions?: boolean
  onAccept?: (duelId: string) => void
  onReject?: (duelId: string) => void
  onComplete?: (duelId: string) => void
  onView?: (duelId: string) => void
  onShare?: (duelId: string) => void
  className?: string
}

// ====================================
// STATUS CONFIGURATION
// ====================================
const statusConfig = {
  pending: {
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    icon: Clock,
    label: 'In attesa',
  },
  accepted: {
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    icon: CheckCircle,
    label: 'Accettato',
  },
  active: {
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    icon: Flame,
    label: 'In corso',
  },
  completed: {
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    icon: Trophy,
    label: 'Completato',
  },
  cancelled: {
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
    icon: XCircle,
    label: 'Annullato',
  },
  expired: {
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    icon: AlertCircle,
    label: 'Scaduto',
  },
}

// Type for status config
type StatusConfig = typeof statusConfig[keyof typeof statusConfig]

// ====================================
// DUEL CARD COMPONENT
// ====================================
export function DuelCard({
  duel,
  currentUserId,
  variant = 'default',
  showActions = true,
  onAccept,
  onReject,
  onComplete,
  onView,
  onShare,
  className,
}: DuelCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const isCreator = duel.creatorId === currentUserId
  const isOpponent = duel.opponentId === currentUserId
  const isParticipant = isCreator || isOpponent
  const isWinner = duel.winnerId === currentUserId
  const isLoser = Boolean(duel.winnerId && isParticipant && !isWinner)
  
  const exercise = EXERCISE_DATA[duel.exerciseCode as keyof typeof EXERCISE_DATA]
  // Fix: Convert status to lowercase to match statusConfig keys
  const statusKey = duel.status.toLowerCase() as keyof typeof statusConfig
  const status = statusConfig[statusKey] || statusConfig.pending

  if (variant === 'compact') {
    return (
      <CompactDuelCard
        duel={duel}
        currentUserId={currentUserId}
        exercise={exercise}
        status={status}
        isWinner={isWinner}
        isLoser={isLoser}
        onView={onView}
        className={className}
      />
    )
  }

  if (variant === 'live') {
    return (
      <LiveDuelCard
        duel={duel}
        currentUserId={currentUserId}
        exercise={exercise}
        status={status}
        onView={onView}
        className={className}
      />
    )
  }

  if (variant === 'detailed') {
    return (
      <DetailedDuelCard
        duel={duel}
        currentUserId={currentUserId}
        exercise={exercise}
        status={status}
        isCreator={isCreator}
        isOpponent={isOpponent}
        isWinner={isWinner}
        isLoser={isLoser}
        showActions={showActions}
        onAccept={onAccept}
        onReject={onReject}
        onComplete={onComplete}
        onView={onView}
        onShare={onShare}
        className={className}
      />
    )
  }

  // Default variant
  return (
    <Card
      variant="default"
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        'hover:scale-[1.02] cursor-pointer',
        isWinner && 'ring-2 ring-green-500 ring-offset-2 ring-offset-background',
        isLoser && 'opacity-75',
        className
      )}
      onClick={() => onView?.(duel.id)}
    >
      {/* Status indicator */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50"
        style={{ color: status.color.replace('text-', '') }}
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Exercise icon */}
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              'bg-gradient-to-br from-indigo-500 to-purple-500',
              'shadow-lg shadow-indigo-500/25'
            )}>
              <span className="text-2xl">{exercise?.icon || '💪'}</span>
            </div>

            {/* Exercise and status */}
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                {exercise?.nameIt || exercise?.name || 'Exercise'}
                {duel.mode === 'live' && (
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                    LIVE
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <status.icon className={cn('w-3 h-3', status.color)} />
                <span className={cn('text-xs', status.color)}>
                  {status.label}
                </span>
                <span className="text-xs text-gray-500">
                  • {formatTimeAgo(duel.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* XP Reward */}
          <div className="text-right">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-bold text-yellow-500">
                {duel.xpReward} XP
              </span>
            </div>
            {duel.wagerCoins && (
              <div className="text-xs text-gray-500">
                🪙 {duel.wagerCoins} coins
              </div>
            )}
          </div>
        </div>

        {/* Participants */}
        <div className="flex items-center justify-between mb-3">
          <UserAvatar
            name={duel.creatorName}
            avatar={duel.creatorAvatar}
            level={duel.creatorLevel}
            score={duel.creatorScore}
            isWinner={duel.winnerId === duel.creatorId}
            isYou={isCreator}
          />

          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-gray-600" />
            <span className="text-xs text-gray-500">VS</span>
          </div>

          {duel.opponentId ? (
            <UserAvatar
              name={duel.opponentName || 'In attesa...'}
              avatar={duel.opponentAvatar}
              level={duel.opponentLevel}
              score={duel.opponentScore}
              isWinner={duel.winnerId === duel.opponentId}
              isYou={isOpponent}
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Aperto a tutti</p>
                <p className="text-xs text-gray-600">In attesa...</p>
              </div>
            </div>
          )}
        </div>

        {/* Target/Goal */}
        {duel.targetDescription && (
          <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg mb-3">
            <Target className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">
              {duel.targetDescription}
            </span>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <DuelActions
            duel={duel}
            isCreator={isCreator}
            isOpponent={isOpponent}
            onAccept={onAccept}
            onReject={onReject}
            onComplete={onComplete}
            onView={onView}
          />
        )}

        {/* Live viewers */}
        {duel.viewers && duel.viewers > 0 && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-red-400">
                {duel.viewers} watching
              </span>
            </div>
          </div>
        )}

        {/* Winner badge */}
        {isWinner && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute -top-2 -right-2"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/50">
              <Trophy className="w-6 h-6 text-white" />
            </div>
          </motion.div>
        )}
      </div>
    </Card>
  )
}

// ====================================
// USER AVATAR COMPONENT
// ====================================
function UserAvatar({
  name,
  avatar,
  level,
  score,
  isWinner,
  isYou,
}: {
  name: string
  avatar?: string
  level?: number
  score?: number
  isWinner?: boolean
  isYou?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        'relative w-10 h-10 rounded-full overflow-hidden',
        isWinner && 'ring-2 ring-green-500'
      )}>
        {avatar ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        )}
        {isYou && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-xs text-white font-bold">TU</span>
          </div>
        )}
      </div>
      
      <div>
        <p className={cn(
          'text-sm font-semibold',
          isWinner && 'text-green-400'
        )}>
          {name}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {level && <span>Lv.{level}</span>}
          {score !== undefined && (
            <span className={cn(
              'font-bold',
              isWinner && 'text-green-400'
            )}>
              {score}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ====================================
// DUEL ACTIONS COMPONENT
// ====================================
function DuelActions({
  duel,
  isCreator,
  isOpponent,
  onAccept,
  onReject,
  onComplete,
  onView,
}: {
  duel: DuelData
  isCreator: boolean
  isOpponent: boolean
  onAccept?: (duelId: string) => void
  onReject?: (duelId: string) => void
  onComplete?: (duelId: string) => void
  onView?: (duelId: string) => void
}) {
  const statusLower = duel.status.toLowerCase()
  
  // Pending - opponent can accept/reject
  if (statusLower === 'pending' && isOpponent && !duel.opponentId) {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="gradient"
          onClick={(e) => {
            e.stopPropagation()
            onAccept?.(duel.id)
          }}
          className="flex-1"
        >
          Accetta Sfida
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation()
            onReject?.(duel.id)
          }}
        >
          Rifiuta
        </Button>
      </div>
    )
  }

  // Active - participants can complete
  if ((statusLower === 'active' || statusLower === 'accepted') && (isCreator || isOpponent)) {
    return (
      <Button
        size="sm"
        variant="primary"
        onClick={(e) => {
          e.stopPropagation()
          onComplete?.(duel.id)
        }}
        className="w-full"
      >
        Completa Esercizio
      </Button>
    )
  }

  // Completed - view results
  if (statusLower === 'completed') {
    return (
      <Button
        size="sm"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation()
          onView?.(duel.id)
        }}
        className="w-full"
      >
        Vedi Risultati
      </Button>
    )
  }

  return null
}

// ====================================
// COMPACT DUEL CARD
// ====================================
function CompactDuelCard({
  duel,
  currentUserId,
  exercise,
  status,
  isWinner,
  isLoser,
  onView,
  className,
}: {
  duel: DuelData
  currentUserId: string
  exercise: any
  status: StatusConfig
  isWinner: boolean
  isLoser: boolean
  onView?: (duelId: string) => void
  className?: string
}) {
  return (
    <motion.button
      onClick={() => onView?.(duel.id)}
      className={cn(
        'w-full p-3 rounded-lg',
        'bg-gray-900/50 border border-gray-800',
        'hover:bg-gray-800/50 hover:border-gray-700',
        'transition-all duration-200',
        'flex items-center gap-3',
        isWinner && 'border-green-500/50 bg-green-900/10',
        isLoser && 'opacity-75',
        className
      )}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Exercise icon */}
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
        <span className="text-xl">{exercise?.icon || '💪'}</span>
      </div>

      {/* Info */}
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{exercise?.nameIt || exercise?.name || 'Exercise'}</span>
          <status.icon className={cn('w-3 h-3', status.color)} />
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{duel.opponentName || 'Sfida aperta'}</span>
          <span>•</span>
          <span>{formatTimeAgo(duel.createdAt)}</span>
        </div>
      </div>

      {/* Result or XP */}
      {duel.status.toLowerCase() === 'completed' ? (
        <div className="text-right">
          {isWinner ? (
            <div className="text-green-400">
              <Trophy className="w-4 h-4" />
              <span className="text-xs">Vittoria</span>
            </div>
          ) : isLoser ? (
            <div className="text-red-400">
              <XCircle className="w-4 h-4" />
              <span className="text-xs">Sconfitta</span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-yellow-500" />
          <span className="text-xs font-bold text-yellow-500">
            {duel.xpReward}
          </span>
        </div>
      )}

      <ChevronRight className="w-4 h-4 text-gray-600" />
    </motion.button>
  )
}

// ====================================
// LIVE DUEL CARD
// ====================================
function LiveDuelCard({
  duel,
  currentUserId,
  exercise,
  status,
  onView,
  className,
}: {
  duel: DuelData
  currentUserId: string
  exercise: any
  status: StatusConfig
  onView?: (duelId: string) => void
  className?: string
}) {
  return (
    <Card
      variant="gradient"
      className={cn('relative overflow-hidden', className)}
    >
      {/* Live indicator */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />
      
      <div className="p-6">
        {/* Live badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 font-bold text-sm">LIVE NOW</span>
          </div>
          {duel.viewers && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Users className="w-3 h-3" />
              {formatNumber(duel.viewers)} watching
            </div>
          )}
        </div>

        {/* Exercise */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/50">
            <span className="text-3xl">{exercise?.icon || '💪'}</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">
              {exercise?.nameIt || exercise?.name || 'Exercise'}
            </h3>
            <p className="text-gray-400">Duello Live</p>
          </div>
        </div>

        {/* Participants with live scores */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-900/50 rounded-xl">
            <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
            <p className="font-semibold text-sm">{duel.creatorName}</p>
            <p className="text-2xl font-bold text-white">
              {duel.creatorScore || 0}
            </p>
          </div>
          
          <div className="text-center p-3 bg-gray-900/50 rounded-xl">
            <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
            <p className="font-semibold text-sm">{duel.opponentName || 'Waiting...'}</p>
            <p className="text-2xl font-bold text-white">
              {duel.opponentScore || 0}
            </p>
          </div>
        </div>

        {/* Watch button */}
        <Button
          variant="gradient"
          size="lg"
          onClick={() => onView?.(duel.id)}
          className="w-full"
        >
          <Flame className="w-5 h-5 mr-2" />
          Guarda Live
        </Button>
      </div>
    </Card>
  )
}

// ====================================
// DETAILED DUEL CARD
// ====================================
function DetailedDuelCard({
  duel,
  currentUserId,
  exercise,
  status,
  isCreator,
  isOpponent,
  isWinner,
  isLoser,
  showActions,
  onAccept,
  onReject,
  onComplete,
  onView,
  onShare,
  className,
}: {
  duel: DuelData
  currentUserId: string
  exercise: any
  status: StatusConfig
  isCreator: boolean
  isOpponent: boolean
  isWinner: boolean
  isLoser: boolean
  showActions: boolean
  onAccept?: (duelId: string) => void
  onReject?: (duelId: string) => void
  onComplete?: (duelId: string) => void
  onView?: (duelId: string) => void
  onShare?: (duelId: string) => void
  className?: string
}) {
  return (
    <Card
      variant="default"
      className={cn(
        'overflow-hidden',
        isWinner && 'ring-2 ring-green-500 ring-offset-2 ring-offset-background',
        className
      )}
    >
      {/* Header with gradient */}
      <div className="relative h-32 bg-gradient-to-br from-indigo-600 to-purple-600 p-6">
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Status badge */}
        <div className={cn(
          'absolute top-4 right-4 px-3 py-1 rounded-full',
          'flex items-center gap-2',
          status.bgColor,
          status.borderColor,
          'border'
        )}>
          <status.icon className={cn('w-4 h-4', status.color)} />
          <span className={cn('text-sm font-semibold', status.color)}>
            {status.label}
          </span>
        </div>

        {/* Exercise info */}
        <div className="relative flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-4xl">{exercise?.icon || '💪'}</span>
          </div>
          <div className="text-white">
            <h2 className="text-2xl font-bold">{exercise?.nameIt || exercise?.name || 'Exercise'}</h2>
            <p className="text-white/80">
              {duel.challengeType === '1v1' ? 'Duello 1v1' :
               duel.challengeType === 'open' ? 'Sfida Aperta' :
               duel.challengeType === 'tournament' ? 'Torneo' : 'Missione'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Participants detailed */}
        <div className="space-y-4">
          <ParticipantDetail
            name={duel.creatorName}
            avatar={duel.creatorAvatar}
            level={duel.creatorLevel}
            xp={duel.creatorXP}
            score={duel.creatorScore}
            isWinner={duel.winnerId === duel.creatorId}
            isYou={isCreator}
            label="Sfidante"
          />
          
          {duel.opponentId ? (
            <ParticipantDetail
              name={duel.opponentName!}
              avatar={duel.opponentAvatar}
              level={duel.opponentLevel!}
              xp={duel.opponentXP!}
              score={duel.opponentScore}
              isWinner={duel.winnerId === duel.opponentId}
              isYou={isOpponent}
              label="Avversario"
            />
          ) : (
            <div className="p-4 border-2 border-dashed border-gray-700 rounded-xl text-center">
              <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500">In attesa di un avversario</p>
            </div>
          )}
        </div>

        {/* Duel details */}
        <div className="grid grid-cols-2 gap-4">
          <DetailItem
            icon={Target}
            label="Obiettivo"
            value={duel.targetDescription || 'Massimo punteggio'}
          />
          <DetailItem
            icon={Zap}
            label="Premio XP"
            value={`${duel.xpReward} XP`}
            highlight
          />
          <DetailItem
            icon={Calendar}
            label="Creato"
            value={formatTimeAgo(duel.createdAt)}
          />
          <DetailItem
            icon={Timer}
            label="Scadenza"
            value={duel.expiresAt ? formatTimeAgo(duel.expiresAt) : 'Mai'}
          />
        </div>

        {/* Actions */}
        {showActions && (
          <DuelActions
            duel={duel}
            isCreator={isCreator}
            isOpponent={isOpponent}
            onAccept={onAccept}
            onReject={onReject}
            onComplete={onComplete}
            onView={onView}
          />
        )}
      </div>
    </Card>
  )
}

// ====================================
// PARTICIPANT DETAIL COMPONENT
// ====================================
function ParticipantDetail({
  name,
  avatar,
  level,
  xp,
  score,
  isWinner,
  isYou,
  label,
}: {
  name: string
  avatar?: string
  level: number
  xp: number
  score?: number
  isWinner?: boolean
  isYou?: boolean
  label: string
}) {
  return (
    <div className={cn(
      'p-4 rounded-xl border',
      isWinner ? 'border-green-500 bg-green-500/10' : 'border-gray-800 bg-gray-900/50'
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              {avatar ? (
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            {isWinner && (
              <Crown className="w-5 h-5 text-yellow-500 absolute -top-2 -right-2" />
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold">{name}</p>
              {isYou && (
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded-full">
                  TU
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>Lv.{level}</span>
              <span>{formatNumber(xp)} XP</span>
            </div>
          </div>
        </div>

        {score !== undefined && (
          <div className="text-right">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={cn(
              'text-2xl font-bold',
              isWinner && 'text-green-400'
            )}>
              {score}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ====================================
// DETAIL ITEM COMPONENT
// ====================================
function DetailItem({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: any
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center',
        highlight ? 'bg-yellow-500/20' : 'bg-gray-800'
      )}>
        <Icon className={cn(
          'w-5 h-5',
          highlight ? 'text-yellow-500' : 'text-gray-400'
        )} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={cn(
          'font-semibold',
          highlight && 'text-yellow-500'
        )}>
          {value}
        </p>
      </div>
    </div>
  )
}

// ====================================
// EXPORTS
// ====================================
export default DuelCard