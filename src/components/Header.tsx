'use client'

import { useAuth } from '@/lib/firebase/auth-context'
import { useState, useRef, useEffect } from 'react'

export default function Header({ onSignIn }: { onSignIn: () => void }) {
  const { user, signOut } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
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
            TL
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
          <a href="#for-businesses" className="nav-link">
            For Businesses
          </a>

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
    </header>
  )
}
