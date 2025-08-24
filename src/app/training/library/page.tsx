'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Play, Search, Filter, Info, 
  Clock, Target, Star, BookOpen, Video, 
  AlertCircle, CheckCircle, Eye, X,
  Users, Trophy, Zap, Camera, Settings,
  Dumbbell, Activity, Award, TrendingUp,
  Volume2, Maximize, Grid, List
} from 'lucide-react'

// ====================================
// IMPORTS FROM REAL SYSTEM
// ====================================
import { 
  EXERCISE_DEFINITIONS, 
  EXERCISE_CATEGORIES,
  DIFFICULTY_LEVELS,
  MUSCLE_GROUPS,
  getExercisesByCategory,
  getExercisesByDifficulty,
  getExercisesByMuscleGroup
} from '@/components/game/ai-tracker/constants/exercises'
import type { ExerciseConfig } from '@/components/game/ai-tracker/types'
import { AIExerciseTracker } from '@/components/game/ai-tracker/AIExerciseTracker'
import { Card } from '@/components/ui/Card'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ====================================
// TYPES
// ====================================
type ViewMode = 'grid' | 'list'
type FilterType = 'all' | 'strength' | 'cardio' | 'core'
type SortType = 'name' | 'difficulty' | 'muscle_groups'

interface ExerciseGuide extends ExerciseConfig {
  videoUrl?: string
  detailedInstructions?: string[]
  commonErrors?: string[]
  progressions?: string[]
  regressions?: string[]
  equipment?: string[]
  safetyTips?: string[]
  biomechanics?: string
  modifications?: string[]
}

