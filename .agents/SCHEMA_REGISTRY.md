[Ver001.005]

# Schema Registry — NJZ eSports Platform

**Purpose:** Single index of all canonical type definitions. Agents MUST check here before creating any new type, interface, or schema to prevent duplication and drift.
**Authority:** `MASTER_PLAN.md §10` (Schema Change Policy)
**Versioning Policy:** See `docs/SCHEMA_VERSIONING.md` — all schema changes must follow MAJOR.MINOR.PATCH versioning.

---

## Registry Rules

1. Before defining a new type, search this registry first
2. If a type exists here, import it — do not redefine it
3. If you create a new type, add it here immediately
4. Schema changes require `// SCHEMA CHANGE: <reason> — <date>` comment in source

---

## Current Schema Versions

| Schema File | Current Version | Status | Last Updated |
|-------------|-----------------|--------|--------------|
| `data/schemas/GameNodeID.ts` | v1.0.0 | ✅ Active | 2026-03-27 |
| `data/schemas/tenet-protocol.ts` | v1.0.0 | ✅ Active | 2026-03-27 |
| `data/schemas/live-data.ts` | v1.0.0 | ✅ Active | 2026-03-27 |
| `data/schemas/legacy-data.ts` | v1.0.0 | ✅ Active | 2026-03-27 |
| `packages/shared/api/models/player.py` | v1.0.0 | ✅ Active | 2026-03-27 |
| `packages/shared/api/models/team.py` | v1.0.0 | ✅ Active | 2026-03-27 |
| `packages/shared/api/models/match.py` | v1.0.0 | ✅ Active | 2026-03-27 |

**Versioning Guide:**
- **MAJOR** — Breaking change (removes/changes field types) — clients must update
- **MINOR** — Additive change (new optional fields) — backward compatible
- **PATCH** — Bug fix (typo, validation fix) — fully backward compatible

See `docs/SCHEMA_VERSIONING.md` for detailed versioning policy.

---

## Core Domain Types

### Player / Team / Match (Shared)

| Type | Source | Package | Description |
|------|--------|---------|-------------|
| `Player` | `packages/shared/api/models/player.py` (SQLAlchemy) | `@sator/types` | Player entity |
| `PlayerStats` | `packages/shared/api/models/player_stats.py` | `@sator/types` | Per-match stats |
| `Team` | `packages/shared/api/models/team.py` | `@sator/types` | Team entity |
| `Match` | `packages/shared/api/models/match.py` | `@sator/types` | Match entity |
| `SimRating` | `packages/shared/api/models/simrating.py` | `@sator/types` | SimRating calculation |
| `SimCalculation` | `packages/shared/api/models/simcalculation.py` | `@sator/types` | Audit trail |

### TENET Hierarchy

| Type | Source | Package | Description | Status |
|------|--------|---------|-------------|--------|
| `GameNodeID` | `data/schemas/GameNodeID.ts` | `@njz/types` | Base unit with Quarter GRID | ✅ Exists |
| `GameNodeIDValorant` | `data/schemas/GameNodeID.ts` | `@njz/types` | Valorant-specific GameNodeID | ✅ Exists |
| `GameNodeIDCS2` | `data/schemas/GameNodeID.ts` | `@njz/types` | CS2-specific GameNodeID | ✅ Exists |
| `QuarterGrid` | `data/schemas/GameNodeID.ts` | `@njz/types` | 2×2 SATOR/AREPO/OPERA/ROTAS grid | ✅ Exists |
| `WorldPort` | `data/schemas/GameNodeID.ts` | `@njz/types` | Game-specific World-Port | ✅ Exists |
| `TeZeT` | `data/schemas/GameNodeID.ts` | `@njz/types` | World-Tree hub branch | ✅ Exists |
| `TenetVerificationResult` | `data/schemas/tenet-protocol.ts` | `@njz/types` | Output of TeneT Key.Links | ✅ Exists |
| `TrustLevel` | `data/schemas/tenet-protocol.ts` | `@njz/types` | Data source trust tier enum | ✅ Exists |
| `DataSourceType` | `data/schemas/tenet-protocol.ts` | `@njz/types` | Enum of ingestion sources | ✅ Exists |

### Live Data Contracts

| Type | Source | Package | Description | Status |
|------|--------|---------|-------------|--------|
| `LiveMatchEvent` (`PathALiveEvent`) | `data/schemas/live-data.ts` (re-export from tenet-protocol) | `@njz/types` | WebSocket event payload | ✅ Exists |
| `MatchScoreUpdate` (`WsScoreUpdateMessage`) | `data/schemas/live-data.ts` | `@njz/types` | Live score update | ✅ Exists |
| `RoundUpdate` (`WsRoundEndMessage`) | `data/schemas/live-data.ts` | `@njz/types` | Round-end event | ✅ Exists |
| `LiveMatchState` (`LiveMatchView`) | `data/schemas/live-data.ts` | `@njz/types` | Current match snapshot | ✅ Exists |
| `WebSocketEventType` (`WsMessageType`) | `data/schemas/live-data.ts` | `@njz/types` | Enum of WS event types | ✅ Exists |

