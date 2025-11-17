# Quick Deploy to Vercel - Try Local Gresham

## 🚀 Fast Track Deployment (5 Minutes)

### Step 1: Push to GitHub
```bash
git push origin main
```

### Step 2: Import to Vercel
1. Go to https://vercel.com/new
2. Click **Import Git Repository**
3. Select **try-local-gresham**
4. Click **Import**

### Step 3: Add Environment Variables

Click **Environment Variables** and add these:

#### Required Variables (Copy from Firebase Console)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD0APzjW3laEnnPiJ2l7lvxzEbrSlKW3Bo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=try-local-f0c44.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=try-local-f0c44
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=try-local-f0c44.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=178136427645
NEXT_PUBLIC_FIREBASE_APP_ID=1:178136427645:web:086f63ac76fc5e868f9514
NEXT_PUBLIC_APP_URL=https://your-vercel-url.vercel.app
```

**⚠️ Replace `your-vercel-url.vercel.app` with your actual Vercel URL after deployment**

#### Optional (for email notifications)
```bash
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=Try Local Gresham <noreply@yourdomain.com>
NEXT_PUBLIC_GA_ID=G-HJK5MY2G2H
```

**For each variable:**
- ✅ Check: Production
- ✅ Check: Preview
- ✅ Check: Development

### Step 4: Deploy
Click **Deploy** button

⏱️ Takes about 2-3 minutes

---

## Post-Deployment Setup

### 1. Update APP_URL
After deployment, you'll get a URL like `try-local-gresham.vercel.app`

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Find `NEXT_PUBLIC_APP_URL`
3. Update to: `https://try-local-gresham.vercel.app`
4. Go to Deployments → Redeploy latest

### 2. Add Domain to Firebase

Firebase Console → Authentication → Settings → Authorized domains

Click **Add domain** and add:
```
try-local-gresham.vercel.app
```

### 3. Test Your Site ✅

Visit your deployed URL and test:
- [x] Sign up with email works
- [x] Google sign-in works
- [x] Browse businesses works
- [x] Everything loads properly

### 4. Create Your Admin Account

1. Sign up on your site
2. Firebase Console → Firestore Database → users collection
3. Find your user → Edit
4. Set `role` to `admin`
5. Refresh site - you now have admin access!

---

## ⚡ That's It!

Your app is live at: `https://your-domain.vercel.app`

### Next Steps:
- [ ] Set up custom domain (optional)
- [ ] Set up Resend for emails (optional)
- [ ] Enable Google Analytics (optional)
- [ ] Start approving businesses!

### Need Help?
- See `PRODUCTION_DEPLOYMENT_CHECKLIST.md` for full details
- See `VERCEL_ENV_SETUP.md` for environment variable details
- See `FIREBASE_SETUP.md` for Firebase configuration

---

**🎉 Congratulations! Your Try Local Gresham platform is live!**
