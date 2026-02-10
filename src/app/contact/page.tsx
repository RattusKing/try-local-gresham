import type { Metadata } from 'next'
import ContactPage from './_client'

export const metadata: Metadata = {
  title: 'Contact Us | Try Local Gresham',
  description: 'Get in touch with Try Local Gresham. We are here to help with questions about our local business marketplace.',
  openGraph: {
    title: 'Contact Us | Try Local Gresham',
    description: 'Get in touch with Try Local Gresham. We are here to help with questions about our local business marketplace.',
  },
}

export default function Page() {
  return <ContactPage />
}
