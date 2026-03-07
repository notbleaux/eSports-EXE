# SATOR eXe ROTAS Website Expansion Plan
## NJZ Quarter Grid HUB System - Foreman Master Plan

**Version:** 1.0  
**Date:** 2026-03-04  
**Status:** Planning Phase  
**Foreman:** Kimi Master Agent  
**Target:** notbleaux/eSports-EXE

---

## EXECUTIVE SUMMARY

This plan implements a comprehensive 5-HUB website platform with a central NJZ Quarter Grid selector as the landing page. Each HUB operates as a partitioned section with dedicated functionality, unified design system, and integrated membership/trust framework.

### HUB Architecture
```
                    [NJZ CENTER]
                         +
                         |
        +----------------+----------------+
        |                |                |
   [HUB 1/4]      [HUB 2/4]       [HUB 3/4]
Statistical    Advanced        eSports
Reference      Analytics       HUB
        |                |                |
        +----------------+----------------+
                         |
                    [HUB 4/4]
                 Fantasy eSports
                         |
                    [HELP HUB]
                    (5/4 Hidden)
```

---

## SECTION 1: NJZ QUARTER GRID LANDING PAGE (Center Hub Selector)

### 1.1 Section Overview
The central landing page featuring a glowing "+" NJZ center selector that connects to all 4 HUBs in a quarter-grid layout. Serves as the primary entry point and HUB directory.

### 1.2 Key Features
- **NJZ Center Button:** Glowing animated + symbol at center
- **Quarter Grid Layout:** 4 quadrants representing the 4 HUBs
- **Hover Effects:** Preview animations on HUB hover
- **Responsive Design:** Adapts to mobile (stacked) and desktop (grid)
- **Membership Teaser:** Shows premium features preview

### 1.3 Technical Requirements
- HTML5/CSS3 with Tailwind
- CSS Grid/Flexbox for quarter layout
- CSS Animations for glow effects
- JavaScript for hover interactions
- Accessible navigation (keyboard/screen reader)

### 1.4 Files to Create/Modify
| File | Type | Status |
|------|------|--------|
| `index.html` | MODIFY | Update to Quarter Grid |
| `css/njz-grid.css` | CREATE | Grid layout styles |
| `js/njz-grid.js` | CREATE | Grid interactions |
| `assets/njz-logo.svg` | CREATE | NJZ branding |

### 1.5 Stub/Placeholder Classification
| Component | Status | Priority | Notes |
|-----------|--------|----------|-------|
| Grid Layout | IMPLEMENT | P0 | Core structure |
| NJZ Center + | IMPLEMENT | P0 | Animated glow |
| HUB Preview Cards | IMPLEMENT | P0 | Basic hover states |
| Membership Banner | STUB | P1 | Placeholder for auth |
| Login/Register Modal | STUB | P2 | Functional later |
| Help Panel Toggle | IMPLEMENT | P0 | Opens Help HUB |

---

## SECTION 2: HUB 1/4 - STATISTICAL REFERENCE (Pro X-Sport Style)

### 2.1 Section Overview
Comprehensive statistical reference database inspired by Pro X-Sport Reference websites. Provides detailed player, team, and match statistics with historical data.

### 2.2 Key Features
- **Player Statistics:** Career stats, season stats, match logs
- **Team Statistics:** Team performance, roster history, head-to-head
- **Match Database:** Historical matches, detailed box scores
- **Leaderboards:** Season leaders, all-time leaders
- **Search & Filter:** Advanced query capabilities
- **Export Options:** CSV, JSON export for data

### 2.3 Page Structure
```
/hub/stat-ref/
├── index.html          # Hub landing
├── players/
│   ├── index.html      # Player directory
│   ├── [player-id]/    # Individual player pages
│   └── compare.html    # Player comparison tool
├── teams/
│   ├── index.html      # Team directory
│   └── [team-id]/      # Individual team pages
├── matches/
│   ├── index.html      # Match database
│   └── [match-id]/     # Individual match pages
├── leaders/            # Leaderboards
└── search/             # Advanced search
```

### 2.4 Technical Requirements
- Data table libraries (DataTables or custom)
- Search indexing (client-side for MVP)
- Pagination for large datasets
- Responsive tables with horizontal scroll

### 2.5 Stub/Placeholder Classification
| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Player Directory | IMPLEMENT | P0 | Static data initially |
| Player Detail Pages | IMPLEMENT | P0 | Template-based |
| Team Directory | STUB | P1 | Placeholder structure |
| Match Database | STUB | P1 | Limited data |
| Leaderboards | IMPLEMENT | P0 | Basic sorting |
| Search Function | STUB | P2 | Client-side search |
| Export Features | STUB | P3 | Post-MVP |
| Comparison Tool | STUB | P2 | Interactive later |

