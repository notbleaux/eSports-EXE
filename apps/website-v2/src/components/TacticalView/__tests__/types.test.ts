/** [Ver001.000] */
/**
 * TacticalView Types Tests
 * ========================
 * Type definition and constant validation.
 */

import { describe, it, expect } from 'vitest';
import {
  AGENT_ROLE_COLORS,
  PLAYBACK_SPEEDS,
  DEFAULT_VIEW_STATE,
  AgentRole,
  TeamSide,
  GamePhase,
} from '../types';

describe('TacticalView Types', () => {
  describe('AGENT_ROLE_COLORS', () => {
    it('should have colors for all agent roles', () => {
      const roles: AgentRole[] = ['duelist', 'initiator', 'controller', 'sentinel'];
      roles.forEach(role => {
        expect(AGENT_ROLE_COLORS[role]).toBeDefined();
        expect(AGENT_ROLE_COLORS[role]).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it('should have valid hex colors', () => {
      Object.values(AGENT_ROLE_COLORS).forEach(color => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });

  describe('PLAYBACK_SPEEDS', () => {
    it('should have correct speed values', () => {
      expect(PLAYBACK_SPEEDS).toEqual([0.25, 0.5, 1, 2, 4]);
    });

    it('should be in ascending order', () => {
      for (let i = 1; i < PLAYBACK_SPEEDS.length; i++) {
        expect(PLAYBACK_SPEEDS[i]).toBeGreaterThan(PLAYBACK_SPEEDS[i - 1]);
      }
    });

    it('should include normal speed (1x)', () => {
      expect(PLAYBACK_SPEEDS).toContain(1);
    });
  });

  describe('DEFAULT_VIEW_STATE', () => {
    it('should have all required properties', () => {
      expect(DEFAULT_VIEW_STATE).toHaveProperty('isPlaying');
      expect(DEFAULT_VIEW_STATE).toHaveProperty('playbackSpeed');
      expect(DEFAULT_VIEW_STATE).toHaveProperty('currentTimestamp');
      expect(DEFAULT_VIEW_STATE).toHaveProperty('showTrails');
      expect(DEFAULT_VIEW_STATE).toHaveProperty('trailLength');
      expect(DEFAULT_VIEW_STATE).toHaveProperty('showVisionCones');
      expect(DEFAULT_VIEW_STATE).toHaveProperty('showAbilityRanges');
      expect(DEFAULT_VIEW_STATE).toHaveProperty('showHealthBars');
      expect(DEFAULT_VIEW_STATE).toHaveProperty('showPlayerNames');
      expect(DEFAULT_VIEW_STATE).toHaveProperty('showLoadout');
      expect(DEFAULT_VIEW_STATE).toHaveProperty('followPlayer');
      expect(DEFAULT_VIEW_STATE).toHaveProperty('zoom');
      expect(DEFAULT_VIEW_STATE).toHaveProperty('panOffset');
      expect(DEFAULT_VIEW_STATE).toHaveProperty('selectedTeams');
      expect(DEFAULT_VIEW_STATE).toHaveProperty('selectedPlayers');
      expect(DEFAULT_VIEW_STATE).toHaveProperty('highlightAbilityTypes');
    });

    it('should have correct default values', () => {
      expect(DEFAULT_VIEW_STATE.isPlaying).toBe(false);
      expect(DEFAULT_VIEW_STATE.playbackSpeed).toBe(1);
      expect(DEFAULT_VIEW_STATE.currentTimestamp).toBe(0);
      expect(DEFAULT_VIEW_STATE.showTrails).toBe(true);
      expect(DEFAULT_VIEW_STATE.trailLength).toBe(30);
      expect(DEFAULT_VIEW_STATE.showVisionCones).toBe(false);
      expect(DEFAULT_VIEW_STATE.showAbilityRanges).toBe(true);
      expect(DEFAULT_VIEW_STATE.showHealthBars).toBe(true);
      expect(DEFAULT_VIEW_STATE.showPlayerNames).toBe(true);
      expect(DEFAULT_VIEW_STATE.showLoadout).toBe(false);
      expect(DEFAULT_VIEW_STATE.zoom).toBe(1);
      expect(DEFAULT_VIEW_STATE.panOffset).toEqual({ x: 0, y: 0 });
      expect(DEFAULT_VIEW_STATE.selectedTeams).toEqual(['attacker', 'defender']);
      expect(DEFAULT_VIEW_STATE.selectedPlayers).toEqual([]);
      expect(DEFAULT_VIEW_STATE.highlightAbilityTypes).toEqual([]);
    });

    it('should have valid playback speed', () => {
      expect(PLAYBACK_SPEEDS).toContain(DEFAULT_VIEW_STATE.playbackSpeed);
    });

    it('should have valid team selections', () => {
      DEFAULT_VIEW_STATE.selectedTeams.forEach(team => {
        expect(['attacker', 'defender']).toContain(team);
      });
    });
  });

  describe('Type Guards', () => {
    const isAgentRole = (value: string): value is AgentRole => {
      return ['duelist', 'initiator', 'controller', 'sentinel'].includes(value);
    };

    const isTeamSide = (value: string): value is TeamSide => {
      return ['attacker', 'defender'].includes(value);
    };

    const isGamePhase = (value: string): value is GamePhase => {
      return ['buy', 'combat', 'postplant', 'spike_down', 'clutch'].includes(value);
    };

    it('should validate agent roles', () => {
      expect(isAgentRole('duelist')).toBe(true);
      expect(isAgentRole('initiator')).toBe(true);
      expect(isAgentRole('controller')).toBe(true);
      expect(isAgentRole('sentinel')).toBe(true);
      expect(isAgentRole('invalid')).toBe(false);
    });

    it('should validate team sides', () => {
      expect(isTeamSide('attacker')).toBe(true);
      expect(isTeamSide('defender')).toBe(true);
      expect(isTeamSide('spectator')).toBe(false);
    });

    it('should validate game phases', () => {
      expect(isGamePhase('buy')).toBe(true);
      expect(isGamePhase('combat')).toBe(true);
      expect(isGamePhase('postplant')).toBe(true);
      expect(isGamePhase('spike_down')).toBe(true);
      expect(isGamePhase('clutch')).toBe(true);
      expect(isGamePhase('invalid')).toBe(false);
    });
  });
});
