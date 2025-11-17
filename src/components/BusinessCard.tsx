'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { Business } from '@/lib/types'
import StarRating from './StarRating'

interface BusinessCardProps {
  business: Business
  onFavorite: (id: string) => void
  isFavorited?: boolean
}

export default function BusinessCard({
  business,
  onFavorite,
  isFavorited = false,
}: BusinessCardProps) {
  const bg = business.cover || '/assets/placeholder.jpg'

  return (
    <motion.article
      className="card"
      tabIndex={0}
      aria-label={`${business.name} card`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <div
        className="cover"
        style={{ backgroundImage: `url('${bg}')` }}
        role="img"
        aria-label={business.name}
      />
      <div className="content">
        <h3>{business.name}</h3>
        {business.averageRating && business.reviewCount ? (
          <div className="card-rating">
            <StarRating rating={business.averageRating} readonly size="small" />
            <span className="card-rating-text">
              {business.averageRating.toFixed(1)} ({business.reviewCount})
            </span>
          </div>
        ) : null}
        <div className="meta">
          📍 {business.neighborhood} &nbsp; • &nbsp; ⏰ {business.hours}
        </div>
        <div className="meta">
          ☎️{' '}
          <a href={`tel:${business.phone}`}>{business.phone}</a> &nbsp; • &nbsp;
          🌐{' '}
          <a href={business.website} target="_blank" rel="noopener">
            Website
          </a>
        </div>
        <div className="meta">
          🔖{' '}
          {business.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
        <div className="actions">
          <Link
            href={`/business/${business.id}`}
            className="btn btn-primary"
          >
            View Details
          </Link>
          <button
            className={isFavorited ? 'btn btn-favorite-active' : 'btn btn-outline'}
            onClick={() => onFavorite(business.id)}
            title={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
          >
            {isFavorited ? '❤️ Saved' : '🤍 Save'}
          </button>
        </div>
      </div>
    </motion.article>
  )
}
