import type { Metadata } from 'next'
import ForBusinessesPage from './_client'

export const metadata: Metadata = {
  title: 'List Your Business | Try Local Gresham',
  description: 'Join Gresham local business marketplace. Get discovered by local customers, manage orders, and grow your business online.',
  openGraph: {
    title: 'List Your Business | Try Local Gresham',
    description: 'Join Gresham local business marketplace. Get discovered by local customers, manage orders, and grow your business online.',
  },
}

export default function Page() {
  return <ForBusinessesPage />
}
