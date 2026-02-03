'use client'

import { motion } from 'framer-motion'
import SmartSearch from './SmartSearch'
import type { Business } from '@/lib/types'

interface HeroProps {
  onSearch: (query: string, category: string) => void
  categories: string[]
  businesses: Business[]
}

export default function Hero({ onSearch, categories, businesses }: HeroProps) {
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
      </motion.div>
    </section>
  )
}
