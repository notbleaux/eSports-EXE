[Ver001.000]

# eSports-EXE — Project Notebook

**Project**: eSports-EXE MVP  
**Start Date**: 2026-03-22  
**Target Launch**: 2026-06-25 (14 weeks with Sprint -1)  
**Status**: Sprint -1 — Data Infrastructure

---

## Current Sprint Status

### Sprint 0: Foundation (3 days)
**Dates**: 2026-03-22 → 2026-03-25  
**Goal**: Clean repository, establish baseline, set up tooling

| Ticket | Task | Assignee | Status | Est | Actual |
|--------|------|----------|--------|-----|--------|
| S0-001 | Repository cleanup | — | ⏳ Not Started | 4h | — |
| S0-002 | Design token integration | — | ⏳ Not Started | 3h | — |
| S0-003 | Skeleton pages setup | — | ⏳ Not Started | 4h | — |
| S0-004 | Tooling setup | — | ⏳ Not Started | 2h | — |

**Sprint Velocity**: —  
**Blockers**: None  
**Notes**: All design deliverables complete and committed

---

## Sprint History

| Sprint | Dates | Status | Key Deliverables |
|--------|-------|--------|------------------|
| Sprint -1 | 03-22 → 04-12 | 🔴 Not Started | Data Infrastructure (CS 2012-2025, Valorant 2020-2025) |
| Sprint 0 | 04-13 → 04-16 | ⚪ Planned | Foundation setup |
| Sprint 1 | 04-17 → 04-30 | ⚪ Planned | UI Foundation |
| Sprint 2 | 05-01 → 05-14 | ⚪ Planned | Analytics Hub |
| Sprint 3 | 05-15 → 05-28 | ⚪ Planned | Events & Ops |
| Sprint 4 | 05-29 → 06-11 | ⚪ Planned | TeNET Tools |
| Sprint 5 | 06-12 → 06-25 | ⚪ Planned | Polish & Launch |

---

## Daily Log

### 2026-03-22 — Day 0: Deliverables Complete
**Work Completed**:
- ✅ Created 5 annotated SVG wireframes (Analytics, Events, Ops, TeNET CS, TeNET Valorant)
- ✅ Added technical design docs for TeNET CS grenade visualizer
- ✅ Added technical design docs for TeNET Valorant ability timeline
- ✅ Component library ready (tokens.css + 4 HTML components)
- ✅ Created SPRINT_BACKLOG.md with 30+ tickets
- ✅ Updated PRODUCT_PLAN.md with sprint breakdown
- ✅ Created DATA_ARCHITECTURE.md for historical data (CS 2012-2025, Valorant 2020-2025)
- ✅ Created SCHEMA_REFERENCE.md with complete field documentation

**Decisions**:
- HLTV approach for analytics data model
- VLR.gg approach for match page UX patterns
- Hybrid analyst/fan modes for key hubs
- **NEW**: Static-first data architecture (JSON exports) for zero-cost hosting
- **NEW**: Liquipedia as primary data source (MediaWiki API)
- **NEW**: Sprint -1 added for data infrastructure (3 weeks)

**Next Steps**:
- Begin Sprint -1: Data infrastructure setup
- Implement Liquipedia collectors
- Generate historical JSON exports
- Then proceed to Sprint 0: UI foundation

---

## Key Metrics

### Performance Targets
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Lighthouse Performance | ≥80 | — | ⏳ |
| Lighthouse Accessibility | ≥90 | — | ⏳ |
| First Contentful Paint | <1.5s | — | ⏳ |
| Time to Interactive | <3s | — | ⏳ |

### Code Quality
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Contrast Ratio | ≥4.5:1 | ✅ Pass | 🟢 |
| Keyboard Navigation | 100% | — | ⏳ |
| Console Errors | 0 | — | ⏳ |

---

## Blockers & Issues

| ID | Description | Priority | Owner | Resolution |
|----|-------------|----------|-------|------------|
| — | No active blockers | — | — | — |

