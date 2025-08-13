// ====================================
// PROGRESSIVE MISSION TEMPLATES
// Multi-step missions with sequential unlocking
// ====================================

import { MissionTemplate, MissionCategory, MissionDifficulty } from '../mission-generator'

// ====================================
// TYPES
// ====================================

export interface ProgressiveStep {
  id: string
  order: number
  title: string
  description: string
  requirements: {
    value: number
    unit: string
  }
  rewards: {
    xp: number
    coins: number
  }
  unlockCondition?: string
  timeLimit?: number // hours
}

export interface ProgressiveMissionTemplate extends Omit<MissionTemplate, 'category'> {
  steps: ProgressiveStep[]
  totalDuration: number // days
  bonusRewards?: {
    xp: number
    coins: number
    badge?: string
    title?: string
  }
  category: MissionCategory // Use existing categories
  missionType: 'progressive' // Identify as progressive
}

// ====================================
// PROGRESSIVE MISSION TEMPLATES
// ====================================

export const progressiveMissionTemplates: ProgressiveMissionTemplate[] = [
  // FITNESS JOURNEY MISSIONS
  {
    id: 'prog_fitness_journey_beginner',
    name: '🌟 Fitness Journey: Beginner',
    description: 'Start your fitness transformation with this 7-day progressive challenge',
    category: 'exercise', // Using existing category
    missionType: 'progressive',
    difficulty: 'easy',
    steps: [
      {
        id: 'step1',
        order: 1,
        title: 'First Steps',
        description: 'Complete 10 minutes of any exercise',
        requirements: { value: 10, unit: 'minutes' },
        rewards: { xp: 50, coins: 20 }
      },
      {
        id: 'step2',
        order: 2,
        title: 'Building Momentum',
        description: 'Complete 15 minutes of cardio',
        requirements: { value: 15, unit: 'minutes' },
        rewards: { xp: 75, coins: 30 },
        unlockCondition: 'Complete step 1'
      },
      {
        id: 'step3',
        order: 3,
        title: 'Strength Basics',
        description: 'Do 20 push-ups (can be modified)',
        requirements: { value: 20, unit: 'reps' },
        rewards: { xp: 100, coins: 40 },
        unlockCondition: 'Complete step 2'
      },
      {
        id: 'step4',
        order: 4,
        title: 'Core Power',
        description: 'Hold plank for 60 seconds total',
        requirements: { value: 60, unit: 'seconds' },
        rewards: { xp: 125, coins: 50 },
        unlockCondition: 'Complete step 3'
      },
      {
        id: 'step5',
        order: 5,
        title: 'Full Workout',
        description: 'Complete a 30-minute full body workout',
        requirements: { value: 30, unit: 'minutes' },
        rewards: { xp: 200, coins: 80 },
        unlockCondition: 'Complete step 4'
      }
    ],
    totalDuration: 7,
    bonusRewards: {
      xp: 500,
      coins: 200,
      badge: 'journey_starter',
      title: 'Journey Beginner'
    },
    tags: ['beginner', 'journey', 'progressive'],
    estimatedTime: 120,
    energyLevel: 'medium',
    quote: 'Every expert was once a beginner',
    tips: 'Take rest days between steps if needed'
  },

  {
    id: 'prog_strength_builder',
    name: '💪 Strength Builder Protocol',
    description: 'Progressive overload program to build real strength',
    category: 'performance', // Using existing category
    missionType: 'progressive',
    difficulty: 'medium',
    steps: [
      {
        id: 'step1',
        order: 1,
        title: 'Baseline Test',
        description: 'Test your max push-ups in 1 minute',
        requirements: { value: 1, unit: 'test' },
        rewards: { xp: 100, coins: 40 }
      },
      {
        id: 'step2',
        order: 2,
        title: 'Volume Phase',
        description: 'Do 50% of your max, 5 sets throughout the day',
        requirements: { value: 5, unit: 'sets' },
        rewards: { xp: 150, coins: 60 },
        unlockCondition: 'Complete baseline',
        timeLimit: 24
      },
      {
        id: 'step3',
        order: 3,
        title: 'Intensity Phase',
        description: 'Do 75% of your max, 3 sets',
        requirements: { value: 3, unit: 'sets' },
        rewards: { xp: 200, coins: 80 },
        unlockCondition: 'Complete volume phase',
        timeLimit: 24
      },
      {
        id: 'step4',
        order: 4,
        title: 'Power Phase',
        description: 'Do explosive push-ups, 3 sets of 5',
        requirements: { value: 15, unit: 'reps' },
        rewards: { xp: 250, coins: 100 },
        unlockCondition: 'Complete intensity phase'
      },
      {
        id: 'step5',
        order: 5,
        title: 'Retest',
        description: 'Test your new max push-ups in 1 minute',
        requirements: { value: 1, unit: 'test' },
        rewards: { xp: 300, coins: 120 },
        unlockCondition: 'Complete power phase'
      }
    ],
    totalDuration: 14,
    bonusRewards: {
      xp: 1000,
      coins: 500,
      badge: 'strength_builder',
      title: 'Iron Will'
    },
    tags: ['strength', 'progressive', 'overload'],
    estimatedTime: 180,
    energyLevel: 'high',
    quote: 'Strength doesn\'t come from what you can do, it comes from overcoming what you once couldn\'t',
    tips: 'Track your numbers to see real progress'
  },

  {
    id: 'prog_cardio_endurance',
    name: '🏃 Cardio Endurance Builder',
    description: 'Build your cardiovascular endurance step by step',
    category: 'exercise', // Using existing category
    missionType: 'progressive',
    difficulty: 'medium',
    steps: [
      {
        id: 'step1',
        order: 1,
        title: 'Walk-Jog Intervals',
        description: '5 rounds: 2 min walk, 1 min jog',
        requirements: { value: 15, unit: 'minutes' },
        rewards: { xp: 80, coins: 30 }
      },
      {
        id: 'step2',
        order: 2,
        title: 'Extended Jog',
        description: 'Jog continuously for 10 minutes',
        requirements: { value: 10, unit: 'minutes' },
        rewards: { xp: 120, coins: 50 },
        unlockCondition: 'Complete intervals'
      },
      {
        id: 'step3',
        order: 3,
        title: 'Speed Intervals',
        description: '5 rounds: 1 min fast, 2 min recovery',
        requirements: { value: 15, unit: 'minutes' },
        rewards: { xp: 160, coins: 70 },
        unlockCondition: 'Complete extended jog'
      },
      {
        id: 'step4',
        order: 4,
        title: 'Distance Challenge',
        description: 'Run/jog 3km without stopping',
        requirements: { value: 3, unit: 'km' },
        rewards: { xp: 220, coins: 90 },
        unlockCondition: 'Complete speed work'
      },
      {
        id: 'step5',
        order: 5,
        title: 'Time Trial',
        description: 'Complete 5km in under 35 minutes',
        requirements: { value: 5, unit: 'km' },
        rewards: { xp: 300, coins: 120 },
        unlockCondition: 'Complete distance challenge'
      }
    ],
    totalDuration: 21,
    bonusRewards: {
      xp: 800,
      coins: 400,
      badge: 'endurance_warrior',
      title: 'Marathon Mind'
    },
    tags: ['cardio', 'endurance', 'running'],
    estimatedTime: 240,
    energyLevel: 'high',
    quote: 'Endurance is not just the ability to bear a hard thing, but to turn it into glory',
    tips: 'Listen to your body and take rest days when needed'
  },

  {
    id: 'prog_flexibility_flow',
    name: '🧘 Flexibility Flow Journey',
    description: 'Unlock your body\'s full range of motion',
    category: 'exercise', // Using existing category
    missionType: 'progressive',
    difficulty: 'easy',
    steps: [
      {
        id: 'step1',
        order: 1,
        title: 'Morning Stretches',
        description: 'Complete 5 minutes of basic stretches',
        requirements: { value: 5, unit: 'minutes' },
        rewards: { xp: 40, coins: 15 }
      },
      {
        id: 'step2',
        order: 2,
        title: 'Touch Your Toes',
        description: 'Hold forward fold for 2 minutes total',
        requirements: { value: 120, unit: 'seconds' },
        rewards: { xp: 60, coins: 25 },
        unlockCondition: 'Complete morning routine'
      },
      {
        id: 'step3',
        order: 3,
        title: 'Hip Openers',
        description: 'Complete hip flexibility routine (10 min)',
        requirements: { value: 10, unit: 'minutes' },
        rewards: { xp: 80, coins: 35 },
        unlockCondition: 'Master forward fold'
      },
      {
        id: 'step4',
        order: 4,
        title: 'Full Body Flow',
        description: 'Complete 15-minute yoga flow',
        requirements: { value: 15, unit: 'minutes' },
        rewards: { xp: 120, coins: 50 },
        unlockCondition: 'Open those hips'
      },
      {
        id: 'step5',
        order: 5,
        title: 'Splits Progress',
        description: 'Hold splits position for 30 seconds each side',
        requirements: { value: 60, unit: 'seconds' },
        rewards: { xp: 200, coins: 80 },
        unlockCondition: 'Complete flow mastery'
      }
    ],
    totalDuration: 30,
    bonusRewards: {
      xp: 600,
      coins: 300,
      badge: 'flexibility_master',
      title: 'Bendy Warrior'
    },
    tags: ['flexibility', 'yoga', 'mobility'],
    estimatedTime: 150,
    energyLevel: 'low',
    quote: 'Flexibility is the key to stability',
    tips: 'Never force a stretch, progress comes with consistency'
  },

  {
    id: 'prog_weight_loss_kickstart',
    name: '🔥 Weight Loss Kickstart',
    description: '30-day progressive fat burning program',
    category: 'performance', // Using existing category
    missionType: 'progressive',
    difficulty: 'medium',
    steps: [
      {
        id: 'step1',
        order: 1,
        title: 'Calorie Burn Basics',
        description: 'Burn 200 calories through exercise',
        requirements: { value: 200, unit: 'calories' },
        rewards: { xp: 100, coins: 40 }
      },
      {
        id: 'step2',
        order: 2,
        title: 'HIIT Introduction',
        description: 'Complete 15-minute HIIT workout',
        requirements: { value: 15, unit: 'minutes' },
        rewards: { xp: 150, coins: 60 },
        unlockCondition: 'Start burning'
      },
      {
        id: 'step3',
        order: 3,
        title: 'Daily Burn',
        description: 'Burn 300+ calories for 5 consecutive days',
        requirements: { value: 5, unit: 'days' },
        rewards: { xp: 250, coins: 100 },
        unlockCondition: 'Master HIIT'
      },
      {
        id: 'step4',
        order: 4,
        title: 'Metabolic Boost',
        description: 'Morning workout + evening walk combo (3 days)',
        requirements: { value: 3, unit: 'days' },
        rewards: { xp: 300, coins: 120 },
        unlockCondition: 'Consistent burn'
      },
      {
        id: 'step5',
        order: 5,
        title: 'Final Push',
        description: 'Burn 500 calories in single session',
        requirements: { value: 500, unit: 'calories' },
        rewards: { xp: 400, coins: 160 },
        unlockCondition: 'Boost metabolism'
      }
    ],
    totalDuration: 30,
    bonusRewards: {
      xp: 1200,
      coins: 600,
      badge: 'fat_burner',
      title: 'Calorie Crusher'
    },
    tags: ['weight_loss', 'hiit', 'cardio'],
    estimatedTime: 300,
    energyLevel: 'high',
    quote: 'The only bad workout is the one that didn\'t happen',
    tips: 'Combine with proper nutrition for best results'
  },

  {
    id: 'prog_muscle_mass_builder',
    name: '💯 Muscle Mass Protocol',
    description: 'Progressive muscle building program',
    category: 'performance', // Using existing category
    missionType: 'progressive',
    difficulty: 'hard',
    steps: [
      {
        id: 'step1',
        order: 1,
        title: 'Foundation Week',
        description: 'Complete 3 full-body workouts',
        requirements: { value: 3, unit: 'workouts' },
        rewards: { xp: 150, coins: 60 }
      },
      {
        id: 'step2',
        order: 2,
        title: 'Volume Increase',
        description: 'Complete 100 total reps of compound exercises',
        requirements: { value: 100, unit: 'reps' },
        rewards: { xp: 200, coins: 80 },
        unlockCondition: 'Build foundation'
      },
      {
        id: 'step3',
        order: 3,
        title: 'Progressive Overload',
        description: 'Increase weights by 10% and complete workout',
        requirements: { value: 1, unit: 'workout' },
        rewards: { xp: 250, coins: 100 },
        unlockCondition: 'Volume phase complete'
      },
      {
        id: 'step4',
        order: 4,
        title: 'Hypertrophy Focus',
        description: 'Complete 4 workouts with 8-12 rep range',
        requirements: { value: 4, unit: 'workouts' },
        rewards: { xp: 350, coins: 140 },
        unlockCondition: 'Overload achieved'
      },
      {
        id: 'step5',
        order: 5,
        title: 'Peak Week',
        description: 'Complete 5 intense workouts in 7 days',
        requirements: { value: 5, unit: 'workouts' },
        rewards: { xp: 500, coins: 200 },
        unlockCondition: 'Hypertrophy phase done'
      }
    ],
    totalDuration: 28,
    bonusRewards: {
      xp: 1500,
      coins: 750,
      badge: 'mass_monster',
      title: 'Gains Machine'
    },
    tags: ['muscle', 'strength', 'hypertrophy'],
    estimatedTime: 360,
    energyLevel: 'very_high',
    quote: 'Muscle is built in the kitchen, sculpted in the gym',
    tips: 'Rest and nutrition are as important as training'
  },

  {
    id: 'prog_morning_warrior',
    name: '🌅 Morning Warrior Challenge',
    description: 'Build an unbreakable morning routine',
    category: 'streak', // Using existing category
    missionType: 'progressive',
    difficulty: 'medium',
    steps: [
      {
        id: 'step1',
        order: 1,
        title: 'Early Bird',
        description: 'Wake up before 7 AM and exercise for 10 min',
        requirements: { value: 10, unit: 'minutes' },
        rewards: { xp: 80, coins: 30 },
        timeLimit: 8
      },
      {
        id: 'step2',
        order: 2,
        title: 'Sunrise Session',
        description: 'Complete workout before 6:30 AM',
        requirements: { value: 20, unit: 'minutes' },
        rewards: { xp: 120, coins: 50 },
        unlockCondition: 'Early bird caught',
        timeLimit: 7
      },
      {
        id: 'step3',
        order: 3,
        title: 'Dawn Patrol',
        description: '5 consecutive days of 6 AM workouts',
        requirements: { value: 5, unit: 'days' },
        rewards: { xp: 200, coins: 80 },
        unlockCondition: 'Sunrise warrior'
      },
      {
        id: 'step4',
        order: 4,
        title: '5AM Club',
        description: 'Complete full workout starting at 5 AM',
        requirements: { value: 30, unit: 'minutes' },
        rewards: { xp: 300, coins: 120 },
        unlockCondition: 'Dawn patrol complete',
        timeLimit: 6
      },
      {
        id: 'step5',
        order: 5,
        title: 'Morning Master',
        description: '21 days of morning workouts before 7 AM',
        requirements: { value: 21, unit: 'days' },
        rewards: { xp: 500, coins: 200 },
        unlockCondition: 'Join 5AM club'
      }
    ],
    totalDuration: 30,
    bonusRewards: {
      xp: 1000,
      coins: 500,
      badge: 'morning_warrior',
      title: 'Dawn Destroyer'
    },
    tags: ['morning', 'routine', 'discipline'],
    estimatedTime: 200,
    energyLevel: 'medium',
    quote: 'Win the morning, win the day',
    tips: 'Prepare everything the night before'
  },

  {
    id: 'prog_nutrition_master',
    name: '🥗 Nutrition Mastery Path',
    description: 'Build healthy eating habits progressively',
    category: 'exercise', // Using existing category (nutrition is part of fitness)
    missionType: 'progressive',
    difficulty: 'easy',
    steps: [
      {
        id: 'step1',
        order: 1,
        title: 'Hydration Hero',
        description: 'Drink 2L of water daily for 3 days',
        requirements: { value: 3, unit: 'days' },
        rewards: { xp: 60, coins: 25 }
      },
      {
        id: 'step2',
        order: 2,
        title: 'Veggie Victory',
        description: 'Eat 5 servings of vegetables for 5 days',
        requirements: { value: 5, unit: 'days' },
        rewards: { xp: 100, coins: 40 },
        unlockCondition: 'Hydration achieved'
      },
      {
        id: 'step3',
        order: 3,
        title: 'Protein Power',
        description: 'Hit protein target for 7 consecutive days',
        requirements: { value: 7, unit: 'days' },
        rewards: { xp: 150, coins: 60 },
        unlockCondition: 'Veggie lover'
      },
      {
        id: 'step4',
        order: 4,
        title: 'Clean Eating',
        description: 'No processed foods for 10 days',
        requirements: { value: 10, unit: 'days' },
        rewards: { xp: 250, coins: 100 },
        unlockCondition: 'Protein master'
      },
      {
        id: 'step5',
        order: 5,
        title: 'Nutrition Ninja',
        description: 'Perfect nutrition for 14 consecutive days',
        requirements: { value: 14, unit: 'days' },
        rewards: { xp: 400, coins: 160 },
        unlockCondition: 'Clean eating champion'
      }
    ],
    totalDuration: 42,
    bonusRewards: {
      xp: 800,
      coins: 400,
      badge: 'nutrition_master',
      title: 'Food Philosopher'
    },
    tags: ['nutrition', 'diet', 'healthy_eating'],
    estimatedTime: 100,
    energyLevel: 'low',
    quote: 'You are what you eat, so don\'t be fast, cheap, easy, or fake',
    tips: 'Meal prep is your best friend'
  },

  {
    id: 'prog_recovery_protocol',
    name: '🧊 Recovery & Restoration',
    description: 'Master the art of recovery for better performance',
    category: 'exercise', // Using existing category
    missionType: 'progressive',
    difficulty: 'easy',
    steps: [
      {
        id: 'step1',
        order: 1,
        title: 'Stretch It Out',
        description: '10 minutes post-workout stretching',
        requirements: { value: 10, unit: 'minutes' },
        rewards: { xp: 40, coins: 15 }
      },
      {
        id: 'step2',
        order: 2,
        title: 'Foam Roll Focus',
        description: 'Complete foam rolling routine for 3 days',
        requirements: { value: 3, unit: 'days' },
        rewards: { xp: 70, coins: 30 },
        unlockCondition: 'Stretching done'
      },
      {
        id: 'step3',
        order: 3,
        title: 'Cold Therapy',
        description: 'Take 5 cold showers post-workout',
        requirements: { value: 5, unit: 'showers' },
        rewards: { xp: 100, coins: 40 },
        unlockCondition: 'Foam rolling mastered'
      },
      {
        id: 'step4',
        order: 4,
        title: 'Sleep Optimization',
        description: 'Get 8+ hours sleep for 7 nights',
        requirements: { value: 7, unit: 'nights' },
        rewards: { xp: 150, coins: 60 },
        unlockCondition: 'Cold therapy complete'
      },
      {
        id: 'step5',
        order: 5,
        title: 'Full Recovery Week',
        description: 'Complete all recovery protocols for 7 days',
        requirements: { value: 7, unit: 'days' },
        rewards: { xp: 200, coins: 80 },
        unlockCondition: 'Sleep optimized'
      }
    ],
    totalDuration: 28,
    bonusRewards: {
      xp: 600,
      coins: 300,
      badge: 'recovery_expert',
      title: 'Restoration Master'
    },
    tags: ['recovery', 'rest', 'restoration'],
    estimatedTime: 120,
    energyLevel: 'very_low',
    quote: 'Recovery is when the magic happens',
    tips: 'Listen to your body\'s signals'
  },

  {
    id: 'prog_mental_toughness',
    name: '🧠 Mental Toughness Builder',
    description: 'Forge an unbreakable mindset through progressive challenges',
    category: 'performance', // Using existing category
    missionType: 'progressive',
    difficulty: 'hard',
    steps: [
      {
        id: 'step1',
        order: 1,
        title: 'Comfort Zone Exit',
        description: 'Do one uncomfortable workout (cold, rain, early)',
        requirements: { value: 1, unit: 'workout' },
        rewards: { xp: 100, coins: 40 }
      },
      {
        id: 'step2',
        order: 2,
        title: 'Push Past Limits',
        description: 'Continue workout 5 min after wanting to quit',
        requirements: { value: 5, unit: 'minutes' },
        rewards: { xp: 150, coins: 60 },
        unlockCondition: 'Left comfort zone'
      },
      {
        id: 'step3',
        order: 3,
        title: 'No Excuses Week',
        description: 'Workout every day regardless of conditions',
        requirements: { value: 7, unit: 'days' },
        rewards: { xp: 250, coins: 100 },
        unlockCondition: 'Pushed limits'
      },
      {
        id: 'step4',
        order: 4,
        title: 'The Grind',
        description: 'Complete 100 burpees in one session',
        requirements: { value: 100, unit: 'burpees' },
        rewards: { xp: 350, coins: 140 },
        unlockCondition: 'No excuses made'
      },
      {
        id: 'step5',
        order: 5,
        title: 'Spartan Mind',
        description: '30 days of never missing a planned workout',
        requirements: { value: 30, unit: 'days' },
        rewards: { xp: 500, coins: 200 },
        unlockCondition: 'Survived the grind'
      }
    ],
    totalDuration: 45,
    bonusRewards: {
      xp: 1500,
      coins: 750,
      badge: 'iron_mind',
      title: 'Mental Warrior'
    },
    tags: ['mental', 'discipline', 'mindset'],
    estimatedTime: 300,
    energyLevel: 'very_high',
    quote: 'The mind gives up before the body',
    tips: 'Embrace the suck, it makes you stronger'
  }
]

