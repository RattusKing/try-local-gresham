import Stripe from 'stripe'

// Platform fee percentage (2%)
export const PLATFORM_FEE_PERCENTAGE = 0.02

// Helper function to calculate platform fee
export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * PLATFORM_FEE_PERCENTAGE)
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
