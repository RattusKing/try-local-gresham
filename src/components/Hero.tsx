'use client'

import { motion } from 'framer-motion'
import SmartSearch from './SmartSearch'
import type { Business } from '@/lib/types'

interface HeroProps {
  onSearch: (query: string, category: string) => void
  categories: string[]
  businesses: Business[]
  neighborhoods: string[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  selectedNeighborhood: string
  onNeighborhoodChange: (neighborhood: string) => void
  sortBy: string
  onSortChange: (sort: string) => void
}

export default function Hero({
  onSearch,
  categories,
  businesses,
  neighborhoods,
  selectedCategory,
  onCategoryChange,
  selectedNeighborhood,
  onNeighborhoodChange,
  sortBy,
  onSortChange,
}: HeroProps) {
  return (
    <section
      className="hero"
      role="img"
      aria-label="City background: Gresham, Oregon"
    >
      <div className="hero-overlay"></div>
      <motion.div
        className="container hero-content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Discover Local Businesses{' '}
          <span className="accent">in Gresham</span>
        </motion.h1>
        <motion.div
          className="hero-actions"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <a href="#discover" className="btn btn-primary">
            Browse Businesses
          </a>
          <a href="/get-listed" className="btn btn-ghost">
            List My Business
          </a>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <SmartSearch
            businesses={businesses}
            categories={categories}
            onSearch={onSearch}
            showPopularTags={true}
            placeholder="Search Gresham shops, restaurants, and services..."
          />
        </motion.div>

        {/* Filter Dropdowns */}
        <motion.div
          className="hero-filters"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '0.75rem',
          }}
        >
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            aria-label="Filter by category"
            className="hero-filter-select"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={selectedNeighborhood}
            onChange={(e) => onNeighborhoodChange(e.target.value)}
            aria-label="Filter by neighborhood"
            className="hero-filter-select"
          >
            <option value="">All Neighborhoods</option>
            {neighborhoods.map((hood) => (
              <option key={hood} value={hood}>{hood}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="Sort businesses"
            className="hero-filter-select"
          >
            <option value="name">Sort: A-Z</option>
            <option value="rating">Sort: Highest Rated</option>
            <option value="newest">Sort: Newest</option>
          </select>
        </motion.div>
      </motion.div>
    </section>
  )
}
