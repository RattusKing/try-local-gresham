import { NextRequest, NextResponse } from 'next/server'
import { sendBusinessApplicationReceived } from '@/lib/email/service'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessEmail, businessName, ownerName } = body

    const result = await sendBusinessApplicationReceived({
      businessEmail,
      businessName,
      ownerName,
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
    logger.error('Error in business application email API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
