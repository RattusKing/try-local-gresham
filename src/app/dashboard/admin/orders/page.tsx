'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Order, OrderStatus } from '@/lib/types'
import { logger } from '@/lib/logger';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    if (!db) {
      logger.error('Firebase not initialized')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(ordersQuery)
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Order[]
      setOrders(ordersData)
    } catch (error) {
      logger.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    if (!confirm(`Are you sure you want to change this order's status to ${newStatus}?`)) {
      return
    }

    if (!db) {
      alert('Firebase not initialized. Please refresh the page.')
      return
    }

    try {
      setUpdatingOrderId(orderId)
      const orderRef = doc(db, 'orders', orderId)
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date(),
      })

      // Update local state
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      alert('Order status updated successfully!')
    } catch (error) {
      logger.error('Error updating order status:', error)
      alert('Failed to update order status. Please try again.')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    ready: orders.filter((o) => o.status === 'ready').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
    totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
    platformFees: orders.reduce((sum, o) => sum + o.platformFee, 0),
  }

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return {
          background: 'rgba(251, 191, 36, 0.1)',
          color: '#d97706',
          border: '1px solid rgba(251, 191, 36, 0.3)',
        }
      case 'confirmed':
        return {
          background: 'rgba(153, 237, 195, 0.2)',
          color: 'var(--primary-dark)',
          border: '1px solid rgba(153, 237, 195, 0.4)',
        }
      case 'ready':
        return {
          background: 'rgba(194, 175, 240, 0.2)',
          color: 'var(--secondary-dark)',
          border: '1px solid rgba(194, 175, 240, 0.4)',
        }
      case 'completed':
        return {
          background: 'rgba(34, 197, 94, 0.1)',
          color: '#16a34a',
          border: '1px solid rgba(34, 197, 94, 0.3)',
        }
      case 'cancelled':
        return {
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#dc2626',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        }
      default:
        return {
          background: 'rgba(107, 114, 128, 0.1)',
          color: 'var(--muted)',
          border: '1px solid rgba(107, 114, 128, 0.2)',
        }
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard-header">
          <h1>All Orders</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: 'var(--muted)' }}>Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1>All Orders</h1>
        <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>
          Monitor and manage all orders across the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="stat">
          <div className="stat-num" style={{ color: 'var(--dark)' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>
            Total Orders
          </div>
        </div>
        <div className="stat">
          <div className="stat-num" style={{ color: '#d97706' }}>
            {stats.pending}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>
            Pending
          </div>
        </div>
        <div className="stat">
          <div className="stat-num" style={{ color: 'var(--primary-dark)' }}>
            {stats.confirmed}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>
            Confirmed
          </div>
        </div>
        <div className="stat">
          <div className="stat-num" style={{ color: '#16a34a' }}>
            {stats.completed}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>
            Completed
          </div>
        </div>
        <div className="stat">
          <div className="stat-num" style={{ color: 'var(--dark)', fontSize: '1.5rem' }}>
            {formatCurrency(stats.totalRevenue)}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>
            Total Revenue
          </div>
        </div>
        <div className="stat">
          <div className="stat-num" style={{ color: 'var(--secondary-dark)', fontSize: '1.5rem' }}>
            {formatCurrency(stats.platformFees)}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>
            Platform Fees (2%)
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
            placeholder="Search by customer, business, or order ID..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              border: '2px solid rgba(194, 175, 240, 0.3)',
              borderRadius: '8px',
              fontSize: '14px',
              minWidth: '150px',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="ready">Ready</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '2px solid rgba(153, 237, 195, 0.2)',
        }}
      >
        {filteredOrders.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</span>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>No orders found</h3>
            <p style={{ margin: 0, color: 'var(--muted)' }}>
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No orders have been placed yet'}
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
                    Order Details
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
                    Customer
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
                    Business
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
                    Amount
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
                    Status
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
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    style={{
                      borderBottom: '1px solid rgba(153, 237, 195, 0.1)',
                    }}
                  >
                    <td style={{ padding: '16px' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--dark)', marginBottom: '4px' }}>
                          #{order.id.slice(0, 8)}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                          {formatDate(order.createdAt)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {order.deliveryMethod}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--dark)', marginBottom: '4px' }}>
                          {order.userName}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                          {order.userEmail}
                        </div>
                        {order.userPhone && (
                          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                            {order.userPhone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dark)' }}>
                        {order.businessName}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--dark)', marginBottom: '4px' }}>
                          {formatCurrency(order.total)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          Fee: {formatCurrency(order.platformFee)}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateOrderStatus(order.id, e.target.value as OrderStatus)
                        }
                        disabled={updatingOrderId === order.id}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '999px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          ...getStatusColor(order.status),
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="ready">Ready</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {updatingOrderId === order.id ? 'Updating...' : 'Select status to change'}
                      </div>
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
          💡 <strong>Tip:</strong> You can update order statuses on behalf of businesses to help resolve issues.
          Platform fees shown are calculated at 2% of the order total.
        </p>
      </div>
    </div>
  )
}
