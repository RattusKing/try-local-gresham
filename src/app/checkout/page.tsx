'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/firebase/auth-context'
import { useCart } from '@/lib/cart-context'
import { db } from '@/lib/firebase/config'
import { collection, addDoc, doc, getDoc } from 'firebase/firestore'
import { DeliveryMethod } from '@/lib/types'
import './checkout.css'

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { items, subtotal, platformFee, total, clearCart } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    deliveryMethod: 'pickup' as DeliveryMethod,
    phone: '',
    deliveryAddress: '',
    deliveryNotes: '',
    pickupTime: '',
  })

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/')
    }
  }, [items, router])

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !db) return

    // Validate phone
    if (!formData.phone.trim()) {
      setError('Phone number is required')
      return
    }

    // Validate delivery address if delivery method is delivery
    if (formData.deliveryMethod === 'delivery' && !formData.deliveryAddress.trim()) {
      setError('Delivery address is required for delivery orders')
      return
    }

    // Group items by business
    const businessGroups = items.reduce((groups, item) => {
      if (!groups[item.businessId]) {
        groups[item.businessId] = {
          businessId: item.businessId,
          businessName: item.businessName,
          items: [],
        }
      }
      groups[item.businessId].items.push(item)
      return groups
    }, {} as Record<string, { businessId: string; businessName: string; items: typeof items }>)

    try {
      setSubmitting(true)
      setError('')

      // Ensure db is available
      const firestore = db
      if (!firestore) return

      // Create separate orders for each business
      const orderPromises = Object.values(businessGroups).map(async (group) => {
        const groupSubtotal = group.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        )
        const groupPlatformFee = groupSubtotal * 0.02
        const groupTotal = groupSubtotal + groupPlatformFee

        const orderData = {
          userId: user.uid,
          userName: user.displayName || user.email || 'Anonymous',
          userEmail: user.email || '',
          userPhone: formData.phone,
          businessId: group.businessId,
          businessName: group.businessName,
          items: group.items,
          subtotal: groupSubtotal,
          platformFee: groupPlatformFee,
          total: groupTotal,
          status: 'pending',
          deliveryMethod: formData.deliveryMethod,
          deliveryAddress: formData.deliveryMethod === 'delivery' ? formData.deliveryAddress : undefined,
          deliveryNotes: formData.deliveryNotes || undefined,
          pickupTime: formData.pickupTime || undefined,
          paymentStatus: 'pending', // Will be updated when Stripe is integrated
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const orderRef = await addDoc(collection(firestore, 'orders'), orderData)

        // Get business email for notifications
        try {
          const businessDoc = await getDoc(doc(firestore, 'businesses', group.businessId))
          const businessData = businessDoc.data()
          const businessEmail = businessData?.email || businessData?.website || ''

          // Send email notifications (non-blocking)
          if (businessEmail && user.email) {
            fetch('/api/emails/order-confirmation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                customerEmail: user.email,
                customerName: user.displayName || user.email,
                businessEmail: businessEmail,
                businessName: group.businessName,
                orderId: orderRef.id,
                items: group.items.map((item) => ({
                  name: item.productName,
                  quantity: item.quantity,
                  price: item.price,
                })),
                total: groupTotal,
                deliveryMethod: formData.deliveryMethod,
                deliveryAddress: formData.deliveryAddress,
                deliveryNotes: formData.deliveryNotes,
                customerPhone: formData.phone,
              }),
            }).catch((err) => console.error('Email notification error:', err))
          }
        } catch (emailError) {
          console.error('Error sending email notifications:', emailError)
          // Continue even if email fails
        }

        return orderRef
      })

      await Promise.all(orderPromises)

      // Clear cart
      clearCart()

      // Redirect to order confirmation
      router.push('/orders')
    } catch (err: any) {
      console.error('Error creating order:', err)
      setError(err.message || 'Failed to create order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user || items.length === 0) {
    return null
  }

  // Group items by business for display
  const businessGroups = items.reduce((groups, item) => {
    if (!groups[item.businessId]) {
      groups[item.businessId] = {
        businessName: item.businessName,
        items: [],
      }
    }
    groups[item.businessId].items.push(item)
    return groups
  }, {} as Record<string, { businessName: string; items: typeof items }>)

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1>Checkout</h1>

        <div className="checkout-content">
          {/* Order Summary */}
          <div className="checkout-main">
            <div className="checkout-section">
              <h2>Order Summary</h2>
              {Object.entries(businessGroups).map(([businessId, group]) => (
                <div key={businessId} className="business-order-group">
                  <h3>{group.businessName}</h3>
                  <div className="order-items">
                    {group.items.map((item) => (
                      <div key={item.productId} className="order-item">
                        {item.productImage && (
                          <img src={item.productImage} alt={item.productName} />
                        )}
                        <div className="order-item-info">
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
                </div>
              ))}
            </div>

            {/* Delivery Information */}
            <div className="checkout-section">
              <h2>Delivery Information</h2>
              {error && <div className="alert alert-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Delivery Method *</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="pickup"
                        checked={formData.deliveryMethod === 'pickup'}
                        onChange={(e) =>
                          setFormData({ ...formData, deliveryMethod: e.target.value as DeliveryMethod })
                        }
                      />
                      <span>Pickup</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="delivery"
                        checked={formData.deliveryMethod === 'delivery'}
                        onChange={(e) =>
                          setFormData({ ...formData, deliveryMethod: e.target.value as DeliveryMethod })
                        }
                      />
                      <span>Delivery</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>

                {formData.deliveryMethod === 'delivery' && (
                  <div className="form-group">
                    <label htmlFor="deliveryAddress">Delivery Address *</label>
                    <textarea
                      id="deliveryAddress"
                      value={formData.deliveryAddress}
                      onChange={(e) =>
                        setFormData({ ...formData, deliveryAddress: e.target.value })
                      }
                      rows={3}
                      placeholder="Street address, city, state, ZIP"
                      required
                    />
                  </div>
                )}

                {formData.deliveryMethod === 'pickup' && (
                  <div className="form-group">
                    <label htmlFor="pickupTime">Preferred Pickup Time</label>
                    <input
                      type="text"
                      id="pickupTime"
                      value={formData.pickupTime}
                      onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                      placeholder="e.g., Today at 5pm, Tomorrow morning"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="deliveryNotes">Special Instructions</label>
                  <textarea
                    id="deliveryNotes"
                    value={formData.deliveryNotes}
                    onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
                    rows={3}
                    placeholder="Any special requests or instructions..."
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-large"
                  disabled={submitting}
                >
                  {submitting ? 'Processing...' : 'Place Order'}
                </button>
              </form>
            </div>
          </div>

          {/* Order Total Sidebar */}
          <aside className="checkout-sidebar">
            <div className="order-total-card">
              <h3>Order Total</h3>
              <div className="total-row">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Platform Fee (2%):</span>
                <span>${platformFee.toFixed(2)}</span>
              </div>
              <div className="total-row total-final">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <div className="payment-notice">
                <p>
                  <strong>Payment Status:</strong> Pending
                </p>
                <p className="payment-notice-text">
                  Your order will be submitted with payment pending. The business will
                  contact you to arrange payment.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
