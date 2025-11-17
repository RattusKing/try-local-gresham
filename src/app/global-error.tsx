'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error monitoring service
    if (process.env.NODE_ENV === 'development') {
      console.error('Global error:', error)
    }

    // Send to Sentry if configured
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(error, {
          tags: {
            errorBoundary: 'global',
          },
          level: 'fatal',
        })
      })
    }
  }, [error])

  return (
    <html>
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: '#F7F7F5',
            fontFamily: 'Inter, system-ui, sans-serif',
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
              Critical Error
            </h2>

            <p
              style={{
                fontSize: '16px',
                color: '#6b7280',
                margin: '0 0 24px',
                lineHeight: '1.6',
              }}
            >
              A critical error occurred. Please try reloading the page or contact support if the
              problem persists.
            </p>

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

              <a
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
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
