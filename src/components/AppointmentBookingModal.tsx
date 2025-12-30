'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase/auth-context'
import { db } from '@/lib/firebase/config'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
} from 'firebase/firestore'
import { Service, BusinessAvailability, Appointment, Business, DayOfWeek } from '@/lib/types'
import { getAvailableTimeSlots, formatTime, getNextDays } from '@/lib/appointments'
import './AppointmentBookingModal.css'

interface AppointmentBookingModalProps {
  businessId: string
  onClose: () => void
  onSuccess?: () => void
}

export default function AppointmentBookingModal({
  businessId,
  onClose,
  onSuccess,
}: AppointmentBookingModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')

  const [business, setBusiness] = useState<Business | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [availability, setAvailability] = useState<BusinessAvailability | null>(null)
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([])

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [businessId])

  useEffect(() => {
    if (selectedService && selectedDate && availability) {
      const slots = getAvailableTimeSlots(
        selectedDate,
        selectedService,
        availability,
        existingAppointments
      )
      setAvailableSlots(slots)
      setSelectedTime('') // Reset time selection when date changes
    }
  }, [selectedService, selectedDate, availability, existingAppointments])

  const loadData = async () => {
    if (!db) return

    try {
      setLoading(true)

      // Load business
      const businessDoc = await getDoc(doc(db, 'businesses', businessId))
      if (businessDoc.exists()) {
        setBusiness({ id: businessDoc.id, ...businessDoc.data() } as Business)
      }

      // Load services
      const servicesQuery = query(
        collection(db, 'services'),
        where('businessId', '==', businessId),
        where('isActive', '==', true)
      )
      const servicesSnap = await getDocs(servicesQuery)
      const servicesList = servicesSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Service[]
      setServices(servicesList)

      // Load availability
      const availabilityQuery = query(
        collection(db, 'businessAvailability'),
        where('businessId', '==', businessId)
      )
      const availabilitySnap = await getDocs(availabilityQuery)
      if (!availabilitySnap.empty) {
        const loadedAvailability = availabilitySnap.docs[0].data() as BusinessAvailability
        // Ensure acceptingAppointments field exists (for backwards compatibility)
        setAvailability({
          ...loadedAvailability,
          acceptingAppointments: loadedAvailability.acceptingAppointments ?? false,
        })
      }

      // Load existing appointments
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('businessId', '==', businessId)
      )
      const appointmentsSnap = await getDocs(appointmentsQuery)
      const appointmentsList = appointmentsSnap.docs.map((doc) => doc.data()) as Appointment[]
      setExistingAppointments(appointmentsList)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBooking = async () => {
    if (!user || !selectedService || !selectedDate || !selectedTime || !db || !business) return

    try {
      setBooking(true)
      setError('')

      const appointmentData = {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        businessId: business.id,
        businessName: business.name,
        customerId: user.uid,
        customerName: user.displayName || user.email || 'Customer',
        customerEmail: user.email || '',
        customerPhone: '',
        scheduledDate: selectedDate.toISOString().split('T')[0],
        scheduledTime: selectedTime,
        duration: selectedService.duration,
        price: selectedService.price,
        status: 'pending' as const,
        notes: notes || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await addDoc(collection(db, 'appointments'), appointmentData)

      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content booking-modal" onClick={(e) => e.stopPropagation()}>
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading booking options...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!availability || !availability.acceptingAppointments) {
    const isOwner = business && user?.uid === business.ownerId
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content booking-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Book Appointment</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            {isOwner ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>
                  ⚙️ Appointments Not Enabled
                </p>
                <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
                  {!availability
                    ? 'You need to configure your appointment availability and turn on appointment bookings.'
                    : 'You have availability configured, but appointment bookings are turned OFF. Go to Settings to turn them ON.'}
                </p>
                <a
                  href="/dashboard/business/settings"
                  className="btn btn-primary"
                  style={{ display: 'inline-block', textDecoration: 'none' }}
                >
                  Go to Settings
                </a>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ marginBottom: '1rem', fontSize: '1.125rem', color: 'var(--muted)' }}>
                  📅 Appointments Coming Soon
                </p>
                <p style={{ color: 'var(--muted)' }}>
                  This business hasn't enabled appointment bookings yet. Please check back later or contact them directly.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const nextDays = getNextDays(availability.advanceBookingDays)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content booking-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Book Appointment</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}

          {/* Step 1: Select Service */}
          <div className="booking-step">
            <h3>1. Select Service</h3>
            {services.length === 0 ? (
              <p>No services available for booking.</p>
            ) : (
              <div className="services-list">
                {services.map((service) => (
                  <button
                    key={service.id}
                    className={`service-option ${selectedService?.id === service.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedService(service)
                      setSelectedDate(null)
                      setSelectedTime('')
                    }}
                  >
                    <div className="service-info">
                      <span className="service-name">{service.name}</span>
                      <span className="service-duration">{service.duration} min</span>
                    </div>
                    <span className="service-price">${service.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Select Date */}
          {selectedService && (
            <div className="booking-step">
              <h3>2. Select Date</h3>
              <div className="dates-list">
                {nextDays.slice(0, 14).map((date) => {
                  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()] as DayOfWeek
                  const isAvailable = availability[dayOfWeek]?.isOpen

                  return (
                    <button
                      key={date.toISOString()}
                      className={`date-option ${selectedDate?.toDateString() === date.toDateString() ? 'selected' : ''} ${!isAvailable ? 'unavailable' : ''}`}
                      onClick={() => isAvailable && setSelectedDate(date)}
                      disabled={!isAvailable}
                    >
                      <span className="date-day">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      <span className="date-number">{date.getDate()}</span>
                      <span className="date-month">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3: Select Time */}
          {selectedService && selectedDate && (
            <div className="booking-step">
              <h3>3. Select Time</h3>
              {availableSlots.length === 0 ? (
                <p className="no-slots">No available time slots for this date. Please try another date.</p>
              ) : (
                <div className="times-list">
                  {availableSlots.map((time) => (
                    <button
                      key={time}
                      className={`time-option ${selectedTime === time ? 'selected' : ''}`}
                      onClick={() => setSelectedTime(time)}
                    >
                      {formatTime(time)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Add Notes (Optional) */}
          {selectedService && selectedDate && selectedTime && (
            <div className="booking-step">
              <h3>4. Add Notes (Optional)</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests or information for the business..."
                rows={3}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          {selectedService && selectedDate && selectedTime && (
            <div className="booking-summary">
              <div className="summary-item">
                <strong>{selectedService.name}</strong>
              </div>
              <div className="summary-item">
                {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {formatTime(selectedTime)}
              </div>
              <div className="summary-item price">
                ${selectedService.price.toFixed(2)}
              </div>
            </div>
          )}
          <div className="footer-actions">
            <button
              className="btn-primary"
              onClick={handleBooking}
              disabled={!selectedService || !selectedDate || !selectedTime || booking}
            >
              {booking ? 'Booking...' : 'Confirm Booking'}
            </button>
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
