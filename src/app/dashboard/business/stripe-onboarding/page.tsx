'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/firebase/auth-context'
import { db } from '@/lib/firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import { Business } from '@/lib/types'

export default function StripeOnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [accountStatus, setAccountStatus] = useState<'pending' | 'verified' | 'restricted' | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)

  // Check for success/refresh params
  useEffect(() => {
    const successParam = searchParams.get('success')
    const refreshParam = searchParams.get('refresh')

    if (successParam) {
      setSuccess(true)
      checkAccountStatus()
    }

    if (refreshParam) {
      setError('Onboarding session expired. Please try again.')
    }
  }, [searchParams])

  // Load business data
  useEffect(() => {
    loadBusinessData()
  }, [user])

  const loadBusinessData = async () => {
    if (!user || !db) return

    try {
      // Find business owned by this user
      const businessesRef = doc(db, 'businesses', user.uid)
      const businessDoc = await getDoc(businessesRef)

      if (businessDoc.exists()) {
        const businessData = { id: businessDoc.id, ...businessDoc.data() } as Business
        setBusiness(businessData)
        setAccountStatus(businessData.stripeAccountStatus || null)
      }
    } catch (err) {
      console.error('Error loading business:', err)
    }
  }

  const checkAccountStatus = async () => {
    if (!business?.stripeConnectedAccountId) return

    try {
      const response = await fetch('/api/stripe/connect/account-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: business.stripeConnectedAccountId,
          businessId: business.id,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setAccountStatus(data.accountStatus)
        setBusiness(prev => prev ? { ...prev, stripeAccountStatus: data.accountStatus } : null)
      }
    } catch (err) {
      console.error('Error checking account status:', err)
    }
  }

  const handleStartOnboarding = async () => {
    if (!user || !business) return

    try {
      setLoading(true)
      setError('')

      let accountId = business.stripeConnectedAccountId

      // Create account if doesn't exist
      if (!accountId) {
        const createResponse = await fetch('/api/stripe/connect/create-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: business.id,
            email: user.email,
            businessName: business.name,
          }),
        })

        const createData = await createResponse.json()

        if (!createResponse.ok) {
          throw new Error(createData.error || 'Failed to create account')
        }

        accountId = createData.accountId
      }

      // Get account link for onboarding
      const linkResponse = await fetch('/api/stripe/connect/account-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: accountId,
          businessId: business.id,
        }),
      })

      const linkData = await linkResponse.json()

      if (!linkResponse.ok) {
        throw new Error(linkData.error || 'Failed to create onboarding link')
      }

      // Redirect to Stripe onboarding
      window.location.href = linkData.url
    } catch (err: any) {
      setError(err.message || 'Failed to start onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <p>Please log in to access this page.</p>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Stripe Payment Setup</h1>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 font-semibold">Onboarding completed!</p>
          <p className="text-green-700 text-sm mt-1">
            Your Stripe account is being verified. This may take a few minutes.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Payment Account Status</h2>

        {accountStatus === 'verified' ? (
          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
            <svg className="w-6 h-6 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="font-semibold text-green-900">Account Verified</p>
              <p className="text-green-700 text-sm mt-1">
                Your Stripe account is fully set up and ready to receive payments!
              </p>
            </div>
          </div>
        ) : accountStatus === 'pending' ? (
          <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
            <svg className="w-6 h-6 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-yellow-900">Verification Pending</p>
              <p className="text-yellow-700 text-sm mt-1">
                Your account is being verified. Complete any remaining steps in Stripe to start accepting payments.
              </p>
              <button
                onClick={handleStartOnboarding}
                disabled={loading}
                className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 transition-colors"
              >
                {loading ? 'Loading...' : 'Continue Setup'}
              </button>
            </div>
          </div>
        ) : accountStatus === 'restricted' ? (
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
            <svg className="w-6 h-6 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-semibold text-red-900">Account Restricted</p>
              <p className="text-red-700 text-sm mt-1">
                Your account needs attention. Please complete the required steps in Stripe.
              </p>
              <button
                onClick={handleStartOnboarding}
                disabled={loading}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors"
              >
                {loading ? 'Loading...' : 'Fix Account Issues'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-blue-900">Payment Setup Required</p>
              <p className="text-blue-700 text-sm mt-1">
                Connect your Stripe account to start accepting payments from customers.
              </p>
              <button
                onClick={handleStartOnboarding}
                disabled={loading}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
              >
                {loading ? 'Loading...' : 'Start Setup'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="font-semibold">Connect Your Stripe Account</h3>
              <p className="text-gray-600 text-sm mt-1">
                Click "Start Setup" to create your Stripe Connect account. This is where you'll receive payments.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="font-semibold">Complete Stripe Onboarding</h3>
              <p className="text-gray-600 text-sm mt-1">
                Provide your business information and bank account details securely through Stripe.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="font-semibold">Start Receiving Payments</h3>
              <p className="text-gray-600 text-sm mt-1">
                Once verified, you'll automatically receive 98% of each sale directly to your bank account.
                Try Local Gresham keeps a 2% platform fee.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-white rounded border border-gray-200">
          <p className="text-sm font-semibold mb-2">Payment Timeline:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Customers pay with credit/debit cards</li>
            <li>• You receive 98% of the payment</li>
            <li>• Platform fee (2%) is automatically deducted</li>
            <li>• Funds are deposited to your bank account within 2-7 business days</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => router.push('/dashboard/business')}
          className="text-green-600 hover:text-green-700 font-medium"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  )
}
