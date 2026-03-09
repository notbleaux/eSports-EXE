import React, { useState, useEffect } from 'react';
import { 
  ONBOARDING_STEPS, 
  USER_ROLES, 
  FEATURE_HIGHLIGHTS, 
  TIER_OPTIONS,
  completeOnboarding 
} from '../js/userPreferences';
import RoleSelection from './RoleSelection';

/**
 * Twin File Visualization Component
 * Visual explanation of SATOR and ROTAS architecture
 */
function TwinFileVisual() {
  return (
    <div className="twin-file-visual">
      <div className="twin-file-container">
        <div className="twin-file sator-file">
          <div className="file-header">
            <span className="file-icon">◎</span>
            <span className="file-name">SATOR</span>
            <span className="file-ext">.raws</span>
          </div>
          <div className="file-body">
            <div className="file-line"><span className="json-key">"raw"</span>: <span className="json-value">true</span>,</div>
            <div className="file-line"><span className="json-key">"matches"}</span>: [],</div>
            <div className="file-line"><span className="json-key">"archive"}</span>: {},</div>
            <div className="file-line"><span className="json-key">"public"}</span>: <span className="json-value">false</span></div>
          </div>
          <div className="file-badge">RAW Data</div>
        </div>

        <div className="twin-connector">
          <div className="connector-line"></div>
          <div className="connector-flow"></div>
          <div className="connector-label">FANTASY</div>
        </div>

        <div className="twin-file rotas-file">
          <div className="file-header">
            <span className="file-icon">◈</span>
            <span className="file-name">ROTAS</span>
            <span className="file-ext">.base</span>
          </div>
          <div className="file-body">
            <div className="file-line"><span className="json-key">"analytics"}</span>: {},</div>
            <div className="file-line"><span className="json-key">"probabilities"}</span>: [],</div>
            <div className="file-line"><span className="json-key">"insights"}</span>: {},</div>
            <div className="file-line"><span className="json-key">"public"}</span>: <span className="json-value">true</span></div>
          </div>
          <div className="file-badge">Analytics</div>
        </div>
      </div>

      <div className="twin-explanation">
        <p><strong>Twin-File Architecture</strong> ensures data integrity across systems.</p>
        <ul>
          <li><span className="highlight-sator">SATOR</span> stores raw, complete match data</li>
          <li><span className="highlight-rotas">ROTAS</span> provides sanitized, analyzed insights</li>
          <li><span className="highlight-fantasy">FANTASY</span> filter ensures only public data flows through</li>
        </ul>
      </div>

      <style jsx>{`
        .twin-file-visual {
          padding: 1rem;
        }

        .twin-file-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .twin-file {
          width: 220px;
          background: rgba(10, 10, 15, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
          animation: fileAppear 0.6s ease backwards;
        }

        @keyframes fileAppear {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .twin-file.sator-file {
          border-color: rgba(255, 159, 28, 0.3);
          animation-delay: 0s;
        }

        .twin-file.rotas-file {
          border-color: rgba(0, 240, 255, 0.3);
          animation-delay: 0.2s;
        }

        .file-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .file-icon {
          font-size: 1.25rem;
        }

        .sator-file .file-icon {
          color: #ff9f1c;
        }

        .rotas-file .file-icon {
          color: #00f0ff;
        }

        .file-name {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 0.875rem;
          color: #e8e6e3;
        }

        .file-ext {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: #6b7280;
          margin-left: auto;
        }

        .file-body {
          padding: 1rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          line-height: 1.8;
        }

        .json-key {
          color: #9ca3af;
        }

        .json-value {
          color: #22c55e;
        }

        .file-badge {
          padding: 0.375rem 0.75rem;
          font-size: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-align: center;
        }

        .sator-file .file-badge {
          background: rgba(255, 159, 28, 0.1);
          color: #ff9f1c;
        }

        .rotas-file .file-badge {
          background: rgba(0, 240, 255, 0.1);
          color: #00f0ff;
        }

        .twin-connector {
          position: relative;
          width: 80px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .connector-line {
          position: absolute;
          height: 2px;
          background: linear-gradient(90deg, #ff9f1c, #00f0ff);
          left: 0;
          right: 0;
          opacity: 0.5;
        }

        .connector-flow {
          position: absolute;
          width: 8px;
          height: 8px;
          background: #e8e6e3;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
          animation: dataFlow 1.5s linear infinite;
        }

        @keyframes dataFlow {
          0% { transform: translateX(-30px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateX(30px); opacity: 0; }
        }

        .connector-label {
          position: absolute;
          top: -8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.625rem;
          color: #10b981;
          background: rgba(16, 185, 129, 0.1);
          padding: 2px 8px;
          border-radius: 10px;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .twin-explanation {
          text-align: center;
          max-width: 500px;
          margin: 0 auto;
          font-size: 0.9375rem;
          line-height: 1.8;
          color: #9ca3af;
        }

        .twin-explanation p {
          margin-bottom: 1rem;
          color: #e8e6e3;
        }

        .twin-explanation ul {
          list-style: none;
          padding: 0;
          text-align: left;
          display: inline-block;
        }

        .twin-explanation li {
          margin-bottom: 0.5rem;
          padding-left: 1.5rem;
          position: relative;
        }

        .twin-explanation li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: #6b7280;
        }

        .highlight-sator {
          color: #ff9f1c;
          font-weight: 600;
        }

        .highlight-rotas {
          color: #00f0ff;
          font-weight: 600;
        }

        .highlight-fantasy {
          color: #10b981;
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .twin-file-container {
            flex-direction: column;
          }

          .twin-connector {
            transform: rotate(90deg);
            width: 60px;
            height: 40px;
          }

          .twin-file {
            width: 100%;
            max-width: 280px;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Feature Highlights Component
 * Shows role-specific features
 */
function FeatureHighlights({ role }) {
  const features = FEATURE_HIGHLIGHTS[role] || FEATURE_HIGHLIGHTS.player;
  const roleConfig = USER_ROLES[role.toUpperCase()] || USER_ROLES.PLAYER;

  return (
    <div className="feature-highlights">
      <div className="features-header">
        <span className="features-role-icon" style={{ color: roleConfig.color }}>{roleConfig.icon}</span>
        <h3 className="features-title">Made for {roleConfig.label}s</h3>
      </div>

      <div className="features-grid">
        {features.map((feature, index) => (
          <div 
            key={index} 
            className="feature-card"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="feature-icon-wrapper" style={{ backgroundColor: `${roleConfig.color}15` }}>
              <span className="feature-icon">{feature.icon}</span>
            </div>
            <h4 className="feature-title">{feature.title}</h4>
            <p className="feature-desc">{feature.desc}</p>
          </div>
        ))}
      </div>

      <style jsx>{`
        .feature-highlights {
          padding: 1rem;
        }

        .features-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .features-role-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 0.5rem;
          animation: iconFloat 3s ease-in-out infinite;
        }

        @keyframes iconFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .features-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.25rem;
          color: #e8e6e3;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          animation: cardSlide 0.5s ease backwards;
        }

        @keyframes cardSlide {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .feature-icon-wrapper {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }

        .feature-icon {
          font-size: 1.75rem;
        }

        .feature-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: #e8e6e3;
          margin-bottom: 0.5rem;
        }

        .feature-desc {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.5;
        }

        @media (max-width: 640px) {
          .features-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 400px) {
          .features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Tier Selection Component
 * Subscription tier selection
 */
function TierSelection({ onSelect, selectedTier }) {
  return (
    <div className="tier-selection">
      <div className="tier-header">
        <p className="tier-subtitle">Start free, upgrade when you're ready</p>
      </div>

      <div className="tier-cards">
        {TIER_OPTIONS.map((tier, index) => (
          <button
            key={tier.id}
            className={`tier-card ${tier.id} ${selectedTier === tier.id ? 'selected' : ''} ${tier.recommended ? 'recommended' : ''}`}
            onClick={() => onSelect(tier.id)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {tier.recommended && (
              <div className="tier-recommended-badge">Most Popular</div>
            )}
            
            <h4 className="tier-name">{tier.name}</h4>
            <div className="tier-price">{tier.price}</div>
            <p className="tier-desc">{tier.description}</p>
            
            <ul className="tier-features">
              {tier.features.map((feature, i) => (
                <li key={i}><span className="check">✓</span> {feature}</li>
              ))}
            </ul>

            <div className="tier-select-indicator">
              {selectedTier === tier.id ? '✓ Selected' : 'Select'}
            </div>
          </button>
        ))}
      </div>

      <style jsx>{`
        .tier-selection {
          padding: 1rem;
        }

        .tier-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .tier-subtitle {
          font-size: 0.9375rem;
          color: #6b7280;
        }

        .tier-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
        }

        .tier-card {
          position: relative;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem 1rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          animation: tierSlide 0.5s ease backwards;
        }

        @keyframes tierSlide {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .tier-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .tier-card.selected {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.05);
        }

        .tier-card.recommended {
          border-color: rgba(245, 158, 11, 0.5);
        }

        .tier-recommended-badge {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #f59e0b, #f97316);
          color: #0a0a0f;
          font-size: 0.625rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 12px;
          letter-spacing: 0.05em;
        }

        .tier-name {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #e8e6e3;
          margin-bottom: 0.5rem;
        }

        .tier-price {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          color: #10b981;
          margin-bottom: 0.5rem;
        }

        .tier-desc {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 1rem;
        }

        .tier-features {
          list-style: none;
          padding: 0;
          text-align: left;
          margin-bottom: 1rem;
        }

        .tier-features li {
          font-size: 0.8125rem;
          color: #9ca3af;
          padding: 0.375rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .tier-features .check {
          color: #10b981;
          font-weight: 700;
        }

        .tier-select-indicator {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          color: #6b7280;
          transition: all 0.2s ease;
        }

        .tier-card.selected .tier-select-indicator {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        @media (max-width: 640px) {
          .tier-cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Main Onboarding Flow Component
 */
function OnboardingFlow({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedTier, setSelectedTier] = useState('free');
  const [isCompleting, setIsCompleting] = useState(false);

  const totalSteps = ONBOARDING_STEPS.length;
  const step = ONBOARDING_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setTimeout(handleNext, 800);
  };

  const finishOnboarding = () => {
    setIsCompleting(true);
    completeOnboarding();
    setTimeout(() => {
      onComplete?.({ role: selectedRole, tier: selectedTier });
    }, 800);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <RoleSelection onRoleSelect={handleRoleSelect} />;
      case 1:
        return <TwinFileVisual />;
      case 2:
        return <FeatureHighlights role={selectedRole || 'player'} />;
      case 3:
        return (
          <TierSelection 
            selectedTier={selectedTier} 
            onSelect={setSelectedTier} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`onboarding-flow ${isCompleting ? 'completing' : ''}`}>
      <!-- Progress Bar -->
      <div className="onboarding-progress">
        <div className="progress-track">
          <div 
            className="progress-fill"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
        <div className="progress-steps">
          {ONBOARDING_STEPS.map((s, i) => (
            <div 
              key={s.id}
              className={`progress-step ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}`}
            >
              <span className="step-number">{i < currentStep ? '✓' : i + 1}</span>
              <span className="step-label">{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      <!-- Step Content -->
      <div className="onboarding-content">
        <div className="step-header">
          <h2 className="step-title">{step.title}</h2>
          <p className="step-description">{step.description}</p>
        </div>

        <div className="step-body">
          {renderStepContent()}
        </div>
      </div>

      <!-- Navigation -->
      {currentStep > 0 && (
        <div className="onboarding-nav">
          <button className="nav-btn back" onClick={handleBack}>
            ← Back
          </button>

          {currentStep < totalSteps - 1 ? (
            <button className="nav-btn next" onClick={handleNext}>
              Skip →
            </button>
          ) : (
            <button className="nav-btn finish" onClick={finishOnboarding}>
              Get Started ✨
            </button>
          )}
        </div>
      )}

      <!-- Skip Option (only on first step) -->
      {currentStep === 0 && (
        <div className="skip-option">
          <button className="skip-btn" onClick={onSkip}>
            Skip onboarding →
          </button>
        </div>
      )}

      <style jsx>{`
        .onboarding-flow {
          min-height: 100vh;
          background: #0a0a0f;
          display: flex;
          flex-direction: column;
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .onboarding-flow.completing {
          animation: fadeOut 0.5s ease forwards;
        }

        @keyframes fadeOut {
          to { opacity: 0; transform: scale(0.98); }
        }

        /* Progress Bar */
        .onboarding-progress {
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .progress-track {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #ff9f1c, #00f0ff);
          border-radius: 2px;
          transition: width 0.4s ease;
        }

        .progress-steps {
          display: flex;
          justify-content: space-between;
          max-width: 600px;
          margin: 0 auto;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          opacity: 0.5;
          transition: opacity 0.3s ease;
        }

        .progress-step.active,
        .progress-step.completed {
          opacity: 1;
        }

        .step-number {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          font-size: 0.75rem;
          font-weight: 600;
          color: #9ca3af;
          transition: all 0.3s ease;
        }

        .progress-step.active .step-number {
          background: linear-gradient(135deg, #ff9f1c, #00f0ff);
          color: #0a0a0f;
        }

        .progress-step.completed .step-number {
          background: #10b981;
          color: #0a0a0f;
        }

        .step-label {
          font-size: 0.625rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: none;
        }

        @media (min-width: 640px) {
          .step-label {
            display: block;
          }
        }

        /* Content Area */
        .onboarding-content {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
        }

        .step-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .step-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: #e8e6e3;
          margin-bottom: 0.5rem;
        }

        .step-description {
          font-size: 1rem;
          color: #6b7280;
        }

        .step-body {
          max-width: 900px;
          margin: 0 auto;
        }

        /* Navigation */
        .onboarding-nav {
          display: flex;
          justify-content: space-between;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.02);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .nav-btn {
          padding: 0.75rem 1.5rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.875rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .nav-btn.back {
          background: transparent;
          color: #9ca3af;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .nav-btn.back:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #e8e6e3;
        }

        .nav-btn.next {
          background: rgba(255, 255, 255, 0.05);
          color: #9ca3af;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .nav-btn.next:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #e8e6e3;
        }

        .nav-btn.finish {
          background: linear-gradient(135deg, #ff9f1c, #f59e0b);
          color: #0a0a0f;
          font-weight: 600;
        }

        .nav-btn.finish:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(255, 159, 28, 0.3);
        }

        /* Skip Option */
        .skip-option {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
        }

        .skip-btn {
          background: transparent;
          border: none;
          color: #6b7280;
          font-size: 0.8125rem;
          cursor: pointer;
          padding: 0.5rem;
          transition: color 0.2s ease;
        }

        .skip-btn:hover {
          color: #e8e6e3;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .onboarding-content {
            padding: 1rem;
          }

          .step-title {
            font-size: 1.5rem;
          }

          .onboarding-nav {
            padding: 1rem;
          }

          .nav-btn {
            padding: 0.625rem 1rem;
            font-size: 0.8125rem;
          }
        }
      `}</style>
    </div>
  );
}

export default OnboardingFlow;
export { RoleSelection, TwinFileVisual, FeatureHighlights, TierSelection };
