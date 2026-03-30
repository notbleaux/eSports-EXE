[Ver001.000] [Part: 1/1, Phase: 1/5, Progress: 5%, Status: On-Going]

# COMPREHENSIVE CONSOLIDATION & HARDENING MASTER PLAN
## Repository Rationalization, Security Hardening & Production Readiness

**Date:** 2026-03-30  
**Status:** 🟡 PLANNING PHASE  
**Priority:** CRITICAL PATH FOR PRODUCTION  
**Estimated Duration:** 6-8 Weeks

---

## EXECUTIVE SUMMARY

This master plan addresses 9 critical areas for production readiness:

| # | Initiative | Status | Effort | Owner |
|---|------------|--------|--------|-------|
| 1 | Web App Consolidation | 🟡 Pending | 1 week | Frontend Lead |
| 2 | Keys App Security Audit | 🔴 Required | 2 weeks | Security Team |
| 3 | Architecture Documentation | 🟡 Pending | 3 days | Architect |
| 4 | Repository Hygiene | 🟡 Pending | 1 week | DevOps |
| 5 | Godot Extraction | 🟡 Pending | 2 weeks | Platform Lead |
| 6 | API Versioning Policy | 🟢 Draft Exists | 2 days | API Lead |
| 7 | Data Pipeline Hardening | 🟢 Partial | 3 days | Backend Lead |
| 8 | SATOR/ROTAS Lineage | 🟡 Pending | 2 days | Data Engineer |
| 9 | Simulation Validation | 🔴 Required | 3 weeks | QA Lead |

**CRITICAL PATH:** Items 2 (Security) → 5 (Extraction) → 9 (Validation) block production release.

---

## 1. WEB APPLICATION CONSOLIDATION

### Current State Analysis

```
apps/
├── browser-extension/     # Standalone - KEEP (separate distribution)
├── companion/            # ⚠️ EMPTY SHELL - MERGE or REMOVE
├── nexus/                # ⚠️ EMPTY SHELL - MERGE or REMOVE  
├── overlay/              # ⚠️ EMPTY SHELL - MERGE or REMOVE
├── VCT Valorant eSports/ # Standalone data project - KEEP
├── web/                  # ✅ MAIN APPLICATION - KEEP
└── wiki/                 # ⚠️ EMPTY SHELL - MERGE or REMOVE
```

### Consolidation Strategy

**Decision:** Deprecate empty shell apps, merge functionality into `apps/web/`

**Rationale:**
- `companion`, `nexus`, `overlay`, `wiki` have no meaningful implementation
- All are version 0.1.0 with empty descriptions
- Maintaining separate build pipelines creates overhead
- Main `web` app already has hub architecture for these features

### Implementation Plan

#### Phase 1: Audit & Extract (Days 1-2)

```bash
# 1. Check for any valuable code in shell apps
for app in companion nexus overlay wiki; do
  echo "=== Checking $app ==="
  find apps/$app -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec wc -l {} \; | sort -n | tail -5
done

# 2. Document any hooks/components worth preserving
```

#### Phase 2: Merge into Web App (Days 3-5)

**Target Architecture:**

```
apps/web/src/
├── hub-1-sator/          # Analytics & SimRating
├── hub-2-rotas/          # Simulation & Predictions
├── hub-3-arepo/          # Cross-reference & Player directory
├── hub-4-opera/          # Tournaments & Events
├── hub-5-tenet/          # Navigation & Central hub
├── hub-companion/        # NEW: Mobile companion features
├── hub-overlay/          # NEW: Stream overlay tools
├── hub-wiki/             # NEW: Documentation & guides
└── hub-nexus/            # NEW: Social/community features
```

**Migration Tasks:**
- [ ] Move any reusable components from shell apps to `apps/web/src/shared/`
- [ ] Create stub routes for `/companion`, `/overlay`, `/wiki`, `/nexus`
- [ ] Add feature flags to disable incomplete hubs
- [ ] Update pnpm-workspace.yaml to remove deprecated apps
- [ ] Archive shell app code to `archive/apps/`

