# Stripe Connect Integration Guide

Complete guide to integrating Stripe Connect into Try Local Gresham marketplace.

## Overview

This integration implements **Stripe Connect** with the **destination charges** pattern:
- Customer pays through your platform
- Platform automatically takes 2% fee
- Remaining 98% goes directly to the business's Stripe account
- Businesses get paid automatically (no manual transfers needed)

## Architecture

```
Customer → Platform (Stripe) → Split Payment:
                                ├─ Platform (2% fee)
                                └─ Business (98%)
```

## Step 1: Create Stripe Account

1. **Sign up for Stripe**
   - Go to https://dashboard.stripe.com/register
   - Use your business email for Try Local Gresham
   - Complete business verification

2. **Enable Stripe Connect**
   - Navigate to: https://dashboard.stripe.com/connect/accounts/overview
   - Click "Get Started" on Connect
   - Choose platform type: **Standard** (recommended for marketplace)

3. **Get your API keys**
   - Go to: https://dashboard.stripe.com/test/apikeys
   - Copy your **Publishable key** (starts with `pk_test_`)
   - Copy your **Secret key** (starts with `sk_test_`)
   - Keep these secure - you'll add them to `.env` later

## Step 2: Install Dependencies

```bash
npm install stripe @stripe/stripe-js
npm install --save-dev @types/stripe
```

## Step 3: Configure Environment Variables

Add to `.env.local`:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Stripe Connect
STRIPE_CONNECT_CLIENT_ID=ca_your_client_id_here

# Webhook Secret (get this after creating webhook in Step 9)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Platform Fee Percentage (2% = 0.02)
PLATFORM_FEE_PERCENTAGE=0.02
```

**Get your Connect Client ID:**
1. Go to: https://dashboard.stripe.com/settings/connect
2. Find "Client ID" under "Development"
3. Copy and paste into `.env.local`

## Step 4: Create Stripe Utility Library

Create `src/lib/stripe/config.ts`:

```typescript
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

// Initialize Stripe on server-side
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})

// Platform fee percentage (2%)
export const PLATFORM_FEE_PERCENTAGE = parseFloat(
  process.env.PLATFORM_FEE_PERCENTAGE || '0.02'
)
```

Create `src/lib/stripe/client.ts`:

```typescript
import { loadStripe } from '@stripe/stripe-js'

// Initialize Stripe.js on client-side
export const getStripe = () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  if (!publishableKey) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
  }

  return loadStripe(publishableKey)
}
```

## Step 5: Update Database Schema

### Add Stripe fields to Business type

Update `src/lib/types.ts`:

```typescript
export interface Business {
  id: string
  name: string
  // ... existing fields ...

  // Stripe Connect fields
  stripeAccountId?: string // Connected Stripe account ID
  stripeOnboardingComplete?: boolean // Has completed onboarding
  stripeChargesEnabled?: boolean // Can accept payments
  stripePayoutsEnabled?: boolean // Can receive payouts
  stripeDetailsSubmitted?: boolean // Has submitted verification details
}
```

### Add Stripe fields to Order type

Update the Order interface in `src/lib/types.ts`:

```typescript
export interface Order {
  id: string
  // ... existing fields ...

  // Stripe payment fields
  paymentIntentId?: string // Stripe Payment Intent ID
  stripeChargeId?: string // Stripe Charge ID
  platformFeeAmount?: number // Actual platform fee collected
  businessPayoutAmount?: number // Amount sent to business
}
```

## Step 6: Create Stripe Connect Onboarding

### API Route: Create Connect Account

Create `src/app/api/stripe/connect/account/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { db } from '@/lib/firebase/config'
import { doc, updateDoc } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const { businessId, email, businessName } = await request.json()

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'standard', // Business manages their own Stripe account
      country: 'US',
      email: email,
      business_type: 'individual', // or 'company'
      metadata: {
        businessId: businessId,
        businessName: businessName,
      },
    })

    // Save Stripe account ID to Firestore
    if (db) {
      const businessRef = doc(db, 'businesses', businessId)
      await updateDoc(businessRef, {
        stripeAccountId: account.id,
        stripeOnboardingComplete: false,
        updatedAt: new Date(),
      })
    }

    return NextResponse.json({
      success: true,
      accountId: account.id,
    })
  } catch (error: any) {
    console.error('Error creating Stripe Connect account:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create Connect account' },
      { status: 500 }
    )
  }
}
```

### API Route: Create Onboarding Link

Create `src/app/api/stripe/connect/onboarding-link/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'

