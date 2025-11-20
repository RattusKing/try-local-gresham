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

  // Pre-fill user info if authenticated
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: user?.displayName || '',
    email: user?.email || '',
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

    // Require authentication
    if (!user) {
      setError('Please sign in to submit a business application')
      return
    }

    setSubmitting(true)

    if (!db) {
      setError('Database not available')
      setSubmitting(false)
      return
    }

    try {
      // Create business application with user link
      const applicationData = {
        ...formData,
        userId: user.uid,
        userEmail: user.email,
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

  // Show authentication required message
  if (!user) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content application-modal auth-required-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Authentication Required</h2>
            <button className="modal-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
          <div className="modal-body">
            <div className="auth-required-content">
              <div className="auth-icon">🔐</div>
              <h3>Sign In Required</h3>
              <p>
                To apply for a business account, you need to be signed in. This ensures your business
                is securely linked to your account and you can manage it effectively.
              </p>
              <div className="auth-benefits">
                <h4>Why sign in?</h4>
                <ul>
                  <li>Secure account linking</li>
                  <li>Easy application tracking</li>
                  <li>Instant dashboard access upon approval</li>
                  <li>Manage your business profile and products</li>
                </ul>
              </div>
              <p className="auth-note">
                Please close this dialog and sign in to continue with your business application.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content application-modal success-modal" onClick={(e) => e.stopPropagation()}>
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>Application Submitted Successfully!</h2>
            <p className="success-lead">Thank you for your interest in joining Try Local Gresham.</p>
            <div className="success-details">
              <h3>What happens next?</h3>
              <ol>
                <li>Our team will review your application within 1-2 business days</li>
                <li>You'll receive an email notification about your application status</li>
                <li>Once approved, you'll gain immediate access to your business dashboard</li>
              </ol>
            </div>
            <p className="success-note">
              Questions? Feel free to reach out at <strong>support@try-local.com</strong>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content application-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-content">
            <h2>Join Try Local Gresham</h2>
            <p className="header-subtitle">Grow your business with Gresham's premier local marketplace</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="application-intro">
            <p className="intro-lead">
              Connect with local customers and showcase your business to the Gresham community.
            </p>
            <div className="intro-benefits">
              <div className="benefit">
                <span className="benefit-icon">📈</span>
                <span>Increase Visibility</span>
              </div>
              <div className="benefit">
                <span className="benefit-icon">💳</span>
                <span>Accept Online Orders</span>
              </div>
              <div className="benefit">
                <span className="benefit-icon">🎯</span>
                <span>Targeted Marketing</span>
              </div>
            </div>
          </div>

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

            <div className="pricing-section">
              <h3>Transparent Pricing</h3>
              <div className="pricing-cards">
                <div className="pricing-card featured">
                  <div className="pricing-badge">Most Popular</div>
                  <h4>Standard Plan</h4>
                  <div className="pricing-amount">
                    <span className="currency">$</span>
                    <span className="price">39</span>
                    <span className="period">/month</span>
                  </div>
                  <ul className="pricing-features">
                    <li>✓ Unlimited product listings</li>
                    <li>✓ Online ordering system</li>
                    <li>✓ Business analytics dashboard</li>
                    <li>✓ Customer reviews & ratings</li>
                    <li>✓ Featured in local directory</li>
                  </ul>
                  <div className="pricing-fee">
                    <strong>Transaction Fee:</strong> 2% per sale
                  </div>
                </div>
              </div>
              <div className="pricing-promo">
                <span className="promo-badge">🎉 Special Offer</span>
                <p>First month free for early adopters! No credit card required to apply.</p>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-large submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner"></span>
                  Submitting Application...
                </>
              ) : (
                'Submit Application'
              )}
            </button>

            <p className="form-footer-note">
              By submitting, you agree to our Terms of Service and understand that your application
              will be reviewed within 1-2 business days.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
