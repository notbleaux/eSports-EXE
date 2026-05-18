// @ts-nocheck
/**
 * Real-time System Type Definitions
 * 
 * Type definitions for live match data streaming system.
 * 
 * [Ver001.000] - Real-time data types
 */

// =============================================================================
// Live Match Event Types
// =============================================================================

export type LiveEventType = 
  | 'match_start'
  | 'match_end'
  | 'round_start'
  | 'round_end'
  | 'kill'
  | 'death'
  | 'assist'
  | 'spike_plant'
  | 'spike_defuse'
  | 'spike_explode'
  | 'economy_update'
  | 'ability_use'
  | 'damage_dealt'
  | 'score_update'
  | 'player_connect'
  | 'player_disconnect'
  | 'timeout_called'
  | 'timeout_end'
  | 'pause'
  | 'resume'
  | 'team_switch'
  | 'overtime'
  | 'technical_issue';

export interface LiveEvent {
  id: string;
  type: LiveEventType;
  matchId: string;
  round?: number;
  timestamp: string;
  data: LiveEventData;
  source: 'official' | 'community' | 'simulation';
  confidence: number; // 0-1, data reliability
}

export type LiveEventData = 
  | KillEventData
  | RoundEventData
  | EconomyEventData
  | ScoreEventData
  | MatchEventData
  | AbilityEventData
  | DamageEventData
  | PlayerEventData;

export interface KillEventData {
  attackerId: string;
  attackerTeam: string;
  victimId: string;
  victimTeam: string;
  weapon?: string;
  headshot: boolean;
  wallbang: boolean;
  throughSmoke: boolean;
  assists?: string[];
  position?: { x: number; y: number; z: number };
  timestamp: number;
}

export interface RoundEventData {
  roundNumber: number;
  winningTeam: string;
  winCondition: 'elimination' | 'spike_explode' | 'spike_defuse' | 'timeout' | 'surrender';
  teamAScore: number;
  teamBScore: number;
  duration: number; // seconds
  economyReset?: boolean;
}

export interface EconomyEventData {
  teamId: string;
  playerId: string;
  credits: number;
  spent: number;
  loadoutValue: number;
  weaponPurchased?: string;
  armorPurchased?: 'light' | 'heavy' | null;
}

export interface ScoreEventData {
  teamAId: string;
  teamBId: string;
  teamAScore: number;
  teamBScore: number;
  teamARoundsWon: number[];
  teamBRoundsWon: number[];
  currentHalf: 1 | 2 | 3;
  overtimeRounds?: number;
}

export interface MatchEventData {
  matchId: string;
  status: 'upcoming' | 'live' | 'paused' | 'completed' | 'cancelled';
  map?: string;
  currentRound: number;
  totalRounds: number;
  duration: number;
}

export interface AbilityEventData {
  playerId: string;
  agent: string;
  ability: string;
  position?: { x: number; y: number; z: number };
  targetPosition?: { x: number; y: number; z: number };
  effective?: boolean; // Was the ability effective
}

export interface DamageEventData {
  attackerId: string;
  victimId: string;
  damage: number;
  remainingHealth: number;
  hitLocation: 'head' | 'body' | 'leg';
}

export interface PlayerEventData {
  playerId: string;
  teamId: string;
  action: 'connected' | 'disconnected' | 'reconnected';
  reason?: string;
}

// =============================================================================
// Live Match State
// =============================================================================

export interface LiveMatchState {
  matchId: string;
  status: 'upcoming' | 'live' | 'paused' | 'completed' | 'cancelled';
  map: string;
  gameMode: 'competitive' | 'unrated' | 'swiftplay' | 'deathmatch' | 'custom';
  
  // Teams
  teamA: LiveTeamState;
  teamB: LiveTeamState;
  
  // Score
  score: ScoreEventData;
  
  // Current round
  currentRound: number;
  roundPhase: 'buy' | 'combat' | 'post' | 'ended';
  roundTimeRemaining: number;
  
  // Events
  events: LiveEvent[];
  
  // Timing
  startTime?: string;
  endTime?: string;
  lastUpdateTime: string;
  
  // Metadata
  streamUrl?: string;
  tournament?: {
    id: string;
    name: string;
    stage: string;
  };
}

export interface LiveTeamState {
  id: string;
  name: string;
  tag: string;
  logo?: string;
  score: number;
  roundsWon: number[];
  side: 'attack' | 'defense';
  players: LivePlayerState[];
  timeoutsRemaining: number;
  totalCredits: number;
}

export interface LivePlayerState {
  id: string;
  name: string;
  tag?: string;
  agent: string;
  teamId: string;
  
  // Status
  alive: boolean;
  connected: boolean;
  
  // Stats (current match)
  kills: number;
  deaths: number;
  assists: number;
  acs: number;
  adr: number;
  firstBloods: number;
  plants: number;
  defuses: number;
  clutchWins: number;
  
  // Economy
  credits: number;
  loadoutValue: number;
  
  // Current round
  currentWeapon?: string;
  currentArmor?: 'light' | 'heavy' | null;
  abilities: AbilityState[];
  
