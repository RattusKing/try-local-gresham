'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BusinessCard from '@/components/BusinessCard'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/lib/firebase/auth-context'
import { db } from '@/lib/firebase/config'
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'
import type { Business } from '@/lib/types'

export default function BusinessesPage() {
  const { user } = useAuth()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [favoritedBusinessIds, setFavoritedBusinessIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadBusinesses()
  }, [])

  useEffect(() => {
    if (user) {
      loadFavorites()
    } else {
      setFavoritedBusinessIds(new Set())
    }
  }, [user])

  const loadBusinesses = async () => {
    if (!db) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const businessesQuery = query(
        collection(db, 'businesses'),
        where('status', '==', 'approved')
      )
      const businessesSnap = await getDocs(businessesQuery)
      const data = businessesSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Business[]

      setBusinesses(data)
      setFilteredBusinesses(data)

      const cats = new Set<string>()
      data.forEach((b) => b.tags.forEach((t) => cats.add(t)))
      setCategories(Array.from(cats).sort())
    } catch (error) {
      console.error('Error loading businesses:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFavorites = async () => {
    if (!db || !user) return

    try {
      const favoritesRef = collection(db, 'favorites')
      const q = query(
        favoritesRef,
        where('userId', '==', user.uid),
        where('itemType', '==', 'business')
      )
      const snapshot = await getDocs(q)
      const favoriteIds = new Set(snapshot.docs.map((doc) => doc.data().itemId))
      setFavoritedBusinessIds(favoriteIds)
    } catch (error) {
      console.error('Error loading favorites:', error)
    }
  }

  const handleFavorite = async (businessId: string) => {
    if (!user) {
      setIsAuthOpen(true)
      return
    }

    if (!db) return

    const business = businesses.find((b) => b.id === businessId)
    if (!business) return

    try {
      const favoritesRef = collection(db, 'favorites')

      const q = query(
        favoritesRef,
        where('userId', '==', user.uid),
        where('itemId', '==', businessId),
        where('itemType', '==', 'business')
      )
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        await deleteDoc(doc(db, 'favorites', snapshot.docs[0].id))
        const newFavorites = new Set(favoritedBusinessIds)
        newFavorites.delete(businessId)
        setFavoritedBusinessIds(newFavorites)
      } else {
        await addDoc(favoritesRef, {
          userId: user.uid,
          itemId: businessId,
          itemType: 'business',
          itemName: business.name,
          itemImage: business.cover,
          createdAt: new Date(),
        })
        const newFavorites = new Set(favoritedBusinessIds)
        newFavorites.add(businessId)
        setFavoritedBusinessIds(newFavorites)
      }
    } catch (error) {
      console.error('Error updating favorite:', error)
      alert('Failed to update favorite. Please try again.')
    }
  }

  useEffect(() => {
    let filtered = [...businesses]

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      filtered = filtered.filter((b) =>
        b.name.toLowerCase().includes(q) ||
        b.tags.join(' ').toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q)
      )
    }

    if (selectedCategory) {
      filtered = filtered.filter((b) => b.tags.includes(selectedCategory))
    }

    setFilteredBusinesses(filtered)
  }, [businesses, searchQuery, selectedCategory])

  return (
    <>
      <Header onSignIn={() => setIsAuthOpen(true)} />

      <main>
        {/* Page Header */}
        <section style={{
          background: 'linear-gradient(135deg, rgba(153, 237, 195, 0.1), rgba(194, 175, 240, 0.1))',
          padding: '4rem 0 3rem',
          borderBottom: '2px solid rgba(153, 237, 195, 0.2)'
        }}>
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--secondary-dark)',
                  textDecoration: 'none',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = 'var(--secondary)'
                  e.currentTarget.style.transform = 'translateX(-4px)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = 'var(--secondary-dark)'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                ← Back to Home
              </Link>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                marginBottom: '0.5rem',
                color: 'var(--dark)'
              }}>
                Gresham Businesses
              </h1>
              <p style={{
                fontSize: '1.125rem',
                color: 'var(--muted)',
                maxWidth: '600px'
              }}>
                Browse shops, restaurants, and services in our community.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="section container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="filter-controls">
              <input
                type="text"
                placeholder="Search businesses…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search businesses"
              />

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {(searchQuery || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('')
                  }}
                  className="btn btn-outline"
                  style={{ padding: '0.75rem 1rem' }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div style={{
              marginTop: '1rem',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              Showing {filteredBusinesses.length} of {businesses.length} businesses
            </div>
          </motion.div>

          {/* Business Grid */}
          {loading ? (
            <div className="empty-state" role="status" aria-live="polite" style={{ marginTop: '3rem' }}>
              <div className="spinner" aria-hidden="true"></div>
              <p>Loading businesses...</p>
            </div>
          ) : (
            <motion.div
              className="grid cards"
              style={{ marginTop: '2rem' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {filteredBusinesses.length === 0 ? (
                <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                  <h3>No businesses found</h3>
                  <p>Try clearing filters or searching something else.</p>
                </div>
              ) : (
                filteredBusinesses.map((business, index) => (
                  <motion.div
                    key={business.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <BusinessCard
                      business={business}
                      onFavorite={handleFavorite}
                      isFavorited={favoritedBusinessIds.has(business.id)}
                    />
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </section>
      </main>

      <Footer />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  )
}