#### Phase 3: Cleanup (Days 6-7)

```bash
# Remove from workspace
git rm -r apps/companion apps/nexus apps/overlay apps/wiki

# Update documentation
git add docs/CONSOLIDATION.md

# Verify build
pnpm install
pnpm run build
```

---

## 2. KEYS APP (TENET LAYER) SECURITY AUDIT

### Current State

The "Keys app" refers to the authentication layer in the TeXeT (TENET) hub:
- OAuth providers: Google, Discord, GitHub
- JWT token handling
- Push notification VAPID keys
- API key management

### Security Audit Checklist

#### Pre-Production Security Review Required

**🔴 CRITICAL - Must Complete Before Production Traffic**

| Check | Status | Owner |
|-------|--------|-------|
| OWASP Top 10 Assessment | ⬜ Pending | Security Team |
| JWT Secret Strength | ⬜ Pending | Backend Lead |
| OAuth State Validation | ✅ Implemented | - |
| Rate Limiting on Auth | ⬜ Pending | Backend Lead |
| Password Policy | ⬜ Pending | Backend Lead |
| 2FA Implementation | ✅ Implemented | - |
| Session Management | ⬜ Review | Security Team |
| SQL Injection Tests | ⬜ Pending | QA Team |
| XSS Prevention | ⬜ Review | Frontend Lead |
| CSRF Protection | ⬜ Review | Backend Lead |

### Third-Party Security Review

**Recommended Vendors:**
1. **Snyk** - Automated vulnerability scanning (Free tier available)
2. **GitGuardian** - Secret detection in commits
3. **OWASP ZAP** - Automated penetration testing
4. **Manual Review** - Hire security consultant for final sign-off

### Implementation

```yaml
# .github/workflows/security-audit.yml
name: Security Audit
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly
  push:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: Secret Detection
        uses: GitGuardian/ggshield-action@v1
        env:
          GITGUARDIAN_API_KEY: ${{ secrets.GITGUARDIAN_KEY }}
      
      - name: OWASP ZAP Scan
        uses: zaproxy/action-baseline@v0.12.0
        with:
          target: ${{ secrets.STAGING_URL }}
```

---

## 3. ARCHITECTURE DIAGRAM & DATA FLOW

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │   Web App    │ │ Browser Ext  │ │   Mobile     │ │   Wiki       │        │
│  │  (React/Vite)│ │  (Planned)   │ │  (Planned)   │ │  (Merged)    │        │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘        │
└─────────┼────────────────┼────────────────┼────────────────┼────────────────┘
          │                │                │                │
          └────────────────┴────────────────┴────────────────┘
                                   │
                         ┌─────────┴─────────┐
                         │   CDN/Vercel      │
                         │   Edge Network    │
                         └─────────┬─────────┘
                                   │
