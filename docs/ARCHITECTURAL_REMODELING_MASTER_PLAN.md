[Ver001.000]

# Architectural Remodeling & Re-engineering Master Plan

**Project:** Libre-X-eSport 4NJZ4 TENET Platform  
**Date:** 2026-03-22  
**Status:** Planning Phase  
**Classification:** Authoritative Technical Document

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Assessment](#2-current-architecture-assessment)
3. [Target Architecture Vision](#3-target-architecture-vision)
4. [Remodeling Phases](#4-remodeling-phases)
5. [Component Remodeling Strategy](#5-component-remodeling-strategy)
6. [Code Extraction Plan](#6-code-extraction-plan)
7. [Risk Management](#7-risk-management)
8. [Resource Allocation](#8-resource-allocation)

---

## 1. Executive Summary

### 1.1 Remodeling Rationale

Based on comprehensive Wave 1/2 analysis, the 4NJZ4 TENET Platform requires architectural remodeling to address critical gaps identified in the COMPREHENSIVE_CRIT_REPORT and REPO_REVIEW_2026-03-17:

| Issue Category | Severity | Impact | Source |
|----------------|----------|--------|--------|
| Missing Testing Framework | Critical | No automated quality assurance | CRIT Report |
| Missing ESLint Configuration | High | No code style enforcement | CRIT Report |
| Infrastructure Instability | Critical | Production services offline | Repo Review |
| Duplicate Database Files | Medium | Maintenance confusion | CRIT Report |
| No TypeScript Configuration | Medium | Runtime error risk | CRIT Report |
| Large Bundle Size | Medium | Mobile performance impact | CRIT Report |

### 1.2 Scope and Objectives

**Primary Objectives:**

1. **Stabilize Foundation** — Resolve all Phase 0 blockers (testing, linting, types)
2. **Modernize Architecture** — Implement Clean Architecture principles
3. **Enable Scalability** — Web Workers, Canvas rendering, PWA capabilities
4. **Integrate Features** — Complete Heroes, Lensing, Godot simulation
5. **Production Ready** — Comprehensive testing, documentation, deployment

**Scope Boundaries:**

| In Scope | Out of Scope |
|----------|--------------|
| Frontend (React/Vite) architecture | CS2 simulation (future phase) |
| Backend (FastAPI) improvements | Mobile native apps |
| Data pipeline optimizations | Blockchain integration |
| Godot simulation integration | Non-esports data sources |
| Testing infrastructure | Legacy v1 migration |

### 1.3 Success Criteria

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Code Quality Score | A- or higher | CRIT Report assessment |
| Test Coverage | >80% | Coverage reports |
| Build Warnings | Zero | CI/CD logs |
| Bundle Size | <500KB initial | Bundle analyzer |
| API Response | <100ms | Load testing |
| Grid Performance | 60fps | Chrome DevTools |
| Production Uptime | 99.5% | Monitoring dashboards |

---

## 2. Current Architecture Assessment

### 2.1 System Inventory

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CURRENT SYSTEM INVENTORY                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         FRONTEND LAYER                                 │  │
│  │  Location: apps/website-v2/                                           │  │
│  │                                                                        │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │  │
│  │  │ React 18        │  │ Vite 5          │  │ Tailwind CSS    │       │  │
│  │  │ Status: ✅      │  │ Status: ✅      │  │ Status: ✅      │       │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘       │  │
│  │                                                                        │  │
│  │  Components: 25+ React components across 5 hubs                       │  │
│  │  State: Zustand stores                                                │  │
│  │  Missing: ESLint, Testing, TypeScript                                 │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         BACKEND LAYER                                  │  │
│  │  Location: packages/shared/api/                                       │  │
│  │                                                                        │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │  │
│  │  │ FastAPI 0.104   │  │ Python 3.11+    │  │ PostgreSQL      │       │  │
│  │  │ Status: ✅      │  │ Status: ✅      │  │ Status: ⚠️      │       │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘       │  │
│  │                                                                        │  │
│  │  Modules: 94 Python files                                             │  │
│  │  Status: Supabase PAUSED (87 days to deletion)                        │  │
│  │  Issues: Import inconsistencies, missing tests                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         DATA PIPELINE                                  │  │
│  │  Location: packages/shared/axiom-esports-data/                        │  │
│  │                                                                        │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │  │
│  │  │ Pandascore API  │  │ Redis Cache     │  │ ETL Pipeline    │       │  │
│  │  │ Status: ✅      │  │ Status: ✅      │  │ Status: ✅      │       │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘       │  │
│  │                                                                        │  │
│  │  Issues: Duplicate db.py files, no requirements.txt                   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         SIMULATION                                     │  │
│  │  Location: platform/simulation-game/                                  │  │
│  │                                                                        │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │  │
│  │  │ Godot 4         │  │ GDScript        │  │ GUT Tests       │       │  │
│  │  │ Status: 🟡      │  │ Status: 🟡      │  │ Status: ✅      │       │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘       │  │
│  │                                                                        │  │
│  │  Status: Paused, requires integration                                 │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Pain Points Identified

#### Critical Pain Points (P0)

| ID | Pain Point | Impact | Current State |
|----|------------|--------|---------------|
| P0-1 | No Frontend Testing | Cannot verify quality | 0% coverage |
| P0-2 | Missing ESLint | No code standards | Build warnings |
| P0-3 | Supabase PAUSED | Production data at risk | 87 days to deletion |
| P0-4 | Render Deploy Failed | API unavailable | Service broken |

#### High Pain Points (P1)

| ID | Pain Point | Impact | Current State |
|----|------------|--------|---------------|
| P1-1 | No TypeScript Config | Runtime errors likely | No type checking |
| P1-2 | Duplicate db Files | Maintenance burden | 2 identical files |
| P1-3 | Large Bundle | Mobile performance | 1.53MB uncompressed |
| P1-4 | No CI/CD Pipeline | Manual deployment | Workflows disabled |

#### Medium Pain Points (P2)

| ID | Pain Point | Impact | Current State |
|----|------------|--------|---------------|
| P2-1 | Unused Components | Code bloat | QuarterGrid.jsx |
| P2-2 | CSS Import Warning | Build quality | @import order |
| P2-3 | Dual UI Directories | Design inconsistency | components/ui/ + shared/ |
| P2-4 | Grid Performance | UX degradation | ~40-50fps drag |

### 2.3 Technical Debt Catalog

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TECHNICAL DEBT REGISTER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Category: Testing Debt                                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ TD-001: No Frontend Testing Framework                                │  │
│  │   Principal: 8 hours to implement                                    │  │
│  │   Interest: Quality regressions, manual testing burden               │  │
│  │   Risk: CRITICAL                                                     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Category: Code Quality Debt                                                 │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ TD-002: Missing ESLint Configuration                                 │  │
│  │   Principal: 2 hours to implement                                    │  │
│  │   Interest: Inconsistent style, missed bugs                          │  │
│  │   Risk: HIGH                                                         │  │
│  │                                                                        │  │
│  │ TD-003: No TypeScript Configuration                                  │  │
│  │   Principal: 4 hours to implement                                    │  │
│  │   Interest: Runtime errors, poor DX                                  │  │
│  │   Risk: MEDIUM                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Category: Infrastructure Debt                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ TD-004: Duplicate Database Files                                     │  │
│  │   Principal: 30 minutes to resolve                                   │  │
│  │   Interest: Confusion, potential bugs                                │  │
│  │   Risk: MEDIUM                                                       │  │
│  │                                                                        │  │
│  │ TD-005: Disabled CI/CD Workflows                                     │  │
│  │   Principal: 8 hours to restore                                      │  │
│  │   Interest: Manual deployment, error-prone                           │  │
│  │   Risk: HIGH                                                         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Category: Performance Debt                                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ TD-006: Large Bundle Size                                            │  │
│  │   Principal: 16 hours to optimize                                    │  │
│  │   Interest: Slower load times, poor mobile UX                        │  │
│  │   Risk: MEDIUM                                                       │  │
│  │                                                                        │  │
│  │ TD-007: Grid Performance Issues                                      │  │
│  │   Principal: 20 hours to optimize                                    │  │
│  │   Interest: Poor drag experience, dropped frames                     │  │
│  │   Risk: MEDIUM                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Target Architecture Vision

### 3.1 Clean Architecture Principles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     TARGET CLEAN ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Layer 4: Presentation Layer (UI)                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │ React Components  │  Error Boundaries  │  Loading States       │  │  │
│  │  │ Hub-specific UIs  │  Design System     │  Accessibility        │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                    │                                                   │  │
│  │                    ▼ (depends on)                                      │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │ Layer 3: Application Layer (Hooks/Services)                    │  │  │
│  │  │ Custom Hooks      │  State Management  │  API Clients          │  │  │
│  │  │ Business Logic    │  Zustand Stores    │  TanStack Query       │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                    │                                                   │  │
│  │                    ▼ (depends on)                                      │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │ Layer 2: Domain Layer (Business Rules)                         │  │  │
│  │  │ Analytics Engine  │  Simulation Core   │  Data Transformation  │  │  │
│  │  │ Type Definitions  │  Validation Logic  │  Business Rules       │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                    │                                                   │  │
│  │                    ▼ (depends on)                                      │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │ Layer 1: Infrastructure Layer                                   │  │  │
│  │  │ API Endpoints     │  Database Access   │  External Services    │  │  │
│  │  │ Cache Layer       │  WebSocket         │  ML Inference         │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Dependency Rule: Inner layers know nothing about outer layers               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Modular Design Goals

| Module | Responsibility | Dependencies | Interface |
|--------|---------------|--------------|-----------|
| `hub-sator` | Analytics & predictions | analytics-engine, api-client | `SATORHub` |
| `hub-rotas` | Simulation & visualization | simulation-bridge, canvas | `ROTASHub` |
| `hub-arepo` | Data management & search | search-service, filters | `AREPOHub` |
| `hub-opera` | Matches & events | live-data, websocket | `OPERAHub` |
| `hub-tenet` | Central coordination | all hubs, navigation | `TENETHub` |
| `shared/ui` | Design system components | none | `Button`, `Card`, etc. |
| `shared/api` | API client abstraction | http, cache | `ApiClient` |
| `shared/utils` | Utility functions | none | various helpers |

### 3.3 Technology Stack Confirmation

#### Confirmed Stack (No Changes)

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| Frontend Framework | React | 18.2+ | Component model, ecosystem |
| Build Tool | Vite | 5.0+ | Fast HMR, optimal builds |
| Styling | Tailwind CSS | 3.3+ | Utility-first, consistent |
| State Management | Zustand | 4.4+ | Lightweight, TypeScript |
| Data Fetching | TanStack Query | 5.90+ | Caching, synchronization |
| Animation | Framer Motion | 10.16+ | Declarative animations |
| 3D Rendering | Three.js + R3F | 0.158+ | WebGL, React integration |

#### Stack Additions (Remodeling)

| Addition | Purpose | Phase |
|----------|---------|-------|
| Vitest + Testing Library | Unit/component testing | Phase 0 |
| ESLint + Prettier | Code quality | Phase 0 |
| TypeScript 5.9 | Type safety | Phase 1 |
| Playwright | E2E testing | Phase 1 |
| Web Workers API | Parallel processing | Phase 2 |
| Service Worker API | PWA capabilities | Phase 2 |

---

## 4. Remodeling Phases

### Phase Overview

| Phase | Focus | Duration | Key Deliverables | Success Criteria |
|-------|-------|----------|------------------|------------------|
| **Phase 0** | Blocker Resolution | Week 0 | Testing framework, ESLint, cleanup | Zero build warnings, tests pass |
| **Phase 1** | Foundation Stabilization | Weeks 1-2 | TypeScript, CI/CD, type fixes | Type-safe codebase, CI green |
| **Phase 2** | Performance Architecture | Weeks 3-4 | Web Workers, Canvas, PWA | 60fps grid, <500KB bundle |
| **Phase 3** | Feature Integration | Weeks 5-8 | Heroes, Lensing, Godot | Feature parity + new features |
| **Phase 4** | Polish & Optimization | Weeks 9-12 | Testing, docs, deployment | Production ready, 99.5% uptime |

### 4.1 Phase 0: Blocker Resolution (Week 0)

**Goal:** Resolve all critical blockers preventing quality development

#### Week 0 Schedule

| Day | Task | Hours | Owner | Deliverable |
|-----|------|-------|-------|-------------|
| Mon | Add Vitest + Testing Library | 4 | Frontend | Test framework installed |
| Mon | Create test utilities | 4 | Frontend | `test/setup.js`, helpers |
| Tue | Add ESLint configuration | 2 | Frontend | `.eslintrc.cjs` |
| Tue | Add Prettier configuration | 2 | Frontend | `.prettierrc` |
| Wed | Fix all ESLint violations | 4 | Frontend | Zero lint errors |
| Wed | Remove duplicate files | 2 | Backend | `db_implemented.py` deleted |
| Thu | Remove unused components | 2 | Frontend | `QuarterGrid.jsx` removed |
| Thu | Fix CSS import order | 2 | Frontend | No build warnings |
| Fri | Write baseline tests | 4 | Frontend | 20+ passing tests |
| Fri | Update documentation | 2 | Docs | Phase 0 complete |

**Phase 0 Deliverables:**
- [ ] `vitest.config.js` with React Testing Library
- [ ] `.eslintrc.cjs` with React hooks rules
- [ ] `.prettierrc` with project formatting
- [ ] `src/test/setup.js` with test utilities
- [ ] 20+ baseline component tests
- [ ] Duplicate database files removed
- [ ] Zero ESLint violations
- [ ] Zero build warnings

### 4.2 Phase 1: Foundation Stabilization (Weeks 1-2)

**Goal:** Establish type safety, CI/CD pipeline, and architectural patterns

#### Week 1: TypeScript Migration

| Day | Task | Hours | Owner | Deliverable |
|-----|------|-------|-------|-------------|
| Mon | Add TypeScript configuration | 4 | Frontend | `tsconfig.json` |
| Mon | Create type definitions | 4 | Frontend | `src/types/*.d.ts` |
| Tue | Migrate core utilities | 6 | Frontend | Utils in TypeScript |
| Tue | Configure path aliases | 2 | Frontend | `@/` imports working |
| Wed | Migrate API layer | 6 | Frontend | API clients typed |
| Wed | Migrate stores | 2 | Frontend | Zustand stores typed |
| Thu | Migrate components (batch 1) | 8 | Frontend | 10 components typed |
| Fri | Migrate components (batch 2) | 8 | Frontend | 10 components typed |

#### Week 2: CI/CD & Integration

| Day | Task | Hours | Owner | Deliverable |
|-----|------|-------|-------|-------------|
| Mon | Restore CI/CD workflows | 4 | DevOps | `.github/workflows/ci.yml` |
| Mon | Add pre-commit hooks | 4 | DevOps | `.husky/` configured |
| Tue | Add Playwright E2E tests | 6 | QA | E2E test suite |
| Tue | Configure test reporting | 2 | QA | HTML reports |
| Wed | Add Python test coverage | 4 | Backend | pytest coverage |
| Wed | Integrate security scanning | 4 | DevOps | Bandit, CodeQL |
| Thu | Test full pipeline | 6 | DevOps | Green CI/CD |
| Thu | Document process | 2 | Docs | CI/CD guide |
| Fri | Buffer/fix issues | 8 | All | Stable pipeline |

**Phase 1 Deliverables:**
- [ ] Full TypeScript configuration
- [ ] All source files migrated to `.ts/.tsx`
- [ ] Working CI/CD pipeline
- [ ] Pre-commit hooks (lint, format, test)
- [ ] E2E test suite with Playwright
- [ ] Security scanning integrated
- [ ] 100% build success rate

### 4.3 Phase 2: Performance Architecture (Weeks 3-4)

**Goal:** Implement Web Workers, Canvas rendering, PWA capabilities

#### Week 3: Web Workers & Canvas

| Day | Task | Hours | Owner | Deliverable |
|-----|------|-------|-------|-------------|
| Mon | Create Web Worker infrastructure | 6 | Frontend | `src/workers/` setup |
| Mon | Implement grid renderer worker | 2 | Frontend | `gridRenderer.worker.ts` |
| Tue | Create Canvas grid renderer | 8 | Frontend | `CanvasGridRenderer.tsx` |
| Wed | Add Canvas animation loop | 6 | Frontend | 60fps drag verified |
| Wed | Implement fallback mode | 2 | Frontend | DOM fallback working |
| Thu | Add panel virtualization | 6 | Frontend | `VirtualGrid.tsx` |
| Thu | Add Intersection Observer | 2 | Frontend | Visibility tracking |
| Fri | Implement LRU cache | 6 | Frontend | `lruCache.ts` |
| Fri | Add panel lifecycle | 2 | Frontend | Memory management |

#### Week 4: PWA & Bundle Optimization

| Day | Task | Hours | Owner | Deliverable |
|-----|------|-------|-------|-------------|
| Mon | Configure Service Worker | 6 | Frontend | `sw.ts` configured |
| Mon | Add PWA manifest | 2 | Frontend | `manifest.json` |
| Tue | Implement code splitting | 6 | Frontend | Hub-based lazy loading |
| Tue | Configure vendor chunks | 2 | Frontend | `vite.config.ts` updated |
| Wed | Optimize bundle analysis | 4 | Frontend | Bundle analyzer report |
| Wed | Add database indexes | 4 | Backend | Migration `006_performance_indexes.sql` |
| Thu | Implement response caching | 6 | Backend | API caching layer |
| Thu | Add compression | 2 | Backend | Gzip/Brotli middleware |
| Fri | Performance testing | 8 | QA | Benchmark suite |

**Phase 2 Deliverables:**
- [ ] Web Worker grid renderer
- [ ] Canvas-based drag operations (60fps)
- [ ] Panel virtualization system
- [ ] LRU panel eviction
- [ ] PWA with offline support
- [ ] Code splitting (<500KB initial)
- [ ] Database performance indexes
- [ ] API response caching
- [ ] Performance benchmark suite

### 4.4 Phase 3: Feature Integration (Weeks 5-8)

**Goal:** Integrate advanced features: Heroes, Lensing, Godot simulation

#### Week 5-6: Heroes & Lensing

| Day | Task | Hours | Owner | Deliverable |
|-----|------|-------|-------|-------------|
| Mon-Wed | Hero panel architecture | 16 | Frontend | `HeroPanel.tsx` |
| Thu-Fri | Lens system implementation | 16 | Frontend | `LensOverlay.tsx` |
| Mon-Wed | SATOR Square visualization | 16 | Frontend | D3.js layers |
| Thu-Fri | ML inference integration | 16 | Frontend | TensorFlow.js setup |

#### Week 7-8: Godot Integration

| Day | Task | Hours | Owner | Deliverable |
|-----|------|-------|-------|-------------|
| Mon-Tue | Godot export pipeline | 12 | Simulation | Export format defined |
| Wed-Thu | WebAssembly bridge | 16 | Simulation | `godot-bridge.ts` |
| Fri | Replay system | 8 | Simulation | Replay viewer |
| Mon-Tue | Simulation playback | 12 | Frontend | In-browser playback |
| Wed-Thu | Data partition firewall | 12 | Backend | Firewall verification |
| Fri | Integration testing | 8 | QA | End-to-end tests |

**Phase 3 Deliverables:**
- [ ] Hero panel system
- [ ] Lens overlay functionality
- [ ] 5-layer SATOR Square visualization
- [ ] ML prediction pipeline
- [ ] Godot export → web pipeline
- [ ] WebAssembly bridge
- [ ] Replay viewer
- [ ] Data partition firewall verified

### 4.5 Phase 4: Polish & Optimization (Weeks 9-12)

**Goal:** Production readiness with comprehensive testing and documentation

#### Week 9-10: Testing & Quality

| Day | Task | Hours | Owner | Deliverable |
|-----|------|-------|-------|-------------|
| Mon-Fri | Component test coverage | 40 | QA | >80% coverage |
| Mon-Fri | E2E test expansion | 40 | QA | 95+ E2E tests |
| Mon-Tue | Load testing | 16 | QA | k6/locust scenarios |
| Wed-Thu | Security audit | 16 | Security | Audit report |
| Fri | Penetration testing | 8 | Security | Pen test results |

#### Week 11-12: Documentation & Deployment

| Day | Task | Hours | Owner | Deliverable |
|-----|------|-------|-------|-------------|
| Mon-Tue | API documentation | 16 | Docs | Complete API docs |
| Wed-Thu | Architecture documentation | 16 | Docs | Updated diagrams |
| Fri | Deployment guide | 8 | Docs | Step-by-step guide |
| Mon | Production deployment | 8 | DevOps | Live production |
| Tue | Monitoring setup | 8 | DevOps | Dashboards, alerts |
| Wed | Runbook creation | 8 | DevOps | Incident response |
| Thu-Fri | Final testing | 16 | QA | Production verification |

**Phase 4 Deliverables:**
- [ ] >80% test coverage
- [ ] 95+ E2E tests passing
- [ ] Load test results
- [ ] Security audit passed
- [ ] Complete API documentation
- [ ] Updated architecture docs
- [ ] Production deployment
- [ ] Monitoring dashboards
- [ ] Incident runbooks

---

## 5. Component Remodeling Strategy

### 5.1 Frontend (React/Vite) Remodeling

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FRONTEND REMODELING STRATEGY                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Current State                    Target State                               │
│  ┌─────────────────────┐          ┌─────────────────────┐                   │
│  │ JavaScript (.jsx)   │   ───▶   │ TypeScript (.tsx)   │                   │
│  │ No type checking    │          │ Full type safety    │                   │
│  └─────────────────────┘          └─────────────────────┘                   │
│                                                                              │
│  ┌─────────────────────┐          ┌─────────────────────┐                   │
│  │ No testing          │   ───▶   │ Vitest + RTL        │                   │
│  │ Manual verification │          │ Automated testing   │                   │
│  └─────────────────────┘          └─────────────────────┘                   │
│                                                                              │
│  ┌─────────────────────┐          ┌─────────────────────┐                   │
│  │ ESLint missing      │   ───▶   │ ESLint + Prettier   │                   │
│  │ Style inconsistent  │          │ Consistent code     │                   │
│  └─────────────────────┘          └─────────────────────┘                   │
│                                                                              │
│  ┌─────────────────────┐          ┌─────────────────────┐                   │
│  │ Main thread render  │   ───▶   │ Web Workers + Canvas│                   │
│  │ ~40-50fps drag      │          │ 60fps guaranteed    │                   │
│  └─────────────────────┘          └─────────────────────┘                   │
│                                                                              │
│  ┌─────────────────────┐          ┌─────────────────────┐                   │
│  │ Monolithic bundle   │   ───▶   │ Code splitting      │                   │
│  │ 1.53MB uncompressed │          │ <500KB initial      │                   │
│  └─────────────────────┘          └─────────────────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Component Migration Plan

| Component | Current | Target | Effort | Phase |
|-----------|---------|--------|--------|-------|
| `DraggablePanel.jsx` | JS, inline styles | TS, styled | 4h | Phase 1 |
| `QuaternaryGrid.jsx` | JS, no tests | TS, tested | 6h | Phase 1 |
| `PanelSkeleton.jsx` | JS | TS | 2h | Phase 1 |
| `PanelErrorBoundary.jsx` | JS | TS | 2h | Phase 1 |
| `CanvasGridRenderer.jsx` | NEW | TS | 16h | Phase 2 |
| `VirtualGrid.jsx` | NEW | TS | 12h | Phase 2 |
| `HeroPanel.tsx` | NEW | TS | 16h | Phase 3 |
| `LensOverlay.tsx` | NEW | TS | 16h | Phase 3 |

### 5.2 Backend (FastAPI) Improvements

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     BACKEND IMPROVEMENT STRATEGY                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Database Layer                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Before:                                                            │  │
│  │    - Duplicate db.py files                                          │  │
│  │    - No connection pooling optimization                             │  │
│  │    - Missing performance indexes                                    │  │
│  │                                                                     │  │
│  │  After:                                                             │  │
│  │    - Single authoritative db.py                                     │  │
│  │    - Optimized connection pooling                                   │  │
│  │    - Strategic indexes for common queries                           │  │
│  │    - Cursor-based pagination                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  API Layer                                                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Before:                                                            │  │
│  │    - No response caching                                            │  │
│  │    - No compression                                                 │  │
│  │    - Limited rate limiting                                          │  │
│  │                                                                     │  │
│  │  After:                                                             │  │
│  │    - Multi-tier caching (Redis + in-memory)                         │  │
│  │    - Gzip + Brotli compression                                      │  │
│  │    - Comprehensive rate limiting                                    │  │
│  │    - Circuit breaker pattern                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Testing Layer                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Before:                                                            │  │
│  │    - Limited test coverage                                          │  │
│  │    - No integration tests                                           │  │
│  │                                                                     │  │
│  │  After:                                                             │  │
│  │    - >80% unit test coverage                                        │  │
│  │    - Full integration test suite                                    │  │
│  │    - Load testing with locust/k6                                    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Backend Improvements Table

| Area | Improvement | Implementation | Phase |
|------|-------------|----------------|-------|
| Database | Remove duplicates | Delete `db_implemented.py` | Phase 0 |
| Database | Add indexes | Migration `006_performance_indexes.sql` | Phase 2 |
| Database | Cursor pagination | `get_player_list_paginated()` | Phase 2 |
| API | Response caching | `cache.py` with TTL | Phase 2 |
| API | Compression | Gzip/Brotli middleware | Phase 2 |
| API | Rate limiting | `@rate_limit` decorator | Phase 1 |
| Testing | Unit coverage | pytest with fixtures | Phase 4 |
| Testing | Integration tests | `tests/integration/` | Phase 4 |
| Testing | Load tests | locustfile.py scenarios | Phase 4 |

### 5.3 Data Pipeline (Python) Optimizations

| Component | Current | Target | Phase |
|-----------|---------|--------|-------|
| ETL Pipeline | Working | Optimized with caching | Phase 2 |
| Pandascore Integration | Basic | Circuit breaker + retry | Phase 1 |
| Data Validation | Schema-based | Enhanced with checksums | Phase 1 |
| Staging Pipeline | Working | Automated cleanup | Phase 3 |

### 5.4 Godot Simulation Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GODOT INTEGRATION STRATEGY                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐        Export         ┌──────────────────┐           │
│  │  Godot 4 Editor  │  ──────────────────▶  │  Web Export      │           │
│  │                  │   (LiveSeasonModule)  │  (.wasm + .pck)  │           │
│  │  - Combat sim    │                       │                  │           │
│  │  - Duel resolver │                       │  Data Partition  │           │
│  │  - Economy sim   │                       │  Firewall        │           │
│  └──────────────────┘                       └────────┬─────────┘           │
│                                                      │                       │
│                              ┌───────────────────────┘                       │
│                              │                                               │
│                              ▼                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         Web Platform                                   │  │
│  │                                                                        │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │  │
│  │  │ WebAssembly     │  │ Replay System   │  │ Visualization   │       │  │
│  │  │ Bridge          │  │                 │  │ Layer           │       │  │
│  │  │                 │  │                 │  │                 │       │  │
│  │  │ godot-bridge.ts │  │ replay-store.ts │  │ canvas-grid.tsx │       │  │
│  │  │                 │  │                 │  │                 │       │  │
│  │  │ Handles:        │  │ Handles:        │  │ Handles:        │       │  │
│  │  │ - Sim init      │  │ - State history │  │ - Trail render  │       │  │
│  │  │ - Tick sync     │  │ - Playback      │  │ - Heatmaps      │       │  │
│  │  │ - Event bridge  │  │ - Export/import │  │ - SATOR events  │       │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘       │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Data Flow:                                                                  │
│  1. Godot sim runs → Exports via LiveSeasonModule                           │
│  2. Data Partition Firewall filters game-only fields                        │
│  3. Staged data stored in PostgreSQL                                        │
│  4. Web platform queries via API                                            │
│  5. WebAssembly bridge loads sim for replay                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Code Extraction Plan

### 6.1 What to Extract from Historical Commits

| Commit | File | Extraction Strategy | Destination |
|--------|------|---------------------|-------------|
| `b408ac3b` | Test infrastructure | Reuse patterns | `tests/` |
| `108b2171` | Documentation archive | Reference only | `docs/archive/` |
| `ce9cf77e` | Website features | Selective merge | `apps/website-v2/` |
| `9b36685c` | TENET features | Component extraction | `hub-5-tenet/` |
| `a93cf485` | RAR analytics | Full extraction | `hub-1-sator/` |

### 6.2 What to Rewrite vs. Reuse

#### Rewrite (New Implementation)

| Component | Reason | Effort |
|-----------|--------|--------|
| Grid system | Canvas-based replacement | 40h |
| Testing framework | No existing foundation | 16h |
| ESLint config | Must be custom | 4h |
| TypeScript types | Greenfield migration | 40h |
| Service Worker | New PWA requirement | 16h |

#### Reuse (With Modifications)

| Component | Modifications | Effort |
|-----------|---------------|--------|
| `DraggablePanel.jsx` | Add TypeScript, memoization | 4h |
| `PanelSkeleton.jsx` | TypeScript conversion | 2h |
| Database functions | Remove duplicates, add types | 4h |
| API routes | Add caching, rate limiting | 8h |
| Godot sim core | Web export integration | 24h |

### 6.3 Migration Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MIGRATION STRATEGY                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Phase 0-1: Foundation (No Breaking Changes)                                │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐         │  │
│  │   │   Add TS     │     │   Add Tests  │     │   Parallel   │         │  │
│  │   │   Config     │ ──▶ │   Framework  │ ──▶ │   Dev        │         │  │
│  │   └──────────────┘     └──────────────┘     └──────────────┘         │  │
│  │        │                      │                    │                 │  │
│  │        ▼                      ▼                    ▼                 │  │
│  │   .jsx + .tsx           Old + New tests      Both codebases          │  │
│  │   coexist               run together         functional              │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Phase 2-3: Integration (Gradual Cutover)                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐         │  │
│  │   │   Feature    │     │   A/B Test   │     │   Full       │         │  │
│  │   │   Flags      │ ──▶ │   Deploy     │ ──▶ │   Cutover    │         │  │
│  │   └──────────────┘     └──────────────┘     └──────────────┘         │  │
│  │        │                      │                    │                 │  │
│  │        ▼                      ▼                    ▼                 │  │
│  │   Old/New toggle        Validate metrics     Remove old code         │  │
│  │   per user              before commit        and deprecate           │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Phase 4: Finalization (Cleanup)                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐         │  │
│  │   │   Remove     │     │   Archive    │     │   Document   │         │  │
│  │   │   Legacy     │ ──▶ │   Old Code   │ ──▶ │   Final      │         │  │
│  │   └──────────────┘     └──────────────┘     └──────────────┘         │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Risk Management

### 7.1 Risk Register

| ID | Risk | Likelihood | Impact | Mitigation Strategy | Owner |
|----|------|------------|--------|---------------------|-------|
| R1 | TypeScript migration breaks build | High | High | Parallel development, gradual migration, feature flags | Frontend Lead |
| R2 | Web Worker browser incompatibility | Medium | High | Fallback to DOM rendering, feature detection | Frontend Lead |
| R3 | Canvas memory leaks | Medium | High | Automated memory testing, LRU eviction | QA Lead |
| R4 | Database migration downtime | Low | Critical | CONCURRENTLY indexes, blue-green deployment | Backend Lead |
| R5 | Godot WebAssembly performance | Medium | Medium | Performance budgets, fallback to video | Simulation Lead |
| R6 | Supabase data loss | Low | Critical | Immediate resume, backup verification, migration plan | DevOps Lead |
| R7 | Scope creep in Phase 3 | High | Medium | Strict milestone gates, change control board | Project Lead |
| R8 | Team availability | Medium | Medium | Cross-training, documentation, knowledge sharing | Project Lead |
| R9 | Third-party API changes | Low | High | Circuit breakers, caching layers, fallback data | Backend Lead |
| R10 | Security vulnerabilities | Medium | High | Security audit, dependency scanning, pen testing | Security Lead |

### 7.2 Risk Matrix

```
                    IMPACT
            Low    Medium    High    Critical
         ┌────────┬────────┬────────┬────────┐
    High │  R5    │  R3    │  R1    │        │
         │        │  R8    │  R7    │        │
         ├────────┼────────┼────────┼────────┤
Medium   │        │  R9    │  R2    │        │
LIKELIHOOD├────────┼────────┼────────┼────────┤
    Low  │        │        │  R10   │  R4    │
         │        │        │        │  R6    │
         └────────┴────────┴────────┴────────┘
```

### 7.3 Rollback Strategies

| Scenario | Rollback Strategy | Recovery Time |
|----------|-------------------|---------------|
| TypeScript build failure | Revert to JS, fix issues offline | 1 hour |
| Web Worker failure | Fallback to DOM mode automatically | Immediate |
| Database migration error | Restore from backup, retry | 2 hours |
| Production deployment failure | Blue-green rollback | 5 minutes |
| API performance regression | Enable caching, scale resources | 15 minutes |
| Godot integration failure | Disable feature, video fallback | 30 minutes |

### 7.4 Contingency Plans

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CONTINGENCY PLANS                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Contingency: TypeScript Migration Blocked                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Trigger: Build fails for >2 days                                     │  │
│  │  Action: Revert to JavaScript, use JSDoc for types                    │  │
│  │  Timeline: 1 week to revert, document decision                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Contingency: Web Worker Performance Issues                                 │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Trigger: <45fps on target devices                                    │  │
│  │  Action: Simplify Canvas, reduce panel count, optimize render loop    │  │
│  │  Timeline: 3 days optimization sprint                                 │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Contingency: Supabase Data Loss                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Trigger: Database unrecoverable                                      │  │
│  │  Action: Restore from latest backup, replay data pipeline             │  │
│  │  Timeline: 24-48 hours for full recovery                              │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Contingency: Godot Integration Delays                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Trigger: >1 week behind schedule                                     │  │
│  │  Action: Defer to Phase 5, focus on static visualizations             │  │
│  │  Timeline: Reschedule, update project plan                            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Resource Allocation

### 8.1 Effort Estimates by Phase

| Phase | Frontend | Backend | Simulation | QA | DevOps | Docs | Total |
|-------|----------|---------|------------|----|----|----|----|-------|
| Phase 0 | 24h | 4h | 0h | 4h | 4h | 4h | 40h |
| Phase 1 | 48h | 8h | 0h | 8h | 16h | 4h | 84h |
| Phase 2 | 64h | 12h | 0h | 16h | 8h | 4h | 104h |
| Phase 3 | 64h | 16h | 40h | 24h | 8h | 8h | 160h |
| Phase 4 | 32h | 24h | 16h | 80h | 24h | 32h | 208h |
| **Total** | **232h** | **64h** | **56h** | **132h** | **60h** | **52h** | **596h** |

### 8.2 Role Assignments

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     TEAM STRUCTURE                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Project Lead / Architect                                             │  │
│  │  Responsibilities: Overall coordination, architecture decisions       │  │
│  │  Allocation: 100% (12 weeks)                                          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│           ┌────────────────────────┼────────────────────────┐                │
│           │                        │                        │                │
│           ▼                        ▼                        ▼                │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │  Frontend Team  │    │  Backend Team   │    │  Simulation     │          │
│  │  (2 developers) │    │  (1 developer)  │    │  (1 developer)  │          │
│  │                 │    │                 │    │                 │          │
│  │  - React/TS     │    │  - FastAPI      │    │  - Godot        │          │
│  │  - Canvas/WebGL │    │  - PostgreSQL   │    │  - GDScript     │          │
│  │  - Testing      │    │  - Redis        │    │  - WASM         │          │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘          │
│           │                        │                        │                │
│           └────────────────────────┼────────────────────────┘                │
│                                    │                                         │
│           ┌────────────────────────┼────────────────────────┐                │
│           │                        │                        │                │
│           ▼                        ▼                        ▼                │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │  QA Engineer    │    │  DevOps         │    │  Technical      │          │
│  │  (1 engineer)   │    │  (0.5 resource) │    │  Writer         │          │
│  │                 │    │                 │    │  (0.5 resource) │          │
│  │  - E2E tests    │    │  - CI/CD        │    │  - Documentation│          │
│  │  - Performance  │    │  - Deployment   │    │  - Runbooks     │          │
│  │  - Load testing │    │  - Monitoring   │    │  - Guides       │          │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Phase Timeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     12-WEEK TIMELINE                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Week:  0    1    2    3    4    5    6    7    8    9    10   11   12     │
│         │    │    │    │    │    │    │    │    │    │    │    │    │      │
│  ┌──────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┐    │
│  │                                                                    │    │
│  │ Phase 0  ████                                                      │    │
│  │          Blocker Resolution                                        │    │
│  │                                                                    │    │
│  │ Phase 1       ████████                                             │    │
│  │               Foundation Stabilization                             │    │
│  │                                                                    │    │
│  │ Phase 2                    ████████                                │    │
│  │                          Performance Architecture                  │    │
│  │                                                                    │    │
│  │ Phase 3                                  ████████████████          │    │
│  │                                        Feature Integration         │    │
│  │                                                                    │    │
│  │ Phase 4                                                      ████████████│
│  │                                                            Polish & Opt │
│  │                                                                    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Milestones:                                                                 │
│  ▲ M0: Blockers resolved (Week 0)                                           │
│  ▲ M1: Type-safe codebase (Week 2)                                          │
│  ▲ M2: 60fps performance (Week 4)                                           │
│  ▲ M3: Feature complete (Week 8)                                            │
│  ▲ M4: Production ready (Week 12)                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.4 Budget Summary

| Category | Hours | Rate | Cost |
|----------|-------|------|------|
| Frontend Development | 232h | $100/h | $23,200 |
| Backend Development | 64h | $100/h | $6,400 |
| Simulation Development | 56h | $100/h | $5,600 |
| QA Engineering | 132h | $80/h | $10,560 |
| DevOps | 60h | $90/h | $5,400 |
| Technical Writing | 52h | $70/h | $3,640 |
| **Total** | **596h** | - | **$54,800** |

**Infrastructure Costs (12 weeks):**
- Vercel Pro: $20/month × 3 = $60
- Render Pro: $25/month × 3 = $75
- Supabase Pro: $25/month × 3 = $75
- Upstash Redis: $10/month × 3 = $30
- **Total Infrastructure:** ~$240

---

## Appendix A: Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 001.000 | 2026-03-22 | Architecture Team | Initial creation |

## Appendix B: Related Documents

- [Architecture Documentation v2](ARCHITECTURE_V2.md)
- [Master Changelog](CHANGELOG_MASTER.md)
- [COMPREHENSIVE_CRIT_REPORT](implementation/COMPREHENSIVE_CRIT_REPORT.md)
- [Repository Review](REPO_REVIEW_2026-03-17.md)
- [PHASE_2_COMPREHENSIVE_PLAN](implementation/PHASE_2_COMPREHENSIVE_PLAN.md)
- [Troubleshooting Guide](TROUBLESHOOTING_GUIDE.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| 4NJZ4 | The five-hub platform (SATOR, ROTAS, AREPO, OPERA, TENET) |
| SATOR | Analytics hub for player metrics and predictions |
| ROTAS | Simulation and visualization hub |
| AREPO | Data management and search hub |
| OPERA | Matches and live events hub |
| TENET | Central coordination hub |
| CRIT | Code Review and Integration Team |
| RAR | Role-Adjusted Rating (analytics metric) |
| LRU | Least Recently Used (cache eviction strategy) |
| PWA | Progressive Web Application |
| WASM | WebAssembly |

---

*End of Architectural Remodeling & Re-engineering Master Plan*

**Document Authority:** This document supersedes all previous phase planning documents and serves as the authoritative reference for the 4NJZ4 TENET Platform remodeling effort.
