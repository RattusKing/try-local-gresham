'use client'

import { useEffect, useRef, useState } from 'react'
import type { Business } from '@/lib/types'
import { BUSINESS_TAG_CATEGORIES } from '@/lib/types'

const FOOD_TAGS = new Set(BUSINESS_TAG_CATEGORIES[0].tags)

const VIBE_CHIPS = [
  'Pizza', 'Mexican', 'Asian', 'BBQ', 'Burgers',
  'Breakfast', 'Coffee Shop', 'Bakery', 'Sushi', 'Sandwiches',
  'Desserts', 'Vegan', 'Seafood', 'Italian', 'American',
]

interface RandomizerModalProps {
  isOpen: boolean
  onClose: () => void
  businesses: Business[]
}

function isFoodBusiness(business: Business): boolean {
  return business.tags.some((tag) => FOOD_TAGS.has(tag))
}

export default function RandomizerModal({ isOpen, onClose, businesses }: RandomizerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [selectedVibes, setSelectedVibes] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<Business | null>(null)
  const [visible, setVisible] = useState(false)
  const [noResults, setNoResults] = useState(false)

  const foodBusinesses = businesses.filter(isFoodBusiness)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen) {
      dialog.showModal()
    } else {
      dialog.close()
      setResult(null)
      setVisible(false)
      setNoResults(false)
      setSelectedVibes(new Set())
    }
  }, [isOpen])

  // Close on backdrop click
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleClick = (e: MouseEvent) => {
      if (e.target === dialog) onClose()
    }
    dialog.addEventListener('click', handleClick)
    return () => dialog.removeEventListener('click', handleClick)
  }, [onClose])

  const toggleVibe = (vibe: string) => {
    const next = new Set(selectedVibes)
    if (next.has(vibe)) next.delete(vibe)
    else next.add(vibe)
    setSelectedVibes(next)
    setResult(null)
    setVisible(false)
    setNoResults(false)
  }

  const pick = () => {
    const pool =
      selectedVibes.size > 0
        ? foodBusinesses.filter((b) =>
            Array.from(selectedVibes).some((v) => b.tags.includes(v))
          )
        : foodBusinesses

    if (pool.length === 0) {
      setNoResults(true)
      setResult(null)
      setVisible(false)
      return
    }

    setVisible(false)
    setNoResults(false)

    // Brief delay so fade-out → fade-in feels intentional
    setTimeout(() => {
      const picked = pool[Math.floor(Math.random() * pool.length)]
      setResult(picked)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    }, 150)
  }

  const displayTags = result?.tags.filter((t) => FOOD_TAGS.has(t)).slice(0, 5) ?? []

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      style={{
        border: 'none',
        borderRadius: '16px',
        padding: 0,
        width: 'min(480px, 95vw)',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        background: 'white',
      }}
    >
      {/* Header */}
      <div style={{
        background: 'var(--primary-orange, #f97316)',
        padding: '1.5rem',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            fontSize: '1.1rem',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          ×
        </button>
        <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🎲</div>
        <h2 style={{ color: 'white', margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
          Surprise Me!
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.85)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
          Can't decide? Let us pick a local spot for you.
        </p>
      </div>

      <div style={{ padding: '1.25rem 1.5rem 1.5rem', overflowY: 'auto', maxHeight: 'calc(90vh - 120px)' }}>
        {/* Vibe chips */}
        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          I'm in the mood for… <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
          {VIBE_CHIPS.map((vibe) => {
            const active = selectedVibes.has(vibe)
            return (
              <button
                key={vibe}
                onClick={() => toggleVibe(vibe)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '100px',
                  border: `2px solid ${active ? 'var(--primary-orange, #f97316)' : '#e5e7eb'}`,
                  background: active ? 'var(--primary-orange, #f97316)' : 'white',
                  color: active ? 'white' : '#374151',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {vibe}
              </button>
            )
          })}
        </div>

        {/* Pick button */}
        <button
          onClick={pick}
          disabled={foodBusinesses.length === 0}
          style={{
            width: '100%',
            padding: '0.875rem',
            background: 'var(--primary-orange, #f97316)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: foodBusinesses.length === 0 ? 'not-allowed' : 'pointer',
            opacity: foodBusinesses.length === 0 ? 0.5 : 1,
            transition: 'opacity 0.15s ease, transform 0.1s ease',
            marginBottom: '1.25rem',
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          {result ? 'Try Another' : 'Pick for Me!'}
        </button>

        {/* No results message */}
        {noResults && (
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
            No food businesses match those filters yet. Try a different combo!
          </p>
        )}

        {/* Result card */}
        {result && (
          <div
            style={{
              opacity: visible ? 1 : 0,
              transition: 'opacity 0.35s ease',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
            }}
          >
            {/* Cover image */}
            {result.cover && (
              <div style={{ height: '160px', overflow: 'hidden', background: '#f3f4f6' }}>
                <img
                  src={result.cover}
                  alt={result.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            <div style={{ padding: '1rem' }}>
              <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.2rem', fontWeight: 800, color: '#1a1a1a' }}>
                {result.name}
              </h3>

              {result.neighborhood && (
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>
                  📍 {result.neighborhood}
                </p>
              )}

              {result.hours && (
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>
                  🕐 {result.hours}
                </p>
              )}

              {/* Food tags */}
              {displayTags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                  {displayTags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '0.2rem 0.6rem',
                        background: '#fef3c7',
                        color: '#92400e',
                        borderRadius: '100px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <a
                href={`/business/${result.id}`}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '0.75rem',
                  background: '#1a1a1a',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'opacity 0.15s',
                }}
              >
                Take Me There →
              </a>
            </div>
          </div>
        )}
      </div>
    </dialog>
  )
}
