import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

// ====================================
// TYPES & VALIDATION
// ====================================
const claimMissionSchema = z.object({
  missionId: z.string().min(1, 'Mission ID richiesto'),
  userId: z.string().min(1, 'User ID richiesto').optional() // Optional for auth validation
})

type ClaimMissionRequest = z.infer<typeof claimMissionSchema>

interface ClaimMissionResponse {
  success: boolean
  message: string
  data?: {
    reward: {
      xp: number
      coins: number
      badges: string[]
      streak_bonus: number
      total_xp: number
      total_coins: number
    }
    mission: {
      id: string
      title: string
      completed_at: string
    }
    user_stats: {
      new_xp: number
      new_coins: number
      new_level?: number
      level_up?: boolean
    }
  }
  error?: string
}

// ====================================
// SUPABASE CLIENT
// ====================================
function getSupabaseClient() {
  const cookieStore = cookies()
  return createRouteHandlerClient({ cookies: () => cookieStore })
}

// ====================================
// MISSION CLAIM HANDLER
// ====================================
async function handleMissionClaim(
  supabase: any,
  data: ClaimMissionRequest,
  userId: string
): Promise<ClaimMissionResponse> {
  try {
    // Step 1: Get mission details
    const { data: missions, error: missionError } = await supabase
      .from('daily_missions')
      .select(`
        id,
        code,
        name,
        description,
        xp_reward,
        coins_reward,
        target_value
      `)
      .eq('id', data.missionId)
      .single()

    if (missionError || !missions) {
      return {
        success: false,
        message: 'Missione non trovata',
        error: 'MISSION_NOT_FOUND'
      }
    }

    // Step 2: Check user mission progress
    const { data: userMission, error: progressError } = await supabase
      .from('user_missions')
      .select('*')
      .eq('user_id', userId)
      .eq('mission_id', data.missionId)
      .single()

    if (progressError || !userMission) {
      return {
        success: false,
        message: 'Progresso missione non trovato',
        error: 'MISSION_PROGRESS_NOT_FOUND'
      }
    }

    // Step 3: Check if mission is completed but not yet claimed
    if (!userMission.is_completed) {
      return {
        success: false,
        message: 'Missione non ancora completata',
        error: 'MISSION_NOT_COMPLETED'
      }
    }

    if (userMission.claimed_at) {
      return {
        success: false,
        message: 'Ricompensa già riscattata',
        error: 'REWARD_ALREADY_CLAIMED'
      }
    }

    // Step 4: Get current user stats
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('xp, coins, level')
      .eq('id', userId)
      .single()

    if (profileError || !currentProfile) {
      return {
        success: false,
        message: 'Profilo utente non trovato',
        error: 'USER_PROFILE_NOT_FOUND'
      }
    }

    // Step 5: Calculate rewards
    const baseXP = missions.xp_reward || 50
    const baseCoins = missions.coins_reward || 10
    const streakBonus = calculateStreakBonus(userMission.progress, missions.code)
    const totalXP = baseXP + streakBonus
    const totalCoins = baseCoins

    // Check for level up
    const currentXP = currentProfile.xp || 0
    const newXP = currentXP + totalXP
    const currentLevel = currentProfile.level || 1
    const newLevel = calculateLevel(newXP)
    const levelUp = newLevel > currentLevel

    // Step 6: Update user_missions (mark as claimed)
    const claimedAt = new Date().toISOString()
    const { error: claimError } = await supabase
      .from('user_missions')
      .update({
        claimed_at: claimedAt
      })
      .eq('user_id', userId)
      .eq('mission_id', data.missionId)

    if (claimError) {
      console.error('Error updating mission claim:', claimError)
      return {
        success: false,
        message: 'Errore nel riscattare la ricompensa',
        error: 'CLAIM_UPDATE_ERROR'
      }
    }

    // Step 7: Update user profile with rewards
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        xp: newXP,
        coins: (currentProfile.coins || 0) + totalCoins,
        level: newLevel,
        updated_at: claimedAt
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user profile:', updateError)
      // Rollback mission claim
      await supabase
        .from('user_missions')
        .update({ claimed_at: null })
        .eq('user_id', userId)
        .eq('mission_id', data.missionId)

      return {
        success: false,
        message: 'Errore nell\'aggiornare il profilo',
        error: 'PROFILE_UPDATE_ERROR'
      }
    }

    // Step 8: Log XP transaction
    await supabase
      .from('xp_transactions')
      .insert({
        user_id: userId,
        amount: totalXP,
        type: 'mission_reward',
        description: `Missione completata: ${missions.name}`,
        metadata: {
          mission_id: data.missionId,
          base_xp: baseXP,
          streak_bonus: streakBonus
        },
        created_at: claimedAt
      })

    // Step 9: Create activity log
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        event_type: 'mission_completed',
        event_data: {
          mission_id: data.missionId,
          mission_name: missions.name,
          rewards: {
            xp: totalXP,
            coins: totalCoins,
            level_up: levelUp
          }
        },
        xp_change: totalXP,
        coins_change: totalCoins,
        created_at: claimedAt
      })

    // Step 10: Handle level up notification
    if (levelUp) {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'level_up',
          title: `Level Up! 🎉`,
          message: `Congratulazioni! Hai raggiunto il livello ${newLevel}!`,
          data: {
            old_level: currentLevel,
            new_level: newLevel,
            bonus_xp: (newLevel - currentLevel) * 50 // Level up bonus
          },
          created_at: claimedAt
        })
    }

    return {
      success: true,
      message: levelUp 
        ? `Missione completata e livello ${newLevel} raggiunto! 🎉`
        : 'Ricompensa riscattata con successo! 🎉',
      data: {
        reward: {
          xp: baseXP,
          coins: baseCoins,
          badges: getBadgesForMission(missions.code),
          streak_bonus: streakBonus,
          total_xp: totalXP,
          total_coins: totalCoins
        },
        mission: {
          id: missions.id,
          title: missions.name,
          completed_at: claimedAt
        },
        user_stats: {
          new_xp: newXP,
          new_coins: (currentProfile.coins || 0) + totalCoins,
          new_level: newLevel,
          level_up: levelUp
        }
      }
    }

  } catch (error) {
    console.error('Unexpected mission claim error:', error)
    return {
      success: false,
      message: 'Si è verificato un errore inaspettato',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    }
  }
}

