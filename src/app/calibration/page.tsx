'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Calendar, Activity, Target, Award, ChevronRight, 
  AlertCircle, CheckCircle, Timer, Zap, TrendingUp, SkipForward,
  FastForward, Save, Edit, X
} from 'lucide-react'
import AIExerciseTracker from '@/components/game/ai-tracker/AIExerciseTracker'
import { supabase } from '@/lib/supabase-client'
import { useUserStore } from '@/stores/useUserStore'
import { calculateUserHandicap } from '@/utils/handicapSystem'
import confetti from 'canvas-confetti'

// ====================================
// TYPES
// ====================================

interface CalibrationStep {
  id: string
  title: string
  description: string
  icon: any
  field?: string
  type: 'info' | 'test' | 'complete'
  exercise?: string
  targetReps?: number
  duration?: number
  unit?: string
}

interface UserInfo {
  age: number
  gender: 'male' | 'female' | 'other'
  weight: number
  height: number
  fitness_level: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  training_frequency: number
  fitness_experience_years: number
  has_limitations: boolean
  limitations: string[]
}

interface TestResults {
  pushups_count: number
  squats_count: number
  plank_duration: number
  jumping_jacks_count: number
  burpees_count: number
  lunges_count: number
  mountain_climbers_count: number
  high_knees_count: number
}

interface PerformanceData {
  exerciseId: string
  userId: string
  formScore: number
  repsCompleted: number
  duration: number
  caloriesBurned: number
  timestamp: string
}

// ====================================
// CALIBRATION STEPS
// ====================================

const CALIBRATION_STEPS: CalibrationStep[] = [
  {
    id: 'welcome',
    title: 'Benvenuto alla Calibrazione!',
    description: 'Personalizzeremo la tua esperienza fitness in base alle tue capacità.',
    icon: Award,
    type: 'info'
  },
  {
    id: 'age',
    title: 'Età',
    description: 'Quanti anni hai?',
    icon: Calendar,
    field: 'age',
    type: 'info'
  },
  {
    id: 'gender',
    title: 'Genere',
    description: 'Seleziona il tuo genere',
    icon: User,
    field: 'gender',
    type: 'info'
  },
  {
    id: 'weight',
    title: 'Peso',
    description: 'Inserisci il tuo peso in kg',
    icon: Activity,
    field: 'weight',
    type: 'info',
    unit: 'kg'
  },
  {
    id: 'height',
    title: 'Altezza',
    description: 'Inserisci la tua altezza in cm',
    icon: TrendingUp,
    field: 'height',
    type: 'info',
    unit: 'cm'
  },
  {
    id: 'fitness_level',
    title: 'Livello Fitness',
    description: 'Come valuteresti il tuo livello di forma fisica?',
    icon: Target,
    field: 'fitness_level',
    type: 'info'
  },
  {
    id: 'frequency',
    title: 'Frequenza Allenamento',
    description: 'Quanti giorni a settimana ti alleni?',
    icon: Timer,
    field: 'training_frequency',
    type: 'info',
    unit: 'giorni/settimana'
  },
  {
    id: 'experience',
    title: 'Esperienza',
    description: 'Da quanti anni ti alleni regolarmente?',
    icon: Award,
    field: 'fitness_experience_years',
    type: 'info',
    unit: 'anni'
  },
  {
    id: 'limitations',
    title: 'Limitazioni',
    description: 'Hai limitazioni fisiche o infortuni?',
    icon: AlertCircle,
    field: 'has_limitations',
    type: 'info'
  },
  // Test fisici
  {
    id: 'pushups',
    title: 'Test Push-ups',
    description: 'Fai il massimo numero di push-ups con forma corretta',
    icon: Zap,
    type: 'test',
    exercise: 'pushups',
    targetReps: 50,
    field: 'pushups_count'
  },
  {
    id: 'squats',
    title: 'Test Squats',
    description: 'Fai il massimo numero di squats con forma corretta',
    icon: Zap,
    type: 'test',
    exercise: 'squats',
    targetReps: 50,
    field: 'squats_count'
  },
  {
    id: 'plank',
    title: 'Test Plank',
    description: 'Mantieni la posizione di plank il più a lungo possibile',
    icon: Timer,
    type: 'test',
    exercise: 'plank',
    duration: 120,
    field: 'plank_duration',
    unit: 'secondi'
  },
  {
    id: 'jumping_jacks',
    title: 'Test Jumping Jacks',
    description: 'Fai il massimo numero di jumping jacks in 30 secondi',
    icon: Zap,
    type: 'test',
    exercise: 'jumping_jacks',
    targetReps: 50,
    duration: 30,
    field: 'jumping_jacks_count'
  },
  {
    id: 'complete',
    title: 'Calibrazione Completata!',
    description: 'Il tuo profilo fitness è stato creato con successo.',
    icon: CheckCircle,
    type: 'complete'
  }
]

