'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Play, Pause, RotateCcw, Settings, 
  Dumbbell, Activity, Timer, Target, Zap,
  Search, Filter, Grid, List, Eye, Flame
} from 'lucide-react'

// Importa esercizi reali dal sistema
import { exercises as allExercises } from '@/data/exercises'

export default function FreeTrainingPage() {
  const router = useRouter()
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [isTraining, setIsTraining] = useState(false)
  const [timer, setTimer] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [reps, setReps] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  
  // AI Tracker states
  const [aiTrackerActive, setAiTrackerActive] = useState(false)
  const [detectedReps, setDetectedReps] = useState(0)
  const [formScore, setFormScore] = useState(0)
  const [calories, setCalories] = useState(0)

  // Timer effect
  useEffect(() => {
    let interval = null
    if (isTraining) {
      interval = setInterval(() => {
        setTimer(timer => timer + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTraining])

  // Funzione per calcolare calorie stimate
  const calculateEstimatedCalories = (exercise, reps, sets = 1) => {
    const baseCalories = exercise.caloriesPerRep || 0.5
    return Math.round(baseCalories * reps * sets * 10) / 10
  }

  // Simula AI tracking
  useEffect(() => {
    if (aiTrackerActive && isTraining) {
      const interval = setInterval(() => {
        // Simula rilevamento reps
        if (Math.random() > 0.7) {
          setDetectedReps(prev => prev + 1)
          setReps(prev => prev + 1)
        }
        
        // Simula score forma
        setFormScore(Math.floor(Math.random() * 30) + 70)
        
        // Calcola calorie
        if (selectedExercise) {
          setCalories(calculateEstimatedCalories(selectedExercise, detectedReps))
        }
      }, 2000)
      
      return () => clearInterval(interval)
    }
  }, [aiTrackerActive, isTraining, selectedExercise, detectedReps])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startTraining = (exercise) => {
    setSelectedExercise(exercise)
    setIsTraining(true)
    setTimer(0)
    setCurrentSet(1)
    setReps(0)
    setDetectedReps(0)
    setFormScore(0)
    setCalories(0)
    setAiTrackerActive(true)
  }

  const pauseTraining = () => {
    setIsTraining(!isTraining)
  }

  const resetTraining = () => {
    setIsTraining(false)
    setTimer(0)
    setCurrentSet(1)
    setReps(0)
    setDetectedReps(0)
    setFormScore(0)
    setCalories(0)
    setAiTrackerActive(false)
  }

  const nextSet = () => {
    setCurrentSet(prev => prev + 1)
    setReps(0)
    setDetectedReps(0)
  }

  const finishWorkout = () => {
    setSelectedExercise(null)
    resetTraining()
  }

  // Ottieni categorie uniche
  const categories = [...new Set(allExercises.map(ex => ex.category))]

  // Filtra esercizi
  const filteredExercises = allExercises.filter(exercise => {
    const matchesSearch = searchTerm === '' || (
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exercise.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    )
    
    const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Se in allenamento, mostra interfaccia training
  if (selectedExercise && isTraining) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
        {/* Header Training */}
        <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
          <div className="flex items-center justify-between p-4">
            <button 
              onClick={finishWorkout}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              Termina
            </button>
            <h1 className="text-lg font-semibold">{selectedExercise.name}</h1>
            <button 
              onClick={() => setAiTrackerActive(!aiTrackerActive)}
              className={`p-2 rounded-lg transition-colors ${
                aiTrackerActive 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:text-white'
              }`}
            >
              <Eye size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* AI Tracker Status */}
          {aiTrackerActive && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-600/20 border border-green-600/30 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 font-medium">AI Tracker Attivo</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-400">{detectedReps}</div>
                  <div className="text-sm text-gray-400">Reps Rilevate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">{formScore}%</div>
                  <div className="text-sm text-gray-400">Forma</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-400">{calories}</div>
                  <div className="text-sm text-gray-400">Calorie</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stats principali */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800/50 rounded-xl p-6 text-center">
              <Timer className="mx-auto mb-3 text-blue-400" size={32} />
              <div className="text-3xl font-bold mb-1">{formatTime(timer)}</div>
              <div className="text-gray-400">Tempo</div>
            </div>
            
            <div className="bg-gray-800/50 rounded-xl p-6 text-center">
              <Target className="mx-auto mb-3 text-green-400" size={32} />
              <div className="text-3xl font-bold mb-1">Set {currentSet}</div>
              <div className="text-gray-400">{reps} reps</div>
            </div>
          </div>

          {/* Controlli */}
          <div className="flex justify-center gap-4 mb-8">
            <button 
              onClick={pauseTraining}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl transition-colors"
            >
              {isTraining ? <Pause size={20} /> : <Play size={20} />}
              {isTraining ? 'Pausa' : 'Riprendi'}
            </button>
            
            <button 
              onClick={resetTraining}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-xl transition-colors"
            >
              <RotateCcw size={20} />
              Reset
            </button>
          </div>

          {/* Pulsante Next Set */}
          {reps > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <button 
                onClick={nextSet}
                className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-xl transition-colors font-medium"
              >
                Prossimo Set
              </button>
            </motion.div>
          )}
        </div>
      </div>
    )
  }

  // Interfaccia principale selezione esercizi
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="flex items-center justify-between p-4">
          <Link href="/training" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            Training
          </Link>
          <h1 className="text-xl font-bold">Allenamento Libero</h1>
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Header con stats */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 mb-8 border border-blue-500/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Dumbbell className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Free Training</h2>
              <p className="text-gray-400">Scegli il tuo esercizio e inizia</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{allExercises.length}</div>
              <div className="text-sm text-gray-400">Esercizi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{categories.length}</div>
              <div className="text-sm text-gray-400">Categorie</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">AI</div>
              <div className="text-sm text-gray-400">Tracker</div>
            </div>
          </div>
        </div>

        {/* Filtri e ricerca */}
        <div className="mb-6">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cerca esercizi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="bg-gray-800 hover:bg-gray-700 p-3 rounded-xl border border-gray-700 transition-colors"
              >
                {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
              </button>
            </div>
          </div>

          {/* Filtro categorie */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:text-white'
              }`}
            >
              Tutti
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Lista/Griglia Esercizi */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}>
          {filteredExercises.map((exercise, index) => (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl hover:border-gray-600 transition-all group ${
                viewMode === 'list' ? 'flex items-center gap-4 p-4' : 'p-6'
              }`}
            >
              <div className={viewMode === 'list' ? 'flex-1' : ''}>
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="text-blue-400" size={20} />
                  <h3 className="font-semibold text-lg">{exercise.name}</h3>
                </div>
                
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {exercise.description}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                      {exercise.category}
                    </span>
                    <div className="flex items-center gap-1 text-orange-400">
                      <Flame size={16} />
                      {calculateEstimatedCalories(exercise, 1)} cal/rep
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => startTraining(exercise)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl transition-colors font-medium group-hover:bg-blue-500"
                >
                  Inizia Allenamento
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredExercises.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search size={48} className="mx-auto mb-4" />
              <p>Nessun esercizio trovato</p>
              <p className="text-sm">Prova a modificare i filtri di ricerca</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}