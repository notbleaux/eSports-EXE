'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type DownloadPlatform = 'windows' | 'macos' | 'linux' | 'web';

export type DownloadItem = {
  id: string;
  name: string;
  version: string;
  platform: DownloadPlatform;
  size: string;
  sizeMB: number;
  icon: string;
  description: string;
  requirements: {
    os: string;
    cpu: string;
    ram: string;
    storage: string;
    gpu?: string;
  };
  checksum: string;
  releaseDate: string;
  featured?: boolean;
};

const DOWNLOADS: DownloadItem[] = [
  {
    id: 'njz-windows',
    name: 'NJZ Manager 2024',
    version: 'v2.1.4',
    platform: 'windows',
    size: '4.2 GB',
    sizeMB: 4200,
    icon: '🪟',
    description: 'Full eSports management simulation with SATOR/ROTAS integration and DirectX 12 support',
    requirements: {
      os: 'Windows 10/11 (64-bit)',
      cpu: 'Intel i5-8400 / AMD Ryzen 5 2600',
      ram: '8 GB RAM',
      storage: '10 GB available space',
      gpu: 'GTX 1060 / RX 580 (optional)'
    },
    checksum: 'sha256:a3f5c8...',
    releaseDate: '2024-03-01',
    featured: true
  },
  {
    id: 'njz-macos',
    name: 'NJZ Manager 2024',
    version: 'v2.1.4',
    platform: 'macos',
    size: '3.8 GB',
    sizeMB: 3800,
    icon: '🍎',
    description: 'Native macOS build with Apple Silicon optimization and Metal graphics',
    requirements: {
      os: 'macOS 12+ (Monterey)',
      cpu: 'Apple M1 or Intel i5',
      ram: '8 GB RAM',
      storage: '10 GB available space'
    },
    checksum: 'sha256:b7e9d2...',
    releaseDate: '2024-03-01'
  },
  {
    id: 'njz-linux',
    name: 'NJZ Manager 2024',
    version: 'v2.1.4',
    platform: 'linux',
    size: '4.0 GB',
    sizeMB: 4000,
    icon: '🐧',
    description: 'Steam Deck verified with Vulkan support and Proton compatibility',
    requirements: {
      os: 'Ubuntu 20.04+ / SteamOS 3.0',
      cpu: 'Intel i5-8400 / AMD Ryzen 5',
      ram: '8 GB RAM',
      storage: '10 GB available space',
      gpu: 'Vulkan 1.2 compatible'
    },
    checksum: 'sha256:c1f8a9...',
    releaseDate: '2024-03-01'
  },
  {
    id: 'njz-web',
    name: 'NJZ Lite',
    version: 'v1.5.0',
    platform: 'web',
    size: '847 MB',
    sizeMB: 847,
    icon: '🌐',
    description: 'Browser-based lightweight version with cloud saves - no installation required',
    requirements: {
      os: 'Chrome 110+ / Firefox 120+ / Safari 17+',
      cpu: 'Any modern processor',
      ram: '4 GB RAM',
      storage: 'No installation needed'
    },
    checksum: 'sha256:d2e7b4...',
    releaseDate: '2024-02-15'
  }
];

// === ABYSSAL GLASS PANEL ===
function GlassPanel({ 
  children, 
  className = '',
  glowColor = 'rgba(0, 240, 255, 0.1)'
}: { 
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}) {
  return (
    <div 
      className={`glass-panel ${className}`}
      style={{ ['--glow-color']: glowColor }}
    >
      <div className="glass-border">
        <div className="glass-border-top" />
        <div className="glass-border-right" />
        <div className="glass-border-bottom" />
        <div className="glass-border-left" />
      </div>
      <div className="glass-content">
        {children}
      </div>
      <div className="glass-shine" />
    </div>
  );
}

