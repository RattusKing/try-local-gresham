'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import BusinessCard from '@/components/BusinessCard'
import CategoryCard from '@/components/CategoryCard'
import Footer from '@/components/Footer'
import AuthModal from '@/components/AuthModal'
import PromoBanner from '@/components/PromoBanner'
import SponsoredBannerCarousel from '@/components/SponsoredBannerCarousel'
import CategoryFilterDropdown from '@/components/CategoryFilterDropdown'
import { WebsiteSchema, OrganizationSchema } from '@/components/StructuredData'
import { useAuth } from '@/lib/firebase/auth-context'
import { db } from '@/lib/firebase/config'
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'
import type { Business } from '@/lib/types'
import { logger } from '@/lib/logger';

export default function Home() {
  const { user } = useAuth()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [neighborhoods, setNeighborhoods] = useState<string[]>([])
  const [activeChips, setActiveChips] = useState<Set<string>>(new Set())
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'newest'>('name')
  const [favoritedBusinessIds, setFavoritedBusinessIds] = useState<Set<string>>(new Set())

  // Load data from Firestore
  useEffect(() => {
    loadBusinesses()
  }, [])

  // Load user's favorites
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
      // Only fetch approved businesses
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

      // Extract unique categories
      const cats = new Set<string>()
      data.forEach((b) => b.tags.forEach((t) => cats.add(t)))
      setCategories(Array.from(cats).sort())

      // Extract unique neighborhoods
      const hoods = new Set<string>()
      data.forEach((b) => b.neighborhood && hoods.add(b.neighborhood))
      setNeighborhoods(Array.from(hoods).sort())
    } catch (error) {
      logger.error('Error loading businesses:', error)
    } finally {
      setLoading(false)
    }
  }

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...businesses]

    // Apply search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      filtered = filtered.filter((b) =>
        b.name.toLowerCase().includes(q) ||
        b.tags.join(' ').toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q)
      )
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((b) => b.tags.includes(selectedCategory))
    }

    // Apply neighborhood filter
    if (selectedNeighborhood) {
      filtered = filtered.filter((b) => b.neighborhood === selectedNeighborhood)
    }

    // Apply chip filters
    if (activeChips.size > 0) {
      filtered = filtered.filter((b) =>
        Array.from(activeChips).some((chip) => b.tags.includes(chip))
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0)
        case 'newest':
          return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
        case 'name':
        default:
          return a.name.localeCompare(b.name)
      }
    })

    setFilteredBusinesses(filtered)
  }, [businesses, searchQuery, selectedCategory, selectedNeighborhood, activeChips, sortBy])

  // Handle chip filtering
  const toggleChip = (chip: string) => {
    const newChips = new Set(activeChips)
    if (newChips.has(chip)) {
      newChips.delete(chip)
    } else {
      newChips.add(chip)
    }
    setActiveChips(newChips)

    if (newChips.size === 0) {
      setFilteredBusinesses(businesses)
    } else {
      const filtered = businesses.filter((b) =>
        Array.from(newChips).some((chip) => b.tags.includes(chip))
      )
      setFilteredBusinesses(filtered)
    }
  }

  // Handle search
  const handleSearch = (query: string, category: string) => {
    const q = query.trim().toLowerCase()

    // Set search query and category for filtering
    setSearchQuery(q)
    if (category) {
      setSelectedCategory(category)
    }
    setActiveChips(new Set()) // Clear chip filters when searching

    // Smooth scroll to discover section
    setTimeout(() => {
      const discoverSection = document.getElementById('discover')
      if (discoverSection) {
        discoverSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }
    }, 100)
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
      logger.error('Error loading favorites:', error)
    }
  }

  // Handle favorite
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

      // Check if already favorited
      const q = query(
        favoritesRef,
        where('userId', '==', user.uid),
        where('itemId', '==', businessId),
        where('itemType', '==', 'business')
      )
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        // Remove from favorites
        await deleteDoc(doc(db, 'favorites', snapshot.docs[0].id))
        const newFavorites = new Set(favoritedBusinessIds)
        newFavorites.delete(businessId)
        setFavoritedBusinessIds(newFavorites)
      } else {
        // Add to favorites
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
      logger.error('Error updating favorite:', error)
      alert('Failed to update favorite. Please try again.')
    }
  }

  // Calculate stats
  const stats = {
    businesses: businesses.length,
    tags: new Set(businesses.flatMap((b) => b.tags)).size,
    neighborhoods: new Set(businesses.map((b) => b.neighborhood)).size,
  }

  // Calculate category counts for category grid
  const categoryCounts: Record<string, number> = {}
  businesses.forEach((b) => {
    b.tags.forEach((tag) => {
      categoryCounts[tag] = (categoryCounts[tag] || 0) + 1
    })
  })
  const pinnedCategories = ['Home and Garden', 'Health and Wellness']
  const pinned = pinnedCategories.map((name) => [name, categoryCounts[name] || 0] as [string, number])
  const remaining = Object.entries(categoryCounts)
    .filter(([name]) => !pinnedCategories.includes(name))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8 - pinned.length)
  const topCategories = [...pinned, ...remaining]

  return (
    <>
      <WebsiteSchema />
      <OrganizationSchema />

      {/* Skip to main content link for keyboard accessibility */}
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          left: '-9999px',
          zIndex: 999,
          padding: '1rem',
          background: 'var(--primary-orange)',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
        }}
        onFocus={(e) => {
          e.target.style.left = '1rem'
          e.target.style.top = '1rem'
        }}
        onBlur={(e) => {
          e.target.style.left = '-9999px'
        }}
      >
        Skip to main content
      </a>

      <Header onSignIn={() => setIsAuthOpen(true)} />
      <PromoBanner location="homepage" />

      {/* Tagline */}
      <div style={{
        padding: 'clamp(0.5rem, 2vw, 0.75rem) 1rem',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.95)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <p style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(0.95rem, 2.5vw, 1.25rem)',
          fontWeight: 600,
          margin: 0,
          color: '#1a1a1a',
          letterSpacing: '0.02em'
        }}>
          Everything local. One place.
        </p>
      </div>

      <main id="main-content">
        <Hero
          onSearch={handleSearch}
          categories={categories}
          businesses={businesses}
          neighborhoods={neighborhoods}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedNeighborhood={selectedNeighborhood}
          onNeighborhoodChange={setSelectedNeighborhood}
          sortBy={sortBy}
          onSortChange={(val) => setSortBy(val as 'name' | 'rating' | 'newest')}
        />

        {/* Sponsored Business Carousel */}
        <SponsoredBannerCarousel />

        <section id="discover" className="section section-alt-light container">
          {/* Active Filters and Result Count */}
          {!loading && businesses.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              {/* Active Filters and Clear - Only show if filters are actually active */}
              {(searchQuery || selectedCategory || selectedNeighborhood || activeChips.size > 0) && (
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>
                    Active Filters:
                  </span>

                  {searchQuery && (
                    <span style={{
                      padding: '0.375rem 0.75rem',
                      background: 'var(--primary-orange)',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      Search: "{searchQuery}"
                      <button
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search filter"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          padding: 0,
                          lineHeight: 1
                        }}
                      >×</button>
                    </span>
                  )}

                  {selectedCategory && (
                    <span style={{
                      padding: '0.375rem 0.75rem',
                      background: 'var(--primary-orange)',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      Category: {selectedCategory}
                      <button
                        onClick={() => setSelectedCategory('')}
                        aria-label="Clear category filter"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          padding: 0,
                          lineHeight: 1
                        }}
                      >×</button>
                    </span>
                  )}

                  {selectedNeighborhood && (
                    <span style={{
                      padding: '0.375rem 0.75rem',
                      background: 'var(--primary-orange)',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      Neighborhood: {selectedNeighborhood}
                      <button
                        onClick={() => setSelectedNeighborhood('')}
                        aria-label="Clear neighborhood filter"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          padding: 0,
                          lineHeight: 1
                        }}
                      >×</button>
                    </span>
                  )}

                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCategory('')
                      setSelectedNeighborhood('')
                      setActiveChips(new Set())
                      setSortBy('name')
                    }}
                    className="btn btn-outline"
                    style={{ marginLeft: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    Clear All Filters
                  </button>
                </div>
              )}

              {/* Result Count */}
              <div style={{
                marginTop: '1rem',
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                Showing {filteredBusinesses.length} of {businesses.length} businesses
              </div>
            </div>
          )}

          {/* Featured Businesses Section - Only show if businesses exist */}
          {!loading && businesses.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '1rem',
                color: 'var(--dark)'
              }}>
                Featured Businesses
              </h3>
              <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
                Some of the local businesses we're highlighting right now.
              </p>

              <div style={{ marginBottom: '1.5rem', maxWidth: '500px' }}>
                <CategoryFilterDropdown
                  activeChips={activeChips}
                  onToggleChip={toggleChip}
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="empty-state" role="status" aria-live="polite" style={{
              padding: '4rem 2rem',
              textAlign: 'center'
            }}>
              <div className="spinner" aria-hidden="true" style={{
                margin: '0 auto 1rem'
              }}></div>
              <p style={{ fontSize: '1.125rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                Loading local businesses...
              </p>
              <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', opacity: 0.7 }}>
                Finding the best of Gresham for you
              </p>
            </div>
          ) : (
            <>
              {businesses.length === 0 ? (
                <div className="empty-state" style={{
                  padding: '4rem 2rem',
                  textAlign: 'center',
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}>
                  <div style={{
                    fontSize: '3.5rem',
                    marginBottom: '1rem',
                    opacity: 0.5
                  }}>
                    🏪
                  </div>
                  <h3 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', color: 'var(--dark)' }}>
                    New Businesses Coming Soon!
                  </h3>
                  <p style={{ fontSize: '1.125rem', color: 'var(--muted)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
                    We're building the directory of Gresham's finest local businesses. Check back soon or be the first to join!
                  </p>
                  <a href="/get-listed" className="btn btn-primary">
                    List Your Business
                  </a>
                </div>
              ) : (
                <>
                  <div className="grid cards">
                    {filteredBusinesses.map((business) => (
                      <BusinessCard
                        key={business.id}
                        business={business}
                        onFavorite={handleFavorite}
                        isFavorited={favoritedBusinessIds.has(business.id)}
                      />
                    ))}
                  </div>
                  {filteredBusinesses.length === 0 && (
                    <div className="empty-state" style={{
                      padding: '3rem 2rem',
                      textAlign: 'center',
                      background: 'white',
                      borderRadius: '16px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{
                        fontSize: '3.5rem',
                        marginBottom: '1rem'
                      }}>
                        🔍
                      </div>
                      <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>
                        No results for "{searchQuery || selectedCategory || 'your search'}"
                      </h3>
                      <p style={{ color: 'var(--muted)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                        We couldn't find any businesses matching your search. Try one of these suggestions:
                      </p>

                      {/* Search suggestions */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        justifyContent: 'center',
                        marginBottom: '1.5rem'
                      }}>
                        {['Restaurant', 'Auto Repair', 'HVAC', 'Salon', 'Coffee'].map(suggestion => (
                          <button
                            key={suggestion}
                            onClick={() => {
                              setSearchQuery(suggestion)
                              setSelectedCategory('')
                              setSelectedNeighborhood('')
                              setActiveChips(new Set())
                            }}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#f3f4f6',
                              border: '1px solid #e5e7eb',
                              borderRadius: '100px',
                              fontSize: '0.875rem',
                              color: '#374151',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = '#fef3c7'
                              e.currentTarget.style.borderColor = '#fbbf24'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = '#f3f4f6'
                              e.currentTarget.style.borderColor = '#e5e7eb'
                            }}
                          >
                            Try "{suggestion}"
                          </button>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => {
                            setSearchQuery('')
                            setSelectedCategory('')
                            setSelectedNeighborhood('')
                            setActiveChips(new Set())
                            setSortBy('name')
                          }}
                          className="btn btn-primary"
                        >
                          View All Businesses
                        </button>
                        <a href="/get-listed" className="btn btn-outline">
                          List Your Business
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>

        {/* How it Works Section */}
        <section className="section section-alt-mint">
          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <span className="eyebrow" style={{ display: 'inline-block' }}>Simple Process</span>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '0.5rem' }}>How It Works</h2>
            </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                background: 'var(--primary-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'var(--dark)',
                marginBottom: '1.25rem'
              }}>
                1
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 700 }}>Browse local businesses</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>Explore real shops and services in Gresham with detailed profiles and reviews.</p>
            </div>
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                background: 'var(--secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'var(--dark)',
                marginBottom: '1.25rem'
              }}>
                2
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 700 }}>Learn what they offer</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>View hours, contact info, services, and products all in one convenient place.</p>
            </div>
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                background: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'var(--dark)',
                marginBottom: '1.25rem'
              }}>
                3
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 700 }}>Shop or visit</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>Order online when available, or visit in person to support local.</p>
            </div>
          </div>
          </div>
        </section>

        <section id="categories" className="section section-alt-lavender">
          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ marginBottom: '2rem' }}>
              <span className="eyebrow">Browse</span>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '0.5rem' }}>Popular Categories</h2>
            </div>
          <div className="grid category-grid">
            {topCategories.map(([name, count]) => (
              <CategoryCard key={name} name={name} count={count} />
            ))}
          </div>
          </div>
        </section>

        <section id="for-businesses" className="section section-alt-light">
          <div className="container for-biz" style={{ position: 'relative', zIndex: 1 }}>
          <div className="for-biz-card">
            <span className="eyebrow">For Business Owners</span>
            <h2 style={{ marginTop: '0.5rem' }}>Own a Business in Gresham?</h2>
            <p>
              Create a clean, modern profile where local customers can find you.
            </p>
            <ul className="list">
              <li>Reach customers who are looking for local businesses</li>
              <li>Modern business profile with hours, description, and photos</li>
              <li>Simple management through your dashboard</li>
              <li>Accept online orders and bookings</li>
            </ul>
            <div className="cta-row">
              <a
                href="/for-businesses"
                className="btn btn-primary"
              >
                Learn More
              </a>
              <a
                href="/get-listed"
                className="btn btn-outline"
              >
                Get Listed
              </a>
            </div>
          </div>
          <aside className="for-biz-aside">
            <h3>Why Try Local?</h3>
            <p>
              We help neighbors find you. Keep dollars circulating in Gresham.
            </p>
            <div className="stat-row">
              <div className="stat">
                <span className="stat-num">{stats.businesses}</span>
                <span className="stat-label">Businesses</span>
              </div>
              <div className="stat">
                <span className="stat-num">{stats.tags}</span>
                <span className="stat-label">Tags</span>
              </div>
              <div className="stat">
                <span className="stat-num">{stats.neighborhoods}</span>
                <span className="stat-label">Neighborhoods</span>
              </div>
            </div>
          </aside>
          </div>
        </section>
      </main>

      <Footer />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  )
}
