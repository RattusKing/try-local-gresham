import { BusinessAvailability, Service, Appointment, TimeSlot, DayOfWeek } from './types'

/**
 * Get available time slots for a specific date and service
 */
export function getAvailableTimeSlots(
  date: Date,
  service: Service,
  availability: BusinessAvailability,
  existingAppointments: Appointment[]
): string[] {
  const dayOfWeek = getDayOfWeek(date)
  const dayAvailability = availability[dayOfWeek]

  if (!dayAvailability.isOpen) {
    return []
  }

  const slots: string[] = []
  const serviceDuration = service.duration + (service.bufferTime || 0)

  // Check if date is within allowed booking window
  const today = new Date()
  const maxDate = new Date()
  maxDate.setDate(today.getDate() + availability.advanceBookingDays)

  const minDate = new Date()
  minDate.setHours(minDate.getHours() + availability.minAdvanceHours)

  if (date < minDate || date > maxDate) {
    return []
  }

  // Generate time slots for each time range
  dayAvailability.slots.forEach((timeSlot) => {
    const slotStart = timeToMinutes(timeSlot.start)
    const slotEnd = timeToMinutes(timeSlot.end)

    // Generate slots every 15 minutes (or service duration if less than 15)
    const interval = Math.min(15, serviceDuration)

    for (let time = slotStart; time + serviceDuration <= slotEnd; time += interval) {
      const timeString = minutesToTime(time)

      // Check if this slot conflicts with existing appointments
      if (!hasConflict(date, timeString, serviceDuration, existingAppointments)) {
        // Check if it meets minimum advance notice
        const slotDateTime = new Date(date)
        const [hours, minutes] = timeString.split(':').map(Number)
        slotDateTime.setHours(hours, minutes, 0, 0)

        if (slotDateTime >= minDate) {
          slots.push(timeString)
        }
      }
    }
  })

  return slots
}

/**
 * Check if a time slot conflicts with existing appointments
 */
function hasConflict(
  date: Date,
  time: string,
  duration: number,
  appointments: Appointment[]
): boolean {
  const dateString = date.toISOString().split('T')[0]
  const startMinutes = timeToMinutes(time)
  const endMinutes = startMinutes + duration

  return appointments.some((apt) => {
    // Skip cancelled appointments
    if (apt.status === 'cancelled') return false

    // Check if same date
    if (apt.scheduledDate !== dateString) return false

    // Check time overlap
    const aptStart = timeToMinutes(apt.scheduledTime)
    const aptEnd = aptStart + apt.duration

    // Check if there's any overlap
    return (
      (startMinutes >= aptStart && startMinutes < aptEnd) ||
      (endMinutes > aptStart && endMinutes <= aptEnd) ||
      (startMinutes <= aptStart && endMinutes >= aptEnd)
    )
  })
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Get day of week from Date object
 */
function getDayOfWeek(date: Date): DayOfWeek {
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[date.getDay()]
}

/**
 * Format time for display (e.g., "14:00" -> "2:00 PM")
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Get next N days (excluding past dates)
 */
export function getNextDays(count: number): Date[] {
  const dates: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < count; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    dates.push(date)
  }

  return dates
}
