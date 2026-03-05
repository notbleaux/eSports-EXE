/**
 * AISuggestions.jsx
 * Contextual recommendations based on user role
 * Reference: Phamily segmentation, personalized content
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useIntersectionObserver } from '../hooks';
import '../styles/ai-suggestions.css';

// Priority indicator colors
const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#ff9f1c',
  low: '#10b981'
};

// Type icons
const TYPE_ICONS = {
  team: '👥',
  tournament: '🏆',
  player: '🎮',
  training: '📚',
  analytics: '📊',
  recruitment: '🎯',
  schedule: '📅',
  scouting: '🔍',
  finance: '💰',
  data: '🗄️',
  report: '📈',
  visualization: '👁️',
  collaboration: '🤝',
  event: '🎪',
  registration: '📝',
  broadcast: '📡',
  sponsors: '💼',
  match: '⚔️',
  prediction: '🔮',
  community: '💬',
  resources: '📖',
  workshop: '🎓'
};

// Type gradients
const TYPE_GRADIENTS = {
  team: 'linear-gradient(135deg, rgba(78, 205, 196, 0.2) 0%, rgba(78, 205, 196, 0.05) 100%)',
  tournament: 'linear-gradient(135deg, rgba(201, 176, 55, 0.2) 0%, rgba(201, 176, 55, 0.05) 100%)',
  player: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(0, 240, 255, 0.05) 100%)',
  training: 'linear-gradient(135deg, rgba(155, 89, 182, 0.2) 0%, rgba(155, 89, 182, 0.05) 100%)',
  analytics: 'linear-gradient(135deg, rgba(52, 152, 219, 0.2) 0%, rgba(52, 152, 219, 0.05) 100%)',
  recruitment: 'linear-gradient(135deg, rgba(231, 76, 60, 0.2) 0%, rgba(231, 76, 60, 0.05) 100%)',
  schedule: 'linear-gradient(135deg, rgba(241, 196, 15, 0.2) 0%, rgba(241, 196, 15, 0.05) 100%)',
  scouting: 'linear-gradient(135deg, rgba(149, 165, 166, 0.2) 0%, rgba(149, 165, 166, 0.05) 100%)',
  finance: 'linear-gradient(135deg, rgba(46, 204, 113, 0.2) 0%, rgba(46, 204, 113, 0.05) 100%)',
  data: 'linear-gradient(135deg, rgba(52, 73, 94, 0.2) 0%, rgba(52, 73, 94, 0.05) 100%)',
  report: 'linear-gradient(135deg, rgba(155, 89, 182, 0.2) 0%, rgba(155, 89, 182, 0.05) 100%)',
  visualization: 'linear-gradient(135deg, rgba(52, 152, 219, 0.2) 0%, rgba(52, 152, 219, 0.05) 100%)',
  collaboration: 'linear-gradient(135deg, rgba(230, 126, 34, 0.2) 0%, rgba(230, 126, 34, 0.05) 100%)',
  event: 'linear-gradient(135deg, rgba(231, 76, 60, 0.2) 0%, rgba(231, 76, 60, 0.05) 100%)',
  registration: 'linear-gradient(135deg, rgba(149, 165, 166, 0.2) 0%, rgba(149, 165, 166, 0.05) 100%)',
  broadcast: 'linear-gradient(135deg, rgba(155, 89, 182, 0.2) 0%, rgba(155, 89, 182, 0.05) 100%)',
  sponsors: 'linear-gradient(135deg, rgba(46, 204, 113, 0.2) 0%, rgba(46, 204, 113, 0.05) 100%)',
  match: 'linear-gradient(135deg, rgba(231, 76, 60, 0.2) 0%, rgba(231, 76, 60, 0.05) 100%)',
  prediction: 'linear-gradient(135deg, rgba(241, 196, 15, 0.2) 0%, rgba(241, 196, 15, 0.05) 100%)',
  community: 'linear-gradient(135deg, rgba(52, 152, 219, 0.2) 0%, rgba(52, 152, 219, 0.05) 100%)',
  resources: 'linear-gradient(135deg, rgba(155, 89, 182, 0.2) 0%, rgba(155, 89, 182, 0.05) 100%)',
  workshop: 'linear-gradient(135deg, rgba(230, 126, 34, 0.2) 0%, rgba(230, 126, 34, 0.05) 100%)'
};

// Priority Badge Component
const PriorityBadge = ({ priority }) => {
  const colors = {
    high: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', label: 'High Priority' },
    medium: { bg: 'rgba(255, 159, 28, 0.15)', text: '#ff9f1c', label: 'Medium' },
    low: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', label: 'Low' }
  };
  
  const style = colors[priority] || colors.low;
  
  return (
    <span 
      className={`priority-badge ${priority}`}
      style={{ background: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  );
};

// Suggestion Card Component
const SuggestionCard = ({ suggestion, index, isVisible }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const handleDismiss = useCallback((e) => {
    e.stopPropagation();
    setIsDismissed(true);
  }, []);
  
  const handleAction = useCallback(() => {
    console.log('Action:', suggestion.action, 'for', suggestion.title);
  }, [suggestion]);
  
  if (isDismissed) return null;
  
  const icon = TYPE_ICONS[suggestion.type] || '💡';
  const gradient = TYPE_GRADIENTS[suggestion.type] || TYPE_GRADIENTS.analytics;
  
  return (
    <div 
      className={`suggestion-card ${isVisible ? 'visible' : ''} priority-${suggestion.priority}`}
      style={{ 
        '--card-gradient': gradient,
        '--card-index': index,
        animationDelay: `${index * 100}ms`
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="suggestion-card-glow" />
      
      <div className="suggestion-card-content">
        <div className="suggestion-card-header">
          <div className="suggestion-icon">{icon}</div>
          <PriorityBadge priority={suggestion.priority} />
          <button 
            className="suggestion-dismiss"
            onClick={handleDismiss}
            aria-label="Dismiss suggestion"
          >
            ×
          </button>
        </div>
        
        <h4 className="suggestion-title">{suggestion.title}</h4>
        <p className="suggestion-description">{suggestion.description}</p>
        
        <button 
          className="suggestion-action"
          onClick={handleAction}
        >
          {suggestion.action}
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
      
      {/* Decorative elements */}
      <div className="suggestion-decoration">
        <div className="deco-circle" />
        <div className="deco-line" />
      </div>
    </div>
  );
};

