[Ver001.000]

# TENET Topology — Authoritative Architecture Documentation

**Project:** NJZ eSports Platform
**Created:** 2026-03-27
**Status:** CANONICAL — This document supersedes all prior TENET descriptions in AGENTS.md, CLAUDE.md, and scattered plan files.

---

## Overview

TENET is the hierarchical data networking and verification topology of the NJZ eSports Platform. It is **not a UI hub**. It is the connective tissue between the entry portal, game-specific content, and the data verification pipeline.

The name TENET is a palindrome — this reflects the bidirectional nature of the system:
- **Outward flow:** User enters → Portal → Directory → World-Port → Hub content
- **Inward flow:** Data sources → Verification bridge → Truth layer → Hub display

---

## Hierarchy Diagram

```
TeNeT
 │  ┌─────────────────────────────────────────────────────┐
 │  │  HOME PORTAL                                        │
 │  │  User-facing entry page, authentication, onboarding │
 │  └─────────────────────────────────────────────────────┘
 ↓
TeNET
 │  ┌─────────────────────────────────────────────────────┐
 │  │  NETWORK DIRECTORY                                  │
 │  │  Routes users to World-Ports by game selection      │
 │  │  URL: /hubs                                         │
 │  └─────────────────────────────────────────────────────┘
 ↓
World-Ports
 │  ┌──────────────────┐  ┌──────────────────┐
 │  │  /valorant        │  │  /cs2            │  ...
 │  │  Valorant World-  │  │  CS2 World-Port  │
 │  │  Port             │  │                  │
 │  └──────────────────┘  └──────────────────┘
 ↓
GameNodeID
 │  ┌─────────────────────────────────────────────────────┐
 │  │  BASE UNIT — carries the 2×2 Quarter GRID           │
 │  │                                                      │
 │  │  ┌──────────────┬──────────────┐                    │
 │  │  │    SATOR     │    AREPO     │  ← WorldTree Hubs  │
 │  │  │  Analytics   │  Community   │                    │
 │  │  ├──────────────┼──────────────┤                    │
 │  │  │    OPERA     │    ROTAS     │                    │
 │  │  │  Pro Scene   │  Stats/Sim   │                    │
 │  │  └──────────────┴──────────────┘                    │
 │  └─────────────────────────────────────────────────────┘
 ↓
TeZeT
 │  ┌─────────────────────────────────────────────────────┐
 │  │  WORLD-TREE within each Quarter                     │
 │  │  Hub-specific composition and individual focus      │
 │  │  Example: SATOR/TeZeT = SimRating | PlayerCompare  │
 │  │  Example: OPERA/TeZeT = Tournaments | LiveMatch     │
 │  └─────────────────────────────────────────────────────┘
 ↓
tenet (lowercase)
 │  ┌─────────────────────────────────────────────────────┐
 │  │  NETWORK CHANNELS / DATABASE DIRECTORY              │
 │  │  Connects and maps the base of the TENETs           │
 │  │  Indexed Directory Keys for the above TENET         │
 │  │  Verifies the database is appropriately checked     │
 │  └─────────────────────────────────────────────────────┘
 ↓
TeneT Key.Links
    ┌─────────────────────────────────────────────────────┐
    │  VERIFICATION BRIDGE — Data Brokerage & Regulation  │
    │                                                      │
    │  PARSE  → PROOF-READ → VERIFY → REFINE → TIER       │
    │                                                      │
    │  Sources:                                            │
    │  ├── Pandascore API          [TRUST: HIGH]           │
    │  ├── Riot Official API       [TRUST: HIGH]           │
    │  ├── Video Analysis          [TRUST: MEDIUM]         │
    │  ├── Manual Review           [TRUST: HIGH]           │
    │  ├── Minimap Analysis        [TRUST: MEDIUM]         │
    │  ├── LiveStream Grading      [TRUST: MEDIUM]         │
    │  ├── VLR.gg scrape           [TRUST: LOW]            │
    │  ├── Liquidpedia scrape      [TRUST: MEDIUM]         │
    │  └── Fan Forum contributions [TRUST: LOW]            │
    │                                                      │
    │  Output Routing:                                     │
    │  ├── Confidence ≥ 0.90 → PATH B (Static Truth)      │
    │  ├── Confidence 0.70–0.89 → Flag for manual review  │
    │  └── Confidence < 0.70 → Reject, log discrepancies  │
    └─────────────────────────────────────────────────────┘
         ↓                              ↓
  PATH A: LIVE                   PATH B: LEGACY
  ┌──────────────────┐          ┌──────────────────────┐
  │  Redis Streams   │          │  PostgreSQL (truth)  │
  │  WebSocket svc   │          │  ClickHouse (query)  │
  │  Low latency     │          │  High granularity    │
  │  Eventual acc.   │          │  Authoritative       │
  │                  │          │                      │
  │  Feeds:          │          │  Feeds:              │
  │  - MatchLIVE     │          │  - Historical stats  │
  │  - Round updates │          │  - XSim training     │
  │  - Companion App │          │  - SATOR analytics   │
  │  - Browser ext.  │          │  - Full per-round    │
  └──────────────────┘          └──────────────────────┘
```

