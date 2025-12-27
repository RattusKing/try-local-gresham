'use client'

import { useState } from 'react'
import { Business, SubscriptionStatus } from '@/lib/types'
import { useAuth } from '@/lib/firebase/auth-context'
import './SubscriptionManager.css'

interface SubscriptionManagerProps {
  business: Business
  onSubscriptionUpdate?: () => void
}

export default function SubscriptionManager({ business, onSubscriptionUpdate }: SubscriptionManagerProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const hasActiveSubscription = business.subscriptionStatus === 'active' ||
                                business.subscriptionStatus === 'trialing'

  const handleSubscribe = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: business.id,
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || business.name,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: business.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open subscription management')
      }

      // Redirect to Stripe Customer Portal
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const getStatusBadge = (status?: SubscriptionStatus) => {
    if (!status) return null

    const badges: Record<SubscriptionStatus, { label: string; className: string }> = {
      active: { label: 'Active', className: 'status-active' },
      trialing: { label: 'Free Trial', className: 'status-trial' },
      past_due: { label: 'Past Due', className: 'status-past-due' },
      canceled: { label: 'Canceled', className: 'status-canceled' },
      incomplete: { label: 'Incomplete', className: 'status-incomplete' },
      unpaid: { label: 'Unpaid', className: 'status-unpaid' },
    }

    const badge = badges[status]
    return <span className={`subscription-status-badge ${badge.className}`}>{badge.label}</span>
  }

  const formatDate = (date?: Date) => {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="subscription-manager">
      <h2>Subscription</h2>

      {error && <div className="error-message">{error}</div>}

      {!hasActiveSubscription ? (
        <div className="subscription-inactive">
          <div className="subscription-plan">
            <h3>Business Subscription</h3>
            <div className="subscription-price">
              <span className="price-amount">$39</span>
              <span className="price-period">/month</span>
            </div>

            <div className="subscription-features">
              <ul>
                <li>✓ Full marketplace listing</li>
                <li>✓ Product catalog management</li>
                <li>✓ Order management system</li>
                <li>✓ Appointment scheduling</li>
                <li>✓ Analytics dashboard</li>
                <li>✓ Discount code creation</li>
                <li>✓ Customer reviews</li>
                <li>✓ Direct payment processing</li>
              </ul>
            </div>

            <div className="first-month-promo">
              <p className="promo-badge">🎉 Limited Time Offer</p>
              <p className="promo-text">
                First 10 businesses get their <strong>first month FREE!</strong>
              </p>
            </div>

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="btn-primary btn-subscribe"
            >
              {loading ? 'Processing...' : 'Start Subscription'}
            </button>

            <p className="subscription-note">
              Cancel anytime. No long-term commitments.
            </p>
          </div>
        </div>
      ) : (
        <div className="subscription-active">
          <div className="subscription-info">
            <div className="subscription-header">
              <h3>Business Subscription</h3>
              {getStatusBadge(business.subscriptionStatus)}
            </div>

            <div className="subscription-details">
              <div className="detail-item">
                <span className="detail-label">Price:</span>
                <span className="detail-value">$39/month</span>
              </div>

              {business.hasFirstMonthFree && (
                <div className="detail-item highlight">
                  <span className="detail-label">Promotion:</span>
                  <span className="detail-value">First Month Free! 🎉</span>
                </div>
              )}

              {business.subscriptionStatus === 'trialing' && (
                <div className="detail-item highlight">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">Free trial active until {formatDate(business.subscriptionCurrentPeriodEnd)}</span>
                </div>
              )}

              {business.subscriptionCurrentPeriodEnd && business.subscriptionStatus === 'active' && (
                <div className="detail-item">
                  <span className="detail-label">Next billing date:</span>
                  <span className="detail-value">{formatDate(business.subscriptionCurrentPeriodEnd)}</span>
                </div>
              )}

              {business.subscriptionCancelAtPeriodEnd && (
                <div className="detail-item warning">
                  <span className="detail-label">⚠️ Scheduled to cancel:</span>
                  <span className="detail-value">{formatDate(business.subscriptionCurrentPeriodEnd)}</span>
                </div>
              )}

              {business.subscriptionStatus === 'past_due' && (
                <div className="detail-item error">
                  <span className="detail-label">⚠️ Payment Issue:</span>
                  <span className="detail-value">Please update your payment method</span>
                </div>
              )}
            </div>

            <button
              onClick={handleManageSubscription}
              disabled={loading}
              className="btn-secondary"
            >
              {loading ? 'Loading...' : 'Manage Subscription'}
            </button>

            <p className="subscription-note">
              Manage payment methods, view invoices, or cancel your subscription.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
