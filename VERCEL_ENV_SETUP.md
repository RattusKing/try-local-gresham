# Vercel Environment Variables Setup

⚠️ **SECURITY WARNING**: Never commit actual API keys or secrets to version control!
The values below are PLACEHOLDERS. Replace them with your actual credentials in Vercel dashboard only.

Add these environment variables to your Vercel project:

## Step 1: Go to Vercel Dashboard
1. Visit https://vercel.com/dashboard
2. Select your **try-local-gresham** project
3. Go to **Settings** → **Environment Variables**

## Step 2: Add These Variables

Copy and paste each of these (REPLACE WITH YOUR ACTUAL VALUES):

### Application URL (Required)
```
Name: NEXT_PUBLIC_APP_URL
Value: https://your-domain.vercel.app
```
**Important**: Replace `your-domain.vercel.app` with your actual Vercel domain or custom domain

### Email Service (Optional but Recommended)
```
Name: RESEND_API_KEY
Value: re_your_resend_api_key_here
```
Get your API key from https://resend.com/api-keys

```
Name: EMAIL_FROM
Value: Try Local Gresham <noreply@yourdomain.com>
```
Use your verified domain email

### Google Analytics (Optional)
```
Name: NEXT_PUBLIC_GA_ID
Value: G-XXXXXXXXXX (replace with your GA4 measurement ID)
```

### Firebase Configuration (Required)
```
Name: NEXT_PUBLIC_FIREBASE_API_KEY
Value: AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX (get from Firebase Console)
```

```
Name: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
Value: your-project-id.firebaseapp.com
```

```
Name: NEXT_PUBLIC_FIREBASE_PROJECT_ID
Value: your-project-id
```

```
Name: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
Value: your-project-id.firebasestorage.app
```

```
Name: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
Value: YOUR_SENDER_ID
```

```
Name: NEXT_PUBLIC_FIREBASE_APP_ID
Value: 1:XXXXXXXXXX:web:XXXXXXXXXXXXXXXXXX
```

### Resend API (for email notifications)
```
Name: RESEND_API_KEY
Value: re_XXXXXXXXXXXXXXXXXXXXXXXX (get from resend.com dashboard)
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

### 3. Enable Firebase Storage
1. Click **Storage** → **Get Started**
2. Review security rules → **Next**
3. Choose same location as Firestore: **us-central**
4. Click **Done**

### 4. Deploy Security Rules
In your project directory:
```bash
npm install -g firebase-tools
firebase login
firebase init
# Select: Firestore and Storage
# Select: try-local-f0c44
# Use default files: firestore.rules, firestore.indexes.json, storage.rules
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### 5. Authorize Domain
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
