'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface UpdateNotificationProps {
  onUpdate: () => void
  onDismiss: () => void
  show: boolean
}

export default function UpdateNotification({ onUpdate, onDismiss, show }: UpdateNotificationProps) {
  const [pulse, setPulse] = useState(false)

  // Pulse animation to draw attention
  useEffect(() => {
    if (show) {
      const interval = setInterval(() => {
        setPulse(true)
        setTimeout(() => setPulse(false), 1000)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop overlay to ensure visibility */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.3)',
              zIndex: 9998,
            }}
            onClick={onDismiss}
          />
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{
              y: 0,
              opacity: 1,
              scale: pulse ? 1.02 : 1,
            }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed',
              bottom: '1rem',
              right: '1rem',
              left: '1rem',
              maxWidth: '420px',
              margin: '0 auto',
              zIndex: 9999,
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
              border: '3px solid var(--primary)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  flexShrink: 0,
                  boxShadow: '0 4px 15px rgba(153, 237, 195, 0.4)',
                }}
              >
                🚀
              </div>
              <div style={{ flex: 1 }}>
                <h4
                  style={{
                    margin: '0 0 0.5rem',
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: 'var(--dark)',
                  }}
                >
                  New Version Available!
                </h4>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.9rem',
                    color: 'var(--muted)',
                    lineHeight: 1.6,
                  }}
                >
                  Tap <strong>Update Now</strong> to get the latest features, improvements, and bug fixes.
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
              }}
            >
              <button
                onClick={onUpdate}
                style={{
                  flex: 2,
                  padding: '0.875rem 1.25rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  color: 'var(--dark)',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 4px 15px rgba(153, 237, 195, 0.3)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(153, 237, 195, 0.4)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(153, 237, 195, 0.3)'
                }}
              >
                Update Now
              </button>
              <button
                onClick={onDismiss}
                style={{
                  flex: 1,
                  padding: '0.875rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  background: 'transparent',
                  color: 'var(--muted)',
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--muted)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb'
                }}
              >
                Later
              </button>
            </div>

            <p
              style={{
                margin: 0,
                fontSize: '0.75rem',
                color: 'var(--muted)',
                textAlign: 'center',
                opacity: 0.8,
              }}
            >
              No reinstall needed - just tap update!
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
