'use client'

export default function BusinessProducts() {
  return (
    <div className="business-dashboard">
      <div className="business-dashboard-header">
        <h1>Products & Services</h1>
      </div>

      <div className="alert alert-info">
        Product and service management will be available in the next update.
        You'll be able to add items, set prices, manage inventory, and more.
      </div>

      <div className="business-form-container">
        <div className="empty-state">
          <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</span>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Products coming soon</h3>
          <p style={{ margin: 0, color: '#6b7280' }}>
            This feature is under development and will be available soon
          </p>
        </div>
      </div>
    </div>
  )
}
