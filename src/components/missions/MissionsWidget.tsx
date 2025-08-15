import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Target, ChevronRight, CheckCircle, Loader2,
  Flame, Swords, Dumbbell, Info, AlertCircle
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { useUserStore } from '@/stores/useUserStore'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Mission {
  id: string
  title: string
  description: string
  icon: string
  type: 'daily' | 'weekly' | 'achievement'
  xpReward: number
  coinReward?: number
  progress: number
  target: number
  isCompleted: boolean
  isClaimed: boolean
}

export function MissionsWidget() {
  const supabase = createClientComponentClient()
  const { user, stats, addXP, addCoins } = useUserStore()
  const [missions, setMissions] = useState<Mission[]>([])
  const [claiming, setClaiming] = useState<string | null>(null)
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null)
  const [claimedMissions, setClaimedMissions] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMissions()
    loadClaimedMissions()
  }, [user, stats])

  // Load claimed missions from localStorage to prevent duplicate claims
  const loadClaimedMissions = () => {
    const saved = localStorage.getItem('fitduel_claimed_missions')
    if (saved) {
      try {
        const claimedData = JSON.parse(saved)
        // Check if data is from today
        const today = new Date().toDateString()
        if (claimedData.date === today) {
          setClaimedMissions(new Set(claimedData.missions))
        } else {
          // Reset if it's a new day
          localStorage.removeItem('fitduel_claimed_missions')
        }
      } catch (e) {
        console.error('Error loading claimed missions:', e)
      }
    }
  }

  // Save claimed missions to localStorage
  const saveClaimedMissions = (missionId: string) => {
    const newClaimed = new Set(claimedMissions)
    newClaimed.add(missionId)
    setClaimedMissions(newClaimed)
    
    const dataToSave = {
      date: new Date().toDateString(),
      missions: Array.from(newClaimed)
    }
    localStorage.setItem('fitduel_claimed_missions', JSON.stringify(dataToSave))
  }

  const loadMissions = async () => {
    // Get user's current streak from stats store
    const userStreak = stats?.currentStreak || 0
    
    const mockMissions: Mission[] = [
      {
        id: 'm1',
        title: 'Guerriero',
        description: 'Vinci 3 duelli',
        icon: '⚔️',
        type: 'daily',
        xpReward: 100,
        progress: 2,
        target: 3,
        isCompleted: false,
        isClaimed: false
      },
      {
        id: 'm2',
        title: 'Streak',
        description: 'Mantieni una streak di 3 vittorie consecutive',
        icon: '🔥',
        type: 'daily',
        xpReward: 50,
        coinReward: 25,
        progress: userStreak >= 3 ? 3 : userStreak,
        target: 3,
        isCompleted: userStreak >= 3,
        isClaimed: false
      },
      {
        id: 'm3',
        title: 'Atleta',
        description: 'Completa 5 esercizi oggi',
        icon: '💪',
        type: 'daily',
        xpReward: 75,
        progress: 1,
        target: 5,
        isCompleted: false,
        isClaimed: false
      }
    ]

    // Check if missions are already claimed
    const missionsWithClaimStatus = mockMissions.map(m => ({
      ...m,
      isClaimed: claimedMissions.has(m.id)
    }))

    // If real user, try to load from database
    if (user?.id && user.id !== 'demo') {
      try {
        const { data, error } = await supabase
          .from('user_missions')
          .select(`
            *,
            mission:missions(*)
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)

        if (data && !error && data.length > 0) {
          const realMissions = data.map(um => ({
            id: um.mission.id,
            title: um.mission.title,
            description: um.mission.description,
            icon: um.mission.icon || '🎯',
            type: um.mission.type,
            xpReward: um.mission.xp_reward,
            coinReward: um.mission.coin_reward,
            progress: um.progress || 0,
            target: um.mission.target_value,
            isCompleted: um.is_completed,
            isClaimed: um.is_claimed || claimedMissions.has(um.mission.id)
          }))
          setMissions(realMissions)
        } else {
          setMissions(missionsWithClaimStatus)
        }
      } catch (error) {
        console.error('Error loading missions:', error)
        setMissions(missionsWithClaimStatus)
      }
    } else {
      setMissions(missionsWithClaimStatus)
    }
  }

  const handleClaimReward = async (mission: Mission) => {
    // CRITICAL: Prevent claiming if already claimed
    if (mission.isClaimed || claimedMissions.has(mission.id)) {
      setError('Questa missione è già stata riscattata!')
      setTimeout(() => setError(null), 3000)
      return
    }

    // CRITICAL: Prevent claiming if not completed
    if (!mission.isCompleted) {
      setError('Devi completare la missione prima di riscattarla!')
      setTimeout(() => setError(null), 3000)
      return
    }

    // Prevent double-clicking
    if (claiming) return

    setClaiming(mission.id)
    setClaimSuccess(null)
    setError(null)

    try {
      // Validate streak mission specifically
      if (mission.id === 'm2' || mission.title === 'Streak') {
        // Check actual user streak from stats store
        const currentStreak = stats?.currentStreak || 0
        if (currentStreak < 3) {
          setError(`Streak attuale: ${currentStreak}/3. Vinci più duelli consecutivi!`)
          setClaiming(null)
          return
        }
      }

      // Save to claimed missions immediately to prevent re-claims
      saveClaimedMissions(mission.id)

      // Update mission state
      setMissions(prev => prev.map(m => 
        m.id === mission.id ? { ...m, isClaimed: true } : m
      ))

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update user stats ONLY ONCE
      if (mission.xpReward) {
        addXP(mission.xpReward)
      }
      if (mission.coinReward) {
        addCoins(mission.coinReward)
      }

      // Show success message
      setClaimSuccess(mission.id)
      setTimeout(() => setClaimSuccess(null), 3000)

      // If real user, update in database
      if (user?.id && user.id !== 'demo') {
        try {
          // Check if mission was already claimed in DB
          const { data: existingClaim } = await supabase
            .from('user_missions')
            .select('is_claimed, claimed_at')
            .eq('user_id', user.id)
            .eq('mission_id', mission.id)
            .single()

          if (existingClaim?.is_claimed) {
            console.warn('Mission already claimed in database')
            return
          }

          // Update mission claim status
          await supabase
            .from('user_missions')
            .update({ 
              is_claimed: true,
              claimed_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('mission_id', mission.id)

          // Update user profile with new XP and coins
          const { data: profile } = await supabase
            .from('profiles')
            .select('xp, coins')
            .eq('id', user.id)
            .single()

          if (profile) {
            await supabase
              .from('profiles')
              .update({
                xp: (profile.xp || 0) + mission.xpReward,
                coins: (profile.coins || 0) + (mission.coinReward || 0)
              })
              .eq('id', user.id)
          }

          // Log the claim for audit
          await supabase
            .from('mission_claims_log')
            .insert({
              user_id: user.id,
              mission_id: mission.id,
              xp_rewarded: mission.xpReward,
              coins_rewarded: mission.coinReward || 0,
              claimed_at: new Date().toISOString()
            })
        } catch (error) {
          console.error('Error updating database:', error)
        }
      }
    } catch (error) {
      console.error('Error claiming reward:', error)
      setError('Errore nel riscattare la ricompensa')
      // Remove from claimed if error
      const newClaimed = new Set(claimedMissions)
      newClaimed.delete(mission.id)
      setClaimedMissions(newClaimed)
    } finally {
      setClaiming(null)
    }
  }

  const activeMissions = missions.filter(m => !m.isClaimed)
  const completedUnclaimed = missions.filter(m => m.isCompleted && !m.isClaimed)

  return (
    <Card variant="glass" className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-white">Missioni</h3>
        </div>
        <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full">
          {activeMissions.length} attive
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-xs text-red-400">{error}</p>
        </motion.div>
      )}
      
      <div className="space-y-3">
        {missions.slice(0, 3).map((mission) => (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "p-3 rounded-lg transition-all",
              mission.isCompleted && !mission.isClaimed ? "bg-green-500/10 border border-green-500/30" :
              mission.isClaimed ? "bg-gray-800/30 opacity-60" :
              "bg-gray-800/50"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{mission.icon}</span>
                <p className="text-sm font-medium text-white">{mission.title}</p>
              </div>
              <div className="flex items-center gap-2">
                {mission.xpReward > 0 && (
                  <span className="text-xs text-yellow-500">+{mission.xpReward} XP</span>
                )}
                {mission.coinReward && mission.coinReward > 0 && (
                  <span className="text-xs text-yellow-600">+{mission.coinReward} 💰</span>
                )}
                {mission.isClaimed && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </div>
            </div>

            {/* Progress bar for incomplete missions */}
            {!mission.isCompleted && (
              <>
                <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                  <motion.div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(mission.progress / mission.target) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-xs text-gray-400">{mission.progress}/{mission.target} {mission.description}</p>
              </>
            )}

            {/* Claim button for completed but unclaimed missions */}
            {mission.isCompleted && !mission.isClaimed && !claimedMissions.has(mission.id) && (
              <Button 
                variant="gradient" 
                size="sm" 
                className="w-full"
                disabled={claiming === mission.id || claimedMissions.has(mission.id)}
                onClick={() => handleClaimReward(mission)}
              >
                {claiming === mission.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Riscattando...
                  </>
                ) : claimSuccess === mission.id ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Riscattato!
                  </>
                ) : (
                  <>
                    Riscatta +{mission.xpReward} XP
                    {mission.coinReward && ` +${mission.coinReward} 💰`}
                  </>
                )}
              </Button>
            )}

            {/* Already claimed indicator */}
            {(mission.isClaimed || claimedMissions.has(mission.id)) && (
              <p className="text-xs text-gray-500 text-center">Ricompensa già riscattata ✔</p>
            )}

            {/* Streak info */}
            {mission.title === 'Streak' && !mission.isCompleted && (
              <div className="mt-2 p-2 bg-blue-500/10 rounded flex items-start gap-2">
                <Info className="w-3 h-3 text-blue-400 mt-0.5" />
                <p className="text-xs text-blue-300">
                  Lo streak è una serie di vittorie consecutive. Vinci {mission.target} duelli di fila!
                  {stats?.currentStreak ? ` (Attuale: ${stats.currentStreak})` : ''}
                </p>
              </div>
            )}
          </motion.div>
        ))}

        {/* Success message */}
        {completedUnclaimed.length > 0 && claimSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-2 bg-green-500/10 border border-green-500/30 rounded-lg"
          >
            <p className="text-xs text-green-400 text-center">
              🎉 Ricompensa riscattata con successo!
            </p>
          </motion.div>
        )}
      </div>

      <Link href="/missions">
        <Button variant="secondary" size="sm" className="w-full mt-4">
          Tutte le Missioni
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </Link>
    </Card>
  )
}