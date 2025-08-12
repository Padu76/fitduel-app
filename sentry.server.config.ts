// This file configures the initialization of Sentry on the server side
// The config you add here will be used whenever the server handles a request
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

  // Uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: process.env.NODE_ENV === 'development',

  // Filtering
  beforeSend(event, hint) {
    // Filter out specific errors if needed
    if (event.exception) {
      const error = hint.originalException
      // Don't send errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Sentry Error (dev):', error)
        return null
      }
      // Filter out specific API errors
      if (error && error instanceof Error) {
        // Skip authentication errors (handled by app)
        if (error.message?.includes('UNAUTHORIZED') || 
            error.message?.includes('FORBIDDEN')) {
          return null
        }
      }
    }
    return event
  },

  // User identification
  initialScope: {
    tags: {
      app: 'fitduel',
      runtime: 'node',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
    },
  },
})