// ====================================
// AI MISSION GENERATOR SYSTEM
// ====================================

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ====================================
// TYPES & INTERFACES
// ====================================
export type MissionType = 'daily' | 'weekly' | 'special' | 'progressive'
export type MissionCategory = 'duels' | 'exercise' | 'social' | 'streak' | 'performance' | 'exploration'
export type MissionDifficulty = 'easy' | 'medium' | 'hard' | 'extreme'

export interface UserProfile {
  id: string
  level: number
  total_xp: number
  total_duels: number
  duels_won: number
  win_rate: number
  daily_streak: number
  max_daily_streak: number
  favorite_exercises: string[]
  preferred_difficulty: MissionDifficulty
  activity_patterns: {
    most_active_time: string
    avg_session_duration: number
    weekly_frequency: number
  }
  completion_history: {
    daily_completed: number
    weekly_completed: number
    preferred_categories: MissionCategory[]
  }
}

export interface MissionTemplate {
  id: string
  category: MissionCategory
  difficulty: MissionDifficulty
  title_pattern: string
  description_pattern: string
  target_formula: string
  reward_formula: {
    xp: string
    coins: string
    streak_bonus?: string
  }
  requirements: string[]
  conditions: {
    min_level?: number
    max_level?: number
    requires_friends?: boolean
    time_based?: boolean
  }
  variations: string[]
  ai_prompts: {
    title_generation: string
    description_generation: string
    creative_twist: string
  }
}

export interface GeneratedMission {
  id: string
  type: MissionType
  category: MissionCategory
  difficulty: MissionDifficulty
  title: string
  description: string
  target_value: number
  reward_xp: number
  reward_coins: number
  streak_bonus?: number
  expires_at: string
  conditions: Record<string, any>
  metadata: {
    generated_by: 'ai'
    template_id: string
    personalization_factors: string[]
    estimated_completion_time: number
    fun_factor: number
  }
}

