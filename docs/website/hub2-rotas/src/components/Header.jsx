import React, { useState, useEffect } from 'react';

function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (!e.target.closest('.hub-indicator')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
  }, [mobileMenuOpen]);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <>
      <header className={`hub-header-shared ${scrolled ? 'scrolled' : ''}`}>
        <div className="hub-header-inner">
          {/* Back Button */}
          <div className="header-back">
            <a href="../njz-central/index.html" className="back-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span className="back-text">NJZ Central</span>
            </a>
          </div>
          
          {/* Hub Indicator / Switcher */}
          <div className="hub-switcher">
            <div className="hub-indicator rotas" id="hubIndicator">
              <span className="hub-indicator-icon">◈</span>
              <span className="hub-indicator-name">ROTAS</span>
              <button 
                className={`hub-dropdown-toggle ${dropdownOpen ? 'active' : ''}`}
                onClick={toggleDropdown}
                aria-label="Switch hub"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              
              {/* Hub Dropdown Menu */}
              <div className={`hub-dropdown-menu ${dropdownOpen ? 'open' : ''}`} id="hubDropdownMenu">
                <a href="../hub1-sator/index.html" className="hub-option sator">
                  <span className="hub-option-icon">◎</span>
                  <div className="hub-option-info">
                    <span className="hub-option-name">SATOR</span>
                    <span className="hub-option-desc">Raw Data Archive</span>
                  </div>
                  <span className="hub-arrow">→</span>
                </a>
                <a href="index.html" className="hub-option rotas active">
                  <span className="hub-option-icon">◈</span>
                  <div className="hub-option-info">
                    <span className="hub-option-name">ROTAS</span>
                    <span className="hub-option-desc">Analytics Hub</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
          
          {/* Header Actions */}
          <div className="header-actions">
            <div className="header-status">
              <span className="status-pulse"></span>
              <span className="status-text">Active</span>
            </div>
            
            {/* Mobile Menu Toggle */}
            <button 
              className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div 
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'visible' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Menu Drawer */}
      <nav className={`mobile-menu-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-section">
          <h3 className="mobile-menu-title">Navigation</h3>
          <div className="mobile-menu-links">
            <a href="../njz-central/index.html" className="mobile-menu-link">
              <span className="mobile-menu-link-icon">⌂</span>
              <div className="mobile-menu-link-text">
                <span className="mobile-menu-link-name">NJZ Central</span>
                <span className="mobile-menu-link-desc">Command Center</span>
              </div>
              <span className="mobile-menu-link-arrow">→</span>
            </a>
          </div>
        </div>
        
        <div className="mobile-menu-section">
          <h3 className="mobile-menu-title">Hubs</h3>
          <div className="mobile-menu-links">
            <a href="../hub1-sator/index.html" className="mobile-menu-link sator">
              <span className="mobile-menu-link-icon">◎</span>
              <div className="mobile-menu-link-text">
                <span className="mobile-menu-link-name">SATOR</span>
                <span className="mobile-menu-link-desc">Statistical Database</span>
              </div>
              <span className="mobile-menu-link-arrow">→</span>
            </a>
            <a href="index.html" className="mobile-menu-link rotas">
              <span className="mobile-menu-link-icon">◈</span>
              <div className="mobile-menu-link-text">
                <span className="mobile-menu-link-name">ROTAS</span>
                <span className="mobile-menu-link-desc">Analytics Hub</span>
              </div>
              <span className="mobile-menu-link-arrow">→</span>
            </a>
          </div>
        </div>
        
        {/* Twin-File Bridge in Mobile Menu */}
        <div className="mobile-menu-section">
          <h3 className="mobile-menu-title">Data Bridge</h3>
          <div className="hub-bridge">
            <div className="hub-bridge-node sator">
              <span className="hub-bridge-icon">◎</span>
              <span className="hub-bridge-label">RAWS</span>
              <span className="hub-bridge-desc">Raw Data</span>
            </div>
            <div className="hub-bridge-connector">
              <div className="bridge-line"></div>
              <div className="data-flow"></div>
              <span className="bridge-status">Synced</span>
            </div>
            <div className="hub-bridge-node rotas">
              <span className="hub-bridge-icon">◈</span>
              <span className="hub-bridge-label">BASE</span>
              <span className="hub-bridge-desc">Analytics</span>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Header;