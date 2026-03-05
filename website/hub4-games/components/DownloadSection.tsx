export function DownloadSection() {
  const downloads = [
    {
      id: 1,
      name: 'NJZ Manager 2024',
      version: 'v2.1.4',
      size: '4.2 GB',
      platform: 'Windows',
      icon: '🎮',
      description: 'Full eSports management simulation with SATOR/ROTAS integration'
    },
    {
      id: 2,
      name: 'NJZ Manager 2024',
      version: 'v2.1.4',
      size: '3.8 GB',
      platform: 'macOS',
      icon: '🎮',
      description: 'Native macOS build with Apple Silicon support'
    },
    {
      id: 3,
      name: 'NJZ Lite',
      version: 'v1.5.0',
      size: '847 MB',
      platform: 'Web',
      icon: '🌐',
      description: 'Browser-based lightweight version'
    }
  ];
  
  return (
    <section className="download-section">
      <h2>Download NJZ Manager</h2>
      <p>Offline eSports Management Simulation Strategy Game</p>
      
      <div className="download-cards">
        {downloads.map(game => (
          <div key={game.id} className="download-card">
            <div className="platform-icon">{game.icon}</div>
            <h3>{game.name}</h3>
            <span className="version">{game.version}</span>
            <p className="description">{game.description}</p>
            <div className="download-meta">
              <span className="size">{game.size}</span>
              <span className="platform">{game.platform}</span>
            </div>
            <button className="btn btn-primary btn-download">
              Download for {game.platform}
            </button>
          </div>
        ))}
      </div>
      
      <div className="system-requirements">
        <h4>System Requirements</h4>
        <div className="specs">
          <div>
            <span>OS:</span> Windows 10/11, macOS 12+
          </div>
          <div>
            <span>CPU:</span> Intel i5 / AMD Ryzen 5
          </div>
          <div>
            <span>RAM:</span> 8 GB
          </div>
          <div>
            <span>Storage:</span> 10 GB
          </div>
        </div>
      </div>
    </section>
  );
}
