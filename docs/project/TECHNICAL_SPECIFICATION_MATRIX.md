[Ver011.000]

# Technical Specification Matrix — Esports Analytics Project

**Generated:** March 4, 2026  
**Project:** SATOR / Axiom Esports Data Platform  
**Coverage:** CS:GO, Valorant (VLR.gg), Analytics Engine

---

## Matrix Legend

| Status | Meaning |
|--------|---------|
| ✅ DEFINED | Specification documented and implemented |
| ⚠️ PARTIAL | Specification exists but incomplete/stubbed |
| 🔶 PLANNED | Documented but not yet implemented |
| ❌ MISSING | Not found in documentation |

| Priority | Meaning |
|----------|---------|
| P0 | Critical — blocks release |
| P1 | High — required for MVP |
| P2 | Medium — enhances functionality |
| P3 | Low — nice to have |

---

## 1. CS:GO Data Collection Protocols and Methodologies

| Requirement | Source File | Status | Priority |
|-------------|-------------|--------|----------|
| HLTV.org as primary CS2 data source | `esports_data_sources_report.md` | ✅ DEFINED | P0 |
| Unofficial mobile API discovery via traffic analysis | `esports_data_sources_report.md` | ✅ DEFINED | P0 |
| TLS fingerprint emulation (curl_cffi) to avoid 403 errors | `esports_data_sources_report.md` | ✅ DEFINED | P1 |
| robots.txt compliance — 1 req/sec max rate limit | `esports_data_sources_report.md` | ✅ DEFINED | P0 |
| Query-parameterized URLs blocked per robots.txt | `esports_data_sources_report.md` | ✅ DEFINED | P0 |
| Steam Web API for player counts (App ID 730) | `esports_data_sources_report.md` | ✅ DEFINED | P2 |
| GRID Open Access integration for official CS:GO data | `esports_data_sources_report.md` | ✅ DEFINED | P1 |
| Kaggle datasets for historical CS2 match statistics | `esports_data_sources_report.md` | ✅ DEFINED | P2 |
| Python hltv-async-api library support | `esports_data_sources_report.md` | ✅ DEFINED | P2 |
| BeautifulSoup + requests fallback scraping | `esports_data_sources_report.md` | ✅ DEFINED | P2 |
| Steam API key rotation protocol | `esports_data_sources_report.md` | 🔶 PLANNED | P2 |
| Correlation target r > 0.85 vs HLTV baseline | `validation_crossref.py` | ✅ DEFINED | P0 |
| CS2 baseline correlation r = 0.874 documented | `validation_crossref.py` | ✅ DEFINED | P0 |
| Cross-reference vs Liquipedia for validation | `validation_crossref.py` | ⚠️ PARTIAL | P1 |

---

## 2. VLR (Valorant) Data Extraction Plans

| Requirement | Source File | Status | Priority |
|-------------|-------------|--------|----------|
| VLR.gg as primary Valorant data source | `vlr_resilient_client.py` | ✅ DEFINED | P0 |
| Ethical scraping with declared User-Agent | `vlr_resilient_client.py` | ✅ DEFINED | P0 |
| Circuit breaker pattern (5 failures → 5min pause) | `vlr_resilient_client.py` | ✅ DEFINED | P0 |
| Rate limit: 2.0 seconds base between requests | `vlr_resilient_client.py` | ✅ DEFINED | P0 |
| Exponential backoff on 429: 2s → 4s → 8s → 16s | `EXTRACTION_EPOCHS.md` | ✅ DEFINED | P0 |
| Max concurrent requests: Semaphore(3) | `vlr_resilient_client.py` | ✅ DEFINED | P1 |
| SHA-256 content checksums for integrity | `vlr_resilient_client.py` | ✅ DEFINED | P0 |
| Schema drift detection vs EXPECTED_SCHEMA_FIELDS | `vlr_resilient_client.py` | ✅ DEFINED | P0 |
| 18-field VLR schema validation | `vlr_resilient_client.py` | ✅ DEFINED | P0 |
| Cache fallback when circuit breaker OPEN | `vlr_resilient_client.py` | ✅ DEFINED | P1 |
| User-Agent rotation (2 ethical bots) | `vlr_resilient_client.py` | ✅ DEFINED | P1 |
| 37-field KCRITR data model | `agent-data.agent.md` | ✅ DEFINED | P0 |
| Epoch-based extraction (I/II/III) | `EXTRACTION_EPOCHS.md` | ✅ DEFINED | P0 |
| Epoch I: 2020-12-03 → 2022-12-31 (~47,160 records) | `EXTRACTION_EPOCHS.md` | ✅ DEFINED | P0 |
| Epoch II: 2023-01-01 → 2025-12-31 (~135,720 records) | `EXTRACTION_EPOCHS.md` | ✅ DEFINED | P0 |
| Epoch III: 2026-01-01 → present (delta only) | `EXTRACTION_EPOCHS.md` | ✅ DEFINED | P0 |
| Delta mode: ~90% reduction in VLR requests | `EXTRACTION_EPOCHS.md` | ✅ DEFINED | P1 |
| Full mode for schema migration/recovery | `EXTRACTION_EPOCHS.md` | ✅ DEFINED | P2 |
| Riot Games API integration (official) | `esports_data_sources_report.md` | ✅ DEFINED | P1 |
| HenrikDev API wrapper for Valorant match history | `esports_data_sources_report.md` | ✅ DEFINED | P1 |
| Rate limits: 20 req/sec, 100 req/2min (Personal key) | `esports_data_sources_report.md` | ✅ DEFINED | P0 |
| Three-tier API keys (Development/Personal/Production) | `esports_data_sources_report.md` | ✅ DEFINED | P1 |
| VLR.gg robots.txt compliance verification | `esports_data_sources_report.md` | ✅ DEFINED | P0 |

