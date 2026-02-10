'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase/auth-context'
import { db } from '@/lib/firebase/config'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query } from 'firebase/firestore'
import { PromoBanner, BannerLocation } from '@/lib/types'
import DashboardNav from '@/components/DashboardNav'
import '../admin.css'
import './banners.css'
import { logger } from '@/lib/logger';

export default function BannersManagementPage() {
  const { user } = useAuth()
  const [banners, setBanners] = useState<PromoBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    ctaText: '',
    ctaLink: '',
    backgroundColor: '#ff7a00',
    textColor: '#ffffff',
    location: 'homepage' as BannerLocation,
    isActive: true,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    displayOrder: '1',
  })

  useEffect(() => {
    if (user?.role === 'admin') {
      loadBanners()
    }
  }, [user])

  const loadBanners = async () => {
    if (!db) return

    try {
      setLoading(true)
      const bannersRef = collection(db, 'promoBanners')
      const q = query(bannersRef, orderBy('displayOrder', 'asc'))
      const snapshot = await getDocs(q)

      const loadedBanners = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          validFrom: data.validFrom?.toDate() || new Date(),
          validUntil: data.validUntil?.toDate() || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as PromoBanner
      })

      setBanners(loadedBanners)
    } catch (error) {
      logger.error('Error loading banners:', error)
      alert('Failed to load banners')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!db) return

    // Validate
    if (!formData.title.trim() || !formData.message.trim()) {
      alert('Title and message are required')
      return
    }

    try {
      const bannerData = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        ctaText: formData.ctaText.trim() || '',
        ctaLink: formData.ctaLink.trim() || '',
        backgroundColor: formData.backgroundColor,
        textColor: formData.textColor,
        location: formData.location,
        isActive: formData.isActive,
        validFrom: new Date(formData.validFrom),
        validUntil: formData.validUntil ? new Date(formData.validUntil) : null,
        displayOrder: parseInt(formData.displayOrder),
        updatedAt: new Date(),
      }

      if (editingBanner) {
        // Update existing banner
        await updateDoc(doc(db, 'promoBanners', editingBanner.id), bannerData)
        alert('Banner updated successfully!')
      } else {
        // Create new banner
        await addDoc(collection(db, 'promoBanners'), {
          ...bannerData,
          createdAt: new Date(),
        })
        alert('Banner created successfully!')
      }

      // Reset form
      setFormData({
        title: '',
        message: '',
        ctaText: '',
        ctaLink: '',
        backgroundColor: '#ff7a00',
        textColor: '#ffffff',
        location: 'homepage',
        isActive: true,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: '',
        displayOrder: '1',
      })
      setEditingBanner(null)
      setShowForm(false)
      loadBanners()
    } catch (error) {
      logger.error('Error saving banner:', error)
      alert('Failed to save banner')
    }
  }

  const handleEdit = (banner: PromoBanner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title,
      message: banner.message,
      ctaText: banner.ctaText || '',
      ctaLink: banner.ctaLink || '',
      backgroundColor: banner.backgroundColor || '#ff7a00',
      textColor: banner.textColor || '#ffffff',
      location: banner.location,
      isActive: banner.isActive,
      validFrom: banner.validFrom.toISOString().split('T')[0],
      validUntil: banner.validUntil ? banner.validUntil.toISOString().split('T')[0] : '',
      displayOrder: banner.displayOrder.toString(),
    })
    setShowForm(true)
  }

  const handleDelete = async (bannerId: string) => {
    if (!db || !confirm('Are you sure you want to delete this banner?')) return

    try {
      await deleteDoc(doc(db, 'promoBanners', bannerId))
      alert('Banner deleted successfully!')
      loadBanners()
    } catch (error) {
      logger.error('Error deleting banner:', error)
      alert('Failed to delete banner')
    }
  }

  const toggleActive = async (banner: PromoBanner) => {
    if (!db) return

    try {
      await updateDoc(doc(db, 'promoBanners', banner.id), {
        isActive: !banner.isActive,
        updatedAt: new Date(),
      })
      loadBanners()
    } catch (error) {
      logger.error('Error toggling banner status:', error)
      alert('Failed to update banner status')
    }
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="dashboard-layout">
        <DashboardNav />
        <main className="dashboard-content">
          <p>Access denied. Admin only.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="dashboard-layout">
      <DashboardNav />
      <main className="dashboard-content">
        <div className="dashboard-header">
          <h1>Promotional Banners</h1>
          <button
            onClick={() => {
              setEditingBanner(null)
              setFormData({
                title: '',
                message: '',
                ctaText: '',
                ctaLink: '',
                backgroundColor: '#ff7a00',
                textColor: '#ffffff',
                location: 'homepage',
                isActive: true,
                validFrom: new Date().toISOString().split('T')[0],
                validUntil: '',
                displayOrder: '1',
              })
              setShowForm(!showForm)
            }}
            className="btn btn-primary"
          >
            {showForm ? 'Cancel' : '+ Create Banner'}
          </button>
        </div>

        {showForm && (
          <div className="banner-form-card">
            <h2>{editingBanner ? 'Edit Banner' : 'Create New Banner'}</h2>
            <form onSubmit={handleSubmit} className="banner-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="title">Title *</label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Summer Sale!"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location *</label>
                  <select
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value as BannerLocation })
                    }
                    required
                  >
                    <option value="homepage">Homepage Only</option>
                    <option value="business_pages">Business Pages Only</option>
                    <option value="all_pages">All Pages</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Get 20% off all orders this weekend!"
                  rows={2}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ctaText">Call-to-Action Text</label>
                  <input
                    type="text"
                    id="ctaText"
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    placeholder="Shop Now"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ctaLink">Call-to-Action Link</label>
                  <input
                    type="text"
                    id="ctaLink"
                    value={formData.ctaLink}
                    onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                    placeholder="/"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="backgroundColor">Background Color</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      id="backgroundColor"
                      value={formData.backgroundColor}
                      onChange={(e) =>
                        setFormData({ ...formData, backgroundColor: e.target.value })
                      }
                    />
                    <input
                      type="text"
                      value={formData.backgroundColor}
                      onChange={(e) =>
                        setFormData({ ...formData, backgroundColor: e.target.value })
                      }
                      placeholder="#ff7a00"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="textColor">Text Color</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      id="textColor"
                      value={formData.textColor}
                      onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                    />
                    <input
                      type="text"
                      value={formData.textColor}
                      onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="validFrom">Valid From *</label>
                  <input
                    type="date"
                    id="validFrom"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="validUntil">Valid Until</label>
                  <input
                    type="date"
                    id="validUntil"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  />
                  <small>Leave empty for no expiration</small>
                </div>

                <div className="form-group">
                  <label htmlFor="displayOrder">Display Order</label>
                  <input
                    type="number"
                    id="displayOrder"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    min="1"
                    required
                  />
                  <small>Lower numbers appear first</small>
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span>Active (visible to users)</span>
                </label>
              </div>

              {/* Preview */}
              <div className="banner-preview">
                <h3>Preview:</h3>
                <div
                  className="preview-banner"
                  style={{
                    backgroundColor: formData.backgroundColor,
                    color: formData.textColor,
                    padding: '1rem',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ marginBottom: '0.25rem', fontWeight: 700 }}>
                    {formData.title || 'Banner Title'}
                  </div>
                  <div style={{ fontSize: '0.9375rem', opacity: 0.95 }}>
                    {formData.message || 'Banner message will appear here'}
                  </div>
                  {formData.ctaText && (
                    <button
                      type="button"
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: formData.textColor,
                        color: formData.backgroundColor,
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 600,
                      }}
                    >
                      {formData.ctaText}
                    </button>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingBanner ? 'Update Banner' : 'Create Banner'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingBanner(null)
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p>Loading banners...</p>
        ) : banners.length === 0 ? (
          <div className="empty-state">
            <p>No promotional banners yet. Create your first one!</p>
          </div>
        ) : (
          <div className="banners-list">
            {banners.map((banner) => {
              const now = new Date()
              const isExpired = banner.validUntil && now > banner.validUntil
              const isScheduled = now < banner.validFrom

              return (
                <div key={banner.id} className="banner-card">
                  <div className="banner-card-header">
                    <div>
                      <h3>{banner.title}</h3>
                      <div className="banner-meta">
                        <span className="banner-location">{banner.location.replace('_', ' ')}</span>
                        <span className="banner-order">Order: {banner.displayOrder}</span>
                        {isExpired && <span className="banner-status expired">Expired</span>}
                        {isScheduled && <span className="banner-status scheduled">Scheduled</span>}
                        <span
                          className={`banner-status ${banner.isActive ? 'active' : 'inactive'}`}
                        >
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="banner-card-actions">
                      <button
                        onClick={() => toggleActive(banner)}
                        className="btn btn-small btn-secondary"
                        title={banner.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {banner.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => handleEdit(banner)} className="btn btn-small">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="btn btn-small btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div
                    className="banner-preview-small"
                    style={{
                      backgroundColor: banner.backgroundColor || '#ff7a00',
                      color: banner.textColor || '#ffffff',
                    }}
                  >
                    <p>{banner.message}</p>
                    {banner.ctaText && (
                      <span className="preview-cta">{banner.ctaText} →</span>
                    )}
                  </div>

                  <div className="banner-dates">
                    <div>
                      <strong>Valid From:</strong>{' '}
                      {banner.validFrom.toLocaleDateString()}
                    </div>
                    <div>
                      <strong>Valid Until:</strong>{' '}
                      {banner.validUntil ? banner.validUntil.toLocaleDateString() : 'No expiration'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
