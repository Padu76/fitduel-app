// src/components/game/ai-tracker/components/ExerciseControls.tsx

import React from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Play, Pause, StopCircle, RotateCcw, 
  SkipForward, Camera, Loader2
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface ExerciseControlsProps {
  isTracking: boolean
  isPaused: boolean
  cameraActive: boolean
  isMediaPipeLoaded: boolean
  hasData: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onReset: () => void
  onSkip?: () => void
}

export const ExerciseControls: React.FC<ExerciseControlsProps> = ({
  isTracking,
  isPaused,
  cameraActive,
  isMediaPipeLoaded,
  hasData,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  onSkip
}) => {
  const isReady = cameraActive && isMediaPipeLoaded

  return (
    <Card className="p-4 bg-gradient-to-r from-gray-900 to-gray-800">
      <div className="flex items-center justify-center gap-3">
        {!isTracking ? (
          <>
            {/* Start Button */}
            <Button
              variant="gradient"
              size="lg"
              onClick={onStart}
              disabled={!isReady}
              className={cn(
                "gap-2 min-w-[140px] transition-all duration-300",
                !isReady && "opacity-50 cursor-not-allowed"
              )}
            >
              {!isReady ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Preparazione...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Inizia</span>
                </>
              )}
            </Button>

            {/* Reset Button (if has data) */}
            {hasData && (
              <Button
                variant="ghost"
                size="lg"
                onClick={onReset}
                className="gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Reset</span>
              </Button>
            )}

            {/* Skip Button (optional) */}
            {onSkip && (
              <Button
                variant="ghost"
                size="lg"
                onClick={onSkip}
                className="gap-2"
              >
                <SkipForward className="w-5 h-5" />
                <span>Salta</span>
              </Button>
            )}
          </>
        ) : (
          <>
            {/* Pause/Resume Button */}
            {!isPaused ? (
              <Button
                variant="secondary"
                size="lg"
                onClick={onPause}
                className="gap-2 min-w-[120px]"
              >
                <Pause className="w-5 h-5" />
                <span>Pausa</span>
              </Button>
            ) : (
              <Button
                variant="gradient"
                size="lg"
                onClick={onResume}
                className="gap-2 min-w-[120px] animate-pulse"
              >
                <Play className="w-5 h-5" />
                <span>Riprendi</span>
              </Button>
            )}
            
            {/* Stop Button */}
            <Button
              variant="danger"
              size="lg"
              onClick={onStop}
              className="gap-2 min-w-[120px]"
            >
              <StopCircle className="w-5 h-5" />
              <span>Stop</span>
            </Button>
          </>
        )}
      </div>

      {/* Status Indicators */}
      <div className="flex items-center justify-center gap-4 mt-4">
        {/* Camera Status */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            cameraActive ? "bg-green-500 animate-pulse" : "bg-red-500"
          )} />
          <span className="text-xs text-gray-400">
            Camera {cameraActive ? 'Attiva' : 'Non attiva'}
          </span>
        </div>

        {/* MediaPipe Status */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isMediaPipeLoaded ? "bg-green-500" : "bg-yellow-500 animate-pulse"
          )} />
          <span className="text-xs text-gray-400">
            AI {isMediaPipeLoaded ? 'Pronta' : 'Caricamento...'}
          </span>
        </div>

        {/* Tracking Status */}
        {isTracking && (
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              !isPaused ? "bg-blue-500 animate-pulse" : "bg-yellow-500"
            )} />
            <span className="text-xs text-gray-400">
              {!isPaused ? 'Tracking attivo' : 'In pausa'}
            </span>
          </div>
        )}
      </div>

      {/* Instructions */}
      {!isTracking && !hasData && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Posizionati davanti alla camera e premi "Inizia" quando sei pronto
          </p>
        </div>
      )}
    </Card>
  )
}