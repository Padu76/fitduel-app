'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Play, Clock, Target, Award, BookOpen, 
  CheckCircle, Lock, Star, Calendar, TrendingUp,
  Users, Zap, Activity, Info, ChevronRight
} from 'lucide-react'

// ====================================
// MOCK DATA
// ====================================

const PROGRAMS = [
  {
    id: 'beginner-basics',
    title: 'Beginner Basics',
    subtitle: 'Le basi del fitness',
    description: 'Programma perfetto per chi inizia. Impara i movimenti fondamentali con progressione graduale.',
    duration: 7,
    dailyTime: 15,
    difficulty: 'Beginner',
    category: 'Foundation',
    icon: '🌱',
    color: 'from-green-500 to-emerald-500',
    completed: 0,
    totalSessions: 7,
    locked: false,
    features: ['Video Tutorial', 'Progressione Graduale', 'Focus Tecnica'],
    exercises: ['Push-ups', 'Squats', 'Plank', 'Mountain Climbers'],
    benefits: [
      'Apprendi i movimenti base',
      'Costruisci forza fondamentale', 
      'Migliora la mobilità',
      'Crea una routine quotidiana'
    ],
    sessions: [
      { day: 1, title: 'Introduzione ai Movimenti Base', exercises: ['Push-ups', 'Squats'], duration: 15, completed: false },
      { day: 2, title: 'Stabilità del Core', exercises: ['Plank', 'Dead Bug'], duration: 15, completed: false },
      { day: 3, title: 'Coordinazione e Equilibrio', exercises: ['Lunges', 'Single Leg Stands'], duration: 15, completed: false },
      { day: 4, title: 'Cardio Leggero', exercises: ['Jumping Jacks', 'High Knees'], duration: 15, completed: false },
      { day: 5, title: 'Forza Funzionale', exercises: ['Modified Burpees', 'Wall Push-ups'], duration: 15, completed: false },
      { day: 6, title: 'Flessibilità e Mobilità', exercises: ['Stretching', 'Yoga Flow'], duration: 15, completed: false },
      { day: 7, title: 'Test Finale', exercises: ['Tutti gli esercizi'], duration: 20, completed: false }
    ]
  },
  {
    id: 'form-perfection',
    title: 'Form Perfection',
    subtitle: 'Tecnica impeccabile',
    description: 'Due settimane dedicate al perfezionamento della forma. Ogni movimento sarà eseguito alla perfezione.',
    duration: 14,
    dailyTime: 20,
    difficulty: 'Intermediate',
    category: 'Technique',
    icon: '🎯',
    color: 'from-blue-500 to-cyan-500',
    completed: 0,
    totalSessions: 14,
    locked: false,
    features: ['Analisi Movimento', 'Correzioni in Tempo Reale', 'Video Slow Motion'],
    exercises: ['Push-ups', 'Squats', 'Deadlifts', 'Pull-ups'],
    benefits: [
      'Tecnica perfetta in ogni esercizio',
      'Riduce il rischio di infortuni',
      'Massimizza l\'efficacia dell\'allenamento',
      'Preparazione per livelli avanzati'
    ],
    sessions: Array.from({length: 14}, (_, i) => ({
      day: i + 1,
      title: `Giorno ${i + 1} - ${['Push-ups Focus', 'Squats Mastery', 'Core Stability', 'Upper Body'][i % 4]}`,
      exercises: [['Push-ups'], ['Squats'], ['Plank Variations'], ['Pull-ups']][i % 4],
      duration: 20,
      completed: false
    }))
  },
  {
    id: 'flexibility-flow',
    title: 'Flexibility Flow',
    subtitle: 'Mobilità e flessibilità',
    description: 'Migliora la tua flessibilità con sequenze fluide di stretching e mobilità articolare.',
    duration: 7,
    dailyTime: 10,
    difficulty: 'Easy',
    category: 'Mobility',
    icon: '🧘',
    color: 'from-purple-500 to-pink-500',
    completed: 3,
    totalSessions: 7,
    locked: false,
    features: ['Sequenze Fluide', 'Rilassamento', 'Respirazione Guidata'],
    exercises: ['Dynamic Stretching', 'Yoga Poses', 'Foam Rolling', 'Joint Mobility'],
    benefits: [
      'Migliora la flessibilità',
      'Riduce le tensioni muscolari',
      'Migliora la postura',
      'Perfetto per il recovery'
    ],
    sessions: Array.from({length: 7}, (_, i) => ({
      day: i + 1,
      title: `Giorno ${i + 1} - ${['Morning Flow', 'Hip Opener', 'Spine Mobility', 'Full Body'][i % 4]}`,
      exercises: [['Cat-Cow', 'Child Pose'], ['Hip Circles', 'Pigeon Pose'], ['Spinal Twist'], ['Sun Salutation']][i % 4],
      duration: 10,
      completed: i < 3
    }))
  },
  {
    id: 'core-stability',
    title: 'Core Stability',
    subtitle: 'Addominali di ferro',
    description: '21 giorni per sviluppare un core forte e stabile. Esercizi progressivi per tutti i livelli.',
    duration: 21,
    dailyTime: 15,
    difficulty: 'Intermediate',
    category: 'Core',
    icon: '💎',
    color: 'from-orange-500 to-red-500',
    completed: 0,
    totalSessions: 21,
    locked: true,
    unlockRequirement: 'Completa Beginner Basics',
    features: ['Progressione a Lungo Termine', 'Variazioni Avanzate', 'Stabilità Funzionale'],
    exercises: ['Plank Variations', 'Russian Twists', 'Leg Raises', 'Dead Bugs'],
    benefits: [
      'Core più forte e stabile',
      'Migliore postura',
      'Supporto per tutti gli altri esercizi',
      'Riduce il mal di schiena'
    ],
    sessions: Array.from({length: 21}, (_, i) => ({
      day: i + 1,
      title: `Giorno ${i + 1} - Week ${Math.floor(i/7) + 1}`,
      exercises: [['Basic Plank'], ['Side Plank'], ['Russian Twists'], ['Mountain Climbers']][i % 4],
      duration: 15,
      completed: false
    }))
  }
]

