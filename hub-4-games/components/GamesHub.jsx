import React, { useState, useEffect } from 'react';
import TorusFlow from './TorusFlow';
import ResonantMatchmaking from './ResonantMatchmaking';
import TripleModeSelector from './TripleModeSelector';
import GameDownloadPortal from './GameDownloadPortal';
import LivePlatformLobby from './LivePlatformLobby';
import '../styles/games-hub.css';
import '../styles/nexus-tokens.css';

/**
 * GamesHub - Main Page Component for Hub 4: The Nexus
 * 
 * Layout:
 * - Header with live/offline status toggle
 * - Navigation between Download and Live sections
 * - TorusFlow visualization at top
 * - Main content area with components
 * - Responsive design for all screen sizes
 */

const SECTIONS = {
  DOWNLOAD: 'download',
  LIVE: 'live'
};

const GamesHub = () => {
  const [activeSection, setActiveSection] = useState(SECTIONS.DOWNLOAD);
  const [isLive, setIsLive] = useState(false);
  const [torusState, setTorusState] = useState('harmonic');
  const [selectedMode, setSelectedMode] = useState(null);
  const [matchFound, setMatchFound] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Toggle live mode
  const toggleLiveMode = () => {
    setIsLive(!isLive);
    setTorusState(!isLive ? 'celestial' : 'harmonic');
  };

  // Handle mode selection
  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    console.log('Mode selected:', mode);
  };

  // Handle match found
  const handleMatchFound = (match) => {
    setMatchFound(match);
    console.log('Match found:', match);
  };

  // Handle game install
  const handleGameInstall = (gameId, platform) => {
    console.log('Installing game:', gameId, 'for platform:', platform);
  };

  // Handle game launch
  const handleGameLaunch = (gameId) => {
    console.log('Launching game:', gameId);
  };

  // Handle join match
  const handleJoinMatch = (match) => {
    console.log('Joining match:', match);
  };

  // Handle spectate
  const handleSpectate = (match) => {
    console.log('Spectating match:', match);
  };

  if (isLoading) {
    return (
      <div className="nexus-root">
        <div className="nexus-loading">
          <div className="nexus-loading-spinner" />
          <p>Initializing The Nexus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`nexus-root ${isLive ? 'live-mode' : 'offline-mode'}`}>
      <div className="nexus-content">
        {/* Header */}
        <header className="nexus-header">
          <div className="nexus-branding">
            <h1 className="nexus-title">THE NEXUS</h1>
            <span className="nexus-subtitle">Hub 4 • Games & Experience</span>
          </div>
          
          <button
            className={`nexus-status-indicator ${isLive ? 'live' : 'offline'}`}
            onClick={toggleLiveMode}
          >
            <span className="nexus-status-dot" />
            {isLive ? 'LIVE CONNECTION' : 'OFFLINE'}
          </button>
        </header>

        {/* Navigation */}
        <nav className="nexus-nav">
          <button
            className={`nexus-nav-button ${activeSection === SECTIONS.DOWNLOAD ? 'active' : ''}`}
            onClick={() => setActiveSection(SECTIONS.DOWNLOAD)}
          >
            <span>📦</span>
            Download Portal
          </button>
          
          <button
            className={`nexus-nav-button ${activeSection === SECTIONS.LIVE ? 'active' : ''}`}
            onClick={() => {
              setActiveSection(SECTIONS.LIVE);
              if (!isLive) setIsLive(true);
            }}
          >
            <span>🔴</span>
            Live Lobby
          </button>
        </nav>

        {/* Torus Flow Visualization */}
        <div className="torus-flow-section">
          <TorusFlow
            currentState={torusState}
            onStateChange={setTorusState}
            isLive={isLive}
          />
        </div>

        {/* Download Section */}
        <section className={`nexus-section ${activeSection === SECTIONS.DOWNLOAD ? 'active' : ''}`}>
          <div className="section-layout">
            {/* Left Column */}
            <div className="section-column main">
              <GameDownloadPortal
                onInstall={handleGameInstall}
                onLaunch={handleGameLaunch}
              />
            </div>

            {/* Right Column */}
            <div className="section-column side">
              <div className="side-panel">
                <ResonantMatchmaking
                  onMatchFound={handleMatchFound}
                  searchEnabled={isLive}
                />
              </div>

              <div className="side-panel">
                <TripleModeSelector
                  onModeSelect={handleModeSelect}
                  selectedMode={selectedMode}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Live Section */}
        <section className={`nexus-section ${activeSection === SECTIONS.LIVE ? 'active' : ''}`}>
          <div className="section-layout live-layout">
            <div className="section-column full">
              <LivePlatformLobby
                onJoinMatch={handleJoinMatch}
                onSpectate={handleSpectate}
              />
            </div>
          </div>
          
          <div className="section-layout">
            <div className="section-column main">
              <ResonantMatchmaking
                onMatchFound={handleMatchFound}
                searchEnabled={true}
              />
            </div>
            
            <div className="section-column side">
              <TripleModeSelector
                onModeSelect={handleModeSelect}
                selectedMode={selectedMode}
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="nexus-footer">
          <div className="footer-content">
            <div className="footer-section">
              <h4>The Nexus</h4>
              <p>Gateway to all NJZ experiences.</p>
            </div>
            
            <div className="footer-section">
              <h4>Connection</h4>
              <div className="connection-status">
                <span className={`status-indicator ${isLive ? 'live' : 'offline'}`} />
                <span>{isLive ? 'Resonance Active' : 'Standby Mode'}</span>
              </div>
            </div>
            
            <div className="footer-section">
              <h4>Version</h4>
              <p>v4.2.1-alpha</p>
            </div>
          </div>
          
          <div className="footer-copyright">
            © 2026 NJZ Platform. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
};

export default GamesHub;
