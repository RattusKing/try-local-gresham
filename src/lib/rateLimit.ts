/**
 * Hybrid rate limiter supporting both in-memory and Redis
 * - Development: Uses in-memory Map
 * - Production: Uses Vercel KV (Redis) for horizontal scaling
 */

import { kv } from '@vercel/kv'

interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitRecord>()

// Check if Redis is available
const isRedisAvailable = () => {
  return !!(
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN
  )
}

// Clean up old entries every 5 minutes (only for in-memory)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    if (!isRedisAvailable()) {
      const now = Date.now()
      for (const [key, record] of rateLimitMap.entries()) {
        if (now > record.resetTime) {
          rateLimitMap.delete(key)
        }
      }
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  limit: number
  /** Time window in milliseconds */
  window: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
}

/**
 * Check rate limit using Redis (production)
 */
async function checkRateLimitRedis(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now()
  const key = `ratelimit:${identifier}`

  try {
    // Get current record
    const record = await kv.get<RateLimitRecord>(key)

    // No record exists or it has expired
    if (!record || now > record.resetTime) {
      const resetTime = now + config.window
      const newRecord = {
        count: 1,
        resetTime,
      }

      // Set with TTL (time to live) in seconds
      await kv.set(key, newRecord, {
        ex: Math.ceil(config.window / 1000),
      })

      return {
        success: true,
        remaining: config.limit - 1,
        resetTime,
      }
    }

    // Record exists and limit exceeded
    if (record.count >= config.limit) {
      return {
        success: false,
        remaining: 0,
        resetTime: record.resetTime,
      }
    }

    // Increment count
    const updatedRecord = {
      count: record.count + 1,
      resetTime: record.resetTime,
    }

    await kv.set(key, updatedRecord, {
      ex: Math.ceil((record.resetTime - now) / 1000),
    })

    return {
      success: true,
      remaining: config.limit - updatedRecord.count,
      resetTime: record.resetTime,
    }
  } catch (error) {
    console.error('Redis rate limit error, falling back to allow:', error)
    // On Redis error, allow the request (fail open)
    return {
      success: true,
      remaining: config.limit,
      resetTime: now + config.window,
    }
  }
}

/**
 * Check rate limit using in-memory Map (development)
 */
function checkRateLimitMemory(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  // No record exists or it has expired
  if (!record || now > record.resetTime) {
    const resetTime = now + config.window
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime,
    })
    return {
      success: true,
      remaining: config.limit - 1,
      resetTime,
    }
  }

  // Record exists and is still valid
  if (record.count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime,
    }
  }

  // Increment count
  record.count++
  rateLimitMap.set(identifier, record)

  return {
    success: true,
    remaining: config.limit - record.count,
    resetTime: record.resetTime,
  }
}

/**
 * Check if a request should be rate limited
 * Automatically uses Redis if available, falls back to in-memory
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (isRedisAvailable()) {
    return checkRateLimitRedis(identifier, config)
  }
  return checkRateLimitMemory(identifier, config)
}

/**
 * Get client identifier from request headers
 * Uses X-Forwarded-For, X-Real-IP, or connection IP
 */
export function getClientIdentifier(headers: Headers): string {
  // Check for forwarded IP (common in proxies/load balancers)
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  // Check for real IP
  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a constant (not ideal, but prevents crashes)
  return 'unknown'
}

/**
 * Common rate limit configurations
 */
export const RATE_LIMITS = {
  // 10 requests per hour for email endpoints
  EMAIL: { limit: 10, window: 60 * 60 * 1000 },

  // 5 requests per hour for contact form
  CONTACT: { limit: 5, window: 60 * 60 * 1000 },

  // 20 requests per minute for general API
  API: { limit: 20, window: 60 * 1000 },

  // 50 requests per minute for read-only operations
  READ: { limit: 50, window: 60 * 1000 },
}
