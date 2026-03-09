'use client';

import { useState } from 'react';
import { usePlatformDetection, useDownloadManager } from '@/hooks/usePlatformDetection';

interface DownloadItem {
  id: number;
  name: string;
  version: string;
  size: string;
  platform: 'Windows' | 'macOS' | 'Web' | 'Linux';
  icon: string;
  description: string;
  fileSizeMB: number;
  requirements: {
    os: string;
    cpu: string;
    ram: string;
    storage: string;
    gpu?: string;
  };
}

const downloads: DownloadItem[] = [
  {
    id: 1,
    name: 'NJZ Manager 2024',
    version: 'v2.1.4',
    size: '4.2 GB',
    platform: 'Windows',
    icon: '🎮',
    description: 'Full eSports management simulation with SATOR/ROTAS integration',
    fileSizeMB: 4200,
    requirements: {
      os: 'Windows 10/11 (64-bit)',
      cpu: 'Intel i5-8400 / AMD Ryzen 5 2600',
      ram: '8 GB RAM',
      storage: '10 GB available space',
      gpu: 'GTX 1060 / RX 580 (optional)'
    }
  },
  {
    id: 2,
    name: 'NJZ Manager 2024',
    version: 'v2.1.4',
    size: '3.8 GB',
    platform: 'macOS',
    icon: '🎮',
    description: 'Native macOS build with Apple Silicon support',
    fileSizeMB: 3800,
    requirements: {
      os: 'macOS 12+ (Monterey or later)',
      cpu: 'Apple M1 or Intel i5',
      ram: '8 GB RAM',
      storage: '10 GB available space'
    }
  },
  {
    id: 3,
    name: 'NJZ Lite',
    version: 'v1.5.0',
    size: '847 MB',
    platform: 'Web',
    icon: '🌐',
    description: 'Browser-based lightweight version - no installation required',
    fileSizeMB: 847,
    requirements: {
      os: 'Any modern browser',
      cpu: 'Any',
      ram: '4 GB RAM',
      storage: 'No installation needed'
    }
  }
];

export function DownloadSection() {
  const { platform: detectedPlatform, isMobile } = usePlatformDetection();
  const { downloadState, startDownload, pauseDownload, resetDownload } = useDownloadManager();
  const [activeDownloadId, setActiveDownloadId] = useState<number | null>(null);
  const [expandedReqs, setExpandedReqs] = useState<number | null>(null);
  const [showResumeInfo, setShowResumeInfo] = useState<number | null>(null);

  const handleDownload = (item: DownloadItem) => {
    if (downloadState.isDownloading) {
      pauseDownload();
      return;
    }
    
    if (downloadState.progress >= 100) {
      resetDownload();
      return;
    }

    setActiveDownloadId(item.id);
    startDownload(item.fileSizeMB);
  };

  const isRecommended = (item: DownloadItem) => {
    if (detectedPlatform === 'unknown') return false;
    return item.platform === detectedPlatform;
  };

  return (
    <section className="download-section" id="download">
      <h2>Download NJZ Manager</h2>
      <p>Offline eSports Management Simulation Strategy Game</p>
      
      {detectedPlatform !== 'unknown' && (
        <div className="platform-detection-banner">
          <span className="detection-icon">🔍</span>
          <span>We detected you're using <strong>{detectedPlatform}</strong></span>
          <span className="detection-hint">Recommended version highlighted below</span>
        </div>
      )}

      <div className="download-cards">
        {downloads.map(item => {
          const isActive = activeDownloadId === item.id;
          const isItemDownloading = isActive && downloadState.isDownloading;
          const isItemPaused = isActive && downloadState.paused;
          const isItemComplete = isActive && downloadState.progress >= 100;
          const recommended = isRecommended(item);

          return (
            <div 
              key={item.id} 
              className={`download-card ${recommended ? 'recommended' : ''}`}
            >
              {recommended && <div className="recommended-badge">Recommended</div>}
              
              <div className="platform-icon">{item.icon}</div>
              <h3>{item.name}</h3>
              <span className="version">{item.version}</span>
              <p className="description">{item.description}</p>
              
              <div className="download-meta">
                <span className="size">{item.size}</span>
                <span className="platform">{item.platform}</span>
              </div>

              {/* Download Progress Indicator */}
              {isActive && (downloadState.isDownloading || downloadState.progress > 0) && (
                <div className="download-progress-container">
                  <div className="progress-bar-bg">
                    <div 
                      className="progress-bar-fill"
                      style={{ width: `${downloadState.progress}%` }}
                    >
                      <div className="progress-shimmer"></div>
                    </div>
                  </div>
                  <div className="progress-details">
                    <span className="progress-percent">{Math.round(downloadState.progress)}%</span>
                    <span className="progress-speed">{downloadState.speed}</span>
                    <span className="progress-time">{downloadState.timeRemaining}</span>
                  </div>
                  
                  {isItemPaused && (
                    <div className="resume-info">
                      <span className="resume-icon">⏸️</span>
                      Download paused - click resume to continue
                    </div>
                  )}
                </div>
              )}

              <button 
                className={`btn btn-primary btn-download ${isMobile ? 'btn-full-width' : ''} ${isItemDownloading ? 'downloading' : ''} ${isItemComplete ? 'complete' : ''}`}
                onClick={() => handleDownload(item)}
              >
                {isItemComplete ? (
                  <>✓ Open Installer</>
                ) : isItemDownloading ? (
                  <>⏸ Pause Download</>
                ) : isItemPaused ? (
                  <>▶ Resume Download</>
                ) : downloadState.progress > 0 && isActive ? (
                  <>🔄 Restart Download</>
                ) : (
                  <>⬇ Download for {item.platform}</>
                )}
              </button>

              {/* Resume Support Info */}
              <button 
                className="resume-info-toggle"
                onClick={() => setShowResumeInfo(showResumeInfo === item.id ? null : item.id)}
              >
                💾 Resume support available {showResumeInfo === item.id ? '▲' : '▼'}
              </button>
              
              {showResumeInfo === item.id && (
                <div className="resume-details">
                  <p>✓ Downloads auto-resume if connection is lost</p>
                  <p>✓ Checksum verification ensures file integrity</p>
                  <p>✓ Supports download managers (IDM, aria2)</p>
                </div>
              )}

              {/* System Requirements Accordion */}
              <div className="requirements-accordion">
                <button 
                  className="accordion-trigger"
                  onClick={() => setExpandedReqs(expandedReqs === item.id ? null : item.id)}
                >
                  <span>🖥️ System Requirements</span>
                  <span className={`accordion-icon ${expandedReqs === item.id ? 'expanded' : ''}`}></span>
                </button>
                
                {expandedReqs === item.id && (
                  <div className="accordion-content">
                    <div className="req-item">
                      <span className="req-label">OS</span>
                      <span className="req-value">{item.requirements.os}</span>
                    </div>
                    <div className="req-item">
                      <span className="req-label">CPU</span>
                      <span className="req-value">{item.requirements.cpu}</span>
                    </div>
                    <div className="req-item">
                      <span className="req-label">RAM</span>
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
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
