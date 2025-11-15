import { NextRequest, NextResponse } from 'next/server'
import { sendOrderConfirmation, sendNewOrderNotification } from '@/lib/email/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      customerEmail,
      customerName,
      businessEmail,
      businessName,
      orderId,
      items,
      total,
      deliveryMethod,
      deliveryAddress,
      deliveryNotes,
      customerPhone,
    } = body

    // Send confirmation to customer
    const customerResult = await sendOrderConfirmation({
      customerEmail,
      customerName,
      orderId,
      businessName,
      items,
      total,
      deliveryMethod,
      deliveryAddress,
    })

    // Send notification to business
    const businessResult = await sendNewOrderNotification({
      businessEmail,
      businessName,
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      items,
      total,
      deliveryMethod,
      deliveryAddress,
      deliveryNotes,
    })

    if (customerResult.success && businessResult.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send one or more emails' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in order confirmation email API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
