'use client'

import { useAuth } from '@/lib/firebase/auth-context'
import { db } from '@/lib/firebase/config'
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
} from 'firebase/firestore'
import { useEffect, useState, useCallback } from 'react'
import { Appointment, AppointmentStatus } from '@/lib/types'
import './appointments.css'

export default function BusinessAppointments() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesText, setNotesText] = useState('')

  const loadAppointments = useCallback(async () => {
    if (!user || !db) return

    try {
      setLoading(true)
      // Query without orderBy to avoid needing a composite index
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('businessId', '==', user.uid)
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
  }, [user, db])

  useEffect(() => {
    loadAppointments()
  }, [user, loadAppointments])

  const updateStatus = async (appointmentId: string, status: AppointmentStatus) => {
    if (!db) return

    try {
      const appointmentRef = doc(db, 'appointments', appointmentId)
      await updateDoc(appointmentRef, {
        status,
        updatedAt: new Date(),
      })
      setSuccess('Appointment status updated!')
      await loadAppointments()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const saveNotes = async (appointmentId: string) => {
    if (!db) return

    try {
      const appointmentRef = doc(db, 'appointments', appointmentId)
      await updateDoc(appointmentRef, {
        businessNotes: notesText,
        updatedAt: new Date(),
      })
      setSuccess('Notes saved!')
      setEditingNotes(null)
      setNotesText('')
      await loadAppointments()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const cancelAppointment = async (appointmentId: string) => {
    if (!db) return
    if (!confirm('Are you sure you want to cancel this appointment?')) return

    try {
      const appointmentRef = doc(db, 'appointments', appointmentId)
      await updateDoc(appointmentRef, {
        status: 'cancelled' as AppointmentStatus,
        updatedAt: new Date(),
      })
      setSuccess('Appointment cancelled')
      await loadAppointments()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const startEditingNotes = (appointment: Appointment) => {
    setEditingNotes(appointment.id)
    setNotesText(appointment.businessNotes || '')
  }

  const filteredAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.scheduledDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (filter === 'upcoming') {
      return aptDate >= today && apt.status !== 'completed' && apt.status !== 'cancelled'
    } else if (filter === 'past') {
      return aptDate < today || apt.status === 'completed' || apt.status === 'cancelled'
    }
    return true
  })

  const upcomingCount = appointments.filter((apt) => {
    const aptDate = new Date(apt.scheduledDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return aptDate >= today && apt.status !== 'completed' && apt.status !== 'cancelled'
  }).length

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading appointments...</p>
      </div>
    )
  }

  return (
    <div className="business-dashboard">
      <div className="business-dashboard-header">
        <h1>Appointments</h1>
        <div className="appointments-count">
          {upcomingCount} upcoming
        </div>
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
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</span>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>No appointments</h3>
          <p style={{ margin: 0, color: '#6b7280' }}>
            {filter === 'upcoming'
              ? 'No upcoming appointments scheduled'
              : filter === 'past'
              ? 'No past appointments'
              : 'No appointments yet'}
          </p>
        </div>
      ) : (
        <div className="appointments-list">
          {filteredAppointments.map((appointment) => (
            <div key={appointment.id} className={`appointment-card status-${appointment.status}`}>
              <div className="appointment-header">
                <div className="appointment-service">
                  <h3>{appointment.serviceName}</h3>
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
                <div className="detail-row">
                  <span className="detail-icon">👤</span>
                  <span className="detail-label">Customer:</span>
                  <span className="detail-value">{appointment.customerName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-icon">📧</span>
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{appointment.customerEmail}</span>
                </div>
                {appointment.customerPhone && (
                  <div className="detail-row">
                    <span className="detail-icon">📱</span>
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{appointment.customerPhone}</span>
                  </div>
                )}
              </div>

              {appointment.notes && (
                <div className="customer-notes">
                  <strong>Customer Notes:</strong>
                  <p>{appointment.notes}</p>
                </div>
              )}

              <div className="business-notes">
                {editingNotes === appointment.id ? (
                  <div className="notes-editor">
                    <textarea
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder="Add business notes (private)..."
                      rows={3}
                    />
                    <div className="notes-actions">
                      <button
                        className="btn-primary"
                        onClick={() => saveNotes(appointment.id)}
                      >
                        Save Notes
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setEditingNotes(null)
                          setNotesText('')
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {appointment.businessNotes ? (
                      <div className="notes-display">
                        <strong>Business Notes:</strong>
                        <p>{appointment.businessNotes}</p>
                        <button
                          className="btn-edit-notes"
                          onClick={() => startEditingNotes(appointment)}
                        >
                          Edit Notes
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn-add-notes"
                        onClick={() => startEditingNotes(appointment)}
                      >
                        + Add Business Notes
                      </button>
                    )}
                  </>
                )}
              </div>

              {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                <div className="appointment-actions">
                  {appointment.status === 'pending' && (
                    <button
                      className="btn-confirm"
                      onClick={() => updateStatus(appointment.id, 'confirmed')}
                    >
                      Confirm
                    </button>
                  )}
                  {appointment.status === 'confirmed' && (
                    <button
                      className="btn-complete"
                      onClick={() => updateStatus(appointment.id, 'completed')}
                    >
                      Mark Complete
                    </button>
                  )}
                  <button
                    className="btn-cancel"
                    onClick={() => cancelAppointment(appointment.id)}
                  >
                    Cancel
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
