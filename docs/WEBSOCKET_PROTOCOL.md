# WebSocket Protocol Documentation

**Version:** [Ver001.000]  
**Last Updated:** 2026-03-15

## Overview

This document describes the unified WebSocket protocol for real-time communication between the Libre-X-eSport platform backend and frontend clients.

## Connection

### Endpoint

```
wss://api.libre-x-esport.com/v1/ws
```

### Authentication

Authentication can be provided in two ways:

1. **Query Parameter** (on connection):
   ```
   wss://api.libre-x-esport.com/v1/ws?token=<jwt_token>
   ```

2. **Message-based** (after connection):
   ```json
   {
     "action": "authenticate",
     "token": "<jwt_token>"
   }
   ```

## Message Protocol

### Client → Server

#### Subscribe to Channel

```json
{
  "action": "subscribe",
  "channel": "match:12345",
  "filters": {
    "events": ["kill", "round_end"]
  }
}
```

#### Unsubscribe from Channel

```json
{
  "action": "unsubscribe",
  "channel": "match:12345"
}
```

#### Ping (Keep-alive)

```json
{
  "action": "ping"
}
```

#### Authenticate

```json
{
  "action": "authenticate",
  "token": "<jwt_token>"
}
```

### Server → Client

#### Connection Confirmation

```json
{
  "type": "connection",
  "data": {
    "status": "connected",
    "connection_id": "abc123...",
    "authenticated": true
  },
  "timestamp": "2026-03-15T10:00:00Z"
}
```

#### Subscription Confirmed

```json
{
  "type": "subscription_confirmed",
  "channel": "match:12345",
  "data": {
    "filters": {
      "events": ["kill", "round_end"]
    }
  },
  "timestamp": "2026-03-15T10:00:00Z"
}
```

#### Match Update

```json
{
  "type": "match_update",
  "channel": "match:12345",
  "data": {
    "matchId": "12345",
    "eventType": "kill",
    "data": {
      "killer": "player1",
      "victim": "player2",
      "weapon": "Vandal",
      "headshot": true
    },
    "round": 12,
    "timestamp": "2026-03-15T10:00:00Z"
  },
  "timestamp": "2026-03-15T10:00:00Z"
}
```

#### Player Stats Update

```json
{
  "type": "player_stats_update",
  "channel": "player:player1",
  "data": {
    "playerId": "player1",
    "matchId": "12345",
    "stats": {
      "kills": 15,
      "deaths": 8,
      "assists": 4,
      "acs": 245,
      "adr": 168
    },
    "timestamp": "2026-03-15T10:00:00Z"
  },
  "timestamp": "2026-03-15T10:00:00Z"
}
```

#### Analytics Update

```json
{
  "type": "analytics_update",
  "channel": "analytics:leaderboard",
  "data": {
    "metric": "SimRating",
    "value": 92.5,
    "previousValue": 91.8,
    "change": 0.7,
    "context": {
      "playerId": "player1",
      "rank": 1
    },
    "timestamp": "2026-03-15T10:00:00Z"
  },
  "timestamp": "2026-03-15T10:00:00Z"
}
```

#### System Notification

```json
{
  "type": "system_notification",
  "channel": "system:global",
  "data": {
    "level": "info",
    "title": "New Update",
    "message": "New features available!",
    "details": {
      "version": "2.1.0"
    },
    "timestamp": "2026-03-15T10:00:00Z"
  },
  "timestamp": "2026-03-15T10:00:00Z"
}
```

#### Heartbeat

```json
{
  "type": "heartbeat",
  "timestamp": "2026-03-15T10:00:00Z"
}
```

#### Pong (Response to Ping)

```json
{
  "type": "pong",
  "timestamp": "2026-03-15T10:00:00Z"
}
```

#### Error

```json
{
  "type": "error",
  "error": "Invalid channel format. Use 'type:id'",
  "timestamp": "2026-03-15T10:00:00Z"
}
```

## Channel Types

| Channel Type | Format | Description |
|-------------|--------|-------------|
| Match | `match:<match_id>` | Live match events |
| Player | `player:<player_id>` | Player statistics updates |
| Analytics | `analytics:<channel_id>` | Analytics and rankings |
| System | `system:global` | System-wide notifications |
| Tournament | `tournament:<tournament_id>` | Tournament updates |

## Error Codes

### WebSocket Close Codes

| Code | Name | Description |
|------|------|-------------|
| 1000 | Normal | Normal closure |
| 1001 | Going Away | Browser/tab closed |
| 1006 | Abnormal | Abnormal closure (connection lost) |
| 1008 | Policy Violation | Authentication failed |
| 1011 | Internal Error | Server error |
| 1013 | Try Again Later | Server overloaded |

### Error Messages

