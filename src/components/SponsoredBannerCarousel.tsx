'use client'

import { useEffect, useState, useCallback } from 'react'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { SponsoredBanner } from '@/lib/types'
import Link from 'next/link'

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

    const interval = setInterval(() => {
      goToNext()
    }, 5000)

    return () => clearInterval(interval)
  }, [banners.length, isPaused, goToNext])

  // Don't render if no active banners
  if (banners.length === 0) {
    return null
  }

  const currentBanner = banners[currentIndex]

  return (
    <section
      className="sponsored-carousel-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container">
        <div className="sponsored-carousel-header">
          <span className="sponsored-label">Featured Business</span>
          {banners.length > 1 && (
            <div className="sponsored-counter">
              {currentIndex + 1} / {banners.length}
            </div>
          )}
        </div>

        <div className="sponsored-carousel-wrapper">
          {/* Previous Button */}
          {banners.length > 1 && (
            <button
              onClick={goToPrev}
              className="sponsored-nav-btn sponsored-nav-prev"
              aria-label="Previous sponsored business"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* Banner Content */}
          <Link
            href={`/business/${currentBanner.businessId}`}
            className={`sponsored-banner-card ${isTransitioning ? 'transitioning' : ''}`}
          >
            <div
              className="sponsored-banner-image"
              style={{
                backgroundImage: currentBanner.businessCover
                  ? `url(${currentBanner.businessCover})`
                  : 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)'
              }}
            >
              <div className="sponsored-banner-overlay" />
            </div>
            <div className="sponsored-banner-content">
              <h3 className="sponsored-banner-name">{currentBanner.businessName}</h3>
              {currentBanner.headline && (
                <p className="sponsored-banner-headline">{currentBanner.headline}</p>
              )}
              <span className="sponsored-banner-cta">
                Visit Business
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>

          {/* Next Button */}
          {banners.length > 1 && (
            <button
              onClick={goToNext}
              className="sponsored-nav-btn sponsored-nav-next"
              aria-label="Next sponsored business"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>

        {/* Dots indicator */}
        {banners.length > 1 && (
          <div className="sponsored-dots">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsTransitioning(true)
                  setTimeout(() => {
                    setCurrentIndex(index)
                    setIsTransitioning(false)
                  }, 300)
                }}
                className={`sponsored-dot ${index === currentIndex ? 'active' : ''}`}
                aria-label={`Go to sponsored business ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .sponsored-carousel-section {
          padding: 1.5rem 0 2rem;
          background: linear-gradient(135deg, rgba(153, 237, 195, 0.1) 0%, rgba(194, 175, 240, 0.1) 100%);
        }

        .sponsored-carousel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .sponsored-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--muted);
          background: white;
          padding: 0.35rem 0.75rem;
          border-radius: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .sponsored-counter {
          font-size: 0.875rem;
          color: var(--muted);
          font-weight: 500;
        }

        .sponsored-carousel-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .sponsored-nav-btn {
          position: absolute;
          z-index: 10;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: white;
          border: none;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--dark);
          transition: all 0.2s;
        }

        .sponsored-nav-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }

        .sponsored-nav-prev {
          left: -20px;
        }

        .sponsored-nav-next {
          right: -20px;
        }

        .sponsored-banner-card {
          flex: 1;
          display: flex;
          align-items: stretch;
          background: white;
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          text-decoration: none;
          color: inherit;
          transition: all 0.3s ease;
          min-height: 140px;
        }

        .sponsored-banner-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        }

        .sponsored-banner-card.transitioning {
          opacity: 0;
          transform: translateX(20px);
        }

        .sponsored-banner-image {
          position: relative;
          width: 280px;
          min-width: 280px;
          background-size: cover;
          background-position: center;
        }

        .sponsored-banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 100%);
        }

        .sponsored-banner-content {
          flex: 1;
          padding: 1.5rem 2rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .sponsored-banner-name {
          margin: 0 0 0.5rem;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--dark);
        }

        .sponsored-banner-headline {
          margin: 0 0 1rem;
          font-size: 1rem;
          color: var(--muted);
          line-height: 1.5;
        }

        .sponsored-banner-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--primary-dark);
        }

        .sponsored-dots {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .sponsored-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(0,0,0,0.2);
          border: none;
          padding: 0;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sponsored-dot.active {
          background: var(--primary);
          transform: scale(1.2);
        }

        .sponsored-dot:hover {
          background: var(--primary-dark);
        }

        @media (max-width: 768px) {
          .sponsored-carousel-section {
            padding: 1rem 0 1.5rem;
          }

          .sponsored-nav-btn {
            width: 32px;
            height: 32px;
          }

          .sponsored-nav-prev {
            left: -10px;
          }

          .sponsored-nav-next {
            right: -10px;
          }

          .sponsored-banner-card {
            flex-direction: column;
            min-height: auto;
          }

          .sponsored-banner-image {
            width: 100%;
            min-width: 100%;
            height: 120px;
          }

          .sponsored-banner-overlay {
            background: linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.5) 100%);
          }

          .sponsored-banner-content {
            padding: 1rem 1.25rem 1.25rem;
          }

          .sponsored-banner-name {
            font-size: 1.25rem;
          }

          .sponsored-banner-headline {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </section>
  )
}