---

## SECTION 3: HUB 2/4 - ADVANCED ANALYTICS (PFF Style)

### 3.1 Section Overview
Advanced analytics platform inspired by Pro Football Focus. Features curated composition layers for various analytical investigations with custom layer options.

### 3.2 Key Features
- **Composition Layers:** Pre-configured analytical views
  - Layer 1: SATOR Square (5-layer palindrome)
  - Layer 2: Performance Matrix
  - Layer 3: Temporal Analysis
  - Layer 4: Role-Based Analysis
  - Layer 5: Investment Grading
- **Custom Layer Builder:** User-defined filters and views
  - Drag-drop interface
  - Metric selection
  - Visualization options
  - Save/Load custom views
- **Membership Tiers:**
  - Free Users: 3 saved views, basic presets only
  - Members: 10 saved views, full customization

### 3.3 Page Structure
```
/hub/analytics/
├── index.html              # Hub landing
├── layers/
│   ├── sator-square/       # SATOR Square visualization
│   ├── performance/        # Performance matrix
│   ├── temporal/           # Time-based analysis
│   ├── role-based/         # Role analytics
│   └── investment/         # Investment grades
├── custom/
│   ├── builder.html        # Layer builder interface
│   ├── my-views.html       # Saved views (members only)
│   └── presets/            # Preset configurations
└── reports/                # Generated reports
```

### 3.4 Technical Requirements
- D3.js or Chart.js for visualizations
- React components for interactive layers
- LocalStorage for view persistence
- Backend API for member view storage

### 3.5 Stub/Placeholder Classification
| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| SATOR Square Viz | IMPLEMENT | P0 | Core feature |
| Layer Navigation | IMPLEMENT | P0 | Tab interface |
| Basic Presets | IMPLEMENT | P0 | 3-5 presets |
| Custom Layer UI | STUB | P1 | Interface mock |
| View Persistence | STUB | P2 | LocalStorage |
| Member Features | STUB | P2 | Auth required |
| Advanced Filters | STUB | P2 | Post-MVP |
| Report Generation | STUB | P3 | Export feature |

---

## SECTION 4: HUB 3/4 - ESPORTS HUB

### 4.1 Section Overview
Comprehensive professional eSports overview with news, results, schedules, forums, and media content. Features trust factor progression system for community engagement.

### 4.2 Key Features
- **News Section:** Latest eSports news, articles
- **Results:** Match results, tournament brackets
- **Schedules & Timetables:** Upcoming matches, calendar view
- **Professional Ladders:** Rankings, standings
- **Media Content:** Videos, streams, highlights
- **User Forumboards:** Community discussions
- **Trust Factor System:**
  - Daily activities (posts, reacts)
  - Weekly challenges
  - Monthly rankings
  - Special events participation
  - Pick'em predictions
- **Membership Tiers:**
  - Free Users: View only, no posting
  - Members: Tiered unlock based on Trust Factor
    - Reacts and status updates
    - Polls and voting
    - Forum posting privileges

### 4.3 Page Structure
```
/hub/esports/
├── index.html              # Hub landing
├── news/
│   ├── index.html          # News feed
│   └── [article-id]/       # Individual articles
├── results/
│   ├── index.html          # Results overview
│   └── [tournament]/       # Tournament brackets
├── schedule/
│   ├── index.html          # Schedule view
│   └── calendar.html       # Calendar interface
├── ladders/
│   ├── index.html          # Rankings
│   └── [region]/           # Regional ladders
├── media/
│   ├── index.html          # Media gallery
│   ├── videos.html         # Video content
│   └── streams.html        # Live streams
└── forums/
    ├── index.html          # Forum overview
    ├── [category]/         # Forum categories
    └── trust-system/       # Trust factor info
```

### 4.4 Technical Requirements
- CMS-like structure for news
- Forum software or custom implementation
- Real-time updates for live events
- Media player integration
- Trust factor tracking system

### 4.5 Stub/Placeholder Classification
| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| News Feed | IMPLEMENT | P0 | Static articles |
| Results Display | IMPLEMENT | P0 | Match results |
| Schedule View | IMPLEMENT | P0 | Upcoming matches |
| Ladders | STUB | P1 | Basic ranking |
| Media Gallery | STUB | P1 | Placeholder |
| Forums Structure | STUB | P2 | Layout only |
| Trust Framework | STUB | P2 | UI elements |
| Live Streams | STUB | P3 | Integration |
| Pick'em System | STUB | P3 | Post-MVP |

---

## SECTION 5: HUB 4/4 - FANTASY ESPORTS

### 5.1 Section Overview
Fantasy eSports platform with offline game application integration. Serves as the download portal and membership management hub for the Axiom eSports Simulation Game.

