'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db } from '@/lib/firebase/config'
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore'
import { Business, Product, Review, Service } from '@/lib/types'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/firebase/auth-context'
import { useCart } from '@/lib/cart-context'
import StarRating from '@/components/StarRating'
import PromoBanner from '@/components/PromoBanner'
import { LocalBusinessSchema, ProductSchema, BreadcrumbSchema } from '@/components/StructuredData'
import AppointmentBookingModal from '@/components/AppointmentBookingModal'
import Head from 'next/head'
import './business-profile.css'

export default function BusinessProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { addItem } = useCart()
  const [business, setBusiness] = useState<Business | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [addedToCart, setAddedToCart] = useState<string | null>(null)
  const [favoritedProductIds, setFavoritedProductIds] = useState<Set<string>>(new Set())
  const [showBookingModal, setShowBookingModal] = useState(false)

  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    comment: '',
  })

  useEffect(() => {
    loadBusiness()
  }, [params.id])

  // Load user's product favorites
  useEffect(() => {
    if (user) {
      loadProductFavorites()
    } else {
      setFavoritedProductIds(new Set())
    }
  }, [user])

  const loadProductFavorites = async () => {
    if (!db || !user) return

    try {
      const favoritesRef = collection(db, 'favorites')
      const q = query(
        favoritesRef,
        where('userId', '==', user.uid),
        where('itemType', '==', 'product')
      )
      const snapshot = await getDocs(q)
      const favoriteIds = new Set(snapshot.docs.map((doc) => doc.data().itemId))
      setFavoritedProductIds(favoriteIds)
    } catch (error) {
      console.error('Error loading product favorites:', error)
    }
  }

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

        // Load products for this business
        await loadProducts(businessSnap.id)

        // Load services for this business
        await loadServices(businessSnap.id)

        // Load reviews for this business
        await loadReviews(businessSnap.id)
      } else {
        setError('Business not found')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async (businessId: string) => {
    if (!db) return

    try {
      const productsQuery = query(
        collection(db, 'products'),
        where('businessId', '==', businessId),
        where('inStock', '==', true)
      )
      const productsSnap = await getDocs(productsQuery)
      const productsList = productsSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Product[]

      setProducts(productsList)
    } catch (err: any) {
      console.error('Error loading products:', err)
    }
  }

  const loadServices = async (businessId: string) => {
    if (!db) return

    try {
      const servicesQuery = query(
        collection(db, 'services'),
        where('businessId', '==', businessId),
        where('isActive', '==', true)
      )
      const servicesSnap = await getDocs(servicesQuery)
      const servicesList = servicesSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Service[]

      setServices(servicesList)
    } catch (err: any) {
      console.error('Error loading services:', err)
    }
  }

  const loadReviews = async (businessId: string) => {
    if (!db) return

    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('businessId', '==', businessId),
        orderBy('createdAt', 'desc')
      )
      const reviewsSnap = await getDocs(reviewsQuery)
      const reviewsList = reviewsSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Review[]

      setReviews(reviewsList)

      // Check if user has already reviewed
      if (user) {
        const userReview = reviewsList.find((r) => r.userId === user.uid)
        if (userReview) {
          setEditingReview(userReview)
          setReviewForm({
            rating: userReview.rating,
            comment: userReview.comment,
          })
        }
      }
    } catch (err: any) {
      console.error('Error loading reviews:', err)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db || !business) return

    if (reviewForm.rating === 0) {
      setReviewError('Please select a rating')
      return
    }

    try {
      setSubmittingReview(true)
      setReviewError('')
      setReviewSuccess('')

      const reviewData = {
        businessId: business.id,
        userId: user.uid,
        userName: user.displayName || user.email || 'Anonymous',
        userPhotoURL: user.photoURL || undefined,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        updatedAt: new Date(),
      }

      if (editingReview) {
        // Update existing review
        const reviewRef = doc(db, 'reviews', editingReview.id)
        await updateDoc(reviewRef, reviewData)
        setReviewSuccess('Review updated successfully!')
      } else {
        // Create new review
        await addDoc(collection(db, 'reviews'), {
          ...reviewData,
          createdAt: new Date(),
        })
        setReviewSuccess('Review submitted successfully!')
      }

      // Reload reviews
      await loadReviews(business.id)

      // Update business average rating
      await updateBusinessRating(business.id)
    } catch (err: any) {
      setReviewError(err.message)
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!db || !business) return
    if (!confirm('Are you sure you want to delete your review?')) return

    try {
      await deleteDoc(doc(db, 'reviews', reviewId))
      setReviewSuccess('Review deleted successfully!')
      setEditingReview(null)
      setReviewForm({ rating: 0, comment: '' })

      // Reload reviews
      await loadReviews(business.id)

      // Update business average rating
      await updateBusinessRating(business.id)
    } catch (err: any) {
      setReviewError(err.message)
    }
  }

  const updateBusinessRating = async (businessId: string) => {
    if (!db) return

    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('businessId', '==', businessId)
      )
      const reviewsSnap = await getDocs(reviewsQuery)
      const allReviews = reviewsSnap.docs.map((doc) => doc.data() as Review)

      if (allReviews.length > 0) {
        const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0)
        const averageRating = totalRating / allReviews.length

        const businessRef = doc(db, 'businesses', businessId)
        await updateDoc(businessRef, {
          averageRating: parseFloat(averageRating.toFixed(1)),
          reviewCount: allReviews.length,
        })
      }
    } catch (err: any) {
      console.error('Error updating business rating:', err)
    }
  }

  const handleAddToCart = (product: Product) => {
    if (!business) return

    // Check if product tracks inventory and is out of stock
    if (product.trackInventory && product.stockQuantity !== undefined && product.stockQuantity <= 0) {
      alert('Sorry, this product is currently out of stock.')
      return
    }

    addItem({
      productId: product.id,
      businessId: business.id,
      businessName: business.name,
      productName: product.name,
      productImage: product.image,
      price: product.price,
    })

    setAddedToCart(product.id)
    setTimeout(() => setAddedToCart(null), 2000)
  }

  const handleProductFavorite = async (product: Product) => {
    if (!user) {
      alert('Please sign in to save favorites')
      return
    }

    if (!db || !business) return

    try {
      const favoritesRef = collection(db, 'favorites')

      // Check if already favorited
      const q = query(
        favoritesRef,
        where('userId', '==', user.uid),
        where('itemId', '==', product.id),
        where('itemType', '==', 'product')
      )
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        // Remove from favorites
        await deleteDoc(doc(db, 'favorites', snapshot.docs[0].id))
        const newFavorites = new Set(favoritedProductIds)
        newFavorites.delete(product.id)
        setFavoritedProductIds(newFavorites)
      } else {
        // Add to favorites
        await addDoc(favoritesRef, {
          userId: user.uid,
          itemId: product.id,
          itemType: 'product',
          itemName: product.name,
          itemImage: product.image,
          businessName: business.name,
          createdAt: new Date(),
        })
        const newFavorites = new Set(favoritedProductIds)
        newFavorites.add(product.id)
        setFavoritedProductIds(newFavorites)
      }
    } catch (error) {
      console.error('Error updating product favorite:', error)
      alert('Failed to update favorite. Please try again.')
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
    <>
      <Head>
        <title>{business.name} | Try Local Gresham</title>
        <meta name="description" content={business.description || `${business.name} - Local business in Gresham, Oregon. ${business.tags.join(', ')}`} />
        <meta name="keywords" content={`${business.name}, ${business.tags.join(', ')}, Gresham, Oregon, local business`} />

        {/* Open Graph */}
        <meta property="og:title" content={`${business.name} | Try Local Gresham`} />
        <meta property="og:description" content={business.description || `${business.name} - Local business in Gresham, Oregon`} />
        <meta property="og:image" content={business.cover || '/assets/gresham.jpg'} />
        <meta property="og:url" content={`https://try-local.com/business/${business.id}`} />
        <meta property="og:type" content="business.business" />
        <meta property="business:contact_data:street_address" content={business.neighborhood || 'Gresham'} />
        <meta property="business:contact_data:locality" content="Gresham" />
        <meta property="business:contact_data:region" content="OR" />
        <meta property="business:contact_data:country_name" content="USA" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${business.name} | Try Local Gresham`} />
        <meta name="twitter:description" content={business.description || `${business.name} - Local business in Gresham, Oregon`} />
        <meta name="twitter:image" content={business.cover || '/assets/gresham.jpg'} />

        <link rel="canonical" content={`https://try-local.com/business/${business.id}`} />
      </Head>

      <PromoBanner location="business_pages" />

      <div className="business-profile">
        {/* Structured Data for SEO */}
        <LocalBusinessSchema business={business} />
        <BreadcrumbSchema items={[
          { name: 'Home', url: '/' },
          { name: business.name, url: `/business/${business.id}` },
        ]} />
        {products.map((product) => (
          <ProductSchema key={product.id} product={product} business={business} />
        ))}

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

          {/* Products/Services Section */}
          <motion.section
            className="business-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2>Products & Services</h2>
            {products.length === 0 ? (
              <div className="products-placeholder">
                <p>No products or services listed yet.</p>
              </div>
            ) : (
              <div className="products-display">
                {products.map((product) => (
                  <div key={product.id} className="product-item">
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="product-item-image"
                      />
                    )}
                    <div className="product-item-content">
                      <div className="product-item-header">
                        <h4>{product.name}</h4>
                        <span className="product-item-price">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                      {product.category && (
                        <span className="product-item-category">{product.category}</span>
                      )}
                      {product.description && (
                        <p className="product-item-description">{product.description}</p>
                      )}
                      {product.trackInventory && product.stockQuantity !== undefined && (
                        <div style={{
                          fontSize: '0.875rem',
                          marginTop: '0.5rem',
                          color: product.stockQuantity === 0
                            ? '#dc2626'
                            : product.lowStockThreshold && product.stockQuantity <= product.lowStockThreshold
                            ? '#f59e0b'
                            : '#059669'
                        }}>
                          {product.stockQuantity === 0
                            ? '✗ Out of Stock'
                            : product.lowStockThreshold && product.stockQuantity <= product.lowStockThreshold
                            ? `⚠️ Only ${product.stockQuantity} left`
                            : `✓ ${product.stockQuantity} in stock`
                          }
                        </div>
                      )}
                      <div className="product-item-actions">
                        <button
                          className="btn btn-primary"
                          onClick={() => handleAddToCart(product)}
                          disabled={addedToCart === product.id || (product.trackInventory && product.stockQuantity !== undefined && product.stockQuantity <= 0)}
                          style={{
                            opacity: (product.trackInventory && product.stockQuantity !== undefined && product.stockQuantity <= 0) ? 0.5 : 1,
                            cursor: (product.trackInventory && product.stockQuantity !== undefined && product.stockQuantity <= 0) ? 'not-allowed' : 'pointer',
                            flex: 1
                          }}
                        >
                          {(product.trackInventory && product.stockQuantity !== undefined && product.stockQuantity <= 0)
                            ? '✗ Out of Stock'
                            : addedToCart === product.id
                            ? '✓ Added!'
                            : '🛒 Add to Cart'}
                        </button>
                        <button
                          className={favoritedProductIds.has(product.id) ? 'btn btn-favorite-active' : 'btn btn-outline'}
                          onClick={() => handleProductFavorite(product)}
                          title={favoritedProductIds.has(product.id) ? 'Remove from favorites' : 'Save to favorites'}
                        >
                          {favoritedProductIds.has(product.id) ? '❤️' : '🤍'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.section>

          {/* Reviews Section */}
          <motion.section
            className="business-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="reviews-header">
              <h2>Customer Reviews</h2>
              {business.averageRating && business.reviewCount ? (
                <div className="reviews-summary">
                  <StarRating rating={business.averageRating} readonly size="medium" />
                  <span className="reviews-average">{business.averageRating.toFixed(1)}</span>
                  <span className="reviews-count">({business.reviewCount} reviews)</span>
                </div>
              ) : null}
            </div>

            {/* Review Form */}
            {user ? (
              <div className="review-form-container">
                <h3>{editingReview ? 'Update Your Review' : 'Write a Review'}</h3>
                {reviewError && <div className="alert alert-error">{reviewError}</div>}
                {reviewSuccess && <div className="alert alert-success">{reviewSuccess}</div>}
                <form onSubmit={handleSubmitReview} className="review-form">
                  <div className="form-group">
                    <label>Your Rating *</label>
                    <StarRating
                      rating={reviewForm.rating}
                      onRatingChange={(rating) =>
                        setReviewForm({ ...reviewForm, rating })
                      }
                      size="large"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="comment">Your Review</label>
                    <textarea
                      id="comment"
                      value={reviewForm.comment}
                      onChange={(e) =>
                        setReviewForm({ ...reviewForm, comment: e.target.value })
                      }
                      rows={4}
                      placeholder="Share your experience with this business..."
                      required
                    />
                  </div>
                  <div className="review-form-actions">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={submittingReview}
                    >
                      {submittingReview
                        ? 'Submitting...'
                        : editingReview
                        ? 'Update Review'
                        : 'Submit Review'}
                    </button>
                    {editingReview && (
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => handleDeleteReview(editingReview.id)}
                      >
                        Delete Review
                      </button>
                    )}
                  </div>
                </form>
              </div>
            ) : (
              <div className="review-login-prompt">
                <p>Please sign in to leave a review</p>
              </div>
            )}

            {/* Reviews List */}
            <div className="reviews-list">
              {reviews.length === 0 ? (
                <div className="reviews-placeholder">
                  <p>No reviews yet. Be the first to review this business!</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="review-item">
                    <div className="review-header">
                      <div className="review-author">
                        {review.userPhotoURL ? (
                          <img
                            src={review.userPhotoURL}
                            alt={review.userName}
                            className="review-avatar"
                          />
                        ) : (
                          <div className="review-avatar-placeholder">
                            {review.userName[0].toUpperCase()}
                          </div>
                        )}
                        <div className="review-author-info">
                          <strong>{review.userName}</strong>
                          <div className="review-rating">
                            <StarRating rating={review.rating} readonly size="small" />
                          </div>
                        </div>
                      </div>
                      {review.createdAt && (
                        <span className="review-date">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="review-comment">{review.comment}</p>
                  </div>
                ))
              )}
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
          {/* Book Appointment Button */}
          {services.length > 0 && (
            <div className="business-info-card booking-cta">
              <h3>Book an Appointment</h3>
              <p style={{ margin: '0.5rem 0 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                This business offers {services.length} {services.length === 1 ? 'service' : 'services'} available for booking
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setShowBookingModal(true)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                📅 Book Appointment
              </button>
            </div>
          )}

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

      {/* Appointment Booking Modal */}
      {showBookingModal && business && (
        <AppointmentBookingModal
          businessId={business.id}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            alert('Appointment booked successfully! The business will confirm your appointment soon.')
            setShowBookingModal(false)
          }}
        />
      )}
    </>
  )
}
