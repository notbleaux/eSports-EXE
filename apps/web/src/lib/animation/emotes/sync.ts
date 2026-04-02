// @ts-nocheck
/** [Ver001.000]
 * Synchronized Emotes System
 * ==========================
 * Advanced synchronization system for team emotes and crowd reactions.
 * Provides timing coordination, leader election, and network sync.
 * 
 * Features:
 * - Team synchronized emotes
 * - Crowd emote coordination
 * - Timing synchronization
 * - Leader election
 * - Network latency compensation
 */

import type { EmoteDefinition, EmotePlayOptions } from './library';
import type { EmoteController } from './controller';

// ============================================================================
// Types
// ============================================================================

export type SyncRole = 'leader' | 'follower' | 'solo';

export type SyncState = 
  | 'idle'
  | 'syncing'
  | 'waiting_for_leader'
  | 'countdown'
  | 'playing'
  | 'completed'
  | 'error';

export type SyncEventType =
  | 'syncStart'
  | 'syncReady'
  | 'countdownStart'
  | 'countdownTick'
  | 'emoteStart'
  | 'emoteComplete'
  | 'memberJoined'
  | 'memberLeft'
  | 'syncError'
  | 'leaderChanged';

export interface SyncEvent {
  type: SyncEventType;
  timestamp: number;
  memberId?: string;
  data?: Record<string, unknown>;
}

export type SyncEventHandler = (event: SyncEvent) => void;

export interface SyncMember {
  id: string;
  name: string;
  role: SyncRole;
  isReady: boolean;
  latency: number; // ms
  mascotId?: string;
  joinedAt: number;
}

export interface SyncSession {
  id: string;
  emoteId: string;
  leaderId: string;
  members: Map<string, SyncMember>;
  startTime: number | null;
  countdownDuration: number;
  state: SyncState;
  maxMembers: number;
}

export interface SyncOptions {
  role?: SyncRole;
  countdownDuration?: number; // seconds
  maxMembers?: number;
  autoElectLeader?: boolean;
  latencyCompensation?: boolean;
  debug?: boolean;
}

export interface CrowdEmoteConfig {
  density: number;        // 0-1, how many mascots participate
  spread: number;         // 0-1, spatial spread
  staggerDelay: number;   // ms between individual starts
  randomOffset: number;   // ms random offset range
  wavePattern?: boolean;  // wave effect through crowd
}

export interface NetworkLatencyInfo {
  localLatency: number;
  avgGroupLatency: number;
  maxLatency: number;
  compensation: number;
}

// ============================================================================
// Synchronized Emote Controller
// ============================================================================

export class SyncedEmoteController {
  private session: SyncSession | null = null;
  private emoteController: EmoteController;
  private localId: string;
  private options: Required<SyncOptions>;
  private listeners: Map<SyncEventType, Set<SyncEventHandler>> = new Map();
  private countdownInterval: number | null = null;
  private isDisposed = false;