// === DOWNLOAD PROGRESS ===
function DownloadProgress({ 
  progress, 
  speed, 
  timeRemaining,
  status,
  onPause,
  onResume,
  onCancel
}: {
  progress: number;
  speed: string;
  timeRemaining: string;
  status: 'downloading' | 'paused' | 'complete' | 'error';
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="download-progress">
      <div className="progress-track">
        <div 
          className="progress-fill"
          style={{ width: `${progress}%` }}
        >
          <div className="progress-shimmer" />
        </div>
      </div>
      
      <div className="progress-info">
        <span className="progress-percent">{Math.round(progress)}%</span>
        <span className="progress-speed">{speed}</span>
        <span className="progress-time">{timeRemaining}</span>
      </div>
      
      <div className="progress-actions">
        {status === 'downloading' ? (
          <button className="action-btn pause" onClick={onPause}>⏸ Pause</button>
        ) : status === 'paused' ? (
          <button className="action-btn resume" onClick={onResume}>▶ Resume</button>
        ) : null}
        <button className="action-btn cancel" onClick={onCancel}>✕ Cancel</button>
      </div>
      
      {status === 'paused' && (
        <div className="pause-notice">
          <span>⏸ Download paused - will resume automatically</span>
        </div>
      )}
    </div>
  );
}

// === DOWNLOAD CARD ===
function DownloadCard({ 
  item, 
  isActive,
  isDownloading,
  progress,
  onDownload,
  onExpand
}: {
  item: DownloadItem;
  isActive: boolean;
  isDownloading: boolean;
  progress: { percent: number; speed: string; time: string; status: string };
  onDownload: () => void;
  onExpand: () => void;
}) {
  const platformColors = {
    windows: { primary: '#00a4ef', glow: 'rgba(0, 164, 239, 0.3)' },
    macos: { primary: '#a2aaad', glow: 'rgba(162, 170, 173, 0.3)' },
    linux: { primary: '#fcc624', glow: 'rgba(252, 198, 36, 0.3)' },
    web: { primary: '#00f0ff', glow: 'rgba(0, 240, 255, 0.3)' }
  };

  const colors = platformColors[item.platform];

  return (
    <GlassPanel 
      className={`download-card ${isActive ? 'active' : ''} ${item.featured ? 'featured' : ''}`}
      glowColor={colors.glow}
    >
      {item.featured && (
        <div className="featured-badge">
          <span>⭐ Recommended</span>
        </div>
      )}
      
      <div className="card-header">
        <div 
          className="platform-icon"
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary}20, transparent)`,
            borderColor: colors.primary
          }}
        >
          {item.icon}
        </div>
        <div className="version-tag">{item.version}</div>
      </div>
      
      <h3 className="card-title">{item.name}</h3>
      <p className="card-description">{item.description}</p>
      
      <div className="card-meta">
        <span className="meta-item size">{item.size}</span>
        <span className="meta-item date">{item.releaseDate}</span>
      </div>
      
      {isDownloading ? (
        <DownloadProgress
          progress={progress.percent}
          speed={progress.speed}
          timeRemaining={progress.time}
          status={progress.status as any}
          onPause={() => {}}
          onResume={() => {}}
          onCancel={() => {}}
        />
      ) : (
        <button 
          className="download-btn"
          onClick={onDownload}
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primary}dd)`
          }}
        >
          <span>⬇ Download for {item.platform}</span>
        </button>
      )}
      
      <button className="expand-btn" onClick={onExpand}>
        <span>System Requirements</span>
        <span className={`expand-icon ${isActive ? 'expanded' : ''}`}>▼</span>
      </button>
      
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="requirements-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="req-section">
              <h4>Minimum Requirements</h4>
              <div className="req-grid">
                <div className="req-item">
                  <span className="req-label">OS</span>
                  <span className="req-value">{item.requirements.os}</span>
                </div>
                <div className="req-item">
                  <span className="req-label">Processor</span>
                  <span className="req-value">{item.requirements.cpu}</span>
                </div>
                <div className="req-item">
                  <span className="req-label">Memory</span>
                  <span className="req-value">{item.requirements.ram}</span>
                </div>
                <div className="req-item">
                  <span className="req-label">Storage</span>
                  <span className="req-value">{item.requirements.storage}</span>
                </div>
                {item.requirements.gpu && (
                  <div className="req-item">
                    <span className="req-label">Graphics</span>
                    <span className="req-value">{item.requirements.gpu}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="checksum">
              <span className="checksum-label">Checksum:</span>
              <code className="checksum-value">{item.checksum}</code>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassPanel>
  );
}

