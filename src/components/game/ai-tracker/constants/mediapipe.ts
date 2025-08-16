// src/components/game/ai-tracker/constants/mediapipe.ts

// ====================================
// MEDIAPIPE CONFIGURATION
// ====================================

export const MEDIAPIPE_CONFIG = {
  locateFile: (file: string) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
  }
}

export const POSE_CONFIG = {
  modelComplexity: 1,          // 0, 1, or 2. Higher = more accurate but slower
  smoothLandmarks: true,       // Smooth pose landmarks
  enableSegmentation: false,   // We don't need segmentation for exercise tracking
  smoothSegmentation: false,   
  minDetectionConfidence: 0.5, // Minimum confidence for pose detection
  minTrackingConfidence: 0.5   // Minimum confidence for pose tracking
}

// Advanced configuration for different scenarios
export const POSE_CONFIG_PRESETS = {
  // High accuracy for competitions/tournaments
  highAccuracy: {
    modelComplexity: 2,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: false,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
  },
  
  // Balanced for normal use
  balanced: {
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  },
  
  // Fast for low-end devices
  fast: {
    modelComplexity: 0,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: false,
    minDetectionConfidence: 0.3,
    minTrackingConfidence: 0.3
  },
  
  // With segmentation for background removal
  withSegmentation: {
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: true,
    smoothSegmentation: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  }
}

// ====================================
// POSE LANDMARKS
// ====================================

export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  LEFT_MOUTH: 9,
  RIGHT_MOUTH: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32
}

// ====================================
// POSE CONNECTIONS
// ====================================

