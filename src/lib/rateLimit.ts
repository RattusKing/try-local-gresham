/**
 * Simple in-memory rate limiter
 * For production with multiple servers, use Redis (Upstash, etc.)
 */

interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitRecord>()

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000)

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
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
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
