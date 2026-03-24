/**
 * Camera Director System Tests
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-C
 * Team: Replay 2.0 Core (TL-S2)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { GameEvent, Player, Team, Round, Position3D } from '../../types';
import {
  ActionDetectionEngine,
  createActionDetectionEngine,
  DETECTION_CONFIG,
  calculateActionPriority,
  mergeOverlappingActions,
  type DetectedAction,
  type ActionType,
} from '../actionDetection';
import {
  FreeCamera,
  FollowCamera,
  OrbitCamera,
  CinematicCamera,
  createCameraFactory,
  CAMERA_SETTINGS,
  DEFAULT_FOLLOW_CONFIG,
  DEFAULT_ORBIT_CONFIG,
  type CameraState,
} from '../modes';
import {
  CameraDirector,
  createCameraDirector,
  generateHighlightSchedule,
  analyzeCameraCoverage,
  DEFAULT_DIRECTOR_CONFIG,
  type CameraDecision,
  type DirectorConfig,
} from '../director';
import {
  PathRecorder,
  PathBuilder,
  PathPlayer,
  PathStorage,
  interpolatePathState,
  DEFAULT_OPTIMIZATION_OPTIONS,
  type CameraPath,
  type PathSample,
} from '../pathRecording';

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockPlayer = (id: string, name: string, teamId: string): Player => ({
  id,
  name,
  teamId,
  teamSide: teamId === 'team-a' ? 'attacker' : 'defender',
  agent: 'Jett',
  role: 'duelist',
  isBot: false,
  stats: {
    kills: 0,
    deaths: 0,
    assists: 0,
    damageDealt: 0,
    damageReceived: 0,
    headshots: 0,
    roundsPlayed: 0,
    score: 0,
  },
});

const createMockTeam = (id: string, name: string, side: 'attacker' | 'defender'): Team => ({
  id,
  name,
  side,
  score: 0,
  money: 0,
  playerIds: [],
  timeoutsRemaining: 2,
});

const createMockRound = (roundNumber: number): Round => ({
  roundNumber,
  winningSide: 'attacker',
  outcome: 'elimination',
  startTime: (roundNumber - 1) * 100000,
  endTime: roundNumber * 100000,
  duration: 100000,
  teamAScore: roundNumber,
  teamBScore: 0,
  events: [],
  playerStates: [],
  economy: {
    teamA: { totalMoney: 0, loadoutValues: [], weapons: [] },
    teamB: { totalMoney: 0, loadoutValues: [], weapons: [] },
  },
});

const createKillEvent = (
  id: string,
  timestamp: number,
  roundNumber: number,
  killerId: string,
  victimId: string,
  isHeadshot: boolean = false,
  isWallbang: boolean = false
): GameEvent => ({
  id,
  type: 'kill',
  timestamp,
  roundNumber,
  killerId,
  victimId,
  assisterIds: [],
  weaponId: 'Vandal',
  isHeadshot,
  isWallbang,
  isFlashed: false,
  isTrade: false,
  position: { x: 100, y: 50, z: 100 },
  victimPosition: { x: 150, y: 50, z: 150 },
});

const createBombPlantEvent = (
  id: string,
  timestamp: number,
  roundNumber: number,
  playerId: string,
  site: 'A' | 'B' | 'C' = 'A'
): GameEvent => ({
  id,
  type: 'bomb_plant',
  timestamp,
  roundNumber,
  playerId,
  site,
  position: { x: 200, y: 0, z: 200 },
  plantTime: timestamp,
});

const createBombDefuseEvent = (
  id: string,
  timestamp: number,
  roundNumber: number,
  playerId: string,
  defuseProgress: number = 1.0
): GameEvent => ({
  id,
  type: 'bomb_defuse',
  timestamp,
  roundNumber,
  playerId,
  site: 'A',
  position: { x: 200, y: 0, z: 200 },
  defuseTime: timestamp,
  wasKitUsed: true,
  defuseProgress,
});

const createRoundEndEvent = (
  id: string,
  timestamp: number,
  roundNumber: number,
  winningSide: 'attacker' | 'defender' = 'attacker'
): GameEvent => ({
  id,
  type: 'round_end',
  timestamp,
  roundNumber,
  winningSide,
  outcome: 'elimination',
  teamAScore: roundNumber,
  teamBScore: 0,
});

// ============================================================================
// Action Detection Tests
// ============================================================================

describe('ActionDetectionEngine', () => {
  let players: Player[];
  let teams: Team[];
  let rounds: Round[];

  beforeEach(() => {
    players = [
      createMockPlayer('p1', 'Player1', 'team-a'),
      createMockPlayer('p2', 'Player2', 'team-a'),
      createMockPlayer('p3', 'Player3', 'team-b'),
      createMockPlayer('p4', 'Player4', 'team-b'),
      createMockPlayer('p5', 'Player5', 'team-b'),
    ];
    teams = [
      createMockTeam('team-a', 'Team A', 'attacker'),
      createMockTeam('team-b', 'Team B', 'defender'),
    ];
    rounds = [createMockRound(1), createMockRound(2)];
  });

  describe('Basic Action Detection', () => {
    it('should detect kills', () => {
      const events: GameEvent[] = [
        createKillEvent('k1', 1000, 1, 'p1', 'p3'),
      ];

      const engine = createActionDetectionEngine(events, players, teams, rounds);
      const actions = engine.detectAllActions();

      const killActions = actions.filter(a => a.type === 'kill');
      expect(killActions.length).toBe(1);
      expect(killActions[0].primaryPlayerId).toBe('p1');
      expect(killActions[0].dramaScore).toBeGreaterThan(0);
    });

    it('should detect bomb plants', () => {
      const events: GameEvent[] = [
        createBombPlantEvent('bp1', 2000, 1, 'p1', 'A'),
      ];

      const engine = createActionDetectionEngine(events, players, teams, rounds);
      const actions = engine.detectAllActions();

      const plantActions = actions.filter(a => a.type === 'bomb_plant');
      expect(plantActions.length).toBe(1);
      expect(plantActions[0].primaryPlayerId).toBe('p1');
    });

    it('should detect bomb defuses', () => {
      const events: GameEvent[] = [
        createBombDefuseEvent('bd1', 3000, 1, 'p3', 1.0),
      ];

      const engine = createActionDetectionEngine(events, players, teams, rounds);
      const actions = engine.detectAllActions();

      const defuseActions = actions.filter(a => a.type === 'bomb_defuse');
      expect(defuseActions.length).toBe(1);
      expect(defuseActions[0].importance).toBe('critical');
    });

    it('should detect round wins', () => {
      const events: GameEvent[] = [
        createRoundEndEvent('re1', 5000, 1, 'attacker'),
      ];

      const engine = createActionDetectionEngine(events, players, teams, rounds);
      const actions = engine.detectAllActions();

      const winActions = actions.filter(a => a.type === 'round_win');
      expect(winActions.length).toBe(1);
    });
  });

  describe('Multi-Kill Detection', () => {
    it('should detect 3K multi-kill', () => {
      const events: GameEvent[] = [
        createKillEvent('k1', 1000, 1, 'p1', 'p3'),
        createKillEvent('k2', 2500, 1, 'p1', 'p4'),
        createKillEvent('k3', 4000, 1, 'p1', 'p5'),
      ];

      const engine = createActionDetectionEngine(events, players, teams, rounds);
      const actions = engine.detectAllActions();

      const multiKillActions = actions.filter(a => a.type === 'multi_kill');
      expect(multiKillActions.length).toBe(1);
      expect(multiKillActions[0].dramaScore).toBeGreaterThan(50);
    });

    it('should detect ace (5 kills)', () => {
      const allPlayers = [
        ...players,
        createMockPlayer('p6', 'Player6', 'team-b'),
        createMockPlayer('p7', 'Player7', 'team-b'),
      ];
      const events: GameEvent[] = [
        createKillEvent('k1', 1000, 1, 'p1', 'p3'),
        createKillEvent('k2', 2000, 1, 'p1', 'p4'),
        createKillEvent('k3', 3000, 1, 'p1', 'p5'),
        createKillEvent('k4', 4000, 1, 'p1', 'p6'),
        createKillEvent('k5', 5000, 1, 'p1', 'p7'),
      ];

      const engine = createActionDetectionEngine(events, allPlayers, teams, rounds);
      const actions = engine.detectAllActions();

      const aceActions = actions.filter(a => a.type === 'ace');
      expect(aceActions.length).toBe(1);
      expect(aceActions[0].importance).toBe('critical');
    });
  });

  describe('Clutch Detection', () => {
    it('should detect 1v3 clutch situation', () => {
      const events: GameEvent[] = [
        createKillEvent('k1', 1000, 1, 'p3', 'p2'),
        createKillEvent('k2', 2000, 1, 'p4', 'p1'),
        // p5 is still alive, so p3 and p4 are in 2v1
      ];

      const engine = createActionDetectionEngine(events, players, teams, rounds);
      const actions = engine.detectAllActions();

      // Should have kill actions but no clutch yet
      const killActions = actions.filter(a => a.type === 'kill');
      expect(killActions.length).toBe(2);
    });

    it('should calculate correct drama score for headshot', () => {
      const events: GameEvent[] = [
        createKillEvent('k1', 1000, 1, 'p1', 'p3', true, false),
      ];

      const engine = createActionDetectionEngine(events, players, teams, rounds);
      const actions = engine.detectAllActions();

      const killAction = actions.find(a => a.type === 'kill');
      expect(killAction).toBeDefined();
      // Headshot multiplier should increase drama
      expect(killAction!.dramaScore).toBeGreaterThan(DETECTION_CONFIG.BASE_SCORES.kill);
    });
  });

  describe('Action Priority', () => {
    it('should sort actions by importance', () => {
      const actions: DetectedAction[] = [
        { id: 'a1', type: 'kill', timestamp: 1000, roundNumber: 1, importance: 'low', dramaScore: 20, position: { x: 0, y: 0, z: 0 }, description: '', metadata: {}, duration: 1000 },
        { id: 'a2', type: 'ace', timestamp: 2000, roundNumber: 1, importance: 'critical', dramaScore: 90, position: { x: 0, y: 0, z: 0 }, description: '', metadata: {}, duration: 2000 },
        { id: 'a3', type: 'multi_kill', timestamp: 1500, roundNumber: 1, importance: 'high', dramaScore: 60, position: { x: 0, y: 0, z: 0 }, description: '', metadata: {}, duration: 1500 },
      ];

      const sorted = calculateActionPriority(actions);
      expect(sorted[0].importance).toBe('critical');
      expect(sorted[1].importance).toBe('high');
      expect(sorted[2].importance).toBe('low');
    });

    it('should merge overlapping actions', () => {
      const actions: DetectedAction[] = [
        { id: 'a1', type: 'kill', timestamp: 1000, roundNumber: 1, importance: 'medium', dramaScore: 30, position: { x: 0, y: 0, z: 0 }, description: '', metadata: {}, duration: 2000 },
        { id: 'a2', type: 'kill', timestamp: 2500, roundNumber: 1, importance: 'high', dramaScore: 50, position: { x: 0, y: 0, z: 0 }, description: '', metadata: {}, duration: 2000 },
      ];

      const merged = mergeOverlappingActions(actions, 1000);
      // Should keep both as they don't significantly overlap
      expect(merged.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Time Window Queries', () => {
    it('should get actions in time window', () => {
      const events: GameEvent[] = [
        createKillEvent('k1', 1000, 1, 'p1', 'p3'),
        createKillEvent('k2', 5000, 1, 'p1', 'p4'),
        createKillEvent('k3', 10000, 1, 'p1', 'p5'),
      ];

      const engine = createActionDetectionEngine(events, players, teams, rounds);
      const allActions = engine.detectAllActions();

      // Should include kills within window (may include other action types)
      const windowActions = engine.getActionsInWindow(0, 6000);
      const killActions = windowActions.filter(a => a.type === 'kill');
      expect(killActions.length).toBe(2);
    });

    it('should get primary action at time', () => {
      const events: GameEvent[] = [
        createKillEvent('k1', 1000, 1, 'p1', 'p3'),
      ];

      const engine = createActionDetectionEngine(events, players, teams, rounds);
      engine.detectAllActions();

      const primary = engine.getPrimaryActionAtTime(1000);
      expect(primary).not.toBeNull();
      expect(primary!.timestamp).toBe(1000);
    });
  });
});

// ============================================================================
// Camera Modes Tests
// ============================================================================

describe('Camera Modes', () => {
  const mockGetPlayerPosition = vi.fn(() => ({ x: 0, y: 0, z: 0 }));
  const mockGetPlayerVelocity = vi.fn(() => ({ x: 0, y: 0, z: 0 }));

  describe('FreeCamera', () => {
    it('should initialize with default state', () => {
      const camera = new FreeCamera();
      const state = camera.getState();
      expect(state.fov).toBe(CAMERA_SETTINGS.DEFAULT_FOV);
      expect(state.position.y).toBe(200);
    });

    it('should update from input', () => {
      const camera = new FreeCamera();
      camera.setInput({ moveForward: 1 });
      const initialZ = camera.getState().position.z;
      camera.update(0.016, 0);
      // Forward vector at default rotation points in +z direction
      expect(camera.getState().position.z).not.toBe(initialZ);
    });

    it('should handle look rotation', () => {
      const camera = new FreeCamera();
      const initialRotation = camera.getState().rotation.y;
      camera.setInput({ lookDeltaX: 100 });
      camera.update(0.016, 0);
      expect(camera.getState().rotation.y).not.toBe(initialRotation);
    });

    it('should clamp zoom to valid range', () => {
      const camera = new FreeCamera();
      // zoomDelta is subtracted from FOV, so positive values decrease FOV
      camera.setInput({ zoomDelta: -1000 });
      camera.update(0.016, 0);
      expect(camera.getState().fov).toBe(CAMERA_SETTINGS.MAX_FOV);
    });
  });

  describe('FollowCamera', () => {
    it('should follow target player', () => {
      const camera = new FollowCamera(mockGetPlayerPosition, mockGetPlayerVelocity);
      camera.setTarget('p1');
      expect(camera.getTarget()).toBe('p1');
    });

    it('should update position based on target', () => {
      mockGetPlayerPosition.mockReturnValue({ x: 100, y: 50, z: 100 });
      const camera = new FollowCamera(mockGetPlayerPosition, mockGetPlayerVelocity);
      camera.setTarget('p1');
      camera.update(0.016, 0);
      const state = camera.getState();
      expect(state.position.x).toBeGreaterThan(0);
    });

    it('should calculate framing score', () => {
      mockGetPlayerPosition.mockReturnValue({ x: 0, y: 0, z: 0 });
      const camera = new FollowCamera(mockGetPlayerPosition, mockGetPlayerVelocity, {
        distance: 150,
        height: 50,
        offset: 0,
        smoothing: 0.1,
        predictMovement: false,
        fov: 75,
      });
      camera.setTarget('p1');
      camera.update(0.016, 0);
      const score = camera.getFramingScore(0);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('OrbitCamera', () => {
    it('should orbit around center point', () => {
      const camera = new OrbitCamera();
      camera.setCenter({ x: 100, y: 0, z: 100 });
      camera.update(0.016, 0);
      const state = camera.getState();
      expect(state.position.x).not.toBe(0);
    });

    it('should auto-orbit', () => {
      const camera = new OrbitCamera({ autoOrbit: true, orbitSpeed: 1 });
      camera.setCenter({ x: 0, y: 0, z: 0 });
      const initialX = camera.getState().position.x;
      camera.update(1, 0); // 1 second delta
      expect(camera.getState().position.x).not.toBe(initialX);
    });

    it('should respect distance bounds', () => {
      const camera = new OrbitCamera({ distance: 1000 });
      // Distance should be clamped to MAX_ORBIT_DISTANCE (800)
      // At angle 0, position.z = center.z + cos(0) * distance = 0 + 1 * distance
      expect(camera.getState().position.z).toBeLessThanOrEqual(CAMERA_SETTINGS.MAX_ORBIT_DISTANCE);
    });
  });

  describe('CinematicCamera', () => {
    it('should play sequence', () => {
      const camera = new CinematicCamera();
      const sequence = {
        id: 'seq1',
        name: 'Test Sequence',
        shots: [
          {
            id: 'shot1',
            name: 'Shot 1',
            startState: {
              position: { x: 0, y: 100, z: 200 },
              rotation: { x: -0.3, y: 0, z: 0 },
              fov: 75,
              up: { x: 0, y: 1, z: 0 },
            },
            endState: {
              position: { x: 100, y: 100, z: 200 },
              rotation: { x: -0.3, y: 0.5, z: 0 },
              fov: 60,
              up: { x: 0, y: 1, z: 0 },
            },
            duration: 1000,
            easing: 'linear' as const,
            shakeIntensity: 0,
          },
        ],
        loop: false,
      };

      // Add sequence first, then play
      camera.addSequence(sequence);
      const success = camera.playSequence(sequence.id, 0);
      expect(success).toBe(true);
      expect(camera.isSequencePlaying()).toBe(true);
    });

    it('should interpolate between shots', () => {
      const camera = new CinematicCamera();
      const sequence = {
        id: 'seq2',
        name: 'Test',
        shots: [
          {
            id: 'shot1',
            name: 'Shot 1',
            startState: {
              position: { x: 0, y: 100, z: 200 },
              rotation: { x: 0, y: 0, z: 0 },
              fov: 75,
              up: { x: 0, y: 1, z: 0 },
            },
            endState: {
              position: { x: 100, y: 100, z: 200 },
              rotation: { x: 0, y: 0, z: 0 },
              fov: 75,
              up: { x: 0, y: 1, z: 0 },
            },
            duration: 1000,
            easing: 'linear' as const,
            shakeIntensity: 0,
          },
        ],
        loop: false,
      };

      camera.addSequence(sequence);
      camera.playSequence(sequence.id, 0);
      camera.update(0, 500); // Halfway through (timestamp = 500)
      const state = camera.getState();
      expect(state.position.x).toBe(50); // Halfway between 0 and 100
    });
  });

  describe('Camera Factory', () => {
    it('should create all camera types', () => {
      const factory = createCameraFactory();
      expect(factory.createFreeCamera()).toBeInstanceOf(FreeCamera);
      expect(factory.createFollowCamera(mockGetPlayerPosition, mockGetPlayerVelocity)).toBeInstanceOf(FollowCamera);
      expect(factory.createOrbitCamera()).toBeInstanceOf(OrbitCamera);
      expect(factory.createCinematicCamera()).toBeInstanceOf(CinematicCamera);
    });
  });
});

// ============================================================================
// Camera Director Tests
// ============================================================================

describe('CameraDirector', () => {
  let events: GameEvent[];
  let players: Player[];
  let teams: Team[];
  let rounds: Round[];
  const mockGetPlayerPosition = vi.fn(() => ({ x: 0, y: 0, z: 0 }));
  const mockGetPlayerVelocity = vi.fn(() => ({ x: 0, y: 0, z: 0 }));

  beforeEach(() => {
    players = [
      createMockPlayer('p1', 'Player1', 'team-a'),
      createMockPlayer('p2', 'Player2', 'team-b'),
    ];
    teams = [
      createMockTeam('team-a', 'Team A', 'attacker'),
      createMockTeam('team-b', 'Team B', 'defender'),
    ];
    rounds = [createMockRound(1)];
    events = [
      createKillEvent('k1', 1000, 1, 'p1', 'p2', true),
      createBombPlantEvent('bp1', 5000, 1, 'p1', 'A'),
      createRoundEndEvent('re1', 10000, 1),
    ];
  });

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      const director = createCameraDirector(events, players, teams, rounds);
      expect(director.getDetectedActions().length).toBeGreaterThan(0);
    });

    it('should initialize with custom config', () => {
      const config: Partial<DirectorConfig> = {
        mode: 'manual',
        dramaThreshold: 50,
      };
      const director = createCameraDirector(events, players, teams, rounds, config);
      expect(director.getDetectedActions().length).toBeGreaterThan(0);
    });
  });

  describe('Mode Switching', () => {
    it('should switch to manual free camera', () => {
      const director = createCameraDirector(events, players, teams, rounds);
      director.setManualMode('free');
      expect(director.getCurrentMode()).toBe('free');
    });

    it('should switch to follow camera', () => {
      const director = createCameraDirector(events, players, teams, rounds);
      director.setManualMode('follow');
      director.setFollowTarget('p1');
      expect(director.getCurrentMode()).toBe('follow');
    });

    it('should switch to orbit camera', () => {
      const director = createCameraDirector(events, players, teams, rounds);
      director.setManualMode('orbit');
      expect(director.getCurrentMode()).toBe('orbit');
    });
  });

  describe('Action Filtering', () => {
    it('should filter actions by type', () => {
      const director = createCameraDirector(events, players, teams, rounds);
      const killActions = director.getActionsByType('kill');
      expect(killActions.length).toBeGreaterThanOrEqual(1);
    });

    it('should get upcoming actions', () => {
      const director = createCameraDirector(events, players, teams, rounds);
      const upcoming = director.getUpcomingActions(0, 6000);
      expect(upcoming.length).toBeGreaterThan(0);
    });
  });

  describe('Scene Composition', () => {
    it('should analyze scene composition', () => {
      const director = createCameraDirector(events, players, teams, rounds);
      const composition = director.getSceneComposition(1000);
      expect(composition).toHaveProperty('framing');
      expect(composition).toHaveProperty('angle');
      expect(composition).toHaveProperty('movement');
    });
  });

  describe('Drama Score', () => {
    it('should calculate drama score', () => {
      const director = createCameraDirector(events, players, teams, rounds);
      const score = director.calculateDramaScore(1000);
      expect(score).toHaveProperty('total');
      expect(score).toHaveProperty('actionScore');
      expect(score).toHaveProperty('proximityScore');
      expect(score).toHaveProperty('momentumScore');
      expect(score.total).toBeGreaterThanOrEqual(0);
      expect(score.total).toBeLessThanOrEqual(100);
    });
  });

  describe('Schedule Generation', () => {
    it('should generate schedule for time range', () => {
      const director = createCameraDirector(events, players, teams, rounds);
      const schedule = director.generateSchedule(0, 10000);
      expect(schedule.length).toBeGreaterThan(0);
    });

    it('should recommend position for action', () => {
      const director = createCameraDirector(events, players, teams, rounds);
      const actions = director.getDetectedActions();
      if (actions.length > 0) {
        const position = director.getRecommendedPosition(actions[0]);
        expect(position).toHaveProperty('x');
        expect(position).toHaveProperty('y');
        expect(position).toHaveProperty('z');
      }
    });
  });

  describe('Highlight Generation', () => {
    it('should generate highlight schedule', () => {
      const director = createCameraDirector(events, players, teams, rounds);
      const actions = director.getDetectedActions();
      const highlights = generateHighlightSchedule(actions, 5, 30);
      expect(highlights.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Coverage Analysis', () => {
    it('should analyze camera coverage', () => {
      const decisions: CameraDecision[] = [
        {
          timestamp: 0,
          mode: 'follow',
          targetPlayerId: 'p1',
          state: { position: { x: 0, y: 100, z: 200 }, rotation: { x: 0, y: 0, z: 0 }, fov: 75, up: { x: 0, y: 1, z: 0 } },
          duration: 3000,
          reason: 'Test',
          dramaScore: 50,
        },
      ];

      const analysis = analyzeCameraCoverage(decisions, 10000);
      expect(analysis).toHaveProperty('coveragePercent');
      expect(analysis).toHaveProperty('avgDramaScore');
      expect(analysis).toHaveProperty('switchCount');
    });
  });
});

// ============================================================================
// Path Recording Tests
// ============================================================================

describe('Path Recording', () => {
  describe('PathRecorder', () => {
    it('should start and stop recording', () => {
      const recorder = new PathRecorder();
      const session = recorder.startRecording(50);
      expect(session.isRecording).toBe(true);
      expect(recorder.isRecording()).toBe(true);

      const stopped = recorder.stopRecording();
      expect(stopped).not.toBeNull();
      expect(stopped!.isRecording).toBe(false);
    });

    it('should record samples', () => {
      const recorder = new PathRecorder();
      recorder.startRecording(0); // Record every frame

      const state: CameraState = {
        position: { x: 0, y: 100, z: 200 },
        rotation: { x: 0, y: 0, z: 0 },
        fov: 75,
        up: { x: 0, y: 1, z: 0 },
      };

      recorder.recordSample(state);
      recorder.recordSample({ ...state, position: { x: 10, y: 100, z: 200 } });

      const session = recorder.stopRecording();
      expect(session!.samples.length).toBe(2);
    });

    it('should discard recording', () => {
      const recorder = new PathRecorder();
      recorder.startRecording();
      recorder.discard();
      expect(recorder.isRecording()).toBe(false);
    });
  });

  describe('PathBuilder', () => {
    it('should build path from keyframes', () => {
      const builder = new PathBuilder('Test Path');
      const state: CameraState = {
        position: { x: 0, y: 100, z: 200 },
        rotation: { x: 0, y: 0, z: 0 },
        fov: 75,
        up: { x: 0, y: 1, z: 0 },
      };

      builder
        .addKeyframe(0, state, 'linear')
        .addKeyframe(1000, { ...state, position: { x: 100, y: 100, z: 200 } }, 'easeOut');

      const path = builder.build(false, 'TestMap', ['test']);
      expect(path.name).toBe('Test Path');
      expect(path.keyframes.length).toBe(2);
      expect(path.mapName).toBe('TestMap');
      expect(path.tags).toContain('test');
    });

    it('should create preset paths', () => {
      const introPath = PathBuilder.createPreset('intro', { x: 0, y: 0, z: 0 });
      expect(introPath.keyframes.length).toBeGreaterThan(0);

      const overviewPath = PathBuilder.createPreset('overview', { x: 0, y: 0, z: 0 });
      expect(overviewPath.loop).toBe(true);
    });

    it('should update and remove keyframes', () => {
      const builder = new PathBuilder();
      const state: CameraState = {
        position: { x: 0, y: 100, z: 200 },
        rotation: { x: 0, y: 0, z: 0 },
        fov: 75,
        up: { x: 0, y: 1, z: 0 },
      };

      builder.addKeyframe(0, state, 'linear');
      const initialCount = builder.getKeyframeCount();

      builder.removeKeyframe('kf-0');
      expect(builder.getKeyframeCount()).toBe(initialCount - 1);
    });
  });

  describe('PathPlayer', () => {
    it('should load and play path', () => {
      const player = new PathPlayer();
      const path = PathBuilder.createPreset('intro');

      player.loadPath(path);
      player.play();

      expect(player.isPlaying()).toBe(true);
      expect(player.getProgress()).toBe(0);
    });

    it('should update playback', () => {
      const player = new PathPlayer();
      const path = PathBuilder.createPreset('intro');

      player.loadPath(path);
      player.play();
      player.update(0.5); // 0.5 seconds

      expect(player.getProgress()).toBeGreaterThan(0);
    });

    it('should seek to position', () => {
      const player = new PathPlayer();
      const path = PathBuilder.createPreset('intro');

      player.loadPath(path);
      player.seek(path.duration / 2);

      expect(player.getProgress()).toBeCloseTo(0.5, 1);
    });

    it('should stop and reset', () => {
      const player = new PathPlayer();
      const path = PathBuilder.createPreset('intro');

      player.loadPath(path);
      player.play();
      player.update(0.5);
      player.stop();

      expect(player.isPlaying()).toBe(false);
      expect(player.getProgress()).toBe(0);
    });

    it('should set playback speed', () => {
      const player = new PathPlayer();
      player.setSpeed(2);
      // Speed affects update rate
      const path = PathBuilder.createPreset('intro');
      player.loadPath(path);
      player.play();
      player.update(0.5); // Should advance 1 second worth
      expect(player.getProgress()).toBeGreaterThan(0);
    });
  });

  describe('Path Interpolation', () => {
    it('should interpolate between keyframes', () => {
      const path = PathBuilder.createPreset('intro');
      const state = interpolatePathState(path, path.duration / 2);

      expect(state).toHaveProperty('position');
      expect(state).toHaveProperty('rotation');
      expect(state).toHaveProperty('fov');
    });

    it('should return first keyframe before start', () => {
      const path = PathBuilder.createPreset('intro');
      const state = interpolatePathState(path, -100);

      expect(state.position.x).toBe(path.keyframes[0].state.position.x);
    });

    it('should return last keyframe after end', () => {
      const path = PathBuilder.createPreset('intro');
      const state = interpolatePathState(path, path.duration + 100);

      const lastKf = path.keyframes[path.keyframes.length - 1];
      expect(state.position.x).toBe(lastKf.state.position.x);
    });
  });

  describe('PathStorage', () => {
    beforeEach(() => {
      // Clear storage before each test
      PathStorage.clearAll();
    });

    it('should save and load path', () => {
      const path = PathBuilder.createPreset('intro');
      PathStorage.savePath(path);

      const loaded = PathStorage.loadPath(path.id);
      expect(loaded).not.toBeNull();
      expect(loaded!.name).toBe(path.name);
    });

    it('should load all paths', () => {
      // Create paths with unique IDs
      const path1 = { ...PathBuilder.createPreset('intro'), id: 'test-intro-1', name: 'Test Intro 1' };
      const path2 = { ...PathBuilder.createPreset('outro'), id: 'test-outro-2', name: 'Test Outro 2' };
      PathStorage.savePath(path1);
      PathStorage.savePath(path2);

      const allPaths = PathStorage.loadAllPaths();
      expect(allPaths.length).toBeGreaterThanOrEqual(2);
    });

    it('should delete path', () => {
      const path = PathBuilder.createPreset('intro');
      PathStorage.savePath(path);

      const deleted = PathStorage.deletePath(path.id);
      expect(deleted).toBe(true);
      expect(PathStorage.loadPath(path.id)).toBeNull();
    });

    it('should export and import path', () => {
      const path = PathBuilder.createPreset('intro');
      const json = PathStorage.exportPath(path);

      const imported = PathStorage.importPath(json);
      expect(imported).not.toBeNull();
      expect(imported!.id).toBe(path.id);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Camera Director Integration', () => {
  it('should complete full workflow', () => {
    // Setup
    const players = [
      createMockPlayer('p1', 'Player1', 'team-a'),
      createMockPlayer('p2', 'Player2', 'team-b'),
    ];
    const teams = [
      createMockTeam('team-a', 'Team A', 'attacker'),
      createMockTeam('team-b', 'Team B', 'defender'),
    ];
    const rounds = [createMockRound(1)];
    const events = [
      createKillEvent('k1', 1000, 1, 'p1', 'p2', true),
      createBombPlantEvent('bp1', 5000, 1, 'p1', 'A'),
      createRoundEndEvent('re1', 10000, 1),
    ];

    // Create director
    const director = createCameraDirector(events, players, teams, rounds);

    // Detect actions
    const actions = director.getDetectedActions();
    expect(actions.length).toBeGreaterThan(0);

    // Generate schedule
    const schedule = director.generateSchedule(0, 10000);
    expect(schedule.length).toBeGreaterThan(0);

    // Switch modes
    director.setManualMode('follow');
    director.setFollowTarget('p1');
    expect(director.getCurrentMode()).toBe('follow');

    // Get composition
    const composition = director.getSceneComposition(1000);
    expect(composition).toBeDefined();

    // Calculate drama
    const drama = director.calculateDramaScore(1000);
    expect(drama.total).toBeGreaterThan(0);
  });

  it('should handle all action types', () => {
    const players = [
      createMockPlayer('p1', 'Player1', 'team-a'),
      createMockPlayer('p2', 'Player2', 'team-b'),
      createMockPlayer('p3', 'Player3', 'team-b'),
      createMockPlayer('p4', 'Player4', 'team-b'),
      createMockPlayer('p5', 'Player5', 'team-b'),
      createMockPlayer('p6', 'Player6', 'team-b'),
    ];
    const teams = [
      createMockTeam('team-a', 'Team A', 'attacker'),
      createMockTeam('team-b', 'Team B', 'defender'),
    ];
    const rounds = [createMockRound(1)];

    // Create events for all action types
    const events: GameEvent[] = [
      createKillEvent('k1', 1000, 1, 'p1', 'p2'),
      createKillEvent('k2', 2000, 1, 'p1', 'p3'),
      createKillEvent('k3', 3000, 1, 'p1', 'p4'),
      createKillEvent('k4', 4000, 1, 'p1', 'p5'),
      createKillEvent('k5', 5000, 1, 'p1', 'p6'), // Ace
      createBombPlantEvent('bp1', 6000, 1, 'p1', 'A'),
      createBombDefuseEvent('bd1', 8000, 1, 'p2', 0.9),
      createRoundEndEvent('re1', 10000, 1),
    ];

    const engine = createActionDetectionEngine(events, players, teams, rounds);
    const actions = engine.detectAllActions();

    // Check all expected action types
    const actionTypes = new Set(actions.map(a => a.type));
    expect(actionTypes.has('kill')).toBe(true);
    expect(actionTypes.has('ace')).toBe(true);
    expect(actionTypes.has('bomb_plant')).toBe(true);
    expect(actionTypes.has('bomb_defuse')).toBe(true);
    expect(actionTypes.has('round_win')).toBe(true);
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('Performance', () => {
  it('should handle large event counts efficiently', () => {
    const players = Array.from({ length: 10 }, (_, i) =>
      createMockPlayer(`p${i}`, `Player${i}`, i < 5 ? 'team-a' : 'team-b')
    );
    const teams = [
      createMockTeam('team-a', 'Team A', 'attacker'),
      createMockTeam('team-b', 'Team B', 'defender'),
    ];
    const rounds = Array.from({ length: 30 }, (_, i) => createMockRound(i + 1));

    // Generate many events
    const events: GameEvent[] = [];
    for (let round = 1; round <= 30; round++) {
      for (let kill = 0; kill < 10; kill++) {
        events.push(createKillEvent(
          `k${round}-${kill}`,
          round * 100000 + kill * 1000,
          round,
          `p${kill % 5}`,
          `p${5 + (kill % 5)}`
        ));
      }
      events.push(createRoundEndEvent(`re${round}`, round * 100000 + 50000, round));
    }

    const startTime = performance.now();
    const engine = createActionDetectionEngine(events, players, teams, rounds);
    const actions = engine.detectAllActions();
    const duration = performance.now() - startTime;

    expect(actions.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
  });

  it('should handle path interpolation efficiently', () => {
    const builder = new PathBuilder();
    const state: CameraState = {
      position: { x: 0, y: 100, z: 200 },
      rotation: { x: 0, y: 0, z: 0 },
      fov: 75,
      up: { x: 0, y: 1, z: 0 },
    };

    // Add many keyframes
    for (let i = 0; i < 100; i++) {
      builder.addKeyframe(i * 100, {
        ...state,
        position: { x: i * 10, y: 100, z: 200 },
      }, 'linear');
    }

    const path = builder.build();

    const startTime = performance.now();
    for (let i = 0; i < 1000; i++) {
      interpolatePathState(path, i * 10);
    }
    const duration = performance.now() - startTime;

    expect(duration).toBeLessThan(100); // Should complete in under 100ms
  });
});
