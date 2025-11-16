import { NextRequest, NextResponse } from 'next/server'
import { sendOrderStatusUpdate } from '@/lib/email/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      customerEmail,
      customerName,
      orderId,
      businessName,
      status,
      statusMessage,
      deliveryMethod,
      deliveryAddress,
      pickupAddress,
    } = body

    const result = await sendOrderStatusUpdate({
      customerEmail,
      customerName,
      orderId,
      businessName,
      status,
      statusMessage,
      deliveryMethod,
      deliveryAddress,
      pickupAddress,
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
    console.error('Error in order status email API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
