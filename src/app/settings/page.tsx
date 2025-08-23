'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Settings, User, Camera, Bell, Shield, Palette,
  Save, CheckCircle, AlertCircle, Loader2, Target, Zap,
  TrendingUp, Award, Heart, Clock, Users, Globe, Lock,
  Mail, Smartphone, Eye, EyeOff, Trash2, Upload, Star,
  Activity, Calendar, BarChart3, Dumbbell, Play, Pause
} from 'lucide-react'

// Types
interface UserProfile {
  id: string
  username: string
  display_name: string | null
  email: string
  avatar_url: string | null
  created_at: string
}

interface CalibrationData {
  id?: string
  user_id: string
  age: number
  weight: number
  height: number
  gender: 'male' | 'female' | 'other'
  fitness_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  experience_years: number
  sport_background: string[]
  primary_activity_type: 'endurance' | 'strength' | 'power' | 'mixed' | 'flexibility'
  target_goals: string[]
  medical_conditions: string[]
  preferred_workout_duration: number
  ai_movement_calibrated: boolean
  calibration_score: number
  last_updated: string
}

interface NotificationSettings {
  challenges: boolean
  achievements: boolean
  friends: boolean
  marketing: boolean
  email_notifications: boolean
  push_notifications: boolean
}

// Settings Content Component
function SettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'calibration'
  
  const [activeTab, setActiveTab] = useState<'calibration' | 'account' | 'notifications' | 'privacy'>(initialTab as any)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Calibration states
  const [calibrationData, setCalibrationData] = useState<CalibrationData>({
    user_id: '',
    age: 25,
    weight: 70,
    height: 170,
    gender: 'male',
    fitness_level: 'intermediate',
    experience_years: 1,
    sport_background: [],
    primary_activity_type: 'mixed',
    target_goals: [],
    medical_conditions: [],
    preferred_workout_duration: 30,
    ai_movement_calibrated: false,
    calibration_score: 0,
    last_updated: new Date().toISOString()
  })
  
  const [calibrationStep, setCalibrationStep] = useState(1)
  const [showAICalibration, setShowAICalibration] = useState(false)
  const [aiCalibrationStatus, setAiCalibrationStatus] = useState<'idle' | 'running' | 'completed'>('idle')
  
  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    challenges: true,
    achievements: true,
    friends: true,
    marketing: false,
    email_notifications: true,
    push_notifications: true
  })

  // Fetch user data and calibration on load
  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check authentication
      const authResponse = await fetch('/api/auth/login', { method: 'GET' })
      
      if (!authResponse.ok) {
        router.push('/auth')
        return
      }

      const authData = await authResponse.json()
      
      if (!authData.authenticated) {
        router.push('/auth')
        return
      }

      setUser({
        id: authData.user.id,
        username: authData.user.username,
        display_name: authData.user.display_name || authData.user.username,
        email: authData.user.email,
        avatar_url: authData.user.avatar_url,
        created_at: authData.user.created_at
      })

      // Initialize calibration data with user ID
      setCalibrationData(prev => ({
        ...prev,
        user_id: authData.user.id
      }))

      // Try to fetch existing calibration data
      await fetchCalibrationData(authData.user.id)

    } catch (error) {
      console.error('Error fetching user data:', error)
      setError('Errore nel caricamento dei dati utente')
    } finally {
      setLoading(false)
    }
  }

  const fetchCalibrationData = async (userId: string) => {
    try {
      // Try to fetch from Supabase (you'll need to create this endpoint)
      const response = await fetch(`/api/calibration/${userId}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.calibration) {
          setCalibrationData(data.calibration)
        }
      }
    } catch (error) {
      console.log('No existing calibration data found - will create new')
    }
  }

  const saveCalibrationData = async () => {
    if (!user) return
    
    setSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      const response = await fetch('/api/calibration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...calibrationData,
          user_id: user.id,
          last_updated: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Errore nel salvataggio dei dati di calibrazione')
      }

      const result = await response.json()
      
      setSuccess('Calibrazione salvata con successo!')
      setCalibrationData(result.calibration)
      
      // Calculate XP bonus based on completion
      const completionBonus = calculateCalibrationBonus()
      if (completionBonus > 0) {
        setSuccess(`Calibrazione completata! +${completionBonus} XP bonus!`)
      }

    } catch (error: any) {
      console.error('Error saving calibration:', error)
      setError(error.message || 'Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const calculateCalibrationBonus = () => {
    const completedFields = [
      calibrationData.age > 0,
      calibrationData.weight > 0,
      calibrationData.height > 0,
      calibrationData.sport_background.length > 0,
      calibrationData.target_goals.length > 0,
      calibrationData.ai_movement_calibrated
    ].filter(Boolean).length

    return completedFields * 50 // 50 XP per field completed
  }

  const startAICalibration = async () => {
    setShowAICalibration(true)
    setAiCalibrationStatus('running')
    
    // Simulate AI calibration process
    setTimeout(() => {
      setAiCalibrationStatus('completed')
      setCalibrationData(prev => ({
        ...prev,
        ai_movement_calibrated: true,
        calibration_score: Math.floor(Math.random() * 20) + 80 // 80-100 score
      }))
      setSuccess('Calibrazione AI completata! Il sistema è ora ottimizzato per te.')
    }, 5000)
  }

  const tabs = [
    { 
      id: 'calibration', 
      label: 'Calibrazione AI', 
      icon: Camera, 
      description: 'Ottimizza il tracking movimento'
    },
    { 
      id: 'account', 
      label: 'Account', 
      icon: User, 
      description: 'Informazioni personali'
    },
    { 
      id: 'notifications', 
      label: 'Notifiche', 
      icon: Bell, 
      description: 'Gestisci le notifiche'
    },
    { 
      id: 'privacy', 
      label: 'Privacy', 
      icon: Shield, 
      description: 'Sicurezza e privacy'
    }
  ]

  const fitnessGoals = [
    { id: 'weight_loss', label: 'Perdita Peso', icon: '🔥' },
    { id: 'muscle_gain', label: 'Aumento Massa', icon: '💪' },
    { id: 'strength', label: 'Forza', icon: '🏋️' },
    { id: 'endurance', label: 'Resistenza', icon: '🏃' },
    { id: 'flexibility', label: 'Flessibilità', icon: '🧘' },
    { id: 'general_health', label: 'Salute Generale', icon: '❤️' }
  ]

  const sportActivities = [
    { 
      id: 'gym', 
      label: 'Palestra', 
      icon: '🏋️',
      type: 'strength',
      description: 'Allenamento con pesi e macchine'
    },
    { 
      id: 'crossfit', 
      label: 'CrossFit', 
      icon: '⚡',
      type: 'mixed',
      description: 'Allenamento funzionale ad alta intensità'
    },
    { 
      id: 'powerlifting', 
      label: 'Powerlifting', 
      icon: '💥',
      type: 'strength',
      description: 'Squat, bench press, deadlift'
    },
    { 
      id: 'running', 
      label: 'Corsa', 
      icon: '🏃',
      type: 'endurance',
      description: 'Corsa su strada, trail, maratone'
    },
    { 
      id: 'cycling', 
      label: 'Ciclismo', 
      icon: '🚴',
      type: 'endurance',
      description: 'Bici da strada, MTB, spinning'
    },
    { 
      id: 'swimming', 
      label: 'Nuoto', 
      icon: '🏊',
      type: 'endurance',
      description: 'Nuoto agonistico e fitness'
    },
    { 
      id: 'athletics', 
      label: 'Atletica', 
      icon: '🏃‍♂️',
      type: 'mixed',
      description: 'Velocità, salti, lanci'
    },
    { 
      id: 'martial_arts', 
      label: 'Arti Marziali', 
      icon: '🥋',
      type: 'mixed',
      description: 'Karate, judo, MMA, boxe'
    },
    { 
      id: 'soccer', 
      label: 'Calcio', 
      icon: '⚽',
      type: 'mixed',
      description: 'Sport di squadra con corsa'
    },
    { 
      id: 'basketball', 
      label: 'Basket', 
      icon: '🏀',
      type: 'power',
      description: 'Sport esplosivo e di agilità'
    },
    { 
      id: 'tennis', 
      label: 'Tennis', 
      icon: '🎾',
      type: 'power',
      description: 'Sport di racchetta esplosivo'
    },
    { 
      id: 'yoga', 
      label: 'Yoga', 
      icon: '🧘',
      type: 'flexibility',
      description: 'Flessibilità e mindfulness'
    },
    { 
      id: 'pilates', 
      label: 'Pilates', 
      icon: '🤸',
      type: 'flexibility',
      description: 'Core stability e postura'
    },
    { 
      id: 'calisthenics', 
      label: 'Calisthenics', 
      icon: '🤸‍♂️',
      type: 'strength',
      description: 'Allenamento a corpo libero'
    },
    { 
      id: 'dancing', 
      label: 'Danza', 
      icon: '💃',
      type: 'mixed',
      description: 'Ballo e coreografie fitness'
    },
    { 
      id: 'other', 
      label: 'Altro', 
      icon: '🏃‍♀️',
      type: 'mixed',
      description: 'Altre attività sportive'
    }
  ]

  // Auto-calculate primary activity type based on selected sports
  const calculatePrimaryActivityType = (selectedSports: string[]) => {
    if (selectedSports.length === 0) return 'mixed'
    
    const types = selectedSports.map(sportId => 
      sportActivities.find(s => s.id === sportId)?.type || 'mixed'
    )
    
    const typeCounts = types.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(typeCounts).sort(([,a], [,b]) => b - a)[0][0] as CalibrationData['primary_activity_type']
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Caricamento impostazioni...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2 text-green-400 hover:text-green-300">
                <ArrowLeft className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
              <div className="flex items-center gap-2">
                <Settings className="w-6 h-6 text-white" />
                <span className="text-xl font-bold text-white">Impostazioni</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Success/Error Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <p className="text-red-400">{error}</p>
            </motion.div>
          )}
          
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start space-x-3"
            >
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <p className="text-green-400">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 sticky top-24">
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                        isActive
                          ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 text-white border border-green-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <div>
                        <div className="font-medium">{tab.label}</div>
                        <div className="text-xs text-slate-500">{tab.description}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {/* Calibrazione AI Tab */}
              {activeTab === 'calibration' && (
                <motion.div
                  key="calibration"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Calibration Status */}
                  <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Camera className="w-6 h-6 text-green-400" />
                        Stato Calibrazione
                      </h2>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                        calibrationData.ai_movement_calibrated 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {calibrationData.ai_movement_calibrated ? 'Calibrata' : 'Non Calibrata'}
                      </div>
                    </div>

                    {calibrationData.ai_movement_calibrated ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex justify-between mb-2">
                              <span className="text-slate-300">Score Calibrazione</span>
                              <span className="text-green-400 font-bold">{calibrationData.calibration_score}%</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${calibrationData.calibration_score}%` }}
                                transition={{ duration: 1 }}
                              />
                            </div>
                          </div>
                          <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                        <p className="text-slate-400">
                          Il sistema AI è calibrato per ottimizzare il tracking dei tuoi movimenti. 
                          Ricalibra periodicamente per mantenere la precisione.
                        </p>
                        <button
                          onClick={() => setShowAICalibration(true)}
                          className="w-full py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 
                            border border-blue-500/30 rounded-xl text-blue-400 font-bold
                            hover:bg-blue-500/30 transition-all"
                        >
                          Ricalibrare
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center py-8">
                          <Camera className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                          <h3 className="text-lg font-bold text-white mb-2">Calibrazione Non Completata</h3>
                          <p className="text-slate-400 mb-6">
                            La calibrazione AI ottimizza il tracking movimento per sessioni di allenamento più precise.
                            <span className="text-yellow-400 font-semibold"> +300 XP bonus</span> per il completamento!
                          </p>
                          <button
                            onClick={startAICalibration}
                            className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 
                              rounded-xl text-white font-bold hover:shadow-lg hover:shadow-green-500/25 
                              transition-all transform hover:scale-105"
                          >
                            Inizia Calibrazione AI
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Personal Information */}
                  <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-400" />
                      Informazioni Personali
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Età</label>
                        <input
                          type="number"
                          value={calibrationData.age}
                          onChange={(e) => setCalibrationData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl 
                            text-white focus:border-green-500 focus:outline-none"
                          min="13"
                          max="100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Sesso</label>
                        <select
                          value={calibrationData.gender}
                          onChange={(e) => setCalibrationData(prev => ({ ...prev, gender: e.target.value as any }))}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl 
                            text-white focus:border-green-500 focus:outline-none"
                        >
                          <option value="male">Maschio</option>
                          <option value="female">Femmina</option>
                          <option value="other">Altro</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Peso (kg)</label>
                        <input
                          type="number"
                          value={calibrationData.weight}
                          onChange={(e) => setCalibrationData(prev => ({ ...prev, weight: parseInt(e.target.value) }))}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl 
                            text-white focus:border-green-500 focus:outline-none"
                          min="30"
                          max="200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Altezza (cm)</label>
                        <input
                          type="number"
                          value={calibrationData.height}
                          onChange={(e) => setCalibrationData(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl 
                            text-white focus:border-green-500 focus:outline-none"
                          min="100"
                          max="250"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sport Background & Activity Type */}
                  <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-green-400" />
                      Background Sportivo
                    </h3>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-300 mb-3">
                        Seleziona le attività che pratichi o hai praticato
                      </label>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {sportActivities.map((sport) => (
                          <button
                            key={sport.id}
                            onClick={() => {
                              const newSports = calibrationData.sport_background.includes(sport.id)
                                ? calibrationData.sport_background.filter(s => s !== sport.id)
                                : [...calibrationData.sport_background, sport.id]
                              
                              setCalibrationData(prev => ({
                                ...prev,
                                sport_background: newSports,
                                primary_activity_type: calculatePrimaryActivityType(newSports)
                              }))
                            }}
                            className={`p-3 rounded-xl border transition-all text-left group ${
                              calibrationData.sport_background.includes(sport.id)
                                ? 'bg-green-500/20 border-green-500/50 text-white'
                                : 'bg-slate-700/30 border-slate-600/50 text-slate-300 hover:border-green-500/30'
                            }`}
                          >
                            <div className="text-xl mb-1">{sport.icon}</div>
                            <div className="font-medium text-sm">{sport.label}</div>
                            <div className={`text-xs mt-1 transition-opacity ${
                              calibrationData.sport_background.includes(sport.id)
                                ? 'text-green-300 opacity-100'
                                : 'text-slate-500 opacity-0 group-hover:opacity-100'
                            }`}>
                              {sport.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Activity Type Auto-Detection */}
                    {calibrationData.sport_background.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-4 bg-slate-700/20 rounded-xl border border-slate-600/30"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Target className="w-5 h-5 text-blue-400" />
                          <h4 className="font-medium text-white">Categoria Principale Rilevata</h4>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                            calibrationData.primary_activity_type === 'endurance' ? 'bg-blue-500/20 text-blue-400' :
                            calibrationData.primary_activity_type === 'strength' ? 'bg-red-500/20 text-red-400' :
                            calibrationData.primary_activity_type === 'power' ? 'bg-yellow-500/20 text-yellow-400' :
                            calibrationData.primary_activity_type === 'flexibility' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {calibrationData.primary_activity_type === 'endurance' ? '🏃 Endurance' :
                             calibrationData.primary_activity_type === 'strength' ? '💪 Forza' :
                             calibrationData.primary_activity_type === 'power' ? '⚡ Potenza' :
                             calibrationData.primary_activity_type === 'flexibility' ? '🧘 Flessibilità' :
                             '🔄 Misto'}
                          </div>
                          <p className="text-sm text-slate-400">
                            Basato sulle attività selezionate, il sistema ti categorizza come atleta orientato alla{' '}
                            <span className="text-white font-medium">
                              {calibrationData.primary_activity_type === 'endurance' ? 'resistenza' :
                               calibrationData.primary_activity_type === 'strength' ? 'forza' :
                               calibrationData.primary_activity_type === 'power' ? 'potenza esplosiva' :
                               calibrationData.primary_activity_type === 'flexibility' ? 'flessibilità' :
                               'preparazione mista'}
                            </span>
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Fitness Experience */}
                  <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-purple-400" />
                      Esperienza Fitness
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Livello Fitness</label>
                        <select
                          value={calibrationData.fitness_level}
                          onChange={(e) => setCalibrationData(prev => ({ ...prev, fitness_level: e.target.value as any }))}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl 
                            text-white focus:border-green-500 focus:outline-none"
                        >
                          <option value="beginner">Principiante (0-6 mesi)</option>
                          <option value="intermediate">Intermedio (6 mesi - 2 anni)</option>
                          <option value="advanced">Avanzato (2-5 anni)</option>
                          <option value="expert">Esperto (5+ anni)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Durata Allenamento Preferita</label>
                        <select
                          value={calibrationData.preferred_workout_duration}
                          onChange={(e) => setCalibrationData(prev => ({ ...prev, preferred_workout_duration: parseInt(e.target.value) }))}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl 
                            text-white focus:border-green-500 focus:outline-none"
                        >
                          <option value={15}>15 minuti</option>
                          <option value={30}>30 minuti</option>
                          <option value={45}>45 minuti</option>
                          <option value={60}>60 minuti</option>
                          <option value={90}>90+ minuti</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Fitness Goals */}
                  <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-yellow-400" />
                      Obiettivi Fitness
                    </h3>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {fitnessGoals.map((goal) => (
                        <button
                          key={goal.id}
                          onClick={() => {
                            setCalibrationData(prev => ({
                              ...prev,
                              target_goals: prev.target_goals.includes(goal.id)
                                ? prev.target_goals.filter(g => g !== goal.id)
                                : [...prev.target_goals, goal.id]
                            }))
                          }}
                          className={`p-4 rounded-xl border transition-all text-left ${
                            calibrationData.target_goals.includes(goal.id)
                              ? 'bg-green-500/20 border-green-500/50 text-white'
                              : 'bg-slate-700/30 border-slate-600/50 text-slate-300 hover:border-green-500/30'
                          }`}
                        >
                          <div className="text-2xl mb-2">{goal.icon}</div>
                          <div className="font-medium">{goal.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={saveCalibrationData}
                      disabled={saving}
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 
                        rounded-xl text-white font-bold hover:shadow-lg hover:shadow-green-500/25 
                        transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Salvataggio...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Salva Calibrazione
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <User className="w-6 h-6 text-blue-400" />
                      Informazioni Account
                    </h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                        <input
                          type="text"
                          value={user.username}
                          disabled
                          className="w-full px-4 py-3 bg-slate-700/30 border border-slate-600/50 rounded-xl 
                            text-slate-400 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                        <input
                          type="email"
                          value={user.email}
                          disabled
                          className="w-full px-4 py-3 bg-slate-700/30 border border-slate-600/50 rounded-xl 
                            text-slate-400 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Nome Visualizzato</label>
                        <input
                          type="text"
                          value={user.display_name || ''}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl 
                            text-white focus:border-green-500 focus:outline-none"
                          placeholder="Inserisci nome visualizzato"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Bell className="w-6 h-6 text-yellow-400" />
                      Gestione Notifiche
                    </h2>
                    
                    <div className="space-y-4">
                      {[
                        { key: 'challenges', label: 'Sfide e Duelli', description: 'Notifiche per nuove sfide' },
                        { key: 'achievements', label: 'Achievement', description: 'Notifiche per traguardi raggiunti' },
                        { key: 'friends', label: 'Amici', description: 'Attività degli amici' },
                        { key: 'marketing', label: 'Marketing', description: 'Promozioni e novità' },
                        { key: 'email_notifications', label: 'Email', description: 'Notifiche via email' },
                        { key: 'push_notifications', label: 'Push', description: 'Notifiche push del browser' }
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                          <div>
                            <div className="font-medium text-white">{item.label}</div>
                            <div className="text-sm text-slate-400">{item.description}</div>
                          </div>
                          <button
                            onClick={() => setNotifications(prev => ({
                              ...prev,
                              [item.key]: !prev[item.key as keyof NotificationSettings]
                            }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              notifications[item.key as keyof NotificationSettings] 
                                ? 'bg-green-500' 
                                : 'bg-slate-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                notifications[item.key as keyof NotificationSettings] 
                                  ? 'translate-x-6' 
                                  : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <motion.div
                  key="privacy"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Shield className="w-6 h-6 text-red-400" />
                      Privacy e Sicurezza
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-700/30 rounded-xl">
                        <h3 className="font-medium text-white mb-2">Cambia Password</h3>
                        <p className="text-sm text-slate-400 mb-4">Aggiorna la tua password per mantenere l'account sicuro</p>
                        <button className="px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 
                          hover:bg-blue-500/30 transition-all">
                          Cambia Password
                        </button>
                      </div>

                      <div className="p-4 bg-slate-700/30 rounded-xl">
                        <h3 className="font-medium text-white mb-2">Elimina Account</h3>
                        <p className="text-sm text-slate-400 mb-4">Elimina permanentemente il tuo account e tutti i dati associati</p>
                        <button className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 
                          hover:bg-red-500/30 transition-all">
                          Elimina Account
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* AI Calibration Modal */}
      <AnimatePresence>
        {showAICalibration && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => aiCalibrationStatus === 'completed' && setShowAICalibration(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-8 border border-green-500/20 
                  max-w-md w-full text-center"
                onClick={(e) => e.stopPropagation()}
              >
                {aiCalibrationStatus === 'running' && (
                  <div>
                    <div className="w-20 h-20 mx-auto mb-6 relative">
                      <div className="absolute inset-0 border-4 border-green-500/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-transparent border-t-green-500 
                        rounded-full animate-spin"></div>
                      <Camera className="w-8 h-8 text-green-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">Calibrazione in Corso</h3>
                    <p className="text-slate-400 mb-6">
                      Il sistema sta analizzando i tuoi parametri per ottimizzare il tracking movimento...
                    </p>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <motion.div
                        className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                        animate={{ width: ['0%', '100%'] }}
                        transition={{ duration: 4, ease: 'linear' }}
                      />
                    </div>
                  </div>
                )}

                {aiCalibrationStatus === 'completed' && (
                  <div>
                    <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">Calibrazione Completata!</h3>
                    <p className="text-slate-400 mb-6">
                      Il sistema AI è ora calibrato per i tuoi parametri. Score: <span className="text-green-400 font-bold">{calibrationData.calibration_score}%</span>
                    </p>
                    <button
                      onClick={() => {
                        setShowAICalibration(false)
                        saveCalibrationData()
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 
                        rounded-xl text-white font-bold hover:shadow-lg transition-all"
                    >
                      Continua
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Main Settings Page with Suspense wrapper
export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Caricamento impostazioni...</p>
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}