'use client'

import { useAuth } from '@/lib/firebase/auth-context'
import { db } from '@/lib/firebase/config'
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Business } from '@/lib/types'
import './admin.css'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [pendingBusinesses, setPendingBusinesses] = useState<Business[]>([])
  const [approvedBusinesses, setApprovedBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending')

  useEffect(() => {
    if (user?.role !== 'admin') {
      return
    }
    loadBusinesses()
  }, [user])

  const loadBusinesses = async () => {
    if (!db) return

    try {
      setLoading(true)
      setError('')

      // Load pending businesses
      const pendingQuery = query(
        collection(db, 'businesses'),
        where('status', '==', 'pending')
      )
      const pendingSnap = await getDocs(pendingQuery)
      const pending = pendingSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Business[]

      // Load approved businesses
      const approvedQuery = query(
        collection(db, 'businesses'),
        where('status', '==', 'approved')
      )
      const approvedSnap = await getDocs(approvedQuery)
      const approved = approvedSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Business[]

      setPendingBusinesses(pending)
      setApprovedBusinesses(approved)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (businessId: string) => {
    if (!db) return

    try {
      const businessRef = doc(db, 'businesses', businessId)
      await updateDoc(businessRef, {
        status: 'approved',
        updatedAt: new Date(),
      })
      await loadBusinesses()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleReject = async (businessId: string) => {
    if (!db) return

    if (!confirm('Are you sure you want to reject this business?')) {
      return
    }

    try {
      const businessRef = doc(db, 'businesses', businessId)
      await updateDoc(businessRef, {
        status: 'rejected',
        updatedAt: new Date(),
      })
      await loadBusinesses()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUnapprove = async (businessId: string) => {
    if (!db) return

    if (!confirm('Are you sure you want to unapprove this business?')) {
      return
    }

    try {
      const businessRef = doc(db, 'businesses', businessId)
      await updateDoc(businessRef, {
        status: 'pending',
        updatedAt: new Date(),
      })
      await loadBusinesses()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (businessId: string) => {
    if (!db) return

    if (!confirm('⚠️ PERMANENTLY DELETE this business?\n\nThis will remove:\n- The business listing\n- All their products\n- All their services\n- All their appointments\n\nThis action CANNOT be undone!')) {
      return
    }

    try {
      const businessRef = doc(db, 'businesses', businessId)
      await deleteDoc(businessRef)
      await loadBusinesses()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="admin-dashboard">
        <div className="alert alert-error">
          You don't have permission to access this page.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading businesses...</p>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1>Business Approvals</h1>
          <a href="/dashboard/admin/applications" className="btn btn-primary">
            View Applications
          </a>
        </div>
        <div className="admin-stats">
          <div className="admin-stat">
            <span className="admin-stat-value">{pendingBusinesses.length}</span>
            <span className="admin-stat-label">Pending</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-value">{approvedBusinesses.length}</span>
            <span className="admin-stat-label">Approved</span>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({pendingBusinesses.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Approved ({approvedBusinesses.length})
        </button>
      </div>

      <div className="admin-businesses">
        {activeTab === 'pending' && (
          <>
            {pendingBusinesses.length === 0 ? (
              <div className="empty-state">
                <p>No pending business applications</p>
              </div>
            ) : (
              pendingBusinesses.map((business) => (
                <div key={business.id} className="business-card-admin">
                  <div className="business-card-image">
                    <img src={business.cover} alt={business.name} />
                  </div>
                  <div className="business-card-content">
                    <h3>{business.name}</h3>
                    <div className="business-card-meta">
                      <span className="business-card-tags">
                        {business.tags.join(', ')}
                      </span>
                      <span className="business-card-neighborhood">
                        📍 {business.neighborhood}
                      </span>
                    </div>
                    {business.description && (
                      <p className="business-card-description">
                        {business.description}
                      </p>
                    )}
                    <div className="business-card-details">
                      {business.phone && <p>📞 {business.phone}</p>}
                      {business.hours && <p>🕒 {business.hours}</p>}
                      {business.website && (
                        <p>
                          🌐{' '}
                          <a
                            href={business.website}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Visit Website
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="business-card-actions">
                    <button
                      className="btn-approve"
                      onClick={() => handleApprove(business.id)}
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleReject(business.id)}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'approved' && (
          <>
            {approvedBusinesses.length === 0 ? (
              <div className="empty-state">
                <p>No approved businesses yet</p>
              </div>
            ) : (
              approvedBusinesses.map((business) => (
                <div key={business.id} className="business-card-admin approved">
                  <div className="business-card-image">
                    <img src={business.cover} alt={business.name} />
                  </div>
                  <div className="business-card-content">
                    <h3>{business.name}</h3>
                    <div className="business-card-meta">
                      <span className="business-card-tags">
                        {business.tags.join(', ')}
                      </span>
                      <span className="business-card-neighborhood">
                        📍 {business.neighborhood}
                      </span>
                    </div>
                    {business.description && (
                      <p className="business-card-description">
                        {business.description}
                      </p>
                    )}
                  </div>
                  <div className="business-card-actions">
                    <button
                      className="btn-unapprove"
                      onClick={() => handleUnapprove(business.id)}
                    >
                      Unapprove
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(business.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}