// Empty State Component
const EmptySuggestions = ({ role }) => (
  <div className="empty-suggestions">
    <div className="empty-icon">🎯</div>
    <h4>All Caught Up!</h4>
    <p>No new suggestions for {role.replace('_', ' ')} right now.</p>
    <button className="empty-refresh">
      Refresh Suggestions
    </button>
  </div>
);

// AI Insights Panel Component
const AIInsightsPanel = ({ suggestions }) => {
  const stats = useMemo(() => {
    const total = suggestions.length;
    const highPriority = suggestions.filter(s => s.priority === 'high').length;
    const types = suggestions.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {});
    
    return { total, highPriority, types };
  }, [suggestions]);
  
  const topTypes = useMemo(() => {
    return Object.entries(stats.types)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [stats.types]);
  
  return (
    <div className="ai-insights-panel">
      <div className="insights-header">
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <span>AI Insights</span>
      </div>
      
      <div className="insights-stats">
        <div className="insight-stat">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">Suggestions</span>
        </div>
        <div className="insight-stat highlight">
          <span className="stat-number">{stats.highPriority}</span>
          <span className="stat-label">High Priority</span>
        </div>
      </div>
      
      <div className="insights-types">
        <span className="types-label">Top Categories</span>
        <div className="types-list">
          {topTypes.map(([type, count]) => (
            <div key={type} className="type-item">
              <span className="type-icon">{TYPE_ICONS[type] || '💡'}</span>
              <span className="type-name">{type}</span>
              <span className="type-count">{count}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="insights-footer">
        <span>Powered by NJZ Intelligence</span>
      </div>
    </div>
  );
};

/**
 * Main AI Suggestions Component
 */
const AISuggestions = ({ suggestions = [], role = 'spectator' }) => {
  const [containerRef, isIntersecting, hasIntersected] = useIntersectionObserver({ threshold: 0.1 });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterPriority, setFilterPriority] = useState('all');
  
  // Filter suggestions
  const filteredSuggestions = useMemo(() => {
    let filtered = suggestions;
    
    if (filterPriority !== 'all') {
      filtered = filtered.filter(s => s.priority === filterPriority);
    }
    
    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [suggestions, filterPriority]);
  
  // Group suggestions by type for list view
  const groupedSuggestions = useMemo(() => {
    return filteredSuggestions.reduce((acc, suggestion) => {
      if (!acc[suggestion.type]) acc[suggestion.type] = [];
      acc[suggestion.type].push(suggestion);
      return acc;
    }, {});
  }, [filteredSuggestions]);
  
  if (suggestions.length === 0) {
    return <EmptySuggestions role={role} />;
  }
  
  return (
    <div ref={containerRef} className="ai-suggestions-container">
      {/* Controls */}
      <div className="suggestions-controls">
        <div className="filter-pills">
          {[
            { id: 'all', label: 'All', count: suggestions.length },
            { id: 'high', label: 'High Priority', count: suggestions.filter(s => s.priority === 'high').length },
            { id: 'medium', label: 'Medium', count: suggestions.filter(s => s.priority === 'medium').length },
            { id: 'low', label: 'Low', count: suggestions.filter(s => s.priority === 'low').length }
          ].map((filter) => (
            <button
              key={filter.id}
              className={`filter-pill ${filterPriority === filter.id ? 'active' : ''}`}
              onClick={() => setFilterPriority(filter.id)}
            >
              {filter.label}
              <span className="pill-count">{filter.count}</span>
            </button>
          ))}
        </div>
        
        <div className="view-toggle"
        >
          <button 
            className={viewMode === 'grid' ? 'active' : ''}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button 
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="suggestions-layout"
      >
        {/* Main Content */}
        <div className={`suggestions-content ${viewMode}`}
        >
          {viewMode === 'grid' ? (
            <div className="suggestions-grid"
            >
              {filteredSuggestions.map((suggestion, index) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  index={index}
                  isVisible={hasIntersected}
                />
              ))}
            </div>
          ) : (
            <div className="suggestions-list"
            >
              {Object.entries(groupedSuggestions).map(([type, items]) => (
                <div key={type} className="suggestion-group"
                >
                  <h5 className="group-header"
                  >
                    <span>{TYPE_ICONS[type] || '💡'}</span>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                    <span className="group-count">{items.length}</span>
                  </h5>
                  <div className="group-items"
                  >
                    {items.map((suggestion, index) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        index={index}
                        isVisible={hasIntersected}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Sidebar - AI Insights */}
        <aside className="suggestions-sidebar"
        >
          <AIInsightsPanel suggestions={filteredSuggestions} />
        </aside>
      </div>
    </div>
  );
};

export default AISuggestions;