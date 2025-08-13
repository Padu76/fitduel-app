// ====================================
// DAILY MISSION TEMPLATES
// Pre-defined patterns for daily missions
// ====================================

import { MissionTemplate, MissionCategory, MissionDifficulty } from '../mission-generator'

// ====================================
// TYPES
// ====================================

export interface DailyMissionTemplate extends MissionTemplate {
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'any'
  energyRequired: 'low' | 'medium' | 'high'
  estimatedMinutes: number
  motivationalQuotes: string[]
  tips: string[]
}

// ====================================
// DAILY MISSION TEMPLATES
// ====================================

export const DAILY_MISSION_TEMPLATES: Record<MissionCategory, DailyMissionTemplate[]> = {
  // ====================================
  // STREAK MISSIONS
  // ====================================
  streak: [
    {
      id: 'daily_streak_maintain',
      category: 'streak',
      difficulty: 'easy',
      title_pattern: '🔥 Mantieni il Fuoco',
      description_pattern: 'Accedi e completa almeno 1 attività per mantenere il tuo streak di {streak} giorni',
      target_formula: '1',
      reward_formula: {
        xp: '20 + (user.daily_streak * 5)',
        coins: '5 + Math.floor(user.daily_streak / 2)',
        streak_bonus: '10',
      },
      requirements: ['login'],
      conditions: {},
      variations: [],
      timeOfDay: 'any',
      energyRequired: 'low',
      estimatedMinutes: 1,
      motivationalQuotes: [
        'La costanza batte il talento!',
        'Un giorno alla volta, un successo alla volta.',
        'Il tuo streak è la prova della tua determinazione!',
      ],
      tips: [
        'Accedi ogni giorno alla stessa ora per creare un\'abitudine',
        'Imposta un promemoria sul telefono',
        'Anche solo 5 minuti fanno la differenza',
      ],
      ai_prompts: {
        title_generation: 'Create an encouraging streak maintenance title',
        description_generation: 'Motivate daily consistency and habit building',
        creative_twist: 'Reference fire, chains, or momentum metaphors',
      },
    },
    {
      id: 'daily_streak_morning_warrior',
      category: 'streak',
      difficulty: 'medium',
      title_pattern: '☀️ Guerriero del Mattino',
      description_pattern: 'Completa una sessione di allenamento entro le 10:00',
      target_formula: '1',
      reward_formula: {
        xp: '40',
        coins: '10',
        streak_bonus: '15',
      },
      requirements: ['morning_activity'],
      conditions: { min_level: 3 },
      variations: [],
      timeOfDay: 'morning',
      energyRequired: 'medium',
      estimatedMinutes: 15,
      motivationalQuotes: [
        'Chi domina il mattino, domina la giornata!',
        'Il mattino ha l\'oro in bocca... e i muscoli!',
        'Svegliati determinato, dormi soddisfatto.',
      ],
      tips: [
        'Prepara l\'abbigliamento la sera prima',
        'Inizia con 5 minuti di stretching',
        'Bevi un bicchiere d\'acqua appena sveglio',
      ],
      ai_prompts: {
        title_generation: 'Create a morning-focused motivational title',
        description_generation: 'Emphasize early bird benefits and energy',
        creative_twist: 'Use sunrise, warrior, or champion metaphors',
      },
    },
  ],

  // ====================================
  // EXERCISE MISSIONS
  // ====================================
  exercise: [
    {
      id: 'daily_exercise_push_challenge',
      category: 'exercise',
      difficulty: 'easy',
      title_pattern: '💪 Push-Up Power',
      description_pattern: 'Completa {target} push-ups oggi (anche divisi in serie)',
      target_formula: 'Math.max(10, Math.min(user.level * 3, 50))',
      reward_formula: {
        xp: 'target * 1.5',
        coins: 'Math.floor(target / 5)',
      },
      requirements: ['exercise'],
      conditions: {},
      variations: ['standard', 'knee', 'incline', 'diamond'],
      timeOfDay: 'any',
      energyRequired: 'medium',
      estimatedMinutes: 5,
      motivationalQuotes: [
        'Ogni push-up ti rende più forte!',
        'La forza nasce dalla resistenza.',
        'Il tuo petto ringrazierà!',
      ],
      tips: [
        'Mantieni la schiena dritta',
        'Respira: giù inspira, su espira',
        'Se troppo difficile, inizia dalle ginocchia',
      ],
      ai_prompts: {
        title_generation: 'Create a push-up focused challenge title',
        description_generation: 'Motivate upper body strength development',
        creative_twist: 'Reference power, strength, or pushing limits',
      },
    },
    {
      id: 'daily_exercise_squat_quest',
      category: 'exercise',
      difficulty: 'easy',
      title_pattern: '🦵 Squat Squad',
      description_pattern: 'Esegui {target} squat con forma perfetta',
      target_formula: 'Math.max(15, Math.min(user.level * 4, 80))',
      reward_formula: {
        xp: 'target * 1.2',
        coins: 'Math.floor(target / 6)',
      },
      requirements: ['exercise'],
      conditions: {},
      variations: ['bodyweight', 'jump', 'sumo', 'bulgarian'],
      timeOfDay: 'any',
      energyRequired: 'medium',
      estimatedMinutes: 7,
      motivationalQuotes: [
        'Gambe forti, vita forte!',
        'Ogni squat è un passo verso il successo.',
        'Il tuo sedere ti ringrazierà!',
      ],
      tips: [
        'Ginocchia in linea con le punte dei piedi',
        'Scendi come se ti sedessi su una sedia',
        'Spingi dai talloni per risalire',
      ],
      ai_prompts: {
        title_generation: 'Create a squat-focused challenge title',
        description_generation: 'Emphasize lower body power and form',
        creative_twist: 'Use squad, quest, or leg day references',
      },
    },
    {
      id: 'daily_exercise_plank_persist',
      category: 'exercise',
      difficulty: 'medium',
      title_pattern: '⏱️ Plank Persistence',
      description_pattern: 'Mantieni la plank per almeno {target} secondi totali',
      target_formula: 'Math.max(30, Math.min(user.level * 10, 180))',
      reward_formula: {
        xp: 'target * 0.8',
        coins: 'Math.floor(target / 15)',
      },
      requirements: ['exercise'],
      conditions: { min_level: 2 },
      variations: ['standard', 'side', 'dynamic', 'weighted'],
      timeOfDay: 'any',
      energyRequired: 'high',
      estimatedMinutes: 5,
      motivationalQuotes: [
        'La stabilità del core è la base di tutto!',
        'Resisti un secondo in più di ieri.',
        'Il plank forgia guerrieri!',
      ],
      tips: [
        'Mantieni il corpo in linea retta',
        'Non trattenere il respiro',
        'Contrai gli addominali',
      ],
      ai_prompts: {
        title_generation: 'Create a plank endurance challenge title',
        description_generation: 'Focus on core strength and mental persistence',
        creative_twist: 'Use time, persistence, or stability metaphors',
      },
    },
    {
      id: 'daily_exercise_cardio_blast',
      category: 'exercise',
      difficulty: 'medium',
      title_pattern: '🏃 Cardio Blast',
      description_pattern: 'Completa {target} minuti di attività cardio',
      target_formula: 'Math.max(10, Math.min(user.level * 2, 30))',
      reward_formula: {
        xp: 'target * 3',
        coins: 'Math.floor(target / 2)',
      },
      requirements: ['cardio'],
      conditions: { min_level: 3 },
      variations: ['running', 'jumping_jacks', 'burpees', 'high_knees'],
      timeOfDay: 'any',
      energyRequired: 'high',
      estimatedMinutes: 15,
      motivationalQuotes: [
        'Il cuore è il motore del corpo!',
        'Ogni battito ti rende più forte.',
        'Suda oggi, brilla domani!',
      ],
      tips: [
        'Inizia con un riscaldamento leggero',
        'Mantieni un ritmo sostenibile',
        'Idratati prima, durante e dopo',
      ],
      ai_prompts: {
        title_generation: 'Create a cardio-focused energetic title',
        description_generation: 'Emphasize heart health and endurance',
        creative_twist: 'Use blast, energy, or speed references',
      },
    },
  ],

  // ====================================
  // DUELS MISSIONS
  // ====================================
  duels: [
    {
      id: 'daily_duels_first_blood',
      category: 'duels',
      difficulty: 'easy',
      title_pattern: '⚔️ Prima Vittoria',
      description_pattern: 'Vinci almeno {target} duello oggi',
      target_formula: '1',
      reward_formula: {
        xp: '30',
        coins: '10',
      },
      requirements: ['duels'],
      conditions: {},
      variations: [],
      timeOfDay: 'any',
      energyRequired: 'medium',
      estimatedMinutes: 10,
      motivationalQuotes: [
        'Ogni duello è una lezione!',
        'La vittoria appartiene ai coraggiosi.',
        'Sfida te stesso sfidando gli altri!',
      ],
      tips: [
        'Scegli avversari del tuo livello',
        'Concentrati sulla forma, non sulla velocità',
        'Studia i pattern degli avversari',
      ],
      ai_prompts: {
        title_generation: 'Create a duel victory focused title',
        description_generation: 'Motivate competitive spirit and winning',
        creative_twist: 'Use battle, warrior, or victory metaphors',
      },
    },
    {
      id: 'daily_duels_challenger',
      category: 'duels',
      difficulty: 'medium',
      title_pattern: '🎯 Sfidante Instancabile',
      description_pattern: 'Partecipa a {target} duelli (vittoria o sconfitta)',
      target_formula: 'Math.min(3, Math.max(2, Math.floor(user.level / 3)))',
      reward_formula: {
        xp: 'target * 20',
        coins: 'target * 5',
      },
      requirements: ['duels'],
      conditions: { min_level: 2 },
      variations: [],
      timeOfDay: 'any',
      energyRequired: 'medium',
      estimatedMinutes: 20,
      motivationalQuotes: [
        'La pratica rende perfetti!',
        'Ogni sfida ti rende più forte.',
        'Non temere la sconfitta, temi di non provarci!',
      ],
      tips: [
        'Varia gli esercizi nei duelli',
        'Riposa tra un duello e l\'altro',
        'Impara dai tuoi errori',
      ],
      ai_prompts: {
        title_generation: 'Create a participation-focused duel title',
        description_generation: 'Emphasize practice and improvement through competition',
        creative_twist: 'Use challenger, relentless, or unstoppable themes',
      },
    },
    {
      id: 'daily_duels_perfect_form',
      category: 'duels',
      difficulty: 'hard',
      title_pattern: '✨ Forma Perfetta',
      description_pattern: 'Vinci un duello con form score superiore al 90%',
      target_formula: '1',
      reward_formula: {
        xp: '60',
        coins: '20',
      },
      requirements: ['duels', 'form_tracking'],
      conditions: { min_level: 5 },
      variations: [],
      timeOfDay: 'any',
      energyRequired: 'high',
      estimatedMinutes: 15,
      motivationalQuotes: [
        'La perfezione è nel dettaglio!',
        'Qualità batte quantità sempre.',
        'Un movimento perfetto vale più di cento frettolosi!',
      ],
      tips: [
        'Rallenta e concentrati sulla forma',
        'Usa uno specchio se possibile',
        'Registrati per analizzare la forma',
      ],
      ai_prompts: {
        title_generation: 'Create a perfect form duel challenge',
        description_generation: 'Emphasize quality over speed in competition',
        creative_twist: 'Use perfection, precision, or mastery themes',
      },
    },
  ],

  // ====================================
  // SOCIAL MISSIONS
  // ====================================
  social: [
    {
      id: 'daily_social_motivator',
      category: 'social',
      difficulty: 'easy',
      title_pattern: '💬 Motivatore Social',
      description_pattern: 'Invia un messaggio motivazionale a {target} amico',
      target_formula: '1',
      reward_formula: {
        xp: '20',
        coins: '5',
      },
      requirements: ['social'],
      conditions: { requires_friends: true },
      variations: [],
      timeOfDay: 'any',
      energyRequired: 'low',
      estimatedMinutes: 2,
      motivationalQuotes: [
        'Un incoraggiamento può cambiare la giornata!',
        'Insieme siamo più forti.',
        'Diffondi positività e raccoglierai energia!',
      ],
      tips: [
        'Sii sincero e specifico',
        'Celebra i piccoli successi degli altri',
        'Un emoji può fare la differenza',
      ],
      ai_prompts: {
        title_generation: 'Create a social encouragement mission',
        description_generation: 'Promote community support and positivity',
        creative_twist: 'Use friendship, support, or team themes',
      },
    },
    {
      id: 'daily_social_team_up',
      category: 'social',
      difficulty: 'medium',
      title_pattern: '👥 Team Power',
      description_pattern: 'Completa un allenamento insieme a un amico',
      target_formula: '1',
      reward_formula: {
        xp: '40',
        coins: '15',
      },
      requirements: ['social', 'exercise'],
      conditions: { requires_friends: true, min_level: 3 },
      variations: [],
      timeOfDay: 'any',
      energyRequired: 'medium',
      estimatedMinutes: 20,
      motivationalQuotes: [
        'Chi si allena insieme, vince insieme!',
        'L\'energia del gruppo moltiplica i risultati.',
        'Un partner rende tutto più divertente!',
      ],
      tips: [
        'Coordinate gli orari in anticipo',
        'Scegliete esercizi adatti a entrambi',
        'Motivatevi a vicenda',
      ],
      ai_prompts: {
        title_generation: 'Create a team workout mission title',
        description_generation: 'Emphasize collaboration and shared success',
        creative_twist: 'Use team, partnership, or synergy themes',
      },
    },
  ],

  // ====================================
  // PERFORMANCE MISSIONS
  // ====================================
  performance: [
    {
      id: 'daily_performance_beat_yesterday',
      category: 'performance',
      difficulty: 'medium',
      title_pattern: '📈 Batti il Te di Ieri',
      description_pattern: 'Supera il tuo record personale in un esercizio',
      target_formula: 'Math.ceil(user.personal_best * 1.05)',
      reward_formula: {
        xp: '50',
        coins: '15',
      },
      requirements: ['performance_tracking'],
      conditions: { min_level: 3 },
      variations: [],
      timeOfDay: 'any',
      energyRequired: 'high',
      estimatedMinutes: 10,
      motivationalQuotes: [
        'Il tuo unico competitor sei tu stesso!',
        'Ogni record è fatto per essere battuto.',
        '1% meglio ogni giorno = 365% meglio in un anno!',
      ],
      tips: [
        'Riscaldati bene prima di tentare',
        'Concentrati su un solo esercizio',
        'Registra sempre i tuoi progressi',
      ],
      ai_prompts: {
        title_generation: 'Create a personal record breaking title',
        description_generation: 'Focus on self-improvement and progress',
        creative_twist: 'Use growth, improvement, or evolution themes',
      },
    },
    {
      id: 'daily_performance_consistency',
      category: 'performance',
      difficulty: 'hard',
      title_pattern: '🎯 Consistenza Elite',
      description_pattern: 'Completa {target} serie con form score >85%',
      target_formula: 'Math.min(3, Math.max(2, Math.floor(user.level / 4)))',
      reward_formula: {
        xp: 'target * 25',
        coins: 'target * 8',
      },
      requirements: ['form_tracking'],
      conditions: { min_level: 5 },
      variations: [],
      timeOfDay: 'any',
      energyRequired: 'high',
      estimatedMinutes: 15,
      motivationalQuotes: [
        'L\'eccellenza è un\'abitudine!',
        'La consistenza crea campioni.',
        'Ripetizione + Perfezione = Maestria!',
      ],
      tips: [
        'Non aumentare il ritmo se compromette la forma',
        'Riposa adeguatamente tra le serie',
        'Visualizza il movimento perfetto',
      ],
      ai_prompts: {
        title_generation: 'Create a consistency focused performance title',
        description_generation: 'Emphasize maintaining high quality repeatedly',
        creative_twist: 'Use elite, mastery, or excellence themes',
      },
    },
  ],

  // ====================================
  // EXPLORATION MISSIONS
  // ====================================
  exploration: [
    {
      id: 'daily_exploration_try_new',
      category: 'exploration',
      difficulty: 'easy',
      title_pattern: '🆕 Esploratore Fitness',
      description_pattern: 'Prova un nuovo esercizio o variante',
      target_formula: '1',
      reward_formula: {
        xp: '30',
        coins: '10',
      },
      requirements: ['exploration'],
      conditions: {},
      variations: [],
      timeOfDay: 'any',
      energyRequired: 'low',
      estimatedMinutes: 10,
      motivationalQuotes: [
        'La varietà è il sale della vita!',
        'Ogni nuovo esercizio è una scoperta.',
        'Esci dalla zona di comfort!',
      ],
      tips: [
        'Guarda tutorial prima di provare',
        'Inizia con versioni semplificate',
        'Non aver paura di sbagliare',
      ],
      ai_prompts: {
        title_generation: 'Create an exploration focused mission',
        description_generation: 'Encourage trying new exercises and techniques',
        creative_twist: 'Use discovery, adventure, or exploration themes',
      },
    },
    {
      id: 'daily_exploration_feature',
      category: 'exploration',
      difficulty: 'easy',
      title_pattern: '🔍 Feature Hunter',
      description_pattern: 'Scopri e usa una nuova funzione dell\'app',
      target_formula: '1',
      reward_formula: {
        xp: '25',
        coins: '8',
      },
      requirements: ['app_interaction'],
      conditions: { max_level: 10 },
      variations: ['leaderboard', 'achievements', 'statistics', 'social'],
      timeOfDay: 'any',
      energyRequired: 'low',
      estimatedMinutes: 5,
      motivationalQuotes: [
        'Conosci i tuoi strumenti!',
        'L\'app è piena di sorprese.',
        'Esplora per massimizzare i risultati!',
      ],
      tips: [
        'Controlla il menu delle impostazioni',
        'Prova tutte le sezioni dell\'app',
        'Leggi i tooltip informativi',
      ],
      ai_prompts: {
        title_generation: 'Create an app exploration mission',
        description_generation: 'Encourage discovering app features',
        creative_twist: 'Use hunting, discovery, or treasure themes',
      },
    },
  ],
}