---

## 3. RAR Formula Specifications and Calculations

| Requirement | Source File | Status | Priority |
|-------------|-------------|--------|----------|
| RAR = Role-Adjusted Rating above Replacement | `agent-analytics.agent.md` | ✅ DEFINED | P0 |
| RAR Decomposer computes rar_score and investment_grade | `test_rar.py` | ✅ DEFINED | P0 |
| rar_score always positive when raw_rating positive | `test_rar.py` | ✅ DEFINED | P0 |
| Investment grades: A+, A, B, C, D | `test_rar.py` | ✅ DEFINED | P0 |
| Grade A+: rar_score >= 1.30 | `test_rar.py` | ✅ DEFINED | P0 |
| Grade A: 1.15 <= rar_score < 1.30 | `test_rar.py` | ✅ DEFINED | P0 |
| Grade B: 1.00 <= rar_score < 1.15 | `test_rar.py` | ✅ DEFINED | P0 |
| Grade C: 0.85 <= rar_score < 1.00 | `test_rar.py` | ✅ DEFINED | P0 |
| Grade D: rar_score < 0.85 | `test_rar.py` | ✅ DEFINED | P0 |
| Entry Fragger replacement level: 1.15 | `agent-analytics.agent.md` | ✅ DEFINED | P0 |
| IGL replacement level: 0.95 | `agent-analytics.agent.md` | ✅ DEFINED | P0 |
| Controller replacement level: 1.00 | `agent-analytics.agent.md` | ✅ DEFINED | P0 |
| Initiator replacement level: 1.05 | `agent-analytics.agent.md` | ✅ DEFINED | P0 |
| Sentinel replacement level: 0.98 | `agent-analytics.agent.md` | ✅ DEFINED | P0 |
| Unknown role defaults to 1.00 replacement level | `test_rar.py` | ✅ DEFINED | P0 |
| Replacement mean within range (0.9, 1.1) | `test_rar.py` | ✅ DEFINED | P0 |
| investment_grade matches _grade(rar_score) | `test_rar.py` | ✅ DEFINED | P0 |
| All roles return positive replacement levels | `test_rar.py` | ✅ DEFINED | P0 |
| Entry replacement > Controller replacement | `test_rar.py` | ✅ DEFINED | P0 |
| IGL replacement < Controller replacement | `test_rar.py` | ✅ DEFINED | P0 |

---

## 4. AI Agent Instructions for Data Processing

