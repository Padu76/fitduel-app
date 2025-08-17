'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  User, Activity, Target, Heart, ChevronRight, 
  ChevronLeft, Check, AlertCircle, Dumbbell,
  Calendar, Trophy, Timer, Info
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import AIExerciseTracker from '@/components/game/AIExerciseTracker'

// ====================================
// TYPES
// ====================================

interface CalibrationData {
  // Step 1 - Info Base
  age: number
  gender: 'male' | 'female' | 'other' | 'prefer_not_say'
  height_cm: number
  weight_kg: number
  
  // Step 2 - Esperienza
  fitness_experience: 'beginner' | 'intermediate' | 'advanced' | 'athlete'
  training_frequency: 'never' | 'rarely' | '1-2_week' | '3-4_week' | '5-6_week' | 'daily'
  years_training: number
  
  // Step 3 - Obiettivi e Limitazioni
  primary_goal: 'weight_loss' | 'muscle_gain' | 'endurance' | 'strength' | 'general_fitness' | 'competition'
  has_limitations: boolean
  limitations: Array<{
    type: string
    area: string
    severity: string
  }>
  medical_conditions: string[]
  
  // Step 4 - Test Results
  pushup_max: number
  squat_max: number
  plank_seconds: number
  burpees_minute: number
  jumping_jacks_minute: number
  
  // Step 5 - Calculated
  strength_score?: number
  endurance_score?: number
  flexibility_score?: number
  overall_fitness_score?: number
  fitness_level?: number
  fitness_category?: string
}

interface TestExercise {
  id: string
  name: string
  type: 'reps' | 'duration'
  target: number
  duration?: number
  description: string
  icon: any
}

// Add PerformanceData interface
interface PerformanceData {
  reps: number
  duration: number
  accuracy: number
  form_score: number
  [key: string]: any
}

// ====================================
// MAIN COMPONENT
// ====================================

