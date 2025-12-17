'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/firebase/auth-context'
import { useCart } from '@/lib/cart-context'
import { db } from '@/lib/firebase/config'
import { collection, addDoc, doc, getDoc, updateDoc, increment, query, where, getDocs } from 'firebase/firestore'
import { DeliveryMethod, DiscountCode } from '@/lib/types'
import { reserveInventory } from '@/lib/inventory'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import StripeCheckoutForm from '@/components/stripe/StripeCheckoutForm'
import './checkout.css'

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
)

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { items, subtotal, platformFee, total, clearCart } = useCart()
  const [step, setStep] = useState<'details' | 'payment'>('details')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountError, setDiscountError] = useState('')
  const [applyingDiscount, setApplyingDiscount] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [isProcessingSuccess, setIsProcessingSuccess] = useState(false)

  const [formData, setFormData] = useState({
    deliveryMethod: 'pickup' as DeliveryMethod,
    phone: '',
    deliveryAddress: '',
    deliveryNotes: '',
    pickupTime: '',
  })

  // Redirect if cart is empty (but not during success flow)
  useEffect(() => {
    if (items.length === 0 && !isProcessingSuccess) {
      router.push('/')
    }
  }, [items, router, isProcessingSuccess])

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
      const discountsRef = collection(db, 'discountCodes')
      const q = query(
        discountsRef,
        where('code', '==', discountCode.toUpperCase()),
        where('isActive', '==', true)
      )
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        setDiscountError('Invalid discount code')
        setApplyingDiscount(false)
        return
      }

      const discountDoc = snapshot.docs[0]
      const discount = { id: discountDoc.id, ...discountDoc.data() } as DiscountCode

      if (!discount.isActive) {
        setDiscountError('This discount code is no longer active')
        setApplyingDiscount(false)
        return
      }

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

      if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
        setDiscountError('This discount code has reached its usage limit')
        setApplyingDiscount(false)
        return
      }

      if (discount.minPurchase && subtotal < discount.minPurchase) {
        setDiscountError(`Minimum purchase of $${discount.minPurchase.toFixed(2)} required`)
        setApplyingDiscount(false)
        return
      }

      let discountAmt = 0
      if (discount.type === 'percentage') {
        discountAmt = subtotal * (discount.value / 100)
        if (discount.maxDiscount && discountAmt > discount.maxDiscount) {
          discountAmt = discount.maxDiscount
        }
      } else {
        discountAmt = discount.value
      }

      if (discountAmt > subtotal) {
        discountAmt = subtotal
      }

      setAppliedDiscount(discount)
      setDiscountAmount(discountAmt)
      setDiscountError('')
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error applying discount code:', err)
      }
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

  const finalTotal = total - discountAmount

  const handleContinueToPayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !db) return

    if (!formData.phone.trim()) {
      setError('Phone number is required')
      return
    }

    if (formData.deliveryMethod === 'delivery' && !formData.deliveryAddress.trim()) {
      setError('Delivery address is required for delivery orders')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      // Get the first business ID (for creating payment intent)
      const firstBusinessId = items[0].businessId

      // Create payment intent
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(finalTotal * 100), // Convert to cents
          businessId: firstBusinessId,
          customerEmail: user.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment')
      }

      setClientSecret(data.clientSecret)
      setPaymentIntentId(data.paymentIntentId)
      setStep('payment')
    } catch (err: any) {
      setError(err.message || 'Failed to initialize payment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaymentSuccess = async (stripePaymentIntentId: string) => {
    if (!user || !db) return

    try {
      setSubmitting(true)
      setIsProcessingSuccess(true)
      setError('')

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

      const firestore = db
      if (!firestore) return

      // Create separate orders for each business
      const orderPromises = Object.values(businessGroups).map(async (group) => {
        const groupSubtotal = group.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        )
        const groupPlatformFee = groupSubtotal * 0.02

        let groupDiscount = 0
        if (appliedDiscount && discountAmount > 0) {
          const proportion = groupSubtotal / subtotal
          groupDiscount = discountAmount * proportion
        }

        const groupTotal = groupSubtotal + groupPlatformFee - groupDiscount

        // Reserve inventory
        try {
          await reserveInventory(
            group.items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
            }))
          )
        } catch (inventoryError) {
          throw new Error(
            inventoryError instanceof Error
              ? inventoryError.message
              : 'Failed to reserve inventory'
          )
        }

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
          discount: groupDiscount > 0 ? groupDiscount : 0,
          discountCode: appliedDiscount ? appliedDiscount.code : '',
          total: groupTotal,
          status: 'pending',
          deliveryMethod: formData.deliveryMethod,
          deliveryAddress: formData.deliveryMethod === 'delivery' ? formData.deliveryAddress : '',
          deliveryNotes: formData.deliveryNotes || '',
          pickupTime: formData.pickupTime || '',
          paymentStatus: 'completed', // Payment was completed via Stripe
          stripePaymentIntentId: stripePaymentIntentId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const orderRef = await addDoc(collection(firestore, 'orders'), orderData)

        // Send email notifications
        try {
          const businessDoc = await getDoc(doc(firestore, 'businesses', group.businessId))
          const businessData = businessDoc.data()
          const businessEmail = businessData?.email || businessData?.website || ''
          const businessAddress = businessData?.address || ''

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
                subtotal: groupSubtotal,
                platformFee: groupPlatformFee,
                discount: groupDiscount > 0 ? groupDiscount : 0,
                total: groupTotal,
                deliveryMethod: formData.deliveryMethod,
                deliveryAddress: formData.deliveryAddress,
                pickupAddress: businessAddress,
                deliveryNotes: formData.deliveryNotes,
                customerPhone: formData.phone,
              }),
            }).catch((err) => {
              if (process.env.NODE_ENV === 'development') {
                console.error('Email notification error:', err)
              }
            })
          }
        } catch (emailError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error sending email notifications:', emailError)
          }
        }

        return orderRef
      })

      await Promise.all(orderPromises)

      // Increment discount code usage
      if (appliedDiscount && appliedDiscount.id) {
        try {
          const discountRef = doc(firestore, 'discountCodes', appliedDiscount.id)
          await updateDoc(discountRef, {
            usageCount: increment(1),
          })
        } catch (discountErr) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error updating discount code usage:', discountErr)
          }
        }
      }

      clearCart()
      // Redirect to success page with better confirmation
      router.push('/checkout/success')
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating order:', err)
      }

      if (err.message && err.message.includes('Insufficient inventory:')) {
        setError(err.message)
      } else if (err.message && err.message.includes('inventory')) {
        setError('Some items are no longer available. Please review your cart.')
      } else {
        setError(err.message || 'Failed to create order. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage)
  }

  if (!user || items.length === 0) {
    return null
  }

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
          <div className="checkout-main">
            {/* Order Summary */}
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
            {step === 'details' && (
              <div className="checkout-section">
                <h2>Delivery Information</h2>
                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleContinueToPayment}>
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
                    {submitting ? 'Processing...' : 'Continue to Payment'}
                  </button>
                </form>
              </div>
            )}

            {/* Payment Section */}
            {step === 'payment' && clientSecret && (
              <div className="checkout-section">
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={() => {
                      setStep('details')
                      setClientSecret(null)
                      setPaymentIntentId(null)
                    }}
                    className="text-green-600 hover:text-green-700 flex items-center gap-1"
                  >
                    ← Back to Details
                  </button>
                  <h2>Payment</h2>
                </div>
                {error && <div className="alert alert-error">{error}</div>}

                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                    },
                  }}
                >
                  <StripeCheckoutForm
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    buttonText={`Pay $${finalTotal.toFixed(2)}`}
                  />
                </Elements>
              </div>
            )}
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

              {step === 'details' && (
                <div className="payment-notice">
                  <p>
                    <strong>Secure Payment:</strong> Powered by Stripe
                  </p>
                  <p className="payment-notice-text">
                    Complete your information to proceed to secure payment processing.
                  </p>
                </div>
              )}

              {step === 'payment' && (
                <div className="payment-notice">
                  <p>
                    <strong>Payment Info:</strong> Secure checkout
                  </p>
                  <p className="payment-notice-text">
                    Your payment is processed securely through Stripe. Funds are automatically
                    split: 98% to business, 2% platform fee.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
