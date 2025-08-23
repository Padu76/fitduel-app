'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Play, Search, Filter, MonitorPlay, 
  Clock, Target, Star, BookOpen, Video, 
  AlertCircle, CheckCircle, Info, Eye,
  Users, Trophy, Zap, X
} from 'lucide-react'

// Define video type
interface VideoType {
  id: number
  title: string
  description: string
  category: string
  duration: string
  difficulty: string
  instructor: string
  thumbnail: string
  views: string
  rating: number
  tags: string[]
}

export default function TrainingLibrary() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null)

  const categories = [
    { id: 'all', name: 'Tutti', count: 156 },
    { id: 'strength', name: 'Forza', count: 45 },
    { id: 'cardio', name: 'Cardio', count: 38 },
    { id: 'flexibility', name: 'Flessibilità', count: 23 },
    { id: 'technique', name: 'Tecnica', count: 30 },
    { id: 'nutrition', name: 'Nutrizione', count: 20 }
  ]

  // Mock data - da sostituire con dati reali dal backend
  const videos: VideoType[] = [
    {
      id: 1,
      title: "Squat Perfetto: Tecnica Base",
      description: "Impara la tecnica corretta per eseguire lo squat in modo sicuro ed efficace",
      category: "strength",
      duration: "12:30",
      difficulty: "Easy",
      instructor: "Marco Fitness",
      thumbnail: "/api/placeholder/400/225",
      views: "12.5K",
      rating: 4.8,
      tags: ["squat", "gambe", "tecnica base"]
    },
    {
      id: 2,
      title: "HIIT Cardio Intenso",
      description: "Allenamento ad alta intensità per bruciare calorie e migliorare la resistenza",
      category: "cardio",
      duration: "20:00",
      difficulty: "Hard",
      instructor: "Sara Cardio",
      thumbnail: "/api/placeholder/400/225",
      views: "8.3K",
      rating: 4.9,
      tags: ["hiit", "cardio", "intenso"]
    },
    {
      id: 3,
      title: "Stretching Completo",
      description: "Routine di stretching per tutto il corpo, ideale dopo l'allenamento",
      category: "flexibility",
      duration: "15:45",
      difficulty: "Easy",
      instructor: "Anna Yoga",
      thumbnail: "/api/placeholder/400/225",
      views: "15.2K",
      rating: 4.7,
      tags: ["stretching", "flessibilità", "relax"]
    },
    {
      id: 4,
      title: "Deadlift: Tecnica Avanzata",
      description: "Perfeziona la tua tecnica del deadlift con consigli avanzati",
      category: "strength",
      duration: "18:20",
      difficulty: "Hard",
      instructor: "Luca Power",
      thumbnail: "/api/placeholder/400/225",
      views: "6.7K",
      rating: 4.9,
      tags: ["deadlift", "schiena", "avanzato"]
    },
    {
      id: 5,
      title: "Alimentazione Pre-Workout",
      description: "Come alimentarsi correttamente prima dell'allenamento",
      category: "nutrition",
      duration: "8:30",
      difficulty: "Easy",
      instructor: "Dr. Nutri",
      thumbnail: "/api/placeholder/400/225",
      views: "9.1K",
      rating: 4.6,
      tags: ["nutrizione", "pre-workout", "energia"]
    },
    {
      id: 6,
      title: "Corsa: Tecnica di Respirazione",
      description: "Migliora le tue performance di corsa con la tecnica di respirazione corretta",
      category: "cardio",
      duration: "10:15",
      difficulty: "Medium",
      instructor: "Roberto Runner",
      thumbnail: "/api/placeholder/400/225",
      views: "11.8K",
      rating: 4.8,
      tags: ["corsa", "respirazione", "resistenza"]
    }
  ]

  const filteredVideos = videos.filter(video => {
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400 bg-green-400/20'
      case 'Medium': return 'text-yellow-400 bg-yellow-400/20'
      case 'Hard': return 'text-red-400 bg-red-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const VideoModal = ({ video, onClose }: { video: VideoType, onClose: () => void }) => (
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
        className="bg-gray-900 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative">
          <img 
            src={video.thumbnail} 
            alt={video.title}
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(video.difficulty)}`}>
                {video.difficulty}
              </span>
              <span className="text-sm text-gray-300">{video.duration}</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{video.title}</h2>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-300">{video.rating}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">{video.views} visualizzazioni</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">{video.instructor}</span>
            </div>
          </div>
          
          <p className="text-gray-300 mb-4">{video.description}</p>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {video.tags.map((tag: string) => (
              <span key={tag} className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300">
                #{tag}
              </span>
            ))}
          </div>
          
          <div className="flex gap-3">
            <button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2">
              <Play className="w-5 h-5" />
              Guarda Video
            </button>
            <button className="px-6 py-3 bg-gray-800 text-gray-300 rounded-xl font-medium hover:bg-gray-700 transition-colors">
              Aggiungi ai Preferiti
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Link 
              href="/training"
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Libreria Tecniche
              </h1>
              <p className="text-gray-400">Video tutorial e guide per perfezionare la tua tecnica</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cerca video, esercizi, tecniche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 bg-gray-900 rounded-xl p-1">
              <Filter className="w-4 h-4 text-gray-400 ml-2" />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-white border-none outline-none cursor-pointer pr-2"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id} className="bg-gray-900">
                    {category.name} ({category.count})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span>{category.name}</span>
              <span className="text-xs opacity-70">({category.count})</span>
            </button>
          ))}
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400">
            Trovati {filteredVideos.length} video
            {searchQuery && ` per "${searchQuery}"`}
            {selectedCategory !== 'all' && ` nella categoria "${categories.find(c => c.id === selectedCategory)?.name}"`}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Ordina per:</span>
            <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-sm text-white">
              <option>Più Popolari</option>
              <option>Più Recenti</option>
              <option>Durata</option>
              <option>Difficoltà</option>
            </select>
          </div>
        </div>

        {/* Videos Grid */}
        {filteredVideos.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Nessun video trovato</h3>
            <p className="text-gray-500">Prova a modificare i filtri di ricerca</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map(video => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer group"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="relative">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(video.difficulty)}`}>
                      {video.difficulty}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="bg-black/70 px-2 py-1 rounded text-sm text-white">
                      {video.duration}
                    </span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                      <Play className="w-8 h-8 text-white fill-current" />
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {video.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">{video.instructor}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-300">{video.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">{video.views}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {video.tags.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {filteredVideos.length > 0 && (
          <div className="text-center mt-8">
            <button className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">
              Carica Altri Video
            </button>
          </div>
        )}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal 
          video={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
        />
      )}

      {/* Integration Notice */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Integrazione Backend in Corso</h3>
              <p className="text-gray-300 mb-4">
                La libreria tecniche sarà presto collegata al database per caricare video reali, 
                permettere il salvataggio dei progressi e personalizzare i contenuti in base al tuo livello.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>UI Completa</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <span>Integrazione Video</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <span>Sistema Progressi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}