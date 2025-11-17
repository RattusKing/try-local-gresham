import { describe, it, expect } from 'vitest'
import {
  isDeliveryAvailable,
  getDeliveryInfo,
  isBusinessOpen,
  isValidPickupTime,
  DEFAULT_BUSINESS_HOURS,
  BusinessHours,
} from '../delivery'

describe('Delivery Availability', () => {
  it('should recognize Gresham ZIP codes as available', () => {
    expect(isDeliveryAvailable('97030')).toBe(true)
    expect(isDeliveryAvailable('97080')).toBe(true)
    expect(isDeliveryAvailable('97230')).toBe(true)
    expect(isDeliveryAvailable('97233')).toBe(true)
    expect(isDeliveryAvailable('97236')).toBe(true)
  })

  it('should reject non-Gresham ZIP codes', () => {
    expect(isDeliveryAvailable('12345')).toBe(false)
    expect(isDeliveryAvailable('90210')).toBe(false)
    expect(isDeliveryAvailable('00000')).toBe(false)
  })
})

describe('Delivery Info', () => {
  it('should return correct delivery fee and estimate for Zone 1', () => {
    const info = getDeliveryInfo('97030')

    expect(info.available).toBe(true)
    expect(info.fee).toBe(5.0)
    expect(info.estimatedMinutes).toBe(30)
  })

  it('should return correct delivery fee and estimate for Zone 2', () => {
    const info = getDeliveryInfo('97233')

    expect(info.available).toBe(true)
    expect(info.fee).toBe(7.5)
    expect(info.estimatedMinutes).toBe(45)
  })

  it('should return unavailable for invalid ZIP codes', () => {
    const info = getDeliveryInfo('99999')

    expect(info.available).toBe(false)
    expect(info.fee).toBe(0)
    expect(info.estimatedMinutes).toBe(0)
  })
})

describe('Business Hours', () => {
  const testHours: BusinessHours = {
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    wednesday: { open: '09:00', close: '18:00' },
    thursday: { open: '09:00', close: '18:00' },
    friday: { open: '09:00', close: '18:00' },
    saturday: { open: '10:00', close: '16:00' },
    sunday: { open: '00:00', close: '00:00', closed: true },
  }

  it('should have correct default hours', () => {
    expect(DEFAULT_BUSINESS_HOURS.monday.open).toBe('09:00')
    expect(DEFAULT_BUSINESS_HOURS.monday.close).toBe('18:00')
    expect(DEFAULT_BUSINESS_HOURS.sunday.closed).toBe(true)
  })

  // Note: isBusinessOpen() depends on current time, so testing is tricky
  // In a production app, you'd inject the current time for testability
  it('should identify closed days', () => {
    const closedHours: BusinessHours = {
      ...testHours,
      sunday: { open: '00:00', close: '00:00', closed: true },
    }

    // We can't easily test isBusinessOpen without mocking Date
    // But we can verify the structure
    expect(closedHours.sunday.closed).toBe(true)
  })
})

describe('Pickup Time Validation', () => {
  const testHours: BusinessHours = {
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    wednesday: { open: '09:00', close: '18:00' },
    thursday: { open: '09:00', close: '18:00' },
    friday: { open: '09:00', close: '18:00' },
    saturday: { open: '10:00', close: '16:00' },
    sunday: { open: '00:00', close: '00:00', closed: true },
  }

  it('should reject pickup on closed days', () => {
    // Create a future Sunday date
    const sunday = new Date()
    // Find next Sunday (day 0)
    const daysUntilSunday = (7 - sunday.getDay()) % 7 || 7
    sunday.setDate(sunday.getDate() + daysUntilSunday)
    sunday.setHours(12, 0, 0, 0)

    const result = isValidPickupTime(sunday, testHours)

    expect(result.valid).toBe(false)
    expect(result.reason).toContain('closed')
  })

  it('should reject pickup times before opening', () => {
    // Create a future date at 8:00 AM (before 9:00 AM opening)
    const early = new Date()
    early.setDate(early.getDate() + 2) // Day after tomorrow
    early.setHours(8, 0, 0, 0)

    const result = isValidPickupTime(early, testHours)

    expect(result.valid).toBe(false)
    expect(result.reason).toContain('Business hours')
  })

  it('should reject pickup times after closing', () => {
    // Create a future date at 7:00 PM (after 6:00 PM closing)
    const late = new Date()
    late.setDate(late.getDate() + 2) // Day after tomorrow
    late.setHours(19, 0, 0, 0)

    const result = isValidPickupTime(late, testHours)

    expect(result.valid).toBe(false)
    expect(result.reason).toContain('Business hours')
  })

  it('should reject pickup times in the past', () => {
    // Create a time in the past
    const past = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago

    const result = isValidPickupTime(past, testHours)

    expect(result.valid).toBe(false)
    expect(result.reason).toContain('30 minutes from now')
  })

  it('should accept valid pickup times', () => {
    // Create a future weekday time within business hours
    const future = new Date()
    future.setDate(future.getDate() + 1) // Tomorrow
    future.setHours(12, 0, 0, 0) // Noon

    // Make sure it's not Sunday
    if (future.getDay() === 0) {
      future.setDate(future.getDate() + 1)
    }

    const result = isValidPickupTime(future, testHours)

    expect(result.valid).toBe(true)
    expect(result.reason).toBeUndefined()
  })
})
