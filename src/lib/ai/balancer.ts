// ====================================
// FITDUEL REWARD ECONOMY BALANCER
// Dynamic reward calculation and anti-inflation system
// ====================================

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ====================================
// TYPES & INTERFACES
// ====================================

export interface EconomyMetrics {
  totalXPInCirculation: number
  totalCoinsInCirculation: number
  averageUserLevel: number
  activeUsers24h: number
  activeUsers7d: number
  missionsCompleted24h: number
  missionsCompletedRate: number
  inflationRate: number
  economyHealth: 'healthy' | 'inflated' | 'deflated' | 'critical'
}

export interface RewardCalculation {
  baseXP: number
  baseCoins: number
  adjustedXP: number
  adjustedCoins: number
  multipliers: {
    difficulty: number
    rarity: number
    userLevel: number
    economyBalance: number
    streak: number
    performance: number
  }
  bonuses: {
    firstCompletion: number
    perfectForm: number
    speedBonus: number
    comboBonus: number
  }
  finalXP: number
  finalCoins: number
  explanation: string[]
}

export interface MissionRewardConfig {
  category: string
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  targetValue: number
  userLevel: number
  userStreak?: number
  formScore?: number
  completionTime?: number
  isFirstTime?: boolean
  economyMetrics?: EconomyMetrics
}

// ====================================
// ECONOMY CONSTANTS
// ====================================

const ECONOMY_CONFIG = {
  // Target metrics for healthy economy
  TARGET_METRICS: {
    XP_PER_LEVEL: 1000, // Average XP needed per level
    COINS_PER_LEVEL: 200, // Average coins earned per level
    DAILY_XP_CAP: 5000, // Max XP per day per user
    DAILY_COINS_CAP: 500, // Max coins per day per user
    INFLATION_TARGET: 1.02, // 2% healthy inflation
    DEFLATION_THRESHOLD: 0.98, // Below this is deflation
    INFLATION_THRESHOLD: 1.05, // Above this is concerning
  },

  // Base reward tables
  BASE_REWARDS: {
    easy: { xp: 25, coins: 5 },
    medium: { xp: 50, coins: 10 },
    hard: { xp: 100, coins: 20 },
    extreme: { xp: 200, coins: 40 },
  },

  // Category multipliers
  CATEGORY_MULTIPLIERS: {
    streak: { xp: 1.2, coins: 1.1 },
    duels: { xp: 1.3, coins: 1.2 },
    exercise: { xp: 1.0, coins: 1.0 },
    social: { xp: 1.1, coins: 1.3 },
    performance: { xp: 1.4, coins: 1.1 },
    exploration: { xp: 0.8, coins: 1.5 },
  },

  // Level scaling
  LEVEL_SCALING: {
    1: 1.0,   // Levels 1-5
    5: 1.1,   // Levels 5-10
    10: 1.2,  // Levels 10-15
    15: 1.3,  // Levels 15-20
    20: 1.4,  // Levels 20-25
    25: 1.5,  // Levels 25-30
    30: 1.6,  // Levels 30+
  },

  // Anti-inflation mechanisms
  INFLATION_CONTROL: {
    SINK_RATE: 0.1, // 10% of rewards go to sinks
    TAX_RATE: 0.05, // 5% tax on large transactions
    DECAY_RATE: 0.02, // 2% daily decay on inactive accounts
  },

  // Bonus configurations
  BONUSES: {
    FIRST_COMPLETION: 0.5, // 50% bonus
    PERFECT_FORM: 0.3, // 30% bonus for >95% form
    SPEED_BONUS: 0.2, // 20% for fast completion
    COMBO_MULTIPLIER: 0.1, // 10% per combo level
    STREAK_MULTIPLIER: 0.05, // 5% per streak day
    WEEKEND_BONUS: 0.25, // 25% weekend bonus
    PEAK_HOURS: 0.15, // 15% during peak hours
  },
}

// ====================================
// REWARD BALANCER CLASS
// ====================================