  constructor(
    emoteController: EmoteController,
    localId: string,
    options: SyncOptions = {}
  ) {
    this.emoteController = emoteController;
    this.localId = localId;
    this.options = {
      role: 'solo',
      countdownDuration: 3,
      maxMembers: 10,
      autoElectLeader: true,
      latencyCompensation: true,
      debug: false,
      ...options,
    };

    this.log('debug', 'Synced emote controller initialized');
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  /**
   * Create a new sync session as leader
   */
  createSession(emoteId: string, options?: Partial<SyncOptions>): SyncSession {
    const sessionId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.session = {
      id: sessionId,
      emoteId,
      leaderId: this.localId,
      members: new Map(),
      startTime: null,
      countdownDuration: options?.countdownDuration ?? this.options.countdownDuration,
      state: 'idle',
      maxMembers: options?.maxMembers ?? this.options.maxMembers,
    };

    // Add self as leader
    this.addMember({
      id: this.localId,
      name: 'You',
      role: 'leader',
      isReady: true,
      latency: 0,
      joinedAt: Date.now(),
    });

    this.log('debug', `Created sync session: ${sessionId}`);
    return this.session;
  }

  /**
   * Join an existing sync session
   */
  joinSession(sessionId: string, emoteId: string): boolean {
    if (this.session) {
      this.log('warn', 'Already in a session, leave first');
      return false;
    }

    this.session = {
      id: sessionId,
      emoteId,
      leaderId: '', // Will be set when leader info received
      members: new Map(),
      startTime: null,
      countdownDuration: this.options.countdownDuration,
      state: 'waiting_for_leader',
      maxMembers: this.options.maxMembers,
    };

    // Add self as follower
    this.addMember({
      id: this.localId,
      name: 'You',
      role: 'follower',
      isReady: false,
      latency: 0,
      joinedAt: Date.now(),
    });

    this.emit('memberJoined', this.localId);
    this.log('debug', `Joined sync session: ${sessionId}`);
    return true;
  }

  /**
   * Leave current session
   */
  leaveSession(): void {
    if (!this.session) return;

    this.emit('memberLeft', this.localId);
    
    // If leader, transfer leadership
    if (this.session.leaderId === this.localId && this.options.autoElectLeader) {
      this.electNewLeader();
    }

    this.clearCountdown();
    this.session = null;
    this.log('debug', 'Left sync session');
  }

  /**
   * Get current session
   */
  getSession(): SyncSession | null {
    return this.session ? { ...this.session, members: new Map(this.session.members) } : null;
  }

  /**
   * Check if in a session
   */
  isInSession(): boolean {
    return this.session !== null;
  }

  // ============================================================================
  // Member Management
  // ============================================================================

  /**
   * Add a member to the session
   */
  addMember(member: SyncMember): void {
    if (!this.session) return;
    if (this.session.members.size >= this.session.maxMembers) {
      this.log('warn', 'Session is full');
      return;
    }

    this.session.members.set(member.id, member);
    this.emit('memberJoined', member.id, { role: member.role });
    this.log('debug', `Member joined: ${member.id} (${member.role})`);
  }

  /**
   * Remove a member from the session
   */
  removeMember(memberId: string): void {
    if (!this.session) return;

    this.session.members.delete(memberId);
    this.emit('memberLeft', memberId);
    this.log('debug', `Member left: ${memberId}`);

    // If leader left, elect new leader
    if (memberId === this.session.leaderId && this.options.autoElectLeader) {
      this.electNewLeader();
    }
  }

  /**
   * Update member ready status
   */
  setReady(isReady: boolean): void {
    if (!this.session) return;

    const member = this.session.members.get(this.localId);
    if (member) {
      member.isReady = isReady;
      this.log('debug', `Ready status: ${isReady}`);

      if (isReady) {
        this.emit('syncReady', this.localId);
      }

      // If leader and all ready, start countdown
      if (this.session.leaderId === this.localId && isReady) {
        this.checkAllReady();
      }
    }
  }

  /**
   * Update member latency
   */
  updateLatency(memberId: string, latency: number): void {
    if (!this.session) return;

    const member = this.session.members.get(memberId);
    if (member) {
      member.latency = latency;
    }
  }

  /**
   * Get all members
   */
  getMembers(): SyncMember[] {
    if (!this.session) return [];
    return Array.from(this.session.members.values());
  }

  /**
   * Get ready member count
   */
  getReadyCount(): number {
    if (!this.session) return 0;
    return Array.from(this.session.members.values()).filter(m => m.isReady).length;
  }

  /**
   * Check if all members are ready
   */
  private checkAllReady(): void {
    if (!this.session) return;

    const allReady = Array.from(this.session.members.values()).every(m => m.isReady);
    if (allReady && this.session.members.size > 1) {
      this.startCountdown();
    }
  }

  /**
   * Elect a new leader
   */
  private electNewLeader(): void {
    if (!this.session) return;

    const members = Array.from(this.session.members.values());
    if (members.length === 0) {
      this.session = null;
      return;
    }

    // Sort by join time, oldest becomes leader
    members.sort((a, b) => a.joinedAt - b.joinedAt);
    const newLeader = members[0];
    
    newLeader.role = 'leader';
    this.session.leaderId = newLeader.id;
    
    this.emit('leaderChanged', newLeader.id);
    this.log('debug', `New leader elected: ${newLeader.id}`);
  }

  // ============================================================================
  // Countdown & Synchronization
  // ============================================================================

  /**
   * Start countdown before emote
   */
  private startCountdown(): void {
    if (!this.session) return;

    this.session.state = 'countdown';
    let count = this.session.countdownDuration;

    this.emit('countdownStart', undefined, { duration: count });
    this.log('debug', `Countdown started: ${count}s`);

    this.countdownInterval = window.setInterval(() => {
      count--;
      this.emit('countdownTick', undefined, { remaining: count });
      this.log('debug', `Countdown: ${count}`);

      if (count <= 0) {
        this.clearCountdown();
        this.startSynchronizedEmote();
      }
    }, 1000);
  }

  /**
   * Clear countdown interval
   */
  private clearCountdown(): void {
    if (this.countdownInterval !== null) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  /**
   * Start the synchronized emote
   */
  private startSynchronizedEmote(): void {
    if (!this.session) return;

    this.session.state = 'playing';
    this.session.startTime = Date.now();

    // Calculate latency compensation
    const latencyInfo = this.calculateLatencyCompensation();
    const delay = latencyInfo.compensation;

    this.log('debug', `Starting synchronized emote with ${delay}ms delay`);

    // Play emote with delay
    setTimeout(() => {
      this.emoteController.play(this.session!.emoteId, {
        force: true,
        onComplete: () => {
          this.session!.state = 'completed';
          this.emit('emoteComplete', this.localId);
        },
      });
      this.emit('emoteStart', this.localId, { latency: latencyInfo });
    }, delay);
  }

  /**
   * Calculate latency compensation
   */
  private calculateLatencyCompensation(): NetworkLatencyInfo {
    if (!this.session || !this.options.latencyCompensation) {
      return {
        localLatency: 0,
        avgGroupLatency: 0,
        maxLatency: 0,
        compensation: 0,
      };
    }

    const members = Array.from(this.session.members.values());
    const latencies = members.map(m => m.latency);
    
    const localLatency = this.session.members.get(this.localId)?.latency ?? 0;
    const avgGroupLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);

    // Compensate to match the slowest member
    const compensation = Math.max(0, maxLatency - localLatency);

    return {
      localLatency,
      avgGroupLatency,
      maxLatency,
      compensation,
    };
  }

  // ============================================================================
  // Crowd Emotes
  // ============================================================================

  /**
   * Trigger a crowd emote
   */
  async triggerCrowdEmote(
    emoteId: string,
    participants: EmoteController[],
    config: Partial<CrowdEmoteConfig> = {}
  ): Promise<void> {
    const fullConfig: CrowdEmoteConfig = {
      density: 0.8,
      spread: 1.0,
      staggerDelay: 50,
      randomOffset: 100,
      wavePattern: false,
      ...config,
    };

    const numParticipants = Math.floor(participants.length * fullConfig.density);
    const selectedParticipants = this.shuffleArray(participants).slice(0, numParticipants);

    this.log('debug', `Triggering crowd emote with ${selectedParticipants.length} participants`);

    if (fullConfig.wavePattern) {
      // Wave pattern - left to right
      await this.playWavePattern(selectedParticipants, emoteId, fullConfig);
    } else {
      // Random staggered pattern
      await this.playRandomPattern(selectedParticipants, emoteId, fullConfig);
    }
  }

  /**
   * Play emotes in wave pattern
   */
  private async playWavePattern(
    participants: EmoteController[],
    emoteId: string,
    config: CrowdEmoteConfig
  ): Promise<void> {
    // Sort by x position (assuming participants have position info)
    // For now, just use index
    const sorted = participants;
    const delayPerParticipant = (config.spread * 1000) / sorted.length;

    sorted.forEach((participant, index) => {
      const delay = index * delayPerParticipant + Math.random() * config.randomOffset;
      
      setTimeout(() => {
        participant.play(emoteId, { force: true });
      }, delay);
    });
  }

  /**
   * Play emotes with random stagger
   */
  private async playRandomPattern(
    participants: EmoteController[],
    emoteId: string,
    config: CrowdEmoteConfig
  ): Promise<void> {
    participants.forEach((participant, index) => {
      const delay = index * config.staggerDelay + Math.random() * config.randomOffset;
      
      setTimeout(() => {
        participant.play(emoteId, { force: true });
      }, delay);
    });
  }

  /**
   * Trigger team celebration
   */
  async triggerTeamCelebration(
    participants: EmoteController[],
    celebrationType: 'victory' | 'defeat' | 'achievement' = 'victory'
  ): Promise<void> {
    const emoteMap = {
      victory: 'team_cheer',
      defeat: 'sad',
      achievement: 'cheer',
    };

    const emoteId = emoteMap[celebrationType];
    
    await this.triggerCrowdEmote(emoteId, participants, {
      density: 1.0,
      wavePattern: celebrationType === 'victory',
      staggerDelay: 30,
    });
  }

  // ============================================================================
  // Team Coordination
  // ============================================================================

  /**
   * Synchronize emote with specific timing
   */
  syncWithTiming(emoteId: string, targetTime: number, options?: EmotePlayOptions): void {
    const now = Date.now();
    const delay = Math.max(0, targetTime - now);

    this.log('debug', `Syncing emote with ${delay}ms delay`);

    setTimeout(() => {
      this.emoteController.play(emoteId, options);
    }, delay);
  }

  /**
   * Request sync from leader
   */
  requestSync(): void {
    if (!this.session || this.session.leaderId === this.localId) return;

    this.session.state = 'syncing';
    this.log('debug', 'Requesting sync from leader');
    // Would send network request to leader
  }

  // ============================================================================
  // Event System
  // ============================================================================

  /**
   * Subscribe to sync events
   */
  on(event: SyncEventType, handler: SyncEventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(handler);

    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  /**
   * Emit a sync event
   */
  private emit(type: SyncEventType, memberId?: string, data?: Record<string, unknown>): void {
    const event: SyncEvent = {
      type,
      timestamp: Date.now(),
      memberId,
      data,
    };

    const handlers = this.listeners.get(type);
    handlers?.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        this.log('error', 'Event handler threw error', { error });
      }
    });
  }

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Shuffle array (Fisher-Yates)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get sync status summary
   */
  getStatus(): {
    inSession: boolean;
    isLeader: boolean;
    memberCount: number;
    readyCount: number;
    state: SyncState;
  } {
    if (!this.session) {
      return {
        inSession: false,
        isLeader: false,
        memberCount: 0,
        readyCount: 0,
        state: 'idle',
      };
    }

    return {
      inSession: true,
      isLeader: this.session.leaderId === this.localId,
      memberCount: this.session.members.size,
      readyCount: this.getReadyCount(),
      state: this.session.state,
    };
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Dispose the controller
   */
  dispose(): void {
    this.isDisposed = true;
    this.clearCountdown();
    this.leaveSession();
    this.listeners.clear();
    this.log('debug', 'Synced emote controller disposed');
  }

  // ============================================================================
  // Debug Logging
  // ============================================================================

  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: Record<string, unknown>
  ): void {
    if (!this.options.debug && level === 'debug') return;

    const prefix = '[SyncedEmoteController]';
    const fullMessage = `${prefix} ${message}`;

    switch (level) {
      case 'debug':
        console.debug(fullMessage, data);
        break;
      case 'info':
        console.info(fullMessage, data);
        break;
      case 'warn':
        console.warn(fullMessage, data);
        break;
      case 'error':
        console.error(fullMessage, data);
        break;
    }
  }
}

