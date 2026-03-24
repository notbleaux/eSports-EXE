/** [Ver001.000] */
/**
 * Sync & Multi-view Tests
 * =======================
 * Tests for timeline synchronization, multi-view state, and POV switching.
 * 
 * Targets: Sync accuracy <50ms, 15+ tests
 * Agent: TL-S2-2-D
 * Team: Replay 2.0 Core (TL-S2)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// Import modules under test
import {
  SyncManager,
  SYNC_CONSTANTS,
  calculateAdaptiveBuffer,
  formatDrift,
  isSyncAcceptable,
  getSyncStatusIndicator,
  type SyncAdapter,
  type SyncState,
} from '../sync';

import {
  useMultiViewStore,
  LAYOUT_PRESETS,
  MAX_POV_COUNT,
  MAX_SYNC_DRIFT_MS,
  DEFAULT_TOOLS,
  type LayoutType,
  validateLayout,
  getAvailablePOVs,
} from '../state';

import {
  POVSwitcher,
  TransitionController,
  POVAvailabilityChecker,
  TRANSITION_PRESETS,
  validatePOV,
  type TransitionType,
  type POVAssignment,
} from '../povSwitcher';

// ============================================================================
// Test Fixtures
// ============================================================================

function createMockAdapter(id: string, initialTime = 0): SyncAdapter {
  let currentTime = initialTime;
  let bufferEnd = initialTime + 5000;
  let ready = true;
  let speed = 1;

  return {
    id,
    getCurrentTime: () => currentTime,
    seek: (time: number) => { currentTime = time; },
    setPlaybackSpeed: (s: number) => { speed = s; },
    getBufferEnd: () => bufferEnd,
    isReady: () => ready,
  };
}

function createMockPlayers(count = 10): Array<{
  id: string;
  name: string;
  teamId: string;
  teamSide: string;
  isAlive?: boolean;
}> {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i}`,
    name: `Player ${i + 1}`,
    teamId: i < 5 ? 'team-a' : 'team-b',
    teamSide: i < 5 ? 'attacker' : 'defender',
    isAlive: true,
  }));
}

// ============================================================================
// Sync Manager Tests
// ============================================================================

describe('SyncManager', () => {
  let manager: SyncManager;

  beforeEach(() => {
    manager = new SyncManager();
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('Registration', () => {
    it('should register adapters', () => {
      const adapter = createMockAdapter('view-1');
      manager.registerAdapter(adapter);

      const state = manager.getSyncState();
      expect(state.viewStatuses.has('view-1')).toBe(true);
    });

    it('should unregister adapters', () => {
      const adapter = createMockAdapter('view-1');
      manager.registerAdapter(adapter);
      manager.unregisterAdapter('view-1');

      const state = manager.getSyncState();
      expect(state.viewStatuses.has('view-1')).toBe(false);
    });

    it('should handle multiple adapters', () => {
      for (let i = 0; i < 5; i++) {
        manager.registerAdapter(createMockAdapter(`view-${i}`));
      }

      const state = manager.getSyncState();
      expect(state.viewStatuses.size).toBe(5);
    });
  });

  describe('Time Synchronization', () => {
    it('should sync all views to master time', () => {
      const adapter1 = createMockAdapter('view-1', 0);
      const adapter2 = createMockAdapter('view-2', 100);

      manager.registerAdapter(adapter1);
      manager.registerAdapter(adapter2);

      manager.setMasterTime(5000);

      expect(adapter1.getCurrentTime()).toBe(5000);
      expect(adapter2.getCurrentTime()).toBeLessThan(5100); // Should have been adjusted
    });

    it('should maintain sync within 50ms drift', async () => {
      const adapter = createMockAdapter('view-1', 0);
      manager.registerAdapter(adapter);

      manager.setMasterTime(10000);

      // Small drift should not trigger resync
      adapter.seek(10030);
      manager.setMasterTime(10000);

      const status = manager.getViewStatus('view-1');
      expect(status?.isSynced).toBe(true);
      expect(status?.drift).toBeLessThanOrEqual(SYNC_CONSTANTS.MAX_DRIFT_MS);
    });

    it('should detect sync loss when drift exceeds threshold', () => {
      const adapter = createMockAdapter('view-1', 0);
      manager.registerAdapter(adapter);

      manager.setMasterTime(10000);

      // Large drift should trigger resync
      adapter.seek(10200);
      manager.setMasterTime(10000);

      const status = manager.getViewStatus('view-1');
      expect(status?.drift).toBeGreaterThan(SYNC_CONSTANTS.MAX_DRIFT_MS);
    });

    it('should sync 5 POVs simultaneously', () => {
      const adapters = Array.from({ length: 5 }, (_, i) => 
        createMockAdapter(`view-${i}`, i * 100)
      );

      adapters.forEach(a => manager.registerAdapter(a));

      manager.setMasterTime(5000, true);

      adapters.forEach(adapter => {
        expect(adapter.getCurrentTime()).toBe(5000);
      });
    });
  });

  describe('Buffer Management', () => {
    it('should track buffer health', () => {
      const adapter = createMockAdapter('view-1', 0);
      manager.registerAdapter(adapter);

      manager.setMasterTime(1000);
      manager.updateBuffer('view-1', 5000);

      const status = manager.getViewStatus('view-1');
      expect(status?.bufferHealth).toBeGreaterThan(0);
      expect(status?.bufferHealth).toBeLessThanOrEqual(1);
    });

    it('should detect low buffer', () => {
      const events: Array<{ type: string; viewId?: string }> = [];
      
      manager.onEvent((event) => {
        events.push({ type: event.type, viewId: event.viewId });
      });

      const adapter = createMockAdapter('view-1', 0);
      manager.registerAdapter(adapter);

      manager.setMasterTime(10000);
      manager.updateBuffer('view-1', 10100); // Only 100ms buffer

      expect(events.some(e => e.type === 'buffer-update' && e.viewId === 'view-1')).toBe(true);
    });

    it('should calculate global buffer health', () => {
      for (let i = 0; i < 3; i++) {
        manager.registerAdapter(createMockAdapter(`view-${i}`, 0));
        manager.updateBuffer(`view-${i}`, 5000 + i * 1000);
      }

      manager.setMasterTime(1000);

      const state = manager.getSyncState();
      expect(state.globalBufferHealth).toBeGreaterThan(0);
    });
  });

  describe('Playback Control', () => {
    it('should set playback state', () => {
      manager.setPlaybackState(true);
      expect(manager.getSyncState().isPlaying).toBe(true);

      manager.setPlaybackState(false);
      expect(manager.getSyncState().isPlaying).toBe(false);
    });

    it('should set playback speed on all adapters', () => {
      const adapter1 = createMockAdapter('view-1');
      const adapter2 = createMockAdapter('view-2');

      manager.registerAdapter(adapter1);
      manager.registerAdapter(adapter2);

      manager.setPlaybackSpeed(2);

      expect(manager.getSyncState().playbackSpeed).toBe(2);
    });
  });

  describe('Event System', () => {
    it('should emit time-update events', () => {
      const events: string[] = [];
      manager.onEvent((event) => {
        events.push(event.type);
      });

      manager.registerAdapter(createMockAdapter('view-1'));
      manager.setMasterTime(1000);

      expect(events).toContain('time-update');
    });

    it('should emit sync-lost events', () => {
      const events: Array<{ type: string; data?: unknown }> = [];
      manager.onEvent((event) => {
        events.push({ type: event.type, data: event.data });
      });

      const adapter = createMockAdapter('view-1', 0);
      manager.registerAdapter(adapter);

      manager.startSync();
      manager.setMasterTime(10000);
      adapter.seek(10200); // Cause drift

      // Wait for sync check
      vi.advanceTimersByTime(100);

      const syncLostEvent = events.find(e => e.type === 'sync-lost');
      expect(syncLostEvent).toBeDefined();
    });

    it('should support multiple listeners', () => {
      const listener1Events: string[] = [];
      const listener2Events: string[] = [];

      manager.onEvent((e) => listener1Events.push(e.type));
      manager.onEvent((e) => listener2Events.push(e.type));

      manager.registerAdapter(createMockAdapter('view-1'));
      manager.setMasterTime(1000);

      expect(listener1Events.length).toBeGreaterThan(0);
      expect(listener2Events.length).toBe(listener1Events.length);
    });
  });

  describe('Ready State', () => {
    it('should check if all views are ready', () => {
      manager.registerAdapter(createMockAdapter('view-1'));
      manager.registerAdapter(createMockAdapter('view-2'));

      expect(manager.areAllViewsReady()).toBe(true);
    });

    it('should wait for all views to be ready', async () => {
      const adapter = createMockAdapter('view-1');
      manager.registerAdapter(adapter);

      const result = await manager.waitForAllReady(100);
      expect(result).toBe(true);
    });
  });
});

// ============================================================================
// Sync Constants Tests
// ============================================================================

describe('Sync Constants', () => {
  it('should have MAX_DRIFT_MS of 50ms', () => {
    expect(SYNC_CONSTANTS.MAX_DRIFT_MS).toBe(50);
  });

  it('should have check interval of ~60fps', () => {
    expect(SYNC_CONSTANTS.CHECK_INTERVAL_MS).toBe(16);
  });

  it('should have default buffer config', () => {
    expect(SYNC_CONSTANTS.DEFAULT_BUFFER_CONFIG.preBuffer).toBe(2000);
    expect(SYNC_CONSTANTS.DEFAULT_BUFFER_CONFIG.postBuffer).toBe(1000);
    expect(SYNC_CONSTANTS.DEFAULT_BUFFER_CONFIG.lowThreshold).toBe(0.3);
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('Sync Utilities', () => {
  describe('calculateAdaptiveBuffer', () => {
    it('should return base buffer for no latency data', () => {
      const result = calculateAdaptiveBuffer(2000, []);
      expect(result).toBe(2000);
    });

    it('should increase buffer for high variance', () => {
      const latencies = [50, 150, 50, 150, 50]; // High variance
      const result = calculateAdaptiveBuffer(2000, latencies);
      expect(result).toBeGreaterThan(2000);
    });

    it('should cap buffer at 3x base', () => {
      const latencies = [1000, 2000, 3000]; // Very high latency
      const result = calculateAdaptiveBuffer(2000, latencies);
      expect(result).toBeLessThanOrEqual(6000);
    });
  });

  describe('formatDrift', () => {
    it('should format sub-ms as <1ms', () => {
      expect(formatDrift(0.5)).toBe('<1ms');
    });

    it('should format ms correctly', () => {
      expect(formatDrift(50)).toBe('50ms');
    });

    it('should format seconds correctly', () => {
      expect(formatDrift(1500)).toBe('1.5s');
    });
  });

  describe('isSyncAcceptable', () => {
    it('should return true for drift <= 50ms', () => {
      expect(isSyncAcceptable(50)).toBe(true);
      expect(isSyncAcceptable(30)).toBe(true);
    });

    it('should return false for drift > 50ms', () => {
      expect(isSyncAcceptable(51)).toBe(false);
      expect(isSyncAcceptable(100)).toBe(false);
    });
  });

  describe('getSyncStatusIndicator', () => {
    it('should return green when all synced', () => {
      const state: SyncState = {
        masterTime: 1000,
        isPlaying: true,
        playbackSpeed: 1,
        viewStatuses: new Map([['view-1', { 
          viewId: 'view-1', 
          currentTime: 1000, 
          bufferedEnd: 5000,
          bufferHealth: 1, 
          drift: 10, 
          isSynced: true, 
          lastUpdate: Date.now() 
        }]]),
        globalBufferHealth: 1,
        worstDrift: 10,
        allSynced: true,
      };

      const indicator = getSyncStatusIndicator(state);
      expect(indicator.color).toBe('green');
      expect(indicator.syncedCount).toBe(1);
    });

    it('should return red when sync lost', () => {
      const state: SyncState = {
        masterTime: 1000,
        isPlaying: true,
        playbackSpeed: 1,
        viewStatuses: new Map([['view-1', { 
          viewId: 'view-1', 
          currentTime: 1200, 
          bufferedEnd: 5000,
          bufferHealth: 1, 
          drift: 200, 
          isSynced: false, 
          lastUpdate: Date.now() 
        }]]),
        globalBufferHealth: 1,
        worstDrift: 200,
        allSynced: false,
      };

      const indicator = getSyncStatusIndicator(state);
      expect(indicator.color).toBe('red');
    });

    it('should return gray when not playing', () => {
      const state: SyncState = {
        masterTime: 1000,
        isPlaying: false,
        playbackSpeed: 1,
        viewStatuses: new Map(),
        globalBufferHealth: 1,
        worstDrift: 0,
        allSynced: true,
      };

      const indicator = getSyncStatusIndicator(state);
      expect(indicator.color).toBe('gray');
    });
  });
});

// ============================================================================
// Multi-view State Tests
// ============================================================================

describe('MultiView State', () => {
  beforeEach(() => {
    // Reset store to initial state
    const store = useMultiViewStore.getState();
    store.setLayout('single');
    store.resetTools();
    store.setAvailablePlayers([]);
  });

  describe('Layout Management', () => {
    it('should set layout type', () => {
      const store = useMultiViewStore.getState();
      store.setLayout('quad');

      expect(store.layout.type).toBe('quad');
      expect(store.layout.slots).toHaveLength(4);
    });

    it('should have correct slot count for each layout', () => {
      const store = useMultiViewStore.getState();

      const testCases: [LayoutType, number][] = [
        ['single', 1],
        ['split', 2],
        ['triple', 3],
        ['quad', 4],
        ['main-plus-3', 4],
        ['pip', 2],
      ];

      testCases.forEach(([layout, expectedSlots]) => {
        store.setLayout(layout);
        expect(store.layout.slots).toHaveLength(expectedSlots);
      });
    });

    it('should update slot POV', () => {
      const store = useMultiViewStore.getState();
      store.setLayout('split');

      store.updateSlotPOV('slot-0', { playerId: 'player-1', viewMode: 'fpv' });

      const slot = store.layout.slots.find(s => s.id === 'slot-0');
      expect(slot?.pov.playerId).toBe('player-1');
      expect(slot?.pov.viewMode).toBe('fpv');
    });

    it('should swap slots', () => {
      const store = useMultiViewStore.getState();
      store.setLayout('split');

      store.updateSlotPOV('slot-0', { playerId: 'player-1' });
      store.updateSlotPOV('slot-1', { playerId: 'player-2' });

      store.swapSlots('slot-0', 'slot-1');

      const slot0 = store.layout.slots.find(s => s.id === 'slot-0');
      const slot1 = store.layout.slots.find(s => s.id === 'slot-1');

      expect(slot0?.pov.playerId).toBe('player-2');
      expect(slot1?.pov.playerId).toBe('player-1');
    });
  });

  describe('Focus Mode', () => {
    it('should enter focus mode', () => {
      const store = useMultiViewStore.getState();
      store.setLayout('quad');

      store.enterFocusMode('slot-0');

      expect(store.focusedSlotId).toBe('slot-0');
      expect(store.previousLayout).toBe('quad');
    });

    it('should exit focus mode', () => {
      const store = useMultiViewStore.getState();
      store.setLayout('quad');
      store.enterFocusMode('slot-0');
      store.exitFocusMode();

      expect(store.focusedSlotId).toBeNull();
      expect(store.layout.type).toBe('quad');
    });

    it('should toggle focus', () => {
      const store = useMultiViewStore.getState();
      store.setLayout('quad');

      store.toggleFocus('slot-0');
      expect(store.focusedSlotId).toBe('slot-0');

      store.toggleFocus('slot-0');
      expect(store.focusedSlotId).toBeNull();
    });
  });

  describe('Observer Tools', () => {
    it('should toggle tools', () => {
      const store = useMultiViewStore.getState();

      store.toggleTool('xrayMode');
      expect(store.tools.xrayMode).toBe(true);

      store.toggleTool('xrayMode');
      expect(store.tools.xrayMode).toBe(false);
    });

    it('should set tool value', () => {
      const store = useMultiViewStore.getState();

      store.setTool('trajectoryVisualization', true);
      expect(store.tools.trajectoryVisualization).toBe(true);
    });

    it('should reset tools to defaults', () => {
      const store = useMultiViewStore.getState();

      store.setTool('xrayMode', true);
      store.setTool('trajectoryVisualization', true);
      store.resetTools();

      expect(store.tools).toEqual(DEFAULT_TOOLS);
    });
  });

  describe('Player Management', () => {
    it('should set available players', () => {
      const store = useMultiViewStore.getState();
      const players = createMockPlayers(10);

      store.setAvailablePlayers(players);

      expect(store.availablePlayers).toHaveLength(10);
    });

    it('should update player status', () => {
      const store = useMultiViewStore.getState();
      const players = createMockPlayers(10);

      store.setAvailablePlayers(players);
      store.updatePlayerStatus('player-0', false);

      const player = store.availablePlayers.find(p => p.id === 'player-0');
      expect(player?.isAlive).toBe(false);
    });
  });

  describe('Layout Validation', () => {
    it('should validate correct layout', () => {
      const layout = {
        type: 'quad' as LayoutType,
        ...LAYOUT_PRESETS.quad,
      };

      const result = validateLayout(layout);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect overlapping slots', () => {
      const layout = {
        type: 'custom' as LayoutType,
        slots: [
          {
            id: 'slot-0',
            name: 'Slot 1',
            pov: { playerId: null, viewMode: 'free' as const },
            isFocused: false,
            isVisible: true,
            position: { x: 0, y: 0 },
            size: { width: 50, height: 50 },
            zIndex: 1,
          },
          {
            id: 'slot-1',
            name: 'Slot 2',
            pov: { playerId: null, viewMode: 'free' as const },
            isFocused: false,
            isVisible: true,
            position: { x: 25, y: 25 }, // Overlaps with slot-0
            size: { width: 50, height: 50 },
            zIndex: 1,
          },
        ],
        isDraggable: true,
        isResizable: false,
      };

      const result = validateLayout(layout);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Slots slot-0 and slot-1 overlap');
    });

    it('should enforce max POV count', () => {
      const layout = {
        type: 'custom' as LayoutType,
        slots: Array.from({ length: 15 }, (_, i) => ({
          id: `slot-${i}`,
          name: `Slot ${i}`,
          pov: { playerId: null, viewMode: 'free' as const },
          isFocused: false,
          isVisible: true,
          position: { x: 0, y: 0 },
          size: { width: 10, height: 10 },
          zIndex: 1,
        })),
        isDraggable: true,
        isResizable: false,
      };

      const result = validateLayout(layout);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('more than'))).toBe(true);
    });
  });
});

// ============================================================================
// POV Switcher Tests
// ============================================================================

describe('POV Switcher', () => {
  let manager: SyncManager;
  let switcher: POVSwitcher;

  beforeEach(() => {
    manager = new SyncManager();
    switcher = new POVSwitcher(manager, 'slot-0');
  });

  afterEach(() => {
    switcher.destroy();
    manager.destroy();
  });

  describe('POV Switching', () => {
    it('should switch to player POV', async () => {
      const result = await switcher.switchToPlayer('player-1');
      expect(result).toBe(true);
      expect(switcher.getCurrentPOV()?.playerId).toBe('player-1');
    });

    it('should switch to free camera', async () => {
      await switcher.switchToFreeCamera();
      
      const pov = switcher.getCurrentPOV();
      expect(pov?.playerId).toBeNull();
      expect(pov?.viewMode).toBe('free');
    });

    it('should switch to map view', async () => {
      await switcher.switchToMap();
      
      const pov = switcher.getCurrentPOV();
      expect(pov?.viewMode).toBe('map');
    });

    it('should not switch to same POV', async () => {
      await switcher.switchToPlayer('player-1');
      const result = await switcher.switchToPlayer('player-1');
      
      expect(result).toBe(true); // Returns true for idempotent operation
    });
  });

  describe('Transition Controller', () => {
    let controller: TransitionController;

    beforeEach(() => {
      controller = new TransitionController();
    });

    it('should handle instant transition', async () => {
      const fromPos = { position: { x: 0, y: 0, z: 0 }, rotation: { pitch: 0, yaw: 0, roll: 0 }, fov: 90 };
      const toPos = { position: { x: 100, y: 0, z: 0 }, rotation: { pitch: 0, yaw: 0, roll: 0 }, fov: 90 };

      await controller.startTransition(
        TRANSITION_PRESETS.instant,
        fromPos,
        toPos
      );

      expect(controller.isActive()).toBe(false);
    });

    it('should handle animated transition', async () => {
      const fromPos = { position: { x: 0, y: 0, z: 0 }, rotation: { pitch: 0, yaw: 0, roll: 0 }, fov: 90 };
      const toPos = { position: { x: 100, y: 0, z: 0 }, rotation: { pitch: 0, yaw: 0, roll: 0 }, fov: 90 };

      const promise = controller.startTransition(
        TRANSITION_PRESETS.fade,
        fromPos,
        toPos
      );

      expect(controller.isActive()).toBe(true);

      await promise;
      expect(controller.isActive()).toBe(false);
    });

    it('should abort transition', async () => {
      const fromPos = { position: { x: 0, y: 0, z: 0 }, rotation: { pitch: 0, yaw: 0, roll: 0 }, fov: 90 };
      const toPos = { position: { x: 100, y: 0, z: 0 }, rotation: { pitch: 0, yaw: 0, roll: 0 }, fov: 90 };

      controller.startTransition(TRANSITION_PRESETS.fade, fromPos, toPos);
      controller.abort();

      expect(controller.isActive()).toBe(false);
    });

    it('should call onComplete callback', async () => {
      const callback = vi.fn();
      const fromPos = { position: { x: 0, y: 0, z: 0 }, rotation: { pitch: 0, yaw: 0, roll: 0 }, fov: 90 };
      const toPos = { position: { x: 100, y: 0, z: 0 }, rotation: { pitch: 0, yaw: 0, roll: 0 }, fov: 90 };

      controller.onComplete(callback);
      await controller.startTransition(TRANSITION_PRESETS.instant, fromPos, toPos);

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('POV Availability', () => {
    it('should check player availability', () => {
      const players = createMockPlayers(5);
      const slots = [
        {
          id: 'slot-0',
          name: 'Slot 0',
          pov: { playerId: 'player-0', viewMode: 'fpv' as const },
          isFocused: false,
          isVisible: true,
          position: { x: 0, y: 0 },
          size: { width: 50, height: 100 },
          zIndex: 1,
        },
        {
          id: 'slot-1',
          name: 'Slot 1',
          pov: { playerId: null, viewMode: 'free' as const },
          isFocused: false,
          isVisible: true,
          position: { x: 50, y: 0 },
          size: { width: 50, height: 100 },
          zIndex: 1,
        },
      ];

      const available = POVAvailabilityChecker.getAvailablePOVs(players, slots, 'slot-1');

      expect(available.find(p => p.playerId === 'player-0')).toBeUndefined();
      expect(available.find(p => p.playerId === 'player-1')).toBeDefined();
    });

    it('should find next available player', () => {
      const players = createMockPlayers(3);
      const slots: typeof players = [];

      const nextPlayer = POVAvailabilityChecker.findNextAvailable(
        'player-0',
        players,
        [],
        undefined,
        'next'
      );

      expect(nextPlayer).toBe('player-1');
    });

    it('should find previous available player', () => {
      const players = createMockPlayers(3);

      const prevPlayer = POVAvailabilityChecker.findNextAvailable(
        'player-1',
        players,
        [],
        undefined,
        'previous'
      );

      expect(prevPlayer).toBe('player-0');
    });

    it('should wrap around at end of player list', () => {
      const players = createMockPlayers(3);

      const nextPlayer = POVAvailabilityChecker.findNextAvailable(
        'player-2',
        players,
        [],
        undefined,
        'next'
      );

      expect(nextPlayer).toBe('player-0');
    });
  });

  describe('POV Validation', () => {
    it('should validate valid POV', () => {
      const pov: POVAssignment = { playerId: 'player-1', viewMode: 'fpv' };
      const result = validatePOV(pov);
      expect(result.valid).toBe(true);
    });

    it('should reject FPV without player ID', () => {
      const pov: POVAssignment = { playerId: null, viewMode: 'fpv' };
      const result = validatePOV(pov);
      expect(result.valid).toBe(false);
    });

    it('should allow free camera without player ID', () => {
      const pov: POVAssignment = { playerId: null, viewMode: 'free' };
      const result = validatePOV(pov);
      expect(result.valid).toBe(true);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Multi-view Integration', () => {
  it('should support 5 simultaneous POVs with sync', async () => {
    const manager = new SyncManager();
    const switchers: POVSwitcher[] = [];

    // Create 5 POV switchers
    for (let i = 0; i < 5; i++) {
      const switcher = new POVSwitcher(manager, `slot-${i}`);
      await switcher.switchToPlayer(`player-${i}`);
      switchers.push(switcher);
    }

    // Verify all POVs are set
    switchers.forEach((switcher, i) => {
      expect(switcher.getCurrentPOV()?.playerId).toBe(`player-${i}`);
    });

    // Cleanup
    switchers.forEach(s => s.destroy());
    manager.destroy();
  });

  it('should maintain sync across all views', () => {
    const manager = new SyncManager();

    // Register 5 adapters
    for (let i = 0; i < 5; i++) {
      manager.registerAdapter(createMockAdapter(`view-${i}`, i * 100));
    }

    // Set master time
    manager.setMasterTime(10000, true);

    // Check all views are synced
    const state = manager.getSyncState();
    expect(state.allSynced).toBe(true);
    expect(state.viewStatuses.size).toBe(5);

    manager.destroy();
  });

  it('should handle layout change with POV persistence', () => {
    const store = useMultiViewStore.getState();

    // Setup initial state
    store.setLayout('split');
    store.updateSlotPOV('slot-0', { playerId: 'player-1', viewMode: 'fpv' });

    // Change layout
    store.setLayout('quad');

    // POV should be reset for new slots
    const slot0 = store.layout.slots.find(s => s.id === 'slot-0');
    expect(slot0?.pov.playerId).toBeNull(); // New layout resets POVs

    // Reset store
    store.setLayout('single');
  });
});

// ============================================================================
// Export Tests
// ============================================================================

describe('Module Exports', () => {
  it('should export sync constants', () => {
    expect(SYNC_CONSTANTS.MAX_DRIFT_MS).toBe(50);
    expect(MAX_SYNC_DRIFT_MS).toBe(50);
  });

  it('should export layout presets', () => {
    expect(LAYOUT_PRESETS).toBeDefined();
    expect(LAYOUT_PRESETS.quad).toBeDefined();
    expect(LAYOUT_PRESETS.quad.slots).toHaveLength(4);
  });

  it('should export transition presets', () => {
    expect(TRANSITION_PRESETS).toBeDefined();
    expect(TRANSITION_PRESETS.fade.duration).toBe(300);
  });

  it('should export default tools', () => {
    expect(DEFAULT_TOOLS).toBeDefined();
    expect(DEFAULT_TOOLS.xrayMode).toBe(false);
    expect(DEFAULT_TOOLS.playerInfoOverlay).toBe(true);
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('Sync Performance', () => {
  it('should sync 5 views in under 10ms', () => {
    const manager = new SyncManager();

    for (let i = 0; i < 5; i++) {
      manager.registerAdapter(createMockAdapter(`view-${i}`));
    }

    const start = performance.now();
    manager.setMasterTime(5000, true);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(10);
    manager.destroy();
  });

  it('should handle rapid time updates', () => {
    const manager = new SyncManager();
    manager.registerAdapter(createMockAdapter('view-1'));

    const start = performance.now();
    
    for (let i = 0; i < 100; i++) {
      manager.setMasterTime(i * 100);
    }
    
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50); // 100 updates in 50ms
    manager.destroy();
  });
});
