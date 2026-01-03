import Stripe from 'stripe'
import { SubscriptionTier } from '@/lib/types'

// Platform fee percentage (2%)
export const PLATFORM_FEE_PERCENTAGE = 0.02

// Helper function to calculate platform fee
export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * PLATFORM_FEE_PERCENTAGE)
}

// Get Stripe Price ID based on subscription tier
export function getSubscriptionPriceId(tier: SubscriptionTier = 'monthly'): string {
  let priceId: string | undefined

  switch (tier) {
    case 'monthly':
      priceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID_MONTHLY || process.env.STRIPE_SUBSCRIPTION_PRICE_ID
      break
    case 'yearly':
      priceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID_YEARLY
      break
    case 'nonprofit':
      // Non-profits don't need a Stripe price ID (they get free access)
      // But if you want to track them in Stripe, you could create a $0 price
      return '' // Return empty string - non-profits don't use Stripe subscriptions
    default:
      priceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID
  }

  if (!priceId) {
    throw new Error(
      `STRIPE_SUBSCRIPTION_PRICE_ID_${tier.toUpperCase()} is not set in environment variables. ` +
      'Please create a subscription product in Stripe and add the price ID to your .env.local file.'
    )
  }

  return priceId
}

// Legacy function for backwards compatibility
export function getMonthlySubscriptionPriceId(): string {
  return getSubscriptionPriceId('monthly')
}

// Lazy initialization of Stripe - only creates instance when needed
// This prevents build-time errors when env vars aren't available
let stripeInstance: Stripe | null = null

function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY

    if (!secretKey) {
      throw new Error(
        'STRIPE_SECRET_KEY is not set in environment variables. ' +
        'Please add it to your .env.local file.'
      )
    }

    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    })
  }

  return stripeInstance
}

// Export a getter function instead of the instance directly
export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    const stripeInstance = getStripe()
    const value = stripeInstance[prop as keyof Stripe]

    // Bind methods to the stripe instance
    if (typeof value === 'function') {
      return value.bind(stripeInstance)
    }

    return value
  }
})
