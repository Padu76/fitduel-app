// ====================================
// FITDUEL INFRASTRUCTURE CONFIGURATION
// Anti-crash, Anti-cheat, Scalability
// ====================================

// ====================================
// PERFORMANCE & SCALABILITY
// ====================================
export const PERFORMANCE_CONFIG = {
  // Request rate limiting
  RATE_LIMITS: {
    // API calls per minute per user
    API_CALLS_PER_MINUTE: 60,
    // Duel creation per hour
    DUELS_PER_HOUR: 30,
    // Login attempts per hour
    LOGIN_ATTEMPTS_PER_HOUR: 10,
    // File uploads per day
    UPLOADS_PER_DAY: 100,
  },
  
  // Caching strategy
  CACHE_TTL: {
    // User profile cache (seconds)
    USER_PROFILE: 300, // 5 minutes
    // Leaderboard cache
    LEADERBOARD: 60, // 1 minute
    // Exercise data cache
    EXERCISE_DATA: 3600, // 1 hour
    // Static assets
    STATIC_ASSETS: 86400, // 24 hours
  },
  
  // Database optimization
  DATABASE: {
    // Max connections pool
    MAX_CONNECTIONS: 20,
    // Connection timeout (ms)
    CONNECTION_TIMEOUT: 5000,
    // Query timeout (ms)
    QUERY_TIMEOUT: 10000,
    // Enable connection pooling
    ENABLE_POOLING: true,
    // Retry failed queries
    RETRY_ATTEMPTS: 3,
  },
  
  // Pagination limits
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    LEADERBOARD_SIZE: 50,
    FRIENDS_LIST_SIZE: 200,
  },
}

// ====================================
// ANTI-CHEAT SYSTEM
// ====================================
export const ANTI_CHEAT_CONFIG = {
  // Validation thresholds
  VALIDATION: {
    // Minimum time between actions (ms)
    MIN_ACTION_INTERVAL: 500,
    // Maximum actions per second
    MAX_ACTIONS_PER_SECOND: 10,
    // Suspicious score threshold
    SUSPICIOUS_SCORE_THRESHOLD: 0.7,
    // Maximum form score allowed
    MAX_FORM_SCORE: 100,
    // Minimum exercise duration (seconds)
    MIN_EXERCISE_DURATION: {
      pushup: 10,
      squat: 10,
      plank: 5,
      burpee: 15,
    },
    // Maximum reps per minute (realistic limits)
    MAX_REPS_PER_MINUTE: {
      pushup: 60,
      squat: 50,
      burpee: 30,
      jumping_jack: 120,
      mountain_climber: 100,
    },
  },
  
  // Device fingerprinting
  FINGERPRINT: {
    // Track device ID
    TRACK_DEVICE_ID: true,
    // Track IP address
    TRACK_IP: true,
    // Track user agent
    TRACK_USER_AGENT: true,
    // Track screen resolution
    TRACK_SCREEN: true,
    // Track timezone
    TRACK_TIMEZONE: true,
    // Maximum devices per user
    MAX_DEVICES_PER_USER: 5,
  },
  
  // Motion sensor validation
  MOTION_VALIDATION: {
    // Enable accelerometer validation
    USE_ACCELEROMETER: true,
    // Minimum movement threshold
    MIN_MOVEMENT_THRESHOLD: 0.3,
    // Maximum stillness duration (ms)
    MAX_STILLNESS_DURATION: 2000,
    // Gyroscope validation
    USE_GYROSCOPE: true,
    // Pattern matching threshold
    PATTERN_MATCH_THRESHOLD: 0.6,
  },
  
  // AI validation settings
  AI_VALIDATION: {
    // Enable pose detection
    ENABLE_POSE_DETECTION: true,
    // Minimum confidence score
    MIN_CONFIDENCE_SCORE: 0.5,
    // Frame analysis rate (fps)
    FRAME_ANALYSIS_RATE: 5,
    // Key points to track
    KEY_POINTS: ['nose', 'leftShoulder', 'rightShoulder', 'leftHip', 'rightHip'],
    // Minimum visible keypoints
    MIN_VISIBLE_KEYPOINTS: 3,
  },
  
  // Shadowban system
  SHADOWBAN: {
    // Enable shadowban
    ENABLE: true,
    // Suspicious activity threshold
    THRESHOLD_SCORE: 5,
    // Shadowban duration (hours)
    DURATION_HOURS: 24,
    // Actions that increase suspicion
    SUSPICIOUS_ACTIONS: {
      IMPOSSIBLE_SCORE: 3,
      TOO_FAST_COMPLETION: 2,
      PATTERN_DETECTED: 2,
      MULTIPLE_DEVICE_SAME_TIME: 5,
      VPN_DETECTED: 1,
    },
  },
}

