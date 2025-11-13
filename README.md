# Try Local — Gresham, Oregon

A professional digital marketplace and community platform connecting local residents with local businesses in Gresham, Oregon.

**Tagline:** Building a stronger Gresham, one local business at a time.

## 🚀 Features

### Current (Phase 1 - Complete)
- ✅ **Modern Next.js Architecture** - Built with Next.js 15, React 18, TypeScript
- ✅ **Professional UI/UX** - Responsive design with smooth animations (Framer Motion)
- ✅ **SEO Optimized** - Meta tags, Open Graph, schema.org structured data, sitemap
- ✅ **Business Listings** - Browse and filter local businesses by category
- ✅ **Search Functionality** - Real-time search by name or tags
- ✅ **Legal Pages** - Privacy Policy, Terms of Service
- ✅ **Contact Form** - Professional contact page (email integration pending)
- ✅ **Google Analytics** - Ready for tracking (add your GA ID)
- ✅ **Mobile Responsive** - Works beautifully on all devices

### Coming Soon (Phase 2-8)
- 🔜 **Firebase Backend** - Authentication, database, real-time updates
- 🔜 **Business Dashboard** - Manage listings, products, orders
- 🔜 **E-commerce** - Shopping cart, checkout, Stripe payments
- 🔜 **Subscriptions** - Business subscription tiers ($29-$79/month)
- 🔜 **Appointment Scheduling** - Book services directly
- 🔜 **Delivery Integration** - Uber Direct and other delivery services
- 🔜 **Reviews & Ratings** - Customer feedback system
- 🔜 **Admin Portal** - Business approval and moderation

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

### Backend (Coming in Phase 2)
- **Firebase** - Authentication, Firestore database
- **Stripe Connect** - Payment processing and marketplace payments
- **Uber Direct API** - Delivery integration
- **SendGrid/Mailgun** - Email notifications

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
- (More in future phases)

## 📝 Development Roadmap

### ✅ Phase 1: Foundation & Polish (COMPLETE)
- Next.js migration with TypeScript
- SEO optimization
- Legal pages
- Contact form
- Professional animations
- Google Analytics setup

### 🔄 Phase 2: Backend & Authentication (Next)
- Firebase setup
- User authentication (email, OAuth)
- Role-based access control
- Database schema design

### 🔄 Phase 3: Business Management
- Business profile pages
- Owner dashboard
- Product/service management

### 🔄 Phase 4: Subscription System
- Stripe Billing integration
- Subscription tiers

### 🔄 Phase 5: E-commerce & Payments
- Shopping cart & checkout
- Stripe Connect marketplace
- Order management

### 🔄 Phase 6: Scheduling & Appointments
- Calendar booking system

### 🔄 Phase 7: Delivery Integration
- Uber Direct API

### 🔄 Phase 8: Advanced Features
- Reviews, ratings, loyalty programs

## 📞 Contact

- **Email:** hello@trylocalor.com
- **Business Inquiries:** business@trylocalor.com
- **Support:** support@trylocalor.com

---

Built with ❤️ for the Gresham community
