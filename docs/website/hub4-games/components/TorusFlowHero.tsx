'use client';

import { useState, useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/usePlatformDetection';

export function TorusFlowHero() {
  const [isMobile, setIsMobile] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    setIsHydrated(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile hourglass with progress animation
  if (isMobile && isHydrated) {
    return (
      <section className="torus-hero torus-hero-mobile">
        <div className="hourglass-container">
          {/* Hourglass Icon */}
          <div className="hourglass">
            <div className="hourglass-top">
              <div className={`sand-fill ${isOnline ? 'sand-flowing' : ''}`}></div>
            </div>
            <div className="hourglass-neck">
              <div className="sand-stream"></div>
            </div>
            <div className="hourglass-bottom">
              <div className={`sand-accumulated ${isOnline ? 'sand-accumulating' : ''}`}></div>
            </div>
          </div>
          
          {/* Status indicator */}
          <div className="flow-status">
            <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
            <span className="status-text">{isOnline ? 'Connected' : 'Offline'}</span>
          </div>
        </div>
        
        <div className="hero-content">
          <h1>Games Hub</h1>
          <p>Seamless flow between offline strategy and live competition</p>
          
          {/* Mobile progress bar for download awareness */}
          <div className="mobile-progress-container">
            <div className="progress-labels">
              <span>Offline</span>
              <span>Live</span>
            </div>
            <div className="progress-bar-bg">
              <div className={`progress-bar-fill ${isOnline ? 'progress-live' : ''}`}></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="torus-hero">
      <div className="flow-container">
        {/* Offline side */}
        <div className="flow-side offline">
          <h2>Offline</h2>
          <p>Simulation & Strategy</p>
          <div className="torus-ring top"></div>
        </div>
        
        {/* Flow indicator */}
        <div className="flow-center">
          <div className="flow-particles">
            <span className="particle"></span>
            <span className="particle"></span>
            <span className="particle"></span>
          </div>
          <span className="flow-label">Data Bridge</span>
        </div>
        
        {/* Online side */}
        <div className="flow-side online">
          <h2>Online</h2>
          <p>NJZ ¿!? Live Platform</p>
          <div className="torus-ring bottom"></div>
        </div>
      </div>
      
      <div className="hero-content">
        <h1>Games Hub</h1>
        <p>Seamless flow between offline strategy and live competition</p>
      </div>
    </section>
  );
}
