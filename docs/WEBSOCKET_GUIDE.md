[Ver001.000]

# WebSocket Guide

## Overview
The TENET WebSocket Gateway provides real-time communication for live odds, match updates, and chat.

## Connection

```javascript
const ws = new WebSocket('wss://api.libre-x-esport.com/ws/gateway');

ws.onopen = () => {
  console.log('Connected');
  
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

## Message Types

### Authentication
```json
{
  "type": "auth",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGci..."
}
```

### Subscribe to Channel
```json
{
  "type": "subscribe",
  "channel": "match:match_123"
}
```

### Unsubscribe
```json
{
  "type": "unsubscribe",
  "channel": "match:match_123"
}
```

## Channels

| Channel | Description | Example |
|---------|-------------|---------|
| global | Platform announcements | `global` |
| match | Match-specific updates | `match:123` |
| team | Team updates | `team:456` |
| hub | Hub-specific | `hub:sator` |

## Error Handling

```javascript
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = (event) => {
  if (!event.wasClean) {
    // Reconnect logic
    setTimeout(connect, 1000);
  }
};
```

## React Hook Usage

```typescript
import { useWebSocket } from '@/components/TENET/hooks/useWebSocket';

function MyComponent() {
  const { connected, subscribe, send } = useWebSocket();
  
  useEffect(() => {
    if (connected) {
      subscribe('match:123');
    }
  }, [connected]);
}
```
