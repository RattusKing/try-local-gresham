# 🚨 Critical: Deploy Updated Firebase Rules

## Issue Found
Your **deployed Firestore rules don't match your app code** and are **missing important collections**. This will cause permission errors!

### Field Name Mismatch (Fixed)
- ❌ Deployed rules expected: `customerId`, `businessOwnerId`
- ✅ App actually uses: `userId`, `businessId`

### Missing Collections (Fixed)
Your deployed rules are missing:
- ✅ Products collection
- ✅ Business Applications collection
- ✅ Discount Codes collection
- ✅ Promotional Banners collection
- ✅ Favorites collection

## What You Need to Deploy

### 1. Enable Firebase Storage (if not already done)
```bash
# In Firebase Console:
# 1. Go to Storage in left sidebar
# 2. Click "Get started"
# 3. Choose same location as Firestore (e.g., us-central)
# 4. Click "Done"
```

### 2. Deploy All Rules
```bash
# Make sure you're in the project directory
cd /path/to/try-local-gresham

# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if first time)
firebase init

# When prompted, select:
# - Firestore (use existing firestore.rules and firestore.indexes.json)
# - Storage (use existing storage.rules)

# Deploy everything
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### 3. Verify Deployment

After deploying, check your Firebase Console:

#### Firestore Rules
Go to **Firestore Database → Rules** and verify you see:
- Users collection
- Businesses collection
- Orders collection (using `userId` and `businessId`)
- Reviews collection
- **Products collection** ← NEW
- **Business Applications collection** ← NEW
- **Discount Codes collection** ← NEW
- **Promotional Banners collection** ← NEW
- **Favorites collection** ← NEW

#### Storage Rules
Go to **Storage → Rules** and verify you see:
- `businesses/{userId}/{filename}` path
- `products/{userId}/{filename}` path
- 10MB file size limit
- Image type validation

## What Was Fixed

### firestore.rules
- ✅ Orders collection now uses correct field names (`userId`, `businessId`)
- ✅ Added Products collection rules
- ✅ Added Business Applications collection rules
- ✅ Added Discount Codes collection rules
- ✅ Added Promotional Banners collection rules
- ✅ Added Favorites collection rules

### firestore.indexes.json
- ✅ Updated indexes to use `userId` instead of `customerId`
- ✅ Updated indexes to use `businessId` instead of `businessOwnerId`

### storage.rules (NEW)
- ✅ Created Firebase Storage security rules
- ✅ Business cover photo uploads
- ✅ Product image uploads
- ✅ 10MB limit with image validation

## Testing After Deployment

1. **Test Order Creation**: Try placing an order to verify permissions work
2. **Test Product Upload**: Upload a product image as a business owner
3. **Test Business Cover Photo**: Upload a business cover photo
4. **Test Favorites**: Add/remove items from favorites
5. **Test Discount Codes**: Create a discount code as a business owner

## Need Help?

If you see permission errors after deployment:
1. Check Firebase Console → Firestore Database → Rules (make sure they deployed)
2. Check Firebase Console → Storage → Rules (make sure they deployed)
3. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
4. Check browser console for specific error messages

---

**Important**: These rules are critical for your app to function properly. Deploy them as soon as possible!
