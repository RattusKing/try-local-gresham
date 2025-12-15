import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'

let adminApp: App | null = null
let adminDb: Firestore | null = null

/**
 * Initialize Firebase Admin SDK
 * This should only be used in server-side code (API routes, server components)
 */
export function initializeAdminApp() {
  // Check if already initialized
  if (getApps().length > 0) {
    adminApp = getApps()[0]
    adminDb = getFirestore(adminApp)
    return { adminApp, adminDb }
  }

  try {
    // For local development and production on platforms that support service account JSON
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      })
    } else {
      // Fallback: Use individual environment variables
      // This works when you have GOOGLE_APPLICATION_CREDENTIALS set
      // or when running on Google Cloud Platform
      adminApp = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      })
    }

    adminDb = getFirestore(adminApp)

    console.log('Firebase Admin initialized successfully')
    return { adminApp, adminDb }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error)
    throw error
  }
}

/**
 * Get Admin Firestore instance
 * Initializes the app if not already initialized
 */
export function getAdminDb(): Firestore {
  if (!adminDb) {
    const { adminDb: db } = initializeAdminApp()
    return db
  }
  return adminDb
}

/**
 * Get Admin App instance
 * Initializes the app if not already initialized
 */
export function getAdminApp(): App {
  if (!adminApp) {
    const { adminApp: app } = initializeAdminApp()
    return app
  }
  return adminApp
}
