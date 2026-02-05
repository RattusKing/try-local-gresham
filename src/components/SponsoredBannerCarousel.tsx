'use client'

import { useEffect, useState, useCallback } from 'react'
import { collection, query, where, getDocs, getDoc, doc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { SponsoredBanner } from '@/lib/types'
import Link from 'next/link'
import Image from 'next/image'

interface SponsoredBannerWithBusiness extends SponsoredBanner {
  businessTags?: string[]
  businessNeighborhood?: string
  businessLogo?: string
  businessHeaderImage?: string
  businessCoverLive?: string // Live cover from business profile
}

export default function SponsoredBannerCarousel() {
  const [banners, setBanners] = useState<SponsoredBannerWithBusiness[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    loadActiveBanners()
  }, [])

  const loadActiveBanners = async () => {
    if (!db) return

    try {
      const now = new Date()
      const bannersRef = collection(db, 'sponsoredBanners')
      const q = query(
        bannersRef,
        where('status', '==', 'active'),
        where('isPaid', '==', true)
      )

      const snapshot = await getDocs(q)
      const activeBanners: SponsoredBannerWithBusiness[] = []

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data()
        const startDate = data.startDate instanceof Timestamp
          ? data.startDate.toDate()
          : new Date(data.startDate)
        const endDate = data.endDate instanceof Timestamp
          ? data.endDate.toDate()
          : new Date(data.endDate)

        if (now >= startDate && now <= endDate) {
          // Fetch business data for logo and images
          let businessLogo: string | undefined
          let businessTags: string[] | undefined
          let businessNeighborhood: string | undefined
          let businessHeaderImage: string | undefined
          let businessCoverLive: string | undefined
          try {
            const bizDoc = await getDoc(doc(db, 'businesses', data.businessId))
            if (bizDoc.exists()) {
              const bizData = bizDoc.data()
              businessLogo = bizData.logo
              businessTags = bizData.tags
              businessNeighborhood = bizData.neighborhood
              businessHeaderImage = bizData.headerImage
              businessCoverLive = bizData.cover
            }
          } catch {}

          activeBanners.push({
            id: docSnap.id,
            ...data,
            startDate,
            endDate,
            businessLogo,
            businessTags,
            businessNeighborhood,
            businessHeaderImage,
            businessCoverLive,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
          } as SponsoredBannerWithBusiness)
        }
      }

      const shuffled = activeBanners.sort(() => Math.random() - 0.5)
      setBanners(shuffled)
    } catch (error) {
      console.error('Error loading sponsored banners:', error)
    }
  }

  const goToNext = useCallback(() => {
    if (banners.length <= 1) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
      setIsTransitioning(false)
    }, 300)
  }, [banners.length])

  const goToPrev = useCallback(() => {
    if (banners.length <= 1) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
      setIsTransitioning(false)
    }, 300)
  }, [banners.length])

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return
    const interval = setInterval(goToNext, 5000)
    return () => clearInterval(interval)
  }, [banners.length, isPaused, goToNext])

  if (banners.length === 0) return null

  const banner = banners[currentIndex]
  const isTest = banner?.businessId?.startsWith('test-')

  // Prioritize live business images over stored ones
  const headerImage = banner.businessHeaderImage || banner.businessCoverLive || banner.businessCover
  const logoImage = banner.businessLogo

  const content = (
    <div className="sp-banner-inner">
      {/* Background image - uses header/cover from live business profile */}
      <div className="sp-banner-bg">
        {headerImage ? (
          <Image
            src={headerImage}
            alt={banner.businessName}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 768px) 100vw, 800px"
          />
        ) : (
          <div className="sp-banner-bg-fallback" />
        )}
        <div className="sp-banner-overlay" />
      </div>

      {/* Content row */}
      <div className="sp-banner-content">
        {/* Logo - uses business profile picture */}
        {(logoImage || headerImage) && (
          <div className="sp-banner-logo">
            <Image
              src={logoImage || headerImage || ''}
              alt={`${banner.businessName} logo`}
              fill
              style={{ objectFit: 'cover' }}
              sizes="56px"
            />
          </div>
        )}

        {/* Text */}
        <div className="sp-banner-text">
          <div className="sp-banner-label">
            <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            Featured
          </div>
          <h3 className="sp-banner-name">{banner.businessName}</h3>
          {banner.headline && (
            <p className="sp-banner-headline">{banner.headline}</p>
          )}
        </div>

        {/* CTA */}
        <div className="sp-banner-cta-area">
          {!isTest ? (
            <span className="sp-banner-cta">
              Visit
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          ) : (
            <span className="sp-banner-preview">Preview</span>
          )}
        </div>
      </div>

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goToPrev() }}
            className="sp-banner-nav sp-banner-nav-prev"
            aria-label="Previous"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goToNext() }}
            className="sp-banner-nav sp-banner-nav-next"
            aria-label="Next"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="sp-banner-dots">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsTransitioning(true)
                setTimeout(() => { setCurrentIndex(i); setIsTransitioning(false) }, 300)
              }}
              className={`sp-banner-dot ${i === currentIndex ? 'active' : ''}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <section
      className="sp-banner-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {isTest ? (
        <div className={`sp-banner-wrapper ${isTransitioning ? 'transitioning' : ''}`}>
          {content}
        </div>
      ) : (
        <Link
          href={`/business/${banner.businessId}`}
          className={`sp-banner-wrapper ${isTransitioning ? 'transitioning' : ''}`}
        >
          {content}
        </Link>
      )}

      <style jsx>{`
        .sp-banner-section {
          max-width: 800px;
          margin: 0 auto 1.5rem;
          padding: 0 1rem;
        }

        .sp-banner-wrapper {
          display: block;
          text-decoration: none;
          color: inherit;
          border-radius: 14px;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
        }

        .sp-banner-wrapper:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.18);
        }

        .sp-banner-wrapper.transitioning {
          opacity: 0;
          transform: scale(0.98);
        }

        .sp-banner-inner {
          position: relative;
          height: 120px;
          display: flex;
          align-items: center;
          overflow: hidden;
          background: #1a1a2e;
        }

        .sp-banner-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .sp-banner-bg :global(img) {
          transition: transform 6s ease-out;
        }

        .sp-banner-wrapper:hover .sp-banner-bg :global(img) {
          transform: scale(1.05);
        }

        .sp-banner-bg-fallback {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .sp-banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.75) 0%,
            rgba(0, 0, 0, 0.5) 50%,
            rgba(0, 0, 0, 0.3) 100%
          );
          z-index: 1;
        }

        .sp-banner-content {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0 1.5rem;
          width: 100%;
        }

        .sp-banner-logo {
          position: relative;
          width: 56px;
          height: 56px;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.4);
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .sp-banner-text {
          flex: 1;
          min-width: 0;
        }

        .sp-banner-label {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.6rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #fbbf24;
          margin-bottom: 0.2rem;
        }

        .sp-banner-label svg {
          width: 9px;
          height: 9px;
        }

        .sp-banner-name {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        }

        .sp-banner-headline {
          margin: 0.15rem 0 0;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.75);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.4;
        }

        .sp-banner-cta-area {
          flex-shrink: 0;
        }

        .sp-banner-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: #78350f;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 0.5rem 1rem;
          border-radius: 100px;
          transition: all 0.2s ease;
        }

        .sp-banner-cta svg {
          width: 14px;
          height: 14px;
          transition: transform 0.2s;
        }

        .sp-banner-wrapper:hover .sp-banner-cta svg {
          transform: translateX(2px);
        }

        .sp-banner-preview {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          font-style: italic;
        }

        /* Nav Arrows */
        .sp-banner-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 20;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: all 0.2s ease;
        }

        .sp-banner-inner:hover .sp-banner-nav {
          opacity: 1;
        }

        .sp-banner-nav:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .sp-banner-nav svg {
          width: 14px;
          height: 14px;
        }

        .sp-banner-nav-prev { left: 0.5rem; }
        .sp-banner-nav-next { right: 0.5rem; }

        /* Dots */
        .sp-banner-dots {
          position: absolute;
          bottom: 0.5rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;
          display: flex;
          gap: 0.35rem;
        }

        .sp-banner-dot {
          width: 20px;
          height: 3px;
          border-radius: 100px;
          background: rgba(255, 255, 255, 0.3);
          border: none;
          padding: 0;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .sp-banner-dot.active {
          background: #fbbf24;
          width: 32px;
        }

        .sp-banner-dot:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        .sp-banner-dot.active:hover {
          background: #fbbf24;
        }

        @media (max-width: 640px) {
          .sp-banner-section {
            padding: 0 0.75rem;
            margin-bottom: 1rem;
          }

          .sp-banner-wrapper {
            border-radius: 10px;
          }

          .sp-banner-inner {
            height: 100px;
          }

          .sp-banner-content {
            gap: 0.75rem;
            padding: 0 1rem;
          }

          .sp-banner-logo {
            width: 44px;
            height: 44px;
            border-radius: 10px;
          }

          .sp-banner-name {
            font-size: 1rem;
          }

          .sp-banner-headline {
            font-size: 0.75rem;
          }

          .sp-banner-cta {
            font-size: 0.75rem;
            padding: 0.4rem 0.75rem;
          }

          .sp-banner-nav {
            opacity: 1;
            width: 24px;
            height: 24px;
          }

          .sp-banner-nav svg {
            width: 12px;
            height: 12px;
          }
        }
      `}</style>
    </section>
  )
}
