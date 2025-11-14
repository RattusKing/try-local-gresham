'use client'

export default function AdminOrders() {
  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1>All Orders</h1>
      </div>

      <div className="alert alert-info">
        Order monitoring will be available once e-commerce features are
        implemented. You'll be able to view all platform orders and help resolve
        issues.
      </div>

      <div style={{ background: 'white', borderRadius: '0.5rem', padding: '2rem' }}>
        <div className="empty-state">
          <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</span>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>No orders yet</h3>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Platform orders will appear here once e-commerce is enabled
          </p>
        </div>
      </div>
    </div>
  )
}
