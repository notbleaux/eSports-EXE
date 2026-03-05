import React, { useState, useEffect, useCallback } from 'react';
import './ROTASHub.css';

// Import components
import GlassmorphismPanel, { GlassCard, GlassModal } from './GlassmorphismPanel';
import EllipseLayerSystem from './EllipseLayerSystem';
import HarmonicWaveViz from './HarmonicWaveViz';
import ProbabilityCloud from './ProbabilityCloud';
import ComponentLibrary from './ComponentLibrary';

/**
 * ROTASHub - Main dashboard with layer system
 * 
 * Features:
 * - Glassmorphism UI with cyan/gold accents
 * - Intersecting elliptical fields
 * - Harmonic wave visualization
 * - Fluid morphing between layers
 * - Component library integration
 * - Responsive design
 * - 60fps animations
 */

const HUB_STATS = [
  { id: 1, label: 'Active Layers', value: '3', change: '+1', color: '#00f0ff' },
  { id: 2, label: 'Correlation', value: '87.3%', change: '+2.4%', color: '#c9b037' },
  { id: 3, label: 'Harmonic Freq', value: '432Hz', change: 'stable', color: '#10b981' },
  { id: 4, label: 'Entropy', value: '0.24', change: '-0.05', color: '#ff6b6b' },
];

const RECENT_ANALYTICS = [
  { id: 1, name: 'Match Prediction', team: 'T1 vs GEN', probability: 67.3, time: '2m ago' },
  { id: 2, name: 'Player Analysis', team: 'Faker Performance', probability: 89.1, time: '5m ago' },
  { id: 3, name: 'Tournament Sim', team: 'Worlds Bracket', probability: 54.2, time: '12m ago' },
  { id: 4, name: 'Risk Assessment', team: 'Portfolio A', probability: 23.7, time: '15m ago' },
];

