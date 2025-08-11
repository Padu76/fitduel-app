import { LEVELS, XP_REWARDS, FORM_SCORE_THRESHOLDS, FORM_FEEDBACK, EXERCISE_DATA, EXERCISES } from './constants'

// ====================================
// LEVEL & XP CALCULATIONS
// ====================================
export function calculateLevel(xp: number): number {
  const level = LEVELS.findLast((l) => xp >= l.minXP)
  return level?.level || 1
}

export function getLevelData(level: number) {
  return LEVELS.find((l) => l.level === level) || LEVELS[0]
}

export function calculateProgress(xp: number): { 
  current: number
  next: number
  percentage: number
  currentLevel: number
  nextLevel: number
  levelTitle: string
  levelTitleIt: string
} {
  const currentLevel = calculateLevel(xp)
  const currentLevelData = LEVELS.find((l) => l.level === currentLevel)!
  const nextLevelData = LEVELS.find((l) => l.level === currentLevel + 1)
  
  if (!nextLevelData) {
    return { 
      current: xp, 
      next: xp, 
      percentage: 100,
      currentLevel,
      nextLevel: currentLevel,
      levelTitle: currentLevelData.title,
      levelTitleIt: currentLevelData.titleIt
    }
  }
  
  const current = xp - currentLevelData.minXP
  const next = nextLevelData.minXP - currentLevelData.minXP
  const percentage = Math.round((current / next) * 100)
  
  return { 
    current, 
    next, 
    percentage,
    currentLevel,
    nextLevel: currentLevel + 1,
    levelTitle: currentLevelData.title,
    levelTitleIt: currentLevelData.titleIt
  }
}

export function calculateXPForDuel(
  isWinner: boolean,
  formScore: number = 70,
  streak: number = 0
): number {
  let xp = isWinner ? XP_REWARDS.DUEL_WIN : XP_REWARDS.DUEL_LOSE
  
  // Bonus per forma perfetta
  if (formScore >= FORM_SCORE_THRESHOLDS.PERFECT) {
    xp += XP_REWARDS.DUEL_PERFECT
  } else if (formScore >= FORM_SCORE_THRESHOLDS.EXCELLENT) {
    xp += XP_REWARDS.FORM_EXCELLENT
  } else if (formScore >= FORM_SCORE_THRESHOLDS.GOOD) {
    xp += XP_REWARDS.FORM_GOOD
  }
  
  // Bonus streak
  if (streak >= 10) {
    xp += XP_REWARDS.DUEL_STREAK_10
  } else if (streak >= 5) {
    xp += XP_REWARDS.DUEL_STREAK_5
  } else if (streak >= 3) {
    xp += XP_REWARDS.DUEL_STREAK_3
  }
  
  return xp
}

// ====================================
// TIME & DATE FORMATTING
// ====================================
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function formatTimeAgo(date: Date | string): string {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffSecs < 60) return 'ora'
  if (diffMins < 60) return `${diffMins}m fa`
  if (diffHours < 24) return `${diffHours}h fa`
  if (diffDays < 7) return `${diffDays}g fa`
  
  return past.toLocaleDateString('it-IT', { 
    day: 'numeric', 
    month: 'short' 
  })
}

export function formatCountdown(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}

// ====================================
// FORM SCORE & FEEDBACK
// ====================================
export function getFormFeedback(score: number): {
  message: string
  color: string
  emoji: string
} {
  if (score >= FORM_SCORE_THRESHOLDS.PERFECT) {
    return {
      message: FORM_FEEDBACK.PERFECT,
      color: 'text-green-400',
      emoji: '🔥'
    }
  }
  if (score >= FORM_SCORE_THRESHOLDS.EXCELLENT) {
    return {
      message: FORM_FEEDBACK.EXCELLENT,
      color: 'text-blue-400',
      emoji: '💪'
    }
  }
  if (score >= FORM_SCORE_THRESHOLDS.GOOD) {
    return {
      message: FORM_FEEDBACK.GOOD,
      color: 'text-yellow-400',
      emoji: '👍'
    }
  }
  if (score >= FORM_SCORE_THRESHOLDS.ACCEPTABLE) {
    return {
      message: FORM_FEEDBACK.ACCEPTABLE,
      color: 'text-orange-400',
      emoji: '💡'
    }
  }
  return {
    message: FORM_FEEDBACK.POOR,
    color: 'text-red-400',
    emoji: '⚠️'
  }
}

// ====================================
// EXERCISE UTILITIES
// ====================================
export function getExerciseData(exerciseCode: string) {
  return EXERCISE_DATA[exerciseCode as keyof typeof EXERCISE_DATA] || null
}

