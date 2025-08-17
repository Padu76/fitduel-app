'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, Users, Trophy, Timer, Activity, 
  TrendingUp, Shield, Target, Loader2,
  CheckCircle, XCircle, AlertCircle, Swords,
  User, Calendar, Award, ChevronRight,
  Sparkles, Clock, Heart, Brain
} from 'lucide-react'
import { quickMatch, rankedMatch, getMatchmakingEngine } from '@/utils/matchmaking'
import type { MatchResult } from '@/utils/matchmaking'
import { calculateXPBonus } from '@/utils/handicapSystem'
import { cn } from '@/utils/cn'

// ====================================
// TYPES
// ====================================

interface ChallengeState {
  status: 'idle' | 'searching' | 'found' | 'accepted' | 'in-progress' | 'completed'
  matchResult: MatchResult | null
  searchTime: number
  estimatedWait: number
}

interface ExerciseOption {
  id: string
  name: string
  icon: string
  color: string
  difficulty: number
}

// ====================================
// MAIN COMPONENT
// ====================================

export default function CalibratedChallenge({ userId }: { userId: string }) {
  const [challengeState, setChallengeState] = useState<ChallengeState>({
    status: 'idle',
    matchResult: null,
    searchTime: 0,
    estimatedWait: 30
  })
  
  const [selectedMode, setSelectedMode] = useState<'quick' | 'ranked' | 'friendly'>('quick')
  const [selectedExercise, setSelectedExercise] = useState<string>('squats')
  const [matchmakingStats, setMatchmakingStats] = useState<any>(null)
  const [showHandicapDetails, setShowHandicapDetails] = useState(false)

  // Exercise options
  const exercises: ExerciseOption[] = [
    { id: 'squats', name: 'Squat', icon: '🦵', color: 'from-blue-500 to-cyan-500', difficulty: 1 },
    { id: 'pushups', name: 'Push-up', icon: '💪', color: 'from-red-500 to-orange-500', difficulty: 2 },
    { id: 'plank', name: 'Plank', icon: '🧘', color: 'from-purple-500 to-pink-500', difficulty: 2 },
    { id: 'jumping_jacks', name: 'Jumping Jacks', icon: '⭐', color: 'from-yellow-500 to-amber-500', difficulty: 1 },
    { id: 'burpees', name: 'Burpees', icon: '🔥', color: 'from-orange-500 to-red-600', difficulty: 3 }
  ]

  // Load matchmaking stats
  useEffect(() => {
    loadMatchmakingStats()
    const interval = setInterval(loadMatchmakingStats, 5000)
    return () => clearInterval(interval)
  }, [])

  // Search timer
  useEffect(() => {
    if (challengeState.status === 'searching') {
      const interval = setInterval(() => {
        setChallengeState(prev => ({
          ...prev,
          searchTime: prev.searchTime + 1
        }))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [challengeState.status])

  const loadMatchmakingStats = async () => {
    try {
      const engine = getMatchmakingEngine()
      const stats = await engine.getMatchmakingStats()
      setMatchmakingStats(stats)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const startMatchmaking = async () => {
    setChallengeState({
      status: 'searching',
      matchResult: null,
      searchTime: 0,
      estimatedWait: 30
    })

    try {
      // Stima tempo di attesa
      const engine = getMatchmakingEngine()
      const estimated = await engine.estimateWaitTime(userId, { 
        mode: selectedMode,
        exercise: selectedExercise 
      })
      
      setChallengeState(prev => ({ ...prev, estimatedWait: estimated }))

      // Avvia ricerca
      let result: MatchResult | null = null
      
      if (selectedMode === 'quick') {
        result = await quickMatch(userId)
      } else if (selectedMode === 'ranked') {
        result = await rankedMatch(userId, selectedExercise)
      }

      if (result) {
        setChallengeState({
          status: 'found',
          matchResult: result,
          searchTime: 0,
          estimatedWait: 0
        })
      } else {
        // Timeout - nessun match trovato
        setChallengeState(prev => ({ ...prev, status: 'idle' }))
        alert('Nessun avversario trovato. Riprova più tardi!')
      }
    } catch (error) {
      console.error('Matchmaking error:', error)
      setChallengeState(prev => ({ ...prev, status: 'idle' }))
    }
  }

  const cancelSearch = async () => {
    const engine = getMatchmakingEngine()
    await engine.leaveQueue(userId)
    setChallengeState({
      status: 'idle',
      matchResult: null,
      searchTime: 0,
      estimatedWait: 30
    })
  }

  const acceptMatch = () => {
    setChallengeState(prev => ({ ...prev, status: 'accepted' }))
    // Qui inizierebbe la sfida vera e propria
    setTimeout(() => {
      window.location.href = `/duel/active/${challengeState.matchResult?.opponent.user_id}`
    }, 1500)
  }

  const declineMatch = () => {
    setChallengeState({
      status: 'idle',
      matchResult: null,
      searchTime: 0,
      estimatedWait: 30
    })
  }

  // ====================================
  // RENDER
  // ====================================

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 backdrop-blur-xl 
          rounded-2xl p-6 border border-purple-500/20"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Swords className="w-6 h-6 text-purple-400" />
            Sfida Calibrata
          </h2>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-bold">
                {matchmakingStats?.playersOnline || 0}
              </span>
              <span className="text-gray-400">online</span>
            </div>
            <div className="flex items-center gap-1">
              <Timer className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-bold">
                {matchmakingStats?.playersInQueue || 0}
              </span>
              <span className="text-gray-400">in coda</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 font-bold">
                {matchmakingStats?.activeMatches || 0}
              </span>
              <span className="text-gray-400">sfide attive</span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-purple-950/50 rounded-xl p-4 border border-purple-500/10">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-purple-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-purple-300 font-medium mb-1">
                Sistema di Bilanciamento Intelligente
              </p>
              <p className="text-purple-200/70">
                Le sfide sono calibrate automaticamente in base a età, genere, livello fitness 
                e esperienza. Ogni giocatore ha target personalizzati per garantire sfide eque!
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {/* IDLE STATE - Mode Selection */}
        {challengeState.status === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            {/* Mode Selection */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 
              border border-slate-700/50">
              <h3 className="text-lg font-bold text-white mb-4">Modalità Sfida</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'quick', name: 'Quick', icon: Zap, color: 'from-orange-500 to-red-500', 
                    desc: 'Match immediato' },
                  { id: 'ranked', name: 'Ranked', icon: Trophy, color: 'from-purple-500 to-pink-500',
                    desc: 'Sfida competitiva' },
                  { id: 'friendly', name: 'Amichevole', icon: Heart, color: 'from-blue-500 to-cyan-500',
                    desc: 'Sfida libera' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id as any)}
                    className={cn(
                      "relative p-4 rounded-xl border-2 transition-all",
                      selectedMode === mode.id
                        ? "border-white bg-gradient-to-br " + mode.color + " bg-opacity-20"
                        : "border-slate-600 hover:border-slate-500 bg-slate-800/50"
                    )}
                  >
                    <mode.icon className={cn(
                      "w-6 h-6 mb-2",
                      selectedMode === mode.id ? "text-white" : "text-slate-400"
                    )} />
                    <p className={cn(
                      "font-bold",
                      selectedMode === mode.id ? "text-white" : "text-slate-300"
                    )}>
                      {mode.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{mode.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Exercise Selection */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 
              border border-slate-700/50">
              <h3 className="text-lg font-bold text-white mb-4">Esercizio</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {exercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => setSelectedExercise(exercise.id)}
                    className={cn(
                      "relative p-4 rounded-xl border-2 transition-all group",
                      selectedExercise === exercise.id
                        ? "border-white bg-gradient-to-br " + exercise.color
                        : "border-slate-600 hover:border-slate-500 bg-slate-800/50"
                    )}
                  >
                    <div className="text-3xl mb-2">{exercise.icon}</div>
                    <p className={cn(
                      "text-sm font-medium",
                      selectedExercise === exercise.id ? "text-white" : "text-slate-300"
                    )}>
                      {exercise.name}
                    </p>
                    <div className="flex justify-center gap-0.5 mt-2">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            i < exercise.difficulty
                              ? selectedExercise === exercise.id 
                                ? "bg-white" 
                                : "bg-yellow-400"
                              : "bg-slate-600"
                          )}
                        />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <motion.button
              onClick={startMatchmaking}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 
                rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-green-500/25 
                transition-all flex items-center justify-center gap-3 group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Swords className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              TROVA AVVERSARIO
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            {/* Average Stats */}
            {matchmakingStats && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-slate-400">Tempo medio attesa</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {matchmakingStats.averageWaitTime}s
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-slate-400">Fairness media</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {matchmakingStats.averageFairnessScore}%
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* SEARCHING STATE */}
        {challengeState.status === 'searching' && (
          <motion.div
            key="searching"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 
              border border-slate-700/50 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r 
                from-green-500 to-blue-500 p-1"
            >
              <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                <Users className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            <h3 className="text-2xl font-bold text-white mb-2">
              Ricerca Avversario...
            </h3>
            
            <p className="text-slate-400 mb-6">
              Modalità: <span className="text-white font-medium">{selectedMode}</span> • 
              Esercizio: <span className="text-white font-medium">
                {exercises.find(e => e.id === selectedExercise)?.name}
              </span>
            </p>

            <div className="flex items-center justify-center gap-8 mb-6">
              <div>
                <p className="text-3xl font-bold text-white">
                  {challengeState.searchTime}s
                </p>
                <p className="text-sm text-slate-400">Tempo trascorso</p>
              </div>
              <div className="w-px h-12 bg-slate-700" />
              <div>
                <p className="text-3xl font-bold text-green-400">
                  ~{challengeState.estimatedWait}s
                </p>
                <p className="text-sm text-slate-400">Stima attesa</p>
              </div>
            </div>

            {/* Search Progress */}
            <div className="w-full bg-slate-700 rounded-full h-2 mb-6 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: challengeState.estimatedWait, ease: "linear" }}
              />
            </div>

            <button
              onClick={cancelSearch}
              className="px-6 py-2 bg-red-500/20 border border-red-500/50 
                rounded-lg text-red-400 font-medium hover:bg-red-500/30 transition-all"
            >
              Annulla Ricerca
            </button>
          </motion.div>
        )}

        {/* FOUND STATE - Match Details */}
        {challengeState.status === 'found' && challengeState.matchResult && (
          <motion.div
            key="found"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            {/* Match Found Header */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 
                backdrop-blur-xl rounded-2xl p-6 border border-green-500/30 text-center"
            >
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-white mb-2">
                Avversario Trovato!
              </h3>
              <p className="text-green-300">
                Match Quality: {challengeState.matchResult.matchQuality}% • 
                Type: {challengeState.matchResult.matchType}
              </p>
            </motion.div>

            {/* Players Comparison */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 
              border border-slate-700/50">
              <div className="grid grid-cols-3 gap-4 items-center">
                {/* Player 1 (You) */}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br 
                    from-blue-500 to-cyan-500 flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <p className="font-bold text-white">Tu</p>
                  <p className="text-sm text-slate-400">Level {15}</p>
                </div>

                {/* VS */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-transparent bg-clip-text 
                    bg-gradient-to-r from-red-500 to-orange-500">
                    VS
                  </div>
                </div>

                {/* Player 2 (Opponent) */}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br 
                    from-purple-500 to-pink-500 flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <p className="font-bold text-white">
                    {challengeState.matchResult.opponent.username}
                  </p>
                  <p className="text-sm text-slate-400">
                    Level {challengeState.matchResult.opponent.level}
                  </p>
                </div>
              </div>

              {/* Handicap Details */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <button
                  onClick={() => setShowHandicapDetails(!showHandicapDetails)}
                  className="w-full flex items-center justify-between p-3 
                    hover:bg-slate-700/50 rounded-lg transition-all"
                >
                  <span className="text-sm font-medium text-slate-300">
                    Dettagli Bilanciamento
                  </span>
                  <ChevronRight className={cn(
                    "w-4 h-4 text-slate-400 transition-transform",
                    showHandicapDetails && "rotate-90"
                  )} />
                </button>

                <AnimatePresence>
                  {showHandicapDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-3">
                        {/* Target Reps */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-900/50 rounded-lg p-3">
                            <p className="text-xs text-slate-400 mb-1">Tue Ripetizioni</p>
                            <p className="text-2xl font-bold text-blue-400">
                              {challengeState.matchResult.handicapData.player1Reps}
                            </p>
                          </div>
                          <div className="bg-slate-900/50 rounded-lg p-3">
                            <p className="text-xs text-slate-400 mb-1">Avversario</p>
                            <p className="text-2xl font-bold text-purple-400">
                              {challengeState.matchResult.handicapData.player2Reps}
                            </p>
                          </div>
                        </div>

                        {/* Fairness Score */}
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-400">Fairness Score</span>
                            <span className="text-sm font-bold text-green-400">
                              {challengeState.matchResult.handicapData.fairnessScore}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                              style={{ 
                                width: `${challengeState.matchResult.handicapData.fairnessScore}%` 
                              }}
                            />
                          </div>
                        </div>

                        {/* Explanation */}
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-xs text-slate-400 mb-1">Bilanciamento</p>
                          <p className="text-sm text-slate-300">
                            {challengeState.matchResult.handicapData.explanation}
                          </p>
                        </div>

                        {/* Match Reasons */}
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-xs text-slate-400 mb-2">Perché questo match</p>
                          <div className="space-y-1">
                            {challengeState.matchResult.reasons.map((reason, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-yellow-400" />
                                <span className="text-xs text-slate-300">{reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={declineMatch}
                className="py-3 bg-red-500/20 border border-red-500/50 
                  rounded-xl text-red-400 font-bold hover:bg-red-500/30 
                  transition-all flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Rifiuta
              </button>
              <button
                onClick={acceptMatch}
                className="py-3 bg-gradient-to-r from-green-500 to-emerald-500 
                  rounded-xl text-white font-bold shadow-lg hover:shadow-green-500/25 
                  transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Accetta Sfida
              </button>
            </div>

            {/* Timer */}
            <div className="text-center">
              <p className="text-sm text-slate-400">
                Auto-annullamento in <span className="text-white font-bold">15</span> secondi
              </p>
            </div>
          </motion.div>
        )}

        {/* ACCEPTED STATE */}
        {challengeState.status === 'accepted' && (
          <motion.div
            key="accepted"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 
              backdrop-blur-xl rounded-2xl p-8 border border-green-500/30 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5 }}
            >
              <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Sfida Accettata!
            </h3>
            <p className="text-green-300 mb-4">
              Preparati, la sfida sta per iniziare...
            </p>
            <Loader2 className="w-8 h-8 text-white mx-auto animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}