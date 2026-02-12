import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthToken } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'
import { sendAdminNotification } from '@/lib/notifications/admin'

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

    const results = await sendAdminNotification(type, data)

    return NextResponse.json({ success: true, notifications: results })
  } catch (error: any) {
    logger.error('Admin notification error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send admin notifications' },
      { status: 500 }
    )
  }
}
