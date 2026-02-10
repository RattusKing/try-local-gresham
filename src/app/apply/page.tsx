import type { Metadata } from 'next'
import ApplyPage from './_client'

export const metadata: Metadata = {
  title: 'Apply to Join | Try Local Gresham',
  description: 'Apply to list your business on Try Local Gresham. Connect with local customers and grow your business in the Gresham community.',
  openGraph: {
    title: 'Apply to Join | Try Local Gresham',
    description: 'Apply to list your business on Try Local Gresham. Connect with local customers and grow your business in the Gresham community.',
  },
}

export default function Page() {
  return <ApplyPage />
}
