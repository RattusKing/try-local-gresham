'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useAuth } from '@/lib/firebase/auth-context'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

function AddPaymentMethodForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const { user } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements || !user) {
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const { error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/profile`,
        },
        redirect: 'if_required',
      })

      if (error) {
        setErrorMessage(error.message || 'Failed to save payment method')
      } else {
        onSuccess()
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
      <div
        style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '2px solid rgba(194, 175, 240, 0.3)',
          marginBottom: '1rem',
        }}
      >
        <PaymentElement
          options={{
            layout: {
              type: 'tabs',
              defaultCollapsed: false,
            },
          }}
        />
      </div>

      {errorMessage && (
        <div
          style={{
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '8px',
            padding: '0.75rem',
            marginBottom: '1rem',
            color: '#991b1b',
          }}
        >
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="btn btn-primary"
        style={{ width: '100%' }}
      >
        {isProcessing ? 'Saving...' : 'Save Payment Method'}
      </button>
    </form>
  )
}

export default function PaymentMethodsManager() {
  const { user } = useAuth()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchPaymentMethods = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch(`/api/stripe/payment-methods?userId=${user.uid}`)
      const data = await response.json()

      if (response.ok) {
        setPaymentMethods(data.paymentMethods || [])
      } else {
        setError(data.error || 'Failed to load payment methods')
      }
    } catch (err: any) {
      setError('Failed to load payment methods')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPaymentMethods()
  }, [user])

  const handleAddPaymentMethod = async () => {
    if (!user) return

    try {
      setError(null)
      const response = await fetch('/api/stripe/setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      })

      const data = await response.json()

      if (response.ok) {
        setSetupClientSecret(data.clientSecret)
        setShowAddForm(true)
      } else {
        setError(data.error || 'Failed to initialize payment form')
      }
    } catch (err: any) {
      setError('Failed to initialize payment form')
    }
  }

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    if (!user) return

    if (!confirm('Are you sure you want to remove this payment method?')) {
      return
    }

    try {
      const response = await fetch(
        `/api/stripe/payment-methods?paymentMethodId=${paymentMethodId}&userId=${user.uid}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        await fetchPaymentMethods()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete payment method')
      }
    } catch (err: any) {
      alert('Failed to delete payment method')
    }
  }

  const handlePaymentMethodAdded = () => {
    setShowAddForm(false)
    setSetupClientSecret(null)
    fetchPaymentMethods()
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
        Loading payment methods...
      </div>
    )
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
          Payment Methods
        </h3>
        {!showAddForm && (
          <button
            onClick={handleAddPaymentMethod}
            className="btn btn-outline"
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          >
            + Add Card
          </button>
        )}
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '8px',
            padding: '0.75rem',
            marginBottom: '1rem',
            color: '#991b1b',
          }}
        >
          {error}
        </div>
      )}

      {/* List existing payment methods */}
      {paymentMethods.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {paymentMethods.map((pm) => (
            <div
              key={pm.id}
              style={{
                background: 'white',
                border: '2px solid rgba(153, 237, 195, 0.2)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '28px',
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--dark)',
                  }}
                >
                  {pm.brand.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>•••• {pm.last4}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                    Expires {pm.expMonth}/{pm.expYear}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDeletePaymentMethod(pm.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  fontWeight: 600,
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="empty-state"
          style={{
            textAlign: 'center',
            padding: '2rem',
            marginBottom: '1rem',
          }}
        >
          <p>No saved payment methods</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
            Add a payment method for faster checkout
          </p>
        </div>
      )}

      {/* Add payment method form */}
      {showAddForm && setupClientSecret && (
        <div style={{ marginTop: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
              Add New Payment Method
            </h4>
            <button
              onClick={() => {
                setShowAddForm(false)
                setSetupClientSecret(null)
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                padding: '0.5rem',
              }}
            >
              Cancel
            </button>
          </div>
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: setupClientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#99edc3',
                  colorBackground: '#ffffff',
                  colorText: '#373737',
                },
              },
            }}
          >
            <AddPaymentMethodForm onSuccess={handlePaymentMethodAdded} />
          </Elements>
        </div>
      )}
    </div>
  )
}