export default function CalibrationWizard() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  // State
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [currentTest, setCurrentTest] = useState<TestExercise | null>(null)
  const [testResults, setTestResults] = useState<Record<string, number>>({})
  
  // Form Data
  const [calibrationData, setCalibrationData] = useState<CalibrationData>({
    age: 25,
    gender: 'prefer_not_say',
    height_cm: 170,
    weight_kg: 70,
    fitness_experience: 'beginner',
    training_frequency: 'rarely',
    years_training: 0,
    primary_goal: 'general_fitness',
    has_limitations: false,
    limitations: [],
    medical_conditions: [],
    pushup_max: 0,
    squat_max: 0,
    plank_seconds: 0,
    burpees_minute: 0,
    jumping_jacks_minute: 0
  })
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Test exercises configuration
  const testExercises: TestExercise[] = [
    {
      id: 'pushup',
      name: 'Push-up',
      type: 'reps',
      target: 20,
      duration: 60,
      description: 'Esegui il massimo numero di push-up in 60 secondi',
      icon: Dumbbell
    },
    {
      id: 'squat',
      name: 'Squat',
      type: 'reps',
      target: 30,
      duration: 60,
      description: 'Esegui il massimo numero di squat in 60 secondi',
      icon: Activity
    },
    {
      id: 'plank',
      name: 'Plank',
      type: 'duration',
      target: 60,
      description: 'Mantieni la posizione di plank il più a lungo possibile',
      icon: Timer
    },
    {
      id: 'burpees',
      name: 'Burpees',
      type: 'reps',
      target: 10,
      duration: 60,
      description: 'Esegui il massimo numero di burpees in 60 secondi',
      icon: Activity
    },
    {
      id: 'jumping_jacks',
      name: 'Jumping Jacks',
      type: 'reps',
      target: 40,
      duration: 60,
      description: 'Esegui il massimo numero di jumping jacks in 60 secondi',
      icon: Activity
    }
  ]

  // ====================================
  // EFFECTS
  // ====================================

  useEffect(() => {
    checkExistingCalibration()
  }, [])

  const checkExistingCalibration = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Controlla se esiste già una calibrazione
      const { data: calibration } = await supabase
        .from('user_calibration')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (calibration && calibration.calibration_status === 'completed') {
        // Già calibrato, vai alla dashboard
        router.push('/dashboard')
      } else if (calibration) {
        // Calibrazione incompleta, riprendi da dove aveva lasciato
        setCalibrationData({
          ...calibrationData,
          ...calibration
        })
        setCurrentStep(calibration.calibration_step || 1)
      }
    } catch (error) {
      console.error('Error checking calibration:', error)
    }
  }

  // ====================================
  // VALIDATION
  // ====================================

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (step) {
      case 1:
        if (!calibrationData.age || calibrationData.age < 13 || calibrationData.age > 100) {
          newErrors.age = 'Età deve essere tra 13 e 100 anni'
        }
        if (!calibrationData.gender) {
          newErrors.gender = 'Seleziona il genere'
        }
        if (!calibrationData.height_cm || calibrationData.height_cm < 100 || calibrationData.height_cm > 250) {
          newErrors.height = 'Altezza deve essere tra 100 e 250 cm'
        }
        if (!calibrationData.weight_kg || calibrationData.weight_kg < 30 || calibrationData.weight_kg > 300) {
          newErrors.weight = 'Peso deve essere tra 30 e 300 kg'
        }
        break
        
      case 2:
        if (!calibrationData.fitness_experience) {
          newErrors.experience = 'Seleziona il livello di esperienza'
        }
        if (!calibrationData.training_frequency) {
          newErrors.frequency = 'Seleziona la frequenza di allenamento'
        }
        break
        
      case 3:
        if (!calibrationData.primary_goal) {
          newErrors.goal = 'Seleziona un obiettivo primario'
        }
        break
        
      case 4:
        // I test verranno validati durante l'esecuzione
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ====================================
  // NAVIGATION
  // ====================================

  const handleNext = async () => {
    if (!validateStep(currentStep)) return
    
    // Salva progresso nel database
    await saveProgress()
    
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    } else {
      await completeCalibration()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const saveProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_calibration')
        .upsert({
          user_id: user.id,
          ...calibrationData,
          calibration_step: currentStep,
          calibration_status: 'incomplete'
        })

      if (error) throw error
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }

  // ====================================
  // TEST EXECUTION
  // ====================================

  const startTest = (exercise: TestExercise) => {
    setCurrentTest(exercise)
    setShowTestModal(true)
  }

  const handleTestComplete = (data: PerformanceData) => {
    if (!currentTest) return
    
    // Estrai il valore corretto dal PerformanceData
    const value = currentTest.type === 'duration' ? data.duration : data.reps
    
    // Salva risultato
    const resultKey = `${currentTest.id}_max`
    if (currentTest.id === 'plank') {
      setTestResults({ ...testResults, plank_seconds: value })
      setCalibrationData({ ...calibrationData, plank_seconds: value })
    } else if (currentTest.id === 'burpees') {
      setTestResults({ ...testResults, burpees_minute: value })
      setCalibrationData({ ...calibrationData, burpees_minute: value })
    } else if (currentTest.id === 'jumping_jacks') {
      setTestResults({ ...testResults, jumping_jacks_minute: value })
      setCalibrationData({ ...calibrationData, jumping_jacks_minute: value })
    } else {
      setTestResults({ ...testResults, [resultKey]: value })
      setCalibrationData({ ...calibrationData, [resultKey]: value })
    }
    
    setShowTestModal(false)
    setCurrentTest(null)
  }

  // ====================================
  // CALIBRATION COMPLETION
  // ====================================

  const calculateScores = () => {
    const { 
      pushup_max, squat_max, plank_seconds, 
      burpees_minute, jumping_jacks_minute,
      age, gender 
    } = calibrationData

    // Calcola punteggi basati su età e genere
    const ageFactor = age < 20 ? 1.1 : age < 30 ? 1.0 : age < 40 ? 0.95 : age < 50 ? 0.90 : age < 60 ? 0.85 : 0.80
    const genderFactor = gender === 'female' ? 1.15 : gender === 'male' ? 1.0 : 1.05

    // Calcola score componenti
    const strength = Math.min(100, ((pushup_max * 2) + (squat_max * 1.5)) * ageFactor * genderFactor)
    const endurance = Math.min(100, ((burpees_minute * 3) + (jumping_jacks_minute * 1)) * ageFactor * genderFactor)
    const flexibility = Math.min(100, (plank_seconds * 1.5) * ageFactor * genderFactor)
    
    // Overall score
    const overall = (strength + endurance + flexibility) / 3

    // Determina livello (1-10)
    const level = overall >= 90 ? 10 :
                  overall >= 80 ? 9 :
                  overall >= 70 ? 8 :
                  overall >= 60 ? 7 :
                  overall >= 50 ? 6 :
                  overall >= 40 ? 5 :
                  overall >= 30 ? 4 :
                  overall >= 20 ? 3 :
                  overall >= 10 ? 2 : 1

    return {
      strength_score: strength,
      endurance_score: endurance,
      flexibility_score: flexibility,
      overall_fitness_score: overall,
      fitness_level: level
    }
  }

  const completeCalibration = async () => {
    setSaving(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Calcola punteggi finali
      const scores = calculateScores()
      
      // Aggiorna calibrazione completa
      const finalData = {
        ...calibrationData,
        ...scores,
        calibration_status: 'completed',
        calibration_completed_at: new Date().toISOString()
      }

      const { error: calibrationError } = await supabase
        .from('user_calibration')
        .upsert({
          user_id: user.id,
          ...finalData
        })

      if (calibrationError) throw calibrationError

      // Aggiorna profilo
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_calibrated: true,
          calibration_required: false
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Salva test results
      for (const exercise of testExercises) {
        const resultKey = exercise.id === 'pushup' ? 'pushup_max' :
                         exercise.id === 'squat' ? 'squat_max' :
                         exercise.id === 'plank' ? 'plank_seconds' :
                         exercise.id === 'burpees' ? 'burpees_minute' :
                         'jumping_jacks_minute'
        
        await supabase
          .from('calibration_tests')
          .insert({
            user_id: user.id,
            test_type: 'initial',
            exercise_name: exercise.name,
            completed_reps: calibrationData[resultKey as keyof CalibrationData],
            performed_at: new Date().toISOString()
          })
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing calibration:', error)
    } finally {
      setSaving(false)
    }
  }

  // ====================================
  // RENDER STEPS
  // ====================================

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Informazioni Base</h2>
        <p className="text-gray-400">Questi dati ci aiutano a personalizzare la tua esperienza</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Età
          </label>
          <Input
            type="number"
            value={calibrationData.age}
            onChange={(e) => setCalibrationData({ ...calibrationData, age: parseInt(e.target.value) })}
            min={13}
            max={100}
            className={errors.age ? 'border-red-500' : ''}
          />
          {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Genere
          </label>
          <select
            value={calibrationData.gender}
            onChange={(e) => setCalibrationData({ ...calibrationData, gender: e.target.value as any })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          >
            <option value="prefer_not_say">Preferisco non dire</option>
            <option value="male">Maschile</option>
            <option value="female">Femminile</option>
            <option value="other">Altro</option>
          </select>
          {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Altezza (cm)
          </label>
          <Input
            type="number"
            value={calibrationData.height_cm}
            onChange={(e) => setCalibrationData({ ...calibrationData, height_cm: parseInt(e.target.value) })}
            min={100}
            max={250}
            className={errors.height ? 'border-red-500' : ''}
          />
          {errors.height && <p className="text-red-500 text-sm mt-1">{errors.height}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Peso (kg)
          </label>
          <Input
            type="number"
            value={calibrationData.weight_kg}
            onChange={(e) => setCalibrationData({ ...calibrationData, weight_kg: parseFloat(e.target.value) })}
            min={30}
            max={300}
            step={0.5}
            className={errors.weight ? 'border-red-500' : ''}
          />
          {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p>I tuoi dati sono protetti e utilizzati solo per calibrare le sfide.</p>
            <p className="mt-1">Puoi aggiornare queste informazioni in qualsiasi momento.</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Esperienza Fitness</h2>
        <p className="text-gray-400">Aiutaci a capire il tuo livello attuale</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-3">
            Livello di Esperienza
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['beginner', 'intermediate', 'advanced', 'athlete'].map((level) => (
              <button
                key={level}
                onClick={() => setCalibrationData({ ...calibrationData, fitness_experience: level as any })}
                className={`p-4 rounded-lg border transition-all ${
                  calibrationData.fitness_experience === level
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="text-center">
                  <Trophy className="w-8 h-8 mx-auto mb-2" />
                  <div className="font-medium capitalize">{level === 'beginner' ? 'Principiante' : level === 'intermediate' ? 'Intermedio' : level === 'advanced' ? 'Avanzato' : 'Atleta'}</div>
                </div>
              </button>
            ))}
          </div>
          {errors.experience && <p className="text-red-500 text-sm mt-2">{errors.experience}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-3">
            Frequenza di Allenamento
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { value: 'never', label: 'Mai' },
              { value: 'rarely', label: 'Raramente' },
              { value: '1-2_week', label: '1-2 volte/sett' },
              { value: '3-4_week', label: '3-4 volte/sett' },
              { value: '5-6_week', label: '5-6 volte/sett' },
              { value: 'daily', label: 'Ogni giorno' }
            ].map((freq) => (
              <button
                key={freq.value}
                onClick={() => setCalibrationData({ ...calibrationData, training_frequency: freq.value as any })}
                className={`px-4 py-3 rounded-lg border transition-all ${
                  calibrationData.training_frequency === freq.value
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <Calendar className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium">{freq.label}</div>
              </button>
            ))}
          </div>
          {errors.frequency && <p className="text-red-500 text-sm mt-2">{errors.frequency}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Anni di Allenamento
          </label>
          <Input
            type="number"
            value={calibrationData.years_training}
            onChange={(e) => setCalibrationData({ ...calibrationData, years_training: parseInt(e.target.value) })}
            min={0}
            max={50}
            placeholder="0"
          />
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Obiettivi e Limitazioni</h2>
        <p className="text-gray-400">Personalizziamo il tuo percorso</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-3">
            Obiettivo Primario
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { value: 'weight_loss', label: 'Perdere Peso', icon: Target },
              { value: 'muscle_gain', label: 'Massa Muscolare', icon: Dumbbell },
              { value: 'endurance', label: 'Resistenza', icon: Activity },
              { value: 'strength', label: 'Forza', icon: Dumbbell },
              { value: 'general_fitness', label: 'Fitness Generale', icon: Heart },
              { value: 'competition', label: 'Competizione', icon: Trophy }
            ].map((goal) => (
              <button
                key={goal.value}
                onClick={() => setCalibrationData({ ...calibrationData, primary_goal: goal.value as any })}
                className={`p-4 rounded-lg border transition-all ${
                  calibrationData.primary_goal === goal.value
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <goal.icon className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium">{goal.label}</div>
              </button>
            ))}
          </div>
          {errors.goal && <p className="text-red-500 text-sm mt-2">{errors.goal}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-3">
            Hai limitazioni fisiche o infortuni?
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setCalibrationData({ ...calibrationData, has_limitations: false })}
              className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                !calibrationData.has_limitations
                  ? 'bg-green-600 border-green-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              No, nessuna limitazione
            </button>
            <button
              onClick={() => setCalibrationData({ ...calibrationData, has_limitations: true })}
              className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                calibrationData.has_limitations
                  ? 'bg-yellow-600 border-yellow-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              Sì, ho delle limitazioni
            </button>
          </div>
        </div>

        {calibrationData.has_limitations && (
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div className="text-sm text-yellow-300">
                <p>Se hai limitazioni fisiche, consulta il tuo medico prima di iniziare.</p>
                <p className="mt-1">Gli esercizi saranno adattati alle tue capacità.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Test di Calibrazione</h2>
        <p className="text-gray-400">Completa questi test per determinare il tuo livello</p>
      </div>

      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p>Esegui ogni test al meglio delle tue capacità.</p>
            <p className="mt-1">L'AI tracker verificherà la corretta esecuzione.</p>
            <p className="mt-1">Puoi fare una pausa tra un test e l'altro.</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {testExercises.map((exercise) => {
          const resultKey = exercise.id === 'pushup' ? 'pushup_max' :
                           exercise.id === 'squat' ? 'squat_max' :
                           exercise.id === 'plank' ? 'plank_seconds' :
                           exercise.id === 'burpees' ? 'burpees_minute' :
                           'jumping_jacks_minute'
          
          const completed = calibrationData[resultKey as keyof CalibrationData] as number > 0
          
          return (
            <Card key={exercise.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    completed ? 'bg-green-600' : 'bg-gray-700'
                  }`}>
                    <exercise.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{exercise.name}</h3>
                    <p className="text-sm text-gray-400">{exercise.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {completed && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-400">
                        {calibrationData[resultKey as keyof CalibrationData] as number}
                      </p>
                      <p className="text-xs text-gray-400">
                        {exercise.type === 'duration' ? 'secondi' : 'ripetizioni'}
                      </p>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => startTest(exercise)}
                    variant={completed ? 'ghost' : 'gradient'}
                    size="sm"
                  >
                    {completed ? 'Ripeti' : 'Inizia'} Test
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {Object.values(testResults).filter(v => v > 0).length === testExercises.length && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-green-400" />
            <p className="text-green-300">
              Tutti i test completati! Procedi per vedere i tuoi risultati.
            </p>
          </div>
        </div>
      )}
    </div>
  )

  const renderStep5 = () => {
    const scores = calculateScores()
    const category = scores.fitness_level! <= 2 ? 'Rookie' :
                    scores.fitness_level! <= 4 ? 'Bronze' :
                    scores.fitness_level! <= 6 ? 'Silver' :
                    scores.fitness_level! <= 8 ? 'Gold' : 'Platinum'
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Calibrazione Completata!</h2>
          <p className="text-gray-400">Ecco il tuo profilo fitness personalizzato</p>
        </div>

        <Card className="p-6 bg-gradient-to-br from-purple-600/20 to-blue-600/20">
          <div className="text-center">
            <div className="mb-4">
              <Trophy className="w-16 h-16 mx-auto text-yellow-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Livello {scores.fitness_level}
            </h3>
            <div className={`inline-block px-4 py-2 rounded-full ${
              category === 'Platinum' ? 'bg-purple-600' :
              category === 'Gold' ? 'bg-yellow-600' :
              category === 'Silver' ? 'bg-gray-400' :
              category === 'Bronze' ? 'bg-orange-600' :
              'bg-green-600'
            }`}>
              <span className="text-white font-bold">{category}</span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Forza</span>
              <span className="text-xl font-bold text-white">
                {Math.round(scores.strength_score!)}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full"
                style={{ width: `${scores.strength_score}%` }}
              />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Resistenza</span>
              <span className="text-xl font-bold text-white">
                {Math.round(scores.endurance_score!)}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${scores.endurance_score}%` }}
              />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Flessibilità</span>
              <span className="text-xl font-bold text-white">
                {Math.round(scores.flexibility_score!)}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${scores.flexibility_score}%` }}
              />
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 font-semibold">Punteggio Complessivo</span>
            <span className="text-2xl font-bold text-purple-400">
              {Math.round(scores.overall_fitness_score!)} / 100
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full"
              style={{ width: `${scores.overall_fitness_score}%` }}
            />
          </div>
        </Card>

        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-400 mt-0.5" />
            <div className="text-sm text-green-300">
              <p className="font-semibold mb-1">Sei pronto per iniziare!</p>
              <p>Le sfide saranno calibrate al tuo livello.</p>
              <p>Riceverai bonus automatici per bilanciare le competizioni.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      case 5: return renderStep5()
      default: return null
    }
  }

  // ====================================
  // MAIN RENDER
  // ====================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Calibrazione FitDuel
          </h1>
          <p className="text-gray-400">
            Personalizza la tua esperienza fitness
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`flex items-center ${
                  step < 5 ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    currentStep >= step
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {currentStep > step ? <Check className="w-5 h-5" /> : step}
                </div>
                {step < 5 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      currentStep > step ? 'bg-purple-600' : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Info Base</span>
            <span>Esperienza</span>
            <span>Obiettivi</span>
            <span>Test</span>
            <span>Risultati</span>
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-6 md:p-8">
          {renderCurrentStep()}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            onClick={handlePrevious}
            variant="ghost"
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Indietro
          </Button>

          {currentStep < 5 ? (
            <Button
              onClick={handleNext}
              variant="gradient"
              disabled={currentStep === 4 && Object.values(testResults).filter(v => v > 0).length < testExercises.length}
              className="flex items-center gap-2"
            >
              Avanti
              <ChevronRight className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              onClick={completeCalibration}
              variant="gradient"
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? 'Salvataggio...' : 'Inizia FitDuel'}
              <Check className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Test Modal */}
      {showTestModal && currentTest && (
        <Modal
          isOpen={showTestModal}
          onClose={() => setShowTestModal(false)}
          title={`Test: ${currentTest.name}`}
        >
          <div className="space-y-4">
            <p className="text-gray-300">{currentTest.description}</p>
            
            <AIExerciseTracker
              exerciseName={currentTest.name}
              targetReps={currentTest.target}
              duration={currentTest.duration}
              onComplete={handleTestComplete}
              validationMode="strict"
            />
          </div>
        </Modal>
      )}
    </div>
  )
}