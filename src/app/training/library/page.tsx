'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Play, Search, Filter, MonitorPlay, 
  Clock, Target, Star, BookOpen, Video, 
  AlertCircle, CheckCircle, Info, Eye,
  Heart, Zap, Award, TrendingUp
} from 'lucide-react'

// Mock data for exercises library
const mockExercises = [
  {
    id: 1,
    name: 'Push-ups',
    category: 'Upper Body',
    difficulty: 'Easy',
    duration: '30s',
    calories: 15,
    rating: 4.8,
    views: 1234,
    equipment: 'Nessuno',
    videoUrl: '#',
    description: 'Esercizio base per la parte superiore del corpo',
    instructions: [
      'Posizionati a terra in posizione prona',
      'Appoggia le mani al suolo alla larghezza delle spalle',
      'Mantieni il corpo dritto dalla testa ai talloni',
      'Abbassa il corpo fino a sfiorare il suolo',
      'Spingi verso l\'alto tornando alla posizione iniziale'
    ],
    muscles: ['Pettorali', 'Tricipiti', 'Core', 'Spalle'],
    tips: ['Mantieni il core contratto', 'Non alzare i fianchi', 'Controlla la discesa']
  },
  {
    id: 2,
    name: 'Squats',
    category: 'Lower Body', 
    difficulty: 'Easy',
    duration: '45s',
    calories: 20,
    rating: 4.9,
    views: 2156,
    equipment: 'Nessuno',
    videoUrl: '#',
    description: 'Esercizio fondamentale per gambe e glutei',
    instructions: [
      'Posiziona i piedi alla larghezza delle spalle',
      'Abbassa il corpo come se ti stessi sedendo',
      'Mantieni il peso sui talloni',
      'Scendi fino a che le cosce sono parallele al suolo',
      'Risali spingendo sui talloni'
    ],
    muscles: ['Quadricipiti', 'Glutei', 'Polpacci', 'Core'],
    tips: ['Ginocchia allineate ai piedi', 'Petto in fuori', 'Non incurvare la schiena']
  },
  {
    id: 3,
    name: 'Burpees',
    category: 'Full Body',
    difficulty: 'Hard',
    duration: '60s', 
    calories: 35,
    rating: 4.6,
    views: 987,
    equipment: 'Nessuno',
    videoUrl: '#',
    description: 'Esercizio completo ad alta intensità',
    instructions: [
      'Inizia in posizione eretta',
      'Scendi in squat e appoggia le mani',
      'Salta indietro in posizione plank',
      'Esegui un push-up',
      'Torna in squat e salta in alto'
    ],
    muscles: ['Full Body', 'Cardio', 'Core', 'Resistenza'],
    tips: ['Mantieni il ritmo costante', 'Atterraggio morbido', 'Respira regolarmente']
  },
  {
    id: 4,
    name: 'Plank',
    category: 'Core',
    difficulty: 'Medium',
    duration: '60s',
    calories: 12,
    rating: 4.7,
    views: 1876,
    equipment: 'Nessuno',
    videoUrl: '#',
    description: 'Esercizio isometrico per il core',
    instructions: [
      'Posizionati in posizione prona',
      'Appoggia gli avambracci al suolo',
      'Mantieni il corpo dritto',
      'Contrai addominali e glutei',
      'Mantieni la posizione'
    ],
    muscles: ['Core', 'Spalle', 'Schiena'],
    tips: ['Non alzare i fianchi', 'Respira normalmente', 'Guarda il pavimento']
  },
  {
    id: 5,
    name: 'Mountain Climbers',
    category: 'Cardio',
    difficulty: 'Medium',
    duration: '30s',
    calories: 25,
    rating: 4.5,
    views: 1543,
    equipment: 'Nessuno', 
    videoUrl: '#',
    description: 'Esercizio cardio dinamico',
    instructions: [
      'Inizia in posizione plank',
      'Porta un ginocchio al petto',
      'Alterna rapidamente le gambe',
      'Mantieni il core stabile',
      'Continua il movimento alternato'
    ],
    muscles: ['Core', 'Gambe', 'Cardio', 'Spalle'],
    tips: ['Mantieni i fianchi stabili', 'Ritmo sostenuto', 'Core sempre attivo']
  },
  {
    id: 6,
    name: 'Lunges',
    category: 'Lower Body',
    difficulty: 'Easy',
    duration: '45s',
    calories: 18,
    rating: 4.8,
    views: 1321,
    equipment: 'Nessuno',
    videoUrl: '#',
    description: 'Esercizio unilaterale per gambe e equilibrio',
    instructions: [
      'Posizione eretta con piedi uniti',
      'Fai un passo avanti con una gamba',
      'Abbassa il corpo verso il basso',
      'Il ginocchio anteriore a 90 gradi',
      'Torna alla posizione iniziale'
    ],
    muscles: ['Quadricipiti', 'Glutei', 'Polpacci'],
    tips: ['Non toccare il suolo con il ginocchio', 'Busto dritto', 'Peso distribuito']
  }
]

