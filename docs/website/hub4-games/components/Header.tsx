'use client';

import Link from 'next/link';

export function Header() {
  return (
    <header className="games-header">
      <div className="header-left">
        <Link href="/" className="logo">
          <span className="logo-njz">NJZ</span>
          <span className="logo-symbol">¿!?</span>
        </Link>
      </div>
      
      <nav className="header-nav">
        <Link href="#download" className="nav-link">Download</Link>
        <Link href="#knowledge" className="nav-link">Knowledge Base</Link>
        <Link href="#live" className="nav-link nav-live">Live Platform</Link>
      </nav>
      
      <div className="header-right">
        <div className="hub-switcher">
          <span className="hub-label">Hub 4</span>
          <span className="hub-separator">|</span>
          <span className="hub-name">Games</span>
        </div>
      </div>
    </header>
  );
}
