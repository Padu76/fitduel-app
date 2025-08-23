'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Play, Search, Filter, MonitorPlay, 
  Clock, Target, Star, BookOpen, Video, 
  AlertCircle, CheckCircle, Info, Eye, Zap
} from 'lucide-react'

// ====================================
// MOCK DATA
// ====================================

const EXERCISE_CATEGORIES = [
  {
    id: 'upper_body',
    name: 'Upper Body',
    icon: '💪',
    color: 'from-red-500 to-orange-500',
    exerciseCount: 12,
    description: 'Pettorali, spalle, braccia e schiena'
  },
  {
    id: 'lower_body', 
    name: 'Lower Body',
    icon: '🦵',
    color: 'from-blue-500 to-cyan-500',
    exerciseCount: 15,
    description: 'Gambe, glutei e polpacci'
  },
  {
    id: 'core',
    name: 'Core & Abs',
    icon: '💎',
    color: 'from-purple-500 to-pink-500',
    exerciseCount: 10,
    description: 'Addominali, obliqui e stabilità'
  },
  {
    id: 'full_body',
    name: 'Full Body',
    icon: '🔥',
    color: 'from-green-500 to-emerald-500',
    exerciseCount: 8,
    description: 'Esercizi completi multiarticolari'
  },
  {
    id: 'cardio',
    name: 'Cardio',
    icon: '⚡',
    color: 'from-yellow-500 to-amber-500',
    exerciseCount: 6,
    description: 'Esercizi cardiovascolari'
  }
]

const EXERCISES_DATA: Record<string, any[]> = {
  upper_body: [
    {
      id: 'pushups',
      name: 'Push-ups',
      icon: '💪',
      difficulty: 'Medium',
      duration: '30-60 sec',
      muscles: ['Pettorali', 'Tricipiti', 'Spalle'],
      equipment: 'Nessuno',
      videoUrl: '#',
      description: 'Esercizio completo ad alta intensità',
      instructions: [
        'Inizia in posizione eretta',
        'Scendi in squat e appoggia le mani',
        'Salta indietro in posizione plank',
        'Fai un push-up (opzionale)',
        'Salta avanti tornando in squat',
        'Salta in alto con braccia sopra la testa'
      ],
      commonMistakes: [
        'Saltare il push-up quando richiesto',
        'Non completare il salto finale',
        'Eseguire troppo velocemente perdendo la forma'
      ],
      progressions: [
        'Step-Back Burpees (Principiante)',
        'Half Burpees (Intermedio)',
        'Standard Burpees (Avanzato)',
        'Burpees con Pull-up (Esperto)'
      ],
      tips: [
        'Mantieni un ritmo costante',
        'Concentrati sulla forma, non sulla velocità',
        'Respira in modo controllato'
      ]
    }
  ],
  cardio: [
    {
      id: 'jumping_jacks',
      name: 'Jumping Jacks',
      icon: '⚡',
      difficulty: 'Easy',
      duration: '30-60 sec',
      muscles: ['Cardio', 'Gambe', 'Spalle'],
      equipment: 'Nessuno',
      videoUrl: '#',
      description: 'Esercizio cardio dinamico',
      instructions: [
        'Inizia con piedi uniti e braccia lungo i fianchi',
        'Salta aprendo gambe e alzando braccia sopra la testa',
        'Salta tornando alla posizione iniziale',
        'Mantieni un ritmo costante'
      ],
      commonMistakes: [
        'Atterrare pesantemente',
        'Non coordinare braccia e gambe',
        'Ritmo irregolare'
      ],
      progressions: [
        'Step Jacks (Principiante)',
        'Standard Jumping Jacks (Base)',
        'Cross Jacks (Avanzato)',
        'Squat Jacks (Avanzato)'
      ],
      tips: [
        'Atterrare sulla punta dei piedi',
        'Mantieni il core attivo',
        'Respira ritmicamente'
      ]
    }
  ]
}

// ====================================
// COMPONENTS
// ====================================

const CategoryCard = ({ category, onSelect }: any) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={() => onSelect(category)}
    className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl 
      rounded-2xl p-6 border border-slate-700/50 hover:border-green-500/50 
      transition-all duration-300 cursor-pointer overflow-hidden"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-5`} />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center`}>
          <span className="text-2xl">{category.icon}</span>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{category.exerciseCount}</p>
          <p className="text-xs text-gray-400">Esercizi</p>
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{category.name}</h3>
      <p className="text-sm text-gray-400 mb-4">{category.description}</p>
      <div className="flex items-center justify-center text-green-400">
        <Play className="w-4 h-4 mr-2" />
        <span className="font-medium">Esplora Esercizi</span>
      </div>
    </div>
  </motion.div>
)

