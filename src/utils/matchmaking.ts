// ====================================
// MATCHMAKING ENGINE
// ====================================

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { UserCalibrationData, HandicapResult } from './handicapSystem'
import { 
  calculateUserHandicap, 
  calculateDuelHandicap,
  findCompatibleOpponents 
} from './handicapSystem'

// ====================================
// TYPES
// ====================================

export interface MatchmakingProfile {
  user_id: string
  username: string
  avatar?: string
  level: number
  total_xp: number
  
  // Stats
  wins: number
  losses: number
  win_rate: number
  current_streak: number
  
  // Calibration
  calibration_data: UserCalibrationData
  handicap_score: number
  
  // Matchmaking
  elo_rating: number
  last_match_at?: Date
  preferred_exercises?: string[]
  
  // Status
  is_online: boolean
  is_in_match: boolean
  looking_for_match: boolean
}

export interface MatchmakingOptions {
  mode: 'quick' | 'ranked' | 'friendly' | 'tournament'
  exercise?: string
  difficulty?: 'any' | 'easy' | 'medium' | 'hard'
  maxWaitTime?: number // secondi
  preferredOpponentLevel?: 'similar' | 'stronger' | 'weaker' | 'any'
}

export interface MatchResult {
  opponent: MatchmakingProfile
  matchQuality: number // 0-100
  handicapData: HandicapResult
  estimatedWaitTime: number // secondi
  matchType: 'perfect' | 'good' | 'acceptable' | 'mismatch'
  reasons: string[]
}

export interface MatchmakingQueue {
  user_id: string
  profile: MatchmakingProfile
  options: MatchmakingOptions
  joined_at: Date
  priority: number
}

// ====================================
// MATCHMAKING ALGORITHM
// ====================================

export class MatchmakingEngine {
  private supabase = createClientComponentClient()
  private queue: Map<string, MatchmakingQueue> = new Map()
  private activeMatches: Set<string> = new Set()
  
  // Configurazione
  private readonly ELO_K_FACTOR = 32 // Quanto cambiano i rating
  private readonly MAX_SKILL_DIFF = 300 // Max differenza ELO
  private readonly QUEUE_TIMEOUT = 60 // Secondi max in coda
  
  /**
   * Aggiungi giocatore alla coda matchmaking
   */
  async joinQueue(
    userId: string, 
    options: MatchmakingOptions = { mode: 'quick' }
  ): Promise<void> {
    // Carica profilo completo con calibrazione
    const profile = await this.loadUserProfile(userId)
    
    if (!profile) {
      throw new Error('Profilo non trovato o non calibrato')
    }
    
    // Controlla se già in coda o in match
    if (this.queue.has(userId)) {
      throw new Error('Già in coda matchmaking')
    }
    
    if (this.activeMatches.has(userId)) {
      throw new Error('Già in una sfida attiva')
    }
    
    // Aggiungi alla coda con priorità
    const queueEntry: MatchmakingQueue = {
      user_id: userId,
      profile,
      options,
      joined_at: new Date(),
      priority: this.calculateQueuePriority(profile, options)
    }
    
    this.queue.set(userId, queueEntry)
    
    // Aggiorna status nel database
    await this.updateMatchmakingStatus(userId, true)
  }
  
  /**
   * Rimuovi dalla coda
   */
  async leaveQueue(userId: string): Promise<void> {
    this.queue.delete(userId)
    await this.updateMatchmakingStatus(userId, false)
  }
  
  /**
   * Trova match per un giocatore
   */
  async findMatch(userId: string): Promise<MatchResult | null> {
    const seeker = this.queue.get(userId)
    if (!seeker) return null
    
    const currentTime = new Date()
    const waitTime = (currentTime.getTime() - seeker.joined_at.getTime()) / 1000
    
    // Espandi criteri di ricerca col passare del tempo
    const searchRadius = this.calculateSearchRadius(waitTime)
    
    // Ottieni candidati dalla coda (escludi se stesso)
    const candidates = Array.from(this.queue.values())
      .filter(q => q.user_id !== userId)
      .filter(q => !this.activeMatches.has(q.user_id))
      .filter(q => this.isCompatibleMode(seeker.options, q.options))
    
    if (candidates.length === 0) {
      return null
    }
    
    // Valuta ogni candidato
    const evaluatedMatches = candidates.map(candidate => 
      this.evaluateMatch(seeker, candidate, searchRadius)
    )
    
    // Ordina per qualità match
    const sortedMatches = evaluatedMatches
      .filter(m => m !== null)
      .sort((a, b) => b!.matchQuality - a!.matchQuality)
    
    // Prendi il migliore
    const bestMatch = sortedMatches[0]
    
    if (bestMatch) {
      // Rimuovi entrambi dalla coda
      this.queue.delete(userId)
      this.queue.delete(bestMatch.opponent.user_id)
      
      // Aggiungi agli active matches
      this.activeMatches.add(userId)
      this.activeMatches.add(bestMatch.opponent.user_id)
      
      // Crea match nel database
      await this.createMatch(seeker.profile, bestMatch.opponent, bestMatch.handicapData)
      
      return bestMatch
    }
    
    return null
  }
  