// ====================================
// AI MISSION TEMPLATES
// ====================================
const AI_MISSION_TEMPLATES: Record<MissionCategory, MissionTemplate[]> = {
  // DUELS CATEGORY
  duels: [
    {
      id: 'duels_win_streak',
      category: 'duels',
      difficulty: 'medium',
      title_pattern: 'Vinci {target} duelli consecutivi',
      description_pattern: 'Dimostra la tua costanza vincendo {target} sfide di fila',
      target_formula: 'Math.max(2, Math.min(user.daily_streak + 1, 5))',
      reward_formula: {
        xp: 'target * 25 + (difficulty === "hard" ? 50 : 0)',
        coins: 'target * 8 + user.level'
      },
      requirements: ['duels'],
      conditions: { min_level: 3 },
      variations: ['push-ups', 'squats', 'planks', 'burpees'],
      ai_prompts: {
        title_generation: 'Create a motivational duel challenge title',
        description_generation: 'Write an inspiring description for consecutive wins',
        creative_twist: 'Add a fun twist related to the user\'s favorite exercise'
      }
    },
    {
      id: 'duels_perfect_form',
      category: 'duels',
      difficulty: 'hard',
      title_pattern: 'Vinci {target} duelli con form score >90%',
      description_pattern: 'Combina vittoria e perfezione tecnica',
      target_formula: 'Math.max(1, Math.min(Math.floor(user.level / 3), 3))',
      reward_formula: {
        xp: 'target * 40 + user.level * 2',
        coins: 'target * 15'
      },
      requirements: ['duels', 'form_tracking'],
      conditions: { min_level: 5 },
      variations: [],
      ai_prompts: {
        title_generation: 'Create a perfectionist challenge title',
        description_generation: 'Emphasize both winning and perfect form execution',
        creative_twist: 'Add motivational phrase about excellence'
      }
    }
  ],

  // EXERCISE CATEGORY  
  exercise: [
    {
      id: 'exercise_variety',
      category: 'exercise',
      difficulty: 'easy',
      title_pattern: 'Prova {target} esercizi diversi',
      description_pattern: 'Esplora la varietà del fitness',
      target_formula: 'Math.max(2, Math.min(user.level / 2, 4))',
      reward_formula: {
        xp: 'target * 15',
        coins: 'target * 5'
      },
      requirements: ['exercises'],
      conditions: {},
      variations: ['upper_body', 'lower_body', 'core', 'cardio'],
      ai_prompts: {
        title_generation: 'Create an exploration-focused exercise title',
        description_generation: 'Encourage trying new exercise types',
        creative_twist: 'Add discovery and exploration themes'
      }
    },
    {
      id: 'exercise_endurance',
      category: 'exercise',
      difficulty: 'medium',
      title_pattern: 'Allena per {target} minuti totali',
      description_pattern: 'Costruisci la tua resistenza',
      target_formula: 'Math.max(5, Math.min(user.activity_patterns.avg_session_duration + 5, 30))',
      reward_formula: {
        xp: 'Math.floor(target * 2.5)',
        coins: 'Math.floor(target / 2)'
      },
      requirements: ['time_tracking'],
      conditions: {},
      variations: [],
      ai_prompts: {
        title_generation: 'Create an endurance-focused title',
        description_generation: 'Motivate extended workout sessions',
        creative_twist: 'Reference building stamina and persistence'
      }
    }
  ],

  // SOCIAL CATEGORY
  social: [
    {
      id: 'social_challenge_friends',
      category: 'social',
      difficulty: 'medium',
      title_pattern: 'Sfida {target} amici diversi',
      description_pattern: 'Coinvolgi la tua cerchia nel fitness',
      target_formula: 'Math.max(1, Math.min(2, user.level / 5))',
      reward_formula: {
        xp: 'target * 35',
        coins: 'target * 12'
      },
      requirements: ['friends', 'duels'],
      conditions: { requires_friends: true, min_level: 2 },
      variations: [],
      ai_prompts: {
        title_generation: 'Create a social engagement title',
        description_generation: 'Encourage building fitness community',
        creative_twist: 'Add friendship and community building themes'
      }
    },
    {
      id: 'social_help_newbie',
      category: 'social',
      difficulty: 'easy',
      title_pattern: 'Aiuta {target} principianti',
      description_pattern: 'Condividi la tua esperienza con chi inizia',
      target_formula: '1',
      reward_formula: {
        xp: '50 + user.level * 3',
        coins: '20'
      },
      requirements: ['social_interaction'],
      conditions: { min_level: 8 },
      variations: [],
      ai_prompts: {
        title_generation: 'Create a mentorship-focused title',
        description_generation: 'Encourage helping newcomers',
        creative_twist: 'Add themes of teaching and giving back'
      }
    }
  ],

  // STREAK CATEGORY
  streak: [
    {
      id: 'streak_maintain',
      category: 'streak',
      difficulty: 'easy',
      title_pattern: 'Mantieni lo streak per {target} giorni',
      description_pattern: 'La costanza è la chiave del successo',
      target_formula: 'user.daily_streak > 0 ? 1 : 3',
      reward_formula: {
        xp: '30 + (user.daily_streak * 5)',
        coins: '10 + user.daily_streak',
        streak_bonus: '15'
      },
      requirements: ['daily_activity'],
      conditions: {},
      variations: [],
      ai_prompts: {
        title_generation: 'Create a consistency-focused title',
        description_generation: 'Motivate daily habit building',
        creative_twist: 'Add persistence and habit formation themes'
      }
    },
    {
      id: 'streak_comeback',
      category: 'streak',
      difficulty: 'medium',
      title_pattern: 'Ricostruisci il tuo streak',
      description_pattern: 'Ogni caduta è un\'opportunità di rialzarsi più forti',
      target_formula: 'Math.min(user.max_daily_streak / 2, 7)',
      reward_formula: {
        xp: '40 + target * 10',
        coins: '15 + target * 3'
      },
      requirements: ['daily_activity'],
      conditions: {},
      variations: [],
      ai_prompts: {
        title_generation: 'Create a comeback/recovery title',
        description_generation: 'Motivate getting back on track',
        creative_twist: 'Add resilience and comeback themes'
      }
    }
  ],

  // PERFORMANCE CATEGORY
  performance: [
    {
      id: 'performance_improvement',
      category: 'performance',
      difficulty: 'medium',
      title_pattern: 'Migliora il tuo record in {exercise}',
      description_pattern: 'Supera i tuoi limiti precedenti',
      target_formula: 'Math.ceil(user.personal_best * 1.1)',
      reward_formula: {
        xp: '60 + user.level * 2',
        coins: '25'
      },
      requirements: ['performance_tracking'],
      conditions: { min_level: 4 },
      variations: ['push-ups', 'squats', 'planks', 'burpees'],
      ai_prompts: {
        title_generation: 'Create a personal improvement title',
        description_generation: 'Motivate breaking personal records',
        creative_twist: 'Add themes of growth and self-improvement'
      }
    },
    {
      id: 'performance_consistency',
      category: 'performance',
      difficulty: 'hard',
      title_pattern: 'Mantieni form score >85% per {target} sessioni',
      description_pattern: 'La qualità supera sempre la quantità',
      target_formula: 'Math.max(3, Math.min(user.level / 2, 5))',
      reward_formula: {
        xp: 'target * 30 + 20',
        coins: 'target * 10'
      },
      requirements: ['form_tracking'],
      conditions: { min_level: 6 },
      variations: [],
      ai_prompts: {
        title_generation: 'Create a quality-focused title',
        description_generation: 'Emphasize consistent high performance',
        creative_twist: 'Add themes of excellence and precision'
      }
    }
  ],

  // EXPLORATION CATEGORY
  exploration: [
    {
      id: 'exploration_new_feature',
      category: 'exploration',
      difficulty: 'easy',
      title_pattern: 'Esplora una nuova funzionalità',
      description_pattern: 'Scopri tutto quello che FitDuel ha da offrire',
      target_formula: '1',
      reward_formula: {
        xp: '40',
        coins: '15'
      },
      requirements: ['app_interaction'],
      conditions: { max_level: 10 },
      variations: ['leaderboard', 'achievements', 'profile', 'friends'],
      ai_prompts: {
        title_generation: 'Create an exploration-focused title',
        description_generation: 'Encourage discovering app features',
        creative_twist: 'Add discovery and adventure themes'
      }
    }
  ]
}

