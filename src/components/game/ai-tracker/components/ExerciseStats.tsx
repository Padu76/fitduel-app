// src/components/game/ai-tracker/components/ExerciseStats.tsx

import React from 'react'
import { Card } from '@/components/ui/Card'
import { 
  Star, CheckCircle, AlertCircle, TrendingUp, 
  Award, Target, Zap, AlertTriangle
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface ExerciseStatsProps {
  perfectReps: number
  goodReps: number
  badReps: number
  mistakes: string[]
  isValidPerformance?: boolean
}

export const ExerciseStats: React.FC<ExerciseStatsProps> = ({
  perfectReps,
  goodReps,
  badReps,
  mistakes,
  isValidPerformance = true
}) => {
  const totalReps = perfectReps + goodReps + badReps
  const perfectPercentage = totalReps > 0 ? (perfectReps / totalReps) * 100 : 0
  const goodPercentage = totalReps > 0 ? (goodReps / totalReps) * 100 : 0
  const badPercentage = totalReps > 0 ? (badReps / totalReps) * 100 : 0

  const getMistakeLabel = (mistake: string): string => {
    const labels: Record<string, string> = {
      'back_not_straight': 'Schiena non dritta',
      'elbows_too_wide': 'Gomiti troppo larghi',
      'knees_inward': 'Ginocchia verso interno',
      'knees_past_toes': 'Ginocchia oltre punte',
      'hips_too_high': 'Fianchi troppo alti',
      'hips_too_low': 'Fianchi troppo bassi',
      'depth_insufficient': 'Profondità insufficiente',
      'speed_too_fast': 'Movimento troppo veloce',
      'speed_too_slow': 'Movimento troppo lento',
      'body_not_straight': 'Corpo non allineato',
      'arms_not_wide': 'Braccia non aperte',
      'arms_not_up': 'Braccia non alzate',
      'not_synchronized': 'Movimento non sincronizzato'
    }
    return labels[mistake] || mistake
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Validation Warning */}
      {!isValidPerformance && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">Performance sotto revisione</span>
          </div>
        </div>
      )}

      {/* Rep Quality Distribution */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Qualità Ripetizioni
        </h3>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Perfect Reps */}
          <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
            <div className="flex items-center justify-between mb-1">
              <Star className="w-4 h-4 text-green-400" />
              <span className="text-2xl font-bold text-green-400">{perfectReps}</span>
            </div>
            <p className="text-xs text-gray-400">Perfette</p>
            <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${perfectPercentage}%` }}
              />
            </div>
          </div>

          {/* Good Reps */}
          <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
            <div className="flex items-center justify-between mb-1">
              <CheckCircle className="w-4 h-4 text-yellow-400" />
              <span className="text-2xl font-bold text-yellow-400">{goodReps}</span>
            </div>
            <p className="text-xs text-gray-400">Buone</p>
            <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-500 transition-all duration-500"
                style={{ width: `${goodPercentage}%` }}
              />
            </div>
          </div>

          {/* Bad Reps */}
          <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
            <div className="flex items-center justify-between mb-1">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-2xl font-bold text-red-400">{badReps}</span>
            </div>
            <p className="text-xs text-gray-400">Da migliorare</p>
            <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 transition-all duration-500"
                style={{ width: `${badPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Overall Performance Bar */}
        {totalReps > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Performance totale</span>
              <div className="flex items-center gap-2">
                {perfectPercentage > 60 && <Award className="w-4 h-4 text-yellow-500" />}
                <span className="text-sm font-semibold text-white">
                  {Math.round((perfectPercentage * 1 + goodPercentage * 0.5) / 1)}%
                </span>
              </div>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${perfectPercentage}%` }}
              />
              <div 
                className="h-full bg-yellow-500 transition-all duration-500"
                style={{ width: `${goodPercentage}%` }}
              />
              <div 
                className="h-full bg-red-500 transition-all duration-500"
                style={{ width: `${badPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Common Mistakes */}
        {mistakes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-semibold text-gray-400 mb-2">
              Errori più comuni
            </h4>
            <div className="flex flex-wrap gap-2">
              {[...new Set(mistakes)].slice(0, 5).map((mistake, i) => (
                <div 
                  key={i}
                  className="px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full"
                >
                  <span className="text-xs text-orange-300">
                    {getMistakeLabel(mistake)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievement Indicators */}
        {totalReps > 0 && (
          <div className="mt-4 flex items-center justify-around pt-4 border-t border-gray-700">
            {perfectPercentage > 80 && (
              <div className="flex flex-col items-center gap-1">
                <Zap className="w-6 h-6 text-purple-400" />
                <span className="text-xs text-gray-400">Master</span>
              </div>
            )}
            {totalReps >= 10 && (
              <div className="flex flex-col items-center gap-1">
                <Target className="w-6 h-6 text-blue-400" />
                <span className="text-xs text-gray-400">Consistent</span>
              </div>
            )}
            {perfectReps >= 5 && (
              <div className="flex flex-col items-center gap-1">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <span className="text-xs text-gray-400">Improving</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}