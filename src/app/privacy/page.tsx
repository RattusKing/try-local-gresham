'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function PrivacyPage() {
  return (
    <>
      <Header onSignIn={() => {}} />
      <main className="container" style={{ padding: '40px 20px', maxWidth: '800px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>Privacy Policy</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>1. Introduction</h2>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            Welcome to Try Local Gresham ("we," "our," or "us"). We are committed to protecting your
            personal information and your right to privacy. This Privacy Policy explains how we
            collect, use, and share information when you use our platform.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>2. Information We Collect</h2>
          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Personal Information</h3>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            We collect information that you provide directly to us, including:
          </p>
          <ul style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>Name and contact information (email, phone number)</li>
            <li>Account credentials (username, password)</li>
            <li>Business information (for business owners)</li>
            <li>Payment information (processed securely through Stripe)</li>
            <li>Order and transaction history</li>
          </ul>

          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Usage Information</h3>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            We automatically collect certain information about your device and how you interact with
            our platform:
          </p>
          <ul style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>Device information (browser type, operating system)</li>
            <li>IP address and location data</li>
            <li>Pages visited and features used</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>3. How We Use Your Information</h2>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>We use your information to:</p>
          <ul style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send you technical notices, updates, and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Send marketing communications (with your consent)</li>
            <li>Monitor and analyze trends, usage, and activities</li>
            <li>Detect, prevent, and address fraud and security issues</li>
          </ul>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>4. Information Sharing</h2>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            We do not sell your personal information. We may share your information with:
          </p>
          <ul style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>
              <strong>Service Providers:</strong> Third-party vendors who perform services on our
              behalf (payment processing, analytics, email delivery)
            </li>
            <li>
              <strong>Business Partners:</strong> Local businesses you interact with through our
              platform
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law or to protect our rights
            </li>
            <li>
              <strong>Business Transfers:</strong> In connection with a merger, sale, or acquisition
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>5. Data Security</h2>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            We implement appropriate technical and organizational measures to protect your personal
            information. However, no method of transmission over the internet is 100% secure, and we
            cannot guarantee absolute security.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>6. Your Rights</h2>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>You have the right to:</p>
          <ul style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>Access and receive a copy of your personal information</li>
            <li>Correct inaccurate or incomplete information</li>
            <li>Request deletion of your personal information</li>
            <li>Object to or restrict certain processing</li>
            <li>Withdraw consent at any time</li>
            <li>Lodge a complaint with a supervisory authority</li>
          </ul>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>7. Cookies</h2>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            We use cookies and similar tracking technologies to collect and track information. You
            can control cookies through your browser settings, but disabling cookies may affect the
            functionality of our platform.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>8. Children's Privacy</h2>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            Our platform is not intended for children under 13. We do not knowingly collect personal
            information from children under 13. If you are a parent and believe your child has
            provided us with personal information, please contact us.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>9. Changes to This Policy</h2>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            We may update this Privacy Policy from time to time. We will notify you of any changes
            by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>10. Contact Us</h2>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p style={{ lineHeight: '1.8' }}>
            <strong>Email:</strong> privacy@trylocalor.com
            <br />
            <strong>Address:</strong> Gresham, Oregon
          </p>
        </section>
      </main>
      <Footer />
    </>
  )
}
