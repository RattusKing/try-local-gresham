'use client'

import { useState } from 'react'
import './StarRating.css'

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: 'small' | 'medium' | 'large'
}

export default function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = 'medium',
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState(0)

  const handleClick = (newRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(newRating)
    }
  }

  const displayRating = hoveredRating || rating

  return (
    <div className={`star-rating star-rating-${size} ${readonly ? '' : 'interactive'}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star ${star <= displayRating ? 'filled' : ''}`}
          onClick={() => handleClick(star)}
          onMouseEnter={() => !readonly && setHoveredRating(star)}
          onMouseLeave={() => !readonly && setHoveredRating(0)}
          disabled={readonly}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
