'use client'

import { useState, useEffect } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { logger } from '@/lib/logger';

interface StripeCheckoutFormProps {
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
  buttonText?: string
}

export default function StripeCheckoutForm({
  onSuccess,
  onError,
  buttonText = 'Pay Now'
}: StripeCheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Check if Stripe is loaded
  useEffect(() => {
    if (stripe && elements) {
      setIsReady(true)
      logger.log('Stripe and Elements are ready')
    } else {
      logger.log('Waiting for Stripe...', { stripe: !!stripe, elements: !!elements })
    }
  }, [stripe, elements])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: 'if_required',
      })

      if (error) {
        setErrorMessage(error.message || 'Payment failed')
        onError(error.message || 'Payment failed')
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id)
      } else {
        setErrorMessage('Payment processing failed')
        onError('Payment processing failed')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred')
      onError(err.message || 'An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Payment Information</h3>

        {!isReady && (
          <div className="py-8 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
            <p>Loading payment form...</p>
          </div>
        )}

        <div style={{ minHeight: '200px' }}>
          <PaymentElement
            options={{
              layout: {
                type: 'tabs',
                defaultCollapsed: false,
              },
            }}
          />
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
          !stripe || isProcessing
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {isProcessing ? 'Processing...' : buttonText}
      </button>

      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
        <span>Secure payment powered by Stripe</span>
      </div>
    </form>
  )
}
