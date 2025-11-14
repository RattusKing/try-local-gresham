'use client'

import Link from 'next/link'

export default function CustomerOrders() {
  return (
    <div className="customer-dashboard">
      <div className="customer-dashboard-header">
        <h1>Order History</h1>
      </div>

      <div className="profile-container">
        <div className="empty-state">
          <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</span>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>No orders yet</h3>
          <p style={{ margin: 0, color: '#6b7280' }}>
            When you place orders, they'll appear here
          </p>
          <Link
            href="/"
            style={{
              marginTop: '1.5rem',
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: 'var(--primary-orange)',
              color: 'white',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Browse Businesses
          </Link>
        </div>
      </div>
    </div>
  )
}
