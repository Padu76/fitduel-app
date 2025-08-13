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
// MOCK MISSION DATA FOR DEMO MODE
// ====================================
const MOCK_MISSIONS: Record<string, any> = {
  'daily_streak_1': {
    id: 'daily_streak_1',
    name: 'Dedizione',
    description: 'Mantieni lo streak giornaliero',
    xp_reward: 50,
    coins_reward: 15,
    target_value: 1
  },
  'daily_duels_3': {
    id: 'daily_duels_3',
    name: 'Guerriero Quotidiano',
    description: 'Vinci 3 duelli oggi',
    xp_reward: 100,
    coins_reward: 25,
    target_value: 3
  },
  'daily_exercise_5': {
    id: 'daily_exercise_5',
    name: 'Atleta Costante',
    description: 'Completa 5 esercizi con form score >80%',
    xp_reward: 150,
    coins_reward: 40,
    target_value: 5
  },
  'daily_friends_2': {
    id: 'daily_friends_2',
    name: 'Sociale',
    description: 'Sfida 2 amici diversi',
    xp_reward: 200,
    coins_reward: 50,
    target_value: 2
  },
  'daily_time_15': {
    id: 'daily_time_15',
    name: 'Endurance',
    description: 'Allenati per 15 minuti totali',
    xp_reward: 75,
    coins_reward: 20,
    target_value: 900
  }
}

// ====================================
// SUPABASE CLIENT
// ====================================
function getSupabaseClient() {
  try {
    const cookieStore = cookies()
    return createRouteHandlerClient({ cookies: () => cookieStore })
  } catch (error) {
    console.warn('⚠️ Supabase client creation failed, using demo mode')
    return null
  }
}

// ====================================
// CHECK IF SUPABASE IS AVAILABLE
// ====================================
async function isSupabaseAvailable(supabase: any): Promise<boolean> {
  if (!supabase) return false
  
  try {
    // Try to get auth user to test connection
    const { data: { user }, error } = await supabase.auth.getUser()
    return !error || error.message !== 'Invalid JWT'
  } catch (error) {
    console.warn('Supabase connection test failed:', error)
    return false
  }
}

// ====================================
// DEMO MODE HANDLER
// ====================================
async function handleDemoModeClaim(data: ClaimMissionRequest): Promise<ClaimMissionResponse> {
  console.log('🎯 Processing mission claim (demo mode)')
  
  const mission = MOCK_MISSIONS[data.missionId]
  
  if (!mission) {
    return {
      success: false,
      message: 'Missione non trovata nel database demo',
      error: 'MISSION_NOT_FOUND_DEMO'
    }
  }

  // Calculate rewards with demo bonuses
  const baseXP = mission.xp_reward
  const baseCoins = mission.coins_reward
  const streakBonus = data.missionId === 'daily_streak_1' ? 25 : 0
  const totalXP = baseXP + streakBonus
  const totalCoins = baseCoins

  // Mock current user stats
  const currentXP = 1175 // Demo XP
  const currentCoins = 320 // Demo coins
  const newXP = currentXP + totalXP
  const newCoins = currentCoins + totalCoins
  
  // Check for level up (demo logic)
  const currentLevel = 12
  const newLevel = calculateLevel(newXP)
  const levelUp = newLevel > currentLevel

  const claimedAt = new Date().toISOString()

  return {
    success: true,
    message: levelUp 
      ? `Missione completata e livello ${newLevel} raggiunto! 🎉`
      : 'Ricompensa riscattata con successo! 🎉',
    data: {
      reward: {
        xp: baseXP,
        coins: baseCoins,
        badges: getBadgesForMission(data.missionId),
        streak_bonus: streakBonus,
        total_xp: totalXP,
        total_coins: totalCoins
      },
      mission: {
        id: mission.id,
        title: mission.name,
        completed_at: claimedAt
      },
      user_stats: {
        new_xp: newXP,
        new_coins: newCoins,
        new_level: newLevel,
        level_up: levelUp
      }
    }
  }
}

// ====================================
// SUPABASE MODE HANDLER
// ====================================
async function handleSupabaseClaim(
  supabase: any,
  data: ClaimMissionRequest,
  userId: string
): Promise<ClaimMissionResponse> {
  try {
    console.log('🎯 Processing mission claim (Supabase mode)')
    
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
      console.log('Mission not found in database, falling back to demo mode')
      return await handleDemoModeClaim(data)
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
    console.error('Supabase mission claim error:', error)
    console.log('Falling back to demo mode due to error')
    return await handleDemoModeClaim(data)
  }
}

// ====================================
// HELPER FUNCTIONS
// ====================================
function calculateStreakBonus(progress: number, missionCode: string): number {
  // Streak missions get bonus based on consecutive completions
  if (missionCode && (missionCode.includes('streak') || missionCode === 'daily_streak_1')) {
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
  if (xp < 9300) return 13
  
  // For higher levels: every 1500 XP = 1 level
  return Math.floor((xp - 7800) / 1500) + 12
}

function getBadgesForMission(missionCodeOrId: string): string[] {
  const badges: string[] = []
  
  if (missionCodeOrId.includes('streak') || missionCodeOrId === 'daily_streak_1') {
    badges.push('🔥')
  }
  if (missionCodeOrId.includes('duels')) badges.push('⚔️')
  if (missionCodeOrId.includes('exercise')) badges.push('💪')
  if (missionCodeOrId.includes('social') || missionCodeOrId.includes('friends')) badges.push('👥')
  if (missionCodeOrId.includes('time')) badges.push('⏱️')
  
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

    // Try to get Supabase client
    const supabase = getSupabaseClient()
    
    // Check if Supabase is available and user is authenticated
    if (supabase && await isSupabaseAvailable(supabase)) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (user && !authError) {
        // Ensure userId matches authenticated user (if provided)
        if (data.userId && data.userId !== user.id) {
          return NextResponse.json({
            success: false,
            message: 'Non puoi riscattare ricompense per altri utenti',
            error: 'FORBIDDEN'
          }, { status: 403 })
        }

        // Use Supabase mode
        const result = await handleSupabaseClaim(supabase, data, user.id)
        return NextResponse.json(result, { 
          status: result.success ? 200 : 400 
        })
      }
    }

    // Fallback to demo mode
    console.log('🎯 Using demo mode for mission claim')
    const result = await handleDemoModeClaim(data)
    
    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    })

  } catch (error) {
    console.error('Mission claim error:', error)
    
    // If there's any error, try demo mode as ultimate fallback
    try {
      const body = await request.json()
      const validation = claimMissionSchema.safeParse(body)
      
      if (validation.success) {
        console.log('🎯 Using demo mode as error fallback')
        const result = await handleDemoModeClaim(validation.data)
        return NextResponse.json(result, { 
          status: result.success ? 200 : 400 
        })
      }
    } catch (fallbackError) {
      console.error('Demo mode fallback also failed:', fallbackError)
    }
    
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

    if (!missionId) {
      return NextResponse.json({
        success: false,
        message: 'Mission ID richiesto',
        error: 'MISSING_MISSION_ID'
      }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    
    // Check if Supabase is available
    if (supabase && await isSupabaseAvailable(supabase)) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (user && !authError) {
        // Get mission claim status from database
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
      }
    }
    
    // Demo mode response
    const isDemoCompleted = missionId === 'daily_streak_1'
    
    return NextResponse.json({
      success: true,
      message: 'Status recuperato con successo (demo mode)',
      data: {
        can_claim: isDemoCompleted,
        is_completed: isDemoCompleted,
        is_claimed: false,
        progress: isDemoCompleted ? 1 : 0,
        claimed_at: null
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