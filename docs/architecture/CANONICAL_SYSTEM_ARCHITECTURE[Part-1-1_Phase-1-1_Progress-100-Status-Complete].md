[Ver001.000] [Part: 1/1, Phase: 1/1, Progress: 100%, Status: Complete]

# CANONICAL SYSTEM ARCHITECTURE
## NJZiteGeisTe Platform - Consolidated Visual Reference

**Effective Date:** 2026-03-30  
**Version:** v2.1 Architecture  
**Status:** Canonical Truth

---

## 1. EXECUTIVE OVERVIEW

```mermaid
flowchart TB
    subgraph L5["🌐 Layer 5: Client Presentation"]
        Web["Web App (React 18/Vite)"]
        Ext["Browser Ext (Planned)"]
        Mobile["Mobile (Planned)"]
    end
    
    subgraph L4["⚡ Layer 4: Edge Distribution"]
        Vercel["Vercel Edge Network"]
    end
    
    subgraph L3["🔧 Layer 3: API Gateway"]
        FastAPI["FastAPI (Render)"]
        WS["WebSocket Server"]
    end
    
    subgraph L2["💾 Layer 2: Data & Cache"]
        Postgres["PostgreSQL (Supabase)"]
        Redis["Redis (Upstash)"]
        S3["Object Storage"]
    end
    
    subgraph L1["🌍 Layer 1: External Services"]
        Pandascore["Pandascore API"]
        OAuth["OAuth Providers"]
        Godot["Godot Sim (External)"]
    end
    
    L5 --> L4 --> L3 --> L2 --> L1
```

---

## 2. HUB ARCHITECTURE (TeNeT Gateway System)

The platform follows a **5-Hub Architecture** centered around the TeNeT (Temporal Network) gateway:

```mermaid
flowchart TB
    subgraph TENET["🔶 TeNeT - Central Hub"]
        Nav["Navigation & Entry"]
        Auth["Authentication (OAuth)"]
        Gateway["API Gateway"]
    end
    
    subgraph HUBS["Four Satellite Hubs"]
        direction LR
        
        subgraph SATOR["🔴 SATOR Hub"]
            Analytics["SimRating Engine"]
            Leaderboards["Leaderboards"]
            Profiles["Player Profiles"]
            Observation["Match Tracking"]
        end
        
        subgraph ROTAS["🟢 ROTAS Hub"]
            Simulation["Match Simulation"]
            Predictions["Predictions"]
            XePlayer["X-ePlayer Emulation"]
            Brackets["Tournament Brackets"]
        end
        
        subgraph OPERA["🔵 OPERA Hub"]
            Events["Event Calendar"]
            Tournaments["Tournament Mgmt"]
            Live["Live Matches"]
            VOD["VOD Library"]
        end
        
        subgraph AREPO["🟣 AREPO Hub"]
            Directory["Player Directory"]
            CrossRef["Cross-Reference"]
            Follows["Follow System"]
            Wiki["Wiki/Docs"]
        end
    end
    
    TENET --> SATOR
    TENET --> ROTAS
    TENET --> OPERA
    TENET --> AREPO
```

### Hub Responsibilities

| Hub | Domain | Key Components | Color Code |
|-----|--------|----------------|------------|
| **TeNeT** | Navigation & Auth | OAuth, JWT, Gateway | 🔶 Yellow |
| **SATOR** | Analytics & Observation | SimRating, Leaderboards | 🔴 Red |
| **ROTAS** | Simulation & Scheduling | Predictions, X-ePlayer | 🟢 Green |
| **OPERA** | Operations & Events | Tournaments, Calendar | 🔵 Blue |
| **AREPO** | Repository & Storage | Directory, Wiki | 🟣 Purple |

---

## 3. DATA NETWORKS (Geist Infrastructure)

```mermaid
flowchart LR
    subgraph Networks["Data Networks (Geist)"]
        direction TB
        
        NJZ["🌐 NJZeitGeisTe.net<br/>Infrastructure Directory"]
        Site["📍 sitegeisTe<br/>Web Platform Index"]
        Cite["📊 citegeisTe<br/>Database Indexing"]
        Xcite["📺 xcite/xcitegeisTe<br/>Media Services"]
        Ite["👥 itegeisTe<br/>Social & UX"]
    end
    
    subgraph Central["Central Data Flow"]
        Cloud["☁️ expCloud10.net<br/>Data Orchestration"]
    end
    
    subgraph HubLayer["Hub Integration"]
        S["SATOR"]
        R["ROTAS"]
        O["OPERA"]
        A["AREPO"]
    end
    
    Networks --> Central --> HubLayer
    
    Site --> S
    Cite --> R
    Xcite --> O
    Ite --> A
```

