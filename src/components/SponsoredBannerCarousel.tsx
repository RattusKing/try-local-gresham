'use client'

import { useEffect, useState, useCallback } from 'react'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { SponsoredBanner } from '@/lib/types'
import Link from 'next/link'
import Image from 'next/image'

interface SponsoredBannerWithBusiness extends SponsoredBanner {
  businessTags?: string[]
  businessNeighborhood?: string
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

      snapshot.forEach((doc) => {
        const data = doc.data()
        const startDate = data.startDate instanceof Timestamp
          ? data.startDate.toDate()
          : new Date(data.startDate)
        const endDate = data.endDate instanceof Timestamp
          ? data.endDate.toDate()
          : new Date(data.endDate)

        // Only include banners within their active date range
        if (now >= startDate && now <= endDate) {
          activeBanners.push({
            id: doc.id,
            ...data,
            startDate,
            endDate,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
          } as SponsoredBannerWithBusiness)
        }
      })

      // Shuffle the banners for variety
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
    }, 400)
  }, [banners.length])

  const goToPrev = useCallback(() => {
    if (banners.length <= 1) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
      setIsTransitioning(false)
    }, 400)
  }, [banners.length])

  // Auto-rotate every 6 seconds
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return

    const interval = setInterval(() => {
      goToNext()
    }, 6000)

    return () => clearInterval(interval)
  }, [banners.length, isPaused, goToNext])

  // Don't render if no active banners
  if (banners.length === 0) {
    return null
  }

  const currentBanner = banners[currentIndex]
  const isTestBanner = currentBanner?.businessId?.startsWith('test-')

  // Render the banner content
  const renderBannerContent = () => (
    <div className="sponsored-hero">
      {/* Background Image with Parallax Effect */}
      <div className="sponsored-bg">
        {currentBanner.businessCover ? (
          <Image
            src={currentBanner.businessCover}
            alt={currentBanner.businessName}
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        ) : (
          <div className="sponsored-bg-gradient" />
        )}
        <div className="sponsored-overlay" />
        <div className="sponsored-shimmer" />
      </div>

      {/* Content */}
      <div className="sponsored-content">
        {/* Premium Badge */}
        <div className="sponsored-badge-wrapper">
          <span className="sponsored-badge">
            <svg className="sponsored-star" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            Featured Business
            <svg className="sponsored-star" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </span>
          {isTestBanner && (
            <span className="test-badge">Preview Mode</span>
          )}
        </div>

        {/* Business Info Card */}
        <div className="sponsored-card">
          <h2 className="sponsored-name">{currentBanner.businessName}</h2>
          {currentBanner.headline && (
            <p className="sponsored-headline">{currentBanner.headline}</p>
          )}
          <div className="sponsored-cta-wrapper">
            {!isTestBanner ? (
              <span className="sponsored-cta">
                Discover More
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            ) : (
              <span className="sponsored-cta-preview">
                This is how your business could look
              </span>
            )}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="sponsored-decor sponsored-decor-1" />
        <div className="sponsored-decor sponsored-decor-2" />
      </div>

      {/* Navigation */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goToPrev(); }}
            className="sponsored-nav sponsored-nav-prev"
            aria-label="Previous"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goToNext(); }}
            className="sponsored-nav sponsored-nav-next"
            aria-label="Next"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {/* Progress Dots */}
      {banners.length > 1 && (
        <div className="sponsored-progress">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsTransitioning(true)
                setTimeout(() => {
                  setCurrentIndex(index)
                  setIsTransitioning(false)
                }, 400)
              }}
              className={`sponsored-dot ${index === currentIndex ? 'active' : ''}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <section
      className="sponsored-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {isTestBanner ? (
        <div className={`sponsored-wrapper ${isTransitioning ? 'transitioning' : ''}`}>
          {renderBannerContent()}
        </div>
      ) : (
        <Link
          href={`/business/${currentBanner.businessId}`}
          className={`sponsored-wrapper ${isTransitioning ? 'transitioning' : ''}`}
        >
          {renderBannerContent()}
        </Link>
      )}

      <style jsx>{`
        .sponsored-section {
          padding: 0;
          margin: 0 auto 2rem;
          max-width: 1400px;
          padding: 0 1rem;
        }

        .sponsored-wrapper {
          display: block;
          text-decoration: none;
          color: inherit;
          border-radius: 24px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 20px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .sponsored-wrapper:hover {
          transform: translateY(-4px);
          box-shadow:
            0 8px 12px -1px rgba(0, 0, 0, 0.15),
            0 30px 60px -12px rgba(0, 0, 0, 0.35);
        }

        .sponsored-wrapper.transitioning {
          opacity: 0;
          transform: scale(0.98);
        }

        .sponsored-hero {
          position: relative;
          min-height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .sponsored-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .sponsored-bg :global(img) {
          transition: transform 8s ease-out;
        }

        .sponsored-wrapper:hover .sponsored-bg :global(img) {
          transform: scale(1.05);
        }

        .sponsored-bg-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
        }

        .sponsored-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(0, 0, 0, 0.7) 0%,
            rgba(0, 0, 0, 0.4) 50%,
            rgba(0, 0, 0, 0.6) 100%
          );
          z-index: 1;
        }

        .sponsored-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            110deg,
            transparent 20%,
            rgba(255, 255, 255, 0.05) 40%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0.05) 60%,
            transparent 80%
          );
          background-size: 200% 100%;
          animation: shimmer 3s ease-in-out infinite;
          z-index: 2;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .sponsored-content {
          position: relative;
          z-index: 10;
          text-align: center;
          padding: 3rem 2rem;
          max-width: 700px;
        }

        .sponsored-badge-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .sponsored-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.9));
          color: #78350f;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          padding: 0.5rem 1rem;
          border-radius: 100px;
          box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);
        }

        .sponsored-star {
          width: 12px;
          height: 12px;
        }

        .test-badge {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0.4rem 0.8rem;
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .sponsored-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 2rem 2.5rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .sponsored-name {
          margin: 0 0 0.75rem;
          font-size: 2.5rem;
          font-weight: 800;
          color: white;
          text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
          line-height: 1.2;
        }

        .sponsored-headline {
          margin: 0 0 1.25rem;
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.6;
          font-weight: 400;
        }

        .sponsored-cta-wrapper {
          display: flex;
          justify-content: center;
        }

        .sponsored-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: #78350f;
          font-size: 0.9rem;
          font-weight: 700;
          padding: 0.75rem 1.5rem;
          border-radius: 100px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);
        }

        .sponsored-cta svg {
          width: 18px;
          height: 18px;
          transition: transform 0.3s ease;
        }

        .sponsored-wrapper:hover .sponsored-cta {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(251, 191, 36, 0.5);
        }

        .sponsored-wrapper:hover .sponsored-cta svg {
          transform: translateX(4px);
        }

        .sponsored-cta-preview {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.85rem;
          font-style: italic;
        }

        .sponsored-decor {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.1));
          filter: blur(40px);
          pointer-events: none;
        }

        .sponsored-decor-1 {
          width: 200px;
          height: 200px;
          top: -50px;
          left: -50px;
        }

        .sponsored-decor-2 {
          width: 150px;
          height: 150px;
          bottom: -30px;
          right: -30px;
        }

        .sponsored-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 20;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          opacity: 0;
        }

        .sponsored-hero:hover .sponsored-nav {
          opacity: 1;
        }

        .sponsored-nav:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-50%) scale(1.1);
        }

        .sponsored-nav svg {
          width: 24px;
          height: 24px;
        }

        .sponsored-nav-prev {
          left: 1.5rem;
        }

        .sponsored-nav-next {
          right: 1.5rem;
        }

        .sponsored-progress {
          position: absolute;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;
          display: flex;
          gap: 0.5rem;
        }

        .sponsored-dot {
          width: 32px;
          height: 4px;
          border-radius: 100px;
          background: rgba(255, 255, 255, 0.3);
          border: none;
          padding: 0;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .sponsored-dot.active {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          width: 48px;
        }

        .sponsored-dot:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        .sponsored-dot.active:hover {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
        }

        @media (max-width: 768px) {
          .sponsored-section {
            padding: 0 0.75rem;
            margin-bottom: 1.5rem;
          }

          .sponsored-wrapper {
            border-radius: 16px;
          }

          .sponsored-hero {
            min-height: 280px;
          }

          .sponsored-content {
            padding: 2rem 1.5rem;
          }

          .sponsored-badge {
            font-size: 0.6rem;
            padding: 0.4rem 0.8rem;
          }

          .sponsored-star {
            width: 10px;
            height: 10px;
          }

          .sponsored-card {
            padding: 1.5rem;
            border-radius: 16px;
          }

          .sponsored-name {
            font-size: 1.75rem;
          }

          .sponsored-headline {
            font-size: 0.95rem;
          }

          .sponsored-cta {
            font-size: 0.85rem;
            padding: 0.65rem 1.25rem;
          }

          .sponsored-nav {
            width: 40px;
            height: 40px;
            opacity: 1;
          }

          .sponsored-nav svg {
            width: 20px;
            height: 20px;
          }

          .sponsored-nav-prev {
            left: 0.75rem;
          }

          .sponsored-nav-next {
            right: 0.75rem;
          }

          .sponsored-progress {
            bottom: 1rem;
          }

          .sponsored-dot {
            width: 24px;
            height: 3px;
          }

          .sponsored-dot.active {
            width: 36px;
          }
        }

        @media (max-width: 480px) {
          .sponsored-hero {
            min-height: 260px;
          }

          .sponsored-badge-wrapper {
            flex-direction: column;
            gap: 0.5rem;
          }

          .sponsored-name {
            font-size: 1.5rem;
          }

          .sponsored-headline {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </section>
  )
}
