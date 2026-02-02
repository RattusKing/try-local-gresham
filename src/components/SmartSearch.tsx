'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Business } from '@/lib/types'
import { trackSearchQuery } from '@/lib/analytics'
import './SmartSearch.css'

interface SmartSearchProps {
  businesses: Business[]
  onSearch: (query: string, category: string) => void
  categories: string[]
  placeholder?: string
  showPopularTags?: boolean
  autoFocus?: boolean
}

// Simple fuzzy matching function
function fuzzyMatch(text: string, query: string): boolean {
  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()

  // Exact substring match
  if (textLower.includes(queryLower)) return true

  // Check for typos - allow 1 character difference for queries > 3 chars
  if (queryLower.length > 3) {
    // Simple Levenshtein-like check for similar words
    const words = textLower.split(/\s+/)
    for (const word of words) {
      if (word.length >= queryLower.length - 1 && word.length <= queryLower.length + 1) {
        let matches = 0
        const shorter = queryLower.length < word.length ? queryLower : word
        const longer = queryLower.length < word.length ? word : queryLower
        for (let i = 0; i < shorter.length; i++) {
          if (longer.includes(shorter[i])) matches++
        }
        if (matches >= shorter.length - 1) return true
      }
    }
  }

  return false
}

// Get recent searches from localStorage
function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('recentSearches')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save search to recent searches
function saveRecentSearch(query: string) {
  if (typeof window === 'undefined' || !query.trim()) return
  try {
    const recent = getRecentSearches()
    const filtered = recent.filter(s => s.toLowerCase() !== query.toLowerCase())
    const updated = [query, ...filtered].slice(0, 5)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  } catch {
    // Ignore localStorage errors
  }
}

// Clear recent searches
function clearRecentSearches() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('recentSearches')
  } catch {
    // Ignore localStorage errors
  }
}

