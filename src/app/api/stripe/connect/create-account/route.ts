import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { db } from '@/lib/firebase/config'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

export async function POST(req: NextRequest) {
  try {
    const { businessId, email, businessName } = await req.json()

    if (!businessId || !email) {
      return NextResponse.json(
        { error: 'Business ID and email are required' },
        { status: 400 }
      )
    }

    // Check if business exists
    if (!db) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      )
    }

    const businessRef = doc(db, 'businesses', businessId)
    const businessDoc = await getDoc(businessRef)

    if (!businessDoc.exists()) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    const businessData = businessDoc.data()

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
    await updateDoc(businessRef, {
      stripeConnectedAccountId: account.id,
      stripeAccountStatus: 'pending',
      payoutsEnabled: false,
      updatedAt: new Date(),
    })

    return NextResponse.json({
      accountId: account.id,
      message: 'Stripe Connect account created successfully',
    })
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error)
    return NextResponse.json(
      { error: 'Failed to create Stripe Connect account' },
      { status: 500 }
    )
  }
}
