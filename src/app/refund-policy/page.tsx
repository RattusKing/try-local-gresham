'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function RefundPolicyPage() {
  return (
    <>
      <Header onSignIn={() => {}} />
      <main className="container" style={{ padding: '40px 20px', maxWidth: '800px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>Refund & Return Policy</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>1. Overview</h2>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            Try Local Gresham is a marketplace platform connecting customers with local businesses.
            Because each transaction is between you and the individual business, refund and return
            policies are set by each business independently.
          </p>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            This policy outlines how Try Local Gresham facilitates refunds and returns, and what
            policies apply to platform fees and business subscriptions.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>2. Product & Service Refunds</h2>
          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Business-Specific Policies</h3>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            Each business on Try Local Gresham sets its own refund and return policy for products
            and services. Before making a purchase, please:
          </p>
          <ul style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>Review the business's specific refund policy on their profile page</li>
            <li>Contact the business directly with questions about returns</li>
            <li>Keep your order confirmation and receipts</li>
            <li>Understand that policies vary by business and product type</li>
          </ul>

          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Requesting a Refund</h3>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            To request a refund for a product or service:
          </p>
          <ol style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>Contact the business directly through the order details page</li>
            <li>Provide your order number and reason for the refund request</li>
            <li>Follow the business's specific return process</li>
            <li>If unresolved, contact Try Local Gresham support for assistance</li>
          </ol>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>3. Platform Fee Refunds</h2>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            The 2% platform fee charged on transactions is refunded when:
          </p>
          <ul style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li><strong>Full Order Refund:</strong> If a business issues a full refund, the platform fee is also refunded</li>
            <li><strong>Partial Refund:</strong> The platform fee is refunded proportionally to the refunded amount</li>
            <li><strong>Cancellation Before Fulfillment:</strong> Full refund including platform fee</li>
          </ul>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            Platform fees are <strong>not refunded</strong> when:
          </p>
          <ul style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>The order was completed successfully</li>
            <li>The customer changed their mind after service completion</li>
            <li>The refund is due to customer preference rather than business error</li>
          </ul>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>4. Business Subscription Refunds</h2>
          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Monthly Subscriptions</h3>
          <ul style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>No refunds for partial months</li>
            <li>Cancel anytime; service continues until end of billing period</li>
            <li>No automatic renewals if cancelled before next billing date</li>
          </ul>

          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Annual Subscriptions</h3>
          <ul style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>Full refund within 14 days of initial purchase if no orders received</li>
            <li>Prorated refunds after 14 days at our discretion</li>
            <li>No refunds after 6 months of service</li>
          </ul>

          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Exceptions</h3>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            We may provide refunds outside these policies in cases of:
          </p>
          <ul style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>Platform technical issues preventing service use</li>
            <li>Billing errors or duplicate charges</li>
            <li>Service outages exceeding 48 consecutive hours</li>
            <li>Account termination due to our error</li>
          </ul>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>5. Refund Processing</h2>
          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Timeline</h3>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            Once a refund is approved:
          </p>
          <ul style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>Platform fees are refunded within 3-5 business days</li>
            <li>Payment processor (Stripe) may take 5-10 business days</li>
            <li>Your bank may require additional time to post the credit</li>
            <li>Total refund time typically ranges from 7-14 business days</li>
          </ul>

          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Refund Method</h3>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            Refunds are issued to the original payment method used for the purchase. We cannot
            process refunds to different payment methods or accounts.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>6. Dispute Resolution</h2>
          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Mediation Process</h3>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            If you have a dispute with a business regarding a refund:
          </p>
          <ol style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>Contact the business directly to resolve the issue</li>
            <li>If unresolved after 48 hours, email support@trylocalor.com</li>
            <li>Provide order details, communication history, and desired resolution</li>
            <li>Our team will review and mediate between you and the business</li>
            <li>We aim to resolve disputes within 5-7 business days</li>
          </ol>

          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Chargebacks</h3>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            Before filing a chargeback with your bank, please contact us first. Chargebacks can
            harm local businesses and incur fees. We're committed to fair resolution and will work
            with you to address legitimate concerns.
          </p>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            Accounts with excessive or fraudulent chargebacks may be suspended or terminated.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>7. Non-Refundable Items & Services</h2>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            Some items and services are typically non-refundable, including:
          </p>
          <ul style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>Perishable goods (food, flowers)</li>
            <li>Custom or personalized items</li>
            <li>Digital products or downloads</li>
            <li>Services already rendered</li>
            <li>Gift cards or store credit</li>
            <li>Clearance or final sale items (as marked)</li>
          </ul>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            Always check the business's policy before purchasing these items.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>8. Order Cancellations</h2>
          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Customer-Initiated Cancellations</h3>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            You may cancel an order if:
          </p>
          <ul style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>The order has not been confirmed by the business</li>
            <li>The business has not begun preparation or fulfillment</li>
            <li>You contact the business within their specified cancellation window</li>
          </ul>

          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Business-Initiated Cancellations</h3>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            If a business cancels your order, you will receive:
          </p>
          <ul style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>Full refund including platform fees</li>
            <li>Email notification with reason for cancellation</li>
            <li>Refund processed within 3-5 business days</li>
          </ul>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>9. Damaged or Defective Items</h2>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            If you receive damaged or defective items:
          </p>
          <ol style={{ lineHeight: '1.8', marginBottom: '15px', marginLeft: '20px' }}>
            <li>Document the issue with photos immediately upon receipt</li>
            <li>Contact the business within 48 hours</li>
            <li>Do not use or consume damaged items</li>
            <li>Follow the business's specific return process</li>
            <li>Most businesses will offer replacement or full refund</li>
          </ol>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>10. Contact Information</h2>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            For questions about refunds, returns, or to request assistance with a dispute:
          </p>
          <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
            <strong>Email:</strong> support@trylocalor.com
            <br />
            <strong>Business Hours:</strong> Monday-Friday, 9am-5pm PST
            <br />
            <strong>Response Time:</strong> Within 1-2 business days
          </p>
          <p style={{ lineHeight: '1.8' }}>
            Please include your order number, business name, and detailed description of your
            issue for faster resolution.
          </p>
        </section>
      </main>
      <Footer />
    </>
  )
}