  /**
   * Valuta la qualità di un potenziale match
   */
  private evaluateMatch(
    seeker: MatchmakingQueue,
    candidate: MatchmakingQueue,
    searchRadius: number
  ): MatchResult | null {
    const reasons: string[] = []
    let qualityScore = 100
    
    // 1. Controlla differenza ELO
    const eloDiff = Math.abs(seeker.profile.elo_rating - candidate.profile.elo_rating)
    if (eloDiff > this.MAX_SKILL_DIFF + searchRadius) {
      return null // Troppa differenza
    }
    qualityScore -= (eloDiff / 10) // -10 punti ogni 100 ELO di differenza
    
    // 2. Calcola handicap per bilanciare
    const exercise = seeker.options.exercise || 'squats'
    const handicapData = calculateDuelHandicap(
      seeker.profile.calibration_data,
      candidate.profile.calibration_data,
      exercise as any
    )
    
    // 3. Valuta fairness della sfida
    qualityScore = Math.min(qualityScore, handicapData.fairnessScore)
    
    // 4. Bonus per preferenze matchate
    if (seeker.options.preferredOpponentLevel) {
      const levelDiff = candidate.profile.level - seeker.profile.level
      
      switch (seeker.options.preferredOpponentLevel) {
        case 'similar':
          if (Math.abs(levelDiff) <= 5) {
            qualityScore += 10
            reasons.push('Livello simile')
          }
          break
        case 'stronger':
          if (levelDiff > 0) {
            qualityScore += 5
            reasons.push('Avversario più forte come richiesto')
          }
          break
        case 'weaker':
          if (levelDiff < 0) {
            qualityScore += 5
            reasons.push('Avversario più debole come richiesto')
          }
          break
      }
    }
    
    // 5. Penalità per match recenti
    if (this.hasRecentMatch(seeker.profile.user_id, candidate.profile.user_id)) {
      qualityScore -= 20
      reasons.push('Match recente con questo avversario')
    }
    
    // 6. Bonus per tempo di attesa simile
    const waitTimeDiff = Math.abs(
      seeker.joined_at.getTime() - candidate.joined_at.getTime()
    ) / 1000
    if (waitTimeDiff < 10) {
      qualityScore += 5
      reasons.push('Tempo di attesa simile')
    }
    
    // Determina tipo di match
    let matchType: MatchResult['matchType']
    if (qualityScore >= 90) matchType = 'perfect'
    else if (qualityScore >= 70) matchType = 'good'
    else if (qualityScore >= 50) matchType = 'acceptable'
    else matchType = 'mismatch'
    
    // Aggiungi spiegazioni
    if (eloDiff < 50) reasons.push('Skill molto simile')
    else if (eloDiff < 150) reasons.push('Skill comparabile')
    else reasons.push('Differenza skill bilanciata con handicap')
    
    return {
      opponent: candidate.profile,
      matchQuality: Math.max(0, Math.min(100, qualityScore)),
      handicapData,
      estimatedWaitTime: 0,
      matchType,
      reasons
    }
  }
  
  /**
   * Calcola il raggio di ricerca basato sul tempo di attesa
   */
  private calculateSearchRadius(waitTimeSeconds: number): number {
    // Espandi criteri ogni 10 secondi
    const expansionRate = 50 // ELO points per 10 secondi
    return Math.floor(waitTimeSeconds / 10) * expansionRate
  }
  
  /**
   * Calcola priorità in coda
   */
  private calculateQueuePriority(
    profile: MatchmakingProfile,
    options: MatchmakingOptions
  ): number {
    let priority = 0
    
    // Premium users get priority (futuro)
    // if (profile.is_premium) priority += 100
    
    // Giocatori con poche partite hanno priorità (per retention)
    const totalMatches = profile.wins + profile.losses
    if (totalMatches < 10) priority += 50
    else if (totalMatches < 50) priority += 25
    
    // Chi aspetta da più tempo ha priorità crescente
    // (gestito dinamicamente nel findMatch)
    
    return priority
  }
  
