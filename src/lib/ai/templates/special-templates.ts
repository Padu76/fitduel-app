// ====================================
// SPECIAL EVENT MISSION TEMPLATES
// Templates for holidays, events, and special occasions
// ====================================

import { MissionTemplate, MissionCategory, MissionDifficulty } from '../mission-generator'

// ====================================
// TYPES
// ====================================

export interface SpecialEventTemplate extends MissionTemplate {
  eventType: 'holiday' | 'seasonal' | 'milestone' | 'community' | 'challenge' | 'limited'
  eventName: string
  startDate?: string // ISO date or recurring pattern
  endDate?: string
  recurring?: {
    type: 'yearly' | 'monthly' | 'weekly'
    pattern: string // e.g., "12-25" for Christmas, "last-sunday" for monthly
  }
  theme: {
    colors: string[]
    emojis: string[]
    backgroundImage?: string
    musicTrack?: string
  }
  specialMechanics?: {
    type: string
    description: string
    rules: any
  }[]
  exclusiveRewards: {
    type: 'badge' | 'title' | 'skin' | 'effect' | 'currency'
    id: string
    name: string
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
    permanent: boolean
  }[]
}

// ====================================
// SPECIAL EVENT TEMPLATES
// ====================================

export const SPECIAL_EVENT_TEMPLATES: Record<string, SpecialEventTemplate[]> = {
  // ====================================
  // HOLIDAY EVENTS
  // ====================================
  holiday: [
    {
      id: 'special_christmas',
      category: 'exercise',
      difficulty: 'medium',
      eventType: 'holiday',
      eventName: 'Christmas Fitness Festival',
      title_pattern: '🎄 Regalo di Natale: {target} Ripetizioni',
      description_pattern: 'Regala al tuo corpo {target} ripetizioni perfette! Ho ho ho!',
      target_formula: '25 * Math.ceil(user.level / 5)', // 25 for Christmas
      reward_formula: {
        xp: 'target * 2 + 250',
        coins: 'target + 100',
      },
      requirements: ['exercise'],
      conditions: {},
      variations: ['push-ups', 'squats', 'burpees'],
      recurring: {
        type: 'yearly',
        pattern: '12-25',
      },
      theme: {
        colors: ['#c41e3a', '#165b33', '#ffd700'],
        emojis: ['🎄', '🎅', '🎁', '⛄', '❄️'],
      },
      exclusiveRewards: [
        {
          type: 'badge',
          id: 'christmas_2024',
          name: 'Babbo Natale Fit',
          rarity: 'epic',
          permanent: true,
        },
        {
          type: 'title',
          id: 'holiday_hero',
          name: 'Eroe delle Feste',
          rarity: 'rare',
          permanent: false,
        },
      ],
      ai_prompts: {
        title_generation: 'Create a Christmas-themed fitness challenge',
        description_generation: 'Use holiday cheer and gift-giving metaphors',
        creative_twist: 'Include Santa, reindeer, or winter wonderland themes',
      },
    },
    {
      id: 'special_halloween',
      category: 'duels',
      difficulty: 'hard',
      eventType: 'holiday',
      eventName: 'Halloween Horror Workout',
      title_pattern: '🎃 Terrore in Palestra: Vinci {target} Duelli',
      description_pattern: 'Spaventa i tuoi avversari con {target} vittorie mostruose!',
      target_formula: '13', // Spooky number
      reward_formula: {
        xp: '666', // Spooky number
        coins: '131',
      },
      requirements: ['duels'],
      conditions: { min_level: 3 },
      variations: [],
      recurring: {
        type: 'yearly',
        pattern: '10-31',
      },
      theme: {
        colors: ['#ff6b35', '#1a1a1a', '#8b00ff'],
        emojis: ['🎃', '👻', '🦇', '💀', '🕷️'],
      },
      specialMechanics: [
        {
          type: 'zombie_mode',
          description: 'Le ripetizioni extra dopo il fallimento contano doppio',
          rules: { multiplier: 2, after_failure: true },
        },
      ],
      exclusiveRewards: [
        {
          type: 'badge',
          id: 'halloween_survivor',
          name: 'Sopravvissuto di Halloween',
          rarity: 'legendary',
          permanent: true,
        },
        {
          type: 'effect',
          id: 'spooky_aura',
          name: 'Aura Spettrale',
          rarity: 'epic',
          permanent: false,
        },
      ],
      ai_prompts: {
        title_generation: 'Create a spooky Halloween fitness challenge',
        description_generation: 'Use horror and scary themes playfully',
        creative_twist: 'Include zombies, ghosts, or monster themes',
      },
    },
    {
      id: 'special_new_year',
      category: 'streak',
      difficulty: 'easy',
      eventType: 'holiday',
      eventName: 'New Year Revolution',
      title_pattern: '🎊 Risoluzione {target}: Nuovo Anno, Nuovo Te',
      description_pattern: 'Inizia l\'anno con {target} giorni consecutivi di attività!',
      target_formula: '7', // First week of the year
      reward_formula: {
        xp: '2025', // Year reference
        coins: '200',
        streak_bonus: '100',
      },
      requirements: ['daily_activity'],
      conditions: {},
      variations: [],
      recurring: {
        type: 'yearly',
        pattern: '01-01',
      },
      theme: {
        colors: ['#ffd700', '#c0c0c0', '#ff6b9d'],
        emojis: ['🎊', '🎉', '🥳', '✨', '🎆'],
      },
      exclusiveRewards: [
        {
          type: 'title',
          id: 'resolution_keeper',
          name: 'Keeper of Resolutions',
          rarity: 'rare',
          permanent: true,
        },
      ],
      ai_prompts: {
        title_generation: 'Create a New Year resolution challenge',
        description_generation: 'Focus on fresh starts and new beginnings',
        creative_twist: 'Use transformation and renewal themes',
      },
    },
    {
      id: 'special_valentine',
      category: 'social',
      difficulty: 'easy',
      eventType: 'holiday',
      eventName: 'Valentine\'s Fitness Love',
      title_pattern: '❤️ Amore per il Fitness: {target} Sfide con Amici',
      description_pattern: 'Condividi l\'amore del fitness con {target} sfide sociali!',
      target_formula: '14', // February 14th
      reward_formula: {
        xp: 'target * 14 + 140',
        coins: 'target * 7 + 70',
      },
      requirements: ['social', 'friends'],
      conditions: { requires_friends: true },
      variations: [],
      recurring: {
        type: 'yearly',
        pattern: '02-14',
      },
      theme: {
        colors: ['#ff1744', '#ff69b4', '#fff'],
        emojis: ['❤️', '💕', '💖', '💝', '🌹'],
      },
      specialMechanics: [
        {
          type: 'couple_bonus',
          description: 'Bonus doppio se completi con lo stesso partner',
          rules: { same_partner_multiplier: 2 },
        },
      ],
      exclusiveRewards: [
        {
          type: 'badge',
          id: 'love_warrior',
          name: 'Guerriero dell\'Amore',
          rarity: 'rare',
          permanent: true,
        },
      ],
      ai_prompts: {
        title_generation: 'Create a Valentine\'s Day fitness challenge',
        description_generation: 'Use love and partnership themes',
        creative_twist: 'Include hearts, couples, or romance metaphors',
      },
    },
  ],

  // ====================================
  // SEASONAL EVENTS
  // ====================================
  seasonal: [
    {
      id: 'special_summer_beach',
      category: 'exercise',
      difficulty: 'medium',
      eventType: 'seasonal',
      eventName: 'Summer Beach Body Challenge',
      title_pattern: '☀️ Beach Ready: {target} Minuti sotto il Sole',
      description_pattern: 'Preparati per l\'estate con {target} minuti di allenamento intenso!',
      target_formula: 'Math.max(30, user.level * 5)',
      reward_formula: {
        xp: 'target * 3 + 150',
        coins: 'target + 50',
      },
      requirements: ['exercise', 'cardio'],
      conditions: {},
      variations: ['beach_run', 'swimming', 'volleyball'],
      startDate: '06-21', // Summer solstice
      endDate: '09-22', // Fall equinox
      theme: {
        colors: ['#f39c12', '#3498db', '#e74c3c'],
        emojis: ['☀️', '🏖️', '🌊', '🏄', '👙'],
      },
      exclusiveRewards: [
        {
          type: 'skin',
          id: 'beach_avatar',
          name: 'Beach Warrior',
          rarity: 'epic',
          permanent: false,
        },
      ],
      ai_prompts: {
        title_generation: 'Create a summer beach fitness challenge',
        description_generation: 'Use beach, sun, and vacation themes',
        creative_twist: 'Include surfing, swimming, or beach sports',
      },
    },
    {
      id: 'special_spring_renewal',
      category: 'performance',
      difficulty: 'easy',
      eventType: 'seasonal',
      eventName: 'Spring Renewal Challenge',
      title_pattern: '🌸 Rinascita Primaverile: Migliora del {target}%',
      description_pattern: 'Come la natura si rinnova, migliora le tue performance del {target}%!',
      target_formula: 'Math.min(15, 5 + user.level)',
      reward_formula: {
        xp: '200 + user.level * 10',
        coins: '80',
      },
      requirements: ['performance_tracking'],
      conditions: {},
      variations: [],
      startDate: '03-20', // Spring equinox
      endDate: '06-20',
      theme: {
        colors: ['#2ecc71', '#f1c40f', '#e91e63'],
        emojis: ['🌸', '🌺', '🌻', '🦋', '🌱'],
      },
      exclusiveRewards: [
        {
          type: 'badge',
          id: 'spring_blossom',
          name: 'Fiore di Primavera',
          rarity: 'rare',
          permanent: true,
        },
      ],
      ai_prompts: {
        title_generation: 'Create a spring renewal fitness challenge',
        description_generation: 'Use growth, renewal, and blooming themes',
        creative_twist: 'Include nature, flowers, or rebirth metaphors',
      },
    },
    {
      id: 'special_autumn_harvest',
      category: 'exercise',
      difficulty: 'medium',
      eventType: 'seasonal',
      eventName: 'Autumn Harvest Challenge',
      title_pattern: '🍂 Raccolto Autunnale: Accumula {target} Ripetizioni',
      description_pattern: 'Raccogli {target} ripetizioni come foglie d\'autunno!',
      target_formula: 'Math.max(100, user.level * 15)',
      reward_formula: {
        xp: 'Math.floor(target * 1.5) + 100',
        coins: 'Math.floor(target / 2) + 40',
      },
      requirements: ['exercise'],
      conditions: {},
      variations: ['mixed'],
      startDate: '09-23', // Fall equinox
      endDate: '12-20',
      theme: {
        colors: ['#d35400', '#f39c12', '#8b4513'],
        emojis: ['🍂', '🍁', '🎃', '🌰', '🍄'],
      },
      exclusiveRewards: [
        {
          type: 'title',
          id: 'harvest_champion',
          name: 'Campione del Raccolto',
          rarity: 'rare',
          permanent: false,
        },
      ],
      ai_prompts: {
        title_generation: 'Create an autumn harvest fitness challenge',
        description_generation: 'Use harvest, gathering, and preparation themes',
        creative_twist: 'Include fall colors, leaves, or harvest metaphors',
      },
    },
    {
      id: 'special_winter_warrior',
      category: 'duels',
      difficulty: 'hard',
      eventType: 'seasonal',
      eventName: 'Winter Warrior Challenge',
      title_pattern: '❄️ Guerriero d\'Inverno: Sopravvivi a {target} Duelli',
      description_pattern: 'Affronta il freddo dell\'inverno con {target} duelli ghiacciati!',
      target_formula: 'Math.max(10, Math.floor(user.level * 1.5))',
      reward_formula: {
        xp: 'target * 30 + 200',
        coins: 'target * 10 + 60',
      },
      requirements: ['duels'],
      conditions: { min_level: 5 },
      variations: [],
      startDate: '12-21', // Winter solstice
      endDate: '03-19',
      theme: {
        colors: ['#3498db', '#ecf0f1', '#95a5a6'],
        emojis: ['❄️', '⛄', '🏔️', '🧊', '🎿'],
      },
      specialMechanics: [
        {
          type: 'ice_mode',
          description: 'I duelli completati al freddo valgono doppio',
          rules: { cold_weather_multiplier: 2 },
        },
      ],
      exclusiveRewards: [
        {
          type: 'effect',
          id: 'frost_aura',
          name: 'Aura Ghiacciata',
          rarity: 'epic',
          permanent: false,
        },
      ],
      ai_prompts: {
        title_generation: 'Create a winter warrior fitness challenge',
        description_generation: 'Use cold, ice, and endurance themes',
        creative_twist: 'Include snow, ice, or winter sports metaphors',
      },
    },
  ],

  // ====================================
  // MILESTONE EVENTS
  // ====================================
  milestone: [
    {
      id: 'special_level_10',
      category: 'performance',
      difficulty: 'medium',
      eventType: 'milestone',
      eventName: 'Level 10 Celebration',
      title_pattern: '🏆 Doppia Cifra: Celebra con {target} Personal Best',
      description_pattern: 'Hai raggiunto il livello 10! Festeggia battendo {target} record personali!',
      target_formula: '3',
      reward_formula: {
        xp: '500',
        coins: '200',
      },
      requirements: ['performance_tracking'],
      conditions: { min_level: 10, max_level: 10 },
      variations: [],
      theme: {
        colors: ['#ffd700', '#ff6b35', '#8e44ad'],
        emojis: ['🏆', '🎖️', '⭐', '🌟', '✨'],
      },
      exclusiveRewards: [
        {
          type: 'badge',
          id: 'level_10_elite',
          name: 'Elite Decimale',
          rarity: 'epic',
          permanent: true,
        },
      ],
      ai_prompts: {
        title_generation: 'Create a level milestone celebration',
        description_generation: 'Celebrate achievement and progress',
        creative_twist: 'Use celebration and achievement themes',
      },
    },
    {
      id: 'special_100_duels',
      category: 'duels',
      difficulty: 'easy',
      eventType: 'milestone',
      eventName: 'Centurion Challenge',
      title_pattern: '⚔️ Centurione: Il Tuo 100° Duello',
      description_pattern: 'Stai per combattere il tuo 100° duello! Rendilo memorabile!',
      target_formula: '1',
      reward_formula: {
        xp: '300',
        coins: '100',
      },
      requirements: ['duels'],
      conditions: {},
      variations: [],
      theme: {
        colors: ['#c0392b', '#7f8c8d', '#f39c12'],
        emojis: ['⚔️', '🛡️', '🏛️', '💯', '🎯'],
      },
      specialMechanics: [
        {
          type: 'centurion_bonus',
          description: 'Bonus speciale per il 100° duello',
          rules: { milestone_multiplier: 3 },
        },
      ],
      exclusiveRewards: [
        {
          type: 'title',
          id: 'centurion',
          name: 'Centurione',
          rarity: 'legendary',
          permanent: true,
        },
      ],
      ai_prompts: {
        title_generation: 'Create a 100-duel milestone challenge',
        description_generation: 'Celebrate reaching 100 duels',
        creative_twist: 'Use Roman centurion or warrior themes',
      },
    },
    {
      id: 'special_365_streak',
      category: 'streak',
      difficulty: 'extreme',
      eventType: 'milestone',
      eventName: 'Year of Dedication',
      title_pattern: '🔥 Anno di Fuoco: 365 Giorni di Streak',
      description_pattern: 'Un anno intero di dedizione! Sei una leggenda vivente!',
      target_formula: '365',
      reward_formula: {
        xp: '3650',
        coins: '1000',
        streak_bonus: '365',
      },
      requirements: ['daily_activity'],
      conditions: {},
      variations: [],
      theme: {
        colors: ['#ff6b35', '#ffd700', '#ff1744'],
        emojis: ['🔥', '💎', '🌟', '🏅', '👑'],
      },
      exclusiveRewards: [
        {
          type: 'badge',
          id: 'eternal_flame',
          name: 'Fiamma Eterna',
          rarity: 'legendary',
          permanent: true,
        },
        {
          type: 'title',
          id: 'the_unstoppable',
          name: 'L\'Inarrestabile',
          rarity: 'legendary',
          permanent: true,
        },
        {
          type: 'effect',
          id: 'golden_fire',
          name: 'Fuoco Dorato',
          rarity: 'legendary',
          permanent: true,
        },
      ],
      ai_prompts: {
        title_generation: 'Create a year-long streak celebration',
        description_generation: 'Celebrate incredible dedication and consistency',
        creative_twist: 'Use legendary, eternal, and fire themes',
      },
    },
  ],

  // ====================================
  // COMMUNITY EVENTS
  // ====================================
  community: [
    {
      id: 'special_global_challenge',
      category: 'exercise',
      difficulty: 'medium',
      eventType: 'community',
      eventName: 'Global Fitness Day',
      title_pattern: '🌍 Sfida Globale: Contribuisci con {target} Ripetizioni',
      description_pattern: 'Unisciti alla community mondiale per raggiungere 1 milione di ripetizioni!',
      target_formula: 'Math.max(50, user.level * 10)',
      reward_formula: {
        xp: 'target * 2 + (community_progress * 0.01)',
        coins: 'target + (community_progress * 0.005)',
      },
      requirements: ['exercise', 'community'],
      conditions: {},
      variations: ['any'],
      theme: {
        colors: ['#3498db', '#2ecc71', '#e74c3c'],
        emojis: ['🌍', '🌎', '🌏', '🤝', '💪'],
      },
      specialMechanics: [
        {
          type: 'community_pool',
          description: 'Ogni ripetizione contribuisce al goal globale',
          rules: { global_target: 1000000, contribution_tracking: true },
        },
      ],
      exclusiveRewards: [
        {
          type: 'badge',
          id: 'global_contributor',
          name: 'Contributore Globale',
          rarity: 'rare',
          permanent: true,
        },
      ],
      ai_prompts: {
        title_generation: 'Create a global community challenge',
        description_generation: 'Emphasize unity and collective achievement',
        creative_twist: 'Use world, unity, or togetherness themes',
      },
    },
    {
      id: 'special_charity_marathon',
      category: 'exercise',
      difficulty: 'hard',
      eventType: 'community',
      eventName: 'Charity Fitness Marathon',
      title_pattern: '❤️ Maratona Benefica: {target} Minuti per una Buona Causa',
      description_pattern: 'Ogni minuto di esercizio genera una donazione in beneficenza!',
      target_formula: 'Math.max(60, user.level * 8)',
      reward_formula: {
        xp: 'target * 3',
        coins: 'target * 1.5',
      },
      requirements: ['exercise', 'time_tracking'],
      conditions: {},
      variations: [],
      theme: {
        colors: ['#e91e63', '#9c27b0', '#673ab7'],
        emojis: ['❤️', '🎗️', '🤲', '🌟', '💝'],
      },
      specialMechanics: [
        {
          type: 'charity_conversion',
          description: 'Minuti convertiti in donazioni',
          rules: { minutes_to_donation: 0.10, max_donation: 100 },
        },
      ],
      exclusiveRewards: [
        {
          type: 'title',
          id: 'philanthropist',
          name: 'Filantropo del Fitness',
          rarity: 'epic',
          permanent: true,
        },
      ],
      ai_prompts: {
        title_generation: 'Create a charity marathon challenge',
        description_generation: 'Combine fitness with charitable giving',
        creative_twist: 'Use charity, giving, and helping themes',
      },
    },
  ],

  // ====================================
  // LIMITED TIME EVENTS
  // ====================================
  limited: [
    {
      id: 'special_weekend_warrior',
      category: 'duels',
      difficulty: 'medium',
      eventType: 'limited',
      eventName: 'Weekend Warrior Blitz',
      title_pattern: '⚡ Weekend Blitz: {target} Vittorie in 48 Ore',
      description_pattern: 'Solo questo weekend! Domina con {target} vittorie!',
      target_formula: 'Math.max(5, Math.floor(user.level / 2))',
      reward_formula: {
        xp: 'target * 50 + 100',
        coins: 'target * 20 + 40',
      },
      requirements: ['duels'],
      conditions: {},
      variations: [],
      recurring: {
        type: 'weekly',
        pattern: 'weekend',
      },
      theme: {
        colors: ['#f39c12', '#e74c3c', '#3498db'],
        emojis: ['⚡', '🔥', '💥', '🎯', '🏃'],
      },
      specialMechanics: [
        {
          type: 'time_pressure',
          description: 'Bonus crescente con il passare del tempo',
          rules: { hourly_multiplier_increase: 0.1, max_multiplier: 3 },
        },
      ],
      exclusiveRewards: [
        {
          type: 'currency',
          id: 'weekend_tokens',
          name: 'Token Weekend',
          rarity: 'common',
          permanent: false,
        },
      ],
      ai_prompts: {
        title_generation: 'Create a weekend warrior challenge',
        description_generation: 'Emphasize limited time and urgency',
        creative_twist: 'Use blitz, rush, or time pressure themes',
      },
    },
    {
      id: 'special_flash_challenge',
      category: 'exercise',
      difficulty: 'easy',
      eventType: 'limited',
      eventName: 'Flash Challenge Hour',
      title_pattern: '⏰ Flash Challenge: {target} Ripetizioni in 1 Ora',
      description_pattern: 'Sfida lampo! Completa {target} ripetizioni nella prossima ora!',
      target_formula: 'Math.max(20, user.level * 3)',
      reward_formula: {
        xp: 'target * 5',
        coins: 'target * 2',
      },
      requirements: ['exercise'],
      conditions: {},
      variations: ['random'],
      theme: {
        colors: ['#ff1744', '#ffc107', '#ff5722'],
        emojis: ['⏰', '⚡', '🏃', '💨', '🔥'],
      },
      specialMechanics: [
        {
          type: 'flash_timer',
          description: 'Timer di 60 minuti dalla prima ripetizione',
          rules: { time_limit: 60, auto_start: true },
        },
      ],
      exclusiveRewards: [
        {
          type: 'badge',
          id: 'flash_master',
          name: 'Master del Flash',
          rarity: 'rare',
          permanent: false,
        },
      ],
      ai_prompts: {
        title_generation: 'Create a flash challenge',
        description_generation: 'Emphasize speed and quick action',
        creative_twist: 'Use lightning, flash, or speed themes',
      },
    },
  ],
}

