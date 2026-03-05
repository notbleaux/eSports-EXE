/**
 * InformationHub.jsx
 * Main page with NJZ Grid navigation
 * Hub 3 - 'The Directory'
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import RadialMenu from './RadialMenu';
import ConicalDirectory from './ConicalDirectory';
import RadiatingSearch from './RadiatingSearch';
import TierComparison from './TierComparison';
import AISuggestions from './AISuggestions';
import { useScrollPosition, useIntersectionObserver, useAnimatedCounter } from '../hooks';
import { GAME_CATEGORIES, getTotalTeams } from '../data/categories';
import { TEAMS_DATA } from '../data/teams';
import '../styles/information-hub.css';

// NJZ Grid Navigation Component
const NJZGridNav = ({ activeSection, onNavigate }) => {
  const gridItems = [
    { id: 'explore', label: 'Explore', icon: '🎯', section: 'radial' },
    { id: 'directory', label: 'Directory', icon: '📁', section: 'directory' },
    { id: 'search', label: 'Search', icon: '🔍', section: 'search' },
    { id: 'compare', label: 'Compare', icon: '⚖️', section: 'tiers' },
    { id: 'ai', label: 'AI Guide', icon: '✨', section: 'ai' },
  ];
  
  return (
    <nav className="njz-grid-nav">
      <div className="grid-nav-inner">
        {gridItems.map((item) => (
          <button
            key={item.id}
            className={`grid-nav-item ${activeSection === item.section ? 'active' : ''}`}
            onClick={() => onNavigate(item.section)}
          >
            <span className="grid-nav-icon">{item.icon}</span>
            <span className="grid-nav-label">{item.label}</span>
            {activeSection === item.section && (
              <span className="grid-nav-indicator" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

// Header Component
const Header = ({ onSearchClick }) => {
  const scrollPos = useScrollPosition();
  const isScrolled = scrollPos.y > 50;
  
  return (
    <header className={`info-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="info-header-inner">
        <a href="#" className="info-logo">
          <div className="info-logo-mark">N</div>
          <span className="info-logo-text">NJZ <span>Directory</span></span>
        </a>
        
        <nav className="header-nav">
          <a href="#explore" className="header-nav-link">Explore</a>
          <a href="#directory" className="header-nav-link">Teams</a>
          <a href="#tiers" className="header-nav-link">Tiers</a>
          <a href="#ai" className="header-nav-link">AI</a>
        </nav>
        
        <div className="info-header-actions">
          <button className="info-search-btn" onClick={onSearchClick}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
          <button className="info-user-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

// Hero Section Component
const HeroSection = ({ onCategorySelect, onScrollToSection }) => {
  const [ref, isInView] = useIntersectionObserver({ threshold: 0.2 });
  const totalTeamsCounter = useAnimatedCounter(TEAMS_DATA.total, 2000);
  const categoriesCounter = useAnimatedCounter(GAME_CATEGORIES.length, 1500);
  const regionsCounter = useAnimatedCounter(TEAMS_DATA.regions.length, 1000);
  
  useEffect(() => {
    if (isInView) {
      totalTeamsCounter.startAnimation();
      categoriesCounter.startAnimation();
      regionsCounter.startAnimation();
    }
  }, [isInView]);
  
  return (
    <section ref={ref} id="explore" className={`info-hero ${isInView ? 'in-view' : ''}`}>
      {/* Background effects */}
      <div className="info-hero-bg">
        <div className="void-grid" />
        <div className="void-glow" />
        <div className="orbital-rings">
          <div className="ring ring-1" />
          <div className="ring ring-2" />
          <div className="ring ring-3" />
        </div>
      </div>
      
      <div className="info-hero-content">
        <p className="hero-eyebrow">The Esports Universe</p>
        <h1 className="info-hero-title">
          Discover <span className="highlight">2,135</span> Teams
        </h1>
        <p className="info-hero-subtitle">
          Navigate the complete esports ecosystem through our zodiacal directory. 
          From emerging talent to world champions.
        </p>
        
        {/* Stats */}
        <div className="info-stats">
          <div className="info-stat">
            <span className="info-stat-value">{totalTeamsCounter.count.toLocaleString()}</span>
            <span className="info-stat-label">Active Teams</span>
          </div>
          <div className="info-stat">
            <span className="info-stat-value">{categoriesCounter.count}</span>
            <span className="info-stat-label">Categories</span>
          </div>
          <div className="info-stat">
            <span className="info-stat-value">{regionsCounter.count}</span>
            <span className="info-stat-label">Regions</span>
          </div>
        </div>
        
        {/* CTA Buttons */}
        <div className="hero-cta">
          <button 
            className="cta-primary"
            onClick={() => onScrollToSection('directory')}
          >
            Explore Directory
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
          <button 
            className="cta-secondary"
            onClick={() => onScrollToSection('tiers')}
          >
            Compare Tiers
          </button>
        </div>
      </div>
      
      {/* Radial Menu */}
      <div className="radial-menu-section">
        <div className="radial-menu-container-wrapper">
          <div className="radial-menu-center">
            <span className="radial-menu-center-text">BROWSE</span>
            <span className="radial-menu-center-value">12</span>
          </div>
          <RadialMenu onCategorySelect={onCategorySelect} />
        </div>
      </div>
    </section>
  );
};

