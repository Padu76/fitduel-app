// ====================================
// WEEKLY MISSION TEMPLATES
// Pre-defined patterns for weekly challenges
// ====================================

import { MissionTemplate, MissionCategory, MissionDifficulty } from '../mission-generator'

// ====================================
// TYPES
// ====================================

export interface WeeklyMissionTemplate extends MissionTemplate {
  weekType: 'standard' | 'challenge' | 'marathon' | 'tournament'
  minDaysRequired: number
  checkpoints: {
    day: number
    target: number
    bonus?: number
  }[]
  teamOption?: boolean
  leaderboardEnabled?: boolean
  specialRewards?: {
    type: string
    value: any
    condition: string
  }[]
}

// ====================================
// WEEKLY MISSION TEMPLATES
// ====================================

export const WEEKLY_MISSION_TEMPLATES: Record<MissionCategory, WeeklyMissionTemplate[]> = {
  // ====================================
  // DUELS CATEGORY - WEEKLY
  // ====================================
  duels: [
    {
      id: 'weekly_duels_champion',
      category: 'duels',
      difficulty: 'medium',
      title_pattern: '🏆 Campione della Settimana',
      description_pattern: 'Vinci almeno {target} duelli questa settimana',
      target_formula: 'Math.max(7, Math.min(user.level * 2, 20))',
      reward_formula: {
        xp: 'target * 15 + 100',
        coins: 'target * 5 + 30',
      },
      requirements: ['duels'],
      conditions: { min_level: 3 },
      variations: [],
      weekType: 'standard',
      minDaysRequired: 3,
      checkpoints: [
        { day: 2, target: 30, bonus: 10 },
        { day: 4, target: 60, bonus: 20 },
        { day: 7, target: 100, bonus: 50 },
      ],
      leaderboardEnabled: true,
      ai_prompts: {
        title_generation: 'Create a weekly champion challenge title',
        description_generation: 'Motivate sustained competitive performance',
        creative_twist: 'Use champion, victory, or dominance themes',
      },
    },
    {
      id: 'weekly_duels_undefeated',
      category: 'duels',
      difficulty: 'hard',
      title_pattern: '⚡ Settimana Imbattuta',
      description_pattern: 'Mantieni una win rate superiore al {target}% per tutta la settimana',
      target_formula: 'Math.max(60, 90 - user.level)',
      reward_formula: {
        xp: '300 + user.level * 10',
        coins: '100',
      },
      requirements: ['duels', 'win_tracking'],
      conditions: { min_level: 5 },
      variations: [],
      weekType: 'challenge',
      minDaysRequired: 5,
      checkpoints: [
        { day: 3, target: 70, bonus: 30 },
        { day: 5, target: 80, bonus: 50 },
        { day: 7, target: 90, bonus: 100 },
      ],
      specialRewards: [
        {
          type: 'badge',
          value: 'undefeated_week',
          condition: 'complete_with_90_percent',
        },
      ],
      ai_prompts: {
        title_generation: 'Create an undefeated streak challenge',
        description_generation: 'Emphasize maintaining high win rate',
        creative_twist: 'Use invincible, unstoppable themes',
      },
    },
    {
      id: 'weekly_duels_variety',
      category: 'duels',
      difficulty: 'easy',
      title_pattern: '🎨 Maestro Versatile',
      description_pattern: 'Completa duelli in {target} esercizi diversi',
      target_formula: 'Math.min(5, Math.max(3, Math.floor(user.level / 3)))',
      reward_formula: {
        xp: 'target * 40',
        coins: 'target * 15',
      },
      requirements: ['duels', 'exercise_variety'],
      conditions: { min_level: 2 },
      variations: ['push-ups', 'squats', 'planks', 'burpees', 'lunges'],
      weekType: 'standard',
      minDaysRequired: 3,
      checkpoints: [
        { day: 3, target: 40, bonus: 10 },
        { day: 5, target: 70, bonus: 20 },
        { day: 7, target: 100, bonus: 30 },
      ],
      ai_prompts: {
        title_generation: 'Create a variety-focused duel challenge',
        description_generation: 'Encourage trying different exercise types',
        creative_twist: 'Use mastery, versatility, or jack-of-all-trades themes',
      },
    },
  ],

  // ====================================
  // EXERCISE CATEGORY - WEEKLY
  // ====================================
  exercise: [
    {
      id: 'weekly_exercise_marathon',
      category: 'exercise',
      difficulty: 'hard',
      title_pattern: '🏃 Maratona Fitness',
      description_pattern: 'Accumula {target} minuti totali di esercizio',
      target_formula: 'Math.max(150, Math.min(user.level * 20, 300))',
      reward_formula: {
        xp: 'target * 1.5 + 50',
        coins: 'Math.floor(target / 3)',
      },
      requirements: ['exercise', 'time_tracking'],
      conditions: { min_level: 4 },
      variations: [],
      weekType: 'marathon',
      minDaysRequired: 5,
      checkpoints: [
        { day: 2, target: 25, bonus: 20 },
        { day: 4, target: 50, bonus: 40 },
        { day: 6, target: 75, bonus: 60 },
        { day: 7, target: 100, bonus: 100 },
      ],
      leaderboardEnabled: true,
      ai_prompts: {
        title_generation: 'Create a marathon endurance challenge',
        description_generation: 'Motivate sustained effort over the week',
        creative_twist: 'Use marathon, endurance, or long-haul themes',
      },
    },
    {
      id: 'weekly_exercise_pyramid',
      category: 'exercise',
      difficulty: 'medium',
      title_pattern: '📐 Sfida Piramidale',
      description_pattern: 'Completa una piramide di {target} ripetizioni totali',
      target_formula: 'Math.max(100, Math.min(user.level * 30, 500))',
      reward_formula: {
        xp: 'Math.floor(target / 2) + 75',
        coins: 'Math.floor(target / 10) + 20',
      },
      requirements: ['exercise'],
      conditions: { min_level: 3 },
      variations: ['ascending', 'descending', 'mixed'],
      weekType: 'challenge',
      minDaysRequired: 4,
      checkpoints: [
        { day: 2, target: 20, bonus: 10 },
        { day: 4, target: 50, bonus: 25 },
        { day: 7, target: 100, bonus: 50 },
      ],
      ai_prompts: {
        title_generation: 'Create a pyramid training challenge',
        description_generation: 'Explain progressive rep schemes',
        creative_twist: 'Use building, climbing, or architectural themes',
      },
    },
    {
      id: 'weekly_exercise_daily_minimum',
      category: 'exercise',
      difficulty: 'easy',
      title_pattern: '📅 Costanza Settimanale',
      description_pattern: 'Esercitati almeno {target} minuti ogni giorno',
      target_formula: 'Math.max(10, Math.min(15, user.level * 2))',
      reward_formula: {
        xp: 'target * 7 * 3',
        coins: 'target * 7',
        streak_bonus: '30',
      },
      requirements: ['exercise', 'daily_tracking'],
      conditions: {},
      variations: [],
      weekType: 'standard',
      minDaysRequired: 7,
      checkpoints: [
        { day: 3, target: 30, bonus: 15 },
        { day: 5, target: 60, bonus: 30 },
        { day: 7, target: 100, bonus: 50 },
      ],
      specialRewards: [
        {
          type: 'streak_multiplier',
          value: 1.5,
          condition: 'all_seven_days',
        },
      ],
      ai_prompts: {
        title_generation: 'Create a daily consistency challenge',
        description_generation: 'Emphasize daily habit building',
        creative_twist: 'Use consistency, rhythm, or routine themes',
      },
    },
  ],

  // ====================================
  // SOCIAL CATEGORY - WEEKLY
  // ====================================
  social: [
    {
      id: 'weekly_social_team_challenge',
      category: 'social',
      difficulty: 'medium',
      title_pattern: '👥 Sfida di Squadra',
      description_pattern: 'Completa {target} attività con i tuoi amici',
      target_formula: 'Math.max(5, Math.min(user.level, 10))',
      reward_formula: {
        xp: 'target * 30 + 50',
        coins: 'target * 10 + 20',
      },
      requirements: ['social', 'friends'],
      conditions: { requires_friends: true, min_level: 3 },
      variations: [],
      weekType: 'standard',
      minDaysRequired: 3,
      teamOption: true,
      checkpoints: [
        { day: 3, target: 30, bonus: 20 },
        { day: 5, target: 60, bonus: 40 },
        { day: 7, target: 100, bonus: 60 },
      ],
      ai_prompts: {
        title_generation: 'Create a team collaboration challenge',
        description_generation: 'Emphasize teamwork and social fitness',
        creative_twist: 'Use team, squad, or crew themes',
      },
    },
    {
      id: 'weekly_social_mentor',
      category: 'social',
      difficulty: 'easy',
      title_pattern: '🎓 Mentore della Settimana',
      description_pattern: 'Aiuta {target} utenti diversi a migliorare',
      target_formula: 'Math.min(5, Math.max(3, Math.floor(user.level / 5)))',
      reward_formula: {
        xp: 'target * 50 + 100',
        coins: 'target * 20',
      },
      requirements: ['social', 'mentoring'],
      conditions: { min_level: 8 },
      variations: [],
      weekType: 'standard',
      minDaysRequired: 4,
      checkpoints: [
        { day: 3, target: 40, bonus: 25 },
        { day: 7, target: 100, bonus: 75 },
      ],
      specialRewards: [
        {
          type: 'title',
          value: 'Weekly Mentor',
          condition: 'help_5_users',
        },
      ],
      ai_prompts: {
        title_generation: 'Create a mentorship challenge',
        description_generation: 'Encourage helping and teaching others',
        creative_twist: 'Use teacher, guide, or sensei themes',
      },
    },
  ],

  // ====================================
  // STREAK CATEGORY - WEEKLY
  // ====================================
  streak: [
    {
      id: 'weekly_streak_perfect',
      category: 'streak',
      difficulty: 'medium',
      title_pattern: '🔥 Settimana Perfetta',
      description_pattern: 'Mantieni il tuo streak per tutti i 7 giorni',
      target_formula: '7',
      reward_formula: {
        xp: '200 + user.daily_streak * 10',
        coins: '50 + user.daily_streak * 2',
        streak_bonus: '50',
      },
      requirements: ['daily_activity'],
      conditions: {},
      variations: [],
      weekType: 'standard',
      minDaysRequired: 7,
      checkpoints: [
        { day: 3, target: 43, bonus: 25 },
        { day: 5, target: 71, bonus: 40 },
        { day: 7, target: 100, bonus: 100 },
      ],
      specialRewards: [
        {
          type: 'streak_shield',
          value: 1,
          condition: 'perfect_week',
        },
      ],
      ai_prompts: {
        title_generation: 'Create a perfect week streak challenge',
        description_generation: 'Motivate daily consistency for full week',
        creative_twist: 'Use perfection, flawless, or pristine themes',
      },
    },
    {
      id: 'weekly_streak_recovery',
      category: 'streak',
      difficulty: 'easy',
      title_pattern: '💪 Ritorno del Campione',
      description_pattern: 'Ricostruisci un streak di almeno {target} giorni',
      target_formula: 'Math.min(5, Math.max(3, Math.floor(user.max_daily_streak / 3)))',
      reward_formula: {
        xp: 'target * 40 + 50',
        coins: 'target * 10 + 15',
      },
      requirements: ['daily_activity'],
      conditions: {},
      variations: [],
      weekType: 'standard',
      minDaysRequired: 3,
      checkpoints: [
        { day: 3, target: 40, bonus: 20 },
        { day: 5, target: 70, bonus: 35 },
        { day: 7, target: 100, bonus: 50 },
      ],
      ai_prompts: {
        title_generation: 'Create a comeback streak challenge',
        description_generation: 'Motivate rebuilding lost streaks',
        creative_twist: 'Use phoenix, comeback, or resilience themes',
      },
    },
  ],

  // ====================================
  // PERFORMANCE CATEGORY - WEEKLY
  // ====================================
  performance: [
    {
      id: 'weekly_performance_progressive',
      category: 'performance',
      difficulty: 'hard',
      title_pattern: '📈 Progressione Settimanale',
      description_pattern: 'Migliora i tuoi record del {target}% entro la fine della settimana',
      target_formula: 'Math.min(10, Math.max(5, 15 - user.level))',
      reward_formula: {
        xp: '250 + user.level * 15',
        coins: '75 + user.level * 3',
      },
      requirements: ['performance_tracking'],
      conditions: { min_level: 5 },
      variations: [],
      weekType: 'challenge',
      minDaysRequired: 4,
      checkpoints: [
        { day: 2, target: 25, bonus: 30 },
        { day: 4, target: 50, bonus: 60 },
        { day: 7, target: 100, bonus: 120 },
      ],
      leaderboardEnabled: true,
      ai_prompts: {
        title_generation: 'Create a progressive improvement challenge',
        description_generation: 'Focus on gradual performance gains',
        creative_twist: 'Use growth, evolution, or ascension themes',
      },
    },
    {
      id: 'weekly_performance_consistency',
      category: 'performance',
      difficulty: 'medium',
      title_pattern: '🎯 Maestro della Forma',
      description_pattern: 'Mantieni un form score medio superiore a {target}%',
      target_formula: 'Math.max(80, 95 - user.level * 2)',
      reward_formula: {
        xp: '200',
        coins: '60',
      },
      requirements: ['form_tracking'],
      conditions: { min_level: 4 },
      variations: [],
      weekType: 'standard',
      minDaysRequired: 5,
      checkpoints: [
        { day: 3, target: 40, bonus: 25 },
        { day: 5, target: 70, bonus: 50 },
        { day: 7, target: 100, bonus: 75 },
      ],
      specialRewards: [
        {
          type: 'badge',
          value: 'form_master',
          condition: 'average_above_90',
        },
      ],
      ai_prompts: {
        title_generation: 'Create a form consistency challenge',
        description_generation: 'Emphasize quality over quantity',
        creative_twist: 'Use precision, mastery, or perfection themes',
      },
    },
    {
      id: 'weekly_performance_peak',
      category: 'performance',
      difficulty: 'extreme',
      title_pattern: '🚀 Settimana Peak Performance',
      description_pattern: 'Raggiungi il tuo massimo potenziale in {target} esercizi diversi',
      target_formula: 'Math.min(4, Math.max(2, Math.floor(user.level / 4)))',
      reward_formula: {
        xp: 'target * 100 + 200',
        coins: 'target * 30 + 50',
      },
      requirements: ['performance_tracking', 'multiple_exercises'],
      conditions: { min_level: 10 },
      variations: [],
      weekType: 'tournament',
      minDaysRequired: 5,
      checkpoints: [
        { day: 3, target: 35, bonus: 50 },
        { day: 5, target: 65, bonus: 100 },
        { day: 7, target: 100, bonus: 200 },
      ],
      leaderboardEnabled: true,
      specialRewards: [
        {
          type: 'title',
          value: 'Peak Performer',
          condition: 'all_targets_met',
        },
        {
          type: 'xp_multiplier',
          value: 2,
          condition: 'beat_all_records',
        },
      ],
      ai_prompts: {
        title_generation: 'Create a peak performance challenge',
        description_generation: 'Push users to their absolute limits',
        creative_twist: 'Use peak, summit, or apex themes',
      },
    },
  ],

  // ====================================
  // EXPLORATION CATEGORY - WEEKLY
  // ====================================
  exploration: [
    {
      id: 'weekly_exploration_discovery',
      category: 'exploration',
      difficulty: 'easy',
      title_pattern: '🗺️ Settimana dell\'Esploratore',
      description_pattern: 'Prova {target} nuove funzionalità o esercizi',
      target_formula: 'Math.min(7, Math.max(5, Math.floor(user.level / 2)))',
      reward_formula: {
        xp: 'target * 25 + 50',
        coins: 'target * 8 + 20',
      },
      requirements: ['exploration'],
      conditions: { max_level: 15 },
      variations: ['exercises', 'features', 'challenges', 'social'],
      weekType: 'standard',
      minDaysRequired: 4,
      checkpoints: [
        { day: 3, target: 40, bonus: 20 },
        { day: 5, target: 70, bonus: 35 },
        { day: 7, target: 100, bonus: 50 },
      ],
      ai_prompts: {
        title_generation: 'Create an exploration week challenge',
        description_generation: 'Encourage trying new things',
        creative_twist: 'Use explorer, adventurer, or pioneer themes',
      },
    },
    {
      id: 'weekly_exploration_achievement_hunter',
      category: 'exploration',
      difficulty: 'medium',
      title_pattern: '🏅 Cacciatore di Achievement',
      description_pattern: 'Sblocca {target} achievement questa settimana',
      target_formula: 'Math.min(5, Math.max(2, Math.floor(user.level / 5)))',
      reward_formula: {
        xp: 'target * 60 + 100',
        coins: 'target * 20 + 30',
      },
      requirements: ['achievements'],
      conditions: { min_level: 3 },
      variations: [],
      weekType: 'challenge',
      minDaysRequired: 4,
      checkpoints: [
        { day: 3, target: 30, bonus: 30 },
        { day: 5, target: 60, bonus: 60 },
        { day: 7, target: 100, bonus: 100 },
      ],
      specialRewards: [
        {
          type: 'badge',
          value: 'achievement_hunter',
          condition: 'unlock_5_achievements',
        },
      ],
      ai_prompts: {
        title_generation: 'Create an achievement hunting challenge',
        description_generation: 'Motivate collecting achievements',
        creative_twist: 'Use hunter, collector, or completionist themes',
      },
    },
  ],
}

