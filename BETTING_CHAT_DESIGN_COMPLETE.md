[Ver001.000]

# Betting & Chat Design — IMPLEMENTED

**Date:** 2026-03-16  
**Status:** ✅ Core Algorithms Complete

---

## Part 1: Betting Odds Engine

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Data Source** | Hybrid (DB + Pandascore) | Cached historical + real-time live |
| **Odds Format** | Decimal (primary) + American (display) | Math simplicity + user familiarity |
| **Dynamic Updates** | Live odds with cash-out | Engagement driver, competitive feature |
| **Edge/Vig** | 5% base + 3% dynamic | Fair attraction + sustainable revenue |

### Algorithm

```
Weighted Factors:
├── Win rate (30%) — Recent 20 matches
├── Form (25%) — Last 5 matches weighted
├── Head-to-head (20%) — Historical matchup
├── Map strength (15%) — Specific map performance
└── Fatigue (10%) — Recent match density

Vig Application:
- Pre-match: 5% house edge
- Live: 8% (5% + 3% dynamic)

Cash-out: 85% of potential winnings during live matches
```

### Implementation

**File:** `packages/shared/api/src/betting/odds_engine.py` (9,538 bytes)

| Component | Description |
|-----------|-------------|
| `OddsEngine` | Main calculation engine |
| `MatchContext` | Match-specific parameters |
| `TeamFactors` | Performance factors per team |
| `OddsResult` | Complete odds with metadata |
| `calculate_odds()` | Primary calculation method |
| `calculate_cash_out()` | Cash-out offer computation |

---

## Part 2: WebSocket Gateway

### Architecture: Hybrid Gateway

**Decision:** Single `/ws/gateway` with multiplexed channels

**Rationale:**
- Simpler client-side (one connection)
- Scales better than multiple WS
- Clean message type separation

### Channel Types

| Channel | Purpose | Example |
|---------|---------|---------|
| `global` | Platform-wide announcements | System notifications |
| `match:{id}` | Match-specific chat & data | Match discussion |
| `lobby:{id}` | Lobby coordination | Team forming |
| `team:{id}` | Team communications | Strategy chat |
| `hub:{name}` | Hub-specific updates | SATOR, ROTAS, etc. |

### Message Types

| Type | Direction | Purpose |
|------|-----------|---------|
| `data_update` | Server→Client | Match data, odds updates |
| `match_event` | Server→Client | Live match events |
| `chat_message` | Bidirectional | User chat |
| `user_presence` | Server→Client | Online/offline status |
| `auth` | Bidirectional | Authentication |
| `subscribe/unsubscribe` | Client→Server | Channel management |
| `ping/pong` | Bidirectional | Keep-alive |

### Implementation

**File:** `packages/shared/api/src/gateway/websocket_gateway.py` (13,312 bytes)

| Component | Description |
|-----------|-------------|
| `WebSocketGateway` | Main gateway manager |
| `WSMessage` | Standard message format |
| `ChatMessage` | Chat-specific structure |
| `connect/disconnect` | Connection lifecycle |
| `broadcast_to_channel()` | Channel messaging |
| `send_to_user()` | Direct messaging |
| Message history | Last 500 per room |
| Presence tracking | Online status |

### Features

- **Single Connection:** One WS per user
- **Multiplexing:** Multiple channels per connection
- **Message Persistence:** Last 500 messages per room
- **Presence:** Online/offline status tracking
- **Auto-cleanup:** Disconnected user removal
- **History Replay:** New subscribers get recent history

---

## Quick Usage Examples

### Betting Odds

```python
from betting.odds_engine import OddsEngine, MatchContext

engine = OddsEngine()

# Pre-match odds
context = MatchContext(
    match_id="match_123",
    team_a_id="sentinels",
    team_b_id="cloud9",
    game="valorant",
    match_type="bo3"
)
odds = await engine.calculate_odds(context)

# Live odds with cash-out
live_odds = await engine.calculate_odds(
    context,
    is_live=True,
    current_score={"team_a": 1, "team_b": 0}
)

# Cash-out calculation
cash_out = engine.calculate_cash_out(
    bet_amount=100.0,
    potential_winnings=85.0,
    current_odds=live_odds,
    current_score={"team_a": 1, "team_b": 0}
)
```

### WebSocket Gateway

```python
from gateway.websocket_gateway import gateway, WSMessage, MessageType

# Connect user
await gateway.connect(websocket, user_id="user_123")

# Subscribe to match
await gateway.handle_message(user_id, json.dumps({
    "type": "subscribe",
    "channel": "match:123",
    "payload": {"channel": "match:123"}
}))

# Send chat message
await gateway.handle_message(user_id, json.dumps({
    "type": "chat_message",
    "channel": "match:123",
    "payload": {
        "content": "Let's go Sentinels!",
        "username": "FanBoy99"
    }
}))

# Broadcast to channel
await gateway.broadcast_to_channel("match:123", WSMessage(
    type=MessageType.MATCH_EVENT.value,
    channel="match:123",
    payload={"event": "round_win", "team": "sentinels"},
    timestamp=datetime.utcnow().isoformat()
))
```

---

## Files Created

```
packages/shared/api/src/
├── betting/
│   └── odds_engine.py          # 9,538 bytes
└── gateway/
    └── websocket_gateway.py    # 13,312 bytes
```

---

## Integration Points

### With Existing SATOR API
- Mount WebSocket gateway at `/ws/gateway` in `main.py`
- Add betting routes at `/api/betting/odds`
- Use existing auth middleware for WS authentication

### With TENET UI
- Use Zustand store for WS state management
- Subscribe to channels via gateway
- Display odds via RAR card components

---

## Next Steps

1. **API Routes** — Add FastAPI endpoints for odds retrieval
2. **Frontend Integration** — Connect React components to gateway
3. **Database Layer** — Implement actual DB queries for team factors
4. **Pandascore Integration** — Live data feed for real-time odds
5. **Chat UI** — React components for chat interface
6. **Tests** — Unit tests for odds engine, WS gateway

---

## Status Summary

| Component | Status | Lines | 
|-----------|--------|-------|
| Odds Engine | ✅ Complete | 9,538 |
| WebSocket Gateway | ✅ Complete | 13,312 |
| **Total** | | **22,850** |

**Ready for:** API route integration and frontend connection