### Network Mappings

| Network | Hub Mapping | Function | Repository Path |
|---------|-------------|----------|-----------------|
| **sitegeisTe** | SATOR | Web Platform Index | `apps/web/src/hub-1-sator/` |
| **citegeisTe** | ROTAS | Database Indexing | `apps/web/src/hub-2-rotas/` |
| **xcite** | OPERA | Media Services | `apps/web/src/hub-4-opera/` |
| **itegeisTe** | AREPO | Social/UX | `apps/web/src/hub-3-arepo/` |
| **NJZeitGeisTe** | ALL | Infrastructure | `packages/shared/api/` |

---

## 4. SIMULATION ECOSYSTEM

```mermaid
flowchart TB
    subgraph Axioms["📦 AXIOMS - Canonical Data"]
        Data["Base Data & Databases"]
        MLData["ML Training Data"]
        Pipeline["Pipeline Processing"]
    end
    
    subgraph SimLayer["Simulation Layer"]
        direction LR
        
        subgraph Axiomatic["🔬 Axiomatic Sim"]
            Analysis["Analysis Software"]
            Modeling["Raw Data Modeling"]
            Prediction["Statistical Prediction"]
        end
        
        subgraph Akziom["🎮 Akziom eSports Manager"]
            GameMode["Game Simulation Mode"]
            Career["Career Management"]
            LiveMatch["Live Match Integration"]
        end
        
        subgraph XSim["⚡ X-Sim"]
            WhatIf["What-If Scenarios"]
            Modular["Modular Analysis"]
            Enhanced["Enhanced Data"]
        end
    end
    
    subgraph Engine["🎲 Godot Engine"]
        Offline["Offline Application"]
        Staging["Staging/Testing"]
        DataEnhance["Data Enhancement"]
    end
    
    subgraph Experimental["🔮 NJZ Experimental"]
        StressTest["Stress Testing"]
        Heuristics["Heuristic Validation"]
        Integration["Integration Testing"]
    end
    
    Axioms --> SimLayer --> Engine
    Axioms --> Experimental
    Experimental -.-> Engine
```

### Simulation Distinctions

| Component | Type | Purpose | User Access |
|-----------|------|---------|-------------|
| **Axiomatic Sim** | Analysis Software | Data analysis, NOT a game | Web Platform |
| **Akziom/eSim** | Video Game | Full game simulation experience | Standalone App |
| **X-Sim** | Extended Simulation | What-if scenarios, predictive analytics | Web Platform |
| **Godot Engine** | Runtime | Execution environment for simulations | Backend |

**Key Principle:** *Axiomatic Sim ≠ Video Game. Software uses data FOR analysis. Akziom/eSim IS the Video Game. Shared data, different purposes.*

---

## 5. SERVICE EXTENSIONS & INTEGRATIONS

```mermaid
flowchart LR
    subgraph Extensions["Extensions & Services"]
        direction TB
        
        NJZine["🔶 NJZine<br/>Browser Extension"]
        NJZyxView["🔭 NJZyxView<br/>Minimap & Lenses"]
        NJZ10["💬 NJZ10<br/>Discord Integration"]
        NJZoNeT["📱 NJZoNeT<br/>Offline Application"]
    end
    
    subgraph Cloud["☁️ expCloud10.net"]
        API["API Gateway"]
        WS["WebSocket"]
        Storage["Data Storage"]
    end
    
    subgraph Hubs["Hub Services"]
        S["SATOR"]
        R["ROTAS"]
        O["OPERA"]
        A["AREPO"]
    end
    
    Extensions --> Cloud --> Hubs
    
    NJZine -.-> S
    NJZyxView -.-> R
    NJZ10 -.-> O
    NJZoNeT -.-> A
```

### Extension Status

| Extension | Status | Hub | Repository Path |
|-----------|--------|-----|-----------------|
| **NJZine** | 🟡 Planned | SATOR | `apps/browser-extension/` |
| **NJZyxView** | 🟡 Planned | ROTAS | Future: Overlay feature |
| **NJZ10** | 🟡 Planned | OPERA | Discord bot (future) |
| **NJZoNeT** | 🟡 Planned | AREPO | Desktop app (Tauri/Electron) |

---

## 6. TECHNOLOGY STACK MAPPING

### Repository Structure (Canonical)

