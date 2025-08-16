// src/components/game/ai-tracker/hooks/useCamera.ts

import { useState, useRef, useCallback } from 'react'

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>
  streamRef: React.MutableRefObject<MediaStream | null>
  cameraError: string | null
  cameraActive: boolean
  permissionDenied: boolean
  initializeCamera: () => Promise<void>
  retryCamera: () => Promise<void>
  cleanup: () => void
}

export const useCamera = (): UseCameraReturn => {
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleCameraError = useCallback((error: any) => {
    console.error('Camera error details:', error)
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      setPermissionDenied(true)
      setCameraError('Permesso fotocamera negato. Clicca sul lucchetto nella barra degli indirizzi per dare il permesso.')
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      setCameraError('Nessuna fotocamera trovata. Assicurati che il dispositivo abbia una webcam funzionante.')
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      setCameraError('La fotocamera è già in uso da un\'altra applicazione. Chiudi le altre app che usano la webcam.')
    } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
      setCameraError('La fotocamera non supporta la risoluzione richiesta. Prova con un altro dispositivo.')
    } else if (error.name === 'TypeError' || !navigator.mediaDevices) {
      setCameraError('Il tuo browser non supporta l\'accesso alla fotocamera. Usa Chrome, Firefox o Safari.')
    } else {
      setCameraError(`Errore fotocamera: ${error.message || 'Errore sconosciuto'}. Ricarica la pagina.`)
    }
  }, [])

  const initializeCamera = useCallback(async () => {
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia non supportato dal browser')
      }

      console.log('Requesting camera permissions...')
      
      let stream: MediaStream | null = null
      
      // First try with ideal constraints
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
            frameRate: { ideal: 30 }
          },
          audio: false
        })
      } catch (e) {
        console.log('Failed with ideal constraints, trying basic...')
        // Fallback to basic constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        })
      }

      if (!stream) {
        throw new Error('Impossibile ottenere lo stream video')
      }

      console.log('Camera stream obtained:', stream)
      streamRef.current = stream

      // Setup video element
      if (videoRef.current) {
        const video = videoRef.current
        
        // Set stream
        video.srcObject = stream
        
        // Force visibility
        video.style.opacity = '1'
        video.style.display = 'block'
        video.style.zIndex = '10'
        
        // Wait for metadata
        await new Promise((resolve) => {
          video.onloadedmetadata = () => {
            console.log('Video metadata loaded')
            resolve(true)
          }
        })
        
        // Play video
        try {
          await video.play()
          console.log('Video playing successfully')
          
          // Verify dimensions after a moment
          setTimeout(() => {
            if (video.srcObject !== stream) {
              console.log('Reconnecting stream...')
              video.srcObject = stream
              video.play()
            }
            console.log('Video check - Width:', video.videoWidth, 'Height:', video.videoHeight)
          }, 500)
        } catch (playError) {
          console.error('Error playing video:', playError)
        }
      }

      // Setup reconnection monitor
      reconnectIntervalRef.current = setInterval(() => {
        if (videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
          console.log('Reconnecting lost stream...')
          videoRef.current.srcObject = streamRef.current
          videoRef.current.play().catch(console.error)
        }
      }, 2000)

      setCameraActive(true)
      setCameraError(null)
      setPermissionDenied(false)
      
    } catch (error) {
      console.error('Error accessing camera:', error)
      handleCameraError(error)
      throw error
    }
  }, [handleCameraError])

  const retryCamera = useCallback(async () => {
    setCameraError(null)
    setPermissionDenied(false)
    setCameraActive(false)
    
    try {
      await initializeCamera()
    } catch (error: any) {
      handleCameraError(error)
    }
  }, [initializeCamera, handleCameraError])

  const cleanup = useCallback(() => {
    // Clear reconnection interval
    if (reconnectIntervalRef.current) {
      clearInterval(reconnectIntervalRef.current)
      reconnectIntervalRef.current = null
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log('Track stopped:', track.kind)
      })
      streamRef.current = null
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setCameraActive(false)
  }, [])

  return {
    videoRef,
    streamRef,
    cameraError,
    cameraActive,
    permissionDenied,
    initializeCamera,
    retryCamera,
    cleanup
  }
}