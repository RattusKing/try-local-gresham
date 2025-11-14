# Vercel Environment Variables Setup

Add these environment variables to your Vercel project:

## Step 1: Go to Vercel Dashboard
1. Visit https://vercel.com/dashboard
2. Select your **try-local-gresham** project
3. Go to **Settings** → **Environment Variables**

## Step 2: Add These Variables

Copy and paste each of these:

### Google Analytics
```
Name: NEXT_PUBLIC_GA_ID
Value: G-HJK5MY2G2H
```

### Firebase Configuration
```
Name: NEXT_PUBLIC_FIREBASE_API_KEY
Value: AIzaSyD0APzjW3laEnnPiJ2l7lvxzEbrSlKW3Bo
```

```
Name: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
Value: try-local-f0c44.firebaseapp.com
```

```
Name: NEXT_PUBLIC_FIREBASE_PROJECT_ID
Value: try-local-f0c44
```

```
Name: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
Value: try-local-f0c44.firebasestorage.app
```

```
Name: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
Value: 178136427645
```

```
Name: NEXT_PUBLIC_FIREBASE_APP_ID
Value: 1:178136427645:web:086f63ac76fc5e868f9514
```

## Step 3: Apply to All Environments
For each variable, make sure to select:
- ✅ Production
- ✅ Preview
- ✅ Development

## Step 4: Redeploy
After adding all variables:
1. Go to **Deployments** tab
2. Click the **three dots** on your latest deployment
3. Click **Redeploy**
4. Select **Use existing Build Cache** (faster)
5. Click **Redeploy**

## Next: Enable Firebase Features

Once deployed, you need to enable Firebase features:

### 1. Enable Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **try-local-f0c44** project
3. Click **Authentication** → **Get Started**
4. Enable **Email/Password**
5. Enable **Google** → Select your email as support email

### 2. Create Firestore Database
1. Click **Firestore Database** → **Create database**
2. Select **Start in production mode**
3. Choose location: **us-central** (or closest to you)
4. Click **Enable**

### 3. Deploy Security Rules
In your project directory:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
# Select: try-local-f0c44
# Use default files: firestore.rules and firestore.indexes.json
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 4. Authorize Domain
1. In Firebase Console → **Authentication** → **Settings** tab
2. Scroll to **Authorized domains**
3. Add your Vercel domain (e.g., `try-local-gresham.vercel.app`)

## Test Authentication
1. Visit your deployed site
2. Click **Sign In**
3. Try creating an account with email
4. Try **Sign in with Google**
5. Check you can see your profile in header dropdown

## Make Yourself Admin
1. Sign up on your site
2. Firebase Console → **Firestore Database**
3. Open **users** collection → your user document
4. Edit field `role` → change to `admin`
5. Refresh your site - you should see "Role: admin"

---

All set! Your authentication is now live. 🎉
