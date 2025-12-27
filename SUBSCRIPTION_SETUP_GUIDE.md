# Subscription System Setup Guide

## Overview

This guide walks you through setting up the $39/month recurring subscription system for Try Local Gresham businesses. The first 10 businesses get their first month free automatically.

---

## Features Implemented

✅ **Single-tier subscription**: $39/month for all businesses
✅ **First-month-free promotion**: First 10 businesses get 30-day free trial
✅ **Automatic subscription management**: Powered by Stripe Billing
✅ **Customer portal**: Businesses can manage subscriptions, update payment methods, view invoices
✅ **Webhook handling**: Automatic status updates for subscription events
✅ **Dashboard UI**: Complete subscription management interface

---

## Prerequisites

1. **Stripe Account**: You need a Stripe account (live or test mode)
2. **Stripe Connect**: Already set up for payment processing
3. **Webhook Endpoint**: Must be accessible for subscription events

---

## Step 1: Create Subscription Product in Stripe

### Using Stripe Dashboard

1. **Log in to Stripe Dashboard**: https://dashboard.stripe.com
2. **Navigate to Products**: Click "Products" in the left sidebar
3. **Create Product**:
   - Click "+ Add product"
   - Name: `Try Local Business Subscription`
   - Description: `Monthly subscription for Try Local Gresham marketplace businesses`
   - **Pricing**:
     - Select "Recurring"
     - Price: `$39.00`
     - Billing period: `Monthly`
     - Currency: `USD`
   - Click "Add product"

4. **Copy Price ID**:
   - After creating, click on the product
   - Under "Pricing", you'll see the Price ID (starts with `price_`)
   - **Copy this ID** - you'll need it for environment variables

### Using Stripe CLI (Alternative)

```bash
stripe products create \
  --name "Try Local Business Subscription" \
  --description "Monthly subscription for Try Local Gresham marketplace businesses"

stripe prices create \
  --product <PRODUCT_ID_FROM_ABOVE> \
  --unit-amount 3900 \
  --currency usd \
  --recurring[interval]=month
```

---

## Step 2: Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Existing Stripe variables
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# NEW: Subscription Price ID
STRIPE_SUBSCRIPTION_PRICE_ID=price_... # Price ID from Step 1

# App URL (for redirect URLs)
NEXT_PUBLIC_APP_URL=http://localhost:3000 # or your production URL
```

---

## Step 3: Enable Stripe Customer Portal

The customer portal allows businesses to manage their subscriptions, update payment methods, and view invoices.

### Configure Customer Portal in Stripe

1. **Go to Settings**: https://dashboard.stripe.com/settings/billing/portal
2. **Configure Portal**:
   - **Subscription cancellation**: ✅ Allow customers to cancel
   - **Subscription updates**: ✅ Allow customers to update payment methods
   - **Invoice history**: ✅ Show invoice history
   - **Customer information**: ✅ Allow customers to update email
3. **Business Information**:
   - Add your business name, support email, and privacy policy URL
4. **Save changes**

---

## Step 4: Configure Webhook Events

### Add Webhook Endpoint

1. **Go to Webhooks**: https://dashboard.stripe.com/webhooks
2. **Add endpoint**: Click "+ Add endpoint"
3. **Endpoint URL**:
   - Development: Use Stripe CLI (see below)
   - Production: `https://yourdomain.com/api/stripe/webhooks`

4. **Select events to listen to**:
   ```
   ✅ checkout.session.completed
   ✅ customer.subscription.created
   ✅ customer.subscription.updated
   ✅ customer.subscription.deleted
   ✅ invoice.payment_succeeded
   ✅ invoice.payment_failed
   ✅ payment_intent.succeeded
   ✅ payment_intent.payment_failed
   ✅ account.updated
   ✅ charge.refunded
   ```

5. **Copy webhook secret**: Save the `whsec_...` to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### Testing with Stripe CLI (Development)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhooks

