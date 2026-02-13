'use client'

import { useAuth } from '@/lib/firebase/auth-context'
import { db } from '@/lib/firebase/config'
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  orderBy,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Appointment } from '@/lib/types'
import './appointments.css'

export default function CustomerAppointments() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    loadAppointments()
  }, [user])

  const loadAppointments = async () => {
    if (!user || !db) return

    try {
      setLoading(true)
      // Query without orderBy to avoid needing a composite index
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('customerId', '==', user.uid)
      )
      const appointmentsSnap = await getDocs(appointmentsQuery)
      const appointmentsList = appointmentsSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Appointment[]

      // Sort by scheduledDate descending on client-side
      appointmentsList.sort((a, b) => {
        const dateA = new Date(a.scheduledDate).getTime()
        const dateB = new Date(b.scheduledDate).getTime()
        return dateB - dateA // Descending order (newest first)
      })

      setAppointments(appointmentsList)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const cancelAppointment = async (appointmentId: string) => {
    if (!db) return
    if (!confirm('Are you sure you want to cancel this appointment?')) return

    try {
      const appointmentRef = doc(db, 'appointments', appointmentId)
      await updateDoc(appointmentRef, {
        status: 'cancelled',
        updatedAt: new Date(),
      })

      // Send notifications (fire-and-forget):
      // 1. Cancellation confirmation email to customer
      // 2. Push notification to business owner
      const appointment = appointments.find((a) => a.id === appointmentId)
      if (appointment) {
        // Customer gets cancellation email
        fetch('/api/emails/appointment-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerEmail: appointment.customerEmail,
            customerName: appointment.customerName,
            appointmentId: appointment.id,
            businessName: appointment.businessName,
            serviceName: appointment.serviceName,
            status: 'cancelled',
            scheduledDate: appointment.scheduledDate,
            scheduledTime: appointment.scheduledTime,
          }),
        }).catch(() => {})

        // Business gets push notification
        fetch('/api/notify/appointment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'customer_cancelled',
            appointmentId: appointment.id,
            businessId: appointment.businessId,
            businessName: appointment.businessName,
            customerId: appointment.customerId,
            customerName: appointment.customerName,
            customerEmail: appointment.customerEmail,
            serviceName: appointment.serviceName,
            scheduledDate: appointment.scheduledDate,
            scheduledTime: appointment.scheduledTime,
            duration: appointment.duration,
            price: appointment.price,
          }),
        }).catch(() => {})
      }

      setSuccess('Appointment cancelled successfully')
      await loadAppointments()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const filteredAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.scheduledDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (filter === 'upcoming') {
      return aptDate >= today && apt.status !== 'completed' && apt.status !== 'cancelled'
    } else {
      return aptDate < today || apt.status === 'completed' || apt.status === 'cancelled'
    }
  })

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading appointments...</p>
      </div>
    )
  }

  return (
    <div className="customer-dashboard">
      <div className="dashboard-header">
        <h1>My Appointments</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="appointments-filters">
        <button
          className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`filter-btn ${filter === 'past' ? 'active' : ''}`}
          onClick={() => setFilter('past')}
        >
          Past
        </button>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</span>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>No appointments</h3>
          <p style={{ margin: 0, color: '#6b7280' }}>
            {filter === 'upcoming'
              ? 'You have no upcoming appointments'
              : 'No past appointments'}
          </p>
        </div>
      ) : (
        <div className="appointments-list">
          {filteredAppointments.map((appointment) => (
            <div key={appointment.id} className={`appointment-card status-${appointment.status}`}>
              <div className="appointment-header">
                <div className="appointment-service">
                  <h3>{appointment.serviceName}</h3>
                  <p className="business-name">{appointment.businessName}</p>
                  <span className={`status-badge status-${appointment.status}`}>
                    {appointment.status}
                  </span>
                </div>
                <div className="appointment-price">
                  ${appointment.price.toFixed(2)}
                </div>
              </div>

              <div className="appointment-details">
                <div className="detail-row">
                  <span className="detail-icon">📅</span>
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">
                    {new Date(appointment.scheduledDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-icon">⏰</span>
                  <span className="detail-label">Time:</span>
                  <span className="detail-value">
                    {appointment.scheduledTime} ({appointment.duration} min)
                  </span>
                </div>
              </div>

              {appointment.notes && (
                <div className="customer-notes">
                  <strong>Your Notes:</strong>
                  <p>{appointment.notes}</p>
                </div>
              )}

              {appointment.status === 'pending' && (
                <div className="appointment-status-info pending">
                  ⏳ Waiting for business confirmation
                </div>
              )}

              {appointment.status === 'confirmed' && (
                <div className="appointment-status-info confirmed">
                  ✓ Confirmed - See you then!
                </div>
              )}

              {appointment.status === 'completed' && (
                <div className="appointment-status-info completed">
                  ✓ Completed
                </div>
              )}

              {appointment.status === 'cancelled' && (
                <div className="appointment-status-info cancelled">
                  ✗ Cancelled
                </div>
              )}

              {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                <div className="appointment-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => cancelAppointment(appointment.id)}
                  >
                    Cancel Appointment
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
