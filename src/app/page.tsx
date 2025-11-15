'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import BusinessCard from '@/components/BusinessCard'
import CategoryCard from '@/components/CategoryCard'
import Footer from '@/components/Footer'
import AuthModal from '@/components/AuthModal'
import { WebsiteSchema, OrganizationSchema } from '@/components/StructuredData'
import { db } from '@/lib/firebase/config'
import { collection, query, where, getDocs } from 'firebase/firestore'
import type { Business } from '@/lib/types'

const FILTER_CHIPS = [
  'Coffee',
  'Food',
  'Boutique',
  'Services',
  'Outdoors',
  'Wellness',
  'Pets',
  'Family',
]

export default function Home() {
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

  // Load data from Firestore
  useEffect(() => {
    loadBusinesses()
  }, [])

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
      console.error('Error loading businesses:', error)
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
    const filtered = businesses.filter((b) => {
      const qMatch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.tags.join(' ').toLowerCase().includes(q)
      const cMatch = !category || b.tags.includes(category)
      return qMatch && cMatch
    })
    setFilteredBusinesses(filtered)
    setActiveChips(new Set()) // Clear chip filters when searching
  }

  // Handle favorite
  const handleFavorite = (id: string) => {
    const favs = new Set(
      JSON.parse(localStorage.getItem('favs') || '[]') as string[]
    )
    if (favs.has(id)) {
      favs.delete(id)
    } else {
      favs.add(id)
    }
    localStorage.setItem('favs', JSON.stringify(Array.from(favs)))
    alert('Updated favorites!')
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
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  return (
    <>
      <WebsiteSchema />
      <OrganizationSchema />

      <Header onSignIn={() => setIsAuthOpen(true)} />

      <main>
        <Hero onSearch={handleSearch} categories={categories} />

        <section id="discover" className="section container">
          <div className="section-head">
            <h2>Featured in Gresham</h2>

            {/* Search and Filters */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  placeholder="Search businesses, products, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: '1',
                    minWidth: '250px',
                    padding: '0.75rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-orange)'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  value={selectedNeighborhood}
                  onChange={(e) => setSelectedNeighborhood(e.target.value)}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">All Neighborhoods</option>
                  {neighborhoods.map((hood) => (
                    <option key={hood} value={hood}>{hood}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'rating' | 'newest')}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  <option value="name">Sort: A-Z</option>
                  <option value="rating">Sort: Highest Rated</option>
                  <option value="newest">Sort: Newest</option>
                </select>
              </div>

              {/* Active Filters and Clear */}
              {(searchQuery || selectedCategory || selectedNeighborhood || activeChips.size > 0 || sortBy !== 'name') && (
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

            <div className="chip-row" aria-label="Quick filters">
              {FILTER_CHIPS.map((chip) => (
                <button
                  key={chip}
                  className={`chip ${activeChips.has(chip) ? 'active' : ''}`}
                  onClick={() => toggleChip(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="empty-state">
              <div className="spinner"></div>
              <p>Loading businesses...</p>
            </div>
          ) : (
            <>
              <div className="grid cards">
                {filteredBusinesses.map((business) => (
                  <BusinessCard
                    key={business.id}
                    business={business}
                    onFavorite={handleFavorite}
                  />
                ))}
              </div>
              {filteredBusinesses.length === 0 && (
                <div className="empty-state">
                  <h3>No businesses yet</h3>
                  <p>
                    {businesses.length === 0
                      ? 'Be the first business to join Try Local Gresham!'
                      : 'Try a different search or category.'}
                  </p>
                </div>
              )}
            </>
          )}
        </section>

        <section id="categories" className="section container">
          <h2>Popular Categories</h2>
          <div className="grid category-grid">
            {topCategories.map(([name, count]) => (
              <CategoryCard key={name} name={name} count={count} />
            ))}
          </div>
        </section>

        <section id="for-businesses" className="section container for-biz">
          <div className="for-biz-card">
            <h2>For Businesses</h2>
            <p>
              Create your profile, add products, update hours, and connect with
              local customers.
            </p>
            <ul className="list">
              <li>Dedicated store page with your branding</li>
              <li>Tags, photos, hours, contact info</li>
              <li>Optional pickup/delivery & order links</li>
              <li>Customer favorites and reviews</li>
            </ul>
            <div className="cta-row">
              <button
                className="btn btn-primary"
                onClick={() => setIsAuthOpen(true)}
              >
                Get Started
              </button>
              <button
                className="btn btn-outline"
                onClick={() => alert('Demo store coming soon.')}
              >
                View Demo Store
              </button>
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
        </section>
      </main>

      <Footer />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  )
}
