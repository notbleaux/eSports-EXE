[Ver001.000]

# NJZ LiveStream Overlay

**Purpose:** OBS Studio Browser Source overlay for live stream integration.
**Status:** Phase 0 Stub — Full implementation in Phase 5C
**Build:** Vite SPA (no SSR required — runs as OBS Browser Source)

## Features (Phase 5C)
- Real-time round stats, economy graphs, player highlights
- Live polls integration
- Audience engagement tools
- Minimal latency — targets <100ms display lag

## Shared Packages
- `@njz/types` — Canonical type definitions
- `@njz/websocket-client` — Universal WebSocket client

## OBS Setup
Add as Browser Source: http://localhost:5174 (or deployed URL)
Recommended size: 1920×1080
