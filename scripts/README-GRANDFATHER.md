# Grandfather Existing Businesses - Migration Guide

This guide explains how to mark your existing business as "grandfathered" to exempt them from subscription requirements.

## What is Grandfathering?

When we enable subscription enforcement, we want to protect existing businesses from being disrupted. Businesses marked as "grandfathered" can continue using the platform without subscribing.

## Quick Manual Method (Recommended for 1 Business)

Since you only have 1 existing business, the easiest method is to update it manually in Firebase Console:

### Steps:

1. **Open Firebase Console**
   - Go to https://console.firebase.google.com
   - Select your project: `try-local-gresham`

2. **Navigate to Firestore Database**
   - Click "Firestore Database" in the left sidebar
   - Find the `businesses` collection

3. **Find Your Business**
   - Look for the approved business document
   - Click on it to open

4. **Add Grandfathered Field**
   - Click "Add field"
   - Field name: `grandfathered`
   - Field type: `boolean`
   - Value: `true` (checked)
   - Click "Update"

5. **Set ApprovedAt Field (if missing)**
   - If the business doesn't have an `approvedAt` field:
   - Click "Add field"
   - Field name: `approvedAt`
   - Field type: `timestamp`
   - Value: Set to when the business was approved (or today's date)
   - Click "Update"

6. **Done!**
   - The business is now exempt from subscription requirements
   - They can continue using the platform without subscribing

## Alternative: Run Migration Script

If you prefer to automate it or have multiple businesses in the future:

### Prerequisites:

```bash
# Install dependencies
npm install firebase-admin

# Set up service account
# 1. Go to Firebase Console > Project Settings > Service Accounts
# 2. Click "Generate new private key"
# 3. Save as serviceAccountKey.json in project root (DO NOT commit this file!)
```

### Run the script:

```bash
npx ts-node scripts/grandfather-existing-businesses.ts
```

### What the script does:

- ✅ Finds all approved businesses without active subscriptions
- ✅ Marks them as `grandfathered: true`
- ✅ Sets `approvedAt` timestamp if missing
- ✅ Safe to run multiple times (idempotent)
- ✅ Provides detailed summary of changes

### Expected Output:

```
🔍 Searching for businesses to grandfather...

📊 Found 1 total businesses

✨ Grandfathering: [Business Name]
   - Status: approved
   - Subscription: none
   - Created: [date]
   - Setting approvedAt: [date]

🚀 Executing 1 updates...
✅ All updates completed successfully!

============================================================
📋 MIGRATION SUMMARY
============================================================
✨ Grandfathered:          1
✅ Already grandfathered:  0
💳 Has subscription:       0
⏭️  Skipped (not approved): 0
📊 Total businesses:       1
============================================================

🎉 Success! Existing businesses are now protected from subscription enforcement.
   They can continue using the platform without subscribing.
```

## Verification

After grandfathering, verify in the business dashboard:

1. Log in as the business owner
2. Go to `/dashboard/business`
3. You should see a message: "Your business is exempt from subscription fees as an early adopter"
4. No subscription warnings or blocks should appear

## Important Notes

- **Grandfathered businesses** can use all platform features without subscribing
- **New businesses** will be required to subscribe after a 7-day grace period
- **Grace period**: New businesses get 7 days after approval before subscription is required
- **No disruption**: Existing business data, products, orders, etc. remain unchanged

## Rollback

If you need to remove grandfathered status:

1. Go to Firebase Console
2. Find the business in Firestore
3. Delete the `grandfathered` field (or set to `false`)
4. The business will then be subject to normal subscription requirements

## Questions?

- Check the implementation in `/src/lib/subscription.ts`
- Review the banner component in `/src/components/SubscriptionRequiredBanner.tsx`
- See how it's enforced in `/src/app/api/stripe/create-payment-intent/route.ts`
