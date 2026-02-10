import { Resend } from 'resend'
import { render } from '@react-email/components'
import OrderConfirmationEmail from '@/emails/OrderConfirmationEmail'
import NewOrderNotificationEmail from '@/emails/NewOrderNotificationEmail'
import OrderStatusUpdateEmail from '@/emails/OrderStatusUpdateEmail'
import { logger } from '@/lib/logger'
import { SITE_URL, CONTACT_EMAILS } from '@/lib/site-config'

const FROM_EMAIL = CONTACT_EMAILS.noreply
const API_KEY = process.env.RESEND_API_KEY

// Initialize Resend only if API key is available
const resend = API_KEY ? new Resend(API_KEY) : null

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions) {
  // If no API key is configured, log and return success (allows app to work without email)
  if (!resend) {
    logger.log('Email service not configured (missing RESEND_API_KEY). Email not sent:', {
      to: options.to,
      subject: options.subject,
    })
    return { success: true, data: { message: 'Email service not configured' } }
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    logger.log('Email sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    logger.error('Error sending email:', error)
    return { success: false, error }
  }
}

// Order confirmation email to customer
export async function sendOrderConfirmation(params: {
  customerEmail: string
  customerName: string
  orderId: string
  businessName: string
  items: Array<{ name: string; quantity: number; price: number }>
  subtotal?: number
  platformFee?: number
  discount?: number
  total: number
  deliveryMethod: 'pickup' | 'delivery'
  deliveryAddress?: string
  pickupAddress?: string
}) {
  const orderItems = params.items.map((item) => ({
    productName: item.name,
    quantity: item.quantity,
    price: item.price * item.quantity,
  }))

  const subtotal = params.subtotal || params.total
  const platformFee = params.platformFee || 0

  const html = await render(
    OrderConfirmationEmail({
      customerName: params.customerName,
      orderId: params.orderId,
      businessName: params.businessName,
      items: orderItems,
      subtotal,
      platformFee,
      discount: params.discount,
      total: params.total,
      deliveryMethod: params.deliveryMethod,
      deliveryAddress: params.deliveryAddress,
      pickupAddress: params.pickupAddress,
      orderDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    })
  )

  return sendEmail({
    to: params.customerEmail,
    subject: `Order Confirmation - ${params.businessName}`,
    html,
  })
}

// New order notification to business
export async function sendNewOrderNotification(params: {
  businessEmail: string
  businessName: string
  orderId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  items: Array<{ name: string; quantity: number; price: number }>
  subtotal?: number
  platformFee?: number
  discount?: number
  total: number
  deliveryMethod: 'pickup' | 'delivery'
  deliveryAddress?: string
  deliveryNotes?: string
}) {
  const orderItems = params.items.map((item) => ({
    productName: item.name,
    quantity: item.quantity,
    price: item.price * item.quantity,
  }))

  const subtotal = params.subtotal || params.total
  const platformFee = params.platformFee || subtotal * 0.1

  const dashboardUrl = `${SITE_URL}/dashboard/business/orders`

  const html = await render(
    NewOrderNotificationEmail({
      businessName: params.businessName,
      orderId: params.orderId,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      items: orderItems,
      subtotal,
      platformFee,
      discount: params.discount,
      total: params.total,
      deliveryMethod: params.deliveryMethod,
      deliveryAddress: params.deliveryAddress,
      specialInstructions: params.deliveryNotes,
      orderDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      dashboardUrl,
    })
  )

  return sendEmail({
    to: params.businessEmail,
    subject: `New Order #${params.orderId.slice(-6).toUpperCase()} - ${params.customerName}`,
    html,
  })
}

// Order status update notification
export async function sendOrderStatusUpdate(params: {
  customerEmail: string
  customerName: string
  orderId: string
  businessName: string
  status: 'accepted' | 'ready' | 'completed' | 'rejected'
  statusMessage?: string
  deliveryMethod: 'pickup' | 'delivery'
  deliveryAddress?: string
  pickupAddress?: string
}) {
  const orderUrl = `${SITE_URL}/orders`

  const html = await render(
    OrderStatusUpdateEmail({
      customerName: params.customerName,
      orderId: params.orderId,
      businessName: params.businessName,
      status: params.status,
      statusMessage: params.statusMessage || '',
      deliveryMethod: params.deliveryMethod,
      deliveryAddress: params.deliveryAddress,
      pickupAddress: params.pickupAddress,
      orderUrl,
    })
  )

  const statusTitles = {
    accepted: 'Order Accepted',
    ready: 'Order Ready',
    completed: 'Order Completed',
    rejected: 'Order Declined',
  }

  return sendEmail({
    to: params.customerEmail,
    subject: `${statusTitles[params.status]} - ${params.businessName}`,
    html,
  })
}

// Business application received
export async function sendBusinessApplicationReceived(params: {
  businessEmail: string
  businessName: string
  ownerName: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Application Received</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ff7a00;">Application Received!</h1>
          <p>Hi ${params.ownerName},</p>
          <p>Thank you for your interest in joining Try Local Gresham!</p>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>We've received your application for <strong>${params.businessName}</strong>.</p>
            <p>Our team will review your application and get back to you within 1-2 business days.</p>
          </div>

          <p>In the meantime, here's what happens next:</p>
          <ol>
            <li>Our team reviews your business information</li>
            <li>We'll send you an approval email with next steps</li>
            <li>You'll gain access to your business dashboard</li>
            <li>Start adding products and connecting with local customers!</li>
          </ol>

          <p>Questions? Reply to this email or visit our <a href="${SITE_URL}/contact" style="color: #ff7a00;">contact page</a>.</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            Try Local Gresham<br>
            Supporting local businesses in Gresham, Oregon<br>
            <a href="${SITE_URL}" style="color: #ff7a00;">try-local.com</a>
          </p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: params.businessEmail,
    subject: 'Application Received - Try Local Gresham',
    html,
  })
}

