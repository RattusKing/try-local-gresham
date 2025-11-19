# Sentry Error Tracking Setup Guide

Sentry is already configured in your project for comprehensive error tracking and monitoring.

## What's Already Set Up

✅ **Client-side error tracking** (`sentry.client.config.ts`)
✅ **Server-side error tracking** (`sentry.server.config.ts`)
✅ **Error boundaries** (`app/error.tsx`, `app/global-error.tsx`)
✅ **Session replay** (10% sample rate)
✅ **Performance monitoring** (10% trace sample rate)

## Quick Setup (5 Minutes)

### 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io/signup/)
2. Sign up (free tier available)
3. Create a new project:
   - Platform: **Next.js**
   - Name: **Try Local Gresham** (or your project name)
   - Alert frequency: Choose your preference

### 2. Get Your DSN

After creating the project:
1. Go to **Settings** → **Projects** → **Your Project**
2. Click **Client Keys (DSN)**
3. Copy the **DSN** value

It looks like: `https://abc123@o123456.ingest.sentry.io/789`

### 3. Add DSN to Environment Variables

**Local Development** (`.env.local`):
```bash
SENTRY_DSN=https://your-dsn-here@o123456.ingest.sentry.io/789
```

**Vercel Production**:
1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add new variable:
   - Name: `SENTRY_DSN`
   - Value: Your DSN from step 2
   - Environment: Production, Preview, Development (select all)
4. Redeploy your application

### 4. Verify It Works

**Test Error Tracking**:

Add this to any page temporarily:
```typescript
// Test Sentry error tracking
function testSentry() {
  throw new Error('Test Sentry Error - Delete Me!')
}

// Call it: testSentry()
```

After triggering the error:
1. Go to your Sentry dashboard
2. Check **Issues** tab
3. You should see the test error appear within seconds

**Don't forget to remove the test error!**

## Features Enabled

### 1. Error Tracking

**Client-side errors**:
- React component errors
- JavaScript errors
- Promise rejections
- Network failures

**Server-side errors**:
- API route errors
- Server component errors
- Database errors
- Third-party integration failures

### 2. Session Replay

- Records 10% of user sessions
- Replay user interactions leading to errors
- Privacy-first (masks sensitive data)

**View replays**:
1. Go to Sentry dashboard
2. Click on an issue
3. If replay available, click "Replay" tab

### 3. Performance Monitoring

- Tracks page load times
- API response times
- Database query performance
- Custom transaction tracking

**View performance**:
1. Sentry dashboard → **Performance**
2. See slowest transactions
3. Identify bottlenecks

## Configuration Details

### Client Configuration (`sentry.client.config.ts`)

```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions

  // Performance
  tracesSampleRate: 0.1, // 10% of transactions
})
```

### Server Configuration (`sentry.server.config.ts`)

```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

### Error Boundaries

**Global Error Boundary** (`app/global-error.tsx`):
- Catches all unhandled errors
- Shows user-friendly error page
- Automatically reports to Sentry

**Page Error Boundary** (`app/error.tsx`):
- Catches errors in specific pages
- Allows recovery without full page reload

## Adjusting Sample Rates

### For Development (Higher Rates)

```typescript
// sentry.client.config.ts
replaysSessionSampleRate: 1.0  // 100% - See all sessions
tracesSampleRate: 1.0          // 100% - Track all performance
```

### For Production (Lower Rates to Save Quota)

```typescript
// sentry.client.config.ts
replaysSessionSampleRate: 0.05  // 5% - Reduce costs
tracesSampleRate: 0.05          // 5% - Reduce costs
```

## Monitoring Best Practices

### 1. Set Up Alerts

In Sentry dashboard:
1. **Settings** → **Alerts**
2. Create alert rules:
   - New issue created
   - Error rate spike (> 10 errors/minute)
   - Performance degradation

### 2. Integrate with Slack/Email

1. **Settings** → **Integrations**
2. Connect Slack or Email
3. Get notified of critical errors immediately

### 3. Release Tracking

Sentry automatically tracks releases if you set:
```bash
# In Vercel environment variables
SENTRY_RELEASE=your-version-number
```

Or use Git commit SHA:
```bash
SENTRY_RELEASE=$VERCEL_GIT_COMMIT_SHA
```

### 4. User Feedback

Capture user feedback when errors occur:

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.showReportDialog({
  eventId: 'event-id-from-error',
})
```