---

## URL Structure

```
/                               ← TeNeT Portal (entry)
/hubs                           ← TeNET Network Directory
/valorant                       ← World-Port: Valorant
/valorant/analytics             ← SATOR hub (Valorant)
/valorant/analytics/simrating   ← TeZeT: SimRating branch
/valorant/community             ← AREPO hub (Valorant)
/valorant/pro-scene             ← OPERA hub (Valorant)
/valorant/stats                 ← ROTAS hub (Valorant)
/cs2                            ← World-Port: CS2
/cs2/analytics                  ← SATOR hub (CS2)
... etc.
```

---

## Data Pipeline — Two-Path Distribution

### Why Two Paths Exist

Esports data has fundamentally different requirements depending on the use case:

| Need | Path A (Live) | Path B (Legacy) |
|------|--------------|-----------------|
| Latency | <200ms | Minutes to hours |
| Accuracy | Eventual (best effort) | Authoritative |
| Granularity | Score + round number | Full round detail, economy, positions |
| Verification | None (raw API) | TeneT Key.Links consensus |
| Storage | Redis (ephemeral) | PostgreSQL + ClickHouse (permanent) |
| Use cases | Companion App, Overlay, Extension | SATOR analytics, XSim, historical review |

### Why This Matters for Development

When building a feature, agents must decide:
- Does this feature need **live** data? → WebSocket + Path A
- Does this feature need **accurate** data? → REST API + Path B (PostgreSQL)
- Does this feature need **both**? → Serve live first, reconcile with Path B after match ends

---

## TeneT Key.Links — Data Gap Justification

The platform cannot rely on API data alone because:

1. **Legacy history gaps:** Many historical tournaments predate Pandascore's coverage. VLR.gg and Liquidpedia fill these gaps but require verification.
2. **API data limitations:** Official APIs often omit granular data (per-round economy, exact utility usage, minimap positions).
3. **Video as ground truth:** Video recordings are the highest-fidelity source — if a stat contradicts what is clearly shown in video, video wins.
4. **Fan data contributions:** Community-compiled data (win rates, tournament trees) may be accurate but requires cross-referencing.

TeneT Key.Links is the system that resolves these contradictions and produces a single authoritative record.

---

## Frontend Architecture Implication

The directory `apps/web/src/hub-5-tenet/` is the **TeNET navigation layer** in the frontend:

- It contains the TeNeT Portal (entry page), TeNET Directory (game selector), and World-Port routing
- It does **not** contain analytics, stats, community, or pro-scene content
- Each of the 4 WorldTree hubs (SATOR/AREPO/OPERA/ROTAS) is contained in `hub-1-sator/`, `hub-2-rotas/`, `hub-3-arepo/`, `hub-4-opera/`

### TeNET nav layer components (live in `hub-5-tenet/`):

| Component | Purpose |
|-----------|---------|
| `TeNeTPortal` | Landing page, entry, auth |
| `TeNETDirectory` | Game-world selector grid |
| `WorldPortRouter` | Handles `/valorant`, `/cs2` routing |
| `GameNodeIDFrame` | Renders 2×2 Quarter GRID |
| `TeZeTBranch` | Sub-branch selector within a hub |

---

## Type References

All canonical types for the TENET hierarchy are defined in:
- `data/schemas/GameNodeID.ts` — `GameNodeID`, `WorldPort`, `TeZeT`, `QuarterGrid`
- `data/schemas/tenet-protocol.ts` — `TenetVerificationResult`, `ConfidenceScore`, `PathALiveEvent`, `PathBLegacyRecord`, `TrustLevel`, `DataSourceType`

Import from `@njz/types` once that package is created in Phase 1. Until then, import directly from `data/schemas/`.

---

*This document must be kept in sync with `MASTER_PLAN.md §2`. Any architecture change to the TENET hierarchy must update both files simultaneously.*
