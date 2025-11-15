'use client'

import { useCart } from '@/lib/cart-context'
import { useRouter } from 'next/navigation'
import './CartModal.css'

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartModal({ isOpen, onClose }: CartModalProps) {
  const { items, itemCount, subtotal, platformFee, total, updateQuantity, removeItem } = useCart()
  const router = useRouter()

  if (!isOpen) return null

  const handleCheckout = () => {
    onClose()
    router.push('/checkout')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content cart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Your Cart ({itemCount})</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close cart">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {items.length === 0 ? (
            <div className="empty-cart">
              <p>Your cart is empty</p>
              <p className="empty-cart-subtitle">Add some products to get started!</p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {items.map((item) => (
                  <div key={item.productId} className="cart-item">
                    {item.productImage && (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="cart-item-image"
                      />
                    )}
                    <div className="cart-item-details">
                      <h4>{item.productName}</h4>
                      <p className="cart-item-business">{item.businessName}</p>
                      <p className="cart-item-price">${item.price.toFixed(2)} each</p>
                    </div>
                    <div className="cart-item-actions">
                      <div className="quantity-controls">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <p className="cart-item-total">${(item.price * item.quantity).toFixed(2)}</p>
                      <button
                        className="remove-btn"
                        onClick={() => removeItem(item.productId)}
                        aria-label="Remove item"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="cart-summary-row">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="cart-summary-row">
                  <span>Platform Fee (2%):</span>
                  <span>${platformFee.toFixed(2)}</span>
                </div>
                <div className="cart-summary-row cart-total">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={onClose}>
              Continue Shopping
            </button>
            <button className="btn btn-primary" onClick={handleCheckout}>
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