```
eSports-EXE/
│
├── 📁 apps/                          # Client Applications
│   ├── 🌐 web/                      # Main Web Platform (React 18 + Vite)
│   │   ├── src/
│   │   │   ├── hub-1-sator/        # 🔴 Analytics & Leaderboards
│   │   │   ├── hub-2-rotas/        # 🟢 Simulation & Predictions
│   │   │   ├── hub-3-arepo/        # 🟣 Directory & Wiki
│   │   │   ├── hub-4-opera/        # 🔵 Tournaments & Events
│   │   │   ├── hub-5-tenet/        # 🔶 Navigation & Auth
│   │   │   └── hub-cs2/            # 🎮 Counter-Strike 2 Hub
│   │   └── package.json
│   │
│   ├── 🔌 browser-extension/        # 🟡 NJZine (Planned)
│   └── 📊 VCT Valorant eSports/     # Standalone data project
│
├── 📦 packages/                      # Shared Packages
│   └── 🔧 shared/
│       ├── api/                     # FastAPI Backend
│       │   ├── src/
│       │   │   ├── auth/           # TeXeT Keys App (OAuth)
│       │   │   ├── rotas/          # Simulation API
│       │   │   ├── sator/          # Analytics API
│       │   │   └── notifications/  # Push service
│       │   └── requirements.txt
│       │
│       └── axiom-esports-data/      # Data Pipeline
│
├── 🎮 platform/                      # Simulation Platform
│   └── simulation-game/            # Godot 4 (To be extracted)
│
├── 📁 docs/                          # Documentation
│   ├── architecture/               # This document
│   ├── API_V1_DOCUMENTATION.md
│   └── DEPLOYMENT_GUIDE.md
│
├── 🔬 tests/                         # Test Suites
│   ├── e2e/                        # Playwright
│   ├── integration/                # Python
│   └── simulation/                 # ROTAS validation
│
└── ⚙️ .github/workflows/            # CI/CD
    ├── ci.yml
    ├── security-scan.yml
    └── deploy.yml
```

### Technology by Layer

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | React + Vite | 18 / 5 | Web platform |
| **Styling** | Tailwind CSS | 3.x | UI components |
| **State** | Zustand + TanStack Query | 4.x / 5.x | State management |
| **Backend** | FastAPI | 0.115+ | API server |
| **Database** | PostgreSQL | 15+ | Primary storage |
| **Cache** | Redis | 7+ | Session/cache |
| **ML** | TensorFlow.js | 4.x | SimRating model |
| **Simulation** | Godot 4 | 4.2+ | Match simulation |
| **Testing** | Playwright + pytest | Latest | E2E + unit |
| **Hosting** | Vercel + Render | — | Edge + API |

---

## 7. AUTHENTICATION FLOW (TeXeT Keys App)

```mermaid
sequenceDiagram
    participant User
    participant Web as Web App
    participant TENET as TeNeT Gateway
    participant OAuth as OAuth Provider
    participant DB as PostgreSQL
    
    User->>Web: Access protected resource
    Web->>TENET: Check auth token
    
    alt Not Authenticated
        TENET->>Web: 401 Unauthorized
        Web->>User: Show login options
        User->>Web: Select provider (Google/Discord/GitHub)
        Web->>TENET: Initiate OAuth flow
        TENET->>TENET: Generate state (CSRF)
        TENET->>OAuth: Redirect to provider
        OAuth->>User: Login prompt
        User->>OAuth: Credentials
        OAuth->>TENET: Callback + auth code
        TENET->>OAuth: Exchange code for token
        OAuth->>TENET: Access token + profile
        TENET->>DB: Create/Update user
        DB->>TENET: User record
        TENET->>TENET: Generate JWT
        TENET->>Web: Set HttpOnly cookie
        Web->>User: Authenticated
    else Authenticated
        TENET->>Web: 200 OK + user context
    end
```

### Security Layers

| Layer | Component | Implementation |
|-------|-----------|----------------|
| **Transport** | HTTPS | TLS 1.3 required |
| **Session** | JWT | HttpOnly, SameSite=Lax |
| **CSRF** | State Parameter | cryptographically random |
| **Rate Limit** | SlowAPI | 100 req/min per IP |
| **Audit** | Logging | All auth events logged |

---

## 8. DATA FLOW: SATOR Analytics Pipeline

