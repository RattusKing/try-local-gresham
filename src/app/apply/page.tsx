'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { db } from '@/lib/firebase/config'
import { collection, addDoc } from 'firebase/firestore'
import { useAuth } from '@/lib/firebase/auth-context'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AuthModal from '@/components/AuthModal'
import '../../components/BusinessApplicationModal.css'

export default function ApplyPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  // Pre-fill user info if authenticated
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    neighborhood: '',
    category: '',
    description: '',
    website: '',
    instagram: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Require authentication
    if (!user) {
      setError('Please sign in to submit a business application')
      setIsAuthOpen(true)
      return
    }

    setSubmitting(true)

    if (!db) {
      setError('Database not available')
      setSubmitting(false)
      return
    }

    try {
      // Create business application with user link
      const applicationData = {
        ...formData,
        userId: user.uid,
        userEmail: user.email,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await addDoc(collection(db, 'business_applications'), applicationData)

      // Send application received email
      if (formData.email) {
        fetch('/api/emails/business-application', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessEmail: formData.email,
            businessName: formData.businessName,
            ownerName: formData.ownerName,
          }),
        }).catch((err) => console.error('Email error:', err))
      }

      setSuccess(true)

      // Redirect to home after 3 seconds
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (err: any) {
      console.error('Error submitting application:', err)
      setError(err.message || 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  // Show authentication required message
  if (!user) {
    return (
      <>
        <Header onSignIn={() => setIsAuthOpen(true)} />
        <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: '600px', textAlign: 'center', padding: '2rem' }}
          >
            <div className="auth-required-content">
              <div className="auth-icon" style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔐</div>
              <h1>Sign In Required</h1>
              <p style={{ fontSize: '1.125rem', color: 'var(--muted)', margin: '1rem 0 2rem' }}>
                To apply for a business account, you need to be signed in. This ensures your business
                is securely linked to your account and you can manage it effectively.
              </p>
              <div className="auth-benefits" style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto 2rem' }}>
                <h4>Why sign in?</h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '0.5rem' }}>✓ Secure account linking</li>
                  <li style={{ marginBottom: '0.5rem' }}>✓ Easy application tracking</li>
                  <li style={{ marginBottom: '0.5rem' }}>✓ Instant dashboard access upon approval</li>
                  <li style={{ marginBottom: '0.5rem' }}>✓ Manage your business profile and products</li>
                </ul>
              </div>
              <button onClick={() => setIsAuthOpen(true)} className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '1rem 2rem' }}>
                Sign In to Continue
              </button>
              <p style={{ marginTop: '1.5rem' }}>
                <Link href="/" style={{ color: 'var(--secondary)' }}>← Back to Home</Link>
              </p>
            </div>
          </motion.div>
        </main>
        <Footer />
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </>
    )
  }

  if (success) {
    return (
      <>
        <Header onSignIn={() => setIsAuthOpen(true)} />
        <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ maxWidth: '600px', textAlign: 'center', padding: '2rem' }}
          >
            <div className="success-message">
              <div className="success-icon" style={{ fontSize: '5rem', marginBottom: '1rem' }}>✓</div>
              <h1>Application Submitted Successfully!</h1>
              <p className="success-lead" style={{ fontSize: '1.25rem', margin: '1rem 0' }}>
                Thank you for your interest in joining Try Local Gresham.
              </p>
              <div className="success-details" style={{ textAlign: 'left', maxWidth: '500px', margin: '2rem auto', padding: '2rem', background: 'var(--light)', borderRadius: 'var(--radius)' }}>
                <h3>What happens next?</h3>
                <ol style={{ paddingLeft: '1.5rem' }}>
                  <li style={{ marginBottom: '0.75rem' }}>Our team will review your application within 1-2 business days</li>
                  <li style={{ marginBottom: '0.75rem' }}>You'll receive an email notification about your application status</li>
                  <li>Once approved, you'll gain immediate access to your business dashboard</li>
                </ol>
              </div>
              <p className="success-note" style={{ color: 'var(--muted)' }}>
                Questions? Feel free to reach out at <strong>support@try-local.com</strong>
              </p>
              <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                Redirecting to home page...
              </p>
            </div>
          </motion.div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header onSignIn={() => setIsAuthOpen(true)} />
      <main style={{ background: 'linear-gradient(135deg, rgba(153, 237, 195, 0.05), rgba(194, 175, 240, 0.05))', padding: '3rem 0' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--secondary-dark)',
                textDecoration: 'none',
                fontSize: '0.9375rem',
                fontWeight: 600,
                marginBottom: '2rem',
                transition: 'all 0.2s ease'
              }}
            >
              ← Back to Home
            </Link>

            <div style={{ background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', padding: '3rem' }}>
              <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: '1rem' }}>
                <div className="header-content">
                  <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Join Try Local Gresham</h1>
                  <p className="header-subtitle" style={{ fontSize: '1.125rem', color: 'var(--muted)' }}>
                    Grow your business with Gresham's premier local marketplace
                  </p>
                </div>
              </div>

              <div className="modal-body" style={{ padding: '2rem 0' }}>
                {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

                <div className="application-intro" style={{ marginBottom: '2rem' }}>
                  <p className="intro-lead" style={{ fontSize: '1.0625rem', color: 'var(--muted)' }}>
                    Connect with local customers, accept online orders, and grow your presence in the Gresham community.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="businessName">Business Name *</label>
                    <input
                      type="text"
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="ownerName">Owner/Contact Name *</label>
                    <input
                      type="text"
                      id="ownerName"
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone Number *</label>
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="address">Business Address *</label>
                    <input
                      type="text"
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main St, Gresham, OR 97030"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="neighborhood">Neighborhood *</label>
                      <select
                        id="neighborhood"
                        value={formData.neighborhood}
                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                        required
                      >
                        <option value="">Select neighborhood</option>
                        <option value="Downtown">Downtown</option>
                        <option value="Rockwood">Rockwood</option>
                        <option value="Powell Valley">Powell Valley</option>
                        <option value="Centennial">Centennial</option>
                        <option value="Pleasant Valley">Pleasant Valley</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="category">Business Category *</label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                      >
                        <option value="">Select category</option>
                        <option value="Food & Beverage">Food & Beverage</option>
                        <option value="Retail">Retail</option>
                        <option value="Services">Services</option>
                        <option value="Health & Wellness">Health & Wellness</option>
                        <option value="Arts & Entertainment">Arts & Entertainment</option>
                        <option value="Home & Garden">Home & Garden</option>
                        <option value="Professional Services">Professional Services</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Business Description *</label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      placeholder="Tell us about your business, what you offer, and what makes you unique..."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="website">Website (optional)</label>
                    <input
                      type="url"
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://yourbusiness.com"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="instagram">Instagram Handle (optional)</label>
                    <input
                      type="text"
                      id="instagram"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="@yourbusiness"
                    />
                  </div>

                  <div className="pricing-section">
                    <h3>Simple, Transparent Pricing</h3>
                    <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
                      Choose the plan that works best for your business
                    </p>
                    <div className="pricing-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                      {/* Monthly Plan */}
                      <div className="pricing-card">
                        <h4>Monthly Plan</h4>
                        <div className="pricing-amount">
                          <span className="currency">$</span>
                          <span className="price">39</span>
                          <span className="period">/month</span>
                        </div>
                        <ul className="pricing-features" style={{ fontSize: '0.9375rem' }}>
                          <li>✓ Unlimited product & service listings</li>
                          <li>✓ Online ordering & appointment booking</li>
                          <li>✓ Business analytics & insights</li>
                          <li>✓ Customer reviews & ratings</li>
                          <li>✓ Featured in local directory</li>
                          <li>✓ Payment processing via Stripe</li>
                        </ul>
                        <div className="pricing-fee" style={{ fontSize: '0.875rem', marginTop: '1rem' }}>
                          <strong>Transaction Fee:</strong> 2% per sale
                        </div>
                      </div>

                      {/* Annual Plan - Best Value */}
                      <div className="pricing-card featured" style={{ position: 'relative' }}>
                        <div className="pricing-badge" style={{
                          position: 'absolute',
                          top: '-12px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'var(--secondary-dark)',
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '100px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          whiteSpace: 'nowrap'
                        }}>BEST VALUE</div>
                        <h4>Annual Plan</h4>
                        <div className="pricing-amount">
                          <span className="currency">$</span>
                          <span className="price">430</span>
                          <span className="period">/year</span>
                        </div>
                        <div style={{
                          background: 'rgba(153, 237, 195, 0.2)',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          marginBottom: '1rem',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--primary-green)',
                          textAlign: 'center'
                        }}>
                          Save $38/year
                        </div>
                        <ul className="pricing-features" style={{ fontSize: '0.9375rem' }}>
                          <li>✓ Unlimited product & service listings</li>
                          <li>✓ Online ordering & appointment booking</li>
                          <li>✓ Business analytics & insights</li>
                          <li>✓ Customer reviews & ratings</li>
                          <li>✓ Featured in local directory</li>
                          <li>✓ Payment processing via Stripe</li>
                        </ul>
                        <div className="pricing-fee" style={{ fontSize: '0.875rem', marginTop: '1rem' }}>
                          <strong>Transaction Fee:</strong> 2% per sale
                        </div>
                      </div>
                    </div>
                    <div className="pricing-promo">
                      <span className="promo-badge">Special Launch Offer</span>
                      <p>First 10 businesses get their first month free! 7-day grace period to get set up. Non-profit? <a href="mailto:support@try-local.com" style={{ color: 'var(--secondary-dark)' }}>Contact us</a> for free access.</p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-large submit-btn"
                    disabled={submitting}
                    style={{ width: '100%', fontSize: '1.125rem', padding: '1rem' }}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner"></span>
                        Submitting Application...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </button>

                  <p className="form-footer-note" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--muted)' }}>
                    By submitting, you agree to our Terms of Service and understand that your application
                    will be reviewed within 1-2 business days.
                  </p>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  )
}
