# Creating Stripe Subscription Prices

This guide explains how to create the subscription prices in Stripe for monthly and yearly plans.

## Option 1: Stripe Dashboard (Recommended)

### 1. Create Monthly Price ($39/month)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **Add product**
3. Product details:
   - **Name**: "Local Gresham Business Subscription"
   - **Description**: "Monthly subscription for local businesses on Try Local Gresham platform"
4. Pricing:
   - **Pricing model**: Standard pricing
   - **Price**: $39.00
   - **Billing period**: Monthly
   - Click **Add pricing**
5. Copy the **Price ID** (starts with `price_...`)
6. Add to `.env.local`:
   ```
   STRIPE_SUBSCRIPTION_PRICE_ID_MONTHLY=price_xxxxxxxxxxxxx
   ```

### 2. Create Yearly Price ($430/year)

1. Go to the same product you created above
2. Click **Add another price**
3. Pricing:
   - **Price**: $430.00
   - **Billing period**: Yearly
   - Click **Add pricing**
4. Copy the **Price ID** (starts with `price_...`)
5. Add to `.env.local`:
   ```
   STRIPE_SUBSCRIPTION_PRICE_ID_YEARLY=price_xxxxxxxxxxxxx
   ```

### 3. Non-Profit Subscription

Non-profit subscriptions are handled entirely within the application (no Stripe subscription needed).
Admins mark businesses as `isNonProfit: true` and they get free access without creating a Stripe subscription.

## Option 2: Stripe CLI (Advanced)

### 1. Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

### 2. Login to Stripe

```bash
stripe login
```

### 3. Create Product and Prices

```bash
# Create the product
PRODUCT_ID=$(stripe products create \
  --name="Local Gresham Business Subscription" \
  --description="Subscription for local businesses on Try Local Gresham platform" \
  --format=json | jq -r '.id')

echo "Product ID: $PRODUCT_ID"

# Create monthly price ($39/month)
MONTHLY_PRICE_ID=$(stripe prices create \
  --product=$PRODUCT_ID \
  --unit-amount=3900 \
  --currency=usd \
  --recurring[interval]=month \
  --format=json | jq -r '.id')

echo "Monthly Price ID: $MONTHLY_PRICE_ID"

# Create yearly price ($430/year)
YEARLY_PRICE_ID=$(stripe prices create \
  --product=$PRODUCT_ID \
  --unit-amount=43000 \
  --currency=usd \
  --recurring[interval]=year \
  --format=json | jq -r '.id')

echo "Yearly Price ID: $YEARLY_PRICE_ID"

# Print environment variables to add
echo ""
echo "Add these to your .env.local file:"
echo "STRIPE_SUBSCRIPTION_PRICE_ID_MONTHLY=$MONTHLY_PRICE_ID"
echo "STRIPE_SUBSCRIPTION_PRICE_ID_YEARLY=$YEARLY_PRICE_ID"
```

## Environment Variables

After creating the prices, add these to your `.env.local` file:

```bash
# Stripe Subscription Prices
STRIPE_SUBSCRIPTION_PRICE_ID_MONTHLY=price_xxxxxxxxxxxxx  # $39/month
STRIPE_SUBSCRIPTION_PRICE_ID_YEARLY=price_xxxxxxxxxxxxx   # $430/year

# Legacy (for backwards compatibility)
STRIPE_SUBSCRIPTION_PRICE_ID=price_xxxxxxxxxxxxx  # Same as monthly
```

## Verification

After setting up the prices, verify they're configured correctly:

1. **Check in Stripe Dashboard**:
   - Go to Products
   - You should see one product with two prices (monthly and yearly)

2. **Test in your app**:
   - Go to business dashboard
   - Click "Start Subscription"
   - You should see options for Monthly ($39/month) and Annual ($430/year)

3. **Test mode vs Live mode**:
   - Make sure you create prices in both Test and Live modes
   - Test mode price IDs: Start with `price_` and are for testing
   - Live mode price IDs: Also start with `price_` but are for real payments
   - Keep separate `.env.local` configurations for each mode

## Pricing Summary

| Plan | Price | Interval | Annual Cost | Savings |
|------|-------|----------|-------------|---------|
| Monthly | $39 | month | $468/year | - |
| Annual | $430 | year | $430/year | $38/year |
| Non-Profit | Free | - | $0/year | Free |

## Troubleshooting

### "Price ID not set" error

Make sure your `.env.local` file has the correct price IDs:
```bash
STRIPE_SUBSCRIPTION_PRICE_ID_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_SUBSCRIPTION_PRICE_ID_YEARLY=price_xxxxxxxxxxxxx
```

### Test mode vs Live mode mismatch

If you see errors about test/live mode:
- Check that your `STRIPE_SECRET_KEY` matches the mode of your price IDs
- Test key starts with `sk_test_`
- Live key starts with `sk_live_`

### Can't find price in Stripe

Make sure you're looking in the right mode:
- Top left of Stripe Dashboard shows "Test mode" or "Live mode"
- Toggle between them to see prices in each environment
