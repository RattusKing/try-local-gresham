# Firebase Setup Guide for Try Local Gresham

This guide will help you configure your Firebase project for Try Local.

## Step 1: Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your existing project: **"try local"**

## Step 2: Enable Authentication

1. In Firebase Console, click **Authentication** in the left sidebar
2. Click **Get Started** (if not already enabled)
3. Go to **Sign-in method** tab
4. Enable the following providers:
   - **Email/Password** - Click → Enable → Save
   - **Google** - Click → Enable → Select support email → Save

## Step 3: Create Firestore Database

1. In Firebase Console, click **Firestore Database** in the left sidebar
2. Click **Create database**
3. Select **Start in production mode** (we'll add custom rules next)
4. Choose a location (e.g., `us-central` for USA)
5. Click **Enable**

## Step 3.5: Enable Firebase Storage

1. In Firebase Console, click **Storage** in the left sidebar
2. Click **Get started**
3. Review the security rules prompt → Click **Next**
4. Choose the same location as your Firestore (e.g., `us-central`)
5. Click **Done**

## Step 4: Deploy Security Rules

1. In your project directory, run:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   ```

2. When prompted, select:
   - **Firestore**: Configure security rules and indexes files
   - **Storage**: Configure security rules file
   - Use arrow keys and spacebar to select both, then press Enter

3. For Firestore configuration:
   - Firestore rules file: Press Enter (uses `firestore.rules`)
   - Firestore indexes file: Press Enter (uses `firestore.indexes.json`)

4. For Storage configuration:
   - Storage rules file: Press Enter (uses `storage.rules`)

5. Deploy all rules:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```

   Or deploy individually:
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only firestore:indexes
   firebase deploy --only storage
   ```

## Step 5: Get Firebase Configuration

1. In Firebase Console, click the gear icon (⚙️) → **Project settings**
2. Scroll down to **Your apps**
3. If no web app exists, click **Add app** → Web (</>) icon
4. Register your app (name it "Try Local Gresham")
5. Copy the `firebaseConfig` object

## Step 6: Add Config to Your App

1. Create a file: `.env.local` in your project root
2. Add your Firebase configuration:

```env
# Google Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=try-local.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=try-local
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=try-local.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

**Replace the placeholder values** with your actual Firebase config values from Step 5.

## Step 7: Add Config to Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each environment variable from Step 6:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

5. Redeploy your site

## Step 8: Create Admin User

Once your site is deployed with Firebase:

1. Sign up on your website with your email
2. Go to Firebase Console → **Firestore Database**
3. Find the `users` collection
4. Find your user document
5. Click on it and add/edit the `role` field to: `admin`
6. Save

Now you're an admin! You can approve businesses and manage the platform.

## Step 9: Test Authentication

1. Visit your deployed site
2. Click **Sign In**
3. Try both:
   - Email/Password signup
   - Google Sign-In
4. Verify you can see your profile in the header dropdown
5. Click **Sign Out** to test logout

## Firestore Collections Structure

Your database will use these collections:

### `users`
```javascript
{
  uid: string
  email: string
  displayName?: string
  role: 'customer' | 'business_owner' | 'admin'
  businessId?: string  // For business owners
  createdAt: timestamp
  updatedAt: timestamp
}
```

### `businesses` (Phase 3)
```javascript
{
  id: string
  ownerId: string
  name: string
  tags: string[]
  status: 'pending' | 'approved' | 'rejected'
  subscriptionTier: 'free' | 'standard' | 'premium'
  createdAt: timestamp
  updatedAt: timestamp
  // ... more fields
}
```

### `orders` (Phase 5)
```javascript
{
  customerId: string
  businessId: string
  businessOwnerId: string
  items: array
  total: number
  status: string
  createdAt: timestamp
}
```

## Security Rules Explained

### Firestore Rules (`firestore.rules`)
The deployed Firestore rules ensure:

- ✅ Users can only edit their own profiles
- ✅ Business owners must wait for admin approval
- ✅ Only approved businesses are visible to customers
- ✅ Customers can only see their own orders
- ✅ Business owners can only see orders for their business
- ✅ Admins have full access to moderate content

### Storage Rules (`storage.rules`)
The deployed Storage rules ensure:

- ✅ Anyone can view/read images (public access)
- ✅ Business owners can only upload to their own folders
- ✅ Image files must be under 10MB
- ✅ Only valid image file types are accepted
- ✅ Users can only delete their own images
- ✅ Admins have full access to all files

**Storage Structure:**
- `businesses/{userId}/{filename}` - Business cover photos
- `products/{userId}/{filename}` - Product images

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Make sure you've added `.env.local` with your Firebase config
- Restart your dev server after adding environment variables

### "Missing or insufficient permissions"
- Check that your security rules are deployed: `firebase deploy --only firestore:rules`
- Make sure you're signed in

### Google Sign-In not working
- In Firebase Console → Authentication → Sign-in method → Google
- Make sure you've added your authorized domains:
  - `localhost` (for local development)
  - Your Vercel domain (e.g., `try-local-gresham.vercel.app`)

### Image upload failing
- Check that Firebase Storage is enabled in your Firebase Console
- Verify storage rules are deployed: `firebase deploy --only storage`
- Make sure image file is under 10MB and is a valid image format
- Check browser console for specific error messages

## Next Steps

Once Firebase is configured:
- ✅ Phase 2 Complete!
- 🔜 Phase 3: Build business management dashboard
- 🔜 Phase 4: Add subscription billing
- 🔜 Phase 5: Implement e-commerce features

---

Need help? Check the [Firebase Documentation](https://firebase.google.com/docs) or ask for assistance.
