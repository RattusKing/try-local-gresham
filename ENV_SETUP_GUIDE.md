# Environment Variables Setup Guide

This guide shows you exactly where to find each environment variable needed for Try Local.

## 🚀 Quick Start

### 1. Firebase Setup (5 minutes)

**Get your Firebase credentials:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (or create a new one)
3. Click the **gear icon ⚙️** → **Project settings**
4. Scroll to "Your apps" section
5. Click the **</>** (web) icon to add a web app (if you haven't already)
6. Copy all the values from the `firebaseConfig` object

**Add to Vercel:**
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=try-local-gresham.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=try-local-gresham
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=try-local-gresham.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

**Add to `.env.local` (for development):**
```bash
# Copy the same values above
NEXT_PUBLIC_FIREBASE_API_KEY=...
# etc.
```

---

### 2. Resend Setup (2 minutes)

**Get your Resend API key for sending emails:**

1. Sign up at [resend.com](https://resend.com) (free tier: 3,000 emails/month)
2. Verify your email
3. Go to **API Keys** in sidebar
4. Click **Create API Key**
5. Name it "Try Local Production"
6. Copy the key (starts with `re_`)

**⚠️ Important:** Save immediately - you can only see it once!

**Add to Vercel:**
```bash
RESEND_API_KEY=re_abc123def456...
```

**Add to `.env.local`:**
```bash
RESEND_API_KEY=re_abc123def456...
```

---

### 3. Contact Email (30 seconds)

**Set where contact form emails should go:**

This is just YOUR email address where you want to receive messages.

**Add to Vercel:**
```bash
CONTACT_EMAIL=support@try-local.com
# Or use your personal email:
# CONTACT_EMAIL=your.name@gmail.com
```

**Add to `.env.local`:**
```bash
CONTACT_EMAIL=your.email@example.com
```

---

### 4. Sentry Setup (Optional, 5 minutes)

**Get error monitoring (recommended for production):**

1. Sign up at [sentry.io](https://sentry.io) (free tier: 5k errors/month)
2. Click **Create Project**
3. Choose **Next.js** as platform
4. Name it "Try Local Gresham"
5. Click **Create Project**
6. Copy the DSN from the quick setup page
   - Or go to **Settings** → **Projects** → **Try Local Gresham** → **Client Keys (DSN)**

**Add to Vercel:**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://abc123@o456789.ingest.sentry.io/123456
```

**Add to `.env.local`:**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://abc123@o456789.ingest.sentry.io/123456
```

**Skip Sentry?** That's fine! Error monitoring still works in development (console logs). You can add it later.

---

## 📋 Complete `.env.local` Template

Create a `.env.local` file in your project root:

```bash
# Firebase (Required)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Email Service (Required)
RESEND_API_KEY=re_abc123def456...
CONTACT_EMAIL=your.email@example.com

# Error Monitoring (Optional)
NEXT_PUBLIC_SENTRY_DSN=https://abc123@o456789.ingest.sentry.io/123456
```

---

## 🚀 Adding to Vercel

### Option 1: Via Vercel Dashboard (Easiest)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Key:** `NEXT_PUBLIC_FIREBASE_API_KEY`
   - **Value:** Your Firebase API key
   - **Environment:** Select all (Production, Preview, Development)
5. Click **Save**
6. Repeat for all variables

### Option 2: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Add environment variables
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
# (paste your value when prompted)

# Or pull from .env.local
vercel env pull
```

---

## ✅ Verification Checklist

After setting up, verify everything works:

### Local Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
# Try signing in, sending a contact form, etc.
```

### Production Deployment
```bash
# Build and check for errors
npm run build

# If successful, deploy
vercel --prod
```

### Test These Features:
- [ ] Sign up / Sign in works
- [ ] Contact form sends email
- [ ] No console errors about missing env vars
- [ ] Sentry captures errors (if configured)

---

## 🔒 Security Notes

### What's Safe to Commit?
- ✅ **NEVER** commit `.env.local` (already in `.gitignore`)
- ✅ Firebase keys with `NEXT_PUBLIC_` are safe to expose (they're client-side)
- ❌ **NEVER** commit `RESEND_API_KEY` (server-side secret)
- ❌ **NEVER** commit actual Firebase Admin SDK keys (not used in this project)

### Firebase Security
Your Firebase keys are PUBLIC (by design), but security comes from:
- **Firestore Rules** (already configured in this project)
- **Authentication Rules** (users can only access their own data)

---

## 🆘 Troubleshooting

### "Firebase configuration missing" error
- Check that all `NEXT_PUBLIC_FIREBASE_*` variables are set
- Restart your dev server after adding env vars
- Make sure there are no typos in variable names

### Contact form not sending emails
- Verify `RESEND_API_KEY` is correct (starts with `re_`)
- Check your Resend dashboard for error logs
- Verify `CONTACT_EMAIL` is a valid email address

### Sentry not capturing errors
- Verify `NEXT_PUBLIC_SENTRY_DSN` is correct
- Check that it starts with `https://`
- Trigger a test error and check Sentry dashboard

### Build fails with "Cannot read properties of undefined"
- This usually means a required env var is missing at build time
- Check Vercel logs to see which variable is missing

---

## 📚 Additional Resources

- [Firebase Setup Guide](./FIREBASE_SETUP.md)
- [Email Setup Guide](./EMAIL_SETUP.md)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

**Need help?** Check the existing setup guides or create an issue in the repository.