// Directory Section
const DirectorySection = () => {
  const [ref, isInView] = useIntersectionObserver({ threshold: 0.1 });
  
  return (
    <section ref={ref} id="directory" className={`info-section directory-section ${isInView ? 'in-view' : ''}`}>
      <div className="info-section-header">
        <span className="info-section-label">The Conical Directory</span>
        <h2 className="info-section-title">Explore All Teams</h2>
        <p className="info-section-desc">
          Navigate through our 3D conical visualization of {TEAMS_DATA.total.toLocaleString()} teams. 
          Zoom, rotate, and drill down to find your next favorite team.
        </p>
      </div>
      
      <ConicalDirectory />
    </section>
  );
};

// Search Section
const SearchSection = () => {
  const [ref, isInView] = useIntersectionObserver({ threshold: 0.1 });
  const [selectedResult, setSelectedResult] = useState(null);
  
  const handleResultSelect = useCallback((result) => {
    setSelectedResult(result);
    console.log('Selected:', result);
  }, []);
  
  return (
    <section ref={ref} id="search" className={`info-section search-section ${isInView ? 'in-view' : ''}`}>
      <div className="info-section-header">
        <span className="info-section-label">Radiating Search</span>
        <h2 className="info-section-title">Find What You Need</h2>
        <p className="info-section-desc">
          Our AI-powered search radiates results across 8 vectors. 
          Discover teams, games, and categories in a whole new way.
        </p>
      </div>
      
      <div className="search-container">
        <RadiatingSearch 
          onResultSelect={handleResultSelect}
          placeholder="Search teams, games, categories..."
        />
      </div>
    </section>
  );
};

// Tiers Section
const TiersSection = () => {
  const [ref, isInView] = useIntersectionObserver({ threshold: 0.1 });
  
  return (
    <section ref={ref} id="tiers" className={`info-section tier-section ${isInView ? 'in-view' : ''}`}>
      <div className="info-section-header">
        <span className="info-section-label">Tier Comparison</span>
        <h2 className="info-section-title">Choose Your Path</h2>
        <p className="info-section-desc">
          Compare NJZ 4eva and Nvr Die tiers. 
          Find the perfect fit for your organization's esports journey.
        </p>
      </div>
      
      <TierComparison />
    </section>
  );
};

// AI Suggestions Section
const AISection = () => {
  const [ref, isInView] = useIntersectionObserver({ threshold: 0.1 });
  
  const handleSuggestionAction = useCallback((suggestion, role) => {
    console.log('Action:', suggestion.action, 'for role:', role);
  }, []);
  
  return (
    <section ref={ref} id="ai" className={`info-section ai-section ${isInView ? 'in-view' : ''}`}>
      <div className="info-section-header">
        <span className="info-section-label">AI Assistant</span>
        <h2 className="info-section-title">Personalized Guidance</h2>
        <p className="info-section-desc">
          Get AI-powered recommendations tailored to your role. 
          Whether you're a player, coach, or organizer.
        </p>
      </div>
      
      <AISuggestions 
        onSuggestionAction={handleSuggestionAction}
        showRoleSelector={true}
      />
    </section>
  );
};

