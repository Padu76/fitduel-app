'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Play, Pause, RotateCcw, Settings, 
  Dumbbell, Activity, Target, Zap, Timer, 
  CheckCircle, AlertCircle, Filter, Search,
  Grid, List, Award, Star, Crown, Camera,
  Volume2, Maximize, Info, Eye, TrendingUp
} from 'lucide-react'

// ====================================
// IMPORTS FROM REAL SYSTEM
// ====================================
import { 
  EXERCISE_DEFINITIONS, 
  EXERCISE_CATEGORIES,
  DIFFICULTY_LEVELS,
  getExercisesByCategory
} from '@/components/game/ai-tracker/constants/exercises'
import type { ExerciseConfig } from '@/components/game/ai-tracker/types'
import { AIExerciseTracker } from '@/components/game/ai-tracker/AIExerciseTracker'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ====================================
// TYPES
// ====================================
type ViewMode = 'grid' | 'list'
type FilterType = 'all' | 'strength' | 'cardio' | 'core'
type SortType = 'name' | 'difficulty' | 'calories'

// ====================================
// UTILS - TYPE SAFE FUNCTIONS
// ====================================
const calculateEstimatedCalories = (exercise: ExerciseConfig): number => {
  const caloriesPerRep = exercise.caloriesPerRep || 0.5 // Safe default
  const targetValue = exercise.targetReps || exercise.targetTime || 20 // Smart fallback
  return Math.round(caloriesPerRep * targetValue)
}

