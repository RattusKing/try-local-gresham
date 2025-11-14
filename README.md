# Try Local — Gresham, Oregon

A professional digital marketplace and community platform connecting local residents with local businesses in Gresham, Oregon.

**Tagline:** Building a stronger Gresham, one local business at a time.

## 🚀 Features

### Current (Phase 1-3 Complete)

#### Phase 1: Foundation ✅
- ✅ **Modern Next.js Architecture** - Built with Next.js 15, React 18, TypeScript
- ✅ **Professional UI/UX** - Responsive design with smooth animations (Framer Motion)
- ✅ **SEO Optimized** - Meta tags, Open Graph, schema.org structured data, sitemap
- ✅ **Business Listings** - Browse and filter local businesses by category
- ✅ **Search Functionality** - Real-time search by name or tags
- ✅ **Legal Pages** - Privacy Policy, Terms of Service
- ✅ **Contact Form** - Professional contact page
- ✅ **Google Analytics** - Full tracking integration
- ✅ **Mobile Responsive** - Works beautifully on all devices

#### Phase 2: Firebase Backend ✅
- ✅ **Authentication System** - Email/password and Google OAuth
- ✅ **Firestore Database** - Real-time cloud database
- ✅ **Firebase Storage** - Image upload and hosting
- ✅ **Security Rules** - Role-based access control
- ✅ **User Profiles** - Customer, business owner, and admin roles

#### Phase 3: Dashboard System ✅
- ✅ **Business Owner Dashboard** - Create and manage business profiles
- ✅ **Admin Dashboard** - Approve/reject business applications
- ✅ **Customer Dashboard** - Profile management and quick links
- ✅ **Image Upload** - Business cover photo uploads to Firebase Storage
- ✅ **Business Approval Workflow** - Pending → Approved → Public visibility
- ✅ **Role-Based Navigation** - Automatic routing by user role

### Coming Soon (Phase 4-8)
- 🔜 **Subscriptions** - Business subscription tiers ($29-$79/month) with Stripe Billing
- 🔜 **Product Catalog** - Add products/services to business profiles
- 🔜 **E-commerce** - Shopping cart, checkout, Stripe payments
- 🔜 **Order Management** - Track and fulfill customer orders
- 🔜 **Appointment Scheduling** - Book services directly
- 🔜 **Delivery Integration** - Uber Direct and other delivery services
- 🔜 **Reviews & Ratings** - Customer feedback system

## 📋 Platform Details

### Revenue Model
- **2% Platform Fee** on all transactions
- **Business Subscriptions:**
  - Free Tier: Basic listing, limited products
  - Standard ($29/month): Full features, unlimited products
  - Premium ($79/month): Featured placement, analytics, priority support

### User Roles
- **Customers** - Browse, shop, favorite businesses, order services
- **Business Owners** - Manage storefronts, products, orders
- **Admins** - Approve businesses, moderate content

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Smooth animations
- **React 18** - Latest React features

### Backend
- **Firebase Authentication** - Email/password and Google OAuth
- **Firestore** - NoSQL cloud database
- **Firebase Storage** - File upload and hosting
- **Stripe Connect** (Phase 5) - Payment processing and marketplace payments
- **Uber Direct API** (Phase 7) - Delivery integration
- **SendGrid/Mailgun** (Phase 5) - Email notifications

## 📦 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd try-local-gresham
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and add your credentials:
   - Google Analytics ID
   - Firebase config (Phase 2)
   - Stripe keys (Phase 5)

4. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## 🎨 Design System

### Colors
- **Primary Orange:** `#FF7A00` - Call-to-actions, branding
- **Primary Green:** `#13A10E` - Success states, accents
- **Primary Black:** `#0B0B0B` - Text, outlines
- **Background:** `#F7F7F5` - Off-white, warm background

### Typography
- **Font:** Inter (Google Fonts)
- **Weights:** 400, 500, 600, 700, 800

## 🚢 Deployment

### Recommended Platforms
- **Vercel** (recommended) - Automatic deployments, edge functions
- **Netlify** - Great for static + serverless
- **AWS Amplify** - Scalable, enterprise-grade

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Environment Variables Required
Set these in your hosting platform:
- `NEXT_PUBLIC_GA_ID` - Google Analytics
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase API Key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase Auth Domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase Project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase Storage Bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase Messaging Sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase App ID

See `VERCEL_ENV_SETUP.md` for detailed Vercel deployment instructions.

## 📝 Development Roadmap

### ✅ Phase 1: Foundation & Polish (COMPLETE)
- Next.js migration with TypeScript
- SEO optimization
- Legal pages
- Contact form
- Professional animations
- Google Analytics setup

### ✅ Phase 2: Backend & Authentication (COMPLETE)
- Firebase setup (Authentication, Firestore, Storage)
- User authentication (email/password, Google OAuth)
- Role-based access control (customer, business_owner, admin)
- Database schema with security rules
- See `FIREBASE_SETUP.md` for setup guide

### ✅ Phase 3: Business Management (COMPLETE)
- Business profile creation and editing
- Owner dashboard with image upload
- Admin approval workflow
- Customer profile management
- Role-based dashboard navigation
- See `PHASE_3_DASHBOARD.md` for full details

### 🔜 Phase 4: Subscription System (Next)
- Stripe Billing integration
- Three subscription tiers (Free, $29, $79)
- Payment management dashboard
- Subscription status tracking

### 🔜 Phase 5: E-commerce & Payments
- Product/service catalog
- Shopping cart & checkout
- Stripe Connect marketplace (2% platform fee)
- Order management system
- Email notifications

### 🔜 Phase 6: Scheduling & Appointments
- Calendar booking system
- Time slot management
- SMS reminders

### 🔜 Phase 7: Delivery Integration
- Uber Direct API
- Delivery tracking
- Local pickup options

### 🔜 Phase 8: Advanced Features
- Reviews and ratings system
- Advanced search (Algolia)
- Loyalty programs
- Gift cards

## 📞 Contact

- **Email:** hello@trylocalor.com
- **Business Inquiries:** business@trylocalor.com
- **Support:** support@trylocalor.com

---

Built with ❤️ for the Gresham community
