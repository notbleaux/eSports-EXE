import React from 'react';

function FormulaLibrary() {
  const formulas = [
    { id: 1, name: 'SimRating™', version: '2.4.1', status: 'active', category: 'Core' },
    { id: 2, name: 'RAR', version: '1.8.0', status: 'active', category: 'Talent' },
    { id: 3, name: 'Investment Grade', version: '3.0.2', status: 'beta', category: 'Finance' },
    { id: 4, name: 'Monte Carlo Sim', version: '4.1.0', status: 'active', category: 'Simulation' },
    { id: 5, name: 'Risk Adjusted Return', version: '2.0.1', status: 'active', category: 'Finance' },
    { id: 6, name: 'Sentiment Index', version: '1.5.0-beta', status: 'beta', category: 'Analytics' },
  ];

  const getStatusClass = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'beta': return 'status-beta';
      case 'deprecated': return 'status-deprecated';
      default: return 'status-active';
    }
  };

  return (
    <div className="formula-library">
      <div className="library-header">
        <h2 className="library-title">Formula Library</h2>
        <div className="library-stats">
          <span className="stat">
            <span className="stat-dot active"></span>
            {formulas.filter(f => f.status === 'active').length} Active
          </span>
          <span className="stat">
            <span className="stat-dot beta"></span>
            {formulas.filter(f => f.status === 'beta').length} Beta
          </span>
        </div>
      </div>
      
      <div className="formula-list">
        {formulas.map((formula) => (
          <div key={formula.id} className="formula-item">
            <div className="formula-main">
              <span className="formula-name">{formula.name}</span>
              <span className="formula-category">{formula.category}</span>
            </div>
            
            <div className="formula-meta">
              <span className="formula-version">v{formula.version}</span>
              <span className={`formula-status ${getStatusClass(formula.status)}`}>
                {formula.status}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="library-actions">
        <button className="library-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export Formulas
        </button>
        <button className="library-btn secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          Add Formula
        </button>
      </div>
    </div>
  );
}

export default FormulaLibrary;
