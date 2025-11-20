'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/firebase/auth-context'
import { db } from '@/lib/firebase/config'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { Order } from '@/lib/types'
import { motion } from 'framer-motion'
import './orders.css'

export default function OrdersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }

    loadOrders()
  }, [user, router])

  const loadOrders = async () => {
    if (!user || !db) return

    try {
      setLoading(true)
      // Query without orderBy to avoid needing a composite index
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid)
      )

      const ordersSnap = await getDocs(ordersQuery)
      const ordersList = ordersSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Order[]

      // Sort by createdAt descending on client-side
      ordersList.sort((a, b) => {
        return b.createdAt.getTime() - a.createdAt.getTime() // Descending order (newest first)
      })

      setOrders(ordersList)
    } catch (err: any) {
      console.error('Error loading orders:', err)
      setError(err.message)
    } finally {
      setLoading(false)
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
        return 'Ready for Pickup/Delivery'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="orders-loading">
        <div className="spinner"></div>
        <p>Loading your orders...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="orders-error">
        <h1>Error</h1>
        <p>{error}</p>
        <button onClick={() => router.push('/')} className="btn-back">
          ← Back to Home
        </button>
      </div>
    )
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        <div className="orders-header">
          <h1>Your Orders</h1>
          <button onClick={() => router.push('/')} className="btn btn-outline">
            ← Continue Shopping
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="empty-orders">
            <h2>No orders yet</h2>
            <p>When you place orders, they will appear here.</p>
            <button onClick={() => router.push('/')} className="btn btn-primary">
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                className="order-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="order-header">
                  <div className="order-header-left">
                    <h3>{order.businessName}</h3>
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

                <div className="order-body">
                  <div className="order-items">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="order-item">
                        {item.productImage && (
                          <img src={item.productImage} alt={item.productName} />
                        )}
                        <div className="order-item-details">
                          <h4>{item.productName}</h4>
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

                  <div className="order-details">
                    <div className="order-detail-row">
                      <span>Delivery Method:</span>
                      <span className="order-detail-value">
                        {order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                      </span>
                    </div>
                    {order.deliveryAddress && (
                      <div className="order-detail-row">
                        <span>Delivery Address:</span>
                        <span className="order-detail-value">{order.deliveryAddress}</span>
                      </div>
                    )}
                    {order.pickupTime && (
                      <div className="order-detail-row">
                        <span>Pickup Time:</span>
                        <span className="order-detail-value">{order.pickupTime}</span>
                      </div>
                    )}
                    <div className="order-detail-row">
                      <span>Contact Phone:</span>
                      <span className="order-detail-value">{order.userPhone}</span>
                    </div>
                    {order.deliveryNotes && (
                      <div className="order-detail-row">
                        <span>Special Instructions:</span>
                        <span className="order-detail-value">{order.deliveryNotes}</span>
                      </div>
                    )}
                    <div className="order-detail-row">
                      <span>Payment Status:</span>
                      <span
                        className={`order-detail-value ${
                          order.paymentStatus === 'completed'
                            ? 'text-success'
                            : 'text-warning'
                        }`}
                      >
                        {order.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>

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