export function getExerciseColor(exerciseCode: string): string {
  const exercise = getExerciseData(exerciseCode)
  const colorMap: Record<string, string> = {
    indigo: 'from-indigo-500 to-indigo-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600',
    blue: 'from-blue-500 to-blue-600',
  }
  return colorMap[exercise?.color || 'indigo']
}

export function calculateCaloriesBurned(
  exerciseCode: string,
  duration: number,
  weight: number = 70 // kg default
): number {
  // MET values approximation
  const metValues: Record<string, number> = {
    [EXERCISES.PUSHUP]: 8.0,
    [EXERCISES.SQUAT]: 5.0,
    [EXERCISES.PLANK]: 3.5,
    [EXERCISES.BURPEE]: 10.0,
    [EXERCISES.JUMPING_JACK]: 7.0,
    [EXERCISES.MOUNTAIN_CLIMBER]: 8.0,
  }
  
  const met = metValues[exerciseCode] || 5.0
  const minutes = duration / 60
  
  // Formula: calories = MET * weight * time_in_hours
  return Math.round(met * weight * (minutes / 60))
}

// ====================================
// VALIDATION UTILITIES
// ====================================
export function validateUsername(username: string): {
  isValid: boolean
  error?: string
} {
  if (username.length < 3) {
    return { isValid: false, error: 'Username troppo corto (min 3 caratteri)' }
  }
  if (username.length > 20) {
    return { isValid: false, error: 'Username troppo lungo (max 20 caratteri)' }
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { isValid: false, error: 'Solo lettere, numeri e underscore' }
  }
  return { isValid: true }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Minimo 8 caratteri')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Almeno una maiuscola')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Almeno una minuscola')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Almeno un numero')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// ====================================
// RANKING & PERCENTILE
// ====================================
export function calculatePercentile(
  userScore: number,
  allScores: number[]
): number {
  if (allScores.length === 0) return 100
  
  const sortedScores = [...allScores].sort((a, b) => a - b)
  const index = sortedScores.findIndex(score => score >= userScore)
  
  if (index === -1) return 100
  
  return Math.round((index / sortedScores.length) * 100)
}

export function getRankTitle(percentile: number): {
  title: string
  color: string
  icon: string
} {
  if (percentile >= 99) {
    return { title: 'Top 1%', color: 'text-purple-400', icon: '👑' }
  }
  if (percentile >= 95) {
    return { title: 'Top 5%', color: 'text-yellow-400', icon: '🏆' }
  }
  if (percentile >= 90) {
    return { title: 'Top 10%', color: 'text-blue-400', icon: '🥇' }
  }
  if (percentile >= 75) {
    return { title: 'Top 25%', color: 'text-green-400', icon: '🥈' }
  }
  if (percentile >= 50) {
    return { title: 'Top 50%', color: 'text-gray-400', icon: '🥉' }
  }
  return { title: 'In crescita', color: 'text-gray-500', icon: '💪' }
}

// ====================================
// DEVICE & PLATFORM DETECTION
// ====================================
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

export function hasMotionSensors(): boolean {
  if (typeof window === 'undefined') return false
  
  return 'DeviceMotionEvent' in window && 'DeviceOrientationEvent' in window
}

export function hasCamera(): boolean {
  if (typeof navigator === 'undefined') return false
  
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

// ====================================
// SECURITY & HASHING
// ====================================
export async function hashString(str: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto) {
    // Fallback for server-side or older browsers
    return btoa(str)
  }
  
  const msgBuffer = new TextEncoder().encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

export function generateChallengeCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function generateUserId(): string {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto.randomUUID()
  }
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// ====================================
// NUMBER FORMATTING
// ====================================
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

export function formatScore(score: number, exercise: string): string {
  const data = getExerciseData(exercise)
  if (!data) return score.toString()
  
  if (data.measurement === 'duration') {
    return formatDuration(score)
  }
  
  return `${score} ${data.unit}`
}

// ====================================
// ARRAY UTILITIES
// ====================================
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// ====================================
// EXPORT ALL HELPERS
// ====================================
export const helpers = {
  calculateLevel,
  getLevelData,
  calculateProgress,
  calculateXPForDuel,
  formatDuration,
  formatTimeAgo,
  formatCountdown,
  getFormFeedback,
  getExerciseData,
  getExerciseColor,
  calculateCaloriesBurned,
  validateUsername,
  validateEmail,
  validatePassword,
  calculatePercentile,
  getRankTitle,
  isMobileDevice,
  isIOSDevice,
  hasMotionSensors,
  hasCamera,
  hashString,
  generateChallengeCode,
  generateUserId,
  formatNumber,
  formatScore,
  shuffleArray,
  chunk,
}