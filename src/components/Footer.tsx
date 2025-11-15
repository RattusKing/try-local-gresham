import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <strong>Try Local — Gresham</strong>
          <br />
          <small>Built for the community.</small>
        </div>
        <div className="footer-links">
          <Link href="/terms" aria-label="Terms">
            Terms
          </Link>
          <Link href="/privacy" aria-label="Privacy">
            Privacy
          </Link>
          <Link href="/refund-policy" aria-label="Refund Policy">
            Refund Policy
          </Link>
          <Link href="/contact" aria-label="Contact">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  )
}