## Privacy & Data Scrubbing

Sentry automatically scrubs:
- ✅ Passwords
- ✅ Credit card numbers
- ✅ API keys (in headers)
- ✅ Cookies (configurable)

Additional scrubbing:
```typescript
// sentry.client.config.ts
Sentry.init({
  beforeSend(event, hint) {
    // Remove sensitive data
    if (event.user) {
      delete event.user.email
    }
    return event
  },
})
```

## Pricing

### Free Tier
- 5,000 errors/month
- 50 replays/month
- 10,000 performance units/month
- 1 project
- 30-day data retention

**Perfect for**:
- Small apps
- Side projects
- Development

### Developer Tier ($26/month)
- 50,000 errors/month
- 500 replays/month
- 100,000 performance units/month
- Unlimited projects

**Perfect for**:
- Production apps
- Growing businesses

[View full pricing](https://sentry.io/pricing/)

## Troubleshooting

### No Errors Showing Up

1. **Check DSN is set**:
   ```bash
   echo $SENTRY_DSN
   ```

2. **Check Sentry is initialized**:
   - Open browser DevTools → Console
   - Look for Sentry initialization logs

3. **Verify error boundaries**:
   - Make sure error boundaries are wrapping components

### Too Many Errors

**Filter noise**:
```typescript
// sentry.client.config.ts
Sentry.init({
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    // Random network errors
    'NetworkError',
  ],
})
```

### High Quota Usage

**Reduce sample rates**:
- Lower `replaysSessionSampleRate` to 0.05 (5%)
- Lower `tracesSampleRate` to 0.05 (5%)
- Use `beforeSend` to filter unwanted errors

## Advanced Features

### Custom Tags

```typescript
Sentry.setTag('user_role', userProfile.role)
Sentry.setTag('business_id', businessId)
```

### Custom Context

```typescript
Sentry.setContext('order', {
  id: orderId,
  total: orderTotal,
  items: orderItems.length,
})
```

### Manual Error Capture

```typescript
try {
  await riskyOperation()
} catch (error) {
  Sentry.captureException(error, {
    tags: { operation: 'checkout' },
    level: 'error',
  })
}
```

### Performance Monitoring

```typescript
const transaction = Sentry.startTransaction({
  name: 'Process Order',
  op: 'order.process',
})

try {
  await processOrder()
} finally {
  transaction.finish()
}
```

## Dashboard Overview

After setup, monitor your app at: `https://sentry.io/organizations/your-org/issues/`

**Key Pages**:
- **Issues**: All errors and their frequency
- **Performance**: Slow transactions and bottlenecks
- **Replays**: Session recordings
- **Releases**: Track errors by deployment
- **Stats**: Error trends and metrics

## Security Notes

- ✅ DSN is public (safe to expose)
- ✅ No sensitive data sent by default
- ✅ Source maps uploaded securely (build time only)
- ✅ IP addresses anonymized (configurable)

## Summary

Your Sentry setup is **production-ready**! Just add the DSN and you'll have:

✅ Real-time error tracking
✅ Session replay for debugging
✅ Performance monitoring
✅ User-friendly error pages
✅ Automatic error reporting

**Next Steps**:
1. Add `SENTRY_DSN` to Vercel
2. Redeploy
3. Monitor errors in Sentry dashboard
4. Set up Slack/email alerts

Your users will never see cryptic error messages again! 🎉
