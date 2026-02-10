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
import { SITE_URL } from '@/lib/site-config'

interface AppointmentConfirmationEmailProps {
  customerName: string
  appointmentId: string
  businessName: string
  serviceName: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  price: number
  notes?: string
}

export default function AppointmentConfirmationEmail({
  customerName,
  appointmentId,
  businessName,
  serviceName,
  scheduledDate,
  scheduledTime,
  duration,
  price,
  notes,
}: AppointmentConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your appointment at {businessName} has been requested!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Appointment Requested! 📅</Heading>

          <Text style={text}>Hi {customerName},</Text>

          <Text style={text}>
            We've received your appointment request at <strong>{businessName}</strong>. The business will review and confirm your appointment soon.
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
            {notes && (
              <>
                <Text style={notesLabel}>Your Notes:</Text>
                <Text style={notesText}>{notes}</Text>
              </>
            )}
          </Section>

          <Section style={statusSection}>
            <Text style={statusTitle}>⏳ Status: Pending Confirmation</Text>
            <Text style={text}>
              {businessName} will confirm your appointment shortly. You'll receive another email once it's confirmed.
            </Text>
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={`${SITE_URL}/dashboard/customer/appointments`}>
              View My Appointments
            </Button>
          </Section>

          <Text style={text}>
            You can view and manage your appointments in your dashboard at any time.
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
}

const statusSection = {
  backgroundColor: '#fef3c7',
  padding: '20px',
  borderRadius: '6px',
  margin: '24px 0',
}

const statusTitle = {
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
