'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/firebase/auth-context'
import { db } from '@/lib/firebase/config'
import { addDoc, collection, Timestamp } from 'firebase/firestore'
import { trackEvent } from '@/lib/analytics'
import './QuoteRequestForm.css'

interface QuoteRequestFormProps {
  businessId: string
  businessName: string
  onClose: () => void
  onSuccess?: () => void
}

export default function QuoteRequestForm({
  businessId,
  businessName,
  onClose,
  onSuccess,
}: QuoteRequestFormProps) {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    serviceType: '',
    description: '',
    preferredContact: 'email' as 'email' | 'phone',
    urgency: 'standard' as 'urgent' | 'standard' | 'flexible',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return

    try {
      setSubmitting(true)
      setError('')

      const quoteRequest = {
        businessId,
        businessName,
        customerId: user?.uid || null,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        serviceType: formData.serviceType,
        description: formData.description,
        preferredContact: formData.preferredContact,
        urgency: formData.urgency,
        status: 'pending' as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      await addDoc(collection(db, 'quoteRequests'), quoteRequest)

      // Track in analytics
      trackEvent(businessId, 'contact_form', {
        userId: user?.uid,
        serviceName: formData.serviceType,
      })

      // Send email + push notification to business owner (fire and forget)
      fetch('/api/notify/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          businessName,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          serviceType: formData.serviceType,
          description: formData.description,
          urgency: formData.urgency,
          preferredContact: formData.preferredContact,
        }),
      }).catch(() => {
        // Notification failures shouldn't block the user
      })

      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to submit quote request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="quote-overlay" onClick={onClose}>
      <div className="quote-modal" onClick={(e) => e.stopPropagation()}>
        <div className="quote-modal-header">
          <h2>Request a Quote</h2>
          <button className="quote-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="quote-business-name">
          From: <strong>{businessName}</strong>
        </div>

        <form onSubmit={handleSubmit} className="quote-form">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Your Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Smith"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(503) 555-1234"
              />
            </div>

            <div className="form-group">
              <label htmlFor="preferredContact">Preferred Contact Method</label>
              <select
                id="preferredContact"
                value={formData.preferredContact}
                onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value as 'email' | 'phone' })}
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="serviceType">What service do you need? *</label>
            <input
              type="text"
              id="serviceType"
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
              placeholder="e.g., HVAC repair, New siding estimate, Car purchase inquiry"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Tell us more about your project *</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Please describe what you need, including any relevant details like timeline, budget considerations, specific requirements, etc."
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label>How urgent is this request?</label>
            <div className="urgency-options">
              <label className={`urgency-option ${formData.urgency === 'urgent' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="urgency"
                  value="urgent"
                  checked={formData.urgency === 'urgent'}
                  onChange={(e) => setFormData({ ...formData, urgency: 'urgent' })}
                />
                <span className="urgency-icon">🔴</span>
                <span className="urgency-label">Urgent</span>
                <span className="urgency-desc">Need help ASAP</span>
              </label>

              <label className={`urgency-option ${formData.urgency === 'standard' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="urgency"
                  value="standard"
                  checked={formData.urgency === 'standard'}
                  onChange={(e) => setFormData({ ...formData, urgency: 'standard' })}
                />
                <span className="urgency-icon">🟡</span>
                <span className="urgency-label">Standard</span>
                <span className="urgency-desc">Within a week</span>
              </label>

              <label className={`urgency-option ${formData.urgency === 'flexible' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="urgency"
                  value="flexible"
                  checked={formData.urgency === 'flexible'}
                  onChange={(e) => setFormData({ ...formData, urgency: 'flexible' })}
                />
                <span className="urgency-icon">🟢</span>
                <span className="urgency-label">Flexible</span>
                <span className="urgency-desc">No rush</span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Quote Request'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
