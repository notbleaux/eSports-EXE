[Ver023.000]

# SATOR-eXe-ROTAS — Capabilities Assessment

**Assessment Date:** 2026-03-04  
**Assessor:** Kimi Claw  
**Project Phase:** Early concept/prototype

---

## Executive Summary

This project has 6 interconnected components with varying levels of AI assistance possible. I can directly support architecture planning, research, data pipeline design, automation scripting, and documentation. **Code generation for full-stack applications and game development requires your decisions on tech stacks first.** I can create specialized skills to accelerate recurring workflows.

---

## Component-by-Component Capability Matrix

### 1. RAWS — Statistical Reference Website

| Task | Can Fulfill? | Notes |
|------|--------------|-------|
| Research sports stats sites (Pro-Football-Reference, PFF, etc.) | ✅ YES | Web search + fetch for analysis |
| Document database schema design | ✅ YES | Can create reference docs, SQL schemas |
| Design twin-table parity system | ✅ YES | Architecture planning, pseudocode, algorithms |
| Build static site generator | ⚠️ PARTIAL | Need your stack choice (Next.js? Hugo? Plain HTML?) |
| Data ingestion pipelines | ✅ YES | Python scripts, API integrations |
| Deploy to hosting | ⚠️ PARTIAL | Can advise on free tiers (Vercel, Netlify, GitHub Pages) |

**Gap:** Full-stack implementation requires YOU to choose: React/Vue/Svelte? Python/Node backend? SQLite/PostgreSQL?

---

### 2. Advanced Analytics Website (PFF-style)

| Task | Can Fulfill? | Notes |
|------|--------------|-------|
| Research PFF grading methodologies | ✅ YES | Deep research into their analytics models |
| Design member/free tier gating | ✅ YES | Auth architecture, JWT patterns |
| Create derived metrics formulas | ✅ YES | Statistical modeling, composite scores |
| Build payment/subscription system | ❌ NO | Requires Stripe/PayPal integration — YOU handle |
| Implement encryption | ⚠️ PARTIAL | Can advise on patterns, not production security audit |

**Gap:** Payment processing and production-grade security require external services and your implementation.

---

### 3. eXe Directory + NJZ Platform

| Task | Can Fulfill? | Notes |
|------|--------------|-------|
| Design central directory architecture | ✅ YES | Service mesh, API gateway patterns |
| Health monitoring dashboards | ✅ YES | Can build monitoring scripts, status pages |
| Formula glossary management | ✅ YES | Documentation systems, searchable DB |
| Inter-service communication | ✅ YES | REST/gRPC/ message queue patterns |
| Parity check algorithms | ✅ YES | Diff algorithms, checksum validation |

**Gap:** This is primarily architectural — I can design and prototype, but final implementation depends on your infrastructure choices.

---

### 4. AXIOM eSports — Offline Video Game

| Task | Can Fulfill? | Notes |
|------|--------------|-------|
| Game design documentation | ✅ YES | Mechanics, systems, balance formulas |
| Database schema for game state | ✅ YES | Player stats, team management, match sim |
| Simulation algorithms | ✅ YES | Match outcome prediction, player progression |
| 2D game engine code | ⚠️ LIMITED | Can script in Godot/GodotScript if you choose it |
| Art/assets | ❌ NO | You need artists or asset packs |
| Build game executable | ❌ NO | Requires engine (Unity/Godot/GameMaker) |

**Gap:** I cannot create a full game. I can help with: game design docs, simulation math, database schemas, and potentially Godot scripting if that's your engine choice.

---

### 5. NJZ Stock-Trading Simulation

| Task | Can Fulfill? | Notes |
|------|--------------|-------|
| Economic modeling system | ✅ YES | Market simulation, price indexing |
| Paper trading mechanics | ✅ YES | Portfolio tracking, order simulation |
| Formula validation engine | ✅ YES | Backtesting, metric correlation |
| Daily automated reports | ✅ YES | Cron jobs, report generation |
| AI agent traders | ✅ YES | Simulation agents with strategies |
| Real betting odds integration | ❌ NO | Legal/complex — YOU handle if needed |

**Gap:** This is the most AI-friendly component. I can build a full prototype simulation engine.

---

## Tools & Skills Inventory

### Currently Available (Native)

| Tool/Skill | Relevance to Project |
|------------|---------------------|
| `web_search` | Research sports analytics, competitor analysis |
| `web_fetch` | Scrape reference sites for structure analysis |
| `browser` | Interactive research, test websites |
| `exec` | Run build scripts, database tools, deployments |
| `process` | Long-running data pipelines |
| `cron` | Scheduled data collection, daily reports |
| `sessions_spawn` | Parallel research tasks, multi-component work |
| `feishu-doc/wiki` | Documentation if you use Feishu |
| `weather` | Minimal relevance |
| `healthcheck` | Server security if self-hosting |
| `tmux` | Managing long-running dev processes |