---

## Design Decisions Log

| Date | Decision | Context | Impact |
|------|----------|---------|--------|
| 03-22 | Use HLTV data depth + VLR.gg UX speed | Analysts need depth, fans need speed | Two-mode hub interfaces |
| 03-22 | Per-hub accent colors | Brand identity per hub | 5 unique accents defined |
| 03-22 | 65/35 asymmetric layout | Detail/Endex inspiration | Consistent across hubs |
| 03-22 | CSS variables for tokens | Maintainability | Single source of truth |
| 03-22 | **Static-first data architecture** | Zero-cost hosting requirement | JSON exports, no backend needed |
| 03-22 | **Liquipedia as primary source** | Best free API for historical data | 2012-2025 CS, 2020-2025 Valorant |
| 03-22 | **Sprint -1 for data infrastructure** | Historical data is prerequisite | 3-week data collection sprint |
| 03-22 | **Hybrid storage strategy** | Balance cost vs capability | Hot data in JSON, warm in Supabase |
| 03-22 | **GitHub Pages + CDN delivery** | Static hosting for global reach | Unlimited bandwidth, free |
| 03-22 | **Data volume: ~525 MB total** | 50K CS matches + 35K Val matches | Chunked by year for lazy loading |

---

## Resources & References

### Inspiration Sites
- **HLTV.org**: https://www.hltv.org/stats/matches — Data density, historical stats
- **VLR.gg**: https://www.vlr.gg/ — Modern UX, clean match pages

### Data Sources
- **Liquipedia**: https://liquipedia.net/ — Primary data source (MediaWiki API)
- **Liquipedia API Docs**: https://liquipedia.net/commons/Help:API — API documentation
- **Pandascore**: https://pandascore.co/ — Secondary enrichment (free tier)

### Internal Documents
- `PRODUCT_PLAN.md` — Executive roadmap
- `MVP.md` — One-page specification
- `SPRINT_BACKLOG.md` — Ticket-level tasks (now includes Sprint -1 data infrastructure)
- `DELIVERABLES_INDEX.md` — Deliverables master list
- `HUB_BLUEPRINTS.md` — Detailed hub specs
- `STYLE_BRIEF.md` — Design tokens
- `DATA_ARCHITECTURE.md` — Historical data strategy and schemas
- `SCHEMA_REFERENCE.md` — Complete field documentation

### Technical Specs
- `docs/TECH_DESIGN_TENET_CS.md` — Grenade visualizer (base)
- `docs/TECH_DESIGN_TENET_CS_ENHANCED.md` — Grenade visualizer (enhanced with lineup library)
- `docs/TECH_DESIGN_TENET_VALORANT.md` — Ability timeline (base)
- `docs/TECH_DESIGN_TENET_VALORANT_ENHANCED.md` — Ability timeline (enhanced with coach annotations)

---

## Meeting Notes

### Kickoff — 2026-03-22
**Attendees**: Product Lead, Design Lead  
**Agenda**: MVP scope confirmation, design direction, sprint planning  
**Decisions**:
- Confirmed 14-week timeline (including Sprint -1 data infrastructure)
- Approved HLTV+VLR hybrid approach
- Locked design tokens
- Added Sprint -1 for CS 2012-2025 and Valorant 2020-2025 historical data collection

**Action Items**:
- [ ] Start Sprint -1: Data infrastructure (assigned: Data Team)
- [ ] Set up project board (assigned: Product Lead)
- [ ] Schedule weekly check-ins (assigned: Product Lead)
- [ ] Set up Liquipedia API access (assigned: Data Team)

---

## Appendix: Quick Commands

```bash
# Development
npm run dev          # Start local server
npm run build        # Production build
npm run test         # Run tests

# Deployment
git push origin main # Triggers GitHub Pages deploy

# Utilities
npm run lint         # ESLint check
npm run format       # Prettier format
```

---

*Maintained by: Product Lead*  
*Last updated: 2026-03-22*
