/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'localhost',
      // Supabase storage domain - aggiorna con il tuo project ID
      'your-project-id.supabase.co',
      // Placeholder images
      'ui-avatars.com',
      'placehold.co',
      'avatars.githubusercontent.com'
    ],
  },
  experimental: {
    // Enable server actions if needed
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  // Environment variables that can be used in the browser
  env: {
    NEXT_PUBLIC_APP_NAME: 'LevelUp',
    NEXT_PUBLIC_APP_VERSION: '0.1.0',
  },
  // Redirects for better UX
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig