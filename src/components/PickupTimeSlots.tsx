'use client'

import { useState, useEffect } from 'react'
import { BusinessHours, getPickupTimeSlots } from '@/lib/delivery'

interface PickupTimeSlotsProps {
  businessHours: BusinessHours
  onSelectSlot: (slot: { date: string; time: string }) => void
  selectedSlot?: { date: string; time: string }
}

export default function PickupTimeSlots({
  businessHours,
  onSelectSlot,
  selectedSlot,
}: PickupTimeSlotsProps) {
  const [slots, setSlots] = useState<{ date: string; time: string; label: string }[]>([])

  useEffect(() => {
    const availableSlots = getPickupTimeSlots(businessHours)
    setSlots(availableSlots)
  }, [businessHours])

  if (slots.length === 0) {
    return (
      <div
        style={{
          padding: '20px',
          background: '#fef2f2',
          borderRadius: '8px',
          color: '#991b1b',
        }}
      >
        <p style={{ margin: 0 }}>
          No pickup slots available. The business may be closed or not accepting orders at this
          time.
        </p>
      </div>
    )
  }

  return (
    <div>
      <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
        Select Pickup Time *
      </label>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '8px',
        }}
      >
        {slots.map((slot) => {
          const isSelected =
            selectedSlot?.date === slot.date && selectedSlot?.time === slot.time

          return (
            <button
              key={`${slot.date}-${slot.time}`}
              type="button"
              onClick={() => onSelectSlot({ date: slot.date, time: slot.time })}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: isSelected ? '2px solid #c2aff0' : '2px solid #e5e5e5',
                background: isSelected ? '#f3ecfd' : 'white',
                color: isSelected ? '#6d4d9e' : '#373737',
                cursor: 'pointer',
                fontWeight: isSelected ? '700' : '600',
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#c2aff0'
                }
              }}
              onMouseOut={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#e5e5e5'
                }
              }}
            >
              {slot.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
