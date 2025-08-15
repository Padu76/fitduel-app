'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Trophy, Target, MessageCircle, Plus,
  Shield, Star, TrendingUp, Calendar, Clock,
  MapPin, Lock, Globe, ChevronRight, ChevronDown,
  Search, Filter, X, Send, UserPlus, Settings,
  MoreVertical, LogOut, UserMinus, Crown, Zap,
  Activity, Award, Flame, CheckCircle, AlertCircle,
  Coins
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUserStore } from '@/stores/useUserStore'

interface Team {
  id: string
  name: string
  description: string
  avatar_url: string | null
  type: string
  location: string | null
  leader_id: string
  current_members: number
  max_members: number
  total_xp: number
  weekly_xp: number
  is_public: boolean
  is_verified: boolean
  is_active: boolean
  invite_code: string
  created_at: string
  leader?: {
    username: string
    avatar_url: string | null
  }
  my_role?: string
  my_contribution?: number
}

interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: string
  contribution_xp: number
  joined_at: string
  is_active: boolean
  profiles: {
    username: string
    avatar_url: string | null
    level: number
    total_xp: number
  }
}

interface TeamChallenge {
  id: string
  challenger_team_id: string
  challenged_team_id: string | null
  challenge_type: string
  title: string
  description: string
  status: string
  start_date: string
  end_date: string
  xp_reward: number
  challenger_score: number
  challenged_score: number
  challenger_team: {
    name: string
    avatar_url: string | null
  }
  challenged_team?: {
    name: string
    avatar_url: string | null
  }
}

interface TeamMessage {
  id: string
  team_id: string
  user_id: string
  message: string
  message_type: string
  created_at: string
  profiles: {
    username: string
    avatar_url: string | null
  }
}

interface TeamGoal {
  id: string
  team_id: string
  title: string
  description: string
  goal_type: string
  target_value: number
  current_value: number
  reward_xp: number
  reward_coins: number
  start_date: string
  end_date: string
  is_completed: boolean
}

interface TeamActivity {
  id: string
  team_id: string
  activity_type: string
  title: string
  description: string
  created_at: string
  metadata: any
  profiles?: {
    username: string
    avatar_url: string | null
  }
}

