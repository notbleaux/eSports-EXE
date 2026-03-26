[Ver001.000]

# WebSocket Service

**Purpose:** Dedicated real-time WebSocket service for Path A (Live) distribution.
**Status:** Phase 0 Stub — Full implementation in Phase 2
**Language:** Python (FastAPI WebSockets)
**Port:** 8002

## Responsibilities
- Real-time match event broadcasting (Path A)
- Event types: MATCH_LIVE, ROUND_UPDATE, SCORE_UPDATE, MATCH_END
- Redis Streams consumer → WebSocket broadcaster pipeline
- Clients: Web app, Companion App, Browser Extension

## Event Flow
Pandascore webhook → packages/shared/api → Redis Streams → This service → WebSocket clients

## See Also
- `data/schemas/tenet-protocol.ts` — PathALiveEvent, LiveEventType
- Existing WebSocket code to extract: `packages/shared/api/ws_matches.py`
