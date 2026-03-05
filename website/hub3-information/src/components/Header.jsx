import { useState, useEffect } from 'react';

function Header({ onSearchClick }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`hub-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        <div className="logo-section">
          <a href="/" className="logo">
            <span className="logo-icon" aria-hidden="true">◈</span>
            <span className="logo-text">NJZ<span className="logo-accent">Information</span></span>
          </a>
          <span className="hub-badge">Hub 3</span>
        </div>

        <nav className="header-nav" aria-label="Main navigation">
          <a href="#grid" className="nav-link">Directory</a>
          <a href="#search" className="nav-link">Search</a>
          <a href="#membership" className="nav-link">Membership</a>
          <a href="#compression" className="nav-link">Downloads</a>
        </nav>

        <div className="header-actions">
          {/* Mobile Search Trigger */}
          <button 
            className="mobile-search-trigger"
            onClick={onSearchClick}
            aria-label="Open search (Cmd+K)"
            title="Search (Cmd+K)"
          >
            🔍
          </button>
          
          <button className="btn btn-ghost">Sign In</button>
          <button className="btn btn-primary">Get Started</button>
        </div>
      </div>
    </header>
  );
}

export default Header;