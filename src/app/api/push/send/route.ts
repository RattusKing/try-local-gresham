import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { sendPushToMultiple, WebPushSubscription } from '@/lib/push/service'
import { PushNotificationPayload } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, businessId, userType, payload } = body as {
      userId?: string
      businessId?: string
      userType?: 'customer' | 'business_owner'
      payload: PushNotificationPayload
    }

    if (!payload || !payload.title || !payload.body) {
      return NextResponse.json(
        { error: 'Missing required fields: payload.title, payload.body' },
        { status: 400 }
      )
    }

    const adminDb = getAdminDb()

    // Build query based on targeting
    let query = adminDb.collection('pushSubscriptions') as FirebaseFirestore.Query

    if (userId) {
      // Send to specific user
      query = query.where('userId', '==', userId)
    } else if (businessId && userType === 'business_owner') {
      // Send to business owner(s) of a specific business
      query = query.where('businessId', '==', businessId).where('userType', '==', 'business_owner')
    } else if (userType) {
      // Send to all users of a type
      query = query.where('userType', '==', userType)
    } else {
      return NextResponse.json(
        { error: 'Must specify userId, businessId with userType, or userType alone' },
        { status: 400 }
      )
    }

    const snapshot = await query.get()

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        sent: 0,
        failed: 0,
        message: 'No subscriptions found for the specified target'
      })
    }

    // Extract subscriptions
    const subscriptions: WebPushSubscription[] = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        endpoint: data.endpoint,
        keys: {
          p256dh: data.keys.p256dh,
          auth: data.keys.auth,
        }
      }
    })

    // Send notifications
    const result = await sendPushToMultiple(subscriptions, payload)

    // Clean up expired subscriptions
    if (result.expiredEndpoints.length > 0) {
      const deletePromises = result.expiredEndpoints.map(async endpoint => {
        const expiredDocs = await adminDb
          .collection('pushSubscriptions')
          .where('endpoint', '==', endpoint)
          .get()
        return Promise.all(expiredDocs.docs.map(doc => doc.ref.delete()))
      })
      await Promise.all(deletePromises)
    }

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      expiredRemoved: result.expiredEndpoints.length,
    })
  } catch (error: any) {
    console.error('Push send error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send notification' },
      { status: 500 }
    )
  }
}

// Helper endpoint for sending order-related notifications
export async function sendOrderNotification(
  type: 'new_order' | 'order_confirmed' | 'order_ready' | 'order_completed' | 'order_cancelled',
  orderId: string,
  businessId: string,
  businessName: string,
  customerId: string,
  total?: number
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://try-local.com'

  const templates: Record<string, { userId: string; userType: 'customer' | 'business_owner'; targetBusinessId?: string; payload: PushNotificationPayload }> = {
    new_order: {
      userType: 'business_owner',
      targetBusinessId: businessId,
      userId: '',
      payload: {
        title: 'New Order Received!',
        body: `New order #${orderId.slice(-6)} for $${(total || 0).toFixed(2)}`,
        url: `${baseUrl}/dashboard/business/orders`,
        tag: `order-${orderId}`,
      }
    },
    order_confirmed: {
      userId: customerId,
      userType: 'customer',
      payload: {
        title: 'Order Confirmed!',
        body: `${businessName} has accepted your order #${orderId.slice(-6)}`,
        url: `${baseUrl}/dashboard/customer/orders`,
        tag: `order-${orderId}`,
      }
    },
    order_ready: {
      userId: customerId,
      userType: 'customer',
      payload: {
        title: 'Order Ready!',
        body: `Your order from ${businessName} is ready for pickup!`,
        url: `${baseUrl}/dashboard/customer/orders`,
        tag: `order-${orderId}`,
      }
    },
    order_completed: {
      userId: customerId,
      userType: 'customer',
      payload: {
        title: 'Order Completed',
        body: `Your order from ${businessName} has been completed. Thank you!`,
        url: `${baseUrl}/dashboard/customer/orders`,
        tag: `order-${orderId}`,
      }
    },
    order_cancelled: {
      userId: customerId,
      userType: 'customer',
      payload: {
        title: 'Order Cancelled',
        body: `Your order #${orderId.slice(-6)} from ${businessName} was cancelled`,
        url: `${baseUrl}/dashboard/customer/orders`,
        tag: `order-${orderId}`,
      }
    }
  }

  const template = templates[type]
  if (!template) return { success: false, error: 'Invalid notification type' }

  // Use internal function call - this is a helper, not an HTTP endpoint
  return template
}