  /**
   * Controlla se due modalità sono compatibili
   */
  private isCompatibleMode(
    options1: MatchmakingOptions,
    options2: MatchmakingOptions
  ): boolean {
    // Quick match è compatibile con tutto tranne tournament
    if (options1.mode === 'quick' && options2.mode !== 'tournament') return true
    if (options2.mode === 'quick' && options1.mode !== 'tournament') return true
    
    // Stessa modalità sempre ok
    if (options1.mode === options2.mode) return true
    
    // Friendly è compatibile con ranked
    if (
      (options1.mode === 'friendly' && options2.mode === 'ranked') ||
      (options1.mode === 'ranked' && options2.mode === 'friendly')
    ) {
      return true
    }
    
    return false
  }
  
  /**
   * Controlla se due giocatori hanno avuto match recenti
   */
  private async hasRecentMatch(
    userId1: string,
    userId2: string,
    hoursAgo: number = 1
  ): Promise<boolean> {
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - hoursAgo)
    
    const { data } = await this.supabase
      .from('duels')
      .select('id')
      .or(`challenger_id.eq.${userId1},challenger_id.eq.${userId2}`)
      .or(`opponent_id.eq.${userId1},opponent_id.eq.${userId2}`)
      .gte('created_at', cutoffTime.toISOString())
      .limit(1)
    
    return (data?.length || 0) > 0
  }
  
  /**
   * Carica profilo completo con calibrazione
   */
  private async loadUserProfile(userId: string): Promise<MatchmakingProfile | null> {
    // Carica dati utente
    const { data: profile } = await this.supabase
      .from('profiles')
      .select(`
        *,
        user_calibration (*)
      `)
      .eq('id', userId)
      .single()
    
    if (!profile || !profile.user_calibration) {
      return null
    }
    
    // Carica statistiche
    const { data: stats } = await this.supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    // Costruisci profilo matchmaking
    const calibrationData = profile.user_calibration[0]
    const matchmakingProfile: MatchmakingProfile = {
      user_id: userId,
      username: profile.username || profile.email,
      avatar: profile.avatar_url,
      level: profile.level || 1,
      total_xp: profile.total_xp || 0,
      
      wins: stats?.wins || 0,
      losses: stats?.losses || 0,
      win_rate: stats?.win_rate || 0,
      current_streak: stats?.current_streak || 0,
      
      calibration_data: {
        age: calibrationData.age,
        gender: calibrationData.gender,
        weight: calibrationData.weight,
        height: calibrationData.height,
        fitness_level: calibrationData.fitness_level,
        training_frequency: calibrationData.training_frequency,
        fitness_experience_years: calibrationData.fitness_experience_years,
        has_limitations: calibrationData.has_limitations,
        limitations: calibrationData.limitations,
        pushups_count: calibrationData.pushups_count,
        squats_count: calibrationData.squats_count,
        plank_duration: calibrationData.plank_duration,
        jumping_jacks_count: calibrationData.jumping_jacks_count,
        calibration_score: calibrationData.calibration_score,
        assigned_level: calibrationData.assigned_level,
        base_handicap: calibrationData.base_handicap
      },
      
      handicap_score: calculateUserHandicap(calibrationData),
      elo_rating: profile.elo_rating || 1200,
      
      is_online: true,
      is_in_match: false,
      looking_for_match: false
    }
    
    return matchmakingProfile
  }
  
  /**
   * Aggiorna status matchmaking nel database
   */
  private async updateMatchmakingStatus(
    userId: string,
    lookingForMatch: boolean
  ): Promise<void> {
    await this.supabase
      .from('profiles')
      .update({ 
        looking_for_match: lookingForMatch,
        last_seen: new Date().toISOString()
      })
      .eq('id', userId)
  }
  
  /**
   * Crea un match nel database
   */
  private async createMatch(
    player1: MatchmakingProfile,
    player2: MatchmakingProfile,
    handicapData: HandicapResult
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from('duels')
      .insert({
        challenger_id: player1.user_id,
        opponent_id: player2.user_id,
        status: 'pending',
        exercise_type: 'squats', // Default, può essere cambiato
        
        // Target calibrati
        challenger_target: handicapData.player1Reps,
        opponent_target: handicapData.player2Reps,
        
        // Metadata
        challenger_handicap: handicapData.player1Handicap,
        opponent_handicap: handicapData.player2Handicap,
        fairness_score: handicapData.fairnessScore,
        
        // Timing
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    return data.id
  }
  
  /**
   * Calcola nuovo rating ELO dopo un match
   */
  calculateNewEloRatings(
    winnerElo: number,
    loserElo: number
  ): { winnerNewElo: number, loserNewElo: number } {
    // Formula ELO standard
    const expectedScoreWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400))
    const expectedScoreLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400))
    
    const winnerNewElo = Math.round(winnerElo + this.ELO_K_FACTOR * (1 - expectedScoreWinner))
    const loserNewElo = Math.round(loserElo + this.ELO_K_FACTOR * (0 - expectedScoreLoser))
    
    // Minimo 100, massimo 3000
    return {
      winnerNewElo: Math.max(100, Math.min(3000, winnerNewElo)),
      loserNewElo: Math.max(100, Math.min(3000, loserNewElo))
    }
  }
  
  /**
   * Stima tempo di attesa per trovare un match
   */
  async estimateWaitTime(
    userId: string,
    options: MatchmakingOptions
  ): Promise<number> {
    const profile = await this.loadUserProfile(userId)
    if (!profile) return 60 // Default 1 minuto
    
    // Conta giocatori online nel range ELO
    const eloRange = 300
    const { count } = await this.supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_online', true)
      .gte('elo_rating', profile.elo_rating - eloRange)
      .lte('elo_rating', profile.elo_rating + eloRange)
    
    const playersInRange = count || 0
    
    // Stima basata su giocatori disponibili
    if (playersInRange > 50) return 5 // 5 secondi
    if (playersInRange > 20) return 10
    if (playersInRange > 10) return 20
    if (playersInRange > 5) return 30
    if (playersInRange > 0) return 45
    return 60 // Max 1 minuto
  }
  
  /**
   * Ottieni statistiche matchmaking globali
   */
  async getMatchmakingStats(): Promise<{
    playersOnline: number
    playersInQueue: number
    activeMatches: number
    averageWaitTime: number
    averageFairnessScore: number
  }> {
    // Giocatori online
    const { count: playersOnline } = await this.supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_online', true)
    
    // Match attivi
    const { count: activeMatches } = await this.supabase
      .from('duels')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'in_progress'])
    
    // Fairness media ultimi match
    const { data: recentMatches } = await this.supabase
      .from('duels')
      .select('fairness_score')
      .not('fairness_score', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100)
    
    const avgFairness = recentMatches?.length 
      ? recentMatches.reduce((sum, m) => sum + m.fairness_score, 0) / recentMatches.length
      : 0
    
    // Tempo medio attesa (simulato per ora)
    const playersInQueue = this.queue.size
    const avgWaitTime = playersInQueue > 10 ? 5 : playersInQueue > 5 ? 15 : 30
    
    return {
      playersOnline: playersOnline || 0,
      playersInQueue,
      activeMatches: activeMatches || 0,
      averageWaitTime: avgWaitTime,
      averageFairnessScore: Math.round(avgFairness)
    }
  }
}

