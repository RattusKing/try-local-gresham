import { NextRequest, NextResponse } from 'next/server'
import { sendNewQuoteRequestNotification } from '@/lib/email/service'
import { getAdminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'
import { SITE_URL } from '@/lib/site-config'

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyAuthToken(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      businessId,
      businessName,
      customerName,
      customerEmail,
      customerPhone,
      serviceType,
      description,
      urgency,
      preferredContact,
    } = body

    if (!businessId || !businessName || !customerName || !serviceType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const results = { email: false, push: false }

    // 1. Look up business owner's email from Firestore
    const adminDb = getAdminDb()
    let businessEmail = ''

    try {
      // Try to get the business owner's profile to find their email
      const userDoc = await adminDb.collection('users').doc(businessId).get()
      if (userDoc.exists) {
        businessEmail = userDoc.data()?.email || ''
      }

      // Fallback: check the business document itself
      if (!businessEmail) {
        const businessDoc = await adminDb.collection('businesses').doc(businessId).get()
        if (businessDoc.exists) {
          const data = businessDoc.data()
          businessEmail = data?.email || data?.contactEmail || ''
        }
      }
    } catch (err) {
      logger.warn('Could not fetch business email:', err)
    }

    // 2. Send email notification
    if (businessEmail) {
      try {
        await sendNewQuoteRequestNotification({
          businessEmail,
          businessName,
          customerName,
          customerEmail: customerEmail || '',
          customerPhone,
          serviceType,
          description: description || '',
          urgency: urgency || 'standard',
          preferredContact: preferredContact || 'email',
        })
        results.email = true
      } catch (err) {
        logger.error('Failed to send quote email notification:', err)
      }
    }

    // 3. Send push notification to business owner
    try {
      const pushSubscriptions = await adminDb
        .collection('pushSubscriptions')
        .where('userId', '==', businessId)
        .get()

      if (!pushSubscriptions.empty) {
        // Import and use push service
        const { sendPushToMultiple } = await import('@/lib/push/service')
        const subscriptions = pushSubscriptions.docs.map(doc => ({
          endpoint: doc.data().endpoint,
          keys: {
            p256dh: doc.data().keys.p256dh,
            auth: doc.data().keys.auth,
          }
        }))

        const urgencyLabel = urgency === 'urgent' ? ' [URGENT]' : ''

        await sendPushToMultiple(subscriptions, {
          title: `New Quote Request${urgencyLabel}`,
          body: `${customerName} needs ${serviceType}`,
          url: `${SITE_URL}/dashboard/business/quotes`,
          tag: `quote-${Date.now()}`,
        })
        results.push = true
      }
    } catch (err) {
      logger.warn('Failed to send push notification:', err)
    }

    return NextResponse.json({
      success: true,
      notifications: results,
    })
  } catch (error: any) {
    logger.error('Quote notification error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send notifications' },
      { status: 500 }
    )
  }
}
