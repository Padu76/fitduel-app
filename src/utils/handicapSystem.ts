// ====================================
// SISTEMA DI HANDICAP CALIBRATO
// ====================================

export interface UserCalibrationData {
  // Base Info
  age: number
  gender: 'male' | 'female' | 'other'
  weight: number
  height: number
  
  // Fitness Level
  fitness_level: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  training_frequency: number // giorni a settimana
  fitness_experience_years: number
  
  // Limitazioni
  has_limitations: boolean
  limitations?: string[]
  
  // Test Results
  pushups_count: number
  squats_count: number
  plank_duration: number
  jumping_jacks_count: number
  
  // Calculated
  calibration_score: number
  assigned_level: string // rookie, bronze, silver, gold, platinum
  base_handicap: number
}

export interface HandicapResult {
  player1Handicap: number // moltiplicatore (es: 1.0 = nessun handicap, 0.8 = -20%)
  player2Handicap: number
  player1Reps: number // ripetizioni richieste calibrate
  player2Reps: number
  fairnessScore: number // 0-100 quanto è equa la sfida
  explanation: string // spiegazione dei bonus/malus applicati
}

// ====================================
// COSTANTI E CONFIGURAZIONE
// ====================================

const AGE_BRACKETS = {
  youth: { min: 16, max: 25, modifier: 1.0 },
  prime: { min: 26, max: 35, modifier: 0.98 },
  adult: { min: 36, max: 45, modifier: 0.95 },
  senior: { min: 46, max: 55, modifier: 0.90 },
  master: { min: 56, max: 100, modifier: 0.85 }
}

const GENDER_MODIFIERS = {
  male: 1.0,
  female: 0.85, // Media statistica per upper body
  other: 0.92
}

const FITNESS_LEVEL_SCORES = {
  beginner: 0.7,
  intermediate: 0.85,
  advanced: 1.0,
  elite: 1.15
}

const EXPERIENCE_MODIFIERS = {
  novice: { maxYears: 1, modifier: 0.85 },
  amateur: { maxYears: 3, modifier: 0.92 },
  experienced: { maxYears: 5, modifier: 1.0 },
  veteran: { maxYears: 100, modifier: 1.05 }
}

// Base reps per exercise (standard per adulto maschio intermedio)
const BASE_REPS = {
  pushups: 30,
  squats: 40,
  plank: 60, // secondi
  jumping_jacks: 50,
  burpees: 20,
  mountain_climbers: 40,
  lunges: 30,
  high_knees: 60
}

// ====================================
// FUNZIONI DI CALCOLO
// ====================================

/**
 * Calcola il modificatore per l'età
 */
function getAgeModifier(age: number): number {
  for (const bracket of Object.values(AGE_BRACKETS)) {
    if (age >= bracket.min && age <= bracket.max) {
      return bracket.modifier
    }
  }
  return 0.85 // default per età molto avanzata
}

/**
 * Calcola il modificatore per l'esperienza
 */
function getExperienceModifier(years: number): number {
  for (const level of Object.values(EXPERIENCE_MODIFIERS)) {
    if (years <= level.maxYears) {
      return level.modifier
    }
  }
  return 1.05
}

/**
 * Calcola il modificatore per limitazioni fisiche
 */
function getLimitationsModifier(hasLimitations: boolean, limitations?: string[]): number {
  if (!hasLimitations) return 1.0
  
  // Riduci in base al numero e tipo di limitazioni
  const limitationCount = limitations?.length || 0
  if (limitationCount === 0) return 1.0
  if (limitationCount === 1) return 0.92
  if (limitationCount === 2) return 0.85
  return 0.75 // 3+ limitazioni
}

/**
 * Calcola l'handicap totale per un utente
 */
export function calculateUserHandicap(userData: UserCalibrationData): number {
  const ageModifier = getAgeModifier(userData.age)
  const genderModifier = GENDER_MODIFIERS[userData.gender]
  const fitnessModifier = FITNESS_LEVEL_SCORES[userData.fitness_level]
  const experienceModifier = getExperienceModifier(userData.fitness_experience_years)
  const limitationsModifier = getLimitationsModifier(
    userData.has_limitations, 
    userData.limitations
  )
  
  // Calcola handicap complessivo (prodotto dei modificatori)
  const totalHandicap = 
    ageModifier * 
    genderModifier * 
    fitnessModifier * 
    experienceModifier * 
    limitationsModifier
  
  // Limita tra 0.5 e 1.5 per evitare estremi
  return Math.max(0.5, Math.min(1.5, totalHandicap))
}

/**
 * Calcola le ripetizioni calibrate per un esercizio
 */
export function calculateCalibratedReps(
  exercise: keyof typeof BASE_REPS,
  userHandicap: number,
  baseReps?: number
): number {
  const base = baseReps || BASE_REPS[exercise] || 30
  const calibratedReps = Math.round(base * userHandicap)
  
  // Assicura almeno 5 reps e massimo 3x base
  return Math.max(5, Math.min(base * 3, calibratedReps))
}

/**
 * Calcola l'handicap per una sfida tra due utenti
 */
