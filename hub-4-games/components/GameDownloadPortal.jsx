import React, { useState, useEffect } from 'react';
import '../styles/game-download-portal.css';

/**
 * GameDownloadPortal - Download Cards with Abyssal Glass Panels
 * 
 * Features:
 * - Abyssal glass panel cards
 * - Download progress visualization
 * - Platform-specific download buttons
 * - Version management
 */

const GAMES_DATA = [
  {
    id: 'njz-core',
    name: 'NJZ Core',
    subtitle: 'Foundation Experience',
    description: 'The essential NJZ Platform client with access to all core features and social systems.',
    icon: '🎮',
    version: '4.2.1',
    size: '2.4 GB',
    platforms: ['windows', 'macos', 'linux'],
    releaseDate: '2026-02-28',
    updateNotes: ['New matchmaking system', 'Improved UI responsiveness', 'Bug fixes'],
    isInstalled: false,
    isUpdate: false,
    downloadProgress: 0
  },
  {
    id: 'njz-studio',
    name: 'NJZ Studio',
    subtitle: 'Creation Suite',
    description: 'Advanced tools for creators including level editor, asset pipeline, and modding framework.',
    icon: '🎨',
    version: '2.1.0',
    size: '4.8 GB',
    platforms: ['windows', 'macos'],
    releaseDate: '2026-02-15',
    updateNotes: ['New shader tools', 'Asset library update', 'Performance improvements'],
    isInstalled: true,
    isUpdate: true,
    downloadProgress: 100
  },
  {
    id: 'njz-server',
    name: 'NJZ Server',
    subtitle: 'Dedicated Hosting',
    description: 'Host your own dedicated servers with full configuration and management capabilities.',
    icon: '☁️',
    version: '3.0.2',
    size: '1.2 GB',
    platforms: ['windows', 'linux', 'docker'],
    releaseDate: '2026-03-01',
    updateNotes: ['Docker support added', 'Cluster management', 'Security patches'],
    isInstalled: false,
    isUpdate: false,
    downloadProgress: 0
  },
  {
    id: 'njz-vr',
    name: 'NJZ VR',
    subtitle: 'Immersive Reality',
    description: 'Virtual reality extension for compatible NJZ experiences. Meta Quest and SteamVR support.',
    icon: '🥽',
    version: '1.5.0',
    size: '3.6 GB',
    platforms: ['windows'],
    releaseDate: '2026-01-20',
    updateNotes: ['Hand tracking improved', 'Pass-through mode', 'Haptics upgrade'],
    isInstalled: false,
    isUpdate: false,
    downloadProgress: 0
  }
];

const PLATFORM_ICONS = {
  windows: '⊞',
  macos: '',
  linux: '🐧',
  docker: '🐳'
};

