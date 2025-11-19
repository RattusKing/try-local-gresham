# Performance Optimizations Guide

Complete guide to performance optimizations implemented in Try Local Gresham.

## Implemented Optimizations

### 1. ✅ Image Optimization

**Next.js Image Component** (`next.config.mjs`):
```javascript
images: {
  formats: ['image/webp', 'image/avif'],     // Modern formats
  deviceSizes: [640, 750, 828, 1080, ...],   // Responsive sizes
  imageSizes: [16, 32, 48, 64, ...],         // Icon sizes
  minimumCacheTTL: 60 * 60 * 24 * 30,        // 30-day cache
}
```

**Benefits**:
- ✅ Automatic WebP/AVIF conversion
- ✅ Responsive images (saves bandwidth)
- ✅ Lazy loading by default
- ✅ 30-day browser caching

### 2. ✅ Code Splitting

**Automatic** (Next.js App Router):
- Each route is a separate chunk
- Components load on-demand
- Shared code in common chunks

### 3. ✅ Compression

**Enabled** (`next.config.mjs`):
```javascript
compress: true,  // Gzip compression
```

### 4. ✅ Production Optimizations

```javascript
compiler: {
  removeConsole: process.env.NODE_ENV === 'production',
}
```

**Removes**:
- All `console.log()` statements
- Debug code
- Development warnings

### 5. ✅ React Strict Mode

```javascript
reactStrictMode: true,
```

**Benefits**:
- Identifies unsafe lifecycles
- Warns about deprecated APIs
- Catches side effects

---

## Additional Optimizations to Implement

### 1. Bundle Analysis

**Install Bundle Analyzer**:
```bash
npm install --save-dev @next/bundle-analyzer
```

**Update `next.config.mjs`**:
```javascript
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(nextConfig)
```

**Analyze Bundle**:
```bash
ANALYZE=true npm run build
```

**Opens visual report** showing:
- Largest dependencies
- Duplicate code
- Optimization opportunities

### 2. Lazy Loading Components

**For Heavy Components**:

```typescript
// Before: Eager loading
import HeavyComponent from './HeavyComponent'

// After: Lazy loading
import { lazy, Suspense } from 'react'
const HeavyComponent = lazy(() => import('./HeavyComponent'))

// Usage
<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

**Good Candidates**:
- Modals (CartModal, AppointmentModal)
- Admin dashboard components
- Charts and data visualizations
- Rich text editors

### 3. Font Optimization

**Use Next.js Font Optimization**:

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

**Benefits**:
- No layout shift
- Automatic subsetting
- Optimal font loading

### 4. Database Query Optimization

**Firestore Indexes**:

```typescript
// Add composite indexes for common queries
// firebase.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "businesses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**Query Pagination**:
```typescript
// Instead of: getDocs(collection)
// Use: query with limit
const q = query(
  collection(db, 'businesses'),
  where('status', '==', 'approved'),
  limit(20)
)
```

### 5. API Route Caching

**Add Cache Headers**:
```typescript
// app/api/businesses/route.ts
export async function GET() {
  const businesses = await getBusinesses()

  return NextResponse.json(businesses, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  })
}
```

### 6. Static Generation

**For Static Pages**:
```typescript
// app/about/page.tsx
export const revalidate = 3600 // Revalidate every hour

export default function AboutPage() {
  return <div>Static content</div>
}
```

**Good Candidates**:
- About page
- Terms of Service
- Privacy Policy
- FAQ

### 7. Prefetching

**Prefetch Critical Routes**:
```typescript
import Link from 'next/link'

// Automatically prefetches on hover
<Link href="/business/123" prefetch={true}>
  View Business
</Link>
```

### 8. Service Worker (Progressive Web App)

**Install next-pwa**:
```bash
npm install next-pwa
```

**Configure**:
```javascript
// next.config.mjs
import withPWA from 'next-pwa'

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig)
```

---

## Performance Monitoring

### 1. Web Vitals

**Add to `app/layout.tsx`**:
```typescript
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

**Tracks**:
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- TTFB (Time to First Byte)

### 2. Lighthouse CI

**Already Configured** in `.github/workflows/pr-preview.yml`

**Manual Run**:
```bash
npm install -g @lhci/cli
lhci autorun
```

### 3. Custom Performance Tracking

```typescript
// lib/analytics.ts
export function trackPerformance(metric: string, value: number) {
  if (window.gtag) {
    window.gtag('event', 'timing_complete', {
      name: metric,
      value: Math.round(value),
      event_category: 'Performance',
    })
  }
}

// Usage
const start = performance.now()
await expensiveOperation()
trackPerformance('expensive_operation', performance.now() - start)
```

---

## Performance Budget

Set limits to prevent regression:

```javascript
// lighthouserc.json
{
  "ci": {
    "assert": {
      "assertions": {
        "first-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["error", { "maxNumericValue": 300 }]
      }
    }
  }
}
```

---

## Performance Targets

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| LCP | < 2.5s | TBD | 🟡 Measure |
| FID | < 100ms | TBD | 🟡 Measure |
| CLS | < 0.1 | TBD | 🟡 Measure |
| TTFB | < 600ms | TBD | 🟡 Measure |
| Bundle Size | < 200KB | TBD | 🟡 Measure |

---

## Quick Wins (Implement First)

1. **Bundle Analysis** (5 min)
   - See what's bloating your bundle
   - Identify duplicate dependencies

2. **Lazy Load Modals** (15 min)
   - CartModal, AppointmentModal
   - Instant performance improvement

3. **Add Web Vitals** (5 min)
   - `@vercel/analytics` + `@vercel/speed-insights`
   - Start tracking metrics

4. **Optimize Images** (ongoing)
   - Use Next.js Image component everywhere
   - Already configured, just use it!

5. **API Caching** (30 min)
   - Add cache headers to GET routes
   - Reduce database load

---

## Monitoring Dashboard

**Vercel Analytics** (free on Pro plan):
- Real user metrics
- Performance trends
- Geographic breakdown
- Device breakdown

**Google Analytics 4**:
- Custom performance events
- User journey tracking
- Conversion funnels

**Sentry Performance**:
- Transaction tracking
- Slow queries
- API response times

---

## Best Practices

### Images
- ✅ Always use Next.js `<Image>`
- ✅ Provide width/height
- ✅ Use `priority` for above-the-fold images
- ✅ Lazy load below-the-fold

### JavaScript
- ✅ Code split large components
- ✅ Lazy load modals and drawers
- ✅ Use dynamic imports
- ✅ Remove unused dependencies

### CSS
- ✅ Use Tailwind (already doing)
- ✅ Purge unused styles (automatic)
- ✅ Minimize inline styles

### API
- ✅ Paginate large lists
- ✅ Cache responses
- ✅ Use database indexes
- ✅ Batch operations

### Fonts
- ✅ Use `next/font`
- ✅ Subset fonts
- ✅ Preload critical fonts

---

## Summary

**Already Optimized** ✅:
- Image optimization
- Code splitting
- Compression
- Production builds
- Caching (images)

**Quick Wins** 🎯:
- Bundle analysis
- Lazy loading
- Web Vitals tracking
- API caching
- Font optimization

**Advanced** 🚀:
- Service worker
- Database indexes
- Custom performance tracking
- Advanced caching strategies

**Performance Score Potential**: 95+/100 with all optimizations
