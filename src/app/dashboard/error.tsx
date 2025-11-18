'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Dashboard error:', error)
    }
  }, [error])

  return (
    <div className="dashboard-error" style={{ padding: '40px', textAlign: 'center' }}>
      <div
        style={{
          maxWidth: '500px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '18px',
          padding: '40px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>
          Dashboard Error
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          Unable to load dashboard. Please try again or contact support if the problem persists.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details
            style={{
              textAlign: 'left',
              background: '#f9f9f9',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
            }}
          >
            <summary style={{ cursor: 'pointer', fontWeight: '600' }}>Error Details</summary>
            <pre style={{ margin: '8px 0 0', fontSize: '12px', overflow: 'auto' }}>
              {error.message}
            </pre>
          </details>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '10px 20px',
              borderRadius: '999px',
              border: 'none',
              background: '#c2aff0',
              color: '#000',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <Link
            href="/"
            style={{
              padding: '10px 20px',
              borderRadius: '999px',
              border: '2px solid #373737',
              background: 'white',
              color: '#373737',
              fontWeight: '700',
              textDecoration: 'none',
            }}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