const categories = ['All', 'Upper Body', 'Lower Body', 'Core', 'Cardio', 'Full Body']
const difficulties = ['All', 'Easy', 'Medium', 'Hard']
const equipment = ['All', 'Nessuno', 'Manubri', 'Elastici']

export default function TrainingLibrary() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState('All')
  const [selectedEquipment, setSelectedEquipment] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExercise, setSelectedExercise] = useState(null)

  const filteredExercises = mockExercises.filter(exercise => {
    return (selectedCategory === 'All' || exercise.category === selectedCategory) &&
           (selectedDifficulty === 'All' || exercise.difficulty === selectedDifficulty) &&
           (selectedEquipment === 'All' || exercise.equipment === selectedEquipment) &&
           (searchTerm === '' || exercise.name.toLowerCase().includes(searchTerm.toLowerCase()))
  })

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400 bg-green-400/20'
      case 'Medium': return 'text-yellow-400 bg-yellow-400/20'  
      case 'Hard': return 'text-red-400 bg-red-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Upper Body': return <TrendingUp className="w-4 h-4" />
      case 'Lower Body': return <Target className="w-4 h-4" />
      case 'Core': return <Zap className="w-4 h-4" />
      case 'Cardio': return <Heart className="w-4 h-4" />
      case 'Full Body': return <Award className="w-4 h-4" />
      default: return <BookOpen className="w-4 h-4" />
    }
  }

  // Simple inline components
  const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
    const baseClass = "px-4 py-2 rounded-lg font-medium transition-all duration-200"
    const variants = {
      primary: "bg-purple-600 hover:bg-purple-700 text-white",
      secondary: "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600",
      ghost: "bg-transparent hover:bg-gray-800 text-gray-400"
    }
    
    return (
      <button 
        className={`${baseClass} ${variants[variant]} ${className}`}
        onClick={onClick}
        {...props}
      >
        {children}
      </button>
    )
  }

  const Card = ({ children, className = '' }) => (
    <div className={`bg-gray-900/50 border border-gray-800 rounded-xl ${className}`}>
      {children}
    </div>
  )

  const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null
    
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/training">
                <Button variant="ghost" className="p-2">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Libreria Esercizi
                </h1>
                <p className="text-gray-400 text-sm">
                  Scopri tutti gli esercizi disponibili
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-purple-400" />
              <span className="text-sm text-gray-400">
                {filteredExercises.length} esercizi
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca esercizi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Categoria</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Difficoltà</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>{difficulty}</option>
                ))}
              </select>
            </div>

            {/* Equipment Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Attrezzatura</label>
              <select
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {equipment.map(eq => (
                  <option key={eq} value={eq}>{eq}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Exercise Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {filteredExercises.map((exercise, index) => (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all cursor-pointer">
                <div onClick={() => setSelectedExercise(exercise)}>
                  {/* Video Thumbnail */}
                  <div className="relative h-48 bg-gradient-to-br from-purple-900/30 to-cyan-900/30 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/20" />
                    <Play className="w-12 h-12 text-white opacity-80" />
                    <div className="absolute top-3 left-3">
                      {getCategoryIcon(exercise.category)}
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(exercise.difficulty)}`}>
                        {exercise.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Exercise Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">{exercise.name}</h3>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm">{exercise.rating}</span>
                      </div>
                    </div>

                    <p className="text-gray-400 text-sm mb-3">{exercise.description}</p>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center">
                        <Clock className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                        <span className="text-xs text-gray-400">{exercise.duration}</span>
                      </div>
                      <div className="text-center">
                        <Zap className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                        <span className="text-xs text-gray-400">{exercise.calories} cal</span>
                      </div>
                      <div className="text-center">
                        <Eye className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                        <span className="text-xs text-gray-400">{exercise.views}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {exercise.muscles.slice(0, 2).map(muscle => (
                        <span key={muscle} className="px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded-full">
                          {muscle}
                        </span>
                      ))}
                      {exercise.muscles.length > 2 && (
                        <span className="px-2 py-1 text-xs bg-gray-800 text-gray-400 rounded-full">
                          +{exercise.muscles.length - 2}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {exercise.equipment}
                      </span>
                      <Button variant="secondary" className="text-xs px-3 py-1">
                        Dettagli
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* No Results */}
        {filteredExercises.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">Nessun esercizio trovato</h3>
            <p className="text-gray-500">Prova a modificare i filtri di ricerca</p>
          </div>
        )}
      </div>

      {/* Exercise Detail Modal */}
      <Modal isOpen={!!selectedExercise} onClose={() => setSelectedExercise(null)}>
        {selectedExercise && (
          <div>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div className="flex items-center gap-3">
                {getCategoryIcon(selectedExercise.category)}
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedExercise.name}</h2>
                  <p className="text-gray-400 text-sm">{selectedExercise.category}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedExercise(null)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Video Player */}
              <div className="relative h-64 bg-gradient-to-br from-purple-900/30 to-cyan-900/30 rounded-xl flex items-center justify-center">
                <Play className="w-16 h-16 text-white opacity-80" />
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getDifficultyColor(selectedExercise.difficulty)}`}>
                    {selectedExercise.difficulty}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-800/30 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <span className="text-sm text-gray-400">Durata</span>
                  <p className="font-semibold text-white">{selectedExercise.duration}</p>
                </div>
                <div className="text-center p-3 bg-gray-800/30 rounded-lg">
                  <Zap className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                  <span className="text-sm text-gray-400">Calorie</span>
                  <p className="font-semibold text-white">{selectedExercise.calories}</p>
                </div>
                <div className="text-center p-3 bg-gray-800/30 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                  <span className="text-sm text-gray-400">Rating</span>
                  <p className="font-semibold text-white">{selectedExercise.rating}</p>
                </div>
                <div className="text-center p-3 bg-gray-800/30 rounded-lg">
                  <Eye className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                  <span className="text-sm text-gray-400">Views</span>
                  <p className="font-semibold text-white">{selectedExercise.views}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Descrizione</h3>
                <p className="text-gray-400">{selectedExercise.description}</p>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Istruzioni</h3>
                <div className="space-y-2">
                  {selectedExercise.instructions.map((instruction, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full text-xs flex items-center justify-center font-medium">
                        {index + 1}
                      </span>
                      <span className="text-gray-300">{instruction}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Muscles & Tips */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Muscles */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Muscoli Coinvolti</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedExercise.muscles.map(muscle => (
                      <span key={muscle} className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded-full text-sm">
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Suggerimenti</h3>
                  <div className="space-y-2">
                    {selectedExercise.tips.map((tip, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-300">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-800">
                <Button className="flex-1">
                  <Play className="w-4 h-4 mr-2" />
                  Inizia Esercizio
                </Button>
                <Button variant="secondary">
                  <Heart className="w-4 h-4 mr-2" />
                  Preferiti
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}