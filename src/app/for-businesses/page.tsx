'use client'

import { motion } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useState } from 'react'
import AuthModal from '@/components/AuthModal'

export default function ForBusinessesPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  return (
    <>
      <Header onSignIn={() => setIsAuthOpen(true)} />

      <main>
        {/* Hero Section */}
        <section style={{
          background: 'linear-gradient(135deg, rgba(153, 237, 195, 0.15), rgba(194, 175, 240, 0.15))',
          padding: '5rem 0 4rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div className="container" style={{ position: 'relative', zIndex: 2 }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}
            >
              <h1 style={{
                fontSize: '3rem',
                fontWeight: 800,
                marginBottom: '1rem',
                color: 'var(--dark)',
                lineHeight: 1.2
              }}>
                Put Your Business on{' '}
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
                fontSize: '1.25rem',
                color: 'var(--muted)',
                marginBottom: '2rem',
                lineHeight: 1.6
              }}>
                Showcase your business with a clean, modern profile where local customers can find you.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="/get-listed" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '0.875rem 2rem' }}>
                  Apply to Get Listed
                </a>
              </div>
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
            <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2rem' }}>
              Why Join TryLocal Gresham?
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem'
            }}>
              <motion.div
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{ padding: '2rem', textAlign: 'center' }}
              >
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  margin: '0 auto 1.5rem',
                  boxShadow: 'var(--shadow)'
                }}>
                  📍
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Reach Local Customers</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                  People use TryLocal to find businesses in Gresham.
                </p>
              </motion.div>

              <motion.div
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                style={{ padding: '2rem', textAlign: 'center' }}
              >
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  margin: '0 auto 1.5rem',
                  boxShadow: 'var(--shadow)'
                }}>
                  ✨
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Modern Business Profile</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                  Your hours, description, and photos all in one clean layout.
                </p>
              </motion.div>

              <motion.div
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                style={{ padding: '2rem', textAlign: 'center' }}
              >
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  margin: '0 auto 1.5rem',
                  boxShadow: 'var(--shadow)'
                }}>
                  🎯
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Simple Management</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                  Update your information anytime through your dashboard.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* How It Works Section */}
        <section style={{
          background: 'linear-gradient(135deg, rgba(153, 237, 195, 0.05), rgba(194, 175, 240, 0.05))',
          padding: '4rem 0'
        }}>
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2rem' }}>
                How It Works
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '3rem',
                maxWidth: '900px',
                margin: '0 auto'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: 'var(--dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    margin: '0 auto 1rem',
                    boxShadow: 'var(--shadow)'
                  }}>
                    1
                  </div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Apply</h3>
                  <p style={{ color: 'var(--muted)' }}>Tell us about your business.</p>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'var(--secondary)',
                    color: 'var(--dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    margin: '0 auto 1rem',
                    boxShadow: 'var(--shadow)'
                  }}>
                    2
                  </div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>We review</h3>
                  <p style={{ color: 'var(--muted)' }}>Our team checks the details and approves your profile.</p>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: 'var(--dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    margin: '0 auto 1rem',
                    boxShadow: 'var(--shadow)'
                  }}>
                    3
                  </div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Go live</h3>
                  <p style={{ color: 'var(--muted)' }}>Once approved, your business appears on TryLocal Gresham.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="section container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            style={{
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              borderRadius: 'var(--radius-lg)',
              padding: '4rem 3rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-xl)',
              color: 'var(--dark)'
            }}
          >
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--dark)' }}>
              Ready to Get Started?
            </h2>
            <p style={{ fontSize: '1.125rem', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem', opacity: 0.9 }}>
              Join the growing community of local businesses on TryLocal Gresham.
            </p>
            <a
              href="/get-listed"
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
              Apply Now
            </a>
          </motion.div>
        </section>
      </main>

      <Footer />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  )
}
