import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
} from '@react-email/components'

interface OrderStatusUpdateEmailProps {
  customerName: string
  orderId: string
  businessName: string
  status: string
  statusMessage: string
  deliveryMethod: string
  deliveryAddress?: string
  pickupAddress?: string
  orderUrl?: string
}

const statusConfig: Record<string, { emoji: string; color: string; title: string; description: string }> = {
  accepted: {
    emoji: '✅',
    color: '#10b981',
    title: 'Order Accepted!',
    description: 'Good news! Your order has been accepted and is being prepared.',
  },
  ready: {
    emoji: '📦',
    color: '#3b82f6',
    title: 'Order Ready!',
    description: 'Your order is ready!',
  },
  completed: {
    emoji: '🎉',
    color: '#8b5cf6',
    title: 'Order Completed!',
    description: 'Your order has been completed. Thank you for your purchase!',
  },
  rejected: {
    emoji: '❌',
    color: '#ef4444',
    title: 'Order Declined',
    description: 'Unfortunately, your order could not be fulfilled at this time.',
  },
}

export default function OrderStatusUpdateEmail({
  customerName,
  orderId,
  businessName,
  status,
  statusMessage,
  deliveryMethod,
  deliveryAddress,
  pickupAddress,
  orderUrl,
}: OrderStatusUpdateEmailProps) {
  const config = statusConfig[status] || statusConfig.accepted

  return (
    <Html>
      <Head />
      <Preview>Order {orderId} - {config.title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ ...statusBanner, backgroundColor: config.color }}>
            <Text style={statusEmoji}>{config.emoji}</Text>
            <Heading style={h1}>{config.title}</Heading>
          </Section>

          <Text style={text}>Hi {customerName},</Text>

          <Text style={text}>{config.description}</Text>

          <Section style={orderDetails}>
            <Text style={orderDetailTitle}>Order Information</Text>
            <Text style={orderMeta}>
              Order ID: <strong>{orderId}</strong>
              <br />
              Business: <strong>{businessName}</strong>
              <br />
              Status: <span style={{ ...statusBadge, backgroundColor: config.color }}>{status.toUpperCase()}</span>
            </Text>
          </Section>

          {statusMessage && (
            <Section style={messageBox}>
              <Text style={messageTitle}>Message from {businessName}</Text>
              <Text style={messageText}>{statusMessage}</Text>
            </Section>
          )}

          {status === 'ready' && (
            <Section style={deliverySection}>
              <Text style={deliveryTitle}>
                {deliveryMethod === 'delivery' ? '🚚 Out for Delivery' : '🏪 Ready for Pickup'}
              </Text>
              <Text style={text}>
                {deliveryMethod === 'delivery'
                  ? `Your order is on its way to: ${deliveryAddress}`
                  : `Your order is ready for pickup at: ${pickupAddress}`
                }
              </Text>
            </Section>
          )}

          {status === 'accepted' && (
            <Text style={text}>
              We'll notify you when your order is ready for {deliveryMethod === 'delivery' ? 'delivery' : 'pickup'}.
            </Text>
          )}

          {status === 'completed' && (
            <Text style={text}>
              We hope you enjoyed your order! Your support of local businesses makes a difference in our community.
            </Text>
          )}

          {status === 'rejected' && (
            <Text style={text}>
              If you have any questions, please contact {businessName} directly. You have not been charged for this order.
            </Text>
          )}

          {orderUrl && status !== 'rejected' && (
            <Section style={ctaSection}>
              <Button href={orderUrl} style={button}>
                View Order Details
              </Button>
            </Section>
          )}

          <Text style={footer}>
            Thank you for supporting local businesses in Gresham!
            <br />
            <strong>Try Local Gresham</strong>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  marginBottom: '64px',
  maxWidth: '600px',
  borderRadius: '8px',
  overflow: 'hidden',
}

const statusBanner = {
  padding: '40px 20px',
  textAlign: 'center' as const,
}

const statusEmoji = {
  fontSize: '48px',
  margin: '0 0 16px',
  lineHeight: '1',
}

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
  lineHeight: '1.2',
}

const text = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 20px',
}

const orderDetails = {
  backgroundColor: '#f9fafb',
  padding: '20px',
  margin: '24px 20px',
  borderRadius: '6px',
}

const orderDetailTitle = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px',
}

const orderMeta = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
}

const statusBadge = {
  color: '#ffffff',
  padding: '4px 12px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 'bold',
  display: 'inline-block',
}

const messageBox = {
  backgroundColor: '#fff7ed',
  border: '1px solid #fed7aa',
  padding: '20px',
  margin: '24px 20px',
  borderRadius: '6px',
}

const messageTitle = {
  color: '#1a1a1a',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const messageText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
  fontStyle: 'italic',
}

const deliverySection = {
  backgroundColor: '#fef3e7',
  padding: '20px',
  margin: '24px 20px',
  borderRadius: '6px',
}

const deliveryTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px',
}

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 20px',
}

const button = {
  backgroundColor: '#ff7a00',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
}

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '32px 0 0',
  padding: '0 20px 40px',
  textAlign: 'center' as const,
}
