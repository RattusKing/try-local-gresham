'use client'

import { Business } from '@/lib/types'
import { checkSubscriptionRequired, getSubscriptionMessage } from '@/lib/subscription'
import Link from 'next/link'

interface SubscriptionRequiredBannerProps {
  business: Business
}

export default function SubscriptionRequiredBanner({ business }: SubscriptionRequiredBannerProps) {
  const subCheck = checkSubscriptionRequired(business)

  // Don't show banner if subscription is not required
  if (!subCheck.requiresSubscription && !subCheck.inGracePeriod) {
    return null
  }

  // Grace period warning banner (yellow)
  if (subCheck.inGracePeriod && subCheck.daysRemaining) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 152, 0, 0.1))',
        border: '2px solid #ff9800',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '2rem' }}>⏰</div>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: '1.25rem',
            marginBottom: '0.5rem',
            color: '#e65100',
            fontWeight: 600
          }}>
            Grace Period: {subCheck.daysRemaining} Day{subCheck.daysRemaining === 1 ? '' : 's'} Remaining
          </h3>
          <p style={{ marginBottom: '0.75rem', color: '#666' }}>
            {getSubscriptionMessage(subCheck)}
          </p>
          <Link
            href="#subscription"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById('subscription-section')?.scrollIntoView({ behavior: 'smooth' })
            }}
            style={{
              display: 'inline-block',
              background: '#ff9800',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f57c00'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#ff9800'}
          >
            Subscribe Now - $39/month
          </Link>
        </div>
      </div>
    )
  }

  // Subscription required banner (red - blocking)
  if (subCheck.requiresSubscription) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.1), rgba(211, 47, 47, 0.1))',
        border: '2px solid #f44336',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '2rem' }}>🚫</div>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: '1.25rem',
            marginBottom: '0.5rem',
            color: '#c62828',
            fontWeight: 600
          }}>
            Subscription Required
          </h3>
          <p style={{ marginBottom: '0.75rem', color: '#666' }}>
            {subCheck.reason || 'Your grace period has expired. Subscribe now to continue using the platform and accepting orders.'}
          </p>
          <Link
            href="#subscription"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById('subscription-section')?.scrollIntoView({ behavior: 'smooth' })
            }}
            style={{
              display: 'inline-block',
              background: '#f44336',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#d32f2f'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f44336'}
          >
            Subscribe to Continue
          </Link>
        </div>
      </div>
    )
  }

  return null
}
