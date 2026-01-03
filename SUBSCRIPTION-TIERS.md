# Subscription Tiers Guide

This guide explains the three subscription tiers available for businesses on Try Local Gresham.

## Overview

| Tier | Price | Billing | Annual Cost | Who It's For |
|------|-------|---------|-------------|--------------|
| **Monthly** | $39/month | Monthly | $468/year | Businesses who prefer monthly payments |
| **Annual** | $430/year | Yearly | $430/year | Businesses who want to save money (saves $38/year) |
| **Non-Profit** | FREE | Forever | $0/year | Verified non-profit organizations |

## Monthly Plan - $39/month

**Perfect for:** Businesses who prefer flexibility and monthly billing

- Billed monthly at $39
- Cancel anytime
- No long-term commitment
- All platform features included

## Annual Plan - $430/year (Recommended)

**Perfect for:** Businesses who want the best value

- Billed annually at $430
- **Save $38/year** compared to monthly
- Cancel anytime with prorated refund
- All platform features included
- Best value for committed businesses

## Non-Profit Plan - FREE

**Perfect for:** Verified 501(c)(3) non-profit organizations

- Completely FREE
- All platform features included
- No payment required
- Must be approved by admin

### How to Get Non-Profit Status

1. **Apply for a business account** at `/apply`
2. **Contact admin** or mention non-profit status in application
3. **Admin approves** using "Approve as Non-Profit" button
4. **Get instant access** - no payment required

Admins can also convert existing businesses to non-profit status in Firebase by adding:
```
isNonProfit: true
```

## Features (All Tiers)

All subscription tiers include the same features:

- ✅ Full marketplace listing
- ✅ Product catalog management
- ✅ Order management system
- ✅ Appointment scheduling
- ✅ Analytics dashboard
- ✅ Discount code creation
- ✅ Customer reviews
- ✅ Direct payment processing (98% of sales)
- ✅ Customer support

## Grace Period

New businesses get a **7-day grace period** after approval before subscription is required:

- Days 1-7: Full access, no payment required
- Day 8+: Subscription required to continue
- Warning banners appear during grace period

## Special Promotions

### First Month Free (Limited Time)

The first 10 businesses to subscribe get:
- **30-day free trial** on any paid tier
- No credit card required for trial
- Automatically applied at checkout
- After trial, regular billing begins

## Grandfathered Businesses

Early adopter businesses may be marked as "grandfathered" and are exempt from subscription fees:

- Set by admin: `grandfathered: true`
- FREE access forever
- All features included
- Thank you for being an early adopter!

## Technical Implementation

### Environment Variables

Create Stripe prices and add to `.env.local`:

```bash
# Monthly plan ($39/month)
STRIPE_SUBSCRIPTION_PRICE_ID_MONTHLY=price_xxxxxxxxxxxxx

# Annual plan ($430/year)
STRIPE_SUBSCRIPTION_PRICE_ID_YEARLY=price_xxxxxxxxxxxxx

# Legacy (fallback to monthly)
STRIPE_SUBSCRIPTION_PRICE_ID=price_xxxxxxxxxxxxx
```

See `scripts/create-stripe-prices.md` for detailed setup instructions.

### Business Data Model

Subscription fields in Firestore:

```typescript
{
  // Exemptions
  grandfathered?: boolean       // Early adopters (free)
  isNonProfit?: boolean          // Non-profits (free)

  // Subscription
  subscriptionTier?: 'monthly' | 'yearly' | 'nonprofit'
  subscriptionStatus?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'unpaid'
  stripeSubscriptionId?: string
  stripeCustomerId?: string
  subscriptionCurrentPeriodEnd?: Date
  hasFirstMonthFree?: boolean

  // Grace period
  approvedAt?: Date              // When approved (for 7-day grace period)
}
```

### Admin Operations

#### Approve as Non-Profit

In admin applications page:
1. Click "Approve as Non-Profit" button
2. Confirm approval
3. Business is created with `isNonProfit: true`
4. Business gets free access immediately

#### Convert Existing Business to Non-Profit

In Firebase Console:
1. Go to Firestore → `businesses` collection
2. Find the business document
3. Add field: `isNonProfit: true`
4. Save

The business will immediately see: "Your non-profit organization has free access to the platform."

#### Grandfather Existing Business

See `scripts/README-GRANDFATHER.md` for detailed instructions.

## User Experience

### For Customers

When a business signs up, they see:

1. **Tier Selection Screen:**
   - Side-by-side comparison of Monthly vs Annual
   - "Best Value" badge on Annual plan
   - Clickable cards to select tier
   - Clear pricing and savings displayed

2. **Free Trial (First 10):**
   - "🎉 Limited Time Offer" banner
   - "First 10 businesses get first month FREE!"
   - Automatically applied at checkout

3. **Grace Period (New Businesses):**
   - Yellow warning banner: "7 days remaining"
   - Countdown to subscription requirement
   - Smooth scroll to subscription section

4. **Subscription Required (After Grace Period):**
   - Red blocking banner
   - Cannot accept orders without subscription
   - Clear call-to-action to subscribe

5. **Non-Profit/Grandfathered:**
   - Green success banner
   - "Thank you for being part of our community!"
   - No subscription prompts

### For Admins

**Applications Page:**
- Three buttons per application:
  - "Approve" - Regular business (requires subscription)
  - "Approve as Non-Profit" - FREE access
  - "Reject" - Decline application

**Business Management:**
- Can manually set `isNonProfit` or `grandfathered` in Firebase
- View subscription status in business list
- Monitor subscription analytics

## Billing & Payments

### Payment Processing

- **Monthly:** Charged $39 on the same day each month
- **Annual:** Charged $430 once per year
- **Non-Profit:** Never charged

### Cancellation

- Cancel anytime via Stripe Customer Portal
- Monthly: Access until end of current month
- Annual: Prorated refund available (contact support)

### Upgrading/Downgrading

Users can change plans via Stripe Customer Portal:
- Monthly → Annual: Prorated credit applied
- Annual → Monthly: Access continues until annual period ends
- Contact support for assistance

## FAQs

**Q: Can I switch from monthly to annual?**
A: Yes! Manage your subscription in the dashboard and contact support for a prorated switch.

**Q: What happens if payment fails?**
A: Account moves to `past_due` status. Orders are blocked. Update payment method in dashboard.

**Q: Can non-profits cancel?**
A: Non-profits don't have subscriptions to cancel - they have permanent free access!

**Q: What's included in the platform fee?**
A: All subscription tiers pay a 2% platform fee on orders. This covers payment processing and platform maintenance.

**Q: Do I need both a subscription AND Stripe Connect?**
A: Yes! The subscription ($39/mo or $430/yr) gives you access to the platform. Stripe Connect lets you receive payments from customers.

## Support

Questions about subscriptions? Contact us:
- Email: support@try-local.com
- Include your business name and question
- We typically respond within 24 hours
