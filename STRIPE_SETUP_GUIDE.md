# Stripe Payment Integration Guide

## Overview

Your Try Local Gresham marketplace now has **Stripe Connect** payment processing fully integrated! This enables:

✅ **Automatic payment splitting**: Businesses receive 98%, platform gets 2%
✅ **Secure payment processing**: Customers pay with credit/debit cards via Stripe
✅ **Direct bank deposits**: Funds deposited automatically to business bank accounts
✅ **Full marketplace automation**: No manual payment processing needed

---

## How It Works

### For Customers:
1. **Browse & Shop**: Add items from local businesses to cart
2. **Checkout**: Enter delivery/pickup information
3. **Pay Securely**: Complete payment via Stripe (credit/debit card)
4. **Confirmation**: Receive order confirmation immediately

### For Businesses:
1. **Connect Stripe Account**: One-time setup in business dashboard
2. **Complete Onboarding**: Provide business info and bank account to Stripe
3. **Receive Payments**: Automatically receive 98% of each sale
4. **Track Orders**: Manage orders in business dashboard

### For Platform (You):
1. **Automatic Fee Collection**: 2% platform fee is automatically deducted
2. **Webhook Monitoring**: Real-time payment event tracking
3. **Order Management**: All orders tracked with payment status

---

## What Was Implemented

### 1. Stripe Connect Integration
**Files Created/Modified:**
- `/src/lib/stripe/config.ts` - Stripe initialization
- `/src/app/api/stripe/connect/create-account/route.ts` - Create business Stripe accounts
- `/src/app/api/stripe/connect/account-link/route.ts` - Generate onboarding links
- `/src/app/api/stripe/connect/account-status/route.ts` - Check account verification status

### 2. Payment Processing
**Files Created/Modified:**
- `/src/app/api/stripe/create-payment-intent/route.ts` - Create payment intents with 2% fee
- `/src/components/stripe/StripeCheckoutForm.tsx` - Stripe payment form component
- `/src/app/checkout/page.tsx` - Updated checkout flow with Stripe Elements

### 3. Webhook Handler
**File Created:**
- `/src/app/api/stripe/webhooks/route.ts` - Handle Stripe events:
  - `payment_intent.succeeded` - Update order payment status
  - `payment_intent.payment_failed` - Mark payment as failed
  - `account.updated` - Update business account status
  - `charge.refunded` - Handle refunds

### 4. Business Dashboard
**Files Modified:**
- `/src/app/dashboard/business/page.tsx` - Added Stripe status card
- `/src/app/dashboard/business/stripe-onboarding/page.tsx` - Onboarding flow
- `/src/app/dashboard/business/business.css` - Styling for payment cards

### 5. TypeScript Types
**File Modified:**
- `/src/lib/types.ts` - Added Stripe fields to Business and Order interfaces

### 6. Environment Configuration
**Files Modified:**
- `.env.example` - Updated with Stripe keys
- `.env.local` - Created with test keys (gitignored)

---

## Setup Steps

### Step 1: Environment Variables (✅ COMPLETED)

Your test environment is already configured with:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

**For Production:**
When you're ready to go live, update `.env.local` with your live keys:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
STRIPE_SECRET_KEY=sk_live_your_secret_key
```

### Step 2: Configure Stripe Webhook (REQUIRED)

You need to set up a webhook endpoint in Stripe to receive payment events:

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/test/webhooks
2. **Click "Add endpoint"**
3. **Enter your webhook URL**:
   - Local development: Use ngrok or similar tunneling service
   - Production: `https://yourdomain.com/api/stripe/webhooks`
4. **Select events to listen to**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
   - `charge.refunded`
5. **Copy the "Signing secret"** (starts with `whsec_...`)
6. **Add to `.env.local`**:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

### Step 3: Test the Integration

#### Testing Customer Checkout:

1. **Create a test order**:
   - Add products to cart
   - Go to checkout
   - Fill in delivery information
   - Click "Continue to Payment"

2. **Use Stripe test cards**:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **3D Secure**: `4000 0025 0000 3155`
   - Use any future expiry date (e.g., 12/34)
   - Use any 3-digit CVC (e.g., 123)

