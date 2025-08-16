// src/components/game/ai-tracker/components/VideoFeed.tsx

import React from 'react'
import { Card } from '@/components/ui/Card'
import { 
  Target, Trophy, Timer, Flame, AlertCircle, 
  Shield, Zap, TrendingUp, Award
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface VideoFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  showVideo: boolean
  isRecording: boolean
  currentReps: number
  targetReps?: number
  currentFormScore: number
  timeElapsed: number
  calories: number
  suggestions: string[]
  isPaused: boolean
  trustScore?: number
  violations?: string[]
}

export const VideoFeed: React.FC<VideoFeedProps> = ({
  videoRef,
  canvasRef,
  showVideo,
  isRecording,
  currentReps,
  targetReps,
  currentFormScore,
  timeElapsed,
  calories,
  suggestions,
  isPaused,
  trustScore,
  violations = []
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
    const secs = (seconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  const getFormScoreColor = (score: number): string => {
    if (score > 80) return 'text-green-400'
    if (score > 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getFormScoreIcon = (score: number) => {
    if (score > 80) return <Award className="w-4 h-4 text-green-400" />
    if (score > 60) return <TrendingUp className="w-4 h-4 text-yellow-400" />
    return <AlertCircle className="w-4 h-4 text-red-400" />
  }

  return (
    <Card className="relative overflow-hidden bg-gray-900">
      <div className="aspect-video relative">
        {/* Video Element */}
        <video
          ref={videoRef}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transform scale-x-[-1] z-10",
            showVideo ? "opacity-100" : "opacity-0"
          )}
          playsInline
          muted
          autoPlay
        />
        
        {/* Pose Skeleton Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full z-20 pointer-events-none"
          width={1280}
          height={720}
        />

        {/* Stats Overlay - Top Left */}
        <div className="absolute top-4 left-4 space-y-2 z-30">
          {/* Reps Counter */}
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[120px]">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" />
              <span className="text-white font-bold text-lg">{currentReps}</span>
              {targetReps && (
                <>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-300">{targetReps}</span>
                </>
              )}
            </div>
            {targetReps && (
              <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (currentReps / targetReps) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Form Score */}
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              {getFormScoreIcon(currentFormScore)}
              <span className={cn("font-bold text-lg", getFormScoreColor(currentFormScore))}>
                {Math.round(currentFormScore)}%
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              Form Score
            </div>
          </div>

          {/* Timer */}
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-blue-400" />
              <span className="text-white font-mono text-lg">
                {formatTime(timeElapsed)}
              </span>
            </div>
          </div>

          {/* Calories */}
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-white font-semibold">
                {Math.round(calories)}
              </span>
              <span className="text-gray-400 text-sm">cal</span>
            </div>
          </div>
        </div>

        {/* Top Right Indicators */}
        <div className="absolute top-4 right-4 space-y-2 z-30">
          {/* Recording Indicator */}
          {isRecording && (
            <div className="flex items-center gap-2 bg-red-500/20 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 text-sm font-medium">REC</span>
            </div>
          )}

          {/* Trust Score (if anti-cheat enabled) */}
          {trustScore !== undefined && (
            <div className="flex items-center gap-2 bg-purple-500/20 backdrop-blur-sm rounded-lg px-3 py-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-medium">
                Trust: {trustScore}%
              </span>
            </div>
          )}

          {/* Violations Alert */}
          {violations.length > 0 && (
            <div className="flex items-center gap-2 bg-red-500/20 backdrop-blur-sm rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-sm">
                {violations.length} violations
              </span>
            </div>
          )}
        </div>

        {/* Pause Overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40">
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold text-white animate-pulse">
                PAUSED
              </div>
              <p className="text-gray-400">Press resume to continue</p>
            </div>
          </div>
        )}

        {/* Suggestions Overlay - Bottom */}
        {suggestions.length > 0 && !isPaused && (
          <div className="absolute bottom-4 left-4 right-4 z-30">
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-lg p-3 border border-yellow-500/30">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {suggestions.map((suggestion, i) => (
                    <p key={i} className="text-yellow-200 text-sm">
                      {suggestion}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Indicators */}
        <div className="absolute bottom-4 right-4 flex gap-2 z-30">
          {currentFormScore > 90 && (
            <div className="bg-green-500/20 backdrop-blur-sm rounded-full p-2">
              <Zap className="w-5 h-5 text-green-400 animate-pulse" />
            </div>
          )}
          {currentReps > 0 && currentReps % 10 === 0 && (
            <div className="bg-purple-500/20 backdrop-blur-sm rounded-full p-2">
              <Trophy className="w-5 h-5 text-purple-400 animate-bounce" />
            </div>
          )}
        </div>

        {/* Grid Overlay for alignment (optional, can be toggled) */}
        {false && (
          <div className="absolute inset-0 z-15 pointer-events-none">
            <div className="w-full h-full grid grid-cols-3 grid-rows-3">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-white/10" />
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}