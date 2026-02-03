'use client'

import { useAuth } from '@/lib/firebase/auth-context'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { collection, query, where, getDocs } from 'firebase/firestore'
import './DashboardNav.css'

interface NavLink {
  href: string
  label: string
  icon: string
  badge?: number
}

export default function DashboardNav() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [pendingQuotes, setPendingQuotes] = useState(0)
  const [pendingAppointments, setPendingAppointments] = useState(0)

  // Fetch notification counts for business owners
  useEffect(() => {
    if (!user || !db || user.role !== 'business_owner') return

    const fetchCounts = async () => {
      try {
        // Count pending quote requests
        const quotesQuery = query(
          collection(db, 'quoteRequests'),
          where('businessId', '==', user.uid),
          where('status', '==', 'pending')
        )
        const quotesSnap = await getDocs(quotesQuery)
        setPendingQuotes(quotesSnap.size)

        // Count pending appointments
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('businessId', '==', user.uid),
          where('status', '==', 'pending')
        )
        const appointmentsSnap = await getDocs(appointmentsQuery)
        setPendingAppointments(appointmentsSnap.size)
      } catch (err) {
        console.warn('Error fetching notification counts:', err)
      }
    }

    fetchCounts()
    // Refresh every 60 seconds
    const interval = setInterval(fetchCounts, 60000)
    return () => clearInterval(interval)
  }, [user])

  const adminLinks: NavLink[] = [
    { href: '/dashboard/admin/profile', label: 'My Profile', icon: '👤' },
    { href: '/dashboard/admin', label: 'Business Approvals', icon: '✓' },
    { href: '/dashboard/admin/applications', label: 'Applications', icon: '📋' },
    { href: '/dashboard/admin/users', label: 'User Management', icon: '👥' },
    { href: '/dashboard/admin/orders', label: 'All Orders', icon: '📦' },
    { href: '/dashboard/admin/banners', label: 'Promo Banners', icon: '📢' },
    { href: '/dashboard/admin/sponsored', label: 'Sponsored Banners', icon: '⭐' },
  ]

  const businessLinks: NavLink[] = [
    { href: '/dashboard/business/profile', label: 'My Profile', icon: '👤' },
    { href: '/dashboard/business', label: 'My Business', icon: '🏪' },
    { href: '/dashboard/business/products', label: 'Products', icon: '📦' },
    { href: '/dashboard/business/services', label: 'Services', icon: '📅' },
    { href: '/dashboard/business/appointments', label: 'Appointments', icon: '🗓️', badge: pendingAppointments },
    { href: '/dashboard/business/quotes', label: 'Quote Requests', icon: '📋', badge: pendingQuotes },
    { href: '/dashboard/business/orders', label: 'Orders', icon: '🛒' },
    { href: '/dashboard/business/analytics', label: 'Analytics', icon: '📊' },
    { href: '/dashboard/business/discounts', label: 'Discount Codes', icon: '🎟️' },
    { href: '/dashboard/business/settings', label: 'Settings', icon: '⚙️' },
  ]

  const customerLinks: NavLink[] = [
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

  const totalBadge = pendingQuotes + pendingAppointments

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
        {totalBadge > 0 && (
          <span className="nav-toggle-badge">{totalBadge}</span>
        )}
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
                {link.badge && link.badge > 0 ? (
                  <span className="dashboard-nav-badge">{link.badge}</span>
                ) : null}
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
