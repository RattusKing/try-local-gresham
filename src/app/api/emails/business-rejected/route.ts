import { NextRequest, NextResponse } from 'next/server'
import { sendBusinessRejected } from '@/lib/email/service'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessEmail, businessName, ownerName, reason } = body

    const result = await sendBusinessRejected({
      businessEmail,
      businessName,
      ownerName,
      reason,
    })

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error) {
    logger.error('Error in business rejected email API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
