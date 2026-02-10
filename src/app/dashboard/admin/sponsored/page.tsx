'use client'

import { useAuth } from '@/lib/firebase/auth-context'
import { db } from '@/lib/firebase/config'
import { collection, query, getDocs, updateDoc, doc, Timestamp, orderBy, addDoc, deleteDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { SponsoredBanner, SPONSORED_BANNER_PRICING } from '@/lib/types'
import '../admin.css'

type TabType = 'pending' | 'approved' | 'active' | 'past'

export default function SponsoredBannersAdmin() {
  const { user } = useAuth()
  const [banners, setBanners] = useState<SponsoredBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)
  const [showReactivateModal, setShowReactivateModal] = useState<SponsoredBanner | null>(null)
  const [reactivateDays, setReactivateDays] = useState(7)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newBanner, setNewBanner] = useState({
    businessName: '',
    headline: '',
    durationDays: 7,
  })

  useEffect(() => {
    if (user?.role !== 'admin') return
    loadBanners()
  }, [user])

  const loadBanners = async () => {
    if (!db) return

    try {
      setLoading(true)
      setError('')

      const bannersRef = collection(db, 'sponsoredBanners')
      const q = query(bannersRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)

      const loadedBanners: SponsoredBanner[] = []
      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        loadedBanners.push({
          id: docSnap.id,
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
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (bannerId: string) => {
    if (!db) return

    try {
      setProcessingId(bannerId)
      setError('')

      const bannerRef = doc(db, 'sponsoredBanners', bannerId)
      await updateDoc(bannerRef, {
        status: 'approved',
        approvedBy: user?.uid,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })

      setSuccess('Banner approved! Payment will be processed and the banner will go live.')
      await loadBanners()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (bannerId: string) => {
    if (!db) return

    try {
      setProcessingId(bannerId)
      setError('')

      const bannerRef = doc(db, 'sponsoredBanners', bannerId)
      await updateDoc(bannerRef, {
        status: 'rejected',
        rejectionReason: rejectionReason || 'No reason provided',
        updatedAt: new Date(),
      })

      setSuccess('Banner rejected.')
      setShowRejectModal(null)
      setRejectionReason('')
      await loadBanners()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleActivate = async (banner: SponsoredBanner) => {
    if (!db) return

    try {
      setProcessingId(banner.id)
      setError('')

      // Calculate start and end dates
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + banner.durationDays)

      const bannerRef = doc(db, 'sponsoredBanners', banner.id)
      await updateDoc(bannerRef, {
        status: 'active',
        isPaid: true,
        startDate,
        endDate,
        updatedAt: new Date(),
      })

      setSuccess('Banner is now active!')
      await loadBanners()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleExpire = async (bannerId: string) => {
    if (!db) return

    try {
      setProcessingId(bannerId)
      const bannerRef = doc(db, 'sponsoredBanners', bannerId)
      await updateDoc(bannerRef, {
        status: 'expired',
        updatedAt: new Date(),
      })
      await loadBanners()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReactivate = async (banner: SponsoredBanner) => {
    if (!db) return

    try {
      setProcessingId(banner.id)
      setError('')

      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + reactivateDays)

      const bannerRef = doc(db, 'sponsoredBanners', banner.id)
      await updateDoc(bannerRef, {
        status: 'active',
        startDate,
        endDate,
        durationDays: reactivateDays,
        updatedAt: new Date(),
      })

      setSuccess(`Banner reactivated for ${reactivateDays} days!`)
      setShowReactivateModal(null)
      setReactivateDays(7)
      await loadBanners()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  // Test banner creation removed for production

  const handleCreateBanner = async () => {
    if (!db || !user) return

    try {
      setCreating(true)
      setError('')

      const bannerData = {
        businessId: user.uid,
        businessName: newBanner.businessName || 'Test Business',
        businessCover: '',
        headline: newBanner.headline || 'Check out our amazing deals!',
        status: 'active',
        durationDays: newBanner.durationDays,
        startDate: new Date(),
        endDate: new Date(Date.now() + newBanner.durationDays * 24 * 60 * 60 * 1000),
        isPaid: true,
        amountPaid: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedBy: user.uid,
        approvedAt: new Date(),
      }

      await addDoc(collection(db, 'sponsoredBanners'), bannerData)
      setSuccess('Banner created successfully!')
      setShowCreateModal(false)
      setNewBanner({ businessName: '', headline: '', durationDays: 7 })
      await loadBanners()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (bannerId: string) => {
    if (!db) return
    if (!confirm('Are you sure you want to permanently delete this banner?')) return

    try {
      setProcessingId(bannerId)
      await deleteDoc(doc(db, 'sponsoredBanners', bannerId))
      setSuccess('Banner deleted')
      await loadBanners()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const getFilteredBanners = (tab: TabType) => {
    const now = new Date()
    switch (tab) {
      case 'pending':
        return banners.filter(b => b.status === 'pending')
      case 'approved':
        return banners.filter(b => b.status === 'approved' && !b.isPaid)
      case 'active':
        return banners.filter(b => b.status === 'active' && b.endDate > now)
      case 'past':
        return banners.filter(b =>
          b.status === 'expired' ||
          b.status === 'rejected' ||
          b.status === 'cancelled' ||
          (b.status === 'active' && b.endDate <= now)
        )
      default:
        return []
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      pending: { bg: '#fef3c7', color: '#92400e' },
      approved: { bg: '#dbeafe', color: '#1e40af' },
      active: { bg: '#d1fae5', color: '#065f46' },
      expired: { bg: '#e5e7eb', color: '#374151' },
      rejected: { bg: '#fee2e2', color: '#991b1b' },
      cancelled: { bg: '#fecaca', color: '#991b1b' },
    }
    const style = styles[status] || styles.pending
    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color,
        textTransform: 'capitalize',
      }}>
        {status}
      </span>
    )
  }

  const getPricing = (days: number) => {
    const key = String(days) as keyof typeof SPONSORED_BANNER_PRICING
    return SPONSORED_BANNER_PRICING[key] || { displayPrice: `$${days * 3.50}` }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="admin-dashboard">
        <div className="alert alert-error">
          You don't have permission to access this page.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading sponsored banners...</p>
      </div>
    )
  }

  const pendingCount = getFilteredBanners('pending').length
  const approvedCount = getFilteredBanners('approved').length
  const activeCount = getFilteredBanners('active').length

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ margin: 0 }}>Sponsored Banner Management</h1>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + Create Banner
          </button>
        </div>
        <p style={{ color: 'var(--muted)', marginTop: '0.5rem', marginBottom: '1rem' }}>
          Sponsored banners appear in a scrolling carousel on the homepage. Businesses pay to be featured.
        </p>
        <div className="admin-stats">
          <div className="admin-stat">
            <span className="admin-stat-value">{pendingCount}</span>
            <span className="admin-stat-label">Pending</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-value">{approvedCount}</span>
            <span className="admin-stat-label">Awaiting Payment</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-value">{activeCount}</span>
            <span className="admin-stat-label">Active</span>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({pendingCount})
        </button>
        <button
          className={`admin-tab ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Awaiting Payment ({approvedCount})
        </button>
        <button
          className={`admin-tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active ({activeCount})
        </button>
        <button
          className={`admin-tab ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Past/Rejected
        </button>
      </div>

      <div className="admin-businesses">
        {getFilteredBanners(activeTab).length === 0 ? (
          <div className="empty-state">
            <p>No {activeTab} sponsored banners</p>
          </div>
        ) : (
          getFilteredBanners(activeTab).map((banner) => (
            <div key={banner.id} className="business-card-admin" style={{
              border: banner.status === 'active' ? '2px solid var(--primary)' : undefined
            }}>
              <div className="business-card-image" style={{ position: 'relative', width: '100%', height: '180px' }}>
                {banner.businessCover ? (
                  <Image
                    src={banner.businessCover}
                    alt={banner.businessName}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 100vw, 300px"
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3rem',
                    fontWeight: 700,
                    color: 'white',
                  }}>
                    {banner.businessName[0]}
                  </div>
                )}
              </div>
              <div className="business-card-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0 }}>{banner.businessName}</h3>
                  {getStatusBadge(banner.status)}
                </div>

                {banner.headline && (
                  <p style={{ fontStyle: 'italic', color: 'var(--muted)', margin: '0.5rem 0' }}>
                    "{banner.headline}"
                  </p>
                )}

                <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '0.75rem' }}>
                  <p style={{ margin: '0.25rem 0' }}>
                    <strong>Duration:</strong> {banner.durationDays} days ({getPricing(banner.durationDays).displayPrice})
                  </p>
                  <p style={{ margin: '0.25rem 0' }}>
                    <strong>Applied:</strong> {formatDate(banner.createdAt)}
                  </p>
                  {banner.status === 'active' && (
                    <>
                      <p style={{ margin: '0.25rem 0' }}>
                        <strong>Started:</strong> {formatDate(banner.startDate)}
                      </p>
                      <p style={{ margin: '0.25rem 0' }}>
                        <strong>Ends:</strong> {formatDate(banner.endDate)}
                      </p>
                    </>
                  )}
                  {banner.isPaid && banner.amountPaid && (
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Paid:</strong> ${(banner.amountPaid / 100).toFixed(2)}
                    </p>
                  )}
                  {banner.rejectionReason && (
                    <p style={{ margin: '0.5rem 0', padding: '0.5rem', background: '#fef2f2', borderRadius: '4px', color: '#991b1b' }}>
                      <strong>Rejection reason:</strong> {banner.rejectionReason}
                    </p>
                  )}
                </div>
              </div>
              <div className="business-card-actions">
                {banner.status === 'pending' && (
                  <>
                    <button
                      className="btn-approve"
                      onClick={() => handleApprove(banner.id)}
                      disabled={processingId === banner.id}
                    >
                      {processingId === banner.id ? 'Processing...' : '✓ Approve'}
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => setShowRejectModal(banner.id)}
                      disabled={processingId === banner.id}
                    >
                      ✗ Reject
                    </button>
                  </>
                )}
                {banner.status === 'approved' && !banner.isPaid && (
                  <button
                    className="btn-approve"
                    onClick={() => handleActivate(banner)}
                    disabled={processingId === banner.id}
                    style={{ width: '100%' }}
                  >
                    {processingId === banner.id ? 'Activating...' : '💳 Mark as Paid & Activate'}
                  </button>
                )}
                {banner.status === 'active' && banner.endDate > new Date() && (
                  <button
                    className="btn-unapprove"
                    onClick={() => handleExpire(banner.id)}
                    disabled={processingId === banner.id}
                    style={{ flex: 1 }}
                  >
                    End Early
                  </button>
                )}
                {(banner.status === 'expired' ||
                  banner.status === 'cancelled' ||
                  (banner.status === 'active' && banner.endDate <= new Date())) && (
                  <button
                    className="btn-approve"
                    onClick={() => setShowReactivateModal(banner)}
                    disabled={processingId === banner.id}
                    style={{ flex: 1 }}
                  >
                    Reactivate
                  </button>
                )}
                <button
                  onClick={() => handleDelete(banner.id)}
                  disabled={processingId === banner.id}
                  style={{
                    padding: '0.5rem',
                    background: '#fee2e2',
                    color: '#991b1b',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                  }}
                  title="Delete banner"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Banner Modal */}
      {showCreateModal && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1000,
            }}
            onClick={() => setShowCreateModal(false)}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '2rem',
            borderRadius: 'var(--radius)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            zIndex: 1001,
            width: '90%',
            maxWidth: '500px',
          }}>
            <h3 style={{ marginTop: 0 }}>Create Sponsored Banner</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Business Name</label>
                <input
                  type="text"
                  value={newBanner.businessName}
                  onChange={(e) => setNewBanner({ ...newBanner, businessName: e.target.value })}
                  placeholder="Business name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Headline</label>
                <input
                  type="text"
                  value={newBanner.headline}
                  onChange={(e) => setNewBanner({ ...newBanner, headline: e.target.value })}
                  placeholder="Banner headline"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Duration (days)</label>
                <select
                  value={newBanner.durationDays}
                  onChange={(e) => setNewBanner({ ...newBanner, durationDays: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                  }}
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBanner}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={creating || !newBanner.businessName}
                >
                  {creating ? 'Creating...' : 'Create Banner'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reactivate Modal */}
      {showReactivateModal && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1000,
            }}
            onClick={() => {
              setShowReactivateModal(null)
              setReactivateDays(7)
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '2rem',
            borderRadius: 'var(--radius)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            zIndex: 1001,
            width: '90%',
            maxWidth: '400px',
          }}>
            <h3 style={{ marginTop: 0 }}>Reactivate Banner</h3>
            <p style={{ color: 'var(--muted)' }}>
              Reactivate <strong>{showReactivateModal.businessName}</strong> for how many days?
            </p>
            <select
              value={reactivateDays}
              onChange={(e) => setReactivateDays(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                marginBottom: '1rem',
              }}
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => {
                  setShowReactivateModal(null)
                  setReactivateDays(7)
                }}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleReactivate(showReactivateModal)}
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={processingId === showReactivateModal.id}
              >
                {processingId === showReactivateModal.id ? 'Reactivating...' : 'Reactivate'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1000,
            }}
            onClick={() => {
              setShowRejectModal(null)
              setRejectionReason('')
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '2rem',
            borderRadius: 'var(--radius)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            zIndex: 1001,
            width: '90%',
            maxWidth: '400px',
          }}>
            <h3 style={{ marginTop: 0 }}>Reject Sponsored Banner</h3>
            <p style={{ color: 'var(--muted)' }}>Provide a reason for rejection (optional but recommended):</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Image quality too low, inappropriate content..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                marginBottom: '1rem',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => {
                  setShowRejectModal(null)
                  setRejectionReason('')
                }}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                className="btn"
                style={{ flex: 1, background: '#dc2626', color: 'white' }}
                disabled={processingId === showRejectModal}
              >
                {processingId === showRejectModal ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
