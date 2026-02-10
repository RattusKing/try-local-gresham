import { NextRequest, NextResponse } from 'next/server'
import { sendAppointmentStatusUpdate } from '@/lib/email/service'
import { validateSchema } from '@/lib/validation'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rateLimit'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const appointmentStatusUpdateSchema = z.object({
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  appointmentId: z.string().min(1),
  businessName: z.string().min(1),
  serviceName: z.string().min(1),
  status: z.enum(['confirmed', 'cancelled', 'completed', 'no-show']),
  scheduledDate: z.string().min(1),
  scheduledTime: z.string().min(1),
  cancellationReason: z.string().optional(),
})

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
    const validatedData = validateSchema(appointmentStatusUpdateSchema, body)

    const {
      customerEmail,
      customerName,
      appointmentId,
      businessName,
      serviceName,
      status,
      scheduledDate,
      scheduledTime,
      cancellationReason,
    } = validatedData

    // Send status update email
    const result = await sendAppointmentStatusUpdate({
      customerEmail,
      customerName,
      appointmentId,
      businessName,
      serviceName,
      status,
      scheduledDate,
      scheduledTime,
      cancellationReason,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to send status update email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Status update email sent successfully',
    })
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error in appointment status update API:', error)
    }

    // Return validation errors to client
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    // Generic error for other failures
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