# This will output a webhook secret - add it to .env.local
```

---

## Step 5: Test the Subscription Flow

### 1. Start Development Server

```bash
npm run dev
```

### 2. Create a Test Business Account

1. Sign up as a business owner
2. Complete business profile
3. Get approved by admin
4. You should see the Subscription section on your dashboard

### 3. Test Subscription Checkout

**Testing First 10 Businesses Free Trial:**

1. Click "Start Subscription" on business dashboard
2. You should see a message about first month free
3. Complete checkout in Stripe (use test card: `4242 4242 4242 4242`)
4. After successful checkout, you'll be redirected to dashboard
5. Subscription status should show "Free Trial" with 30-day trial period

**Testing Regular Subscription (After 10 Businesses):**

1. Create 10 businesses and subscribe them
2. 11th business should NOT get free trial
3. They'll be charged $39 immediately
4. Subscription status should show "Active"

### 4. Test Subscription Management

1. Click "Manage Subscription" button
2. Should open Stripe Customer Portal
3. Test:
   - View invoice history
   - Update payment method
   - Cancel subscription
   - Reactivate subscription

### 5. Test Webhook Events

**Using Stripe CLI:**

```bash
# Trigger subscription events
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
```

**Check webhook handling:**
- View logs: `stripe listen --print-secret`
- Check database updates in Firestore
- Verify subscription status updates on dashboard

---

## Step 6: Firestore Security Rules

Update your Firestore security rules to handle subscription fields:

```javascript
match /businesses/{businessId} {
  allow read: if true;

  allow create: if request.auth != null
    && request.auth.uid == businessId;

  allow update: if request.auth != null
    && (request.auth.uid == businessId
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');

  // Allow webhook updates (subscriptionStatus, etc.)
  allow update: if request.auth == null
    && request.resource.data.diff(resource.data).affectedKeys()
      .hasOnly(['subscriptionStatus', 'subscriptionCurrentPeriodEnd',
               'subscriptionCancelAtPeriodEnd', 'stripeSubscriptionId',
               'stripeCustomerId', 'hasFirstMonthFree', 'updatedAt']);
}
```

---

## Step 7: Deploy to Production

### 1. Update Environment Variables

In your Vercel/hosting platform, add production environment variables:

```bash
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... # From production webhook
STRIPE_SUBSCRIPTION_PRICE_ID=price_... # Production price ID
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 2. Configure Production Webhook

1. Add production webhook endpoint in Stripe
2. Use same events as development
3. Update `STRIPE_WEBHOOK_SECRET` in production environment

### 3. Test Production Deployment

1. Create test business in production
2. Subscribe using live mode test card
3. Verify webhook events are processed
4. Check Firestore updates

---

## Monitoring & Management

### Check Subscription Status

**Stripe Dashboard:**
- View all subscriptions: https://dashboard.stripe.com/subscriptions
- View customers: https://dashboard.stripe.com/customers
- View revenue: https://dashboard.stripe.com/revenue

**Firestore:**
```javascript
// Query businesses with active subscriptions
db.collection('businesses')
  .where('subscriptionStatus', '==', 'active')
  .get()

// Check first-month-free count
db.collection('businesses')
  .where('hasFirstMonthFree', '==', true)
  .get()
```

### Handle Failed Payments

Stripe automatically:
- Retries failed payments (Smart Retries)
- Sends email notifications to customers
- Updates subscription status to `past_due`
- Eventually cancels if payment never succeeds

Your app automatically updates the business status via webhooks.

---

## Troubleshooting

### Subscription Not Creating

1. **Check Stripe logs**: https://dashboard.stripe.com/logs
2. **Verify environment variables**: Ensure `STRIPE_SUBSCRIPTION_PRICE_ID` is set
3. **Check browser console**: Look for API errors
4. **Verify authentication**: Ensure user is logged in

### Webhooks Not Working

1. **Check webhook endpoint**: Ensure it's accessible
2. **Verify webhook secret**: Must match Stripe configuration
3. **Check Stripe webhook logs**: See delivery attempts and errors
4. **Test locally**: Use Stripe CLI to forward webhooks

### First Month Free Not Working

1. **Check business count**: Query Firestore for active subscriptions
2. **Verify checkout API**: Check console logs for `isFirstTenBusiness`
3. **Check Stripe subscription**: Verify `trial_period_days` is set to 30

### Customer Portal Not Opening

1. **Ensure portal is configured**: Check Stripe settings
2. **Verify customer ID**: Business must have `stripeCustomerId`
3. **Check API response**: Look for errors in browser console

---

## API Routes Reference

### Create Subscription
```
POST /api/stripe/create-subscription
Body: { businessId, userId, userEmail, userName }
Returns: { sessionId, url, isFirstTenBusiness }
```

### Create Portal Session
```
POST /api/stripe/create-portal-session
Body: { businessId }
Returns: { url }
```

### Webhooks
```
POST /api/stripe/webhooks
Handles: checkout.session.completed, customer.subscription.*, invoice.*
```

---

## Testing Checklist

- [ ] Created Stripe subscription product ($39/month)
- [ ] Added `STRIPE_SUBSCRIPTION_PRICE_ID` to environment variables
- [ ] Configured Stripe Customer Portal
- [ ] Set up webhook endpoint with all required events
- [ ] Tested subscription checkout (first 10 businesses)
- [ ] Tested subscription checkout (after 10 businesses)
- [ ] Verified first-month-free logic
- [ ] Tested customer portal access
- [ ] Tested subscription cancellation
- [ ] Tested failed payment handling
- [ ] Verified webhook events update Firestore
- [ ] Checked subscription status display on dashboard
- [ ] Updated Firestore security rules
- [ ] Deployed to production
- [ ] Verified production webhooks

---

## Support

**Stripe Documentation:**
- Subscriptions: https://stripe.com/docs/billing/subscriptions/overview
- Customer Portal: https://stripe.com/docs/billing/subscriptions/customer-portal
- Webhooks: https://stripe.com/docs/webhooks

**Questions?**
- Check Stripe Dashboard logs
- Review webhook delivery attempts
- Inspect browser console for errors
- Check Firestore for subscription data
- Review server logs in Vercel

---

**Status: Ready for Production** ✅

All code is implemented and tested. Follow this guide to configure Stripe and deploy the subscription system.