| Requirement | Source File | Status | Priority |
|-------------|-------------|--------|----------|
| Agent: Data Pipeline Specialist role definition | `agent-data.agent.md` | ✅ DEFINED | P0 |
| Agent: Analytics & Overfitting Specialist role | `agent-analytics.agent.md` | ✅ DEFINED | P0 |
| Raw extractions are IMMUTABLE — never modify after write | `agent-data.agent.md` | ✅ DEFINED | P0 |
| SHA-256 verification required before analytics processing | `agent-data.agent.md` | ✅ DEFINED | P0 |
| VLR_RATE_LIMIT: 2.0s base, exponential backoff on 429 | `agent-data.agent.md` | ✅ DEFINED | P0 |
| separation_flag = 1 enforced at application level | `agent-data.agent.md` | ✅ DEFINED | P0 |
| Delta extraction preferred — only re-scrape new/modified | `agent-data.agent.md` | ✅ DEFINED | P1 |
| 37-field KCRITR schema reference documented | `agent-data.agent.md` | ✅ DEFINED | P0 |
| Training data MUST predate 2024-01-01 (temporal wall) | `agent-analytics.agent.md` | ✅ DEFINED | P0 |
| Min 50 maps per player for training inclusion | `agent-analytics.agent.md` | ✅ DEFINED | P0 |
| Max 200 maps ceiling — downsample elites | `agent-analytics.agent.md` | ✅ DEFINED | P0 |
| Tests use statistical ranges ONLY (no exact values) | `agent-analytics.agent.md` | ✅ DEFINED | P0 |
| No .pkl or .joblib model files committed | `agent-analytics.agent.md` | ✅ DEFINED | P0 |
| Role assignment uses holdout ground_truth_roles.csv | `agent-analytics.agent.md` | ✅ DEFINED | P0 |
| Always use adjusted_kill_value — never raw ACS | `agent-analytics.agent.md` | ✅ DEFINED | P0 |
| SimRating formula documented | `agent-analytics.agent.md` | ✅ DEFINED | P0 |
| Staging service mandatory for all data ingestion | `AGENT_DATA_PROCESS.md` | ✅ DEFINED | P0 |
| Firewall compliance required for web-bound data | `AGENT_DATA_PROCESS.md` | ✅ DEFINED | P0 |
| GAME_ONLY_FIELDS must be stripped for web export | `AGENT_DATA_PROCESS.md` | ✅ DEFINED | P0 |
| Checksum verification mandatory for all payloads | `AGENT_DATA_PROCESS.md` | ✅ DEFINED | P0 |
| Audit logging non-negotiable — all operations traceable | `AGENT_DATA_PROCESS.md` | ✅ DEFINED | P0 |
| Raw data immutability enforced by DB trigger | `AGENT_DATA_PROCESS.md` | ✅ DEFINED | P0 |
| ingest_service.py is single entry point | `AGENT_DATA_PROCESS.md` | ✅ DEFINED | P0 |

---

## 5. Validation Report Findings (Iteration 3.3)

| Requirement | Source File | Status | Priority |
|-------------|-------------|--------|----------|
| Confidence tiers: 0-100 scale | `CONFIDENCE_TIERS.md` | ✅ DEFINED | P0 |
| Tier 100: Direct extraction, verified (training weight 1.0) | `CONFIDENCE_TIERS.md` | ✅ DEFINED | P0 |
| Tier 75: Single source, verified (training weight 0.75) | `CONFIDENCE_TIERS.md` | ✅ DEFINED | P0 |
| Tier 50: Partially reconstructed (training weight 0.50) | `CONFIDENCE_TIERS.md` | ✅ DEFINED | P0 |
| Tier 25: Primarily reconstructed (training weight 0.25) | `CONFIDENCE_TIERS.md` | ✅ DEFINED | P0 |
| Tier 0: Unknown/excluded (training weight 0.0) | `CONFIDENCE_TIERS.md` | ✅ DEFINED | P0 |
| separation_flag = 0 for Tier 100/75 (raw) | `CONFIDENCE_TIERS.md` | ✅ DEFINED | P0 |
| separation_flag = 1 for Tier 50/25 (reconstructed) | `CONFIDENCE_TIERS.md` | ✅ DEFINED | P0 |
| Tier 0 records excluded from player_performance | `CONFIDENCE_TIERS.md` | ✅ DEFINED | P0 |
| Cross-reference validation target: r > 0.85 | `validation_crossref.py` | ✅ DEFINED | P0 |
| Pearson correlation coefficient computation | `validation_crossref.py` | ✅ DEFINED | P0 |
| Correlation target assertion with detailed error | `validation_crossref.py` | ✅ DEFINED | P0 |
| HLTV baseline r = 0.874 documented | `validation_crossref.py` | ✅ DEFINED | P0 |
| Liquipedia cross-reference stubbed | `validation_crossref.py` | ⚠️ PARTIAL | P1 |
| Schema validation tests | `extraction/tests/test_schema_validation.py` | ✅ DEFINED | P0 |
| Integrity checker tests | `extraction/tests/test_integrity_checker.py` | ✅ DEFINED | P0 |
| Pipeline integration tests | `extraction/tests/test_pipeline_integration.py` | ✅ DEFINED | P0 |
| Epoch harvester tests | `extraction/tests/test_epoch_harvester.py` | ✅ DEFINED | P0 |
| Rate limiting tests | `extraction/tests/test_rate_limiting.py` | ✅ DEFINED | P0 |
| Canonical ID tests | `extraction/tests/test_canonical_id.py` | ✅ DEFINED | P0 |
| Extraction bridge tests | `extraction/tests/test_extraction_bridge.py` | ✅ DEFINED | P0 |

