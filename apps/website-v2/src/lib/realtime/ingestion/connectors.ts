/**
 * Source Connectors - Data Source Connectors for Live Match Data
 * 
 * Features:
 * - Pandascore API connector
 * - Manual input support
 * - File upload (demo files)
 * - Mock data for testing
 * - Extensible connector architecture
 * 
 * [Ver001.000] - Source connectors
 */

import { logger } from '../../../utils/logger';
import type { LiveEvent, LiveEventType, LiveMatchState } from '../types';

const connectorLogger = logger.child('SourceConnectors');

// =============================================================================
// Connector Types
// =============================================================================

export type SourceType = 'pandascore' | 'manual' | 'file' | 'mock' | 'websocket' | 'custom';

export type SourceStatus = 'connected' | 'disconnected' | 'connecting' | 'error' | 'paused';

export interface SourceConfig {
  id: string;
  name: string;
  type: SourceType;
  enabled: boolean;
  pollInterval?: number; // milliseconds
  retryAttempts?: number;
  timeout?: number;
  credentials?: Record<string, string>;
  options?: Record<string, unknown>;
}

export interface SourceHealth {
  status: SourceStatus;
  lastConnected?: string;
  lastError?: string;
  errorCount: number;
  eventsReceived: number;
  eventsPerMinute: number;
  latency: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
}

export interface SourceConnector {
  id: string;
  config: SourceConfig;
  health: SourceHealth;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  fetchEvents(): Promise<LiveEvent[]>;
  fetchMatchState(matchId: string): Promise<LiveMatchState | null>;
  onEvent(callback: (event: LiveEvent) => void): () => void;
  onError(callback: (error: Error) => void): () => void;
  onStatusChange(callback: (status: SourceStatus) => void): () => void;
  updateConfig(config: Partial<SourceConfig>): void;
  getHealth(): SourceHealth;
  resetHealth(): void;
}

export interface PandascoreConfig extends SourceConfig {
  type: 'pandascore';
  apiKey: string;
  baseUrl: string;
  tournamentId?: string;
  seriesId?: string;
  matchId?: string;
}

export interface FileUploadConfig extends SourceConfig {
  type: 'file';
  acceptFormats: string[];
  maxFileSize: number; // bytes
}

export interface MockConfig extends SourceConfig {
  type: 'mock';
  scenario: 'default' | 'intense' | 'slow' | 'error_prone' | 'custom';
  eventRate: number; // events per minute
  matchCount: number;
  customEvents?: LiveEvent[];
}

// =============================================================================
// Base Connector Class
// =============================================================================

abstract class BaseConnector implements SourceConnector {
  public id: string;
  public config: SourceConfig;
  public health: SourceHealth;
  
  protected eventListeners: Set<(event: LiveEvent) => void> = new Set();
  protected errorListeners: Set<(error: Error) => void> = new Set();
  protected statusListeners: Set<(status: SourceStatus) => void> = new Set();
  protected eventCountHistory: { timestamp: number; count: number }[] = [];
  protected lastFetchTime = 0;

