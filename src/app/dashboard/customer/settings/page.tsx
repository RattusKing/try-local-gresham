'use client'

import { useAuth } from '@/lib/firebase/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import NotificationSettings from '@/components/NotificationSettings'
import Link from 'next/link'

export default function CustomerSettings() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="customer-dashboard">
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <Link href="/dashboard/customer" className="back-link" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--primary)',
          textDecoration: 'none',
          marginBottom: '1rem'
        }}>
          ← Back to Dashboard
        </Link>
        <h1>Settings</h1>
      </div>

      <NotificationSettings />

      <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f9fafb', borderRadius: '12px' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: '#111827' }}>Need Help?</h3>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
          If you have questions about notifications or your account, contact us at{' '}
          <a href="mailto:support@try-local.com" style={{ color: 'var(--primary)' }}>
            support@try-local.com
          </a>
        </p>
      </div>
    </div>
  )
}
