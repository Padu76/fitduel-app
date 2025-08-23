'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Camera, Zap, Target, Trophy, 
  Flame, Timer, Activity, Eye, Settings,
  Play, Square, RotateCcw, CheckCircle,
  AlertTriangle, Dumbbell, Swords, TrendingUp
} from 'lucide-react'

export default function TrainingPage() {
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'active' | 'error'>('idle')
  const [calibrationStatus, setCalibrationStatus] = useState<'pending' | 'calibrating' | 'completed' | 'failed'>('pending')
  const [isRecording, setIsRecording] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const requestCameraAccess = async () => {
    setCameraStatus('requesting')
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
      setCameraStatus('active')
    } catch (error) {
      console.error('Camera access denied:', error)
      setCameraStatus('error')
    }
  }

  const startCalibration = async () => {
    if (cameraStatus !== 'active') {
      await requestCameraAccess()
    }
    
    setCalibrationStatus('calibrating')
    
    // Simulate calibration process
    setTimeout(() => {
      setCalibrationStatus('completed')
    }, 5000)
  }

  const startCountdown = () => {
    setCountdown(3)
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          setCountdown(null)
          setIsRecording(true)
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  const stopRecording = () => {
    setIsRecording(false)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraStatus('idle')
  }

  const trainingModes = [
    {
      id: 'intensive',
      title: 'Allenamento Intensivo',
      description: 'HIIT estremo per massima performance',
      icon: Flame,
      color: 'from-red-500 to-orange-500',
      difficulty: 'EXTREME',
      duration: '25-45 min',
      calories: '400-800',
      features: ['AI Tracking', 'Real-time Score', 'Performance Analytics']
    },
    {
      id: 'combat',
      title: 'Combat Training',
      description: 'Preparazione per sfide competitive',
      icon: Swords,
      color: 'from-purple-500 to-pink-500',
      difficulty: 'ELITE',
      duration: '30-60 min',
      calories: '500-900',
      features: ['Combat Moves', 'Reaction Time', 'Endurance Test']
    },
    {
      id: 'performance',
      title: 'Performance Elite',
      description: 'Ottimizzazione per atleti professionisti',
      icon: Trophy,
      color: 'from-yellow-500 to-orange-500',
      difficulty: 'PRO',
      duration: '45-90 min',
      calories: '600-1200',
      features: ['Advanced Metrics', 'Biomechanics', 'Peak Performance']
    }
  ]

  const quickWorkouts = [
    { name: 'Burpee Challenge', duration: '10 min', intensity: 'INSANE' },
    { name: 'Sprint HIIT', duration: '15 min', intensity: 'EXTREME' },
    { name: 'Core Destroyer', duration: '12 min', intensity: 'BRUTAL' },
    { name: 'Power Circuit', duration: '20 min', intensity: 'ELITE' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Training Elite</h1>
              <p className="text-gray-400">Modalità competitive - Nessun compromesso</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Camera & Calibration Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Motion Tracking</h2>
                <p className="text-gray-400">Sistema di calibrazione professionale</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                cameraStatus === 'active' ? 'bg-green-400' : 
                cameraStatus === 'error' ? 'bg-red-400' : 'bg-gray-400'
              }`} />
              <span className="text-sm text-gray-400 capitalize">{cameraStatus}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Camera Feed */}
            <div className="relative">
              <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden border-2 border-dashed border-gray-600">
                {cameraStatus === 'active' ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 mb-4">
                        {cameraStatus === 'error' ? 'Errore accesso camera' : 'Camera non attiva'}
                      </p>
                      <button
                        onClick={requestCameraAccess}
                        disabled={cameraStatus === 'requesting'}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors"
                      >
                        {cameraStatus === 'requesting' ? 'Connessione...' : 'Attiva Camera'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Countdown Overlay */}
                {countdown && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <motion.div
                      key={countdown}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-8xl font-bold text-white"
                    >
                      {countdown}
                    </motion.div>
                  </div>
                )}

                {/* Recording Indicator */}
                {isRecording && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-sm font-medium">REC</span>
                  </div>
                )}
              </div>
            </div>

            {/* Calibration Controls */}
            <div className="space-y-6">
              <div className="bg-gray-900/50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Calibrazione Sistema</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Posizione corporea</span>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      calibrationStatus === 'completed' ? 'bg-green-500/20 text-green-400' :
                      calibrationStatus === 'calibrating' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {calibrationStatus === 'completed' ? 'Calibrato' :
                       calibrationStatus === 'calibrating' ? 'In corso...' : 'Pending'}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Tracking movimento</span>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      calibrationStatus === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {calibrationStatus === 'completed' ? 'Attivo' : 'Inattivo'}
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={startCalibration}
                    disabled={cameraStatus !== 'active' || calibrationStatus === 'calibrating'}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all"
                  >
                    {calibrationStatus === 'calibrating' ? 'Calibrazione in corso...' : 'Inizia Calibrazione'}
                  </button>
                  
                  {calibrationStatus === 'completed' && (
                    <button
                      onClick={startCountdown}
                      disabled={isRecording}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:shadow-lg text-white font-medium py-3 rounded-xl transition-all"
                    >
                      <Play className="w-5 h-5 inline mr-2" />
                      Inizia Allenamento
                    </button>
                  )}
                  
                  {isRecording && (
                    <button
                      onClick={stopRecording}
                      className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:shadow-lg text-white font-medium py-3 rounded-xl transition-all"
                    >
                      <Square className="w-5 h-5 inline mr-2" />
                      Termina Sessione
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Training Modes */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Modalità Elite</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {trainingModes.map((mode) => {
              const Icon = mode.icon
              return (
                <div key={mode.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 group">
                  <div className={`w-16 h-16 bg-gradient-to-r ${mode.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-white">{mode.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      mode.difficulty === 'EXTREME' ? 'bg-red-500/20 text-red-400' :
                      mode.difficulty === 'ELITE' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {mode.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-gray-400 mb-6">{mode.description}</p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Durata:</span>
                      <span className="text-white font-medium">{mode.duration}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Calorie:</span>
                      <span className="text-white font-medium">{mode.calories}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    {mode.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Link
                    href={`/training/${mode.id}`}
                    className={`block w-full bg-gradient-to-r ${mode.color} text-white font-bold py-3 text-center rounded-xl hover:shadow-lg transition-all duration-200`}
                  >
                    INIZIA TRAINING
                  </Link>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Quick Workouts */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Quick Burn Sessions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickWorkouts.map((workout, index) => (
              <div key={index} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 hover:bg-gray-700/50 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center justify-between mb-3">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    workout.intensity === 'INSANE' ? 'bg-red-500/20 text-red-400' :
                    workout.intensity === 'EXTREME' ? 'bg-orange-500/20 text-orange-400' :
                    workout.intensity === 'BRUTAL' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {workout.intensity}
                  </span>
                </div>
                <h3 className="font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{workout.name}</h3>
                <p className="text-gray-400 text-sm">{workout.duration}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Additional Links */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Link href="/training/library" className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 group">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Libreria Tecniche</h3>
            <p className="text-gray-400">Perfeziona movimenti e tecniche avanzate</p>
          </Link>

          <Link href="/training/programs" className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-300 group">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-green-400 transition-colors">Programmi Elite</h3>
            <p className="text-gray-400">Piani di allenamento personalizzati</p>
          </Link>

          <Link href="/challenges" className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 group">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Swords className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">Sfide Live</h3>
            <p className="text-gray-400">Combatti contro altri atleti</p>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}