/**
 * Development-only logger
 * Prevents console statements from appearing in production builds
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args)
    }
    // TODO: In production, send to error monitoring service (Sentry, DataDog, etc.)
  },

  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },
}
