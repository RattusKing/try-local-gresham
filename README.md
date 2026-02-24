# Try Local — Gresham, Oregon

A digital marketplace connecting residents with the local businesses that make Gresham great.

## About

Try Local is a community platform built for Gresham, Oregon. It gives local businesses a professional online presence and makes it easy for residents to discover, support, and transact with the businesses in their neighborhood.

## Tech Stack

- **Next.js 15** with TypeScript
- **Firebase** — Authentication, Firestore, Storage
- **Stripe** — Subscription billing and payments
- **Resend** — Transactional email

## Getting Started

```bash
npm install
cp .env.example .env   # add your credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Required Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_APP_URL` | Production URL |
| `RESEND_API_KEY` | Email service (optional for local dev) |
| `NEXT_PUBLIC_GA_ID` | Google Analytics (optional) |

## Contact

- hello@try-local.com
