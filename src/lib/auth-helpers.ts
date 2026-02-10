import { NextRequest } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getAdminApp } from '@/lib/firebase/admin'
import { getAdminDb } from '@/lib/firebase/admin'

export async function verifyAuthToken(request: NextRequest): Promise<{ uid: string; email?: string } | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }
    const token = authHeader.split('Bearer ')[1]
    const adminApp = getAdminApp()
    const decodedToken = await getAuth(adminApp).verifyIdToken(token)
    return { uid: decodedToken.uid, email: decodedToken.email }
  } catch {
    return null
  }
}

export async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const authUser = await verifyAuthToken(request)
  if (!authUser) return false

  const adminDb = getAdminDb()
  const userDoc = await adminDb.collection('users').doc(authUser.uid).get()
  return userDoc.exists && userDoc.data()?.role === 'admin'
}

export async function verifyBusinessOwner(request: NextRequest, businessId: string): Promise<boolean> {
  const authUser = await verifyAuthToken(request)
  if (!authUser) return false

  const adminDb = getAdminDb()
  const userDoc = await adminDb.collection('users').doc(authUser.uid).get()
  if (!userDoc.exists) return false

  const userData = userDoc.data()!
  if (userData.role === 'admin') return true
  if (userData.role !== 'business_owner') return false

  // Check that this user owns this business
  const businessDoc = await adminDb.collection('businesses').doc(businessId).get()
  return businessDoc.exists && businessDoc.data()?.ownerId === authUser.uid
}
