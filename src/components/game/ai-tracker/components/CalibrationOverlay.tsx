// src/components/game/ai-tracker/components/CalibrationOverlay.tsx

import React, { useState, useEffect } from 'react'
import { Loader2, User, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

interface CalibrationOverlayProps {
  onComplete?: () => void
}

export const CalibrationOverlay: React.FC<CalibrationOverlayProps> = ({ onComplete }) => {
  const [countdown, setCountdown] = useState(3)
  const [phase, setPhase] = useState<'positioning' | 'capturing' | 'processing' | 'complete'>('positioning')

  useEffect(() => {
    if (phase === 'positioning') {
      const timer = setTimeout(() => {
        setPhase('capturing')
        startCountdown()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [phase])

  const startCountdown = () => {
    let count = 3
    const interval = setInterval(() => {
      count--
      setCountdown(count)
      
      if (count === 0) {
        clearInterval(interval)
        setPhase('processing')
        setTimeout(() => {
          setPhase('complete')
          setTimeout(() => {
            onComplete?.()
          }, 1000)
        }, 2000)
      }
    }, 1000)
  }

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center space-y-6 max-w-md">
        {/* Icon/Animation */}
        <div className="relative">
          {phase === 'positioning' && (
            <div className="relative">
              <User className="w-24 h-24 text-white mx-auto" />
              <div className="absolute inset-0 border-4 border-dashed border-indigo-500 rounded-full animate-pulse" />
            </div>
          )}
          
          {phase === 'capturing' && (
            <div className="relative">
              <div className="text-8xl font-bold text-indigo-500 animate-pulse">
                {countdown}
              </div>
            </div>
          )}
          
          {phase === 'processing' && (
            <Loader2 className="w-24 h-24 text-indigo-500 mx-auto animate-spin" />
          )}
          
          {phase === 'complete' && (
            <div className="relative">
              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-12 h-12 text-green-400" />
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-2">
          {phase === 'positioning' && (
            <>
              <h3 className="text-2xl font-bold text-white">Posizionamento</h3>
              <p className="text-gray-300">
                Mettiti in posizione iniziale dell'esercizio
              </p>
              <p className="text-sm text-gray-400">
                Assicurati che tutto il corpo sia visibile
              </p>
            </>
          )}
          
          {phase === 'capturing' && (
            <>
              <h3 className="text-2xl font-bold text-white">Resta fermo</h3>
              <p className="text-gray-300">
                Mantieni la posizione per la calibrazione
              </p>
            </>
          )}
          
          {phase === 'processing' && (
            <>
              <h3 className="text-2xl font-bold text-white">Elaborazione</h3>
              <p className="text-gray-300">
                Analisi delle proporzioni corporee...
              </p>
            </>
          )}
          
          {phase === 'complete' && (
            <>
              <h3 className="text-2xl font-bold text-green-400">Calibrazione Completata!</h3>
              <p className="text-gray-300">
                Il sistema è pronto per tracciare i tuoi movimenti
              </p>
            </>
          )}
        </div>

        {/* Guidelines */}
        {phase === 'positioning' && (
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4 text-left">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-indigo-400 mt-0.5" />
              <p className="text-sm text-indigo-300 font-semibold">
                Suggerimenti per una buona calibrazione:
              </p>
            </div>
            <ul className="text-xs text-gray-400 space-y-1 ml-6">
              <li>• Stai a 2-3 metri dalla camera</li>
              <li>• Assicurati che la stanza sia ben illuminata</li>
              <li>• Indossa abiti aderenti o contrastanti</li>
              <li>• Rimuovi oggetti dallo sfondo se possibile</li>
            </ul>
          </div>
        )}

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2">
          {['positioning', 'capturing', 'processing', 'complete'].map((step, index) => (
            <div
              key={step}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                phase === step 
                  ? "w-8 bg-indigo-500" 
                  : index < ['positioning', 'capturing', 'processing', 'complete'].indexOf(phase)
                  ? "bg-indigo-500/50"
                  : "bg-gray-600"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}