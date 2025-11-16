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
} from '@react-email/components'

interface OrderItem {
  productName: string
  quantity: number
  price: number
}

interface OrderConfirmationEmailProps {
  customerName: string
  orderId: string
  businessName: string
  items: OrderItem[]
  subtotal: number
  platformFee: number
  discount?: number
  total: number
  deliveryMethod: string
  deliveryAddress?: string
  pickupAddress?: string
  orderDate: string
}

export default function OrderConfirmationEmail({
  customerName,
  orderId,
  businessName,
  items,
  subtotal,
  platformFee,
  discount,
  total,
  deliveryMethod,
  deliveryAddress,
  pickupAddress,
  orderDate,
}: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your order from {businessName} has been confirmed!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Order Confirmed! 🎉</Heading>

          <Text style={text}>Hi {customerName},</Text>

          <Text style={text}>
            Thank you for your order from <strong>{businessName}</strong>! We've received your order and the business has been notified.
          </Text>

          <Section style={orderDetails}>
            <Text style={orderDetailTitle}>Order Details</Text>
            <Text style={orderMeta}>
              Order ID: <strong>{orderId}</strong>
              <br />
              Date: {orderDate}
            </Text>
          </Section>

          <Section style={itemsSection}>
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
                <Text style={itemText}>Platform Fee</Text>
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
                <Text style={totalText}>Total</Text>
              </Column>
              <Column style={priceColumn}>
                <Text style={totalText}>${total.toFixed(2)}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={deliverySection}>
            <Text style={deliveryTitle}>
              {deliveryMethod === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
            </Text>
            <Text style={text}>
              {deliveryMethod === 'delivery'
                ? `Delivery Address: ${deliveryAddress}`
                : `Pickup Address: ${pickupAddress}`
              }
            </Text>
          </Section>

          <Text style={text}>
            The business will review your order and update you on the status. You can track your order status in your account dashboard.
          </Text>

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
  backgroundColor: '#fef3e7',
  padding: '20px',
  borderRadius: '6px',
  margin: '24px 0',
}

const deliveryTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px',
}

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '32px 0 0',
  textAlign: 'center' as const,
}
