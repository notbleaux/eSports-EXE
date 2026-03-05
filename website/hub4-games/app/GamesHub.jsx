'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamic imports for heavy Three.js components
const ResonantMatchmaking = dynamic(
  () => import('@/components/ResonantMatchmaking').then(mod => mod.ResonantMatchmaking),
  { ssr: false, loading: () => <div className="loading-3d">Loading 3D Engine...</div> }
);

const TorusFlow = dynamic(
  () => import('@/components/TorusFlow').then(mod => mod.TorusFlow),
  { ssr: false, loading: () => <div className="loading-3d">Loading Torus Flow...</div> }
);

import { TripleModeSelector } from '@/components/TripleModeSelector';
import { GameDownloadPortal } from '@/components/GameDownloadPortal';
import { LivePlatformLobby } from '@/components/LivePlatformLobby';

// === NAVIGATION ===
function NexusNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`nexus-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-brand">
        <span className="brand-njz">NJZ</span>
        <span className="brand-symbol">¿!?</span>
        <span className="brand-divider">|</span>
        <span className="brand-hub">The Nexus</span>
      </div>
      
      <div className="nav-links">
        <a href="#download" className="nav-link">Download</a>
        <a href="#modes" className="nav-link">Modes</a>
        <a href="#live" className="nav-link live">
          <span className="live-dot" />
          Live
        </a>
        <a href="#matchmaking" className="nav-link">Matchmaking</a>
      </div>
      
      <div className="nav-hub-switcher">
        <span className="hub-indicator offline">
          <span className="indicator-dot" />
          Offline
        </span>
        <span className="hub-arrow">→</span>
        <span className="hub-indicator online">
          <span className="indicator-dot" />
          Live
        </span>
      </div>
    </nav>
  );
}

// === HERO SECTION ===
function HeroSection() {
  return (
    <section className="nexus-hero">
      <div className="hero-background">
        <div className="torus-vortex">
          <div className="vortex-ring ring-1" />
          <div className="vortex-ring ring-2" />
          <div className="vortex-ring ring-3" />
        </div>
        <div className="particle-field">
          {Array.from({ length: 50 }).map((_, i) => (
            <span 
              key={i}
              className="particle"
              style={{
                ['--x']: `${Math.random() * 100}%`,
                ['--y']: `${Math.random() * 100}%`,
                ['--delay']: `${Math.random() * 5}s`,
                ['--duration']: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
      </div>
      
      <div className="hero-content">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.37, 0, 0.63, 1] }}
        >
          <span className="title-nexus">The Nexus</span>
        </motion.h1>
        
        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.37, 0, 0.63, 1] }}
        >
          Where offline strategy meets live competition
        </motion.p>
        
        <motion.div
          className="hero-flow-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="flow-states">
            <div className="flow-state">
              <span className="state-icon">🎮</span>
              <span className="state-label">Download</span>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-state">
              <span className="state-icon">⚔️</span>
              <span className="state-label">Compete</span>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-state">
              <span className="state-icon">🏆</span>
              <span className="state-label">Conquer</span>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          className="hero-cta"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <a href="#download" className="cta-primary">
            <span>⬇ Download NJZ Manager</span>
          </a>
          <a href="#live" className="cta-secondary">
            <span>▶ Play Live Now</span>
          </a>
        </motion.div>
      </div>
      
      <div className="scroll-indicator">
        <span className="scroll-text">Explore The Nexus</span>
        <div className="scroll-arrow">↓</div>
      </div>
    </section>
  );
}

// === TOROIDAL TRANSITION ===
function ToroidalTransition({ children, id }) {
  return (
    <section id={id} className="nexus-section">
      <div className="section-transition top">
        <div className="vortex-line" />
      </div>
      
      <div className="section-content">
        {children}
      </div>
      
      <div className="section-transition bottom">
        <div className="vortex-line" />
      </div>
    </section>
  );
}

// === MAIN GAMES HUB ===
export default function GamesHub() {
  const [activeSection, setActiveSection] = useState('download');

  return (
    <div className="games-hub nexus-bg">
      <NexusNav />
      
      <HeroSection />
      
      {/* Download Portal Section */}
      <ToroidalTransition id="download">
        <div className="section-header">
          <span className="section-icon">⬇</span>
          <h2>Download Portal</h2>
          <p>Begin your journey with NJZ Manager</p>
        </div>
        
        <GameDownloadPortal 
          onDownloadStart={(item) => console.log('Downloading:', item.name)}
        />
      </ToroidalTransition>
      
      {/* Torus Flow Section */}
      <ToroidalTransition id="flow">
        <div className="section-header centered">
          <span className="section-icon">🌊</span>
          <h2>Torus Flow</h2>
          <p>Navigate between states of play</p>
        </div>
        
        <TorusFlow autoRotate={true} />
      </ToroidalTransition>
      
      {/* Mode Selector Section */}
      <ToroidalTransition id="modes">
        <TripleModeSelector 
          onModeChange={(mode) => console.log('Selected mode:', mode.name)}
        />
      </ToroidalTransition>
      
      {/* Live Platform Section */}
      <ToroidalTransition id="live">
        <div className="section-header">
          <span className="section-icon live">●</span>
          <h2>Live Platform</h2>
          <p>Join the active competition</p>
        </div>
        
        <LivePlatformLobby 
          onMatchJoin={(match) => console.log('Joining match:', match.id)}
        />
      </ToroidalTransition>
      
      {/* Matchmaking Section */}
      <ToroidalTransition id="matchmaking">
        <div className="section-header centered">
          <span className="section-icon">⚡</span>
          <h2>Resonant Matchmaking</h2>
          <p>Find your perfect match through harmonic resonance</p>
        </div>
        
        <ResonantMatchmaking 
          onMatchFound={() => console.log('Match found!')}
        />
      </ToroidalTransition>
      
      {/* Footer */}
      <footer className="nexus-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="brand-njz">NJZ</span>
            <span className="brand-symbol">¿!?</span>
          </div>
          
          <div className="footer-links">
            <a href="#">Documentation</a>
            <a href="#">Support</a>
            <a href="#">Community</a>
            <a href="#">Status</a>
          </div>
          
          <div className="footer-copyright">
            © 2024 NJZ ¿!? Platform. All realities reserved.
          </div>
        </div>
      </footer>
      
      <style jsx global>{`
        /* === NAVIGATION === */
        .nexus-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 40px;
          background: transparent;
          transition: all 0.3s ease;
        }
        
        .nexus-nav.scrolled {
          background: rgba(5, 5, 8, 0.9);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 240, 255, 0.1);
        }
        
        .nav-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-header);
          font-size: 1.25rem;
          font-weight: 700;
        }
        
        .brand-njz {
          color: var(--njz-porcelain);
        }
        
        .brand-symbol {
          color: #00f0ff;
        }
        
        .brand-divider {
          color: var(--njz-gray-600);
          margin: 0 4px;
        }
        
        .brand-hub {
          color: var(--njz-gray-500);
          font-size: 1rem;
          font-weight: 500;
        }
        
        .nav-links {
          display: flex;
          gap: 32px;
        }
        
        .nav-link {
          color: var(--njz-gray-400);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: color 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .nav-link:hover {
          color: var(--njz-porcelain);
        }
        
        .nav-link.live {
          color: #ef4444;
        }
        
        .live-dot {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          animation: livePulse 1.5s ease-in-out infinite;
        }
        
        @keyframes livePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }
        
        .nav-hub-switcher {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 20px;
          font-size: 0.75rem;
        }
        
        .hub-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .hub-indicator.offline {
          color: var(--njz-gray-500);
        }
        
        .hub-indicator.online {
          color: #00f0ff;
        }
        
        .indicator-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
        }
        
        .hub-arrow {
          color: var(--njz-gray-600);
        }
        
        /* === HERO SECTION === */
        .nexus-hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 120px 40px 80px;
          overflow: hidden;
        }
        
        .hero-background {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        
        .torus-vortex {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 800px;
          height: 800px;
        }
        
        .vortex-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border: 1px solid rgba(0, 240, 255, 0.1);
          border-radius: 50%;
          animation: vortexRotate 20s linear infinite;
        }
        
        .vortex-ring.ring-1 {
          width: 100%;
          height: 100%;
          animation-duration: 30s;
        }
        
        .vortex-ring.ring-2 {
          width: 70%;
          height: 70%;
          animation-duration: 20s;
          animation-direction: reverse;
        }
        
        .vortex-ring.ring-3 {
          width: 40%;
          height: 40%;
          animation-duration: 15s;
        }
        
        @keyframes vortexRotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        .particle-field {
          position: absolute;
          inset: 0;
        }
        
        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: rgba(0, 240, 255, 0.6);
          border-radius: 50%;
          left: var(--x);
          top: var(--y);
          animation: particleFloat var(--duration) ease-in-out infinite;
          animation-delay: var(--delay);
        }
        
        @keyframes particleFloat {
          0%, 100% { 
            opacity: 0;
            transform: translateY(0) scale(0);
          }
          50% { 
            opacity: 1;
            transform: translateY(-100px) scale(1);
          }
        }
        
        .hero-content {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 800px;
        }
        
        .hero-content h1 {
          font-family: var(--font-header);
          font-size: clamp(3rem, 10vw, 6rem);
          font-weight: 800;
          margin-bottom: 16px;
        }
        
        .title-nexus {
          background: linear-gradient(135deg, 
            #00f0ff 0%, 
            #8338ec 50%,
            #ff006e 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 80px rgba(0, 240, 255, 0.3);
        }
        
        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--njz-gray-400);
          margin-bottom: 40px;
        }
        
        .hero-flow-indicator {
          margin-bottom: 40px;
        }
        
        .flow-states {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
        }
        
        .flow-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 24px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          min-width: 100px;
        }
        
        .state-icon {
          font-size: 1.5rem;
        }
        
        .state-label {
          font-size: 0.75rem;
          color: var(--njz-gray-500);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        
        .flow-arrow {
          font-size: 1.5rem;
          color: #00f0ff;
          opacity: 0.5;
        }
        
        .hero-cta {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .cta-primary {
          padding: 16px 32px;
          background: linear-gradient(135deg, #00f0ff, #00c8ff);
          border-radius: 10px;
          color: var(--nexus-void);
          font-family: var(--font-header);
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        
        .cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 240, 255, 0.4);
        }
        
        .cta-secondary {
          padding: 16px 32px;
          background: transparent;
          border: 1px solid rgba(0, 240, 255, 0.4);
          border-radius: 10px;
          color: #00f0ff;
          font-family: var(--font-header);
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        
        .cta-secondary:hover {
          background: rgba(0, 240, 255, 0.1);
        }
        
        .scroll-indicator {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: var(--njz-gray-500);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        
        .scroll-arrow {
          animation: bounce 2s ease-in-out infinite;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(10px); }
        }
        
        /* === SECTIONS === */
        .nexus-section {
          position: relative;
          padding: 80px 40px;
        }
        
        .section-transition {
          position: absolute;
          left: 0;
          right: 0;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        .section-transition.top {
          top: 0;
        }
        
        .section-transition.bottom {
          bottom: 0;
        }
        
        .vortex-line {
          width: 200%;
          height: 1px;
          background: linear-gradient(90deg, 
            transparent 0%,
            rgba(0, 240, 255, 0.2) 20%,
            rgba(0, 240, 255, 0.4) 50%,
            rgba(0, 240, 255, 0.2) 80%,
            transparent 100%
          );
          animation: vortexFlow 3s ease-in-out infinite;
        }
        
        @keyframes vortexFlow {
          0%, 100% { transform: translateX(-25%); }
          50% { transform: translateX(25%); }
        }
        
        .section-content {
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .section-header {
          text-align: left;
          margin-bottom: 40px;
        }
        
        .section-header.centered {
          text-align: center;
        }
        
        .section-icon {
          font-size: 2rem;
          margin-bottom: 16px;
          display: block;
        }
        
        .section-icon.live {
          color: #ef4444;
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        .section-header h2 {
          font-family: var(--font-header);
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--njz-porcelain);
        }
        
        .section-header p {
          color: var(--njz-gray-500);
          font-size: 1rem;
        }
        
        /* === LOADING STATES === */
        .loading-3d {
          height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--njz-gray-500);
          font-size: 0.875rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 16px;
        }
        
        /* === FOOTER === */
        .nexus-footer {
          padding: 60px 40px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
        }
        
        .footer-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: var(--font-header);
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 24px;
        }
        
        .footer-links {
          display: flex;
          justify-content: center;
          gap: 32px;
          margin-bottom: 24px;
        }
        
        .footer-links a {
          color: var(--njz-gray-500);
          text-decoration: none;
          font-size: 0.875rem;
          transition: color 0.2s ease;
        }
        
        .footer-links a:hover {
          color: var(--njz-porcelain);
        }
        
        .footer-copyright {
          color: var(--njz-gray-600);
          font-size: 0.75rem;
        }
        
        /* === RESPONSIVE === */
        @media (max-width: 1024px) {
          .nexus-nav {
            padding: 16px 24px;
          }
          
          .nav-links {
            display: none;
          }
          
          .flow-states {
            flex-direction: column;
          }
          
          .flow-arrow {
            transform: rotate(90deg);
          }
          
          .nexus-section {
            padding: 60px 24px;
          }
        }
        
        @media (max-width: 640px) {
          .hero-cta {
            flex-direction: column;
            width: 100%;
          }
          
          .cta-primary,
          .cta-secondary {
            width: 100%;
            text-align: center;
          }
          
          .footer-links {
            flex-direction: column;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}