### 5.2 Key Features
- **Game Overview:** Application information, features
- **Download Portal:** Game installer download
- **Membership Integration:** Link to membership database
- **Advanced Database Access:** Premium data features
- **Leaderboards:** Fantasy league standings
- **Team Management:** Fantasy team builder

### 5.3 Page Structure
```
/hub/fantasy/
├── index.html              # Hub landing
├── game/
│   ├── index.html          # Game overview
│   ├── features.html       # Feature details
│   └── download.html       # Download page (stub)
├── membership/
│   ├── index.html          # Membership info
│   ├── login.html          # Login portal (stub)
│   └── register.html       # Registration (stub)
├── leagues/
│   ├── index.html          # League overview
│   └── [league-id]/        # League details
└── my-team/                # Team management
```

### 5.4 Technical Requirements
- Download file hosting
- Authentication system (stub)
- Database integration (stub)

### 5.5 Stub/Placeholder Classification
| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Game Overview | IMPLEMENT | P0 | Marketing page |
| Download Page | STUB | P0 | Placeholder for .exe |
| Features List | IMPLEMENT | P0 | Static content |
| Membership Portal | STUB | P1 | Auth placeholder |
| League System | STUB | P2 | Post-MVP |
| Team Builder | STUB | P2 | Post-MVP |

---

## SECTION 6: HELP HUB 5/4 (Hidden Expandable Panel)

### 6.1 Section Overview
Hidden expandable panel accessible from the NJZ center. Provides help guides, health checks, and developer dashboards. Slides over the Quarter Grid with swipe navigation.

### 6.2 Key Features
- **Access:** NJZ Center + button or hidden gesture
- **Layout:** Full-screen overlay with swipe navigation
- **Right Swipe (from center):** Table of Contents
  - Knowledge Article Libraries (per HUB)
  - HUB function guides
  - Service documentation
  - NJZ Directory guide
- **Left Swipe (from center):** Dashboards
  - Online Status checks
  - Health Checks with Health% displays
  - Verification Checks
  - Per-HUB status dashboards
- **Developer Section:** Password-protected
  - Developer Dashboards
  - Troubleshooting Tools
  - Collapsible specialized views
  - Tab-based navigation

### 6.3 Page Structure
```
/hub/help/
├── index.html              # Help panel shell
├── guides/
│   ├── index.html          # Guide overview
│   ├── njz-directory/      # NJZ guide
│   ├── hub-stat-ref/       # Stat Ref guide
│   ├── hub-analytics/      # Analytics guide
│   ├── hub-esports/        # eSports guide
│   └── hub-fantasy/        # Fantasy guide
├── dashboards/
│   ├── index.html          # Dashboard overview
│   ├── health/             # Health checks
│   ├── status/             # Online status
│   └── verification/       # Verification checks
└── developer/
    ├── login.html          # Password gate
    ├── index.html          # Dev dashboard
    ├── tools/              # Troubleshooting tools
    └── logs/               # System logs
```

### 6.4 Technical Requirements
- Full-screen overlay CSS
- Touch/swipe gesture support
- Password protection (simple)
- Health check APIs (stub)
- Collapsible panel UI

### 6.5 Stub/Placeholder Classification
| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Help Panel Shell | IMPLEMENT | P0 | Overlay structure |
| Table of Contents | IMPLEMENT | P0 | Navigation menu |
| Knowledge Articles | IMPLEMENT | P0 | Static content |
| Dashboard Framework | IMPLEMENT | P0 | Layout structure |
| Health% Displays | STUB | P1 | Mock data |
| Swipe Navigation | STUB | P1 | JS implementation |
| Developer Login | STUB | P2 | Simple password |
| Dev Dashboard | STUB | P2 | Collapsible UI |
| Troubleshooting Tools | STUB | P3 | Placeholder tabs |

---

## SECTION 7: UNIFIED DESIGN SYSTEM

### 7.1 Overview
Extend the existing Porcelain³ design system to cover all HUBs with consistent theming while allowing HUB-specific accents.