  constructor(config: SourceConfig) {
    this.id = config.id;
    this.config = { ...config };
    this.health = {
      status: 'disconnected',
      errorCount: 0,
      eventsReceived: 0,
      eventsPerMinute: 0,
      latency: 0,
      quality: 'unknown',
    };
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract fetchEvents(): Promise<LiveEvent[]>;
  abstract fetchMatchState(matchId: string): Promise<LiveMatchState | null>;

  onEvent(callback: (event: LiveEvent) => void): () => void {
    this.eventListeners.add(callback);
    return () => this.eventListeners.delete(callback);
  }

  onError(callback: (error: Error) => void): () => void {
    this.errorListeners.add(callback);
    return () => this.errorListeners.delete(callback);
  }

  onStatusChange(callback: (status: SourceStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  updateConfig(config: Partial<SourceConfig>): void {
    this.config = { ...this.config, ...config };
    connectorLogger.info(`Connector ${this.id} config updated`);
  }

  getHealth(): SourceHealth {
    this.updateEventsPerMinute();
    return { ...this.health };
  }

  resetHealth(): void {
    this.health = {
      status: this.health.status,
      errorCount: 0,
      eventsReceived: 0,
      eventsPerMinute: 0,
      latency: 0,
      quality: 'unknown',
    };
    this.eventCountHistory = [];
  }

  protected emitEvent(event: LiveEvent): void {
    this.health.eventsReceived++;
    this.eventCountHistory.push({ timestamp: Date.now(), count: 1 });
    this.eventListeners.forEach(cb => {
      try {
        cb(event);
      } catch (error) {
        connectorLogger.error('Error in event listener:', error);
      }
    });
  }

  protected emitError(error: Error): void {
    this.health.errorCount++;
    this.health.lastError = error.message;
    this.errorListeners.forEach(cb => {
      try {
        cb(error);
      } catch (e) {
        connectorLogger.error('Error in error listener:', e);
      }
    });
  }

  protected setStatus(status: SourceStatus): void {
    if (this.health.status !== status) {
      this.health.status = status;
      if (status === 'connected') {
        this.health.lastConnected = new Date().toISOString();
      }
      this.statusListeners.forEach(cb => {
        try {
          cb(status);
        } catch (error) {
          connectorLogger.error('Error in status listener:', error);
        }
      });
    }
  }

  protected updateLatency(latency: number): void {
    this.health.latency = latency;
    // Update quality based on latency
    if (latency < 100) this.health.quality = 'excellent';
    else if (latency < 300) this.health.quality = 'good';
    else if (latency < 1000) this.health.quality = 'fair';
    else this.health.quality = 'poor';
  }

  private updateEventsPerMinute(): void {
    const oneMinuteAgo = Date.now() - 60000;
    this.eventCountHistory = this.eventCountHistory.filter(
      entry => entry.timestamp > oneMinuteAgo
    );
    this.health.eventsPerMinute = this.eventCountHistory.length;
  }
}

// =============================================================================
// Pandascore API Connector
// =============================================================================

export class PandascoreConnector extends BaseConnector {
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private abortController: AbortController | null = null;

  constructor(config: PandascoreConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    if (this.health.status === 'connected' || this.health.status === 'connecting') {
      return;
    }

    this.setStatus('connecting');
    connectorLogger.info(`Connecting to Pandascore API`, { sourceId: this.id });

    try {
      // Test connection with a health check
      await this.testConnection();
      
      this.setStatus('connected');
      this.startPolling();
      
      connectorLogger.info(`Connected to Pandascore API`, { sourceId: this.id });
    } catch (error) {
      this.setStatus('error');
      this.emitError(error as Error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.stopPolling();
    this.abortController?.abort();
    this.setStatus('disconnected');
    connectorLogger.info(`Disconnected from Pandascore API`, { sourceId: this.id });
  }

  async fetchEvents(): Promise<LiveEvent[]> {
    const startTime = Date.now();
    const config = this.config as PandascoreConfig;

    try {
      // Build URL based on match/series/tournament
      let url = `${config.baseUrl}/matches`;
      if (config.matchId) {
        url = `${config.baseUrl}/matches/${config.matchId}`;
      } else if (config.seriesId) {
        url = `${config.baseUrl}/series/${config.seriesId}/matches`;
      } else if (config.tournamentId) {
        url = `${config.baseUrl}/tournaments/${config.tournamentId}/matches`;
      }

      url += '?filter[status]=running';

      this.abortController = new AbortController();
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Accept': 'application/json',
        },
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Pandascore API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const events = this.transformPandascoreData(data);
      
      this.updateLatency(Date.now() - startTime);
      
      // Emit events
      events.forEach(event => this.emitEvent(event));
      
      return events;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return [];
      }
      this.emitError(error as Error);
      throw error;
    }
  }

  async fetchMatchState(matchId: string): Promise<LiveMatchState | null> {
    const config = this.config as PandascoreConfig;

    try {
      const response = await fetch(`${config.baseUrl}/matches/${matchId}`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch match state: ${response.status}`);
      }

      const data = await response.json();
      return this.transformToMatchState(data);
    } catch (error) {
      this.emitError(error as Error);
      return null;
    }
  }

  private async testConnection(): Promise<void> {
    const config = this.config as PandascoreConfig;
    
    const response = await fetch(`${config.baseUrl}/status`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to connect to Pandascore API: ${response.status}`);
    }
  }

  private startPolling(): void {
    const interval = this.config.pollInterval || 5000;
    this.pollTimer = setInterval(() => {
      this.fetchEvents().catch(error => {
        connectorLogger.error('Polling error:', error);
      });
    }, interval);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private transformPandascoreData(data: unknown): LiveEvent[] {
    // Handle both single match and array of matches
    const matches = Array.isArray(data) ? data : [data];
    const events: LiveEvent[] = [];

    for (const match of matches) {
      if (!match || typeof match !== 'object') continue;
      
      const m = match as Record<string, unknown>;
      
      // Transform match data to events
      if (m.games && Array.isArray(m.games)) {
        for (const game of m.games) {
          if (typeof game === 'object' && game !== null) {
            const g = game as Record<string, unknown>;
            // Create events from game data
            events.push({
              id: `ps_${m.id}_${Date.now()}`,
              type: 'match_start',
              matchId: String(m.id),
              timestamp: new Date().toISOString(),
              data: {
                matchId: String(m.id),
                status: 'live',
                map: g.map || 'unknown',
              },
              source: 'official',
              confidence: 0.95,
            });
          }
        }
      }

      // Transform scores
      if (m.results && Array.isArray(m.results)) {
        for (const result of m.results) {
          if (typeof result === 'object' && result !== null) {
            const r = result as Record<string, unknown>;
            events.push({
              id: `ps_score_${m.id}_${Date.now()}`,
              type: 'score_update',
              matchId: String(m.id),
              timestamp: new Date().toISOString(),
              data: {
                teamAId: String(r.team_id || 'team_a'),
                teamBId: String(r.team_id || 'team_b'),
                teamAScore: Number(r.score || 0),
                teamBScore: Number(r.score || 0),
              },
              source: 'official',
              confidence: 0.95,
            });
          }
        }
      }
    }

    return events;
  }

  private transformToMatchState(data: unknown): LiveMatchState | null {
    if (!data || typeof data !== 'object') return null;
    
    const m = data as Record<string, unknown>;
    
    return {
      matchId: String(m.id || 'unknown'),
      status: this.mapPandascoreStatus(String(m.status)),
      map: 'unknown',
      gameMode: 'competitive',
      teamA: {
        id: 'team_a',
        name: 'Team A',
        tag: 'TA',
        score: 0,
        roundsWon: [],
        side: 'attack',
        players: [],
        timeoutsRemaining: 2,
        totalCredits: 0,
      },
      teamB: {
        id: 'team_b',
        name: 'Team B',
        tag: 'TB',
        score: 0,
        roundsWon: [],
        side: 'defense',
        players: [],
        timeoutsRemaining: 2,
        totalCredits: 0,
      },
      score: {
        teamAId: 'team_a',
        teamBId: 'team_b',
        teamAScore: 0,
        teamBScore: 0,
        teamARoundsWon: [],
        teamBRoundsWon: [],
        currentHalf: 1,
      },
      currentRound: 1,
      roundPhase: 'buy',
      roundTimeRemaining: 100,
      events: [],
      lastUpdateTime: new Date().toISOString(),
    };
  }

  private mapPandascoreStatus(status: string): LiveMatchState['status'] {
    const statusMap: Record<string, LiveMatchState['status']> = {
      'running': 'live',
      'finished': 'completed',
      'not_started': 'upcoming',
      'postponed': 'paused',
      'canceled': 'cancelled',
    };
    return statusMap[status] || 'upcoming';
  }
}

// =============================================================================
// Manual Input Connector
// =============================================================================

export class ManualInputConnector extends BaseConnector {
  constructor(config: SourceConfig) {
    super({ ...config, type: 'manual' });
  }

  async connect(): Promise<void> {
    this.setStatus('connected');
    connectorLogger.info(`Manual input connector ready`, { sourceId: this.id });
  }

  async disconnect(): Promise<void> {
    this.setStatus('disconnected');
    connectorLogger.info(`Manual input connector disconnected`, { sourceId: this.id });
  }

  async fetchEvents(): Promise<LiveEvent[]> {
    // Manual connector doesn't fetch - events are submitted via submitEvent
    return [];
  }

  async fetchMatchState(): Promise<LiveMatchState | null> {
    return null;
  }

  /**
   * Submit a manual event
   */
  submitEvent(event: Omit<LiveEvent, 'id' | 'timestamp'>): LiveEvent {
    const fullEvent: LiveEvent = {
      ...event,
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    
    this.emitEvent(fullEvent);
    return fullEvent;
  }

  /**
   * Submit multiple events
   */
  submitEvents(events: Omit<LiveEvent, 'id' | 'timestamp'>[]): LiveEvent[] {
    return events.map(event => this.submitEvent(event));
  }
}

// =============================================================================
// File Upload Connector
// =============================================================================

export class FileUploadConnector extends BaseConnector {
  private fileContent: string | null = null;
  private parsedEvents: LiveEvent[] = [];

  constructor(config: FileUploadConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    this.setStatus('connected');
    connectorLogger.info(`File upload connector ready`, { sourceId: this.id });
  }

  async disconnect(): Promise<void> {
    this.fileContent = null;
    this.parsedEvents = [];
    this.setStatus('disconnected');
  }

  async fetchEvents(): Promise<LiveEvent[]> {
    return [...this.parsedEvents];
  }

  async fetchMatchState(): Promise<LiveMatchState | null> {
    return null;
  }

  /**
   * Process uploaded file
   */
  async uploadFile(file: File): Promise<{ success: boolean; events: LiveEvent[]; errors: string[] }> {
    const config = this.config as FileUploadConfig;
    const errors: string[] = [];

    // Validate file size
    if (file.size > config.maxFileSize) {
      errors.push(`File size ${file.size} exceeds maximum ${config.maxFileSize}`);
      return { success: false, events: [], errors };
    }

    // Validate file type
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (!config.acceptFormats.includes(fileExt)) {
      errors.push(`File type .${fileExt} not supported. Accepted: ${config.acceptFormats.join(', ')}`);
      return { success: false, events: [], errors };
    }

    try {
      const content = await file.text();
      this.fileContent = content;
      
      const events = this.parseFileContent(content, fileExt);
      this.parsedEvents = events;
      
      // Emit all events
      events.forEach(event => this.emitEvent(event));

      connectorLogger.info(`File uploaded successfully`, { 
        sourceId: this.id, 
        fileName: file.name, 
        events: events.length 
      });

      return { success: true, events, errors };
    } catch (error) {
      const errorMsg = `Failed to parse file: ${(error as Error).message}`;
      errors.push(errorMsg);
      this.emitError(new Error(errorMsg));
      return { success: false, events: [], errors };
    }
  }

  /**
   * Upload from JSON string
   */
  uploadJSON(jsonString: string): { success: boolean; events: LiveEvent[]; errors: string[] } {
    const errors: string[] = [];
    
    try {
      this.fileContent = jsonString;
      const events = this.parseFileContent(jsonString, 'json');
      this.parsedEvents = events;
      
      events.forEach(event => this.emitEvent(event));

      return { success: true, events, errors };
    } catch (error) {
      const errorMsg = `Failed to parse JSON: ${(error as Error).message}`;
      errors.push(errorMsg);
      this.emitError(new Error(errorMsg));
      return { success: false, events: [], errors };
    }
  }

  private parseFileContent(content: string, format: string): LiveEvent[] {
    switch (format) {
      case 'json':
        return this.parseJSON(content);
      case 'csv':
        return this.parseCSV(content);
      case 'xml':
        return this.parseXML(content);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private parseJSON(content: string): LiveEvent[] {
    const data = JSON.parse(content);
    
    if (Array.isArray(data)) {
      return data.map((item, index) => this.normalizeEvent(item, index));
    }
    
    if (data.events && Array.isArray(data.events)) {
      return data.events.map((item: unknown, index: number) => this.normalizeEvent(item, index));
    }
    
    return [this.normalizeEvent(data, 0)];
  }

  private parseCSV(content: string): LiveEvent[] {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const events: LiveEvent[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const event: Record<string, unknown> = { id: i };
      
      headers.forEach((header, index) => {
        event[header] = values[index]?.trim();
      });

      events.push(this.normalizeEvent(event, i));
    }

    return events;
  }

  private parseXML(content: string): LiveEvent[] {
    // Simple XML parsing for events
    const events: LiveEvent[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/xml');
    const eventNodes = doc.querySelectorAll('event');

    eventNodes.forEach((node, index) => {
      const event: Record<string, unknown> = { id: index };
      
      node.attributes.forEach(attr => {
        event[attr.name] = attr.value;
      });

      node.childNodes.forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          event[child.nodeName] = child.textContent;
        }
      });

      events.push(this.normalizeEvent(event, index));
    });

    return events;
  }

  private normalizeEvent(data: unknown, index: number): LiveEvent {
    if (typeof data !== 'object' || data === null) {
      throw new Error(`Invalid event data at index ${index}`);
    }

    const d = data as Record<string, unknown>;
    
    return {
      id: String(d.id || `file_${Date.now()}_${index}`),
      type: (d.type as LiveEventType) || 'technical_issue',
      matchId: String(d.matchId || 'unknown'),
      timestamp: String(d.timestamp || new Date().toISOString()),
      round: d.round ? Number(d.round) : undefined,
      data: d.data || {},
      source: (d.source as LiveEvent['source']) || 'community',
      confidence: Number(d.confidence) || 0.5,
    };
  }
}

// =============================================================================
// Mock Data Connector
// =============================================================================

export class MockConnector extends BaseConnector {
  private generationTimer: ReturnType<typeof setInterval> | null = null;
  private scenarioConfig: MockConfig;

  constructor(config: MockConfig) {
    super(config);
    this.scenarioConfig = config;
  }

  async connect(): Promise<void> {
    this.setStatus('connected');
    this.startEventGeneration();
    connectorLogger.info(`Mock connector started`, { 
      sourceId: this.id, 
      scenario: this.scenarioConfig.scenario 
    });
  }

  async disconnect(): Promise<void> {
    this.stopEventGeneration();
    this.setStatus('disconnected');
    connectorLogger.info(`Mock connector stopped`, { sourceId: this.id });
  }

  async fetchEvents(): Promise<LiveEvent[]> {
    // Return recently generated events or generate new ones
    const count = Math.floor(Math.random() * 3) + 1;
    const events: LiveEvent[] = [];
    
    for (let i = 0; i < count; i++) {
      events.push(this.generateRandomEvent());
    }
    
    return events;
  }

  async fetchMatchState(): Promise<LiveMatchState | null> {
    return this.generateMockMatchState();
  }

  /**
   * Generate a specific event type
   */
  generateEvent(type: LiveEventType, data?: Partial<LiveEvent>): LiveEvent {
    const event = this.createEvent(type, data);
    this.emitEvent(event);
    return event;
  }

  private startEventGeneration(): void {
    const intervalMs = (60 / this.scenarioConfig.eventRate) * 1000;
    
    this.generationTimer = setInterval(() => {
      if (this.scenarioConfig.scenario === 'error_prone' && Math.random() < 0.3) {
        this.emitError(new Error('Mock error: Random failure'));
        return;
      }

      const event = this.generateRandomEvent();
      this.emitEvent(event);
    }, intervalMs);
  }

  private stopEventGeneration(): void {
    if (this.generationTimer) {
      clearInterval(this.generationTimer);
      this.generationTimer = null;
    }
  }

  private generateRandomEvent(): LiveEvent {
    const eventTypes: LiveEventType[] = [
      'kill', 'death', 'spike_plant', 'spike_defuse', 
      'economy_update', 'ability_use', 'damage_dealt', 'score_update'
    ];
    
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    return this.createEvent(type);
  }

  private createEvent(type: LiveEventType, overrides?: Partial<LiveEvent>): LiveEvent {
    const matchIds = ['match_1', 'match_2', 'match_3'];
    const teams = ['team_a', 'team_b'];
    const players = ['player_1', 'player_2', 'player_3', 'player_4', 'player_5'];
    const agents = ['Jett', 'Phoenix', 'Sage', 'Brimstone', 'Cypher'];
    const weapons = ['Vandal', 'Phantom', 'Operator', 'Sheriff', 'Ghost'];
    const abilities = ['Q', 'E', 'C', 'X'];

    const baseEvent: LiveEvent = {
      id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      matchId: matchIds[Math.floor(Math.random() * matchIds.length)],
      timestamp: new Date().toISOString(),
      round: Math.floor(Math.random() * 24) + 1,
      data: {},
      source: 'simulation',
      confidence: 0.8 + Math.random() * 0.2,
    };

    // Add type-specific data
    switch (type) {
      case 'kill':
        baseEvent.data = {
          attackerId: players[Math.floor(Math.random() * players.length)],
          attackerTeam: teams[Math.floor(Math.random() * teams.length)],
          victimId: players[Math.floor(Math.random() * players.length)],
          victimTeam: teams[Math.floor(Math.random() * teams.length)],
          weapon: weapons[Math.floor(Math.random() * weapons.length)],
          headshot: Math.random() < 0.3,
          wallbang: Math.random() < 0.1,
          throughSmoke: Math.random() < 0.05,
        };
        break;
      
      case 'spike_plant':
      case 'spike_defuse':
        baseEvent.data = {
          playerId: players[Math.floor(Math.random() * players.length)],
          teamId: teams[Math.floor(Math.random() * teams.length)],
        };
        break;
      
      case 'economy_update':
        baseEvent.data = {
          teamId: teams[Math.floor(Math.random() * teams.length)],
          playerId: players[Math.floor(Math.random() * players.length)],
          credits: Math.floor(Math.random() * 9000),
          spent: Math.floor(Math.random() * 5000),
          loadoutValue: Math.floor(Math.random() * 5000),
        };
        break;
      
      case 'ability_use':
        baseEvent.data = {
          playerId: players[Math.floor(Math.random() * players.length)],
          agent: agents[Math.floor(Math.random() * agents.length)],
          ability: abilities[Math.floor(Math.random() * abilities.length)],
        };
        break;
      
      case 'damage_dealt':
        baseEvent.data = {
          attackerId: players[Math.floor(Math.random() * players.length)],
          victimId: players[Math.floor(Math.random() * players.length)],
          damage: Math.floor(Math.random() * 150) + 10,
          remainingHealth: Math.floor(Math.random() * 100),
          hitLocation: ['head', 'body', 'leg'][Math.floor(Math.random() * 3)] as 'head' | 'body' | 'leg',
        };
        break;
      
      case 'score_update':
        baseEvent.data = {
          teamAId: teams[0],
          teamBId: teams[1],
          teamAScore: Math.floor(Math.random() * 13),
          teamBScore: Math.floor(Math.random() * 13),
        };
        break;
    }

    return { ...baseEvent, ...overrides };
  }

  private generateMockMatchState(): LiveMatchState {
    return {
      matchId: 'mock_match_1',
      status: 'live',
      map: ['Haven', 'Bind', 'Split', 'Ascent', 'Icebox'][Math.floor(Math.random() * 5)],
      gameMode: 'competitive',
      teamA: {
        id: 'team_a',
        name: 'Mock Team A',
        tag: 'MTA',
        score: Math.floor(Math.random() * 13),
        roundsWon: [],
        side: 'attack',
        players: [],
        timeoutsRemaining: 2,
        totalCredits: 0,
      },
      teamB: {
        id: 'team_b',
        name: 'Mock Team B',
        tag: 'MTB',
        score: Math.floor(Math.random() * 13),
        roundsWon: [],
        side: 'defense',
        players: [],
        timeoutsRemaining: 2,
        totalCredits: 0,
      },
      score: {
        teamAId: 'team_a',
        teamBId: 'team_b',
        teamAScore: 0,
        teamBScore: 0,
        teamARoundsWon: [],
        teamBRoundsWon: [],
        currentHalf: 1,
      },
      currentRound: Math.floor(Math.random() * 24) + 1,
      roundPhase: ['buy', 'combat', 'post'][Math.floor(Math.random() * 3)] as LiveMatchState['roundPhase'],
      roundTimeRemaining: Math.floor(Math.random() * 100),
      events: [],
      lastUpdateTime: new Date().toISOString(),
    };
  }
}

// =============================================================================
// Connector Factory
// =============================================================================

const connectorRegistry = new Map<string, SourceConnector>();

export function createConnector(config: SourceConfig): SourceConnector {
  let connector: SourceConnector;

  switch (config.type) {
    case 'pandascore':
      connector = new PandascoreConnector(config as PandascoreConfig);
      break;
    case 'manual':
      connector = new ManualInputConnector(config);
      break;
    case 'file':
      connector = new FileUploadConnector(config as FileUploadConfig);
      break;
    case 'mock':
      connector = new MockConnector(config as MockConfig);
      break;
    default:
      throw new Error(`Unknown connector type: ${config.type}`);
  }

  connectorRegistry.set(config.id, connector);
  return connector;
}

export function getConnector(id: string): SourceConnector | undefined {
  return connectorRegistry.get(id);
}

export function removeConnector(id: string): void {
  const connector = connectorRegistry.get(id);
  if (connector) {
    connector.disconnect();
    connectorRegistry.delete(id);
  }
}

export function getAllConnectors(): SourceConnector[] {
  return Array.from(connectorRegistry.values());
}

export function getConnectorsByType(type: SourceType): SourceConnector[] {
  return Array.from(connectorRegistry.values()).filter(c => c.config.type === type);
}

export function getAllHealth(): Record<string, SourceHealth> {
  const health: Record<string, SourceHealth> = {};
  connectorRegistry.forEach((connector, id) => {
    health[id] = connector.getHealth();
  });
  return health;
}

export function resetAllConnectors(): void {
  connectorRegistry.forEach(connector => connector.disconnect());
  connectorRegistry.clear();
}

// =============================================================================
// Default Configurations
// =============================================================================

export const DEFAULT_PANDASCORE_CONFIG: Omit<PandascoreConfig, 'apiKey'> = {
  id: 'pandascore-default',
  name: 'Pandascore API',
  type: 'pandascore',
  enabled: true,
  baseUrl: 'https://api.pandascore.co/valorant',
  pollInterval: 5000,
  retryAttempts: 3,
  timeout: 10000,
};

export const DEFAULT_MANUAL_CONFIG: SourceConfig = {
  id: 'manual-default',
  name: 'Manual Input',
  type: 'manual',
  enabled: true,
};

export const DEFAULT_FILE_CONFIG: FileUploadConfig = {
  id: 'file-default',
  name: 'File Upload',
  type: 'file',
  enabled: true,
  acceptFormats: ['json', 'csv', 'xml'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
};

export const DEFAULT_MOCK_CONFIG: MockConfig = {
  id: 'mock-default',
  name: 'Mock Data',
  type: 'mock',
  enabled: true,
  scenario: 'default',
  eventRate: 10, // 10 events per minute
  matchCount: 1,
};

// =============================================================================
// Default Export
// =============================================================================

export default {
  createConnector,
  getConnector,
  removeConnector,
  getAllConnectors,
  getConnectorsByType,
  getAllHealth,
  resetAllConnectors,
};