export default function TeamsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user } = useUserStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // State
  const [loading, setLoading] = useState(true)
  const [myTeams, setMyTeams] = useState<Team[]>([])
  const [publicTeams, setPublicTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamChallenges, setTeamChallenges] = useState<TeamChallenge[]>([])
  const [teamMessages, setTeamMessages] = useState<TeamMessage[]>([])
  const [teamGoals, setTeamGoals] = useState<TeamGoal[]>([])
  const [teamActivities, setTeamActivities] = useState<TeamActivity[]>([])
  
  // UI State
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'chat' | 'challenges' | 'goals'>('overview')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [messageInput, setMessageInput] = useState('')
  const [joinCode, setJoinCode] = useState('')

  // Form State for Create Team
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    type: 'friends',
    location: '',
    is_public: false,
    max_members: 50
  })

  useEffect(() => {
    if (user?.id) {
      fetchTeams()
    }
  }, [user])

  useEffect(() => {
    if (selectedTeam && activeTab === 'chat') {
      scrollToBottom()
      subscribeToMessages()
    }
    return () => {
      unsubscribeFromMessages()
    }
  }, [selectedTeam, activeTab])

  const fetchTeams = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)

      // Fetch my teams
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
            location,
            leader_id,
            current_members,
            max_members,
            total_xp,
            weekly_xp,
            is_public,
            is_verified,
            is_active,
            invite_code,
            created_at,
            leader:leader_id (
              username,
              avatar_url
            )
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
          .filter(t => t.id) // Ensure we have valid team data
        
        setMyTeams(teams as Team[])
      }

      // Fetch public teams
      const { data: publicData } = await supabase
        .from('teams')
        .select(`
          *,
          leader:leader_id (
            username,
            avatar_url
          )
        `)
        .eq('is_public', true)
        .eq('is_active', true)
        .limit(20)

      if (publicData) {
        setPublicTeams(publicData as Team[])
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamDetails = async (team: Team) => {
    try {
      // Fetch members
      const { data: members } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url,
            level,
            total_xp
          )
        `)
        .eq('team_id', team.id)
        .eq('is_active', true)
        .order('contribution_xp', { ascending: false })

      if (members) {
        setTeamMembers(members)
      }

      // Fetch challenges
      const { data: challenges } = await supabase
        .from('team_challenges')
        .select(`
          *,
          challenger_team:challenger_team_id (
            name,
            avatar_url
          ),
          challenged_team:challenged_team_id (
            name,
            avatar_url
          )
        `)
        .or(`challenger_team_id.eq.${team.id},challenged_team_id.eq.${team.id}`)
        .in('status', ['pending', 'active'])
        .order('created_at', { ascending: false })

      if (challenges) {
        setTeamChallenges(challenges)
      }

      // Fetch goals
      const { data: goals } = await supabase
        .from('team_goals')
        .select('*')
        .eq('team_id', team.id)
        .eq('is_completed', false)
        .order('end_date', { ascending: true })

      if (goals) {
        setTeamGoals(goals)
      }

      // Fetch recent activities
      const { data: activities } = await supabase
        .from('team_activities')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('team_id', team.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (activities) {
        setTeamActivities(activities)
      }

      // Fetch messages if chat tab is active
      if (activeTab === 'chat') {
        const { data: messages } = await supabase
          .from('team_messages')
          .select(`
            *,
            profiles:user_id (
              username,
              avatar_url
            )
          `)
          .eq('team_id', team.id)
          .order('created_at', { ascending: true })
          .limit(50)

        if (messages) {
          setTeamMessages(messages)
        }
      }
    } catch (error) {
      console.error('Error fetching team details:', error)
    }
  }

  const createTeam = async () => {
    if (!newTeam.name || !user?.id) return

    try {
      const { data, error } = await supabase
        .rpc('create_team', {
          p_owner_id: user.id,
          p_name: newTeam.name,
          p_description: newTeam.description,
          p_type: newTeam.type,
          p_is_public: newTeam.is_public,
          p_max_members: newTeam.max_members,
          p_location: newTeam.location || null
        })

      if (error) throw error

      // Refresh teams
      await fetchTeams()
      setShowCreateModal(false)
      setNewTeam({
        name: '',
        description: '',
        type: 'friends',
        location: '',
        is_public: false,
        max_members: 50
      })
    } catch (error) {
      console.error('Error creating team:', error)
    }
  }

  const joinTeamByCode = async () => {
    if (!joinCode || !user?.id) return

    try {
      const { data, error } = await supabase
        .rpc('join_team_by_code', {
          p_user_id: user.id,
          p_invite_code: joinCode.toUpperCase()
        })

      if (error) throw error

      if (data?.success) {
        await fetchTeams()
        setShowJoinModal(false)
        setJoinCode('')
      } else {
        alert(data?.message || 'Errore durante l\'iscrizione al team')
      }
    } catch (error) {
      console.error('Error joining team:', error)
    }
  }

  const joinPublicTeam = async (teamId: string) => {
    if (!user?.id) return
    
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: user.id,
          role: 'member',
          contribution_xp: 0,
          joined_at: new Date().toISOString(),
          is_active: true
        })

      if (error) throw error

      // Update team member count
      await supabase
        .rpc('increment', { 
          table_name: 'teams',
          row_id: teamId,
          column_name: 'current_members',
          increment_value: 1
        })

      await fetchTeams()
    } catch (error) {
      console.error('Error joining public team:', error)
    }
  }

  const leaveTeam = async (teamId: string) => {
    if (!confirm('Sei sicuro di voler lasciare questo team?') || !user?.id) return

    try {
      await supabase
        .from('team_members')
        .update({ is_active: false })
        .eq('team_id', teamId)
        .eq('user_id', user.id)

      await fetchTeams()
      setSelectedTeam(null)
    } catch (error) {
      console.error('Error leaving team:', error)
    }
  }

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedTeam || !user?.id) return

    try {
      const { error } = await supabase
        .from('team_messages')
        .insert({
          team_id: selectedTeam.id,
          user_id: user.id,
          message: messageInput.trim(),
          message_type: 'text'
        })

      if (error) throw error

      setMessageInput('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const subscribeToMessages = () => {
    if (!selectedTeam) return

    const channel = supabase
      .channel(`team-messages-${selectedTeam.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_messages',
          filter: `team_id=eq.${selectedTeam.id}`
        },
        async (payload) => {
          // Fetch profile for new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', payload.new.user_id)
            .single()

          const newMessage = {
            ...payload.new,
            profiles: profile
          } as TeamMessage

          setTeamMessages(prev => [...prev, newMessage])
          scrollToBottom()
        }
      )
      .subscribe()
  }

  const unsubscribeFromMessages = () => {
    supabase.removeAllChannels()
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'member_joined': return Users
      case 'challenge_won': return Trophy
      case 'goal_completed': return Target
      case 'achievement_unlocked': return Award
      case 'challenge_received': return Zap
      default: return Activity
    }
  }

  const filteredPublicTeams = publicTeams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         team.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || team.type === filterType
    return matchesSearch && matchesType
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard" className="text-gray-400 hover:text-white mb-4 inline-block">
            ← Torna alla Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-yellow-500" />
              Teams
            </h1>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowJoinModal(true)}
                variant="secondary"
                className="gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Unisciti con Codice
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="primary"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Crea Team
              </Button>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Teams List */}
          <div className="lg:col-span-1 space-y-4">
            {/* My Teams */}
            {myTeams.length > 0 && (
              <Card className="p-4">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-yellow-500" />
                  I Miei Team
                </h2>
                <div className="space-y-2">
                  {myTeams.map((team) => (
                    <motion.div
                      key={team.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedTeam(team)
                        fetchTeamDetails(team)
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedTeam?.id === team.id
                          ? 'bg-yellow-500/20 border-yellow-500'
                          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{getTeamTypeIcon(team.type)}</div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {team.name}
                              {team.is_verified && (
                                <Shield className="w-4 h-4 text-blue-500" />
                              )}
                            </div>
                            <div className="text-xs text-gray-400">
                              {team.current_members}/{team.max_members} membri
                            </div>
                          </div>
                        </div>
                        {team.my_role === 'owner' && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-gray-400">
                          {team.total_xp.toLocaleString()} XP
                        </span>
                        <span className="text-green-500">
                          +{team.weekly_xp} questa settimana
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}

            {/* Public Teams */}
            <Card className="p-4">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                Team Pubblici
              </h2>

              {/* Search and Filter */}
              <div className="space-y-2 mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Cerca team..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="all">Tutti i tipi</option>
                  <option value="friends">Amici</option>
                  <option value="gym">Palestra</option>
                  <option value="company">Azienda</option>
                  <option value="association">Associazione</option>
                  <option value="school">Scuola</option>
                  <option value="community">Community</option>
                </select>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredPublicTeams.map((team) => {
                  const isMember = myTeams.some(t => t.id === team.id)
                  return (
                    <div
                      key={team.id}
                      className="p-3 bg-gray-800 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{getTeamTypeIcon(team.type)}</div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {team.name}
                              {team.is_verified && (
                                <Shield className="w-4 h-4 text-blue-500" />
                              )}
                            </div>
                            <div className="text-xs text-gray-400">
                              {team.current_members}/{team.max_members} membri
                            </div>
                            {team.location && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                <MapPin className="w-3 h-3" />
                                {team.location}
                              </div>
                            )}
                          </div>
                        </div>
                        {!isMember && team.current_members < team.max_members && (
                          <Button
                            onClick={() => joinPublicTeam(team.id)}
                            size="sm"
                            variant="secondary"
                          >
                            Unisciti
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* Right Column - Team Details */}
          <div className="lg:col-span-2">
            {selectedTeam ? (
              <Card className="p-6">
                {/* Team Header */}
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        {getTeamTypeIcon(selectedTeam.type)}
                        {selectedTeam.name}
                        {selectedTeam.is_verified && (
                          <Shield className="w-5 h-5 text-blue-500" />
                        )}
                      </h2>
                      <p className="text-gray-400 mt-1">
                        {selectedTeam.description || 'Nessuna descrizione'}
                      </p>
                      {selectedTeam.location && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                          <MapPin className="w-4 h-4" />
                          {selectedTeam.location}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedTeam.my_role === 'owner' && (
                        <Button
                          onClick={() => setShowInviteModal(true)}
                          size="sm"
                          variant="secondary"
                          className="gap-2"
                        >
                          <UserPlus className="w-4 h-4" />
                          Invita
                        </Button>
                      )}
                      {selectedTeam.my_role !== 'owner' && (
                        <Button
                          onClick={() => leaveTeam(selectedTeam.id)}
                          size="sm"
                          variant="ghost"
                          className="gap-2 text-red-500 hover:text-red-400"
                        >
                          <LogOut className="w-4 h-4" />
                          Lascia
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Team Stats */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-gray-800 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-yellow-500">
                        {selectedTeam.total_xp.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">XP Totale</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-500">
                        +{selectedTeam.weekly_xp}
                      </div>
                      <div className="text-xs text-gray-400">Questa Settimana</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold">
                        {selectedTeam.current_members}
                      </div>
                      <div className="text-xs text-gray-400">Membri</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-500">
                        {teamChallenges.filter(c => c.status === 'active').length}
                      </div>
                      <div className="text-xs text-gray-400">Sfide Attive</div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-700 mb-6">
                  <div className="flex gap-6">
                    {['overview', 'members', 'chat', 'challenges', 'goals'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => {
                          setActiveTab(tab as any)
                          if (tab === 'chat' || tab === 'members' || tab === 'challenges' || tab === 'goals') {
                            fetchTeamDetails(selectedTeam)
                          }
                        }}
                        className={`pb-3 px-1 capitalize transition-colors ${
                          activeTab === tab
                            ? 'text-yellow-500 border-b-2 border-yellow-500'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {tab === 'overview' && 'Panoramica'}
                        {tab === 'members' && 'Membri'}
                        {tab === 'chat' && 'Chat'}
                        {tab === 'challenges' && 'Sfide'}
                        {tab === 'goals' && 'Obiettivi'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Recent Activities */}
                      <div>
                        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-yellow-500" />
                          Attività Recenti
                        </h3>
                        <div className="space-y-3">
                          {teamActivities.length > 0 ? (
                            teamActivities.map((activity) => {
                              const Icon = getActivityIcon(activity.activity_type)
                              return (
                                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
                                  <Icon className="w-5 h-5 text-gray-400 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-sm">
                                      <span className="font-medium">{activity.title}</span>
                                    </p>
                                    {activity.description && (
                                      <p className="text-xs text-gray-400 mt-1">
                                        {activity.description}
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                      {new Date(activity.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              )
                            })
                          ) : (
                            <p className="text-gray-400 text-center py-8">
                              Nessuna attività recente
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Invite Code */}
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-400 mb-2">
                          Codice Invito Team
                        </h4>
                        <div className="flex items-center justify-between">
                          <div className="font-mono text-2xl font-bold text-yellow-500">
                            {selectedTeam.invite_code}
                          </div>
                          <Button
                            onClick={() => {
                              navigator.clipboard.writeText(selectedTeam.invite_code)
                              alert('Codice copiato!')
                            }}
                            size="sm"
                            variant="secondary"
                          >
                            Copia
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Members Tab */}
                  {activeTab === 'members' && (
                    <div className="space-y-4">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                          <div className="flex items-center gap-3">
                            <img
                              src={member.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user_id}`}
                              alt={member.profiles?.username}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {member.profiles?.username}
                                {member.role === 'owner' && (
                                  <Crown className="w-4 h-4 text-yellow-500" />
                                )}
                                {member.role === 'admin' && (
                                  <Shield className="w-4 h-4 text-blue-500" />
                                )}
                              </div>
                              <div className="text-xs text-gray-400">
                                Livello {member.profiles?.level || 1} • {member.profiles?.total_xp || 0} XP
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-yellow-500">
                              {member.contribution_xp} XP
                            </div>
                            <div className="text-xs text-gray-400">
                              Contribuito
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Chat Tab */}
                  {activeTab === 'chat' && (
                    <div className="flex flex-col h-[400px]">
                      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                        {teamMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex gap-3 ${
                              msg.user_id === user?.id ? 'flex-row-reverse' : ''
                            }`}
                          >
                            <img
                              src={msg.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.user_id}`}
                              alt={msg.profiles?.username}
                              className="w-8 h-8 rounded-full"
                            />
                            <div className={`max-w-[70%] ${
                              msg.user_id === user?.id ? 'text-right' : ''
                            }`}>
                              <div className="text-xs text-gray-400 mb-1">
                                {msg.profiles?.username}
                              </div>
                              <div className={`inline-block px-3 py-2 rounded-lg ${
                                msg.user_id === user?.id
                                  ? 'bg-yellow-500/20 text-yellow-500'
                                  : 'bg-gray-800 text-white'
                              }`}>
                                {msg.message}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(msg.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="Scrivi un messaggio..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <Button
                          onClick={sendMessage}
                          variant="primary"
                          className="gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Invia
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Challenges Tab */}
                  {activeTab === 'challenges' && (
                    <div className="space-y-4">
                      {teamChallenges.length > 0 ? (
                        teamChallenges.map((challenge) => (
                          <div key={challenge.id} className="p-4 bg-gray-800 rounded-lg">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-bold">{challenge.title}</h4>
                                <p className="text-sm text-gray-400 mt-1">
                                  {challenge.description}
                                </p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded ${
                                challenge.status === 'active'
                                  ? 'bg-green-500/20 text-green-500'
                                  : 'bg-yellow-500/20 text-yellow-500'
                              }`}>
                                {challenge.status === 'active' ? 'Attiva' : 'In Attesa'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <div className="text-sm text-gray-400">
                                    {challenge.challenger_team.name}
                                  </div>
                                  <div className="text-2xl font-bold text-yellow-500">
                                    {challenge.challenger_score}
                                  </div>
                                </div>
                                <div className="text-gray-500">VS</div>
                                <div className="text-center">
                                  <div className="text-sm text-gray-400">
                                    {challenge.challenged_team?.name || 'Open'}
                                  </div>
                                  <div className="text-2xl font-bold text-yellow-500">
                                    {challenge.challenged_score}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-400">Ricompensa</div>
                                <div className="text-sm font-bold text-green-500">
                                  {challenge.xp_reward} XP
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <Trophy className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                          <p className="text-gray-400">Nessuna sfida attiva</p>
                          <Button
                            variant="primary"
                            className="mt-4"
                          >
                            Lancia una Sfida
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Goals Tab */}
                  {activeTab === 'goals' && (
                    <div className="space-y-4">
                      {teamGoals.length > 0 ? (
                        teamGoals.map((goal) => {
                          const progress = (goal.current_value / goal.target_value) * 100
                          return (
                            <div key={goal.id} className="p-4 bg-gray-800 rounded-lg">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-bold">{goal.title}</h4>
                                  <p className="text-sm text-gray-400 mt-1">
                                    {goal.description}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-gray-400">Scadenza</div>
                                  <div className="text-sm">
                                    {new Date(goal.end_date).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <div className="mb-3">
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span className="text-gray-400">Progresso</span>
                                  <span className="font-bold">
                                    {goal.current_value}/{goal.target_value}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-yellow-500 rounded-full h-2 transition-all"
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Zap className="w-4 h-4 text-yellow-500" />
                                  <span className="text-yellow-500">+{goal.reward_xp} XP</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Coins className="w-4 h-4 text-yellow-600" />
                                  <span className="text-yellow-600">+{goal.reward_coins}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-center py-12">
                          <Target className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                          <p className="text-gray-400">Nessun obiettivo attivo</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <Users className="w-24 h-24 text-gray-700 mx-auto mb-6" />
                <h3 className="text-xl font-bold mb-2">Seleziona un Team</h3>
                <p className="text-gray-400 mb-6">
                  Seleziona un team dalla lista o creane uno nuovo per iniziare
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    variant="primary"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Crea Team
                  </Button>
                  <Button
                    onClick={() => setShowJoinModal(true)}
                    variant="secondary"
                    className="gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Unisciti
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Create Team Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Crea Nuovo Team"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Nome Team
              </label>
              <Input
                type="text"
                placeholder="Es. Warriors Fitness"
                value={newTeam.name}
                onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Descrizione
              </label>
              <textarea
                placeholder="Descrivi il tuo team..."
                value={newTeam.description}
                onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Tipo di Team
              </label>
              <select
                value={newTeam.type}
                onChange={(e) => setNewTeam({...newTeam, type: e.target.value})}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="friends">Amici</option>
                <option value="gym">Palestra</option>
                <option value="company">Azienda</option>
                <option value="association">Associazione</option>
                <option value="school">Scuola</option>
                <option value="community">Community</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Location (opzionale)
              </label>
              <Input
                type="text"
                placeholder="Es. Milano, Italia"
                value={newTeam.location}
                onChange={(e) => setNewTeam({...newTeam, location: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Membri Massimi
              </label>
              <Input
                type="number"
                min="2"
                max="100"
                value={newTeam.max_members}
                onChange={(e) => setNewTeam({...newTeam, max_members: parseInt(e.target.value)})}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_public"
                checked={newTeam.is_public}
                onChange={(e) => setNewTeam({...newTeam, is_public: e.target.checked})}
                className="rounded border-gray-700 bg-gray-800"
              />
              <label htmlFor="is_public" className="text-sm text-gray-400">
                Team pubblico (chiunque può unirsi)
              </label>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={createTeam}
                variant="primary"
                className="flex-1"
              >
                Crea Team
              </Button>
              <Button
                onClick={() => setShowCreateModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Annulla
              </Button>
            </div>
          </div>
        </Modal>

        {/* Join Team Modal */}
        <Modal
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          title="Unisciti con Codice"
        >
          <div className="space-y-4">
            <p className="text-gray-400">
              Inserisci il codice invito del team a cui vuoi unirti
            </p>
            <Input
              type="text"
              placeholder="Es. ABC12345"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="text-center text-2xl font-mono"
            />
            <div className="flex gap-3">
              <Button
                onClick={joinTeamByCode}
                variant="primary"
                className="flex-1"
                disabled={joinCode.length < 8}
              >
                Unisciti
              </Button>
              <Button
                onClick={() => {
                  setShowJoinModal(false)
                  setJoinCode('')
                }}
                variant="secondary"
                className="flex-1"
              >
                Annulla
              </Button>
            </div>
          </div>
        </Modal>

        {/* Invite Modal */}
        <Modal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          title="Invita Membri"
        >
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-400 mb-3">
                Condividi questo codice con chi vuoi invitare
              </p>
              <div className="font-mono text-3xl font-bold text-yellow-500 mb-4">
                {selectedTeam?.invite_code}
              </div>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(selectedTeam?.invite_code || '')
                  alert('Codice copiato negli appunti!')
                }}
                variant="secondary"
                className="w-full"
              >
                Copia Codice
              </Button>
            </div>
            <div className="text-center text-sm text-gray-400">
              I membri possono unirsi usando questo codice nella sezione "Unisciti con Codice"
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}