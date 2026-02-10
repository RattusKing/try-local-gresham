/**
 * Centralized site configuration
 * All URLs and contact emails should reference this file
 */

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://try-local.com'

export const SITE_CONFIG = {
  name: 'Try Local Gresham',
  shortName: 'Try Local',
  tagline: 'Building a stronger Gresham, one local business at a time.',
  url: SITE_URL,
} as const

export const CONTACT_EMAILS = {
  support: process.env.CONTACT_EMAIL || 'support@try-local.com',
  hello: 'hello@try-local.com',
  business: 'business@try-local.com',
  privacy: 'privacy@try-local.com',
  legal: 'legal@try-local.com',
  noreply: process.env.EMAIL_FROM || 'Try Local Gresham <noreply@try-local.com>',
} as const
