'use client'

import { useAuth } from '@/lib/firebase/auth-context'
import { useCart } from '@/lib/cart-context'
import { useState, useRef, useEffect } from 'react'
import CartModal from './CartModal'
import BusinessApplicationModal from './BusinessApplicationModal'

export default function Header({ onSignIn }: { onSignIn: () => void }) {
  const { user, signOut } = useAuth()
  const { itemCount } = useCart()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [showBusinessApp, setShowBusinessApp] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <img
              src="/logo.jpeg"
              alt="Try Local Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: '2px'
              }}
            />
          </div>
          <span className="brand-name">Try Local</span>
          <span className="brand-subtle">Gresham, OR</span>
        </div>
        <nav className="nav">
          <a href="#discover" className="nav-link">
            Discover
          </a>
          <a href="#categories" className="nav-link">
            Categories
          </a>
          <button onClick={() => setShowBusinessApp(true)} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            For Businesses
          </button>

          <button
            onClick={() => setShowCart(true)}
            className="btn btn-outline"
            style={{ position: 'relative' }}
            aria-label={`Shopping cart with ${itemCount} items`}
          >
            🛒 Cart
            {itemCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: 'var(--primary-orange)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {itemCount}
              </span>
            )}
          </button>

          {user ? (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--orange)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {user.email?.[0].toUpperCase()}
                  </div>
                )}
                <span>{user.displayName || user.email}</span>
              </button>

              {showDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow)',
                    minWidth: '200px',
                    zIndex: 100,
                    border: '1px solid #eee',
                  }}
                >
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee' }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                      {user.displayName || 'User'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>{user.email}</div>
                    {user.role && (
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                        Role: {user.role.replace('_', ' ')}
                      </div>
                    )}
                  </div>
                  <a
                    href="/dashboard"
                    style={{
                      display: 'block',
                      padding: '12px 16px',
                      textDecoration: 'none',
                      color: '#111',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    Dashboard
                  </a>
                  <button
                    onClick={() => {
                      signOut()
                      setShowDropdown(false)
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: '#d32f2f',
                      fontWeight: 600,
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={onSignIn} className="btn btn-outline">
              Sign In
            </button>
          )}
        </nav>
      </div>

      <CartModal isOpen={showCart} onClose={() => setShowCart(false)} />
      <BusinessApplicationModal isOpen={showBusinessApp} onClose={() => setShowBusinessApp(false)} />
    </header>
  )
}