```mermaid
flowchart LR
    subgraph Input["📥 Input Sources"]
        Pandascore["Pandascore API"]
        UserData["User Predictions"]
        Manual["Manual Entry"]
    end
    
    subgraph Ingestion["🔄 Ingestion Layer"]
        ETL["ETL Pipeline"]
        CB["Circuit Breaker"]
        Cache["Redis Cache"]
    end
    
    subgraph Processing["⚙️ Processing"]
        Normalize["Normalization"]
        SimRating["SimRating v2 Engine"]
        Confidence["Confidence Scoring"]
        ML["ML Ranking Model"]
    end
    
    subgraph Output["📤 Output"]
        API["/v1/analytics"]
        Leaderboard["Leaderboards"]
        Profile["Player Profiles"]
    end
    
    Input --> Ingestion --> Processing --> Output
```

### Pipeline Stages

| Stage | Input | Output | Latency |
|-------|-------|--------|---------|
| **Ingestion** | Pandascore webhook | Raw events | Real-time |
| **ETL** | Raw events | Normalized stats | ~5 min |
| **SimRating** | Player stats | Rating scores | ~1 min |
| **Ranking** | All ratings | Leaderboards | ~5 min |

---

## 9. DATA FLOW: ROTAS Simulation Pipeline

```mermaid
flowchart LR
    subgraph Request["🎯 Simulation Request"]
        Teams["Team Compositions"]
        Maps["Map Selection"]
        Econ["Economy State"]
        Options["Sim Options"]
    end
    
    subgraph Engine["🎮 ROTAS Engine"]
        Deterministic["Deterministic Run"]
        Validation["Validation Check"]
        XePlayer["X-ePlayer Emulation"]
    end
    
    subgraph Output["📊 Output"]
        Winner["Predicted Winner"]
        Score["Predicted Score"]
        Rounds["Round-by-Round"]
        Confidence["Confidence %"]
    end
    
    Request --> Engine --> Output
```

### Simulation Accuracy Targets

| Metric | Target | Minimum | Validation Method |
|--------|--------|---------|-------------------|
| Match Winner | 70% | 65% | VCT Historical |
| Exact Score | 60% | 55% | VCT Historical |
| Round Winner | 55% | 50% | VCT Historical |
| Determinism | 100% | 100% | Unit Tests |

---

## 10. CIRCUIT BREAKER ARCHITECTURE

```mermaid
stateDiagram-v2
    [*] --> Closed : Initialize
    
    Closed --> Closed : Success
    Closed --> Open : Failures >= 5
    
    Open --> Open : Request Rejected
    Open --> HalfOpen : 5 min timeout
    
    HalfOpen --> Closed : Success
    HalfOpen --> Open : Failure
    
    note right of Closed
        Normal operation
        Requests to Pandascore
    end note
    
    note right of Open
        Failing fast
        Return cached data
    end note
    
    note right of HalfOpen
        Testing recovery
        1 request allowed
    end note
```

### Circuit Breaker Configuration

| Service | Threshold | Timeout | Fallback |
|---------|-----------|---------|----------|
| **Pandascore** | 5 failures | 5 min | Cached data |
| **Redis** | 3 failures | 30 sec | Direct DB |
| **OAuth** | 3 failures | 1 min | Error page |

---

## 11. DEPLOYMENT ARCHITECTURE

```mermaid
flowchart TB
    subgraph Dev["💻 Development"]
        Local["Localhost:5173"]
        Docker["Docker Compose"]
    end
    
    subgraph Staging["🟡 Staging"]
        VercelStg["Vercel Preview"]
        RenderStg["Render Staging"]
        SupabaseStg["Supabase Staging"]
    end
    
    subgraph Prod["🟢 Production"]
        VercelProd["Vercel Edge"]
        RenderProd["Render"]
        SupabaseProd["Supabase"]
        Upstash["Upstash Redis"]
    end
    
    Dev --> Staging --> Prod
```

### Infrastructure Mapping

| Component | Development | Staging | Production |
|-----------|-------------|---------|------------|
| **Frontend** | localhost:5173 | Preview URL | Vercel Edge |
| **API** | localhost:8000 | Render Staging | Render |
| **Database** | Docker | Supabase Staging | Supabase |
| **Cache** | Docker | Upstash | Upstash |
| **Storage** | Local | Supabase | Supabase |

---

## 12. API VERSIONING & ENDPOINTS

### Current API Structure

