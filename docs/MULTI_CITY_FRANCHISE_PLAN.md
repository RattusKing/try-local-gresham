# Multi-City Franchise Architecture Plan

> **Status:** Planning Complete - Ready for Implementation
> **Created:** January 2025
> **Last Updated:** January 2025

This document outlines the architecture and implementation plan for expanding Try Local from a single-city (Gresham) platform to a multi-city, franchisable platform.

---

## Table of Contents

1. [Vision Overview](#vision-overview)
2. [Business Model](#business-model)
3. [Role Model](#role-model)
4. [Data Model Changes](#data-model-changes)
5. [Site Structure](#site-structure)
6. [Key User Flows](#key-user-flows)
7. [Stripe & Revenue](#stripe--revenue)
8. [Migration Strategy](#migration-strategy)
9. [Implementation Phases](#implementation-phases)
10. [Current State Assessment](#current-state-assessment)
11. [Future Considerations](#future-considerations)

---

## Vision Overview

Transform Try Local from a Gresham-only platform into a franchisable multi-city platform where:

- **Users** can browse and purchase from any city
- **Franchise owners** control their city and keep their revenue
- **Businesses** belong to specific cities with city-admin approval
- **Try Local (core team)** manages the platform and sells franchises

### Key Principles

- One-time franchise fee (no ongoing royalties)
- Franchise owners keep 100% of their city's platform fees
- Global user accounts that work across all cities
- Consistent "Try Local [City]" branding
- US-first expansion (Portland, Seattle, Milwaukie, etc.)

---

## Business Model

### Franchise Structure

| Aspect | Detail |
|--------|--------|
| **Franchise Fee** | One-time payment |
| **Ongoing Royalties** | None - franchisee keeps all revenue |
| **Platform Fee** | 2% per transaction (goes to city franchise owner) |
| **Target Markets** | US Pacific Northwest first, then expand |

### Revenue Flow

```
Customer pays $100 for order
    ├── Business receives: $98 (98%)
    └── Franchise owner receives: $2 (2% platform fee)

Try Local (core) receives: $0 ongoing
    └── Already received one-time franchise fee
```

### Gresham Exception

Gresham remains operated by the core team (no franchise fee paid). The core team acts as both `super_admin` and `city_admin` for Gresham.

---

## Role Model

### User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `super_admin` | Platform owner (core team) | Manage all cities, create city_admins, platform settings, global analytics, approve franchise applications |
| `city_admin` | Franchise owner | Approve businesses for their city, manage city settings, view city analytics, configure neighborhoods/delivery zones |
| `business_owner` | Local business | Manage their business, products, orders within their city |
| `customer` | End user | Browse any city, purchase from any city, global account |

### Permission Matrix

| Action | super_admin | city_admin | business_owner | customer |
|--------|-------------|------------|----------------|----------|
| Create cities | ✅ | ❌ | ❌ | ❌ |
| Approve businesses (own city) | ✅ | ✅ | ❌ | ❌ |
| Approve businesses (other cities) | ✅ | ❌ | ❌ | ❌ |
| Configure city settings | ✅ | ✅ (own) | ❌ | ❌ |
| View city analytics | ✅ | ✅ (own) | ❌ | ❌ |
| Manage business | ✅ | ✅ (own city) | ✅ (own) | ❌ |
| Browse/purchase | ✅ | ✅ | ✅ | ✅ |

---

## Data Model Changes

### New: City Collection

```typescript
interface City {
  id: string                    // Auto-generated
  slug: string                  // "gresham", "portland" (URL-safe)
  name: string                  // "Gresham"
  displayName: string           // "Try Local Gresham"

  // Location
  country: string               // "US"
  state: string                 // "OR"
  timezone: string              // "America/Los_Angeles"

  // Configuration
  currency: string              // "USD"
  neighborhoods: string[]       // ["Downtown", "Rockwood", "Powell Valley", ...]
  deliveryZones: DeliveryZone[] // Moved from hardcoded delivery.ts

  // Status
  status: 'active' | 'coming_soon' | 'inactive'

  // Administration
  adminIds: string[]            // User IDs who are city_admin for this city

  // Stripe (for franchise fee routing)
  stripeAccountId?: string      // Franchise owner's connected Stripe account

  // Metadata
  businessCount?: number        // Cached count for landing page
  createdAt: Timestamp
  updatedAt: Timestamp
}

interface DeliveryZone {
  name: string
  zipCodes: string[]
  fee: number
  estimatedMinutes: number
}
```

### Updated: Business

```typescript
interface Business {
  // ... all existing fields remain ...

  // NEW FIELDS
  cityId: string               // Required - references City.id

  // neighborhood stays the same, but validated against city.neighborhoods
}
```

### Updated: UserProfile

```typescript
interface UserProfile {
  // ... all existing fields remain ...

  // UPDATED FIELD
  role: 'customer' | 'business_owner' | 'city_admin' | 'super_admin'

  // NEW FIELDS
  adminCityIds?: string[]      // If city_admin, which city IDs they manage
  currentCityId?: string       // Currently browsing city (UX preference)
  homeCityId?: string          // User's home city (optional)
}
```

### Firestore Indexes Required

```json
{
  "indexes": [
    {
      "collectionGroup": "businesses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "cityId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "businesses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "cityId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "neighborhood", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "cities",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## Site Structure

### URL Architecture

```
trylocal.com/                          → Landing page (city directory)
trylocal.com/franchise                 → Franchise application

trylocal.com/gresham                   → Gresham home (current experience)
trylocal.com/gresham/businesses        → Browse Gresham businesses
trylocal.com/gresham/businesses/[id]   → Business detail
trylocal.com/gresham/apply             → Business application (Gresham)
trylocal.com/gresham/dashboard         → User dashboard (scoped to Gresham)

trylocal.com/portland                  → Portland home
trylocal.com/portland/businesses       → Browse Portland businesses
... (same pattern for all cities)
```

### Redirects (Backwards Compatibility)

```
/businesses        → /gresham/businesses (301)
/businesses/[id]   → /gresham/businesses/[id] (301)
/apply             → /gresham/apply (301)
/dashboard         → /gresham/dashboard (301)
/dashboard/*       → /gresham/dashboard/* (301)
```

### Landing Page Design

```
┌─────────────────────────────────────────────────────────────┐
│  TRY LOCAL                              [Start a Franchise] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│         Discover & Support Local Businesses                 │
│              in Communities Everywhere                      │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ GRESHAM  │  │ PORTLAND │  │ SEATTLE  │  │   YOUR   │    │
│  │    OR    │  │    OR    │  │    WA    │  │   CITY?  │    │
│  │ 47 shops │  │ 120 shops│  │ 89 shops │  │  ──────  │    │
│  │ [Browse] │  │ [Browse] │  │ [Browse] │  │ [Apply]  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                             │
│  ───────────── Coming Soon ─────────────                    │
│  Milwaukie • Beaverton • Tacoma • Eugene                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  How It Works    For Businesses    For Franchises    About  │
└─────────────────────────────────────────────────────────────┘
```

---

## Key User Flows

### 1. Customer Browsing Multiple Cities

```
User opens trylocal.com
    ↓
Sees city directory, clicks "Portland"
    ↓
Browses Portland businesses
    ↓
Uses city switcher in header → selects "Seattle"
    ↓
Now browsing Seattle businesses
    ↓
Adds items to cart from Seattle business
    ↓
Checkout (pickup in Seattle)
```

### 2. Business Approval (City Admin)

```
Business owner in Portland submits application
    ↓
Application includes cityId: "portland"
    ↓
Portland city_admin sees pending business in dashboard
    ↓
Reviews application, approves/rejects
    ↓
If approved: Business status → 'approved', visible on Portland
```

### 3. Business City Transfer

```
Gresham business wants to relocate to Portland
    ↓
Business owner requests transfer in dashboard
    ↓
Selects new city: Portland
    ↓
Business status → 'pending_transfer'
    ↓
Portland city_admin sees transfer request
    ↓
Reviews and approves
    ↓
Business.cityId updated to "portland"
    ↓
Business may need to update neighborhood, delivery zones
```

### 4. Franchise Onboarding

```
Interested party visits trylocal.com/franchise
    ↓
Fills out application (city, contact info, business plan)
    ↓
super_admin reviews application
    ↓
If approved: Send payment link for franchise fee
    ↓
Payment received
    ↓
Create City document (status: 'coming_soon')
    ↓
Create user account with city_admin role
    ↓
Franchise owner accesses city setup wizard
    ↓
Configures: neighborhoods, delivery zones, settings
    ↓
Connects Stripe account for fee collection
    ↓
super_admin flips city status → 'active'
    ↓
City appears on landing page, open for business applications
```

---

## Stripe & Revenue

### Current Setup (Keep)

- Try Local is a Stripe Connect platform
- Each business has a connected Stripe account
- Platform collects payment, transfers to business minus fee

### Multi-City Fee Routing

**Option Selected: Platform routes fees to franchise owners**

```
Payment flow:
1. Customer pays $100
2. Stripe processes payment to Try Local platform
3. Platform calculates:
   - Business amount: $98
   - Platform fee: $2
4. Platform looks up business.cityId → city.stripeAccountId
5. Transfer $98 to business connected account
6. Transfer $2 to franchise owner connected account (if not Gresham)
   - For Gresham: $2 stays with platform (core team)
```

### Implementation Notes

- Franchise owners must complete Stripe Connect onboarding
- City document stores `stripeAccountId` for fee routing
- Gresham has no `stripeAccountId` (fees stay with platform)
- Payment intent creation needs city-aware fee routing logic

---

## Migration Strategy

### Principles

1. **Zero downtime** - Gresham keeps running throughout
2. **Additive changes only** - Never remove/rename fields
3. **Defaults to Gresham** - Missing data assumes Gresham
4. **Backwards compatible URLs** - Redirects preserve old links
5. **Rollback ready** - Each step can be reversed

### Step-by-Step Migration

#### Step 1: Database Preparation (No Code Changes)

```bash
# 1. Backup Firestore (required before any changes)

# 2. Create Gresham city document
{
  slug: "gresham",
  name: "Gresham",
  displayName: "Try Local Gresham",
  country: "US",
  state: "OR",
  timezone: "America/Los_Angeles",
  currency: "USD",
  neighborhoods: ["Downtown", "Rockwood", "Powell Valley", "Central", "North Gresham", "Southeast"],
  deliveryZones: [
    { zipCodes: ["97030", "97080"], fee: 5.00, estimatedMinutes: 30 },
    { zipCodes: ["97230", "97233", "97236"], fee: 7.50, estimatedMinutes: 45 }
  ],
  status: "active",
  adminIds: ["<your-user-id>"],
  createdAt: <timestamp>
}

# 3. Run migration script to add cityId to all businesses
# UPDATE businesses SET cityId = "gresham" WHERE cityId IS NULL

# 4. Verify: All businesses have cityId
```

#### Step 2: Deploy Backwards-Compatible Code

- Business queries include `cityId` filter with default
- User profile reads `currentCityId` with Gresham default
- All existing functionality works unchanged

#### Step 3: Add URL Redirects

- Configure redirects in `next.config.js` or Vercel
- Old URLs redirect to `/gresham/*` equivalents
- Test all existing bookmarks/links work

#### Step 4: Deploy City-Aware Routes

- New route structure: `/[city]/businesses`, etc.
- City context provider wraps city pages
- Dynamic branding based on city

#### Step 5: Deploy Landing Page

- New `trylocal.com` shows city directory
- Gresham is only active city initially
- "Coming Soon" section for future cities

#### Step 6: Add Franchise Features (When Ready)

- City admin dashboard
- Franchise application flow
- City setup wizard
- Stripe fee routing

---

## Implementation Phases

### Phase 1: Database Foundation
**Effort: Small | Risk: Low**

- [ ] Create `City` TypeScript interface
- [ ] Create Gresham city document in Firestore
- [ ] Add `cityId` field to Business interface
- [ ] Write migration script to backfill existing businesses
- [ ] Update Firestore rules for city-scoped access
- [ ] Add new Firestore indexes

### Phase 2: City-Aware Backend
**Effort: Medium | Risk: Low**

- [ ] Update business queries to filter by `cityId`
- [ ] Create city context/provider
- [ ] Move hardcoded neighborhoods to city document
- [ ] Move hardcoded ZIP codes/delivery zones to city document
- [ ] Update business creation to require city
- [ ] Add city validation to business forms

### Phase 3: Multi-City Frontend
**Effort: Medium | Risk: Medium**

- [ ] Create new landing page (city directory)
- [ ] Implement `/[city]/*` route structure
- [ ] Add city switcher component to header
- [ ] Dynamic branding ("Try Local [City]")
- [ ] Update all hardcoded "Gresham" references
- [ ] Set up URL redirects for backwards compatibility
- [ ] Update meta tags/SEO per city

### Phase 4: City Admin Features
**Effort: Medium | Risk: Low**

- [ ] Add `city_admin` role to user system
- [ ] Create city admin dashboard
- [ ] City-scoped business approval queue
- [ ] City settings management (neighborhoods, zones)
- [ ] City analytics dashboard
- [ ] Business transfer request flow

### Phase 5: Franchise Onboarding
**Effort: Large | Risk: Medium**

- [ ] Franchise application page
- [ ] Franchise review workflow (super_admin)
- [ ] City setup wizard for new franchises
- [ ] Stripe Connect onboarding for franchise owners
- [ ] Fee routing logic (city-aware)
- [ ] Franchise owner payout dashboard

### Phase 6: Polish & Launch
**Effort: Medium | Risk: Low**

- [ ] Cross-city cart handling edge cases
- [ ] User city preferences (remember last city)
- [ ] City-specific SEO optimization
- [ ] Analytics per city
- [ ] Documentation for franchise owners
- [ ] Marketing site updates

---

## Current State Assessment

### What Needs to Change

| Component | Current State | Required Change |
|-----------|---------------|-----------------|
| Database schema | No city concept | Add City collection, cityId to Business |
| Business queries | No city filter | Add cityId filter |
| Neighborhoods | Hardcoded in form | Move to City document |
| ZIP codes | Hardcoded in delivery.ts | Move to City document |
| User roles | 3 roles | Add city_admin, super_admin |
| URLs | `/businesses` | `/[city]/businesses` |
| Branding | "Gresham" hardcoded | Dynamic from City |
| Landing page | Gresham home | City directory |
| Admin dashboard | Global | City-scoped |

### Files with Hardcoded "Gresham" References

These files need updates to use dynamic city name:

- `src/app/page.tsx` - Homepage hero, descriptions
- `src/app/businesses/page.tsx` - Page title
- `src/app/layout.tsx` - Meta tags, title
- `src/app/help/page.tsx` - Service area description
- `src/app/contact/page.tsx` - Address
- `src/app/apply/page.tsx` - Application copy
- `src/app/dashboard/business/page.tsx` - Neighborhood dropdown
- `src/app/dashboard/business/stripe-onboarding/page.tsx` - Fee description
- `src/app/api/contact/route.ts` - Email sender name
- `src/lib/delivery.ts` - ZIP codes, delivery zones
- `public/manifest.json` - PWA description

---

## Future Considerations

### International Expansion

When ready to expand beyond US:

1. **Currency Support**
   - Add currency to City document
   - Update Stripe payment intents to use city currency
   - Format prices based on city locale

2. **Localization (i18n)**
   - Implement `next-intl` or similar
   - Translate UI strings
   - Consider right-to-left (RTL) support

3. **Tax/VAT**
   - Research tax requirements per country
   - Implement tax calculation per city/country
   - Consider tax reporting requirements

4. **Stripe International**
   - Verify Stripe availability in target countries
   - Handle country-specific payment methods
   - Consider local payment processors if needed

### Potential Target Cities (Discussed)

**US Pacific Northwest (Priority):**
- Portland, OR
- Milwaukie, OR
- Seattle, WA
- Beaverton, OR
- Tacoma, WA
- Eugene, OR

**Future International:**
- Tokyo, Japan
- Osaka, Japan
- (Others TBD based on franchise interest)

---

## Questions for Future Discussion

1. **Franchise pricing** - What is the one-time franchise fee amount?
2. **City minimums** - Minimum population/business count for a city?
3. **Exclusive territories** - Can multiple franchises exist in one metro area?
4. **Franchise agreement** - Legal structure, terms, obligations?
5. **Support model** - What support does Try Local provide to franchises?
6. **Marketing** - Centralized marketing vs franchise-led?

---

## Document History

| Date | Change | Author |
|------|--------|--------|
| Jan 2025 | Initial plan created | Claude + RattusKing |

---

*This document should be updated as decisions are made and implementation progresses.*
