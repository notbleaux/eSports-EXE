[Ver001.000]

# eSports-EXE — Sprint Backlog

**Date**: 2026-03-22  
**Status**: Active  
**Sprint Duration**: 2 weeks per sprint  
**Total Duration**: 8-12 weeks (5-6 sprints)

---

## Sprint 0: Foundation & Repo Audit
**Duration**: 3 days (pre-sprint)  
**Goal**: Clean repository, establish baseline, set up tooling

### Ticket S0-001: Repository Cleanup
**Priority**: P0 | **Assignee**: TBD | **Est**: 4h
- [ ] Archive legacy backend/simulation code to `archive/`
- [ ] Remove `__pycache__` and temp files
- [ ] Verify no sensitive docs in public paths
- [ ] Update `.gitignore` for new structure

**Acceptance Criteria**:
- `git status` shows clean working tree
- No operational docs in public-facing directories
- `archive/` contains legacy code with README explaining status

---

### Ticket S0-002: Design Token Integration
**Priority**: P0 | **Assignee**: TBD | **Est**: 3h
- [ ] Verify `ui/tokens.css` imports correctly
- [ ] Create per-hub CSS modifier classes
- [ ] Test color contrast ratios (≥4.5:1)

**Acceptance Criteria**:
- All hub accents pass WCAG AA contrast
- Tokens apply consistently across components
- Lighthouse accessibility score ≥80

---

### Ticket S0-003: Skeleton Pages Setup
**Priority**: P1 | **Assignee**: TBD | **Est**: 4h
- [ ] Create `pages/index.html` (home/marketing)
- [ ] Create `pages/hubs/analytics.html` (shell)
- [ ] Create `pages/hubs/events.html` (shell)
- [ ] Create `pages/hubs/ops.html` (shell)
- [ ] Create `pages/tenet/cs.html` (shell)
- [ ] Create `pages/tenet/valorant.html` (shell)

**Acceptance Criteria**:
- All pages load without 404s
- Hub selector navigation works between pages
- Each page has correct hub accent color applied

---

### Ticket S0-004: Tooling Setup
**Priority**: P1 | **Assignee**: TBD | **Est**: 2h
- [ ] Set up live reload dev server
- [ ] Configure build pipeline (Vite or plain)
- [ ] Set up pre-commit hooks (if not existing)

**Acceptance Criteria**:
- `npm run dev` starts local server
- Changes trigger auto-reload
- Build completes without errors

---

## Sprint 1: UI Foundation & Component Library
**Duration**: 2 weeks  
**Goal**: Implement core components, match viewer foundation

### Ticket S1-001: Tabs Component Implementation
**Priority**: P0 | **Assignee**: TBD | **Est**: 6h
- [ ] Implement HTML/CSS from `ui/components/tabs.html`
- [ ] Add JavaScript for tab switching
- [ ] Implement animated underline movement
- [ ] Add keyboard navigation (arrow keys, home/end)

**Acceptance Criteria**:
- Tab switching works with click and keyboard
- Underline animates smoothly (200ms)
- ARIA attributes update correctly
- Focus rings visible on keyboard navigation

---

### Ticket S1-002: Panel Component Implementation
**Priority**: P0 | **Assignee**: TBD | **Est**: 6h
- [ ] Implement Panel from `ui/components/panel.html`
- [ ] Add header slot with title and actions
- [ ] Implement hover elevation transform
- [ ] Add collapse/expand functionality

**Acceptance Criteria**:
- Panel renders with header, body, actions
- Hover raises panel by 6px with shadow
- Collapse/expand animates smoothly
- Works in responsive layouts

---

### Ticket S1-003: Timeline Component Implementation
**Priority**: P0 | **Assignee**: TBD | **Est**: 12h
- [ ] Implement timeline track with SVG
- [ ] Add scrubber handle with ARIA slider
- [ ] Implement event markers (different types)
- [ ] Add play/pause controls
- [ ] Implement zoom functionality (0.5x - 5x)

**Acceptance Criteria**:
- Scrubber draggable with mouse and keyboard
- Markers positioned correctly by tick
- Play button animates scrubber position
- Zoom changes visible time range
- ARIA labels announce tick position

---

### Ticket S1-004: MatchViewer Layout Implementation
**Priority**: P0 | **Assignee**: TBD | **Est**: 10h
- [ ] Implement 65/35 grid layout
- [ ] Add video/canvas placeholder
- [ ] Create KPI row component
- [ ] Implement event list sidebar
- [ ] Add responsive breakpoint (900px)

**Acceptance Criteria**:
- Layout maintains proportions at 1400px+ width
- Stacks vertically below 900px
- Video placeholder fills canvas area
- KPI cards display match metadata
- Event list scrolls independently

---

