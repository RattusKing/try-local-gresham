'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, addDoc, Timestamp, orderBy } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase/config'
import { Business, SponsoredBanner, SPONSORED_BANNER_PRICING, SponsoredBannerDuration } from '@/lib/types'
import { logger } from '@/lib/logger';

interface SponsoredPlacementManagerProps {
  business: Business
}

export default function SponsoredPlacementManager({ business }: SponsoredPlacementManagerProps) {
  const [banners, setBanners] = useState<SponsoredBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [processingPayment, setProcessingPayment] = useState<string | null>(null)

  // Application form state
  const [selectedDuration, setSelectedDuration] = useState<SponsoredBannerDuration>('7')
  const [headline, setHeadline] = useState('')

  useEffect(() => {
    loadBanners()
  }, [business.id])

  const loadBanners = async () => {
    if (!db || !business.id) return

    try {
      setLoading(true)
      const bannersRef = collection(db, 'sponsoredBanners')
      const q = query(
        bannersRef,
        where('businessId', '==', business.id),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(q)
      const loadedBanners: SponsoredBanner[] = []

      snapshot.forEach((doc) => {
        const data = doc.data()
        loadedBanners.push({
          id: doc.id,
          ...data,
          startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : new Date(data.startDate),
          endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : new Date(data.endDate),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
          approvedAt: data.approvedAt instanceof Timestamp ? data.approvedAt.toDate() : data.approvedAt ? new Date(data.approvedAt) : undefined,
        } as SponsoredBanner)
      })

      setBanners(loadedBanners)
    } catch (err: any) {
      logger.error('Error loading sponsored banners:', err)
      setError('Failed to load sponsored placements')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !business.id) return

    // Check for pending or active banner
    const hasPendingOrActive = banners.some(
      b => b.status === 'pending' || b.status === 'approved' || b.status === 'active'
    )

    if (hasPendingOrActive) {
      setError('You already have a pending or active sponsored placement. Please wait for it to complete before applying again.')
      return
    }

    try {
      setApplying(true)
      setError('')

      const pricing = SPONSORED_BANNER_PRICING[selectedDuration]
      const now = new Date()

      const bannerData = {
        businessId: business.id,
        businessName: business.name,
        businessCover: business.cover || '',
        headline: headline.trim() || null,
        status: 'pending',
        isPaid: false,
        durationDays: pricing.days,
        // Start/end dates will be set when approved and paid
        startDate: now, // Placeholder
        endDate: now, // Placeholder
        createdAt: now,
        updatedAt: now,
      }

      await addDoc(collection(db, 'sponsoredBanners'), bannerData)

      // Notify admins of new sponsored banner request
      const token = await auth?.currentUser?.getIdToken()
      if (token) {
        fetch('/api/notify/admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: 'new_sponsored_banner_request',
            data: {
              businessName: business.name,
              headline: headline.trim() || 'No headline',
              duration: `${pricing.days} days`,
            },
          }),
        }).catch((err) => logger.error('Admin notification error:', err))
      }

      setSuccess('Your sponsored placement request has been submitted! You will receive a notification once approved, and payment will be processed automatically.')
      setShowApplyForm(false)
      setHeadline('')
      setSelectedDuration('7')
      await loadBanners()
    } catch (err: any) {
      logger.error('Error applying for sponsored placement:', err)
      setError('Failed to submit application. Please try again.')
    } finally {
      setApplying(false)
    }
  }

  const handlePayment = async (banner: SponsoredBanner) => {
    setProcessingPayment(banner.id)
    setError('')

    try {
      // Create payment intent
      const response = await fetch('/api/stripe/sponsored-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bannerId: banner.id,
          businessId: business.id,
          durationDays: banner.durationDays,
          customerEmail: business.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment')
      }

      // Redirect to Stripe checkout or use embedded form
      // For simplicity, we'll redirect to a checkout page
      // In production, you'd want to use Stripe Elements here
      window.location.href = `/checkout/sponsored?banner=${banner.id}&pi=${data.paymentIntentId}&cs=${data.clientSecret}`
    } catch (err: any) {
      logger.error('Payment error:', err)
      setError(err.message || 'Failed to process payment')
    } finally {
      setProcessingPayment(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending Approval' },
      approved: { bg: '#dbeafe', color: '#1e40af', label: 'Approved - Awaiting Payment' },
      active: { bg: '#d1fae5', color: '#065f46', label: 'Active' },
      expired: { bg: '#e5e7eb', color: '#374151', label: 'Expired' },
      rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
      cancelled: { bg: '#fecaca', color: '#991b1b', label: 'Cancelled' },
    }
    const style = styles[status] || styles.pending
    return (
      <span style={{
        display: 'inline-block',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color,
      }}>
        {style.label}
      </span>
    )
  }

  const hasPendingOrActive = banners.some(
    b => b.status === 'pending' || b.status === 'approved' || b.status === 'active'
  )

  return (
    <div className="sponsored-placement-manager">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>⭐</span>
          Featured Business Placement
        </h2>
        <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
          Get your business featured in the scrolling banner on the homepage
        </p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

      {/* Pricing Info Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(153, 237, 195, 0.15) 0%, rgba(194, 175, 240, 0.15) 100%)',
        borderRadius: 'var(--radius)',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        border: '1px solid rgba(153, 237, 195, 0.3)',
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.125rem' }}>How It Works</h3>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--dark)' }}>
          <li style={{ marginBottom: '0.5rem' }}>Your business appears in the rotating featured banner on the homepage</li>
          <li style={{ marginBottom: '0.5rem' }}>Add an optional custom headline to attract customers</li>
          <li style={{ marginBottom: '0.5rem' }}>Payment is only processed after admin approval</li>
          <li>Your promotion starts immediately after payment confirmation</li>
        </ul>
      </div>

      {/* Current/Past Placements */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--muted)' }}>Loading your placements...</p>
        </div>
      ) : banners.length > 0 ? (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Your Sponsored Placements</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {banners.map((banner) => (
              <div
                key={banner.id}
                style={{
                  background: 'white',
                  borderRadius: 'var(--radius)',
                  padding: '1.25rem',
                  boxShadow: 'var(--shadow)',
                  border: banner.status === 'active' ? '2px solid var(--primary)' : '1px solid #e5e7eb',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                      {banner.durationDays}-Day Featured Placement
                    </p>
                    {banner.headline && (
                      <p style={{ color: 'var(--muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                        "{banner.headline}"
                      </p>
                    )}
                  </div>
                  {getStatusBadge(banner.status)}
                </div>
                <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                  <span>Applied: {banner.createdAt.toLocaleDateString()}</span>
                  {banner.status === 'active' && (
                    <span>Ends: {banner.endDate.toLocaleDateString()}</span>
                  )}
                  {banner.isPaid && banner.amountPaid && (
                    <span>Paid: ${(banner.amountPaid / 100).toFixed(2)}</span>
                  )}
                </div>
                {banner.rejectionReason && (
                  <p style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fef2f2', borderRadius: '8px', fontSize: '0.875rem', color: '#991b1b' }}>
                    <strong>Rejection reason:</strong> {banner.rejectionReason}
                  </p>
                )}
                {banner.status === 'approved' && !banner.isPaid && (
                  <button
                    onClick={() => handlePayment(banner)}
                    disabled={processingPayment === banner.id}
                    className="btn btn-primary"
                    style={{
                      marginTop: '1rem',
                      width: '100%',
                      padding: '0.75rem',
                    }}
                  >
                    {processingPayment === banner.id ? (
                      <>
                        <span className="spinner" style={{ width: '16px', height: '16px', marginRight: '0.5rem' }}></span>
                        Processing...
                      </>
                    ) : (
                      `Pay ${SPONSORED_BANNER_PRICING[String(banner.durationDays) as keyof typeof SPONSORED_BANNER_PRICING]?.displayPrice || `$${(banner.durationDays * 3.5).toFixed(0)}`} to Activate`
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Apply Button or Form */}
      {!showApplyForm ? (
        <button
          onClick={() => setShowApplyForm(true)}
          disabled={hasPendingOrActive}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1rem',
            opacity: hasPendingOrActive ? 0.6 : 1,
            cursor: hasPendingOrActive ? 'not-allowed' : 'pointer',
          }}
        >
          {hasPendingOrActive ? 'Placement Already Pending or Active' : 'Apply for Featured Placement'}
        </button>
      ) : (
        <form onSubmit={handleApply} style={{
          background: 'white',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow)',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Apply for Featured Placement</h3>

          {/* Duration Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem' }}>
              Select Duration
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {(Object.keys(SPONSORED_BANNER_PRICING) as SponsoredBannerDuration[]).map((key) => {
                const option = SPONSORED_BANNER_PRICING[key]
                const isSelected = selectedDuration === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDuration(key)}
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid var(--primary)' : '2px solid #e5e7eb',
                      background: isSelected ? 'linear-gradient(135deg, rgba(153, 237, 195, 0.2), rgba(194, 175, 240, 0.2))' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ fontWeight: 700, fontSize: '1.25rem', margin: '0 0 0.25rem', color: 'var(--dark)' }}>
                      {option.displayPrice}
                    </p>
                    <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.875rem' }}>
                      {option.label}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom Headline */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="headline" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              Custom Headline (Optional)
            </label>
            <input
              type="text"
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={100}
              placeholder="e.g., Now offering free delivery on orders over $30!"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                fontSize: '1rem',
              }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
              {headline.length}/100 characters - Leave blank to use your business name only
            </p>
          </div>

          {/* Preview */}
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px',
          }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Preview
            </p>
            <p style={{ fontWeight: 700, fontSize: '1.25rem', margin: '0 0 0.25rem', color: 'var(--dark)' }}>
              {business.name}
            </p>
            {headline && (
              <p style={{ margin: 0, color: 'var(--muted)' }}>{headline}</p>
            )}
          </div>

          {/* Summary */}
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, rgba(153, 237, 195, 0.1), rgba(194, 175, 240, 0.1))',
            borderRadius: '8px',
            border: '1px solid var(--primary)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Duration:</span>
              <span style={{ fontWeight: 600 }}>{SPONSORED_BANNER_PRICING[selectedDuration].label}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total (charged after approval):</span>
              <span style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--primary-dark)' }}>
                {SPONSORED_BANNER_PRICING[selectedDuration].displayPrice}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => {
                setShowApplyForm(false)
                setHeadline('')
                setSelectedDuration('7')
                setError('')
              }}
              className="btn btn-outline"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={applying}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              {applying ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      )}

      <style jsx>{`
        .sponsored-placement-manager {
          background: white;
          border-radius: var(--radius);
          padding: 2rem;
          box-shadow: var(--shadow);
          margin-top: 2rem;
        }
      `}</style>
    </div>
  )
}
