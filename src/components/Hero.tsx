'use client'

import { motion } from 'framer-motion'

interface HeroProps {
  onSearch: (query: string, category: string) => void
  categories: string[]
}

export default function Hero({ onSearch, categories }: HeroProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = formData.get('search') as string
    const category = formData.get('category') as string
    onSearch(query, category)
  }

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
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          onSubmit={handleSubmit}
          className="search-bar"
          role="search"
          aria-label="Search businesses"
        >
          <input
            name="search"
            type="search"
            placeholder="Search Gresham shops, restaurants, and services…"
            aria-label="Search businesses"
          />
          <select name="category" aria-label="Filter by category">
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" type="submit">
            Search
          </button>
        </motion.form>
      </motion.div>
    </section>
  )
}
