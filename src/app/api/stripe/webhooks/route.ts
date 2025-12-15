import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { getAdminDb } from '@/lib/firebase/admin'
import Stripe from 'stripe'

// Disable body parsing for webhooks
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      )
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not set')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account)
        break

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id)

  const orderId = paymentIntent.metadata.orderId

  if (orderId) {
    try {
      const adminDb = getAdminDb()
      const orderRef = adminDb.collection('orders').doc(orderId)
      await orderRef.update({
        paymentStatus: 'completed',
        stripePaymentIntentId: paymentIntent.id,
        stripeChargeId: paymentIntent.latest_charge,
        updatedAt: new Date(),
      })
      console.log(`Order ${orderId} payment status updated to completed`)
    } catch (error) {
      console.error('Error updating order payment status:', error)
    }
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id)

  const orderId = paymentIntent.metadata.orderId

  if (orderId) {
    try {
      const adminDb = getAdminDb()
      const orderRef = adminDb.collection('orders').doc(orderId)
      await orderRef.update({
        paymentStatus: 'failed',
        stripePaymentIntentId: paymentIntent.id,
        updatedAt: new Date(),
      })
      console.log(`Order ${orderId} payment status updated to failed`)
    } catch (error) {
      console.error('Error updating order payment status:', error)
    }
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  console.log('Account updated:', account.id)

  const businessId = account.metadata?.businessId

  if (businessId) {
    try {
      const adminDb = getAdminDb()
      const businessRef = adminDb.collection('businesses').doc(businessId)
      const businessDoc = await businessRef.get()

      if (businessDoc.exists) {
        const chargesEnabled = account.charges_enabled
        const payoutsEnabled = account.payouts_enabled
        const detailsSubmitted = account.details_submitted

        let accountStatus: 'pending' | 'verified' | 'restricted' = 'pending'
        if (chargesEnabled && payoutsEnabled && detailsSubmitted) {
          accountStatus = 'verified'
        } else if (account.requirements?.disabled_reason) {
          accountStatus = 'restricted'
        }

        await businessRef.update({
          stripeAccountStatus: accountStatus,
          payoutsEnabled: payoutsEnabled,
          stripeOnboardingCompletedAt: detailsSubmitted ? new Date() : null,
          updatedAt: new Date(),
        })

        console.log(`Business ${businessId} Stripe account status updated to ${accountStatus}`)
      }
    } catch (error) {
      console.error('Error updating business account status:', error)
    }
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('Charge refunded:', charge.id)

  // Find order by charge ID
  // Note: This is simplified. In production, you'd want to query by stripeChargeId
  // For now, we'll just log it
  console.log('Refund processed for charge:', charge.id)
}
