'use client'

import { useState } from 'react'
import { db } from '@/lib/firebase/config'
import { collection, addDoc } from 'firebase/firestore'
import { useAuth } from '@/lib/firebase/auth-context'
import './BusinessApplicationModal.css'

interface BusinessApplicationModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function BusinessApplicationModal({ isOpen, onClose }: BusinessApplicationModalProps) {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    neighborhood: '',
    category: '',
    description: '',
    website: '',
    instagram: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    if (!db) {
      setError('Database not available')
      setSubmitting(false)
      return
    }

    try {
      // Create business application
      const applicationData = {
        ...formData,
        userId: user?.uid || null,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await addDoc(collection(db, 'business_applications'), applicationData)

      // Send application received email
      if (formData.email) {
        fetch('/api/emails/business-application', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessEmail: formData.email,
            businessName: formData.businessName,
            ownerName: formData.ownerName,
          }),
        }).catch((err) => console.error('Email error:', err))
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
        setFormData({
          businessName: '',
          ownerName: '',
          email: '',
          phone: '',
          address: '',
          neighborhood: '',
          category: '',
          description: '',
          website: '',
          instagram: '',
        })
      }, 3000)
    } catch (err: any) {
      console.error('Error submitting application:', err)
      setError(err.message || 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  if (success) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content application-modal" onClick={(e) => e.stopPropagation()}>
          <div className="success-message">
            <h2>✓ Application Submitted!</h2>
            <p>Thank you for your interest in joining Try Local Gresham.</p>
            <p>We'll review your application and get back to you within 1-2 business days.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content application-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Apply to Join Try Local Gresham</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}

          <p className="application-intro">
            Join Gresham's premier local marketplace and connect with customers in your community.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="businessName">Business Name *</label>
              <input
                type="text"
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="ownerName">Owner/Contact Name *</label>
              <input
                type="text"
                id="ownerName"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">Business Address *</label>
              <input
                type="text"
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, Gresham, OR 97030"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="neighborhood">Neighborhood *</label>
                <select
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  required
                >
                  <option value="">Select neighborhood</option>
                  <option value="Downtown">Downtown</option>
                  <option value="Rockwood">Rockwood</option>
                  <option value="Powell Valley">Powell Valley</option>
                  <option value="Centennial">Centennial</option>
                  <option value="Pleasant Valley">Pleasant Valley</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="category">Business Category *</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  <option value="Food & Beverage">Food & Beverage</option>
                  <option value="Retail">Retail</option>
                  <option value="Services">Services</option>
                  <option value="Health & Wellness">Health & Wellness</option>
                  <option value="Arts & Entertainment">Arts & Entertainment</option>
                  <option value="Home & Garden">Home & Garden</option>
                  <option value="Professional Services">Professional Services</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Business Description *</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Tell us about your business, what you offer, and what makes you unique..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="website">Website (optional)</label>
              <input
                type="url"
                id="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://yourbusiness.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="instagram">Instagram Handle (optional)</label>
              <input
                type="text"
                id="instagram"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="@yourbusiness"
              />
            </div>

            <div className="pricing-info">
              <h3>Pricing</h3>
              <p><strong>Monthly Subscription:</strong> $39/month</p>
              <p><strong>Transaction Fee:</strong> 2% per sale</p>
              <p className="pricing-note">
                Special offer: First month free for early adopters!
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
