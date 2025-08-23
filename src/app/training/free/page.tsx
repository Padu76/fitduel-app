'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Play, Pause, RotateCcw, Settings, 
  Dumbbell, Activity, Target, Timer, Volume2,
  Eye, Camera, Maximize, Minimize, Info, CheckCircle,
  Filter, Search, Grid, List, Zap, Heart, Cpu,
  TrendingUp, Award, Clock
} from 'lucide-react'

// ====================================
// IMPORTS FROM REAL SYSTEM
// ====================================
import { 
  EXERCISE_DEFINITIONS, 
  EXERCISE_CATEGORIES,
  DIFFICULTY_LEVELS,
  getExercisesByCategory,
  getExercisesByDifficulty
} from '@/components/game/ai-tracker/constants/exercises'
import type { ExerciseConfig } from '@/components/game/ai-tracker/types'
import { AIExerciseTracker } from '@/components/game/ai-tracker/AIExerciseTracker'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

// ====================================
// TYPES
// ====================================
type ViewMode = 'grid' | 'list'
type FilterType = 'all' | 'strength' | 'cardio' | 'core'
type SortType = 'name' | 'difficulty' | 'calories'

// ====================================
// COMPONENTS
// ====================================

const ExerciseFilters = ({ 
  activeFilter, 
  onFilterChange, 
  searchTerm, 
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange
}: {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  searchTerm: string
  onSearchChange: (term: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  sortBy: SortType
  onSortChange: (sort: SortType) => void
}) => {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Cerca esercizio..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-gray-400 focus:border-green-500/50 focus:outline-none transition-all"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeFilter === 'all'
                ? 'bg-green-500 text-white'
                : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
            }`}
          >
            Tutti (26)
          </button>
          {Object.entries(EXERCISE_CATEGORIES).map(([key, category]) => {
            const count = getExercisesByCategory(key).length
            return (
              <button
                key={key}
                onClick={() => onFilterChange(key as FilterType)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeFilter === key
                    ? `bg-gradient-to-r ${category.color} text-white`
                    : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
                }`}
              >
                <span>{category.icon}</span>
                {category.name} ({count})
              </button>
            )
          })}
        </div>

        {/* View & Sort Controls */}
        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortType)}
            className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:border-green-500/50 focus:outline-none"
          >
            <option value="name">Ordina: Nome</option>
            <option value="difficulty">Ordina: Difficoltà</option>
            <option value="calories">Ordina: Calorie</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex bg-slate-700/50 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const ExerciseCard = ({ 
  exercise, 
  onSelect, 
  viewMode 
}: { 
  exercise: ExerciseConfig
  onSelect: (exercise: ExerciseConfig) => void
  viewMode: ViewMode
}) => {
  const difficulty = DIFFICULTY_LEVELS[exercise.difficulty]
  const category = EXERCISE_CATEGORIES[exercise.category]

  if (viewMode === 'list') {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => onSelect(exercise)}
        className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50 hover:border-green-500/50 transition-all cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center`}>
              <span className="text-xl">{category.icon}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{exercise.name}</h3>
              <p className="text-sm text-gray-400">{exercise.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-orange-400 font-medium">
                  {(exercise.caloriesPerRep * (exercise.targetReps || exercise.targetTime || 10)).toFixed(1)} cal
                </span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${difficulty.bgColor} ${difficulty.color} border ${difficulty.borderColor}`}>
                {difficulty.name}
              </span>
            </div>
            
            <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300">
              <Play className="w-4 h-4 mr-1" />
              Inizia
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(exercise)}
      className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-green-500/50 transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <span className="text-2xl">{category.icon}</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{exercise.name}</h3>
            <p className="text-sm text-gray-400">{category.name}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${difficulty.bgColor} ${difficulty.color} border ${difficulty.borderColor}`}>
          {difficulty.name}
        </span>
      </div>
      
      {/* Description */}
      <p className="text-sm text-gray-300 mb-4 line-clamp-2">{exercise.description}</p>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-700/30 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            {exercise.targetReps ? (
              <>
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-blue-400">Reps</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-purple-400">Tempo</span>
              </>
            )}
          </div>
          <p className="text-lg font-bold text-white">
            {exercise.targetReps || `${exercise.targetTime}s`}
          </p>
        </div>
        
        <div className="bg-slate-700/30 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-orange-400">Calorie</span>
          </div>
          <p className="text-lg font-bold text-white">
            {(exercise.caloriesPerRep * (exercise.targetReps || exercise.targetTime || 10)).toFixed(1)}
          </p>
        </div>
      </div>
      
      {/* Muscle Groups */}
      <div className="flex flex-wrap gap-1 mb-4">
        {exercise.muscleGroups.slice(0, 3).map((muscle, i) => (
          <span key={i} className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-400">
            {muscle}
          </span>
        ))}
        {exercise.muscleGroups.length > 3 && (
          <span className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-400">
            +{exercise.muscleGroups.length - 3}
          </span>
        )}
      </div>

      {/* Action Button */}
      <div className="flex items-center justify-center group-hover:bg-green-500/10 rounded-lg p-2 transition-all">
        <Play className="w-5 h-5 text-green-400 mr-2 group-hover:scale-110 transition-transform" />
        <span className="text-green-400 font-medium">Inizia Allenamento</span>
      </div>
    </motion.div>
  )
}

const ExerciseSession = ({ 
  exercise, 
  onBack,
  userId 
}: { 
  exercise: ExerciseConfig
  onBack: () => void
  userId: string
}) => {
  const [showInstructions, setShowInstructions] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const category = EXERCISE_CATEGORIES[exercise.category]
  const difficulty = DIFFICULTY_LEVELS[exercise.difficulty]

  // Handle completion
  const handleComplete = (data: any) => {
    // Show completion screen or return to selection
    console.log('Exercise completed:', data)
    // Could show results modal here
    onBack()
  }

  const handleProgress = (progress: number) => {
    console.log('Progress:', progress)
  }

  if (showInstructions) {
    return (
      <div className="space-y-6">
        {/* Exercise Header */}
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center`}>
            <span className="text-3xl">{category.icon}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white">{exercise.name}</h2>
            <p className="text-gray-400">{exercise.description}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm ${difficulty.bgColor} ${difficulty.color} border ${difficulty.borderColor}`}>
                {difficulty.name}
              </span>
              <div className="flex items-center gap-1 text-orange-400">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {(exercise.caloriesPerRep * (exercise.targetReps || exercise.targetTime || 10)).toFixed(1)} cal
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {exercise.instructions && (
          <Card className="p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              Come Eseguire l'Esercizio
            </h3>
            <ol className="space-y-3">
              {exercise.instructions.map((instruction, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-gray-300">{instruction}</span>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {/* Common Mistakes */}
        {exercise.commonMistakes && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Errori Comuni da Evitare
            </h3>
            <ul className="space-y-2">
              {exercise.commonMistakes.map((mistake, i) => (
                <li key={i} className="flex gap-2 text-yellow-100">
                  <span className="text-yellow-400">⚠️</span>
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Target & Muscle Groups */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-400" />
              Obiettivo
            </h3>
            <div className="space-y-2">
              {exercise.targetReps && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Ripetizioni:</span>
                  <span className="text-white font-bold">{exercise.targetReps}</span>
                </div>
              )}
              {exercise.targetTime && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Durata:</span>
                  <span className="text-white font-bold">{exercise.targetTime}s</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Calorie stimate:</span>
                <span className="text-orange-400 font-bold">
                  {(exercise.caloriesPerRep * (exercise.targetReps || exercise.targetTime || 10)).toFixed(1)}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              Muscoli Coinvolti
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {exercise.muscleGroups.map((muscle, i) => (
                <div key={i} className="bg-purple-500/20 rounded-lg p-2 text-center">
                  <span className="text-purple-300 text-sm font-medium">{muscle}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Start Button */}
        <div className="flex gap-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Torna Indietro
          </Button>
          <Button
            onClick={() => setShowInstructions(false)}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            <Play className="w-5 h-5 mr-2" />
            Inizia Allenamento
          </Button>
        </div>
      </div>
    )
  }

  // Real AI Tracker Session
  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center`}>
            <span className="text-xl">{category.icon}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{exercise.name}</h2>
            <p className="text-gray-400">Allenamento Libero • AI Tracking</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowInstructions(true)}
            variant="outline"
            size="sm"
          >
            <Info className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setIsFullscreen(!isFullscreen)}
            variant="outline"
            size="sm"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* AI Tracker Component */}
      <AIExerciseTracker
        exerciseId={exercise.id}
        userId={userId}
        targetReps={exercise.targetReps}
        targetTime={exercise.targetTime}
        onComplete={handleComplete}
        onProgress={handleProgress}
        strictMode={false} // Free training mode
      />

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-blue-400" />
          <span className="text-blue-400 font-medium">Modalità Allenamento Libero</span>
        </div>
        <p className="text-blue-100 text-sm">
          AI tracking attivo! Il sistema analizzerà la tua forma in tempo reale. 
          Concentrati sulla tecnica corretta e divertiti. Questa sessione non assegna XP o coins.
        </p>
      </div>
    </div>
  )
}