const ExerciseCard = ({ exercise, onSelect }: any) => {
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
      className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50 
        hover:border-green-500/50 transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg 
            flex items-center justify-center">
            <span className="text-lg">{exercise.icon}</span>
          </div>
          <div>
            <h4 className="font-bold text-white">{exercise.name}</h4>
            <p className="text-xs text-gray-400">{exercise.duration}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(exercise.difficulty)}`}>
          {exercise.difficulty}
        </span>
      </div>

      <p className="text-sm text-gray-300 mb-3">{exercise.description}</p>

      <div className="flex flex-wrap gap-1 mb-3">
        {exercise.muscles.slice(0, 3).map((muscle: string, i: number) => (
          <span key={i} className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-400">
            {muscle}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Target className="w-3 h-3" />
          <span>{exercise.equipment}</span>
        </div>
        <div className="flex items-center gap-1 text-green-400">
          <Video className="w-4 h-4" />
          <span className="text-xs font-medium">Guarda Video</span>
        </div>
      </div>
    </motion.div>
  )
}

const ExerciseDetail = ({ exercise, onBack }: any) => {
  const [activeTab, setActiveTab] = useState<'instructions' | 'mistakes' | 'progressions'>('instructions')

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-400 bg-green-500/10'
      case 'medium': return 'text-yellow-400 bg-yellow-500/10'
      case 'hard': return 'text-red-400 bg-red-500/10'
      default: return 'text-gray-400 bg-gray-500/10'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl 
          flex items-center justify-center">
          <span className="text-3xl">{exercise.icon}</span>
        </div>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-white">{exercise.name}</h2>
          <p className="text-gray-400">{exercise.description}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(exercise.difficulty)}`}>
              {exercise.difficulty}
            </span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {exercise.duration}
            </span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Target className="w-4 h-4" />
              {exercise.equipment}
            </span>
          </div>
        </div>
      </div>

      {/* Video Placeholder */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
        <div className="aspect-video bg-slate-700/50 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <MonitorPlay className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400 mb-2">Video Tutorial</h3>
            <p className="text-slate-500 mb-4">
              In una versione completa, qui ci sarebbe il video HD dell'esercizio
            </p>
            <button className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-all">
              <Play className="w-4 h-4 inline mr-2" />
              Play Video
            </button>
          </div>
        </div>
      </div>

      {/* Exercise Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50 text-center">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Target className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-sm text-gray-400 mb-1">Muscoli Coinvolti</p>
          <div className="flex flex-wrap gap-1 justify-center">
            {exercise.muscles.map((muscle: string, i: number) => (
              <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs">
                {muscle}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50 text-center">
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-sm text-gray-400 mb-1">Durata</p>
          <p className="text-lg font-bold text-white">{exercise.duration}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50 text-center">
          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Zap className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-sm text-gray-400 mb-1">Equipaggiamento</p>
          <p className="text-lg font-bold text-white">{exercise.equipment}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="flex border-b border-slate-700/50">
          {[
            { id: 'instructions', label: 'Istruzioni', icon: BookOpen },
            { id: 'mistakes', label: 'Errori Comuni', icon: AlertCircle },
            { id: 'progressions', label: 'Progressioni', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 transition-all ${
                activeTab === tab.id
                  ? 'bg-green-500/10 text-green-400 border-b-2 border-green-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'instructions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-4">Come Eseguire</h3>
              <ol className="space-y-3">
                {exercise.instructions.map((instruction: string, i: number) => (
                  <li key={i} className="flex gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-gray-300">{instruction}</p>
                  </li>
                ))}
              </ol>
              
              {exercise.tips && (
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Consigli Utili
                  </h4>
                  <ul className="space-y-1">
                    {exercise.tips.map((tip: string, i: number) => (
                      <li key={i} className="text-blue-100 text-sm flex gap-2">
                        <span className="text-blue-400">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'mistakes' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-4">Errori da Evitare</h3>
              <div className="space-y-3">
                {exercise.commonMistakes.map((mistake: string, i: number) => (
                  <div key={i} className="flex gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-100">{mistake}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'progressions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-4">Livelli di Progressione</h3>
              <div className="space-y-3">
                {exercise.progressions.map((progression: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {i + 1}
                    </div>
                    <p className="text-gray-300">{progression}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white font-bold hover:bg-slate-700 transition-all"
        >
          <ArrowLeft className="w-5 h-5 inline mr-2" />
          Indietro
        </button>
        
        <button className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-bold hover:shadow-lg transition-all">
          <Play className="w-5 h-5 inline mr-2" />
          Prova in Allenamento Libero
        </button>
      </div>
    </div>
  )
}

const ExerciseList = ({ category, exercises, onSelectExercise, onBack }: any) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('all')

  const filteredExercises = exercises.filter((exercise: any) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exercise.muscles.some((muscle: string) => muscle.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesDifficulty = difficultyFilter === 'all' || exercise.difficulty.toLowerCase() === difficultyFilter
    return matchesSearch && matchesDifficulty
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`w-16 h-16 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center`}>
          <span className="text-3xl">{category.icon}</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white">{category.name}</h2>
          <p className="text-gray-400">{category.description}</p>
          <p className="text-sm text-green-400 mt-1">{exercises.length} esercizi disponibili</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca esercizi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
          />
        </div>
        
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:border-green-500 focus:outline-none"
        >
          <option value="all">Tutte le difficoltà</option>
          <option value="easy">Facile</option>
          <option value="medium">Medio</option>
          <option value="hard">Difficile</option>
        </select>
      </div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExercises.map((exercise: any, index: number) => (
          <motion.div
            key={exercise.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <ExerciseCard exercise={exercise} onSelect={onSelectExercise} />
          </motion.div>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nessun esercizio trovato</h3>
          <p className="text-gray-400">Prova a modificare i filtri di ricerca</p>
        </div>
      )}

      {/* Back Button */}
      <div className="flex">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white font-bold hover:bg-slate-700 transition-all"
        >
          <ArrowLeft className="w-5 h-5 inline mr-2" />
          Torna alle Categorie
        </button>
      </div>
    </div>
  )
}

