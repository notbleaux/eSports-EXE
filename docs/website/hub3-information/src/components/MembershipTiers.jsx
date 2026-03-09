import { useState } from 'react';

// Reusable Tier Feature Item Component
function TierFeature({ included, children }) {
  return (
    <li className={included ? 'feature-included' : 'feature-excluded'}>
      <span className={included ? 'feature-check' : 'feature-x'} aria-hidden="true">
        {included ? '✓' : '✗'}
      </span>
      <span>{children}</span>
    </li>
  );
}

// Resonance Visualization Component
function ResonanceVisualization({ level }) {
  if (level === 1) {
    return (
      <div className="resonance-visualization level-1" aria-label="Level 1 Resonance">
        <div className="sphere"></div>
        <div className="resonance-label">Level 1 Resonance</div>
      </div>
    );
  }

  return (
    <div className="resonance-visualization level-5" aria-label="Level 5 Resonance">
      <div className="sphere core"></div>
      <div className="sphere ring-1"></div>
      <div className="sphere ring-2"></div>
      <div className="sphere ring-3"></div>
      <div className="sphere ring-4"></div>
      <div className="resonance-label">Level 5 Resonance</div>
    </div>
  );
}

// Reusable Tier Card Component
function TierCard({ 
  tier, 
  price, 
  priceUnit = '', 
  features, 
  isPopular = false,
  ctaText,
  ctaVariant = 'outline',
  onSelect,
  hoveredTier,
  setHoveredTier,
  tierId
}) {
  return (
    <div 
      className={`tier-card ${tierId} ${hoveredTier === tierId ? 'hovered' : ''}`}
      onMouseEnter={() => setHoveredTier(tierId)}
      onMouseLeave={() => setHoveredTier(null)}
      role="article"
      aria-label={`${tier} membership tier`}
    >
      {isPopular && (
        <div className="tier-badge popular" aria-label="Most Popular">
          Most Popular
        </div>
      )}
      
      <div className="tier-header">
        <h3>{tier}</h3>
        <p className="tier-price">
          {price}
          {priceUnit && <span>{priceUnit}</span>}
        </p>
      </div>
      
      <ResonanceVisualization level={isPopular ? 5 : 1} />
      
      <ul className="tier-features" role="list">
        {features.map((feature, index) => (
          <TierFeature key={index} included={feature.included}>
            {feature.text}
          </TierFeature>
        ))}
      </ul>
      
      <div className="tier-cta">
        <button 
          className={`btn btn-${ctaVariant}`}
          onClick={() => onSelect?.(tierId)}
          aria-label={`${ctaText} for ${tier}`}
        >
          {ctaText}
        </button>
      </div>
    </div>
  );
}

// Main Membership Tiers Component
function MembershipTiers() {
  const [hoveredTier, setHoveredTier] = useState(null);

  const handleTierSelect = (tierId) => {
    console.log(`Selected tier: ${tierId}`);
    // Handle tier selection - could open payment modal, etc.
  };

  const nvrDieFeatures = [
    { text: 'Directory browsing', included: true },
    { text: '24h delayed statistics', included: true },
    { text: 'Standard search', included: true },
    { text: 'Compressed downloads', included: true },
    { text: 'Real-time data', included: false },
    { text: 'Predictive tools', included: false },
  ];

  const njz4evaFeatures = [
    { text: 'Everything in Nvr Die', included: true },
    { text: 'Real-time RAWS streams', included: true },
    { text: 'Advanced ROTAS layers', included: true },
    { text: 'Predictive analytics', included: true },
    { text: 'Early patch access', included: true },
    { text: 'Priority support', included: true },
  ];

  return (
    <section id="membership" className="membership-section">
      <div className="section-header">
        <h2 className="section-title">Choose Your Tier</h2>
        <p className="section-subtitle">Unlock the full potential of NJZ Information Hub</p>
      </div>
      
      <div className="tier-comparison-container">
        <div className="tier-comparison">
          <TierCard
            tier="Nvr Die"
            price="Free"
            features={nvrDieFeatures}
            isPopular={false}
            ctaText="Start Free"
            ctaVariant="outline"
            onSelect={handleTierSelect}
            hoveredTier={hoveredTier}
            setHoveredTier={setHoveredTier}
            tierId="nvr-die"
          />
          
          <div className="tier-divider" aria-hidden="true">
            <div className="growth-arrow">→</div>
            <div className="growth-label">Upgrade</div>
          </div>
          
          <TierCard
            tier="NJZ 4eva"
            price="$29"
            priceUnit="/month"
            features={njz4evaFeatures}
            isPopular={true}
            ctaText="Upgrade Now"
            ctaVariant="primary"
            onSelect={handleTierSelect}
            hoveredTier={hoveredTier}
            setHoveredTier={setHoveredTier}
            tierId="njz-4eva"
          />
        </div>
      </div>
    </section>
  );
}

export default MembershipTiers;
export { TierCard, TierFeature, ResonanceVisualization };