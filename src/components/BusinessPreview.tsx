'use client'

import { Business } from '@/lib/types'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface BusinessPreviewProps {
  business: Business
  isOpen: boolean
  onClose: () => void
}

export default function BusinessPreview({ business, isOpen, onClose }: BusinessPreviewProps) {
  if (!isOpen) return null

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="preview-modal-header">
          <h2>Business Page Preview</h2>
          <button onClick={onClose} className="preview-close-btn">
            ✕
          </button>
        </div>

        <div className="preview-modal-body">
          <div className="business-profile-preview">
            {/* Header Banner Image */}
            {business.headerImage && (
              <motion.div
                className="business-header-banner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '250px',
                  marginBottom: '1rem'
                }}
              >
                <Image
                  src={business.headerImage}
                  alt={`${business.name} header`}
                  fill
                  style={{ objectFit: 'cover', borderRadius: '8px' }}
                  sizes="(max-width: 768px) 100vw, 900px"
                />
              </motion.div>
            )}

            {/* Hero Section with Cover */}
            <motion.div
              className="business-hero-preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                position: 'relative',
                width: '100%',
                height: '300px',
                marginBottom: '2rem',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <Image
                src={business.cover || '/assets/placeholder.jpg'}
                alt={business.name}
                fill
                style={{ objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                padding: '2rem 1.5rem 1rem',
                color: 'white'
              }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  {business.name}
                </h1>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {business.tags.map((tag, idx) => (
                    <span key={idx} style={{
                      background: 'rgba(255,255,255,0.2)',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      backdropFilter: 'blur(10px)'
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <p style={{ fontSize: '0.875rem' }}>
                  📍 {business.neighborhood ? `${business.neighborhood}, ` : ''}Gresham, OR
                </p>
              </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
              {/* Main Content */}
              <div>
                {/* About Section */}
                {business.description && (
                  <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--secondary-dark)' }}>
                      About
                    </h2>
                    <p style={{ lineHeight: '1.6', color: 'var(--muted)' }}>
                      {business.description}
                    </p>
                  </section>
                )}

                {/* Photo Gallery */}
                {business.gallery && business.gallery.length > 0 && (
                  <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--secondary-dark)' }}>
                      Photo Gallery
                    </h2>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '1rem'
                    }}>
                      {business.gallery.map((imageUrl, index) => (
                        <div key={index} style={{ position: 'relative', width: '100%', height: '200px' }}>
                          <Image
                            src={imageUrl}
                            alt={`Gallery image ${index + 1}`}
                            fill
                            style={{ objectFit: 'cover', borderRadius: '8px' }}
                            sizes="200px"
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Products/Services Placeholder */}
                <section style={{ marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--secondary-dark)' }}>
                    Products & Services
                  </h2>
                  <div style={{
                    padding: '2rem',
                    background: 'var(--light)',
                    borderRadius: '8px',
                    textAlign: 'center',
                    color: 'var(--muted)'
                  }}>
                    <p>Your products and services will appear here once you add them.</p>
                  </div>
                </section>

                {/* Reviews Placeholder */}
                <section>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--secondary-dark)' }}>
                    Customer Reviews
                  </h2>
                  <div style={{
                    padding: '2rem',
                    background: 'var(--light)',
                    borderRadius: '8px',
                    textAlign: 'center',
                    color: 'var(--muted)'
                  }}>
                    <p>Customer reviews will appear here.</p>
                  </div>
                </section>
              </div>

              {/* Sidebar */}
              <aside>
                {/* Contact Info Card */}
                <div style={{
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  marginBottom: '1rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--secondary-dark)' }}>
                    Contact Information
                  </h3>

                  {business.hours && (
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.25rem' }}>🕒</span>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Hours</strong>
                        <p style={{ color: 'var(--muted)', margin: 0 }}>{business.hours}</p>
                      </div>
                    </div>
                  )}

                  {business.phone && (
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.25rem' }}>📞</span>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Phone</strong>
                        <a href={`tel:${business.phone}`} style={{ color: 'var(--primary)' }}>
                          {business.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {business.email && (
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.25rem' }}>✉️</span>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Email</strong>
                        <a href={`mailto:${business.email}`} style={{ color: 'var(--primary)' }}>
                          {business.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {business.address && (
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.25rem' }}>📍</span>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Address</strong>
                        <p style={{ color: 'var(--muted)', margin: 0 }}>{business.address}</p>
                      </div>
                    </div>
                  )}

                  {business.website && (
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.25rem' }}>🌐</span>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Website</strong>
                        <a
                          href={business.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--primary)' }}
                        >
                          Visit Website
                        </a>
                      </div>
                    </div>
                  )}

                  {business.instagram && (
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.25rem' }}>📸</span>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Instagram</strong>
                        <a
                          href={`https://instagram.com/${business.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--primary)' }}
                        >
                          {business.instagram}
                        </a>
                      </div>
                    </div>
                  )}

                  {business.map && (
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.25rem' }}>🗺️</span>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Location</strong>
                        <a
                          href={business.map}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--primary)' }}
                        >
                          View on Map
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </div>

        <style jsx>{`
          .preview-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.75);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 1rem;
            overflow-y: auto;
          }

          .preview-modal-content {
            background: white;
            border-radius: 12px;
            width: 100%;
            max-width: 1400px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          }

          .preview-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid var(--border);
          }

          .preview-modal-header h2 {
            margin: 0;
            font-size: 1.5rem;
            color: var(--secondary-dark);
          }

          .preview-close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--muted);
            padding: 0.5rem;
            width: 2.5rem;
            height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: all 0.2s;
          }

          .preview-close-btn:hover {
            background: var(--light);
            color: var(--dark);
          }

          .preview-modal-body {
            flex: 1;
            overflow-y: auto;
            padding: 2rem;
            background: #f9fafb;
          }

          @media (max-width: 768px) {
            .preview-modal-content {
              max-width: 100%;
              max-height: 100vh;
              border-radius: 0;
            }

            .business-profile-preview > div {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </div>
  )
}
