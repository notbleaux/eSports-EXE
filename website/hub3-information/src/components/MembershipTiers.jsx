import { useState } from 'react';

function MembershipTiers() {
  const [hoveredTier, setHoveredTier] = useState(null);

  return (
    <section id="membership" className="membership-section">
      <div className="section-header">
        <h2 className="section-title">Choose Your Tier</h2>
        <p className="section-subtitle">Unlock the full potential of NJZ Information Hub</p>
      </div>
      
      <div className="tier-comparison">
        
        <div 
          className={`tier-card nvr-die ${hoveredTier === 'nvr-die' ? 'hovered' : ''}`}
          onMouseEnter={() => setHoveredTier('nvr-die')}
          onMouseLeave={() => setHoveredTier(null)}
        >
          <div className="tier-header">
            <h3>Nvr Die</h3>
            <p className="tier-price">Free</p>
          </div>
          <div className="resonance-visualization level-1">
            <div className="sphere"></div>
            <div className="resonance-label">Level 1 Resonance</div>
          </div>
          <ul className="tier-features">
            <li className="feature-included">
              <span className="feature-check">✓</span>
              <span>Directory browsing</span>
            </li>
            <li className="feature-included">
              <span className="feature-check">✓</span>
              <span>24h delayed statistics</span>
            </li>
            <li className="feature-included">
              <span className="feature-check">✓</span>
              <span>Standard search</span>
            </li>
            <li className="feature-included">
              <span className="feature-check">✓</span>
              <span>Compressed downloads</span>
            </li>
            <li className="feature-excluded">
              <span className="feature-x">✗</span>
              <span>Real-time data</span>
            </li>
            <li className="feature-excluded">
              <span className="feature-x">✗</span>
              <span>Predictive tools</span>
            </li>
          </ul>
          <button className="btn btn-outline">Start Free</button>
        </div>
        
        <div className="tier-divider">
          <div className="growth-arrow">→</div>
          <div className="growth-label">Upgrade</div>
        </div>
        
        <div 
          className={`tier-card njz-4eva ${hoveredTier === 'njz-4eva' ? 'hovered' : ''}`}
          onMouseEnter={() => setHoveredTier('njz-4eva')}
          onMouseLeave={() => setHoveredTier(null)}
        >
          <div className="tier-badge">Recommended</div>
          <div className="tier-header">
            <h3>NJZ 4eva</h3>
            <p className="tier-price">$29<span>/month</span></p>
          </div>
          <div className="resonance-visualization level-5">
            <div className="sphere core"></div>
            <div className="sphere ring-1"></div>
            <div className="sphere ring-2"></div>
            <div className="sphere ring-3"></div>
            <div className="sphere ring-4"></div>
            <div className="resonance-label">Level 5 Resonance</div>
          </div>
          <ul className="tier-features">
            <li className="feature-included">
              <span className="feature-check">✓</span>
              <span>Everything in Nvr Die</span>
            </li>
            <li className="feature-included">
              <span className="feature-check">✓</span>
              <span>Real-time RAWS streams</span>
            </li>
            <li className="feature-included">
              <span className="feature-check">✓</span>
              <span>Advanced ROTAS layers</span>
            </li>
            <li className="feature-included">
              <span className="feature-check">✓</span>
              <span>Predictive analytics</span>
            </li>
            <li className="feature-included">
              <span className="feature-check">✓</span>
              <span>Early patch access</span>
            </li>
            <li className="feature-included">
              <span className="feature-check">✓</span>
              <span>Priority support</span>
            </li>
          </ul>
          <button className="btn btn-primary">Upgrade Now</button>
        </div>
        
      </div>
    </section>
  );
}

export default MembershipTiers;