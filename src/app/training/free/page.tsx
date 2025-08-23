'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Play, Pause, RotateCcw, Settings, 
  Dumbbell, Activity, Target, Timer, Volume2,
  Eye, Camera, Maximize, Minimize, Info, CheckCircle
} from 'lucide-react'

// ====================================
// MOCK DATA
// ====================================

const EXERCISES = [
  {
    id: 'pushups',
    name: 'Push-ups',
    icon: '💪',
    description: 'Esercizio per pettorali, spalle e tricipiti',
    instructions: [
      'Posizionati in plank con le mani sotto le spalle',
      'Mantieni il corpo dritto dalla testa ai piedi',
      'Scendi fino a toccare quasi il pavimento con il petto',
      'Spingi verso l\'alto tornando alla posizione iniziale'
    ],
    tips: [
      'Non fare "snake push-ups" - mantieni il corpo rigido',
      'Respira verso il basso, espira verso l\'alto',
      'Se troppo difficile, appoggia le ginocchia'
    ],
    muscles: ['Pettorali', 'Tricipiti', 'Spalle', 'Core'],
    difficulty: 'Medium',
    category: 'Upper Body'
  },
  {
    id: 'squats',
    name: 'Squats',
    icon: '🦵',
    description: 'Esercizio fondamentale per gambe e glutei',
    instructions: [
      'Stai in piedi con i piedi alla larghezza delle spalle',
      'Abbassa il bacino come se ti stessi sedendo su una sedia',
      'Scendi fino a quando le cosce sono parallele al pavimento',
      'Torna su spingendo attraverso i talloni'
    ],
    tips: [
      'Mantieni il peso sui talloni, non sulle punte',
      'Le ginocchia devono seguire la direzione dei piedi',
      'Mantieni il petto in fuori e la schiena dritta'
    ],
    muscles: ['Quadricipiti', 'Glutei', 'Polpacci', 'Core'],
    difficulty: 'Easy',
    category: 'Lower Body'
  },
  {
    id: 'plank',
    name: 'Plank',
    icon: '⏱️',
    description: 'Esercizio isometrico per il core',
    instructions: [
      'Posizionati a faccia in giù supportandoti su avambracci e piedi',
      'Mantieni il corpo dritto come una tavola',
      'Contrai gli addominali e i glutei',
      'Respira normalmente mantenendo la posizione'
    ],
    tips: [
      'Non alzare troppo i fianchi',
      'Non far cadere i fianchi verso il basso',
      'Guarda un punto fisso davanti a te'
    ],
    muscles: ['Core', 'Spalle', 'Glutei'],
    difficulty: 'Easy',
    category: 'Core',
    isometric: true
  },
  {
    id: 'burpees',
    name: 'Burpees',
    icon: '🔥',
    description: 'Esercizio completo ad alta intensità',
    instructions: [
      'Inizia in posizione eretta',
      'Scendi in squat e appoggia le mani a terra',
      'Salta indietro in posizione di plank',
      'Fai un push-up (opzionale)',
      'Salta in avanti tornando in squat',
      'Salta in alto con le braccia sopra la testa'
    ],
    tips: [
      'Mantieni un ritmo costante',
      'Respira in modo controllato',
      'Modifica l\'esercizio se necessario'
    ],
    muscles: ['Full Body'],
    difficulty: 'Hard',
    category: 'Full Body'
  }
]

// ====================================
// COMPONENTS
// ====================================

