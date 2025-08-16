// src/components/game/ai-tracker/components/CameraError.tsx

import React from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  CameraOff, 
  AlertTriangle, 
  RotateCcw, 
  Wifi, 
  Lock,
  Monitor,
  Chrome,
  Shield
} from 'lucide-react'

interface CameraErrorProps {
  error: string | null
  permissionDenied: boolean
  onRetry: () => void
}

export const CameraError: React.FC<CameraErrorProps> = ({
  error,
  permissionDenied,
  onRetry
}) => {
  const getErrorIcon = () => {
    if (permissionDenied) return <CameraOff className="w-12 h-12 text-red-500" />
    if (error?.includes('browser')) return <Chrome className="w-12 h-12 text-orange-500" />
    if (error?.includes('HTTPS')) return <Lock className="w-12 h-12 text-yellow-500" />
    return <AlertTriangle className="w-12 h-12 text-red-500" />
  }

  const getErrorTitle = () => {
    if (permissionDenied) return 'Permesso Fotocamera Negato'
    if (error?.includes('browser')) return 'Browser Non Supportato'
    if (error?.includes('HTTPS')) return 'Connessione Non Sicura'
    return 'Problema con la Fotocamera'
  }

  return (
    <Card className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 border-red-500/20">
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Icon */}
        <div className="p-4 bg-red-500/10 rounded-full animate-pulse">
          {getErrorIcon()}
        </div>
        
        {/* Title */}
        <h3 className="text-2xl font-bold text-white text-center">
          {getErrorTitle()}
        </h3>
        
        {/* Error Message */}
        <p className="text-gray-400 text-center max-w-md">
          {error}
        </p>

        {/* Permission Instructions */}
        {permissionDenied && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 max-w-md w-full">
            <h4 className="font-semibold text-yellow-400 mb-3">
              Come dare il permesso:
            </h4>
            <ol className="text-sm text-gray-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 font-bold">1.</span>
                <span>Clicca sull'icona del lucchetto nella barra degli indirizzi</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 font-bold">2.</span>
                <span>Trova "Fotocamera" nelle impostazioni del sito</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 font-bold">3.</span>
                <span>Cambia da "Blocca" a "Consenti"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 font-bold">4.</span>
                <span>Ricarica la pagina</span>
              </li>
            </ol>
          </div>
        )}

        {/* Browser Compatibility */}
        {error?.includes('browser') && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 max-w-md w-full">
            <h4 className="font-semibold text-orange-400 mb-3">
              Browser Supportati:
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-green-400">
                <Shield className="w-4 h-4" />
                <span>Chrome 90+</span>
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <Shield className="w-4 h-4" />
                <span>Firefox 88+</span>
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <Shield className="w-4 h-4" />
                <span>Safari 14+</span>
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <Shield className="w-4 h-4" />
                <span>Edge 90+</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="gradient"
            onClick={onRetry}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Riprova
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            Ricarica Pagina
          </Button>
        </div>

        {/* Additional Info */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>Assicurati di usare HTTPS (fitduel-app.vercel.app)</p>
          <p>La fotocamera deve essere disponibile e non in uso da altre app</p>
        </div>
      </div>
    </Card>
  )
}