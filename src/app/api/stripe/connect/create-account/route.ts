import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { getAdminDb } from '@/lib/firebase/admin'

export async function POST(req: NextRequest) {
  try {
    const { businessId, email, businessName } = await req.json()

    if (!businessId || !email) {
      return NextResponse.json(
        { error: 'Business ID and email are required' },
        { status: 400 }
      )
    }

    // Get admin database
    const adminDb = getAdminDb()

    // Check if business exists
    const businessRef = adminDb.collection('businesses').doc(businessId)
    const businessDoc = await businessRef.get()

    if (!businessDoc.exists) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    const businessData = businessDoc.data()!

    // Check if account already exists
    if (businessData.stripeConnectedAccountId) {
      return NextResponse.json(
        {
          accountId: businessData.stripeConnectedAccountId,
          message: 'Account already exists'
        },
        { status: 200 }
      )
    }

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      email: email,
      business_type: 'individual', // Can be changed to 'company' if needed
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: businessName || businessData.name,
        url: businessData.website || undefined,
      },
      metadata: {
        businessId: businessId,
      },
    })

    // Update business with Stripe account ID
    await businessRef.update({
      stripeConnectedAccountId: account.id,
      stripeAccountStatus: 'pending',
      payoutsEnabled: false,
      updatedAt: new Date(),
    })

    return NextResponse.json({
      accountId: account.id,
      message: 'Stripe Connect account created successfully',
    })
  } catch (error: any) {
    console.error('Error creating Stripe Connect account:', error)

    // Provide detailed error messages
    let errorMessage = 'Failed to create Stripe Connect account'

    if (error.type === 'StripeInvalidRequestError') {
      errorMessage = `Stripe error: ${error.message}`
    } else if (error.type === 'StripeAuthenticationError') {
      errorMessage = 'Stripe API key is invalid or not set correctly'
    } else if (error.message) {
      errorMessage = error.message
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error.message || 'Unknown error',
        type: error.type || 'Unknown'
      },
      { status: 500 }
    )
  }
}
