// src/components/game/ai-tracker/types/index.ts

// ====================================
// EXERCISE TYPES
// ====================================

export interface ExerciseConfig {
  id: string
  name: string
  code: string
  targetReps?: number
  targetTime?: number // seconds
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  category: 'strength' | 'cardio' | 'flexibility' | 'balance' | 'core'
  muscleGroups: string[]
  caloriesPerRep?: number
  perfectFormThreshold: number // 0-100
  goodFormThreshold: number // 0-100
  description?: string
  instructions?: string[]
  commonMistakes?: string[]
}

export interface ExerciseState {
  currentExercise: ExerciseConfig | null
  isActive: boolean
  isPaused: boolean
  startTime: number
  endTime: number
  totalDuration: number
}

// ====================================
// AI FEEDBACK TYPES
// ====================================

export interface AIFeedback {
  formScore: number // 0-100
  repsCount: number
  timeElapsed: number // seconds
  calories: number
  mistakes: string[]
  suggestions: string[]
  perfectReps: number
  goodReps: number
  badReps: number
}

export interface FormAnalysis {
  score: number
  isInPosition: boolean
  mistakes: string[]
  suggestions: string[]
  confidence: number
}

// ====================================
// PERFORMANCE TYPES
// ====================================

export interface PerformanceData {
  exerciseId: string
  userId: string
  duelId?: string
  missionId?: string
  formScore: number
  repsCompleted: number
  duration: number // seconds
  caloriesBurned: number
  videoUrl?: string
  videoBlob?: Blob
  feedback: AIFeedback
  deviceData?: DeviceData
  trustScore?: number
  validationResult?: ValidationResult
  timestamp: string
}

export interface PerformanceMetrics {
  averageFormScore: number
  totalReps: number
  totalCalories: number
  totalDuration: number
  exerciseBreakdown: Record<string, ExerciseMetrics>
  trends: PerformanceTrend[]
}

export interface ExerciseMetrics {
  exerciseId: string
  totalReps: number
  averageFormScore: number
  bestFormScore: number
  totalCalories: number
  totalDuration: number
  lastPerformed: string
}

export interface PerformanceTrend {
  date: string
  formScore: number
  reps: number
  calories: number
}

// ====================================
// CALIBRATION TYPES
// ====================================

export interface CalibrationData {
  userId: string
  exerciseId: string
  baselineAngles: Record<string, number>
  baselineDistances: Record<string, number>
  bodyProportions: BodyProportions
  calibratedAt: string
}

export interface BodyProportions {
  shoulderWidth: number
  armLength: number
  torsoLength: number
  legLength: number
  height: number
}

// ====================================
// POSE DETECTION TYPES
// ====================================

export interface Point3D {
  x: number
  y: number
  z?: number
  visibility?: number
}

export interface PoseLandmark extends Point3D {
  name?: string
  confidence?: number
}

export interface PoseResults {
  poseLandmarks: PoseLandmark[]
  poseWorldLandmarks?: PoseLandmark[]
  segmentationMask?: ImageData
  image?: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
}

export interface SkeletonConnection {
  start: number
  end: number
  name?: string
}

// ====================================
// ANTI-CHEAT TYPES
// ====================================

export interface ValidationResult {
  isValid: boolean
  confidence: number
  trustScore: number
  violations: Violation[]
  requiresManualReview: boolean
  evidence: Evidence
}

export interface Violation {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: number
  description?: string
  evidence?: string
}

export interface Evidence {
  videoChunks?: string[]
  screenshots?: string[]
  performanceMetrics?: any
  deviceFingerprint?: string
  biometricSignature?: string
}

export interface TrustScore {
  score: number // 0-100
  level: 'untrusted' | 'low' | 'medium' | 'high' | 'verified'
  factors: TrustFactors
  restrictions: string[]
  lastUpdated: string
}

export interface TrustFactors {
  accountAge: number
  emailVerified: boolean
  socialLinked: boolean
  playConsistency: number
  reportCount: number
  videoVerifications: number
  abnormalPatterns: number
}

export interface DeviceData {
  deviceId: string
  deviceType: 'mobile' | 'tablet' | 'desktop'
  browser: string
  os: string
  screenResolution: string
  hardwareConcurrency: number
  deviceMemory?: number
  connection?: string
}

// ====================================
// VIDEO RECORDING TYPES
// ====================================

