// ================================================
// API ENDPOINT FOR FIREBASE CONFIG
// Returns Firebase config from environment variables
// ================================================

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Only return config if all required env vars are present
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    }

    // Check if all config values are present
    const hasAllConfig = Object.values(config).every(value => value && value !== undefined)

    if (!hasAllConfig) {
      return NextResponse.json(
        { error: 'Firebase configuration not properly set' },
        { status: 500 }
      )
    }

    // Return config
    return NextResponse.json(config, {
      headers: {
        // Cache for 1 hour
        'Cache-Control': 'public, max-age=3600',
      }
    })

  } catch (error) {
    console.error('Error fetching Firebase config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Firebase configuration' },
      { status: 500 }
    )
  }
}