// ====================================
// ENHANCED EXERCISE DATA
// ====================================
const enhanceExerciseWithGuideData = (exercise: ExerciseConfig): ExerciseGuide => ({
  ...exercise,
  detailedInstructions: exercise.instructions || [
    'Posizionati correttamente seguendo le indicazioni',
    'Mantieni il controllo durante tutto il movimento',
    'Respira in modo coordinato con l\'esecuzione',
    'Concentrati sulla qualitÃ  piuttosto che sulla quantitÃ '
  ],
  commonErrors: exercise.commonMistakes || [
    'Movimento troppo veloce',
    'Postura scorretta',
    'Range di movimento limitato',
    'Respirazione non coordinata'
  ],
  progressions: [
    'Aumenta gradualmente le ripetizioni',
    'Incrementa il tempo sotto tensione',
    'Aggiungi varianti piÃ¹ difficili',
    'Combina con altri esercizi'
  ],
  regressions: [
    'Riduci il range di movimento',
    'Usa supporti o modifiche',
    'Diminuisci l\'intensitÃ ',
    'Concentrati sulla tecnica base'
  ],
  equipment: ['Nessun attrezzo necessario', 'Solo il tuo corpo', 'Tappetino consigliato'],
  safetyTips: [
    'Riscaldati sempre prima di iniziare',
    'Fermati se senti dolore',
    'Mantieni una progressione graduale',
    'Ascolta il tuo corpo'
  ],
  biomechanics: `L'esercizio ${exercise.name} coinvolge principalmente i muscoli ${exercise.muscleGroups.join(', ')} attraverso un movimento controllato che sviluppa forza e coordinazione.`,
  modifications: [
    'Versione per principianti disponibile',
    'Adattabile per limitazioni fisiche',
    'Scalabile in base al livello'
  ]
})

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
          placeholder="Cerca per nome, categoria, muscolo..."
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
            <option value="name">Ordina: Nome</option>
            <option value="difficulty">Ordina: DifficoltÃ </option>
            <option value="muscle_groups">Ordina: Muscoli</option>
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
  exercise: ExerciseGuide
  onSelect: (exercise: ExerciseGuide) => void
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
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">{exercise.name}</h3>
              <p className="text-sm text-gray-400 mb-1">{exercise.description || 'Esercizio completo'}</p>
              <div className="flex flex-wrap gap-1">
                {exercise.muscleGroups.slice(0, 3).map((muscle) => (
                  <span key={muscle} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                    {muscle}
                  </span>
                ))}
                {exercise.muscleGroups.length > 3 && (
                  <span className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-400">
                    +{exercise.muscleGroups.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <Camera className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-400 font-medium">AI Ready</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${difficulty.bgColor} ${difficulty.color} border ${difficulty.borderColor}`}>
                {difficulty.name}
              </span>
            </div>
            
            <button className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all text-sm">
              <BookOpen className="w-4 h-4 inline mr-1" />
              Guida
            </button>
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
      <p className="text-sm text-gray-300 mb-4 line-clamp-2">{exercise.description || 'Esercizio completo per il fitness'}</p>
      
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
            {((exercise.caloriesPerRep || 0.5) * (exercise.targetReps || exercise.targetTime || 10)).toFixed(1)}
          </p>
        </div>
      </div>
      
      {/* Muscle Groups */}
      <div className="flex flex-wrap gap-1 mb-4">
        {exercise.muscleGroups.slice(0, 3).map((muscle, i) => (
          <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
            {muscle}
          </span>
        ))}
        {exercise.muscleGroups.length > 3 && (
          <span className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-400">
            +{exercise.muscleGroups.length - 3}
          </span>
        )}
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
      <div className="flex items-center justify-center group-hover:bg-green-500/10 rounded-lg p-2 transition-all">
        <BookOpen className="w-5 h-5 text-green-400 mr-2 group-hover:scale-110 transition-transform" />
        <span className="text-green-400 font-medium">Apri Guida Completa</span>
      </div>
    </motion.div>
  )
}

const ExerciseGuideModal = ({ 
  exercise, 
  onClose,
  onStartAI,
  userId 
}: { 
  exercise: ExerciseGuide
  onClose: () => void
  onStartAI: (exercise: ExerciseGuide) => void
  userId: string
}) => {
  const difficulty = DIFFICULTY_LEVELS[exercise.difficulty]
  const category = EXERCISE_CATEGORIES[exercise.category]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center`}>
                <span className="text-3xl">{category.icon}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{exercise.name}</h2>
                <p className="text-gray-400">{exercise.description || 'Esercizio completo'}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${difficulty.bgColor} ${difficulty.color} border ${difficulty.borderColor}`}>
                    {difficulty.name}
                  </span>
                  <div className="flex items-center gap-1 text-blue-400">
                    <Camera className="w-4 h-4" />
                    <span className="text-sm">AI Ready</span>
                  </div>
                  <div className="flex items-center gap-1 text-orange-400">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm">
                      {((exercise.caloriesPerRep || 0.5) * (exercise.targetReps || exercise.targetTime || 10)).toFixed(1)} cal
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <Target className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">
                {exercise.targetReps || exercise.targetTime}
              </p>
              <p className="text-xs text-gray-400">
                {exercise.targetReps ? 'Ripetizioni' : 'Secondi'}
              </p>
            </Card>
            <Card className="p-4 text-center">
              <Activity className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">
                {exercise.muscleGroups.length}
              </p>
              <p className="text-xs text-gray-400">Muscoli</p>
            </Card>
            <Card className="p-4 text-center">
              <Zap className="w-6 h-6 text-orange-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">
                {((exercise.caloriesPerRep || 0.5) * (exercise.targetReps || exercise.targetTime || 10)).toFixed(1)}
              </p>
              <p className="text-xs text-gray-400">Calorie</p>
            </Card>
            <Card className="p-4 text-center">
              <Camera className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">AI</p>
              <p className="text-xs text-gray-400">Tracking</p>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Instructions */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                Istruzioni Dettagliate
              </h3>
              <ol className="space-y-3">
                {exercise.detailedInstructions?.map((instruction, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="text-gray-300 text-sm">{instruction}</span>
                  </li>
                ))}
              </ol>
            </Card>

            {/* Common Errors */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                Errori da Evitare
              </h3>
              <ul className="space-y-2">
                {exercise.commonErrors?.map((error, i) => (
                  <li key={i} className="flex gap-2 text-red-100">
                    <span className="text-red-400 mt-1">⚠️</span>
                    <span className="text-sm">{error}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Muscle Groups */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Muscoli Coinvolti
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {exercise.muscleGroups.map((muscle, i) => (
                  <div key={i} className="bg-purple-500/20 rounded-lg p-3 text-center">
                    <span className="text-purple-300 text-sm font-medium">{muscle}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Progressions & Regressions */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Progressioni
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-green-400 mb-2">Per Avanzare:</h4>
                  <ul className="space-y-1">
                    {exercise.progressions?.map((prog, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-green-400 mt-1">↗️</span>
                        <span>{prog}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-yellow-400 mb-2">Per Semplificare:</h4>
                  <ul className="space-y-1">
                    {exercise.regressions?.map((reg, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-yellow-400 mt-1">↙️</span>
                        <span>{reg}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Safety & Equipment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-400" />
                Attrezzatura
              </h3>
              <ul className="space-y-2">
                {exercise.equipment?.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                Sicurezza
              </h3>
              <ul className="space-y-2">
                {exercise.safetyTips?.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-yellow-100">
                    <span className="text-yellow-400 mt-1">🛡️</span>
                    <span className="text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Biomechanics */}
          {exercise.biomechanics && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                Biomeccanica
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">{exercise.biomechanics}</p>
            </Card>
          )}

          {/* AI System Integration */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-400" />
              Sistema AI Integrato
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-sm font-medium text-blue-400 mb-2">Analisi in Tempo Reale:</h4>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li>• MediaPipe Pose Detection</li>
                  <li>• Form Score Analysis</li>
                  <li>• Automatic Rep Counting</li>
                  <li>• Movement Quality Assessment</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-green-400 mb-2">Feedback Intelligente:</h4>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li>• Voice Coaching System</li>
                  <li>• Real-time Corrections</li>
                  <li>• Performance Tracking</li>
                  <li>• Progress Analytics</li>
                </ul>
              </div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-100 text-sm">
                🤖 <strong>Sistema Enterprise:</strong> Il nostro AI tracker utilizza algoritmi avanzati 
                per analizzare ogni movimento, fornire correzioni istantanee e tracciare i tuoi progressi 
                con precisione scientifica.
              </p>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
            >
              Chiudi Guida
            </button>
            <button
              onClick={() => onStartAI(exercise)}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Prova con AI Tracker
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

const AITrainingSession = ({ 
  exercise, 
  onBack,
  userId 
}: { 
  exercise: ExerciseGuide
  onBack: () => void
  userId: string
}) => {
  const handleComplete = (data: any) => {
    console.log('Exercise completed:', data)
    // Show completion screen or return to library
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
            <h2 className="text-2xl font-bold text-white">AI Training Session</h2>
            <p className="text-gray-400">{exercise.name} • Library Mode</p>
          </div>
        </div>
        
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna alla Library
        </button>
      </div>

      {/* AI Tracker Component */}
      <AIExerciseTracker
        exerciseId={exercise.id}
        userId={userId}
        targetReps={exercise.targetReps}
        targetTime={exercise.targetTime}
        onComplete={handleComplete}
        onProgress={handleProgress}
        strictMode={false} // Library mode, not competition
      />

      {/* Exercise Info */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-white">Modalità Library</h3>
        </div>
        <p className="text-gray-300 text-sm mb-3">
          Stai testando l'esercizio <strong>{exercise.name}</strong> con il sistema AI completo. 
          Questo è perfetto per imparare la tecnica e provare nuovi movimenti.
        </p>
        <div className="flex flex-wrap gap-2">
          {exercise.muscleGroups.map((muscle) => (
            <span key={muscle} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
              {muscle}
            </span>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ====================================
// MAIN COMPONENT
// ====================================
export default function TrainingLibraryOptimized() {
  const [selectedCategory, setSelectedCategory] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExercise, setSelectedExercise] = useState<ExerciseGuide | null>(null)
  const [aiTrainingActive, setAiTrainingActive] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortType>('name')
  const [userId] = useState('mock-user-id') // In real app, get from auth

  // Enhanced exercises with guide data
  const allExercises = Object.values(EXERCISE_DEFINITIONS).map(enhanceExerciseWithGuideData)

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
          exercise.muscleGroups.some(muscle => muscle.toLowerCase().includes(searchLower)) ||
          (exercise.description?.toLowerCase().includes(searchLower) || false)
        )
      }
      
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'difficulty':
          const diffOrder = { easy: 1, medium: 2, hard: 3, extreme: 4 }
          return diffOrder[a.difficulty] - diffOrder[b.difficulty]
        case 'muscle_groups':
          return a.muscleGroups.length - b.muscleGroups.length
        default:
          return a.name.localeCompare(b.name)
      }
    })

  const handleExerciseSelect = (exercise: ExerciseGuide) => {
    setSelectedExercise(exercise)
  }

  const handleStartAI = (exercise: ExerciseGuide) => {
    setSelectedExercise(exercise)
    setAiTrainingActive(true)
  }

  const handleBackToLibrary = () => {
    setSelectedExercise(null)
    setAiTrainingActive(false)
  }

  // AI Training Session View
  if (aiTrainingActive && selectedExercise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <AITrainingSession
            exercise={selectedExercise}
            onBack={handleBackToLibrary}
            userId={userId}
          />
        </div>
      </div>
    )
  }

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
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                Libreria Esercizi AI
              </h1>
              <p className="text-slate-400 mt-1">
                Guide complete per {allExercises.length} esercizi con sistema AI integrato
              </p>
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
            <p className="text-purple-400 text-sm font-medium">Sistema Completo 🎯</p>
            <p className="text-purple-100 text-xs">Guide • AI Tracking • Performance</p>
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
              <h3 className="text-xl font-bold text-white mb-2">Libreria con AI Tracking Integrato</h3>
              <p className="text-blue-100 text-sm mb-4">
                Ogni esercizio include guide complete, istruzioni dettagliate, analisi biomeccanica 
                e la possibilità di testare immediatamente con il sistema AI MediaPipe.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                  ✓ {allExercises.length} Esercizi Completi
                </span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                  ✓ Guide Dettagliate
                </span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                  ✓ AI Testing Live
                </span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                  ✓ Analisi Biomeccanica
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
        </div>

        {/* Exercises Grid/List */}
        {filteredExercises.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
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

        {/* Exercise Guide Modal */}
        {selectedExercise && !aiTrainingActive && (
          <ExerciseGuideModal
            exercise={selectedExercise}
            onClose={() => setSelectedExercise(null)}
            onStartAI={handleStartAI}
            userId={userId}
          />
        )}

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Guide Complete</h3>
            <p className="text-slate-400 text-sm">
              Istruzioni dettagliate, biomeccanica e consigli per ogni esercizio
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Camera className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Test AI Immediato</h3>
            <p className="text-slate-400 text-sm">
              Prova ogni esercizio con il sistema AI per apprendere la tecnica corretta
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Progressioni Smart</h3>
            <p className="text-slate-400 text-sm">
              Suggerimenti per avanzare o semplificare ogni esercizio
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}