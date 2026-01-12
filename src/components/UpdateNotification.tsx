'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface UpdateNotificationProps {
  onUpdate: () => void
  onDismiss: () => void
  show: boolean
}

export default function UpdateNotification({ onUpdate, onDismiss, show }: UpdateNotificationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'fixed',
            bottom: '1rem',
            right: '1rem',
            left: '1rem',
            maxWidth: '400px',
            margin: '0 auto',
            zIndex: 9999,
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            border: '2px solid var(--primary)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                flexShrink: 0,
              }}
            >
              🎉
            </div>
            <div style={{ flex: 1 }}>
              <h4
                style={{
                  margin: '0 0 0.25rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--dark)',
                }}
              >
                Update Available!
              </h4>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  color: 'var(--muted)',
                  lineHeight: 1.5,
                }}
              >
                A new version of Try Local is ready. Refresh to get the latest features and improvements.
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
              className="btn btn-primary"
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
              }}
            >
              Refresh Now
            </button>
            <button
              onClick={onDismiss}
              className="btn btn-outline"
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
              }}
            >
              Later
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