// Business approved notification
export async function sendBusinessApproved(params: {
  businessEmail: string
  businessName: string
  ownerName: string
  dashboardUrl: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Business Approved</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ff7a00;">Congratulations! 🎉</h1>
          <p>Hi ${params.ownerName},</p>
          <p>Great news! <strong>${params.businessName}</strong> has been approved to join Try Local Gresham!</p>

          <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <p style="margin: 0;"><strong>Your business is now live on Try Local Gresham!</strong></p>
          </div>

          <h2>Next Steps:</h2>
          <ol>
            <li><strong>Add your products:</strong> Upload your products/services to your catalog</li>
            <li><strong>Complete your profile:</strong> Add photos, hours, and business details</li>
            <li><strong>Start receiving orders:</strong> Customers can now find and order from you</li>
          </ol>

          <p style="text-align: center; margin: 30px 0;">
            <a href="${params.dashboardUrl}"
               style="display: inline-block; background: #ff7a00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Access Your Dashboard
            </a>
          </p>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Need Help?</h3>
            <p>Check out our <a href="${SITE_URL}/help" style="color: #ff7a00;">Help Center</a> for guides on:</p>
            <ul>
              <li>Adding products</li>
              <li>Managing orders</li>
              <li>Setting up delivery/pickup</li>
              <li>Best practices for success</li>
            </ul>
          </div>

          <p>Welcome to the Try Local Gresham community!</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            Try Local Gresham<br>
            <a href="${SITE_URL}" style="color: #ff7a00;">try-local.com</a>
          </p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: params.businessEmail,
    subject: '🎉 Your Business is Approved - Try Local Gresham',
    html,
  })
}

// Business rejected notification
export async function sendBusinessRejected(params: {
  businessEmail: string
  businessName: string
  ownerName: string
  reason?: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Application Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ff7a00;">Application Update</h1>
          <p>Hi ${params.ownerName},</p>
          <p>Thank you for your interest in joining Try Local Gresham with <strong>${params.businessName}</strong>.</p>

          <p>Unfortunately, we're unable to approve your application at this time.</p>

          ${
            params.reason
              ? `
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Reason:</strong></p>
            <p>${params.reason}</p>
          </div>
          `
              : ''
          }

          <p>If you have questions or would like to discuss this decision, please don't hesitate to <a href="${SITE_URL}/contact" style="color: #ff7a00;">contact us</a>.</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            Try Local Gresham<br>
            <a href="${SITE_URL}" style="color: #ff7a00;">try-local.com</a>
          </p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: params.businessEmail,
    subject: 'Application Update - Try Local Gresham',
    html,
  })
}