// ====================================
// COMPONENTS
// ====================================

const ProgramCard = ({ program, onSelect }: any) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-400 bg-green-500/10'
      case 'beginner': return 'text-green-400 bg-green-500/10'
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/10'
      case 'advanced': return 'text-red-400 bg-red-500/10'
      default: return 'text-gray-400 bg-gray-500/10'
    }
  }

  const progress = (program.completed / program.totalSessions) * 100

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => !program.locked && onSelect(program)}
      className={`relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl 
        rounded-2xl p-6 border transition-all duration-300 overflow-hidden
        ${program.locked 
          ? 'border-slate-700/30 opacity-60 cursor-not-allowed' 
          : 'border-slate-700/50 hover:border-green-500/50 cursor-pointer'}`}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${program.color} opacity-5`} />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-gradient-to-br ${program.color} rounded-xl flex items-center justify-center`}>
              <span className="text-2xl">{program.icon}</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{program.title}</h3>
              <p className="text-sm text-green-400">{program.subtitle}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(program.difficulty)}`}>
              {program.difficulty}
            </span>
            <span className="text-xs text-slate-400">{program.category}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-300 mb-4">{program.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{program.duration}</p>
            <p className="text-xs text-gray-400">Giorni</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{program.dailyTime}</p>
            <p className="text-xs text-gray-400">Min/Giorno</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{program.totalSessions}</p>
            <p className="text-xs text-gray-400">Sessioni</p>
          </div>
        </div>

        {/* Progress Bar */}
        {program.completed > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progresso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${program.color} transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Features */}
        <div className="flex flex-wrap gap-1 mb-4">
          {program.features.slice(0, 3).map((feature: string, i: number) => (
            <span key={i} className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-400">
              {feature}
            </span>
          ))}
        </div>

        {/* Action */}
        <div className="flex items-center justify-center">
          {program.locked ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Lock className="w-4 h-4" />
              <span className="text-sm">{program.unlockRequirement}</span>
            </div>
          ) : program.completed > 0 ? (
            <div className="flex items-center gap-2 text-green-400">
              <Play className="w-5 h-5" />
              <span className="font-medium">Continua Programma</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-400">
              <Play className="w-5 h-5" />
              <span className="font-medium">Inizia Programma</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

const ProgramDetail = ({ program, onBack, onStartSession }: any) => {
  const [selectedWeek, setSelectedWeek] = useState(1)
  
  const progress = (program.completed / program.totalSessions) * 100
  const weeks = Math.ceil(program.duration / 7)
  
  const getWeekSessions = (week: number) => {
    const startDay = (week - 1) * 7 + 1
    const endDay = Math.min(week * 7, program.duration)
    return program.sessions.filter((session: any) => session.day >= startDay && session.day <= endDay)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`w-16 h-16 bg-gradient-to-br ${program.color} rounded-xl flex items-center justify-center`}>
          <span className="text-3xl">{program.icon}</span>
        </div>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-white">{program.title}</h2>
          <p className="text-gray-400">{program.subtitle}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {program.duration} giorni
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {program.dailyTime} min/giorno
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {program.difficulty}
            </span>
          </div>
        </div>
        
        {program.completed > 0 && (
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{Math.round(progress)}%</div>
            <div className="text-xs text-gray-400">Completato</div>
          </div>
        )}
      </div>

      {/* Progress Overview */}
      {program.completed > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4">I Tuoi Progressi</h3>
          <div className="grid grid-cols-3 gap-6 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{program.completed}</div>
              <div className="text-sm text-gray-400">Sessioni Completate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{program.totalSessions - program.completed}</div>
              <div className="text-sm text-gray-400">Rimanenti</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{program.completed * program.dailyTime}</div>
              <div className="text-sm text-gray-400">Min Allenati</div>
            </div>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${program.color} transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Program Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Description & Benefits */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4">Cosa Otterrai</h3>
          <p className="text-gray-300 mb-4">{program.description}</p>
          <ul className="space-y-2">
            {program.benefits.map((benefit: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Features & Exercises */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4">Caratteristiche</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Features</h4>
              <div className="flex flex-wrap gap-2">
                {program.features.map((feature: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Esercizi Principali</h4>
              <div className="flex flex-wrap gap-2">
                {program.exercises.map((exercise: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs">
                    {exercise}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Programma Settimanale</h3>
          {weeks > 1 && (
            <div className="flex gap-2">
              {Array.from({length: weeks}, (_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedWeek(i + 1)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    selectedWeek === i + 1
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                  }`}
                >
                  Week {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-3">
          {getWeekSessions(selectedWeek).map((session: any) => (
            <div
              key={session.day}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                session.completed
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-slate-700/30 border-slate-600 hover:border-green-500/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  session.completed ? 'bg-green-500' : 'bg-slate-600'
                }`}>
                  {session.completed ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <span className="text-white font-bold">{session.day}</span>
                  )}
                </div>
                <div>
                  <p className="text-white font-medium">{session.title}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{session.duration} min</span>
                    <span>•</span>
                    <span>{session.exercises.join(', ')}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => onStartSession(session)}
                disabled={session.completed}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  session.completed
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {session.completed ? 'Completata' : 'Inizia'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white font-bold hover:bg-slate-700 transition-all"
        >
          <ArrowLeft className="w-5 h-5 inline mr-2" />
          Torna ai Programmi
        </button>
        
        <button
          onClick={() => {
            const nextSession = program.sessions.find((s: any) => !s.completed)
            if (nextSession) onStartSession(nextSession)
          }}
          className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-bold hover:shadow-lg transition-all"
        >
          <Play className="w-5 h-5 inline mr-2" />
          {program.completed > 0 ? 'Continua Programma' : 'Inizia Programma'}
        </button>
      </div>
    </div>
  )
}

// ====================================
// MAIN COMPONENT
// ====================================

export default function TrainingProgramsPage() {
  const [selectedProgram, setSelectedProgram] = useState<any>(null)

  const handleStartSession = (session: any) => {
    // In a real app, this would navigate to the actual training session
    alert(`Iniziando sessione: ${session.title}\nIn una versione completa, questo aprirebbe la sessione di allenamento.`)
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
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                Programmi Guidati
              </h1>
              <p className="text-slate-400 mt-1">
                {selectedProgram ? selectedProgram.subtitle : 'Percorsi strutturati per ogni livello'}
              </p>
            </div>
          </div>

          {!selectedProgram && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <p className="text-blue-400 text-sm font-medium">Allenamento Strutturato 📚</p>
              <p className="text-blue-100 text-xs">Progressione • Obiettivi • Risultati</p>
            </div>
          )}
        </div>

        {/* Content */}
        {selectedProgram ? (
          <ProgramDetail 
            program={selectedProgram}
            onBack={() => setSelectedProgram(null)}
            onStartSession={handleStartSession}
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
                  <h3 className="text-lg font-bold text-white mb-1">Programmi Strutturati</h3>
                  <p className="text-slate-300 text-sm">
                    Segui percorsi guidati con progressione scientifica. Ogni programma è progettato per portarti 
                    da un livello al successivo con obiettivi chiari e misurabili.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Programs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {PROGRAMS.map((program, index) => (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProgramCard
                    program={program}
                    onSelect={setSelectedProgram}
                  />
                </motion.div>
              ))}
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Obiettivi Chiari</h3>
                <p className="text-slate-400 text-sm">
                  Ogni programma ha obiettivi specifici e misurabili per tracciare i progressi
                </p>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Progressione Scientifica</h3>
                <p className="text-slate-400 text-sm">
                  Aumentiamo gradualmente l'intensità seguendo principi di allenamento comprovati
                </p>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Award className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Risultati Garantiti</h3>
                <p className="text-slate-400 text-sm">
                  Completando un programma otterrai risultati concreti e misurabili
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}