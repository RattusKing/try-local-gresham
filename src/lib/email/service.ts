import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.EMAIL_FROM || 'Try Local Gresham <noreply@trylocalor.com>'

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions) {
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
  total: number
  deliveryMethod: 'pickup' | 'delivery'
  deliveryAddress?: string
}) {
  const itemsHtml = params.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.name} × ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `
    )
    .join('')

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ff7a00;">Order Confirmation</h1>
          <p>Hi ${params.customerName},</p>
          <p>Thank you for your order! Your order has been received and is being processed.</p>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Order #${params.orderId.slice(-6).toUpperCase()}</h2>
            <p><strong>Business:</strong> ${params.businessName}</p>
            <p><strong>Method:</strong> ${params.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}</p>
            ${params.deliveryAddress ? `<p><strong>Address:</strong> ${params.deliveryAddress}</p>` : ''}
          </div>

          <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 10px; text-align: left;">Item</th>
                <th style="padding: 10px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td style="padding: 10px; font-weight: bold;">Total</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">$${params.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <p>The business will contact you soon to confirm your order and arrange ${params.deliveryMethod}.</p>

          <p>You can view your order status at any time in your <a href="https://trylocalor.com/orders" style="color: #ff7a00;">order history</a>.</p>

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
  total: number
  deliveryMethod: 'pickup' | 'delivery'
  deliveryAddress?: string
  deliveryNotes?: string
}) {
  const itemsHtml = params.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.name} × ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `
    )
    .join('')

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Order</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ff7a00;">New Order Received! 🎉</h1>
          <p>You have a new order from Try Local Gresham.</p>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Order #${params.orderId.slice(-6).toUpperCase()}</h2>
            <p><strong>Customer:</strong> ${params.customerName}</p>
            <p><strong>Email:</strong> ${params.customerEmail}</p>
            ${params.customerPhone ? `<p><strong>Phone:</strong> ${params.customerPhone}</p>` : ''}
            <p><strong>Method:</strong> ${params.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}</p>
            ${params.deliveryAddress ? `<p><strong>Address:</strong> ${params.deliveryAddress}</p>` : ''}
            ${params.deliveryNotes ? `<p><strong>Notes:</strong> ${params.deliveryNotes}</p>` : ''}
          </div>

          <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 10px; text-align: left;">Item</th>
                <th style="padding: 10px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td style="padding: 10px; font-weight: bold;">Total</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">$${params.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <strong>Action Required:</strong> Please log in to your dashboard to confirm or manage this order.
          </div>

          <p style="text-align: center;">
            <a href="https://trylocalor.com/dashboard/business/orders"
               style="display: inline-block; background: #ff7a00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Order in Dashboard
            </a>
          </p>

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
  status: 'confirmed' | 'ready' | 'completed' | 'cancelled'
  deliveryMethod: 'pickup' | 'delivery'
}) {
  const statusMessages = {
    confirmed: {
      title: 'Order Confirmed',
      message: 'Great news! Your order has been confirmed and is being prepared.',
    },
    ready: {
      title: 'Order Ready',
      message:
        params.deliveryMethod === 'pickup'
          ? 'Your order is ready for pickup!'
          : 'Your order is ready for delivery!',
    },
    completed: {
      title: 'Order Completed',
      message: 'Your order has been completed. Thank you for supporting local!',
    },
    cancelled: {
      title: 'Order Cancelled',
      message:
        'Your order has been cancelled. If you have questions, please contact the business directly.',
    },
  }

  const { title, message } = statusMessages[params.status]

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ff7a00;">${title}</h1>
          <p>Hi ${params.customerName},</p>
          <p>${message}</p>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Order #${params.orderId.slice(-6).toUpperCase()}</h2>
            <p><strong>Business:</strong> ${params.businessName}</p>
            <p><strong>Status:</strong> ${params.status.charAt(0).toUpperCase() + params.status.slice(1)}</p>
          </div>

          <p style="text-align: center;">
            <a href="https://trylocalor.com/orders"
               style="display: inline-block; background: #ff7a00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Order Details
            </a>
          </p>

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
    to: params.customerEmail,
    subject: `${title} - ${params.businessName}`,
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
