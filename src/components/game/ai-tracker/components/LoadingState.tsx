// src/components/game/ai-tracker/components/LoadingState.tsx

import React from 'react'
import { Card } from '@/components/ui/Card'
import { Loader2, Camera, Cpu, Check, X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface LoadingStateProps {
  isMediaPipeLoaded: boolean
  cameraActive: boolean
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  isMediaPipeLoaded,
  cameraActive
}) => {
  const steps = [
    {
      id: 'mediapipe',
      label: 'Caricamento AI',
      description: 'Sistema di riconoscimento pose',
      completed: isMediaPipeLoaded,
      icon: <Cpu className="w-5 h-5" />
    },
    {
      id: 'camera',
      label: 'Attivazione Camera',
      description: 'Accesso alla webcam',
      completed: cameraActive,
      icon: <Camera className="w-5 h-5" />
    }
  ]

  const allCompleted = steps.every(step => step.completed)

  return (
    <Card className="p-8 bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Main Loader */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-lg opacity-30 animate-pulse" />
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 relative" />
        </div>

        {/* Title */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-2">
            Inizializzazione AI Tracker
          </h3>
          <p className="text-gray-400 text-sm">
            Preparazione del sistema di analisi movimento
          </p>
        </div>

        {/* Progress Steps */}
        <div className="w-full max-w-sm space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all duration-500",
                step.completed 
                  ? "bg-green-500/10 border border-green-500/20" 
                  : "bg-gray-800/50 border border-gray-700"
              )}
            >
              {/* Icon */}
              <div className={cn(
                "p-2 rounded-lg",
                step.completed ? "bg-green-500/20" : "bg-gray-700/50"
              )}>
                <div className={cn(
                  "transition-all duration-300",
                  step.completed ? "text-green-400" : "text-gray-500"
                )}>
                  {step.icon}
                </div>
              </div>

              {/* Text */}
              <div className="flex-1">
                <p className={cn(
                  "font-medium transition-colors duration-300",
                  step.completed ? "text-green-400" : "text-gray-300"
                )}>
                  {step.label}
                </p>
                <p className="text-xs text-gray-500">
                  {step.description}
                </p>
              </div>

              {/* Status */}
              <div>
                {step.completed ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500">
            Questo potrebbe richiedere alcuni secondi al primo caricamento
          </p>
          {!cameraActive && (
            <p className="text-xs text-yellow-400">
              Assicurati di concedere il permesso alla fotocamera quando richiesto
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs">
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
              style={{ 
                width: `${(steps.filter(s => s.completed).length / steps.length) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}