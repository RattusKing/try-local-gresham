'use client'

export default function Header({ onSignIn }: { onSignIn: () => void }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            TL
          </div>
          <span className="brand-name">Try Local</span>
          <span className="brand-subtle">Gresham, OR</span>
        </div>
        <nav className="nav">
          <a href="#discover" className="nav-link">
            Discover
          </a>
          <a href="#categories" className="nav-link">
            Categories
          </a>
          <a href="#for-businesses" className="nav-link">
            For Businesses
          </a>
          <button onClick={onSignIn} className="btn btn-outline">
            Sign In
          </button>
        </nav>
      </div>
    </header>
  )
}