const getDisplayTarget = (exercise: ExerciseConfig): string => {
  if (exercise.targetReps) return `${exercise.targetReps} reps`
  if (exercise.targetTime) return `${exercise.targetTime}s`
  return '20 reps' // Default
}

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
  const totalExercises = Object.keys(EXERCISE_DEFINITIONS).length

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Cerca esercizi per nome, categoria..."
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
            Tutti ({totalExercises})
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
            <option value="name">Nome</option>
            <option value="difficulty">Difficoltà</option>
            <option value="calories">Calorie</option>
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
  const estimatedCalories = calculateEstimatedCalories(exercise) // ✅ TYPE SAFE
  const displayTarget = getDisplayTarget(exercise) // ✅ TYPE SAFE

  if (viewMode === 'list') {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => onSelect(exercise)}
        className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50 hover:border-green-500/50 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center`}>
              <span className="text-xl">{category.icon}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors">{exercise.name}</h3>
              <p className="text-sm text-gray-400 mb-1">{exercise.description}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{displayTarget}</span>
                <span>•</span>
                <span>~{estimatedCalories} cal</span>
                <span>•</span>
                <span className={`font-medium ${difficulty.color}`}>{difficulty.name}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-center">
              <Camera className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <span className="text-xs text-blue-400 font-medium">AI Ready</span>
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
            <h3 className="text-xl font-bold text-white group-hover:text-green-400 transition-colors">{exercise.name}</h3>
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
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-400">Target</span>
          </div>
          <p className="text-lg font-bold text-white">{displayTarget}</p>
        </div>
        
        <div className="bg-slate-700/30 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-orange-400">Calorie</span>
          </div>
          <p className="text-lg font-bold text-white">{estimatedCalories}</p>
        </div>
      </div>
      
      {/* AI Features */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
          <Camera className="w-3 h-3" />
          <span>AI Tracking</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
          <Volume2 className="w-3 h-3" />
          <span>Voice Coach</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex items-center justify-center group-hover:bg-green-500/10 rounded-lg p-3 transition-all">
        <Play className="w-5 h-5 text-green-400 mr-2 group-hover:scale-110 transition-transform" />
        <span className="text-green-400 font-medium">Inizia Allenamento</span>
      </div>
    </motion.div>
  )
}

const AITrainingSession = ({ 
  exercise, 
  onBack,
  userId 
}: { 
  exercise: ExerciseConfig
  onBack: () => void
  userId: string
}) => {
  const handleComplete = (data: any) => {
    console.log('Exercise completed:', data)
    onBack()
  }

  const handleProgress = (progress: number) => {
    console.log('Progress:', progress)
  }

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Free Training AI</h2>
            <p className="text-gray-400">{exercise.name} • Modalità Libera</p>
          </div>
        </div>
        
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Torna agli Esercizi
        </Button>
      </div>

      {/* AI Tracker Component */}
      <AIExerciseTracker
        exerciseId={exercise.id}
        userId={userId}
        targetReps={exercise.targetReps}
        targetTime={exercise.targetTime}
        onComplete={handleComplete}
        onProgress={handleProgress}
        strictMode={false} // Free training, no pressure
      />

      {/* Training Info */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Activity className="w-5 h-5 text-green-400" />
          <h3 className="font-bold text-white">Modalità Free Training</h3>
        </div>
        <p className="text-gray-300 text-sm mb-3">
          Stai usando il sistema AI completo senza pressione competitiva. 
          Perfetto per imparare, praticare e migliorare la tua tecnica.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Senza Pressione</span>
          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">AI Tracking Completo</span>
          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">Focus sulla Tecnica</span>
        </div>
      </Card>
    </div>
  )
}

// ====================================
// MAIN COMPONENT
// ====================================
export default function FreeTrainingPage() {
  const router = useRouter()
  
  // State
  const [selectedCategory, setSelectedCategory] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExercise, setSelectedExercise] = useState<ExerciseConfig | null>(null)
  const [aiTrainingActive, setAiTrainingActive] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortType>('name')
  const [userId] = useState('free-training-user') // In real app, get from auth

  // Get all exercises from real system - TYPE SAFE
  const allExercises = Object.values(EXERCISE_DEFINITIONS)

  // Filter and sort exercises
  const filteredExercises = allExercises
    .filter(exercise => {
      // Category filter
      if (selectedCategory !== 'all' && exercise.category !== selectedCategory) return false
      
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        return (
          exercise.name.toLowerCase().includes(searchLower) ||
          exercise.category.toLowerCase().includes(searchLower) ||
          exercise.description.toLowerCase().includes(searchLower)
        )
      }
      
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'difficulty':
          const diffOrder = { easy: 1, medium: 2, hard: 3, extreme: 4 }
          return diffOrder[a.difficulty] - diffOrder[b.difficulty]
        case 'calories':
          return calculateEstimatedCalories(b) - calculateEstimatedCalories(a)
        default:
          return a.name.localeCompare(b.name)
      }
    })

  const handleExerciseSelect = (exercise: ExerciseConfig) => {
    setSelectedExercise(exercise)
    setAiTrainingActive(true)
  }

  const handleBackToExercises = () => {
    setSelectedExercise(null)
    setAiTrainingActive(false)
  }

  // AI Training Active View
  if (aiTrainingActive && selectedExercise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <AITrainingSession
            exercise={selectedExercise}
            onBack={handleBackToExercises}
            userId={userId}
          />
        </div>
      </div>
    )
  }

  // Main Free Training View
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
                  <Activity className="w-8 h-8 text-white" />
                </div>
                Free Training AI
              </h1>
              <p className="text-slate-400 mt-1">
                Allenati liberamente con {allExercises.length} esercizi e sistema AI completo
              </p>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <p className="text-green-400 text-sm font-medium">Modalità Libera 🎯</p>
            <p className="text-green-100 text-xs">Nessuna pressione • Solo miglioramento</p>
          </div>
        </div>

        {/* AI System Info */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border border-blue-500/30 backdrop-blur-xl mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Camera className="w-8 h-8 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">Sistema AI Completo Attivo</h3>
              <p className="text-blue-100 text-sm mb-4">
                Ogni esercizio utilizza MediaPipe per analisi in tempo reale, conteggio automatico 
                ripetizioni e feedback vocale personalizzato. Zero pressione, massimo apprendimento.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                  ✓ {allExercises.length} Esercizi Completi
                </span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                  ✓ MediaPipe AI
                </span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                  ✓ Voice Coaching
                </span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                  ✓ Performance Tracking
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <ExerciseFilters
          activeFilter={selectedCategory}
          onFilterChange={setSelectedCategory}
          searchTerm={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6 mt-8">
          <p className="text-gray-400">
            Trovati {filteredExercises.length} esercizi
            {searchQuery && ` per "${searchQuery}"`}
            {selectedCategory !== 'all' && ` nella categoria "${EXERCISE_CATEGORIES[selectedCategory]?.name}"`}
          </p>
          <div className="text-sm text-gray-500">
            Vista: <span className="text-green-400 font-medium capitalize">{viewMode}</span>
          </div>
        </div>

        {/* Exercises Grid/List */}
        {filteredExercises.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Nessun esercizio trovato</h3>
            <p className="text-gray-500">Prova a modificare i filtri di ricerca</p>
          </div>
        ) : (
          <motion.div
            key={`${viewMode}-${selectedCategory}`}
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
                  onSelect={handleExerciseSelect}
                  viewMode={viewMode}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Camera className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">AI Tracking Completo</h3>
            <p className="text-slate-400 text-sm">
              Sistema MediaPipe per analisi movimenti in tempo reale
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Volume2 className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Voice Coaching</h3>
            <p className="text-slate-400 text-sm">
              Feedback vocale personalizzato per migliorare la tecnica
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Zero Pressione</h3>
            <p className="text-slate-400 text-sm">
              Focus sulla tecnica e miglioramento personale senza competizione
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}