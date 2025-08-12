// This file configures the initialization of Sentry for edge features (middleware, edge routes, etc.)
// The config you add here will be used whenever the edge runtime handles a request
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || 'https://66aec16ed3804d636517eedcd966b8fa@o4509808916168704.ingest.de.sentry.io/4509831491551312',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry
  debug: false,

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
      // Don't send errors in development
      if (process.env.NODE_ENV === 'development') {
        return null
      }
    }
    return event
  },

  // User identification
  initialScope: {
    tags: {
      app: 'fitduel',
      runtime: 'edge',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
    },
  },
})