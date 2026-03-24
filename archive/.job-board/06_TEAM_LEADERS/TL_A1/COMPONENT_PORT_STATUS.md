[Ver001.000]

# Component Port Status — HTML to React
**TL:** TL-A1  
**Source:** `ui/components/*.html`  
**Target:** `apps/website-v2/src/components/help/`  
**Status:** Phase 0 Assessment Complete

---

## COMPONENT INVENTORY

| # | HTML Source | React Target | Complexity | Priority | Status | Assignee |
|---|-------------|--------------|------------|----------|--------|----------|
| 1 | `match-header.html` | `MatchHeader.tsx` | Medium | P2 | ⏳ Ready | TBD |
| 2 | `matchviewer.html` | `MatchViewer.tsx` | High | P2 | ⏳ Ready | TBD |
| 3 | `panel.html` | `Panel.tsx` | Low | P1 | ⏳ Ready | TBD |
| 4 | `tabs.html` | — | — | — | ✅ Exists | TENET/ui/composite/Tabs.tsx |
| 5 | `timeline.html` | `Timeline.tsx` | High | P1 | ⏳ Ready | TBD |
| 6 | `smart-panels.html` | `SmartPanels.tsx` | High | P1 | ⏳ Ready | TBD |
| 7 | `unified-timeline.html` | `UnifiedTimeline.tsx` | High | P1 | ⏳ Ready | TBD |

---

## COMPONENT SPECIFICATIONS

### 1. MatchHeader Component

**Source:** `ui/components/match-header.html`

**Features to Port:**
- Dual mode support (Fan vs Analyst)
- Live indicator with pulse animation
- Team display (left/right alignment)
- Score display with large typography
- Mode toggle buttons
- Responsive design (mobile stack)

**ARIA Requirements:**
- `role="status"` for live indicator
- `aria-live="polite"` for score updates
- Keyboard accessible toggle buttons

**Props Interface:**
```typescript
interface MatchHeaderProps {
  teamA: Team;
  teamB: Team;
  status: 'upcoming' | 'live' | 'completed';
  mode: 'fan' | 'analyst';
  onModeChange: (mode: 'fan' | 'analyst') => void;
  matchMeta: {
    event: string;
    stage: string;
    format: string;
  };
}
```

**Estimated Effort:** 4 hours

---

### 2. MatchViewer Component

**Source:** `ui/components/matchviewer.html`

**Features to Port:**
- Two-column layout (video + sidebar)
- Responsive grid (single column on mobile)
- Video/canvas placeholder area
- Compact timeline with event markers
- Event list with icons and metadata
- Score display panel
- Player stats mini-panel

**ARIA Requirements:**
- `role="application"` for viewer
- `aria-label="Match viewer"`
- Event list as `role="list"`
- Timeline as `role="slider"`

**Props Interface:**
```typescript
interface MatchViewerProps {
  videoUrl?: string;
  events: TimelineEvent[];
  score: { teamA: number; teamB: number };
  stats: MatchStats;
  onEventClick: (event: TimelineEvent) => void;
  onTimeChange: (time: number) => void;
}
```

**Estimated Effort:** 6 hours

---

### 3. Panel Component

**Source:** `ui/components/panel.html`

**Features to Port:**
- Card container with header/body structure
- Hover animation (lift + shadow)
- KPI row with trend indicators
- Match list with items
- Header actions (buttons)
- Sparkline placeholder (for future charts)

**ARIA Requirements:**
- `aria-labelledby` for panel title
- `section` element with role
- Focus visible on interactive elements

**Props Interface:**
```typescript
interface PanelProps {
  title: string;
  titleId?: string;
  actions?: React.ReactNode;
  hoverable?: boolean;
  children: React.ReactNode;
  className?: string;
}

interface KpiCardProps {
  value: string | number;
  label: string;
  trend?: { value: number; direction: 'up' | 'down' };
}
```

**Estimated Effort:** 3 hours

---

### 4. Tabs Component

**Status:** ✅ ALREADY EXISTS

**Location:** `apps/website-v2/src/components/TENET/ui/composite/Tabs.tsx`

**Assessment:** Full-featured implementation with:
- 4 variants (line, enclosed, soft-rounded, solid-rounded)
- 3 sizes (sm, md, lg)
- Full ARIA support
- Keyboard navigation
- Controlled/uncontrolled modes

**Action Required:** None — use existing component

---

### 5. Timeline Component

**Source:** `ui/components/timeline.html`

**Features to Port:**
- Timeline track with gradient background
- Event markers (kill, ability, plant, defuse)
- Tooltip on marker hover
- Range scrubber input
- Filter chips with toggle state
- Play/pause controls
- Current time display
- Event filter selection

**ARIA Requirements:**
- `role="region"` with `aria-label="Match timeline"`
- Scrubber as `role="slider"`
- Control buttons with descriptive labels

**Props Interface:**
```typescript
interface TimelineProps {
  duration: number;          // seconds
  currentTime: number;
  markers: TimelineMarker[];
  filters: FilterOption[];
  activeFilters: string[];
  isPlaying: boolean;
  onTimeChange: (time: number) => void;
  onPlayPause: () => void;
  onFilterToggle: (filterId: string) => void;
  onMarkerClick: (marker: TimelineMarker) => void;
}

interface TimelineMarker {
  time: number;
  type: 'kill' | 'ability' | 'plant' | 'defuse';
  tooltip: string;
}
```