// ====================================
// HELPER FUNCTIONS
// ====================================

export class ProgressiveMissionManager {
  /**
   * Get a progressive mission template by ID
   */
  static getTemplate(templateId: string): ProgressiveMissionTemplate | undefined {
    return progressiveMissionTemplates.find(t => t.id === templateId)
  }

  /**
   * Get templates by difficulty
   */
  static getByDifficulty(difficulty: MissionDifficulty): ProgressiveMissionTemplate[] {
    return progressiveMissionTemplates.filter(t => t.difficulty === difficulty)
  }

  /**
   * Get templates by duration range
   */
  static getByDuration(minDays: number, maxDays: number): ProgressiveMissionTemplate[] {
    return progressiveMissionTemplates.filter(
      t => t.totalDuration >= minDays && t.totalDuration <= maxDays
    )
  }

  /**
   * Get templates suitable for user level
   */
  static getForUserLevel(userLevel: number): ProgressiveMissionTemplate[] {
    if (userLevel < 10) {
      return this.getByDifficulty('easy')
    } else if (userLevel < 25) {
      return this.getByDifficulty('medium')
    } else {
      return [...this.getByDifficulty('medium'), ...this.getByDifficulty('hard')]
    }
  }

  /**
   * Calculate total rewards for a progressive mission
   */
  static calculateTotalRewards(template: ProgressiveMissionTemplate): {
    totalXP: number
    totalCoins: number
  } {
    const stepRewards = template.steps.reduce(
      (acc, step) => ({
        xp: acc.xp + step.rewards.xp,
        coins: acc.coins + step.rewards.coins
      }),
      { xp: 0, coins: 0 }
    )

    return {
      totalXP: stepRewards.xp + (template.bonusRewards?.xp || 0),
      totalCoins: stepRewards.coins + (template.bonusRewards?.coins || 0)
    }
  }

