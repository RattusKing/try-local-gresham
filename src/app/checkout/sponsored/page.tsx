'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useAuth } from '@/lib/firebase/auth-context'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

function CheckoutForm({ bannerId, onSuccess }: { bannerId: string; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setProcessing(true)
    setError('')

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/sponsored/success?banner=${bannerId}`,
        },
        redirect: 'if_required',
      })

      if (submitError) {
        setError(submitError.message || 'Payment failed')
        setProcessing(false)
        return
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment on server and activate banner
        const response = await fetch('/api/stripe/sponsored-payment', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bannerId,
            paymentIntentId: paymentIntent.id,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to activate banner')
        }

        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && (
        <div className="alert alert-error" style={{ marginTop: '1rem' }}>
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="btn btn-primary"
        style={{
          width: '100%',
          padding: '1rem',
          marginTop: '1.5rem',
          fontSize: '1rem',
        }}
      >
        {processing ? 'Processing Payment...' : 'Pay Now'}
      </button>
    </form>
  )
}

function SponsoredCheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const bannerId = searchParams.get('banner')
  const clientSecretParam = searchParams.get('cs')

  useEffect(() => {
    if (clientSecretParam) {
      setClientSecret(clientSecretParam)
    }
  }, [clientSecretParam])

  if (!user) {
    return (
      <div className="container" style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center' }}>
        <p>Please sign in to continue</p>
      </div>
    )
  }

  if (!bannerId || !clientSecret) {
    return (
      <div className="container" style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center' }}>
        <p>Invalid checkout link</p>
        <a href="/dashboard/business" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Return to Dashboard
        </a>
      </div>
    )
  }

  if (success) {
    return (
      <div className="container" style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center' }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 style={{ marginBottom: '0.5rem' }}>Payment Successful!</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
          Your sponsored placement is now active. Your business will appear in the featured banner on the homepage.
        </p>
        <a href="/dashboard/business" className="btn btn-primary">
          Return to Dashboard
        </a>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: '500px', margin: '4rem auto' }}>
      <div style={{
        background: 'white',
        borderRadius: 'var(--radius)',
        padding: '2rem',
        boxShadow: 'var(--shadow)',
      }}>
        <h1 style={{ marginTop: 0, marginBottom: '0.5rem', textAlign: 'center' }}>
          Complete Your Payment
        </h1>
        <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: '2rem' }}>
          Sponsored Featured Placement
        </p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#99edc3',
                borderRadius: '8px',
              },
            },
          }}
        >
          <CheckoutForm
            bannerId={bannerId}
            onSuccess={() => setSuccess(true)}
          />
        </Elements>

        <p style={{
          marginTop: '1.5rem',
          fontSize: '0.75rem',
          color: 'var(--muted)',
          textAlign: 'center',
        }}>
          Secure payment powered by Stripe
        </p>
      </div>
    </div>
  )
}

export default function SponsoredCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p>Loading checkout...</p>
      </div>
    }>
      <SponsoredCheckoutContent />
    </Suspense>
  )
}
