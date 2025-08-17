'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { 
  Users, Shield, AlertTriangle, Activity, TrendingUp, 
  Ban, CheckCircle, XCircle, Eye, Clock, Zap,
  UserCheck, UserX, BarChart3, Calendar, PlayCircle,
  AlertCircle, Search, Filter, Download, RefreshCw
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

// ====================================
// TYPES
// ====================================

interface AdminStats {
  totalUsers: number
  onlineUsers: number
  dailyActiveUsers: number
  weeklyActiveUsers: number
  totalDuels: number
  todayDuels: number
  avgSessionDuration: number
  totalRevenue: number
  suspiciousActivities: number
  pendingReviews: number
  bannedUsers: number
  verifiedUsers: number
}

interface SuspiciousActivity {
  id: string
  userId: string
  username: string
  exerciseId: string
  sessionId: string
  trustScore: number
  confidence: number
  violations: any[]
  videoUrl?: string
  evidence: any[]
  timestamp: string
  status: 'pending' | 'approved' | 'rejected' | 'banned'
  reviewedBy?: string
  reviewedAt?: string
}

interface UserManagement {
  id: string
  username: string
  email: string
  trustScore: number
  trustLevel: string
  totalDuels: number
  duelsWon: number
  reports: number
  warnings: number
  isBanned: boolean
  isVerified: boolean
  createdAt: string
  lastActive: string
}

interface CheatPattern {
  type: string
  count: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
}

