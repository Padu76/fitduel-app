import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get recent duels for the user
    const { data: recentDuels, error: duelsError } = await supabase
      .from('duels')
      .select(`
        id,
        status,
        challenger_id,
        challenged_id,
        winner_id,
        created_at,
        wager_xp,
        reward_xp,
        challenger:profiles!challenger_id(username, display_name),
        challenged:profiles!challenged_id(username, display_name)
      `)
      .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(10)

    if (duelsError) {
      console.error('Error fetching duels:', duelsError)
      return NextResponse.json({ error: 'Failed to fetch duels' }, { status: 500 })
    }

    // Get available users to challenge (excluding current user)
    const { data: availableUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, username, display_name, level, xp, avatar_url, last_seen')
      .neq('id', userId)
      .order('last_seen', { ascending: false })
      .limit(20)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch available users' }, { status: 500 })
    }

    // Get user's friends/followers for priority display
    const { data: friends, error: friendsError } = await supabase
      .from('user_follows')
      .select(`
        followed_id,
        followed:profiles!followed_id(id, username, display_name, level, xp, avatar_url, last_seen)
      `)
      .eq('follower_id', userId)

    const friendsList = friends?.map(f => f.followed) || []

    return NextResponse.json({
      success: true,
      data: {
        recentDuels: recentDuels || [],
        availableUsers: availableUsers || [],
        friends: friendsList,
        totalAvailable: availableUsers?.length || 0
      }
    })

  } catch (error) {
    console.error('Error in duels/recent API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, targetUserId, wagerXp } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    switch (action) {
      case 'challenge':
        if (!targetUserId || !wagerXp) {
          return NextResponse.json({ 
            error: 'Target user ID and wager XP required for challenge' 
          }, { status: 400 })
        }

        // Check if user has enough XP to wager
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('xp')
          .eq('id', userId)
          .single()

        if (profileError || !userProfile) {
          return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
        }

        if (userProfile.xp < wagerXp) {
          return NextResponse.json({ 
            error: 'Insufficient XP for wager',
            currentXp: userProfile.xp,
            requiredXp: wagerXp
          }, { status: 400 })
        }

        // Check for existing pending challenge between these users
        const { data: existingChallenge } = await supabase
          .from('duels')
          .select('id')
          .or(`and(challenger_id.eq.${userId},challenged_id.eq.${targetUserId}),and(challenger_id.eq.${targetUserId},challenged_id.eq.${userId})`)
          .eq('status', 'pending')
          .single()

        if (existingChallenge) {
          return NextResponse.json({ 
            error: 'A challenge already exists between these users' 
          }, { status: 409 })
        }

        // Create new challenge
        const { data: newDuel, error: duelError } = await supabase
          .from('duels')
          .insert({
            challenger_id: userId,
            challenged_id: targetUserId,
            status: 'pending',
            wager_xp: wagerXp,
            reward_xp: wagerXp * 2, // Winner gets double
            created_at: new Date().toISOString()
          })
          .select(`
            id,
            challenger_id,
            challenged_id,
            wager_xp,
            reward_xp,
            challenger:profiles!challenger_id(username, display_name),
            challenged:profiles!challenged_id(username, display_name)
          `)
          .single()

        if (duelError) {
          console.error('Error creating duel:', duelError)
          return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 })
        }

        // Create notification for challenged user
        await supabase
          .from('notifications')
          .insert({
            user_id: targetUserId,
            type: 'duel_challenge',
            title: 'Nuova Sfida!',
            message: `${userProfile.username || 'Un utente'} ti ha sfidato per ${wagerXp} XP!`,
            data: { duel_id: newDuel.id, challenger_id: userId },
            created_at: new Date().toISOString()
          })

        return NextResponse.json({
          success: true,
          message: 'Challenge sent successfully!',
          duel: newDuel
        })

      case 'recent':
        // Just return recent duels (same as GET but with POST for compatibility)
        const { data: duels, error: recentError } = await supabase
          .from('duels')
          .select(`
            id,
            status,
            challenger_id,
            challenged_id,
            winner_id,
            created_at,
            wager_xp,
            reward_xp,
            challenger:profiles!challenger_id(username, display_name),
            challenged:profiles!challenged_id(username, display_name)
          `)
          .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
          .order('created_at', { ascending: false })
          .limit(10)

        return NextResponse.json({
          success: true,
          duels: duels || []
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in duels/recent POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}