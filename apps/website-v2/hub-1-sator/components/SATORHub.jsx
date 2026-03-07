import React, { useState, useCallback, useEffect } from 'react';
import OrbitalRingSystem from './components/OrbitalRingSystem';
import ParticleStarField from './components/ParticleStarField';
import LissajousComparator from './components/LissajousComparator';
import TerminalVerifier from './components/TerminalVerifier';
import MaterialityToggle from './components/MaterialityToggle';
import './SATORHub.css';

/**
 * SATOR Hub - The Observatory
 * Main integration page for the SATOR data visualization hub
 * 
 * Features:
 * - Abyssal depth aesthetic with signal-amber accents
 * - 5 concentric orbital rings with filtering
 * - Three.js particle star field background
 * - Lissajous harmonic comparator
 * - Terminal-style integrity verifier
 * - Materiality spectrum toggle
 * - Smoke-like transitions
 * - 60fps optimized animations
 */

const SATORHub = () => {
  const [activeFilter, setActiveFilter] = useState(null);
  const [materialityValue, setMaterialityValue] = useState(50);
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  // Initial loading sequence
  useEffect(() => {
    const loadTimer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => setShowContent(true), 100);
    }, 1500);

    return () => clearTimeout(loadTimer);
  }, []);

  const handleFilterChange = useCallback((filter) => {
    setActiveFilter(filter);
  }, []);

  const handleMaterialityChange = useCallback((value) => {
    setMaterialityValue(value);
  }, []);

  const handleVerification = useCallback((status) => {
    setVerificationStatus(status ? 'verified' : 'error');
  }, []);

  return (
    <div className="sator-hub sator-abyss sator-vignette">
      {/* Loading Screen */}
      {isLoading && (
        <div className="loading-screen">
          <div className="loading-content">
            <div className="loading-glyph">◈</div>
            <div className="loading-text">INITIALIZING SATOR</div>
            <div className="loading-bar">
              <div className="loading-progress" />
            </div>
          </div>
        </div>
      )}

      {/* Ambient Particles */}
      <div className="ambient-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="ambient-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className={`hub-content ${showContent ? 'visible' : ''}`}>
        {/* Header */}
        <header className="hub-header">
          <div className="header-left">
            <div className="header-glyph">◈</div>
            <div className="header-title">
              <h1>SATOR</h1>
              <span className="header-subtitle">THE OBSERVATORY</span>
            </div>
          </div>
          
          <div className="header-center">
            <nav className="hub-nav">
              <a href="#observatory" className="nav-link active">OBSERVATORY</a>
              <a href="#analytics" className="nav-link">ANALYTICS</a>
              <a href="#directory" className="nav-link">DIRECTORY</a>
              <a href="#platform" className="nav-link">PLATFORM</a>
            </nav>
          </div>
          
          <div className="header-right">
            <div className="status-indicator">
              <span className={`status-dot ${verificationStatus}`} />
              <span className="status-text">{verificationStatus.toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <main className="hub-main">
          {/* Left Panel - Orbital System */}
          <section className="panel orbital-panel">
            <div className="panel-header">
              <span className="panel-glyph">◎</span>
              <span className="panel-title">DATA ORBITS</span>
            </div>
            
            <div className="panel-content">
              <OrbitalRingSystem
                activeFilter={activeFilter}
                onFilterChange={handleFilterChange}
              />
            </div>
          </section>

          {/* Center Panel - Star Field */}
          <section className="panel star-panel">
            <div className="panel-header">
              <span className="panel-glyph">✦</span>
              <span className="panel-title">STAR FIELD</span>
            </div>
            
            <div className="panel-content">
              <ParticleStarField
                particleCount={1500}
                activeFilter={activeFilter}
              />
            </div>
          </section>

          {/* Right Column */}
          <aside className="right-column">
            {/* Comparator Panel */}
            <section className="panel comparator-panel">
              <div className="panel-content">
                <LissajousComparator
                  width={400}
                  height={280}
                  activeDatasets={activeFilter ? [activeFilter] : []}
                />
              </div>
            </section>

            {/* Terminal Panel */}
            <section className="panel terminal-panel">
              <div className="panel-content">
                <TerminalVerifier
                  dataset={activeFilter}
                  verificationStatus={verificationStatus}
                  onVerify={handleVerification}
                />
              </div>
            </section>

            {/* Materiality Toggle */}
            <section className="panel materiality-panel">
              <div className="panel-content">
                <MaterialityToggle
                  value={materialityValue}
                  onChange={handleMaterialityChange}
                />
              </div>
            </section>
          </aside>
        </main>

        {/* Footer */}
        <footer className="hub-footer">
          <div className="footer-left">
            <span className="footer-glyph">∿</span>
            <span className="footer-text">
              SATOR HUB v2.1.0 — OBSERVING {activeFilter?.toUpperCase() || 'ALL DATASETS'}
            </span>
          </div>
          
          <div className="footer-center">
            <div className="footer-stats">
              <span className="stat">
                <span className="stat-label">ENTITIES:</span>
                <span className="stat-value">14,214</span>
              </span>
              <span className="stat">
                <span className="stat-label">LAST SYNC:</span>
                <span className="stat-value">2m ago</span>
              </span>
            </div>
          </div>
          
          <div className="footer-right">
            <span className="footer-credit">NJZ ¿!? Platform</span>
          </div>
        </footer>
      </div>

      {/* Scan Lines Overlay */}
      <div className="scan-lines" />
    </div>
  );
};

export default SATORHub;
