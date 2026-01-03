import { Business } from './types'

// Grace period: 7 days after approval before subscription is required
const GRACE_PERIOD_DAYS = 7

export interface SubscriptionCheckResult {
  requiresSubscription: boolean
  reason?: string
  daysRemaining?: number
  isGrandfathered: boolean
  hasActiveSubscription: boolean
  inGracePeriod: boolean
}

/**
 * Check if a business requires an active subscription to use the platform
 *
 * Businesses are exempt from subscription requirements if:
 * 1. They are grandfathered (early adopters marked as exempt)
 * 2. They are within the 7-day grace period after approval
 * 3. They have an active or trialing subscription
 *
 * @param business The business to check
 * @returns SubscriptionCheckResult with details about subscription status
 */
export function checkSubscriptionRequired(business: Business | null): SubscriptionCheckResult {
  // If no business exists, subscription is required
  if (!business) {
    return {
      requiresSubscription: true,
      reason: 'No business profile found',
      isGrandfathered: false,
      hasActiveSubscription: false,
      inGracePeriod: false,
    }
  }

  // 1. Check if grandfathered (exempt from subscription requirements)
  if (business.grandfathered === true) {
    return {
      requiresSubscription: false,
      isGrandfathered: true,
      hasActiveSubscription: false,
      inGracePeriod: false,
    }
  }

  // 2. Check if has active subscription
  const hasActiveSubscription =
    business.subscriptionStatus === 'active' ||
    business.subscriptionStatus === 'trialing'

  if (hasActiveSubscription) {
    return {
      requiresSubscription: false,
      isGrandfathered: false,
      hasActiveSubscription: true,
      inGracePeriod: false,
    }
  }

  // 3. Check grace period (7 days after approval)
  if (business.approvedAt) {
    const approvalDate = business.approvedAt instanceof Date
      ? business.approvedAt
      : new Date(business.approvedAt)

    const now = new Date()
    const daysSinceApproval = Math.floor(
      (now.getTime() - approvalDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    const daysRemaining = GRACE_PERIOD_DAYS - daysSinceApproval

    if (daysRemaining > 0) {
      return {
        requiresSubscription: false,
        daysRemaining,
        inGracePeriod: true,
        isGrandfathered: false,
        hasActiveSubscription: false,
      }
    }

    // Grace period expired
    return {
      requiresSubscription: true,
      reason: 'Grace period expired. Please subscribe to continue using the platform.',
      isGrandfathered: false,
      hasActiveSubscription: false,
      inGracePeriod: false,
    }
  }

  // 4. No approval date - check if status is approved (legacy case)
  // If approved but no approvedAt date, give them benefit of grace period from now
  if (business.status === 'approved') {
    return {
      requiresSubscription: false,
      reason: 'Please subscribe to continue using the platform after the grace period.',
      daysRemaining: GRACE_PERIOD_DAYS,
      inGracePeriod: true,
      isGrandfathered: false,
      hasActiveSubscription: false,
    }
  }

  // 5. Not approved yet - no subscription required during application phase
  return {
    requiresSubscription: false,
    reason: 'Subscription will be required after approval',
    isGrandfathered: false,
    hasActiveSubscription: false,
    inGracePeriod: false,
  }
}

/**
 * Check if a business can accept customer orders and payments
 * Requires both subscription AND Stripe Connect verification
 */
export function canAcceptPayments(business: Business | null): {
  canAccept: boolean
  reason?: string
} {
  if (!business) {
    return { canAccept: false, reason: 'No business profile found' }
  }

  // Check subscription requirement first
  const subCheck = checkSubscriptionRequired(business)
  if (subCheck.requiresSubscription) {
    return {
      canAccept: false,
      reason: subCheck.reason || 'Active subscription required to accept payments'
    }
  }

  // Check Stripe Connect status
  if (!business.stripeConnectedAccountId) {
    return {
      canAccept: false,
      reason: 'Payment processing not set up. Please connect your Stripe account.'
    }
  }

  if (business.stripeAccountStatus !== 'verified') {
    return {
      canAccept: false,
      reason: 'Payment account verification pending. Please complete Stripe onboarding.'
    }
  }

  return { canAccept: true }
}

/**
 * Get a user-friendly message about subscription status
 */
export function getSubscriptionMessage(result: SubscriptionCheckResult): string {
  if (result.isGrandfathered) {
    return "Your business is exempt from subscription fees as an early adopter. Thank you for being part of our community!"
  }

  if (result.hasActiveSubscription) {
    return "Your subscription is active. Thank you for supporting local Gresham businesses!"
  }

  if (result.inGracePeriod && result.daysRemaining) {
    return `You have ${result.daysRemaining} day${result.daysRemaining === 1 ? '' : 's'} remaining in your grace period. Subscribe now to continue using the platform.`
  }

  if (result.requiresSubscription) {
    return result.reason || 'An active subscription is required to use this platform.'
  }

  return 'Subscription will be required after your business is approved.'
}
