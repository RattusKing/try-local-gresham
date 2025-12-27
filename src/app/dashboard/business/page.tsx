'use client'

import { useAuth } from '@/lib/firebase/auth-context'
import { db, storage } from '@/lib/firebase/config'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { Business } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import SubscriptionManager from '@/components/SubscriptionManager'
import './business.css'

export default function BusinessDashboard() {
  const { user } = useAuth()
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    tags: '',
    neighborhood: '',
    hours: '',
    phone: '',
    website: '',
    map: '',
    description: '',
  })

  const loadBusiness = useCallback(async () => {
    if (!user || !db) return

    try {
      setLoading(true)
      const businessRef = doc(db, 'businesses', user.uid)
      const businessSnap = await getDoc(businessRef)

      if (businessSnap.exists()) {
        const data = businessSnap.data() as Business
        setBusiness({ ...data, id: businessSnap.id })
        setFormData({
          name: data.name || '',
          tags: (data.tags || []).join(', '),
          neighborhood: data.neighborhood || '',
          hours: data.hours || '',
          phone: data.phone || '',
          website: data.website || '',
          map: data.map || '',
          description: data.description || '',
        })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, db])

  useEffect(() => {
    loadBusiness()
  }, [loadBusiness])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db) return

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const businessData = {
        name: formData.name,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        neighborhood: formData.neighborhood,
        hours: formData.hours,
        phone: formData.phone,
        website: formData.website,
        map: formData.map,
        description: formData.description,
        ownerId: user.uid,
        updatedAt: new Date(),
      }

      const businessRef = doc(db, 'businesses', user.uid)

      // IMPORTANT: Check if document actually exists in database
      // Don't rely on state variable which might be stale
      const existingDoc = await getDoc(businessRef)

      if (existingDoc.exists()) {
        // Document exists - UPDATE ONLY (preserves status and prevents duplicates)
        // This ensures approved businesses stay approved
        await updateDoc(businessRef, businessData)

        const currentStatus = existingDoc.data().status
        if (currentStatus === 'approved') {
          setSuccess('Profile updated! Your changes are live immediately.')
        } else {
          setSuccess('Profile updated successfully!')
        }

        console.log('Updated existing business:', user.uid, 'Status:', currentStatus)
      } else {
        // Document doesn't exist - CREATE NEW (requires approval)
        // This only happens for brand new businesses
        await setDoc(businessRef, {
          ...businessData,
          status: 'pending',
          createdAt: new Date(),
          cover: '/assets/placeholder.jpg',
        })
        setSuccess(
          'Business profile created! Waiting for admin approval.'
        )

        console.log('Created new business:', user.uid)
      }

      await loadBusiness()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user || !storage || !db)
      return

    const file = e.target.files[0]

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    try {
      setUploading(true)
      setError('')

      // Upload to Firebase Storage
      const storageRef = ref(storage, `businesses/${user.uid}/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      // Update Firestore document
      const businessRef = doc(db, 'businesses', user.uid)
      await updateDoc(businessRef, {
        cover: downloadURL,
        updatedAt: new Date(),
      })

      setSuccess('Image uploaded successfully!')
      await loadBusiness()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading business profile...</p>
      </div>
    )
  }

  return (
    <div className="business-dashboard">
      <div className="business-dashboard-header">
        <h1>My Business Profile</h1>
        {business && business.status && (
          <StatusBadge status={business.status} size="large" />
        )}
      </div>

      {business?.status === 'pending' && (
        <div className="alert alert-info">
          Your business is awaiting admin approval. You can still edit your
          profile, but it won't be visible to customers until approved.
        </div>
      )}

      {business?.status === 'rejected' && (
        <div className="alert alert-error">
          Your business application was rejected. Please contact support for
          more information.
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Stripe Payment Setup Section */}
      {business && business.status === 'approved' && (
        <>
          <div className="section-header">
            <h2>Payment Processing</h2>
            <p className="section-subtitle">Connect your Stripe account to accept online payments and appointments</p>
          </div>
          <div className="payment-setup-card">
          {business.stripeAccountStatus === 'verified' ? (
            <div className="payment-status-verified">
              <div className="payment-status-header">
                <svg className="icon-verified" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h3>Payment Processing Active</h3>
              </div>
              <p>Your Stripe account is connected and ready to receive payments!</p>
              <a href="/dashboard/business/stripe-onboarding" className="btn-secondary">
                Manage Payment Settings
              </a>
            </div>
          ) : business.stripeAccountStatus === 'pending' ? (
            <div className="payment-status-pending">
              <div className="payment-status-header">
                <svg className="icon-pending" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3>Payment Setup In Progress</h3>
              </div>
              <p>Complete your Stripe onboarding to start accepting payments.</p>
              <a href="/dashboard/business/stripe-onboarding" className="btn-primary">
                Continue Setup
              </a>
            </div>
          ) : business.stripeAccountStatus === 'restricted' ? (
            <div className="payment-status-restricted">
              <div className="payment-status-header">
                <svg className="icon-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3>Payment Account Needs Attention</h3>
              </div>
              <p>Your Stripe account requires additional information to process payments.</p>
              <a href="/dashboard/business/stripe-onboarding" className="btn-warning">
                Fix Account Issues
              </a>
            </div>
          ) : (
            <div className="payment-status-setup">
              <div className="payment-status-header">
                <svg className="icon-setup" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3>Set Up Payment Processing</h3>
              </div>
              <p>Connect your Stripe account to start accepting payments from customers. You'll receive 98% of each sale directly to your bank account.</p>
              <a href="/dashboard/business/stripe-onboarding" className="btn-primary">
                Set Up Payments
              </a>
            </div>
          )}
        </div>
        </>
      )}

      {/* Subscription Management Section */}
      {business && business.status === 'approved' && (
        <SubscriptionManager business={business} onSubscriptionUpdate={loadBusiness} />
      )}

      <div className="business-form-container">
        <form onSubmit={handleSubmit} className="business-form">
          <div className="form-section">
            <h2>Basic Information</h2>

            <div className="form-group">
              <label htmlFor="name">Business Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="tags">
                Categories (comma-separated) *
                <span className="form-hint">
                  e.g., Coffee, Breakfast, Bakery
                </span>
              </label>
              <input
                type="text"
                id="tags"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="Coffee, Breakfast, Bakery"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="neighborhood">Neighborhood *</label>
              <select
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) =>
                  setFormData({ ...formData, neighborhood: e.target.value })
                }
                required
              >
                <option value="">Select neighborhood</option>
                <option value="Downtown">Downtown</option>
                <option value="Rockwood">Rockwood</option>
                <option value="Powell Valley">Powell Valley</option>
                <option value="Central">Central</option>
                <option value="North Gresham">North Gresham</option>
                <option value="Southeast">Southeast</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                placeholder="Tell customers about your business..."
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Contact Information</h2>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="(503) 555-1234"
              />
            </div>

            <div className="form-group">
              <label htmlFor="website">Website</label>
              <input
                type="url"
                id="website"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                placeholder="https://yourbusiness.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="hours">Business Hours</label>
              <input
                type="text"
                id="hours"
                value={formData.hours}
                onChange={(e) =>
                  setFormData({ ...formData, hours: e.target.value })
                }
                placeholder="Mon-Fri: 9AM-5PM"
              />
            </div>

            <div className="form-group">
              <label htmlFor="map">
                Google Maps Link
                <span className="form-hint">
                  Go to Google Maps, find your business, click Share, copy link
                </span>
              </label>
              <input
                type="url"
                id="map"
                value={formData.map}
                onChange={(e) =>
                  setFormData({ ...formData, map: e.target.value })
                }
                placeholder="https://maps.google.com/..."
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Business Image</h2>
            {business?.cover && (
              <div className="current-image" style={{ position: 'relative', width: '100%', maxWidth: '600px', height: '300px' }}>
                <Image
                  src={business.cover}
                  alt={business.name}
                  fill
                  style={{ objectFit: 'cover', borderRadius: '8px' }}
                  sizes="(max-width: 768px) 100vw, 600px"
                />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="cover">Upload Cover Image</label>
              <input
                type="file"
                id="cover"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              {uploading && <p className="upload-status">Uploading...</p>}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : business ? 'Update Profile' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