// New quote request notification to business
export async function sendNewQuoteRequestNotification(params: {
  businessEmail: string
  businessName: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  serviceType: string
  description: string
  urgency: 'urgent' | 'standard' | 'flexible'
  preferredContact: 'email' | 'phone'
}) {
  const dashboardUrl = `${SITE_URL}/dashboard/business/quotes`

  const urgencyColors = {
    urgent: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', label: 'URGENT - Needs help ASAP' },
    standard: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', label: 'Standard - Within a week' },
    flexible: { bg: '#d1fae5', border: '#10b981', text: '#065f46', label: 'Flexible - No rush' },
  }

  const urgencyStyle = urgencyColors[params.urgency]

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Quote Request</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f9fafb; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

            <!-- Header -->
            <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New Quote Request!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Someone is interested in your services</p>
            </div>

            <!-- Body -->
            <div style="padding: 24px;">

              <!-- Urgency Badge -->
              <div style="background: ${urgencyStyle.bg}; border-left: 4px solid ${urgencyStyle.border}; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0; color: ${urgencyStyle.text}; font-weight: bold; font-size: 14px;">${urgencyStyle.label}</p>
              </div>

              <!-- Service Type -->
              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">Service Requested</p>
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #111827;">${params.serviceType}</p>
              </div>

              <!-- Description -->
              <div style="margin-bottom: 20px;">
                <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">Project Details</p>
                <p style="margin: 0; color: #374151; line-height: 1.6;">${params.description}</p>
              </div>

              <!-- Customer Info -->
              <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">Customer Contact</p>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280; font-size: 14px; width: 120px;">Name:</td>
                    <td style="padding: 4px 0; font-weight: 600; font-size: 14px;">${params.customerName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Email:</td>
                    <td style="padding: 4px 0; font-size: 14px;"><a href="mailto:${params.customerEmail}" style="color: #059669;">${params.customerEmail}</a></td>
                  </tr>
                  ${params.customerPhone ? `
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Phone:</td>
                    <td style="padding: 4px 0; font-size: 14px;"><a href="tel:${params.customerPhone}" style="color: #059669;">${params.customerPhone}</a></td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Prefers:</td>
                    <td style="padding: 4px 0; font-weight: 600; font-size: 14px;">${params.preferredContact === 'phone' ? 'Phone Call' : 'Email'}</td>
                  </tr>
                </table>
              </div>

              <!-- CTA -->
              <div style="text-align: center; margin: 24px 0;">
                <a href="${dashboardUrl}"
                   style="display: inline-block; background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  View Quote Request
                </a>
              </div>

              <p style="text-align: center; color: #9ca3af; font-size: 13px; margin: 0;">
                Respond quickly to improve your chances of winning the job!
              </p>
            </div>

            <!-- Footer -->
            <div style="background: #f9fafb; padding: 16px 24px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                Sent via <a href="${SITE_URL}" style="color: #059669;">Try Local Gresham</a> &bull; Supporting local businesses
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: params.businessEmail,
    subject: `New Quote Request - ${params.serviceType} (${params.customerName})`,
    html,
  })
}

// Appointment confirmation email to customer
export async function sendAppointmentConfirmation(params: {
  customerEmail: string
  customerName: string
  appointmentId: string
  businessName: string
  serviceName: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  price: number
  notes?: string
}) {
  const AppointmentConfirmation = (await import('@/emails/AppointmentConfirmationEmail')).default

  const html = await render(
    AppointmentConfirmation({
      customerName: params.customerName,
      appointmentId: params.appointmentId,
      businessName: params.businessName,
      serviceName: params.serviceName,
      scheduledDate: params.scheduledDate,
      scheduledTime: params.scheduledTime,
      duration: params.duration,
      price: params.price,
      notes: params.notes,
    })
  )

  return sendEmail({
    to: params.customerEmail,
    subject: `Appointment Confirmed - ${params.businessName}`,
    html,
  })
}

// New appointment notification to business
export async function sendNewAppointmentNotification(params: {
  businessEmail: string
  businessName: string
  appointmentId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  serviceName: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  price: number
  notes?: string
}) {
  const NewAppointmentNotification = (await import('@/emails/NewAppointmentNotificationEmail'))
    .default

  const dashboardUrl = `${SITE_URL}/dashboard/business/appointments`

  const html = await render(
    NewAppointmentNotification({
      businessName: params.businessName,
      appointmentId: params.appointmentId,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      serviceName: params.serviceName,
      scheduledDate: params.scheduledDate,
      scheduledTime: params.scheduledTime,
      duration: params.duration,
      price: params.price,
      notes: params.notes,
      dashboardUrl,
    })
  )

  return sendEmail({
    to: params.businessEmail,
    subject: `New Appointment - ${params.customerName}`,
    html,
  })
}

// Appointment status update notification
export async function sendAppointmentStatusUpdate(params: {
  customerEmail: string
  customerName: string
  appointmentId: string
  businessName: string
  serviceName: string
  status: 'confirmed' | 'cancelled' | 'completed' | 'no-show'
  scheduledDate: string
  scheduledTime: string
  cancellationReason?: string
}) {
  const AppointmentStatusUpdate = (await import('@/emails/AppointmentStatusUpdateEmail')).default

  const html = await render(
    AppointmentStatusUpdate({
      customerName: params.customerName,
      appointmentId: params.appointmentId,
      businessName: params.businessName,
      serviceName: params.serviceName,
      status: params.status,
      scheduledDate: params.scheduledDate,
      scheduledTime: params.scheduledTime,
      cancellationReason: params.cancellationReason,
    })
  )

  const statusTitles = {
    confirmed: 'Appointment Confirmed',
    cancelled: 'Appointment Cancelled',
    completed: 'Appointment Completed',
    'no-show': 'Missed Appointment',
  }

  return sendEmail({
    to: params.customerEmail,
    subject: `${statusTitles[params.status]} - ${params.businessName}`,
    html,
  })
}