// ====================================
// AI GENERATION ENGINE
// ====================================
export class AIMissionGenerator {
  private supabase
  private openaiApiKey?: string

  constructor(openaiApiKey?: string) {
    this.supabase = createClientComponentClient()
    this.openaiApiKey = openaiApiKey
  }

  // ====================================
  // MAIN GENERATION METHODS
  // ====================================
  
  async generateDailyMissions(
    userId: string,
    count: number = 5
  ): Promise<GeneratedMission[]> {
    const userProfile = await this.getUserProfile(userId)
    const existingMissions = await this.getUserActiveMissions(userId, 'daily')
    
    const missions: GeneratedMission[] = []
    const targetCategories = this.selectCategories('daily', count, userProfile)
    
    for (let i = 0; i < count; i++) {
      const category = targetCategories[i % targetCategories.length]
      const template = this.selectTemplate(category, userProfile, 'daily')
      
      if (template) {
        const mission = await this.generateMissionFromTemplate(
          template,
          userProfile,
          'daily',
          existingMissions
        )
        
        if (mission && !this.isDuplicate(mission, existingMissions)) {
          missions.push(mission)
        }
      }
    }
    
    return this.ensureVariety(missions, userProfile)
  }

  async generateWeeklyMissions(
    userId: string,
    count: number = 3
  ): Promise<GeneratedMission[]> {
    const userProfile = await this.getUserProfile(userId)
    const existingMissions = await this.getUserActiveMissions(userId, 'weekly')
    
    const missions: GeneratedMission[] = []
    const targetCategories = this.selectCategories('weekly', count, userProfile)
    
    for (let i = 0; i < count; i++) {
      const category = targetCategories[i % targetCategories.length]
      const template = this.selectTemplate(category, userProfile, 'weekly')
      
      if (template) {
        const mission = await this.generateMissionFromTemplate(
          template,
          userProfile,
          'weekly',
          existingMissions
        )
        
        if (mission && !this.isDuplicate(mission, existingMissions)) {
          missions.push(mission)
        }
      }
    }
    
    return missions
  }

  async generateSpecialMission(
    userId: string,
    trigger: 'level_up' | 'streak_milestone' | 'weekend' | 'event'
  ): Promise<GeneratedMission | null> {
    const userProfile = await this.getUserProfile(userId)
    
    const specialTemplate = this.getSpecialTemplate(trigger, userProfile)
    if (!specialTemplate) return null
    
    return await this.generateMissionFromTemplate(
      specialTemplate,
      userProfile,
      'special',
      []
    )
  }

