# Development Roadmap

## Overview

This roadmap outlines the path from current state (build stabilized) to production-ready eSports-EXE platform.

**Current Status:** Build stable, TypeScript errors resolved, NeXeZ continuation track approved  
**Next Milestone:** Sprint 1 (Alignment & Decision Lock)

---

## NeXeZ Continuation Track (Priority)

This priority track defines immediate execution for NeXeZ webapp/website alignment and polyrepo integration readiness.

### Sprint 1 — Alignment & Decision Lock (Weeks 1-2)

**Deliveries**
- [ ] Unified Architecture Brief v1 for NeXeZ + current platform coexistence
- [ ] Must-have / Nice-to-have scoring framework (13-question rubric, 1–5 scale)
- [ ] Cross-repo inventory (apps, shared packages, APIs, deployments, ADR gaps)

**Targets**
- 100% core components classified as Must/Nice
- Top 10 Must-haves ranked and accepted
- Repository dependency map approved

### Sprint 2 — Shared Foundation (Weeks 3-4)

**Deliveries**
- [ ] Shared contract baseline (API schemas, events, auth boundaries, env naming)
- [ ] Integration standards (branching, versioning, release tags, compatibility policy)
- [ ] Deployment profile matrix (dev/stage/prod) for Vercel + Railway/Render

**Targets**
- All active repositories mapped to one compatibility matrix
- Zero ambiguous environment variable names across core services

### Sprint 3 — First Vertical Slice (Weeks 5-6)

**Deliveries**
- [ ] End-to-end NeXeZ slice (dashboard shell + orchestration API + integrated service module)
- [ ] PixiJS visualization MVP in webapp
- [ ] Docker Compose local integration stack for validation

**Targets**
- Vertical slice runs locally and in staging
- Baseline SLOs defined (latency, error rate, uptime)

### Sprint 4 — Hardening & Live-Safe Operations (Weeks 7-8)

**Deliveries**
- [ ] Live-safe operating model to protect production website performance
- [ ] Test gates (integration, contract, smoke, rollback validation)
- [ ] Runbooks (incident response, rollback, release checks)

**Targets**
- Release checklist mandatory before production promotion
- Controlled weekly release cadence established

### Must-Have / Nice-to-Have Scoring Rubric (13 Questions)

Score each question 1-5 per candidate component/plan item:
1. Is it required for core user journeys?
2. Does it directly support NeXeZ command-center goals?
3. Does it unblock other high-priority work?
4. Does it reduce operational risk?
5. Does it improve production reliability?
6. Does it improve developer velocity?
7. Is implementation complexity manageable this cycle?
8. Are dependencies already available?
9. Is expected user value high?
10. Is economic value strong relative to effort?
11. Is opportunity cost acceptable?
12. Can it be delivered as a clean vertical slice?
13. Can it be validated with measurable acceptance criteria?

Classification rule:
- **Must Have:** Required for first-wave portfolio completion
- **Nice to Have:** Sequenced by difficulty, utility, and economic value/opportunity cost

### Post-Sprint Progression

- **Phase A — Foundation (Sprints 1–2)**
- **Phase B — Integration (Sprints 3–4)**
- **Phase C — Productionization (next 2–3 sprints)**
- **Phase D — Expansion (omnibus command-center scaling + incubated SATOR-inspired experimentation)**

### Required Unification Checks

- Shared types/contracts consistency checks
- REST API parity checks
- Env and deployment drift checks (Vercel/Railway/Render)
- ADR conformance checks
- UI/visual system consistency checks (webapp + website)

---

## Phase 1: Foundation (Weeks 1-2)
**Goal:** Stable development environment and design system

### Week 1: Design System Implementation
- [ ] Implement design tokens in Tailwind config
- [ ] Create CSS variables file (`src/styles/tokens.css`)
- [ ] Set up dark mode as default
- [ ] Configure typography scale
- [ ] Document color system

**Deliverables:**
- `tailwind.config.js` with all tokens
- `tokens.css` with CSS variables
- Design token documentation

### Week 2: Component Library
- [ ] Set up Storybook
- [ ] Create Button component (all variants)
- [ ] Create Card component (all variants)
- [ ] Create Input component (all variants)
- [ ] Create Navigation components
- [ ] Create Layout components

**Deliverables:**
- Storybook instance running
- 20+ documented components
- Component usage guidelines