// ====================================
// MAIN COMPONENT
// ====================================

export default function CalibrationPage() {
  const router = useRouter()
  const { user, updateUser } = useUserStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [showAITracker, setShowAITracker] = useState(false)
  const [loading, setLoading] = useState(false)
  const [manualInput, setManualInput] = useState(false)
  const [manualValue, setManualValue] = useState('')
  
  // User info state
  const [userInfo, setUserInfo] = useState<UserInfo>({
    age: 25,
    gender: 'male',
    weight: 70,
    height: 175,
    fitness_level: 'intermediate',
    training_frequency: 3,
    fitness_experience_years: 1,
    has_limitations: false,
    limitations: []
  })
  
  // Test results state
  const [testResults, setTestResults] = useState<TestResults>({
    pushups_count: 0,
    squats_count: 0,
    plank_duration: 0,
    jumping_jacks_count: 0,
    burpees_count: 0,
    lunges_count: 0,
    mountain_climbers_count: 0,
    high_knees_count: 0
  })

  const currentStepData = CALIBRATION_STEPS[currentStep]
  const progress = ((currentStep + 1) / CALIBRATION_STEPS.length) * 100

  // ====================================
  // HANDLERS
  // ====================================

  const handleNext = () => {
    if (currentStep < CALIBRATION_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
      setShowAITracker(false)
      setManualInput(false)
      setManualValue('')
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      setShowAITracker(false)
      setManualInput(false)
    }
  }

  const handleSkipTest = () => {
    // Imposta valore di default per il test corrente
    if (currentStepData.field) {
      const defaultValues: Record<string, number> = {
        pushups_count: 15,
        squats_count: 20,
        plank_duration: 30,
        jumping_jacks_count: 25,
        burpees_count: 10,
        lunges_count: 15,
        mountain_climbers_count: 20,
        high_knees_count: 30
      }
      
      setTestResults(prev => ({
        ...prev,
        [currentStepData.field!]: defaultValues[currentStepData.field!] || 0
      }))
    }
    
    handleNext()
  }

  const handleQuickComplete = async () => {
    // Imposta valori di default per tutti i test
    const quickResults: TestResults = {
      pushups_count: 20,
      squats_count: 30,
      plank_duration: 45,
      jumping_jacks_count: 35,
      burpees_count: 15,
      lunges_count: 20,
      mountain_climbers_count: 25,
      high_knees_count: 35
    }
    
    setTestResults(quickResults)
    
    // Vai direttamente al completamento
    setCurrentStep(CALIBRATION_STEPS.length - 1)
    
    // Salva automaticamente
    setTimeout(() => {
      handleComplete(quickResults)
    }, 1000)
  }

  const handleManualInput = () => {
    setManualInput(true)
    setShowAITracker(false)
  }

  const handleSaveManualValue = () => {
    const value = parseInt(manualValue) || 0
    if (currentStepData.field) {
      setTestResults(prev => ({
        ...prev,
        [currentStepData.field!]: value
      }))
    }
    setManualInput(false)
    handleNext()
  }

  const handleStartTest = () => {
    setShowAITracker(true)
    setManualInput(false)
  }

  const handleExerciseComplete = (data: PerformanceData) => {
    // Salva i risultati del test
    if (currentStepData.field) {
      const value = currentStepData.exercise === 'plank' 
        ? Math.round(data.duration)
        : data.repsCompleted
        
      setTestResults(prev => ({
        ...prev,
        [currentStepData.field!]: value
      }))
    }
    
    setShowAITracker(false)
    handleNext()
  }

  const handleComplete = async (customResults?: TestResults) => {
    setLoading(true)
    
    try {
      const finalResults = customResults || testResults
      
      // Calcola l'handicap score
      const calibrationData = {
        ...userInfo,
        ...finalResults,
        calibration_score: calculateUserHandicap({
          ...userInfo,
          ...finalResults,
          calibration_score: 0,
          assigned_level: 'bronze',
          base_handicap: 1
        }),
        assigned_level: determineLevel(finalResults),
        base_handicap: 1
      }
      
      // Salva nel database
      if (user?.id) {
        const { error } = await supabase
          .from('user_calibration')
          .insert({
            user_id: user.id,
            ...calibrationData,
            created_at: new Date().toISOString()
          })
        
        if (error) {
          console.error('Error saving calibration:', error)
        }
      }
      
      // Salva in localStorage come backup
      localStorage.setItem('fitduel_calibration', JSON.stringify(calibrationData))
      localStorage.setItem('fitduel_calibration_complete', 'true')
      
      // Aggiorna user store con il nuovo livello
      const newLevel = getLevelNumber(calibrationData.assigned_level)
      updateUser({
        level: newLevel,
        fitnessLevel: calibrationData.fitness_level as 'beginner' | 'intermediate' | 'advanced'
      })
      
      // Celebrazione
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
      
      // Redirect dopo 2 secondi
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
      
    } catch (error) {
      console.error('Calibration error:', error)
      // Vai comunque alla dashboard
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  // ====================================
  // HELPERS
  // ====================================

  const determineLevel = (results: TestResults): string => {
    const score = 
      results.pushups_count * 2 +
      results.squats_count * 1.5 +
      results.plank_duration +
      results.jumping_jacks_count * 0.5
    
    if (score > 200) return 'elite'
    if (score > 150) return 'gold'
    if (score > 100) return 'silver'
    if (score > 50) return 'bronze'
    return 'rookie'
  }

  const getLevelNumber = (level: string): number => {
    const levels: Record<string, number> = {
      rookie: 1,
      bronze: 5,
      silver: 10,
      gold: 15,
      elite: 20
    }
    return levels[level] || 1
  }

  // ====================================
  // RENDER
  // ====================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.15)_0%,transparent_50%)]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">Calibrazione Fitness</h1>
            
            {/* Quick Actions */}
            <div className="flex gap-2">
              {currentStep > 0 && currentStep < CALIBRATION_STEPS.length - 1 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleQuickComplete}
                  className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg
                    text-yellow-400 font-bold hover:bg-yellow-500/30 transition-all
                    flex items-center gap-2"
                >
                  <FastForward className="w-4 h-4" />
                  Completa Rapidamente
                </motion.button>
              )}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="bg-slate-800/50 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-sm text-slate-400 mt-2">
            Step {currentStep + 1} di {CALIBRATION_STEPS.length}
          </p>
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50"
          >
            {/* Step Header */}
            <div className="text-center mb-8">
              <div className="inline-flex p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 
                rounded-2xl mb-4">
                <currentStepData.icon className="w-12 h-12 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{currentStepData.title}</h2>
              <p className="text-slate-400">{currentStepData.description}</p>
            </div>

            {/* Step Content */}
            {currentStepData.type === 'info' && (
              <div className="space-y-6">
                {/* Age */}
                {currentStepData.field === 'age' && (
                  <div className="space-y-4">
                    <input
                      type="number"
                      value={userInfo.age}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, age: parseInt(e.target.value) || 18 }))}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg
                        text-white text-center text-2xl focus:outline-none focus:border-green-500"
                      min="16"
                      max="100"
                    />
                    <p className="text-center text-slate-500">anni</p>
                  </div>
                )}

                {/* Gender */}
                {currentStepData.field === 'gender' && (
                  <div className="grid grid-cols-3 gap-4">
                    {['male', 'female', 'other'].map(gender => (
                      <button
                        key={gender}
                        onClick={() => setUserInfo(prev => ({ ...prev, gender: gender as any }))}
                        className={`p-4 rounded-lg border transition-all ${
                          userInfo.gender === gender
                            ? 'bg-green-500/20 border-green-500 text-green-400'
                            : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {gender === 'male' ? 'Maschio' : gender === 'female' ? 'Femmina' : 'Altro'}
                      </button>
                    ))}
                  </div>
                )}

                {/* Weight */}
                {currentStepData.field === 'weight' && (
                  <div className="space-y-4">
                    <input
                      type="number"
                      value={userInfo.weight}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, weight: parseInt(e.target.value) || 50 }))}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg
                        text-white text-center text-2xl focus:outline-none focus:border-green-500"
                      min="30"
                      max="200"
                    />
                    <p className="text-center text-slate-500">kg</p>
                  </div>
                )}

                {/* Height */}
                {currentStepData.field === 'height' && (
                  <div className="space-y-4">
                    <input
                      type="number"
                      value={userInfo.height}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, height: parseInt(e.target.value) || 160 }))}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg
                        text-white text-center text-2xl focus:outline-none focus:border-green-500"
                      min="120"
                      max="250"
                    />
                    <p className="text-center text-slate-500">cm</p>
                  </div>
                )}

                {/* Fitness Level */}
                {currentStepData.field === 'fitness_level' && (
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'beginner', label: 'Principiante', desc: 'Nuovo al fitness' },
                      { value: 'intermediate', label: 'Intermedio', desc: '1-3 anni esperienza' },
                      { value: 'advanced', label: 'Avanzato', desc: '3-5 anni esperienza' },
                      { value: 'elite', label: 'Elite', desc: '5+ anni esperienza' }
                    ].map(level => (
                      <button
                        key={level.value}
                        onClick={() => setUserInfo(prev => ({ ...prev, fitness_level: level.value as any }))}
                        className={`p-4 rounded-lg border transition-all text-left ${
                          userInfo.fitness_level === level.value
                            ? 'bg-green-500/20 border-green-500'
                            : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <p className={`font-bold ${
                          userInfo.fitness_level === level.value ? 'text-green-400' : 'text-white'
                        }`}>
                          {level.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{level.desc}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Training Frequency */}
                {currentStepData.field === 'training_frequency' && (
                  <div className="space-y-4">
                    <input
                      type="range"
                      value={userInfo.training_frequency}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, training_frequency: parseInt(e.target.value) }))}
                      className="w-full"
                      min="0"
                      max="7"
                    />
                    <p className="text-center text-2xl font-bold text-white">
                      {userInfo.training_frequency} giorni/settimana
                    </p>
                  </div>
                )}

                {/* Experience Years */}
                {currentStepData.field === 'fitness_experience_years' && (
                  <div className="space-y-4">
                    <input
                      type="number"
                      value={userInfo.fitness_experience_years}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, fitness_experience_years: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg
                        text-white text-center text-2xl focus:outline-none focus:border-green-500"
                      min="0"
                      max="50"
                    />
                    <p className="text-center text-slate-500">anni di esperienza</p>
                  </div>
                )}

                {/* Limitations */}
                {currentStepData.field === 'has_limitations' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setUserInfo(prev => ({ ...prev, has_limitations: false }))}
                        className={`p-4 rounded-lg border transition-all ${
                          !userInfo.has_limitations
                            ? 'bg-green-500/20 border-green-500 text-green-400'
                            : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        No, nessuna limitazione
                      </button>
                      <button
                        onClick={() => setUserInfo(prev => ({ ...prev, has_limitations: true }))}
                        className={`p-4 rounded-lg border transition-all ${
                          userInfo.has_limitations
                            ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                            : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        Sì, ho delle limitazioni
                      </button>
                    </div>
                    
                    {userInfo.has_limitations && (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-yellow-400 text-sm">
                          Gli esercizi verranno adattati alle tue esigenze
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Test Content */}
            {currentStepData.type === 'test' && (
              <div className="space-y-6">
                {!showAITracker && !manualInput ? (
                  <div className="space-y-4">
                    {/* Current Value Display */}
                    {testResults[currentStepData.field as keyof TestResults] > 0 && (
                      <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-green-400 text-sm mb-1">Valore attuale:</p>
                        <p className="text-2xl font-bold text-white">
                          {testResults[currentStepData.field as keyof TestResults]} 
                          {currentStepData.unit && ` ${currentStepData.unit}`}
                        </p>
                      </div>
                    )}
                    
                    {/* Test Options */}
                    <div className="grid grid-cols-1 gap-3">
                      <button
                        onClick={handleStartTest}
                        className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg
                          text-white font-bold hover:shadow-lg hover:shadow-green-500/25 
                          transition-all flex items-center justify-center gap-2"
                      >
                        <Activity className="w-5 h-5" />
                        Inizia Test con AI
                      </button>
                      
                      <button
                        onClick={handleManualInput}
                        className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg
                          text-white font-bold hover:bg-slate-700 transition-all
                          flex items-center justify-center gap-2"
                      >
                        <Edit className="w-5 h-5" />
                        Inserisci Manualmente
                      </button>
                      
                      <button
                        onClick={handleSkipTest}
                        className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg
                          text-yellow-400 font-bold hover:bg-yellow-500/30 transition-all
                          flex items-center justify-center gap-2"
                      >
                        <SkipForward className="w-5 h-5" />
                        Salta Test (Usa Default)
                      </button>
                    </div>
                    
                    <p className="text-center text-sm text-slate-500">
                      Puoi sempre modificare questi valori in seguito
                    </p>
                  </div>
                ) : showAITracker ? (
                  <div>
                    <AIExerciseTracker
                      exerciseId={currentStepData.exercise!}
                      targetReps={currentStepData.targetReps}
                      targetTime={currentStepData.duration}
                      onComplete={handleExerciseComplete}
                      userId={user?.id || 'temp-user'}
                    />
                    <button
                      onClick={() => setShowAITracker(false)}
                      className="mt-4 w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg
                        text-white font-bold hover:bg-slate-700 transition-all"
                    >
                      Annulla Test
                    </button>
                  </div>
                ) : manualInput ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-slate-400 mb-2">
                        Inserisci il numero di {currentStepData.exercise === 'plank' ? 'secondi' : 'ripetizioni'}:
                      </p>
                      <input
                        type="number"
                        value={manualValue}
                        onChange={(e) => setManualValue(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg
                          text-white text-center text-2xl focus:outline-none focus:border-green-500"
                        min="0"
                        max="999"
                        autoFocus
                      />
                      {currentStepData.unit && (
                        <p className="text-slate-500 mt-2">{currentStepData.unit}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setManualInput(false)
                          setManualValue('')
                        }}
                        className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg
                          text-white font-bold hover:bg-slate-700 transition-all"
                      >
                        <X className="w-5 h-5 inline mr-2" />
                        Annulla
                      </button>
                      <button
                        onClick={handleSaveManualValue}
                        className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg
                          text-white font-bold hover:shadow-lg hover:shadow-green-500/25 transition-all"
                      >
                        <Save className="w-5 h-5 inline mr-2" />
                        Salva
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Complete Content */}
            {currentStepData.type === 'complete' && (
              <div className="text-center space-y-6">
                <div className="space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="inline-flex p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 
                      rounded-full"
                  >
                    <CheckCircle className="w-16 h-16 text-green-400" />
                  </motion.div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Ottimo lavoro!</h3>
                    <p className="text-slate-400">
                      Il tuo profilo è stato calibrato con successo
                    </p>
                  </div>
                  
                  {/* Results Summary */}
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500">Push-ups</p>
                      <p className="text-xl font-bold text-white">{testResults.pushups_count}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500">Squats</p>
                      <p className="text-xl font-bold text-white">{testResults.squats_count}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500">Plank</p>
                      <p className="text-xl font-bold text-white">{testResults.plank_duration}s</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500">Jumping Jacks</p>
                      <p className="text-xl font-bold text-white">{testResults.jumping_jacks_count}</p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleComplete()}
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl
                    text-white font-bold text-lg shadow-lg hover:shadow-green-500/25 
                    transition-all disabled:opacity-50"
                >
                  {loading ? 'Salvataggio...' : 'Vai alla Dashboard'}
                </button>
              </div>
            )}

            {/* Navigation */}
            {currentStepData.type !== 'complete' && !showAITracker && !manualInput && (
              <div className="flex justify-between mt-8">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="px-6 py-3 bg-slate-700/50 border border-slate-600 rounded-lg
                    text-white font-bold hover:bg-slate-700 transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Indietro
                </button>
                
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg
                    text-white font-bold hover:shadow-lg hover:shadow-green-500/25 
                    transition-all flex items-center gap-2"
                >
                  Avanti
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Quick Complete Button (sempre visibile) */}
        {currentStep > 0 && currentStep < CALIBRATION_STEPS.length - 1 && (
          <div className="mt-6 text-center">
            <button
              onClick={handleQuickComplete}
              className="text-sm text-slate-500 hover:text-yellow-400 transition-colors"
            >
              Non vuoi fare i test? Clicca qui per completare rapidamente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}