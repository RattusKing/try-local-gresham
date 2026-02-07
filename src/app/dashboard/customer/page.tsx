'use client'

import ProfileEditor from '@/components/ProfileEditor'
import Link from 'next/link'
import './customer.css'

export default function CustomerDashboard() {
  return (
    <div className="customer-dashboard">
      <ProfileEditor />

      <div className="dashboard-quick-links" style={{ marginTop: '3rem' }}>
        <h2>Quick Links</h2>
        <div className="quick-links-grid">
          <Link href="/" className="quick-link-card">
            <span className="quick-link-icon">🏪</span>
            <span className="quick-link-title">Browse Businesses</span>
            <span className="quick-link-desc">Discover local businesses</span>
          </Link>
          <Link href="/dashboard/customer/orders" className="quick-link-card">
            <span className="quick-link-icon">📦</span>
            <span className="quick-link-title">Order History</span>
            <span className="quick-link-desc">View past orders</span>
          </Link>
          <Link href="/dashboard/customer/favorites" className="quick-link-card">
            <span className="quick-link-icon">❤️</span>
            <span className="quick-link-title">Favorites</span>
            <span className="quick-link-desc">Your saved businesses</span>
          </Link>
          <Link href="/dashboard/customer/appointments" className="quick-link-card">
            <span className="quick-link-icon">📅</span>
            <span className="quick-link-title">Appointments</span>
            <span className="quick-link-desc">Manage your appointments</span>
          </Link>
          <Link href="/dashboard/customer/settings" className="quick-link-card">
            <span className="quick-link-icon">⚙️</span>
            <span className="quick-link-title">Settings</span>
            <span className="quick-link-desc">Notifications & preferences</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
