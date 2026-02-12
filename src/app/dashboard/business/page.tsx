'use client'

import { useAuth } from '@/lib/firebase/auth-context'
import { db, storage } from '@/lib/firebase/config'
import { doc, getDoc, getDocFromServer, setDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Business } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import SubscriptionManager from '@/components/SubscriptionManager'
import SubscriptionRequiredBanner from '@/components/SubscriptionRequiredBanner'
import BusinessPreview from '@/components/BusinessPreview'
import SponsoredPlacementManager from '@/components/SponsoredPlacementManager'
import TagSelector from '@/components/TagSelector'
import './business.css'
import { logger } from '@/lib/logger';

export default function BusinessDashboard() {
  return (
    <Suspense fallback={
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading business profile...</p>
      </div>
    }>
      <BusinessDashboardContent />
    </Suspense>
  )
}

function BusinessDashboardContent() {
  const { user } = useAuth()
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadingHeader, setUploadingHeader] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    tags: [] as string[],
    neighborhood: '',
    hours: '',
    phone: '',
    website: '',
    map: '',
    description: '',
    address: '',
    email: '',
    instagram: '',
  })

  const loadBusiness = useCallback(async (options?: { fromServer?: boolean }) => {
    if (!user || !db) return

    try {
      setLoading(true)
      const businessRef = doc(db, 'businesses', user.uid)
      const businessSnap = options?.fromServer
        ? await getDocFromServer(businessRef)
        : await getDoc(businessRef)

      if (businessSnap.exists()) {
        const data = businessSnap.data() as Business
        setBusiness({ ...data, id: businessSnap.id })
        setFormData({
          name: data.name || '',
          tags: data.tags || [],
          neighborhood: data.neighborhood || '',
          hours: data.hours || '',
          phone: data.phone || '',
          website: data.website || '',
          map: data.map || '',
          description: data.description || '',
          address: data.address || '',
          email: data.email || '',
          instagram: data.instagram || '',
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

  // Detect return from Stripe checkout and poll for updated subscription status
  const searchParams = useSearchParams()
  const hasPolledRef = useRef(false)

  useEffect(() => {
    const subscriptionParam = searchParams.get('subscription')
    if (subscriptionParam !== 'success' || hasPolledRef.current) return
    hasPolledRef.current = true

    // The Stripe webhook may take a few seconds to update Firestore.
    // Poll a few times so the user sees their active subscription.
    let attempts = 0
    const maxAttempts = 8
    const pollInterval = 2000 // 2 seconds

    const poll = async () => {
      attempts++

      // Re-read the business doc from server (bypass cache) to check if subscription landed
      if (!user || !db) return
      const businessRef = doc(db, 'businesses', user.uid)
      const snap = await getDocFromServer(businessRef)
      if (snap.exists()) {
        const data = snap.data()
        if (data.subscriptionStatus === 'active' || data.subscriptionStatus === 'trialing') {
          // Reload business into component state with fresh server data
          await loadBusiness({ fromServer: true })
          setSuccess('Subscription activated successfully! Welcome aboard!')
          return // Done polling
        }
      }

      if (attempts < maxAttempts) {
        setTimeout(poll, pollInterval)
      } else {
        // Webhook hasn't arrived yet — still show a helpful message
        setSuccess('Payment received! Your subscription is being activated — please refresh in a moment if it hasn\'t updated yet.')
      }
    }

    // Start polling after a short initial delay to give the webhook a head start
    const timer = setTimeout(poll, 1500)
    return () => clearTimeout(timer)
  }, [searchParams, user, db, loadBusiness])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db) return

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const businessData = {
        name: formData.name,
        tags: formData.tags,
        neighborhood: formData.neighborhood,
        hours: formData.hours,
        phone: formData.phone,
        website: formData.website,
        map: formData.map,
        description: formData.description,
        address: formData.address,
        email: formData.email,
        instagram: formData.instagram,
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

        logger.log('Updated existing business:', user.uid, 'Status:', currentStatus)
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

        logger.log('Created new business:', user.uid)
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

      setSuccess('Cover image uploaded successfully!')
      await loadBusiness()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleHeaderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setUploadingHeader(true)
      setError('')

      // Upload to Firebase Storage
      const storageRef = ref(storage, `businesses/${user.uid}/header_${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      // Update Firestore document
      const businessRef = doc(db, 'businesses', user.uid)
      await updateDoc(businessRef, {
        headerImage: downloadURL,
        updatedAt: new Date(),
      })

      setSuccess('Header image uploaded successfully!')
      await loadBusiness()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploadingHeader(false)
    }
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user || !storage || !db) return

    const files = Array.from(e.target.files)

    // Validate all files
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('All files must be images')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be less than 5MB')
        return
      }
    }

    try {
      setUploadingGallery(true)
      setError('')

      // Upload all files
      const uploadPromises = files.map(async (file) => {
        if (!storage) throw new Error('Storage not initialized')
        const storageRef = ref(storage, `businesses/${user.uid}/gallery_${Date.now()}_${file.name}`)
        await uploadBytes(storageRef, file)
        return getDownloadURL(storageRef)
      })

      const downloadURLs = await Promise.all(uploadPromises)

      // Get existing gallery images
      const businessRef = doc(db, 'businesses', user.uid)
      const businessSnap = await getDoc(businessRef)
      const existingGallery = businessSnap.exists() ? (businessSnap.data().gallery || []) : []

      // Update Firestore document with new images added to existing gallery
      await updateDoc(businessRef, {
        gallery: [...existingGallery, ...downloadURLs],
        updatedAt: new Date(),
      })

      setSuccess(`${files.length} image(s) added to gallery!`)
      await loadBusiness()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploadingGallery(false)
    }
  }

  const handleRemoveGalleryImage = async (imageUrl: string) => {
    if (!user || !db) return

    try {
      setError('')

      const businessRef = doc(db, 'businesses', user.uid)
      const businessSnap = await getDoc(businessRef)

      if (businessSnap.exists()) {
        const currentGallery = businessSnap.data().gallery || []
        const updatedGallery = currentGallery.filter((url: string) => url !== imageUrl)

        await updateDoc(businessRef, {
          gallery: updatedGallery,
          updatedAt: new Date(),
        })

        setSuccess('Image removed from gallery')
        await loadBusiness()
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user || !storage || !db)
      return

    const file = e.target.files[0]

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    try {
      setUploadingLogo(true)
      setError('')

      const storageRef = ref(storage, `businesses/${user.uid}/logo_${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      const businessRef = doc(db, 'businesses', user.uid)
      await updateDoc(businessRef, {
        logo: downloadURL,
        updatedAt: new Date(),
      })

      setSuccess('Business logo uploaded successfully!')
      await loadBusiness()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploadingLogo(false)
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

      {/* Subscription Required Banner */}
      {business && business.status === 'approved' && (
        <SubscriptionRequiredBanner business={business} />
      )}

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
        <div id="subscription-section">
          <SubscriptionManager business={business} onSubscriptionUpdate={loadBusiness} />
        </div>
      )}

      {/* Sponsored Placement Section */}
      {business && business.status === 'approved' && (
        <SponsoredPlacementManager business={business} />
      )}

      {/* Quick Setup Tips */}
      <div className="alert" style={{
        background: 'linear-gradient(135deg, rgba(153, 237, 195, 0.1), rgba(194, 175, 240, 0.1))',
        border: '1px solid var(--primary)',
        borderRadius: 'var(--radius)',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--dark)' }}>
          💡 Quick Setup Tips
        </h3>
        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: '1rem', color: 'var(--secondary-dark)' }}>
            Click here for tips to quickly fill in your business profile
          </summary>
          <div style={{ paddingLeft: '1rem', color: 'var(--muted)' }}>
            <p style={{ marginBottom: '0.75rem' }}>
              <strong>Have an existing website?</strong> You can copy and paste content directly:
            </p>
            <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
              <li>Copy your "About Us" section → Paste into <strong>Description</strong></li>
              <li>Copy your business hours → Paste into <strong>Hours</strong></li>
              <li>Copy your phone number and address → Paste into respective fields</li>
              <li>Right-click and save images from your site → Upload them using the image upload button</li>
            </ul>
            <p style={{ marginBottom: '0.75rem' }}>
              <strong>Next steps after basic info:</strong>
            </p>
            <ul style={{ paddingLeft: '1.5rem' }}>
              <li>Go to <strong>Products</strong> to add items customers can purchase</li>
              <li>Go to <strong>Services</strong> to add bookable appointments</li>
              <li>Go to <strong>Settings</strong> to configure appointment availability</li>
              <li>Set up <strong>Payment Processing</strong> to start accepting orders</li>
            </ul>
          </div>
        </details>
      </div>

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
                Business Categories *
                <span className="form-hint">
                  Select tags that best describe your business (min 1, max 10)
                </span>
              </label>
              <TagSelector
                selectedTags={formData.tags}
                onChange={(tags) => setFormData({ ...formData, tags })}
              />
              {formData.tags.length === 0 && (
                <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Please select at least one category tag
                </p>
              )}
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

            <div className="form-group">
              <label htmlFor="address">Physical Address</label>
              <input
                type="text"
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="123 Main St, Gresham, OR 97030"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Business Email</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="contact@yourbusiness.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="instagram">
                Instagram Handle
                <span className="form-hint">
                  e.g., @yourbusiness (optional)
                </span>
              </label>
              <input
                type="text"
                id="instagram"
                value={formData.instagram}
                onChange={(e) =>
                  setFormData({ ...formData, instagram: e.target.value })
                }
                placeholder="@yourbusiness"
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Business Logo / Profile Picture</h2>
            <p className="form-hint" style={{ marginBottom: '1rem' }}>
              Your business logo or profile picture. This appears on your business card and profile. Recommended: square image, at least 200x200px.
            </p>
            {business?.logo && (
              <div className="current-image" style={{ position: 'relative', width: '150px', height: '150px', marginBottom: '1rem' }}>
                <Image
                  src={business.logo}
                  alt={`${business.name} logo`}
                  fill
                  style={{ objectFit: 'cover', borderRadius: '50%', border: '3px solid var(--primary)' }}
                  sizes="150px"
                />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="logo">Upload Logo / Profile Picture</label>
              <input
                type="file"
                id="logo"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
              />
              {uploadingLogo && <p className="upload-status">Uploading...</p>}
            </div>
          </div>

          <div className="form-section">
            <h2>Header Banner Image</h2>
            <p className="form-hint" style={{ marginBottom: '1rem' }}>
              Large banner image that appears at the top of your business page. Recommended size: 1200x400px
            </p>
            {business?.headerImage && (
              <div className="current-image" style={{ position: 'relative', width: '100%', maxWidth: '800px', height: '250px', marginBottom: '1rem' }}>
                <Image
                  src={business.headerImage}
                  alt={`${business.name} header`}
                  fill
                  style={{ objectFit: 'cover', borderRadius: '8px' }}
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="header">Upload Header Banner</label>
              <input
                type="file"
                id="header"
                accept="image/*"
                onChange={handleHeaderImageUpload}
                disabled={uploadingHeader}
              />
              {uploadingHeader && <p className="upload-status">Uploading...</p>}
            </div>
          </div>

          <div className="form-section">
            <h2>Cover Image</h2>
            <p className="form-hint" style={{ marginBottom: '1rem' }}>
              Main image shown in business listings and cards. Recommended size: 600x400px
            </p>
            {business?.cover && (
              <div className="current-image" style={{ position: 'relative', width: '100%', maxWidth: '600px', height: '300px', marginBottom: '1rem' }}>
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

          <div className="form-section">
            <h2>Photo Gallery</h2>
            <p className="form-hint" style={{ marginBottom: '1rem' }}>
              Upload multiple images to showcase your business. Select multiple files at once.
            </p>
            {business?.gallery && business.gallery.length > 0 && (
              <div className="gallery-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                {business.gallery.map((imageUrl, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <div style={{ position: 'relative', width: '100%', height: '200px' }}>
                      <Image
                        src={imageUrl}
                        alt={`Gallery image ${index + 1}`}
                        fill
                        style={{ objectFit: 'cover', borderRadius: '8px' }}
                        sizes="200px"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryImage(imageUrl)}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: 'rgba(220, 38, 38, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        fontWeight: 'bold'
                      }}
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="form-group">
              <label htmlFor="gallery">Add Images to Gallery</label>
              <input
                type="file"
                id="gallery"
                accept="image/*"
                multiple
                onChange={handleGalleryUpload}
                disabled={uploadingGallery}
              />
              <span className="form-hint">You can select multiple images at once (hold Ctrl/Cmd while selecting)</span>
              {uploadingGallery && <p className="upload-status">Uploading images...</p>}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-outline"
              onClick={() => setShowPreview(true)}
              disabled={!business}
              style={{ marginRight: '1rem' }}
            >
              👁️ Preview Business Page
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : business ? 'Update Profile' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Business Preview Modal */}
      {business && (
        <BusinessPreview
          business={business}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}