// ====================================
// TEST MODE HANDLER
// ====================================
async function handleTestModeClaim(data: ClaimMissionRequest): Promise<ClaimMissionResponse> {
  // Simulate mission claim for demo mode
  const mockReward = {
    xp: 50,
    coins: 15,
    badges: ['🔥'],
    streak_bonus: 25,
    total_xp: 75,
    total_coins: 15
  }

  return {
    success: true,
    message: 'Ricompensa riscattata con successo! 🎉',
    data: {
      reward: mockReward,
      mission: {
        id: data.missionId,
        title: 'Dedizione',
        completed_at: new Date().toISOString()
      },
      user_stats: {
        new_xp: 1250,
        new_coins: 335,
        new_level: 12,
        level_up: false
      }
    }
  }
}

// ====================================
// HELPER FUNCTIONS
// ====================================
function calculateStreakBonus(progress: number, missionCode: string): number {
  // Streak missions get bonus based on consecutive completions
  if (missionCode.includes('streak') || missionCode === 'daily_streak_1') {
    return Math.min(progress * 5, 50) // Max 50 XP bonus
  }
  return 0
}

function calculateLevel(xp: number): number {
  // Level calculation based on XP
  if (xp < 100) return 1
  if (xp < 300) return 2
  if (xp < 600) return 3
  if (xp < 1000) return 4
  if (xp < 1500) return 5
  if (xp < 2100) return 6
  if (xp < 2800) return 7
  if (xp < 3600) return 8
  if (xp < 4500) return 9
  if (xp < 5500) return 10
  if (xp < 6600) return 11
  if (xp < 7800) return 12
  
  // For higher levels: every 1500 XP = 1 level
  return Math.floor((xp - 7800) / 1500) + 12
}

function getBadgesForMission(missionCode: string): string[] {
  const badges: string[] = []
  
  if (missionCode.includes('streak')) badges.push('🔥')
  if (missionCode.includes('duels')) badges.push('⚔️')
  if (missionCode.includes('exercise')) badges.push('💪')
  if (missionCode.includes('social')) badges.push('👥')
  if (missionCode.includes('time')) badges.push('⏱️')
  
  return badges
}

// ====================================
// MAIN POST HANDLER
// ====================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = claimMissionSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return NextResponse.json({
        success: false,
        message: firstError.message,
        error: 'VALIDATION_ERROR'
      }, { status: 400 })
    }

    const data = validation.data

    // Get Supabase client
    const supabase = getSupabaseClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      // Check for demo mode fallback
      const userInfo = request.cookies.get('fitduel_user')?.value
      if (!userInfo) {
        console.log('🎯 Processing mission claim (test mode)')
        const result = await handleTestModeClaim(data)
        return NextResponse.json(result, { 
          status: result.success ? 200 : 400 
        })
      }
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Devi essere autenticato per riscattare ricompense',
        error: 'UNAUTHORIZED'
      }, { status: 401 })
    }

    // Ensure userId matches authenticated user (if provided)
    if (data.userId && data.userId !== user.id) {
      return NextResponse.json({
        success: false,
        message: 'Non puoi riscattare ricompense per altri utenti',
        error: 'FORBIDDEN'
      }, { status: 403 })
    }

    console.log('🎯 Processing mission claim (Supabase mode)')
    const result = await handleMissionClaim(supabase, data, user.id)

    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    })

  } catch (error) {
    console.error('Mission claim error:', error)
    return NextResponse.json({
      success: false,
      message: 'Errore del server',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 })
  }
}

// ====================================
// GET HANDLER (Optional - for checking claim status)
// ====================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const missionId = searchParams.get('missionId')
    const userId = searchParams.get('userId')

    if (!missionId) {
      return NextResponse.json({
        success: false,
        message: 'Mission ID richiesto',
        error: 'MISSING_MISSION_ID'
      }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        message: 'Devi essere autenticato',
        error: 'UNAUTHORIZED'
      }, { status: 401 })
    }

    // Get mission claim status
    const { data: userMission, error } = await supabase
      .from('user_missions')
      .select('is_completed, claimed_at, progress')
      .eq('user_id', user.id)
      .eq('mission_id', missionId)
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Missione non trovata',
        error: 'MISSION_NOT_FOUND'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Status recuperato con successo',
      data: {
        can_claim: userMission.is_completed && !userMission.claimed_at,
        is_completed: userMission.is_completed,
        is_claimed: !!userMission.claimed_at,
        progress: userMission.progress,
        claimed_at: userMission.claimed_at
      }
    })

  } catch (error) {
    console.error('Mission status check error:', error)
    return NextResponse.json({
      success: false,
      message: 'Errore del server',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 })
  }
}