  // Position (if available)
  position?: { x: number; y: number; z: number };
  lookingAt?: { x: number; y: number; z: number };
}

export interface AbilityState {
  name: string;
  charges: number;
  maxCharges: number;
  cooldown?: number;
  ready: boolean;
}

// =============================================================================
// Subscription Types
// =============================================================================

export type SubscriptionTopic = 
  | `match:${string}`
  | `player:${string}`
  | `team:${string}`
  | `tournament:${string}`
  | 'system:global'
  | 'system:matches';

export interface SubscriptionFilter {
  eventTypes?: LiveEventType[];
  teams?: string[];
  players?: string[];
  minConfidence?: number;
}

export interface Subscription {
  id: string;
  topic: SubscriptionTopic;
  filter?: SubscriptionFilter;
  createdAt: number;
  priority: 'high' | 'normal' | 'low';
}

// =============================================================================
// Message Types
// =============================================================================

export interface LiveMessage<T = unknown> {
  type: 'event' | 'state' | 'error' | 'ping' | 'pong' | 'subscribe' | 'unsubscribe';
  topic?: string;
  payload: T;
  timestamp: string;
  messageId: string;
}

export interface SubscribeMessage {
  action: 'subscribe';
  topic: string;
  filter?: SubscriptionFilter;
}

export interface UnsubscribeMessage {
  action: 'unsubscribe';
  topic: string;
}

// =============================================================================
// Store Types
// =============================================================================

export interface RealtimeStoreState {
  // Connection
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: Error | null;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  latency: number;
  
  // Matches
  activeMatches: Map<string, LiveMatchState>;
  selectedMatchId: string | null;
  
  // Subscriptions
  subscriptions: Map<string, Subscription>;
  
  // Buffer
  eventBuffer: LiveEvent[];
  maxBufferSize: number;
}

export interface RealtimeStoreActions {
  // Connection
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setConnectionError: (error: Error | null) => void;
  setConnectionQuality: (quality: RealtimeStoreState['connectionQuality']) => void;
  setLatency: (latency: number) => void;
  
  // Matches
  updateMatch: (matchId: string, state: Partial<LiveMatchState>) => void;
  setMatch: (matchId: string, state: LiveMatchState) => void;
  removeMatch: (matchId: string) => void;
  selectMatch: (matchId: string | null) => void;
  
  // Events
  addEvent: (matchId: string, event: LiveEvent) => void;
  clearEvents: (matchId: string) => void;
  
  // Subscriptions
  subscribe: (topic: SubscriptionTopic, filter?: SubscriptionFilter, priority?: Subscription['priority']) => string;
  unsubscribe: (subscriptionId: string) => void;
  unsubscribeAll: () => void;
  
  // Buffer
  addToBuffer: (event: LiveEvent) => void;
  flushBuffer: () => void;
  clearBuffer: () => void;
}

export type RealtimeStore = RealtimeStoreState & RealtimeStoreActions;

// =============================================================================
// Hook Types
// =============================================================================

export interface UseLiveMatchOptions {
  matchId?: string;
  autoConnect?: boolean;
  eventTypes?: LiveEventType[];
  bufferSize?: number;
  onEvent?: (event: LiveEvent) => void;
  onError?: (error: Error) => void;
}

export interface UseLiveMatchReturn {
  // State
  match: LiveMatchState | null;
  events: LiveEvent[];
  isLoading: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  
  // Metrics
  latency: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  eventsPerMinute: number;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  clearEvents: () => void;
  selectMatch: (matchId: string) => void;
}

// =============================================================================
// Error Types
// =============================================================================

export type RealtimeErrorCode = 
  | 'CONNECTION_FAILED'
  | 'CONNECTION_LOST'
  | 'AUTHENTICATION_FAILED'
  | 'INVALID_TOPIC'
  | 'RATE_LIMITED'
  | 'MESSAGE_PARSE_ERROR'
  | 'BUFFER_OVERFLOW'
  | 'SUBSCRIPTION_FAILED';

export class RealtimeError extends Error {
  constructor(
    public code: RealtimeErrorCode,
    message: string,
    public recoverable: boolean = true,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'RealtimeError';
  }
}

// =============================================================================
// Utility Types
// =============================================================================

export type EventHandler<T extends LiveEventData> = (event: LiveEvent & { data: T }) => void;

export interface EventHandlers {
  onKill?: EventHandler<KillEventData>;
  onRoundEnd?: EventHandler<RoundEventData>;
  onEconomyUpdate?: EventHandler<EconomyEventData>;
  onScoreUpdate?: EventHandler<ScoreEventData>;
  onMatchUpdate?: EventHandler<MatchEventData>;
  onAbilityUse?: EventHandler<AbilityEventData>;
  onDamage?: EventHandler<DamageEventData>;
  onPlayerEvent?: EventHandler<PlayerEventData>;
}

export interface HistoricalBuffer {
  events: LiveEvent[];
  maxSize: number;
  timeWindow: number; // milliseconds
  
  add(event: LiveEvent): void;
  getRecent(count: number): LiveEvent[];
  getSince(timestamp: string): LiveEvent[];
  getByType(type: LiveEventType): LiveEvent[];
  clear(): void;
}
