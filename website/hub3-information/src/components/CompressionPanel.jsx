import { useState } from 'react';
import { compressionPackages } from '../data/zones';

function CompressionPanel() {
  const [downloading, setDownloading] = useState(null);

  const handleDownload = (id) => {
    setDownloading(id);
    setTimeout(() => {
      setDownloading(null);
    }, 2000);
  };

  return (
    <section id="compression" className="compression-section">
      <div className="section-header">
        <h2 className="section-title">File Compression Center</h2>
        <p className="section-subtitle">Optimized data packages for your tier</p>
      </div>
      
      <div className="compression-grid">
        {compressionPackages.map(pkg => (
          <div key={pkg.id} className="compression-card">
            <div className="compression-icon">{pkg.icon}</div>
            <div className="compression-content">
              <h4>{pkg.name}</h4>
              <p className="compression-size">
                <span className="original">{pkg.originalSize}</span>
                <span className="arrow">→</span>
                <span className="compressed">{pkg.compressedSize}</span>
              </p>
              <span className="compression-ratio">{pkg.ratio} smaller</span>
            </div>
            <button 
              className={`btn btn-sm ${downloading === pkg.id ? 'downloading' : ''}`}
              onClick={() => handleDownload(pkg.id)}
              disabled={downloading === pkg.id}
            >
              {downloading === pkg.id ? '⏳ Downloading...' : 'Download'}
            </button>
          </div>
        ))}
      </div>

      <div className="compression-stats">
        <div className="stat-item">
          <span className="stat-value">847 TB</span>
          <span className="stat-label">Total Compressed</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">67%</span>
          <span className="stat-label">Avg. Compression</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">2.4M</span>
          <span className="stat-label">Downloads</span>
        </div>
      </div>
    </section>
  );
}

export default CompressionPanel;