// ====================================
// MAIN COMPONENT
// ====================================

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  // State
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'anticheat' | 'users' | 'analytics'>('overview')
  
  // Stats
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    onlineUsers: 0,
    dailyActiveUsers: 0,
    weeklyActiveUsers: 0,
    totalDuels: 0,
    todayDuels: 0,
    avgSessionDuration: 0,
    totalRevenue: 0,
    suspiciousActivities: 0,
    pendingReviews: 0,
    bannedUsers: 0,
    verifiedUsers: 0
  })
  
  // Data
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([])
  const [users, setUsers] = useState<UserManagement[]>([])
  const [cheatPatterns, setCheatPatterns] = useState<CheatPattern[]>([])
  const [activityData, setActivityData] = useState<any[]>([])
  const [duelTrends, setDuelTrends] = useState<any[]>([])
  const [userGrowth, setUserGrowth] = useState<any[]>([])
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<SuspiciousActivity | null>(null)
  
  // Modals
  const [showBanModal, setShowBanModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false)

  // ====================================
  // AUTH CHECK
  // ====================================

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      loadDashboardData()
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/login')
    }
  }

  // ====================================
  // DATA LOADING
  // ====================================

  const loadDashboardData = async () => {
    setLoading(true)
    
    try {
      await Promise.all([
        loadStats(),
        loadSuspiciousActivities(),
        loadUsers(),
        loadAnalytics()
      ])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Online users (active in last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const { count: onlineUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', fiveMinutesAgo)

      // Daily active users
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: dailyActiveUsers } = await supabase
        .from('user_stats')
        .select('*', { count: 'exact', head: true })
        .gte('last_active', today.toISOString())

      // Total duels
      const { count: totalDuels } = await supabase
        .from('duels')
        .select('*', { count: 'exact', head: true })

      // Today's duels
      const { count: todayDuels } = await supabase
        .from('duels')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

      // Suspicious activities
      const { count: suspiciousActivities } = await supabase
        .from('validation_results')
        .select('*', { count: 'exact', head: true })
        .eq('requires_review', true)
        .eq('status', 'pending')

      // Banned users
      const { count: bannedUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_banned', true)

      // Verified users
      const { count: verifiedUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true)

      setStats({
        totalUsers: totalUsers || 0,
        onlineUsers: onlineUsers || 0,
        dailyActiveUsers: dailyActiveUsers || 0,
        weeklyActiveUsers: 0, // Calculate from analytics
        totalDuels: totalDuels || 0,
        todayDuels: todayDuels || 0,
        avgSessionDuration: 0, // Calculate from sessions
        totalRevenue: 0, // From payments table
        suspiciousActivities: suspiciousActivities || 0,
        pendingReviews: suspiciousActivities || 0,
        bannedUsers: bannedUsers || 0,
        verifiedUsers: verifiedUsers || 0
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const loadSuspiciousActivities = async () => {
    try {
      const { data } = await supabase
        .from('validation_results')
        .select(`
          *,
          profiles!user_id (
            username,
            avatar_url
          )
        `)
        .eq('requires_review', true)
        .order('created_at', { ascending: false })
        .limit(100)

      if (data) {
        const activities = data.map(item => ({
          id: item.id,
          userId: item.user_id,
          username: item.profiles?.username || 'Unknown',
          exerciseId: item.exercise_id,
          sessionId: item.session_id,
          trustScore: item.trust_score,
          confidence: item.confidence,
          violations: item.violations || [],
          videoUrl: item.video_url,
          evidence: item.evidence || [],
          timestamp: item.created_at,
          status: item.status || 'pending',
          reviewedBy: item.reviewed_by,
          reviewedAt: item.reviewed_at
        }))
        
        setSuspiciousActivities(activities)
      }
    } catch (error) {
      console.error('Failed to load suspicious activities:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select(`
          *,
          user_stats (
            total_duels,
            duels_won,
            daily_streak
          ),
          trust_scores (
            score,
            trust_level
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (data) {
        const userList = data.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          trustScore: user.trust_scores?.[0]?.score || 50,
          trustLevel: user.trust_scores?.[0]?.trust_level || 'low',
          totalDuels: user.user_stats?.[0]?.total_duels || 0,
          duelsWon: user.user_stats?.[0]?.duels_won || 0,
          reports: 0, // Count from reports table
          warnings: user.warnings || 0,
          isBanned: user.is_banned || false,
          isVerified: user.is_verified || false,
          createdAt: user.created_at,
          lastActive: user.last_seen
        }))
        
        setUsers(userList)
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const loadAnalytics = async () => {
    try {
      // Load activity heatmap data
      const { data: sessions } = await supabase
        .from('anticheat_sessions')
        .select('started_at')
        .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      if (sessions) {
        // Process into hourly activity
        const hourlyActivity = Array(24).fill(0).map((_, hour) => ({
          hour: `${hour}:00`,
          count: sessions.filter(s => 
            new Date(s.started_at).getHours() === hour
          ).length
        }))
        setActivityData(hourlyActivity)
      }

      // Load duel trends (last 30 days)
      const last30Days = Array(30).fill(0).map((_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return date.toISOString().split('T')[0]
      }).reverse()

      const { data: duels } = await supabase
        .from('duels')
        .select('created_at')
        .gte('created_at', last30Days[0])

      if (duels) {
        const trendData = last30Days.map(date => ({
          date: new Date(date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
          duels: duels.filter(d => 
            d.created_at.startsWith(date)
          ).length
        }))
        setDuelTrends(trendData)
      }

      // User growth (last 30 days)
      const { data: newUsers } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', last30Days[0])

      if (newUsers) {
        const growthData = last30Days.map(date => ({
          date: new Date(date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
          users: newUsers.filter(u => 
            u.created_at.startsWith(date)
          ).length
        }))
        setUserGrowth(growthData)
      }

      // Cheat patterns
      const { data: violations } = await supabase
        .from('cheat_incidents')
        .select('violations')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      if (violations) {
        const patterns: { [key: string]: number } = {}
        violations.forEach(v => {
          v.violations?.forEach((violation: any) => {
            patterns[violation.type] = (patterns[violation.type] || 0) + 1
          })
        })

        const totalViolations = Object.values(patterns).reduce((a, b) => a + b, 0)
        const patternData = Object.entries(patterns).map(([type, count]) => ({
          type,
          count,
          percentage: (count / totalViolations) * 100,
          trend: 'stable' as const // Calculate actual trend
        }))
        
        setCheatPatterns(patternData)
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
    }
  }

  // ====================================
  // ACTIONS
  // ====================================

  const handleReviewActivity = async (
    activityId: string, 
    decision: 'approve' | 'reject' | 'ban'
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Update validation result
      await supabase
        .from('validation_results')
        .update({
          status: decision === 'approve' ? 'approved' : 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', activityId)

      // If ban, update user profile
      if (decision === 'ban') {
        const activity = suspiciousActivities.find(a => a.id === activityId)
        if (activity) {
          await supabase
            .from('profiles')
            .update({ 
              is_banned: true,
              banned_at: new Date().toISOString(),
              banned_by: user?.id
            })
            .eq('id', activity.userId)

          // Log the ban
          await supabase
            .from('admin_actions')
            .insert({
              admin_id: user?.id,
              action_type: 'ban',
              target_user_id: activity.userId,
              reason: 'Cheating detected',
              metadata: { activityId }
            })
        }
      }

      // Reload data
      loadSuspiciousActivities()
      loadStats()
    } catch (error) {
      console.error('Failed to review activity:', error)
    }
  }

  const handleBanUser = async (userId: string, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase
        .from('profiles')
        .update({ 
          is_banned: true,
          banned_at: new Date().toISOString(),
          banned_by: user?.id
        })
        .eq('id', userId)

      // Log action
      await supabase
        .from('admin_actions')
        .insert({
          admin_id: user?.id,
          action_type: 'ban',
          target_user_id: userId,
          reason
        })

      setShowBanModal(false)
      setSelectedUser(null)
      loadUsers()
      loadStats()
    } catch (error) {
      console.error('Failed to ban user:', error)
    }
  }

  const handleUnbanUser = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase
        .from('profiles')
        .update({ 
          is_banned: false,
          banned_at: null,
          banned_by: null
        })
        .eq('id', userId)

      // Log action
      await supabase
        .from('admin_actions')
        .insert({
          admin_id: user?.id,
          action_type: 'unban',
          target_user_id: userId
        })

      loadUsers()
      loadStats()
    } catch (error) {
      console.error('Failed to unban user:', error)
    }
  }

  const handleWarning = async (userId: string, message: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Increment warnings
      const targetUser = users.find(u => u.id === userId)
      await supabase
        .from('profiles')
        .update({ 
          warnings: (targetUser?.warnings || 0) + 1
        })
        .eq('id', userId)

      // Send notification
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'warning',
          title: 'Avvertimento Admin',
          message,
          created_by: user?.id
        })

      // Log action
      await supabase
        .from('admin_actions')
        .insert({
          admin_id: user?.id,
          action_type: 'warning',
          target_user_id: userId,
          reason: message
        })

      loadUsers()
    } catch (error) {
      console.error('Failed to send warning:', error)
    }
  }

  // ====================================
  // UI HELPERS
  // ====================================

  const getTrustLevelColor = (level: string) => {
    switch (level) {
      case 'verified': return 'text-green-400'
      case 'high': return 'text-blue-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-orange-400'
      case 'untrusted': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Approvato</span>
      case 'rejected':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">Rifiutato</span>
      case 'banned':
        return <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">Bannato</span>
      default:
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">In Attesa</span>
    }
  }

  // ====================================
  // RENDER
  // ====================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Caricamento dashboard admin...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Shield className="w-8 h-8 text-purple-500" />
              <h1 className="text-2xl font-bold">FitDuel Admin</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={loadDashboardData}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Aggiorna
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
              >
                Torna alla App
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 border-b-2 transition-colors ${
                activeTab === 'overview' 
                  ? 'border-purple-500 text-purple-400' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('anticheat')}
              className={`py-4 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'anticheat' 
                  ? 'border-purple-500 text-purple-400' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Anti-Cheat
              {stats.pendingReviews > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {stats.pendingReviews}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 border-b-2 transition-colors ${
                activeTab === 'users' 
                  ? 'border-purple-500 text-purple-400' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Utenti
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 border-b-2 transition-colors ${
                activeTab === 'analytics' 
                  ? 'border-purple-500 text-purple-400' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Utenti Totali</p>
                    <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                    <p className="text-green-400 text-sm">+12% questo mese</p>
                  </div>
                  <Users className="w-10 h-10 text-purple-500" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Utenti Online</p>
                    <p className="text-3xl font-bold text-white">{stats.onlineUsers}</p>
                    <p className="text-gray-400 text-sm">Ultimi 5 min</p>
                  </div>
                  <Activity className="w-10 h-10 text-green-500" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Sfide Oggi</p>
                    <p className="text-3xl font-bold text-white">{stats.todayDuels}</p>
                    <p className="text-blue-400 text-sm">Media: 45/giorno</p>
                  </div>
                  <Zap className="w-10 h-10 text-yellow-500" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Review Pendenti</p>
                    <p className="text-3xl font-bold text-white">{stats.pendingReviews}</p>
                    <p className="text-red-400 text-sm">Richiede attenzione</p>
                  </div>
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Duel Trends */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Trend Sfide (30 giorni)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={duelTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                      itemStyle={{ color: '#A78BFA' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="duels" 
                      stroke="#A78BFA" 
                      fill="#A78BFA" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* User Growth */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Crescita Utenti</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                      itemStyle={{ color: '#10B981' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ fill: '#10B981', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Activity Heatmap */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Attività Oraria</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="hour" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                      itemStyle={{ color: '#F59E0B' }}
                    />
                    <Bar dataKey="count" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Quick Stats */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Statistiche Rapide</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Utenti Verificati</span>
                    <span className="text-green-400 font-semibold">{stats.verifiedUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Utenti Bannati</span>
                    <span className="text-red-400 font-semibold">{stats.bannedUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Durata Media Sessione</span>
                    <span className="text-blue-400 font-semibold">12:34 min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Sfide Totali</span>
                    <span className="text-purple-400 font-semibold">{stats.totalDuels}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Anti-Cheat Tab */}
        {activeTab === 'anticheat' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Cerca per username o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
              >
                <option value="all">Tutti</option>
                <option value="pending">In Attesa</option>
                <option value="approved">Approvati</option>
                <option value="rejected">Rifiutati</option>
              </select>
            </div>

            {/* Suspicious Activities Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800 border-b border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Utente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Trust Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Confidence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Violazioni
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Stato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Azioni
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {suspiciousActivities
                      .filter(a => {
                        if (filterStatus !== 'all' && a.status !== filterStatus) return false
                        if (searchTerm && !a.username.toLowerCase().includes(searchTerm.toLowerCase())) return false
                        return true
                      })
                      .map(activity => (
                        <tr key={activity.id} className="hover:bg-gray-800/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-white">
                                {activity.username}
                              </div>
                              <div className="text-xs text-gray-400">
                                {activity.userId.substring(0, 8)}...
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`font-semibold ${
                              activity.trustScore >= 80 ? 'text-green-400' :
                              activity.trustScore >= 50 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {activity.trustScore}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`font-semibold ${
                              activity.confidence >= 0.8 ? 'text-red-400' :
                              activity.confidence >= 0.5 ? 'text-yellow-400' :
                              'text-green-400'
                            }`}>
                              {Math.round(activity.confidence * 100)}%
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {activity.violations.slice(0, 3).map((v: any, i: number) => (
                                <span key={i} className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                                  {v.type}
                                </span>
                              ))}
                              {activity.violations.length > 3 && (
                                <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded text-xs">
                                  +{activity.violations.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(activity.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {new Date(activity.timestamp).toLocaleDateString('it-IT')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {activity.videoUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedActivity(activity)
                                    setShowVideoModal(true)
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}
                              
                              {activity.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-400 border-green-400"
                                    onClick={() => handleReviewActivity(activity.id, 'approve')}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-400 border-red-400"
                                    onClick={() => handleReviewActivity(activity.id, 'reject')}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-purple-400 border-purple-400"
                                    onClick={() => handleReviewActivity(activity.id, 'ban')}
                                  >
                                    <Ban className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Cheat Patterns */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Pattern Cheating Rilevati</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cheatPatterns.map(pattern => (
                  <div key={pattern.type} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">{pattern.type}</span>
                      <span className={`text-sm ${
                        pattern.trend === 'up' ? 'text-red-400' :
                        pattern.trend === 'down' ? 'text-green-400' :
                        'text-yellow-400'
                      }`}>
                        {pattern.trend === 'up' ? '↑' : pattern.trend === 'down' ? '↓' : '→'}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-white">{pattern.count}</div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${pattern.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Cerca utente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            {/* Users Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800 border-b border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Utente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Trust Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Sfide
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Warnings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Stato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Ultima Attività
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Azioni
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {users
                      .filter(u => {
                        if (searchTerm && !u.username.toLowerCase().includes(searchTerm.toLowerCase())) return false
                        return true
                      })
                      .map(user => (
                        <tr key={user.id} className="hover:bg-gray-800/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-white">
                                {user.username}
                              </div>
                              <div className="text-xs text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${getTrustLevelColor(user.trustLevel)}`}>
                                {user.trustLevel}
                              </span>
                              <span className="text-gray-400 text-sm">
                                ({user.trustScore})
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <span className="text-white">{user.duelsWon}</span>
                              <span className="text-gray-400"> / {user.totalDuels}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.warnings === 0 ? 'bg-green-500/20 text-green-400' :
                              user.warnings < 3 ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {user.warnings}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.isBanned ? (
                              <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                                Bannato
                              </span>
                            ) : user.isVerified ? (
                              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                                Verificato
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded-full text-xs">
                                Attivo
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {new Date(user.lastActive).toLocaleDateString('it-IT')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setShowUserDetailsModal(true)
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              
                              {user.isBanned ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-400 border-green-400"
                                  onClick={() => handleUnbanUser(user.id)}
                                >
                                  <UserCheck className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-400 border-red-400"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setShowBanModal(true)
                                  }}
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-yellow-400 border-yellow-400"
                                onClick={() => {
                                  const message = prompt('Inserisci il messaggio di avvertimento:')
                                  if (message) handleWarning(user.id, message)
                                }}
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Advanced Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6 col-span-2">
                <h3 className="text-lg font-semibold mb-4">Metriche Performance</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={duelTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                    />
                    <Legend />
                    <Line 
                      name="Sfide"
                      type="monotone" 
                      dataKey="duels" 
                      stroke="#A78BFA" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Top Esercizi</h3>
                <div className="space-y-3">
                  {['Push-up', 'Squat', 'Plank', 'Burpees', 'Jumping Jacks'].map((exercise, i) => (
                    <div key={exercise} className="flex items-center justify-between">
                      <span className="text-gray-400">{exercise}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${100 - i * 15}%` }}
                          />
                        </div>
                        <span className="text-white text-sm font-semibold">
                          {1000 - i * 150}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Session Analytics */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Analisi Sessioni</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">12:34</div>
                  <div className="text-gray-400 text-sm mt-1">Durata Media</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">82%</div>
                  <div className="text-gray-400 text-sm mt-1">Completamento</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">3.4</div>
                  <div className="text-gray-400 text-sm mt-1">Sfide per Sessione</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">18:00</div>
                  <div className="text-gray-400 text-sm mt-1">Orario Picco</div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Modals */}
      {/* Ban Modal */}
      {showBanModal && selectedUser && (
        <Modal
          isOpen={showBanModal}
          onClose={() => {
            setShowBanModal(false)
            setSelectedUser(null)
          }}
          title="Conferma Ban Utente"
        >
          <div className="space-y-4">
            <p className="text-gray-300">
              Sei sicuro di voler bannare l'utente <strong>{selectedUser.username}</strong>?
            </p>
            
            <textarea
              placeholder="Motivo del ban..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              rows={3}
            />
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowBanModal(false)}
              >
                Annulla
              </Button>
              <Button
                onClick={() => handleBanUser(selectedUser.id, 'Cheating')}
                className="bg-red-600 hover:bg-red-700"
              >
                Conferma Ban
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Video Review Modal */}
      {showVideoModal && selectedActivity && (
        <Modal
          isOpen={showVideoModal}
          onClose={() => {
            setShowVideoModal(false)
            setSelectedActivity(null)
          }}
          title="Review Video Performance"
        >
          <div className="space-y-4">
            {selectedActivity.videoUrl ? (
              <video
                src={selectedActivity.videoUrl}
                controls
                className="w-full rounded-lg"
              />
            ) : (
              <p className="text-gray-400">Video non disponibile</p>
            )}
            
            <div className="space-y-2">
              <h4 className="font-semibold">Violazioni Rilevate:</h4>
              {selectedActivity.violations.map((v: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-gray-300">{v.description}</span>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => handleReviewActivity(selectedActivity.id, 'approve')}
                className="text-green-400 border-green-400"
              >
                Approva
              </Button>
              <Button
                variant="outline"
                onClick={() => handleReviewActivity(selectedActivity.id, 'reject')}
                className="text-red-400 border-red-400"
              >
                Rifiuta
              </Button>
              <Button
                onClick={() => handleReviewActivity(selectedActivity.id, 'ban')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Ban Utente
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}