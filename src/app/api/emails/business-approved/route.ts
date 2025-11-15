import { NextRequest, NextResponse } from 'next/server'
import { sendBusinessApproved } from '@/lib/email/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessEmail, businessName, ownerName, dashboardUrl } = body

    const result = await sendBusinessApproved({
      businessEmail,
      businessName,
      ownerName,
      dashboardUrl,
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
    console.error('Error in business approved email API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