// ====================================
// VIDEO/MEDIA HANDLING (Zero Storage)
// ====================================
export const MEDIA_CONFIG = {
  // Real-time processing only
  VIDEO: {
    // No video storage
    STORE_VIDEOS: false,
    // Process in real-time only
    REAL_TIME_ONLY: true,
    // Maximum processing duration (seconds)
    MAX_DURATION: 300, // 5 minutes
    // Frame extraction rate
    FRAME_RATE: 5, // 5 fps for analysis
  },
  
  // Snapshot system (instead of video)
  SNAPSHOTS: {
    // Take snapshots during exercise
    ENABLE_SNAPSHOTS: true,
    // Number of snapshots to take
    SNAPSHOT_COUNT: 3,
    // Store as base64 thumbnails only
    THUMBNAIL_ONLY: true,
    // Maximum thumbnail size (KB)
    MAX_THUMBNAIL_SIZE: 50,
    // Auto-delete after (hours)
    AUTO_DELETE_AFTER: 24,
  },
  
  // Result proof system
  PROOF_SYSTEM: {
    // Generate proof hash
    GENERATE_HASH: true,
    // Include timestamp
    INCLUDE_TIMESTAMP: true,
    // Include device fingerprint
    INCLUDE_FINGERPRINT: true,
    // Cryptographic signature
    SIGN_RESULTS: true,
  },
}

// ====================================
// SECURITY CONFIGURATION
// ====================================
export const SECURITY_CONFIG = {
  // Authentication
  AUTH: {
    // Session duration (hours)
    SESSION_DURATION: 24,
    // Refresh token duration (days)
    REFRESH_TOKEN_DURATION: 30,
    // Multi-factor authentication
    ENABLE_MFA: false, // For future
    // Password requirements
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_REQUIRE_UPPERCASE: true,
    PASSWORD_REQUIRE_NUMBER: true,
  },
  
  // API Security
  API: {
    // Enable CORS
    ENABLE_CORS: true,
    // Allowed origins
    ALLOWED_ORIGINS: [
      'https://fit-duel.com',
      'https://fit-duel.it',
      'http://localhost:3000', // Development
    ],
    // API key validation
    REQUIRE_API_KEY: false, // For future
    // Request signing
    SIGN_REQUESTS: false, // For future
  },
  
  // Data protection
  DATA: {
    // Encrypt sensitive data
    ENCRYPT_SENSITIVE: true,
    // PII masking
    MASK_PII: true,
    // Audit logging
    ENABLE_AUDIT_LOG: true,
    // GDPR compliance
    GDPR_COMPLIANT: true,
  },
}

// ====================================
// MONITORING & ANALYTICS
// ====================================
export const MONITORING_CONFIG = {
  // Error tracking
  ERROR_TRACKING: {
    // Sentry integration
    USE_SENTRY: true,
    // Sample rate (0-1)
    SAMPLE_RATE: 0.1, // 10% in production
    // Track user interactions
    TRACK_INTERACTIONS: true,
    // Track performance
    TRACK_PERFORMANCE: true,
  },
  
  // Analytics
  ANALYTICS: {
    // Track page views
    TRACK_PAGEVIEWS: true,
    // Track events
    TRACK_EVENTS: true,
    // Track user journey
    TRACK_USER_JOURNEY: true,
    // Anonymous tracking only
    ANONYMOUS_ONLY: true,
  },
  
  // Health checks
  HEALTH_CHECKS: {
    // Enable health endpoint
    ENABLE_HEALTH_ENDPOINT: true,
    // Database health check
    CHECK_DATABASE: true,
    // External services check
    CHECK_EXTERNAL_SERVICES: true,
    // Check interval (seconds)
    CHECK_INTERVAL: 60,
  },
}

