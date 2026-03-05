import React, { useState, useEffect } from 'react';
import { 
  getDashboardConfig, 
  getStoredRole, 
  getRoleConfig,
  hasCompletedOnboarding 
} from '../../../shared/js/userPreferences';

/**
 * Pro Tip Tooltip Component
 * Progressive disclosure helper
 */
function ProTip({ tip, position = 'top', visible = true }) {
  const [dismissed, setDismissed] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (dismissed || !visible) return null;

  return (
    <div className={`pro-tip ${position} ${showAdvanced ? 'advanced' : ''}`}>
      <div className="pro-tip-content">
        <span className="pro-tip-badge">💡 Pro Tip</span>
        <p className="pro-tip-text">{tip.text}</p>
        
        {tip.advanced && !showAdvanced && (
          <button 
            className="pro-tip-advanced-toggle"
            onClick={() => setShowAdvanced(true)}
          >
            Show advanced →
          </button>
        )}
        
        {showAdvanced && tip.advanced && (
          <div className="pro-tip-advanced-content">
            {tip.advanced}
          </div>
        )}
      </div>
      
      <button className="pro-tip-dismiss" onClick={() => setDismissed(true)}>×</button>
      
      <div className="pro-tip-arrow" />

      <style jsx>{`
        .pro-tip {
          position: relative;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(255, 159, 28, 0.1));
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 12px;
          padding: 1rem;
          margin: 1rem 0;
          animation: tipSlide 0.4s ease;
        }

        @keyframes tipSlide {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .pro-tip-content {
          padding-right: 1.5rem;
        }

        .pro-tip-badge {
          display: inline-block;
          font-size: 0.625rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.15);
          padding: 4px 10px;
          border-radius: 12px;
          margin-bottom: 0.5rem;
        }

        .pro-tip-text {
          font-size: 0.9375rem;
          color: #e8e6e3;
          line-height: 1.5;
          margin: 0;
        }

        .pro-tip-advanced-toggle {
          background: transparent;
          border: none;
          color: #f59e0b;
          font-size: 0.8125rem;
          cursor: pointer;
          padding: 0;
          margin-top: 0.5rem;
          transition: opacity 0.2s ease;
        }

        .pro-tip-advanced-toggle:hover {
          opacity: 0.8;
        }

        .pro-tip-advanced-content {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(245, 158, 11, 0.2);
          font-size: 0.875rem;
          color: #9ca3af;
          animation: expandIn 0.3s ease;
        }

        @keyframes expandIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .pro-tip-dismiss {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: transparent;
          border: none;
          color: #6b7280;
          font-size: 1.25rem;
          cursor: pointer;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .pro-tip-dismiss:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #e8e6e3;
        }

        .pro-tip-arrow {
          position: absolute;
          width: 12px;
          height: 12px;
          background: inherit;
          border: inherit;
        }

        .pro-tip.top .pro-tip-arrow {
          bottom: -7px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          border-top: none;
          border-left: none;
        }

        .pro-tip.bottom .pro-tip-arrow {
          top: -7px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          border-bottom: none;
          border-right: none;
        }
      `}</style>
    </div>
  );
}

/**
 * Stats Card Component
 */
