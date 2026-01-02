import { NextRequest, NextResponse } from 'next/server'
import { stripe, calculatePlatformFee } from '@/lib/stripe/config'
import { getAdminDb } from '@/lib/firebase/admin'

export async function POST(req: NextRequest) {
  try {
    const { amount, businessId, orderId, customerEmail } = await req.json()

    if (!amount || !businessId) {
      return NextResponse.json(
        { error: 'Amount and business ID are required' },
        { status: 400 }
      )
    }

    // Validate amount (must be at least $0.50 for Stripe)
    if (amount < 50) {
      return NextResponse.json(
        { error: 'Amount must be at least $0.50' },
        { status: 400 }
      )
    }

    // Get business Stripe account
    const adminDb = getAdminDb()
    const businessRef = adminDb.collection('businesses').doc(businessId)
    const businessDoc = await businessRef.get()

    if (!businessDoc.exists) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    const businessData = businessDoc.data()!

    // Check if business has Stripe Connect account
    if (!businessData.stripeConnectedAccountId) {
      return NextResponse.json(
        {
          error: 'Business has not set up payment processing yet',
          needsOnboarding: true
        },
        { status: 400 }
      )
    }

    // Check if account is verified
    if (businessData.stripeAccountStatus !== 'verified') {
      return NextResponse.json(
        {
          error: 'Business payment account is not yet verified',
          accountStatus: businessData.stripeAccountStatus
        },
        { status: 400 }
      )
    }

    // Calculate platform fee (2% of total)
    const platformFeeAmount = calculatePlatformFee(amount)

    // Create payment intent with Connect
    // Using "destination" charge - platform receives payment, business gets transfer
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: 'usd',
      application_fee_amount: platformFeeAmount, // Platform fee (2%)
      transfer_data: {
        destination: businessData.stripeConnectedAccountId, // Business receives 98%
      },
      receipt_email: customerEmail || undefined,
      metadata: {
        businessId: businessId,
        orderId: orderId || '',
        platformFee: platformFeeAmount.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      platformFee: platformFeeAmount,
    })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      // Detect test/live mode mismatch
      if (error.message && error.message.includes('similar object exists in test mode')) {
        return NextResponse.json(
          {
            error: 'Payment setup error: The business account was set up in test mode, but live mode is active. Please contact support.',
            devMessage: 'Test/live mode mismatch: Business connected account is from test mode but live API keys are being used.'
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