---

## 6. Integrated Summary Technical Requirements

| Requirement | Source File | Status | Priority |
|-------------|-------------|--------|----------|
| **Data Architecture** ||||
| Dual-storage protocol (raw vs reconstructed) | `agent-data.agent.md` | ✅ DEFINED | P0 |
| 37-field KCRITR schema | `agent-data.agent.md` | ✅ DEFINED | P0 |
| Parquet / columnar storage | `agent-data.agent.md` | ✅ DEFINED | P1 |
| PostgreSQL / TimescaleDB schema | `agent-data.agent.md` | ✅ DEFINED | P0 |
| SHA-256 data integrity verification | `agent-data.agent.md` | ✅ DEFINED | P0 |
| **Analytics Engine** ||||
| SimRating = 0.20 * (kills + deaths_inv + acs + adr + kast) | `agent-analytics.agent.md` | ✅ DEFINED | P0 |
| Z-score normalization by season/role cohort | `agent-analytics.agent.md` | ✅ DEFINED | P0 |
| Temporal train/test split (pre/post 2024-01-01) | `temporal_wall.py` | ✅ DEFINED | P0 |
| Adversarial validation (AUC > 0.55 = leakage) | `overfitting_guard.py` | ✅ DEFINED | P0 |
| RandomForest classifier for distribution detection | `overfitting_guard.py` | ✅ DEFINED | P0 |
| Age curve modeling for esports careers | `agent-analytics.agent.md` | 🔶 PLANNED | P2 |
| **Overfitting Prevention** ||||
| Training data must predate 2024-01-01 | `temporal_wall.py` | ✅ DEFINED | P0 |
| Min 50 maps floor per player | `overfitting_guard.py` | ✅ DEFINED | P0 |
| Max 200 maps ceiling (elite downsample) | `overfitting_guard.py` | ✅ DEFINED | P0 |
| Temporal decay weighting for elite players | `overfitting_guard.py` | ✅ DEFINED | P0 |
| No match_id overlap between train/test | `temporal_wall.py` | ✅ DEFINED | P0 |
| **Visualization (SATOR Square)** ||||
| 5-layer palindromic visualization system | `SATOR_ARCHITECTURE.md` | ✅ DEFINED | P1 |
| Layer 1: SATOR — Golden Halo System (D3.js SVG) | `SATOR_ARCHITECTURE.md` | ✅ DEFINED | P1 |
| Layer 2: OPERA — Fog of War (WebGL) | `SATOR_ARCHITECTURE.md` | ✅ DEFINED | P1 |
| Layer 3: TENET — Area Control Grading (D3.js) | `SATOR_ARCHITECTURE.md` | ✅ DEFINED | P1 |
| Layer 4: AREPO — Death Stains (D3.js SVG) | `SATOR_ARCHITECTURE.md` | ✅ DEFINED | P1 |
| Layer 5: ROTAS — Rotation Trails (WebGL) | `SATOR_ARCHITECTURE.md` | ✅ DEFINED | P1 |
| **API Layer** ||||
| GET /api/players/{player_id} endpoint | `API_REFERENCE.md` | ✅ DEFINED | P0 |
| GET /api/analytics/simrating/{player_id} endpoint | `API_REFERENCE.md` | ✅ DEFINED | P0 |
| GET /api/analytics/rar/{player_id} endpoint | `API_REFERENCE.md` | ✅ DEFINED | P0 |
| GET /api/analytics/investment/{player_id} endpoint | `API_REFERENCE.md` | ✅ DEFINED | P0 |
| SATOR spatial data endpoints | `API_REFERENCE.md` | ✅ DEFINED | P1 |
| **Staging System** ||||
| staging_ingest_queue table | `AGENT_DATA_PROCESS.md` | ✅ DEFINED | P0 |
| game_data_store table | `AGENT_DATA_PROCESS.md` | ✅ DEFINED | P0 |
| web_data_store table | `AGENT_DATA_PROCESS.md` | ✅ DEFINED | P0 |
| staging_export_log table | `AGENT_DATA_PROCESS.md` | ✅ DEFINED | P0 |
| staging_health_status table | `AGENT_DATA_PROCESS.md` | ✅ DEFINED | P0 |
| **Data Firewall** ||||
| internalAgentState — GAME ONLY | `AGENT_DATA_PROCESS.md` | ✅ DEFINED | P0 |
| radarData — GAME ONLY | `AGENT_DATA_PROCESS.md` | ✅ DEFINED | P0 |
| detailedReplayFrameData — GAME ONLY | `AGENT_DATA_PROCESS.md` | ✅ DEFINED | P0 |
| simulationTick — GAME ONLY | `AGENT_DATA_PROCESS.md` | ✅ DEFINED | P0 |
| seedValue — GAME ONLY | `AGENT_DATA_PROCESS.md` | ✅ DEFINED | P0 |
| visionConeData — GAME ONLY | `AGENT_DATA_PROCESS.md` | ✅ DEFINED | P0 |
| smokeTickData — GAME ONLY | `AGENT_DATA_PROCESS.md` | ✅ DEFINED | P0 |
| recoilPattern — GAME ONLY | `AGENT_DATA_PROCESS.md` | ✅ DEFINED | P0 |