### Legacy/Truth Data Contracts

| Type | Source | Package | Description | Status |
|------|--------|---------|-------------|--------|
| `VerifiedMatch` (`VerifiedMatchSummary`) | `data/schemas/legacy-data.ts` | `@njz/types` | Match with TeneT confidence | ✅ Exists |
| `RoundHistory` (`VerifiedRoundRecord`) | `data/schemas/legacy-data.ts` | `@njz/types` | Full round-by-round granularity | ✅ Exists |
| `EconomyLog` (`VerifiedEconomyEntry`) | `data/schemas/legacy-data.ts` | `@njz/types` | Economy state per round | ✅ Exists |
| `MinimapFrame` | `data/schemas/tenet-protocol.ts` | `@njz/types` | Computer vision minimap data | ❌ Phase 2 (video pipeline) |
| `VideoReviewGrade` | `data/schemas/tenet-protocol.ts` | `@njz/types` | Manual/AI review score | ✅ Exists |
| `ConfidenceScore` | `data/schemas/tenet-protocol.ts` (re-export in legacy-data.ts) | `@njz/types` | Float 0.0–1.0 with source breakdown | ✅ Exists |

### Schema Barrel Export (TypeScript)

| File | Description | Status |
|------|-------------|--------|
| `data/schemas/index.ts` | Re-exports all types from GameNodeID, tenet-protocol, live-data, legacy-data | ✅ Exists |

### Python Pydantic v2 Schemas

| File | Models | Mirrors | Status |
|------|--------|---------|--------|
| `packages/shared/api/schemas/game_node.py` | `QuarterKey`, `TeZeTRoute`, `QuarterGrid`, `BaseGameNodeID`, `GameNodeIDValorant`, `GameNodeIDCS2`, `WorldPort`, `TeZeT` | `data/schemas/GameNodeID.ts` | ✅ Created |
| `packages/shared/api/schemas/tenet.py` | `TrustLevel`, `DataSourceType`, `VerificationStatus`, `ConfidenceScore`, `TenetVerificationResult`, `PathALiveEvent`, `PathBLegacyRecord` | `data/schemas/tenet-protocol.ts` | ✅ Created |
| `packages/shared/api/schemas/live_data.py` | `WebSocketStatus`, `LiveMatchView`, `LivePlayerStats`, `WsMessage`, `WsMessageType`, `LiveEconomySnapshot` | `data/schemas/live-data.ts` | ✅ Created |
| `packages/shared/api/schemas/legacy_data.py` | `VerifiedMatchSummary`, `VerifiedMatchDetail`, `PlayerSeasonStats`, `SimRatingEntry`, `TournamentRecord` | `data/schemas/legacy-data.ts` | ✅ Created |
| `packages/shared/api/schemas/__init__.py` | Barrel export of all models | All of the above | ✅ Created |

**SCHEMA CHANGE:** Python Pydantic models created to mirror TypeScript schemas — 2026-03-27

### Community / Forum / Auth

| Type | Source | Package | Description |
|------|--------|---------|-------------|
| `ForumPost` | `packages/shared/api/models/forum.py` | `@sator/types` | Forum post entity |
| `ForumComment` | `packages/shared/api/models/forum.py` | `@sator/types` | Comment entity |
| `AuthUser` | `packages/shared/api/models/auth.py` | `@sator/types` | Authenticated user |
| `OAuthAccount` | `packages/shared/api/models/auth.py` | `@sator/types` | OAuth provider link |

---

## Package Namespace Guide

| Namespace | Package | Contents | Status |
|-----------|---------|----------|--------|
| `@sator/types` | `packages/shared/types/` | Player, Team, Match, SimRating, Game | ✅ Exists |
| `@sator/services` | `packages/shared/services/` | API service helpers | ✅ Exists |
| `@njz/types` | `packages/@njz/types/` | GameNodeID, TENET protocol, World-Ports, Live/Legacy | ✅ Exists |
| `@njz/ui` | `packages/@njz/ui/` | QuarterGrid, WorldPortCard, GameNodeBadge | ✅ Exists |
| `@njz/websocket-client` | `packages/@njz/websocket-client/` | Universal WS client | ✅ Exists |
| `@njz/tenet-protocol` | `packages/@njz/tenet-protocol/` | TENET protocol runtime | ❌ To Create (Phase 2) |

---

## Deprecated / Do Not Use

| Type | Location | Reason | Replacement |
|------|----------|--------|-------------|
| Any inline `interface Player` in component files | Various | Duplicates `@sator/types` | Import from `@sator/types` |
| `GameWorld` (generic) | `apps/web/src/hub-5-tenet/` | Superseded by `WorldPort` + `GameNodeID` | `@njz/types` (Phase 1) |

---

## How to Add an Entry

When you create a new type:
1. Add a row to the appropriate section above
2. Mark status: `✅ Exists`, `❌ To Create`, or `🟡 In Progress`
3. Increment this file's version header
4. Reference the `// SCHEMA CHANGE:` comment in the source file