// ====================================
// MAIN COMPONENT
// ====================================

export default function TrainingLibraryPage() {
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [selectedExercise, setSelectedExercise] = useState<any>(null)

  const handleSelectCategory = (category: any) => {
    setSelectedCategory(category)
    setSelectedExercise(null)
  }

  const handleSelectExercise = (exercise: any) => {
    setSelectedExercise(exercise)
  }

  const handleBack = () => {
    if (selectedExercise) {
      setSelectedExercise(null)
    } else {
      setSelectedCategory(null)
    }
  }

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
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                  <MonitorPlay className="w-8 h-8 text-white" />
                </div>
                Libreria Tecniche
              </h1>
              <p className="text-slate-400 mt-1">
                {selectedExercise 
                  ? selectedExercise.name 
                  : selectedCategory 
                  ? `${selectedCategory.name} - ${EXERCISES_DATA[selectedCategory.id]?.length || 0} esercizi`
                  : 'Video tutorial e guide per ogni esercizio'}
              </p>
            </div>
          </div>

          {!selectedCategory && !selectedExercise && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
              <p className="text-orange-400 text-sm font-medium">Video Library 🎥</p>
              <p className="text-orange-100 text-xs">HD Videos • Slow Motion • Mistakes</p>
            </div>
          )}
        </div>

        {/* Content */}
        {selectedExercise ? (
          <ExerciseDetail exercise={selectedExercise} onBack={handleBack} />
        ) : selectedCategory ? (
          <ExerciseList 
            category={selectedCategory}
            exercises={EXERCISES_DATA[selectedCategory.id] || []}
            onSelectExercise={handleSelectExercise}
            onBack={handleBack}
          />
        ) : (
          <div className="space-y-8">
            {/* Info Banner */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl p-6 border border-orange-500/30 backdrop-blur-xl"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <Info className="w-6 h-6 text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">Libreria Video Completa</h3>
                  <p className="text-slate-300 text-sm">
                    Impara ogni esercizio con tutorial HD, slow motion e analisi degli errori più comuni. 
                    Ogni movimento spiegato passo dopo passo per una tecnica perfetta.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {EXERCISE_CATEGORIES.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CategoryCard category={category} onSelect={handleSelectCategory} />
                </motion.div>
              ))}
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Video className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Video HD</h3>
                <p className="text-slate-400 text-sm">
                  Ogni esercizio filmato in alta definizione da multiple angolazioni
                </p>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 text-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Errori Comuni</h3>
                <p className="text-slate-400 text-sm">
                  Impara cosa NON fare per evitare infortuni e massimizzare i risultati
                </p>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Progressioni</h3>
                <p className="text-slate-400 text-sm">
                  Varianti per ogni livello, dal principiante all'atleta avanzato
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}essuno',
      videoUrl: '#',
      description: 'Esercizio base per la parte superiore del corpo',
      instructions: [
        'Posizionati in plank con mani sotto le spalle',
        'Mantieni il corpo dritto dalla testa ai piedi', 
        'Scendi controllato fino a toccare il petto',
        'Spingi su tornando alla posizione iniziale'
      ],
      commonMistakes: [
        'Fare "snake push-ups" - corpo non dritto',
        'Non scendere abbastanza',
        'Alzare troppo i fianchi'
      ],
      progressions: [
        'Wall Push-ups (Principiante)',
        'Knee Push-ups (Principiante)', 
        'Standard Push-ups (Intermedio)',
        'Diamond Push-ups (Avanzato)'
      ],
      tips: [
        'Respira in discesa, espira in salita',
        'Mantieni gli addominali contratti',
        'Guarda leggermente avanti, non in basso'
      ]
    },
    {
      id: 'pullups',
      name: 'Pull-ups',
      icon: '🏋️',
      difficulty: 'Hard',
      duration: '30-45 sec',
      muscles: ['Dorsali', 'Bicipiti', 'Spalle'],
      equipment: 'Sbarra',
      videoUrl: '#',
      description: 'Esercizio fondamentale per il dorso',
      instructions: [
        'Afferra la sbarra con presa prona',
        'Pendi con braccia completamente estese',
        'Tira il corpo su fino al mento sopra la sbarra',
        'Scendi controllato alla posizione iniziale'
      ],
      commonMistakes: [
        'Usare lo slancio delle gambe',
        'Non estendere completamente le braccia',
        'Non arrivare con il mento sopra la sbarra'
      ],
      progressions: [
        'Negative Pull-ups (Principiante)',
        'Assisted Pull-ups (Principiante)',
        'Standard Pull-ups (Avanzato)',
        'Weighted Pull-ups (Esperto)'
      ],
      tips: [
        'Inizia dalle negative se non riesci',
        'Mantieni le scapole depresse',
        'Non oscillare durante il movimento'
      ]
    }
  ],
  lower_body: [
    {
      id: 'squats',
      name: 'Squats',
      icon: '🦵',
      difficulty: 'Easy',
      duration: '45-60 sec',
      muscles: ['Quadricipiti', 'Glutei', 'Polpacci'],
      equipment: 'Nessuno',
      videoUrl: '#',
      description: 'Re degli esercizi per le gambe',
      instructions: [
        'Piedi larghezza spalle, punte leggermente aperte',
        'Scendi come se ti sedessi su una sedia',
        'Mantieni il peso sui talloni',
        'Risali spingendo attraverso i talloni'
      ],
      commonMistakes: [
        'Ginocchia che cedono verso l\'interno',
        'Non scendere abbastanza (sotto il parallelo)',
        'Peso sulle punte dei piedi'
      ],
      progressions: [
        'Chair Squats (Principiante)',
        'Bodyweight Squats (Base)',
        'Jump Squats (Avanzato)',
        'Pistol Squats (Esperto)'
      ],
      tips: [
        'Mantieni il petto alto',
        'Le ginocchia seguono la direzione dei piedi',
        'Inspira in discesa, espira in salita'
      ]
    }
  ],
  core: [
    {
      id: 'plank',
      name: 'Plank',
      icon: '💎',
      difficulty: 'Easy',
      duration: '30-120 sec',
      muscles: ['Core', 'Spalle', 'Glutei'],
      equipment: 'Nessuno',
      videoUrl: '#',
      description: 'Esercizio isometrico per il core',
      instructions: [
        'Posizione a faccia in giù su avambracci e piedi',
        'Corpo dritto come una tavola',
        'Contrai addominali e glutei',
        'Respira normalmente mantenendo la posizione'
      ],
      commonMistakes: [
        'Fianchi troppo in alto o troppo in basso',
        'Trattenere il respiro',
        'Non contrarre gli addominali'
      ],
      progressions: [
        'Wall Plank (Principiante)',
        'Knee Plank (Principiante)', 
        'Standard Plank (Base)',
        'One-Arm Plank (Avanzato)'
      ],
      tips: [
        'Immagina di stringere una moneta tra i glutei',
        'Guarda un punto fisso davanti a te',
        'Qualità prima di quantità'
      ]
    }
  ],
  full_body: [
    {
      id: 'burpees',
      name: 'Burpees',
      icon: '🔥',
      difficulty: 'Hard',
      duration: '20-40 sec',
      muscles: ['Full Body'],
      equipment: 'N