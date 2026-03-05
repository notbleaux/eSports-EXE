/**
 * AISuggestions.jsx
 * Contextual recommendations based on user role
 * Reference: Landingi AI, Darkroom comparison
 */

import React, { useState, useCallback, useMemo } from 'react';
import { AI_SUGGESTIONS, getSuggestionsByRole } from '../data/ai-suggestions';
import { useIntersectionObserver, useLocalStorage } from '../hooks';
import '../styles/ai-suggestions.css';

// Priority indicator component
const PriorityIndicator = ({ priority }) => {
  const colors = {
    high: '#ff6b6b',
    medium: '#c9b037',
    low: '#7a7874'
  };
  
  return (
    <div 
      className={`priority-indicator ${priority}`}
      style={{ '--priority-color': colors[priority] }}
      title={`${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority`}
    >
      <span className="priority-dot" />
      <span className="priority-label">{priority}</span>
    </div>
  );
};

// Type icon component
const TypeIcon = ({ type }) => {
  const icons = {
    team: '👥',
    tournament: '🏆',
    training: '📚',
    analytics: '📊',
    recruitment: '🔍',
    schedule: '📅',
    scouting: '🎯',
    finance: '💰',
    resources: '📖',
    workshop: '🎓',
    data: '💾',
    report: '📄',
    visualization: '📈',
    collaboration: '🤝',
    event: '🎪',
    registration: '📝',
    broadcast: '📺',
    sponsors: '🤝',
    match: '⚔️',
    prediction: '🔮',
    community: '💬'
  };
  
  return <span className="type-icon">{icons[type] || '💡'}</span>;
};

