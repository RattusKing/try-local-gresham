'use client'

import { useAuth } from '@/lib/firebase/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user?.role === 'admin') {
      router.push('/dashboard/admin')
    } else if (user?.role === 'business_owner') {
      router.push('/dashboard/business')
    } else {
      router.push('/dashboard/customer')
    }
  }, [user, router])

  return (
    <div className="dashboard-loading">
      <div className="spinner"></div>
      <p>Redirecting...</p>
    </div>
  )
}
