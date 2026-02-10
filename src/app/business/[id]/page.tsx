'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { db, storage } from '@/lib/firebase/config'
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Business, Product, Review, Service } from '@/lib/types'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/firebase/auth-context'
import { useCart } from '@/lib/cart-context'
import { trackPageView, trackEvent } from '@/lib/analytics'
import { formatDate } from '@/lib/utils'
import StarRating from '@/components/StarRating'
import PromoBanner from '@/components/PromoBanner'
import { LocalBusinessSchema, ProductSchema, BreadcrumbSchema } from '@/components/StructuredData'
import AppointmentBookingModal from '@/components/AppointmentBookingModal'
import QuoteRequestForm from '@/components/QuoteRequestForm'
import Head from 'next/head'
import { SITE_URL } from '@/lib/site-config'
import './business-profile.css'
import { logger } from '@/lib/logger';

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
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [quoteSuccess, setQuoteSuccess] = useState(false)
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0)

  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    comment: '',
  })
  const [reviewPhotos, setReviewPhotos] = useState<File[]>([])
  const [reviewPhotoUrls, setReviewPhotoUrls] = useState<string[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  const loadProductFavorites = useCallback(async () => {
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
      logger.error('Error loading product favorites:', error)
    }
  }, [db, user])

  const loadBusiness = useCallback(async () => {
    if (!params.id) {
      setError('Invalid business ID')
      setLoading(false)
      return
    }

    if (!db) {
      setError('Database connection unavailable. Please check your internet connection and try again.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const businessRef = doc(db, 'businesses', params.id as string)
      const businessSnap = await getDoc(businessRef)

      if (businessSnap.exists()) {
        const data = businessSnap.data() as Business

        // Only show approved businesses (or allow owners/admins to see their own)
        if (data.status !== 'approved') {
          setError('This business is not available.')
          setLoading(false)
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
      setError(err.message || 'Failed to load business. Please try again.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, db])

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
      logger.error('Error loading products:', err)
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
      logger.error('Error loading services:', err)
    }
  }

  const loadReviews = async (businessId: string) => {
    if (!db) return

    try {
      // Query without orderBy to avoid needing a composite index
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('businessId', '==', businessId)
      )
      const reviewsSnap = await getDocs(reviewsQuery)
      const reviewsList = reviewsSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt || new Date(),
      })) as Review[]

      // Sort by createdAt descending on client-side
      reviewsList.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0)
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0)
        return dateB - dateA // Descending order (newest first)
      })

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
          setReviewPhotoUrls(userReview.photos || [])
        }
      }
    } catch (err: any) {
      logger.error('Error loading reviews:', err)
    }
  }

  // Effects
  useEffect(() => {
    loadBusiness()
  }, [params.id, loadBusiness])

  // Track page view when business loads
  useEffect(() => {
    if (business && business.id) {
      trackPageView(business.id, user?.uid)
    }
  }, [business?.id, user?.uid])

  useEffect(() => {
    if (user) {
      loadProductFavorites()
    } else {
      setFavoritedProductIds(new Set())
    }
  }, [user, loadProductFavorites])

  const handleReviewPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newFiles: File[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) {
        setReviewError('Please upload only image files')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setReviewError('Each image must be less than 5MB')
        return
      }
      newFiles.push(file)
    }

    // Limit total photos to 5
    const totalPhotos = reviewPhotos.length + reviewPhotoUrls.length + newFiles.length
    if (totalPhotos > 5) {
      setReviewError('Maximum 5 photos allowed per review')
      return
    }

    setReviewPhotos([...reviewPhotos, ...newFiles])
    setReviewError('')
  }

  const handleRemoveNewPhoto = (index: number) => {
    setReviewPhotos(reviewPhotos.filter((_, i) => i !== index))
  }

  const handleRemoveExistingPhoto = (index: number) => {
    setReviewPhotoUrls(reviewPhotoUrls.filter((_, i) => i !== index))
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

      // Upload any new photos
      let uploadedPhotoUrls: string[] = [...reviewPhotoUrls]
      if (reviewPhotos.length > 0 && storage) {
        setUploadingPhotos(true)
        for (const photo of reviewPhotos) {
          const photoRef = ref(storage, `reviews/${business.id}/${user.uid}/${Date.now()}_${photo.name}`)
          await uploadBytes(photoRef, photo)
          const url = await getDownloadURL(photoRef)
          uploadedPhotoUrls.push(url)
        }
        setUploadingPhotos(false)
      }

      const reviewData = {
        businessId: business.id,
        userId: user.uid,
        userName: user.displayName || user.email || 'Anonymous',
        userPhotoURL: user.photoURL || '',
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        photos: uploadedPhotoUrls,
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

      // Clear photo state
      setReviewPhotos([])
      setReviewPhotoUrls(uploadedPhotoUrls)

      // Reload reviews
      await loadReviews(business.id)

      // Update business average rating
      await updateBusinessRating(business.id)
    } catch (err: any) {
      setReviewError(err.message)
    } finally {
      setSubmittingReview(false)
      setUploadingPhotos(false)
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
      setReviewPhotos([])
      setReviewPhotoUrls([])

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
      logger.error('Error updating business rating:', err)
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
      logger.error('Error updating product favorite:', error)
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
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
          <button onClick={() => loadBusiness()} className="btn-primary">
            Try Again
          </button>
          <button onClick={() => router.push('/')} className="btn-back">
            ← Back to Home
          </button>
        </div>
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
        <meta property="og:url" content={`${SITE_URL}/business/${business.id}`} />
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

        <link rel="canonical" content={`${SITE_URL}/business/${business.id}`} />
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

        {/* Profile Header - Social Media Style Layout */}
        <div className="business-profile-header">
          {/* Banner Image */}
          <motion.div
            className="business-banner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Image
              src={business.gallery?.[0] || business.cover}
              alt={`${business.name} banner`}
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
            <div className="business-banner-overlay" />
          </motion.div>

          {/* Profile Picture and Info */}
          <div className="business-profile-info">
            {/* Profile Picture */}
            {(business.logo || business.headerImage) && (
              <motion.div
                className="business-profile-picture"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
              >
                <Image
                  src={business.logo || business.headerImage || ''}
                  alt={`${business.name} logo`}
                  fill
                  style={{ objectFit: 'contain', backgroundColor: 'white' }}
                  sizes="120px"
                />
              </motion.div>
            )}

            {/* Business Info */}
            <div className="business-profile-details">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {business.name}
              </motion.h1>
              <motion.div
                className="business-profile-tags"
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
                className="business-profile-location"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                📍 {business.neighborhood ? `${business.neighborhood}, ` : ''}Gresham, OR
              </motion.p>
            </div>
          </div>
        </div>

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

          {/* Photo Gallery Section */}
          {business.gallery && business.gallery.length > 0 && (
            <motion.section
              className="business-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <h2>Photo Gallery</h2>
              <div style={{
                position: 'relative',
                marginTop: '1rem',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                {/* Gallery Image */}
                <div style={{ position: 'relative', width: '100%', height: '500px' }}>
                  <Image
                    src={business.gallery[currentGalleryIndex]}
                    alt={`${business.name} gallery image ${currentGalleryIndex + 1}`}
                    fill
                    style={{ objectFit: 'contain' }}
                    sizes="(max-width: 768px) 100vw, 800px"
                  />
                </div>

                {/* Navigation Arrows */}
                {business.gallery.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentGalleryIndex((prev) =>
                        prev === 0 ? business.gallery!.length - 1 : prev - 1
                      )}
                      style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '48px',
                        height: '48px',
                        fontSize: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.2s',
                        zIndex: 10
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
                      aria-label="Previous image"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => setCurrentGalleryIndex((prev) =>
                        prev === business.gallery!.length - 1 ? 0 : prev + 1
                      )}
                      style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '48px',
                        height: '48px',
                        fontSize: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.2s',
                        zIndex: 10
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
                      aria-label="Next image"
                    >
                      ›
                    </button>
                  </>
                )}

                {/* Image Counter */}
                <div style={{
                  position: 'absolute',
                  bottom: '1rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {currentGalleryIndex + 1} / {business.gallery.length}
                </div>
              </div>
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

            {/* Services List */}
            {services.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--secondary-dark)' }}>Services</h3>
                <div className="products-display">
                  {services.map((service) => (
                    <div key={service.id} className="product-item">
                      <div className="product-item-content">
                        <div className="product-item-header">
                          <h4>{service.name}</h4>
                          <span className="product-item-price">
                            ${service.price.toFixed(2)}
                          </span>
                        </div>
                        {service.category && (
                          <span className="product-item-category">{service.category}</span>
                        )}
                        {service.description && (
                          <p className="product-item-description">{service.description}</p>
                        )}
                        <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                          ⏱️ Duration: {service.duration} minutes
                        </div>
                        <div className="product-item-actions">
                          <button
                            className="btn btn-primary"
                            onClick={() => setShowBookingModal(true)}
                            style={{ flex: 1 }}
                          >
                            📅 Book Appointment
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products List */}
            {products.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--secondary-dark)' }}>Products</h3>
                <div className="products-display">
                  {products.map((product) => (
                  <div key={product.id} className="product-item">
                    {product.image && (
                      <div style={{ position: 'relative', width: '100%', aspectRatio: '1' }}>
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="product-item-image"
                          style={{ objectFit: 'cover' }}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
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
              </div>
            )}

            {/* Show message if no products or services */}
            {products.length === 0 && services.length === 0 && (
              <div className="products-placeholder">
                <p>No products or services listed yet.</p>
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
                  <div className="form-group">
                    <label>Add Photos (optional, max 5)</label>
                    <div style={{ marginTop: '0.5rem' }}>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleReviewPhotoUpload}
                        style={{ display: 'none' }}
                        id="review-photos"
                        disabled={reviewPhotos.length + reviewPhotoUrls.length >= 5}
                      />
                      <label
                        htmlFor="review-photos"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: reviewPhotos.length + reviewPhotoUrls.length >= 5 ? '#e5e7eb' : '#f3f4f6',
                          border: '1px dashed #d1d5db',
                          borderRadius: '8px',
                          cursor: reviewPhotos.length + reviewPhotoUrls.length >= 5 ? 'not-allowed' : 'pointer',
                          fontSize: '0.875rem',
                          color: reviewPhotos.length + reviewPhotoUrls.length >= 5 ? '#9ca3af' : '#374151',
                        }}
                      >
                        📷 Add Photos
                      </label>
                      <span style={{ marginLeft: '0.75rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        {reviewPhotos.length + reviewPhotoUrls.length}/5 photos
                      </span>
                    </div>
                    {/* Preview existing photos */}
                    {reviewPhotoUrls.length > 0 && (
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        marginTop: '0.75rem'
                      }}>
                        {reviewPhotoUrls.map((url, idx) => (
                          <div key={`existing-${idx}`} style={{ position: 'relative' }}>
                            <Image
                              src={url}
                              alt={`Review photo ${idx + 1}`}
                              width={80}
                              height={80}
                              style={{ objectFit: 'cover', borderRadius: '8px' }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingPhoto(idx)}
                              style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: 'bold'
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Preview new photos to upload */}
                    {reviewPhotos.length > 0 && (
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        marginTop: reviewPhotoUrls.length > 0 ? '0.5rem' : '0.75rem'
                      }}>
                        {reviewPhotos.map((file, idx) => (
                          <div key={`new-${idx}`} style={{ position: 'relative' }}>
                            <Image
                              src={URL.createObjectURL(file)}
                              alt={`New photo ${idx + 1}`}
                              width={80}
                              height={80}
                              style={{ objectFit: 'cover', borderRadius: '8px', opacity: 0.9 }}
                            />
                            <div style={{
                              position: 'absolute',
                              bottom: '0',
                              left: '0',
                              right: '0',
                              backgroundColor: 'rgba(34, 197, 94, 0.9)',
                              color: 'white',
                              fontSize: '10px',
                              textAlign: 'center',
                              borderRadius: '0 0 8px 8px',
                              padding: '2px'
                            }}>
                              New
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveNewPhoto(idx)}
                              style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: 'bold'
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="review-form-actions">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={submittingReview}
                    >
                      {submittingReview
                        ? uploadingPhotos
                          ? 'Uploading photos...'
                          : 'Submitting...'
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
                      <Link
                        href={`/profile/${review.userId}`}
                        className="review-author"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        {review.userPhotoURL ? (
                          <Image
                            src={review.userPhotoURL}
                            alt={review.userName}
                            width={48}
                            height={48}
                            className="review-avatar"
                            style={{ borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="review-avatar-placeholder">
                            {review.userName[0].toUpperCase()}
                          </div>
                        )}
                        <div className="review-author-info">
                          <strong style={{ color: 'var(--dark)' }}>{review.userName}</strong>
                          <div className="review-rating">
                            <StarRating rating={review.rating} readonly size="small" />
                          </div>
                        </div>
                      </Link>
                      {review.createdAt && (
                        <span className="review-date">
                          {formatDate(review.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="review-comment">{review.comment}</p>
                    {/* Review Photos */}
                    {review.photos && review.photos.length > 0 && (
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        marginTop: '1rem'
                      }}>
                        {review.photos.map((photo, idx) => (
                          <a
                            key={idx}
                            href={photo}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'block' }}
                          >
                            <Image
                              src={photo}
                              alt={`Review photo ${idx + 1}`}
                              width={120}
                              height={120}
                              style={{
                                objectFit: 'cover',
                                borderRadius: '8px',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)'
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)'
                                e.currentTarget.style.boxShadow = 'none'
                              }}
                            />
                          </a>
                        ))}
                      </div>
                    )}
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

          {/* Request a Quote Button - shown for all businesses */}
          <div className="business-info-card quote-cta">
            <h3>Request a Quote</h3>
            <p style={{ margin: '0.5rem 0 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
              Get a personalized quote for your project or service needs
            </p>
            {quoteSuccess ? (
              <div style={{
                padding: '1rem',
                backgroundColor: '#d1fae5',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#065f46'
              }}>
                <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>✓</span>
                <strong>Quote request sent!</strong>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem' }}>
                  The business will contact you soon.
                </p>
              </div>
            ) : (
              <button
                className="btn btn-secondary"
                onClick={() => setShowQuoteModal(true)}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  color: 'white',
                  border: 'none'
                }}
              >
                📋 Request a Quote
              </button>
            )}
          </div>

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
                  <a
                    href={`tel:${business.phone}`}
                    onClick={() => trackEvent(business.id, 'phone_click', { userId: user?.uid })}
                  >
                    {business.phone}
                  </a>
                </div>
              </div>
            )}

            {business.email && (
              <div className="info-item">
                <span className="info-icon">✉️</span>
                <div className="info-content">
                  <strong>Email</strong>
                  <a
                    href={`mailto:${business.email}`}
                    onClick={() => trackEvent(business.id, 'email_click', { userId: user?.uid })}
                  >
                    {business.email}
                  </a>
                </div>
              </div>
            )}

            {business.address && (
              <div className="info-item">
                <span className="info-icon">📍</span>
                <div className="info-content">
                  <strong>Address</strong>
                  <p>{business.address}</p>
                </div>
              </div>
            )}

            {business.website && (
              <div className="info-item">
                <span className="info-icon">🌐</span>
                <div className="info-content">
                  <strong>Website</strong>
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent(business.id, 'website_click', { userId: user?.uid })}
                  >
                    Visit Website
                  </a>
                </div>
              </div>
            )}

            {business.instagram && (
              <div className="info-item">
                <span className="info-icon">📸</span>
                <div className="info-content">
                  <strong>Instagram</strong>
                  <a
                    href={`https://instagram.com/${business.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {business.instagram}
                  </a>
                </div>
              </div>
            )}

            {business.map && (
              <div className="info-item">
                <span className="info-icon">🗺️</span>
                <div className="info-content">
                  <strong>Location</strong>
                  <a
                    href={business.map}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent(business.id, 'map_click', { userId: user?.uid })}
                  >
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
                  style={{ position: 'relative', display: 'block' }}
                >
                  <div style={{ position: 'relative', width: '100%', height: '300px' }}>
                    <Image
                      src={business.cover}
                      alt="Location"
                      fill
                      className="map-placeholder"
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                  </div>
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

      {/* Quote Request Modal */}
      {showQuoteModal && business && (
        <QuoteRequestForm
          businessId={business.id}
          businessName={business.name}
          onClose={() => setShowQuoteModal(false)}
          onSuccess={() => {
            setQuoteSuccess(true)
            // Reset success message after 10 seconds
            setTimeout(() => setQuoteSuccess(false), 10000)
          }}
        />
      )}
    </>
  )
}
