'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase/auth-context'
import { useNotifications } from '@/hooks/useNotifications'
import { db } from '@/lib/firebase/config'
import { doc, updateDoc, getDoc } from 'firebase/firestore'

interface NotificationSettingsProps {
  showTitle?: boolean
}

export default function NotificationSettings({ showTitle = true }: NotificationSettingsProps) {
  const { user } = useAuth()
  const {
    permission,
    platform,
    isLoading: notifLoading,
    isSubscribed,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification,
  } = useNotifications()

  const [emailNotifications, setEmailNotifications] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [pushLoading, setPushLoading] = useState(false)

  // Load user's notification preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user || !db) return
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setEmailNotifications(data.emailNotifications !== false) // Default to true
        }
      } catch (err) {
        console.error('Failed to load notification preferences:', err)
      }
    }
    loadPreferences()
  }, [user])

  const handleEmailToggle = async (enabled: boolean) => {
    if (!user || !db) return

    try {
      setSaving(true)
      setError('')
      setEmailNotifications(enabled)

      await updateDoc(doc(db, 'users', user.uid), {
        emailNotifications: enabled,
        updatedAt: new Date(),
      })

      setSuccess(enabled ? 'Email notifications enabled' : 'Email notifications disabled')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update preferences')
      setEmailNotifications(!enabled) // Revert on error
    } finally {
      setSaving(false)
    }
  }

  const handleEnablePush = async () => {
    if (!user) return

    try {
      setPushLoading(true)
      setError('')

      // First request permission
      const perm = await requestPermission()
      if (perm !== 'granted') {
        setError('Please allow notifications in your browser settings')
        return
      }

      // Determine user type
      const userType = user.role === 'business_owner' || user.role === 'admin'
        ? 'business_owner'
        : 'customer'

      // Subscribe to push
      const success = await subscribeToPush(user.uid, userType, user.uid)

      if (success) {
        // Update Firestore
        await updateDoc(doc(db!, 'users', user.uid), {
          pushNotifications: true,
          updatedAt: new Date(),
        })

        setSuccess('Push notifications enabled!')

        // Send test notification directly via service worker
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification('Try Local Gresham', {
              body: 'Notifications are working! You\'ll receive updates about orders and local businesses.',
              icon: '/icon-192x192.png',
              badge: '/icon-192x192.png',
              tag: 'test-notification',
            })
          }).catch(err => console.error('Test notification failed:', err))
        }

        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Failed to enable push notifications')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to enable push notifications')
    } finally {
      setPushLoading(false)
    }
  }

  const handleDisablePush = async () => {
    if (!user) return

    try {
      setPushLoading(true)
      setError('')

      const success = await unsubscribeFromPush(user.uid)

      if (success) {
        await updateDoc(doc(db!, 'users', user.uid), {
          pushNotifications: false,
          updatedAt: new Date(),
        })

        setSuccess('Push notifications disabled')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to disable push notifications')
    } finally {
      setPushLoading(false)
    }
  }

  const getPushStatusMessage = () => {
    if (!platform.supportsNotifications) {
      return 'Your browser does not support notifications'
    }
    if (platform.isIOS && !platform.isStandalone) {
      return 'Install the app to your home screen to enable notifications'
    }
    if (permission === 'denied') {
      return 'Notifications blocked. Please enable in browser settings'
    }
    if (isSubscribed) {
      return 'Push notifications are enabled'
    }
    return 'Enable push notifications to get instant updates'
  }

  return (
    <div className="notification-settings">
      {showTitle && <h2>Notification Settings</h2>}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          {success}
        </div>
      )}

      <div className="notification-options">
        {/* Email Notifications */}
        <div className="notification-option">
          <div className="notification-option-info">
            <div className="notification-option-header">
              <span className="notification-icon">📧</span>
              <h3>Email Notifications</h3>
            </div>
            <p>Receive updates about orders, quotes, and important announcements via email</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => handleEmailToggle(e.target.checked)}
              disabled={saving}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* Push Notifications */}
        <div className="notification-option">
          <div className="notification-option-info">
            <div className="notification-option-header">
              <span className="notification-icon">🔔</span>
              <h3>Push Notifications</h3>
            </div>
            <p>{getPushStatusMessage()}</p>
          </div>
          {!notifLoading && (
            <>
              {isSubscribed ? (
                <button
                  className="btn btn-outline"
                  onClick={handleDisablePush}
                  disabled={pushLoading}
                  style={{ minWidth: '120px' }}
                >
                  {pushLoading ? 'Updating...' : 'Disable'}
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleEnablePush}
                  disabled={pushLoading || permission === 'denied' || !platform.supportsNotifications || (platform.isIOS && !platform.isStandalone)}
                  style={{ minWidth: '120px' }}
                >
                  {pushLoading ? 'Enabling...' : 'Enable'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .notification-settings {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .notification-settings h2 {
          margin: 0 0 1.5rem;
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
        }
        .notification-options {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .notification-option {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 8px;
        }
        .notification-option-info {
          flex: 1;
        }
        .notification-option-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }
        .notification-icon {
          font-size: 1.25rem;
        }
        .notification-option-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
        }
        .notification-option-info p {
          margin: 0;
          font-size: 0.875rem;
          color: #6b7280;
        }
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 52px;
          height: 28px;
          flex-shrink: 0;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background-color: #d1d5db;
          transition: 0.3s;
          border-radius: 28px;
        }
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 22px;
          width: 22px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        .toggle-switch input:checked + .toggle-slider {
          background-color: var(--primary, #f97316);
        }
        .toggle-switch input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }
        .toggle-switch input:disabled + .toggle-slider {
          opacity: 0.5;
          cursor: not-allowed;
        }
        @media (max-width: 640px) {
          .notification-option {
            flex-direction: column;
            align-items: flex-start;
          }
          .notification-option button,
          .notification-option .toggle-switch {
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  )
}