---

## Summary Statistics

| Category | Total Items | Defined | Partial | Planned | Missing |
|----------|-------------|---------|---------|---------|---------|
| CS:GO Data Collection | 13 | 11 | 1 | 1 | 0 |
| VLR Data Extraction | 24 | 23 | 0 | 1 | 0 |
| RAR Formula Specs | 18 | 18 | 0 | 0 | 0 |
| AI Agent Instructions | 24 | 24 | 0 | 0 | 0 |
| Validation Findings | 18 | 16 | 2 | 0 | 0 |
| Integrated Requirements | 42 | 40 | 0 | 2 | 0 |
| **TOTAL** | **139** | **132 (95%)** | **3 (2%)** | **4 (3%)** | **0** |

---

## Key Gaps Identified

1. **Liquipedia Integration** (`validation_crossref.py`) — Cross-reference validation stubbed but requires API credentials for full implementation (Status: PARTIAL, Priority: P1)

2. **Age Curve Modeling** — Documented in agent instructions but marked as planned feature in analytics layer (Status: PLANNED, Priority: P2)

3. **Steam API Key Rotation** — Mentioned as protocol but not fully implemented (Status: PLANNED, Priority: P2)

4. **HLTV CS2 Baseline** — Baseline documented but full integration requires HLTV access (Status: PARTIAL, Priority: P1)

---

## Document Sources

| File | Purpose |
|------|---------|
| `esports_data_sources_report.md` | Free data source research (HLTV, Riot, Steam, GRID, Kaggle) |
| `vlr_resilient_client.py` | VLR.gg ethical scraping client |
| `EXTRACTION_EPOCHS.md` | Epoch I/II/III temporal coverage and harvester architecture |
| `CONFIDENCE_TIERS.md` | Data confidence tier definitions (0-100) |
| `test_rar.py` | RAR formula test specifications |
| `agent-data.agent.md` | Data Pipeline Specialist agent instructions |
| `agent-analytics.agent.md` | Analytics & Overfitting Specialist agent instructions |
| `AGENT_DATA_PROCESS.md` | SATOR staging system data process guide |
| `validation_crossref.py` | Cross-reference validation logic |
| `temporal_wall.py` | Temporal train/test split enforcement |
| `overfitting_guard.py` | Adversarial validation for overfitting detection |
| `calculator.py` | SimRating calculation formula |
| `SATOR_ARCHITECTURE.md` | 5-layer visualization system specification |
| `API_REFERENCE.md` | REST endpoint documentation |

---

*End of Technical Specification Matrix*