// ============================================================================
// Time Synchronization
// ============================================================================

export class TimeSync {
  private timeOffset = 0;
  private latency = 0;
  private samples: number[] = [];
  private readonly maxSamples = 10;

  /**
   * Synchronize time with server
   */
  async synchronize(getServerTime: () => Promise<number>): Promise<void> {
    const startTime = performance.now();
    const serverTime = await getServerTime();
    const endTime = performance.now();

    const roundTripTime = endTime - startTime;
    this.latency = roundTripTime / 2;
    
    // Calculate offset: serverTime = localTime + offset
    const localTimeAtServer = startTime + this.latency;
    this.timeOffset = serverTime - localTimeAtServer;

    this.samples.push(this.timeOffset);
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }

  /**
   * Get synchronized time
   */
  getTime(): number {
    return performance.now() + this.getAverageOffset();
  }

  /**
   * Get average time offset
   */
  private getAverageOffset(): number {
    if (this.samples.length === 0) return 0;
    return this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
  }

  /**
   * Get current latency
   */
  getLatency(): number {
    return this.latency;
  }
}

// ============================================================================
// Sync Coordinator (for managing multiple sync sessions)
// ============================================================================

export class SyncCoordinator {
  private sessions = new Map<string, SyncedEmoteController>();
  private timeSync: TimeSync;

  constructor() {
    this.timeSync = new TimeSync();
  }

  /**
   * Register a sync controller
   */
  register(sessionId: string, controller: SyncedEmoteController): void {
    this.sessions.set(sessionId, controller);
  }

  /**
   * Unregister a sync controller
   */
  unregister(sessionId: string): void {
    const controller = this.sessions.get(sessionId);
    if (controller) {
      controller.dispose();
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Get sync controller
   */
  getController(sessionId: string): SyncedEmoteController | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Synchronize all sessions
   */
  async synchronizeAll(getServerTime: () => Promise<number>): Promise<void> {
    await this.timeSync.synchronize(getServerTime);
  }

  /**
   * Get synchronized time
   */
  getSynchronizedTime(): number {
    return this.timeSync.getTime();
  }
}

// ============================================================================
// Exports
// ============================================================================

export type {
  SyncMember,
  SyncSession,
  SyncOptions,
  CrowdEmoteConfig,
  NetworkLatencyInfo,
  SyncEvent,
};