export function calculateDuelHandicap(
  player1: UserCalibrationData,
  player2: UserCalibrationData,
  exercise: keyof typeof BASE_REPS
): HandicapResult {
  // Calcola handicap individuali
  const p1Handicap = calculateUserHandicap(player1)
  const p2Handicap = calculateUserHandicap(player2)
  
  // Calcola differenza di livello
  const levelDiff = Math.abs(p1Handicap - p2Handicap)
  
  // Se la differenza è troppo grande, applica un bilanciamento
  let adjustedP1Handicap = p1Handicap
  let adjustedP2Handicap = p2Handicap
  
  if (levelDiff > 0.3) {
    // Riduci il gap per rendere la sfida più equa
    const adjustment = (levelDiff - 0.3) * 0.5
    if (p1Handicap > p2Handicap) {
      adjustedP1Handicap -= adjustment
      adjustedP2Handicap += adjustment
    } else {
      adjustedP2Handicap -= adjustment
      adjustedP1Handicap += adjustment
    }
  }
  
  // Calcola ripetizioni richieste
  const p1Reps = calculateCalibratedReps(exercise, adjustedP1Handicap)
  const p2Reps = calculateCalibratedReps(exercise, adjustedP2Handicap)
  
  // Calcola fairness score (100 = perfettamente equo)
  const fairnessScore = Math.round(100 - (levelDiff * 100))
  
  // Genera spiegazione
  const explanation = generateHandicapExplanation(
    player1, player2, 
    adjustedP1Handicap, adjustedP2Handicap,
    p1Reps, p2Reps
  )
  
  return {
    player1Handicap: adjustedP1Handicap,
    player2Handicap: adjustedP2Handicap,
    player1Reps: p1Reps,
    player2Reps: p2Reps,
    fairnessScore: Math.max(0, Math.min(100, fairnessScore)),
    explanation
  }
}

/**
 * Genera una spiegazione leggibile dell'handicap applicato
 */
function generateHandicapExplanation(
  p1: UserCalibrationData,
  p2: UserCalibrationData,
  p1Handicap: number,
  p2Handicap: number,
  p1Reps: number,
  p2Reps: number
): string {
  const explanations: string[] = []
  
  // Confronto età
  if (Math.abs(p1.age - p2.age) > 10) {
    explanations.push(
      `Differenza di età (${p1.age} vs ${p2.age} anni) considerata`
    )
  }
  
  // Confronto genere
  if (p1.gender !== p2.gender) {
    explanations.push(`Bilanciamento per differenza di genere applicato`)
  }
  
  // Confronto livello fitness
  if (p1.fitness_level !== p2.fitness_level) {
    explanations.push(
      `Livelli fitness diversi (${p1.fitness_level} vs ${p2.fitness_level})`
    )
  }
  
  // Limitazioni
  if (p1.has_limitations || p2.has_limitations) {
    explanations.push(`Considerazioni per limitazioni fisiche applicate`)
  }
  
  // Riepilogo finale
  const percentDiff = Math.round(Math.abs(p1Reps - p2Reps) / Math.max(p1Reps, p2Reps) * 100)
  explanations.push(
    `Target calibrato: ${p1Reps} vs ${p2Reps} reps (${percentDiff}% differenza)`
  )
  
  return explanations.join('. ')
}

/**
 * Suggerisce avversari compatibili basati sul livello
 */
export function findCompatibleOpponents(
  user: UserCalibrationData,
  potentialOpponents: UserCalibrationData[],
  maxResults: number = 5
): Array<{opponent: UserCalibrationData, compatibility: number}> {
  const userHandicap = calculateUserHandicap(user)
  
  const compatibilityScores = potentialOpponents.map(opponent => {
    const opponentHandicap = calculateUserHandicap(opponent)
    const diff = Math.abs(userHandicap - opponentHandicap)
    
    // Compatibility score: 100 = perfect match, 0 = too different
    const compatibility = Math.max(0, 100 - (diff * 200))
    
    return { opponent, compatibility }
  })
  
  // Ordina per compatibilità e prendi i migliori
  return compatibilityScores
    .sort((a, b) => b.compatibility - a.compatibility)
    .slice(0, maxResults)
}

/**
 * Calcola bonus XP per sfide sbilanciate
 */
export function calculateXPBonus(
  winnerHandicap: number,
  loserHandicap: number,
  baseXP: number
): number {
  // Se il più debole vince, bonus XP
  if (winnerHandicap < loserHandicap) {
    const underdog = (loserHandicap - winnerHandicap) / loserHandicap
    const bonusMultiplier = 1 + (underdog * 0.5) // Max +50% bonus
    return Math.round(baseXP * bonusMultiplier)
  }
  
  // Se il più forte vince, XP normale o ridotto
  const advantage = (winnerHandicap - loserHandicap) / winnerHandicap
  const penaltyMultiplier = Math.max(0.7, 1 - (advantage * 0.3)) // Max -30% penalty
  return Math.round(baseXP * penaltyMultiplier)
}

/**
 * Genera sfide giornaliere calibrate
 */
export function generateDailyChallenges(
  user: UserCalibrationData,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Array<{
  exercise: string,
  targetReps: number,
  xpReward: number,
  description: string
}> {
  const userHandicap = calculateUserHandicap(user)
  
  // Modifica in base alla difficoltà
  const difficultyModifiers = {
    easy: 0.7,
    medium: 1.0,
    hard: 1.3
  }
  
  const diffMod = difficultyModifiers[difficulty]
  
  // Genera sfide per vari esercizi
  const challenges = []
  const exercises = ['pushups', 'squats', 'plank', 'jumping_jacks'] as const
  
  for (const exercise of exercises) {
    const baseReps = BASE_REPS[exercise]
    const calibratedReps = Math.round(baseReps * userHandicap * diffMod)
    const finalReps = Math.max(5, calibratedReps)
    
    // XP basato su difficoltà e handicap
    const baseXP = difficulty === 'easy' ? 50 : difficulty === 'medium' ? 100 : 150
    const xpReward = Math.round(baseXP * (2 - userHandicap)) // Più XP per utenti con handicap
    
    challenges.push({
      exercise,
      targetReps: finalReps,
      xpReward,
      description: `Completa ${finalReps} ${exercise} ${
        exercise === 'plank' ? 'secondi' : 'ripetizioni'
      }`
    })
  }
  
  return challenges
}