// ====================================
// HELPER FUNCTIONS
// ====================================

export function getActiveSpecialEvents(currentDate: Date = new Date()): SpecialEventTemplate[] {
  const activeEvents: SpecialEventTemplate[] = []
  
  Object.values(SPECIAL_EVENT_TEMPLATES).forEach(eventCategory => {
    eventCategory.forEach(event => {
      if (isEventActive(event, currentDate)) {
        activeEvents.push(event)
      }
    })
  })
  
  return activeEvents
}

export function isEventActive(event: SpecialEventTemplate, date: Date): boolean {
  // Check recurring events
  if (event.recurring) {
    switch (event.recurring.type) {
      case 'yearly':
        const [month, day] = event.recurring.pattern.split('-').map(Number)
        return date.getMonth() + 1 === month && date.getDate() === day
        
      case 'weekly':
        if (event.recurring.pattern === 'weekend') {
          return date.getDay() === 0 || date.getDay() === 6
        }
        break
        
      case 'monthly':
        if (event.recurring.pattern === 'last-sunday') {
          const lastSunday = getLastSundayOfMonth(date)
          return date.getDate() === lastSunday.getDate()
        }
        break
    }
  }
  
  // Check date range events
  if (event.startDate && event.endDate) {
    const start = parseEventDate(event.startDate, date.getFullYear())
    const end = parseEventDate(event.endDate, date.getFullYear())
    return date >= start && date <= end
  }
  
  return false
}

