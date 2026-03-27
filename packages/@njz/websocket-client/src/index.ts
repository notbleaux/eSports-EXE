/**
 * @njz/websocket-client
 * Universal WebSocket client for NJZ eSports real-time match data (Path A Live Distribution)
 *
 * Connects to the NJZ WebSocket service and broadcasts live match events.
 * Compatible with: Web App, Browser Extension, LiveStream Overlay.
 *
 * SCHEMA CHANGE: @njz/websocket-client package created — 2026-03-27
 */

// --- Event Types ---

export type WsEventType =
  | 'MATCH_START'
  | 'ROUND_START'
  | 'ROUND_END'
  | 'SCORE_UPDATE'
  | 'PLAYER_STATS_UPDATE'
  | 'ECONOMY_SNAPSHOT'
  | 'MATCH_END'
  | 'HEARTBEAT'
  | 'ERROR';

export interface WsMessage {
  type: WsEventType;
  matchId: string;
  timestamp: number;
  payload: Record<string, unknown>;
}

// --- Client Configuration ---

export interface NjzWebSocketConfig {
  /** WebSocket service base URL, e.g. ws://localhost:8002 */
  baseUrl: string;
  /** Reconnect automatically on disconnect (default: true) */
  autoReconnect?: boolean;
  /** Max reconnect attempts before giving up (default: 5) */
  maxReconnectAttempts?: number;
  /** Delay between reconnect attempts in ms (default: 3000) */
  reconnectDelayMs?: number;
}

// --- Client ---

export class NjzWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private listeners = new Map<WsEventType | '*', Array<(msg: WsMessage) => void>>();
  private readonly config: Required<NjzWebSocketConfig>;

  constructor(config: NjzWebSocketConfig) {
    this.config = {
      autoReconnect: true,
      maxReconnectAttempts: 5,
      reconnectDelayMs: 3000,
      ...config,
    };
  }

  /** Connect to the global live feed */
  connectGlobal(): void {
    this.connect(`${this.config.baseUrl}/ws/matches/live`);
  }

  /** Connect to a specific match's live feed */
  connectMatch(matchId: string): void {
    this.connect(`${this.config.baseUrl}/ws/matches/${matchId}/live`);
  }

  /** Subscribe to a specific event type. Use '*' for all events. */
  on(event: WsEventType | '*', handler: (msg: WsMessage) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
    return () => this.off(event, handler);
  }

  /** Remove an event listener */
  off(event: WsEventType | '*', handler: (msg: WsMessage) => void): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      const idx = handlers.indexOf(handler);
      if (idx !== -1) handlers.splice(idx, 1);
    }
  }

  /** Disconnect and stop reconnecting */
  disconnect(): void {
    this.config.autoReconnect = false;
    this.ws?.close();
    this.ws = null;
  }

  private connect(url: string): void {
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WsMessage;
        this.emit(msg);
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      if (this.config.autoReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(url), this.config.reconnectDelayMs);
      }
    };

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
    };
  }

  private emit(msg: WsMessage): void {
    const typed = this.listeners.get(msg.type) ?? [];
    const wildcard = this.listeners.get('*') ?? [];
    for (const handler of [...typed, ...wildcard]) {
      handler(msg);
    }
  }
}

// --- Convenience factory ---

export function createMatchClient(baseUrl: string, matchId: string): NjzWebSocketClient {
  const client = new NjzWebSocketClient({ baseUrl });
  client.connectMatch(matchId);
  return client;
}

export function createGlobalClient(baseUrl: string): NjzWebSocketClient {
  const client = new NjzWebSocketClient({ baseUrl });
  client.connectGlobal();
  return client;
}