// Suggestion card component
const SuggestionCard = ({ suggestion, index, onDismiss, onAction }) => {
  const [ref, isIntersecting] = useIntersectionObserver({ threshold: 0.3 });
  const [isDismissing, setIsDismissing] = useState(false);
  
  const handleDismiss = useCallback(() => {
    setIsDismissing(true);
    setTimeout(() => onDismiss(suggestion.id), 300);
  }, [suggestion.id, onDismiss]);
  
  const handleAction = useCallback(() => {
    onAction(suggestion);
  }, [suggestion, onAction]);
  
  return (
    <div
      ref={ref}
      className={`suggestion-card ${suggestion.priority} ${isIntersecting ? 'visible' : ''} ${isDismissing ? 'dismissing' : ''}`}
      style={{ '--card-delay': `${index * 100}ms` }}
    >
      <div className="card-glow" />
      
      <button className="card-dismiss" onClick={handleDismiss} title="Dismiss">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
      
      <div className="card-header">
        <TypeIcon type={suggestion.type} />
        <PriorityIndicator priority={suggestion.priority} />
      </div>
      
      <h4 className="card-title">{suggestion.title}</h4>
      <p className="card-description">{suggestion.description}</p>
      
      <button className="card-action" onClick={handleAction}>
        {suggestion.action}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

// Role selector component
const RoleSelector = ({ currentRole, onRoleChange }) => {
  const roles = Object.entries(AI_SUGGESTIONS.roles);
  
  return (
    <div className="role-selector">
      <span className="selector-label">I am a:</span>
      <div className="role-tabs">
        {roles.map(([key, role]) => (
          <button
            key={key}
            className={`role-tab ${currentRole === key ? 'active' : ''}`}
            onClick={() => onRoleChange(key)}
            title={role.description}
          >
            <span className="role-icon">{role.icon}</span>
            <span className="role-name">{role.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Empty state component
const EmptyState = ({ onReset }) => (
  <div className="suggestions-empty">
    <div className="empty-icon">✨</div>
    <h4>All caught up!</h4>
    <p>You've reviewed all suggestions for this role.</p>
    <button className="empty-reset" onClick={onReset}>
      Restore Suggestions
    </button>
  </div>);

// AI Thinking Animation
const AIThinking = () => (
  <div className="ai-thinking">
    <div className="thinking-dots">
      <span />
      <span />
      <span />
    </div>
    <span className="thinking-text">AI analyzing your preferences...</span>
  </div>);

// Main AI Suggestions Component
const AISuggestions = ({ 
  defaultRole = 'player',
  onSuggestionAction,
  showRoleSelector = true,
  maxSuggestions = null
}) => {
  const [currentRole, setCurrentRole] = useLocalStorage('njz-preferred-role', defaultRole);
  const [dismissedIds, setDismissedIds] = useLocalStorage('njz-dismissed-suggestions', []);
  const [isThinking, setIsThinking] = useState(false);
  const [sectionRef, isInView] = useIntersectionObserver({ threshold: 0.1 });
  
  // Get current role data
  const roleData = useMemo(() => getSuggestionsByRole(currentRole), [currentRole]);
  
  // Filter out dismissed suggestions
  const activeSuggestions = useMemo(() => {
    let suggestions = roleData.suggestions.filter(
      s => !dismissedIds.includes(s.id)
    );
    if (maxSuggestions) {
      suggestions = suggestions.slice(0, maxSuggestions);
    }
    return suggestions;
  }, [roleData.suggestions, dismissedIds, maxSuggestions]);
  
  // Handle role change with animation
  const handleRoleChange = useCallback((newRole) => {
    if (newRole === currentRole) return;
    setIsThinking(true);
    setTimeout(() => {
      setCurrentRole(newRole);
      setIsThinking(false);
    }, 600);
  }, [currentRole, setCurrentRole]);
  
  // Handle dismiss
  const handleDismiss = useCallback((id) => {
    setDismissedIds(prev => [...prev, id]);
  }, [setDismissedIds]);
  
  // Handle reset
  const handleReset = useCallback(() => {
    setDismissedIds([]);
  }, [setDismissedIds]);
  
  // Handle action
  const handleAction = useCallback((suggestion) => {
    onSuggestionAction?.(suggestion, currentRole);
  }, [onSuggestionAction, currentRole]);
  
  // Count by priority
  const priorityCounts = useMemo(() => {
    return activeSuggestions.reduce((acc, s) => {
      acc[s.priority] = (acc[s.priority] || 0) + 1;
      return acc;
    }, {});
  }, [activeSuggestions]);
  
  return (
    <div 
      ref={sectionRef}
      className={`ai-suggestions ${isInView ? 'in-view' : ''}`}
    >
      {/* Section header */}
      <div className="suggestions-header">
        <div className="header-title-group">
          <div className="ai-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
              <path d="M8.5 8.5v.01" />
              <path d="M16 15.5v.01" />
              <path d="M12 12v.01" />
              <path d="M11 17v.01" />
              <path d="M7 14v.01" />
            </svg>
            AI Powered
          </div>
          <h3 className="header-title">Personalized For You</h3>
          <p className="header-subtitle">
            {roleData.description}
          </p>
        </div>
        
        {/* Priority summary */}
        {activeSuggestions.length > 0 && (
          <div className="priority-summary">
            {priorityCounts.high > 0 && (
              <span className="summary-badge high">
                {priorityCounts.high} High Priority
              </span>
            )}
            {priorityCounts.medium > 0 && (
              <span className="summary-badge medium">
                {priorityCounts.medium} Medium
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Role selector */}
      {showRoleSelector && (
        <RoleSelector 
          currentRole={currentRole}
          onRoleChange={handleRoleChange}
        />
      )}
      
      {/* AI thinking state */}
      {isThinking && <AIThinking />}
      
      {/* Suggestions grid */}
      {!isThinking && (
        <>
          {activeSuggestions.length > 0 ? (
            <div className="suggestions-grid">
              {activeSuggestions.map((suggestion, index) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  index={index}
                  onDismiss={handleDismiss}
                  onAction={handleAction}
                />
              ))}
            </div>
          ) : (
            <EmptyState onReset={handleReset} />
          )}
        </>
      )}
      
      {/* Footer */}
      <div className="suggestions-footer">
        <p>
          Suggestions update based on your activity and preferences.
        </p>
      </div>
    </div>
  );
};

export default AISuggestions;
