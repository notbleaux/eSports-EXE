import React, { useState, useRef, useCallback } from 'react';
import './ComponentLibrary.css';

/**
 * ComponentLibrary - Osmo-style drag-and-drop analytics modules
 * 
 * Features:
 * - Draggable module cards
 * - Analytics widgets (metrics, charts, stats)
 * - Drag and drop to dashboard
 * - Glassmorphism styling
 * - Module categories
 */

const MODULE_CATEGORIES = {
  metrics: {
    name: 'Metrics',
    color: '#00f0ff',
    icon: '📊',
  },
  charts: {
    name: 'Charts',
    color: '#c9b037',
    icon: '📈',
  },
  analytics: {
    name: 'Analytics',
    color: '#ff6b6b',
    icon: '🔮',
  },
  tools: {
    name: 'Tools',
    color: '#10b981',
    icon: '🛠️',
  },
};

const ANALYTICS_MODULES = [
  {
    id: 'probability-gauge',
    name: 'Probability Gauge',
    category: 'metrics',
    description: 'Real-time probability visualization',
    icon: '◯',
    color: '#00f0ff',
    size: { w: 2, h: 2 },
  },
  {
    id: 'match-predictor',
    name: 'Match Predictor',
    category: 'analytics',
    description: 'Monte Carlo match simulation',
    icon: '⚡',
    color: '#c9b037',
    size: { w: 3, h: 2 },
  },
  {
    id: 'win-rate-chart',
    name: 'Win Rate Chart',
    category: 'charts',
    description: 'Historical win rate trends',
    icon: '📈',
    color: '#10b981',
    size: { w: 3, h: 2 },
  },
  {
    id: 'player-stats',
    name: 'Player Stats',
    category: 'metrics',
    description: 'Individual player metrics',
    icon: '👤',
    color: '#8b5cf6',
    size: { w: 2, h: 3 },
  },
  {
    id: 'team-comparison',
    name: 'Team Comparison',
    category: 'analytics',
    description: 'Side-by-side team analysis',
    icon: '⚔️',
    color: '#ff6b6b',
    size: { w: 3, h: 2 },
  },
  {
    id: 'tournament-bracket',
    name: 'Tournament Bracket',
    category: 'charts',
    description: 'Interactive bracket view',
    icon: '🏆',
    color: '#f59e0b',
    size: { w: 4, h: 3 },
  },
  {
    id: 'roi-calculator',
    name: 'ROI Calculator',
    category: 'tools',
    description: 'Investment return estimator',
    icon: '💰',
    color: '#10b981',
    size: { w: 2, h: 2 },
  },
  {
    id: 'risk-assessment',
    name: 'Risk Assessment',
    category: 'analytics',
    description: 'Portfolio risk analysis',
    icon: '⚠️',
    color: '#ef4444',
    size: { w: 2, h: 2 },
  },
  {
    id: 'live-odds',
    name: 'Live Odds',
    category: 'metrics',
    description: 'Real-time betting odds',
    icon: '🔴',
    color: '#00f0ff',
    size: { w: 2, h: 1 },
  },
  {
    id: 'heat-map',
    name: 'Heat Map',
    category: 'charts',
    description: 'Performance density map',
    icon: '🔥',
    color: '#f97316',
    size: { w: 3, h: 3 },
  },
];

function ComponentLibrary({ 
  onModuleAdd,
  onModuleDragStart,
  onModuleDragEnd,
  className = '',
  collapsed = false,
  onToggleCollapse,
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedModule, setDraggedModule] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const libraryRef = useRef(null);

  // Filter modules
  const filteredModules = ANALYTICS_MODULES.filter(module => {
    const matchesCategory = activeCategory === 'all' || module.category === activeCategory;
    const matchesSearch = module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle drag start
  const handleDragStart = (e, module) => {
    setDraggedModule(module);
    onModuleDragStart?.(module);
    
    // Create custom drag image
    const dragImage = document.createElement('div');
    dragImage.className = 'drag-preview';
    dragImage.innerHTML = `
      <div style="
        background: rgba(10, 10, 15, 0.9);
        border: 2px solid ${module.color};
        border-radius: 12px;
        padding: 1rem;
        color: ${module.color};
        font-family: Space Grotesk;
        display: flex;
        align-items: center;
        gap: 0.75rem;
      ">
        <span style="font-size: 1.5rem;">${module.icon}</span>
        <span style="font-weight: 600;">${module.name}</span>
      </div>
    `;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Remove after drag
    setTimeout(() => document.body.removeChild(dragImage), 0);
    
    e.dataTransfer.setData('module', JSON.stringify(module));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedModule(null);
    onModuleDragEnd?.();
  };

  // Handle module click (add directly)
  const handleModuleClick = (module) => {
    onModuleAdd?.(module);
  };

  return (
    <div 
      ref={libraryRef}
      className={`component-library ${collapsed ? 'collapsed' : ''} ${className}`}
    >
      {/* Header */}
      <div className="library-header">
        <div className="library-title">
          <span className="library-icon">📦</span>
          <span>Component Library</span>
        </div>
        <button 
          className="collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Search */}
          <div className="library-search">
            <input
              type="text"
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          {/* Category Tabs */}
          <div className="category-tabs">
            <button
              className={`category-tab ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              All
            </button>
            {Object.entries(MODULE_CATEGORIES).map(([key, category]) => (
              <button
                key={key}
                className={`category-tab ${activeCategory === key ? 'active' : ''}`}
                onClick={() => setActiveCategory(key)}
                style={{ '--category-color': category.color }}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>

          {/* Module Grid */}
          <div className="module-grid">
            {filteredModules.map((module) => (
              <div
                key={module.id}
                className={`module-card ${draggedModule?.id === module.id ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, module)}
                onDragEnd={handleDragEnd}
                onClick={() => handleModuleClick(module)}
                style={{ 
                  '--module-color': module.color,
                  '--module-w': module.size.w,
                  '--module-h': module.size.h,
                }}
              >
                <div className="module-header">
                  <span className="module-icon">{module.icon}</span>
                  <div className="module-category-badge" style={{ background: module.color }}>
                    {MODULE_CATEGORIES[module.category]?.name.slice(0, 3)}
                  </div>
                </div>
                
                <div className="module-body">
                  <span className="module-name">{module.name}</span>
                  <span className="module-desc">{module.description}</span>
                </div>
                
                <div className="module-footer">
                  <span className="module-size">
                    {module.size.w}×{module.size.h}
                  </span>
                  <button className="module-add-btn">+</button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredModules.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">🔍</span>
              <span>No modules found</span>
            </div>
          )}

          {/* Footer */}
          <div className="library-footer">
            <span>{filteredModules.length} modules available</span>
            <span className="drag-hint">Drag to dashboard →</span>
          </div>
        </>
      )}
    </div>
  );
}

export default ComponentLibrary;
