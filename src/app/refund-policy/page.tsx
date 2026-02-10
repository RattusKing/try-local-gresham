import type { Metadata } from 'next'
import RefundPolicyPage from './_client'

export const metadata: Metadata = {
  title: 'Refund Policy | Try Local Gresham',
  description: 'Understand our refund and return policies for products, services, and subscriptions on Try Local Gresham.',
  openGraph: {
    title: 'Refund Policy | Try Local Gresham',
    description: 'Understand our refund and return policies for products, services, and subscriptions on Try Local Gresham.',
  },
}

export default function Page() {
  return <RefundPolicyPage />
}