**Success Criteria:**
- `pnpm build` passes with zero errors
- All components have Storybook stories
- Design system docs are complete

---

## Phase 2: ROTAS MVP (Weeks 3-6)
**Goal:** Functional stats reference HUB

### Week 3: Data Pipeline
- [ ] Design database schema for players/teams/matches
- [ ] Create PostgreSQL migrations
- [ ] Implement PandaScore client
- [ ] Build data ingestion pipeline
- [ ] Set up Redis caching layer

**Deliverables:**
- Database schema documentation
- Working data ingestion
- Cached data available

### Week 4: Backend API
- [ ] Implement `/players` endpoints
- [ ] Implement `/teams` endpoints
- [ ] Implement `/matches` endpoints
- [ ] Add filtering and pagination
- [ ] Write API tests

**Deliverables:**
- REST API with OpenAPI docs
- Postman collection
- API integration tests

### Week 5: Frontend - Player/Team Pages
- [ ] Build PlayerList component
- [ ] Build PlayerProfile page
- [ ] Build TeamList component
- [ ] Build TeamProfile page
- [ ] Implement search and filtering

**Deliverables:**
- Player/Team browsing functional
- Search working
- Responsive layouts

### Week 6: Frontend - Match Display
- [ ] Build MatchList component
- [ ] Build MatchDetail page
- [ ] Implement round-by-round display
- [ ] Add stats tables
- [ ] Connect to real API

**Deliverables:**
- Match history viewable
- Real data from database
- Stats tables with sorting

**Success Criteria:**
- Can view real match data from last 30 days
- Player stats are searchable and filterable
- Page load time < 2 seconds

---

## Phase 3: SATOR Analytics (Weeks 7-10)
**Goal:** Advanced analytics and predictions

### Week 7: Rating Algorithm
- [ ] Research rating methodologies (HLTV 2.0, etc.)
- [ ] Design SATOR rating formula
- [ ] Implement rating calculation service
- [ ] Create rating history tracking
- [ ] Document rating methodology

**Deliverables:**
- Rating algorithm implemented
- Rating explanations transparent
- Historical ratings available

### Week 8: Analytics Dashboard
- [ ] Build PlayerAnalytics component
- [ ] Implement performance charts
- [ ] Create trend visualization
- [ ] Add comparison tools
- [ ] Build analytics API endpoints

**Deliverables:**
- Analytics dashboard functional
- Charts interactive and responsive
- Comparison tools working

### Week 9: Prediction Models
- [ ] Design prediction methodology
- [ ] Implement basic match prediction
- [ ] Add confidence intervals
- [ ] Create prediction history tracking
- [ ] Build prediction display UI

**Deliverables:**
- Match predictions working
- Confidence scores displayed
- Prediction accuracy tracked

### Week 10: Anomaly Detection
- [ ] Implement upset detection
- [ ] Add performance anomaly alerts
- [ ] Create anomaly explanation UI
- [ ] Build alerting system

**Deliverables:**
- Anomaly detection operational
- Alerts for significant events
- Explanations for anomalies

**Success Criteria:**
- Rating system has explanatory transparency
- Predictions have confidence intervals
- Charts are interactive and responsive

---

## Phase 4: OPERA Live Scene (Weeks 11-14)
**Goal:** Pro scene information and live coverage

### Week 11: Tournament System
- [ ] Design tournament bracket data model
- [ ] Implement tournament API endpoints
- [ ] Build Bracket visualization component
- [ ] Create tournament listing page
- [ ] Add tournament detail view

**Deliverables:**
- Tournament brackets functional
- Bracket visualization interactive

### Week 12: Live Match Integration
- [ ] Implement WebSocket server
- [ ] Create live match data stream
- [ ] Build LiveMatchCard component
- [ ] Add real-time score updates
- [ ] Implement live match list

**Deliverables:**
- Real-time updates working
- Live match cards functional

### Week 13: News & Content
- [ ] Design content management system
- [ ] Implement news API endpoints
- [ ] Build ArticleList component
- [ ] Create Article detail view
- [ ] Add rich media support

**Deliverables:**
- News system operational
- Articles with rich media

### Week 14: Calendar & Schedule
- [ ] Build Calendar component
- [ ] Implement schedule view
- [ ] Add match reminders
- [ ] Create timezone handling

**Deliverables:**
- Calendar view functional
- Schedule with reminders