export async function POST(request: NextRequest) {
  try {
    const { accountId } = await request.json()

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/business/settings?stripe_refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/business/settings?stripe_onboarding=complete`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      success: true,
      url: accountLink.url,
    })
  } catch (error: any) {
    console.error('Error creating account link:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create onboarding link' },
      { status: 500 }
    )
  }
}
```

### API Route: Check Account Status

Create `src/app/api/stripe/connect/account-status/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { db } from '@/lib/firebase/config'
import { doc, updateDoc } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const { accountId, businessId } = await request.json()

    const account = await stripe.accounts.retrieve(accountId)

    // Update Firestore with latest status
    if (db && businessId) {
      const businessRef = doc(db, 'businesses', businessId)
      await updateDoc(businessRef, {
        stripeChargesEnabled: account.charges_enabled,
        stripePayoutsEnabled: account.payouts_enabled,
        stripeDetailsSubmitted: account.details_submitted,
        stripeOnboardingComplete: account.charges_enabled && account.payouts_enabled,
        updatedAt: new Date(),
      })
    }

    return NextResponse.json({
      success: true,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    })
  } catch (error: any) {
    console.error('Error checking account status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check account status' },
      { status: 500 }
    )
  }
}
```

## Step 7: Create Payment Processing API

### API Route: Create Payment Intent

Create `src/app/api/stripe/create-payment-intent/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLATFORM_FEE_PERCENTAGE } from '@/lib/stripe/config'
import { db } from '@/lib/firebase/config'
import { doc, getDoc } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const {
      amount, // Total amount in dollars
      businessId,
      orderId,
      customerEmail,
    } = await request.json()

    if (!db) {
      throw new Error('Database not initialized')
    }

    // Get business's Stripe account ID
    const businessDoc = await getDoc(doc(db, 'businesses', businessId))
    const businessData = businessDoc.data()

    if (!businessData?.stripeAccountId) {
      throw new Error('Business has not connected Stripe account')
    }

    if (!businessData?.stripeChargesEnabled) {
      throw new Error('Business cannot accept payments yet')
    }

    // Convert to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(amount * 100)

    // Calculate platform fee (2%)
    const platformFeeInCents = Math.round(amountInCents * PLATFORM_FEE_PERCENTAGE)

    // Create Payment Intent with destination charge
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      receipt_email: customerEmail,
      application_fee_amount: platformFeeInCents, // Platform takes 2%
      transfer_data: {
        destination: businessData.stripeAccountId, // Rest goes to business
      },
      metadata: {
        orderId: orderId,
        businessId: businessId,
        platformFee: (platformFeeInCents / 100).toFixed(2),
      },
    })

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
```

## Step 8: Update Checkout Page

Update `src/app/checkout/page.tsx` to include Stripe payment:

1. Add Stripe Elements provider
2. Add payment form
3. Handle payment submission
4. Update order with payment status

(This is a large update - I'll provide the key sections you need to add)

**Key additions:**

```typescript
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Add state for payment
const [clientSecret, setClientSecret] = useState<string | null>(null)
const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)

// Create payment intent after validating form
const createPaymentIntent = async () => {
  const response = await fetch('/api/stripe/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: finalTotal,
      businessId: items[0].businessId, // Or handle multiple businesses
      orderId: 'temp-id', // Or generate order ID first
      customerEmail: user.email,
    }),
  })

  const data = await response.json()
  setClientSecret(data.clientSecret)
  setPaymentIntentId(data.paymentIntentId)
}

// Wrap payment form in Elements provider
{clientSecret && (
  <Elements stripe={stripePromise} options={{ clientSecret }}>
    <CheckoutForm onSuccess={handlePaymentSuccess} />
  </Elements>
)}
```

## Step 9: Set Up Webhooks

Webhooks allow Stripe to notify your app about payment events.

### Create Webhook Handler

Create `src/app/api/stripe/webhook/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { db } from '@/lib/firebase/config'
import { doc, updateDoc } from 'firebase/firestore'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // Handle different event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      await handlePaymentSuccess(paymentIntent)
      break

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent
      await handlePaymentFailure(failedPayment)
      break

    case 'account.updated':
      const account = event.data.object as Stripe.Account
      await handleAccountUpdate(account)
      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  if (!db) return

  const orderId = paymentIntent.metadata.orderId
  if (!orderId) return

  try {
    const orderRef = doc(db, 'orders', orderId)
    await updateDoc(orderRef, {
      paymentStatus: 'completed',
      paymentIntentId: paymentIntent.id,
      stripeChargeId: paymentIntent.latest_charge,
      updatedAt: new Date(),
    })
    console.log(`Payment succeeded for order ${orderId}`)
  } catch (error) {
    console.error('Error updating order:', error)
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  if (!db) return

  const orderId = paymentIntent.metadata.orderId
  if (!orderId) return

  try {
    const orderRef = doc(db, 'orders', orderId)
    await updateDoc(orderRef, {
      paymentStatus: 'failed',
      updatedAt: new Date(),
    })
    console.log(`Payment failed for order ${orderId}`)
  } catch (error) {
    console.error('Error updating order:', error)
  }
}

async function handleAccountUpdate(account: Stripe.Account) {
  if (!db) return

  const businessId = account.metadata?.businessId
  if (!businessId) return

  try {
    const businessRef = doc(db, 'businesses', businessId)
    await updateDoc(businessRef, {
      stripeChargesEnabled: account.charges_enabled,
      stripePayoutsEnabled: account.payouts_enabled,
      stripeDetailsSubmitted: account.details_submitted,
      stripeOnboardingComplete: account.charges_enabled && account.payouts_enabled,
      updatedAt: new Date(),
    })
    console.log(`Account updated for business ${businessId}`)
  } catch (error) {
    console.error('Error updating business:', error)
  }
}
```

### Register Webhook in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter webhook URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
5. Copy the "Signing secret" (starts with `whsec_`)
6. Add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

## Step 10: Testing

### Test Mode Checklist

- [ ] Create test Stripe account
- [ ] Create test Connect account for a business
- [ ] Complete Connect onboarding in test mode
- [ ] Make test payment using Stripe test cards
- [ ] Verify payment splits correctly (platform gets 2%, business gets 98%)
- [ ] Test webhook events trigger correctly
- [ ] Test payment failures
- [ ] Test refunds

### Stripe Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184
```

## Step 11: Firestore Security Rules

Update `firestore.rules` to protect Stripe data:

```
match /businesses/{businessId} {
  allow read: if true;
  allow update: if request.auth != null &&
    (request.auth.uid == resource.data.ownerId ||
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');

  // Don't allow clients to write Stripe data directly
  allow update: if !request.resource.data.diff(resource.data).affectedKeys()
    .hasAny(['stripeAccountId', 'stripeChargesEnabled', 'stripePayoutsEnabled']);
}
```

## Step 12: Going Live

When ready for production:

1. **Activate your Stripe account**
   - Complete business verification
   - Add bank account for payouts

2. **Switch to live keys**
   - Get live API keys from: https://dashboard.stripe.com/apikeys
   - Update environment variables in production
   - Use `pk_live_` and `sk_live_` instead of `pk_test_` and `sk_test_`

3. **Create live webhook**
   - Create new webhook endpoint for production URL
   - Update `STRIPE_WEBHOOK_SECRET` with live secret

4. **Test with real payment**
   - Use a real card for small test transaction
   - Verify money flows correctly

## Troubleshooting

### Common Issues

**"Business has not connected Stripe account"**
- Business needs to complete Connect onboarding first
- Check `stripeAccountId` exists in Firestore

**"Business cannot accept payments yet"**
- Business hasn't completed verification
- Check `stripeChargesEnabled` in Firestore
- Business may need to submit additional documents

**Payment fails silently**
- Check webhook is registered correctly
- Verify webhook secret is correct
- Check Stripe dashboard logs

**Platform fee not applied**
- Verify `PLATFORM_FEE_PERCENTAGE` is set
- Check `application_fee_amount` in payment intent

## Next Steps

After basic integration works:

1. **Add refund handling** - Create refund API route
2. **Add subscription billing** - For business subscription tiers
3. **Add dispute handling** - Handle chargebacks
4. **Add reporting** - Dashboard showing platform earnings
5. **Add payout schedule** - Configure when businesses get paid

## Resources

- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Connect Onboarding](https://stripe.com/docs/connect/onboarding)
- [Testing Connect](https://stripe.com/docs/connect/testing)

---

Need help with implementation? Each step above can be implemented incrementally and tested in isolation.
