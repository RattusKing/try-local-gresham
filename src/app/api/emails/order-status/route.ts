import { NextRequest, NextResponse } from 'next/server'
import { sendOrderStatusUpdate } from '@/lib/email/service'
import { orderStatusUpdateSchema, validateSchema } from '@/lib/validation'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientId = getClientIdentifier(request.headers)
    const rateLimit = await checkRateLimit(clientId, RATE_LIMITS.EMAIL)

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          resetTime: rateLimit.resetTime,
        },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate request data
    const validatedData = validateSchema(orderStatusUpdateSchema, body)

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
    } = validatedData

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
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in order status email API:', error)
    }

    // Return validation errors to client
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    // Generic error for other failures
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
