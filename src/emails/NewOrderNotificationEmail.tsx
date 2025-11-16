import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
  Button,
} from '@react-email/components'

interface OrderItem {
  productName: string
  quantity: number
  price: number
}

interface NewOrderNotificationEmailProps {
  businessName: string
  orderId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  items: OrderItem[]
  subtotal: number
  platformFee: number
  discount?: number
  total: number
  deliveryMethod: string
  deliveryAddress?: string
  specialInstructions?: string
  orderDate: string
  dashboardUrl: string
}

export default function NewOrderNotificationEmail({
  businessName,
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  items,
  subtotal,
  platformFee,
  discount,
  total,
  deliveryMethod,
  deliveryAddress,
  specialInstructions,
  orderDate,
  dashboardUrl,
}: NewOrderNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New order from {customerName} - {orderId}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🛒 New Order Received!</Heading>

          <Text style={text}>Hi {businessName} team,</Text>

          <Text style={text}>
            You have a new order! Please review and accept it in your dashboard.
          </Text>

          <Section style={alertBox}>
            <Text style={alertText}>
              ⏰ <strong>Action Required:</strong> Review and accept this order as soon as possible.
            </Text>
          </Section>

          <Section style={orderDetails}>
            <Text style={orderDetailTitle}>Order Details</Text>
            <Text style={orderMeta}>
              Order ID: <strong>{orderId}</strong>
              <br />
              Date: {orderDate}
              <br />
              Status: <span style={statusBadge}>Pending</span>
            </Text>
          </Section>

          <Section style={customerSection}>
            <Text style={sectionTitle}>Customer Information</Text>
            <Text style={customerText}>
              <strong>Name:</strong> {customerName}
              <br />
              <strong>Email:</strong> {customerEmail}
              {customerPhone && (
                <>
                  <br />
                  <strong>Phone:</strong> {customerPhone}
                </>
              )}
            </Text>
          </Section>

          <Section style={itemsSection}>
            <Text style={sectionTitle}>Order Items</Text>
            {items.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column style={itemColumn}>
                  <Text style={itemText}>
                    {item.quantity}x {item.productName}
                  </Text>
                </Column>
                <Column style={priceColumn}>
                  <Text style={itemText}>${item.price.toFixed(2)}</Text>
                </Column>
              </Row>
            ))}

            <Hr style={divider} />

            <Row style={itemRow}>
              <Column style={itemColumn}>
                <Text style={itemText}>Subtotal</Text>
              </Column>
              <Column style={priceColumn}>
                <Text style={itemText}>${subtotal.toFixed(2)}</Text>
              </Column>
            </Row>

            <Row style={itemRow}>
              <Column style={itemColumn}>
                <Text style={itemText}>Platform Fee (10%)</Text>
              </Column>
              <Column style={priceColumn}>
                <Text style={itemText}>${platformFee.toFixed(2)}</Text>
              </Column>
            </Row>

            {discount && discount > 0 && (
              <Row style={itemRow}>
                <Column style={itemColumn}>
                  <Text style={itemText}>Discount</Text>
                </Column>
                <Column style={priceColumn}>
                  <Text style={itemText}>-${discount.toFixed(2)}</Text>
                </Column>
              </Row>
            )}

            <Hr style={divider} />

            <Row style={itemRow}>
              <Column style={itemColumn}>
                <Text style={totalText}>Your Earnings</Text>
              </Column>
              <Column style={priceColumn}>
                <Text style={totalText}>${(subtotal - (discount || 0)).toFixed(2)}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={deliverySection}>
            <Text style={sectionTitle}>
              {deliveryMethod === 'delivery' ? '🚚 Delivery Order' : '🏪 Pickup Order'}
            </Text>
            {deliveryMethod === 'delivery' && deliveryAddress && (
              <Text style={text}>
                <strong>Delivery Address:</strong>
                <br />
                {deliveryAddress}
              </Text>
            )}
            {deliveryMethod === 'pickup' && (
              <Text style={text}>
                Customer will pick up from your location.
              </Text>
            )}
          </Section>

          {specialInstructions && (
            <Section style={instructionsSection}>
              <Text style={sectionTitle}>Special Instructions</Text>
              <Text style={instructionsText}>{specialInstructions}</Text>
            </Section>
          )}

          <Section style={ctaSection}>
            <Button href={dashboardUrl} style={button}>
              View Order in Dashboard
            </Button>
          </Section>

          <Text style={footer}>
            Log in to your business dashboard to accept or decline this order.
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
  padding: '40px 20px',
  marginBottom: '64px',
  maxWidth: '600px',
  borderRadius: '8px',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 20px',
  padding: '0',
  lineHeight: '1.2',
}

const text = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const alertBox = {
  backgroundColor: '#fef3e7',
  border: '2px solid #ff7a00',
  padding: '16px',
  borderRadius: '6px',
  margin: '24px 0',
}

const alertText = {
  color: '#1a1a1a',
  fontSize: '14px',
  margin: '0',
  lineHeight: '20px',
}

const orderDetails = {
  backgroundColor: '#f9fafb',
  padding: '20px',
  borderRadius: '6px',
  margin: '24px 0',
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
  backgroundColor: '#fef3e7',
  color: '#ff7a00',
  padding: '2px 8px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 'bold',
}

const customerSection = {
  margin: '24px 0',
}

const sectionTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px',
}

const customerText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
}

const itemsSection = {
  margin: '24px 0',
}

const itemRow = {
  marginBottom: '8px',
}

const itemColumn = {
  width: '70%',
  verticalAlign: 'top',
}

const priceColumn = {
  width: '30%',
  textAlign: 'right' as const,
  verticalAlign: 'top',
}

const itemText = {
  color: '#4b5563',
  fontSize: '14px',
  margin: '0',
  padding: '4px 0',
}

const totalText = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
  padding: '4px 0',
}

const divider = {
  borderColor: '#e5e7eb',
  margin: '16px 0',
}

const deliverySection = {
  backgroundColor: '#f9fafb',
  padding: '20px',
  borderRadius: '6px',
  margin: '24px 0',
}

const instructionsSection = {
  backgroundColor: '#fff7ed',
  padding: '20px',
  borderRadius: '6px',
  margin: '24px 0',
}

const instructionsText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
  fontStyle: 'italic',
}

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
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
  textAlign: 'center' as const,
}