function ROTASHub() {
  const [activeLayers, setActiveLayers] = useState({ persona: true, shadow: false, animus: true });
  const [correlation, setCorrelation] = useState(87.3);
  const [libraryCollapsed, setLibraryCollapsed] = useState(false);
  const [activePanel, setActivePanel] = useState('harmonic');
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handler = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Handle layer changes
  const handleLayerChange = useCallback((layers) => {
    setActiveLayers(layers);
    addNotification('Layer configuration updated');
  }, []);

  // Handle correlation changes
  const handleCorrelationChange = useCallback((value) => {
    setCorrelation(value);
  }, []);

  // Add notification
  const addNotification = (message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, time: Date.now() }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  // Handle wave click
  const handleWaveClick = (data) => {
    addNotification(`Wave interference detected at x:${data.x.toFixed(0)}`);
  };

  // Handle probability collapse
  const handleProbabilityCollapse = (data) => {
    addNotification(`Probability collapsed: ${data.probability.toFixed(1)}%`);
  };

  // Handle module add
  const handleModuleAdd = (module) => {
    addNotification(`Added ${module.name} to dashboard`);
  };

  if (isLoading) {
    return (
      <div className="rotas-hub-loading">
        <div className="loading-content">
          <div className="loading-ellipses">
            <div className="loading-ellipse" />
            <div className="loading-ellipse" />
            <div className="loading-ellipse" />
          </div>
          <span className="loading-text">Initializing Harmonic Layer...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rotas-hub ${reducedMotion ? 'reduced-motion' : ''}`}>
      {/* Component Library Sidebar */}
      <ComponentLibrary
        collapsed={libraryCollapsed}
        onToggleCollapse={() => setLibraryCollapsed(!libraryCollapsed)}
        onModuleAdd={handleModuleAdd}
      />

      {/* Main Content */}
      <div 
        className="hub-main"
        style={{ marginLeft: libraryCollapsed ? '60px' : '320px' }}
      >
        {/* Header */}
        <header className="hub-header">
          <div className="header-branding">
            <span className="hub-icon">◈</span>
            <div className="hub-titles">
              <h1>ROTAS Hub</h1>
              <span className="hub-subtitle">The Harmonic Layer</span>
            </div>
          </div>

          <nav className="header-nav">
            {['overview', 'harmonic', 'analytics', 'predictions'].map(panel => (
              <button
                key={panel}
                className={`nav-btn ${activePanel === panel ? 'active' : ''}`}
                onClick={() => setActivePanel(panel)}
              >
                {panel.charAt(0).toUpperCase() + panel.slice(1)}
              </button>
            ))}
          </nav>

          <div className="header-actions">
            <button className="action-btn">🔔</button>
            <button className="action-btn">⚙️</button>
            <div className="user-avatar">A</div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="hub-dashboard">
          {/* Stats Row */}
          <div className="stats-row">
            {HUB_STATS.map(stat => (
              <GlassCard 
                key={stat.id} 
                accent={stat.color === '#00f0ff' ? 'cyan' : stat.color === '#c9b037' ? 'gold' : 'none'}
                size="sm"
                className="stat-card"
              >
                <span className="stat-label">{stat.label}</span>
                <span className="stat-value" style={{ color: stat.color }}>{stat.value}</span>
                <span className={`stat-change ${stat.change.startsWith('+') ? 'up' : stat.change.startsWith('-') ? 'down' : ''}`}>
                  {stat.change}
                </span>
              </GlassCard>
            ))}
          </div>

          {/* Main Visualization Area */}
          <div className="viz-grid">
            {/* Ellipse Layer System */}
            <GlassmorphismPanel 
              depth={3} 
              accent="gradient" 
              className="viz-panel ellipse-panel"
            >
              <div className="panel-header">
                <h3>🌀 Archetype Layers</h3>
                <span className="panel-badge">{Object.values(activeLayers).filter(Boolean).length} Active</span>
              </div>
              <EllipseLayerSystem
                onLayerChange={handleLayerChange}
                onCorrelationChange={handleCorrelationChange}
                animated={!reducedMotion}
              />
            </GlassmorphismPanel>

            {/* Harmonic Wave Visualization */}
            <GlassmorphismPanel 
              depth={3} 
              accent="cyan" 
              className="viz-panel wave-panel"
            >
              <div className="panel-header">
                <h3>〰️ Harmonic Waves</h3>
                <span className="panel-badge live">● Live</span>
              </div>
              <HarmonicWaveViz
                width={600}
                height={250}
                onWaveClick={handleWaveClick}
              />
            </GlassmorphismPanel>

            {/* Probability Cloud */}
            <GlassmorphismPanel 
              depth={3} 
              accent="gold" 
              className="viz-panel cloud-panel"
            >
              <div className="panel-header">
                <h3>☁️ Probability Cloud</h3>
                <span className="panel-badge">Interactive</span>
              </div>
              <div className="cloud-container">
                <ProbabilityCloud
                  width={300}
                  height={300}
                  particleCount={800}
                  onCollapse={handleProbabilityCollapse}
                />
              </div>
            </GlassmorphismPanel>

            {/* Recent Analytics */}
            <GlassmorphismPanel 
              depth={2} 
              className="viz-panel analytics-panel"
            >
              <div className="panel-header">
                <h3>📊 Recent Analytics</h3>
                <button className="view-all-btn">View All →</button>
              </div>
              <div className="analytics-list">
                {RECENT_ANALYTICS.map(item => (
                  <div key={item.id} className="analytics-item">
                    <div className="analytics-info">
                      <span className="analytics-name">{item.name}</span>
                      <span className="analytics-team">{item.team}</span>
                    </div>
                    <div className="analytics-metrics">
                      <span 
                        className="analytics-prob"
                        style={{ 
                          color: item.probability > 70 ? '#00f0ff' : item.probability > 40 ? '#c9b037' : '#ff6b6b'
                        }}
                      >
                        {item.probability.toFixed(1)}%
                      </span>
                      <span className="analytics-time">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassmorphismPanel>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="notifications-container">
        {notifications.map(notification => (
          <div key={notification.id} className="notification-toast">
            <span className="notification-icon">💫</span>
            <span className="notification-message">{notification.message}</span>
          </div>
        ))}
      </div>

      {/* Background Effects */}
      <div className="hub-background">
        <div className="bg-gradient-orb orb-1" />
        <div className="bg-gradient-orb orb-2" />
        <div className="bg-grid" />
      </div>
    </div>
  );
}

export default ROTASHub;
