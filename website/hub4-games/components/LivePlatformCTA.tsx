export function LivePlatformCTA() {
  return (
    <section className="live-cta-section">
      <div className="live-glow"></div>
      <div className="live-content">
        <span className="live-badge">● LIVE</span>
        <h2>NJZ ¿!? Live Platform</h2>
        <p>Compete in real-time tournaments. Connect your offline progress to the live ecosystem.</p>
        
        <div className="live-features">
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <span>Real-time Matches</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🏆</span>
            <span>Ranked Tournaments</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🌐</span>
            <span>Global Leaderboards</span>
          </div>
        </div>
        
        <button className="btn btn-live">
          Enter Live Platform →
        </button>
      </div>
    </section>
  );
}
