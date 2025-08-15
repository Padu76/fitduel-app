'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Users, Trophy, Target, TrendingUp, 
  ChevronRight, Shield, Zap, Clock,
  MessageCircle, Plus, Hash
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUserStore } from '@/stores/useUserStore'

interface Team {
  id: string
  name: string
  description: string
  avatar_url: string | null
  type: string
  leader_id: string
  current_members: number
  max_members: number
  total_xp: number
  weekly_xp: number
  is_public: boolean
  is_verified: boolean
  invite_code: string
  created_at: string
}

interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: string
  contribution_xp: number
  joined_at: string
  profiles: {
    username: string
    avatar_url: string | null
  }
}

interface TeamChallenge {
  id: string
  title: string
  challenge_type: string
  status: string
  start_date: string
  end_date: string
  challenger_score: number
  challenged_score: number
  challenger_team: {
    name: string
  }
  challenged_team: {
    name: string
  }
}

interface TeamActivity {
  id: string
  activity_type: string
  title: string
  description: string
  created_at: string
  user_id: string | null
  profiles?: {
    username: string
    avatar_url: string | null
  }
}

export default function TeamsWidget() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user } = useUserStore()
  const [myTeams, setMyTeams] = useState<Team[]>([])
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamChallenges, setTeamChallenges] = useState<TeamChallenge[]>([])
  const [teamActivities, setTeamActivities] = useState<TeamActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [contributionStats, setContributionStats] = useState({
    total_xp: 0,
    weekly_xp: 0,
    challenges_won: 0,
    rank: 0
  })

  useEffect(() => {
    if (user?.id) {
      fetchMyTeams()
    }
  }, [user])

  useEffect(() => {
    if (activeTeamId) {
      fetchTeamDetails(activeTeamId)
    }
  }, [activeTeamId])

  const fetchMyTeams = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)

      // Fetch teams dove l'utente è membro
      const { data: memberData } = await supabase
        .from('team_members')
        .select(`
          team_id,
          role,
          contribution_xp,
          teams:team_id (
            id,
            name,
            description,
            avatar_url,
            type,
            leader_id,
            current_members,
            max_members,
            total_xp,
            weekly_xp,
            is_public,
            is_verified,
            invite_code,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (memberData) {
        const teams = memberData
          .filter(m => m.teams) // Ensure teams exists
          .map(m => {
            // Handle if teams is an array (shouldn't be, but being safe)
            const teamData = Array.isArray(m.teams) ? m.teams[0] : m.teams
            return {
              ...teamData,
              my_role: m.role,
              my_contribution: m.contribution_xp
            }
          })
          .filter(t => t && t.id) // Ensure we have valid team data
        
        setMyTeams(teams)
        
        // Seleziona il primo team come attivo
        if (teams.length > 0 && !activeTeamId) {
          setActiveTeamId(teams[0].id)
        }

        // Calcola statistiche totali
        const totalContribution = memberData.reduce((sum, m) => sum + m.contribution_xp, 0)
        setContributionStats(prev => ({
          ...prev,
          total_xp: totalContribution
        }))
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamDetails = async (teamId: string) => {
    try {
      // Fetch membri del team
      const { data: members } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('team_id', teamId)
        .eq('is_active', true)
        .order('contribution_xp', { ascending: false })
        .limit(5)

      if (members) {
        setTeamMembers(members)
      }

      // Fetch sfide attive
      const { data: challenges } = await supabase
        .from('team_challenges')
        .select(`
          *,
          challenger_team:challenger_team_id (name),
          challenged_team:challenged_team_id (name)
        `)
        .or(`challenger_team_id.eq.${teamId},challenged_team_id.eq.${teamId}`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3)

      if (challenges) {
        setTeamChallenges(challenges)
      }

      // Fetch attività recenti
      const { data: activities } = await supabase
        .from('team_activities')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (activities) {
        setTeamActivities(activities)
      }
    } catch (error) {
      console.error('Error fetching team details:', error)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'member_joined': return Users
      case 'challenge_won': return Trophy
      case 'goal_completed': return Target
      case 'achievement_unlocked': return Zap
      default: return Clock
    }
  }

  const getTeamTypeIcon = (type: string) => {
    switch (type) {
      case 'gym': return '🏋️'
      case 'company': return '🏢'
      case 'association': return '🏛️'
      case 'school': return '🎓'
      case 'community': return '🌍'
      default: return '👥'
    }
  }

  const activeTeam = myTeams.find(t => t.id === activeTeamId)

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </Card>
    )
  }

  if (myTeams.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Non sei in nessun team</h3>
          <p className="text-gray-400 mb-6">
            Unisciti a un team o creane uno per iniziare!
          </p>
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={() => router.push('/teams')}
              variant="primary"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Crea Team
            </Button>
            <Button 
              onClick={() => router.push('/teams')}
              variant="secondary"
            >
              Esplora Team
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header con selezione team */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-yellow-500" />
            I Miei Team
          </h2>
          <Link href="/teams">
            <Button variant="ghost" size="sm" className="gap-1">
              Gestisci
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Team selector */}
        <div className="flex gap-2 flex-wrap">
          {myTeams.map((team) => (
            <motion.button
              key={team.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTeamId(team.id)}
              className={`px-3 py-2 rounded-lg border transition-all ${
                activeTeamId === team.id
                  ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500'
                  : 'bg-gray-800 border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{getTeamTypeIcon(team.type)}</span>
                <span className="font-medium text-sm">{team.name}</span>
                {team.is_verified && (
                  <Shield className="w-3 h-3 text-blue-500" />
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </Card>

      {/* Team Overview */}
      {activeTeam && (
        <Card className="p-6">
          <div className="space-y-4">
            {/* Team Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  {activeTeam.name}
                  {activeTeam.is_verified && (
                    <Shield className="w-4 h-4 text-blue-500" />
                  )}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {activeTeam.description || 'Nessuna descrizione'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Codice invito</div>
                <div className="font-mono font-bold text-yellow-500">
                  {activeTeam.invite_code}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Users className="w-3 h-3" />
                  Membri
                </div>
                <div className="text-lg font-bold">
                  {activeTeam.current_members}/{activeTeam.max_members}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Trophy className="w-3 h-3" />
                  XP Totale
                </div>
                <div className="text-lg font-bold text-yellow-500">
                  {activeTeam.total_xp.toLocaleString()}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <TrendingUp className="w-3 h-3" />
                  XP Settimana
                </div>
                <div className="text-lg font-bold text-green-500">
                  {activeTeam.weekly_xp.toLocaleString()}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Zap className="w-3 h-3" />
                  Il tuo contributo
                </div>
                <div className="text-lg font-bold text-blue-500">
                  {activeTeam.my_contribution?.toLocaleString() || 0}
                </div>
              </div>
            </div>

            {/* Top Contributors */}
            {teamMembers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">
                  Top Contributors
                </h4>
                <div className="space-y-2">
                  {teamMembers.slice(0, 3).map((member, index) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <img
                          src={member.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user_id}`}
                          alt={member.profiles?.username}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm">
                          {member.profiles?.username}
                        </span>
                        {member.role === 'owner' && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded">
                            Owner
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-yellow-500">
                        {member.contribution_xp} XP
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Challenges */}
            {teamChallenges.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">
                  Sfide Attive
                </h4>
                <div className="space-y-2">
                  {teamChallenges.map((challenge) => (
                    <div key={challenge.id} className="bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{challenge.title}</span>
                        <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">
                          Attiva
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">
                            {challenge.challenger_team.name}
                          </span>
                          <span className="font-bold text-yellow-500">
                            {challenge.challenger_score}
                          </span>
                        </div>
                        <span className="text-gray-500">vs</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-yellow-500">
                            {challenge.challenged_score}
                          </span>
                          <span className="text-gray-400">
                            {challenge.challenged_team?.name || 'Open Challenge'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {teamActivities.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">
                  Attività Recenti
                </h4>
                <div className="space-y-2">
                  {teamActivities.slice(0, 3).map((activity) => {
                    const Icon = getActivityIcon(activity.activity_type)
                    return (
                      <div key={activity.id} className="flex items-start gap-2 text-sm">
                        <Icon className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-gray-300">{activity.title}</span>
                          {activity.description && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {activity.description}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2">
              <Link href="/teams" className="flex-1">
                <Button variant="secondary" size="sm" className="w-full gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Chat Team
                </Button>
              </Link>
              <Link href="/teams" className="flex-1">
                <Button variant="secondary" size="sm" className="w-full gap-2">
                  <Target className="w-4 h-4" />
                  Obiettivi
                </Button>
              </Link>
              <Link href="/teams" className="flex-1">
                <Button variant="primary" size="sm" className="w-full gap-2">
                  <Trophy className="w-4 h-4" />
                  Sfida
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}