  async generateProgressiveMission(
    userId: string,
    baseCategory: MissionCategory
  ): Promise<GeneratedMission[]> {
    const userProfile = await this.getUserProfile(userId)
    
    // Progressive missions are series of increasing difficulty
    const missions: GeneratedMission[] = []
    const difficulties: MissionDifficulty[] = ['easy', 'medium', 'hard', 'extreme']
    
    for (const difficulty of difficulties) {
      const template = this.selectTemplate(baseCategory, userProfile, 'progressive', difficulty)
      
      if (template) {
        const mission = await this.generateMissionFromTemplate(
          template,
          userProfile,
          'progressive',
          []
        )
        
        if (mission) {
          mission.metadata.estimated_completion_time = this.estimateCompletionTime(mission, userProfile)
          missions.push(mission)
        }
      }
    }
    
    return missions
  }

  // ====================================
  // USER PROFILE & DATA METHODS
  // ====================================
  
  private async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      // Get user stats
      const { data: stats, error: statsError } = await this.supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (statsError) throw statsError

      // Get user preferences and history
      const { data: missions, error: missionsError } = await this.supabase
        .from('user_missions')
        .select('*, daily_missions(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      const profile: UserProfile = {
        id: userId,
        level: stats?.level || 1,
        total_xp: stats?.total_xp || 0,
        total_duels: stats?.total_duels || 0,
        duels_won: stats?.duels_won || 0,
        win_rate: stats?.total_duels > 0 ? (stats?.duels_won / stats?.total_duels) * 100 : 0,
        daily_streak: stats?.daily_streak || 0,
        max_daily_streak: stats?.max_daily_streak || 0,
        favorite_exercises: this.analyzeFavoriteExercises(missions?.data || []),
        preferred_difficulty: this.analyzePreferredDifficulty(stats),
        activity_patterns: {
          most_active_time: '18:00', // Default, could be analyzed from data
          avg_session_duration: 15, // Default minutes
          weekly_frequency: 4 // Default days per week
        },
        completion_history: {
          daily_completed: missions?.data?.filter(m => m.is_completed)?.length || 0,
          weekly_completed: 0, // Could be calculated
          preferred_categories: this.analyzePreferredCategories(missions?.data || [])
        }
      }