### Ticket S1-005: Top Navigation Component
**Priority**: P1 | **Assignee**: TBD | **Est**: 6h
- [ ] Create global top nav
- [ ] Implement hub selector dropdown
- [ ] Add user menu placeholder
- [ ] Show active hub accent color

**Acceptance Criteria**:
- Nav appears on all pages
- Hub selector shows current hub
- Dropdown lists all available hubs
- Active hub highlighted with accent

---

### Ticket S1-006: Demo JSON API Setup
**Priority**: P1 | **Assignee**: TBD | **Est**: 4h
- [ ] Create `public/api/demo/` structure
- [ ] Add `matches.json` endpoint
- [ ] Add `matches/{id}.json` endpoint
- [ ] Add `players/{id}.json` endpoint
- [ ] Add `hubs.json` endpoint

**Acceptance Criteria**:
- All endpoints return valid JSON
- Data matches schema in TECH_DESIGN docs
- CORS headers allow local development
- No 404s for demo data requests

---

## Sprint 2: Analytics Hub & Match Viewer
**Duration**: 2 weeks  
**Goal**: Complete Analytics Hub MVP with working match viewer

### Ticket S2-001: Analytics Hub Layout
**Priority**: P0 | **Assignee**: TBD | **Est**: 8h
- [ ] Implement hero section with hub chip
- [ ] Create KPI row with 4 cards
- [ ] Add main panel stack (Overview, Viewer, Heatmap)
- [ ] Implement context column (filters, saved views)

**Acceptance Criteria**:
- Layout matches `wireframes/analytics.svg`
- KPI cards show mock data with sparklines
- Panels stack correctly in responsive view
- Filters sidebar collapses on mobile

---

### Ticket S2-002: KPI Card Component
**Priority**: P0 | **Assignee**: TBD | **Est**: 6h
- [ ] Create KPI card with number display
- [ ] Add sparkline SVG visualization
- [ ] Implement delta badge (positive/negative)
- [ ] Add hover state with mini chart

**Acceptance Criteria**:
- Card displays value, label, trend
- Sparkline renders from data array
- Delta badge shows ▲ or ▼ with color
- Hover reveals larger chart popover

---

### Ticket S2-003: Match List Panel
**Priority**: P0 | **Assignee**: TBD | **Est**: 8h
- [ ] Create sortable match table
- [ ] Add compare checkboxes
- [ ] Implement quick filter chips
- [ ] Connect to `/api/demo/matches` endpoint

**Acceptance Criteria**:
- Table sorts by date, score, duration
- Checkbox selects matches for compare
- Filter chips update visible rows
- Data loads from demo JSON

---

### Ticket S2-004: Match Viewer Integration
**Priority**: P0 | **Assignee**: TBD | **Est**: 12h
- [ ] Wire timeline to match data
- [ ] Add event filter chips above timeline
- [ ] Implement event marker click → seek
- [ ] Connect to `replay-001.json` demo data

**Acceptance Criteria**:
- Timeline shows correct match duration
- Event markers positioned by tick
- Clicking marker seeks to that tick
- Filter chips toggle marker visibility

---

### Ticket S2-005: Context Column Components
**Priority**: P1 | **Assignee**: TBD | **Est**: 6h
- [ ] Create filter components (team, map, player)
- [ ] Implement saved views list
- [ ] Add quick action buttons (Export, Snapshot)

**Acceptance Criteria**:
- Filters update match list in real-time
- Saved views can be named and recalled
- Export button generates CSV/JSON

---

## Sprint 3: Events & Ops Hubs
**Duration**: 2 weeks  
**Goal**: Complete Events and Ops hub implementations

### Ticket S3-001: Events Hub Layout
**Priority**: P0 | **Assignee**: TBD | **Est**: 8h
- [ ] Implement hero with featured match
- [ ] Create calendar component (day/week/month)
- [ ] Add match cards in calendar cells
- [ ] Implement event page panel

**Acceptance Criteria**:
- Calendar toggles between views
- Match cards show status badges
- Featured match card prominent
- Matches clickable to event page

---

### Ticket S3-002: Calendar Component
**Priority**: P0 | **Assignee**: TBD | **Est**: 12h
- [ ] Implement month view grid
- [ ] Add week view with time slots
- [ ] Create day view with hourly breakdown
- [ ] Add navigation (prev/next, today)

**Acceptance Criteria**:
- Month view shows 35-42 cells
- Week view shows 7 days × 24 hours
- Day view shows detailed schedule
- Navigation updates view correctly

---

### Ticket S3-003: Event Creation Flow
**Priority**: P1 | **Assignee**: TBD | **Est**: 8h
- [ ] Create event form modal
- [ ] Add date/time picker
- [ ] Implement roster management
- [ ] Add sponsor banner upload placeholder

