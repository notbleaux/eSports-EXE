/** [Ver001.000] */
/**
 * AgentSprite Component
 * =====================
 * SVG-based agent representation for the tactical map.
 * Can be used standalone or as part of the Canvas rendering.
 */

import React from 'react';
import { AgentSpriteProps, AgentRole, AGENT_ROLE_COLORS } from './types';

// Agent ability icons (simplified representations)
const AGENT_ABILITY_ICONS: Record<string, string[]> = {
  'Brimstone': ['🔥', '☁️', '💨'],
  'Viper': ['🐍', '🌫️', '🧪'],
  'Omen': ['👻', '👁️', '🌑'],
  'Killjoy': ['🤖', '🔒', '💥'],
  'Cypher': ['🕸️', '📹', '🔗'],
  'Sova': ['🏹', '🦉', '⚡'],
  'Sage': ['❄️', '💚', '🛡️'],
  'Phoenix': ['🔥', '☀️', '🦅'],
  'Jett': ['💨', '🌪️', '⚔️'],
  'Reyna': ['👁️', '⚫', '💀'],
  'Raze': ['💣', '🤖', '🚀'],
  'Breach': ['👊', '⚡', '🌊'],
  'Skye': ['🐺', '🦅', '💛'],
  'Yoru': ['👤', '🔮', '⚔️'],
  'Astra': ['⭐', '🌌', '💫'],
  'KAY/O': ['🗡️', '⚡', '💥'],
  'Chamber': ['🔫', '💎', '⚜️'],
  'Neon': ['⚡', '💨', '🔋'],
  'Fade': ['🌙', '👁️', '🔊'],
  'Harbor': ['🌊', '🛡️', '💧'],
  'Gekko': ['🦎', '⭐', '💫'],
  'Deadlock': ['🕸️', '🛡️', '🔗'],
  'Iso': ['🛡️', '⚔️', '💠'],
  'Clove': ['💀', '🌹', '✨'],
  'Vyse': ['🌹', '🔒', '🗡️'],
};

// Default abilities for unknown agents
const DEFAULT_ABILITIES = ['⚡', '💥', '🛡️'];

