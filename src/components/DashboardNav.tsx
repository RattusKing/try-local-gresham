'use client'

import { useAuth } from '@/lib/firebase/auth-context'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import './DashboardNav.css'

export default function DashboardNav() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const adminLinks = [
    { href: '/dashboard/admin/profile', label: 'My Profile', icon: '👤' },
    { href: '/dashboard/admin', label: 'Business Approvals', icon: '✓' },
    { href: '/dashboard/admin/applications', label: 'Applications', icon: '📋' },
    { href: '/dashboard/admin/users', label: 'User Management', icon: '👥' },
    { href: '/dashboard/admin/orders', label: 'All Orders', icon: '📦' },
    { href: '/dashboard/admin/banners', label: 'Promo Banners', icon: '📢' },
  ]

  const businessLinks = [
    { href: '/dashboard/business/profile', label: 'My Profile', icon: '👤' },
    { href: '/dashboard/business', label: 'My Business', icon: '🏪' },
    { href: '/dashboard/business/products', label: 'Products', icon: '📦' },
    { href: '/dashboard/business/services', label: 'Services', icon: '📅' },
    { href: '/dashboard/business/appointments', label: 'Appointments', icon: '🗓️' },
    { href: '/dashboard/business/orders', label: 'Orders', icon: '🛒' },
    { href: '/dashboard/business/analytics', label: 'Analytics', icon: '📊' },
    { href: '/dashboard/business/discounts', label: 'Discount Codes', icon: '🎟️' },
    { href: '/dashboard/business/settings', label: 'Settings', icon: '⚙️' },
  ]

  const customerLinks = [
    { href: '/dashboard/customer', label: 'My Profile', icon: '👤' },
    { href: '/dashboard/customer/appointments', label: 'My Appointments', icon: '📅' },
    { href: '/dashboard/customer/orders', label: 'Order History', icon: '📦' },
    { href: '/dashboard/customer/favorites', label: 'Favorites', icon: '❤️' },
  ]

  const links =
    user?.role === 'admin'
      ? adminLinks
      : user?.role === 'business_owner'
      ? businessLinks
      : customerLinks

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        className="dashboard-nav-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
      >
        <span className={`hamburger ${isOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="dashboard-nav-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <nav className={`dashboard-nav ${isOpen ? 'is-open' : ''}`}>
        <div className="dashboard-nav-header">
          <Link href="/" className="dashboard-nav-logo">
            Try Local Gresham
          </Link>
          <div className="dashboard-nav-user">
            <div className="dashboard-nav-avatar">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} />
              ) : (
                <div className="dashboard-nav-avatar-text">
                  {user?.email?.[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="dashboard-nav-user-info">
              <p className="dashboard-nav-user-name">
                {user?.displayName || user?.email}
              </p>
              <p className="dashboard-nav-user-role">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>

        <ul className="dashboard-nav-links">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={
                  pathname === link.href
                    ? 'dashboard-nav-link active'
                    : 'dashboard-nav-link'
                }
                onClick={() => setIsOpen(false)}
              >
                <span className="dashboard-nav-link-icon">{link.icon}</span>
                <span className="dashboard-nav-link-label">{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="dashboard-nav-footer">
          <Link href="/" className="dashboard-nav-back">
            ← Back to Home
          </Link>
        </div>
      </nav>
    </>
  )
}
