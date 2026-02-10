'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console
    logger.error('Error boundary caught:', error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: '#F7F7F5',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          width: '100%',
          background: 'white',
          borderRadius: '18px',
          padding: '40px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '24px',
          }}
        >
          ⚠️
        </div>

        <h2
          style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#373737',
            margin: '0 0 12px',
          }}
        >
          Something went wrong
        </h2>

        <p
          style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: '0 0 24px',
            lineHeight: '1.6',
          }}
        >
          We apologize for the inconvenience. An error occurred while processing your request.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details
            style={{
              textAlign: 'left',
              background: '#f9f9f9',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '14px',
              fontFamily: 'monospace',
            }}
          >
            <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '8px' }}>
              Error Details (Development Only)
            </summary>
            <pre
              style={{
                margin: '8px 0 0',
                overflow: 'auto',
                fontSize: '12px',
                lineHeight: '1.5',
              }}
            >
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '12px 24px',
              borderRadius: '999px',
              border: 'none',
              background: '#c2aff0',
              color: '#000',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
          >
            Try again
          </button>

          <Link
            href="/"
            style={{
              padding: '12px 24px',
              borderRadius: '999px',
              border: '2px solid #373737',
              background: 'white',
              color: '#373737',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '16px',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
