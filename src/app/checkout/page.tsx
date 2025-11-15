'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/firebase/auth-context'
import { useCart } from '@/lib/cart-context'
import { db } from '@/lib/firebase/config'
import { collection, addDoc, doc, getDoc, updateDoc, increment, query, where, getDocs } from 'firebase/firestore'
import { DeliveryMethod, DiscountCode } from '@/lib/types'
import './checkout.css'

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { items, subtotal, platformFee, total, clearCart } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountError, setDiscountError] = useState('')
  const [applyingDiscount, setApplyingDiscount] = useState(false)

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

  const applyDiscountCode = async () => {
    if (!db || !discountCode.trim()) return

    setApplyingDiscount(true)
    setDiscountError('')

    try {
      // Query for the discount code
      const discountsRef = collection(db, 'discountCodes')
      const q = query(discountsRef, where('code', '==', discountCode.toUpperCase()))
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        setDiscountError('Invalid discount code')
        setApplyingDiscount(false)
        return
      }

      const discountDoc = snapshot.docs[0]
      const discount = { id: discountDoc.id, ...discountDoc.data() } as DiscountCode

      // Validate discount code
      if (!discount.isActive) {
        setDiscountError('This discount code is no longer active')
        setApplyingDiscount(false)
        return
      }

      // Check expiration
      const now = new Date()
      const validFrom = discount.validFrom instanceof Date ? discount.validFrom : new Date(discount.validFrom)
      const validUntil = discount.validUntil ?
        (discount.validUntil instanceof Date ? discount.validUntil : new Date(discount.validUntil))
        : null

      if (now < validFrom) {
        setDiscountError('This discount code is not yet valid')
        setApplyingDiscount(false)
        return
      }

      if (validUntil && now > validUntil) {
        setDiscountError('This discount code has expired')
        setApplyingDiscount(false)
        return
      }

      // Check usage limit
      if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
        setDiscountError('This discount code has reached its usage limit')
        setApplyingDiscount(false)
        return
      }

      // Check minimum purchase
      if (discount.minPurchase && subtotal < discount.minPurchase) {
        setDiscountError(`Minimum purchase of $${discount.minPurchase.toFixed(2)} required`)
        setApplyingDiscount(false)
        return
      }

      // Calculate discount amount
      let discountAmt = 0
      if (discount.type === 'percentage') {
        discountAmt = subtotal * (discount.value / 100)
        // Apply max discount cap if set
        if (discount.maxDiscount && discountAmt > discount.maxDiscount) {
          discountAmt = discount.maxDiscount
        }
      } else {
        // Fixed amount
        discountAmt = discount.value
      }

      // Discount cannot exceed subtotal
      if (discountAmt > subtotal) {
        discountAmt = subtotal
      }

      setAppliedDiscount(discount)
      setDiscountAmount(discountAmt)
      setDiscountError('')
    } catch (err) {
      console.error('Error applying discount code:', err)
      setDiscountError('Error applying discount code. Please try again.')
    } finally {
      setApplyingDiscount(false)
    }
  }

  const removeDiscount = () => {
    setAppliedDiscount(null)
    setDiscountAmount(0)
    setDiscountCode('')
    setDiscountError('')
  }

  // Calculate final total with discount
  const finalTotal = total - discountAmount

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

        // Calculate discount for this business group
        let groupDiscount = 0
        if (appliedDiscount && discountAmount > 0) {
          // Proportionally apply discount based on this group's subtotal
          const proportion = groupSubtotal / subtotal
          groupDiscount = discountAmount * proportion
        }

        const groupTotal = groupSubtotal + groupPlatformFee - groupDiscount

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
          discount: groupDiscount > 0 ? groupDiscount : undefined,
          discountCode: appliedDiscount ? appliedDiscount.code : undefined,
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

        // Deduct inventory for products that track inventory
        try {
          for (const item of group.items) {
            const productRef = doc(firestore, 'products', item.productId)
            const productDoc = await getDoc(productRef)

            if (productDoc.exists()) {
              const productData = productDoc.data()
              // Only deduct if product tracks inventory and has stock quantity set
              if (productData.trackInventory && productData.stockQuantity !== undefined) {
                await updateDoc(productRef, {
                  stockQuantity: increment(-item.quantity),
                  // Auto-mark as out of stock if quantity reaches 0
                  inStock: productData.stockQuantity - item.quantity > 0,
                })
              }
            }
          }
        } catch (inventoryError) {
          console.error('Error updating inventory:', inventoryError)
          // Continue even if inventory update fails
        }

        return orderRef
      })

      await Promise.all(orderPromises)

      // Increment discount code usage count if applied
      if (appliedDiscount && appliedDiscount.id) {
        try {
          const discountRef = doc(firestore, 'discountCodes', appliedDiscount.id)
          await updateDoc(discountRef, {
            usageCount: increment(1),
          })
        } catch (discountErr) {
          console.error('Error updating discount code usage:', discountErr)
          // Don't block order completion if usage update fails
        }
      }

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

              {/* Discount Code Section */}
              <div className="discount-section">
                {!appliedDiscount ? (
                  <div className="discount-input-group">
                    <input
                      type="text"
                      placeholder="Discount code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && applyDiscountCode()}
                      disabled={applyingDiscount}
                    />
                    <button
                      type="button"
                      onClick={applyDiscountCode}
                      disabled={applyingDiscount || !discountCode.trim()}
                      className="btn btn-secondary btn-small"
                    >
                      {applyingDiscount ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div className="applied-discount">
                    <div className="discount-badge">
                      <span className="discount-code-label">🎟️ {appliedDiscount.code}</span>
                      <button
                        type="button"
                        onClick={removeDiscount}
                        className="remove-discount"
                        title="Remove discount"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="discount-description">{appliedDiscount.description}</p>
                  </div>
                )}
                {discountError && <p className="discount-error">{discountError}</p>}
              </div>

              {appliedDiscount && discountAmount > 0 && (
                <div className="total-row discount-row">
                  <span>Discount:</span>
                  <span className="discount-amount">-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="total-row total-final">
                <span>Total:</span>
                <span>${finalTotal.toFixed(2)}</span>
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
