'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getFirestore, doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { getApps, initializeApp } from 'firebase/app'
import { UserProfile, Review, Business } from '@/lib/types'
import { formatDate, formatDateShort, formatDateMonthYear } from '@/lib/utils'
import Link from 'next/link'
import './profile.css'

// Initialize Firebase directly in this component to avoid SSR issues
const getDb = () => {
  if (typeof window === 'undefined') return null

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('Firebase config missing:', { hasApiKey: !!firebaseConfig.apiKey, hasProjectId: !!firebaseConfig.projectId })
    return null
  }

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  return getFirestore(app)
}

export default function PublicProfilePage() {
  const params = useParams()
  const userId = params.userId as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [favoritedBusinesses, setFavoritedBusinesses] = useState<Business[]>([])
  const [ownedBusiness, setOwnedBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState<string[]>(['Component mounted'])

  useEffect(() => {
    loadProfile()
  }, [userId])

  const addDebug = (msg: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toISOString().slice(11,19)}: ${msg}`])
  }

  const loadProfile = async () => {
    addDebug(`userId: ${userId || 'MISSING'}`)

    if (!userId) {
      setLoading(false)
      setError('No user ID provided')
      return
    }

    const db = getDb()
    addDebug(`db initialized: ${!!db}`)

    if (!db) {
      setLoading(false)
      setError('Unable to connect to database')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Fetch user profile
      addDebug('Fetching profile...')
      const profileRef = doc(db, 'users', userId)
      const profileSnap = await getDoc(profileRef)
      addDebug(`Profile exists: ${profileSnap.exists()}`)

      if (!profileSnap.exists()) {
        setError('Profile not found')
        setLoading(false)
        return
      }

      const profileData = profileSnap.data() as UserProfile
      addDebug(`Profile loaded: ${profileData.displayName || profileData.email || 'no name'}`)
      setProfile(profileData)

      // Fetch business owner's business if applicable
      if (profileData.businessId) {
        try {
          const businessRef = doc(db, 'businesses', profileData.businessId)
          const businessSnap = await getDoc(businessRef)
          if (businessSnap.exists() && businessSnap.data().status === 'approved') {
            setOwnedBusiness({ ...businessSnap.data(), id: businessSnap.id } as Business)
          }
        } catch {
          // Silently fail - business might not exist
        }
      }

      // Fetch user's reviews
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(10)
      )
      const reviewsSnap = await getDocs(reviewsQuery)
      const reviewsList = reviewsSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Review[]
      addDebug(`Reviews loaded: ${reviewsList.length}`)
      setReviews(reviewsList)

      // Fetch user's favorited businesses (public favorites)
      const favoritesQuery = query(
        collection(db, 'favorites'),
        where('userId', '==', userId),
        where('itemType', '==', 'business'),
        limit(6)
      )
      const favoritesSnap = await getDocs(favoritesQuery)

      // Fetch business details for each favorite
      const businessPromises = favoritesSnap.docs.map(async (favDoc) => {
        if (!db) return null
        const businessRef = doc(db, 'businesses', favDoc.data().itemId)
        const businessSnap = await getDoc(businessRef)
        if (businessSnap.exists() && businessSnap.data().status === 'approved') {
          return { ...businessSnap.data(), id: businessSnap.id } as Business
        }
        return null
      })

      const businesses = (await Promise.all(businessPromises)).filter(Boolean) as Business[]
      setFavoritedBusinesses(businesses)

    } catch (err: any) {
      addDebug(`Error: ${err?.message || String(err)}`)
      setError('Failed to load profile')
    } finally {
      addDebug('loadProfile complete')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>Loading profile...</p>
          {/* Debug info - visible in production */}
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px', fontSize: '0.75rem', fontFamily: 'monospace', textAlign: 'left', maxWidth: '400px' }}>
            <strong>Debug:</strong>
            {debugInfo.map((msg, i) => (
              <div key={i}>{msg}</div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="profile-page">
        <div className="profile-error">
          <h1>Profile Not Found</h1>
          <p>This user profile doesn&apos;t exist or has been removed.</p>
          <p style={{ fontSize: '0.85rem', color: '#666' }}>Error: {error || 'No profile data'}</p>
          {/* Debug info - visible in production */}
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px', fontSize: '0.75rem', fontFamily: 'monospace', textAlign: 'left', maxWidth: '400px' }}>
            <strong>Debug:</strong>
            {debugInfo.map((msg, i) => (
              <div key={i}>{msg}</div>
            ))}
          </div>
          <Link href="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const memberSince = profile.createdAt
    ? formatDateMonthYear(profile.createdAt)
    : 'Unknown'

  return (
    <div className="profile-page">
      {/* Cover Photo */}
      <div
        className="profile-cover"
        style={{
          backgroundImage: profile.coverPhotoURL
            ? `url(${profile.coverPhotoURL})`
            : 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
        }}
      >
        <div className="profile-cover-overlay" />
      </div>

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.photoURL ? (
            <img src={profile.photoURL} alt={profile.displayName || 'User'} />
          ) : (
            <div className="profile-avatar-placeholder">
              {(profile.displayName || profile.email || 'U')[0].toUpperCase()}
            </div>
          )}
        </div>

        <div className="profile-info">
          <h1 className="profile-name">{profile.displayName || 'Community Member'}</h1>
          <p className="profile-meta">
            <span className="profile-role">
              {profile.role?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Member'}
            </span>
            <span className="profile-separator">•</span>
            <span className="profile-joined">Member since {memberSince}</span>
          </p>
        </div>
      </div>

      <div className="profile-content">
        {/* Stats */}
        <div className="profile-stats">
          <div className="stat-card">
            <span className="stat-value">{reviews.length}</span>
            <span className="stat-label">Reviews</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{favoritedBusinesses.length}</span>
            <span className="stat-label">Favorites</span>
          </div>
        </div>

        {/* Business Owner Card */}
        {ownedBusiness && (
          <section className="profile-section">
            <h2>Business Owner</h2>
            <Link href={`/business/${ownedBusiness.id}`} className="owned-business-card">
              <div
                className="owned-business-image"
                style={{
                  backgroundImage: ownedBusiness.cover
                    ? `url(${ownedBusiness.cover})`
                    : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                }}
              >
                {ownedBusiness.logo && (
                  <img src={ownedBusiness.logo} alt="" className="owned-business-logo" />
                )}
              </div>
              <div className="owned-business-info">
                <h3>{ownedBusiness.name}</h3>
                <p className="owned-business-tags">{ownedBusiness.tags?.slice(0, 3).join(' • ')}</p>
                {ownedBusiness.neighborhood && (
                  <p className="owned-business-location">{ownedBusiness.neighborhood}</p>
                )}
                {ownedBusiness.averageRating && ownedBusiness.reviewCount ? (
                  <div className="owned-business-rating">
                    <span className="star filled">★</span>
                    <span>{ownedBusiness.averageRating.toFixed(1)}</span>
                    <span className="review-count">({ownedBusiness.reviewCount} reviews)</span>
                  </div>
                ) : null}
              </div>
              <div className="owned-business-cta">
                Visit Business
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </section>
        )}

        {/* Favorite Businesses */}
        {favoritedBusinesses.length > 0 && (
          <section className="profile-section">
            <h2>Favorite Businesses</h2>
            <div className="favorites-grid">
              {favoritedBusinesses.map((business) => (
                <Link
                  key={business.id}
                  href={`/business/${business.id}`}
                  className="favorite-card"
                >
                  <div
                    className="favorite-image"
                    style={{
                      backgroundImage: business.cover
                        ? `url(${business.cover})`
                        : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    }}
                  />
                  <div className="favorite-info">
                    <h3>{business.name}</h3>
                    <p>{business.tags?.slice(0, 2).join(', ')}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="profile-section">
            <h2>Recent Reviews</h2>
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="review-rating">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < review.rating ? 'star filled' : 'star'}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="review-date">
                      {review.createdAt
                        ? formatDateShort(review.createdAt)
                        : 'Recent'}
                    </span>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                  {review.photos && review.photos.length > 0 && (
                    <div className="review-photos">
                      {review.photos.slice(0, 3).map((photo, index) => (
                        <img key={index} src={photo} alt={`Review photo ${index + 1}`} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {reviews.length === 0 && favoritedBusinesses.length === 0 && (
          <div className="profile-empty">
            <p>This member hasn&apos;t added any reviews or favorites yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
