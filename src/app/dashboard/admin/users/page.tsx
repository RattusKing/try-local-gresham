'use client'

export default function AdminUsers() {
  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1>User Management</h1>
      </div>

      <div className="alert alert-info">
        User management features will be available in a future update. You'll be
        able to view all users, manage roles, and moderate accounts.
      </div>

      <div style={{ background: 'white', borderRadius: '0.5rem', padding: '2rem' }}>
        <div className="empty-state">
          <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</span>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>User management coming soon</h3>
          <p style={{ margin: 0, color: '#6b7280' }}>
            This feature is under development and will be available soon
          </p>
        </div>
      </div>
    </div>
  )
}
