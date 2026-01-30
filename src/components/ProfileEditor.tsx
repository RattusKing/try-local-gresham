'use client'

import { useAuth } from '@/lib/firebase/auth-context'
import { db, storage } from '@/lib/firebase/config'
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useEffect, useState, useRef } from 'react'
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  const profilePhotoInputRef = useRef<HTMLInputElement>(null)
  const coverPhotoInputRef = useRef<HTMLInputElement>(null)

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
          photoURL: user.photoURL || '',
          coverPhotoURL: '',
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

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'profile' | 'cover'
  ) => {
    const file = e.target.files?.[0]
    if (!file || !user || !db || !storage) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    const setUploading = type === 'profile' ? setUploadingPhoto : setUploadingCover
    setUploading(true)
    setError('')

    try {
      // Create storage reference
      const timestamp = Date.now()
      const filename = `${type}_${timestamp}_${file.name}`
      const storageRef = ref(storage, `users/${user.uid}/${filename}`)

      // Upload file
      await uploadBytes(storageRef, file)

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef)

      // Update Firestore
      const profileRef = doc(db, 'users', user.uid)
      const updateField = type === 'profile' ? 'photoURL' : 'coverPhotoURL'
      await updateDoc(profileRef, {
        [updateField]: downloadURL,
        updatedAt: new Date(),
      })

      setSuccess(`${type === 'profile' ? 'Profile photo' : 'Cover photo'} updated!`)
      await loadProfile()
    } catch (err: any) {
      setError(`Failed to upload ${type} photo: ${err.message}`)
    } finally {
      setUploading(false)
      // Reset file input
      if (type === 'profile' && profilePhotoInputRef.current) {
        profilePhotoInputRef.current.value = ''
      } else if (type === 'cover' && coverPhotoInputRef.current) {
        coverPhotoInputRef.current.value = ''
      }
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

  const profilePhotoURL = profile?.photoURL || user?.photoURL
  const coverPhotoURL = profile?.coverPhotoURL

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Cover Photo Section */}
      <div style={{
        position: 'relative',
        height: '200px',
        borderRadius: 'var(--radius) var(--radius) 0 0',
        overflow: 'hidden',
        background: coverPhotoURL
          ? `url(${coverPhotoURL}) center/cover no-repeat`
          : 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
      }}>
        {/* Cover photo overlay for better button visibility */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.3) 100%)',
        }} />

        {/* Edit Cover Photo Button */}
        <button
          type="button"
          onClick={() => coverPhotoInputRef.current?.click()}
          disabled={uploadingCover}
          style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            padding: '0.5rem 1rem',
            background: 'rgba(255,255,255,0.9)',
            border: 'none',
            borderRadius: '8px',
            cursor: uploadingCover ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--dark)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          {uploadingCover ? (
            <>
              <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>Edit Cover Photo</span>
            </>
          )}
        </button>
        <input
          ref={coverPhotoInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handlePhotoUpload(e, 'cover')}
          style={{ display: 'none' }}
        />
      </div>

      {/* Profile Header Card */}
      <div style={{
        background: 'white',
        padding: '0 2rem 2rem',
        borderRadius: '0 0 var(--radius) var(--radius)',
        boxShadow: 'var(--shadow)',
        marginBottom: '2rem',
      }}>
        {/* Profile Photo and Name Row */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '1.5rem',
          marginTop: '-50px',
          marginBottom: '1rem',
        }}>
          {/* Profile Photo */}
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '4px solid white',
              background: profilePhotoURL
                ? 'transparent'
                : 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              fontWeight: 700,
              color: 'var(--dark)',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
              {profilePhotoURL ? (
                <img
                  src={profilePhotoURL}
                  alt={profile?.displayName || 'User'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span>{(profile?.displayName || profile?.email || 'U')[0].toUpperCase()}</span>
              )}
            </div>

            {/* Edit Profile Photo Button */}
            <button
              type="button"
              onClick={() => profilePhotoInputRef.current?.click()}
              disabled={uploadingPhoto}
              style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'white',
                border: 'none',
                cursor: uploadingPhoto ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              {uploadingPhoto ? (
                <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--dark)" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </button>
            <input
              ref={profilePhotoInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoUpload(e, 'profile')}
              style={{ display: 'none' }}
            />
          </div>

          {/* Name and Role */}
          <div style={{ paddingBottom: '0.5rem', flex: 1 }}>
            <h1 style={{
              margin: '0 0 0.25rem',
              fontSize: '1.75rem',
              color: 'var(--dark)',
            }}>
              {profile?.displayName || 'No name set'}
            </h1>
            <p style={{
              color: 'var(--muted)',
              margin: 0,
              fontSize: '1rem',
            }}>
              {profile?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'User'}
            </p>
          </div>

          {/* Edit Profile Button */}
          {!editing && (
            <button
              className="btn btn-primary"
              onClick={() => setEditing(true)}
              style={{ marginBottom: '0.5rem' }}
            >
              Edit Profile
            </button>
          )}
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}
      </div>

      {/* Profile Details Section */}
      {editing ? (
        <form onSubmit={handleSubmit} style={{
          background: 'white',
          padding: '2rem',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Edit Profile Information</h2>

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
          <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Profile Information</h2>

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
