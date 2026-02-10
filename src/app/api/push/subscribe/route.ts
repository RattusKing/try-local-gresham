import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { getVapidPublicKey } from '@/lib/push/service'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscription, userId, userType, businessId } = body

    if (!subscription || !userId || !userType) {
      return NextResponse.json(
        { error: 'Missing required fields: subscription, userId, userType' },
        { status: 400 }
      )
    }

    if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription format' },
        { status: 400 }
      )
    }

    const adminDb = getAdminDb()

    // Check if subscription already exists for this user
    const existingQuery = await adminDb
      .collection('pushSubscriptions')
      .where('userId', '==', userId)
      .where('endpoint', '==', subscription.endpoint)
      .get()

    if (!existingQuery.empty) {
      // Update existing subscription
      const docId = existingQuery.docs[0].id
      await adminDb.collection('pushSubscriptions').doc(docId).update({
        keys: subscription.keys,
        userType,
        businessId: businessId || null,
        updatedAt: new Date(),
      })

      return NextResponse.json({
        success: true,
        message: 'Subscription updated',
        subscriptionId: docId
      })
    }

    // Create new subscription
    const docRef = await adminDb.collection('pushSubscriptions').add({
      userId,
      userType,
      businessId: businessId || null,
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription created',
      subscriptionId: docRef.id
    })
  } catch (error: any) {
    logger.error('Push subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint, userId } = body

    if (!endpoint || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: endpoint, userId' },
        { status: 400 }
      )
    }

    const adminDb = getAdminDb()

    // Find and delete the subscription
    const query = await adminDb
      .collection('pushSubscriptions')
      .where('userId', '==', userId)
      .where('endpoint', '==', endpoint)
      .get()

    if (query.empty) {
      return NextResponse.json({ success: true, message: 'Subscription not found' })
    }

    await Promise.all(query.docs.map(doc => doc.ref.delete()))

    return NextResponse.json({ success: true, message: 'Subscription removed' })
  } catch (error: any) {
    logger.error('Push unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve VAPID public key
export async function GET() {
  const publicKey = getVapidPublicKey()

  if (!publicKey) {
    return NextResponse.json(
      { error: 'VAPID public key not configured' },
      { status: 500 }
    )
  }

  return NextResponse.json({ publicKey })
}
