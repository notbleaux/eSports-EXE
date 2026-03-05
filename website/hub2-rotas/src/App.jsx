import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import EllipseSystem from './components/EllipseSystem';
import LayerToggle from './components/LayerToggle';
import ProbabilityGauge from './components/ProbabilityGauge';
import FormulaLibrary from './components/FormulaLibrary';
import MatchPredictor from './components/MatchPredictor';
import OnboardingFlow from './shared/components/OnboardingFlow';
import PersonalizedDashboard from './shared/components/PersonalizedDashboard';
import ErrorBoundary from './shared/components/ErrorBoundary';
import { analyticsLayers } from './data/analyticsLayers';
import {
  hasCompletedOnboarding,
  getStoredRole,
  saveUserPreferences,
  getUserPreferences
} from './shared/js/userPreferences';
import { ProgressiveDisclosureProvider } from './shared/js/progressiveDisclosure.jsx';

// Hub Bridge Component
function HubBridge() {
  return (
    <section className="bridge-section">
      <h2 className="section-title">Data Flow</h2>
      <div className="hub-bridge">
        <div className="hub-bridge-node sator">
          <span className="hub-bridge-icon">◎</span>
          <span className="hub-bridge-label">SATOR</span>
          <span className="hub-bridge-desc">RAWS Archive</span>
        </div>
        <div className="hub-bridge-connector">
          <div className="bridge-line"></div>
          <div className="data-flow"></div>
          <span className="bridge-status">Synced</span>
        </div>
        <div className="hub-bridge-node rotas">
          <span className="hub-bridge-icon">◈</span>
          <span className="hub-bridge-label">ROTAS</span>
          <span className="hub-bridge-desc">Analytics Engine</span>
        </div>
      </div>
      <p className="bridge-description">
        Raw data flows from SATOR to ROTAS for analysis and probability calculations.
        Twin-file architecture ensures data integrity across both systems.
      </p>
    </section>
  );
}

// Cross-Hub Link Component
function CrossHubLink() {
  return (
    <div className="cross-hub-section">
      <a href="../hub1-sator/index.html" className="cross-hub-link rotas-to-sator" data-cross-hub="true">
        View Raw Data in SATOR
        <span className="hub-arrow">←</span>
      </a>
    </div>
  );
}

// Bottom Navigation Component
function BottomNav() {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-tabs">
        <a href="../hub1-sator/index.html" className="nav-tab sator" data-hub="sator">
          <span className="nav-tab-icon">◎</span>
          <span className="nav-tab-label">SATOR</span>
        </a>
        <a href="index.html" className="nav-tab rotas active" data-hub="rotas">
          <span className="nav-tab-icon">◈</span>
          <span className="nav-tab-label">ROTAS</span>
        </a>
      </div>
    </nav>
  );
}

// Role-Specific Content Component
function RoleSpecificContent({ role }) {
  const roleContent = {
    player: {
      title: 'Player Analytics',
      description: 'Advanced match analysis and performance tracking',
      features: ['Match breakdowns', 'Heat maps', 'Performance trends', 'Skill ratings']
    },
    organizer: {
      title: 'Tournament Analytics',
      description: 'Event insights and participant statistics',
      features: ['Bracket predictions', 'Participant stats', 'Engagement metrics', 'Revenue analytics']
    },
    spectator: {
      title: 'Live Match Analytics',
      description: 'Real-time probabilities and predictions',
      features: ['Live odds', 'Win probability', 'Team comparisons', 'Match highlights']
    }
  };

  const content = roleContent[role] || roleContent.player;

  return (
    <section className="role-content-section">
      <div className="role-content-header">
        <span className={`role-badge ${role}`}>{role.charAt(0).toUpperCase() + role.slice(1)} View</span>
        <h2>{content.title}</h2>
        <p>{content.description}</p>
      </div>

      <div className="role-features">
        {content.features.map((feature, i) => (
          <div key={i} className="role-feature-tag">
            <span className="feature-check">✓</span>
            {feature}
          </div>
        ))}
      </div>

      <style jsx>{`
        .role-content-section {
          padding: 2rem 1.5rem;
          background: rgba(255, 255, 255, 0.02);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin: 2rem 0;
        }

        .role-content-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .role-badge {
          display: inline-block;
          padding: 0.375rem 1rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
        }

        .role-badge.player {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .role-badge.organizer {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
        }

        .role-badge.spectator {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        }

        .role-content-header h2 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.5rem;
          color: #e8e6e3;
          margin-bottom: 0.5rem;
        }

        .role-content-header p {
          color: #6b7280;
          font-size: 1rem;
        }

        .role-features {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.75rem;
        }

        .role-feature-tag {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          font-size: 0.8125rem;
          color: #9ca3af;
          transition: all 0.2s ease;
        }

        .role-feature-tag:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #e8e6e3;
        }

        .feature-check {
          color: #10b981;
        }
      `}</style>
    </section>
  );
}

