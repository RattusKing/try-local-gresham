import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit, RATE_LIMITS } from '../rateLimit'

describe('Rate Limiting', () => {
  const testIdentifier = 'test-user-123'

  beforeEach(() => {
    // Note: In a real scenario, we'd need to clear the rate limit map
    // For now, we'll use unique identifiers for each test
  })

  it('should allow requests within limit', async () => {
    const config = { limit: 5, window: 60000 } // 5 requests per minute

    const result1 = await checkRateLimit(`${testIdentifier}-1`, config)
    expect(result1.success).toBe(true)
    expect(result1.remaining).toBe(4)

    const result2 = await checkRateLimit(`${testIdentifier}-1`, config)
    expect(result2.success).toBe(true)
    expect(result2.remaining).toBe(3)
  })

  it('should block requests exceeding limit', async () => {
    const config = { limit: 2, window: 60000 } // 2 requests per minute
    const identifier = `${testIdentifier}-2`

    // First two requests should succeed
    const result1 = await checkRateLimit(identifier, config)
    expect(result1.success).toBe(true)

    const result2 = await checkRateLimit(identifier, config)
    expect(result2.success).toBe(true)

    // Third request should be blocked
    const result3 = await checkRateLimit(identifier, config)
    expect(result3.success).toBe(false)
    expect(result3.remaining).toBe(0)
  })

  it('should return correct remaining count', async () => {
    const config = { limit: 10, window: 60000 }
    const identifier = `${testIdentifier}-3`

    const result1 = await checkRateLimit(identifier, config)
    expect(result1.remaining).toBe(9)

    const result2 = await checkRateLimit(identifier, config)
    expect(result2.remaining).toBe(8)

    const result3 = await checkRateLimit(identifier, config)
    expect(result3.remaining).toBe(7)
  })

  it('should have correct predefined rate limits', () => {
    expect(RATE_LIMITS.EMAIL).toEqual({ limit: 10, window: 3600000 })
    expect(RATE_LIMITS.CONTACT).toEqual({ limit: 5, window: 3600000 })
    expect(RATE_LIMITS.API).toEqual({ limit: 20, window: 60000 })
    expect(RATE_LIMITS.READ).toEqual({ limit: 50, window: 60000 })
  })

  it('should return reset time', async () => {
    const config = { limit: 5, window: 60000 }
    const identifier = `${testIdentifier}-4`

    const result = await checkRateLimit(identifier, config)
    expect(result.resetTime).toBeGreaterThan(Date.now())
    expect(result.resetTime).toBeLessThanOrEqual(Date.now() + config.window)
  })
})
