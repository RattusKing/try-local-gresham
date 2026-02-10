import { NextRequest, NextResponse } from 'next/server'
import {
  sendAppointmentConfirmation,
  sendNewAppointmentNotification,
} from '@/lib/email/service'
import { validateSchema } from '@/lib/validation'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rateLimit'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const appointmentConfirmationSchema = z.object({
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  businessEmail: z.string().email(),
  businessName: z.string().min(1),
  appointmentId: z.string().min(1),
  serviceName: z.string().min(1),
  scheduledDate: z.string().min(1),
  scheduledTime: z.string().min(1),
  duration: z.number().positive(),
  price: z.number().min(0),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
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
    const validatedData = validateSchema(appointmentConfirmationSchema, body)

    const {
      customerEmail,
      customerName,
      businessEmail,
      businessName,
      appointmentId,
      serviceName,
      scheduledDate,
      scheduledTime,
      duration,
      price,
      customerPhone,
      notes,
    } = validatedData

    // Send confirmation email to customer
    const customerResult = await sendAppointmentConfirmation({
      customerEmail,
      customerName,
      appointmentId,
      businessName,
      serviceName,
      scheduledDate,
      scheduledTime,
      duration,
      price,
      notes,
    })

    // Send notification email to business
    const businessResult = await sendNewAppointmentNotification({
      businessEmail,
      businessName,
      appointmentId,
      customerName,
      customerEmail,
      customerPhone,
      serviceName,
      scheduledDate,
      scheduledTime,
      duration,
      price,
      notes,
    })

    if (!customerResult.success || !businessResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to send appointment emails' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment emails sent successfully',
    })
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error in appointment confirmation API:', error)
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
