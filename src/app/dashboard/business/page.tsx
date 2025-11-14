'use client'

import { useAuth } from '@/lib/firebase/auth-context'
import { db, storage } from '@/lib/firebase/config'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useEffect, useState } from 'react'
import { Business } from '@/lib/types'
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
    subscriptionTier: 'free' as 'free' | 'standard' | 'premium',
  })

  useEffect(() => {
    loadBusiness()
  }, [user])

  const loadBusiness = async () => {
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
          subscriptionTier: data.subscriptionTier || 'free',
        })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
        subscriptionTier: formData.subscriptionTier,
        ownerId: user.uid,
        updatedAt: new Date(),
      }

      const businessRef = doc(db, 'businesses', user.uid)

      if (business) {
        await updateDoc(businessRef, businessData)
        setSuccess('Business profile updated successfully!')
      } else {
        await setDoc(businessRef, {
          ...businessData,
          status: 'pending',
          createdAt: new Date(),
          cover: '/assets/placeholder.jpg',
        })
        setSuccess(
          'Business profile created! Waiting for admin approval.'
        )
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
        {business && (
          <div className={`status-badge status-${business.status}`}>
            {business.status === 'approved' && '✓ Approved'}
            {business.status === 'pending' && '⏳ Pending Approval'}
            {business.status === 'rejected' && '✗ Rejected'}
          </div>
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
              <div className="current-image">
                <img src={business.cover} alt={business.name} />
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
