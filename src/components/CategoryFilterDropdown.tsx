'use client'

import { useState, useRef, useEffect } from 'react'

// Organized filter categories with popular tags
const FILTER_CATEGORIES = [
  {
    name: 'Food & Drink',
    icon: '🍽️',
    tags: ['Restaurant', 'Coffee', 'Cafe', 'Bakery', 'Pizza', 'Mexican', 'Asian', 'Food Truck']
  },
  {
    name: 'Shopping',
    icon: '🛍️',
    tags: ['Boutique', 'Vintage', 'Gift Shop', 'Florist', 'Books', 'Jewelry']
  },
  {
    name: 'Health & Beauty',
    icon: '💆',
    tags: ['Gym', 'Yoga', 'Spa', 'Hair Salon', 'Barbershop', 'Nail Salon', 'Massage']
  },
  {
    name: 'Services',
    icon: '🔧',
    tags: ['Auto Repair', 'Cleaning', 'HVAC', 'Roofing', 'Plumbing', 'Electrician', 'Contractor']
  },
  {
    name: 'Automotive',
    icon: '🚗',
    tags: ['Car Dealer', 'Auto Repair', 'Car Wash', 'Detailing', 'Tires', 'Oil Change']
  },
  {
    name: 'Lifestyle',
    icon: '✨',
    tags: ['Outdoors', 'Wellness', 'Pets', 'Family', 'Entertainment', 'Photography']
  }
]

interface CategoryFilterDropdownProps {
  activeChips: Set<string>
  onToggleChip: (chip: string) => void
}

export default function CategoryFilterDropdown({
  activeChips,
  onToggleChip
}: CategoryFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedCategory(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const activeCount = activeChips.size

  return (
    <div className="category-filter-dropdown" ref={dropdownRef}>
      <style jsx>{`
        .category-filter-dropdown {
          position: relative;
          width: 100%;
        }

        .filter-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.875rem 1rem;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.9375rem;
        }

        .filter-trigger:hover {
          border-color: var(--primary, #99edc3);
        }

        .filter-trigger.active {
          border-color: var(--primary, #99edc3);
          background: linear-gradient(135deg, rgba(153, 237, 195, 0.05), rgba(194, 175, 240, 0.05));
        }

        .trigger-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .trigger-icon {
          font-size: 1.25rem;
        }

        .trigger-text {
          font-weight: 600;
          color: var(--dark, #373737);
        }

        .active-badge {
          background: linear-gradient(135deg, var(--primary, #99edc3), var(--secondary, #c2aff0));
          color: var(--dark, #373737);
          padding: 0.25rem 0.625rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .chevron {
          transition: transform 0.2s;
          color: var(--muted, #6b7280);
        }

        .chevron.open {
          transform: rotate(180deg);
        }

        .dropdown-panel {
          position: absolute;
          top: calc(100% + 0.5rem);
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
          z-index: 100;
          overflow: hidden;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.5rem;
          padding: 1rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .category-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 0.875rem;
          background: #f9fafb;
          border: 1px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
          text-align: left;
        }

        .category-button:hover {
          background: #f3f4f6;
          border-color: #e5e7eb;
        }

        .category-button.selected {
          background: linear-gradient(135deg, rgba(153, 237, 195, 0.15), rgba(194, 175, 240, 0.15));
          border-color: var(--primary, #99edc3);
        }

        .category-button .icon {
          font-size: 1.125rem;
        }

        .category-button .name {
          font-weight: 500;
          color: var(--dark, #373737);
        }

        .tags-section {
          padding: 1rem;
          background: #fafafa;
        }

        .tags-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          font-weight: 600;
          color: var(--dark, #373737);
        }

        .tags-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tag-chip {
          padding: 0.5rem 0.875rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.8125rem;
          transition: all 0.2s;
        }

        .tag-chip:hover {
          border-color: var(--primary, #99edc3);
          background: rgba(153, 237, 195, 0.1);
        }

        .tag-chip.active {
          background: linear-gradient(135deg, var(--primary, #99edc3), var(--secondary, #c2aff0));
          border-color: transparent;
          font-weight: 600;
        }

        .selected-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }

        .selected-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.625rem;
          background: linear-gradient(135deg, var(--primary, #99edc3), var(--secondary, #c2aff0));
          color: var(--dark, #373737);
          border-radius: 16px;
          font-size: 0.8125rem;
          font-weight: 500;
        }

        .selected-tag button {
          background: rgba(0, 0, 0, 0.1);
          border: none;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.75rem;
          line-height: 1;
          color: var(--dark, #373737);
        }

        .selected-tag button:hover {
          background: rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 640px) {
          .categories-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      {/* Trigger Button */}
      <button
        className={`filter-trigger ${isOpen || activeCount > 0 ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="trigger-content">
          <span className="trigger-icon">🏷️</span>
          <span className="trigger-text">
            {activeCount > 0 ? `${activeCount} filter${activeCount > 1 ? 's' : ''} active` : 'Browse by Category'}
          </span>
          {activeCount > 0 && (
            <span className="active-badge">{activeCount}</span>
          )}
        </div>
        <span className={`chevron ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {/* Selected Tags Display (always visible when tags are selected) */}
      {activeCount > 0 && !isOpen && (
        <div className="selected-tags">
          {Array.from(activeChips).map(chip => (
            <span key={chip} className="selected-tag">
              {chip}
              <button onClick={() => onToggleChip(chip)} title="Remove filter">×</button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="dropdown-panel">
          {/* Category Buttons */}
          <div className="categories-grid">
            {FILTER_CATEGORIES.map(category => (
              <button
                key={category.name}
                className={`category-button ${selectedCategory === category.name ? 'selected' : ''}`}
                onClick={() => setSelectedCategory(
                  selectedCategory === category.name ? null : category.name
                )}
              >
                <span className="icon">{category.icon}</span>
                <span className="name">{category.name}</span>
              </button>
            ))}
          </div>

          {/* Tags for Selected Category */}
          {selectedCategory && (
            <div className="tags-section">
              <div className="tags-header">
                {FILTER_CATEGORIES.find(c => c.name === selectedCategory)?.icon}
                {selectedCategory}
              </div>
              <div className="tags-grid">
                {FILTER_CATEGORIES.find(c => c.name === selectedCategory)?.tags.map(tag => (
                  <button
                    key={tag}
                    className={`tag-chip ${activeChips.has(tag) ? 'active' : ''}`}
                    onClick={() => onToggleChip(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Show all selected tags when dropdown is open */}
          {activeCount > 0 && (
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                Active Filters:
              </div>
              <div className="selected-tags" style={{ marginTop: 0 }}>
                {Array.from(activeChips).map(chip => (
                  <span key={chip} className="selected-tag">
                    {chip}
                    <button onClick={() => onToggleChip(chip)} title="Remove filter">×</button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
