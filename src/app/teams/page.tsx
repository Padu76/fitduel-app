'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Trophy, Target, MessageCircle, Plus, Search,
  Crown, Shield, Star, ChevronRight, ArrowLeft, Settings,
  MapPin, Lock, Globe, Copy, Check, Send, Pin, Trash2,
  UserPlus, UserMinus, Edit, Calendar, Zap, TrendingUp,
  Swords, Flag, Medal, Gift, Info, X, Loader2, Bell,
  Hash, AtSign, Heart, Share2, BarChart3, Clock, Filter
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUserStore } from '@/stores/useUserStore'

// ====================================
// TYPES
// ====================================
interface Team {
  id: string
  name: string
  description: string | null
  avatar_url: string | null
  leader_id: string
  type: 'friends' | 'gym' | 'company' | 'association' | 'school' | 'community'
  location: string | null
  max_members: number
  current_members: number
  total_xp: number
  weekly_xp: number
  is_public: boolean
  is_active: boolean
  is_verified: boolean
  invite_code: string
  settings: any
  created_at: string
  updated_at: string
}

interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  contribution_xp: number
  joined_at: string
  is_active: boolean
  user?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    level: number
    xp: number
  }
}

interface TeamMessage {
  id: string
  team_id: string
  user_id: string
  message: string
  message_type: 'text' | 'system' | 'achievement' | 'challenge'
  attachments: any
  is_pinned: boolean
  edited_at: string | null
  deleted_at: string | null
  created_at: string
  user?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface TeamChallenge {
  id: string
  challenger_team_id: string
  challenged_team_id: string
  exercise_id: string
  challenge_type: 'total_reps' | 'avg_performance' | 'most_participants' | 'relay'
  title: string
  description: string | null
  start_date: string
  end_date: string
  xp_reward: number
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  winner_team_id: string | null
  challenger_score: number
  challenged_score: number
  challenger_team?: Team
  challenged_team?: Team
  exercise?: {
    name: string
    icon: string
  }
}

interface TeamGoal {
  id: string
  team_id: string
  title: string
  description: string | null
  goal_type: 'collective_reps' | 'total_workouts' | 'streak_days' | 'xp_target'
  target_value: number
  current_value: number
  reward_xp: number
  reward_coins: number
  start_date: string
  end_date: string
  is_completed: boolean
  completed_at: string | null
}

interface TeamActivity {
  id: string
  team_id: string
  user_id: string | null
  activity_type: string
  title: string
  description: string | null
  metadata: any
  created_at: string
  user?: {
    username: string
    display_name: string | null
  }
}

// ====================================
// COMPONENTS
// ====================================
const TeamTypeIcon = ({ type }: { type: string }) => {
  const icons = {
    friends: '👥',
    gym: '🏋️',
    company: '🏢',
    association: '🤝',
    school: '🎓',
    community: '🌍'
  }
  return <span className="text-xl">{icons[type as keyof typeof icons] || '👥'}</span>
}

const TeamCard = ({ 
  team, 
  isMyTeam,
  onView,
  onJoin 
}: { 
  team: Team
  isMyTeam: boolean
  onView: () => void
  onJoin?: () => void
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(team.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card 
      variant="glass" 
      className="p-6 hover:border-indigo-500/50 transition-all cursor-pointer"
      onClick={onView}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
            <TeamTypeIcon type={team.type} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">{team.name}</h3>
              {team.is_verified && (
                <span className="text-blue-500">
                  <Check className="w-4 h-4" />
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">
              {team.current_members}/{team.max_members} membri
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {team.is_public ? (
            <Globe className="w-4 h-4 text-green-400" />
          ) : (
            <Lock className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {team.description && (
        <p className="text-sm text-gray-300 mb-3 line-clamp-2">{team.description}</p>
      )}

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{team.total_xp.toLocaleString()}</p>
          <p className="text-xs text-gray-400">XP Totali</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-500">{team.weekly_xp.toLocaleString()}</p>
          <p className="text-xs text-gray-400">XP Settimana</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-white">
            {team.location ? (
              <span className="flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3" />
                {team.location}
              </span>
            ) : (
              '-'
            )}
          </p>
          <p className="text-xs text-gray-400">Location</p>
        </div>
      </div>

      <div className="flex gap-2">
        {isMyTeam ? (
          <>
            <Button 
              variant="secondary" 
              size="sm" 
              className="flex-1"
              onClick={handleCopyCode}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copiato!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  {team.invite_code}
                </>
              )}
            </Button>
            <Button 
              variant="gradient" 
              size="sm" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation()
                onView()
              }}
            >
              Gestisci
              <Settings className="w-4 h-4 ml-1" />
            </Button>
          </>
        ) : (
          <Button 
            variant="gradient" 
            size="sm" 
            className="w-full"
            onClick={(e) => {
              e.stopPropagation()
              onJoin?.()
            }}
          >
            Unisciti
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </Card>
  )
}

const CreateTeamModal = ({ 
  isOpen, 
  onClose,
  onCreate 
}: { 
  isOpen: boolean
  onClose: () => void
  onCreate: (data: any) => void
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'friends',
    location: '',
    is_public: false,
    max_members: 50
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate(formData)
    setFormData({
      name: '',
      description: '',
      type: 'friends',
      location: '',
      is_public: false,
      max_members: 50
    })
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crea Nuovo Team" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nome Team *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Es: Guerrieri del Fitness"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Descrizione
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descrivi il tuo team..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tipo di Team
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="friends">👥 Amici</option>
            <option value="gym">🏋️ Palestra</option>
            <option value="company">🏢 Azienda</option>
            <option value="association">🤝 Associazione</option>
            <option value="school">🎓 Scuola</option>
            <option value="community">🌍 Community</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Location (opzionale)
          </label>
          <Input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Es: Milano, Roma, etc."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Membri
            </label>
            <Input
              type="number"
              value={formData.max_members}
              onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) })}
              min="2"
              max="500"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-600 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-300">Team Pubblico</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Annulla
          </Button>
          <Button type="submit" variant="gradient" className="flex-1">
            Crea Team
          </Button>
        </div>
      </form>
    </Modal>
  )
}

