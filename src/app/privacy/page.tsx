import type { Metadata } from 'next'
import PrivacyPage from './_client'

export const metadata: Metadata = {
  title: 'Privacy Policy | Try Local Gresham',
  description: 'Learn how Try Local Gresham collects, uses, and protects your personal information.',
  openGraph: {
    title: 'Privacy Policy | Try Local Gresham',
    description: 'Learn how Try Local Gresham collects, uses, and protects your personal information.',
  },
}

export default function Page() {
  return <PrivacyPage />
}
