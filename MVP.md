[Ver001.000]

# eSports-EXE — MVP Specification
## Public Demo Site + Minimal Platform Surface

**Project**: eSports-EXE — 4NJZ4 TENET Platform  
**Goal**: Launch a free, public, read-only demonstration of core platform value: match viewer + hubbed dashboards + marketing site.  
**Hosting**: Static (GitHub Pages / Cloudflare Pages) with serverless JSON endpoints for demo data.  
**Status**: Draft  
**Last Updated**: 2026-03-22  

---

## Scope (Priority Order)

| Priority | Feature | Description |
|----------|---------|-------------|
| P0 | **Marketing Site** | Home, About, Roadmap, Contact pages |
| P0 | **Match Viewer Demo** | Replay canvas, timeline scrub, event markers, contextual side panel |
| P0 | **Hubs Shell** | Tabbed hub container with three sample hubs (Analytics, Events, Replays) |
| P1 | **API Stubs** | Read-only JSON files under `/data/` |
| P1 | **Design System** | `ui/tokens.css`, `ui/components/*` |

---

## Demo Data Endpoints (Static JSON)

### GET `/data/matches.json`
List of matches with metadata.

```json
{
  "matches": [
    {
      "id": "match-2026-03-22-01",
      "teams": ["Red Ravens", "Blue Bastion"],
      "score": { "red": 2, "blue": 1 },
      "date": "2026-03-22T08:30:00Z",
      "replayId": "replay-001",
      "status": "completed",
      "map": "Ascent",
      "tournament": "VCT Masters"
    }
  ]
}
```

### GET `/data/replays/{replayId}.json`
Replay metadata with timeline events.

```json
{
  "id": "replay-001",
  "matchId": "match-2026-03-22-01",
  "duration": 2456,
  "keyframes": [
    { "timestamp": 0, "type": "round_start", "data": { "round": 1 } }
  ],
  "events": [
    {
      "timestamp": 124,
      "type": "kill",
      "player": "TenZ",
      "target": "Opponent",
      "weapon": "Vandal",
      "position": { "x": 0.65, "y": 0.32 }
    }
  ],
  "teams": {
    "red": { "players": [...], "score": 2 },
    "blue": { "players": [...], "score": 1 }
  }
}
```

### GET `/data/events.json`
Event catalog for timeline markers.

```json
{
  "eventTypes": [
    { "id": "kill", "label": "Kill", "color": "#FF5C5C", "icon": "crosshair" },
    { "id": "ability", "label": "Ability Used", "color": "#00C8FF", "icon": "zap" },
    { "id": "plant", "label": "Spike Planted", "color": "#FFB86B", "icon": "target" },
    { "id": "defuse", "label": "Spike Defused", "color": "#00C48C", "icon": "shield" }
  ]
}
```

### GET `/data/hubs.json`
Hub definitions and configuration.

```json
{
  "hubs": [
    {
      "id": "analytics",
      "name": "Analytics Hub",
      "accent": "#00C8FF",
      "description": "Match statistics and performance metrics",
      "defaultTab": "overview",
      "tabs": ["overview", "players", "rounds", "economy"]
    },
    {
      "id": "events",
      "name": "Events Hub",
      "accent": "#FFB86B",
      "description": "Live and upcoming tournament events",
      "defaultTab": "live",
      "tabs": ["live", "upcoming", "results", "schedule"]
    },
    {
      "id": "replays",
      "name": "Replays Hub",
      "accent": "#8A6CFF",
      "description": "Match replays and VOD review",
      "defaultTab": "library",
      "tabs": ["library", "bookmarks", "shared"]
    }
  ]
}
```

---

## Acceptance Criteria

### Deployable
- [ ] Site builds successfully (`npm run build` or equivalent)
- [ ] Deploys to GitHub Pages or Cloudflare Pages from `main` branch
- [ ] Custom domain or `username.github.io/esports-exe` works

### Match Viewer
- [ ] Loads `/data/replays/replay-001.json` successfully
- [ ] Renders replay canvas (placeholder or actual)
- [ ] Displays timeline with scrub control
- [ ] Shows event markers at correct timestamps
- [ ] Side panel updates on scrub or marker click

### Hubs
- [ ] Tabbed hub container renders correctly
- [ ] Tab switching triggers animated panel transition (200-300ms)
- [ ] Each hub uses its distinct accent color
- [ ] Default tab loads correctly per hub

