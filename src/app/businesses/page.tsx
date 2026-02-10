import type { Metadata } from 'next'
import BusinessesPage from './_client'

export const metadata: Metadata = {
  title: 'Browse Local Businesses | Try Local Gresham',
  description: 'Discover local businesses in Gresham, Oregon. Browse coffee shops, boutiques, restaurants, services, and more in your neighborhood.',
  openGraph: {
    title: 'Browse Local Businesses | Try Local Gresham',
    description: 'Discover local businesses in Gresham, Oregon. Browse coffee shops, boutiques, restaurants, services, and more in your neighborhood.',
  },
}

export default function Page() {
  return <BusinessesPage />
}
