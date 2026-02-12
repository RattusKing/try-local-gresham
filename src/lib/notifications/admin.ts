import { getAdminDb } from '@/lib/firebase/admin'
import { sendPushToMultiple, WebPushSubscription } from '@/lib/push/service'
import { sendEmail } from '@/lib/email/service'
import { logger } from '@/lib/logger'
import { SITE_URL } from '@/lib/site-config'

function escapeHtml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export interface NotificationContent {
  pushTitle: string
  pushBody: string
  emailSubject: string
  emailHtml: string
  url: string
  tag: string
}

/**
 * Send a notification (email + push) to all admin users.
 * Can be called from API routes, webhooks, or any server-side code.
 */
export async function sendAdminNotification(type: string, data: any): Promise<{ email: boolean; push: boolean }> {
  const results = { email: false, push: false }

  const notification = getNotificationContent(type, data)
  if (!notification) {
    logger.error(`Invalid admin notification type: ${type}`)
    return results
  }

  const adminDb = getAdminDb()

  // Get all admin users
  const adminsSnapshot = await adminDb
    .collection('users')
    .where('role', '==', 'admin')
    .get()

  if (adminsSnapshot.empty) {
    logger.log('No admins found for notification')
    return results
  }

  const adminIds = adminsSnapshot.docs.map(doc => doc.id)

  // Send email notifications to admins who have email notifications enabled
  for (const adminDoc of adminsSnapshot.docs) {
    const adminData = adminDoc.data()
    if (adminData.emailNotifications !== false && adminData.email) {
      try {
        await sendEmail({
          to: adminData.email,
          subject: notification.emailSubject,
          html: notification.emailHtml,
        })
        results.email = true
      } catch (err) {
        logger.error('Failed to send admin email:', err)
      }
    }
  }

  // Send push notifications to all admin subscriptions
  try {
    const pushSubscriptionsSnapshot = await adminDb
      .collection('pushSubscriptions')
      .where('userId', 'in', adminIds)
      .get()

    if (!pushSubscriptionsSnapshot.empty) {
      const subscriptions: WebPushSubscription[] = pushSubscriptionsSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          endpoint: data.endpoint,
          keys: { p256dh: data.keys.p256dh, auth: data.keys.auth }
        }
      })

      await sendPushToMultiple(subscriptions, {
        title: notification.pushTitle,
        body: notification.pushBody,
        url: notification.url,
        tag: notification.tag,
      })
      results.push = true
    }
  } catch (err) {
    logger.error('Failed to send admin push notifications:', err)
  }

  return results
}

export function getNotificationContent(type: string, data: any): NotificationContent | null {
  switch (type) {
    case 'new_business_application':
      return {
        pushTitle: 'New Business Application',
        pushBody: `${escapeHtml(data.businessName)} has applied to join Try Local`,
        emailSubject: `New Business Application: ${escapeHtml(data.businessName)}`,
        emailHtml: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f97316;">New Business Application</h2>
            <p>A new business has applied to join Try Local:</p>
            <div style="background: #f9fafb; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <p><strong>Business Name:</strong> ${escapeHtml(data.businessName)}</p>
              <p><strong>Owner:</strong> ${escapeHtml(data.ownerName)}</p>
              <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
              <p><strong>Category:</strong> ${escapeHtml(data.category)}</p>
              <p><strong>Neighborhood:</strong> ${escapeHtml(data.neighborhood)}</p>
            </div>
            <a href="${SITE_URL}/dashboard/admin/applications"
               style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 1rem;">
              Review Application
            </a>
          </div>
        `,
        url: `${SITE_URL}/dashboard/admin/applications`,
        tag: 'admin-application',
      }

    case 'new_sponsored_banner_request':
      return {
        pushTitle: 'New Sponsored Banner Request',
        pushBody: `${escapeHtml(data.businessName)} requested a sponsored banner`,
        emailSubject: `New Sponsored Banner Request: ${escapeHtml(data.businessName)}`,
        emailHtml: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f97316;">New Sponsored Banner Request</h2>
            <p>A business has requested a sponsored banner placement:</p>
            <div style="background: #f9fafb; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <p><strong>Business:</strong> ${escapeHtml(data.businessName)}</p>
              <p><strong>Headline:</strong> ${escapeHtml(data.headline || 'Not specified')}</p>
              <p><strong>Duration:</strong> ${escapeHtml(data.duration || 'Not specified')}</p>
            </div>
            <a href="${SITE_URL}/dashboard/admin/sponsored"
               style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 1rem;">
              Review Request
            </a>
          </div>
        `,
        url: `${SITE_URL}/dashboard/admin/sponsored`,
        tag: 'admin-sponsored',
      }

    case 'new_contact_message':
      return {
        pushTitle: 'New Contact Message',
        pushBody: `${escapeHtml(data.name)} sent a message via contact form`,
        emailSubject: `New Contact Message from ${escapeHtml(data.name)}`,
        emailHtml: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f97316;">New Contact Message</h2>
            <p>Someone sent a message via the contact form:</p>
            <div style="background: #f9fafb; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <p><strong>From:</strong> ${escapeHtml(data.name)}</p>
              <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
              <p><strong>Subject:</strong> ${escapeHtml(data.subject || 'No subject')}</p>
              <p><strong>Message:</strong></p>
              <p style="white-space: pre-wrap;">${escapeHtml(data.message)}</p>
            </div>
          </div>
        `,
        url: `${SITE_URL}/dashboard/admin`,
        tag: 'admin-contact',
      }

    case 'new_subscription':
      return {
        pushTitle: 'New Business Subscription!',
        pushBody: `${escapeHtml(data.businessName)} subscribed (${escapeHtml(data.tier)})`,
        emailSubject: `New Subscription: ${escapeHtml(data.businessName)}`,
        emailHtml: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">New Business Subscription!</h2>
            <p>A business has subscribed to Try Local:</p>
            <div style="background: #f0fdf4; padding: 1rem; border-radius: 8px; margin: 1rem 0; border: 1px solid #bbf7d0;">
              <p><strong>Business:</strong> ${escapeHtml(data.businessName)}</p>
              <p><strong>Plan:</strong> ${escapeHtml(data.tier)}</p>
              <p><strong>Status:</strong> ${escapeHtml(data.status)}</p>
              ${data.hasFirstMonthFree ? '<p><strong>Promotion:</strong> First month free</p>' : ''}
            </div>
            <a href="${SITE_URL}/dashboard/admin"
               style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 1rem;">
              View Dashboard
            </a>
          </div>
        `,
        url: `${SITE_URL}/dashboard/admin`,
        tag: 'admin-subscription',
      }

    default:
      return null
  }
}
