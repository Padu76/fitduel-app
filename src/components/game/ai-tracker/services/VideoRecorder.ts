// src/components/game/ai-tracker/services/VideoRecorder.ts

export interface RecordingOptions {
  mimeType?: string
  videoBitsPerSecond?: number
  audioBitsPerSecond?: number
  frameRate?: number
  chunkDuration?: number
  maxFileSize?: number // in bytes
}

export interface RecordingMetadata {
  startTime: number
  endTime: number
  duration: number
  fileSize: number
  mimeType: string
  dimensions: {
    width: number
    height: number
  }
  frameRate?: number
}

export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private stream: MediaStream | null = null
  private recordingStartTime: number = 0
  private recordingMetadata: RecordingMetadata | null = null
  private options: RecordingOptions
  private isRecording: boolean = false
  private isPaused: boolean = false
  private totalSize: number = 0
  private maxFileSize: number

  constructor(options: RecordingOptions = {}) {
    this.options = {
      mimeType: this.getBestMimeType(),
      videoBitsPerSecond: options.videoBitsPerSecond || 2500000,
      audioBitsPerSecond: options.audioBitsPerSecond || 128000,
      frameRate: options.frameRate || 30,
      chunkDuration: options.chunkDuration || 1000,
      maxFileSize: options.maxFileSize || 500 * 1024 * 1024, // 500MB default
      ...options
    }
    this.maxFileSize = this.options.maxFileSize || 500 * 1024 * 1024
  }

  // ====================================
  // PUBLIC METHODS
  // ====================================

  startRecording(stream: MediaStream): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isRecording) {
        reject(new Error('Recording already in progress'))
        return
      }

      if (!stream) {
        reject(new Error('No stream provided'))
        return
      }

      this.stream = stream
      this.chunks = []
      this.totalSize = 0
      this.recordingStartTime = Date.now()

      try {
        // Create MediaRecorder with options
        this.mediaRecorder = new MediaRecorder(stream, {
          mimeType: this.options.mimeType,
          videoBitsPerSecond: this.options.videoBitsPerSecond,
          audioBitsPerSecond: this.options.audioBitsPerSecond
        })

        this.setupEventHandlers(resolve, reject)
        
        // Start recording with chunk duration
        this.mediaRecorder.start(this.options.chunkDuration)
        
      } catch (error) {
        console.error('Failed to create MediaRecorder:', error)
        // Fallback to default settings
        try {
          this.mediaRecorder = new MediaRecorder(stream)
          this.setupEventHandlers(resolve, reject)
          this.mediaRecorder.start(this.options.chunkDuration)
        } catch (fallbackError) {
          reject(fallbackError)
        }
      }
    })
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'))
        return
      }

      const recorder = this.mediaRecorder

      recorder.onstop = () => {
        const recordingEndTime = Date.now()
        const duration = recordingEndTime - this.recordingStartTime

        // Create final blob
        const finalBlob = new Blob(this.chunks, { 
          type: recorder.mimeType || this.options.mimeType 
        })

        // Store metadata
        this.recordingMetadata = {
          startTime: this.recordingStartTime,
          endTime: recordingEndTime,
          duration,
          fileSize: finalBlob.size,
          mimeType: finalBlob.type,
          dimensions: this.getVideoDimensions(),
          frameRate: this.options.frameRate
        }

        // Cleanup
        this.cleanup()

        console.log('Recording completed:', this.recordingMetadata)
        resolve(finalBlob)
      }

      recorder.onerror = (event) => {
        console.error('MediaRecorder error during stop:', event)
        reject(new Error('Failed to stop recording'))
      }

      // Stop the recorder
      if (recorder.state === 'recording' || recorder.state === 'paused') {
        recorder.stop()
      } else {
        reject(new Error(`Cannot stop recorder in state: ${recorder.state}`))
      }
    })
  }

  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause()
      this.isPaused = true
      console.log('Recording paused')
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume()
      this.isPaused = false
      console.log('Recording resumed')
    }
  }

  cancelRecording(): void {
    if (this.mediaRecorder) {
      try {
        if (this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop()
        }
      } catch (error) {
        console.error('Error stopping recorder:', error)
      }
    }
    this.cleanup()
  }

  // ====================================
  // UTILITY METHODS
  // ====================================

  isRecordingActive(): boolean {
    return this.isRecording && !this.isPaused
  }

  isRecordingPaused(): boolean {
    return this.isRecording && this.isPaused
  }

  getRecordingDuration(): number {
    if (!this.recordingStartTime) return 0
    return Date.now() - this.recordingStartTime
  }

  getRecordingSize(): number {
    return this.totalSize
  }

  getMetadata(): RecordingMetadata | null {
    return this.recordingMetadata
  }

  // Take a snapshot from the current stream
  takeSnapshot(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.stream) {
        reject(new Error('No stream available'))
        return
      }

      const video = document.createElement('video')
      video.srcObject = this.stream
      video.play()

      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Cannot get canvas context'))
          return
        }

        ctx.drawImage(video, 0, 0)
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create snapshot'))
          }
        }, 'image/jpeg', 0.95)
      }
    })
  }

  // ====================================
  // PRIVATE METHODS
  // ====================================

  private setupEventHandlers(resolve: Function, reject: Function): void {
    if (!this.mediaRecorder) return

    this.mediaRecorder.onstart = () => {
      this.isRecording = true
      console.log('Recording started')
      resolve()
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.chunks.push(event.data)
        this.totalSize += event.data.size

        // Check file size limit
        if (this.totalSize > this.maxFileSize) {
          console.warn('Max file size reached, stopping recording')
          this.stopRecording()
        }
      }
    }

    this.mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event)
      this.isRecording = false
      reject(new Error('Recording error'))
    }

    this.mediaRecorder.onpause = () => {
      this.isPaused = true
      console.log('Recording paused')
    }

    this.mediaRecorder.onresume = () => {
      this.isPaused = false
      console.log('Recording resumed')
    }
  }

  private getBestMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4'
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('Selected MIME type:', type)
        return type
      }
    }

    // Default fallback
    return 'video/webm'
  }

  private getVideoDimensions(): { width: number; height: number } {
    if (!this.stream) {
      return { width: 0, height: 0 }
    }

    const videoTrack = this.stream.getVideoTracks()[0]
    if (videoTrack) {
      const settings = videoTrack.getSettings()
      return {
        width: settings.width || 0,
        height: settings.height || 0
      }
    }

    return { width: 0, height: 0 }
  }

  private cleanup(): void {
    this.mediaRecorder = null
    this.chunks = []
    this.stream = null
    this.isRecording = false
    this.isPaused = false
    this.totalSize = 0
  }

  // ====================================
  // STATIC UTILITY METHODS
  // ====================================

  static async compressVideo(blob: Blob, targetSize: number): Promise<Blob> {
    // This would require a video compression library
    // For now, return the original blob
    console.warn('Video compression not implemented, returning original')
    return blob
  }

  static async extractThumbnail(blob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const url = URL.createObjectURL(blob)
      video.src = url

      video.onloadeddata = () => {
        video.currentTime = 1 // Seek to 1 second

        video.onseeked = () => {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            URL.revokeObjectURL(url)
            reject(new Error('Cannot get canvas context'))
            return
          }

          ctx.drawImage(video, 0, 0)

          canvas.toBlob((thumbnailBlob) => {
            URL.revokeObjectURL(url)
            if (thumbnailBlob) {
              resolve(thumbnailBlob)
            } else {
              reject(new Error('Failed to create thumbnail'))
            }
          }, 'image/jpeg', 0.95)
        }
      }

      video.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load video'))
      }
    })
  }

  static getSupportedMimeTypes(): string[] {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4;codecs=h264,aac',
      'video/mp4'
    ]

    return types.filter(type => MediaRecorder.isTypeSupported(type))
  }
}