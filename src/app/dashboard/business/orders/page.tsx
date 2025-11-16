'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/firebase/auth-context'
import { db } from '@/lib/firebase/config'
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore'
import { Order, OrderStatus } from '@/lib/types'
import { motion } from 'framer-motion'
import './orders.css'

export default function BusinessOrdersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')

  useEffect(() => {
    if (!user) {
      router.push('/dashboard')
      return
    }

    if (user.role !== 'business_owner') {
      router.push('/dashboard')
      return
    }

    loadBusinessAndOrders()
  }, [user, router])

  const loadBusinessAndOrders = async () => {
    if (!user || !db) return

    try {
      setLoading(true)

      // First, get the business owned by this user
      const businessesQuery = query(
        collection(db, 'businesses'),
        where('ownerId', '==', user.uid)
      )
      const businessesSnap = await getDocs(businessesQuery)

      if (businessesSnap.empty) {
        setError('No business found for your account')
        setLoading(false)
        return
      }

      const business = businessesSnap.docs[0]
      const bizId = business.id
      setBusinessId(bizId)

      // Load orders for this business
      await loadOrders(bizId)
    } catch (err: any) {
      console.error('Error loading business and orders:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async (bizId: string) => {
    if (!db) return

    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('businessId', '==', bizId),
        orderBy('createdAt', 'desc')
      )

      const ordersSnap = await getDocs(ordersQuery)
      const ordersList = ordersSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Order[]

      setOrders(ordersList)
    } catch (err: any) {
      console.error('Error loading orders:', err)
      setError(err.message)
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    if (!db) return

    try {
      const orderRef = doc(db, 'orders', orderId)
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date(),
      })

      // Get order details and business address for email notification
      const order = orders.find((o) => o.id === orderId)
      if (order && (newStatus === 'confirmed' || newStatus === 'ready' || newStatus === 'completed' || newStatus === 'cancelled')) {
        // Map old status names to new ones for email template
        const emailStatus = newStatus === 'confirmed' ? 'accepted' : newStatus === 'cancelled' ? 'rejected' : newStatus

        // Get business address for pickup info
        let pickupAddress = ''
        if (user) {
          try {
            const businessDoc = await getDocs(query(collection(db, 'businesses'), where('ownerId', '==', user.uid)))
            if (!businessDoc.empty) {
              const businessData = businessDoc.docs[0].data()
              pickupAddress = businessData.address || ''
            }
          } catch (err) {
            console.error('Error fetching business address:', err)
          }
        }

        // Send status update email (non-blocking)
        fetch('/api/emails/order-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerEmail: order.userEmail,
            customerName: order.userName,
            orderId: order.id,
            businessName: order.businessName,
            status: emailStatus,
            deliveryMethod: order.deliveryMethod,
            deliveryAddress: order.deliveryAddress,
            pickupAddress,
          }),
        }).catch((err) => console.error('Email notification error:', err))
      }

      // Reload orders
      if (businessId) {
        await loadOrders(businessId)
      }
    } catch (err: any) {
      console.error('Error updating order status:', err)
      alert('Failed to update order status: ' + err.message)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'status-pending'
      case 'confirmed':
        return 'status-confirmed'
      case 'ready':
        return 'status-ready'
      case 'completed':
        return 'status-completed'
      case 'cancelled':
        return 'status-cancelled'
      default:
        return ''
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'confirmed':
        return 'Confirmed'
      case 'ready':
        return 'Ready'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status
    }
  }

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter((order) => order.status === statusFilter)

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    ready: orders.filter((o) => o.status === 'ready').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  }

  if (loading) {
    return (
      <div className="business-orders-loading">
        <div className="spinner"></div>
        <p>Loading orders...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="business-orders-error">
        <h1>Error</h1>
        <p>{error}</p>
        <button onClick={() => router.push('/dashboard')} className="btn-back">
          ← Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="business-orders-page">
      <div className="business-orders-container">
        <div className="business-orders-header">
          <h1>Orders</h1>
          <button onClick={() => router.push('/dashboard/business')} className="btn btn-outline">
            ← Back to Dashboard
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="status-tabs">
          <button
            className={`status-tab ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Orders ({statusCounts.all})
          </button>
          <button
            className={`status-tab ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending ({statusCounts.pending})
          </button>
          <button
            className={`status-tab ${statusFilter === 'confirmed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('confirmed')}
          >
            Confirmed ({statusCounts.confirmed})
          </button>
          <button
            className={`status-tab ${statusFilter === 'ready' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ready')}
          >
            Ready ({statusCounts.ready})
          </button>
          <button
            className={`status-tab ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('completed')}
          >
            Completed ({statusCounts.completed})
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="empty-orders">
            <h2>No {statusFilter !== 'all' ? statusFilter : ''} orders</h2>
            <p>
              {statusFilter === 'all'
                ? 'When customers place orders, they will appear here.'
                : `No ${statusFilter} orders at this time.`}
            </p>
          </div>
        ) : (
          <div className="business-orders-list">
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                className="business-order-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="business-order-header">
                  <div>
                    <h3>Order #{order.id.slice(-6).toUpperCase()}</h3>
                    <p className="order-date">
                      {order.createdAt.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="order-header-right">
                    <span className={`order-status ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <p className="order-total">${order.total.toFixed(2)}</p>
                  </div>
                </div>

                <div className="business-order-body">
                  {/* Customer Info */}
                  <div className="customer-info">
                    <h4>Customer Information</h4>
                    <div className="customer-detail">
                      <strong>Name:</strong> {order.userName}
                    </div>
                    <div className="customer-detail">
                      <strong>Email:</strong> {order.userEmail}
                    </div>
                    <div className="customer-detail">
                      <strong>Phone:</strong> {order.userPhone}
                    </div>
                    <div className="customer-detail">
                      <strong>Method:</strong>{' '}
                      {order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                    </div>
                    {order.deliveryAddress && (
                      <div className="customer-detail">
                        <strong>Address:</strong> {order.deliveryAddress}
                      </div>
                    )}
                    {order.pickupTime && (
                      <div className="customer-detail">
                        <strong>Pickup Time:</strong> {order.pickupTime}
                      </div>
                    )}
                    {order.deliveryNotes && (
                      <div className="customer-detail">
                        <strong>Notes:</strong> {order.deliveryNotes}
                      </div>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="order-items">
                    <h4>Items</h4>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="order-item">
                        {item.productImage && (
                          <img src={item.productImage} alt={item.productName} />
                        )}
                        <div className="order-item-details">
                          <h5>{item.productName}</h5>
                          <p>
                            ${item.price.toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        <div className="order-item-total">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="order-summary">
                    <div className="order-summary-row">
                      <span>Subtotal:</span>
                      <span>${order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="order-summary-row">
                      <span>Platform Fee (2%):</span>
                      <span>${order.platformFee.toFixed(2)}</span>
                    </div>
                    <div className="order-summary-row order-summary-total">
                      <span>Total:</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                    <div className="order-summary-row">
                      <span>Payment Status:</span>
                      <span className={order.paymentStatus === 'completed' ? 'text-success' : 'text-warning'}>
                        {order.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Status Update Actions */}
                  <div className="order-actions">
                    <h4>Update Status</h4>
                    <div className="status-buttons">
                      {order.status === 'pending' && (
                        <>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                          >
                            Confirm Order
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {order.status === 'confirmed' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleStatusUpdate(order.id, 'ready')}
                        >
                          Mark as Ready
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleStatusUpdate(order.id, 'completed')}
                        >
                          Mark as Completed
                        </button>
                      )}
                      {order.status === 'completed' && (
                        <p className="status-message">✓ Order completed</p>
                      )}
                      {order.status === 'cancelled' && (
                        <p className="status-message cancelled">✗ Order cancelled</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
