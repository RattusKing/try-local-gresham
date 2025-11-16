import { Resend } from 'resend'
import { render } from '@react-email/components'
import OrderConfirmationEmail from '@/emails/OrderConfirmationEmail'
import NewOrderNotificationEmail from '@/emails/NewOrderNotificationEmail'
import OrderStatusUpdateEmail from '@/emails/OrderStatusUpdateEmail'

const FROM_EMAIL = process.env.EMAIL_FROM || 'Try Local Gresham <noreply@trylocalor.com>'
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
    console.log('Email service not configured (missing RESEND_API_KEY). Email not sent:', {
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

    console.log('Email sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending email:', error)
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

  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/business/orders`
    : 'https://trylocalor.com/dashboard/business/orders'

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
  const orderUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/orders`
    : 'https://trylocalor.com/orders'

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

          <p>Questions? Reply to this email or visit our <a href="https://trylocalor.com/contact" style="color: #ff7a00;">contact page</a>.</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            Try Local Gresham<br>
            Supporting local businesses in Gresham, Oregon<br>
            <a href="https://trylocalor.com" style="color: #ff7a00;">trylocalor.com</a>
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
            <p>Check out our <a href="https://trylocalor.com/help" style="color: #ff7a00;">Help Center</a> for guides on:</p>
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
            <a href="https://trylocalor.com" style="color: #ff7a00;">trylocalor.com</a>
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

          <p>If you have questions or would like to discuss this decision, please don't hesitate to <a href="https://trylocalor.com/contact" style="color: #ff7a00;">contact us</a>.</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            Try Local Gresham<br>
            <a href="https://trylocalor.com" style="color: #ff7a00;">trylocalor.com</a>
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
