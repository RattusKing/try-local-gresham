import { NextRequest, NextResponse } from 'next/server'
import { stripe, getSubscriptionPriceId } from '@/lib/stripe/config'
import { getAdminDb } from '@/lib/firebase/admin'
import { SubscriptionTier } from '@/lib/types'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const { businessId, userId, userEmail, userName, tier = 'monthly' } = await req.json()

    if (!businessId || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Business ID, user ID, and email are required' },
        { status: 400 }
      )
    }

    // Validate tier
    const validTiers: SubscriptionTier[] = ['monthly', 'yearly', 'nonprofit', 'basic_monthly', 'basic_yearly']
    if (!validTiers.includes(tier as SubscriptionTier)) {
      return NextResponse.json(
        { error: `Invalid subscription tier. Must be one of: ${validTiers.join(', ')}` },
        { status: 400 }
      )
    }

    const adminDb = getAdminDb()

    // Get business to check subscription status
    const businessRef = adminDb.collection('businesses').doc(businessId)
    const businessDoc = await businessRef.get()

    if (!businessDoc.exists) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    const businessData = businessDoc.data()!

    // Check if business already has an active subscription
    if (businessData.subscriptionStatus === 'active') {
      return NextResponse.json(
        { error: 'Business already has an active subscription' },
        { status: 400 }
      )
    }

    // Count total businesses with subscriptions to determine first-month-free eligibility
    const subscriptionsSnapshot = await adminDb
      .collection('businesses')
      .where('subscriptionStatus', 'in', ['active', 'trialing', 'past_due'])
      .get()

    const totalActiveSubscriptions = subscriptionsSnapshot.size
    const isFirstTenBusiness = totalActiveSubscriptions < 10

    // Create or retrieve Stripe customer
    let customerId = businessData.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        name: userName || businessData.name,
        metadata: {
          businessId: businessId,
          userId: userId,
        },
      })
      customerId = customer.id

      // Update business with customer ID
      await businessRef.update({
        stripeCustomerId: customerId,
        updatedAt: new Date(),
      })
    }

    // Get subscription price ID based on tier
    const priceId = getSubscriptionPriceId(tier as SubscriptionTier)

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          businessId: businessId,
          userId: userId,
          tier: tier,
          hasFirstMonthFree: isFirstTenBusiness.toString(),
        },
        // Give first 10 businesses a free trial
        // Monthly: 30 days, Yearly: 30 days
        ...(isFirstTenBusiness && {
          trial_period_days: 30,
        }),
      },
      metadata: {
        businessId: businessId,
        userId: userId,
        tier: tier,
        hasFirstMonthFree: isFirstTenBusiness.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/business?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/business?subscription=canceled`,
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      isFirstTenBusiness: isFirstTenBusiness,
      tier: tier,
    })
  } catch (error: any) {
    logger.error('Error creating subscription checkout:', error)

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create subscription checkout session' },
      { status: 500 }
    )
  }
}
