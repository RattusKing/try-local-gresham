import type { Metadata } from 'next'
import HelpPage from './_client'

export const metadata: Metadata = {
  title: 'Help Center | Try Local Gresham',
  description: 'Find answers to common questions about shopping local, managing your business listing, orders, and more on Try Local Gresham.',
  openGraph: {
    title: 'Help Center | Try Local Gresham',
    description: 'Find answers to common questions about shopping local, managing your business listing, orders, and more on Try Local Gresham.',
  },
}

export default function Page() {
  return <HelpPage />
}