**Estimated Effort:** 6 hours

---

### 6. SmartPanels Component

**Source:** `ui/components/smart-panels.html`

**Features to Port:**
- 12-column CSS Grid layout
- Panel states: default, collapsed, floating, pinned
- Draggable headers (when floating)
- Resize handles (SE corner)
- Panel actions: pin, float, collapse
- Grid positioning classes (col-3, col-4, etc.)
- Responsive breakpoints (12→6→1 columns)
- Snap grid overlay (for drag positioning)

**ARIA Requirements:**
- `aria-expanded` for collapsed panels
- `aria-pressed` for pin/float states
- Drag handles with `aria-grabbed`
- Keyboard shortcuts for panel actions

**Props Interface:**
```typescript
interface SmartPanelsProps {
  panels: PanelConfig[];
  onPanelMove: (id: string, position: Position) => void;
  onPanelResize: (id: string, size: Size) => void;
  onPanelStateChange: (id: string, state: PanelState) => void;
}

interface PanelConfig {
  id: string;
  title: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  gridPosition: { col: number; row: number };
  gridSpan: { col: number; row: number };
  state: PanelState;
}

type PanelState = 'normal' | 'collapsed' | 'floating' | 'pinned';
```

**Estimated Effort:** 8 hours

---

### 7. UnifiedTimeline Component

**Source:** `ui/components/unified-timeline.html`

**Features to Port:**
- Timeline container with header
- Event filter buttons (All, Kills, Utility, Objectives)
- Main track with progress bar
- Scrubber handle (draggable)
- Event markers (kill, objective, utility, round)
- Event cards row (horizontal scroll)
- Playback controls (play, time display, speed)
- Linked visualizations indicator
- Reduced motion support

**ARIA Requirements:**
- `role="slider"` for scrubber
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Event cards with `role="listitem"`
- Speed controls as `role="radiogroup"`

**Props Interface:**
```typescript
interface UnifiedTimelineProps {
  round: number;
  duration: number;
  currentTime: number;
  markers: UnifiedMarker[];
  events: EventCard[];
  activeFilters: string[];
  playbackSpeed: number;
  isPlaying: boolean;
  linkedVisualizations: string[];
  onScrub: (time: number) => void;
  onPlayPause: () => void;
  onSpeedChange: (speed: number) => void;
  onFilterChange: (filters: string[]) => void;
  onEventCardClick: (event: EventCard) => void;
}

interface UnifiedMarker {
  time: number;
  type: 'kill' | 'objective' | 'utility' | 'round';
  title: string;
}
```

**Estimated Effort:** 8 hours

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation (Week 1)

| Day | Components | Hours | Owner |
|-----|------------|-------|-------|
| 1 | Panel (base), SmartPanels (grid) | 11 | TL-A1 |
| 2 | Timeline, UnifiedTimeline | 14 | TL-A1 + 1-B |
| 3 | MatchHeader, MatchViewer | 10 | 1-B + 1-C |

### Phase 2: Integration (Week 2)

- Connect components with help system context
- Add expertise-based progressive disclosure
- Implement keyboard navigation throughout
- ARIA testing and validation

---

## STYLING APPROACH

### Tailwind Migration

All components will use Tailwind CSS classes:

```css
/* Original CSS variables → Tailwind classes */
var(--surface)         → bg-gray-50 dark:bg-gray-800
var(--text)            → text-gray-900 dark:text-white
var(--text-muted)      → text-gray-500
var(--accent)          → text-primary-500 bg-primary-500
var(--radius-lg)       → rounded-lg
var(--spacing-4)       → p-4 / gap-4 / m-4
var(--shadow-card)     → shadow-md
var(--motion-fast)     → transition-all duration-200
```

### Custom CSS (Minimal)

Only for complex animations not covered by Tailwind:

```css
/* Pulse animation for live indicator */
@keyframes pulse-live { ... }

/* Range input styling */
.timeline-scrub::-webkit-slider-thumb { ... }

/* Dragging states */
.panel--dragging { cursor: grabbing; }
```

---

## TESTING REQUIREMENTS

### Unit Tests (Jest/Vitest)

- Component renders without errors
- Props are properly passed and validated
- Event handlers fire correctly
- State changes trigger re-renders

### Integration Tests

- Keyboard navigation works end-to-end
- ARIA attributes are correct
- Responsive breakpoints trigger correctly
- Component interactions (drag, resize) work

### Accessibility Tests (axe-core)

- No ARIA violations
- Color contrast meets WCAG 2.1 AA
- Focus management works correctly
- Screen reader announcements appropriate

---

## CURRENT STATUS SUMMARY

| Phase | Progress | Status |
|-------|----------|--------|
| Assessment | 100% | ✅ Complete |
| Specification | 100% | ✅ Complete |
| Implementation | 0% | ⏳ Ready to start |
| Testing | 0% | ⏳ Pending |
| Documentation | 50% | 🔄 In progress |

---

## NEXT ACTIONS

1. **TL-A1:** Begin Panel component (foundation)
2. **TL-A1:** Set up `apps/website-v2/src/components/help/` directory
3. **TL-A1:** Create shared types file
4. **1-B & 1-C:** Begin schema work while components in progress

---

*Assessment completed by TL-A1 / March 23, 2026*
