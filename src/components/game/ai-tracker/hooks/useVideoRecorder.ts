// src/components/game/ai-tracker/hooks/useVideoRecorder.ts

import { useState, useRef, useCallback } from 'react'

export interface UseVideoRecorderReturn {
  isRecording: boolean
  recordedBlob: Blob | null
  startRecording: (stream: MediaStream) => void
  stopRecording: () => Promise<Blob | undefined>
  pauseRecording: () => void
  resumeRecording: () => void
  resetRecording: () => void
}

export const useVideoRecorder = (): UseVideoRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const startRecording = useCallback((stream: MediaStream) => {
    if (!stream) {
      console.error('No stream provided for recording')
      return
    }

    streamRef.current = stream
    chunksRef.current = []

    // Determine best mime type for the browser
    const options = {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 2500000
    }

    // Try different codecs if vp9 not supported
    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ]

    let selectedMimeType = mimeTypes[0]
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType
        break
      }
    }

    try {
      mediaRecorderRef.current = new MediaRecorder(stream, {
        ...options,
        mimeType: selectedMimeType
      })
    } catch (e) {
      console.warn('Failed to create MediaRecorder with options, using defaults', e)
      // Fallback to default codecs
      mediaRecorderRef.current = new MediaRecorder(stream)
    }

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    mediaRecorderRef.current.onerror = (event) => {
      console.error('MediaRecorder error:', event)
      setIsRecording(false)
    }

    mediaRecorderRef.current.onstart = () => {
      console.log('Recording started')
      setIsRecording(true)
    }

    mediaRecorderRef.current.onstop = () => {
      console.log('Recording stopped')
      setIsRecording(false)
    }

    // Start recording with 1-second chunks for better reliability
    mediaRecorderRef.current.start(1000)
  }, [])

  const stopRecording = useCallback((): Promise<Blob | undefined> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        console.warn('No active recording to stop')
        resolve(undefined)
        return
      }

      const recorder = mediaRecorderRef.current

      recorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { 
            type: recorder.mimeType || 'video/webm' 
          })
          setRecordedBlob(blob)
          chunksRef.current = []
          console.log('Recording blob created, size:', blob.size)
          resolve(blob)
        } else {
          console.warn('No recording chunks available')
          resolve(undefined)
        }
      }

      if (recorder.state === 'recording' || recorder.state === 'paused') {
        recorder.stop()
      } else {
        console.warn('Recorder not in recording/paused state:', recorder.state)
        resolve(undefined)
      }
    })
  }, [])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      console.log('Recording paused')
    }
  }, [])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      console.log('Recording resumed')
    }
  }, [])

  const resetRecording = useCallback(() => {
    // Stop any active recording
    if (mediaRecorderRef.current && 
        (mediaRecorderRef.current.state === 'recording' || 
         mediaRecorderRef.current.state === 'paused')) {
      mediaRecorderRef.current.stop()
    }

    // Clear all data
    mediaRecorderRef.current = null
    chunksRef.current = []
    streamRef.current = null
    setRecordedBlob(null)
    setIsRecording(false)
    
    console.log('Recording reset')
  }, [])

  return {
    isRecording,
    recordedBlob,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording
  }
}