**Acceptance Criteria**:
- Form validates required fields
- Event saves to local storage (demo)
- Created event appears in calendar
- Roster shows player list

---

### Ticket S3-004: Ops Hub Layout
**Priority**: P0 | **Assignee**: TBD | **Est**: 8h
- [ ] Implement status banner
- [ ] Create status tiles (pipeline, queue, latency)
- [ ] Add replay queue table
- [ ] Implement logs panel

**Acceptance Criteria**:
- Layout matches `wireframes/ops.svg`
- Status tiles show color-coded states
- Queue table lists replays with actions
- Logs panel shows recent entries

---

### Ticket S3-005: Status Tile Component
**Priority**: P0 | **Assignee**: TBD | **Est**: 6h
- [ ] Create tile with icon, value, label
- [ ] Implement color states (healthy/warning/error)
- [ ] Add trend indicator
- [ ] Implement pulse animation for critical

**Acceptance Criteria**:
- Tile shows correct icon per metric
- Color updates based on threshold
- Trend shows ▲/▼ with value
- Critical state pulses visibly

---

### Ticket S3-006: Replay Queue Table
**Priority**: P1 | **Assignee**: TBD | **Est**: 6h
- [ ] Create table with ID, status, size columns
- [ ] Add action buttons (view, retry, delete)
- [ ] Implement status badges (done/processing/failed)
- [ ] Add bulk action bar

**Acceptance Criteria**:
- Table sorts by status and date
- Actions trigger appropriate handlers
- Failed items show retry button
- Bulk actions apply to selected rows

---

## Sprint 4: TeNET Tools (CS & Valorant)
**Duration**: 2 weeks  
**Goal**: Implement one TeNET tool per sub-hub

### Ticket S4-001: TeNET CS Hub Layout
**Priority**: P0 | **Assignee**: TBD | **Est**: 8h
- [ ] Implement hero with map selector
- [ ] Create round table panel
- [ ] Add grenade visualizer panel
- [ ] Implement training playlist panel

**Acceptance Criteria**:
- Layout matches `wireframes/tenet-cs.svg`
- Map selector shows available maps
- Round table shows compact stats
- Visualizer panel has canvas area

---

### Ticket S4-002: Grenade Visualizer Canvas
**Priority**: P0 | **Assignee**: TBD | **Est**: 16h
- [ ] Implement HTML5 Canvas renderer
- [ ] Add map background image loading
- [ ] Create Bézier arc drawing (per TECH_DESIGN)
- [ ] Implement coordinate transform (world→radar)
- [ ] Add grenade markers (start/end positions)

**Acceptance Criteria**:
- Canvas renders at 60fps
- Arcs follow ballistic trajectory
- Map image scales correctly
- Markers positioned accurately
- Performance: ≤50 arcs at 60fps

---

### Ticket S4-003: Grenade Timeline Integration
**Priority**: P0 | **Assignee**: TBD | **Est**: 10h
- [ ] Add tick-accurate scrubber
- [ ] Implement arc visibility by time
- [ ] Add detonation effects
- [ ] Create event filter (smoke/flash/HE/molotov)

**Acceptance Criteria**:
- Scrubber seeks to specific tick
- Arcs animate along timeline
- Detonation shows at correct tick
- Filters toggle arc types

---

### Ticket S4-004: Round Table Component
**Priority**: P1 | **Assignee**: TBD | **Est**: 6h
- [ ] Create compact round rows
- [ ] Add win/loss indicators
- [ ] Show economy data
- [ ] Implement click to seek replay

**Acceptance Criteria**:
- Table shows 24 rounds compactly
- Win/loss color-coded (green/red)
- Economy shows team money
- Click jumps to round start

---

### Ticket S4-005: TeNET Valorant Hub Layout
**Priority**: P0 | **Assignee**: TBD | **Est**: 8h
- [ ] Implement hero with agent selector
- [ ] Create ability timeline panel
- [ ] Add site control heatmap panel
- [ ] Implement agent profiles panel

**Acceptance Criteria**:
- Layout matches `wireframes/tenet-valorant.svg`
- Agent selector shows all agents
- Timeline panel has lane structure
- Heatmap shows site occupancy

---

### Ticket S4-006: Ability Timeline Lanes
**Priority**: P0 | **Assignee**: TBD | **Est**: 14h
- [ ] Implement virtualized lane rendering
- [ ] Create ability markers (SVG)
- [ ] Add agent color coding
- [ ] Implement zoom and pan

**Acceptance Criteria**:
- 10 agent lanes render smoothly
- Markers color-coded by agent
- Zoom 0.1x-10x with smooth transition
- Pan navigates time range
- Performance: ≤200 events at 60fps

---

