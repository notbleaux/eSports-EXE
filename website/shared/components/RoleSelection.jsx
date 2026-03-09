import React, { useState, useEffect } from 'react';
import { USER_ROLES, getRoleConfig, saveUserRole } from '../js/userPreferences';

/**
 * Role Selection Component
 * First-time user experience for choosing role path
 */
function RoleSelection({ onRoleSelect, className = '' }) {
  const [hoveredRole, setHoveredRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    setIsAnimating(true);
    
    // Save role and trigger callback with animation
    setTimeout(() => {
      saveUserRole(roleKey.toLowerCase());
      onRoleSelect?.(roleKey.toLowerCase());
    }, 600);
  };

  const roles = Object.entries(USER_ROLES);

  return (
    <div className={`role-selection ${className} ${isAnimating ? 'animating' : ''}`}>
      <div className="role-selection-header">
        <h2 className="role-title">I am a...</h2>
        <p className="role-subtitle">Choose your path to personalize your experience</p>
      </div>

      <div className="role-cards-container">
        {roles.map(([key, role], index) => (
          <button
            key={role.id}
            className={`role-card ${role.colorClass} ${selectedRole === key ? 'selected' : ''} ${hoveredRole === key ? 'hovered' : ''}`}
            style={{ animationDelay: `${index * 0.1}s` }}
            onMouseEnter={() => setHoveredRole(key)}
            onMouseLeave={() => setHoveredRole(null)}
            onClick={() => handleRoleSelect(key)}
            disabled={isAnimating}
          >
            <div className="role-card-glow" style={{ backgroundColor: role.color }} />
            <div className="role-card-content">
              <span className="role-icon">{role.icon}</span>
              <h3 className="role-name">{role.label}</h3>
              <p className="role-description">{role.description}</p>
              
              <div className="role-features-preview">
                <span className="role-preview-label">Highlights:</span>
                <div className="role-preview-items">
                  {role.shortcuts.slice(0, 2).map((shortcut, i) => (
                    <span key={i} className="role-preview-item">
                      {shortcut.replace('/', '')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="role-card-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
            
            <div className="role-selection-indicator" style={{ backgroundColor: role.color }} />
          </button>
        ))}
      </div>

      <div className="role-selection-footer">
        <p className="role-hint">
          <span className="role-hint-icon">💡</span>
          You can change this anytime in your profile settings
        </p>
      </div>

      <style jsx>{`
        .role-selection {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
          padding: 2rem;
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .role-selection-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .role-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: #e8e6e3;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #e8e6e3 0%, #9ca3af 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .role-subtitle {
          font-size: 1.125rem;
          color: #6b7280;
        }

        .role-cards-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .role-card {
          position: relative;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 2rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          animation: slideUp 0.5s ease backwards;
          display: flex;
          flex-direction: column;
          min-height: 280px;
        }

        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(30px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }

        .role-card-glow {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          opacity: 0;
          filter: blur(60px);
          transition: opacity 0.4s ease;
          pointer-events: none;
        }

        .role-card.hovered .role-card-glow,
        .role-card.selected .role-card-glow {
          opacity: 0.15;
        }

        .role-card-content {
          position: relative;
          z-index: 1;
          flex: 1;
        }

        .role-icon {
          display: block;
          font-size: 3rem;
          margin-bottom: 1rem;
          animation: bounce 2s ease infinite;
          animation-play-state: paused;
        }

        .role-card.hovered .role-icon,
        .role-card.selected .role-icon {
          animation-play-state: running;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .role-name {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          transition: color 0.3s ease;
        }

        .role-card.role-player .role-name {
          color: #22c55e;
        }

        .role-card.role-organizer .role-name {
          color: #f59e0b;
        }

        .role-card.role-spectator .role-name {
          color: #3b82f6;
        }

        .role-description {
          font-size: 0.9375rem;
          color: #9ca3af;
          line-height: 1.5;
          margin-bottom: 1.5rem;
        }

        .role-features-preview {
          margin-top: auto;
        }

        .role-preview-label {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 0.5rem;
        }

        .role-preview-items {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .role-preview-item {
          font-size: 0.75rem;
          padding: 0.25rem 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          color: #9ca3af;
          transition: all 0.2s ease;
        }

        .role-card.hovered .role-preview-item {
          background: rgba(255, 255, 255, 0.1);
        }

        .role-card-arrow {
          position: absolute;
          right: 1.5rem;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          opacity: 0;
          transform: translateY(-50%) translateX(-10px);
          transition: all 0.3s ease;
        }

        .role-card-arrow svg {
          width: 20px;
          height: 20px;
          color: #e8e6e3;
        }

        .role-card.hovered .role-card-arrow {
          opacity: 1;
          transform: translateY(-50%) translateX(0);
        }

        .role-selection-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          transform: scaleX(0);
          transition: transform 0.4s ease;
        }

        .role-card.hovered .role-selection-indicator,
        .role-card.selected .role-selection-indicator {
          transform: scaleX(1);
        }

        /* Hover states with role-specific colors */
        .role-card.role-player.hovered,
        .role-card.role-player.selected {
          border-color: rgba(34, 197, 94, 0.5);
          box-shadow: 0 0 40px rgba(34, 197, 94, 0.15);
        }

        .role-card.role-organizer.hovered,
        .role-card.role-organizer.selected {
          border-color: rgba(245, 158, 11, 0.5);
          box-shadow: 0 0 40px rgba(245, 158, 11, 0.15);
        }

        .role-card.role-spectator.hovered,
        .role-card.role-spectator.selected {
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 0 0 40px rgba(59, 130, 246, 0.15);
        }

        /* Selected state animation */
        .role-card.selected {
          transform: scale(0.98);
        }

        .role-card.selected .role-icon {
          animation: selectedPulse 0.6s ease;
        }

        @keyframes selectedPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        .role-selection-footer {
          text-align: center;
          margin-top: 2rem;
        }

        .role-hint {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
        }

        .role-hint-icon {
          font-size: 1rem;
        }

        /* Animating out state */
        .role-selection.animating .role-card:not(.selected) {
          opacity: 0;
          transform: scale(0.9);
          pointer-events: none;
        }

        .role-selection.animating .role-card.selected {
          transform: scale(1.05);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .role-selection {
            padding: 1rem;
          }

          .role-title {
            font-size: 1.75rem;
          }

          .role-cards-container {
            grid-template-columns: 1fr;
          }

          .role-card {
            min-height: auto;
            padding: 1.5rem;
          }

          .role-card-arrow {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default RoleSelection;