export const AgentSprite: React.FC<AgentSpriteProps> = ({
  agent,
  player,
  position,
  rotation,
  health,
  armor,
  isAlive,
  hasSpike,
  isDefusing,
  isPlanting,
  abilityCharges,
  credits,
  size = 32,
  showHealth = true,
  showName = true,
  showAbilities = false,
  isSelected = false,
  onClick,
}) => {
  const roleColor = AGENT_ROLE_COLORS[agent.role] || '#b2bec3';
  const teamColor = player.teamSide === 'attacker' ? '#ff4757' : '#3742fa';
  const abilities = AGENT_ABILITY_ICONS[agent.name] || DEFAULT_ABILITIES;

  // Calculate health percentage
  const healthPercent = Math.max(0, Math.min(100, health / (player.maxHealth || 100) * 100));
  const healthColor = healthPercent > 50 ? '#2ed573' : healthPercent > 25 ? '#ffa502' : '#ff4757';

  return (
    <div 
      className={`agent-sprite ${isSelected ? 'agent-sprite--selected' : ''} ${!isAlive ? 'agent-sprite--dead' : ''}`}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        width: size,
        height: size + (showHealth ? 8 : 0) + (showName ? 16 : 0),
        cursor: onClick ? 'pointer' : 'default',
        pointerEvents: 'auto',
      }}
      onClick={onClick}
    >
      {/* Main agent circle */}
      <div 
        className="agent-sprite__body"
        style={{
          width: size,
          height: size,
          backgroundColor: isAlive ? teamColor : '#636e72',
          border: `3px solid ${isSelected ? '#fff' : roleColor}`,
          boxShadow: hasSpike ? '0 0 15px #ff0000, 0 0 30px #ff0000' : undefined,
          opacity: isAlive ? 1 : 0.5,
        }}
      >
        {/* Direction indicator */}
        <div 
          className="agent-sprite__direction"
          style={{
            position: 'absolute',
            top: -3,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '8px solid #fff',
          }}
        />

        {/* Agent icon/initials */}
        <span className="agent-sprite__initials">
          {agent.name.slice(0, 2).toUpperCase()}
        </span>

        {/* Status effects */}
        {isPlanting && (
          <div className="agent-sprite__status agent-sprite__status--planting">
            💣
          </div>
        )}
        {isDefusing && (
          <div className="agent-sprite__status agent-sprite__status--defusing">
            🛡️
          </div>
        )}
        {hasSpike && isAlive && (
          <div className="agent-sprite__spike-indicator">
            💣
          </div>
        )}
      </div>

      {/* Health bar */}
      {showHealth && isAlive && (
        <div className="agent-sprite__health-bar">
          <div 
            className="agent-sprite__health-fill"
            style={{
              width: `${healthPercent}%`,
              backgroundColor: healthColor,
            }}
          />
          {armor > 0 && (
            <div className="agent-sprite__armor-indicator">
              🛡️
            </div>
          )}
        </div>
      )}

      {/* Player name */}
      {showName && (
        <div 
          className="agent-sprite__name"
          style={{
            color: isAlive ? '#fff' : '#b2bec3',
          }}
        >
          {player.name}
        </div>
      )}

      {/* Ability charges */}
      {showAbilities && isAlive && abilityCharges && (
        <div className="agent-sprite__abilities">
          {abilities.map((ability, index) => (
            <div 
              key={index}
              className={`agent-sprite__ability ${abilityCharges[index] === 0 ? 'agent-sprite__ability--empty' : ''}`}
            >
              {ability}
              {abilityCharges[index] > 1 && (
                <span className="agent-sprite__ability-count">{abilityCharges[index]}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Credits indicator */}
      {credits !== undefined && credits > 0 && (
        <div className="agent-sprite__credits">
          💰{credits}
        </div>
      )}

      <style>{`
        .agent-sprite {
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: transform 0.1s ease-out;
          z-index: 10;
        }

        .agent-sprite--selected {
          z-index: 20;
        }

        .agent-sprite__body {
          position: relative;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .agent-sprite:hover .agent-sprite__body {
          transform: scale(1.1);
        }

        .agent-sprite--dead .agent-sprite__body {
          filter: grayscale(100%);
        }

        .agent-sprite__initials {
          font-size: 10px;
          font-weight: bold;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .agent-sprite__status {
          position: absolute;
          top: -8px;
          right: -8px;
          font-size: 12px;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .agent-sprite__spike-indicator {
          position: absolute;
          bottom: -8px;
          right: -8px;
          font-size: 12px;
          animation: glow 1s infinite alternate;
        }

        @keyframes glow {
          from { filter: brightness(1); }
          to { filter: brightness(1.5); }
        }

        .agent-sprite__health-bar {
          position: relative;
          width: 100%;
          height: 4px;
          background: #2d3436;
          border-radius: 2px;
          margin-top: 4px;
          overflow: hidden;
        }

        .agent-sprite__health-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease-out;
        }

        .agent-sprite__armor-indicator {
          position: absolute;
          right: -2px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 8px;
        }

        .agent-sprite__name {
          margin-top: 4px;
          font-size: 10px;
          font-weight: 600;
          white-space: nowrap;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        }

        .agent-sprite__abilities {
          display: flex;
          gap: 2px;
          margin-top: 4px;
        }

        .agent-sprite__ability {
          position: relative;
          font-size: 10px;
          padding: 2px 4px;
          background: rgba(0, 0, 0, 0.6);
          border-radius: 3px;
        }

        .agent-sprite__ability--empty {
          opacity: 0.3;
        }

        .agent-sprite__ability-count {
          position: absolute;
          top: -4px;
          right: -4px;
          font-size: 8px;
          background: #0984e3;
          border-radius: 50%;
          width: 12px;
          height: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .agent-sprite__credits {
          margin-top: 4px;
          font-size: 9px;
          color: #fdcb6e;
          background: rgba(0, 0, 0, 0.6);
          padding: 2px 6px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default AgentSprite;