### 7.2 Color Palette (Per HUB)
| HUB | Primary | Secondary | Accent |
|-----|---------|-----------|--------|
| NJZ Center | Gold (#FFD700) | White | Cyan |
| Stat Ref | Blue (#1E3A5F) | Cyan | White |
| Analytics | Purple (#6B46C1) | Gold | Cyan |
| eSports | Red (#FF4655) | Orange | Gold |
| Fantasy | Green (#00FF88) | Cyan | Gold |
| Help | Gray (#8A8A9A) | White | Cyan |

### 7.3 Files to Create/Modify
| File | Type | Status |
|------|------|--------|
| `design-system/tokens/colors.css` | MODIFY | Add HUB colors |
| `design-system/components/hub-cards.css` | CREATE | HUB-specific cards |
| `design-system/components/navigation.css` | CREATE | Shared navigation |
| `css/hub-shared.css` | CREATE | Shared HUB styles |

---

## SECTION 8: INTEGRATION & NAVIGATION

### 8.1 Global Navigation
- Header with HUB switcher dropdown
- Breadcrumbs for HUB context
- Footer with HUB-specific links

### 8.2 Cross-HUB Links
- "Explore Other HUBs" sections
- Unified search across HUBs
- Shared membership status

### 8.3 URL Structure
```
/                           # NJZ Quarter Grid (landing)
/hub/[hub-name]/            # HUB landing pages
/hub/help/                  # Help panel
/api/                       # API endpoints (backend)
```

---

## SUB-AGENT TASK DISTRIBUTION

### Parallel Execution Plan

#### Phase 1: Foundation (All Agents Parallel)
| Agent | Task | Dependencies |
|-------|------|--------------|
| Agent A | NJZ Grid Landing Page | None |
| Agent B | Design System Extension | None |
| Agent C | Shared Components | None |
| Agent D | File Structure Setup | None |

#### Phase 2: HUB Implementation (Parallel per HUB)
| Agent | Task | Dependencies |
|-------|------|--------------|
| Agent E | HUB 1/4: Stat Ref | Phase 1 |
| Agent F | HUB 2/4: Analytics | Phase 1 |
| Agent G | HUB 3/4: eSports | Phase 1 |
| Agent H | HUB 4/4: Fantasy | Phase 1 |

#### Phase 3: Integration (Sequential)
| Agent | Task | Dependencies |
|-------|------|--------------|
| Agent I | Help HUB | Phase 2 |
| Agent J | Navigation Integration | Phase 2 |
| Agent K | Testing & QA | Phase 3 |

---

## STUB & PLACEHOLDER TRACKING

### Legend
- **IMPLEMENT:** Fully functional in this iteration
- **STUB:** Working structure with placeholder content
- **PLACEHOLDER:** Visual only, non-functional

### Implementation Status Matrix

| Component | NJZ | StatRef | Analytics | eSports | Fantasy | Help |
|-----------|-----|---------|-----------|---------|---------|------|
| Landing Page | IMPLEMENT | IMPLEMENT | IMPLEMENT | IMPLEMENT | IMPLEMENT | IMPLEMENT |
| Core Navigation | IMPLEMENT | IMPLEMENT | IMPLEMENT | IMPLEMENT | IMPLEMENT | IMPLEMENT |
| Data Display | - | IMPLEMENT | IMPLEMENT | IMPLEMENT | STUB | STUB |
| Search | - | STUB | STUB | STUB | - | - |
| User Auth | PLACEHOLDER | PLACEHOLDER | STUB | STUB | STUB | PLACEHOLDER |
| Member Features | - | - | STUB | STUB | STUB | - |
| Interactive Tools | - | STUB | STUB | STUB | STUB | STUB |
| Export Features | - | STUB | STUB | - | - | - |
| Admin/Dev Tools | - | - | - | - | - | STUB |

---

## QUALITY ASSURANCE CHECKLIST

### Accessibility
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Color contrast ratios

### Performance
- [ ] Lazy loading for images
- [ ] Code splitting per HUB
- [ ] Optimized CSS delivery
- [ ] Core Web Vitals targets

### SEO
- [ ] Meta tags per HUB
- [ ] Sitemap generation
- [ ] Structured data
- [ ] Canonical URLs

### Security
- [ ] Input sanitization
- [ ] XSS prevention
- [ ] CSRF protection (forms)
- [ ] Secure authentication (when implemented)

---

## TIMELINE ESTIMATE

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: Foundation | 2-3 days | Grid, Design System, Structure |
| Phase 2: HUBs | 5-7 days | 4 HUB implementations |
| Phase 3: Integration | 2-3 days | Help HUB, Navigation, QA |
| **Total** | **9-13 days** | **Complete Platform** |

---

## RISK ASSESSMENT

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep | High | Strict stub classification |
| Design inconsistency | Medium | Design system enforcement |
| Performance issues | Medium | Lazy loading, code splitting |
| Browser compatibility | Low | Progressive enhancement |

---

## APPROVAL SIGN-OFF

| Role | Name | Date | Status |
|------|------|------|--------|
| Foreman | Kimi Master | 2026-03-04 | ✅ Approved |
| Technical Lead | - | - | Pending |
| Design Lead | - | - | Pending |
| Product Owner | notbleaux | - | Pending |

---

*This plan is a living document. Updates will be tracked via PATCH reports.*
