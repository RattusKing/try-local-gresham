'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db } from '@/lib/firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import { Business } from '@/lib/types'
import { motion } from 'framer-motion'
import './business-profile.css'

export default function BusinessProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadBusiness()
  }, [params.id])

  const loadBusiness = async () => {
    if (!params.id || !db) return

    try {
      setLoading(true)
      const businessRef = doc(db, 'businesses', params.id as string)
      const businessSnap = await getDoc(businessRef)

      if (businessSnap.exists()) {
        const data = businessSnap.data() as Business

        // Only show approved businesses (or allow owners/admins to see their own)
        if (data.status !== 'approved') {
          setError('This business is not available.')
          return
        }

        setBusiness({ ...data, id: businessSnap.id })
      } else {
        setError('Business not found')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="business-profile-loading">
        <div className="spinner"></div>
        <p>Loading business...</p>
      </div>
    )
  }

  if (error || !business) {
    return (
      <div className="business-profile-error">
        <h1>😔 Oops!</h1>
        <p>{error || 'Business not found'}</p>
        <button onClick={() => router.push('/')} className="btn-back">
          ← Back to Home
        </button>
      </div>
    )
  }

  return (
    <div className="business-profile">
      {/* Hero Section */}
      <motion.div
        className="business-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <img src={business.cover} alt={business.name} className="business-hero-image" />
        <div className="business-hero-overlay">
          <div className="business-hero-content">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {business.name}
            </motion.h1>
            <motion.div
              className="business-hero-tags"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {business.tags.map((tag, idx) => (
                <span key={idx} className="tag">
                  {tag}
                </span>
              ))}
            </motion.div>
            <motion.p
              className="business-hero-neighborhood"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              📍 {business.neighborhood}
            </motion.p>
          </div>
        </div>
      </motion.div>

      <div className="business-profile-container">
        <div className="business-profile-main">
          {/* About Section */}
          {business.description && (
            <motion.section
              className="business-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2>About</h2>
              <p className="business-description">{business.description}</p>
            </motion.section>
          )}

          {/* Products/Services Section (Placeholder) */}
          <motion.section
            className="business-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2>Products & Services</h2>
            <div className="products-placeholder">
              <p>Coming soon! This business will be able to showcase their products and services here.</p>
            </div>
          </motion.section>

          {/* Reviews Section (Placeholder) */}
          <motion.section
            className="business-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h2>Customer Reviews</h2>
            <div className="reviews-placeholder">
              <p>No reviews yet. Be the first to review this business!</p>
            </div>
          </motion.section>
        </div>

        {/* Sidebar */}
        <motion.aside
          className="business-profile-sidebar"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* Contact Info */}
          <div className="business-info-card">
            <h3>Contact Information</h3>

            {business.hours && (
              <div className="info-item">
                <span className="info-icon">🕒</span>
                <div className="info-content">
                  <strong>Hours</strong>
                  <p>{business.hours}</p>
                </div>
              </div>
            )}

            {business.phone && (
              <div className="info-item">
                <span className="info-icon">📞</span>
                <div className="info-content">
                  <strong>Phone</strong>
                  <a href={`tel:${business.phone}`}>{business.phone}</a>
                </div>
              </div>
            )}

            {business.website && (
              <div className="info-item">
                <span className="info-icon">🌐</span>
                <div className="info-content">
                  <strong>Website</strong>
                  <a href={business.website} target="_blank" rel="noopener noreferrer">
                    Visit Website
                  </a>
                </div>
              </div>
            )}

            {business.map && (
              <div className="info-item">
                <span className="info-icon">📍</span>
                <div className="info-content">
                  <strong>Location</strong>
                  <a href={business.map} target="_blank" rel="noopener noreferrer">
                    View on Map
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Map Embed */}
          {business.map && (
            <div className="business-map-card">
              <h3>Location</h3>
              <div className="map-container">
                <a
                  href={business.map}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-link"
                >
                  <img src={business.cover} alt="Location" className="map-placeholder" />
                  <div className="map-overlay">
                    <span>📍 Open in Maps</span>
                  </div>
                </a>
              </div>
            </div>
          )}
        </motion.aside>
      </div>
    </div>
  )
}
