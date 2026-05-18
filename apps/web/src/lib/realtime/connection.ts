// @ts-nocheck
/**
 * Live Connection Manager - WebSocket Connection Management
 * 
 * Features:
 * - WebSocket connection management with state tracking
 * - Auto-reconnect with exponential backoff
 * - Multiple endpoint support
 * - Connection health monitoring
 * - Event-driven architecture
 * 
 * [Ver001.000] - Real-time data connection management
 */

import { logger } from '../../utils/logger';

const connectionLogger = logger.child('LiveConnection');

// =============================================================================
// Types
// =============================================================================

export type ConnectionState = 
  | 'idle'
  | 'connecting' 
  | 'connected' 
  | 'reconnecting'
  | 'disconnected' 
  | 'error'
  | 'closed';

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

export interface ConnectionMetrics {
  latency: number;
  jitter: number;
  packetLoss: number;
  messagesReceived: number;
  messagesSent: number;
  bytesReceived: number;
  bytesSent: number;
  lastPingAt: number | null;
  lastPongAt: number | null;
}

export interface ConnectionConfig {
  /** WebSocket URL */
  url: string;
  /** Authentication token */
  token?: string;
  /** Enable auto-reconnect */
  autoReconnect: boolean;
  /** Base reconnection interval in ms */
  reconnectInterval: number;
  /** Maximum reconnection interval in ms */
  maxReconnectInterval: number;
  /** Maximum reconnection attempts (0 = unlimited) */
  maxReconnectAttempts: number;
  /** Reconnection backoff multiplier */
  reconnectBackoffMultiplier: number;
  /** Heartbeat interval in ms */
  heartbeatInterval: number;
  /** Connection timeout in ms */
  connectionTimeout: number;
  /** Message size limit in bytes */
  maxMessageSize: number;
}

export interface ConnectionEventMap {
  'state-change': { previous: ConnectionState; current: ConnectionState };
  'message': { data: unknown; timestamp: number };
  'error': { error: Error; recoverable: boolean };
  'connected': { timestamp: number; duration: number };
  'disconnected': { code: number; reason: string; wasClean: boolean };
  'reconnecting': { attempt: number; delay: number; maxAttempts: number };
  'reconnected': { attempt: number; totalDuration: number };
  'heartbeat': { latency: number; quality: ConnectionQuality };
  'quality-change': { previous: ConnectionQuality; current: ConnectionQuality };
}

type EventCallback<T extends keyof ConnectionEventMap> = (data: ConnectionEventMap[T]) => void;

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_CONFIG: Partial<ConnectionConfig> = {
  autoReconnect: true,
  reconnectInterval: 1000,
  maxReconnectInterval: 30000,
  maxReconnectAttempts: 10,
  reconnectBackoffMultiplier: 2,
  heartbeatInterval: 30000,
  connectionTimeout: 10000,
  maxMessageSize: 1024 * 1024, // 1MB
};

const WS_CLOSE_CODES = {
  NORMAL: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  NO_STATUS: 1005,
  ABNORMAL: 1006,
  INVALID_DATA: 1007,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  MANDATORY_EXTENSION: 1010,
  INTERNAL_ERROR: 1011,
  SERVICE_RESTART: 1012,
  TRY_AGAIN_LATER: 1013,
  BAD_GATEWAY: 1014,
} as const;

// Latency thresholds for connection quality
const QUALITY_THRESHOLDS = {
  excellent: 50,
  good: 100,
  fair: 200,
} as const;

// =============================================================================
// Live Connection Manager
// =============================================================================

export class LiveConnectionManager {
  private ws: WebSocket | null = null;
  private config: ConnectionConfig;
  private state: ConnectionState = 'idle';
  private listeners: Map<keyof ConnectionEventMap, Set<EventCallback<keyof ConnectionEventMap>>> = new Map();
  
  // Reconnection
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  
  // Heartbeat
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private lastPingTime = 0;
  
