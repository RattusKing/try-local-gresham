'use client'

import { useState, useMemo } from 'react'
import { BUSINESS_TAG_CATEGORIES, MAX_BUSINESS_TAGS, MIN_BUSINESS_TAGS } from '@/lib/types'

interface TagSelectorProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
  maxTags?: number
}

export default function TagSelector({
  selectedTags,
  onChange,
  maxTags = MAX_BUSINESS_TAGS
}: TagSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // Filter categories and tags based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return BUSINESS_TAG_CATEGORIES
    }

    const query = searchQuery.toLowerCase()
    return BUSINESS_TAG_CATEGORIES.map(category => ({
      ...category,
      tags: category.tags.filter(tag =>
        tag.toLowerCase().includes(query)
      )
    })).filter(category => category.tags.length > 0)
  }, [searchQuery])

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      // Remove tag
      onChange(selectedTags.filter(t => t !== tag))
    } else if (selectedTags.length < maxTags) {
      // Add tag
      onChange([...selectedTags, tag])
    }
  }

  const handleRemoveTag = (tag: string) => {
    onChange(selectedTags.filter(t => t !== tag))
  }

  const toggleCategory = (categoryName: string) => {
    setExpandedCategory(expandedCategory === categoryName ? null : categoryName)
  }

  return (
    <div className="tag-selector">
      <style jsx>{`
        .tag-selector {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }

        .selected-tags-section {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, rgba(153, 237, 195, 0.05), rgba(194, 175, 240, 0.05));
        }

        .selected-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .selected-header h4 {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--dark, #373737);
        }

        .tag-count {
          font-size: 0.75rem;
          color: var(--muted, #6b7280);
          padding: 0.25rem 0.5rem;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 12px;
        }

        .tag-count.at-max {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .selected-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          min-height: 32px;
        }

        .selected-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.75rem;
          background: linear-gradient(135deg, var(--primary, #99edc3), var(--secondary, #c2aff0));
          color: var(--dark, #373737);
          border: none;
          border-radius: 20px;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .selected-tag:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(153, 237, 195, 0.3);
        }

        .selected-tag .remove {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          background: rgba(0, 0, 0, 0.15);
          border-radius: 50%;
          font-size: 0.75rem;
          line-height: 1;
        }

        .empty-selection {
          color: var(--muted, #6b7280);
          font-size: 0.875rem;
          font-style: italic;
        }

        .search-section {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary, #99edc3);
          box-shadow: 0 0 0 3px rgba(153, 237, 195, 0.2);
        }

        .categories-section {
          max-height: 400px;
          overflow-y: auto;
        }

        .category {
          border-bottom: 1px solid #f3f4f6;
        }

        .category:last-child {
          border-bottom: none;
        }

        .category-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1rem;
          cursor: pointer;
          background: white;
          transition: background 0.2s;
        }

        .category-header:hover {
          background: #f9fafb;
        }

        .category-title {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          font-weight: 600;
          color: var(--dark, #373737);
        }

        .category-icon {
          font-size: 1.25rem;
        }

        .category-count {
          font-size: 0.75rem;
          color: var(--muted, #6b7280);
          font-weight: normal;
          background: #f3f4f6;
          padding: 0.125rem 0.5rem;
          border-radius: 10px;
          margin-left: 0.5rem;
        }

        .expand-icon {
          color: var(--muted, #6b7280);
          font-size: 0.875rem;
          transition: transform 0.2s;
        }

        .category.expanded .expand-icon {
          transform: rotate(180deg);
        }

        .category-tags {
          display: none;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding: 0 1rem 1rem;
          background: #fafafa;
        }

        .category.expanded .category-tags {
          display: flex;
        }

        .tag-option {
          padding: 0.375rem 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          background: white;
          color: var(--dark, #373737);
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tag-option:hover:not(.selected):not(.disabled) {
          border-color: var(--primary, #99edc3);
          background: rgba(153, 237, 195, 0.1);
        }

        .tag-option.selected {
          background: linear-gradient(135deg, var(--primary, #99edc3), var(--secondary, #c2aff0));
          border-color: transparent;
          font-weight: 500;
        }

        .tag-option.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .helper-text {
          padding: 0.75rem 1rem;
          font-size: 0.75rem;
          color: var(--muted, #6b7280);
          background: #fafafa;
          border-top: 1px solid #e5e7eb;
        }

        .no-results {
          padding: 2rem;
          text-align: center;
          color: var(--muted, #6b7280);
        }

        .no-results p {
          margin: 0;
        }

        @media (max-width: 640px) {
          .categories-section {
            max-height: 300px;
          }
        }
      `}</style>

      {/* Selected Tags Display */}
      <div className="selected-tags-section">
        <div className="selected-header">
          <h4>Selected Tags</h4>
          <span className={`tag-count ${selectedTags.length >= maxTags ? 'at-max' : ''}`}>
            {selectedTags.length} / {maxTags}
          </span>
        </div>
        <div className="selected-tags">
          {selectedTags.length > 0 ? (
            selectedTags.map(tag => (
              <button
                key={tag}
                type="button"
                className="selected-tag"
                onClick={() => handleRemoveTag(tag)}
                title="Click to remove"
              >
                {tag}
                <span className="remove">×</span>
              </button>
            ))
          ) : (
            <span className="empty-selection">Click tags below to add them</span>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="search-section">
        <input
          type="text"
          className="search-input"
          placeholder="Search tags... (e.g., Coffee, Yoga, Restaurant)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Categories */}
      <div className="categories-section">
        {filteredCategories.length > 0 ? (
          filteredCategories.map(category => {
            const selectedInCategory = category.tags.filter(t => selectedTags.includes(t)).length
            const isExpanded = expandedCategory === category.name || searchQuery.trim().length > 0

            return (
              <div
                key={category.name}
                className={`category ${isExpanded ? 'expanded' : ''}`}
              >
                <div
                  className="category-header"
                  onClick={() => toggleCategory(category.name)}
                >
                  <span className="category-title">
                    <span className="category-icon">{category.icon}</span>
                    {category.name}
                    {selectedInCategory > 0 && (
                      <span className="category-count">{selectedInCategory} selected</span>
                    )}
                  </span>
                  <span className="expand-icon">▼</span>
                </div>
                <div className="category-tags">
                  {category.tags.map(tag => {
                    const isSelected = selectedTags.includes(tag)
                    const isDisabled = !isSelected && selectedTags.length >= maxTags

                    return (
                      <button
                        key={tag}
                        type="button"
                        className={`tag-option ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                        onClick={() => !isDisabled && handleTagClick(tag)}
                        disabled={isDisabled}
                        title={isDisabled ? `Maximum ${maxTags} tags allowed` : isSelected ? 'Click to remove' : 'Click to add'}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })
        ) : (
          <div className="no-results">
            <p>No tags found matching &quot;{searchQuery}&quot;</p>
          </div>
        )}
      </div>

      {/* Helper Text */}
      <div className="helper-text">
        Select {MIN_BUSINESS_TAGS}-{maxTags} tags that best describe your business.
        More relevant tags help customers find you.
      </div>
    </div>
  )
}