export interface RecordingOptions {
  mimeType?: string
  videoBitsPerSecond?: number
  audioBitsPerSecond?: number
  frameRate?: number
  chunkDuration?: number
  maxFileSize?: number
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

// ====================================
// DUEL TYPES
// ====================================

export interface Duel {
  id: string
  challengerId: string
  challengedId: string
  exerciseId: string
  targetReps?: number
  targetTime?: number
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  winner?: string
  challengerPerformance?: PerformanceData
  challengedPerformance?: PerformanceData
  createdAt: string
  startedAt?: string
  completedAt?: string
  stake?: number
  isRanked: boolean
}

export interface DuelResult {
  winnerId: string
  loserId: string
  winnerScore: number
  loserScore: number
  xpGained: number
  coinsGained: number
  streakBonus?: number
}

// ====================================
// MISSION TYPES
// ====================================

export interface Mission {
  id: string
  userId: string
  type: 'daily' | 'weekly' | 'special' | 'event'
  category: 'exercise' | 'duels' | 'social' | 'performance' | 'variety'
  title: string
  description: string
  targetValue: number
  currentValue: number
  reward: MissionReward
  expiresAt: string
  completedAt?: string
  claimedAt?: string
  difficulty: number // 1-5
  isActive: boolean
}

export interface MissionReward {
  xp: number
  coins: number
  items?: string[]
  badges?: string[]
  title?: string
}

// ====================================
// USER TYPES
// ====================================

export interface UserProfile {
  id: string
  username: string
  email: string
  avatar?: string
  level: number
  xp: number
  coins: number
  streak: number
  totalWorkouts: number
  totalCalories: number
  totalReps: number
  achievements: string[]
  badges: string[]
  titles: string[]
  currentTitle?: string
  preferences: UserPreferences
  stats: UserStats
  trustScore: TrustScore
  createdAt: string
  lastActiveAt: string
}

export interface UserPreferences {
  language: string
  voiceEnabled: boolean
  musicEnabled: boolean
  notifications: boolean
  privacyMode: boolean
  autoRecord: boolean
  defaultDifficulty: string
  favoriteExercises: string[]
}

export interface UserStats {
  winRate: number
  totalDuels: number
  duelsWon: number
  perfectSets: number
  currentStreak: number
  bestStreak: number
  averageFormScore: number
  favoriteExercise: string
  strongestMuscleGroup: string
  weeklyGoal: number
  weeklyProgress: number
}

// ====================================
// TEAM TYPES
// ====================================

export interface Team {
  id: string
  name: string
  tag: string
  logo?: string
  description: string
  leaderId: string
  members: TeamMember[]
  stats: TeamStats
  achievements: string[]
  level: number
  xp: number
  createdAt: string
}

export interface TeamMember {
  userId: string
  username: string
  avatar?: string
  role: 'leader' | 'officer' | 'member'
  joinedAt: string
  contribution: number
}

export interface TeamStats {
  totalWorkouts: number
  totalCalories: number
  totalReps: number
  averageFormScore: number
  weeklyActivity: number
  battleWins: number
  battleLosses: number
}

// ====================================
// TOURNAMENT TYPES
// ====================================

export interface Tournament {
  id: string
  name: string
  description: string
  type: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss'
  exerciseId: string
  maxParticipants: number
  currentParticipants: number
  entryFee?: number
  prizePool: TournamentPrize
  status: 'upcoming' | 'registration' | 'active' | 'completed'
  startDate: string
  endDate?: string
  rounds: TournamentRound[]
  antiCheatRequired: boolean
}

export interface TournamentRound {
  roundNumber: number
  matches: TournamentMatch[]
  status: 'pending' | 'active' | 'completed'
}

export interface TournamentMatch {
  id: string
  player1Id: string
  player2Id: string
  winnerId?: string
  player1Score?: number
  player2Score?: number
  scheduledAt?: string
  completedAt?: string
}

export interface TournamentPrize {
  first: { xp: number; coins: number; items?: string[] }
  second: { xp: number; coins: number; items?: string[] }
  third: { xp: number; coins: number; items?: string[] }
  participation: { xp: number; coins: number }
}

// ====================================
// LEADERBOARD TYPES
// ====================================

export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  avatar?: string
  score: number
  level: number
  country?: string
  change: number // Position change from last period
  stats: {
    totalReps?: number
    formScore?: number
    calories?: number
    streak?: number
  }
}

export interface Leaderboard {
  type: 'global' | 'regional' | 'friends' | 'exercise'
  period: 'daily' | 'weekly' | 'monthly' | 'allTime'
  exerciseId?: string
  entries: LeaderboardEntry[]
  lastUpdated: string
  totalPlayers: number
}

