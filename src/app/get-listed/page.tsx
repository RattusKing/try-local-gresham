import type { Metadata } from 'next'
import GetListedPage from './_client'

export const metadata: Metadata = {
  title: 'Get Listed | Try Local Gresham',
  description: 'Get your Gresham business listed on Try Local. Reach local customers, manage your storefront, and accept online orders.',
  openGraph: {
    title: 'Get Listed | Try Local Gresham',
    description: 'Get your Gresham business listed on Try Local. Reach local customers, manage your storefront, and accept online orders.',
  },
}

export default function Page() {
  return <GetListedPage />
}
