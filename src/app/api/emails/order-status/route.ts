import { NextRequest, NextResponse } from 'next/server'
import { sendOrderStatusUpdate } from '@/lib/email/service'
import { orderStatusUpdateSchema, validateSchema } from '@/lib/validation'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rateLimit'
import { getAdminDb } from '@/lib/firebase/admin'
import { sendPushToMultiple, WebPushSubscription } from '@/lib/push/service'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientId = getClientIdentifier(request.headers)
    const rateLimit = await checkRateLimit(clientId, RATE_LIMITS.EMAIL)

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          resetTime: rateLimit.resetTime,
        },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate request data
    const validatedData = validateSchema(orderStatusUpdateSchema, body)

    const {
      customerEmail,
      customerName,
      customerId,
      orderId,
      businessName,
      status,
      statusMessage,
      deliveryMethod,
      deliveryAddress,
      pickupAddress,
    } = validatedData

    const result = await sendOrderStatusUpdate({
      customerEmail,
      customerName,
      orderId,
      businessName,
      status,
      statusMessage,
      deliveryMethod,
      deliveryAddress,
      pickupAddress,
    })

    // Send push notification to customer (non-blocking)
    if (customerId) {
      try {
        const adminDb = getAdminDb()
        const subscriptionsSnapshot = await adminDb
          .collection('pushSubscriptions')
          .where('userId', '==', customerId)
          .get()

        if (!subscriptionsSnapshot.empty) {
          const subscriptions: WebPushSubscription[] = subscriptionsSnapshot.docs.map(doc => {
            const data = doc.data()
            return {
              endpoint: data.endpoint,
              keys: { p256dh: data.keys.p256dh, auth: data.keys.auth }
            }
          })

          // Create notification based on status
          const statusMessages: Record<string, { title: string; body: string }> = {
            accepted: {
              title: 'Order Confirmed!',
              body: `${businessName} has accepted your order #${orderId.slice(-6)}`,
            },
            ready: {
              title: 'Order Ready!',
              body: `Your order from ${businessName} is ready for pickup!`,
            },
            completed: {
              title: 'Order Completed',
              body: `Your order from ${businessName} has been completed. Thank you!`,
            },
            rejected: {
              title: 'Order Cancelled',
              body: `Your order #${orderId.slice(-6)} from ${businessName} was cancelled`,
            },
          }

          const notification = statusMessages[status] || {
            title: 'Order Update',
            body: `Your order from ${businessName} has been updated`,
          }

          await sendPushToMultiple(subscriptions, {
            ...notification,
            url: '/dashboard/customer/orders',
            tag: `order-${orderId}`,
          })
        }
      } catch (pushError) {
        // Log but don't fail the request if push fails
        console.error('Push notification failed:', pushError)
      }
    }

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in order status email API:', error)
    }

    // Return validation errors to client
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    // Generic error for other failures
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
