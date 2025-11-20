'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AuthModal from '@/components/AuthModal'
import BusinessApplicationModal from '@/components/BusinessApplicationModal'
import { useAuth } from '@/lib/firebase/auth-context'

export default function GetListedPage() {
  const { user } = useAuth()
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isApplicationOpen, setIsApplicationOpen] = useState(false)

  // Auto-open application modal if user is signed in
  useEffect(() => {
    if (user) {
      setIsApplicationOpen(true)
    }
  }, [user])

  const handleApplyClick = () => {
    if (!user) {
      setIsAuthOpen(true)
    } else {
      setIsApplicationOpen(true)
    }
  }

  return (
    <>
      <Header onSignIn={() => setIsAuthOpen(true)} />

      <main>
        {/* Hero Section */}
        <section style={{
          background: 'linear-gradient(135deg, rgba(153, 237, 195, 0.1), rgba(194, 175, 240, 0.1))',
          padding: '5rem 0 4rem'
        }}>
          <div className="container">
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
              onMouseOver={(e) => {
                e.currentTarget.style.color = 'var(--secondary)'
                e.currentTarget.style.transform = 'translateX(-4px)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = 'var(--secondary-dark)'
                e.currentTarget.style.transform = 'translateX(0)'
              }}
            >
              ← Back to Home
            </Link>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}
            >
              <h1 style={{
                fontSize: '2.75rem',
                fontWeight: 800,
                marginBottom: '1rem',
                color: 'var(--dark)',
                lineHeight: 1.2
              }}>
                List Your Business on{' '}
                <span style={{
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent'
                }}>
                  TryLocal Gresham
                </span>
              </h1>
              <p style={{
                fontSize: '1.125rem',
                color: 'var(--muted)',
                marginBottom: '2rem',
                lineHeight: 1.6
              }}>
                Connect with local customers and grow your business in the Gresham community.
              </p>
              <button
                onClick={handleApplyClick}
                className="btn btn-primary"
                style={{ fontSize: '1.125rem', padding: '1rem 2.5rem' }}
              >
                {user ? 'Complete Application' : 'Sign In to Apply'}
              </button>
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="section container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>What You Get</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '2rem'
            }}>
              <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem'
                }}>
                  🏪
                </div>
                <h3 style={{ marginBottom: '0.75rem' }}>Professional Profile</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                  A beautiful, modern business page with your branding, photos, and details.
                </p>
              </div>

              <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem'
                }}>
                  👥
                </div>
                <h3 style={{ marginBottom: '0.75rem' }}>Local Customers</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                  Reach people actively looking for businesses like yours in Gresham.
                </p>
              </div>

              <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem'
                }}>
                  🛒
                </div>
                <h3 style={{ marginBottom: '0.75rem' }}>Online Orders</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                  Accept orders and bookings directly through your business profile.
                </p>
              </div>

              <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem'
                }}>
                  📊
                </div>
                <h3 style={{ marginBottom: '0.75rem' }}>Analytics Dashboard</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                  Track your views, orders, and customer engagement over time.
                </p>
              </div>

              <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem'
                }}>
                  ⭐
                </div>
                <h3 style={{ marginBottom: '0.75rem' }}>Customer Reviews</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                  Build trust with ratings and reviews from verified customers.
                </p>
              </div>

              <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem'
                }}>
                  🎨
                </div>
                <h3 style={{ marginBottom: '0.75rem' }}>Easy Management</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                  Update your info, products, and hours anytime from your dashboard.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Process Section */}
        <section style={{
          background: 'linear-gradient(135deg, rgba(153, 237, 195, 0.05), rgba(194, 175, 240, 0.05))',
          padding: '4rem 0'
        }}>
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>Simple Application Process</h2>
              <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                display: 'grid',
                gap: '2rem'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '1.5rem',
                  alignItems: 'flex-start',
                  padding: '1.5rem',
                  background: 'white',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow)'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: 'var(--dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    flexShrink: 0
                  }}>
                    1
                  </div>
                  <div>
                    <h3 style={{ marginBottom: '0.5rem' }}>Fill Out Application</h3>
                    <p style={{ color: 'var(--muted)' }}>
                      Provide basic details about your business, including name, location, category, and a brief description.
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '1.5rem',
                  alignItems: 'flex-start',
                  padding: '1.5rem',
                  background: 'white',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow)'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'var(--secondary)',
                    color: 'var(--dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    flexShrink: 0
                  }}>
                    2
                  </div>
                  <div>
                    <h3 style={{ marginBottom: '0.5rem' }}>We Review Your Application</h3>
                    <p style={{ color: 'var(--muted)' }}>
                      Our team will review your submission within 1-2 business days to ensure quality standards.
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '1.5rem',
                  alignItems: 'flex-start',
                  padding: '1.5rem',
                  background: 'white',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow)'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: 'var(--dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    flexShrink: 0
                  }}>
                    3
                  </div>
                  <div>
                    <h3 style={{ marginBottom: '0.5rem' }}>Get Approved & Go Live</h3>
                    <p style={{ color: 'var(--muted)' }}>
                      Once approved, you'll receive dashboard access and your business will be live on TryLocal Gresham!
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="section container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>Common Questions</h2>
            <div style={{ maxWidth: '700px', margin: '0 auto', display: 'grid', gap: '1.5rem' }}>
              <div style={{ padding: '1.5rem', background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.125rem' }}>Do I need to be signed in to apply?</h3>
                <p style={{ color: 'var(--muted)' }}>
                  Yes, you need to create an account first. This ensures your business is securely linked to your account and you can manage it after approval.
                </p>
              </div>

              <div style={{ padding: '1.5rem', background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.125rem' }}>How long does approval take?</h3>
                <p style={{ color: 'var(--muted)' }}>
                  Most applications are reviewed within 1-2 business days. You'll receive an email notification once your application is approved.
                </p>
              </div>

              <div style={{ padding: '1.5rem', background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.125rem' }}>What if I need help?</h3>
                <p style={{ color: 'var(--muted)' }}>
                  Our team is here to help! Contact us at support@try-local.com with any questions about the application process.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Final CTA */}
        <section style={{
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          padding: '4rem 2rem',
          textAlign: 'center'
        }}>
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--dark)' }}>
                Ready to Join TryLocal Gresham?
              </h2>
              <p style={{ fontSize: '1.125rem', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem', color: 'var(--dark)', opacity: 0.9 }}>
                Thanks! We'll review your submission and notify you once your business is approved.
              </p>
              <button
                onClick={handleApplyClick}
                className="btn"
                style={{
                  background: 'white',
                  color: 'var(--dark)',
                  fontSize: '1.125rem',
                  padding: '1rem 2.5rem',
                  boxShadow: 'var(--shadow-lg)',
                  fontWeight: 700
                }}
              >
                {user ? 'Start Application' : 'Sign In to Get Started'}
              </button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <BusinessApplicationModal
        isOpen={isApplicationOpen}
        onClose={() => setIsApplicationOpen(false)}
      />
    </>
  )
}
