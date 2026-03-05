'use client';

import { useState, useEffect } from 'react';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: '⚡',
    title: 'Real-time Matches',
    description: 'Compete live with players worldwide with sub-second latency'
  },
  {
    icon: '🏆',
    title: 'Ranked Tournaments',
    description: 'Weekly tournaments with exclusive rewards and rankings'
  },
  {
    icon: '🌐',
    title: 'Global Leaderboards',
    description: 'Track your progress against the best managers globally'
  }
];

export function LivePlatformCTA() {
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Trigger animation on mount
    setTimeout(() => setIsVisible(true), 100);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <section 
      className={`live-cta-section ${isVisible ? 'visible' : ''}`}
      id="live"
    >
      {/* Enhanced pulsing glow effects */}
      <div className="live-glow"></div>
      <div className="live-glow-pulse"></div>
      <div className="live-glow-ring"></div>
      
      {/* Animated particles */}
      <div className="live-particles">
        {[...Array(6)].map((_, i) => (
          <span 
            key={i} 
            className="particle"
            style={{ 
              '--delay': `${i * 0.5}s`,
              '--x': `${20 + i * 15}%`,
              '--y': `${30 + (i % 3) * 20}%`
            } as React.CSSProperties}
          />
        ))}
      </div>
      
      <div className="live-content">
        <span className="live-badge">
          <span className="pulse-dot"></span>
          LIVE
        </span>
        
        <h2>NJZ ¿!? Live Platform</h2>
        <p>Compete in real-time tournaments. Connect your offline progress to the live ecosystem.</p>
        
        {/* Enhanced feature highlights */}
        <div className="live-features">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`feature ${hoveredFeature === index ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredFeature(index)}
              onMouseLeave={() => setHoveredFeature(null)}
              onClick={() => setHoveredFeature(hoveredFeature === index ? null : index)}
            >
              <span className="feature-icon">{feature.icon}</span>
              <div className="feature-content">
                <span className="feature-title">{feature.title}</span>
                <p className="feature-description">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <button className={`btn btn-live ${isMobile ? 'btn-full-width-mobile' : ''}`}>
          <span className="btn-text">Enter Live Platform</span>
          <span className="btn-arrow">→</span>
          <div className="btn-glow"></div>
        </button>
      </div>    </section>
  );
}
