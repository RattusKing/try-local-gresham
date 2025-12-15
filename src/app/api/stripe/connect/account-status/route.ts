import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { getAdminDb } from '@/lib/firebase/admin'

export async function POST(req: NextRequest) {
  try {
    const { accountId, businessId } = await req.json()

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }

    // Retrieve account from Stripe
    const account = await stripe.accounts.retrieve(accountId)

    // Check if charges and payouts are enabled
    const chargesEnabled = account.charges_enabled
    const payoutsEnabled = account.payouts_enabled
    const detailsSubmitted = account.details_submitted

    // Determine account status
    let accountStatus: 'pending' | 'verified' | 'restricted' = 'pending'
    if (chargesEnabled && payoutsEnabled && detailsSubmitted) {
      accountStatus = 'verified'
    } else if (account.requirements?.disabled_reason) {
      accountStatus = 'restricted'
    }

    // Update business in Firestore if businessId is provided
    if (businessId) {
      const adminDb = getAdminDb()
      const businessRef = adminDb.collection('businesses').doc(businessId)
      await businessRef.update({
        stripeAccountStatus: accountStatus,
        payoutsEnabled: payoutsEnabled,
        stripeOnboardingCompletedAt: detailsSubmitted ? new Date() : null,
        updatedAt: new Date(),
      })
    }

    return NextResponse.json({
      accountId: account.id,
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted,
      accountStatus,
      requirements: account.requirements,
    })
  } catch (error) {
    console.error('Error retrieving account status:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve account status' },
      { status: 500 }
    )
  }
}