### Ticket S4-007: Site Control Heatmap
**Priority**: P1 | **Assignee**: TBD | **Est**: 10h
- [ ] Create radar-style widget
- [ ] Implement control ratio bars
- [ ] Add attacker/defender counts
- [ ] Show smoke coverage indicator

**Acceptance Criteria**:
- Widget shows A/B/C sites
- Control bar fills by percentage
- Badge shows controlling team
- Updates as timeline scrubs

---

## Sprint 5: Polish, Accessibility & Deploy
**Duration**: 2 weeks  
**Goal**: Production-ready release

### Ticket S5-001: Accessibility Audit
**Priority**: P0 | **Assignee**: TBD | **Est**: 12h
- [ ] Keyboard navigation test (all interactive elements)
- [ ] Screen reader test (NVDA or VoiceOver)
- [ ] Color contrast verification
- [ ] Focus management audit
- [ ] ARIA landmark review

**Acceptance Criteria**:
- All interactive elements keyboard accessible
- Screen reader announces state changes
- Contrast ≥4.5:1 everywhere
- Focus visible and logical
- Lighthouse a11y score ≥90

---

### Ticket S5-002: Performance Optimization
**Priority**: P0 | **Assignee**: TBD | **Est**: 10h
- [ ] Lazy load replay data
- [ ] Optimize images (WebP, responsive)
- [ ] Code-split by hub
- [ ] Add service worker for caching

**Acceptance Criteria**:
- First Contentful Paint <1.5s
- Time to Interactive <3s
- Lighthouse performance ≥80
- Replays lazy load on demand

---

### Ticket S5-003: Mobile Responsiveness
**Priority**: P0 | **Assignee**: TBD | **Est**: 10h
- [ ] Test all breakpoints (320px, 768px, 1024px, 1400px+)
- [ ] Fix layout issues on small screens
- [ ] Optimize touch targets (≥44px)
- [ ] Test timeline scrubber on touch

**Acceptance Criteria**:
- No horizontal scroll at any width
- Touch targets meet WCAG guidelines
- Timeline usable on mobile
- Hub selector works on small screens

---

### Ticket S5-004: Cross-browser Testing
**Priority**: P1 | **Assignee**: TBD | **Est**: 6h
- [ ] Test Chrome/Edge
- [ ] Test Firefox
- [ ] Test Safari (macOS)
- [ ] Test Safari (iOS)

**Acceptance Criteria**:
- Functional in all target browsers
- Visual consistency across browsers
- No console errors

---

### Ticket S5-005: GitHub Pages Deploy
**Priority**: P0 | **Assignee**: TBD | **Est**: 6h
- [ ] Configure GitHub Actions workflow
- [ ] Set up build pipeline
- [ ] Configure custom domain (optional)
- [ ] Add deploy status badge

**Acceptance Criteria**:
- Push to main triggers deploy
- Site live at github.io domain
- All assets load correctly
- Demo API endpoints functional

---

### Ticket S5-006: Documentation & README
**Priority**: P1 | **Assignee**: TBD | **Est**: 6h
- [ ] Update main README with setup instructions
- [ ] Document component usage
- [ ] Add troubleshooting guide
- [ ] Create contributing guidelines

**Acceptance Criteria**:
- README has quick start section
- Component docs have prop tables
- Troubleshooting covers common issues
- Contributing guide clear and concise

---

## Backlog (Post-MVP)

### Future Tickets
| ID | Title | Priority |
|----|-------|----------|
| B-001 | User accounts (GitHub OAuth) | P1 |
| B-002 | Saved views persistence | P1 |
| B-003 | CSV/JSON export | P2 |
| B-004 | Embed snippets for matches | P2 |
| B-005 | Social sharing snapshots | P2 |
| B-006 | Third-party demo SDK | P3 |
| B-007 | PWA support | P3 |
| B-008 | Clip creation tools | P3 |
| B-009 | Per-hub telemetry | P2 |
| B-010 | Community theming API | P3 |

---

## Sprint Velocity Tracking

| Sprint | Planned | Completed | Velocity |
|--------|---------|-----------|----------|
| Sprint 0 | 13h | - | - |
| Sprint 1 | 44h | - | - |
| Sprint 2 | 40h | - | - |
| Sprint 3 | 46h | - | - |
| Sprint 4 | 62h | - | - |
| Sprint 5 | 50h | - | - |
| **Total** | **255h** | - | - |

---

## Definition of Done (All Tickets)

- [ ] Code implemented and tested locally
- [ ] Acceptance criteria met
- [ ] No console errors or warnings
- [ ] Responsive at all breakpoints
- [ ] Keyboard accessible
- [ ] Committed with conventional commit message
- [ ] PR reviewed and merged

---

*Backlog maintained by: Product Lead*  
*Last updated: 2026-03-22*
