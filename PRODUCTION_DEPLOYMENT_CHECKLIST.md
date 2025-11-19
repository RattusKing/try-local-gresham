# Try Local Gresham - Production Deployment Checklist

## Pre-Deployment Checklist

### 1. Firebase Configuration ✅
- [x] Firebase project created
- [x] Firestore Database enabled
- [x] Firebase Storage enabled (Blaze plan)
- [x] Firebase Authentication enabled
  - [x] Email/Password provider enabled
  - [x] Google OAuth provider enabled
- [x] Firestore rules deployed (9 collections)
- [x] Storage rules deployed (businesses/, products/)
- [x] Firestore indexes created (4 indexes)

### 2. Environment Variables Required

#### Firebase (Required)
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=try-local.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=try-local
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=try-local.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### Application (Required)
```
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

#### Email Service (Optional but Recommended)
```
RESEND_API_KEY=re_your_actual_api_key
EMAIL_FROM=Try Local Gresham <noreply@yourdomain.com>
```

#### Analytics (Optional)
```
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### 3. Domain Configuration

#### Firebase Authorized Domains
Go to Firebase Console → Authentication → Settings → Authorized domains

Add your domains:
- [x] `localhost` (for local development)
- [ ] Your production domain (e.g., `try-local.com`)
- [ ] Your Vercel domain (e.g., `try-local-gresham.vercel.app`)

### 4. Email Service Setup (Resend)

If using email notifications:
1. [ ] Sign up at https://resend.com
2. [ ] Generate API key
3. [ ] Verify your sending domain (optional but recommended)
4. [ ] Add RESEND_API_KEY to environment variables
5. [ ] Test email sending

### 5. Google Analytics (Optional)

If using analytics:
1. [ ] Create GA4 property at https://analytics.google.com
2. [ ] Get Measurement ID (G-XXXXXXXXXX)
3. [ ] Add NEXT_PUBLIC_GA_ID to environment variables

### 6. Code Review

- [ ] No console.log() statements in production code
- [ ] No hardcoded API keys or secrets
- [ ] Error handling implemented for all API calls
- [ ] Loading states implemented for async operations
- [ ] All environment variables documented

### 7. Security Review

- [ ] Firestore rules tested and verified
- [ ] Storage rules tested and verified
- [ ] CORS configured if needed
- [ ] Rate limiting considered (Firebase has built-in)
- [ ] User input validation implemented

### 8. Performance

- [ ] Images optimized (or using Next.js Image component)
- [ ] Build tested locally (`npm run build`)
- [ ] No TypeScript errors
- [ ] No ESLint errors (or acceptable warnings documented)

## Deployment Steps (Vercel)

### Option 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Option 2: Deploy via GitHub Integration

1. [ ] Push code to GitHub
2. [ ] Go to https://vercel.com/new
3. [ ] Import your GitHub repository
4. [ ] Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next
5. [ ] Add environment variables (see section 2 above)
6. [ ] Deploy

### Post-Deployment Verification

#### Test Authentication
- [ ] Sign up with email/password works
- [ ] Sign in with email/password works
- [ ] Google OAuth sign-in works
- [ ] Sign out works
- [ ] Password reset works (if implemented)

#### Test Business Features
- [ ] Business owner can create profile (goes to pending)
- [ ] Admin can approve business
- [ ] Approved business appears on homepage
- [ ] Business owner can upload cover photo
- [ ] Business owner can add products
- [ ] Business owner can upload product images

#### Test Customer Features
- [ ] Customers can browse businesses
- [ ] Customers can view business details
- [ ] Customers can add items to cart
- [ ] Customers can place orders
- [ ] Customers can view order history
- [ ] Customers can favorite businesses

#### Test Admin Features
- [ ] Admin can view pending applications
- [ ] Admin can approve/reject businesses
- [ ] Admin can manage promotional banners
- [ ] Admin can view all orders

#### Test Email Notifications (if enabled)
- [ ] Order confirmation email sent to customer
- [ ] New order notification sent to business
- [ ] Business application received email sent
- [ ] Business approved email sent
- [ ] Order status update emails sent

#### Performance & Monitoring
- [ ] Page load times acceptable (< 3s)
- [ ] Images loading properly
- [ ] No console errors in browser
- [ ] Mobile responsive design working
- [ ] All links working

### Production Checklist

- [ ] Custom domain configured in Vercel
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Favicon added
- [ ] OG images for social sharing working
- [ ] Sitemap accessible at /sitemap.xml
- [ ] robots.txt configured (if needed)
- [ ] 404 page working
- [ ] Error boundary implemented

## Creating Your First Admin User

After deployment:

1. Sign up on your production site with your admin email
2. Go to Firebase Console → Firestore Database
3. Find the `users` collection
4. Find your user document (by email)
5. Edit the document and set: `role: "admin"`
6. Save
7. Refresh your site - you should now have admin access

## Budget Alerts (Recommended)

### Firebase
1. Go to Firebase Console → Project Settings → Usage and billing
2. Set up budget alerts (e.g., $5, $10, $20)
3. You'll receive email notifications when approaching limits

### Vercel
1. Go to Vercel Dashboard → Settings → Billing
2. Review usage limits for your plan
3. Free tier includes:
   - 100GB bandwidth/month
   - Unlimited deployments
   - Automatic HTTPS

### Resend (if using)
1. Go to Resend Dashboard → Billing
2. Free tier: 100 emails/day, 3,000/month
3. Set up notifications for usage

## Monitoring & Maintenance

### Daily
- [ ] Check Firebase usage (Authentication, Firestore, Storage)
- [ ] Monitor error logs in Vercel dashboard
- [ ] Review new business applications (if admin)

### Weekly
- [ ] Review order activity
- [ ] Check email delivery success rate
- [ ] Monitor site performance via Google Analytics
- [ ] Backup important data (optional)

### Monthly
- [ ] Review Firebase costs
- [ ] Review Vercel costs
- [ ] Update dependencies if needed
- [ ] Security patches applied

## Support Resources

- **Firebase Documentation**: https://firebase.google.com/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **Vercel Documentation**: https://vercel.com/docs
- **Resend Documentation**: https://resend.com/docs

## Rollback Plan

If something goes wrong:

1. Vercel makes rollback easy - go to Deployments and redeploy a previous version
2. Firebase rules can be manually reverted in Console
3. Database can be rolled back using Firebase backups (if configured)

---

**Last Updated**: Ready for production deployment
**Firebase Status**: ✅ Configured
**Code Status**: ✅ Ready
**Environment Variables**: ⚠️ Need to be added to Vercel
