[Ver001.000]

# 4NJZ4 TENET Platform — MVP Backlog
## Prioritized Development Roadmap

**Date:** 2026-03-22  
**Timeline:** 6-9 weeks  
**Budget:** Zero-cost hosting  
**Status:** Draft for Review  

---

## Priority Legend

| Priority | Meaning | Timeline |
|----------|---------|----------|
| **P0 (Must)** | Critical for MVP launch | Weeks 1-4 |
| **P1 (Should)** | Important for quality | Weeks 4-6 |
| **P2 (Could)** | Nice to have | Weeks 6-9 |
| **P3 (Won't)** | Post-MVP | Future |

---

## Phase 0: Prep (Week 1)

### P0: Repository Hygiene
| ID | Task | Owner | Est. |
|----|------|-------|------|
| P0-1 | Audit repo for sensitive docs; move to private storage | Tech Lead | 4h |
| P0-2 | Write concise public README (one-page) | Tech Lead | 2h |
| P0-3 | Create architecture map (visual) | Architect | 4h |
| P0-4 | Archive legacy docs; keep curated public index | Tech Lead | 3h |
| P0-5 | Verify `axiom_esports_data` directory integrity | Backend Lead | 2h |

**Deliverables:**
- Clean public README
- Architecture diagram
- Curated docs index

---

## Phase 1: Discovery & Content (Weeks 1-2)

### P0: Scope Definition
| ID | Task | Owner | Est. |
|----|------|-------|------|
| P0-6 | Define MVP HUBs: Landing, Matches (primary), Docs | PM + Design | 4h |
| P0-7 | Map user flows: Landing → Hub → Match → Replay | UX Lead | 4h |
| P0-8 | Identify API endpoints needed for MVP | Backend Lead | 3h |

### P0: Content Inventory
| ID | Task | Owner | Est. |
|----|------|-------|------|
| P0-9 | Extract 6-8 case studies from existing docs | Content | 6h |
| P0-10 | Write mission/vision copy for landing | Content | 3h |
| P0-11 | Create match data fixtures (JSON) for demo | Backend | 4h |

**Deliverables:**
- MVP scope document
- User flow diagrams
- Content folder with case studies
- API requirements doc

---

## Phase 2: Design System (Weeks 1-2)

### P0: Core Tokens
| ID | Task | Owner | Est. |
|----|------|-------|------|
| P0-12 | Set up CSS variables (colors, type, spacing) | Frontend | 4h |
| P0-13 | Define motion tokens (durations, easings) | Frontend | 2h |
| P0-14 | Create component tokens (buttons, panels) | Frontend | 4h |

### P0: Base Components
| ID | Task | Owner | Est. |
|----|------|-------|------|
| P0-15 | Panel component (with hover states) | Frontend | 4h |
| P0-16 | Button variants (primary, secondary, ghost) | Frontend | 3h |
| P0-17 | Typography components (Heading, Text, Mono) | Frontend | 3h |
| P0-18 | Status badge component | Frontend | 2h |

### P1: Layout Components
| ID | Task | Owner | Est. |
|----|------|-------|------|
| P1-1 | Header (sticky, responsive) | Frontend | 4h |
| P1-2 | Footer (minimal) | Frontend | 2h |
| P1-3 | Two-column hub layout | Frontend | 4h |
| P1-4 | Tabbed lens container (with animations) | Frontend | 6h |

**Deliverables:**
- CSS token file
- Component library (5+ components)
- Storybook or similar

---

## Phase 3: Page Development (Weeks 2-5)

### P0: Landing Page
| ID | Task | Owner | Est. |
|----|------|-------|------|
| P0-19 | Hero section (type-first) | Frontend | 4h |
| P0-20 | Hub preview cards (5 hubs) | Frontend | 4h |
| P0-21 | Feature highlights section | Frontend | 3h |
| P0-22 | CTA + footer | Frontend | 2h |

### P0: Hub Shell
| ID | Task | Owner | Est. |
|----|------|-------|------|
| P0-23 | Hub navigation (switcher) | Frontend | 4h |
| P0-24 | Hub layout shell (2-column) | Frontend | 4h |
| P0-25 | Breadcrumb component | Frontend | 2h |

### P0: Matches Hub (Primary)
| ID | Task | Owner | Est. |
|----|------|-------|------|
| P0-26 | Match list view (table/cards) | Frontend | 6h |
| P0-27 | Match filtering (status, date, tournament) | Frontend | 4h |
| P0-28 | Match card component | Frontend | 4h |
| P0-29 | Match detail page shell | Frontend | 4h |

### P1: Match Detail
| ID | Task | Owner | Est. |
|----|------|-------|------|
| P1-5 | Scoreboard display | Frontend | 3h |
| P1-6 | Team stats panel | Frontend | 4h |
| P1-7 | Player performance panel | Frontend | 4h |
| P1-8 | Replay viewer stub (UI only) | Frontend | 4h |

### P1: Docs Hub
| ID | Task | Owner | Est. |
|----|------|-------|------|
| P1-9 | Docs navigation (sidebar) | Frontend | 4h |
| P1-10 | Content page template | Frontend | 3h |
| P1-11 | Migrate 3-5 key docs to new format | Content | 6h |

### P2: Additional Hubs (Stub)
| ID | Task | Owner | Est. |
|----|------|-------|------|
| P2-1 | ROTAS hub (simulation) - placeholder | Frontend | 2h |
| P2-2 | AREPO hub (maps) - placeholder | Frontend | 2h |
| P2-3 | OPERA hub (fantasy) - placeholder | Frontend | 2h |

**Deliverables:**
- Landing page (complete)
- Matches hub (functional)
- Match detail (P1 level)
- Docs hub (P1 level)

---

## Phase 4: Integration & Data (Weeks 4-6)

### P0: API Integration
| ID | Task | Owner | Est. |
|----|------|-------|------|
| P0-30 | Set up API client (axios/fetch) | Frontend | 2h |
| P0-31 | Connect match list to real API | Frontend + Backend | 4h |
| P0-32 | Error handling (loading, error states) | Frontend | 3h |

### P1: Real-time Features
| ID | Task | Owner | Est. |
|----|------|-------|------|
| P1-12 | WebSocket connection for live matches | Frontend + Backend | 6h |
| P1-13 | Live badge + status updates | Frontend | 3h |

### P2: Mock Data Fallback
| ID | Task | Owner | Est. |
|----|------|-------|------|
| P2-4 | Create comprehensive mock data | Frontend | 4h |
| P2-5 | Mock API layer for demo mode | Frontend | 3h |

**Deliverables:**
- API integration (matches)
- Error state handling
- Mock data system (P2)

---

## Phase 5: Polish & Launch (Weeks 5-7)

### P0: Performance
| ID | Task | Owner | Est. |
|----|------|-------|------|
| P0-33 | Lazy load images and heavy components | Frontend | 3h |
| P0-34 | Optimize bundle (code splitting) | Frontend | 4h |
| P0-35 | Run Lighthouse audit; fix critical issues | Frontend | 4h |

### P0: Accessibility
| ID | Task | Owner | Est. |
|----|------|-------|------|
| P0-36 | Keyboard navigation test | Frontend | 3h |
| P0-37 | Screen reader test (VoiceOver/NVDA) | Frontend | 3h |
| P0-38 | Color contrast verification | Frontend | 2h |
| P0-39 | Reduced motion support | Frontend | 2h |

### P1: SEO & Meta
| ID | Task | Owner | Est. |
|----|------|-------|------|
| P1-14 | Add meta tags (title, description, OG) | Frontend | 3h |
| P1-15 | Generate sitemap.xml | Frontend | 2h |
| P1-16 | robots.txt configuration | Frontend | 1h |

### P1: Analytics
| ID | Task | Owner | Est. |
|----|------|-------|------|
| P1-17 | Privacy-respecting analytics (Plausible/ Fathom) | Frontend | 2h |
| P1-18 | Track key events (page views, CTA clicks) | Frontend | 2h |

### P2: Cross-browser
| ID | Task | Owner | Est. |
|----|------|-------|------|
| P2-6 | Test on Chrome, Firefox, Safari | QA | 4h |
| P2-7 | Test on mobile (iOS Safari, Android Chrome) | QA | 4h |

**Deliverables:**
- Performance audit results
- Accessibility compliance
- SEO ready
- Analytics connected

---

## Phase 6: Deployment (Week 6-7)

### P0: Hosting Setup
| ID | Task | Owner | Est. |
|----|------|-------|------|
| P0-40 | Set up GitHub Pages / Vercel | DevOps | 2h |
| P0-41 | Configure custom domain (if available) | DevOps | 2h |
| P0-42 | SSL certificate (automated) | DevOps | 1h |

### P0: CI/CD
| ID | Task | Owner | Est. |
|----|------|-------|------|
| P0-43 | GitHub Actions for build + deploy | DevOps | 3h |
| P0-44 | Branch protection rules | DevOps | 1h |

### P1: Launch Checklist
| ID | Task | Owner | Est. |
|----|------|-------|------|
| P1-19 | Final QA pass | QA | 4h |
| P1-20 | Create launch announcement | Marketing | 3h |
| P1-21 | Monitor analytics post-launch | PM | Ongoing |

**Deliverables:**
- Live website
- CI/CD pipeline
- Launch announcement

---

## Post-MVP (P3 - Future)

| ID | Feature | Notes |
|----|---------|-------|
| P3-1 | ROTAS simulation hub | Full integration with Godot sim |
| P3-2 | AREPO tactical map | Interactive map viewer |
| P3-3 | OPERA fantasy league | Full fantasy system |
| P3-4 | User accounts | Auth, profiles, preferences |
| P3-5 | Replay video player | Full replay with sync |
| P3-6 | Mobile app | PWA or native |
| P3-7 | API documentation | Public API docs |
| P3-8 | Community features | Forums, comments |

---

## Resource Estimates

### By Phase

| Phase | Duration | Hours | Key Deliverables |
|-------|----------|-------|------------------|
| Phase 0 | Week 1 | 15h | Clean repo, README, architecture |
| Phase 1 | Weeks 1-2 | 24h | Scope, content, API plan |
| Phase 2 | Weeks 1-2 | 30h | Design system, components |
| Phase 3 | Weeks 2-5 | 60h | Pages, hubs, layouts |
| Phase 4 | Weeks 4-6 | 25h | API integration, data |
| Phase 5 | Weeks 5-7 | 35h | Polish, a11y, SEO |
| Phase 6 | Weeks 6-7 | 12h | Deploy, launch |
| **Total** | **6-7 weeks** | **~200h** | **Complete MVP** |

### By Discipline

| Role | Hours | Primary Tasks |
|------|-------|---------------|
| Frontend Lead | 100h | Components, pages, integration |
| Backend Lead | 25h | API, data fixtures, WebSocket |
| UX/Design Lead | 35h | Design system, mockups, a11y |
| Tech Lead / PM | 25h | Scope, coordination, QA |
| Content | 15h | Copy, case studies, docs |

---

## Risk Register

| ID | Risk | Probability | Impact | Mitigation |
|----|------|-------------|--------|------------|
| R1 | API not ready for integration | Medium | High | Use mock data for launch |
| R2 | Design system takes longer than planned | Medium | Medium | Start with MVP subset |
| R3 | Content not ready | Low | Medium | Use placeholder copy temporarily |
| R4 | Performance targets not met | Medium | High | Optimize images, lazy load |
| R5 | Accessibility issues discovered late | Medium | Medium | Test early and often |

---

## Definition of Done (MVP)

- [ ] Landing page complete and responsive
- [ ] Matches hub functional with real or mock data
- [ ] Match detail page with stats panels
- [ ] Docs hub with 3+ articles
- [ ] Design system documented
- [ ] Lighthouse score > 80
- [ ] Keyboard navigation works
- [ ] Deployed to public URL
- [ ] Analytics tracking

---

*Document Version: [Ver001.000]*  
*Next Review: Weekly during development*  
*Owner: Product Manager / Foreman Agent*
