// src/components/game/ai-tracker/hooks/useMediaPipe.ts

import { useState, useRef, useCallback } from 'react'
import { MEDIAPIPE_CONFIG, POSE_CONFIG } from '../constants/mediapipe'

declare global {
  interface Window {
    Pose: any
  }
}

export interface UseMediaPipeReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>
  poseRef: React.MutableRefObject<any>
  isMediaPipeLoaded: boolean
  mediaPipeError: string | null
  initializeMediaPipe: (onResults: (results: any) => void) => Promise<void>
  detectPose: (video: HTMLVideoElement | null, pose: any) => void
  drawSkeleton: (results: any, formScore: number) => void
  cleanup: () => void
}

export const useMediaPipe = (): UseMediaPipeReturn => {
  const [isMediaPipeLoaded, setIsMediaPipeLoaded] = useState(false)
  const [mediaPipeError, setMediaPipeError] = useState<string | null>(null)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const poseRef = useRef<any>(null)
  const animationFrameRef = useRef<number | null>(null)
  const onResultsCallbackRef = useRef<((results: any) => void) | null>(null)

  const loadMediaPipe = useCallback(async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.Pose) {
        console.log('MediaPipe already loaded')
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js'
      script.async = true
      
      const timeout = setTimeout(() => {
        reject(new Error('MediaPipe loading timeout'))
      }, 15000) // 15 second timeout
      
      script.onload = () => {
        clearTimeout(timeout)
        console.log('MediaPipe script loaded')
        
        // Wait a bit for the library to initialize
        setTimeout(() => {
          if (window.Pose) {
            resolve()
          } else {
            reject(new Error('MediaPipe Pose not available after loading'))
          }
        }, 500)
      }
      
      script.onerror = (error) => {
        clearTimeout(timeout)
        console.error('Failed to load MediaPipe script:', error)
        reject(error)
      }
      
      document.body.appendChild(script)
    })
  }, [])

  const initializePose = useCallback(() => {
    const { Pose } = window as any
    
    poseRef.current = new Pose(MEDIAPIPE_CONFIG)
    poseRef.current.setOptions(POSE_CONFIG)

    poseRef.current.onResults((results: any) => {
      if (results.poseLandmarks && onResultsCallbackRef.current) {
        onResultsCallbackRef.current(results)
      }
      
      // Always draw skeleton if landmarks exist
      if (results.poseLandmarks) {
        drawSkeleton(results, 0)
      }
    })

    poseRef.current.initialize()
    console.log('MediaPipe Pose initialized')
  }, [])

  const initializeMediaPipe = useCallback(async (onResults: (results: any) => void) => {
    try {
      setMediaPipeError(null)
      onResultsCallbackRef.current = onResults
      
      console.log('🤖 Loading MediaPipe...')
      await loadMediaPipe()
      
      console.log('🤖 Initializing Pose...')
      initializePose()
      
      setIsMediaPipeLoaded(true)
      console.log('✅ MediaPipe loaded successfully')
    } catch (error) {
      console.error('❌ MediaPipe loading failed:', error)
      setMediaPipeError('Impossibile caricare il sistema di riconoscimento pose. Ricarica la pagina.')
      throw error
    }
  }, [loadMediaPipe, initializePose])

  const detectPose = useCallback((video: HTMLVideoElement | null, pose: any) => {
    const detect = async () => {
      if (video && pose && video.readyState === 4) {
        try {
          await pose.send({ image: video })
        } catch (error) {
          console.error('Error sending frame to MediaPipe:', error)
        }
      }
      animationFrameRef.current = requestAnimationFrame(detect)
    }
    
    detect()
  }, [])

  const drawSkeleton = useCallback((results: any, formScore: number = 0) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Define connections
    const connections = [
      // Face
      [8, 6], [6, 5], [5, 4], [4, 0], [0, 1], [1, 2], [2, 3], [3, 7],
      // Arms
      [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
      // Torso
      [11, 23], [12, 24], [23, 24],
      // Legs
      [23, 25], [24, 26], [25, 27], [26, 28], [27, 29], [28, 30], [29, 31], [30, 32]
    ]

    // Set color based on form score
    ctx.strokeStyle = formScore > 80 ? '#10b981' : 
                      formScore > 60 ? '#f59e0b' : '#ef4444'
    ctx.lineWidth = 3

    // Draw connections
    results.poseLandmarks.forEach((landmark: any, i: number) => {
      connections.forEach(([start, end]) => {
        if (i === start) {
          const endLandmark = results.poseLandmarks[end]
          if (endLandmark) {
            ctx.beginPath()
            ctx.moveTo(landmark.x * canvas.width, landmark.y * canvas.height)
            ctx.lineTo(endLandmark.x * canvas.width, endLandmark.y * canvas.height)
            ctx.stroke()
          }
        }
      })
    })

    // Draw landmarks
    ctx.fillStyle = '#3b82f6'
    results.poseLandmarks.forEach((landmark: any) => {
      ctx.beginPath()
      ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 5, 0, 2 * Math.PI)
      ctx.fill()
    })
  }, [])

  const cleanup = useCallback(() => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // Clean up MediaPipe
    if (poseRef.current) {
      poseRef.current.close()
      poseRef.current = null
    }

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }

    onResultsCallbackRef.current = null
  }, [])

  return {
    canvasRef,
    poseRef,
    isMediaPipeLoaded,
    mediaPipeError,
    initializeMediaPipe,
    detectPose,
    drawSkeleton,
    cleanup
  }
}