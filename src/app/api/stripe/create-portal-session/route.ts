import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { getAdminDb } from '@/lib/firebase/admin'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const { businessId } = await req.json()

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      )
    }

    const adminDb = getAdminDb()

    // Get business to retrieve customer ID
    const businessRef = adminDb.collection('businesses').doc(businessId)
    const businessDoc = await businessRef.get()

    if (!businessDoc.exists) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    const businessData = businessDoc.data()!

    if (!businessData.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found for this business' },
        { status: 400 }
      )
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: businessData.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/business`,
    })

    return NextResponse.json({
      url: session.url,
    })
  } catch (error: any) {
    logger.error('Error creating portal session:', error)

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create customer portal session' },
      { status: 500 }
    )
  }
}
