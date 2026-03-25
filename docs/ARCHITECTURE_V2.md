[Ver002.000]

# Architecture Documentation v2 — NJZiteGeisTe Platform

**Version:** 2.1.0  
**Last Updated:** 2026-03-15  
**Status:** Production Ready

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagrams](#architecture-diagrams)
3. [Caching Layer](#caching-layer)
4. [Error Boundary Strategy](#error-boundary-strategy)
5. [Test Infrastructure](#test-infrastructure)
6. [Technology Stack](#technology-stack)
7. [Data Flow](#data-flow)
8. [Security Architecture](#security-architecture)

---

## System Overview

The NJZiteGeisTe Platform is a comprehensive esports analytics and simulation system built on a modern, scalable architecture.

### Key Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Web Platform** | React 18, Vite, Tailwind | 4-hub user interface |
| **API Layer** | FastAPI, Python 3.11+ | RESTful API and WebSocket |
| **Data Pipeline** | Python ETL, PostgreSQL | Data extraction and processing |
| **Simulation** | Godot 4 | Deterministic tactical FPS simulation |
| **Caching** | Redis | API response and session caching |
| **Analytics** | TensorFlow.js, ONNX | ML predictions and analytics |

---

## Architecture Diagrams

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │    SATOR     │  │    ROTAS     │  │    AREPO     │  │    OPERA     │        │
│  │   (Gold)     │  │   (Cyan)     │  │   (Blue)     │  │  (Purple)    │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                 │                 │                 │                 │
│         └─────────────────┴────────┬────────┴─────────────────┘                 │
│                                    │                                            │
│                          ┌─────────▼──────────┐                                 │
│                          │   TENET Platform   │                                 │
│                          │   (Central Hub)    │                                 │
│                          └─────────┬──────────┘                                 │
└────────────────────────────────────┼────────────────────────────────────────────┘
                                     │
                              ┌──────▼──────┐
                              │   Vercel    │
                              │   Edge CDN  │
                              └──────┬──────┘
                                     │ HTTPS/WSS
┌────────────────────────────────────┼────────────────────────────────────────────┐
│                              API LAYER                                           │
├────────────────────────────────────┼────────────────────────────────────────────┤
│                                    │                                            │
│  ┌─────────────────────────────────▼────────────────────────────────────────┐   │
│  │                         FastAPI Application                               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │
│  │  │  /v1/    │  │  /v1/    │  │  /v1/    │  │  /v1/    │  │ /v1/ws   │   │   │
│  │  │ players  │  │ matches  │  │ analytics│  │  search  │  │websocket │   │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │   │
│  └───────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────┘   │
│          │             │             │             │             │              │
│  ┌───────▼─────────────▼─────────────▼─────────────▼─────────────▼─────────┐   │
│  │                         Middleware Layer                                 │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │   CORS       │  │ Rate Limiter │  │   Auth/JWT   │  │   Firewall   │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                             │
│                              ┌─────▼─────┐                                      │
│                              │  Render   │                                      │
│                              │  (Docker) │                                      │
│                              └─────┬─────┘                                      │
└────────────────────────────────────┼────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼────────────────────────────────────────────┐
│                         DATA & CACHE LAYER                                       │
├────────────────────────────────────┼────────────────────────────────────────────┤
│                                    │                                            │
│       ┌────────────────────────────┼────────────────────────────┐               │
│       │                            │                            │               │
│       ▼                            ▼                            ▼               │
│  ┌──────────┐               ┌──────────┐                 ┌──────────┐          │
│  │PostgreSQL│◀─────────────▶│  Redis   │                 │Pandascore│          │
│  │(Supabase)│   Connection  │  Cache   │                 │   API    │          │
│  │          │    Pooling    │          │                 │(External)│          │
│  └────┬─────┘               └────┬─────┘                 └────┬─────┘          │
│       │                          │                            │                │
│       │                    ┌─────▼─────┐                       │                │
│       │                    │   TTL     │                       │                │
│       │                    │  Strategy │                       │                │
│       │                    └───────────┘                       │                │
│       │                                                        │                │
│       ▼                                                        ▼                │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                         Data Pipeline Layer                               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │
│  │  │ Extract  │──▶│ Transform│──▶│ Validate │──▶│  Stage   │──▶│  Store   │   │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│    CDN      │────▶│  Load Balancer│───▶│   API       │
│  (Browser)  │     │  (Vercel)   │     │  (Vercel)     │    │  (Render)   │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                   │
                              ┌────────────────────────────────────┤
                              │                                    │
                              ▼                                    ▼
                       ┌──────────┐                       ┌──────────────┐
                       │  Redis   │◀─────────────────────▶│  PostgreSQL  │
                       │  Cache   │    Cache-aside        │  (Supabase)  │
                       └──────────┘    Pattern            └──────────────┘
```

---

## Caching Layer

### Caching Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CACHING STRATEGY                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         L1: Client Cache                               │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │  │
│  │  │  TanStack Query │  │  Browser Cache  │  │ Service Worker  │       │  │
│  │  │   (State Mgmt)  │  │   (HTTP Cache)  │  │   (PWA Cache)   │       │  │
│  │  │                 │  │                 │  │                 │       │  │
│  │  │  • Stale-while  │  │  • Cache-Control│  │  • Static assets│       │  │
│  │  │    revalidate   │  │  • ETags        │  │  • API responses│       │  │
│  │  │  • Background   │  │  • Last-Modified│  │  • Background   │       │  │
│  │  │    refetch      │  │                 │  │    sync         │       │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         L2: CDN Cache                                  │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │  │
│  │  │   Vercel Edge   │  │   Static Assets │  │   API Routes    │       │  │
│  │  │     Network     │  │   (CSS/JS/Img)  │  │   (Edge Cache)  │       │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         L3: Application Cache                          │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                         Redis Cache                              │  │  │
│  │  │                                                                  │  │  │
│  │  │  Key Patterns:                                                   │  │  │
│  │  │  • player:{id}          → Player data (TTL: 1 hour)             │  │  │
│  │  │  • match:{id}           → Match details (TTL: 30 min)           │  │  │
│  │  │  • search:{hash}        → Search results (TTL: 15 min)          │  │  │
│  │  │  • leaderboard:{metric} → Rankings (TTL: 5 min)                 │  │  │
│  │  │  • analytics:{player}   → Analytics (TTL: 1 hour)               │  │  │
│  │  │  • pandascore:*         → External API (TTL: 1-24 hours)        │  │  │
│  │  │                                                                  │  │  │
│  │  │  Cache Strategy: Cache-Aside (Lazy Loading)                      │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         L4: Database                                   │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │  │
│  │  │  PostgreSQL     │  │  Query Results  │  │  Materialized   │       │  │
│  │  │  (Supabase)     │  │  Cache (pg)     │  │  Views          │       │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Cache Invalidation Strategy

| Cache Level | Invalidation Trigger | TTL |
|-------------|---------------------|-----|
| Client State | User action, focus | Manual |
| Browser Cache | Cache-Control headers | 1 hour (static) |
| Service Worker | New deployment | Version-based |
| Redis | Data update events | 5 min - 24 hours |
| Database | N/A | Persistent |

### Cache-Aside Pattern Implementation

```python
# Example: Cache-aside pattern for player data
async def get_player_with_cache(player_id: str) -> dict:
    # 1. Try cache first
    cache_key = f"player:{player_id}"
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # 2. Cache miss - fetch from database
    player = await db.get_player(player_id)
    
    # 3. Store in cache
    await redis.setex(cache_key, 3600, json.dumps(player))
    
    return player
```

---

## Error Boundary Strategy

### Error Boundary Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ERROR BOUNDARY ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Level 0: Application Boundary                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      AppErrorBoundary                                  │  │
│  │              Catches: All uncaught errors                             │  │
│  │              Recovery: Full page reload, navigate home                │  │
│  │              Scope: Entire application                                │  │
│  └─────────────────────────────────┬─────────────────────────────────────┘  │
│                                    │                                         │
│  Level 1: Hub Boundaries           │                                         │
│  ┌─────────────────────────────────┼─────────────────────────────────────┐  │
│  │                                 ▼                                     │  │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐             │  │
│  │  │ HubErrorBound │  │ HubErrorBound │  │ HubErrorBound │             │  │
│  │  │    (SATOR)    │  │    (ROTAS)    │  │   (AREPO)     │             │  │
│  │  │    Gold       │  │    Cyan       │  │    Blue       │             │  │
│  │  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘             │  │
│  │          │                  │                  │                      │  │
│  │  ┌───────┴───────┐  ┌───────┴───────┐  ┌───────┴───────┐             │  │
│  │  │ HubErrorBound │  │ HubErrorBound │  │ HubErrorBound │             │  │
│  │  │    (OPERA)    │  │    (TENET)    │  │               │             │  │
│  │  │    Purple     │  │    White      │  │               │             │  │
│  │  └───────────────┘  └───────────────┘  └───────────────┘             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│  Level 2: Feature Boundaries       ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │  │
│  │  │MLInferenceError │  │StreamingError   │  │  DataErrorBound │      │  │
│  │  │   Boundary      │  │   Boundary      │  │                 │      │  │
│  │  │                 │  │                 │  │                 │      │  │
│  │  │ Handles:        │  │ Handles:        │  │ Handles:        │      │  │
│  │  │ • TF.js errors  │  │ • WebSocket     │  │ • API errors    │      │  │
│  │  │ • Model loading │  │ • Connection    │  │ • Network       │      │  │
│  │  │ • Predictions   │  │ • Timeout       │  │ • HTTP 4xx/5xx  │      │  │
│  │  │ • WebWorker     │  │ • Parse errors  │  │ • Timeout       │      │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘      │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│  Level 3: Component Boundaries     ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │  │
│  │  │ PanelErrorBound │  │PanelErrorBound  │  │PanelErrorBound  │      │  │
│  │  │                 │  │                 │  │                 │      │  │
│  │  │ Scope:          │  │ Scope:          │  │ Scope:          │      │  │
│  │  │ Individual grid │  │ Individual grid │  │ Individual grid │      │  │
│  │  │ panels          │  │ panels          │  │ panels          │      │  │
│  │  │                 │  │                 │  │                 │      │  │
│  │  │ Recovery:       │  │ Recovery:       │  │ Recovery:       │      │  │
│  │  │ • Panel reload  │  │ • Panel reload  │  │ • Panel reload  │      │  │
│  │  │ • Close panel   │  │ • Close panel   │  │ • Close panel   │      │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘      │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Hub-Specific Error Boundary Configurations

```
SATOR (The Observatory) - Gold Theme
┌─────────────────────────────────────────────────────────────┐
│  AppErrorBoundary                                           │
│  └── HubErrorBoundary (SATOR - Gold)                        │
│      └── MLInferenceErrorBoundary                           │
│          └── PanelErrorBoundary                             │
│              └── SATOR Hub Content                          │
└─────────────────────────────────────────────────────────────┘

ROTAS (The Harmonic Layer) - Cyan Theme
┌─────────────────────────────────────────────────────────────┐
│  AppErrorBoundary                                           │
│  └── HubErrorBoundary (ROTAS - Cyan)                        │
│      └── MLInferenceErrorBoundary                           │
│          └── StreamingErrorBoundary  ◀── WebSocket support  │
│              └── PanelErrorBoundary                         │
│                  └── ROTAS Hub Content                      │
└─────────────────────────────────────────────────────────────┘

AREPO (The Control Layer) - Blue Theme
┌─────────────────────────────────────────────────────────────┐
│  AppErrorBoundary                                           │
│  └── HubErrorBoundary (AREPO - Blue)                        │
│      └── DataErrorBoundary     ◀── Heavy API/data usage     │
│          └── PanelErrorBoundary                             │
│              └── AREPO Hub Content                          │
└─────────────────────────────────────────────────────────────┘

OPERA (The Action Layer) - Purple Theme
┌─────────────────────────────────────────────────────────────┐
│  AppErrorBoundary                                           │
│  └── HubErrorBoundary (OPERA - Purple)                      │
│      └── DataErrorBoundary                                  │
│          └── PanelErrorBoundary                             │
│              └── Opera Hub Content                          │
│                  └── MapVisualizationErrorBoundary ◀── Canvas│
└─────────────────────────────────────────────────────────────┘

TENET (The Central Hub) - White Theme
┌─────────────────────────────────────────────────────────────┐
│  AppErrorBoundary                                           │
│  └── HubErrorBoundary (TENET - White)                       │
│      └── PanelErrorBoundary                                 │
│          └── TENET Hub Content                              │
└─────────────────────────────────────────────────────────────┘
```

### Error Recovery Patterns

| Boundary Level | Error Types | Recovery Strategy | Fallback UI |
|----------------|-------------|-------------------|-------------|
| App | Unknown | Full reload, home nav | Full-screen error page |
| Hub | Hub-specific | Reset hub state, switch hubs | Hub-themed error card |
| ML | Model errors | Retry model, cached predictions | "Predictions unavailable" |
| Streaming | Connection | Auto-reconnect with backoff | "Reconnecting..." indicator |
| Data | API errors | Exponential backoff retry | "Retry" button with error details |
| Panel | Component | Panel reload, close | Compact error in panel |

---

## Test Infrastructure

### Testing Pyramid

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            TESTING PYRAMID                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              ┌───────────────┐                               │
│                              │  E2E Tests    │  95+ tests (Playwright)       │
│                              │  (UI/Flows)   │  • Hub navigation             │
│                              │               │  • Search functionality       │
│                              │    ~15%       │  • Real-time updates          │
│                              └───────┬───────┘  • Authentication            │
│                                      │         • Error scenarios            │
│                    ┌─────────────────┴─────────────────┐                   │
│                    │         Integration Tests          │  35+ tests        │
│                    │      (API + Database + Services)   │  • API endpoints  │
│                    │                                    │  • User flows     │
│                    │              ~35%                  │  • Error handling │
│                    └─────────────────┬─────────────────┘                   │
│          ┌───────────────────────────┴───────────────────────────┐         │
│          │                    Unit Tests                        │ 70+      │
│          │           (Functions, Components, Utils)             │ tests    │
│          │                                                      │ • Godot  │
│          │                       ~50%                           │   sim    │
│          └───────────────────────────┬───────────────────────────┘ • React│
│                                      │                            │ utils  │
│  ┌───────────────────────────────────┴───────────────────────────────────┐  │
│  │                         Static Analysis                              │  │
│  │  • TypeScript type checking    • ESLint                             │  │
│  │  • Python type hints (mypy)    • Ruff linting                       │  │
│  │  • Schema validation           • Security scanning                   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Test Organization

```
tests/
├── e2e/                          # Playwright E2E tests
│   ├── hub-navigation.spec.ts
│   ├── search.spec.ts
│   ├── realtime.spec.ts
│   ├── auth.spec.ts
│   ├── errors.spec.ts
│   ├── mobile.spec.ts
│   ├── accessibility.spec.ts
│   ├── visualization.spec.ts
│   ├── ml-prediction.spec.ts
│   ├── export.spec.ts
│   ├── critical-path.spec.ts
│   └── health.spec.ts
│
├── integration/                   # Python integration tests
│   ├── conftest.py
│   ├── test_api_endpoints.py
│   ├── test_user_flows.py
│   ├── test_api_firewall.py
│   ├── test_cold_start_resilience.py
│   ├── test_database_connection.py
│   ├── test_dedup_redundancy.py
│   └── test_pipeline_e2e.py
│
├── unit/                         # Unit tests
│   ├── godot/                    # GUT framework tests
│   │   ├── test_combat_resolver.gd
│   │   ├── test_duel_resolver.gd
│   │   ├── test_economy_simulation.gd
│   │   ├── test_player_movement.gd
│   │   ├── test_weapon_mechanics.gd
│   │   └── test_round_management.gd
│   └── typescript/               # Vitest tests
│       └── components/
│
├── fixtures/                     # Test data factories
│   ├── test_data.py
│   └── __init__.py
│
└── load/                         # Load testing
    └── locustfile.py
```

### CI/CD Test Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CI/CD TEST PIPELINE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Pull Request / Push to main                                                 │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────┐                                                            │
│  │  lint-and-  │  ───▶ Black, Ruff, mypy, ESLint, Prettier                  │
│  │   format    │                                                            │
│  └──────┬───────┘                                                            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                 │
│  │ python-tests │────▶│typescript-tests│───▶│ godot-tests  │                 │
│  │              │     │              │     │              │                 │
│  │ • Unit       │     │ • Vitest     │     │ • GUT        │                 │
│  │ • Integration│     │ • Coverage   │     │ • Unit       │                 │
│  │ • E2E        │     │              │     │ • Determinism│                 │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘                 │
│         │                    │                    │                         │
│         └────────────────────┼────────────────────┘                         │
│                              ▼                                              │
│                       ┌──────────────┐                                      │
│                       │playwright-e2e│  ───▶ 12 test files, 3 browsers      │
│                       │   -tests     │                                      │
│                       └──────┬───────┘                                      │
│                              │                                              │
│                              ▼                                              │
│                       ┌──────────────┐                                      │
│                       │test-summary  │  ───▶ Aggregate results, no masking  │
│                       └──────┬───────┘                                      │
│                              │                                              │
│                              ▼                                              │
│                       ┌──────────────┐                                      │
│                       │   deploy     │  ───▶ Vercel + Render                │
│                       └──────────────┘                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Framework | React | 18.2.0 | UI library |
| Build Tool | Vite | 5.0.0 | Development & bundling |
| Styling | Tailwind CSS | 3.3.0 | Utility-first CSS |
| Animation | Framer Motion | 10.16.0 | Page transitions |
| State | Zustand | 4.4.0 | State management |
| Data Fetching | TanStack Query | 5.90.21 | Server state |
| Virtualization | TanStack Virtual | 3.13.22 | List virtualization |
| 3D Rendering | Three.js + React Three Fiber | 0.158.0 / 8.15.0 | 3D visualization |
| ML | TensorFlow.js | 4.22.0 | ML inference |
| Charts | Recharts | 2.12.0 | Data visualization |
| Icons | Lucide React | 0.294.0 | Icon library |

### Backend Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Framework | FastAPI | 0.104.0 | API framework |
| Python | Python | 3.11+ | Language |
| Database | PostgreSQL | 15.0 | Primary database |
| Cache | Redis | 7.0 | Caching layer |
| ORM | asyncpg | 0.29.0 | Async PostgreSQL |
| Validation | Pydantic | 2.5.0 | Data validation |
| Server | Uvicorn | 0.24.0 | ASGI server |
| Testing | pytest | 7.4.0 | Test framework |

### Game Development Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Engine | Godot | 4.2+ | Game engine |
| Language | GDScript | 4.0 | Game logic |
| Core | C# / .NET | 6.0 | Simulation core |
| Testing | GUT | 9.0.0 | Test framework |

### Infrastructure Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| Hosting (Web) | Vercel | Frontend deployment |
| Hosting (API) | Render | Backend deployment |
| Database | Supabase | PostgreSQL hosting |
| Cache | Upstash Redis | Redis hosting |
| CI/CD | GitHub Actions | Automated testing |
| CDN | Vercel Edge | Static asset delivery |

---

## Data Flow

### Data Ingestion Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Pandascore │    │  VLR.gg     │    │  Other      │    │  Godot Sim  │
│  API        │    │  Scraping   │    │  Sources    │    │  (Internal) │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       └──────────────────┴────────┬─────────┴──────────────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │   Extractors      │
                         │   (Python)        │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │   Transform       │
                         │   (KCRITR Schema) │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │   Validate        │
                         │   (Checksums)     │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │   Stage           │
                         │   (Firewall Check)│
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │   Store           │
                         │   (PostgreSQL)    │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │   Cache           │
                         │   (Redis)         │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │   Serve           │
                         │   (FastAPI)       │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │   Consume         │
                         │   (React Web)     │
                         └───────────────────┘
```

---

## Security Architecture

### Data Partition Firewall

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATA PARTITION FIREWALL                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   GAME SIMULATION                          WEB PLATFORM                      │
│  ┌─────────────────────┐                  ┌─────────────────────┐           │
│  │  internalAgentState │ ─────┬─────X────▶│      BLOCKED        │           │
│  │  radarData          │ ─────┼─────X────▶│      BLOCKED        │           │
│  │  detailedReplay     │ ─────┼─────X────▶│      BLOCKED        │           │
│  │  simulationTick     │ ─────┼─────X────▶│      BLOCKED        │           │
│  │  seedValue          │ ─────┼─────X────▶│      BLOCKED        │           │
│  │  visionConeData     │ ─────┼─────X────▶│      BLOCKED        │           │
│  │  smokeTickData      │ ─────┼─────X────▶│      BLOCKED        │           │
│  │  recoilPattern      │ ─────┼─────X────▶│      BLOCKED        │           │
│  └─────────────────────┘      │           └─────────────────────┘           │
│                               │                                             │
│                               │  Enforcement Points:                        │
│                               │  1. Game Export (LiveSeasonModule.gd)       │
│                               │  2. API Middleware (firewall.py)            │
│                               │  3. Staging System (WebExportForm)          │
│                               │  4. Schema Validation (stats-schema)        │
│                               │  5. CI/CD Testing (automated)               │
│                               │                                             │
│  ┌─────────────────────┐      │           ┌─────────────────────┐           │
│  │  playerId           │ ─────┴──────────▶│  playerId           │           │
│  │  matchResult        │ ─────────────────▶│  matchResult        │           │
│  │  playerStats        │ ─────────────────▶│  playerStats        │           │
│  │  economyData        │ ─────────────────▶│  economyData        │           │
│  │  mapData            │ ─────────────────▶│  mapData            │           │
│  └─────────────────────┘                  └─────────────────────┘           │
│                                                                              │
│   ALLOWED FIELDS (SHARED)                                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Security Headers

```nginx
# Vercel security headers
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

*End of Architecture Documentation v2*
