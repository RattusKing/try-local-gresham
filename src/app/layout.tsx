import type { Metadata } from 'next'
import Analytics from '@/components/Analytics'
import CookieConsent from '@/components/CookieConsent'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Try Local — Gresham, Oregon | Shop Local, Support Your Neighbors',
  description: 'Discover and support small businesses in Gresham, Oregon. Find coffee, boutiques, services, and more — from the heart of Gresham. Building a stronger Gresham, one local business at a time.',
  keywords: ['Gresham', 'Oregon', 'local business', 'shop local', 'small business', 'marketplace', 'community'],
  authors: [{ name: 'Try Local' }],
  creator: 'Try Local',
  publisher: 'Try Local',
  metadataBase: new URL('https://trylocalor.com'),
  openGraph: {
    title: 'Try Local — Gresham, Oregon',
    description: 'Shop Gresham. Support your neighbors. Find coffee, boutiques, services, and more.',
    url: 'https://trylocalor.com',
    siteName: 'Try Local Gresham',
    images: [
      {
        url: '/assets/gresham.jpg',
        width: 1200,
        height: 630,
        alt: 'Try Local Gresham',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Try Local — Gresham, Oregon',
    description: 'Shop Gresham. Support your neighbors.',
    images: ['/assets/gresham.jpg'],
  },
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
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Preload critical assets for better performance */}
        <link rel="preload" href="/assets/gresham.jpg" as="image" />

        {/* Font optimization */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Analytics />
        <Providers>{children}</Providers>
        <CookieConsent />
      </body>
    </html>
  )
}
