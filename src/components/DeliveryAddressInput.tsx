'use client'

import { useState, useEffect } from 'react'
import { getDeliveryInfo, isDeliveryAvailable } from '@/lib/delivery'

interface DeliveryAddressInputProps {
  value: string
  onChange: (value: string) => void
  onDeliveryFeeChange?: (fee: number) => void
}

export default function DeliveryAddressInput({
  value,
  onChange,
  onDeliveryFeeChange,
}: DeliveryAddressInputProps) {
  const [zipCode, setZipCode] = useState('')
  const [deliveryInfo, setDeliveryInfo] = useState<{
    available: boolean
    fee: number
    estimatedMinutes: number
  } | null>(null)

  // Extract ZIP code from address
  useEffect(() => {
    const zipMatch = value.match(/\b\d{5}\b/)
    if (zipMatch) {
      const extractedZip = zipMatch[0]
      setZipCode(extractedZip)

      const info = getDeliveryInfo(extractedZip)
      setDeliveryInfo(info)

      if (onDeliveryFeeChange) {
        onDeliveryFeeChange(info.available ? info.fee : 0)
      }
    } else {
      setDeliveryInfo(null)
      if (onDeliveryFeeChange) {
        onDeliveryFeeChange(0)
      }
    }
  }, [value, onDeliveryFeeChange])

  return (
    <div>
      <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
        Delivery Address *
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="123 Main St, Gresham, OR 97030"
        rows={3}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #e5e5e5',
          fontSize: '14px',
          fontFamily: 'inherit',
          resize: 'vertical',
        }}
        required
      />

      {zipCode && deliveryInfo && (
        <div
          style={{
            marginTop: '8px',
            padding: '12px',
            borderRadius: '8px',
            background: deliveryInfo.available ? '#e6f9f0' : '#fef2f2',
            border: `1px solid ${deliveryInfo.available ? '#99edc3' : '#fca5a5'}`,
          }}
        >
          {deliveryInfo.available ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>✓</span>
                <span style={{ fontWeight: '600', color: '#2d7a5b' }}>
                  Delivery available to {zipCode}
                </span>
              </div>
              <div style={{ marginTop: '4px', fontSize: '14px', color: '#6b7280' }}>
                <p style={{ margin: '4px 0' }}>
                  Delivery fee: <strong>${deliveryInfo.fee.toFixed(2)}</strong>
                </p>
                <p style={{ margin: '4px 0' }}>
                  Estimated delivery: <strong>{deliveryInfo.estimatedMinutes} minutes</strong>
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>✗</span>
                <span style={{ fontWeight: '600', color: '#991b1b' }}>
                  Delivery not available to {zipCode}
                </span>
              </div>
              <p style={{ margin: '4px 0', fontSize: '14px', color: '#6b7280' }}>
                We currently only deliver within the Gresham area (ZIP codes: 97030, 97080, 97230,
                97233, 97236). Please choose pickup instead.
              </p>
            </div>
          )}
        </div>
      )}

      {!zipCode && value.length > 10 && (
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#6b7280' }}>
          Please include a ZIP code in your address (e.g., 97030)
        </p>
      )}
    </div>
  )
}
