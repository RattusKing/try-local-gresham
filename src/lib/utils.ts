// Utility functions

/**
 * Converts a Firestore Timestamp or various date formats to a JavaScript Date object.
 * Handles Firestore Timestamps, Date objects, date strings, and Unix timestamps.
 */
export function toDate(value: unknown): Date | null {
  if (!value) return null;

  // Already a Date object
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // Firestore Timestamp (has seconds and nanoseconds, or toDate method)
  if (typeof value === 'object' && value !== null) {
    // Check for toDate method (Firestore Timestamp)
    if ('toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
      return (value as { toDate: () => Date }).toDate();
    }
    // Check for seconds property (serialized Firestore Timestamp)
    if ('seconds' in value && typeof (value as { seconds: number }).seconds === 'number') {
      return new Date((value as { seconds: number }).seconds * 1000);
    }
    // Check for _seconds property (sometimes Firestore serializes this way)
    if ('_seconds' in value && typeof (value as { _seconds: number })._seconds === 'number') {
      return new Date((value as { _seconds: number })._seconds * 1000);
    }
  }

  // String date
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  // Unix timestamp (number)
  if (typeof value === 'number') {
    // If it's in seconds (less than year 3000 in ms), convert to ms
    const date = new Date(value < 100000000000 ? value * 1000 : value);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

/**
 * Formats a date value to a localized string.
 * Safely handles Firestore Timestamps and various date formats.
 */
export function formatDate(
  value: unknown,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' },
  locale: string = 'en-US'
): string {
  const date = toDate(value);
  if (!date) return '';
  return date.toLocaleDateString(locale, options);
}

/**
 * Formats a date value to a short string (e.g., "Jan 15, 2024")
 */
export function formatDateShort(value: unknown): string {
  return formatDate(value, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Formats a date value to just month and year (e.g., "January 2024")
 */
export function formatDateMonthYear(value: unknown): string {
  return formatDate(value, { year: 'numeric', month: 'long' });
}
