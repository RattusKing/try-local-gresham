# Vercel KV (Redis) Setup Guide

The rate limiting system now supports both in-memory (development) and Redis (production) storage for horizontal scaling.

## How It Works

- **Development**: Uses in-memory Map (no configuration needed)
- **Production**: Uses Vercel KV (Redis) for distributed rate limiting

The system automatically detects which to use based on environment variables.

## Setup Vercel KV

### 1. Create a KV Database

1. Go to your Vercel project dashboard
2. Click on the "Storage" tab
3. Click "Create Database"
4. Select "KV" (Key-Value Store)
5. Choose a name (e.g., "try-local-gresham-kv")
6. Select your region (choose closest to your users)
7. Click "Create"

### 2. Connect to Your Project

1. After creating the KV database, click "Connect to Project"
2. Select your project from the dropdown
3. Choose environment: Production, Preview, Development (or all)
4. Click "Connect"

This automatically adds the following environment variables to your Vercel project:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`
- `KV_URL`

### 3. Local Development (Optional)

To test Redis rate limiting locally:

1. Go to your Vercel KV database settings
2. Click ".env.local" tab
3. Copy the environment variables
4. Add them to your `.env.local` file:

```bash
# Vercel KV (Redis)
KV_REST_API_URL="https://xxx.upstash.io"
KV_REST_API_TOKEN="your-token-here"
KV_REST_API_READ_ONLY_TOKEN="your-read-token-here"
KV_URL="redis://default:your-password@xxx.upstash.io:6379"
```

**Note**: Local development works fine without these variables (uses in-memory rate limiting).

## Pricing

Vercel KV is powered by Upstash Redis:

- **Free Tier**:
  - 10,000 commands per day
  - 256 MB storage
  - Perfect for development and small apps

- **Pro Tier** (pay-as-you-go):
  - $0.20 per 100K commands
  - $0.25 per GB storage/month
  - Suitable for production apps

## Verifying It Works

### Check Environment Variables

In your Vercel dashboard:
1. Go to Settings → Environment Variables
2. Verify `KV_REST_API_URL` and `KV_REST_API_TOKEN` exist

### Test Rate Limiting

1. Deploy your app to Vercel
2. Make API requests to a rate-limited endpoint (e.g., `/api/contact`)
3. Check Vercel KV dashboard for data

You should see keys like: `ratelimit:127.0.0.1`

### View Metrics

In Vercel KV dashboard:
- See total commands executed
- View current storage usage
- Monitor response times

## Rate Limit Configuration

Current limits are defined in `src/lib/rateLimit.ts`:

```typescript
export const RATE_LIMITS = {
  EMAIL: { limit: 10, window: 60 * 60 * 1000 },     // 10 per hour
  CONTACT: { limit: 5, window: 60 * 60 * 1000 },    // 5 per hour
  API: { limit: 20, window: 60 * 1000 },            // 20 per minute
  READ: { limit: 50, window: 60 * 1000 },           // 50 per minute
}
```

## How the Hybrid System Works

```typescript
// Automatically detects Redis availability
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (isRedisAvailable()) {
    return checkRateLimitRedis(identifier, config)  // Uses Vercel KV
  }
  return checkRateLimitMemory(identifier, config)   // Uses Map
}
```

**Benefits:**
- ✅ Works locally without Redis
- ✅ Scales horizontally in production
- ✅ Automatic failover (if Redis errors, allows request)
- ✅ No code changes needed between environments

## Monitoring

### View Rate Limit Data

Access your Vercel KV dashboard to see:
- Active rate limit keys
- Request counts
- Expiration times

### Redis Commands

Using Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Connect to KV
vercel env pull .env.local

# View all rate limit keys
redis-cli -u $KV_URL keys "ratelimit:*"

# View specific key
redis-cli -u $KV_URL get "ratelimit:127.0.0.1"

# Clear all rate limits (use with caution!)
redis-cli -u $KV_URL flushdb
```

## Troubleshooting

### Rate Limiting Not Working

1. **Check environment variables**: Ensure `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set in Vercel
2. **Redeploy**: Environment variable changes require a redeploy
3. **Check logs**: View Vercel function logs for errors

### Redis Connection Errors

If Redis fails, the system automatically falls back to allowing requests (fail-open strategy). Check:
- Vercel KV status page
- Your Upstash dashboard
- Function logs for error messages

### High Command Usage

If you're exceeding the free tier:
- Review your rate limit windows (shorter = more Redis calls)
- Consider longer TTLs for less frequent cleanups
- Upgrade to Pro tier if needed

## Alternative: Upstash Redis Directly

You can also use Upstash directly (without Vercel):

1. Sign up at [console.upstash.com](https://console.upstash.com)
2. Create a Redis database
3. Get your REST API credentials
4. Add to `.env.local` and Vercel environment variables

The code works identically with both Vercel KV and Upstash Redis.

## Security

- ✅ API tokens are never exposed to client-side code
- ✅ Rate limit keys expire automatically (TTL)
- ✅ Read-only token available for monitoring
- ✅ No sensitive data stored (only request counts)

## Migration from In-Memory

The migration is automatic:
1. Add Vercel KV to your project
2. Deploy
3. Rate limiting automatically uses Redis

No data migration needed (rate limits are temporary).

## Summary

| Feature | Development | Production |
|---------|-------------|------------|
| Storage | In-Memory Map | Vercel KV (Redis) |
| Setup | None required | Add KV database |
| Scaling | Single instance | Horizontal scaling |
| Persistence | Memory only | Persistent |
| Cost | Free | Free tier available |
| Failover | N/A | Automatic fail-open |

Your rate limiting system is now production-ready and scales automatically! 🚀