  // Metrics
  private metrics: ConnectionMetrics = {
    latency: 0,
    jitter: 0,
    packetLoss: 0,
    messagesReceived: 0,
    messagesSent: 0,
    bytesReceived: 0,
    bytesSent: 0,
    lastPingAt: null,
    lastPongAt: null,
  };
  
  private connectionStartTime = 0;
  private currentQuality: ConnectionQuality = 'unknown';
  private intentionalClose = false;

  constructor(config: Partial<ConnectionConfig> & { url: string }) {
    this.config = { ...DEFAULT_CONFIG, ...config } as ConnectionConfig;
    connectionLogger.info('LiveConnectionManager initialized', { url: this.config.url });
  }

  // =============================================================================
  // Public API
  // =============================================================================

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Check if currently connecting
   */
  isConnecting(): boolean {
    return this.state === 'connecting' || this.state === 'reconnecting';
  }

  /**
   * Get connection metrics
   */
  getMetrics(): Readonly<ConnectionMetrics> {
    return { ...this.metrics };
  }

  /**
   * Get current connection quality
   */
  getQuality(): ConnectionQuality {
    return this.currentQuality;
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<ConnectionConfig> {
    return { ...this.config };
  }

  /**
   * Connect to WebSocket endpoint
   */
  connect(): void {
    if (this.isConnected() || this.isConnecting()) {
      connectionLogger.warn('Connection already established or in progress');
      return;
    }

    this.transitionTo('connecting');
    this.intentionalClose = false;
    this.connectionStartTime = Date.now();

    try {
      const url = this.buildConnectionUrl();
      connectionLogger.info('Connecting to WebSocket', { url: this.config.url });

      this.ws = new WebSocket(url);
      this.setupEventHandlers();
      this.startConnectionTimeout();
    } catch (error) {
      this.handleConnectionError(error as Error);
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(code = WS_CLOSE_CODES.NORMAL, reason = 'Client disconnect'): void {
    this.intentionalClose = true;
    this.cleanup();
    
    if (this.ws) {
      try {
        this.ws.close(code, reason);
      } catch (error) {
        connectionLogger.error('Error during disconnect:', error);
      }
      this.ws = null;
    }

    this.reconnectAttempts = 0;
    this.transitionTo('disconnected');
    connectionLogger.info('Disconnected from WebSocket');
  }

  /**
   * Force reconnection
   */
  reconnect(): void {
    connectionLogger.info('Manual reconnection requested');
    this.disconnect(WS_CLOSE_CODES.NORMAL, 'Reconnecting');
    this.reconnectAttempts = 0;
    
    // Small delay to ensure clean disconnect
    setTimeout(() => this.connect(), 100);
  }

  /**
   * Send data through WebSocket
   */
  send(data: unknown): boolean {
    if (!this.isConnected()) {
      connectionLogger.warn('Cannot send: not connected');
      return false;
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Check message size
      if (message.length > this.config.maxMessageSize) {
        connectionLogger.error('Message exceeds max size', { 
          size: message.length, 
          max: this.config.maxMessageSize 
        });
        return false;
      }

      this.ws!.send(message);
      this.metrics.messagesSent++;
      this.metrics.bytesSent += message.length;
      return true;
    } catch (error) {
      connectionLogger.error('Failed to send message:', error);
      return false;
    }
  }

  /**
   * Subscribe to connection events
   */
  on<T extends keyof ConnectionEventMap>(event: T, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    const callbacks = this.listeners.get(event)!;
    callbacks.add(callback as EventCallback<keyof ConnectionEventMap>);

    // Return unsubscribe function
    return () => {
      callbacks.delete(callback as EventCallback<keyof ConnectionEventMap>);
    };
  }

  /**
   * Remove all listeners for an event
   */
  off<T extends keyof ConnectionEventMap>(event: T, callback?: EventCallback<T>): void {
    if (!callback) {
      this.listeners.delete(event);
    } else if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback as EventCallback<keyof ConnectionEventMap>);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ConnectionConfig>): void {
    const needsReconnect = updates.url && updates.url !== this.config.url;
    this.config = { ...this.config, ...updates };
    
    if (needsReconnect && this.isConnected()) {
      connectionLogger.info('URL changed, reconnecting...');
      this.reconnect();
    }
  }

  /**
   * Destroy the connection manager
   */
  destroy(): void {
    this.disconnect(WS_CLOSE_CODES.NORMAL, 'Destroying connection manager');
    this.listeners.clear();
    connectionLogger.info('Connection manager destroyed');
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  private buildConnectionUrl(): string {
    let url = this.config.url;
    
    // Enforce WSS in secure contexts
    if (typeof window !== 'undefined') {
      const isSecure = window.location.protocol === 'https:' || process.env.NODE_ENV === 'production';
      if (url.startsWith('ws://') && isSecure) {
        url = url.replace('ws://', 'wss://');
      }
    }

    // Add authentication token if provided
    if (this.config.token) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}token=${encodeURIComponent(this.config.token)}`;
    }

    return url;
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.clearConnectionTimeout();
      this.reconnectAttempts = 0;
      const duration = Date.now() - this.connectionStartTime;
      
      this.transitionTo('connected');
      this.emit('connected', { timestamp: Date.now(), duration });
      this.startHeartbeat();
      
      connectionLogger.info('WebSocket connected', { duration: `${duration}ms` });
    };

    this.ws.onmessage = (event: MessageEvent) => {
      this.handleMessage(event.data);
    };

    this.ws.onerror = (event: Event) => {
      const error = new Error('WebSocket error occurred');
      connectionLogger.error('WebSocket error:', event);
      this.emit('error', { error, recoverable: !this.intentionalClose });
    };

    this.ws.onclose = (event: CloseEvent) => {
      this.handleClose(event);
    };
  }

  private handleMessage(data: string | ArrayBuffer | Blob): void {
    const timestamp = Date.now();
    
    try {
      // Handle ping/pong for heartbeat
      if (data === 'pong' || (typeof data === 'string' && data.includes('"type":"pong"'))) {
        this.handlePong(timestamp);
        return;
      }

      let parsed: unknown;
      if (typeof data === 'string') {
        parsed = JSON.parse(data);
        this.metrics.bytesReceived += data.length;
      } else {
        parsed = data;
      }

      this.metrics.messagesReceived++;
      this.emit('message', { data: parsed, timestamp });
    } catch (error) {
      connectionLogger.error('Failed to parse message:', error);
      this.emit('error', { 
        error: new Error('Message parse failed'), 
        recoverable: true 
      });
    }
  }

  private handleClose(event: CloseEvent): void {
    this.cleanup();
    this.metrics.lastPingAt = null;
    this.metrics.lastPongAt = null;

    this.emit('disconnected', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    });

    connectionLogger.info('WebSocket closed', { 
      code: event.code, 
      reason: event.reason,
      wasClean: event.wasClean 
    });

    // Determine if we should reconnect
    if (!this.intentionalClose && event.code !== WS_CLOSE_CODES.NORMAL) {
      this.scheduleReconnect();
    } else {
      this.transitionTo('disconnected');
    }
  }

  private handleConnectionError(error: Error): void {
    this.clearConnectionTimeout();
    connectionLogger.error('Connection error:', error);
    
    this.emit('error', { error, recoverable: true });
    this.transitionTo('error');
    
    if (this.config.autoReconnect && !this.intentionalClose) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (!this.config.autoReconnect) return;
    
    const maxAttempts = this.config.maxReconnectAttempts;
    if (maxAttempts > 0 && this.reconnectAttempts >= maxAttempts) {
      connectionLogger.error(`Max reconnection attempts (${maxAttempts}) reached`);
      this.transitionTo('error');
      this.emit('error', { 
        error: new Error(`Failed to connect after ${maxAttempts} attempts`), 
        recoverable: false 
      });
      return;
    }

    const delay = this.calculateReconnectDelay();
    this.reconnectAttempts++;
    
    this.transitionTo('reconnecting');
    this.emit('reconnecting', {
      attempt: this.reconnectAttempts,
      delay,
      maxAttempts: maxAttempts || Infinity,
    });

    connectionLogger.info(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private calculateReconnectDelay(): number {
    const baseDelay = this.config.reconnectInterval;
    const multiplier = this.config.reconnectBackoffMultiplier;
    const maxDelay = this.config.maxReconnectInterval;
    
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(multiplier, this.reconnectAttempts - 1);
    const jitter = exponentialDelay * 0.1 * (Math.random() * 2 - 1);
    
    return Math.min(Math.max(0, exponentialDelay + jitter), maxDelay);
  }

  private startConnectionTimeout(): void {
    this.clearConnectionTimeout();
    this.connectionTimeoutTimer = setTimeout(() => {
      if (this.state === 'connecting') {
        connectionLogger.warn('Connection timeout');
        this.ws?.close();
        this.handleConnectionError(new Error('Connection timeout'));
      }
    }, this.config.connectionTimeout);
  }

  private clearConnectionTimeout(): void {
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.lastPingTime = Date.now();
        this.metrics.lastPingAt = this.lastPingTime;
        this.send({ type: 'ping', timestamp: this.lastPingTime });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private handlePong(timestamp: number): void {
    this.metrics.lastPongAt = timestamp;
    
    if (this.lastPingTime > 0) {
      const latency = timestamp - this.lastPingTime;
      this.metrics.latency = latency;
      
      // Calculate jitter (variation in latency)
      if (this.metrics.latency > 0) {
        const variation = Math.abs(latency - this.metrics.latency);
        this.metrics.jitter = (this.metrics.jitter * 0.9) + (variation * 0.1);
      }

      // Update quality
      const previousQuality = this.currentQuality;
      this.currentQuality = this.calculateQuality(latency);
      
      this.emit('heartbeat', { latency, quality: this.currentQuality });
      
      if (previousQuality !== this.currentQuality) {
        this.emit('quality-change', { 
          previous: previousQuality, 
          current: this.currentQuality 
        });
      }
    }
  }

  private calculateQuality(latency: number): ConnectionQuality {
    if (latency <= QUALITY_THRESHOLDS.excellent) return 'excellent';
    if (latency <= QUALITY_THRESHOLDS.good) return 'good';
    if (latency <= QUALITY_THRESHOLDS.fair) return 'fair';
    return 'poor';
  }

  private transitionTo(newState: ConnectionState): void {
    if (this.state === newState) return;
    
    const previousState = this.state;
    this.state = newState;
    
    this.emit('state-change', { previous: previousState, current: newState });
  }

  private emit<T extends keyof ConnectionEventMap>(event: T, data: ConnectionEventMap[T]): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;

    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        connectionLogger.error(`Error in ${event} listener:`, error);
      }
    });
  }

  private cleanup(): void {
    this.clearConnectionTimeout();
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// =============================================================================
// Singleton Factory
// =============================================================================

const connectionInstances = new Map<string, LiveConnectionManager>();

/**
 * Get or create a connection manager instance
 */
export function getConnectionManager(
  id: string, 
  config: Partial<ConnectionConfig> & { url: string }
): LiveConnectionManager {
  if (!connectionInstances.has(id)) {
    connectionInstances.set(id, new LiveConnectionManager(config));
  }
  return connectionInstances.get(id)!;
}

/**
 * Destroy a connection manager instance
 */
export function destroyConnectionManager(id: string): void {
  const instance = connectionInstances.get(id);
  if (instance) {
    instance.destroy();
    connectionInstances.delete(id);
  }
}

/**
 * Reset all connection manager instances
 */
export function resetConnectionManagers(): void {
  connectionInstances.forEach(instance => instance.destroy());
  connectionInstances.clear();
}

// =============================================================================
// Default Export
// =============================================================================

export default LiveConnectionManager;
