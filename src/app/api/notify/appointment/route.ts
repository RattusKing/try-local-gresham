import { NextRequest, NextResponse } from 'next/server'
import {
  sendAppointmentConfirmation,
  sendNewAppointmentNotification,
  sendAppointmentStatusUpdate,
} from '@/lib/email/service'
import { getAdminDb } from '@/lib/firebase/admin'
import { sendPushToMultiple, WebPushSubscription } from '@/lib/push/service'
import { logger } from '@/lib/logger'
import { SITE_URL } from '@/lib/site-config'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rateLimit'

type NotificationType =
  | 'new_booking'        // Customer booked → notify business (email + push)
  | 'confirmed'          // Business confirmed → notify customer (email + push)
  | 'cancelled'          // Business cancelled → notify customer (email + push)
  | 'completed'          // Business completed → notify customer (email + push)
  | 'customer_cancelled' // Customer cancelled → notify business (push only, customer gets email separately)

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request.headers)
    const rateLimit = await checkRateLimit(clientId, RATE_LIMITS.EMAIL)
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const {
      type,
      appointmentId,
      businessId,
      businessName,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      serviceName,
      scheduledDate,
      scheduledTime,
      duration,
      price,
      notes,
    } = body as {
      type: NotificationType
      appointmentId: string
      businessId: string
      businessName: string
      customerId: string
      customerName: string
      customerEmail: string
      customerPhone?: string
      serviceName: string
      scheduledDate: string
      scheduledTime: string
      duration: number
      price: number
      notes?: string
    }

    if (!type || !appointmentId || !businessId || !businessName || !serviceName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const results = { email: false, push: false }
    const adminDb = getAdminDb()

    // Helper to get push subscriptions for a user
    const getSubscriptions = async (userId: string): Promise<WebPushSubscription[]> => {
      const snap = await adminDb
        .collection('pushSubscriptions')
        .where('userId', '==', userId)
        .get()
      if (snap.empty) return []
      return snap.docs.map((doc) => ({
        endpoint: doc.data().endpoint,
        keys: { p256dh: doc.data().keys.p256dh, auth: doc.data().keys.auth },
      }))
    }

    // Helper to look up business email
    const getBusinessEmail = async (): Promise<string> => {
      try {
        const userDoc = await adminDb.collection('users').doc(businessId).get()
        if (userDoc.exists && userDoc.data()?.email) return userDoc.data()!.email
        const bizDoc = await adminDb.collection('businesses').doc(businessId).get()
        if (bizDoc.exists) {
          const data = bizDoc.data()
          return data?.email || data?.contactEmail || ''
        }
      } catch {}
      return ''
    }

    if (type === 'new_booking') {
      // Email: confirmation to customer + notification to business
      const businessEmail = await getBusinessEmail()

      if (customerEmail) {
        try {
          await sendAppointmentConfirmation({
            customerEmail,
            customerName,
            appointmentId,
            businessName,
            serviceName,
            scheduledDate,
            scheduledTime,
            duration,
            price,
            notes,
          })
          results.email = true
        } catch (err) {
          logger.warn('Failed to send customer appointment email:', err)
        }
      }

      if (businessEmail) {
        try {
          await sendNewAppointmentNotification({
            businessEmail,
            businessName,
            appointmentId,
            customerName,
            customerEmail: customerEmail || '',
            customerPhone,
            serviceName,
            scheduledDate,
            scheduledTime,
            duration,
            price,
            notes,
          })
          results.email = true
        } catch (err) {
          logger.warn('Failed to send business appointment email:', err)
        }
      }

      // Push: notify business owner
      try {
        const subs = await getSubscriptions(businessId)
        if (subs.length > 0) {
          await sendPushToMultiple(subs, {
            title: 'New Appointment Booked!',
            body: `${customerName} booked ${serviceName} for ${scheduledDate} at ${scheduledTime}`,
            url: `${SITE_URL}/dashboard/business/appointments`,
            tag: `appointment-${appointmentId}`,
          })
          results.push = true
        }
      } catch (err) {
        logger.warn('Failed to send new booking push:', err)
      }
    } else if (type === 'confirmed' || type === 'cancelled' || type === 'completed') {
      // Email: status update to customer
      if (customerEmail) {
        try {
          await sendAppointmentStatusUpdate({
            customerEmail,
            customerName,
            appointmentId,
            businessName,
            serviceName,
            status: type,
            scheduledDate,
            scheduledTime,
          })
          results.email = true
        } catch (err) {
          logger.warn(`Failed to send ${type} email:`, err)
        }
      }

      // Push: notify customer
      try {
        const subs = await getSubscriptions(customerId)
        if (subs.length > 0) {
          const pushPayloads: Record<string, { title: string; body: string }> = {
            confirmed: {
              title: 'Appointment Confirmed!',
              body: `${businessName} confirmed your ${serviceName} for ${scheduledDate} at ${scheduledTime}`,
            },
            cancelled: {
              title: 'Appointment Cancelled',
              body: `Your ${serviceName} with ${businessName} on ${scheduledDate} at ${scheduledTime} has been cancelled`,
            },
            completed: {
              title: 'Appointment Completed',
              body: `Your ${serviceName} with ${businessName} has been completed. Thank you!`,
            },
          }

          await sendPushToMultiple(subs, {
            ...pushPayloads[type],
            url: `${SITE_URL}/dashboard/customer/appointments`,
            tag: `appointment-${appointmentId}`,
          })
          results.push = true
        }
      } catch (err) {
        logger.warn(`Failed to send ${type} push:`, err)
      }
    } else if (type === 'customer_cancelled') {
      // Push: notify business that customer cancelled
      try {
        const subs = await getSubscriptions(businessId)
        if (subs.length > 0) {
          await sendPushToMultiple(subs, {
            title: 'Appointment Cancelled by Customer',
            body: `${customerName} cancelled their ${serviceName} on ${scheduledDate} at ${scheduledTime}`,
            url: `${SITE_URL}/dashboard/business/appointments`,
            tag: `appointment-${appointmentId}`,
          })
          results.push = true
        }
      } catch (err) {
        logger.warn('Failed to send customer-cancel push:', err)
      }
    }

    return NextResponse.json({ success: true, notifications: results })
  } catch (error: any) {
    logger.error('Appointment notification error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send notifications' },
      { status: 500 }
    )
  }
}
