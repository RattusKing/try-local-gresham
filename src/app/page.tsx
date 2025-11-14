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
  const [activeChips, setActiveChips] = useState<Set<string>>(new Set())
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [loading, setLoading] = useState(true)

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
    } catch (error) {
      console.error('Error loading businesses:', error)
    } finally {
      setLoading(false)
    }
  }

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
