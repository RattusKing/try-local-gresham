import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { sendPushToMultiple, WebPushSubscription } from '@/lib/push/service'
import { sendEmail } from '@/lib/email/service'
import { verifyAuthToken } from '@/lib/auth-helpers'

function escapeHtml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyAuthToken(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, data } = body

    if (!type) {
      return NextResponse.json({ error: 'Missing notification type' }, { status: 400 })
    }

    const adminDb = getAdminDb()
    const results = { email: false, push: false }

    // Get notification content based on type
    const notification = getNotificationContent(type, data)
    if (!notification) {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }

    // 1. Get all admin users
    const adminsSnapshot = await adminDb
      .collection('users')
      .where('role', '==', 'admin')
      .get()

    if (adminsSnapshot.empty) {
      return NextResponse.json({ success: true, message: 'No admins found' })
    }

    const adminIds = adminsSnapshot.docs.map(doc => doc.id)
    const adminEmails = adminsSnapshot.docs
      .map(doc => doc.data().email)
      .filter(Boolean) as string[]

    // 2. Send email notifications to admins who have email notifications enabled
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
          console.error('Failed to send admin email:', err)
        }
      }
    }

    // 3. Send push notifications to all admin subscriptions
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
      console.error('Failed to send admin push notifications:', err)
    }

    return NextResponse.json({ success: true, notifications: results })
  } catch (error: any) {
    console.error('Admin notification error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send admin notifications' },
      { status: 500 }
    )
  }
}

interface NotificationContent {
  pushTitle: string
  pushBody: string
  emailSubject: string
  emailHtml: string
  url: string
  tag: string
}

function getNotificationContent(type: string, data: any): NotificationContent | null {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://try-local.com'

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
            <a href="${baseUrl}/dashboard/admin/applications"
               style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 1rem;">
              Review Application
            </a>
          </div>
        `,
        url: `${baseUrl}/dashboard/admin/applications`,
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
            <a href="${baseUrl}/dashboard/admin/sponsored"
               style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 1rem;">
              Review Request
            </a>
          </div>
        `,
        url: `${baseUrl}/dashboard/admin/sponsored`,
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
        url: `${baseUrl}/dashboard/admin`,
        tag: 'admin-contact',
      }

    default:
      return null
  }
}