---

## Proposed New Skills to Create

Based on your recurring needs, I recommend creating these skills:

### 1. `esports-analytics-research`
**Purpose:** Research sports/eSports analytics methodologies  
**Contains:**
- `references/pff-grading.md` — PFF's grading system documentation
- `references/sports-reference-sites.md` — Analysis of Pro-Football-Reference, Basketball-Reference, etc.
- `references/advanced-metrics.md` — DVOA, WAR, EPA, composite scores
- `scripts/analyze_site_structure.py` — Scrape and analyze competitor site structures

**Triggers:** When you mention researching sports stats, competitor analysis, or analytics methodologies.

---

### 2. `data-pipeline-builder`
**Purpose:** Create ETL pipelines for eSports data  
**Contains:**
- `scripts/fetch_cs_match_data.py` — HLTV/Steam API data collection
- `scripts/fetch_valorant_data.py` — Riot API integration
- `scripts/parity_checker.py` — RAWS ↔ BASE table sync validation
- `references/api-docs/` — CS/Valorant API documentation

**Triggers:** When you mention data collection, ETL, match data, or parity checking.

---

### 3. `twin-table-architect`
**Purpose:** Design and maintain twin-table integrity systems  
**Contains:**
- `scripts/parity_monitor.py` — Continuous parity checking daemon
- `scripts/schema_generator.py` — Generate paired RAWS/BASE schemas
- `references/twin-table-patterns.md` — Design patterns for mirrored databases
- `scripts/sync_repair.py` — Detect and repair desyncs

**Triggers:** When you mention twin tables, BASE class, data integrity, or parity checking.

---

### 4. `market-sim-engine`
**Purpose:** Build and run NJZ stock-trading simulation  
**Contains:**
- `scripts/market_simulator.py` — Core simulation engine
- `scripts/ai_trader_agents.py` — Autonomous trading agents
- `scripts/daily_report.py` — Automated report generation
- `references/economic_models.md` — Market simulation theory

**Triggers:** When you mention NJZ simulation, market sim, formula validation, or trading engine.

---

### 5. `sports-db-designer`
**Purpose:** Database schema design for sports analytics  
**Contains:**
- `references/cs_schema.sql` — Counter-Strike database schema
- `references/valorant_schema.sql` — Valorant database schema
- `references/player_metrics.md` — Standard player metrics definitions
- `scripts/migrate_twin_tables.py` — Migration utilities

**Triggers:** When you mention database design, schema, tables, or player stats structure.

---

## Immediate Action Items

### For You (Eli):

1. **Choose infrastructure stack** — This blocks most implementation:
   - Frontend: React/Next.js? Vue? Svelte? Plain HTML?
   - Backend: Node.js? Python/FastAPI? Go?
   - Database: PostgreSQL? SQLite? MySQL?
   - Hosting: Vercel? Netlify? Self-hosted VPS?

2. **Prioritize components** — Which to prototype first?
   - NJZ Market Sim (most AI-friendly)
   - RAWS schema design (foundation for everything)
   - eXe directory architecture (needed for integration)

3. **Data source access** — Do you have API keys for:
   - HLTV (CS match data)
   - Riot Games API (Valorant)
   - Steam Web API

### For Me:

1. Create `esports-analytics-research` skill — Research competitor sites immediately
2. Create `twin-table-architect` skill — Core to your data integrity philosophy
3. Create `market-sim-engine` skill — Prototype the NJZ simulation
4. Draft initial database schemas for CS/Valorant pending your tech stack choice

---

## What I Cannot Do (Be Explicit)

| Limitation | Why | Workaround |
|------------|-----|------------|
| Build production payment systems | Legal/compliance complexity | You implement Stripe/PayPal, I help with webhook handlers |
| Create game art/assets | No image generation capability | You use asset stores or artists, I help with integration |
| Host infrastructure permanently | I'm a session-based assistant | Deploy to your chosen hosting, I help with CI/CD scripts |
| Legal compliance (GDPR, gambling laws) | Jurisdiction-specific | You consult lawyers, I implement technical requirements |
| Production security audit | Liability — security requires specialists | I follow best practices, you get professional audit |

---

## Recommendations

1. **Start with NJZ Market Sim** — It's the most self-contained, AI-friendly component. We can have a working prototype quickly.

2. **Define the twin-table spec first** — This architectural decision affects everything else. Let's nail down RAWS/BASE relationship before building.

3. **Use skills for recurring patterns** — The 5 skills I proposed will save you from re-explaining requirements each session.

4. **Keep budget constraints visible** — Every decision should reference back to free/low-cost infrastructure. I'll flag expensive choices.

---

*Assessment complete. Ready to proceed with skill creation and prototyping.*