| Error | Description |
|-------|-------------|
| `Invalid JSON` | Message could not be parsed |
| `Channel required` | Subscribe action missing channel |
| `Invalid channel format` | Channel must be `type:id` format |
| `Invalid channel type` | Unknown channel type |
| `Not subscribed to channel` | Attempted to unsubscribe from unsubscribed channel |
| `Authentication failed` | Token validation failed |
| `Unknown action` | Invalid action specified |

## Reconnection Strategy

### Client Behavior

1. **Initial Connection**: Connect immediately on component mount
2. **Disconnection Detection**: Handle `onclose` and `onerror` events
3. **Auto-reconnect**: Enabled by default with exponential backoff
4. **Max Attempts**: Default 10 attempts before giving up
5. **Backoff**: Base interval 1s, max 30s, multiplier 2x

### Reconnection Parameters

```typescript
{
  reconnectInterval: 1000,        // Base interval (ms)
  maxReconnectInterval: 30000,    // Maximum interval (ms)
  maxReconnectAttempts: 10,       // Maximum attempts (0 = unlimited)
  reconnectBackoffMultiplier: 2,  // Exponential multiplier
  heartbeatInterval: 30000        // Heartbeat interval (ms)
}
```

## Frontend Usage

### Basic Usage

```typescript
import { useWebSocket } from '../hooks/useWebSocket'
import { WS_ENDPOINTS, WS_CHANNELS } from '../config/websocket'

function MatchComponent({ matchId }: { matchId: string }) {
  const { subscribe, unsubscribe, isConnected, status } = useWebSocket({
    url: WS_ENDPOINTS.unified,
    token: 'your-jwt-token',
    onMessage: (message) => {
      console.log('Received:', message)
    }
  })

  useEffect(() => {
    if (isConnected) {
      subscribe(WS_CHANNELS.match(matchId), {}, (data) => {
        console.log('Match update:', data)
      })
    }

    return () => {
      unsubscribe(WS_CHANNELS.match(matchId))
    }
  }, [isConnected, matchId])

  return <div>Status: {status}</div>
}
```

### Multiple Subscriptions

```typescript
function DashboardComponent() {
  const { subscribe, subscriptions } = useWebSocket({
    url: WS_ENDPOINTS.unified
  })

  useEffect(() => {
    // Subscribe to multiple channels
    subscribe('match:12345')
    subscribe('player:player1')
    subscribe('analytics:leaderboard')

    return () => {
      // Cleanup handled automatically on unmount
    }
  }, [])

  return (
    <div>
      Active subscriptions: {subscriptions.join(', ')}
    </div>
  )
}
```

## Backend Broadcasting

### Python API

```python
from routes.websocket import (
    broadcast_match_update,
    broadcast_player_stats_update,
    broadcast_analytics_update,
    broadcast_system_notification
)

# Broadcast match event
await broadcast_match_update("12345", {
    "eventType": "kill",
    "data": {
        "killer": "player1",
        "victim": "player2"
    }
})

# Broadcast player stats
await broadcast_player_stats_update("player1", {
    "stats": {
        "kills": 15,
        "deaths": 8
    }
})

# Broadcast analytics
await broadcast_analytics_update("leaderboard", {
    "metric": "SimRating",
    "value": 92.5
})

# Broadcast system notification
await broadcast_system_notification({
    "level": "info",
    "title": "Maintenance",
    "message": "System maintenance in 30 minutes"
})
```

## Statistics Endpoint

### Get Connection Statistics

```
GET /v1/ws/stats
```

Response:
```json
{
  "status": "success",
  "data": {
    "total_connections": 42,
    "authenticated_connections": 35,
    "anonymous_connections": 7,
    "active_channels": 12,
    "channel_subscriptions": {
      "match:12345": 5,
      "player:player1": 3,
      "system:global": 42
    },
    "timestamp": "2026-03-15T10:00:00Z"
  }
}
```

## Security Considerations

1. **Token Validation**: All tokens are validated before allowing subscriptions
2. **Authenticated Channels**: Some channels may require authentication
3. **Rate Limiting**: Message rate limiting applies per connection
4. **Max Message Size**: Messages larger than 1MB are rejected
5. **Connection Timeout**: Inactive connections are closed after 5 minutes

## Migration from Legacy Endpoints

Legacy endpoints are still supported but deprecated:

| Legacy | New |
|--------|-----|
| `/v1/ws/live/{match_id}` | `/v1/ws/` + subscribe to `match:{id}` |
| `/v1/ws/dashboard/{id}` | `/v1/ws/` + subscribe to `analytics:{id}` |
| `/v1/ws/analytics/{channel}` | `/v1/ws/` + subscribe to `analytics:{channel}` |

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 001.000 | 2026-03-15 | Initial unified WebSocket protocol |