// === MAIN COMPONENT ===
export function GameDownloadPortal({ 
  className = '',
  onDownloadStart
}: { 
  className?: string;
  onDownloadStart?: (item: DownloadItem) => void;
}) {
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState({
    percent: 0,
    speed: '0 MB/s',
    time: 'Calculating...',
    status: 'downloading'
  });

  const handleDownload = (item: DownloadItem) => {
    setDownloadingId(item.id);
    onDownloadStart?.(item);
    
    // Simulate download progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setDownloadProgress(prev => ({ ...prev, status: 'complete' }));
      }
      
      const speed = (Math.random() * 20 + 10).toFixed(1);
      const remaining = Math.ceil((100 - progress) / 5);
      
      setDownloadProgress({
        percent: progress,
        speed: `${speed} MB/s`,
        time: remaining > 0 ? `${remaining}s remaining` : 'Complete',
        status: 'downloading'
      });
    }, 200);
  };

  return (
    <div className={`game-download-portal ${className}`}>
      <div className="portal-header">
        <h2>Download Portal</h2>
        <p>Choose your platform and begin the journey</p>
      </div>
      
      <div className="download-grid">
        {DOWNLOADS.map((item) => (
          <DownloadCard
            key={item.id}
            item={item}
            isActive={activeCard === item.id}
            isDownloading={downloadingId === item.id}
            progress={downloadProgress}
            onDownload={() => handleDownload(item)}
            onExpand={() => setActiveCard(activeCard === item.id ? null : item.id)}
          />
        ))}
      </div>
      
      <div className="portal-footer">
        <div className="feature-list">
          <div className="feature">
            <span className="feature-icon">💾</span>
            <span>Resume support</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🔒</span>
            <span>Verified checksums</span>
          </div>
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <span>Delta updates</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🌐</span>
            <span>CDN distributed</span>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .game-download-portal {
          padding: 40px;
          background: linear-gradient(180deg, 
            rgba(10, 22, 40, 0.4) 0%, 
            rgba(5, 5, 8, 0.8) 100%);
          border-radius: 24px;
        }
        
        .portal-header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .portal-header h2 {
          font-family: var(--font-header);
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 8px;
          background: linear-gradient(135deg, var(--njz-porcelain), #00f0ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .portal-header p {
          color: var(--njz-gray-500);
          font-size: 0.875rem;
        }
        
        /* Glass Panel Styles */
        .glass-panel {
          position: relative;
          background: linear-gradient(135deg,
            rgba(13, 17, 23, 0.9) 0%,
            rgba(10, 22, 40, 0.8) 100%);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.4s ease;
        }
        
        .glass-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at top right, var(--glow-color), transparent 60%);
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        
        .glass-panel:hover::before,
        .glass-panel.active::before {
          opacity: 1;
        }
        
        .glass-border {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        
        .glass-border > div {
          position: absolute;
          background: linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.3), transparent);
        }
        
        .glass-border-top,
        .glass-border-bottom {
          height: 1px;
          left: 10%;
          right: 10%;
        }
        
        .glass-border-top { top: 0; }
        .glass-border-bottom { bottom: 0; }
        
        .glass-border-left,
        .glass-border-right {
          width: 1px;
          top: 10%;
          bottom: 10%;
        }
        
        .glass-border-left { left: 0; }
        .glass-border-right { right: 0; }
        
        .glass-content {
          position: relative;
          z-index: 1;
          padding: 24px;
        }
        
        .glass-shine {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 40%,
            rgba(255, 255, 255, 0.03) 50%,
            transparent 60%
          );
          animation: shine 6s ease-in-out infinite;
          pointer-events: none;
        }
        
        @keyframes shine {
          0%, 100% { transform: translateX(-100%) rotate(45deg); }
          50% { transform: translateX(100%) rotate(45deg); }
        }
        
        /* Download Grid */
        .download-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }
        
        /* Download Card */
        .download-card {
          position: relative;
        }
        
        .download-card.featured {
          border: 1px solid rgba(0, 240, 255, 0.3);
          box-shadow: 0 0 40px rgba(0, 240, 255, 0.1);
        }
        
        .featured-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 2;
        }
        
        .featured-badge span {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: linear-gradient(135deg, #ffd700, #ff9f1c);
          border-radius: 20px;
          font-size: 0.625rem;
          font-weight: 600;
          color: var(--nexus-void);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        
        .platform-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          border-radius: 12px;
          border: 1px solid;
        }
        
        .version-tag {
          padding: 4px 10px;
          background: rgba(0, 240, 255, 0.1);
          border-radius: 12px;
          font-family: var(--font-data);
          font-size: 0.625rem;
          color: #00f0ff;
        }
        
        .card-title {
          font-family: var(--font-header);
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--njz-porcelain);
        }
        
        .card-description {
          font-size: 0.8125rem;
          color: var(--njz-gray-500);
          line-height: 1.5;
          margin-bottom: 16px;
        }
        
        .card-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
        }
        
        .meta-item {
          font-family: var(--font-data);
          font-size: 0.75rem;
          color: var(--njz-gray-600);
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
        }
        
        .meta-item.size {
          color: #00f0ff;
        }
        
        .download-btn {
          width: 100%;
          padding: 14px 20px;
          border: none;
          border-radius: 10px;
          font-family: var(--font-header);
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--nexus-void);
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .download-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
        
        .expand-btn {
          width: 100%;
          margin-top: 12px;
          padding: 10px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: var(--njz-gray-500);
          font-size: 0.75rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
        }
        
        .expand-btn:hover {
          border-color: rgba(255, 255, 255, 0.2);
          color: var(--njz-porcelain);
        }
        
        .expand-icon {
          transition: transform 0.3s ease;
        }
        
        .expand-icon.expanded {
          transform: rotate(180deg);
        }
        
        /* Download Progress */
        .download-progress {
          margin-bottom: 16px;
        }
        
        .progress-track {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 12px;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00f0ff, #8338ec);
          border-radius: 3px;
          position: relative;
          transition: width 0.3s ease;
        }
        
        .progress-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          animation: shimmer 1.5s infinite;
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .progress-info {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-data);
          font-size: 0.75rem;
          margin-bottom: 12px;
        }
        
        .progress-percent {
          color: #00f0ff;
          font-weight: 600;
        }
        
        .progress-speed {
          color: var(--njz-gray-500);
        }
        
        .progress-time {
          color: var(--njz-gray-600);
        }
        
        .progress-actions {
          display: flex;
          gap: 8px;
        }
        
        .action-btn {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--njz-porcelain);
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .action-btn.pause:hover {
          border-color: #f59e0b;
          color: #f59e0b;
        }
        
        .action-btn.resume {
          border-color: #10b981;
          color: #10b981;
        }
        
        .action-btn.cancel:hover {
          border-color: #ef4444;
          color: #ef4444;
        }
        
        .pause-notice {
          margin-top: 12px;
          padding: 10px;
          background: rgba(245, 158, 11, 0.1);
          border-radius: 6px;
          font-size: 0.75rem;
          color: #f59e0b;
          text-align: center;
        }
        
        /* Requirements Panel */
        .requirements-panel {
          overflow: hidden;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .req-section h4 {
          font-family: var(--font-header);
          font-size: 0.75rem;
          color: var(--njz-gray-500);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 12px;
        }
        
        .req-grid {
          display: grid;
          gap: 10px;
        }
        
        .req-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
        }
        
        .req-label {
          font-size: 0.6875rem;
          color: var(--njz-gray-600);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .req-value {
          font-size: 0.75rem;
          color: var(--njz-gray-400);
          text-align: right;
          max-width: 60%;
        }
        
        .checksum {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.6875rem;
        }
        
        .checksum-label {
          color: var(--njz-gray-600);
        }
        
        .checksum-value {
          color: var(--njz-gray-500);
          font-family: var(--font-data);
        }
        
        /* Portal Footer */
        .portal-footer {
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .feature-list {
          display: flex;
          justify-content: center;
          gap: 32px;
          flex-wrap: wrap;
        }
        
        .feature {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          color: var(--njz-gray-500);
        }
        
        .feature-icon {
          font-size: 1rem;
        }
        
        @media (max-width: 768px) {
          .game-download-portal {
            padding: 24px;
          }
          
          .download-grid {
            grid-template-columns: 1fr;
          }
          
          .feature-list {
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}

export default GameDownloadPortal;
