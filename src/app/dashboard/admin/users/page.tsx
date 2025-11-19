'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

interface User {
  uid: string
  email: string
  displayName?: string
  role: 'customer' | 'business_owner' | 'admin'
  businessId?: string
  createdAt: any
  updatedAt: any
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    if (!db) {
      console.error('Firebase not initialized')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(usersQuery)
      const usersData = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as User[]
      setUsers(usersData)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateUserRole(userId: string, newRole: 'customer' | 'business_owner' | 'admin') {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return
    }

    if (!db) {
      alert('Firebase not initialized. Please refresh the page.')
      return
    }

    try {
      setUpdatingUserId(userId)
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date(),
      })

      // Update local state
      setUsers(users.map(u => u.uid === userId ? { ...u, role: newRole } : u))
      alert('User role updated successfully!')
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('Failed to update user role. Please try again.')
    } finally {
      setUpdatingUserId(null)
    }
  }

  async function deleteUser(userId: string, userEmail: string) {
    const confirmMessage = `⚠️ WARNING: This will permanently delete the user account for ${userEmail}.\n\nThis action CANNOT be undone. Are you absolutely sure?`

    if (!confirm(confirmMessage)) {
      return
    }

    // Double confirmation for safety
    const doubleConfirm = confirm('Click OK to confirm deletion, or Cancel to abort.')
    if (!doubleConfirm) {
      return
    }

    if (!db) {
      alert('Firebase not initialized. Please refresh the page.')
      return
    }

    try {
      setUpdatingUserId(userId)
      const userRef = doc(db, 'users', userId)
      await deleteDoc(userRef)

      // Update local state
      setUsers(users.filter(u => u.uid !== userId))
      alert('User deleted successfully!')
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user. Please try again.')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.uid.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === 'all' || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  const stats = {
    total: users.length,
    customers: users.filter((u) => u.role === 'customer').length,
    businessOwners: users.filter((u) => u.role === 'business_owner').length,
    admins: users.filter((u) => u.role === 'admin').length,
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          background: 'rgba(194, 175, 240, 0.2)',
          color: 'var(--secondary-dark)',
          border: '1px solid rgba(194, 175, 240, 0.4)',
        }
      case 'business_owner':
        return {
          background: 'rgba(153, 237, 195, 0.2)',
          color: 'var(--primary-dark)',
          border: '1px solid rgba(153, 237, 195, 0.4)',
        }
      default:
        return {
          background: 'rgba(107, 114, 128, 0.1)',
          color: 'var(--muted)',
          border: '1px solid rgba(107, 114, 128, 0.2)',
        }
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard-header">
          <h1>User Management</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: 'var(--muted)' }}>Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1>User Management</h1>
        <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>
          Manage user accounts and roles
        </p>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="stat">
          <div className="stat-num" style={{ color: 'var(--dark)' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>
            Total Users
          </div>
        </div>
        <div className="stat">
          <div className="stat-num" style={{ color: 'var(--muted)' }}>
            {stats.customers}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>
            Customers
          </div>
        </div>
        <div className="stat">
          <div className="stat-num" style={{ color: 'var(--primary-dark)' }}>
            {stats.businessOwners}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>
            Business Owners
          </div>
        </div>
        <div className="stat">
          <div className="stat-num" style={{ color: 'var(--secondary-dark)' }}>
            {stats.admins}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>
            Administrators
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '2px solid rgba(153, 237, 195, 0.2)',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by email, name, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: '1',
              minWidth: '250px',
              padding: '10px 14px',
              border: '2px solid rgba(194, 175, 240, 0.3)',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              border: '2px solid rgba(194, 175, 240, 0.3)',
              borderRadius: '8px',
              fontSize: '14px',
              minWidth: '150px',
            }}
          >
            <option value="all">All Roles</option>
            <option value="customer">Customers</option>
            <option value="business_owner">Business Owners</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '2px solid rgba(153, 237, 195, 0.2)',
        }}
      >
        {filteredUsers.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</span>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>No users found</h3>
            <p style={{ margin: 0, color: 'var(--muted)' }}>
              {searchTerm || roleFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No users in the system yet'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    background: 'linear-gradient(135deg, rgba(153, 237, 195, 0.1), rgba(194, 175, 240, 0.1))',
                    borderBottom: '2px solid rgba(153, 237, 195, 0.2)',
                  }}
                >
                  <th
                    style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: 700,
                      fontSize: '14px',
                      color: 'var(--dark)',
                    }}
                  >
                    User
                  </th>
                  <th
                    style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: 700,
                      fontSize: '14px',
                      color: 'var(--dark)',
                    }}
                  >
                    Role
                  </th>
                  <th
                    style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: 700,
                      fontSize: '14px',
                      color: 'var(--dark)',
                    }}
                  >
                    Joined
                  </th>
                  <th
                    style={{
                      padding: '16px',
                      textAlign: 'right',
                      fontWeight: 700,
                      fontSize: '14px',
                      color: 'var(--dark)',
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.uid}
                    style={{
                      borderBottom: '1px solid rgba(153, 237, 195, 0.1)',
                    }}
                  >
                    <td style={{ padding: '16px' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--dark)', marginBottom: '4px' }}>
                          {user.displayName || 'No name set'}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                          {user.email}
                        </div>
                        {user.businessId && (
                          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                            Business ID: {user.businessId}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <select
                        value={user.role}
                        onChange={(e) =>
                          updateUserRole(user.uid, e.target.value as any)
                        }
                        disabled={updatingUserId === user.uid}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '999px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          ...getRoleBadgeColor(user.role),
                        }}
                      >
                        <option value="customer">Customer</option>
                        <option value="business_owner">Business Owner</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button
                        onClick={() => deleteUser(user.uid, user.email)}
                        disabled={updatingUserId === user.uid}
                        style={{
                          padding: '8px 16px',
                          background: updatingUserId === user.uid ? '#e5e7eb' : '#fee2e2',
                          color: updatingUserId === user.uid ? '#9ca3af' : '#dc2626',
                          border: '1px solid',
                          borderColor: updatingUserId === user.uid ? '#d1d5db' : '#fecaca',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: updatingUserId === user.uid ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          if (updatingUserId !== user.uid) {
                            e.currentTarget.style.background = '#fecaca'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (updatingUserId !== user.uid) {
                            e.currentTarget.style.background = '#fee2e2'
                          }
                        }}
                      >
                        {updatingUserId === user.uid ? 'Processing...' : '🗑️ Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: '20px',
          padding: '16px',
          background: 'rgba(194, 175, 240, 0.05)',
          borderRadius: '8px',
          border: '2px solid rgba(194, 175, 240, 0.2)',
        }}
      >
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>
          💡 <strong>Tip:</strong> Select a different role from the dropdown to change a user's
          permissions. Changes take effect immediately.
        </p>
      </div>
    </div>
  )
}