```
https://api.njzitegeist.com/v1/
│
├── 🔐 /auth
│   ├── POST /token
│   ├── GET /oauth/{provider}
│   └── POST /2fa/verify
│
├── 👤 /players
│   ├── GET / (list)
│   ├── GET /{id}
│   ├── GET /{id}/stats
│   └── GET /{id}/history
│
├── 🎮 /matches
│   ├── GET / (list)
│   ├── GET /{id}
│   └── GET /{id}/stats
│
├── 📊 /analytics
│   ├── GET /simrating
│   ├── GET /leaderboard
│   └── GET /predictions
│
├── 🔮 /rotas
│   ├── POST /simulate
│   ├── GET /predictions/{match_id}
│   └── GET /brackets/{tournament_id}
│
├── 🔍 /search
│   └── GET /?q={query}
│
└── 🏥 /health
    ├── GET / (basic)
    ├── GET /ready
    └── GET /circuits
```

### Versioning Policy

| Version | Status | Support Until | Breaking Changes |
|---------|--------|---------------|------------------|
| v1 | ✅ STABLE | 2027-03-30 | None (6mo notice) |
| v2 | ⬜ PLANNED | TBD | TBD |

---

## 13. SECURITY ARCHITECTURE

```mermaid
flowchart TB
    subgraph Perimeter["🛡️ Perimeter Security"]
        WAF["WAF (Cloudflare)"]
        DDOS["DDoS Protection"]
        RateLimit["Rate Limiting"]
    end
    
    subgraph Application["🔒 Application Security"]
        Auth["OAuth 2.0 / JWT"]
        InputVal["Input Validation"]
        SQLProtect["SQL Injection Protection"]
        XSSProtect["XSS Protection"]
    end
    
    subgraph DataSecurity["🔐 Data Security"]
        Encryption["Encryption at Rest"]
        TLS["TLS 1.3 in Transit"]
        Backup["Encrypted Backups"]
    end
    
    subgraph Audit["📋 Audit & Monitoring"]
        Logging["Security Logging"]
        Alerts["Security Alerts"]
        Scanning["Vulnerability Scanning"]
    end
    
    Perimeter --> Application --> DataSecurity --> Audit
```

### Security Checklist (Pre-Production)

- [x] OAuth 2.0 with state validation
- [x] JWT with HttpOnly cookies
- [x] Rate limiting (SlowAPI)
- [x] Input validation (Pydantic)
- [x] SQL injection protection (SQLAlchemy)
- [ ] Third-party security audit
- [ ] Penetration testing
- [ ] SOC 2 compliance review

---

## 14. MONITORING & OBSERVABILITY

```mermaid
flowchart LR
    subgraph Sources["Data Sources"]
        App["Application Logs"]
        Metrics["Performance Metrics"]
        Traces["Distributed Traces"]
    end
    
    subgraph Collection["Collection"]
        Sentry["Sentry (Errors)"]
        Prometheus["Prometheus (Metrics)"]
        Tempo["Tempo (Traces)"]
    end
    
    subgraph Visualization["Visualization"]
        Grafana["Grafana Dashboards"]
        Alerts["Alert Manager"]
        Reports["Weekly Reports"]
    end
    
    Sources --> Collection --> Visualization
```

### Key Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **API Latency** | <200ms p99 | >500ms |
| **Error Rate** | <0.1% | >1% |
| **Uptime** | 99.9% | <99.5% |
| **Cache Hit Rate** | >80% | <60% |

---

## 15. GLOSSARY

| Term | Definition |
|------|------------|
| **TeNeT** | Temporal Network - Central navigation gateway |
| **TeXeT** | Keys Application - Authentication layer |
| **TeZeT** | Data Center Connector - API gateway |
| **SATOR** | Analytics & Observation Hub |
| **ROTAS** | Return On Tactical Analysis System - Simulation |
| **OPERA** | Operations & Event Management Hub |
| **AREPO** | Repository & Storage Hub |
| **Geist** | Data network infrastructure layer |
| **Axioms** | Canonical data foundation |
| **X-ePlayer** | User-match-history-based AI emulation |
| **SimRating** | Player performance rating algorithm |
| **RAR** | Risk-Adjusted Return - Investment grading |

---

## 16. DOCUMENT CONTROL

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 001.000 | 2026-03-30 | Architecture Team | Initial consolidated version |

### Related Documents

- [API Documentation](../API_V1_DOCUMENTATION.md)
- [Deployment Guide](../DEPLOYMENT_GUIDE.md)
- [Security Policy](../../SECURITY.md)
- [Data Architecture](../DATA_ARCHITECTURE.md)

### Review Cycle

- **Quarterly:** Architecture review
- **After Major Changes:** Immediate update
- **Annual:** Comprehensive audit

---

*End of Canonical System Architecture*  
*This document represents the authoritative source of truth for NJZiteGeisTe Platform architecture.*