// ====================================
// NOTIFICATION TYPES
// ====================================

export interface Notification {
  id: string
  userId: string
  type: 'duel_challenge' | 'duel_result' | 'achievement' | 'mission' | 'friend' | 'team' | 'tournament' | 'system'
  title: string
  message: string
  data?: any
  read: boolean
  createdAt: string
  expiresAt?: string
  action?: NotificationAction
}

export interface NotificationAction {
  type: 'navigate' | 'accept' | 'decline' | 'claim'
  payload: any
}

// ====================================
// SHOP TYPES
// ====================================

export interface ShopItem {
  id: string
  category: 'skin' | 'boost' | 'equipment' | 'consumable' | 'premium'
  name: string
  description: string
  icon: string
  price: {
    coins?: number
    premium?: number
  }
  discount?: number
  effects?: ItemEffects
  duration?: number // For temporary items
  stock?: number
  requirements?: {
    level?: number
    achievements?: string[]
  }
}

export interface ItemEffects {
  xpBoost?: number
  coinBoost?: number
  formScoreBoost?: number
  calorieBoost?: number
  unlockExercise?: string
  unlockSkin?: string
}

export interface UserInventory {
  userId: string
  items: InventoryItem[]
  equippedItems: string[]
  activeBoosts: ActiveBoost[]
}

export interface InventoryItem {
  itemId: string
  quantity: number
  acquiredAt: string
  expiresAt?: string
}

export interface ActiveBoost {
  itemId: string
  effect: ItemEffects
  activatedAt: string
  expiresAt: string
}

// ====================================
// ACHIEVEMENT TYPES
// ====================================

export interface Achievement {
  id: string
  category: 'exercise' | 'social' | 'competitive' | 'milestone' | 'special'
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  requirements: AchievementRequirement[]
  reward: {
    xp: number
    coins?: number
    title?: string
    badge?: string
  }
  unlockedAt?: string
  progress?: number
}

export interface AchievementRequirement {
  type: 'reps' | 'calories' | 'streak' | 'duels' | 'formScore' | 'exercise' | 'custom'
  target: number
  current?: number
  exerciseId?: string
  condition?: string
}

// ====================================
// ANALYTICS TYPES
// ====================================

export interface SessionAnalytics {
  sessionId: string
  userId: string
  startTime: string
  endTime: string
  duration: number
  exercisesPerformed: string[]
  totalReps: number
  totalCalories: number
  averageFormScore: number
  deviceData: DeviceData
  events: AnalyticsEvent[]
}

export interface AnalyticsEvent {
  type: string
  timestamp: string
  data: any
}

export interface ProgressAnalytics {
  userId: string
  period: 'week' | 'month' | 'year'
  improvements: {
    formScore: number
    endurance: number
    strength: number
    consistency: number
  }
  recommendations: string[]
  predictedLevel: number
  estimatedGoalCompletion: string
}

// ====================================
// REALTIME TYPES
// ====================================

export interface RealtimeMessage {
  type: 'presence' | 'broadcast' | 'postgres_changes'
  event: string
  payload: any
  timestamp: string
}

export interface PresenceState {
  userId: string
  status: 'online' | 'exercising' | 'idle' | 'offline'
  currentExercise?: string
  currentReps?: number
  formScore?: number
  lastUpdate: string
}

export interface LiveDuelState {
  duelId: string
  participants: {
    [userId: string]: {
      reps: number
      formScore: number
      calories: number
      isActive: boolean
      lastUpdate: string
    }
  }
  timeRemaining: number
  status: 'waiting' | 'countdown' | 'active' | 'completed'
}

// ====================================
// ERROR TYPES
// ====================================

export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'camera' | 'mediapipe' | 'network' | 'validation' | 'system'
}

// ====================================
// UTILITY TYPES
// ====================================

export type Optional<T> = T | undefined
export type Nullable<T> = T | null
export type AsyncFunction<T = void> = () => Promise<T>
export type Callback<T = void> = (data: T) => void
export type ErrorCallback = (error: AppError) => void

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: AppError
  timestamp: string
}

// Export type guards
export const isExerciseConfig = (obj: any): obj is ExerciseConfig => {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.category === 'string'
}

export const isPerformanceData = (obj: any): obj is PerformanceData => {
  return obj &&
    typeof obj.exerciseId === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.formScore === 'number'
}

export const isValidationResult = (obj: any): obj is ValidationResult => {
  return obj &&
    typeof obj.isValid === 'boolean' &&
    typeof obj.confidence === 'number' &&
    Array.isArray(obj.violations)
}