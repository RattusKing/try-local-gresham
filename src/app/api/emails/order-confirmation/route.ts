import { NextRequest, NextResponse } from 'next/server'
import { sendOrderConfirmation, sendNewOrderNotification } from '@/lib/email/service'
import { orderConfirmationSchema, validateSchema } from '@/lib/validation'
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
    const validatedData = validateSchema(orderConfirmationSchema, body)

    const {
      customerEmail,
      customerName,
      businessEmail,
      businessName,
      businessId,
      orderId,
      items,
      total,
      deliveryMethod,
      deliveryAddress,
      deliveryNotes,
      customerPhone,
    } = validatedData

    // Send confirmation to customer
    const customerResult = await sendOrderConfirmation({
      customerEmail,
      customerName,
      orderId,
      businessName,
      items,
      total,
      deliveryMethod,
      deliveryAddress,
    })

    // Send notification to business
    const businessResult = await sendNewOrderNotification({
      businessEmail,
      businessName,
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      items,
      total,
      deliveryMethod,
      deliveryAddress,
      deliveryNotes,
    })

    // Send push notification to business owner (non-blocking)
    if (businessId) {
      try {
        const adminDb = getAdminDb()
        const subscriptionsSnapshot = await adminDb
          .collection('pushSubscriptions')
          .where('businessId', '==', businessId)
          .where('userType', '==', 'business_owner')
          .get()

        if (!subscriptionsSnapshot.empty) {
          const subscriptions: WebPushSubscription[] = subscriptionsSnapshot.docs.map(doc => {
            const data = doc.data()
            return {
              endpoint: data.endpoint,
              keys: { p256dh: data.keys.p256dh, auth: data.keys.auth }
            }
          })

          await sendPushToMultiple(subscriptions, {
            title: 'New Order Received!',
            body: `New order #${orderId.slice(-6)} for $${total.toFixed(2)} from ${customerName}`,
            url: '/dashboard/business/orders',
            tag: `order-${orderId}`,
          })
        }
      } catch (pushError) {
        // Log but don't fail the request if push fails
        console.error('Push notification failed:', pushError)
      }
    }

    if (customerResult.success && businessResult.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send one or more emails' },
        { status: 500 }
      )
    }
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in order confirmation email API:', error)
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
