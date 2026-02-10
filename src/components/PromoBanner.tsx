'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { PromoBanner as PromoBannerType, BannerLocation } from '@/lib/types'
import Link from 'next/link'
import './PromoBanner.css'
import { logger } from '@/lib/logger';

interface PromoBannerProps {
  location: BannerLocation
}

export default function PromoBanner({ location }: PromoBannerProps) {
  const [banners, setBanners] = useState<PromoBannerType[]>([])
  const [dismissedBanners, setDismissedBanners] = useState<string[]>([])

  useEffect(() => {
    loadBanners()
    // Load dismissed banners from localStorage
    const dismissed = localStorage.getItem('dismissedBanners')
    if (dismissed) {
      setDismissedBanners(JSON.parse(dismissed))
    }
  }, [location])

  const loadBanners = async () => {
    if (!db) return

    try {
      const now = new Date()
      const bannersRef = collection(db, 'promoBanners')

      // Query for active banners at this location or all pages
      const q = query(
        bannersRef,
        where('isActive', '==', true),
        orderBy('displayOrder', 'asc')
      )

      const snapshot = await getDocs(q)
      const loadedBanners: PromoBannerType[] = []

      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        const banner = {
          id: doc.id,
          ...data,
          validFrom: data.validFrom?.toDate() || new Date(),
          validUntil: data.validUntil?.toDate() || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as PromoBannerType

        // Filter by location (show if matches current location or is set to all_pages)
        const matchesLocation = banner.location === location || banner.location === 'all_pages'

        // Filter by date range
        const validFrom = banner.validFrom
        const validUntil = banner.validUntil
        const isValid = now >= validFrom && (!validUntil || now <= validUntil)

        if (matchesLocation && isValid) {
          loadedBanners.push(banner)
        }
      })

      setBanners(loadedBanners)
    } catch (error) {
      logger.error('Error loading banners:', error)
    }
  }

  const dismissBanner = (bannerId: string) => {
    const newDismissed = [...dismissedBanners, bannerId]
    setDismissedBanners(newDismissed)
    localStorage.setItem('dismissedBanners', JSON.stringify(newDismissed))
  }

  const visibleBanners = banners.filter((banner) => !dismissedBanners.includes(banner.id))

  if (visibleBanners.length === 0) return null

  return (
    <div className="promo-banners">
      {visibleBanners.map((banner) => (
        <div
          key={banner.id}
          className="promo-banner"
          style={{
            backgroundColor: banner.backgroundColor || '#ab96dd',
            color: banner.textColor || '#ffffff',
          }}
        >
          <div className="promo-banner-content">
            <div className="promo-banner-text">
              <h3 className="promo-banner-title">{banner.title}</h3>
              <p className="promo-banner-message">{banner.message}</p>
            </div>
            <div className="promo-banner-actions">
              {banner.ctaText && banner.ctaLink && (
                <Link
                  href={banner.ctaLink}
                  className="promo-banner-cta"
                  style={{
                    color: banner.backgroundColor || '#ab96dd',
                    backgroundColor: banner.textColor || '#ffffff',
                  }}
                >
                  {banner.ctaText}
                </Link>
              )}
              <button
                onClick={() => dismissBanner(banner.id)}
                className="promo-banner-dismiss"
                title="Dismiss"
                style={{ color: banner.textColor || '#ffffff' }}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
