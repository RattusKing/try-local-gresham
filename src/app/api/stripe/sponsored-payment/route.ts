import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { getAdminDb } from '@/lib/firebase/admin'
import { SPONSORED_BANNER_PRICING } from '@/lib/types'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const { bannerId, businessId, durationDays, customerEmail } = await req.json()

    if (!bannerId || !businessId || !durationDays) {
      return NextResponse.json(
        { error: 'Banner ID, business ID, and duration are required' },
        { status: 400 }
      )
    }

    // Get pricing for the selected duration
    const pricingKey = String(durationDays) as keyof typeof SPONSORED_BANNER_PRICING
    const pricing = SPONSORED_BANNER_PRICING[pricingKey]

    if (!pricing) {
      return NextResponse.json(
        { error: 'Invalid duration selected' },
        { status: 400 }
      )
    }

    // Verify the banner exists and is approved
    const adminDb = getAdminDb()
    const bannerRef = adminDb.collection('sponsoredBanners').doc(bannerId)
    const bannerDoc = await bannerRef.get()

    if (!bannerDoc.exists) {
      return NextResponse.json(
        { error: 'Sponsored banner not found' },
        { status: 404 }
      )
    }

    const bannerData = bannerDoc.data()!

    if (bannerData.status !== 'approved') {
      return NextResponse.json(
        { error: 'Banner must be approved before payment' },
        { status: 400 }
      )
    }

    if (bannerData.isPaid) {
      return NextResponse.json(
        { error: 'Banner has already been paid for' },
        { status: 400 }
      )
    }

    // Verify the business ID matches
    if (bannerData.businessId !== businessId) {
      return NextResponse.json(
        { error: 'Business ID mismatch' },
        { status: 400 }
      )
    }

    // Create payment intent (goes to platform, not a connected account)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pricing.price, // Amount in cents
      currency: 'usd',
      receipt_email: customerEmail || undefined,
      metadata: {
        type: 'sponsored_banner',
        bannerId: bannerId,
        businessId: businessId,
        businessName: bannerData.businessName || '',
        durationDays: String(durationDays),
      },
      automatic_payment_methods: {
        enabled: true,
      },
      description: `Sponsored Banner - ${pricing.label} for ${bannerData.businessName}`,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: pricing.price,
      displayPrice: pricing.displayPrice,
    })
  } catch (error: any) {
    logger.error('Error creating sponsored payment intent:', error)

    if (error.type === 'StripeInvalidRequestError') {
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

// Endpoint to confirm payment and activate banner
export async function PUT(req: NextRequest) {
  try {
    const { bannerId, paymentIntentId } = await req.json()

    if (!bannerId || !paymentIntentId) {
      return NextResponse.json(
        { error: 'Banner ID and payment intent ID are required' },
        { status: 400 }
      )
    }

    // Verify payment was successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment has not been completed' },
        { status: 400 }
      )
    }

    // Verify metadata matches
    if (paymentIntent.metadata.bannerId !== bannerId) {
      return NextResponse.json(
        { error: 'Payment intent does not match banner' },
        { status: 400 }
      )
    }

    // Get banner and update it
    const adminDb = getAdminDb()
    const bannerRef = adminDb.collection('sponsoredBanners').doc(bannerId)
    const bannerDoc = await bannerRef.get()

    if (!bannerDoc.exists) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      )
    }

    const bannerData = bannerDoc.data()!

    // Calculate start and end dates
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + bannerData.durationDays)

    // Update banner to active
    await bannerRef.update({
      status: 'active',
      isPaid: true,
      stripePaymentIntentId: paymentIntentId,
      amountPaid: paymentIntent.amount,
      startDate: startDate,
      endDate: endDate,
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    })
  } catch (error: any) {
    logger.error('Error confirming sponsored payment:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}