export default function SmartSearch({
  businesses,
  onSearch,
  categories,
  placeholder = 'Search businesses, services, or tags...',
  showPopularTags = true,
  autoFocus = false
}: SmartSearchProps) {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches())
  }, [])

  // Popular tags based on business count
  const popularTags = useMemo(() => {
    const tagCounts: Record<string, number> = {}
    businesses.forEach(b => {
      b.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag)
  }, [businesses])

  // Generate suggestions based on query
  const suggestions = useMemo(() => {
    if (!query.trim() || query.length < 2) return []

    const queryLower = query.toLowerCase().trim()
    const results: Array<{ type: 'business' | 'tag', value: string, business?: Business }> = []
    const seen = new Set<string>()

    // Match businesses
    businesses.forEach(business => {
      if (results.length >= 8) return

      const nameMatch = fuzzyMatch(business.name, queryLower)
      const tagMatch = business.tags.some(tag => fuzzyMatch(tag, queryLower))
      const descMatch = business.description && fuzzyMatch(business.description, queryLower)

      if (nameMatch || tagMatch || descMatch) {
        const key = `business-${business.id}`
        if (!seen.has(key)) {
          seen.add(key)
          results.push({ type: 'business', value: business.name, business })
        }
      }
    })

    // Match tags/categories
    categories.forEach(tag => {
      if (results.length >= 10) return
      if (fuzzyMatch(tag, queryLower)) {
        const key = `tag-${tag}`
        if (!seen.has(key)) {
          seen.add(key)
          results.push({ type: 'tag', value: tag })
        }
      }
    })

    return results.slice(0, 8)
  }, [query, businesses, categories])

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = suggestions.length + (recentSearches.length > 0 && !query ? recentSearches.length : 0)

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => (prev < totalItems - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : totalItems - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0) {
          // Select highlighted item
          if (!query && recentSearches.length > 0 && highlightedIndex < recentSearches.length) {
            handleSelectRecent(recentSearches[highlightedIndex])
          } else if (suggestions[highlightedIndex]) {
            handleSelectSuggestion(suggestions[highlightedIndex])
          }
        } else {
          handleSubmit()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setHighlightedIndex(-1)
        break
    }
  }

  const handleSubmit = () => {
    if (query.trim()) {
      saveRecentSearch(query.trim())
      setRecentSearches(getRecentSearches())
      trackSearchQuery(query.trim())
    }
    onSearch(query, selectedCategory)
    setShowSuggestions(false)
    setHighlightedIndex(-1)
  }

  const handleSelectSuggestion = (suggestion: { type: 'business' | 'tag', value: string, business?: Business }) => {
    if (suggestion.type === 'business' && suggestion.business) {
      // Navigate to business page
      saveRecentSearch(suggestion.value)
      trackSearchQuery(suggestion.value)
      router.push(`/business/${suggestion.business.id}`)
    } else if (suggestion.type === 'tag') {
      // Search by tag
      setQuery(suggestion.value)
      saveRecentSearch(suggestion.value)
      trackSearchQuery(suggestion.value)
      onSearch(suggestion.value, '')
    }
    setShowSuggestions(false)
    setHighlightedIndex(-1)
  }

  const handleSelectRecent = (search: string) => {
    setQuery(search)
    trackSearchQuery(search)
    onSearch(search, selectedCategory)
    setShowSuggestions(false)
    setHighlightedIndex(-1)
  }

  const handlePopularTagClick = (tag: string) => {
    setQuery(tag)
    saveRecentSearch(tag)
    setRecentSearches(getRecentSearches())
    trackSearchQuery(tag)
    onSearch(tag, '')
  }

  const handleClearRecent = () => {
    clearRecentSearches()
    setRecentSearches([])
  }

  // Highlight matching text in suggestions
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    const index = text.toLowerCase().indexOf(query.toLowerCase())
    if (index === -1) return text
    return (
      <>
        {text.slice(0, index)}
        <mark className="search-highlight">{text.slice(index, index + query.length)}</mark>
        {text.slice(index + query.length)}
      </>
    )
  }

  const showDropdown = showSuggestions && (
    suggestions.length > 0 ||
    (!query && recentSearches.length > 0)
  )

  return (
    <div className="smart-search">
      <div className="smart-search-input-wrapper">
        <div className="smart-search-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowSuggestions(true)
            setHighlightedIndex(-1)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="smart-search-input"
          autoFocus={autoFocus}
          autoComplete="off"
          aria-label="Search businesses"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
        />

        {query && (
          <button
            className="smart-search-clear"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            aria-label="Clear search"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}

        <button
          className="smart-search-submit"
          onClick={handleSubmit}
          aria-label="Search"
        >
          Search
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {showDropdown && (
        <div ref={suggestionsRef} className="smart-search-dropdown">
          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="search-section">
              <div className="search-section-header">
                <span className="search-section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Recent Searches
                </span>
                <button className="search-clear-btn" onClick={handleClearRecent}>
                  Clear
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={search}
                  className={`search-suggestion-item ${highlightedIndex === index ? 'highlighted' : ''}`}
                  onClick={() => handleSelectRecent(search)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span className="suggestion-icon recent">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </span>
                  <span className="suggestion-text">{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* Query Suggestions */}
          {suggestions.length > 0 && (
            <div className="search-section">
              {suggestions.map((suggestion, index) => {
                const adjustedIndex = !query && recentSearches.length > 0
                  ? index + recentSearches.length
                  : index

                return (
                  <button
                    key={`${suggestion.type}-${suggestion.value}`}
                    className={`search-suggestion-item ${highlightedIndex === adjustedIndex ? 'highlighted' : ''}`}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    onMouseEnter={() => setHighlightedIndex(adjustedIndex)}
                  >
                    <span className={`suggestion-icon ${suggestion.type}`}>
                      {suggestion.type === 'business' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                          <line x1="7" y1="7" x2="7.01" y2="7" />
                        </svg>
                      )}
                    </span>
                    <span className="suggestion-content">
                      <span className="suggestion-text">
                        {highlightMatch(suggestion.value, query)}
                      </span>
                      {suggestion.type === 'business' && suggestion.business?.tags && (
                        <span className="suggestion-meta">
                          {suggestion.business.tags.slice(0, 2).join(' • ')}
                        </span>
                      )}
                      {suggestion.type === 'tag' && (
                        <span className="suggestion-meta">Category</span>
                      )}
                    </span>
                    <span className="suggestion-type-badge">
                      {suggestion.type === 'business' ? 'Business' : 'Tag'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* No results message */}
          {query && suggestions.length === 0 && (
            <div className="search-no-results">
              <span className="no-results-icon">🔍</span>
              <span>No matches for "{query}"</span>
              <span className="no-results-hint">Try a different search term</span>
            </div>
          )}
        </div>
      )}

      {/* Popular Tags */}
      {showPopularTags && popularTags.length > 0 && (
        <div className="smart-search-popular">
          <span className="popular-label">Popular:</span>
          {popularTags.map(tag => (
            <button
              key={tag}
              className="popular-tag"
              onClick={() => handlePopularTagClick(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