const GameDownloadPortal = ({ 
  onInstall,
  onLaunch,
  className = ''
}) => {
  const [games, setGames] = useState(GAMES_DATA);
  const [selectedGame, setSelectedGame] = useState(null);
  const [activeDownloads, setActiveDownloads] = useState({});
  const [expandedCard, setExpandedCard] = useState(null);

  // Simulate download progress
  useEffect(() => {
    const intervals = Object.keys(activeDownloads).map(gameId => {
      return setInterval(() => {
        setActiveDownloads(prev => {
          const current = prev[gameId];
          if (current >= 100) {
            return { ...prev, [gameId]: 100 };
          }
          return { ...prev, [gameId]: Math.min(current + Math.random() * 5, 100) };
        });
      }, 200);
    });

    return () => intervals.forEach(clearInterval);
  }, [activeDownloads]);

  // Update games when download completes
  useEffect(() => {
    Object.entries(activeDownloads).forEach(([gameId, progress]) => {
      if (progress >= 100) {
        setGames(prev => prev.map(game => 
          game.id === gameId 
            ? { ...game, isInstalled: true, isUpdate: false, downloadProgress: 100 }
            : game
        ));
        setTimeout(() => {
          setActiveDownloads(prev => {
            const { [gameId]: _, ...rest } = prev;
            return rest;
          });
        }, 1000);
      }
    });
  }, [activeDownloads]);

  const handleDownload = (gameId, platform) => {
    setActiveDownloads(prev => ({ ...prev, [gameId]: 0 }));
    if (onInstall) {
      onInstall(gameId, platform);
    }
  };

  const handleLaunch = (gameId) => {
    if (onLaunch) {
      onLaunch(gameId);
    }
  };

  const handleCancel = (gameId) => {
    setActiveDownloads(prev => {
      const { [gameId]: _, ...rest } = prev;
      return rest;
    });
  };

  const toggleExpand = (gameId) => {
    setExpandedCard(expandedCard === gameId ? null : gameId);
  };

  const formatProgress = (progress) => Math.round(progress);

  return (
    <div className={`game-download-portal ${className}`}>
      <div className="portal-header">
        <div className="portal-title-section">
          <h2 className="portal-title">
            <span className="portal-icon">📦</span>
            Download Portal
          </h2>
          <p className="portal-subtitle">
            Download and manage your NJZ Platform applications
          </p>
        </div>
        <div className="portal-stats">
          <div className="stat-item">
            <span className="stat-value">{games.filter(g => g.isInstalled).length}</span>
            <span className="stat-label">Installed</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{Object.keys(activeDownloads).length}</span>
            <span className="stat-label">Downloading</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{games.filter(g => g.isUpdate).length}</span>
            <span className="stat-label">Updates</span>
          </div>
        </div>
      </div>

      <div className="games-grid">
        {games.map((game, index) => {
          const isDownloading = game.id in activeDownloads;
          const downloadProgress = activeDownloads[game.id] || 0;
          const isExpanded = expandedCard === game.id;
          
          return (
            <div
              key={game.id}
              className={`game-card ${isExpanded ? 'expanded' : ''} ${isDownloading ? 'downloading' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="card-glass-panel">
                <div className="card-shimmer" />
              </div>

              <div className="card-content">
                <div className="card-main">
                  <div className="game-icon-wrapper">
                    <span className="game-icon">{game.icon}</span>
                    {game.isUpdate && <span className="update-badge">UPDATE</span>}
                  </div>

                  <div className="game-info">
                    <div className="game-name-section">
                      <h3 className="game-name">{game.name}</h3>
                      <span className="game-subtitle">{game.subtitle}</span>
                    </div>
                    <p className="game-description">{game.description}</p>
                    
                    <div className="game-meta">
                      <span className="meta-item version">v{game.version}</span>
                      <span className="meta-item size">{game.size}</span>
                      <span className="meta-item date">{game.releaseDate}</span>
                    </div>
                  </div>

                  <div className="card-actions">
                    {isDownloading ? (
                      <div className="download-progress-container">
                        <div className="progress-ring">
                          <svg viewBox="0 0 36 36">
                            <path
                              className="progress-ring-bg"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="progress-ring-fill"
                              strokeDasharray={`${downloadProgress}, 100`}
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <span className="progress-text">{formatProgress(downloadProgress)}%</span>
                        </div>
                        <button 
                          className="action-button cancel"
                          onClick={() => handleCancel(game.id)}
                        >
                          ✕
                        </button>
                      </div>
                    ) : game.isInstalled ? (
                      <>
                        {game.isUpdate ? (
                          <button 
                            className="action-button update"
                            onClick={() => handleDownload(game.id)}
                          >
                            <span className="button-icon">⬆️</span>
                            Update
                          </button>
                        ) : (
                          <button 
                            className="action-button launch"
                            onClick={() => handleLaunch(game.id)}
                          >
                            <span className="button-icon">▶️</span>
                            Launch
                          </button>
                        )}
                      </>
                    ) : (
                      <button 
                        className="action-button download"
                        onClick={() => toggleExpand(game.id)}
                      >
                        <span className="button-icon">⬇️</span>
                        Download
                      </button>
                    )}

                    <button 
                      className="expand-button"
                      onClick={() => toggleExpand(game.id)}
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && !game.isInstalled && (
                  <div className="card-expanded animate-vortex-in">
                    <div className="platforms-section">
                      <h4>Select Platform</h4>
                      <div className="platform-buttons">
                        {game.platforms.map(platform => (
                          <button
                            key={platform}
                            className="platform-button"
                            onClick={() => handleDownload(game.id, platform)}
                          >
                            <span className="platform-icon">{PLATFORM_ICONS[platform]}</span>
                            <span className="platform-name">{platform}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="update-notes-section">
                      <h4>Latest Changes</h4>
                      <ul className="update-list">
                        {game.updateNotes.map((note, i) => (
                          <li key={i}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {isExpanded && game.isInstalled && (
                  <div className="card-expanded animate-vortex-in">
                    <div className="installed-actions">
                      <button className="secondary-action">
                        ⚙️ Settings
                      </button>
                      <button className="secondary-action">
                        📁 Open Folder
                      </button>
                      <button className="secondary-action danger">
                        🗑️ Uninstall
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GameDownloadPortal;
