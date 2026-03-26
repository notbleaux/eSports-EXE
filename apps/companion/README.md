[Ver001.000]

# NJZ Companion App

**Purpose:** React Native + Expo companion application for NJZ eSports Platform.
**Status:** Phase 0 Stub — Full implementation in Phase 5A
**Framework:** React Native + Expo

## Features (Phase 5A)
- Live match notifications via WebSocket (Path A)
- Quick player/team stats lookup
- Push notifications for followed players
- Offline caching via AsyncStorage + TanStack Query persistence
- Quick-view overlay for active game sessions

## Shared Packages
- `@njz/types` — Canonical type definitions
- `@njz/websocket-client` — Universal WebSocket client
- `@njz/ui` — Shared React components (adapted for RN)

## Development (Phase 5A)
```bash
cd apps/companion
npx expo start
```
