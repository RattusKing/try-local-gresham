# Email Notifications Setup Guide

This guide explains how to set up email notifications for Try Local Gresham using Resend.

## Overview

The platform sends the following email notifications:

1. **Order Confirmation** - Sent to customers when they place an order
2. **New Order Notification** - Sent to businesses when they receive a new order
3. **Order Status Updates** - Sent to customers when order status changes (accepted, ready, completed, rejected)
4. **Business Application Emails** - Sent when businesses apply and get approved/rejected

## Email Service: Resend

We use [Resend](https://resend.com) for sending transactional emails. Resend offers:
- 3,000 emails/month free tier
- $0.001 per email after that
- Great developer experience
- React Email support for beautiful templates

## Setup Instructions

### 1. Create a Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key

1. Log in to your Resend dashboard
2. Go to **API Keys** in the left sidebar
3. Click **Create API Key**
4. Name it (e.g., "Try Local Gresham Production")
5. Copy the API key (it starts with `re_`)

### 3. Verify Your Domain (Production)

For production use, you need to verify your domain:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `trylocalor.com`)
4. Add the provided DNS records to your domain registrar
5. Wait for verification (usually takes a few minutes)

**For development/testing**, you can skip this step and use Resend's test mode.

### 4. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Resend API Key
RESEND_API_KEY=re_your_api_key_here

# From Email Address
# For development: use any email (emails will go to your Resend inbox)
EMAIL_FROM=Try Local Gresham <noreply@yourdomain.com>

# Application URL (used for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# For production: https://trylocalor.com
```

### 5. Test Email Notifications

#### Test in Development

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Place a test order:
   - Add items to cart
   - Go through checkout
   - Check your Resend dashboard for sent emails

3. Test order status updates:
   - Go to Business Dashboard > Orders
   - Update an order status
   - Check for status update emails

#### Without Resend API Key

If you don't configure `RESEND_API_KEY`, the app will still work but emails won't actually send. You'll see console logs instead:

```
Email service not configured (missing RESEND_API_KEY). Email not sent: { to: '...', subject: '...' }
```

This is useful for development when you don't need real emails.

## Email Templates

All email templates are built with React Email and located in `/src/emails/`:

- `OrderConfirmationEmail.tsx` - Customer order confirmation
- `NewOrderNotificationEmail.tsx` - Business new order alert
- `OrderStatusUpdateEmail.tsx` - Order status change notifications

Templates include:
- Professional design with branded colors
- Responsive layout for mobile devices
- Detailed order information
- Call-to-action buttons
- Dynamic status-based styling

## Customization

### Change From Address

Update the `EMAIL_FROM` environment variable:

```bash
EMAIL_FROM=Your Store Name <noreply@yourdomain.com>
```

### Customize Email Templates

Edit the React Email templates in `/src/emails/`:

```typescript
// Example: Change the header color
const h1 = {
  color: '#1a1a1a',  // Change this to your brand color
  fontSize: '32px',
  // ...
}
```

### Preview Email Templates

You can preview emails locally using React Email CLI:

```bash
# Install React Email CLI globally
npm install -g react-email

# Start preview server
npx react-email dev
```

This opens a browser with live previews of all your email templates.

## Email Sending Flow

### Order Confirmation Flow

1. Customer completes checkout
2. Order is created in Firestore
3. API call to `/api/emails/order-confirmation`
4. Service renders `OrderConfirmationEmail` template
5. Resend sends email to customer AND business

### Status Update Flow

1. Business updates order status in dashboard
2. Order status updated in Firestore
3. API call to `/api/emails/order-status`
4. Service renders `OrderStatusUpdateEmail` template
5. Resend sends email to customer

## Monitoring and Debugging

### View Sent Emails

1. Log in to Resend dashboard
2. Go to **Emails** in the sidebar
3. See all sent emails with delivery status

### Check for Errors

Look for console errors in your application:

```bash
# Development
npm run dev
# Watch the terminal for email errors
```

Common errors:
- `RESEND_API_KEY is not configured` - Add API key to `.env.local`
- `Invalid email address` - Check recipient email format
- `Domain not verified` - Verify your domain in Resend (production only)

### Test Mode

In development, Resend automatically uses test mode:
- Emails won't be delivered to real recipients
- You can see emails in Resend dashboard
- No domain verification needed

## Production Deployment

### Environment Variables

Make sure to set these in your production environment (Vercel, etc.):

```bash
RESEND_API_KEY=re_your_production_api_key
EMAIL_FROM=Try Local Gresham <noreply@trylocalor.com>
NEXT_PUBLIC_APP_URL=https://trylocalor.com
```

### Domain Verification

Before going live:
1. Verify your domain in Resend
2. Update `EMAIL_FROM` to use your verified domain
3. Test email delivery with real email addresses

## Cost Estimation

Resend pricing:
- **Free tier**: 3,000 emails/month
- **Pay as you go**: $0.001/email (100 emails = $0.10)

Typical usage for a marketplace:
- 100 orders/month = 200 emails (order confirmation + business notification)
- 200 status updates/month = 200 emails
- **Total: ~400 emails/month (well within free tier)**

## Troubleshooting

### Emails Not Sending

1. **Check API key**: Verify `RESEND_API_KEY` is set correctly
2. **Check console**: Look for error messages
3. **Resend dashboard**: Check for failed deliveries
4. **Email format**: Ensure valid email addresses

### Emails Going to Spam

1. **Verify domain**: Use a verified domain in production
2. **SPF/DKIM records**: Resend provides these automatically
3. **From address**: Use a professional from address
4. **Content**: Avoid spam trigger words

### Slow Email Delivery

- Emails are sent asynchronously (non-blocking)
- Checkout completes immediately
- Emails typically arrive within 1-2 seconds
- Check Resend dashboard for delivery times

## Support

- **Resend Documentation**: https://resend.com/docs
- **React Email Docs**: https://react.email/docs
- **Resend Community**: https://resend.com/discord

## Next Steps

After setting up email notifications, consider:
1. **Customizing email templates** with your branding
2. **Adding more notification types** (shipping updates, etc.)
3. **Setting up email analytics** to track open rates
4. **Implementing email preferences** for users

---

**Note**: The application will work without email configured - it just won't send notifications. This is useful for local development and testing.