  /**
   * Get next unlocked step for a user
   */
  static getNextStep(
    template: ProgressiveMissionTemplate,
    completedSteps: string[]
  ): ProgressiveStep | null {
    return template.steps.find(step => !completedSteps.includes(step.id)) || null
  }

  /**
   * Check if user can start a progressive mission
   */
  static canStartMission(
    template: ProgressiveMissionTemplate,
    userLevel: number,
    activeProgressiveMissions: number
  ): { canStart: boolean; reason?: string } {
    // Check user level requirements
    const minLevel = template.difficulty === 'easy' ? 1 : template.difficulty === 'medium' ? 10 : 20
    if (userLevel < minLevel) {
      return { canStart: false, reason: `Need level ${minLevel} to start this mission` }
    }

    // Check active mission limit (max 2 progressive missions at once)
    if (activeProgressiveMissions >= 2) {
      return { canStart: false, reason: 'Maximum 2 progressive missions active at once' }
    }

    return { canStart: true }
  }

  /**
   * Generate mission from template for a specific user
   */
  static generateUserMission(
    template: ProgressiveMissionTemplate,
    userId: string,
    userLevel: number
  ): any {
    const rewards = this.calculateTotalRewards(template)
    
    // Apply level-based multipliers
    const levelMultiplier = 1 + (userLevel * 0.02) // 2% bonus per level
    
    return {
      user_id: userId,
      template_id: template.id,
      type: 'progressive',
      title: template.name,
      description: template.description,
      category: template.category,
      difficulty: template.difficulty,
      current_step: 0,
      total_steps: template.steps.length,
      steps_data: template.steps,
      completed_steps: [],
      progress_percentage: 0,
      total_xp_reward: Math.floor(rewards.totalXP * levelMultiplier),
      total_coins_reward: Math.floor(rewards.totalCoins * levelMultiplier),
      bonus_rewards: template.bonusRewards,
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + template.totalDuration * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      tags: template.tags,
      metadata: {
        estimated_time: template.estimatedTime,
        energy_level: template.energyLevel,
        quote: template.quote,
        tips: template.tips,
        total_duration_days: template.totalDuration,
        is_progressive: true // Flag to identify progressive missions
      }
    }
  }

