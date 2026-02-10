import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { getAdminDb } from '@/lib/firebase/admin'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user from Firestore
    const adminDb = getAdminDb()
    const userRef = adminDb.collection('users').doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()!

    // Get or create Stripe customer
    let stripeCustomerId = userData.stripeCustomerId

    if (!stripeCustomerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userData.email,
        name: userData.displayName || undefined,
        metadata: {
          firebaseUserId: userId,
        },
      })

      stripeCustomerId = customer.id

      // Save Stripe customer ID to Firestore
      await userRef.update({
        stripeCustomerId: customer.id,
      })
    }

    // Create SetupIntent for saving payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      metadata: {
        firebaseUserId: userId,
      },
    })

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    })
  } catch (error: any) {
    logger.error('Error creating setup intent:', error)
    return NextResponse.json(
      { error: 'Failed to create setup intent' },
      { status: 500 }
    )
  }
}
