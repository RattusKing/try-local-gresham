import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { getAdminDb } from '@/lib/firebase/admin'
import Stripe from 'stripe'
import { logger } from '@/lib/logger'

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
      logger.error('STRIPE_WEBHOOK_SECRET is not set')
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
      logger.error('Webhook signature verification failed:', err.message)
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

      // Subscription events
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        logger.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  logger.log('Payment succeeded:', paymentIntent.id)

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
      logger.log(`Order ${orderId} payment status updated to completed`)
    } catch (error) {
      logger.error('Error updating order payment status:', error)
    }
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  logger.log('Payment failed:', paymentIntent.id)

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
      logger.log(`Order ${orderId} payment status updated to failed`)
    } catch (error) {
      logger.error('Error updating order payment status:', error)
    }
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  logger.log('Account updated:', account.id)

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

        logger.log(`Business ${businessId} Stripe account status updated to ${accountStatus}`)
      }
    } catch (error) {
      logger.error('Error updating business account status:', error)
    }
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  logger.log('Charge refunded:', charge.id)

  // Find order by charge ID
  // Note: This is simplified. In production, you'd want to query by stripeChargeId
  // For now, we'll just log it
  logger.log('Refund processed for charge:', charge.id)
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  logger.log('Checkout session completed:', session.id)

  // If this is a subscription checkout
  if (session.mode === 'subscription' && session.subscription) {
    const businessId = session.metadata?.businessId

    if (businessId) {
      try {
        const adminDb = getAdminDb()
        const businessRef = adminDb.collection('businesses').doc(businessId)

        await businessRef.update({
          stripeSubscriptionId: session.subscription,
          stripeCustomerId: session.customer,
          updatedAt: new Date(),
        })

        logger.log(`Business ${businessId} subscription session completed`)
      } catch (error) {
        logger.error('Error updating business with subscription:', error)
      }
    }
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  logger.log('Subscription created:', subscription.id)

  const businessId = subscription.metadata?.businessId
  const hasFirstMonthFree = subscription.metadata?.hasFirstMonthFree === 'true'
  const tier = subscription.metadata?.tier || 'monthly' // Default to monthly for legacy subscriptions

  if (businessId) {
    try {
      const adminDb = getAdminDb()
      const businessRef = adminDb.collection('businesses').doc(businessId)

      // Type assertion for Stripe subscription properties
      const sub = subscription as any

      await businessRef.update({
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
        subscriptionStatus: subscription.status,
        subscriptionTier: tier,
        subscriptionCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
        subscriptionCancelAtPeriodEnd: sub.cancel_at_period_end,
        hasFirstMonthFree: hasFirstMonthFree,
        subscriptionCreatedAt: new Date(),
        updatedAt: new Date(),
      })

      logger.log(`Business ${businessId} subscription created with status: ${subscription.status}, tier: ${tier}`)
    } catch (error) {
      logger.error('Error creating subscription record:', error)
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  logger.log('Subscription updated:', subscription.id)

  const businessId = subscription.metadata?.businessId

  if (businessId) {
    try {
      const adminDb = getAdminDb()
      const businessRef = adminDb.collection('businesses').doc(businessId)

      // Type assertion for Stripe subscription properties
      const sub = subscription as any

      await businessRef.update({
        subscriptionStatus: subscription.status,
        subscriptionCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
        subscriptionCancelAtPeriodEnd: sub.cancel_at_period_end,
        updatedAt: new Date(),
      })

      logger.log(`Business ${businessId} subscription updated to status: ${subscription.status}`)
    } catch (error) {
      logger.error('Error updating subscription:', error)
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logger.log('Subscription deleted:', subscription.id)

  const businessId = subscription.metadata?.businessId

  if (businessId) {
    try {
      const adminDb = getAdminDb()
      const businessRef = adminDb.collection('businesses').doc(businessId)

      await businessRef.update({
        subscriptionStatus: 'canceled',
        subscriptionCancelAtPeriodEnd: false,
        updatedAt: new Date(),
      })

      logger.log(`Business ${businessId} subscription canceled`)
    } catch (error) {
      logger.error('Error deleting subscription:', error)
    }
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  logger.log('Invoice payment succeeded:', invoice.id)

  // Type assertion for invoice properties
  const inv = invoice as any

  if (inv.subscription) {
    const subscription = await stripe.subscriptions.retrieve(inv.subscription as string)
    const businessId = subscription.metadata?.businessId

    if (businessId) {
      try {
        const adminDb = getAdminDb()
        const businessRef = adminDb.collection('businesses').doc(businessId)

        // Type assertion for Stripe subscription properties
        const sub = subscription as any

        await businessRef.update({
          subscriptionStatus: 'active',
          subscriptionCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
          updatedAt: new Date(),
        })

        logger.log(`Business ${businessId} invoice paid, subscription active`)
      } catch (error) {
        logger.error('Error updating subscription payment status:', error)
      }
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  logger.log('Invoice payment failed:', invoice.id)

  // Type assertion for invoice properties
  const inv = invoice as any

  if (inv.subscription) {
    const subscription = await stripe.subscriptions.retrieve(inv.subscription as string)
    const businessId = subscription.metadata?.businessId

    if (businessId) {
      try {
        const adminDb = getAdminDb()
        const businessRef = adminDb.collection('businesses').doc(businessId)

        await businessRef.update({
          subscriptionStatus: 'past_due',
          updatedAt: new Date(),
        })

        logger.log(`Business ${businessId} invoice payment failed, subscription past due`)
      } catch (error) {
        logger.error('Error updating subscription payment failure:', error)
      }
    }
  }
}
