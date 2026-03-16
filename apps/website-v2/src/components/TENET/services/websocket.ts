/** [Ver001.000] */
/**
 * TENET WebSocket Client Service
 * ==============================
 * Unified WebSocket client with auto-reconnect, heartbeat, and channel subscription.
 */

import { WSMessage, MessageType } from '../types/websocket';

// ============================================================================
// Types
// ============================================================================

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface WebSocketOptions {
  url: string;
  userId: string;
  autoReconnect?: boolean;
  reconnectIntervals?: number[];
  maxReconnectInterval?: number;
  heartbeatInterval?: number;
  onMessage?: (message: WSMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export interface Subscription {
  channel: string;
  callback: (message: WSMessage) => void;
}

// ============================================================================
// WebSocket Client Class
// ============================================================================

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private options: Required<WebSocketOptions>;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private subscriptions: Map<string, Set<(message: WSMessage) => void>> = new Map();
  private state: ConnectionState = 'disconnected';
  private messageQueue: WSMessage[] = [];
  private userId: string;

  private static readonly DEFAULT_RECONNECT_INTERVALS = [1000, 2000, 4000, 8000];
  private static readonly DEFAULT_MAX_RECONNECT_INTERVAL = 30000;
  private static readonly DEFAULT_HEARTBEAT_INTERVAL = 30000;

  constructor(options: WebSocketOptions) {
    this.options = {
      autoReconnect: true,
      reconnectIntervals: WebSocketClient.DEFAULT_RECONNECT_INTERVALS,
      maxReconnectInterval: WebSocketClient.DEFAULT_MAX_RECONNECT_INTERVAL,
      heartbeatInterval: WebSocketClient.DEFAULT_HEARTBEAT_INTERVAL,
      onMessage: () => {},
      onConnect: () => {},
      onDisconnect: () => {},
      onError: () => {},
      ...options,
    };
    this.userId = options.userId;
  }

  // ========================================================================
  // Connection Management
  // ========================================================================

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected');
      return;
    }

    this.setState('connecting');

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.options.url);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.setState('connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageQueue();
          this.options.onConnect();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = (event) => {
          console.log(`[WebSocket] Closed: ${event.code} - ${event.reason}`);
          this.cleanup();
          this.setState('disconnected');
          this.options.onDisconnect();

          if (this.options.autoReconnect) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          this.options.onError(new Error('WebSocket connection error'));
          reject(error);
        };
      } catch (error) {
        this.setState('disconnected');
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    this.options.autoReconnect = false;
    this.cleanup();

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Client disconnected');
      }
      this.ws = null;
    }

    this.setState('disconnected');
    console.log('[WebSocket] Disconnected');
  }

  // ========================================================================
  // Channel Subscription
  // ========================================================================

  async subscribe(channel: string, callback?: (message: WSMessage) => void): Promise<void> {
    // Register local subscription
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    
    if (callback) {
      this.subscriptions.get(channel)!.add(callback);
    }

    // Send subscribe message if connected
    if (this.isConnected()) {
      const subscribeMessage: WSMessage = {
        type: MessageType.SUBSCRIBE,
        channel: 'global',
        payload: { channel },
        timestamp: new Date().toISOString(),
        sender_id: this.userId,
      };
      await this.send(subscribeMessage);
      console.log(`[WebSocket] Subscribed to ${channel}`);
    }
  }

  async unsubscribe(channel: string, callback?: (message: WSMessage) => void): Promise<void> {
    // Remove local subscription
    if (callback && this.subscriptions.has(channel)) {
      this.subscriptions.get(channel)!.delete(callback);
      
      // Clean up empty subscription sets
      if (this.subscriptions.get(channel)!.size === 0) {
        this.subscriptions.delete(channel);
      }
    } else {
      this.subscriptions.delete(channel);
    }

    // Send unsubscribe message if connected
    if (this.isConnected()) {
      const unsubscribeMessage: WSMessage = {
        type: MessageType.UNSUBSCRIBE,
        channel: 'global',
        payload: { channel },
        timestamp: new Date().toISOString(),
        sender_id: this.userId,
      };
      await this.send(unsubscribeMessage);
      console.log(`[WebSocket] Unsubscribed from ${channel}`);
    }
  }

  isSubscribed(channel: string): boolean {
    return this.subscriptions.has(channel);
  }

  getSubscribedChannels(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  // ========================================================================
  // Message Handling
  // ========================================================================

  async send(message: WSMessage): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message);
      console.log('[WebSocket] Message queued (connection not ready)');
    }
  }

  private handleMessage(data: string): void {
    try {
      const message: WSMessage = JSON.parse(data);
      
      // Handle heartbeat
      if (message.type === MessageType.PONG) {
        return;
      }

      // Dispatch to global handler
      this.options.onMessage(message);

      // Dispatch to channel-specific subscribers
      const channelCallbacks = this.subscriptions.get(message.channel);
      if (channelCallbacks) {
        channelCallbacks.forEach((callback) => {
          try {
            callback(message);
          } catch (error) {
            console.error('[WebSocket] Subscription callback error:', error);
          }
        });
      }
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      if (message) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }

  // ========================================================================
  // Auto-Reconnect
  // ========================================================================

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.setState('reconnecting');

    // Calculate reconnect delay with exponential backoff
    const delay = this.reconnectAttempts < this.options.reconnectIntervals.length
      ? this.options.reconnectIntervals[this.reconnectAttempts]
      : this.options.maxReconnectInterval;

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;
      this.connect().catch((error) => {
        console.error('[WebSocket] Reconnect failed:', error);
      });
    }, delay);
  }

  // ========================================================================
  // Heartbeat
  // ========================================================================

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const pingMessage: WSMessage = {
          type: MessageType.PING,
          channel: 'global',
          payload: {},
          timestamp: new Date().toISOString(),
          sender_id: this.userId,
        };
        this.ws.send(JSON.stringify(pingMessage));
      }
    }, this.options.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ========================================================================
  // State Management
  // ========================================================================

  private setState(state: ConnectionState): void {
    this.state = state;
  }

  getConnectionState(): ConnectionState {
    return this.state;
  }

  isConnected(): boolean {
    return this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  // ========================================================================
  // Cleanup
  // ========================================================================

  private cleanup(): void {
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let globalClient: WebSocketClient | null = null;

export function createWebSocketClient(options: WebSocketOptions): WebSocketClient {
  globalClient = new WebSocketClient(options);
  return globalClient;
}

export function getWebSocketClient(): WebSocketClient | null {
  return globalClient;
}

export function disconnectWebSocketClient(): void {
  if (globalClient) {
    globalClient.disconnect();
    globalClient = null;
  }
}

export default WebSocketClient;
