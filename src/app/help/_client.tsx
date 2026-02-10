'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import './help.css'

interface FAQItem {
  question: string
  answer: string
  category: 'customer' | 'business' | 'general'
}

const faqs: FAQItem[] = [
  // Customer FAQs
  {
    category: 'customer',
    question: 'How do I place an order?',
    answer: 'Browse businesses, add products to your cart, and click checkout. You\'ll need to create an account or sign in. Choose pickup or delivery, enter your information, and confirm your order. The business will contact you to confirm.'
  },
  {
    category: 'customer',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit and debit cards through our secure Stripe payment processor. Your payment information is never stored on our servers.'
  },
  {
    category: 'customer',
    question: 'Can I cancel or modify my order?',
    answer: 'Contact the business directly as soon as possible through your order details page. Cancellation depends on the business\'s policy and whether they\'ve already started preparing your order.'
  },
  {
    category: 'customer',
    question: 'How do refunds work?',
    answer: 'Refund policies are set by individual businesses. If you have an issue with an order, contact the business first. If unresolved, email support@try-local.com and we\'ll help mediate. See our Refund Policy page for details.'
  },
  {
    category: 'customer',
    question: 'How does delivery work?',
    answer: 'Delivery options vary by business. Some offer their own delivery, while others may use third-party services. Delivery fees and areas are set by each business. You can see available options at checkout.'
  },
  {
    category: 'customer',
    question: 'How can I track my order?',
    answer: 'View your order status on the Orders page in your account. You\'ll receive email notifications when your order status changes. For specific timing questions, contact the business directly.'
  },
  {
    category: 'customer',
    question: 'Can I save my favorite businesses?',
    answer: 'Yes! Click the heart icon on any business page to save it to your Favorites list. Access your favorites from your customer dashboard.'
  },
  {
    category: 'customer',
    question: 'Is my personal information safe?',
    answer: 'Yes. We use industry-standard security measures and never sell your personal information. Payment processing is handled securely through Stripe. See our Privacy Policy for details.'
  },

  // Business Owner FAQs
  {
    category: 'business',
    question: 'How do I list my business?',
    answer: 'Click "For Businesses" in the header and fill out the application form. Our team reviews all applications within 1-2 business days. Once approved, you\'ll receive an email with dashboard access.'
  },
  {
    category: 'business',
    question: 'What are the fees?',
    answer: 'Try Local Gresham charges a 2% platform fee on transactions. Subscription plans: Free (basic listing), Standard ($29/mo - featured placement), Premium ($79/mo - priority placement + marketing tools). Stripe payment processing fees also apply.'
  },
  {
    category: 'business',
    question: 'How do I add products or services?',
    answer: 'After approval, log in to your business dashboard. Navigate to Products/Services and click "Add Product". Enter details, upload images, set prices, and enable inventory tracking if needed.'
  },
  {
    category: 'business',
    question: 'How do I manage orders?',
    answer: 'View all orders in your Orders dashboard. You can update order status (Confirmed, Ready, Completed, Cancelled), view customer details, and communicate with customers. Email notifications are sent automatically on status changes.'
  },
  {
    category: 'business',
    question: 'When do I receive payment?',
    answer: 'Payments are processed through Stripe and deposited to your connected bank account according to your Stripe payout schedule (typically 2-3 business days after order completion).'
  },
  {
    category: 'business',
    question: 'Can I offer delivery?',
    answer: 'Yes! You can offer pickup, delivery, or both. Set your delivery areas, fees, and policies in your business settings. You\'re responsible for fulfilling deliveries or can integrate with delivery services.'
  },
  {
    category: 'business',
    question: 'How do I track my sales?',
    answer: 'Your Analytics dashboard shows revenue, order counts, top products, and trends. Filter by time period and export data to CSV. Access detailed reports anytime from your business dashboard.'
  },
  {
    category: 'business',
    question: 'Can I edit my business information?',
    answer: 'Yes! Update your business profile, hours, description, photos, and contact info anytime from the "My Business" section of your dashboard. Changes are reflected immediately.'
  },
  {
    category: 'business',
    question: 'How do I handle inventory?',
    answer: 'Enable inventory tracking when creating/editing products. Set stock quantity and low-stock alerts. Inventory automatically decreases when orders are placed. You\'ll see alerts for low/out-of-stock items.'
  },

  // General FAQs
  {
    category: 'general',
    question: 'What is Try Local Gresham?',
    answer: 'Try Local Gresham is a digital marketplace connecting local residents with local businesses in Gresham, Oregon. Our mission is to make it easy to discover and support your neighbors\' businesses.'
  },
  {
    category: 'general',
    question: 'Is there a mobile app?',
    answer: 'Currently, Try Local Gresham is a web application optimized for mobile browsers. Simply visit try-local.com on any device. A native mobile app may be available in the future.'
  },
  {
    category: 'general',
    question: 'How do I contact support?',
    answer: 'Email support@try-local.com or use the Contact form. We typically respond within 1-2 business days (Monday-Friday, 9am-5pm PST).'
  },
  {
    category: 'general',
    question: 'What areas do you serve?',
    answer: 'We currently serve Gresham, Oregon and surrounding areas. Delivery areas vary by business. We\'re working to expand to more neighborhoods!'
  },
]

