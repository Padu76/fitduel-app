// src/components/game/ai-tracker/components/PerformanceSummary.tsx

import React from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Star, CheckCircle, AlertCircle, Download, Share2, 
  Trophy, Flame, Timer, TrendingUp, Award, Shield,
  BarChart3, Zap, Target
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface PerformanceSummaryProps {
  currentReps: number
  formScore: number
  calories: number
  timeElapsed: number
  perfectReps: number
  goodReps: number
  badReps: number
  recordedBlob: Blob | null
  exerciseName: string
  trustScore?: number
  isValidPerformance?: boolean
}

export const PerformanceSummary: React.FC<PerformanceSummaryProps> = ({
  currentReps,
  formScore,
  calories,
  timeElapsed,
  perfectReps,
  goodReps,
  badReps,
  recordedBlob,
  exerciseName,
  trustScore,
  isValidPerformance = true
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getPerformanceRating = (): { label: string; color: string; icon: React.ReactNode } => {
    if (formScore >= 90) {
      return { 
        label: 'Eccellente!', 
        color: 'text-green-400',
        icon: <Trophy className="w-8 h-8 text-green-400" />
      }
    } else if (formScore >= 75) {
      return { 
        label: 'Molto Bene!', 
        color: 'text-blue-400',
        icon: <Award className="w-8 h-8 text-blue-400" />
      }
    } else if (formScore >= 60) {
      return { 
        label: 'Buono', 
        color: 'text-yellow-400',
        icon: <TrendingUp className="w-8 h-8 text-yellow-400" />
      }
    } else {
      return { 
        label: 'Da Migliorare', 
        color: 'text-orange-400',
        icon: <Target className="w-8 h-8 text-orange-400" />
      }
    }
  }

  const rating = getPerformanceRating()
  const totalReps = perfectReps + goodReps + badReps

  const downloadVideo = () => {
    if (!recordedBlob) return
    
    const url = URL.createObjectURL(recordedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exerciseName}_${Date.now()}.webm`
    a.click()
    URL.revokeObjectURL(url)
  }

  const shareResults = () => {
    const text = `🏋️ Ho completato ${currentReps} ${exerciseName} con ${Math.round(formScore)}% di forma! 💪 #FitDuel`
    
    if (navigator.share) {
      navigator.share({
        title: 'FitDuel Performance',
        text: text
      })
    } else {
      navigator.clipboard.writeText(text)
      alert('Risultati copiati negli appunti!')
    }
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header with Rating */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">
            Riepilogo Performance
          </h3>
          <p className="text-gray-400">{exerciseName}</p>
        </div>
        <div className="flex flex-col items-center">
          {rating.icon}
          <span className={cn("text-lg font-bold mt-2", rating.color)}>
            {rating.label}
          </span>
        </div>
      </div>

      {/* Validation Status */}
      {!isValidPerformance && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-red-400" />
            <div>
              <p className="text-red-400 font-semibold">Performance Invalidata</p>
              <p className="text-gray-400 text-sm">La sessione verrà revisionata manualmente</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Reps */}
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-lg p-4 border border-indigo-500/20">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span className="text-3xl font-bold text-white">{currentReps}</span>
          </div>
          <p className="text-gray-400 text-sm">Ripetizioni</p>
        </div>
        
        {/* Form Score */}
        <div className={cn(
          "rounded-lg p-4 border",
          formScore > 80 
            ? "bg-green-500/10 border-green-500/20" 
            : formScore > 60 
            ? "bg-yellow-500/10 border-yellow-500/20"
            : "bg-red-500/10 border-red-500/20"
        )}>
          <div className="flex items-center justify-between mb-2">
            <Zap className={cn(
              "w-5 h-5",
              formScore > 80 ? "text-green-400" : formScore > 60 ? "text-yellow-400" : "text-red-400"
            )} />
            <span className={cn(
              "text-3xl font-bold",
              formScore > 80 ? "text-green-400" : formScore > 60 ? "text-yellow-400" : "text-red-400"
            )}>
              {Math.round(formScore)}%
            </span>
          </div>
          <p className="text-gray-400 text-sm">Form Score</p>
        </div>
        
        {/* Calories */}
        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg p-4 border border-orange-500/20">
          <div className="flex items-center justify-between mb-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-3xl font-bold text-orange-400">{Math.round(calories)}</span>
          </div>
          <p className="text-gray-400 text-sm">Calorie</p>
        </div>
        
        {/* Time */}
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
          <div className="flex items-center justify-between mb-2">
            <Timer className="w-5 h-5 text-blue-400" />
            <span className="text-3xl font-bold text-blue-400">{formatTime(timeElapsed)}</span>
          </div>
          <p className="text-gray-400 text-sm">Tempo</p>
        </div>
      </div>

      {/* Quality Breakdown */}
      <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-semibold text-gray-400 mb-3">Analisi Qualità</h4>
        
        <div className="space-y-3">
          {/* Perfect Reps */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">Ripetizioni Perfette</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400 font-bold">{perfectReps}</span>
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${totalReps > 0 ? (perfectReps / totalReps) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Good Reps */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-300">Ripetizioni Buone</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-yellow-400 font-bold">{goodReps}</span>
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 transition-all duration-500"
                  style={{ width: `${totalReps > 0 ? (goodReps / totalReps) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Bad Reps */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-gray-300">Ripetizioni da Migliorare</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-red-400 font-bold">{badReps}</span>
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all duration-500"
                  style={{ width: `${totalReps > 0 ? (badReps / totalReps) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Score (if anti-cheat enabled) */}
      {trustScore !== undefined && (
        <div className="bg-purple-500/10 rounded-lg p-4 mb-6 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <span className="text-gray-300">Trust Score</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn(
                "font-bold text-lg",
                trustScore > 80 ? "text-green-400" : 
                trustScore > 60 ? "text-yellow-400" : "text-red-400"
              )}>
                {trustScore}%
              </span>
              {trustScore > 80 && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Achievements */}
      {(formScore > 90 || currentReps >= 20 || perfectReps >= 10) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {formScore > 90 && (
            <div className="flex items-center gap-2 bg-green-500/10 px-3 py-2 rounded-full border border-green-500/20">
              <Trophy className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">Form Master</span>
            </div>
          )}
          {currentReps >= 20 && (
            <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-2 rounded-full border border-blue-500/20">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400">High Volume</span>
            </div>
          )}
          {perfectReps >= 10 && (
            <div className="flex items-center gap-2 bg-purple-500/10 px-3 py-2 rounded-full border border-purple-500/20">
              <Award className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-400">Perfectionist</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {recordedBlob && (
          <Button
            variant="secondary"
            className="flex-1 gap-2"
            onClick={downloadVideo}
          >
            <Download className="w-4 h-4" />
            Scarica Video
          </Button>
        )}
        
        <Button
          variant="gradient"
          className="flex-1 gap-2"
          onClick={shareResults}
        >
          <Share2 className="w-4 h-4" />
          Condividi
        </Button>
      </div>
    </Card>
  )
}