// ====================================
// MAIN COMPONENT
// ====================================

export default function FreeTrainingPageOptimized() {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseConfig | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortType>('name')

  // Mock user ID (in real app, get from auth context)
  const userId = 'mock-user-id'

  // Filter and sort exercises
  const filteredExercises = Object.values(EXERCISE_DEFINITIONS)
    .filter(exercise => {
      // Category filter
      if (activeFilter !== 'all' && exercise.category !== activeFilter) return false
      
      // Search filter
      if (searchTerm && !exercise.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
      
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'difficulty':
          const diffOrder = { easy: 1, medium: 2, hard: 3, extreme: 4 }
          return diffOrder[a.difficulty] - diffOrder[b.difficulty]
        case 'calories':
          const aCalories = a.caloriesPerRep * (a.targetReps || a.targetTime || 10)
          const bCalories = b.caloriesPerRep * (b.targetReps || b.targetTime || 10)
          return bCalories - aCalories
        default:
          return a.name.localeCompare(b.name)
      }
    })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
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
                {selectedExercise 
                  ? `Sessione ${selectedExercise.name} in corso` 
                  : `${filteredExercises.length} esercizi disponibili con AI tracking`
                }
              </p>
            </div>
          </div>

          {!selectedExercise && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <p className="text-green-400 text-sm font-medium">AI Tracking Attivo 🤖</p>
              <p className="text-green-100 text-xs">Analisi forma • Feedback vocale • Modalità relax</p>
            </div>
          )}
        </div>

        {/* Content */}
        {selectedExercise ? (
          <ExerciseSession 
            exercise={selectedExercise} 
            onBack={() => setSelectedExercise(null)}
            userId={userId}
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
                  <Cpu className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">Sistema AI Completo Attivo</h3>
                  <p className="text-slate-300 text-sm">
                    Tutti i 26 esercizi con tracking MediaPipe, analisi forma in tempo reale, 
                    feedback vocale e sistema anti-cheat. Perfetto per allenarsi senza pressione!
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-400">26</div>
                  <div className="text-xs text-blue-300">esercizi</div>
                </div>
              </div>
            </motion.div>

            {/* Filters */}
            <ExerciseFilters
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />

            {/* Exercise Grid/List */}
            <motion.div
              key={`${viewMode}-${activeFilter}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={
                viewMode === 'grid'
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              {filteredExercises.map((exercise, index) => (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ExerciseCard
                    exercise={exercise}
                    onSelect={setSelectedExercise}
                    viewMode={viewMode}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Empty State */}
            {filteredExercises.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-400 mb-2">Nessun esercizio trovato</h3>
                <p className="text-gray-500">Prova a cambiare i filtri di ricerca</p>
              </div>
            )}

            {/* Stats Footer */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Focus sulla Forma</h3>
                <p className="text-slate-400 text-sm">
                  AI analizza ogni movimento per forma perfetta
                </p>
              </Card>

              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Volume2 className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Feedback Vocale</h3>
                <p className="text-slate-400 text-sm">
                  Coaching in tempo reale per migliorare
                </p>
              </Card>

              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Al Tuo Ritmo</h3>
                <p className="text-slate-400 text-sm">
                  Zero pressione, massima personalizzazione
                </p>
              </Card>

              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Progresso Tracciato</h3>
                <p className="text-slate-400 text-sm">
                  Ogni sessione migliora le tue performance
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}