// Main App Component
function App() {
  const [activeLayer, setActiveLayer] = useState('base');
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboarding = () => {
      const completed = hasCompletedOnboarding();
      const role = getStoredRole();

      if (!completed) {
        // First-time user, show onboarding
        setTimeout(() => {
          setLoading(false);
          setShowOnboarding(true);
        }, 1500);
      } else if (role) {
        // Returning user with role
        setUserRole(role);
        setTimeout(() => {
          setLoading(false);
          setShowDashboard(true);
        }, 1500);
      } else {
        // Completed onboarding but no role (edge case)
        setTimeout(() => {
          setLoading(false);
          setShowOnboarding(true);
        }, 1500);
      }
    };

    checkOnboarding();
  }, []);

  const handleOnboardingComplete = (data) => {
    setUserRole(data.role);
    setShowOnboarding(false);
    setShowDashboard(true);

    // Save preferences
    const prefs = getUserPreferences();
    saveUserPreferences({
      ...prefs,
      tier: data.tier,
      onboardingCompletedAt: new Date().toISOString()
    });
  };

  const handleOnboardingSkip = () => {
    // Default to player if skipped
    setUserRole('player');
    setShowOnboarding(false);
    setShowDashboard(true);
  };

  const handleFirstVisit = () => {
    setShowDashboard(false);
    setShowOnboarding(true);
  };

  const handleLayerToggle = (layerId) => {
    setActiveLayer(layerId);
  };

  const probabilityData = [
    { value: 87.3, label: 'Match Accuracy' },
    { value: 92.1, label: 'Investment Score' },
    { value: 78.5, label: 'Risk Factor' },
    { value: 94.2, label: 'Talent Potential' },
  ];

  // Loading Screen
  if (loading) {
    return (
      <div className="loading-overlay visible">
        <div className="loading-terminal">
          <div className="terminal-header">
            <span className="terminal-dot red"></span>
            <span className="terminal-dot yellow"></span>
            <span className="terminal-dot green"></span>
            <span className="terminal-title">rotas_hub_loader</span>
          </div>
          <div className="terminal-body">
            <div className="terminal-output">
              <div className="terminal-line">
                <span className="timestamp">{new Date().toLocaleTimeString()}</span>
                Initializing ROTAS analytics engine...
              </div>
              <div className="terminal-line">
                <span className="timestamp">{new Date().toLocaleTimeString()}</span>
                Loading probability models...
              </div>
              <div className="terminal-line">
                <span className="timestamp">{new Date().toLocaleTimeString()}</span>
                Connecting to SATOR data bridge...
              </div>
              <div className="terminal-line">
                <span className="timestamp">{new Date().toLocaleTimeString()}</span>
                {showOnboarding ? 'Preparing onboarding flow...' : 'Loading personalized dashboard...'}
              </div>
            </div>
            <div className="terminal-input">
              <span className="prompt">$</span>
              <span className="cursor">_</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Onboarding Flow
  if (showOnboarding) {
    return (
      <ErrorBoundary>
        <ProgressiveDisclosureProvider>
          <OnboardingFlow
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />
        </ProgressiveDisclosureProvider>
      </ErrorBoundary>
    );
  }

  // Main App with Dashboard or Regular View
  return (
    <ErrorBoundary>
      <ProgressiveDisclosureProvider>
        <div className="rotas-app">
          <Header />

          {showDashboard ? (
            <>
              <section className="hero-section">
                <div className="hero-content">
                  <h1 className="hero-title">
                    <span className="text-cyan">ROTAS</span>
                    <span className="text-porcelain"> Hub</span>
                  </h1>
                  <p className="hero-subtitle">
                    Advanced Analytics & Probability Engines
                  </p>
                  <CrossHubLink />
                </div>
                <EllipseSystem activeLayer={activeLayer} />
              </section>

              <RoleSpecificContent role={userRole} />

              <section className="dashboard-section">
                <PersonalizedDashboard
                  role={userRole}
                  onFirstVisit={handleFirstVisit}
                />
              </section>
            </>
          ) : (
            <>
              <section className="hero-section">
                <div className="hero-content">
                  <h1 className="hero-title">
                    <span className="text-cyan">ROTAS</span>
                    <span className="text-porcelain"> Hub</span>
                  </h1>
                  <p className="hero-subtitle">
                    Advanced Analytics & Probability Engines
                  </p>
                  <CrossHubLink />
                </div>
                <EllipseSystem activeLayer={activeLayer} />
              </section>

              <HubBridge />
            </>
          )}

          <section className="layer-section">
            <div className="section-header">
              <h2 className="section-title">Analytics Layers</h2>
              <p className="section-desc">Toggle visualization layers to analyze different data dimensions</p>
            </div>
            <LayerToggle
              layers={analyticsLayers}
              activeLayer={activeLayer}
              onToggle={handleLayerToggle}
            />
          </section>

          <section className="probability-section">
            <div className="section-header">
              <h2 className="section-title">Probability Engines</h2>
              <p className="section-desc">Monte Carlo simulations powering predictive analytics</p>
            </div>
            <div className="probability-grid">
              {probabilityData.map((item, index) => (
                <ProbabilityGauge
                  key={index}
                  value={item.value}
                  label={item.label}
                />
              ))}
            </div>
          </section>

          <section className="predictor-section">
            <div className="section-header">
              <h2 className="section-title">Match Predictor</h2>
              <p className="section-desc">Real-time matchup analysis with probability distribution</p>
            </div>
            <MatchPredictor />
          </section>

          <section className="formula-section">
            <FormulaLibrary />
          </section>

          <footer className="rotas-footer">
            <div className="footer-content">
              <p className="footer-text">
                <span className="text-cyan">ROTAS</span> Hub &copy; 2024 NJZ Analytics
              </p>
              <p className="footer-version">Version 2.4.1-beta</p>
            </div>
          </footer>

          <BottomNav />
        </div>
      </ProgressiveDisclosureProvider>
    </ErrorBoundary>
  );
}

export default App;