export class RewardBalancer {
  private supabase
  private economyCache: Map<string, { data: EconomyMetrics; timestamp: number }>
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.supabase = createClientComponentClient()
    this.economyCache = new Map()
  }

  // ====================================
  // MAIN CALCULATION METHOD
  // ====================================

  async calculateRewards(config: MissionRewardConfig): Promise<RewardCalculation> {
    // Get current economy metrics
    const economyMetrics = config.economyMetrics || await this.getEconomyMetrics()
    
    // Get base rewards
    const baseRewards = this.getBaseRewards(config.difficulty)
    
    // Calculate all multipliers
    const multipliers = this.calculateMultipliers(config, economyMetrics)
    
    // Calculate bonuses
    const bonuses = this.calculateBonuses(config)
    
    // Apply multipliers to base rewards
    let adjustedXP = baseRewards.xp
    let adjustedCoins = baseRewards.coins
    
    // Apply category multiplier
    const categoryMultiplier = ECONOMY_CONFIG.CATEGORY_MULTIPLIERS[config.category as keyof typeof ECONOMY_CONFIG.CATEGORY_MULTIPLIERS] || { xp: 1, coins: 1 }
    adjustedXP *= categoryMultiplier.xp
    adjustedCoins *= categoryMultiplier.coins
    
    // Apply all multipliers
    Object.values(multipliers).forEach(mult => {
      adjustedXP *= mult
      adjustedCoins *= mult
    })
    
    // Apply bonuses (additive)
    let bonusXP = 0
    let bonusCoins = 0
    
    Object.entries(bonuses).forEach(([key, value]) => {
      if (value > 0) {
        bonusXP += adjustedXP * value
        bonusCoins += adjustedCoins * value
      }
    })
    
    // Calculate final rewards
    let finalXP = Math.round(adjustedXP + bonusXP)
    let finalCoins = Math.round(adjustedCoins + bonusCoins)
    
    // Apply economy balancing
    const economyMultiplier = this.getEconomyMultiplier(economyMetrics)
    finalXP = Math.round(finalXP * economyMultiplier)
    finalCoins = Math.round(finalCoins * economyMultiplier)
    
    // Apply daily caps
    finalXP = Math.min(finalXP, ECONOMY_CONFIG.TARGET_METRICS.DAILY_XP_CAP)
    finalCoins = Math.min(finalCoins, ECONOMY_CONFIG.TARGET_METRICS.DAILY_COINS_CAP)
    
    // Ensure minimum rewards
    finalXP = Math.max(10, finalXP)
    finalCoins = Math.max(5, finalCoins)
    
    // Generate explanation
    const explanation = this.generateExplanation(config, multipliers, bonuses, economyMultiplier)
    
    return {
      baseXP: baseRewards.xp,
      baseCoins: baseRewards.coins,
      adjustedXP: Math.round(adjustedXP),
      adjustedCoins: Math.round(adjustedCoins),
      multipliers,
      bonuses,
      finalXP,
      finalCoins,
      explanation,
    }
  }

  // ====================================
  // ECONOMY METRICS
  // ====================================

  async getEconomyMetrics(): Promise<EconomyMetrics> {
    // Check cache first
    const cached = this.economyCache.get('global')
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    try {
      // Get total XP and coins in circulation
      const { data: economyStats } = await this.supabase
        .from('economy_stats')
        .select('*')
        .single()

      // Get active users count
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const { count: activeUsers24h } = await this.supabase
        .from('user_stats')
        .select('*', { count: 'exact', head: true })
        .gte('last_active', oneDayAgo.toISOString())

      const { count: activeUsers7d } = await this.supabase
        .from('user_stats')
        .select('*', { count: 'exact', head: true })
        .gte('last_active', oneWeekAgo.toISOString())

      // Get missions completed
      const { count: missionsCompleted24h } = await this.supabase
        .from('user_missions')
        .select('*', { count: 'exact', head: true })
        .eq('is_completed', true)
        .gte('completed_at', oneDayAgo.toISOString())

      // Calculate average user level
      const { data: levelStats } = await this.supabase
        .from('user_stats')
        .select('level')

      const averageUserLevel = levelStats?.length 
        ? levelStats.reduce((sum, u) => sum + u.level, 0) / levelStats.length 
        : 1

      // Calculate inflation rate
      const previousTotal = economyStats?.previous_total_xp || 1
      const currentTotal = economyStats?.total_xp || 1
      const inflationRate = currentTotal / previousTotal

      // Determine economy health
      let economyHealth: EconomyMetrics['economyHealth'] = 'healthy'
      if (inflationRate < ECONOMY_CONFIG.TARGET_METRICS.DEFLATION_THRESHOLD) {
        economyHealth = 'deflated'
      } else if (inflationRate > ECONOMY_CONFIG.TARGET_METRICS.INFLATION_THRESHOLD) {
        economyHealth = inflationRate > 1.1 ? 'critical' : 'inflated'
      }

      const metrics: EconomyMetrics = {
        totalXPInCirculation: economyStats?.total_xp || 0,
        totalCoinsInCirculation: economyStats?.total_coins || 0,
        averageUserLevel: Math.round(averageUserLevel),
        activeUsers24h: activeUsers24h || 0,
        activeUsers7d: activeUsers7d || 0,
        missionsCompleted24h: missionsCompleted24h || 0,
        missionsCompletedRate: (missionsCompleted24h || 0) / Math.max(1, activeUsers24h || 1),
        inflationRate,
        economyHealth,
      }

      // Cache the results
      this.economyCache.set('global', { data: metrics, timestamp: Date.now() })

      return metrics
    } catch (error) {
      console.error('Error fetching economy metrics:', error)
      // Return default metrics on error
      return this.getDefaultMetrics()
    }
  }

  private getDefaultMetrics(): EconomyMetrics {
    return {
      totalXPInCirculation: 100000,
      totalCoinsInCirculation: 20000,
      averageUserLevel: 5,
      activeUsers24h: 100,
      activeUsers7d: 500,
      missionsCompleted24h: 200,
      missionsCompletedRate: 2,
      inflationRate: 1.02,
      economyHealth: 'healthy',
    }
  }

  // ====================================
  // MULTIPLIER CALCULATIONS
  // ====================================

  private calculateMultipliers(
    config: MissionRewardConfig,
    metrics: EconomyMetrics
  ): RewardCalculation['multipliers'] {
    return {
      difficulty: this.getDifficultyMultiplier(config.difficulty),
      rarity: this.getRarityMultiplier(config),
      userLevel: this.getUserLevelMultiplier(config.userLevel),
      economyBalance: this.getEconomyMultiplier(metrics),
      streak: this.getStreakMultiplier(config.userStreak || 0),
      performance: this.getPerformanceMultiplier(config.formScore || 0),
    }
  }

  private getDifficultyMultiplier(difficulty: string): number {
    const multipliers = {
      easy: 1.0,
      medium: 1.5,
      hard: 2.0,
      extreme: 3.0,
    }
    return multipliers[difficulty as keyof typeof multipliers] || 1.0
  }

  private getRarityMultiplier(config: MissionRewardConfig): number {
    // Rare missions get bonus multipliers
    if (config.category === 'exploration') return 1.2
    if (config.difficulty === 'extreme') return 1.3
    if (config.isFirstTime) return 1.5
    return 1.0
  }

  private getUserLevelMultiplier(level: number): number {
    // Find the appropriate scaling bracket
    const brackets = Object.entries(ECONOMY_CONFIG.LEVEL_SCALING)
      .sort(([a], [b]) => Number(b) - Number(a))
    
    for (const [minLevel, multiplier] of brackets) {
      if (level >= Number(minLevel)) {
        return multiplier
      }
    }
    
    return 1.0
  }

  private getEconomyMultiplier(metrics: EconomyMetrics): number {
    // Adjust rewards based on economy health
    switch (metrics.economyHealth) {
      case 'deflated':
        return 1.2 // Increase rewards to stimulate
      case 'inflated':
        return 0.8 // Decrease rewards to control
      case 'critical':
        return 0.6 // Significant reduction needed
      case 'healthy':
      default:
        return 1.0
    }
  }

  private getStreakMultiplier(streak: number): number {
    if (streak === 0) return 1.0
    // Logarithmic scaling for streaks
    return 1.0 + Math.min(Math.log10(streak + 1) * 0.2, 0.5)
  }

  private getPerformanceMultiplier(formScore: number): number {
    if (formScore >= 95) return 1.3
    if (formScore >= 90) return 1.2
    if (formScore >= 85) return 1.1
    return 1.0
  }

  // ====================================
  // BONUS CALCULATIONS
  // ====================================

  private calculateBonuses(config: MissionRewardConfig): RewardCalculation['bonuses'] {
    const bonuses = {
      firstCompletion: 0,
      perfectForm: 0,
      speedBonus: 0,
      comboBonus: 0,
    }

    // First time completion bonus
    if (config.isFirstTime) {
      bonuses.firstCompletion = ECONOMY_CONFIG.BONUSES.FIRST_COMPLETION
    }

    // Perfect form bonus
    if (config.formScore && config.formScore >= 95) {
      bonuses.perfectForm = ECONOMY_CONFIG.BONUSES.PERFECT_FORM
    }

    // Speed bonus (complete in under 50% expected time)
    if (config.completionTime && config.completionTime < (config.targetValue * 30)) {
      bonuses.speedBonus = ECONOMY_CONFIG.BONUSES.SPEED_BONUS
    }

    // Combo bonus (multiple missions in succession)
    // This would need to be tracked elsewhere
    bonuses.comboBonus = 0

    // Weekend bonus
    const now = new Date()
    if (now.getDay() === 0 || now.getDay() === 6) {
      bonuses.speedBonus += ECONOMY_CONFIG.BONUSES.WEEKEND_BONUS
    }

    // Peak hours bonus (6-9 AM, 5-8 PM)
    const hour = now.getHours()
    if ((hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 20)) {
      bonuses.speedBonus += ECONOMY_CONFIG.BONUSES.PEAK_HOURS
    }

    return bonuses
  }

  // ====================================
  // HELPER METHODS
  // ====================================

  private getBaseRewards(difficulty: string): { xp: number; coins: number } {
    return ECONOMY_CONFIG.BASE_REWARDS[difficulty as keyof typeof ECONOMY_CONFIG.BASE_REWARDS] || ECONOMY_CONFIG.BASE_REWARDS.easy
  }

  private generateExplanation(
    config: MissionRewardConfig,
    multipliers: RewardCalculation['multipliers'],
    bonuses: RewardCalculation['bonuses'],
    economyMultiplier: number
  ): string[] {
    const explanation: string[] = []

    explanation.push(`Base ${config.difficulty} mission: ${this.getBaseRewards(config.difficulty).xp} XP, ${this.getBaseRewards(config.difficulty).coins} coins`)

    if (multipliers.difficulty > 1) {
      explanation.push(`Difficulty bonus: x${multipliers.difficulty.toFixed(1)}`)
    }

    if (multipliers.userLevel > 1) {
      explanation.push(`Level ${config.userLevel} scaling: x${multipliers.userLevel.toFixed(1)}`)
    }

    if (multipliers.streak > 1) {
      explanation.push(`Streak bonus (${config.userStreak} days): x${multipliers.streak.toFixed(1)}`)
    }

    if (bonuses.firstCompletion > 0) {
      explanation.push(`First completion bonus: +${(bonuses.firstCompletion * 100).toFixed(0)}%`)
    }

    if (bonuses.perfectForm > 0) {
      explanation.push(`Perfect form bonus: +${(bonuses.perfectForm * 100).toFixed(0)}%`)
    }

    if (economyMultiplier !== 1) {
      const economyStatus = economyMultiplier > 1 ? 'bonus' : 'adjustment'
      explanation.push(`Economy ${economyStatus}: x${economyMultiplier.toFixed(1)}`)
    }

    return explanation
  }

  // ====================================
  // SINK MECHANISMS
  // ====================================

  async applySinkMechanisms(userId: string, amount: number, type: 'xp' | 'coins'): Promise<number> {
    // Apply various sink mechanisms to remove currency from economy
    let sinkAmount = 0

    // Transaction tax for large amounts
    if (amount > 1000) {
      sinkAmount += amount * ECONOMY_CONFIG.INFLATION_CONTROL.TAX_RATE
    }

    // General sink rate
    sinkAmount += amount * ECONOMY_CONFIG.INFLATION_CONTROL.SINK_RATE

    // Log the sink for economy tracking
    await this.logEconomySink(userId, sinkAmount, type)

    return amount - sinkAmount
  }

  private async logEconomySink(userId: string, amount: number, type: string): Promise<void> {
    try {
      await this.supabase
        .from('economy_sinks')
        .insert({
          user_id: userId,
          amount,
          type,
          reason: 'economy_balance',
          created_at: new Date().toISOString(),
        })
    } catch (error) {
      console.error('Error logging economy sink:', error)
    }
  }

  // ====================================
  // DAILY ECONOMY REPORT
  // ====================================

  async generateDailyReport(): Promise<{
    metrics: EconomyMetrics
    recommendations: string[]
    alerts: string[]
  }> {
    const metrics = await this.getEconomyMetrics()
    const recommendations: string[] = []
    const alerts: string[] = []

    // Check economy health
    if (metrics.economyHealth === 'inflated') {
      alerts.push('⚠️ Economy showing signs of inflation')
      recommendations.push('Consider reducing reward multipliers by 10%')
      recommendations.push('Implement additional sink mechanisms')
    }

    if (metrics.economyHealth === 'deflated') {
      alerts.push('⚠️ Economy showing signs of deflation')
      recommendations.push('Consider increasing reward multipliers by 10%')
      recommendations.push('Run special events to stimulate activity')
    }

    if (metrics.economyHealth === 'critical') {
      alerts.push('🚨 CRITICAL: Economy severely imbalanced')
      recommendations.push('IMMEDIATE: Reduce all rewards by 30%')
      recommendations.push('IMMEDIATE: Implement emergency sinks')
      recommendations.push('Consider economy reset or rebalancing patch')
    }

    // Check user engagement
    if (metrics.missionsCompletedRate < 1) {
      recommendations.push('Mission completion rate low - consider easier missions')
    }

    if (metrics.missionsCompletedRate > 5) {
      recommendations.push('Mission completion rate high - consider harder missions')
    }

    // Check active users
    const retentionRate = metrics.activeUsers7d > 0 ? metrics.activeUsers24h / metrics.activeUsers7d : 0
    if (retentionRate < 0.3) {
      alerts.push('⚠️ Low daily retention rate')
      recommendations.push('Implement daily login bonuses')
      recommendations.push('Send engagement notifications')
    }

    return { metrics, recommendations, alerts }
  }

  // ====================================
  // PREDICTIVE BALANCING
  // ====================================

  async predictFutureEconomy(days: number = 7): Promise<{
    projectedXP: number
    projectedCoins: number
    projectedInflation: number
    risk: 'low' | 'medium' | 'high'
  }> {
    const metrics = await this.getEconomyMetrics()
    
    // Simple projection based on current trends
    const dailyXPGeneration = metrics.missionsCompleted24h * 100 // Average XP per mission
    const dailyCoinGeneration = metrics.missionsCompleted24h * 20 // Average coins per mission
    
    const projectedXP = metrics.totalXPInCirculation + (dailyXPGeneration * days)
    const projectedCoins = metrics.totalCoinsInCirculation + (dailyCoinGeneration * days)
    
    const projectedInflation = projectedXP / metrics.totalXPInCirculation
    
    let risk: 'low' | 'medium' | 'high' = 'low'
    if (projectedInflation > 1.2) risk = 'high'
    else if (projectedInflation > 1.1) risk = 'medium'
    
    return {
      projectedXP,
      projectedCoins,
      projectedInflation,
      risk,
    }
  }
}

// ====================================
// EXPORT SINGLETON INSTANCE
// ====================================

export const rewardBalancer = new RewardBalancer()
export default RewardBalancer