┌──────────────────────────────────┼────────────────────────────────────────────┐
│                             API GATEWAY                                        │
├──────────────────────────────────┼────────────────────────────────────────────┤
│  ┌───────────────────────────────┴───────────────────────────────────────┐   │
│  │                    FastAPI (Render.com)                                │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────────┐  │   │
│  │  │   /v1/*    │ │ /ws/*      │ │ /health    │ │ /admin/*           │  │   │
│  │  │  REST API  │ │ WebSocket  │ │  Checks    │ │ Admin Endpoints    │  │   │
│  │  └──────┬─────┘ └──────┬─────┘ └──────┬─────┘ └──────────┬─────────┘  │   │
│  └─────────┼──────────────┼──────────────┼────────────────┼────────────┘   │
└────────────┼──────────────┼──────────────┼────────────────┼──────────────────┘
             │              │              │                │
    ┌────────┴────────┐     │    ┌─────────┴──────────┐     │
    │  Rate Limiter   │     │    │  Circuit Breaker   │     │
    │  (SlowAPI)      │     │    │  (Custom)          │     │
    └────────┬────────┘     │    └─────────┬──────────┘     │
             │              │              │                │
┌────────────┼──────────────┼──────────────┼────────────────┼──────────────────┐
│         DATA LAYER                                                        │
├────────────┼──────────────┼──────────────┼────────────────┼──────────────────┤
│            │              │              │                │                  │
│  ┌─────────▼──────────┐   │   ┌──────────▼──────────┐     │                  │
│  │   PostgreSQL       │   │   │    Redis Cache      │     │                  │
│  │   (Supabase)       │   │   │    (Upstash)        │     │                  │
│  │                    │   │   │                     │     │                  │
│  │ • Players          │   │   │ • Session Store     │     │                  │
│  │ • Teams            │   │   │ • Rate Limiting     │     │                  │
│  │ • Matches          │   │   │ • Leaderboards      │     │                  │
│  │ • Stats            │   │   │ • WebSocket State   │     │                  │
│  └─────────┬──────────┘   │   └──────────┬──────────┘     │                  │
│            │              │              │                │                  │
│  ┌─────────┴──────────┐   │   ┌──────────┴──────────┐     │                  │
│  │   ML Model Store   │   │   │    S3/Storage       │     │                  │
│  │   (TensorFlow.js)  │   │   │    (Supabase)       │     │                  │
│  └────────────────────┘   │   └─────────────────────┘     │                  │
└───────────────────────────┼───────────────────────────────┼──────────────────┘
                            │                               │
┌───────────────────────────┼───────────────────────────────┼──────────────────┐
│                     EXTERNAL SERVICES                                      │
├───────────────────────────┼───────────────────────────────┼──────────────────┤
│                           │                               │                  │
│  ┌────────────────────────▼──────────┐  ┌─────────────────▼──────────────┐   │
│  │    Pandascore API                 │  │    GitHub/Discord/Google       │   │
│  │    (Official Esports Data)        │  │    OAuth Providers             │   │
│  │                                   │  │                                │   │
│  │ • Rate Limit: 1000/day            │  │ • JWT Token Exchange           │   │
│  │ • Circuit Breaker: ✅             │  │ • User Profile Sync            │   │
│  │ • Cache Layer: ✅                 │  │ • 2FA Support                  │   │
│  └───────────────────────────────────┘  └────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────┐  ┌────────────────────────────────┐   │
│  │    Godot Simulation (External)   │  │    Kaggle ML Training          │   │
│  │    (Future: npm package)         │  │    (Export Pipeline)           │   │
│  └──────────────────────────────────┘  └────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Implementation: Mermaid Diagram

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        Web[Web App<br/>React/Vite]
        Ext[Browser Ext<br/>Planned]
        Mobile[Mobile<br/>Planned]
    end
    
    subgraph Edge["Edge/CDN"]
        Vercel[Vercel Edge]
    end
    
    subgraph API["API Layer"]
        FastAPI[FastAPI<br/>Render.com]
        WS[WebSocket
        
 ## 6. API VERSIONING POLICY

### Version Strategy: URL Path Versioning

```
https://api.njzitegeist.com/v1/players
https://api.njzitegeist.com/v2/players  (future)
```

### Stability Guarantees

| Version | Status | Support Until | Breaking Changes |
|---------|--------|---------------|------------------|
| v1 | ✅ STABLE | 2027-03-30 | None without 6mo notice |
| v2 | ⬜ PLANNED | TBD | TBD |

### Deprecation Policy

1. **Deprecation Notice:** 6 months advance notice
2. **Sunset Period:** 3 months graceful degradation
3. **Header Warnings:** `Deprecation: true` in response headers
4. **Documentation:** Migration guide published

### Response Headers

```http
X-API-Version: v1
X-API-Deprecated: false
X-API-Sunset-Date: null
X-Request-ID: uuid-v4
```

---

## 7. DATA PIPELINE HARDENING

### Current Circuit Breaker Status

```python
# Already implemented in pandascore_client.py
@circuit_breaker(
    name="pandascore", 
    failure_threshold=5, 
    recovery_timeout=300,  # 5 minutes
    fallback=fallback_cached_data
)
```

### Enhancements Required

#### 1. Offline/Cache Behavior Documentation

```python
# packages/shared/api/docs/OFFLINE_BEHAVIOR.md
"""
## Offline Behavior Specification

### Pandascore API Unavailable
- **Detection:** Circuit breaker OPEN after 5 failures
- **Fallback:** Return cached data (Redis, TTL: 1hr)
- **User Experience:** Show "Live data temporarily unavailable" banner
- **Retry:** Automatic retry every 5 minutes

### Redis Cache Unavailable
- **Detection:** Connection timeout after 3 attempts
- **Fallback:** Direct database query (slower, higher load)
- **Alert:** PagerDuty notification to on-call

### Database Unavailable
- **Detection:** Connection pool exhausted
- **Fallback:** Return 503 Service Unavailable
- **Graceful Degradation:** Static placeholder pages
"""
```

#### 2. Circuit Breaker Dashboard

```python
# Health endpoint extension
@app.get("/health/circuits")
async def circuit_status():
    return {
        "pandascore": get_circuit_breaker("pandascore").get_status(),
        "riot_api": get_circuit_breaker("riot").get_status(),
        "redis": get_circuit_breaker("redis").get_status()
    }
```

---

## 8. SATOR/ROTAS DATA LINEAGE

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA SOURCES                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐      │
│  │  Pandascore API  │    │  User Inputs     │    │  Simulations     │      │
│  │  (Official Data) │    │  (Predictions)   │    │  (ROTAS Engine)  │      │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘      │
│           │                       │                       │                 │
│           │                       │                       │                 │
│           ▼                       ▼                       ▼                 │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │                     INGESTION LAYER                               │      │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │      │
│  │  │ ETL Pipeline │  │ WebSocket    │  │ Batch Import         │   │      │
│  │  │ (Python)     │  │ Real-time    │  │ (Admin API)          │   │      │
│  │  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │      │
│  └─────────┼────────────────┼─────────────────────┼───────────────┘      │
└────────────┼────────────────┼─────────────────────┼──────────────────────┘
             │                │                     │
             ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PROCESSING LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         SATOR ANALYTICS                              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │   │
│  │  │ Raw Stats  │→ │ SimRating  │→ │ Confidence │→ │ Ranking    │    │   │
│  │  │ Processing │  │ Engine     │  │ Scoring    │  │ Algorithm  │    │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         ROTAS SIMULATION                             │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │   │
│  │  │ Match      │→ │ Outcome    │→ │ Confidence │→ │ Prediction │    │   │
│  │  │ Simulation │  │ Modeling   │  │ Intervals  │  │ Engine     │    │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │  Player Profiles │  │  Leaderboards    │  │  Match Cards     │          │
│  │  (SATOR Hub)     │  │  (SATOR Hub)     │  │  (ROTAS Hub)     │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Dictionary

| Entity | Source | Transform | Destination | Owner |
|--------|--------|-----------|-------------|-------|
| Player Stats | Pandascore | SimRating v2 | PostgreSQL | SATOR |
| Match Results | Pandascore | Normalization | PostgreSQL | SATOR |
| Predictions | User Input | ROTAS Engine | PostgreSQL | ROTAS |
| Simulations | ROTAS Engine | Aggregation | PostgreSQL | ROTAS |
| Rankings | SATOR Engine | ML Model | Redis Cache | SATOR |

---

## 9. SIMULATION VALIDATION FRAMEWORK

---

## 10. CANONICAL ARCHITECTURE DOCUMENTATION ✅ COMPLETED

### Objective
Create a single, comprehensive, canonical system architecture document that consolidates all prior diagrams and serves as the authoritative source of truth.

### Deliverable
**Document:** `docs/architecture/CANONICAL_SYSTEM_ARCHITECTURE.md`

### Contents
1. **Executive Overview** - 5-layer architecture diagram
2. **Hub Architecture** - TeNeT Gateway System with 5 Hubs
3. **Data Networks (Geist)** - Network infrastructure mapping
4. **Simulation Ecosystem** - Axiomatic/Akziom/X-Sim/Engine relationship
5. **Service Extensions** - NJZine, NJZyxView, NJZ10, NJZoNeT
6. **Technology Stack Mapping** - Repository structure + tech by layer
7. **Authentication Flow** - TeXeT Keys App sequence diagram
8. **Data Flows** - SATOR & ROTAS pipelines
9. **Circuit Breaker Architecture** - State machine + configuration
10. **Deployment Architecture** - Dev/Staging/Prod mapping
11. **API Versioning** - v1 endpoints + policy
12. **Security Architecture** - Defense in depth
13. **Monitoring & Observability** - Metrics + alerting
14. **Glossary** - Terms and definitions
15. **Document Control** - Version history

### Key Consolidations from Reference Diagrams

| Original Diagram | Consolidated Into | Status |
|-----------------|-------------------|--------|
| NJZ Platform Architecture (3-diagram set) | Section 2, 3, 4, 5 | ✅ Merged |
| Data Networks & Service Extensions | Section 3, 5 | ✅ Updated |
| Simulation Ecosystem | Section 4 | ✅ Refined |

### Document Principles
- ✅ **Single Source of Truth** - One canonical document
- ✅ **Mermaid Diagrams** - Text-based, version-controlled
- ✅ **Technology-Mapped** - Real implementations, not aspirational
- ✅ **Status-Tracked** - Current vs. planned clearly marked
- ✅ **Glossary-Linked** - TENET terminology defined

### Status
**✅ COMPLETE** - Document created and integrated into canonical truths

---

## 9. SIMULATION VALIDATION FRAMEWORK

### Testing Pyramid for Godot Simulation

```
                    ┌──────────────────┐
                    │  E2E Validation  │  ← VCT Match Benchmarks
                    │  (Production)    │
                    └────────┬─────────┘
                             │
                ┌────────────┴────────────┐
                │   Integration Tests     │  ← API Contract Tests
                │   (Staging)             │
                └────────────┬────────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │           Unit Tests                    │  ← Godot GUT
        │     (Local Development)                 │
        └─────────────────────────────────────────┘
```

### Validation Test Suite Structure

```
tests/simulation/
├── unit/                          # Godot GUT Tests
│   ├── test_combat_mechanics.gd
│   ├── test_economy_simulation.gd
│   ├── test_clutch_scenarios.gd
│   └── test_determinism.gd
│
├── integration/                   # API Contract Tests
│   ├── test_simulation_api.py
│   ├── test_prediction_accuracy.py
│   └── test_data_consistency.py
│
├── benchmark/                     # VCT Match Validation
│   ├── vct_2024_champions.json    # Historical matches
│   ├── vct_2025_masters.json
│   ├── validate_predictions.py
│   └── generate_report.py
│
└── fixtures/                      # Test Data
    ├── team_compositions/
    ├── map_scenarios/
    └── economy_states/
```

### Professional Publishing Standards

#### 1. Determinism Tests

```gdscript
# platform/simulation-game/tests/test_determinism.gd
extends GutTest

func test_replay_determinism():
    var seed = 12345
    var match_config = create_match_config(seed)
    
    # Run simulation twice with same seed
    var result1 = SimulationEngine.run(match_config)
    var result2 = SimulationEngine.run(match_config)
    
    # Must produce identical results
    assert_eq(result1.score, result2.score)
    assert_eq(result1.rounds.size(), result2.rounds.size())
    assert_eq_deep(result1.events, result2.events)
```

#### 2. Benchmark Test: VCT Match Validation

```python
# tests/simulation/benchmark/validate_predictions.py
"""
Validate ROTAS predictions against actual VCT match outcomes.
Target: >65% accuracy for match winners, >55% for exact scores.
"""

import json
import pytest
from typing import List, Dict

class VCTBenchmark:
    """Benchmark test suite for VCT match prediction accuracy."""
    
    ACCURACY_THRESHOLD_MATCH_WINNER = 0.65
    ACCURACY_THRESHOLD_EXACT_SCORE = 0.55
    
    def load_vct_matches(self, tournament: str) -> List[Dict]:
        with open(f"fixtures/{tournament}.json") as f:
            return json.load(f)
    
    def run_prediction(self, match: Dict) -> Dict:
        """Call ROTAS simulation API to get prediction."""
        # API call to /v1/rotas/predict
        pass
    
    @pytest.mark.benchmark
    def test_vct_2024_champions_accuracy(self):
        matches = self.load_vct_matches("vct_2024_champions")
        correct_winners = 0
        correct_scores = 0
        
        for match in matches:
            prediction = self.run_prediction(match)
            
            if prediction["winner"] == match["actual_winner"]:
                correct_winners += 1
            
            if prediction["score"] == match["actual_score"]:
                correct_scores += 1
        
        winner_accuracy = correct_winners / len(matches)
        score_accuracy = correct_scores / len(matches)
        
        assert winner_accuracy >= self.ACCURACY_THRESHOLD_MATCH_WINNER, \
            f"Match winner accuracy {winner_accuracy:.2%} below threshold"
        
        assert score_accuracy >= self.ACCURACY_THRESHOLD_EXACT_SCORE, \
            f"Exact score accuracy {score_accuracy:.2%} below threshold"
```

#### 3. X-ePlayer Emulation Testing

```python
# tests/simulation/test_xeplayer_emulation.py
"""
Test X-ePlayer emulation feature that creates AI opponents
based on user match history and statistics.
"""

class TestXEPlayerEmulation:
    """Test suite for X-ePlayer emulation with user consent."""
    
    def test_emulation_with_consent(self):
        """User has opted in to X-ePlayer emulation."""
        user_profile = {
            "consent_xeplayer": True,
            "match_history": [...],
            "stats": {...}
        }
        
        emulation = XEPlayerEmulator.create(user_profile)
        
        # Validate emulation matches user playstyle
        assert emulation.playstyle_matches(user_profile["stats"])
        assert emulation.decision_tree.depth > 0
    
    def test_emulation_without_consent(self):
        """User has NOT opted in - should use generic AI."""
        user_profile = {
            "consent_xeplayer": False,
            "match_history": [...],
            "stats": {...}
        }
        
        emulation = XEPlayerEmulator.create(user_profile)
        
        # Should use generic bot behavior
        assert emulation.is_generic_bot()
```

### CI/CD Integration

```yaml
# .github/workflows/simulation-validation.yml
name: Simulation Validation
on:
  push:
    paths:
      - 'platform/simulation-game/**'
      - 'packages/shared/api/src/rotas/**'
  schedule:
    - cron: '0 0 * * 0'  # Weekly full benchmark

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Godot
        uses: chickensoft-games/setup-godot@v1
        with:
          version: 4.2.1
      - name: Run GUT Tests
        run: |
          godot --headless --script addons/gut/gut_cmdln.gd
  
  benchmark:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - name: Run VCT Benchmark
        run: |
          pytest tests/simulation/benchmark/ -v --tb=short
      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: benchmark-report
          path: reports/benchmark.html
```

---

## IMPLEMENTATION TIMELINE

### Phase 1: Critical Path (Weeks 1-2)
- [ ] Security audit initiation
- [ ] Godot extraction planning
- [ ] Web app consolidation

### Phase 2: Hardening (Weeks 3-4)
- [ ] Repository hygiene improvements
- [ ] API versioning documentation
- [ ] Data pipeline hardening

### Phase 3: Validation (Weeks 5-6)
- [ ] Simulation validation framework
- [ ] VCT benchmark tests
- [ ] Architecture diagrams published

### Phase 4: Production Prep (Weeks 7-8)
- [ ] Security audit remediation
- [ ] Final integration testing
- [ ] Production deployment

---

## SUCCESS CRITERIA

- [ ] All web apps consolidated into `apps/web/`
- [ ] Security audit passed with no CRITICAL issues
- [ ] CI badges showing >80% coverage
- [ ] Godot simulation in separate repo with npm package
- [ ] API versioning policy published
- [ ] Circuit breakers active on all external APIs
- [ ] Data lineage diagram in documentation
- [ ] Simulation validation >65% accuracy on VCT matches

---

*End of Consolidation & Hardening Master Plan*
