import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'

export async function POST(req: NextRequest) {
  try {
    const { accountId, businessId } = await req.json()

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/dashboard/business/stripe-onboarding?businessId=${businessId}&refresh=true`,
      return_url: `${appUrl}/dashboard/business/stripe-onboarding?businessId=${businessId}&success=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      url: accountLink.url,
      message: 'Account link created successfully',
    })
  } catch (error: any) {
    console.error('Error creating account link:', error)

    // Provide detailed error information
    let errorMessage = 'Failed to create account link'
    let errorDetails = error.message || 'Unknown error'

    if (error.type === 'StripeInvalidRequestError') {
      errorMessage = `Stripe error: ${error.message}`
      errorDetails = error.raw?.message || error.message
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