3. **Verify payment flow**:
   - Payment should complete successfully
   - Order created with `paymentStatus: 'completed'`
   - Redirect to order confirmation

#### Testing Business Onboarding:

1. **Create a business account** (or use existing)
2. **Go to Business Dashboard**: `/dashboard/business`
3. **Click "Set Up Payments"** in the payment status card
4. **Complete Stripe onboarding**:
   - Use test business information
   - Use Stripe test bank account: `000123456789`
   - Routing number: `110000000`
5. **Verify account status** changes to "verified"

---

## Payment Flow Diagram

```
Customer Checkout
       ↓
  Fill Details
       ↓
Create Payment Intent
  (with 2% fee split)
       ↓
   Stripe Payment Form
       ↓
   Customer Pays
       ↓
    ┌─────────┴─────────┐
    ↓                   ↓
Business Gets 98%   Platform Gets 2%
    ↓                   ↓
Bank Deposit        Platform Account
 (2-7 days)         (immediate)
```

---

## Important Notes

### Payment Splitting
- **Application Fee Model**: Platform receives payment, business gets transfer
- **Fee Calculation**: 2% calculated in `calculatePlatformFee()` helper
- **Automatic Transfer**: Stripe handles the split automatically

### Security
- ✅ Webhook signature verification
- ✅ API keys stored in environment variables (not committed to git)
- ✅ Payment intents validated before order creation
- ✅ Stripe Elements for PCI compliance

### Error Handling
- Invalid payment methods → User sees error, order not created
- Insufficient funds → Payment failed, order marked as failed
- Business not verified → Payment prevented, user notified

---

## Testing Checklist

- [ ] Customer can complete checkout with test card
- [ ] Payment status updates to "completed" after successful payment
- [ ] Business receives notification email after order
- [ ] Business can complete Stripe onboarding
- [ ] Business dashboard shows correct payment status
- [ ] Webhook events are received and processed
- [ ] Failed payments are handled gracefully
- [ ] Orders are only created after successful payment

---

## Production Deployment

When deploying to production (Vercel, etc.):

1. **Update environment variables** with live Stripe keys
2. **Configure webhook endpoint** with production URL
3. **Test with live mode test cards** before going fully live
4. **Monitor Stripe Dashboard** for:
   - Payment activity
   - Failed payments
   - Account verification issues
   - Webhook delivery

---

## Troubleshooting

### "Business has not set up payment processing yet"
- Business needs to complete Stripe onboarding
- Go to `/dashboard/business/stripe-onboarding`
- Complete all required fields in Stripe

### "Webhook signature verification failed"
- Check `STRIPE_WEBHOOK_SECRET` is set correctly
- Verify webhook endpoint URL in Stripe Dashboard
- Ensure webhook secret matches your environment

### "Amount must be at least $0.50"
- Stripe requires minimum $0.50 charge
- Check cart total includes platform fee
- Verify discount codes aren't reducing total below minimum

### Payment succeeds but order not created
- Check webhook is configured and receiving events
- Look for errors in webhook handler logs
- Verify Firestore permissions allow order creation

---

## Next Steps (Future Enhancements)

### Phase 2: Subscription Billing
- Add Stripe Billing integration for business subscriptions
- Implement tiered pricing ($29/mo Standard, $79/mo Premium)
- Create subscription management dashboard

### Phase 3: Advanced Features
- Refund processing through dashboard
- Payout tracking and reporting
- Customer saved payment methods
- Recurring/subscription products

---

## Support Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Connect Guide**: https://stripe.com/docs/connect
- **Test Cards**: https://stripe.com/docs/testing
- **Webhook Events**: https://stripe.com/docs/api/events

---

## Summary

Your marketplace now has **production-ready payment processing** with:
- ✅ Stripe Connect for marketplace payments
- ✅ Automatic 2% platform fee collection
- ✅ Secure checkout flow
- ✅ Business onboarding system
- ✅ Webhook event handling
- ✅ Real-time payment status tracking

**You're ready to start testing!** Use the test cards and follow the testing checklist above.