export const POSE_CONNECTIONS = [
  // Face
  [POSE_LANDMARKS.LEFT_EAR, POSE_LANDMARKS.LEFT_EYE_OUTER],
  [POSE_LANDMARKS.LEFT_EYE_OUTER, POSE_LANDMARKS.LEFT_EYE],
  [POSE_LANDMARKS.LEFT_EYE, POSE_LANDMARKS.LEFT_EYE_INNER],
  [POSE_LANDMARKS.LEFT_EYE_INNER, POSE_LANDMARKS.NOSE],
  [POSE_LANDMARKS.NOSE, POSE_LANDMARKS.RIGHT_EYE_INNER],
  [POSE_LANDMARKS.RIGHT_EYE_INNER, POSE_LANDMARKS.RIGHT_EYE],
  [POSE_LANDMARKS.RIGHT_EYE, POSE_LANDMARKS.RIGHT_EYE_OUTER],
  [POSE_LANDMARKS.RIGHT_EYE_OUTER, POSE_LANDMARKS.RIGHT_EAR],
  [POSE_LANDMARKS.LEFT_MOUTH, POSE_LANDMARKS.RIGHT_MOUTH],
  
  // Arms
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
  [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.LEFT_PINKY],
  [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.LEFT_INDEX],
  [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.LEFT_THUMB],
  [POSE_LANDMARKS.LEFT_PINKY, POSE_LANDMARKS.LEFT_INDEX],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
  [POSE_LANDMARKS.RIGHT_WRIST, POSE_LANDMARKS.RIGHT_PINKY],
  [POSE_LANDMARKS.RIGHT_WRIST, POSE_LANDMARKS.RIGHT_INDEX],
  [POSE_LANDMARKS.RIGHT_WRIST, POSE_LANDMARKS.RIGHT_THUMB],
  [POSE_LANDMARKS.RIGHT_PINKY, POSE_LANDMARKS.RIGHT_INDEX],
  
  // Torso
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
  
  // Legs
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
  [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
  [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.LEFT_HEEL],
  [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.LEFT_FOOT_INDEX],
  [POSE_LANDMARKS.LEFT_HEEL, POSE_LANDMARKS.LEFT_FOOT_INDEX],
  [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
  [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
  [POSE_LANDMARKS.RIGHT_ANKLE, POSE_LANDMARKS.RIGHT_HEEL],
  [POSE_LANDMARKS.RIGHT_ANKLE, POSE_LANDMARKS.RIGHT_FOOT_INDEX],
  [POSE_LANDMARKS.RIGHT_HEEL, POSE_LANDMARKS.RIGHT_FOOT_INDEX]
]

// Simplified connections for exercise tracking
export const EXERCISE_CONNECTIONS = [
  // Core body structure
  [11, 12], // Shoulders
  [11, 13], // Left shoulder to elbow
  [13, 15], // Left elbow to wrist
  [12, 14], // Right shoulder to elbow
  [14, 16], // Right elbow to wrist
  [11, 23], // Left shoulder to hip
  [12, 24], // Right shoulder to hip
  [23, 24], // Hips
  [23, 25], // Left hip to knee
  [25, 27], // Left knee to ankle
  [24, 26], // Right hip to knee
  [26, 28], // Right knee to ankle
]

// ====================================
// DRAWING CONFIGURATION
// ====================================

export const SKELETON_DRAW_CONFIG = {
  // Colors based on form score
  colors: {
    excellent: '#10b981', // green-500
    good: '#f59e0b',      // amber-500
    poor: '#ef4444',      // red-500
    neutral: '#3b82f6'    // blue-500
  },
  
  // Line styles
  lineWidth: {
    mobile: 2,
    desktop: 3
  },
  
  // Point styles
  pointRadius: {
    mobile: 4,
    desktop: 5
  },
  
  // Visibility threshold
  visibilityThreshold: 0.5,
  
  // Animation
  animationDuration: 100, // ms
  
  // Z-index layers
  zIndex: {
    video: 10,
    skeleton: 20,
    overlay: 30
  }
}

// ====================================
// ANGLE THRESHOLDS
// ====================================

export const ANGLE_THRESHOLDS = {
  pushUp: {
    elbowDown: { min: 70, max: 110 },
    elbowUp: { min: 150, max: 180 },
    backAlignment: { min: 160, max: 200 }
  },
  squat: {
    kneeDown: { min: 70, max: 100 },
    kneeUp: { min: 160, max: 180 },
    hipAngle: { min: 70, max: 110 }
  },
  plank: {
    bodyAlignment: { min: 165, max: 195 },
    elbowAngle: { min: 70, max: 110 }
  },
  lunge: {
    frontKnee: { min: 80, max: 100 },
    backKnee: { min: 80, max: 110 }
  }
}

// ====================================
// CAMERA CONFIGURATION
// ====================================

export const CAMERA_CONFIG = {
  // Video constraints
  video: {
    ideal: {
      width: 1280,
      height: 720,
      frameRate: 30,
      facingMode: 'user'
    },
    minimum: {
      width: 640,
      height: 480,
      frameRate: 15,
      facingMode: 'user'
    },
    mobile: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 30, min: 15 },
      facingMode: 'user'
    }
  },
  
  // Audio (usually disabled for exercise tracking)
  audio: false
}

// ====================================
// PERFORMANCE OPTIMIZATION
// ====================================

export const PERFORMANCE_CONFIG = {
  // Frame processing
  frameProcessing: {
    skipFrames: 2,        // Process every Nth frame
    maxFPS: 30,           // Maximum frames per second
    adaptiveQuality: true // Reduce quality on low-end devices
  },
  
  // Canvas rendering
  canvas: {
    willReadFrequently: true,
    desynchronized: true,
    alpha: true
  },
  
  // Detection intervals (ms)
  detectionIntervals: {
    pose: 33,      // ~30 FPS
    face: 100,     // 10 FPS (if needed)
    hands: 50      // 20 FPS (if needed)
  }
}

// ====================================
// ERROR MESSAGES
// ====================================

export const MEDIAPIPE_ERRORS = {
  LOAD_FAILED: 'Impossibile caricare MediaPipe. Controlla la connessione internet.',
  INIT_FAILED: 'Impossibile inizializzare il riconoscimento pose.',
  CAMERA_FAILED: 'Impossibile accedere alla fotocamera.',
  PROCESSING_FAILED: 'Errore durante l\'elaborazione del frame.',
  MODEL_FAILED: 'Impossibile caricare il modello di pose.',
  BROWSER_NOT_SUPPORTED: 'Il tuo browser non supporta MediaPipe.',
  WEBGL_NOT_SUPPORTED: 'WebGL non è supportato sul tuo dispositivo.'
}

// ====================================
// HELPER FUNCTIONS
// ====================================

export const getLandmarkName = (index: number): string => {
  const names = Object.entries(POSE_LANDMARKS)
  const found = names.find(([_, value]) => value === index)
  return found ? found[0] : `LANDMARK_${index}`
}

export const getConnectionName = (connection: number[]): string => {
  const [start, end] = connection
  return `${getLandmarkName(start)}_TO_${getLandmarkName(end)}`
}

export const isLandmarkVisible = (landmark: any, threshold: number = 0.5): boolean => {
  return landmark && landmark.visibility > threshold
}

export const getSkeletonColor = (formScore: number): string => {
  if (formScore >= 90) return SKELETON_DRAW_CONFIG.colors.excellent
  if (formScore >= 70) return SKELETON_DRAW_CONFIG.colors.good
  if (formScore >= 50) return SKELETON_DRAW_CONFIG.colors.poor
  return SKELETON_DRAW_CONFIG.colors.neutral
}

// Device detection for optimization
export const getOptimalConfig = (): any => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const isLowEnd = navigator.hardwareConcurrency <= 2
  
  if (isMobile || isLowEnd) {
    return POSE_CONFIG_PRESETS.fast
  }
  
  return POSE_CONFIG_PRESETS.balanced
}

// Check WebGL support
export const checkWebGLSupport = (): boolean => {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return !!gl
  } catch (e) {
    return false
  }
}

// Calculate FPS
export const createFPSCounter = () => {
  let lastTime = performance.now()
  let fps = 0
  
  return {
    update: () => {
      const currentTime = performance.now()
      fps = 1000 / (currentTime - lastTime)
      lastTime = currentTime
      return Math.round(fps)
    },
    getFPS: () => Math.round(fps)
  }
}