// ====================================
// SINGLETON INSTANCE
// ====================================

let matchmakingInstance: MatchmakingEngine | null = null

export function getMatchmakingEngine(): MatchmakingEngine {
  if (!matchmakingInstance) {
    matchmakingInstance = new MatchmakingEngine()
  }
  return matchmakingInstance
}

// ====================================
// HELPER FUNCTIONS
// ====================================

/**
 * Quick match wrapper
 */
export async function quickMatch(userId: string): Promise<MatchResult | null> {
  const engine = getMatchmakingEngine()
  
  // Join queue con opzioni default
  await engine.joinQueue(userId, { mode: 'quick' })
  
  // Prova a trovare match ogni 2 secondi per max 60 secondi
  const maxAttempts = 30
  let attempts = 0
  
  while (attempts < maxAttempts) {
    const match = await engine.findMatch(userId)
    if (match) return match
    
    // Aspetta 2 secondi prima di riprovare
    await new Promise(resolve => setTimeout(resolve, 2000))
    attempts++
  }
  
  // Timeout - rimuovi dalla coda
  await engine.leaveQueue(userId)
  return null
}

/**
 * Ranked match con criteri più stretti
 */
export async function rankedMatch(
  userId: string,
  exercise?: string
): Promise<MatchResult | null> {
  const engine = getMatchmakingEngine()
  
  await engine.joinQueue(userId, { 
    mode: 'ranked',
    exercise,
    preferredOpponentLevel: 'similar'
  })
  
  // Logica simile a quickMatch ma con criteri più stretti
  const maxAttempts = 45 // 90 secondi per ranked
  let attempts = 0
  
  while (attempts < maxAttempts) {
    const match = await engine.findMatch(userId)
    if (match && match.matchQuality >= 70) { // Solo match di qualità per ranked
      return match
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    attempts++
  }
  
  await engine.leaveQueue(userId)
  return null
}