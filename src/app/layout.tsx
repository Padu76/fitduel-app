import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FitDuel - Sfida, Allenati, Domina',
  description: 'Trasforma il fitness in una sfida epica. Compete con amici, sali di livello, diventa il campione!',
  keywords: 'fitness, duel, sfide, allenamento, gamification, workout, exercise, competition, fitduel',
  authors: [{ name: 'FitDuel Team' }],
  creator: 'FitDuel',
  publisher: 'FitDuel',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)', color: '#4f46e5' }
  ],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://fit-duel.com',
    languages: {
      'it-IT': 'https://fit-duel.it',
      'en-US': 'https://fit-duel.com',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    alternateLocale: ['en_US'],
    url: 'https://fit-duel.com',
    siteName: 'FitDuel',
    title: 'FitDuel - Sfida, Allenati, Domina',
    description: 'Trasforma il fitness in una sfida epica. Compete con amici, sali di livello!',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FitDuel - Fitness Gamification Platform',
      },
      {
        url: '/og-image-square.png',
        width: 600,
        height: 600,
        alt: 'FitDuel Logo',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@fitduel',
    creator: '@fitduel',
    title: 'FitDuel - Sfida, Allenati, Domina',
    description: 'Trasforma il fitness in una sfida epica',
    images: ['/twitter-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png' },
      { url: '/apple-touch-icon-180x180.png', sizes: '180x180' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#6366f1',
      },
    ],
  },
  verification: {
    google: 'google-verification-code',
    yandex: 'yandex-verification-code',
  },
  category: 'sports fitness',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className="h-full">
      <body className={`${inter.className} h-full bg-gray-950 text-white antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}