// ====================================
// FEATURE FLAGS
// ====================================
export const FEATURE_FLAGS = {
  // Core features
  ENABLE_DUELS: true,
  ENABLE_TOURNAMENTS: false, // Coming soon
  ENABLE_TEAMS: false, // Coming soon
  ENABLE_MISSIONS: true,
  ENABLE_LEADERBOARD: true,
  ENABLE_FRIENDS: true,
  
  // AI Features
  ENABLE_AI_VALIDATION: true,
  ENABLE_AI_COACHING: false, // Coming soon
  ENABLE_FORM_ANALYSIS: true,
  
  // Social features
  ENABLE_CHAT: false, // Coming soon
  ENABLE_SOCIAL_SHARE: true,
  ENABLE_FEED: true,
  
  // Monetization
  ENABLE_PREMIUM: false, // Coming soon
  ENABLE_ADS: false, // Coming soon
  ENABLE_SHOP: false, // Coming soon
  
  // Experimental
  ENABLE_BETA_FEATURES: false,
  ENABLE_A_B_TESTING: false,
}

// ====================================
// SCALING CONFIGURATION
// ====================================
export const SCALING_CONFIG = {
  // Auto-scaling triggers
  AUTO_SCALE: {
    // CPU threshold (%)
    CPU_THRESHOLD: 70,
    // Memory threshold (%)
    MEMORY_THRESHOLD: 80,
    // Request queue threshold
    QUEUE_THRESHOLD: 100,
    // Scale up ratio
    SCALE_UP_RATIO: 1.5,
    // Scale down ratio
    SCALE_DOWN_RATIO: 0.8,
    // Cooldown period (seconds)
    COOLDOWN_PERIOD: 300,
  },
  
  // CDN Configuration
  CDN: {
    // Enable CDN
    ENABLE: true,
    // CDN providers
    PROVIDER: 'cloudflare', // or 'vercel'
    // Cache static assets
    CACHE_STATIC: true,
    // Cache API responses
    CACHE_API: false,
    // Purge cache on deploy
    PURGE_ON_DEPLOY: true,
  },
  
  // Queue system
  QUEUE: {
    // Enable job queue
    ENABLE: true,
    // Maximum queue size
    MAX_QUEUE_SIZE: 1000,
    // Job timeout (seconds)
    JOB_TIMEOUT: 30,
    // Retry failed jobs
    RETRY_FAILED: true,
    // Maximum retries
    MAX_RETRIES: 3,
  },
}

// ====================================
// MAINTENANCE MODE
// ====================================
export const MAINTENANCE_CONFIG = {
  // Enable maintenance mode
  ENABLED: false,
  // Maintenance message
  MESSAGE: 'FitDuel è in manutenzione. Torniamo presto!',
  // Allowed IPs during maintenance
  ALLOWED_IPS: ['127.0.0.1'],
  // Estimated end time
  END_TIME: null,
  // Show countdown
  SHOW_COUNTDOWN: true,
}

// ====================================
// EXPORT MAIN CONFIG
// ====================================
export const INFRASTRUCTURE = {
  performance: PERFORMANCE_CONFIG,
  antiCheat: ANTI_CHEAT_CONFIG,
  media: MEDIA_CONFIG,
  security: SECURITY_CONFIG,
  monitoring: MONITORING_CONFIG,
  features: FEATURE_FLAGS,
  scaling: SCALING_CONFIG,
  maintenance: MAINTENANCE_CONFIG,
  
  // Environment-specific overrides
  getConfig: (env: 'development' | 'staging' | 'production') => {
    const config = { ...INFRASTRUCTURE }
    
    if (env === 'development') {
      // Relaxed limits for development
      config.performance.RATE_LIMITS.API_CALLS_PER_MINUTE = 1000
      config.antiCheat.VALIDATION.MIN_ACTION_INTERVAL = 100
      config.monitoring.ERROR_TRACKING.SAMPLE_RATE = 1 // 100% in dev
      config.security.API.ALLOWED_ORIGINS.push('http://localhost:3000')
    }
    
    if (env === 'production') {
      // Strict limits for production
      config.antiCheat.SHADOWBAN.ENABLE = true
      config.monitoring.ERROR_TRACKING.SAMPLE_RATE = 0.1 // 10% in prod
      config.features.ENABLE_BETA_FEATURES = false
    }
    
    return config
  },
}

// Type exports
export type InfrastructureConfig = typeof INFRASTRUCTURE
export type FeatureFlags = typeof FEATURE_FLAGS
export type AntiCheatConfig = typeof ANTI_CHEAT_CONFIG