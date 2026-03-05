import React, { useState } from 'react';
import Header from './components/Header';
import EllipseSystem from './components/EllipseSystem';
import LayerToggle from './components/LayerToggle';
import ProbabilityGauge from './components/ProbabilityGauge';
import FormulaLibrary from './components/FormulaLibrary';
import MatchPredictor from './components/MatchPredictor';
import { analyticsLayers } from './data/analyticsLayers';

function App() {
  const [activeLayer, setActiveLayer] = useState('base');

  const handleLayerToggle = (layerId) => {
    setActiveLayer(layerId);
  };

  const probabilityData = [
    { value: 87.3, label: 'Match Accuracy' },
    { value: 92.1, label: 'Investment Score' },
    { value: 78.5, label: 'Risk Factor' },
    { value: 94.2, label: 'Talent Potential' },
  ];

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
        </div>
        <EllipseSystem activeLayer={activeLayer} />
      </section>

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
    </div>
  );
}

export default App;
