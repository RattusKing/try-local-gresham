import type { Metadata } from 'next'
import TermsPage from './_client'

export const metadata: Metadata = {
  title: 'Terms of Service | Try Local Gresham',
  description: 'Read the terms and conditions for using Try Local Gresham local business marketplace platform.',
  openGraph: {
    title: 'Terms of Service | Try Local Gresham',
    description: 'Read the terms and conditions for using Try Local Gresham local business marketplace platform.',
  },
}

export default function Page() {
  return <TermsPage />
}
