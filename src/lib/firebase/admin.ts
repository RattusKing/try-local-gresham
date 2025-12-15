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
    // Check if service account env var exists
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.error('FIREBASE_SERVICE_ACCOUNT environment variable is not set!')
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is missing')
    }

    console.log('Attempting to initialize Firebase Admin SDK...')

    // For local development and production on platforms that support service account JSON
    let serviceAccount
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      console.log('Service account JSON parsed successfully')
      console.log('Project ID from service account:', serviceAccount.project_id)
    } catch (parseError) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', parseError)
      throw new Error('Invalid JSON in FIREBASE_SERVICE_ACCOUNT environment variable')
    }

    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || serviceAccount.project_id,
    })

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