const ExerciseCard = ({ exercise, onSelect, isSelected }: any) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-400 bg-green-500/10'
      case 'medium': return 'text-yellow-400 bg-yellow-500/10'
      case 'hard': return 'text-red-400 bg-red-500/10'
      default: return 'text-gray-400 bg-gray-500/10'
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(exercise)}
      className={`relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl 
        rounded-2xl p-6 border transition-all duration-300 cursor-pointer
        ${isSelected 
          ? 'border-green-500 ring-2 ring-green-500/30' 
          : 'border-slate-700/50 hover:border-green-500/50'}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <span className="text-2xl">{exercise.icon}</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{exercise.name}</h3>
            <p className="text-sm text-gray-400">{exercise.category}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(exercise.difficulty)}`}>
          {exercise.difficulty}
        </span>
      </div>
      
      <p className="text-sm text-gray-300 mb-4">{exercise.description}</p>
      
      <div className="flex flex-wrap gap-1 mb-4">
        {exercise.muscles.map((muscle: string, i: number) => (
          <span key={i} className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-400">
            {muscle}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-center">
        <Play className="w-5 h-5 text-green-400 mr-2" />
        <span className="text-green-400 font-medium">Inizia Allenamento</span>
      </div>
    </motion.div>
  )
}

const ExerciseSession = ({ exercise, onBack }: any) => {
  const [isActive, setIsActive] = useState(false)
  const [currentRep, setCurrentRep] = useState(0)
  const [sessionTime, setSessionTime] = useState(0)
  const [showInstructions, setShowInstructions] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isActive) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isActive])

  const handleStart = () => {
    setIsActive(true)
    setShowInstructions(false)
  }

  const handlePause = () => {
    setIsActive(false)
  }

  const handleReset = () => {
    setIsActive(false)
    setCurrentRep(0)
    setSessionTime(0)
  }

  const handleRepComplete = () => {
    setCurrentRep(prev => prev + 1)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (showInstructions) {
    return (
      <div className="space-y-6">
        {/* Exercise Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <span className="text-3xl">{exercise.icon}</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">{exercise.name}</h2>
            <p className="text-gray-400">{exercise.description}</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            Come Eseguire l'Esercizio
          </h3>
          <ol className="space-y-2">
            {exercise.instructions.map((instruction: string, i: number) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-gray-300">{instruction}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Tips */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">💡 Consigli Importanti</h3>
          <ul className="space-y-2">
            {exercise.tips.map((tip: string, i: number) => (
              <li key={i} className="flex gap-2 text-yellow-100">
                <span className="text-yellow-400">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Start Button */}
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 py-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white font-bold hover:bg-slate-700 transition-all"
          >
            <ArrowLeft className="w-5 h-5 inline mr-2" />
            Torna Indietro
          </button>
          <button
            onClick={handleStart}
            className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-bold hover:shadow-lg transition-all"
          >
            <Play className="w-5 h-5 inline mr-2" />
            Inizia Allenamento
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <span className="text-xl">{exercise.icon}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{exercise.name}</h2>
            <p className="text-gray-400">Allenamento Libero</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInstructions(true)}
            className="p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <Info className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Timer */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 text-center">
          <Timer className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-white mb-1">{formatTime(sessionTime)}</p>
          <p className="text-sm text-gray-400">Tempo Sessione</p>
        </div>

        {/* Rep Counter */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 text-center">
          <Activity className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-white mb-1">{currentRep}</p>
          <p className="text-sm text-gray-400">
            {exercise.isometric ? 'Mantenimenti' : 'Ripetizioni'}
          </p>
        </div>

        {/* Status */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 text-center">
          <Target className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <p className={`text-3xl font-bold mb-1 ${isActive ? 'text-green-400' : 'text-gray-400'}`}>
            {isActive ? 'ATTIVO' : 'PAUSA'}
          </p>
          <p className="text-sm text-gray-400">Stato</p>
        </div>
      </div>

      {/* Camera/Exercise Area Placeholder */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 text-center">
        <div className="border-2 border-dashed border-slate-600 rounded-xl p-12">
          <Camera className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-400 mb-2">Area Allenamento</h3>
          <p className="text-slate-500 mb-6">
            In una versione completa, qui ci sarebbe il feed della camera con AI tracking
          </p>
          
          {/* Manual Rep Button */}
          <button
            onClick={handleRepComplete}
            disabled={!isActive}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-bold transition-all"
          >
            <CheckCircle className="w-5 h-5 inline mr-2" />
            {exercise.isometric ? 'Completa Mantenimento' : 'Completa Ripetizione'}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white font-bold hover:bg-slate-700 transition-all"
        >
          <ArrowLeft className="w-5 h-5 inline mr-2" />
          Termina
        </button>
        
        <div className="flex-1 flex gap-2">
          <button
            onClick={isActive ? handlePause : handleStart}
            className={`flex-1 py-3 rounded-xl text-white font-bold transition-all ${
              isActive 
                ? 'bg-yellow-600 hover:bg-yellow-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-5 h-5 inline mr-2" />
                Pausa
              </>
            ) : (
              <>
                <Play className="w-5 h-5 inline mr-2" />
                {sessionTime > 0 ? 'Riprendi' : 'Inizia'}
              </>
            )}
          </button>
          
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-white font-bold transition-all"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Session Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-blue-400" />
          <span className="text-blue-400 font-medium">Modalità Allenamento Libero</span>
        </div>
        <p className="text-blue-100 text-sm">
          Non ci sono timer o obiettivi. Concentrati sulla forma corretta e allenati al tuo ritmo. 
          Questa sessione non assegna XP o coins.
        </p>
      </div>
    </div>
  )
}

// ====================================
// MAIN COMPONENT
// ====================================

export default function FreeTrainingPage() {
  const [selectedExercise, setSelectedExercise] = useState<any>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/training">
              <motion.button
                className="p-3 bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 hover:border-green-500/50 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-6 h-6 text-green-400" />
              </motion.button>
            </Link>
            
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                  <Dumbbell className="w-8 h-8 text-white" />
                </div>
                Allenamento Libero
              </h1>
              <p className="text-slate-400 mt-1">
                {selectedExercise ? 'Sessione in corso' : 'Scegli un esercizio e allenati senza pressione'}
              </p>
            </div>
          </div>

          {!selectedExercise && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <p className="text-green-400 text-sm font-medium">Modalità Relax 🧘‍♂️</p>
              <p className="text-green-100 text-xs">No timer • No score • Solo tecnica</p>
            </div>
          )}
        </div>

        {/* Content */}
        {selectedExercise ? (
          <ExerciseSession 
            exercise={selectedExercise} 
            onBack={() => setSelectedExercise(null)}
          />
        ) : (
          <div className="space-y-8">
            {/* Info Banner */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border border-blue-500/30 backdrop-blur-xl"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Info className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">Allenamento Senza Pressione</h3>
                  <p className="text-slate-300 text-sm">
                    Perfetto per imparare la tecnica corretta, fare riscaldamento o semplicemente mantenersi attivi. 
                    Non ci sono timer, punteggi o obiettivi da raggiungere.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Exercise Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {EXERCISES.map((exercise, index) => (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ExerciseCard
                    exercise={exercise}
                    onSelect={setSelectedExercise}
                    isSelected={selectedExercise?.id === exercise.id}
                  />
                </motion.div>
              ))}
            </div>

            {/* Benefits Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Focus sulla Forma</h3>
                <p className="text-slate-400 text-sm">
                  Concentrati sulla tecnica corretta senza la pressione del tempo
                </p>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Volume2 className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Al Tuo Ritmo</h3>
                <p className="text-slate-400 text-sm">
                  Nessuna fretta, allenati seguendo il ritmo del tuo corpo
                </p>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Impara & Migliora</h3>
                <p className="text-slate-400 text-sm">
                  Perfetto per principianti che vogliono imparare nuovi esercizi
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}