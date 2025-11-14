'use client'

export default function BusinessOrders() {
  return (
    <div className="business-dashboard">
      <div className="business-dashboard-header">
        <h1>Orders</h1>
      </div>

      <div className="alert alert-info">
        Order management will be available once the e-commerce features are
        implemented. You'll be able to view, process, and fulfill customer
        orders.
      </div>

      <div className="business-form-container">
        <div className="empty-state">
          <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</span>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>No orders yet</h3>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Customer orders will appear here once e-commerce is enabled
          </p>
        </div>
      </div>
    </div>
  )
}