### Design System
- [ ] `ui/tokens.css` contains all CSS variables (colors, type, spacing, motion)
- [ ] Components consume tokens (not hardcoded values)
- [ ] Components: Tabs, Panels, DataCard, Button, Timeline

### Performance
- [ ] Lighthouse performance score ≥ 70 on mobile
- [ ] First Meaningful Paint < 2.5s on demo data
- [ ] Bundle size < 200KB initial

### Accessibility
- [ ] Keyboard navigable tabs (arrow keys, Enter, Space)
- [ ] Focus states visible (3px solid accent or equivalent)
- [ ] Color contrast ≥ 4.5:1 for body text
- [ ] Semantic HTML (nav, main, article, button vs div)

---

## File Structure

```
├── MVP.md                    # This file
├── README.md                 # Updated with deploy instructions
├── site/                     # Static app (React/Vite or HTML+JS)
│   ├── index.html
│   ├── about.html
│   ├── roadmap.html
│   ├── contact.html
│   ├── hub.html              # Hub shell with routing
│   ├── match.html            # Match viewer
│   ├── css/
│   │   └── tokens.css        # Design tokens
│   ├── components/
│   │   ├── Tabs.js
│   │   ├── Panel.js
│   │   ├── DataCard.js
│   │   ├── Button.js
│   │   └── Timeline.js
│   └── js/
│       └── app.js
├── data/                     # Static JSON endpoints
│   ├── matches.json
│   ├── events.json
│   ├── hubs.json
│   └── replays/
│       └── replay-001.json
└── .github/
    └── workflows/
        └── deploy.yml        # GitHub Pages deployment
```

---

## Tech Stack Options

### Option A: React + Vite (Recommended)
- **Pros**: Component model, HMR, large ecosystem
- **Cons**: Larger bundle, needs JS enabled
- **Build**: `vite build` → `dist/` → GitHub Pages

### Option B: Astro (Static Site)
- **Pros**: Zero JS by default, partial hydration, fast
- **Cons**: Newer framework, learning curve
- **Build**: `astro build` → `dist/` → GitHub Pages

### Option C: Plain HTML + CSS + JS
- **Pros**: Maximum simplicity, no build step
- **Cons**: Manual component repetition
- **Build**: Direct deploy of static files

**Recommendation**: Start with **React + Vite** for component reusability, migrate to Astro later if performance demands it.

---

## Deliverables Checklist

### Design
- [ ] `STYLE_BRIEF.md` approved and in repo
- [ ] Figma mockups (Landing, Hub shell, Match viewer)
- [ ] Component library documented

### Data
- [ ] `data/matches.json` (5+ sample matches)
- [ ] `data/replays/replay-001.json` (complete replay)
- [ ] `data/events.json` (event type catalog)
- [ ] `data/hubs.json` (3 hub definitions)

### Code
- [ ] `site/` directory with working app
- [ ] `ui/tokens.css` with all design tokens
- [ ] `ui/components/` with base components
- [ ] GitHub Actions workflow for deployment

### Documentation
- [ ] `README.md` with deploy instructions
- [ ] `MVP.md` (this file)
- [ ] Changelog or release notes

---

## Timeline Estimate

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Setup | 2 days | Repo structure, build pipeline, deploy |
| Data | 1 day | JSON files, sample data |
| Design System | 2 days | Tokens, base components |
| Marketing Site | 2 days | Home, About, Roadmap, Contact |
| Hubs Shell | 3 days | Tabbed container, routing |
| Match Viewer | 4 days | Canvas, timeline, side panel |
| Polish | 2 days | A11y, perf, bug fixes |
| **Total** | **16 days (~3 weeks)** | **Complete MVP** |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep | High | Strict P0/P1 boundary; defer non-essential features |
| Data complexity | Medium | Use simplified demo data; real API integration post-MVP |
| Performance issues | Medium | Optimize images, lazy load, code split |
| Browser compatibility | Low | Test on Chrome, Firefox, Safari; use polyfills if needed |

---

## Post-MVP Features (Not in Scope)

- User authentication and accounts
- Real-time WebSocket data
- Actual video replay streaming
- Backend API integration
- Mobile native app
- Advanced analytics visualizations
- Community features (comments, forums)

---

*Document Version: [Ver001.000]*  
*Next Review: After design phase approval*  
*Owner: Product Manager / Foreman Agent*