// ====================================
// HELPER FUNCTIONS
// ====================================

export function getDailyMissionsByDifficulty(
  difficulty: MissionDifficulty
): DailyMissionTemplate[] {
  const missions: DailyMissionTemplate[] = []
  
  Object.values(DAILY_MISSION_TEMPLATES).forEach(categoryMissions => {
    missions.push(...categoryMissions.filter(m => m.difficulty === difficulty))
  })
  
  return missions
}

export function getDailyMissionsByTimeOfDay(
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'any'
): DailyMissionTemplate[] {
  const missions: DailyMissionTemplate[] = []
  
  Object.values(DAILY_MISSION_TEMPLATES).forEach(categoryMissions => {
    missions.push(...categoryMissions.filter(m => 
      m.timeOfDay === timeOfDay || m.timeOfDay === 'any'
    ))
  })
  
  return missions
}

export function getDailyMissionsByEnergyLevel(
  energyLevel: 'low' | 'medium' | 'high'
): DailyMissionTemplate[] {
  const missions: DailyMissionTemplate[] = []
  
  Object.values(DAILY_MISSION_TEMPLATES).forEach(categoryMissions => {
    missions.push(...categoryMissions.filter(m => m.energyRequired === energyLevel))
  })
  
  return missions
}

export function getQuickDailyMissions(maxMinutes: number = 10): DailyMissionTemplate[] {
  const missions: DailyMissionTemplate[] = []
  
  Object.values(DAILY_MISSION_TEMPLATES).forEach(categoryMissions => {
    missions.push(...categoryMissions.filter(m => m.estimatedMinutes <= maxMinutes))
  })
  
  return missions
}

export function getRandomMotivationalQuote(template: DailyMissionTemplate): string {
  const quotes = template.motivationalQuotes
  return quotes[Math.floor(Math.random() * quotes.length)]
}

export function getRandomTip(template: DailyMissionTemplate): string {
  const tips = template.tips
  return tips[Math.floor(Math.random() * tips.length)]
}

// ====================================
// EXPORT DEFAULT
// ====================================

export default DAILY_MISSION_TEMPLATES