**Success Criteria:**
- Live match data updates in real-time
- Tournament brackets are interactive
- News articles support rich media

---

## Phase 5: AREPO Community (Weeks 15-18)
**Goal:** Community engagement features

### Week 15: Forum Foundation
- [ ] Design forum data model
- [ ] Implement forum API endpoints
- [ ] Build ForumList component
- [ ] Create ThreadList view
- [ ] Add Thread detail view

**Deliverables:**
- Forum structure operational
- Threads viewable and creatable

### Week 16: User Predictions
- [ ] Implement prediction tracking
- [ ] Build prediction UI
- [ ] Add prediction leaderboards
- [ ] Create prediction history

**Deliverables:**
- User predictions working
- Leaderboards functional

### Week 17: Reputation System
- [ ] Design badge/reputation system
- [ ] Implement reputation calculation
- [ ] Build user profile enhancements
- [ ] Add achievement tracking

**Deliverables:**
- Reputation system operational
- Badges displayed

### Week 18: Moderation Tools
- [ ] Implement content moderation
- [ ] Build moderation dashboard
- [ ] Add automated filters
- [ ] Create reporting system

**Deliverables:**
- Moderation tools functional
- Automated filtering active

**Success Criteria:**
- Users can create and reply to threads
- Prediction accuracy is tracked over time
- Moderation queue processes within 24 hours

---

## Phase 6: Integration & Polish (Weeks 19-22)
**Goal:** Cross-HUB features and performance optimization

### Week 19: Cross-HUB Search
- [ ] Implement unified search index
- [ ] Build Search component
- [ ] Add search suggestions
- [ ] Create search results page

**Deliverables:**
- Global search functional
- Results from all HUBs

### Week 20: Navigation & UX
- [ ] Implement cross-HUB navigation
- [ ] Add breadcrumbs
- [ ] Create user onboarding flow
- [ ] Build help/documentation system

**Deliverables:**
- Seamless HUB navigation
- Onboarding for new users

### Week 21: Performance Optimization
- [ ] Audit bundle sizes
- [ ] Implement code splitting
- [ ] Optimize images/assets
- [ ] Add service worker for caching

**Deliverables:**
- Lighthouse score > 90
- Fast initial load times

### Week 22: Accessibility & QA
- [ ] Conduct accessibility audit
- [ ] Fix WCAG issues
- [ ] Cross-browser testing
- [ ] Mobile responsiveness audit
- [ ] Final bug fixes

**Deliverables:**
- WCAG 2.1 AA compliance
- Mobile-first experience
- Production-ready build

**Success Criteria:**
- Lighthouse score > 90 across all categories
- Mobile experience is first-class
- Accessibility audit passes with zero critical issues

---

## Milestones Summary

| Milestone | Target Date | Key Deliverable |
|-----------|-------------|-----------------|
| Foundation Complete | Week 2 | Design system + component library |
| ROTAS MVP | Week 6 | Functional stats HUB with real data |
| SATOR Analytics | Week 10 | Ratings, predictions, charts |
| OPERA Live | Week 14 | Tournaments, live matches, news |
| AREPO Community | Week 18 | Forums, predictions, reputation |
| Production Ready | Week 22 | Cross-HUB features, optimized, accessible |

---

## Risk Management

### High Risks
1. **Data Pipeline Complexity** — PandaScore integration may have edge cases
   - *Mitigation:* Start with simple data models, iterate

2. **ML Prediction Accuracy** — Predictions may not meet accuracy targets
   - *Mitigation:* Set realistic expectations, focus on transparency over accuracy

### Medium Risks
1. **Scope Creep** — Feature requests may expand scope
   - *Mitigation:* Strict adherence to Master Plan, ADR process for changes

2. **Performance Issues** — Real-time data may strain resources
   - *Mitigation:* Redis caching, pagination, WebSocket optimization

---

## Success Metrics

### Technical
- Build passes with zero TypeScript errors
- Lighthouse score > 90 (all categories)
- API response time < 200ms (95th percentile)
- Test coverage > 80%

### User Experience
- Time to first meaningful paint < 1.5s
- Page load time < 2s
- Zero critical accessibility issues

### Business
- ROTAS functional with real data (Phase 2)
- All four HUBs operational (Phase 5)
- Production deployment (Phase 6)

---

*This roadmap is a living document. Updates require ADR approval per the [Governance Model](../master-plan/master-plan.md#7-governance-model).*
