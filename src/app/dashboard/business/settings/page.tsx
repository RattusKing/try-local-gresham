'use client'

import { useAuth } from '@/lib/firebase/auth-context'
import { db } from '@/lib/firebase/config'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { BusinessAvailability, DayOfWeek, TimeSlot } from '@/lib/types'
import './settings.css'

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const DEFAULT_DAY_AVAILABILITY = {
  isOpen: false,
  slots: [{ start: '09:00', end: '17:00' }]
}

export default function BusinessSettings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [availabilityId, setAvailabilityId] = useState<string | null>(null)

  const [availability, setAvailability] = useState<Omit<BusinessAvailability, 'id' | 'createdAt' | 'updatedAt'>>({
    businessId: user?.uid || '',
    monday: DEFAULT_DAY_AVAILABILITY,
    tuesday: DEFAULT_DAY_AVAILABILITY,
    wednesday: DEFAULT_DAY_AVAILABILITY,
    thursday: DEFAULT_DAY_AVAILABILITY,
    friday: DEFAULT_DAY_AVAILABILITY,
    saturday: DEFAULT_DAY_AVAILABILITY,
    sunday: DEFAULT_DAY_AVAILABILITY,
    timezone: 'America/Los_Angeles',
    advanceBookingDays: 30,
    minAdvanceHours: 2,
  })

  useEffect(() => {
    loadAvailability()
  }, [user])

  const loadAvailability = async () => {
    if (!user || !db) return

    try {
      setLoading(true)
      const availabilityQuery = query(
        collection(db, 'businessAvailability'),
        where('businessId', '==', user.uid)
      )
      const availabilitySnap = await getDocs(availabilityQuery)

      if (!availabilitySnap.empty) {
        const doc = availabilitySnap.docs[0]
        setAvailabilityId(doc.id)
        setAvailability(doc.data() as Omit<BusinessAvailability, 'id' | 'createdAt' | 'updatedAt'>)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user || !db) return

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const availabilityData = {
        ...availability,
        businessId: user.uid,
        updatedAt: new Date(),
      }

      if (availabilityId) {
        // Update existing
        const availabilityRef = doc(db, 'businessAvailability', availabilityId)
        await updateDoc(availabilityRef, availabilityData)
        setSuccess('Availability updated successfully!')
      } else {
        // Create new
        const docRef = await addDoc(collection(db, 'businessAvailability'), {
          ...availabilityData,
          createdAt: new Date(),
        })
        setAvailabilityId(docRef.id)
        setSuccess('Availability saved successfully!')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleDay = (day: DayOfWeek) => {
    setAvailability({
      ...availability,
      [day]: {
        ...availability[day],
        isOpen: !availability[day].isOpen,
      },
    })
  }

  const updateTimeSlot = (day: DayOfWeek, index: number, field: 'start' | 'end', value: string) => {
    const newSlots = [...availability[day].slots]
    newSlots[index] = { ...newSlots[index], [field]: value }
    setAvailability({
      ...availability,
      [day]: {
        ...availability[day],
        slots: newSlots,
      },
    })
  }

  const addTimeSlot = (day: DayOfWeek) => {
    setAvailability({
      ...availability,
      [day]: {
        ...availability[day],
        slots: [...availability[day].slots, { start: '09:00', end: '17:00' }],
      },
    })
  }

  const removeTimeSlot = (day: DayOfWeek, index: number) => {
    if (availability[day].slots.length === 1) return // Must have at least one slot
    const newSlots = availability[day].slots.filter((_, i) => i !== index)
    setAvailability({
      ...availability,
      [day]: {
        ...availability[day],
        slots: newSlots,
      },
    })
  }

  const copyToAllDays = (day: DayOfWeek) => {
    const dayAvailability = availability[day]
    const updates: any = {}
    DAYS.forEach(d => {
      updates[d] = { ...dayAvailability }
    })
    setAvailability({
      ...availability,
      ...updates,
    })
    setSuccess('Copied to all days!')
    setTimeout(() => setSuccess(''), 2000)
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="business-dashboard">
      <div className="business-dashboard-header">
        <h1>Business Settings</h1>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="settings-container">
        <div className="settings-section">
          <h2>Appointment Availability</h2>
          <p className="settings-description">
            Set your weekly hours for appointment bookings. Customers will only be able to book during these times.
          </p>

          <div className="availability-grid">
            {DAYS.map((day) => (
              <div key={day} className="day-availability">
                <div className="day-header">
                  <label className="day-toggle">
                    <input
                      type="checkbox"
                      checked={availability[day].isOpen}
                      onChange={() => toggleDay(day)}
                    />
                    <span className="day-name">
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </span>
                  </label>
                  {availability[day].isOpen && (
                    <button
                      className="btn-copy"
                      onClick={() => copyToAllDays(day)}
                      title="Copy this schedule to all days"
                    >
                      Copy to all
                    </button>
                  )}
                </div>

                {availability[day].isOpen && (
                  <div className="time-slots">
                    {availability[day].slots.map((slot, index) => (
                      <div key={index} className="time-slot">
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(e) =>
                            updateTimeSlot(day, index, 'start', e.target.value)
                          }
                        />
                        <span>to</span>
                        <input
                          type="time"
                          value={slot.end}
                          onChange={(e) =>
                            updateTimeSlot(day, index, 'end', e.target.value)
                          }
                        />
                        {availability[day].slots.length > 1 && (
                          <button
                            className="btn-remove-slot"
                            onClick={() => removeTimeSlot(day, index)}
                            title="Remove time slot"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      className="btn-add-slot"
                      onClick={() => addTimeSlot(day)}
                    >
                      + Add time slot
                    </button>
                    <small className="slot-help">
                      Multiple time slots allow for breaks (e.g., lunch)
                    </small>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h2>Booking Rules</h2>
          <p className="settings-description">
            Configure how far in advance customers can book appointments.
          </p>

          <div className="booking-rules">
            <div className="form-group">
              <label htmlFor="advanceBookingDays">
                Maximum advance booking (days)
              </label>
              <input
                type="number"
                id="advanceBookingDays"
                min="1"
                max="365"
                value={availability.advanceBookingDays}
                onChange={(e) =>
                  setAvailability({
                    ...availability,
                    advanceBookingDays: parseInt(e.target.value),
                  })
                }
              />
              <small>How far in advance customers can book (e.g., 30 days)</small>
            </div>

            <div className="form-group">
              <label htmlFor="minAdvanceHours">
                Minimum advance notice (hours)
              </label>
              <input
                type="number"
                id="minAdvanceHours"
                min="0"
                max="72"
                value={availability.minAdvanceHours}
                onChange={(e) =>
                  setAvailability({
                    ...availability,
                    minAdvanceHours: parseInt(e.target.value),
                  })
                }
              />
              <small>Minimum hours required before appointment (e.g., 2 hours)</small>
            </div>

            <div className="form-group">
              <label htmlFor="timezone">Timezone</label>
              <select
                id="timezone"
                value={availability.timezone}
                onChange={(e) =>
                  setAvailability({
                    ...availability,
                    timezone: e.target.value,
                  })
                }
              >
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Anchorage">Alaska Time (AKT)</option>
                <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
              </select>
              <small>Your business timezone for appointment scheduling</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