const JoinTeamModal = ({ 
  isOpen, 
  onClose,
  onJoin 
}: { 
  isOpen: boolean
  onClose: () => void
  onJoin: (code: string) => void
}) => {
  const [inviteCode, setInviteCode] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inviteCode.trim()) {
      onJoin(inviteCode.trim().toUpperCase())
      setInviteCode('')
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Unisciti a un Team" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Codice Invito
          </label>
          <Input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="ES: ABC12345"
            maxLength={8}
            required
            className="text-center text-xl font-mono"
          />
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 mt-0.5" />
            <p className="text-xs text-blue-300">
              Chiedi il codice invito al leader del team o trova team pubblici nella sezione "Esplora"
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Annulla
          </Button>
          <Button type="submit" variant="gradient" className="flex-1">
            Unisciti
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ====================================
// MAIN COMPONENT
// ====================================
export default function TeamsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user } = useUserStore()
  
  // State
  const [loading, setLoading] = useState(true)
  const [myTeams, setMyTeams] = useState<Team[]>([])
  const [publicTeams, setPublicTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamMessages, setTeamMessages] = useState<TeamMessage[]>([])
  const [teamChallenges, setTeamChallenges] = useState<TeamChallenge[]>([])
  const [teamGoals, setTeamGoals] = useState<TeamGoal[]>([])
  const [teamActivities, setTeamActivities] = useState<TeamActivity[]>([])
  
  // UI State
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'chat' | 'challenges' | 'goals'>('overview')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [newMessage, setNewMessage] = useState('')
  
  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadTeams()
  }, [user])

  useEffect(() => {
    if (selectedTeam) {
      loadTeamData(selectedTeam.id)
    }
  }, [selectedTeam])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [teamMessages])

  const loadTeams = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      // Load my teams
      const { data: myTeamsData, error: myTeamsError } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams!inner(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (myTeamsData && !myTeamsError) {
        const teams = myTeamsData.map(tm => tm.teams).flat()
        setMyTeams(teams as Team[])
      }

      // Load public teams
      const { data: publicTeamsData, error: publicTeamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('is_public', true)
        .eq('is_active', true)
        .limit(20)

      if (publicTeamsData && !publicTeamsError) {
        setPublicTeams(publicTeamsData)
      }
    } catch (error) {
      console.error('Error loading teams:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTeamData = async (teamId: string) => {
    try {
      // Load members
      const { data: membersData } = await supabase
        .from('team_members')
        .select(`
          *,
          user:profiles(
            id,
            username,
            display_name,
            avatar_url,
            level,
            xp
          )
        `)
        .eq('team_id', teamId)
        .eq('is_active', true)

      if (membersData) {
        setTeamMembers(membersData as any)
      }

      // Load messages
      const { data: messagesData } = await supabase
        .from('team_messages')
        .select(`
          *,
          user:profiles(
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('team_id', teamId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(100)

      if (messagesData) {
        setTeamMessages(messagesData as any)
      }

      // Load challenges
      const { data: challengesData } = await supabase
        .from('team_challenges')
        .select(`
          *,
          challenger_team:teams!challenger_team_id(*),
          challenged_team:teams!challenged_team_id(*),
          exercise:exercises(name, icon)
        `)
        .or(`challenger_team_id.eq.${teamId},challenged_team_id.eq.${teamId}`)
        .order('created_at', { ascending: false })

      if (challengesData) {
        setTeamChallenges(challengesData as any)
      }

      // Load goals
      const { data: goalsData } = await supabase
        .from('team_goals')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })

      if (goalsData) {
        setTeamGoals(goalsData)
      }

      // Load activities
      const { data: activitiesData } = await supabase
        .from('team_activities')
        .select(`
          *,
          user:profiles(
            username,
            display_name
          )
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (activitiesData) {
        setTeamActivities(activitiesData as any)
      }
    } catch (error) {
      console.error('Error loading team data:', error)
    }
  }

  const handleCreateTeam = async (formData: any) => {
    if (!user) return
    
    try {
      const { data, error } = await supabase.rpc('create_team', {
        p_owner_id: user.id,
        p_name: formData.name,
        p_description: formData.description || null,
        p_type: formData.type,
        p_is_public: formData.is_public,
        p_max_members: formData.max_members,
        p_location: formData.location || null
      })

      if (error) throw error

      await loadTeams()
      setShowCreateModal(false)
    } catch (error) {
      console.error('Error creating team:', error)
    }
  }

  const handleJoinTeam = async (inviteCode: string) => {
    if (!user) return
    
    try {
      const { data, error } = await supabase.rpc('join_team_by_code', {
        p_user_id: user.id,
        p_invite_code: inviteCode
      })

      if (error) throw error

      if (data?.success) {
        await loadTeams()
        setShowJoinModal(false)
      } else {
        alert(data?.message || 'Errore nel join del team')
      }
    } catch (error) {
      console.error('Error joining team:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!user || !selectedTeam || !newMessage.trim()) return
    
    try {
      const { error } = await supabase
        .from('team_messages')
        .insert({
          team_id: selectedTeam.id,
          user_id: user.id,
          message: newMessage.trim(),
          message_type: 'text'
        })

      if (error) throw error

      setNewMessage('')
      await loadTeamData(selectedTeam.id)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const getUserRole = (teamId: string): string | null => {
    const member = teamMembers.find(m => m.user_id === user?.id && m.team_id === teamId)
    return member?.role || null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Caricamento teams...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {selectedTeam ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTeam(null)}>
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <TeamTypeIcon type={selectedTeam.type} />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        {selectedTeam.name}
                        {selectedTeam.is_verified && (
                          <Check className="w-4 h-4 text-blue-500" />
                        )}
                      </h1>
                      <p className="text-sm text-gray-400">
                        {selectedTeam.current_members} membri • {selectedTeam.total_xp.toLocaleString()} XP
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  </Link>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-white">Teams</h1>
                      <p className="text-sm text-gray-400">Gruppi e sfide di squadra</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {!selectedTeam && (
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setShowJoinModal(true)}>
                  <Hash className="w-4 h-4 mr-1" />
                  Usa Codice
                </Button>
                <Button variant="gradient" size="sm" onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Crea Team
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {selectedTeam ? (
          // TEAM DETAIL VIEW
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              <Button
                variant={activeTab === 'overview' ? 'gradient' : 'secondary'}
                size="sm"
                onClick={() => setActiveTab('overview')}
              >
                <Info className="w-4 h-4 mr-1" />
                Overview
              </Button>
              <Button
                variant={activeTab === 'members' ? 'gradient' : 'secondary'}
                size="sm"
                onClick={() => setActiveTab('members')}
              >
                <Users className="w-4 h-4 mr-1" />
                Membri ({teamMembers.length})
              </Button>
              <Button
                variant={activeTab === 'chat' ? 'gradient' : 'secondary'}
                size="sm"
                onClick={() => setActiveTab('chat')}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Chat
              </Button>
              <Button
                variant={activeTab === 'challenges' ? 'gradient' : 'secondary'}
                size="sm"
                onClick={() => setActiveTab('challenges')}
              >
                <Swords className="w-4 h-4 mr-1" />
                Sfide
              </Button>
              <Button
                variant={activeTab === 'goals' ? 'gradient' : 'secondary'}
                size="sm"
                onClick={() => setActiveTab('goals')}
              >
                <Target className="w-4 h-4 mr-1" />
                Obiettivi
              </Button>
            </div>

            <AnimatePresence mode="wait">
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Stats */}
                  <div className="grid md:grid-cols-4 gap-4">
                    <Card variant="glass" className="p-4 text-center">
                      <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{selectedTeam.total_xp.toLocaleString()}</p>
                      <p className="text-sm text-gray-400">XP Totali</p>
                    </Card>
                    <Card variant="glass" className="p-4 text-center">
                      <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{selectedTeam.weekly_xp.toLocaleString()}</p>
                      <p className="text-sm text-gray-400">XP Settimana</p>
                    </Card>
                    <Card variant="glass" className="p-4 text-center">
                      <Users className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{selectedTeam.current_members}</p>
                      <p className="text-sm text-gray-400">Membri</p>
                    </Card>
                    <Card variant="glass" className="p-4 text-center">
                      <Swords className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{teamChallenges.length}</p>
                      <p className="text-sm text-gray-400">Sfide</p>
                    </Card>
                  </div>

                  {/* Activities Feed */}
                  <Card variant="glass" className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-yellow-500" />
                      Attività Recenti
                    </h3>
                    <div className="space-y-3">
                      {teamActivities.length > 0 ? (
                        teamActivities.map((activity) => (
                          <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                              <Bell className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{activity.title}</p>
                              {activity.description && (
                                <p className="text-xs text-gray-400 mt-1">{activity.description}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(activity.created_at).toLocaleString('it-IT')}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-400 py-8">Nessuna attività recente</p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* MEMBERS TAB */}
              {activeTab === 'members' && (
                <motion.div
                  key="members"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card variant="glass" className="p-6">
                    <div className="space-y-3">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                              {member.role === 'owner' && <Crown className="w-5 h-5 text-yellow-500" />}
                              {member.role === 'admin' && <Shield className="w-5 h-5 text-blue-500" />}
                              {member.role === 'member' && <Users className="w-5 h-5 text-white" />}
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {member.user?.display_name || member.user?.username || 'Utente'}
                              </p>
                              <p className="text-xs text-gray-400">
                                Lv.{member.user?.level || 1} • {member.contribution_xp} XP contribuiti
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'text-xs px-2 py-1 rounded-full',
                              member.role === 'owner' ? 'bg-yellow-500/20 text-yellow-400' :
                              member.role === 'admin' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-gray-500/20 text-gray-400'
                            )}>
                              {member.role === 'owner' ? 'Owner' :
                               member.role === 'admin' ? 'Admin' : 'Membro'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* CHAT TAB */}
              {activeTab === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card variant="glass" className="p-6">
                    <div className="h-96 overflow-y-auto mb-4 space-y-3">
                      {teamMessages.length > 0 ? (
                        teamMessages.map((msg) => (
                          <div key={msg.id} className={cn(
                            'flex gap-3',
                            msg.user_id === user?.id ? 'flex-row-reverse' : ''
                          )}>
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex-shrink-0" />
                            <div className={cn(
                              'max-w-[70%] rounded-lg p-3',
                              msg.user_id === user?.id 
                                ? 'bg-indigo-500/20 text-white' 
                                : 'bg-gray-800 text-gray-200'
                            )}>
                              <p className="text-xs font-medium mb-1">
                                {msg.user?.display_name || msg.user?.username || 'Utente'}
                              </p>
                              <p className="text-sm">{msg.message}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(msg.created_at).toLocaleTimeString('it-IT')}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-400 py-8">Nessun messaggio. Inizia la conversazione!</p>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Scrivi un messaggio..."
                        className="flex-1"
                      />
                      <Button variant="gradient" onClick={handleSendMessage}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* CHALLENGES TAB */}
              {activeTab === 'challenges' && (
                <motion.div
                  key="challenges"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {teamChallenges.length > 0 ? (
                    teamChallenges.map((challenge) => (
                      <Card key={challenge.id} variant="glass" className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-white">{challenge.title}</h3>
                            <p className="text-sm text-gray-400">{challenge.description}</p>
                          </div>
                          <span className={cn(
                            'text-xs px-2 py-1 rounded-full',
                            challenge.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            challenge.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            challenge.status === 'completed' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-gray-500/20 text-gray-400'
                          )}>
                            {challenge.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-gray-800/30 rounded-lg">
                            <p className="text-2xl font-bold text-white">{challenge.challenger_score}</p>
                            <p className="text-xs text-gray-400">
                              {challenge.challenger_team?.name}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-gray-800/30 rounded-lg">
                            <p className="text-2xl font-bold text-white">{challenge.challenged_score}</p>
                            <p className="text-xs text-gray-400">
                              {challenge.challenged_team?.name}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <Card variant="glass" className="p-12 text-center">
                      <Swords className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">Nessuna sfida attiva</p>
                      <Button variant="gradient" size="sm" className="mt-4">
                        Lancia una Sfida
                      </Button>
                    </Card>
                  )}
                </motion.div>
              )}

              {/* GOALS TAB */}
              {activeTab === 'goals' && (
                <motion.div
                  key="goals"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {teamGoals.length > 0 ? (
                    teamGoals.map((goal) => (
                      <Card key={goal.id} variant="glass" className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-white">{goal.title}</h3>
                            <p className="text-sm text-gray-400">{goal.description}</p>
                          </div>
                          {goal.is_completed && (
                            <Check className="w-6 h-6 text-green-500" />
                          )}
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Progresso</span>
                            <span className="text-white">
                              {goal.current_value}/{goal.target_value}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                              style={{ width: `${(goal.current_value / goal.target_value) * 100}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Zap className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm text-yellow-500">+{goal.reward_xp} XP</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Coins className="w-4 h-4 text-yellow-600" />
                              <span className="text-sm text-yellow-600">+{goal.reward_coins}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400">
                            Scade: {new Date(goal.end_date).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <Card variant="glass" className="p-12 text-center">
                      <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">Nessun obiettivo attivo</p>
                      {getUserRole(selectedTeam.id) && ['owner', 'admin'].includes(getUserRole(selectedTeam.id)!) && (
                        <Button variant="gradient" size="sm" className="mt-4">
                          Crea Obiettivo
                        </Button>
                      )}
                    </Card>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          // TEAMS LIST VIEW
          <>
            {/* Search and Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cerca team..."
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={filterType === 'all' ? 'gradient' : 'secondary'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                >
                  Tutti
                </Button>
                <Button
                  variant={filterType === 'friends' ? 'gradient' : 'secondary'}
                  size="sm"
                  onClick={() => setFilterType('friends')}
                >
                  👥 Amici
                </Button>
                <Button
                  variant={filterType === 'gym' ? 'gradient' : 'secondary'}
                  size="sm"
                  onClick={() => setFilterType('gym')}
                >
                  🏋️ Palestre
                </Button>
                <Button
                  variant={filterType === 'company' ? 'gradient' : 'secondary'}
                  size="sm"
                  onClick={() => setFilterType('company')}
                >
                  🏢 Aziende
                </Button>
              </div>
            </div>

            {/* My Teams */}
            {myTeams.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  I Miei Team
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myTeams
                    .filter(team => 
                      (filterType === 'all' || team.type === filterType) &&
                      team.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((team) => (
                      <TeamCard
                        key={team.id}
                        team={team}
                        isMyTeam={true}
                        onView={() => setSelectedTeam(team)}
                      />
                    ))}
                </div>
              </section>
            )}

            {/* Public Teams */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-400" />
                Team Pubblici
              </h2>
              {publicTeams.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {publicTeams
                    .filter(team => 
                      !myTeams.some(mt => mt.id === team.id) &&
                      (filterType === 'all' || team.type === filterType) &&
                      team.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((team) => (
                      <TeamCard
                        key={team.id}
                        team={team}
                        isMyTeam={false}
                        onView={() => setSelectedTeam(team)}
                        onJoin={() => handleJoinTeam(team.invite_code)}
                      />
                    ))}
                </div>
              ) : (
                <Card variant="glass" className="p-12 text-center">
                  <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Nessun team pubblico</h3>
                  <p className="text-gray-400 mb-6">
                    Sii il primo a creare un team pubblico nella tua zona!
                  </p>
                  <Button variant="gradient" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-5 h-5 mr-2" />
                    Crea il Primo Team
                  </Button>
                </Card>
              )}
            </section>
          </>
        )}
      </main>

      {/* Modals */}
      <CreateTeamModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateTeam}
      />
      
      <JoinTeamModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoin={handleJoinTeam}
      />
    </div>
  )
}