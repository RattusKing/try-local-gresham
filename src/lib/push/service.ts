import webpush from 'web-push'
import { PushNotificationPayload } from '@/lib/types'

// VAPID keys for web push - REQUIRED for push notifications
// Generate with: npx web-push generate-vapid-keys
// Then set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in your .env
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:hello@try-local.com'

// Configure web-push with VAPID details (only if keys are configured)
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
} else if (process.env.NODE_ENV === 'production') {
  console.warn('VAPID keys not configured - push notifications will be disabled. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.')
}

export interface WebPushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export async function sendPushNotification(
  subscription: WebPushSubscription,
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not configured - push notifications disabled')
    return { success: false, error: 'VAPID keys not configured' }
  }

  try {
    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/icon-192x192.png',
      url: payload.url || '/',
      tag: payload.tag || 'try-local-notification',
      data: payload.data || {},
    })

    await webpush.sendNotification(subscription, pushPayload)
    return { success: true }
  } catch (error: any) {
    console.error('Push notification failed:', error)

    // Handle expired/invalid subscriptions
    if (error.statusCode === 410 || error.statusCode === 404) {
      return { success: false, error: 'subscription_expired' }
    }

    return { success: false, error: error.message }
  }
}

export async function sendPushToMultiple(
  subscriptions: WebPushSubscription[],
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number; expiredEndpoints: string[] }> {
  const results = await Promise.allSettled(
    subscriptions.map(sub => sendPushNotification(sub, payload))
  )

  let sent = 0
  let failed = 0
  const expiredEndpoints: string[] = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      sent++
    } else {
      failed++
      if (result.status === 'fulfilled' && result.value.error === 'subscription_expired') {
        expiredEndpoints.push(subscriptions[index].endpoint)
      }
    }
  })

  return { sent, failed, expiredEndpoints }
}

// Notification templates for common events
export const NotificationTemplates = {
  newOrder: (businessName: string, orderId: string, total: number) => ({
    title: 'New Order Received!',
    body: `You have a new order #${orderId.slice(-6)} for $${total.toFixed(2)}`,
    url: '/dashboard/business/orders',
    tag: `order-${orderId}`,
  }),

  orderConfirmed: (businessName: string, orderId: string) => ({
    title: 'Order Confirmed!',
    body: `${businessName} has accepted your order #${orderId.slice(-6)}`,
    url: '/dashboard/customer/orders',
    tag: `order-${orderId}`,
  }),

  orderReady: (businessName: string, orderId: string) => ({
    title: 'Order Ready!',
    body: `Your order from ${businessName} is ready for pickup!`,
    url: '/dashboard/customer/orders',
    tag: `order-${orderId}`,
  }),

  orderCompleted: (businessName: string, orderId: string) => ({
    title: 'Order Completed',
    body: `Your order from ${businessName} has been completed. Thank you!`,
    url: '/dashboard/customer/orders',
    tag: `order-${orderId}`,
  }),

  orderCancelled: (businessName: string, orderId: string) => ({
    title: 'Order Cancelled',
    body: `Your order #${orderId.slice(-6)} from ${businessName} was cancelled`,
    url: '/dashboard/customer/orders',
    tag: `order-${orderId}`,
  }),

  newAppointment: (serviceName: string, customerName: string, date: string, time: string) => ({
    title: 'New Appointment Booked!',
    body: `${customerName} booked ${serviceName} for ${date} at ${time}`,
    url: '/dashboard/business/appointments',
    tag: `appointment-new`,
  }),

  appointmentConfirmed: (businessName: string, serviceName: string, date: string, time: string) => ({
    title: 'Appointment Confirmed!',
    body: `${businessName} confirmed your ${serviceName} for ${date} at ${time}`,
    url: '/dashboard/customer/appointments',
    tag: `appointment-confirmed`,
  }),
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY
}
