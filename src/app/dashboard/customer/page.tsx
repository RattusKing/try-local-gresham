'use client'

import { useAuth } from '@/lib/firebase/auth-context'
import { db } from '@/lib/firebase/config'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { UserProfile } from '@/lib/types'
import Link from 'next/link'
import './customer.css'

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    displayName: '',
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
          displayName: data.displayName || '',
          email: data.email || '',
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
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="customer-dashboard">
      <div className="customer-dashboard-header">
        <h1>My Profile</h1>
        {!editing && (
          <button className="btn-edit" onClick={() => setEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="profile-container">
        {editing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              <input
                type="text"
                id="displayName"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                disabled
                className="input-disabled"
              />
              <p className="form-hint">Email cannot be changed</p>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditing(false)
                  setFormData({
                    displayName: profile?.displayName || '',
                    email: profile?.email || '',
                  })
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-view">
            <div className="profile-avatar">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} />
              ) : (
                <div className="profile-avatar-text">
                  {user?.email?.[0].toUpperCase()}
                </div>
              )}
            </div>

            <div className="profile-info">
              <div className="profile-field">
                <label>Display Name</label>
                <p>{profile?.displayName || 'Not set'}</p>
              </div>

              <div className="profile-field">
                <label>Email</label>
                <p>{profile?.email}</p>
              </div>

              <div className="profile-field">
                <label>Account Type</label>
                <p className="profile-role">
                  {profile?.role?.replace('_', ' ')}
                </p>
              </div>

              <div className="profile-field">
                <label>Member Since</label>
                <p>
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString()
                    : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-quick-links">
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
        </div>
      </div>
    </div>
  )
}
