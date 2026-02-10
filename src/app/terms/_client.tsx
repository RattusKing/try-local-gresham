'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { CONTACT_EMAILS } from '@/lib/site-config'

export default function TermsPage() {
  return (
    <>
      <Header onSignIn={() => {}} />
      <main className="container" style={{ padding: '40px 20px', maxWidth: '800px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>Terms of Service</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>1. Acceptance of Terms</h2>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            By accessing and using Try Local Gresham ("the Platform"), you accept and agree to be
            bound by these Terms of Service. If you do not agree to these terms, please do not use
            the Platform.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>2. Description of Service</h2>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            Try Local Gresham is a digital marketplace platform that connects local residents with
            local businesses and services in Gresham, Oregon. We provide a platform for:
          </p>
          <ul style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>Customers to discover and support local businesses</li>
            <li>Businesses to create profiles and list their products/services</li>
            <li>Facilitating transactions between customers and businesses</li>
            <li>Appointment scheduling and delivery coordination</li>
          </ul>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>3. User Accounts</h2>
          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Registration</h3>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            To access certain features, you must create an account. You agree to:
          </p>
          <ul style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain and update your information</li>
            <li>Keep your password secure and confidential</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Notify us immediately of any unauthorized use</li>
          </ul>

          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Account Types</h3>
          <ul style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li><strong>Customer Accounts:</strong> Free access to browse and purchase</li>
            <li><strong>Business Accounts:</strong> Subscription-based access to list products/services</li>
          </ul>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>4. Business Subscriptions</h2>
          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Subscription Plans</h3>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            Businesses may subscribe to our platform with the following terms:
          </p>
          <ul style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>Subscriptions are billed monthly or annually</li>
            <li>All fees are non-refundable except as required by law</li>
            <li>We reserve the right to change pricing with 30 days' notice</li>
            <li>Businesses must maintain active subscription for continued access</li>
          </ul>

          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Business Approval</h3>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            All business listings require administrative approval before going live. We reserve the
            right to reject or remove any business listing that violates these terms or our community
            standards.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>5. Transactions and Payments</h2>
          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Platform Fee</h3>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            Try Local Gresham charges a 2% platform fee on all transactions processed through the
            platform. This fee is in addition to payment processing fees charged by Stripe.
          </p>

          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Payment Processing</h3>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            All payments are processed securely through Stripe. By making a purchase, you agree to
            Stripe's Terms of Service. We do not store your payment card information.
          </p>

          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Refunds and Cancellations</h3>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            Refund and cancellation policies are set by individual businesses. Try Local Gresham is
            not responsible for disputes between customers and businesses, but we will facilitate
            communication and resolution when possible.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>6. User Conduct</h2>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>You agree NOT to:</p>
          <ul style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>Violate any laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Post false, misleading, or fraudulent content</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Attempt to gain unauthorized access to the Platform</li>
            <li>Use automated systems (bots, scrapers) without permission</li>
            <li>Interfere with the proper functioning of the Platform</li>
            <li>Engage in any form of spam or unsolicited marketing</li>
          </ul>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>7. Content and Intellectual Property</h2>
          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>User Content</h3>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            You retain ownership of content you post, but grant us a worldwide, non-exclusive,
            royalty-free license to use, display, and distribute your content on the Platform.
          </p>

          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Platform Content</h3>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            All Platform content, including design, logos, text, and graphics, is owned by Try Local
            Gresham and protected by copyright and trademark laws.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>8. Disclaimers</h2>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE:
          </p>
          <ul style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>Uninterrupted or error-free operation</li>
            <li>Accuracy or reliability of content</li>
            <li>Quality of products or services from businesses</li>
            <li>Results or outcomes from using the Platform</li>
          </ul>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>9. Limitation of Liability</h2>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, TRY LOCAL GRESHAM SHALL NOT BE LIABLE FOR:
          </p>
          <ul style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>Indirect, incidental, or consequential damages</li>
            <li>Loss of profits, data, or business opportunities</li>
            <li>Disputes between customers and businesses</li>
            <li>Third-party actions or content</li>
          </ul>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            Our total liability shall not exceed the fees you paid in the past 12 months or $100,
            whichever is greater.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>10. Termination</h2>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            We may suspend or terminate your account at any time for violations of these Terms. You
            may close your account at any time. Upon termination:
          </p>
          <ul style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>Your right to use the Platform ends immediately</li>
            <li>We may delete your account and content</li>
            <li>Provisions that should survive termination will remain in effect</li>
          </ul>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>11. Governing Law</h2>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            These Terms are governed by the laws of the State of Oregon, United States. Any disputes
            will be resolved in the courts of Multnomah County, Oregon.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>12. Changes to Terms</h2>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            We may modify these Terms at any time. We will notify you of material changes via email
            or Platform notification. Continued use of the Platform after changes constitutes
            acceptance of the new Terms.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>13. Contact Information</h2>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            Questions about these Terms? Contact us at:
          </p>
          <p style={{ lineHeight: '1.8' }}>
            <strong>Email:</strong> {CONTACT_EMAILS.legal}
            <br />
            <strong>Address:</strong> Gresham, Oregon
          </p>
        </section>
      </main>
      <Footer />
    </>
  )
}
