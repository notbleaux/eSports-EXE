[Ver001.000]

# NJZ Browser Extension

**Purpose:** Chrome/Firefox browser extension for quick NJZ eSports access.
**Status:** Phase 0 Stub — Full implementation in Phase 5B
**Build:** Vite + WebExtension Polyfill (Manifest V3)

## Features (Phase 5B)
- Quick stats panel on hover over player names on esports sites
- Live match sidebar on streaming sites (Twitch, YouTube)
- WebSocket connection for live score updates
- Minimal UI — speed and low footprint priority

## Shared Packages
- `@njz/types` — Canonical type definitions
- `@njz/websocket-client` — Universal WebSocket client

## Development (Phase 5B)
```bash
cd apps/browser-extension
pnpm dev        # Vite build in watch mode
pnpm build      # Production build
```
