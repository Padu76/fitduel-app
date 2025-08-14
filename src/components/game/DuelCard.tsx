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
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

// ====================================
// TYPES & INTERFACES - UPDATED TO MATCH DATABASE
// ====================================
export interface DuelData {
  id: string
  // Participants - USING CORRECT COLUMN NAMES
  challenger_id: string
  challengerName?: string
  challengerAvatar?: string
  challengerLevel?: number
  challengerXP?: number
  challenged_id?: string // CORRECT: challenged_id, not opponentId
  challengedName?: string // CORRECT: challenged, not opponent
  challengedAvatar?: string
  challengedLevel?: number
  challengedXP?: number
  // Exercise
  exercise_id: string // CORRECT: exercise_id from exercises table
  exerciseName?: string
  exerciseCode?: string
  exerciseIcon?: string
  // Duel details
  type: '1v1' | 'open' | 'tournament' | 'mission' // CORRECT: type enum
  status: 'pending' | 'open' | 'active' | 'completed' | 'expired' | 'cancelled' // CORRECT: status enum
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme' // CORRECT: difficulty enum
  // Scores
  challenger_score?: number
  challenged_score?: number // CORRECT: challenged_score
  winner_id?: string
  // Rewards & Wagers
  xp_reward: number
  wager_coins?: number // CORRECT: coins, not XP
  // Timestamps
  created_at: string
  expires_at?: string
  completed_at?: string
  // Metadata
  metadata?: {
    targetReps?: number
    targetTime?: number
    rules?: any
  }
  // UI specific (not from DB)
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
  open: {
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    icon: Users,
    label: 'Aperta',
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
  
  const isChallenger = duel.challenger_id === currentUserId
  const isChallenged = duel.challenged_id === currentUserId
  const isParticipant = isChallenger || isChallenged
  const isWinner = duel.winner_id === currentUserId
  const isLoser = Boolean(duel.winner_id && isParticipant && !isWinner)
  
  const status = statusConfig[duel.status] || statusConfig.pending

  // Get target description from metadata
  const targetDescription = duel.metadata?.targetReps 
    ? `${duel.metadata.targetReps} ripetizioni`
    : duel.metadata?.targetTime
    ? `${duel.metadata.targetTime} secondi`
    : 'Massimo punteggio'

  if (variant === 'compact') {
    return (
      <CompactDuelCard
        duel={duel}
        currentUserId={currentUserId}
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
        status={status}
        isChallenger={isChallenger}
        isChallenged={isChallenged}
        isWinner={isWinner}
        isLoser={isLoser}
        showActions={showActions}
        targetDescription={targetDescription}
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
              <span className="text-2xl">{duel.exerciseIcon || '💪'}</span>
            </div>

            {/* Exercise and status */}
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                {duel.exerciseName || 'Esercizio'}
                {duel.type === 'open' && (
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                    APERTA
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <status.icon className={cn('w-3 h-3', status.color)} />
                <span className={cn('text-xs', status.color)}>
                  {status.label}
                </span>
                <span className="text-xs text-gray-500">
                  • {formatTimeAgo(duel.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* XP Reward */}
          <div className="text-right">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-bold text-yellow-500">
                {duel.xp_reward} XP
              </span>
            </div>
            {duel.wager_coins && (
              <div className="text-xs text-gray-500">
                🪙 {duel.wager_coins} coins
              </div>
            )}
          </div>
        </div>

        {/* Participants */}
        <div className="flex items-center justify-between mb-3">
          <UserAvatar
            name={duel.challengerName || 'Sfidante'}
            avatar={duel.challengerAvatar}
            level={duel.challengerLevel}
            score={duel.challenger_score}
            isWinner={duel.winner_id === duel.challenger_id}
            isYou={isChallenger}
          />

          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-gray-600" />
            <span className="text-xs text-gray-500">VS</span>
          </div>

          {duel.challenged_id ? (
            <UserAvatar
              name={duel.challengedName || 'Avversario'}
              avatar={duel.challengedAvatar}
              level={duel.challengedLevel}
              score={duel.challenged_score}
              isWinner={duel.winner_id === duel.challenged_id}
              isYou={isChallenged}
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
        {targetDescription && targetDescription !== 'Massimo punteggio' && (
          <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg mb-3">
            <Target className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">
              {targetDescription}
            </span>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <DuelActions
            duel={duel}
            isChallenger={isChallenger}
            isChallenged={isChallenged}
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
  isChallenger,
  isChallenged,
  onAccept,
  onReject,
  onComplete,
  onView,
}: {
  duel: DuelData
  isChallenger: boolean
  isChallenged: boolean
  onAccept?: (duelId: string) => void
  onReject?: (duelId: string) => void
  onComplete?: (duelId: string) => void
  onView?: (duelId: string) => void
}) {
  // Open duel - anyone can accept
  if (duel.status === 'open' && !isChallenger) {
    return (
      <Button
        size="sm"
        variant="gradient"
        onClick={(e) => {
          e.stopPropagation()
          onAccept?.(duel.id)
        }}
        className="w-full"
      >
        Accetta Sfida
      </Button>
    )
  }

  // Pending - challenged user can accept/reject
  if (duel.status === 'pending' && isChallenged) {
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
          Accetta
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
  if (duel.status === 'active' && (isChallenger || isChallenged)) {
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
  if (duel.status === 'completed') {
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
  status,
  isWinner,
  isLoser,
  onView,
  className,
}: {
  duel: DuelData
  currentUserId: string
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
        <span className="text-xl">{duel.exerciseIcon || '💪'}</span>
      </div>

      {/* Info */}
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{duel.exerciseName || 'Esercizio'}</span>
          <status.icon className={cn('w-3 h-3', status.color)} />
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{duel.challengedName || 'Sfida aperta'}</span>
          <span>•</span>
          <span>{formatTimeAgo(duel.created_at)}</span>
        </div>
      </div>

      {/* Result or XP */}
      {duel.status === 'completed' ? (
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
            {duel.xp_reward}
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
  status,
  onView,
  className,
}: {
  duel: DuelData
  currentUserId: string
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
            <span className="text-3xl">{duel.exerciseIcon || '💪'}</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">
              {duel.exerciseName || 'Esercizio'}
            </h3>
            <p className="text-gray-400">Duello Live</p>
          </div>
        </div>

        {/* Participants with live scores */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-900/50 rounded-xl">
            <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
            <p className="font-semibold text-sm">{duel.challengerName || 'Sfidante'}</p>
            <p className="text-2xl font-bold text-white">
              {duel.challenger_score || 0}
            </p>
          </div>
          
          <div className="text-center p-3 bg-gray-900/50 rounded-xl">
            <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
            <p className="font-semibold text-sm">{duel.challengedName || 'In attesa...'}</p>
            <p className="text-2xl font-bold text-white">
              {duel.challenged_score || 0}
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
  status,
  isChallenger,
  isChallenged,
  isWinner,
  isLoser,
  showActions,
  targetDescription,
  onAccept,
  onReject,
  onComplete,
  onView,
  onShare,
  className,
}: {
  duel: DuelData
  currentUserId: string
  status: StatusConfig
  isChallenger: boolean
  isChallenged: boolean
  isWinner: boolean
  isLoser: boolean
  showActions: boolean
  targetDescription: string
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
            <span className="text-4xl">{duel.exerciseIcon || '💪'}</span>
          </div>
          <div className="text-white">
            <h2 className="text-2xl font-bold">{duel.exerciseName || 'Esercizio'}</h2>
            <p className="text-white/80">
              {duel.type === '1v1' ? 'Duello 1v1' :
               duel.type === 'open' ? 'Sfida Aperta' :
               duel.type === 'tournament' ? 'Torneo' : 'Missione'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Participants detailed */}
        <div className="space-y-4">
          <ParticipantDetail
            name={duel.challengerName || 'Sfidante'}
            avatar={duel.challengerAvatar}
            level={duel.challengerLevel || 1}
            xp={duel.challengerXP || 0}
            score={duel.challenger_score}
            isWinner={duel.winner_id === duel.challenger_id}
            isYou={isChallenger}
            label="Sfidante"
          />
          
          {duel.challenged_id ? (
            <ParticipantDetail
              name={duel.challengedName || 'Avversario'}
              avatar={duel.challengedAvatar}
              level={duel.challengedLevel || 1}
              xp={duel.challengedXP || 0}
              score={duel.challenged_score}
              isWinner={duel.winner_id === duel.challenged_id}
              isYou={isChallenged}
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
            value={targetDescription}
          />
          <DetailItem
            icon={Zap}
            label="Premio XP"
            value={`${duel.xp_reward} XP`}
            highlight
          />
          <DetailItem
            icon={Calendar}
            label="Creato"
            value={formatTimeAgo(duel.created_at)}
          />
          <DetailItem
            icon={Timer}
            label="Scadenza"
            value={duel.expires_at ? formatTimeAgo(duel.expires_at) : 'Mai'}
          />
        </div>

        {/* Actions */}
        {showActions && (
          <DuelActions
            duel={duel}
            isChallenger={isChallenger}
            isChallenged={isChallenged}
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