const businessGuide = [
  {
    title: 'Getting Started',
    steps: [
      {
        number: 1,
        title: 'Apply',
        description: 'Fill out the business application form with your business details, contact information, and what you offer.'
      },
      {
        number: 2,
        title: 'Get Approved',
        description: 'Our team reviews your application within 1-2 business days. You\'ll receive an email when approved with login instructions.'
      },
      {
        number: 3,
        title: 'Set Up Your Profile',
        description: 'Add photos, description, hours, location, and contact info. A complete profile attracts more customers!'
      },
      {
        number: 4,
        title: 'Add Products/Services',
        description: 'Create product listings with descriptions, prices, and images. Enable inventory tracking for physical products.'
      },
      {
        number: 5,
        title: 'Start Receiving Orders',
        description: 'You\'re live! Monitor orders in your dashboard, update statuses, and manage your business.'
      }
    ]
  },
  {
    title: 'Best Practices',
    steps: [
      {
        number: 1,
        title: 'Complete Your Profile',
        description: 'Add high-quality photos, detailed descriptions, and accurate hours. Complete profiles get 3x more views.'
      },
      {
        number: 2,
        title: 'Respond Quickly',
        description: 'Confirm orders within 24 hours. Fast response times build customer trust and loyalty.'
      },
      {
        number: 3,
        title: 'Keep Inventory Updated',
        description: 'Enable inventory tracking and keep stock levels current. Nothing frustrates customers more than out-of-stock items.'
      },
      {
        number: 4,
        title: 'Monitor Your Analytics',
        description: 'Check your analytics dashboard weekly to understand what\'s selling, peak order times, and revenue trends.'
      },
      {
        number: 5,
        title: 'Engage with Reviews',
        description: 'Respond to customer reviews (both positive and negative) to show you value feedback and care about service.'
      }
    ]
  }
]

export default function HelpPage() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'customer' | 'business' | 'general'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <>
      <Header onSignIn={() => {}} />
      <main className="help-page">
        <div className="help-hero">
          <div className="container">
            <h1>Help Center</h1>
            <p>Find answers to common questions and learn how to make the most of Try Local Gresham</p>

            <div className="help-search">
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </div>

        <div className="container help-content">
          {/* Quick Links */}
          <div className="help-quick-links">
            <a href="#customer-faqs" className="quick-link">
              <span className="link-icon">🛍️</span>
              <span className="link-text">Customer Guide</span>
            </a>
            <a href="#business-guide" className="quick-link">
              <span className="link-icon">🏪</span>
              <span className="link-text">Business Guide</span>
            </a>
            <a href="/contact" className="quick-link">
              <span className="link-icon">📧</span>
              <span className="link-text">Contact Support</span>
            </a>
            <a href="/terms" className="quick-link">
              <span className="link-icon">📄</span>
              <span className="link-text">Policies</span>
            </a>
          </div>

          {/* FAQ Section */}
          <section id="customer-faqs" className="help-section">
            <h2>Frequently Asked Questions</h2>

            <div className="faq-filters">
              <button
                className={selectedCategory === 'all' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setSelectedCategory('all')}
              >
                All
              </button>
              <button
                className={selectedCategory === 'customer' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setSelectedCategory('customer')}
              >
                Customers
              </button>
              <button
                className={selectedCategory === 'business' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setSelectedCategory('business')}
              >
                Businesses
              </button>
              <button
                className={selectedCategory === 'general' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setSelectedCategory('general')}
              >
                General
              </button>
            </div>

            <div className="faq-list">
              {filteredFAQs.length === 0 ? (
                <p className="no-results">No FAQs found. Try a different search or category.</p>
              ) : (
                filteredFAQs.map((faq, index) => (
                  <div key={index} className="faq-item">
                    <button
                      className="faq-question"
                      onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                    >
                      <span>{faq.question}</span>
                      <span className="faq-icon">{expandedFAQ === index ? '−' : '+'}</span>
                    </button>
                    {expandedFAQ === index && (
                      <div className="faq-answer">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Business Owner Guide */}
          <section id="business-guide" className="help-section">
            <h2>Business Owner Guide</h2>

            {businessGuide.map((section, sectionIndex) => (
              <div key={sectionIndex} className="guide-section">
                <h3>{section.title}</h3>
                <div className="guide-steps">
                  {section.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="guide-step">
                      <div className="step-number">{step.number}</div>
                      <div className="step-content">
                        <h4>{step.title}</h4>
                        <p>{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Contact Support */}
          <section className="help-section support-section">
            <h2>Still Need Help?</h2>
            <p>Can't find what you're looking for? Our support team is here to help!</p>
            <div className="support-options">
              <div className="support-option">
                <h3>📧 Email Support</h3>
                <p>Get help via email</p>
                <a href="mailto:support@try-local.com" className="btn btn-primary">
                  Email Us
                </a>
              </div>
              <div className="support-option">
                <h3>📝 Contact Form</h3>
                <p>Send us a detailed message</p>
                <a href="/contact" className="btn btn-outline">
                  Contact Form
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