  /**
   * Update mission progress when a step is completed
   */
  static updateProgress(
    mission: any,
    completedStepId: string
  ): {
    updated: boolean
    nextStep: ProgressiveStep | null
    isComplete: boolean
    unlockedRewards?: any
  } {
    const template = this.getTemplate(mission.template_id)
    if (!template) {
      return { updated: false, nextStep: null, isComplete: false }
    }

    const step = template.steps.find(s => s.id === completedStepId)
    if (!step || mission.completed_steps.includes(completedStepId)) {
      return { updated: false, nextStep: null, isComplete: false }
    }

    // Update completed steps
    mission.completed_steps.push(completedStepId)
    mission.current_step = step.order
    mission.progress_percentage = Math.floor(
      (mission.completed_steps.length / template.steps.length) * 100
    )

    // Check if mission is complete
    const isComplete = mission.completed_steps.length === template.steps.length
    
    // Get next step
    const nextStep = this.getNextStep(template, mission.completed_steps)

    // Prepare rewards
    const unlockedRewards = {
      immediate: step.rewards,
      bonus: isComplete ? template.bonusRewards : null
    }

    return {
      updated: true,
      nextStep,
      isComplete,
      unlockedRewards
    }
  }

  /**
   * Get recommended progressive missions for user
   */
  static getRecommendations(
    userLevel: number,
    userPreferences: {
      preferred_categories?: string[]
      preferred_difficulty?: MissionDifficulty
      available_time?: number // minutes per day
    },
    completedMissionIds: string[] = []
  ): ProgressiveMissionTemplate[] {
    let recommendations = progressiveMissionTemplates.filter(
      t => !completedMissionIds.includes(t.id)
    )

    // Filter by user level
    recommendations = this.getForUserLevel(userLevel).filter(
      t => recommendations.includes(t)
    )

    // Filter by preferences
    if (userPreferences.preferred_difficulty) {
      recommendations = recommendations.filter(
        t => t.difficulty === userPreferences.preferred_difficulty
      )
    }

    if (userPreferences.available_time) {
      recommendations = recommendations.filter(
        t => t.estimatedTime <= userPreferences.available_time
      )
    }

    // Sort by relevance (could be enhanced with ML)
    return recommendations.slice(0, 5)
  }

  /**
   * Get templates by category
   */
  static getByCategory(category: MissionCategory): ProgressiveMissionTemplate[] {
    return progressiveMissionTemplates.filter(t => t.category === category)
  }

  /**
   * Check if a mission is progressive
   */
  static isProgressiveMission(mission: any): boolean {
    return mission.type === 'progressive' || 
           mission.metadata?.is_progressive === true ||
           mission.steps_data !== undefined
  }
}

// ====================================
// EXPORT ALL
// ====================================

export default {
  templates: progressiveMissionTemplates,
  manager: ProgressiveMissionManager
}