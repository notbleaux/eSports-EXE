[Ver001.000]

# WAVE 2.1 — AGENT 3-A TASK: WebSocket Live Feed Client
**Priority:** P0  
**Estimated:** 10 hours  
**Due:** Week 2  
**Stream:** Real-Time Data Pipeline  
**Dependencies:** None (infrastructure foundation)

---

## ASSIGNMENT

Build robust WebSocket client for real-time match data with automatic reconnection, message queuing, and heartbeat management.

---

## DELIVERABLES

### 1. WebSocket Client (api/websocket/client.ts)

```typescript
export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectInterval?: number;    // Base interval (ms)
  maxReconnectInterval?: number; // Max backoff (ms)
  reconnectDecay?: number;       // Exponential factor
  timeoutInterval?: number;      // Connection timeout
  maxReconnectAttempts?: number; // 0 = infinite
  heartbeatInterval?: number;    // Ping interval
  debug?: boolean;
}

export class LiveMatchClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private forcedClose = false;
  
  // Message queue for offline mode
  private messageQueue: WebSocketMessage[] = [];
  private maxQueueSize = 1000;
  
  // State tracking
  private readyState: number = WebSocket.CLOSED;
  private lastPongTime: number = 0;
  
  constructor(config: WebSocketConfig) {
    super();
    this.config = {
      protocols: [],
      reconnectInterval: 1000,
      maxReconnectInterval: 30000,
      reconnectDecay: 1.5,
      timeoutInterval: 5000,
      maxReconnectAttempts: 0,
      heartbeatInterval: 30000,
      debug: false,
      ...config
    };
  }
  
  // Connect to WebSocket
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.log('Already connected');
      return;
    }
    
    this.forcedClose = false;
    this.readyState = WebSocket.CONNECTING;
    this.emit('connecting');
    
    try {
      this.ws = new WebSocket(this.config.url, this.config.protocols);
      this.setupEventHandlers();
    } catch (error) {
      this.emit('error', error);
      this.scheduleReconnect();
    }
  }
  
  // Disconnect gracefully
  disconnect(code = 1000, reason = 'Client disconnect'): void {
    this.forcedClose = true;
    this.clearTimers();
    
    if (this.ws) {
      this.ws.close(code, reason);
    }
    
    this.readyState = WebSocket.CLOSED;
    this.emit('disconnected', { code, reason });
  }
  
  // Send message (queues if offline)
  send(message: WebSocketMessage): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    } else {
      this.queueMessage(message);
      return false;
    }
  }
  
  // Subscribe to match feed
  subscribe(matchId: string): void {
    this.send({
      type: 'subscribe',
      matchId,
      timestamp: Date.now()
    });
  }
  
  private setupEventHandlers(): void {
    if (!this.ws) return;
    
    this.ws.onopen = () => {
      this.readyState = WebSocket.OPEN;
      this.reconnectAttempts = 0;
      this.lastPongTime = Date.now();
      this.startHeartbeat();
      this.flushQueue();
      this.emit('connected');
    };
    
    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        this.emit('error', { type: 'parse', error, data: event.data });
      }
    };
    
    this.ws.onclose = (event) => {
      this.readyState = WebSocket.CLOSED;
      this.clearTimers();
      this.emit('disconnected', event);
      
      if (!this.forcedClose) {
        this.scheduleReconnect();
      }
    };
    
    this.ws.onerror = (error) => {
      this.emit('error', error);
    };
  }
  
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'pong':
        this.lastPongTime = Date.now();
        break;
      case 'match_feed':
        this.emit('matchFeed', message.data as LiveMatchFeed);
        break;
      case 'event':
        this.emit('event', message.data as MatchEvent);
        break;
      case 'error':
        this.emit('serverError', message.data);
        break;
    }
  }
  
  private scheduleReconnect(): void {
    if (this.config.maxReconnectAttempts > 0 &&
        this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.emit('maxReconnectAttemptsReached');
      return;
    }
    
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(this.config.reconnectDecay, this.reconnectAttempts),
      this.config.maxReconnectInterval
    );
    
    this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }
  
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (Date.now() - this.lastPongTime > this.config.heartbeatInterval * 2) {
        this.log('Heartbeat timeout, reconnecting');
        this.ws?.close();
        return;
      }
      
      this.send({ type: 'ping', timestamp: Date.now() });
    }, this.config.heartbeatInterval);
  }
  
  private queueMessage(message: WebSocketMessage): void {
    if (this.messageQueue.length >= this.maxQueueSize) {
      this.messageQueue.shift(); // Remove oldest
    }
    this.messageQueue.push(message);
    this.emit('messageQueued', message);
  }
  
  private flushQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()!;
      this.ws.send(JSON.stringify(message));
    }
  }
  
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[LiveMatchClient]', ...args);
    }
  }
}
```

### 2. React Hook Integration

```typescript
export function useLiveMatch(matchId: string): LiveMatchState {
  const [state, setState] = useState<LiveMatchState>({
    connected: false,
    feed: null,
    error: null
  });
  
  useEffect(() => {
    const client = new LiveMatchClient({
      url: import.meta.env.VITE_WS_URL || 'wss://api.esports-exe.com/v1/live'
    });
    
    client.on('connected', () => {
      setState(s => ({ ...s, connected: true, error: null }));
      client.subscribe(matchId);
    });
    
    client.on('disconnected', () => {
      setState(s => ({ ...s, connected: false }));
    });
    
    client.on('matchFeed', (feed) => {
      setState(s => ({ ...s, feed }));
    });
    
    client.on('error', (error) => {
      setState(s => ({ ...s, error }));
    });
    
    client.connect();
    
    return () => client.disconnect();
  }, [matchId]);
  
  return state;
}
```

---

## ACCEPTANCE CRITERIA

- [ ] Connection establishes <500ms
- [ ] Reconnection works after network drop
- [ ] Message queuing during offline
- [ ] Heartbeat detects stale connections
- [ ] 20 TPS sustained throughput

---

*Claim by moving to `.job-board/02_CLAIMED/{agent-id}/`*