function StatsCard({ title, value, change, icon, color = '#00f0ff' }) {
  return (
    <div className="stats-card">
      <div className="stats-icon" style={{ backgroundColor: `${color}15`, color }}>{icon}</div>
      <div className="stats-content">
        <span className="stats-title">{title}</span>
        <span className="stats-value">{value}</span>
        {change && (
          <span className={`stats-change ${change >= 0 ? 'positive' : 'negative'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>

      <style jsx>{`
        .stats-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.2s ease;
        }

        .stats-card:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-2px);
        }

        .stats-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .stats-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .stats-title {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stats-value {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #e8e6e3;
        }

        .stats-change {
          font-size: 0.75rem;
          font-weight: 600;
        }

        .stats-change.positive {
          color: #22c55e;
        }

        .stats-change.negative {
          color: #ef4444;
        }
      `}</style>
    </div>
  );
}

/**
 * Quick Actions Component
 */
function QuickActions({ actions, color }) {
  return (
    <div className="quick-actions">
      <h4 className="section-label">Quick Actions</h4>
      <div className="actions-grid">
        {actions.map((action, index) => (
          <a 
            key={index} 
            href={action.href}
            className="action-btn"
            style={{ 
              animationDelay: `${index * 0.05}s`,
              borderColor: `${color}30`
            }}
          >
            <span className="action-icon">{action.icon}</span>
            <span className="action-label">{action.label}</span>
          </a>
        ))}
      </div>

      <style jsx>{`
        .quick-actions {
          margin-bottom: 1.5rem;
        }

        .section-label {
          font-size: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #6b7280;
          margin-bottom: 0.75rem;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.75rem;
        }

        .action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.2s ease;
          animation: actionAppear 0.4s ease backwards;
        }

        @keyframes actionAppear {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-2px);
        }

        .action-icon {
          font-size: 1.5rem;
        }

        .action-label {
          font-size: 0.75rem;
          color: #9ca3af;
          text-align: center;
        }
      `}</style>
    </div>
  );
}

/**
 * Player Dashboard View
 */
function PlayerDashboard({ config, roleConfig }) {
  const [unlockedFeatures, setUnlockedFeatures] = useState(['basic']);

  // Simulate progressive disclosure
  useEffect(() => {
    const timer = setTimeout(() => {
      setUnlockedFeatures(['basic', 'advanced']);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="player-dashboard dashboard-view">
      <ProTip 
        tip={{
          text: "Your stats update in real-time after each match upload.",
          advanced: "You can also connect your Steam account for automatic imports."
        }}
      />

      <QuickActions actions={config.quickActions} color={roleConfig.color} />

      <div className="stats-grid">
        <StatsCard 
          title="Matches Played" 
          value="127" 
          change={12}
          icon="🎮"
          color={roleConfig.color}
        />
        <StatsCard 
          title="Win Rate" 
          value="62%" 
          change={5}
          icon="🏆"
          color={roleConfig.color}
        />
        <StatsCard 
          title="Avg Score" 
          value="1,847" 
          change={-2}
          icon="📊"
          color={roleConfig.color}
        />
        <StatsCard 
          title="Rank" 
          value="Gold II" 
          change={1}
          icon="⭐"
          color={roleConfig.color}
        />
      </div>

      {unlockedFeatures.includes('advanced') && (
        <div className="advanced-section">
          <h4 className="section-label">Performance Trends</h4>
          <div className="chart-placeholder">
            <div className="chart-bars">
              {[65, 78, 82, 71, 88, 92, 85].map((h, i) => (
                <div 
                  key={i} 
                  className="chart-bar"
                  style={{ 
                    height: `${h}%`,
                    backgroundColor: roleConfig.color,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
            <div className="chart-labels">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .advanced-section {
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .chart-placeholder {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .chart-bars {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          height: 150px;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .chart-bar {
          flex: 1;
          max-width: 40px;
          border-radius: 4px 4px 0 0;
          opacity: 0.8;
          animation: growUp 0.5s ease backwards;
        }

        @keyframes growUp {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }

        .chart-labels {
          display: flex;
          justify-content: space-around;
          font-size: 0.75rem;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}

/**
 * Organizer Dashboard View
 */
function OrganizerDashboard({ config, roleConfig }) {
  const tournaments = [
    { name: 'Spring Championship', status: 'live', participants: 64, prize: '$5,000' },
    { name: 'Weekly Cup #42', status: 'upcoming', participants: 32, prize: '$1,000' },
    { name: 'Pro League S3', status: 'draft', participants: 16, prize: '$25,000' },
  ];

  return (
    <div className="organizer-dashboard dashboard-view">
      <ProTip 
        tip={{
          text: "Use the bracket generator to create tournaments in under 2 minutes.",
          advanced: "Enable 'Auto-Seeding' to rank participants by their match history."
        }}
      />

      <QuickActions actions={config.quickActions} color={roleConfig.color} />

      <div className="tournaments-section">
        <h4 className="section-label">Your Tournaments</h4>
        
        <div className="tournament-list">
          {tournaments.map((t, i) => (
            <div key={i} className={`tournament-card ${t.status}`}>
              <div className="tournament-info">
                <h5 className="tournament-name">{t.name}</h5>
                <div className="tournament-meta">
                  <span className="tournament-participants">👥 {t.participants}</span>
                  <span className="tournament-prize">💰 {t.prize}</span>
                </div>
              </div>
              <span className={`tournament-status ${t.status}`}>{t.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="organizer-stats">
        <StatsCard 
          title="Total Events" 
          value="24" 
          change={8}
          icon="📅"
          color={roleConfig.color}
        />
        <StatsCard 
          title="Participants" 
          value="1,247" 
          change={15}
          icon="👥"
          color={roleConfig.color}
        />
        <StatsCard 
          title="Prize Pool" 
          value="$45K" 
          change={20}
          icon="💰"
          color={roleConfig.color}
        />
      </div>

      <style jsx>{`
        .tournaments-section {
          margin-bottom: 1.5rem;
        }

        .tournament-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .tournament-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .tournament-card:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .tournament-card.live {
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.05);
        }

        .tournament-info {
          flex: 1;
        }

        .tournament-name {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: #e8e6e3;
          margin-bottom: 0.25rem;
        }

        .tournament-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.8125rem;
          color: #6b7280;
        }

        .tournament-status {
          font-size: 0.625rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.1);
          color: #9ca3af;
        }

        .tournament-status.live {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .tournament-status.upcoming {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
        }

        .tournament-status.draft {
          background: rgba(107, 114, 128, 0.2);
          color: #6b7280;
        }

        .organizer-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }
      `}</style>
    </div>
  );
}

/**
 * Spectator Dashboard View
 */
function SpectatorDashboard({ config, roleConfig }) {
  const liveMatches = [
    { teamA: 'Team Liquid', teamB: 'G2 Esports', viewers: '12.5K', game: 'CS2' },
    { teamA: 'FaZe Clan', teamB: 'NAVI', viewers: '8.2K', game: 'CS2' },
  ];

  return (
    <div className="spectator-dashboard dashboard-view">
      <ProTip 
        tip={{
          text: "Follow your favorite teams to get notified when they go live.",
          advanced: "Enable mobile notifications to never miss a match."
        }}
      />

      <QuickActions actions={config.quickActions} color={roleConfig.color} />

      <div className="live-section">
        <h4 className="section-label">🔴 Live Now</h4>
        
        <div className="live-matches">
          {liveMatches.map((match, i) => (
            <a key={i} href="#" className="live-match-card">
              <div className="live-indicator">
                <span className="live-dot" />
                <span className="live-text">LIVE</span>
              </div>
              
              <div className="match-teams">
                <span className="team">{match.teamA}</span>
                <span className="vs">VS</span>
                <span className="team">{match.teamB}</span>
              </div>
              
              <div className="match-meta">
                <span className="game">{match.game}</span>
                <span className="viewers">👁 {match.viewers}</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="upcoming-section">
        <h4 className="section-label">Upcoming</h4>
        
        <div className="schedule-list">
          {[
            { time: '2h 15m', event: 'IEM Cologne - Finals', teams: 'TBD vs TBD' },
            { time: '5h 30m', event: 'ESL Pro League', teams: 'FaZe vs Astralis' },
            { time: 'Tomorrow', event: 'BLAST Premier', teams: 'G2 vs NAVI' },
          ].map((item, i) => (
            <div key={i} className="schedule-item">
              <span className="schedule-time">{item.time}</span>
              <div className="schedule-info">
                <span className="schedule-event">{item.event}</span>
                <span className="schedule-teams">{item.teams}</span>
              </div>
              <button className="schedule-remind">🔔</button>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .live-section {
          margin-bottom: 1.5rem;
        }

        .live-matches {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .live-match-card {
          position: relative;
          display: block;
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.2s ease;
          overflow: hidden;
        }

        .live-match-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.05), transparent);
          pointer-events: none;
        }

        .live-match-card:hover {
          border-color: rgba(239, 68, 68, 0.4);
          transform: translateY(-2px);
        }

        .live-indicator {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          animation: livePulse 1.5s ease-in-out infinite;
        }

        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .live-text {
          font-size: 0.625rem;
          font-weight: 700;
          color: #ef4444;
          letter-spacing: 0.05em;
        }

        .match-teams {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }

        .match-teams .team {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.125rem;
          font-weight: 600;
          color: #e8e6e3;
        }

        .match-teams .vs {
          font-size: 0.75rem;
          color: #6b7280;
          background: rgba(255, 255, 255, 0.1);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .match-meta {
          display: flex;
          justify-content: center;
          gap: 1rem;
          font-size: 0.8125rem;
          color: #6b7280;
        }

        .schedule-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .schedule-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.875rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          transition: all 0.2s ease;
        }

        .schedule-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .schedule-time {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: #3b82f6;
          min-width: 70px;
        }

        .schedule-info {
          flex: 1;
        }

        .schedule-event {
          display: block;
          font-size: 0.875rem;
          color: #e8e6e3;
          font-weight: 500;
          margin-bottom: 0.125rem;
        }

        .schedule-teams {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .schedule-remind {
          background: transparent;
          border: none;
          font-size: 1rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .schedule-remind:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}

/**
 * Main Personalized Dashboard Component
 */
function PersonalizedDashboard({ 
  role: propRole, 
  onFirstVisit,
  showTips = true 
}) {
  const [role, setRole] = useState(propRole);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load role from storage if not provided
    if (!role) {
      const stored = getStoredRole();
      const completed = hasCompletedOnboarding();
      
      if (stored) {
        setRole(stored);
      } else if (!completed) {
        // First time user
        onFirstVisit?.();
      }
    }

    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [role, propRole, onFirstVisit]);

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <style jsx>{`
          .dashboard-loading {
            min-height: 400px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top-color: #00f0ff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="dashboard-unset">
        <div className="unset-message">
          <span className="unset-icon">🎮</span>
          <h3>Welcome to NJZ Analytics</h3>
          <p>Set up your profile to get started</p>
          <button className="setup-btn" onClick={onFirstVisit}>
            Get Started →
          </button>
        </div>

        <style jsx>{`
          .dashboard-unset {
            min-height: 400px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .unset-message {
            text-align: center;
          }

          .unset-icon {
            font-size: 4rem;
            display: block;
            margin-bottom: 1rem;
          }

          .unset-message h3 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.5rem;
            color: #e8e6e3;
            margin-bottom: 0.5rem;
          }

          .unset-message p {
            color: #6b7280;
            margin-bottom: 1.5rem;
          }

          .setup-btn {
            padding: 0.875rem 1.5rem;
            background: linear-gradient(135deg, #ff9f1c, #f59e0b);
            border: none;
            border-radius: 8px;
            color: #0a0a0f;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .setup-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(255, 159, 28, 0.3);
          }
        `}</style>
      </div>
    );
  }

  const roleConfig = getRoleConfig(role);
  const dashboardConfig = getDashboardConfig(role);

  const DashboardView = {
    player: PlayerDashboard,
    organizer: OrganizerDashboard,
    spectator: SpectatorDashboard
  }[role] || PlayerDashboard;

  return (
    <div className="personalized-dashboard">
      <header className="dashboard-header">
        <div className="header-title">
          <span 
            className="role-badge" 
            style={{ 
              backgroundColor: `${roleConfig.color}15`,
              color: roleConfig.color,
              borderColor: `${roleConfig.color}30`
            }}
          >
            <span className="role-icon">{roleConfig.icon}</span>
            {roleConfig.label}
          </span>
          <h2>{dashboardConfig.title}</h2>
        </div>
        
        <button className="settings-btn" title="Change role">⚙️</button>
      </header>

      <DashboardView config={dashboardConfig} roleConfig={roleConfig} />

      <style jsx>{`
        .personalized-dashboard {
          padding: 1.5rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .role-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.875rem;
          border: 1px solid;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .role-icon {
          font-size: 1rem;
        }

        .header-title h2 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #e8e6e3;
        }

        .settings-btn {
          background: transparent;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .settings-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}

export default PersonalizedDashboard;
export { ProTip, StatsCard, QuickActions };