// ====================================
// HELPER FUNCTIONS
// ====================================

export function getWeeklyMissionsByType(
  weekType: 'standard' | 'challenge' | 'marathon' | 'tournament'
): WeeklyMissionTemplate[] {
  const missions: WeeklyMissionTemplate[] = []
  
  Object.values(WEEKLY_MISSION_TEMPLATES).forEach(categoryMissions => {
    missions.push(...categoryMissions.filter(m => m.weekType === weekType))
  })
  
  return missions
}

export function getWeeklyMissionsWithLeaderboard(): WeeklyMissionTemplate[] {
  const missions: WeeklyMissionTemplate[] = []
  
  Object.values(WEEKLY_MISSION_TEMPLATES).forEach(categoryMissions => {
    missions.push(...categoryMissions.filter(m => m.leaderboardEnabled))
  })
  
  return missions
}

export function getWeeklyMissionsWithTeamOption(): WeeklyMissionTemplate[] {
  const missions: WeeklyMissionTemplate[] = []
  
  Object.values(WEEKLY_MISSION_TEMPLATES).forEach(categoryMissions => {
    missions.push(...categoryMissions.filter(m => m.teamOption))
  })
  
  return missions
}

export function calculateCheckpointProgress(
  template: WeeklyMissionTemplate,
  currentDay: number,
  currentProgress: number
): {
  nextCheckpoint: number | null
  bonusEarned: number
  percentComplete: number
} {
  const applicableCheckpoints = template.checkpoints.filter(cp => cp.day <= currentDay)
  const nextCheckpoint = template.checkpoints.find(cp => cp.day > currentDay)
  
  let bonusEarned = 0
  applicableCheckpoints.forEach(checkpoint => {
    if (currentProgress >= checkpoint.target) {
      bonusEarned += checkpoint.bonus || 0
    }
  })
  
  const percentComplete = Math.min(100, (currentProgress / 100) * 100)
  
  return {
    nextCheckpoint: nextCheckpoint?.day || null,
    bonusEarned,
    percentComplete,
  }
}

export function getSpecialRewardsEarned(
  template: WeeklyMissionTemplate,
  performance: any
): any[] {
  if (!template.specialRewards) return []
  
  const earned = []
  for (const reward of template.specialRewards) {
    // Check if condition is met based on performance
    switch (reward.condition) {
      case 'perfect_week':
        if (performance.daysCompleted === 7) earned.push(reward)
        break
      case 'all_seven_days':
        if (performance.daysActive === 7) earned.push(reward)
        break
      case 'complete_with_90_percent':
        if (performance.completionRate >= 90) earned.push(reward)
        break
      case 'average_above_90':
        if (performance.averageScore >= 90) earned.push(reward)
        break
      case 'all_targets_met':
        if (performance.targetsHit === template.checkpoints.length) earned.push(reward)
        break
      case 'beat_all_records':
        if (performance.recordsBroken >= template.target_formula) earned.push(reward)
        break
      case 'help_5_users':
        if (performance.usersHelped >= 5) earned.push(reward)
        break
      case 'unlock_5_achievements':
        if (performance.achievementsUnlocked >= 5) earned.push(reward)
        break
    }
  }
  
  return earned
}

// ====================================
// EXPORT DEFAULT
// ====================================

export default WEEKLY_MISSION_TEMPLATES