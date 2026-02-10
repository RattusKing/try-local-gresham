'use client'

import { useState } from 'react'
import { Business, SubscriptionStatus, SubscriptionTier, SUBSCRIPTION_TIERS } from '@/lib/types'
import { useAuth } from '@/lib/firebase/auth-context'
import { checkSubscriptionRequired } from '@/lib/subscription'
import { CONTACT_EMAILS } from '@/lib/site-config'
import './SubscriptionManager.css'

interface SubscriptionManagerProps {
  business: Business
  onSubscriptionUpdate?: () => void
}

export default function SubscriptionManager({ business, onSubscriptionUpdate }: SubscriptionManagerProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('yearly') // Default to yearly (better value)

  const hasActiveSubscription = business.subscriptionStatus === 'active' ||
                                business.subscriptionStatus === 'trialing'

  const subCheck = checkSubscriptionRequired(business)

  const handleSubscribe = async (tier: SubscriptionTier) => {
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
          tier, // Pass selected tier to API
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

  // Don't show subscription selector for non-profits or grandfathered businesses
  if (subCheck.isNonProfit || subCheck.isGrandfathered) {
    return (
      <div className="subscription-manager">
        <h2>Subscription</h2>
        <div className="subscription-exempt">
          <div className="exempt-badge">
            {subCheck.isNonProfit ? '🎁 Non-Profit' : '⭐ Early Adopter'}
          </div>
          <p className="exempt-message">
            {subCheck.isNonProfit
              ? 'Your non-profit organization has free access to the platform. Thank you for serving our community!'
              : 'Your business is exempt from subscription fees as an early adopter. Thank you for being part of our community!'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="subscription-manager">
      <h2>Subscription</h2>

      {error && <div className="error-message">{error}</div>}

      {!hasActiveSubscription ? (
        <div className="subscription-inactive">
          <p className="subscription-intro">Choose the plan that works best for your business:</p>

          <div className="subscription-tiers">
            {/* Monthly Plan */}
            <div
              className={`subscription-tier ${selectedTier === 'monthly' ? 'selected' : ''}`}
              onClick={() => setSelectedTier('monthly')}
            >
              <div className="tier-header">
                <h3>Monthly Plan</h3>
              </div>
              <div className="tier-price">
                <span className="price-amount">$39</span>
                <span className="price-period">/month</span>
              </div>
              <div className="tier-billing">Billed monthly</div>
              <div className="tier-annual-cost">$468/year</div>
            </div>

            {/* Yearly Plan (Recommended) */}
            <div
              className={`subscription-tier ${selectedTier === 'yearly' ? 'selected' : ''} recommended`}
              onClick={() => setSelectedTier('yearly')}
            >
              <div className="tier-recommended-badge">Best Value</div>
              <div className="tier-header">
                <h3>Annual Plan</h3>
              </div>
              <div className="tier-price">
                <span className="price-amount">$430</span>
                <span className="price-period">/year</span>
              </div>
              <div className="tier-billing">Billed annually</div>
              <div className="tier-savings">Save $38/year</div>
            </div>
          </div>

          <div className="subscription-features">
            <h4>All plans include:</h4>
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
            onClick={() => handleSubscribe(selectedTier)}
            disabled={loading}
            className="btn-primary btn-subscribe"
          >
            {loading
              ? 'Processing...'
              : `Subscribe - ${SUBSCRIPTION_TIERS[selectedTier].description}`}
          </button>

          <p className="subscription-note">
            Cancel anytime. No long-term commitments. <br />
            <em>Non-profit organization? <a href={`mailto:${CONTACT_EMAILS.support}`}>Contact us</a> for free access.</em>
          </p>
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
                <span className="detail-label">Plan:</span>
                <span className="detail-value">
                  {business.subscriptionTier
                    ? SUBSCRIPTION_TIERS[business.subscriptionTier].displayName
                    : 'Monthly Plan'}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Price:</span>
                <span className="detail-value">
                  {business.subscriptionTier
                    ? SUBSCRIPTION_TIERS[business.subscriptionTier].description
                    : '$39/month'}
                </span>
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
