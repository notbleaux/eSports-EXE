import React from 'react';

function Header() {
  return (
    <header className="rotas-header">
      <div className="header-left">
        <a href="../index.html" className="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>Back to NJZ Central</span>
        </a>
      </div>
      
      <div className="header-center">
        <div className="hub-badge">
          <span className="hub-icon">◈</span>
          <span className="hub-name">ROTAS</span>
        </div>
      </div>
      
      <div className="header-right">
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span className="status-text">System Active</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