      return profile
    } catch (error) {
      console.error('Error getting user profile:', error)
      // Return default profile
      return this.getDefaultProfile(userId)
    }
  }

  private getDefaultProfile(userId: string): UserProfile {
    return {
      id: userId,
      level: 1,
      total_xp: 0,
      total_duels: 0,
      duels_won: 0,
      win_rate: 0,
      daily_streak: 0,
      max_daily_streak: 0,
      favorite_exercises: ['push-ups', 'squats'],
      preferred_difficulty: 'easy',
      activity_patterns: {
        most_active_time: '18:00',
        avg_session_duration: 10,
        weekly_frequency: 3
      },
      completion_history: {
        daily_completed: 0,
        weekly_completed: 0,
        preferred_categories: ['streak', 'exercise']
      }
    }
  }

  private async getUserActiveMissions(userId: string, type: MissionType): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_missions')
        .select('*, daily_missions(*)')
        .eq('user_id', userId)
        .eq('is_completed', false)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting active missions:', error)
      return []
    }
  }

  // ====================================
  // TEMPLATE SELECTION & GENERATION
  // ====================================
  
  private selectCategories(
    type: MissionType,
    count: number,
    profile: UserProfile
  ): MissionCategory[] {
    const weights: Record<MissionCategory, number> = {
      streak: type === 'daily' ? 0.3 : 0.1, // Higher weight for daily
      exercise: 0.25,
      duels: 0.25,
      performance: type === 'weekly' ? 0.3 : 0.15, // Higher weight for weekly
      social: profile.level > 5 ? 0.15 : 0.05,
      exploration: profile.level < 10 ? 0.1 : 0.02
    }

    // Adjust weights based on user preferences
    profile.completion_history.preferred_categories.forEach(cat => {
      weights[cat] = (weights[cat] || 0) * 1.5
    })

    // Select categories using weighted random
    const categories: MissionCategory[] = []
    const availableCategories = Object.keys(weights) as MissionCategory[]

    for (let i = 0; i < count; i++) {
      const category = this.weightedRandomSelect(availableCategories, weights)
      categories.push(category)
      
      // Reduce weight to encourage variety
      weights[category] *= 0.7
    }

    return categories
  }

  private selectTemplate(
    category: MissionCategory,
    profile: UserProfile,
    type: MissionType,
    targetDifficulty?: MissionDifficulty
  ): MissionTemplate | null {
    const templates = AI_MISSION_TEMPLATES[category] || []
    
    const suitableTemplates = templates.filter(template => {
      const meetsLevel = !template.conditions.min_level || profile.level >= template.conditions.min_level
      const underMaxLevel = !template.conditions.max_level || profile.level <= template.conditions.max_level
      const meetsDifficulty = !targetDifficulty || template.difficulty === targetDifficulty
      
      return meetsLevel && underMaxLevel && meetsDifficulty
    })

    if (suitableTemplates.length === 0) return null

    // Prefer templates matching user's preferred difficulty
    const preferredTemplates = suitableTemplates.filter(t => t.difficulty === profile.preferred_difficulty)
    const finalTemplates = preferredTemplates.length > 0 ? preferredTemplates : suitableTemplates

    return finalTemplates[Math.floor(Math.random() * finalTemplates.length)]
  }

  private async generateMissionFromTemplate(
    template: MissionTemplate,
    profile: UserProfile,
    type: MissionType,
    existingMissions: any[]
  ): Promise<GeneratedMission | null> {
    try {
      // Calculate target value using formula
      const target = this.evaluateFormula(template.target_formula, { user: profile })
      
      // Calculate rewards
      const xp = this.evaluateFormula(template.reward_formula.xp, { 
        user: profile, 
        target, 
        difficulty: template.difficulty 
      })
      
      const coins = this.evaluateFormula(template.reward_formula.coins, { 
        user: profile, 
        target, 
        difficulty: template.difficulty 
      })

      const streakBonus = template.reward_formula.streak_bonus 
        ? this.evaluateFormula(template.reward_formula.streak_bonus, { user: profile, target })
        : undefined

      // Generate creative content
      const { title, description } = await this.generateCreativeContent(template, profile, target)

      // Calculate expiration
      const expiresAt = new Date()
      if (type === 'daily') {
        expiresAt.setHours(23, 59, 59, 999)
      } else if (type === 'weekly') {
        expiresAt.setDate(expiresAt.getDate() + 7)
      } else {
        expiresAt.setDate(expiresAt.getDate() + 30) // Special/Progressive
      }

      const mission: GeneratedMission = {
        id: `ai_${type}_${template.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        category: template.category,
        difficulty: template.difficulty,
        title: title || template.title_pattern.replace('{target}', target.toString()),
        description: description || template.description_pattern.replace('{target}', target.toString()),
        target_value: target,
        reward_xp: Math.max(10, Math.floor(xp)), // Minimum 10 XP
        reward_coins: Math.max(5, Math.floor(coins)), // Minimum 5 coins
        streak_bonus: streakBonus ? Math.floor(streakBonus) : undefined,
        expires_at: expiresAt.toISOString(),
        conditions: template.conditions,
        metadata: {
          generated_by: 'ai',
          template_id: template.id,
          personalization_factors: this.getPersonalizationFactors(template, profile),
          estimated_completion_time: this.estimateCompletionTime({ target_value: target, category: template.category } as any, profile),
          fun_factor: this.calculateFunFactor(template, profile)
        }
      }

      return mission
    } catch (error) {
      console.error('Error generating mission from template:', error)
      return null
    }
  }

  // ====================================
  // AI CONTENT GENERATION
  // ====================================
  
  private async generateCreativeContent(
    template: MissionTemplate,
    profile: UserProfile,
    target: number
  ): Promise<{ title: string; description: string }> {
    // If OpenAI API is available, use it for creative content
    if (this.openaiApiKey) {
      try {
        return await this.generateAIContent(template, profile, target)
      } catch (error) {
        console.error('AI content generation failed, using templates:', error)
      }
    }

    // Fallback to template-based generation with variations
    const variations = this.generateVariations(template, profile, target)
    
    return {
      title: variations.title,
      description: variations.description
    }
  }

  private async generateAIContent(
    template: MissionTemplate,
    profile: UserProfile,
    target: number
  ): Promise<{ title: string; description: string }> {
    // This would integrate with OpenAI API
    // For now, return enhanced template-based content
    return this.generateVariations(template, profile, target)
  }

  private generateVariations(
    template: MissionTemplate,
    profile: UserProfile,
    target: number
  ): { title: string; description: string } {
    const motivationalWords = [
      'Conquista', 'Domina', 'Supera', 'Raggiungi', 'Ottieni', 'Sfida',
      'Sprigiona', 'Sblocca', 'Massimizza', 'Perfeziona'
    ]

    const encouragementPhrases = [
      'Sei pronto per la sfida?', 'Il momento è adesso!', 'Mostra di cosa sei capace!',
      'Spingi oltre i tuoi limiti!', 'La grandezza ti aspetta!', 'Fai la differenza oggi!'
    ]

    // Personalize based on user level and streak
    let titlePrefix = motivationalWords[Math.floor(Math.random() * motivationalWords.length)]
    if (profile.daily_streak > 5) {
      titlePrefix = 'Campione, ' + titlePrefix.toLowerCase()
    } else if (profile.level > 15) {
      titlePrefix = 'Maestro, ' + titlePrefix.toLowerCase()
    }

    const baseTitle = template.title_pattern.replace('{target}', target.toString())
    const title = `${titlePrefix}: ${baseTitle}`

    const baseDescription = template.description_pattern.replace('{target}', target.toString())
    const encouragement = encouragementPhrases[Math.floor(Math.random() * encouragementPhrases.length)]
    const description = `${baseDescription} ${encouragement}`

    return { title, description }
  }

  // ====================================
  // UTILITY METHODS
  // ====================================
  
  private evaluateFormula(formula: string, context: Record<string, any>): number {
    try {
      // Simple formula evaluation with safety checks
      const sanitizedFormula = formula.replace(/[^0-9+\-*/().\w]/g, '')
      
      // Replace context variables
      let evaluatedFormula = sanitizedFormula
      for (const [key, value] of Object.entries(context)) {
        if (typeof value === 'object') {
          for (const [subKey, subValue] of Object.entries(value as any)) {
            evaluatedFormula = evaluatedFormula.replace(
              new RegExp(`${key}\\.${subKey}`, 'g'), 
              String(subValue)
            )
          }
        } else {
          evaluatedFormula = evaluatedFormula.replace(
            new RegExp(`\\b${key}\\b`, 'g'), 
            String(value)
          )
        }
      }

      // Safe evaluation
      const result = Function(`"use strict"; return (${evaluatedFormula})`)()
      return isNaN(result) ? 1 : Math.max(1, Math.floor(result))
    } catch (error) {
      console.error('Formula evaluation error:', error)
      return 1
    }
  }

  private weightedRandomSelect<T>(items: T[], weights: Record<string, number>): T {
    const totalWeight = items.reduce((sum, item) => sum + (weights[item as string] || 0), 0)
    let random = Math.random() * totalWeight
    
    for (const item of items) {
      random -= weights[item as string] || 0
      if (random <= 0) return item
    }
    
    return items[0] // Fallback
  }

  private isDuplicate(mission: GeneratedMission, existingMissions: any[]): boolean {
    return existingMissions.some(existing => 
      existing.daily_missions?.name === mission.title ||
      existing.daily_missions?.description === mission.description
    )
  }

  private ensureVariety(missions: GeneratedMission[], profile: UserProfile): GeneratedMission[] {
    // Ensure no more than 2 missions of the same category
    const categoryCount: Record<string, number> = {}
    
    return missions.filter(mission => {
      categoryCount[mission.category] = (categoryCount[mission.category] || 0) + 1
      return categoryCount[mission.category] <= 2
    })
  }

  private getSpecialTemplate(
    trigger: string,
    profile: UserProfile
  ): MissionTemplate | null {
    // Special mission templates based on triggers
    const specialTemplates: Record<string, MissionTemplate> = {
      level_up: {
        id: 'special_level_up',
        category: 'performance',
        difficulty: 'medium',
        title_pattern: 'Celebra il Level {level}!',
        description_pattern: 'Festeggia il tuo nuovo livello con una sfida speciale',
        target_formula: 'user.level',
        reward_formula: {
          xp: 'user.level * 20',
          coins: 'user.level * 10'
        },
        requirements: [],
        conditions: {},
        variations: [],
        ai_prompts: {
          title_generation: 'Create a celebration title for level up',
          description_generation: 'Write a congratulatory mission description',
          creative_twist: 'Add achievement and milestone themes'
        }
      }
      // Add more special templates...
    }

    return specialTemplates[trigger] || null
  }

  private analyzeFavoriteExercises(missions: any[]): string[] {
    // Analyze completed missions to find preferred exercises
    const exerciseCount: Record<string, number> = {}
    
    missions.forEach(mission => {
      if (mission.is_completed && mission.daily_missions?.code) {
        const code = mission.daily_missions.code
        if (code.includes('push')) exerciseCount['push-ups'] = (exerciseCount['push-ups'] || 0) + 1
        if (code.includes('squat')) exerciseCount['squats'] = (exerciseCount['squats'] || 0) + 1
        if (code.includes('plank')) exerciseCount['planks'] = (exerciseCount['planks'] || 0) + 1
      }
    })

    return Object.entries(exerciseCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([exercise]) => exercise)
  }

  private analyzePreferredDifficulty(stats: any): MissionDifficulty {
    if (!stats) return 'easy'
    
    const level = stats.level || 1
    const winRate = stats.duels_won && stats.total_duels 
      ? (stats.duels_won / stats.total_duels) * 100 
      : 50

    if (level >= 15 && winRate >= 75) return 'extreme'
    if (level >= 10 && winRate >= 60) return 'hard'
    if (level >= 5 && winRate >= 40) return 'medium'
    return 'easy'
  }

  private analyzePreferredCategories(missions: any[]): MissionCategory[] {
    const categoryCount: Record<string, number> = {}
    
    missions.forEach(mission => {
      if (mission.is_completed && mission.daily_missions?.code) {
        const code = mission.daily_missions.code
        if (code.includes('streak')) categoryCount['streak'] = (categoryCount['streak'] || 0) + 1
        if (code.includes('duel')) categoryCount['duels'] = (categoryCount['duels'] || 0) + 1
        if (code.includes('exercise')) categoryCount['exercise'] = (categoryCount['exercise'] || 0) + 1
        if (code.includes('social')) categoryCount['social'] = (categoryCount['social'] || 0) + 1
      }
    })

    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category as MissionCategory)
  }

  private estimateCompletionTime(mission: GeneratedMission, profile: UserProfile): number {
    // Estimate completion time in minutes based on mission type and user profile
    const baseTime: Record<MissionCategory, number> = {
      streak: 1, // Just logging in
      exercise: 10, // Average workout time
      duels: 15, // Multiple duels
      social: 20, // Finding and challenging friends
      performance: 25, // Focused improvement
      exploration: 5 // Checking new features
    }

    const difficultyMultiplier: Record<MissionDifficulty, number> = {
      easy: 0.8,
      medium: 1.0,
      hard: 1.5,
      extreme: 2.0
    }

    return Math.floor(
      baseTime[mission.category] * 
      difficultyMultiplier[mission.difficulty] *
      (mission.target_value > 1 ? Math.log(mission.target_value) : 1)
    )
  }

  private calculateFunFactor(template: MissionTemplate, profile: UserProfile): number {
    // Calculate how fun this mission will be for the user (0-100)
    let funFactor = 50 // Base

    // Prefer user's favorite categories
    if (profile.completion_history.preferred_categories.includes(template.category)) {
      funFactor += 20
    }

    // Difficulty matching
    if (template.difficulty === profile.preferred_difficulty) {
      funFactor += 15
    }

    // Variety bonus
    if (template.variations.length > 0) {
      funFactor += 10
    }

    // Social missions get bonus for higher level users
    if (template.category === 'social' && profile.level > 10) {
      funFactor += 15
    }

    return Math.min(100, Math.max(0, funFactor))
  }

  private getPersonalizationFactors(template: MissionTemplate, profile: UserProfile): string[] {
    const factors: string[] = []

    if (profile.completion_history.preferred_categories.includes(template.category)) {
      factors.push('preferred_category')
    }

    if (template.difficulty === profile.preferred_difficulty) {
      factors.push('preferred_difficulty')
    }

    if (profile.daily_streak > 0 && template.category === 'streak') {
      factors.push('streak_active')
    }

    if (profile.level >= 10 && template.category === 'social') {
      factors.push('social_ready')
    }

    return factors
  }
}

// ====================================
// EXPORT DEFAULT INSTANCE
// ====================================
export const aiMissionGenerator = new AIMissionGenerator()
export default AIMissionGenerator