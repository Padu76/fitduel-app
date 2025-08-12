// This file configures the initialization of Sentry on the client side
// The config you add here will be used whenever a users loads a page in their browser
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || 'https://66aec16ed3804d636517eedcd966b8fa@o4509808916168704.ingest.de.sentry.io/4509831491551312',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry
  debug: false,

  // Replay configuration
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',

  // Performance Monitoring
  enabled: process.env.NODE_ENV === 'production',

  // Filtering
  beforeSend(event, hint) {
    // Filter out specific errors if needed
    if (event.exception) {
      const error = hint.originalException
      // Filter out network errors
      if (error && error instanceof Error && error.message?.includes('NetworkError')) {
        return null
      }
    }
    return event
  },

  // User identification
  initialScope: {
    tags: {
      app: 'fitduel',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
    },
  },
})