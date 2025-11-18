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

interface AppointmentStatusUpdateEmailProps {
  customerName: string
  businessName: string
  serviceName: string
  scheduledDate: string
  scheduledTime: string
  status: 'confirmed' | 'cancelled' | 'completed'
  businessNotes?: string
}

export default function AppointmentStatusUpdateEmail({
  customerName,
  businessName,
  serviceName,
  scheduledDate,
  scheduledTime,
  status,
  businessNotes,
}: AppointmentStatusUpdateEmailProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'confirmed':
        return {
          emoji: '✅',
          title: 'Appointment Confirmed!',
          message: `Great news! ${businessName} has confirmed your appointment.`,
          sectionBg: '#d1fae5',
          sectionBorder: '#99edc3',
          statusColor: '#065f46',
        }
      case 'cancelled':
        return {
          emoji: '❌',
          title: 'Appointment Cancelled',
          message: `Your appointment at ${businessName} has been cancelled.`,
          sectionBg: '#fee2e2',
          sectionBorder: '#fecaca',
          statusColor: '#991b1b',
        }
      case 'completed':
        return {
          emoji: '🎉',
          title: 'Appointment Completed',
          message: `Thank you for visiting ${businessName}! We hope you had a great experience.`,
          sectionBg: '#dbeafe',
          sectionBorder: '#bfdbfe',
          statusColor: '#1e40af',
        }
    }
  }

  const config = getStatusConfig()

  return (
    <Html>
      <Head />
      <Preview>Your appointment at {businessName} has been {status}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{config.emoji} {config.title}</Heading>

          <Text style={text}>Hi {customerName},</Text>

          <Text style={text}>{config.message}</Text>

          <Section style={{
            ...appointmentDetails,
            backgroundColor: config.sectionBg,
            border: `2px solid ${config.sectionBorder}`,
          }}>
            <Text style={{ ...appointmentDetailTitle, color: config.statusColor }}>
              Appointment Details
            </Text>
            <Text style={detailText}>
              <strong>Service:</strong> {serviceName}
              <br />
              <strong>Date:</strong> {scheduledDate}
              <br />
              <strong>Time:</strong> {scheduledTime}
            </Text>
            {businessNotes && (
              <>
                <Text style={notesLabel}>Note from {businessName}:</Text>
                <Text style={notesText}>{businessNotes}</Text>
              </>
            )}
          </Section>

          {status === 'confirmed' && (
            <>
              <Text style={text}>
                Please arrive on time for your appointment. If you need to cancel or reschedule, please do so at least 24 hours in advance.
              </Text>
              <Section style={buttonSection}>
                <Button style={button} href="https://try-local.com/dashboard/customer/appointments">
                  View My Appointments
                </Button>
              </Section>
            </>
          )}

          {status === 'cancelled' && (
            <Text style={text}>
              If you'd like to reschedule, you can book a new appointment at any time through the {businessName} page.
            </Text>
          )}

          {status === 'completed' && (
            <Text style={text}>
              We'd love to hear about your experience! Consider leaving a review to help other customers.
            </Text>
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
  padding: '20px',
  borderRadius: '6px',
  margin: '24px 0',
}

const appointmentDetailTitle = {
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
