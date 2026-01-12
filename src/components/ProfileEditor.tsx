'use client'

import { useAuth } from '@/lib/firebase/auth-context'
import { db } from '@/lib/firebase/config'
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { UserProfile } from '@/lib/types'
import PaymentMethodsManager from '@/components/stripe/PaymentMethodsManager'

export default function ProfileEditor() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    email: '',
  })

  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user || !db) return

    try {
      setLoading(true)
      const profileRef = doc(db, 'users', user.uid)
      const profileSnap = await getDoc(profileRef)

      if (profileSnap.exists()) {
        const data = profileSnap.data() as UserProfile
        setProfile(data)
        setFormData({
          displayName: data.displayName || user.displayName || '',
          phone: data.phone || '',
          email: data.email || user.email || '',
        })
      } else {
        // Create initial profile if it doesn't exist
        const initialProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          phone: '',
          role: 'customer',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        await setDoc(profileRef, initialProfile)
        setProfile(initialProfile as UserProfile)
        setFormData({
          displayName: initialProfile.displayName,
          phone: initialProfile.phone,
          email: initialProfile.email,
        })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db) return

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const profileRef = doc(db, 'users', user.uid)
      await updateDoc(profileRef, {
        displayName: formData.displayName,
        phone: formData.phone,
        updatedAt: new Date(),
      })

      setSuccess('Profile updated successfully!')
      setEditing(false)
      await loadProfile()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1>My Profile</h1>
        {!editing && (
          <button
            className="btn btn-primary"
            onClick={() => setEditing(true)}
          >
            Edit Profile
          </button>
        )}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

      {editing ? (
        <form onSubmit={handleSubmit} style={{
          background: 'white',
          padding: '2rem',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)'
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="displayName" style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: 'var(--dark)'
            }}>
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid rgba(194, 175, 240, 0.3)',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="phone" style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: 'var(--dark)'
            }}>
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="(503) 555-1234"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid rgba(194, 175, 240, 0.3)',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="email" style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: 'var(--dark)'
            }}>
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              disabled
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid rgba(194, 175, 240, 0.3)',
                borderRadius: '8px',
                fontSize: '1rem',
                background: '#f3f4f6',
                cursor: 'not-allowed',
                opacity: 0.7
              }}
            />
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--muted)',
              marginTop: '0.5rem'
            }}>
              Email cannot be changed
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ flex: 1 }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setEditing(false)
                setFormData({
                  displayName: profile?.displayName || '',
                  phone: profile?.phone || '',
                  email: profile?.email || '',
                })
                setError('')
                setSuccess('')
              }}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            marginBottom: '2rem',
            paddingBottom: '2rem',
            borderBottom: '2px solid rgba(194, 175, 240, 0.2)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: user?.photoURL ? 'transparent' : 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--dark)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow)'
            }}>
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span>{(profile?.displayName || profile?.email || 'U')[0].toUpperCase()}</span>
              )}
            </div>
            <div>
              <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.75rem' }}>
                {profile?.displayName || 'No name set'}
              </h2>
              <p style={{ color: 'var(--muted)', margin: 0 }}>
                {profile?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'User'}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--muted)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Display Name
              </label>
              <p style={{
                margin: 0,
                fontSize: '1.125rem',
                color: 'var(--dark)'
              }}>
                {profile?.displayName || 'Not set'}
              </p>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--muted)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Phone Number
              </label>
              <p style={{
                margin: 0,
                fontSize: '1.125rem',
                color: 'var(--dark)'
              }}>
                {profile?.phone || 'Not set'}
              </p>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--muted)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Email
              </label>
              <p style={{
                margin: 0,
                fontSize: '1.125rem',
                color: 'var(--dark)'
              }}>
                {profile?.email}
              </p>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--muted)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Account Type
              </label>
              <p style={{
                margin: 0,
                fontSize: '1.125rem',
                color: 'var(--dark)',
                textTransform: 'capitalize'
              }}>
                {profile?.role?.replace('_', ' ')}
              </p>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--muted)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Member Since
              </label>
              <p style={{
                margin: 0,
                fontSize: '1.125rem',
                color: 'var(--dark)'
              }}>
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods Section */}
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        marginTop: '2rem'
      }}>
        <PaymentMethodsManager />
      </div>
    </div>
  )
}
