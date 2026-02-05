'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase/config'
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { UserProfile, Review, Business } from '@/lib/types'
import { formatDate, formatDateShort, formatDateMonthYear } from '@/lib/utils'
import Link from 'next/link'
import './profile.css'

export default function PublicProfilePage() {
  const params = useParams()
  const userId = params.userId as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [favoritedBusinesses, setFavoritedBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    if (!db || !userId) return

    try {
      setLoading(true)
      setError('')

      // Fetch user profile
      const profileRef = doc(db, 'users', userId)
      const profileSnap = await getDoc(profileRef)

      if (!profileSnap.exists()) {
        setError('Profile not found')
        setLoading(false)
        return
      }

      const profileData = profileSnap.data() as UserProfile
      setProfile(profileData)

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
      console.error('Error loading profile:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>Loading profile...</p>
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
          <Link href="/" className="btn btn-primary">
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
