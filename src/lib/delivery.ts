/**
 * Delivery and Pickup Utilities
 * Handles business hours, delivery zones, and time slot management
 */

export interface BusinessHours {
  monday: { open: string; close: string; closed?: boolean }
  tuesday: { open: string; close: string; closed?: boolean }
  wednesday: { open: string; close: string; closed?: boolean }
  thursday: { open: string; close: string; closed?: boolean }
  friday: { open: string; close: string; closed?: boolean }
  saturday: { open: string; close: string; closed?: boolean }
  sunday: { open: string; close: string; closed?: boolean }
}

export interface DeliveryZone {
  zipCodes: string[]
  fee: number
  estimatedMinutes: number
}

export const GRESHAM_ZIP_CODES = [
  '97030', // Gresham
  '97080', // Gresham
  '97230', // Wood Village
  '97233', // Gresham East
  '97236', // Gresham South
]

export const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = [
  {
    zipCodes: ['97030', '97080'],
    fee: 5.00,
    estimatedMinutes: 30,
  },
  {
    zipCodes: ['97230', '97233', '97236'],
    fee: 7.50,
    estimatedMinutes: 45,
  },
]

/**
 * Check if delivery is available to a ZIP code
 */
export function isDeliveryAvailable(zipCode: string): boolean {
  return GRESHAM_ZIP_CODES.includes(zipCode)
}

/**
 * Get delivery fee and estimate for a ZIP code
 */
export function getDeliveryInfo(zipCode: string): {
  available: boolean
  fee: number
  estimatedMinutes: number
} {
  const zone = DEFAULT_DELIVERY_ZONES.find((z) => z.zipCodes.includes(zipCode))

  if (!zone) {
    return {
      available: false,
      fee: 0,
      estimatedMinutes: 0,
    }
  }

  return {
    available: true,
    fee: zone.fee,
    estimatedMinutes: zone.estimatedMinutes,
  }
}

/**
 * Get current day of week (0 = Sunday, 6 = Saturday)
 */
function getCurrentDay(): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[new Date().getDay()]
}

/**
 * Check if business is currently open
 */
export function isBusinessOpen(hours: BusinessHours): boolean {
  const today = getCurrentDay() as keyof BusinessHours
  const todayHours = hours[today]

  if (!todayHours || todayHours.closed) {
    return false
  }

  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return currentTime >= todayHours.open && currentTime <= todayHours.close
}

/**
 * Generate pickup time slots for today and tomorrow
 */
export function getPickupTimeSlots(
  hours: BusinessHours,
  intervalMinutes: number = 30
): { date: string; time: string; label: string }[] {
  const slots: { date: string; time: string; label: string }[] = []
  const now = new Date()

  // Add 30 minutes buffer for preparation
  const earliestPickup = new Date(now.getTime() + 30 * 60 * 1000)

  // Generate slots for today and tomorrow
  for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
    const targetDate = new Date(now)
    targetDate.setDate(targetDate.getDate() + dayOffset)

    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
      targetDate.getDay()
    ] as keyof BusinessHours

    const dayHours = hours[dayName]

    if (!dayHours || dayHours.closed) {
      continue
    }

    // Parse business hours
    const [openHour, openMinute] = dayHours.open.split(':').map(Number)
    const [closeHour, closeMinute] = dayHours.close.split(':').map(Number)

    let currentSlot = new Date(targetDate)
    currentSlot.setHours(openHour, openMinute, 0, 0)

    const closeTime = new Date(targetDate)
    closeTime.setHours(closeHour, closeMinute, 0, 0)

    while (currentSlot < closeTime) {
      // Only add slots that are in the future
      if (currentSlot > earliestPickup) {
        const dateStr = currentSlot.toISOString().split('T')[0]
        const timeStr = `${String(currentSlot.getHours()).padStart(2, '0')}:${String(currentSlot.getMinutes()).padStart(2, '0')}`

        const label =
          dayOffset === 0
            ? `Today at ${formatTime(timeStr)}`
            : `Tomorrow at ${formatTime(timeStr)}`

        slots.push({
          date: dateStr,
          time: timeStr,
          label,
        })
      }

      currentSlot = new Date(currentSlot.getTime() + intervalMinutes * 60 * 1000)
    }
  }

  return slots
}

/**
 * Format 24-hour time to 12-hour format
 */
function formatTime(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours % 12 || 12
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`
}

/**
 * Default business hours (9 AM - 6 PM, closed Sunday)
 */
export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { open: '09:00', close: '18:00' },
  tuesday: { open: '09:00', close: '18:00' },
  wednesday: { open: '09:00', close: '18:00' },
  thursday: { open: '09:00', close: '18:00' },
  friday: { open: '09:00', close: '18:00' },
  saturday: { open: '10:00', close: '16:00' },
  sunday: { open: '00:00', close: '00:00', closed: true },
}

/**
 * Validate that a pickup time is within business hours
 */
export function isValidPickupTime(
  pickupDateTime: Date,
  hours: BusinessHours
): { valid: boolean; reason?: string } {
  // Check time requirements first (more specific)
  // Must be at least 30 minutes in the future
  const now = new Date()
  const minPickupTime = new Date(now.getTime() + 30 * 60 * 1000)

  if (pickupDateTime < minPickupTime) {
    return {
      valid: false,
      reason: 'Pickup time must be at least 30 minutes from now',
    }
  }

  // Then check business hours
  const dayName = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ][pickupDateTime.getDay()] as keyof BusinessHours

  const dayHours = hours[dayName]

  if (!dayHours || dayHours.closed) {
    return {
      valid: false,
      reason: 'Business is closed on this day',
    }
  }

  const pickupTime = `${String(pickupDateTime.getHours()).padStart(2, '0')}:${String(pickupDateTime.getMinutes()).padStart(2, '0')}`

  if (pickupTime < dayHours.open || pickupTime > dayHours.close) {
    return {
      valid: false,
      reason: `Business hours are ${formatTime(dayHours.open)} - ${formatTime(dayHours.close)}`,
    }
  }

  return { valid: true }
}