function parseEventDate(dateStr: string, year: number): Date {
  if (dateStr.includes('-')) {
    const [month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(dateStr)
}

function getLastSundayOfMonth(date: Date): Date {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  const dayOfWeek = lastDay.getDay()
  const diff = dayOfWeek === 0 ? 0 : dayOfWeek
  return new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() - diff)
}

export function getUpcomingEvents(days: number = 30): SpecialEventTemplate[] {
  const upcoming: SpecialEventTemplate[] = []
  const now = new Date()
  
  for (let i = 1; i <= days; i++) {
    const futureDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
    const dayEvents = getActiveSpecialEvents(futureDate)
    
    dayEvents.forEach(event => {
      if (!upcoming.find(e => e.id === event.id)) {
        upcoming.push(event)
      }
    })
  }
  
  return upcoming
}

export function getEventsByType(eventType: string): SpecialEventTemplate[] {
  return SPECIAL_EVENT_TEMPLATES[eventType] || []
}

export function getEventsByRarity(rarity: 'common' | 'rare' | 'epic' | 'legendary'): SpecialEventTemplate[] {
  const events: SpecialEventTemplate[] = []
  
  Object.values(SPECIAL_EVENT_TEMPLATES).forEach(eventCategory => {
    eventCategory.forEach(event => {
      if (event.exclusiveRewards.some(reward => reward.rarity === rarity)) {
        events.push(event)
      }
    })
  })
  
  return events
}

export function calculateEventBonus(
  event: SpecialEventTemplate,
  userPerformance: any
): number {
  let bonus = 1
  
  // Apply special mechanics
  if (event.specialMechanics) {
    event.specialMechanics.forEach(mechanic => {
      switch (mechanic.type) {
        case 'zombie_mode':
          if (userPerformance.afterFailure) {
            bonus *= mechanic.rules.multiplier
          }
          break
          
        case 'couple_bonus':
          if (userPerformance.samePartner) {
            bonus *= mechanic.rules.same_partner_multiplier
          }
          break
          
        case 'ice_mode':
          if (userPerformance.temperature < 10) {
            bonus *= mechanic.rules.cold_weather_multiplier
          }
          break
          
        case 'centurion_bonus':
          if (userPerformance.milestoneReached) {
            bonus *= mechanic.rules.milestone_multiplier
          }
          break
          
        case 'time_pressure':
          const hoursElapsed = userPerformance.timeElapsed / 3600
          bonus *= Math.min(
            mechanic.rules.max_multiplier,
            1 + (hoursElapsed * mechanic.rules.hourly_multiplier_increase)
          )
          break
      }
    })
  }
  
  return bonus
}

// ====================================
// EXPORT DEFAULT
// ====================================

export default SPECIAL_EVENT_TEMPLATES