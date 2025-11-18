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

interface NewAppointmentNotificationEmailProps {
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
}

export default function NewAppointmentNotificationEmail({
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
}: NewAppointmentNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New appointment request from {customerName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>📅 New Appointment Request</Heading>

          <Text style={text}>Hi {businessName},</Text>

          <Text style={text}>
            You have received a new appointment request from <strong>{customerName}</strong>.
          </Text>

          <Section style={appointmentDetails}>
            <Text style={appointmentDetailTitle}>Appointment Details</Text>
            <Text style={detailText}>
              <strong>Service:</strong> {serviceName}
              <br />
              <strong>Date:</strong> {scheduledDate}
              <br />
              <strong>Time:</strong> {scheduledTime}
              <br />
              <strong>Duration:</strong> {duration} minutes
              <br />
              <strong>Price:</strong> ${price.toFixed(2)}
            </Text>
          </Section>

          <Section style={customerDetails}>
            <Text style={customerDetailTitle}>Customer Information</Text>
            <Text style={detailText}>
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
            {notes && (
              <>
                <Text style={notesLabel}>Customer Notes:</Text>
                <Text style={notesText}>{notes}</Text>
              </>
            )}
          </Section>

          <Section style={actionSection}>
            <Text style={actionTitle}>⚡ Action Required</Text>
            <Text style={text}>
              Please review and confirm this appointment as soon as possible. The customer is waiting for your confirmation.
            </Text>
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href="https://trylocalor.com/dashboard/business/appointments">
              Manage Appointments
            </Button>
          </Section>

          <Text style={footer}>
            <strong>Try Local Gresham</strong>
            <br />
            Supporting local businesses in Gresham
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

const appointmentDetails = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #99edc3',
  padding: '20px',
  borderRadius: '6px',
  margin: '24px 0',
}

const appointmentDetailTitle = {
  color: '#065f46',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
}

const customerDetails = {
  backgroundColor: '#eff6ff',
  border: '2px solid #bfdbfe',
  padding: '20px',
  borderRadius: '6px',
  margin: '24px 0',
}

const customerDetailTitle = {
  color: '#1e40af',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
}

const detailText = {
  color: '#1a1a1a',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0',
}

const notesLabel = {
  color: '#065f46',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '16px 0 8px',
}

const notesText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
  fontStyle: 'italic',
  backgroundColor: '#f9fafb',
  padding: '12px',
  borderRadius: '4px',
}

const actionSection = {
  backgroundColor: '#fef3c7',
  padding: '20px',
  borderRadius: '6px',
  margin: '24px 0',
}

const actionTitle = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#99edc3',
  borderRadius: '6px',
  color: '#065f46',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
}

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '32px 0 0',
  textAlign: 'center' as const,
}