// Footer Component
const Footer = () => (
  <footer className="info-footer">
    <div className="info-footer-inner">
      <div className="info-footer-grid">
        <div className="info-footer-brand">
          <div className="info-footer-logo">NJZ <span>Directory</span></div>
          <p className="info-footer-tagline">
            The complete esports ecosystem directory. 
            Connecting teams, players, and opportunities worldwide.
          </p>
        </div>
        
        <div className="info-footer-column">
          <h4>Platform</h4>
          <ul className="info-footer-links">
            <li><a href="#explore">Explore</a></li>
            <li><a href="#directory">Directory</a></li>
            <li><a href="#search">Search</a></li>
            <li><a href="#tiers">Pricing</a></li>
          </ul>
        </div>
        
        <div className="info-footer-column">
          <h4>Resources</h4>
          <ul className="info-footer-links">
            <li><a href="#">Documentation</a></li>
            <li><a href="#">API</a></li>
            <li><a href="#">Support</a></li>
            <li><a href="#">Status</a></li>
          </ul>
        </div>
        
        <div className="info-footer-column">
          <h4>Company</h4>
          <ul className="info-footer-links">
            <li><a href="#">About</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Press</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
      </div>
      
      <div className="info-footer-bottom">
        <p className="info-footer-copyright">© 2025 NJZ Platform. All rights reserved.</p>
        <div className="info-footer-social">
          <a href="#" aria-label="Twitter">𝕏</a>
          <a href="#" aria-label="Discord">💬</a>
          <a href="#" aria-label="YouTube">▶️</a>
        </div>
      </div>
    </div>
  </footer>
);

// Main Information Hub Component
const InformationHub = () => {
  const [activeSection, setActiveSection] = useState('radial');
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const handleCategorySelect = useCallback((category) => {
    setSelectedCategory(category);
    console.log('Selected category:', category);
  }, []);
  
  const handleNavigate = useCallback((section) => {
    setActiveSection(section);
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);
  
  const scrollToSection = useCallback((sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);
  
  // Update active section based on scroll
  useEffect(() => {
    const sections = ['explore', 'directory', 'search', 'tiers', 'ai'];
    
    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight / 3;
      
      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPos >= offsetTop && scrollPos < offsetTop + offsetHeight) {
            setActiveSection(sectionId === 'explore' ? 'radial' : 
                           sectionId === 'directory' ? 'directory' :
                           sectionId === 'search' ? 'search' :
                           sectionId === 'tiers' ? 'tiers' : 'ai');
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <div className="info-hub">
      <Header onSearchClick={() => scrollToSection('search')} />
      
      <NJZGridNav 
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />
      
      <main className="info-main">
        <HeroSection 
          onCategorySelect={handleCategorySelect}
          onScrollToSection={scrollToSection}
        />
        
        <DirectorySection />
        
        <SearchSection />
        
        <TiersSection />
        
        <AISection />
      </main>
      
      <Footer />
      
      {/* Category detail modal */}
      {selectedCategory && (
        <div className="category-modal-overlay" onClick={() => setSelectedCategory(null)}>
          <div className="category-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedCategory(null)}>×</button>
            <div className="modal-header" style={{ '--category-color': selectedCategory.color }}>
              <span className="modal-icon">{selectedCategory.icon}</span>
              <h3>{selectedCategory.fullName}</h3>
              <p>{selectedCategory.description}</p>
            </div>
            <div className="modal-content">
              <div className="modal-stats">
                <div className="modal-stat">
                  <span className="stat-value">{selectedCategory.totalTeams.toLocaleString()}</span>
                  <span className="stat-label">Teams</span>
                </div>
                <div className="modal-stat">
                  <span className="stat-value">{selectedCategory.subCategories.length}</span>
                  <span className="stat-label">Sub-categories</span>
                </div>
              </div>
              <h4>Trending</h4>
              <div className="modal-trending">
                {selectedCategory.trending.map((trend, idx) => (
                  <span key={idx} className="trend-tag">{trend}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InformationHub;
