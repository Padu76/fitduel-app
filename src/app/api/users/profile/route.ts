import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

// ====================================
// VALIDATION SCHEMAS
// ====================================
const updateProfileSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  display_name: z.string().min(1).max(50).optional(),
  avatar_url: z.string().url().optional(),
  bio: z.string().max(500).optional()
})

// ====================================
// GET USER PROFILE
// ====================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const username = searchParams.get('username')

    const supabase = createRouteHandlerClient({ cookies })

    // Build query
    let query = supabase
      .from('profiles')
      .select(`
        *,
        user_stats (
          total_wins,
          total_losses,
          current_win_streak,
          max_win_streak,
          total_duels_completed,
          weekly_xp,
          monthly_xp,
          favorite_exercise,
          best_form_score
        ),
        achievements:user_achievements (
          achievement_id,
          unlocked_at
        ),
        badges:user_badges (
          id,
          badge_id,
          earned_at
        )
      `)

    // Apply filters
    if (userId) {
      query = query.eq('id', userId)
    } else if (username) {
      query = query.eq('username', username)
    } else {
      // Get current user's profile
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return NextResponse.json({
          success: false,
          message: 'Non autenticato',
          error: 'UNAUTHORIZED'
        }, { status: 401 })
      }

      query = query.eq('id', user.id)
    }

    const { data: profile, error } = await query.single()

    if (error || !profile) {
      return NextResponse.json({
        success: false,
        message: 'Profilo non trovato',
        error: 'PROFILE_NOT_FOUND'
      }, { status: 404 })
    }

    // Calculate additional stats
    const stats = profile.user_stats?.[0] || {}
    const totalDuels = (stats.total_wins || 0) + (stats.total_losses || 0)
    const winRate = totalDuels > 0 
      ? Math.round((stats.total_wins / totalDuels) * 100) 
      : 0

    // Get recent duels
    const { data: recentDuels } = await supabase
      .from('duels')
      .select(`
        id,
        type,
        status,
        difficulty,
        xp_reward,
        created_at,
        completed_at,
        winner_id,
        exercise:exercises!exercise_id(name, icon)
      `)
      .or(`challenger_id.eq.${profile.id},challenged_id.eq.${profile.id}`)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get rank position
    const { data: rankData } = await supabase
      .rpc('get_user_rank', { user_id: profile.id })

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: profile.id,
          username: profile.username,
          displayName: profile.display_name,
          email: profile.email,
          avatarUrl: profile.avatar_url,
          level: profile.level || 1,
          xp: profile.xp || 0,
          coins: profile.coins || 0,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at
        },
        stats: {
          totalWins: stats.total_wins || 0,
          totalLosses: stats.total_losses || 0,
          totalDuels: totalDuels,
          winRate: winRate,
          currentStreak: stats.current_win_streak || 0,
          maxStreak: stats.max_win_streak || 0,
          weeklyXP: stats.weekly_xp || 0,
          monthlyXP: stats.monthly_xp || 0,
          favoriteExercise: stats.favorite_exercise,
          bestFormScore: stats.best_form_score || 0,
          globalRank: rankData?.rank || null
        },
        achievements: profile.achievements || [],
        badges: profile.badges || [],
        recentDuels: recentDuels || []
      }
    })

  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({
      success: false,
      message: 'Errore del server',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 })
  }
}

// ====================================
// UPDATE USER PROFILE
// ====================================
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = updateProfileSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return NextResponse.json({
        success: false,
        message: firstError.message,
        error: 'VALIDATION_ERROR'
      }, { status: 400 })
    }

    const updates = validation.data

    // Get authenticated user
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        message: 'Non autenticato',
        error: 'UNAUTHORIZED'
      }, { status: 401 })
    }

    // Check if username is already taken
    if (updates.username) {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', updates.username)
        .neq('id', user.id)
        .single()

      if (existingUser) {
        return NextResponse.json({
          success: false,
          message: 'Username già in uso',
          error: 'USERNAME_TAKEN'
        }, { status: 400 })
      }
    }

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError || !updatedProfile) {
      console.error('Profile update error:', updateError)
      return NextResponse.json({
        success: false,
        message: 'Errore nell\'aggiornamento del profilo',
        error: 'UPDATE_FAILED'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Profilo aggiornato con successo',
      data: {
        profile: updatedProfile
      }
    })

  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({
      success: false,
      message: 'Errore del server',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 })
  }
}

// ====================================
// DELETE USER PROFILE (Soft delete)
// ====================================
export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        message: 'Non autenticato',
        error: 'UNAUTHORIZED'
      }, { status: 401 })
    }

    // Soft delete - just mark as deleted
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile delete error:', updateError)
      return NextResponse.json({
        success: false,
        message: 'Errore nella cancellazione del profilo',
        error: 'DELETE_FAILED'
      }, { status: 500 })
    }

    // Sign out user
    await supabase.auth.signOut()

    return NextResponse.json({
      success: true,
      message: 'Profilo cancellato con successo'
    })

  } catch (error) {
    console.error('Delete profile error:', error)
    return NextResponse.json({
      success: false,
      message: 'Errore del server',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 })
  }
}