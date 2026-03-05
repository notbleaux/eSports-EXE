import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import EllipseSystem from './components/EllipseSystem';
import LayerToggle from './components/LayerToggle';
import ProbabilityGauge from './components/ProbabilityGauge';
import FormulaLibrary from './components/FormulaLibrary';
import MatchPredictor from './components/MatchPredictor';
import { analyticsLayers } from './data/analyticsLayers';

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

function App() {
  const [activeLayer, setActiveLayer] = useState('base');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleLayerToggle = (layerId) => {
    setActiveLayer(layerId);
  };

  const probabilityData = [
    { value: 87.3, label: 'Match Accuracy' },
    { value: 92.1, label: 'Investment Score' },
    { value: 78.5, label: 'Risk Factor' },
    { value: 94.2, label: 'Talent Potential' },
  ];

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
                Rendering interface...
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

  return (
    <div className="rotas-app">
      <Header />
      
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
  );
}

export default App;