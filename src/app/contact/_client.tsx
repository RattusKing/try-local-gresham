'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')

    try {
      // Send contact form via API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send message')
      }

      setStatus('success')
      setFormData({ name: '', email: '', subject: '', message: '' })

      // Reset success message after 5 seconds
      setTimeout(() => setStatus('idle'), 5000)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error submitting form:', error)
      }
      setStatus('error')
      setTimeout(() => setStatus('idle'), 5000)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <>
      <Header onSignIn={() => {}} />
      <main className="container" style={{ padding: '40px 20px', maxWidth: '800px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>Contact Us</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as
          possible.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '30px',
            marginBottom: '40px',
          }}
        >
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Email</h3>
            <p style={{ color: '#666' }}>
              <a href="mailto:hello@try-local.com" style={{ color: 'var(--orange)' }}>
                hello@try-local.com
              </a>
            </p>
          </div>

          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Location</h3>
            <p style={{ color: '#666' }}>
              Gresham, Oregon
              <br />
              United States
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            background: '#fff',
            padding: '30px',
            borderRadius: '18px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="name"
              style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}
            >
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e5e5e5',
                fontSize: '16px',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="email"
              style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}
            >
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e5e5e5',
                fontSize: '16px',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="subject"
              style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}
            >
              Subject *
            </label>
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e5e5e5',
                fontSize: '16px',
              }}
            >
              <option value="">Select a subject...</option>
              <option value="general">General Inquiry</option>
              <option value="business">Business Listing Question</option>
              <option value="technical">Technical Support</option>
              <option value="partnership">Partnership Opportunity</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="message"
              style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}
            >
              Message *
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e5e5e5',
                fontSize: '16px',
                resize: 'vertical',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={status === 'sending'}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
          >
            {status === 'sending' ? 'Sending...' : 'Send Message'}
          </button>

          {status === 'success' && (
            <div
              style={{
                marginTop: '15px',
                padding: '12px',
                background: '#e7f7e7',
                color: '#0a6e09',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              ✓ Message sent successfully! We'll get back to you soon.
            </div>
          )}

          {status === 'error' && (
            <div
              style={{
                marginTop: '15px',
                padding: '12px',
                background: '#ffe5e5',
                color: '#8a0000',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              ✗ Failed to send message. Please try again or email us directly.
            </div>
          )}
        </form>

        <div style={{ marginTop: '40px', textAlign: 'center', color: '#666' }}>
          <p>
            <strong>Business Inquiries:</strong>{' '}
            <a href="mailto:business@try-local.com" style={{ color: 'var(--orange)' }}>
              business@try-local.com
            </a>
          </p>
          <p style={{ marginTop: '10px' }}>
            <strong>Support:</strong>{' '}
            <a href="mailto:support@try-local.com" style={{ color: 'var(--orange)' }}>
              support@try-local.com
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
