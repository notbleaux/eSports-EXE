[Ver002.000]

# eSports-EXE — MVP Specification v2
## One-Page MVP Spec: Public Demo and Marketing Site

**Project**: eSports-EXE public demo and marketing site  
**Objective**: Ship a free-hosted, production-quality public presence that demonstrates core platform value (match replay + hub panels) and a reusable visual system.  
**Date**: 2026-03-22  
**Status**: Approved for Development  

---

## Scope

| Module | Features |
|--------|----------|
| **Marketing Site** | Home, About, Roadmap, Contact, Docs index |
| **Demo App** | Read-only Match Viewer with timeline scrubber, event markers, contextual side panel |
| **API Stubs** | Static JSON endpoints to feed demo (matches, players, events) |
| **Design System** | Tokens, typography, color, panels, tabs, data cards |
| **Deployment** | GitHub Pages or Cloudflare Pages from main branch |

---

## API Endpoints (Demo Stubs)

### GET /api/demo/matches
List of demo matches.

```json
{
  "matches": [
    {
      "id": "m-001",
      "title": "EXE Cup — Finals",
      "date": "2026-03-01",
      "hub": "analytics",
      "duration": 3600,
      "thumbnail": "/img/m-001.jpg"
    }
  ]
}
```

### GET /api/demo/matches/{id}
Match details with timeline.

```json
{
  "id": "m-001",
  "teams": ["Alpha", "Beta"],
  "score": { "Alpha": 3, "Beta": 2 },
  "timeline": [
    { "t": 12, "type": "kill", "actor": "player-7", "meta": {} }
  ],
  "replayUrl": "/replays/m-001.json"
}
```

### GET /api/demo/players/{id}
Player profile.

```json
{
  "id": "player-7",
  "name": "TenZ",
  "avatar": "/avatars/player-7.jpg",
  "stats": { "kills": 24, "deaths": 14, "assists": 5 }
}
```

### GET /api/demo/hubs
Hub definitions.

```json
{
  "hubs": [
    {
      "id": "analytics",
      "name": "Analytics Hub",
      "accentColor": "#00D1FF",
      "description": "Match statistics and performance metrics"
    }
  ]
}
```

---

## Acceptance Criteria

### Deployable Site
- [ ] Public URL with marketing pages and demo app
- [ ] GitHub Pages or Cloudflare Pages deployment from `main`
- [ ] Custom domain or `username.github.io/esports-exe` works

### Match Viewer
- [ ] Loads demo match from `/api/demo/matches/{id}`
- [ ] Plays scrub timeline with smooth interaction
- [ ] Displays event markers at correct timestamps
- [ ] Updates side panel on event selection
- [ ] Responsive layout (works on tablet and desktop)

### Design System
- [ ] CSS variables for all design tokens (colors, type, spacing, motion)
- [ ] Components implemented:
  - [ ] Tabs (animated underline, per-hub accent)
  - [ ] Panels (header, KPI row, body, actions)
  - [ ] Data Cards (title, KPI, sparkline, CTA)
  - [ ] Buttons (primary, secondary, ghost)
- [ ] Components documented with usage examples

### Performance
- [ ] First Contentful Paint under 1.5s on 3G emulation
- [ ] Lighthouse Performance score ≥ 80
- [ ] Bundle size < 150KB initial

### Accessibility
- [ ] Keyboard operable hub tabs (arrow keys, Enter, Space)
- [ ] Color contrast ≥ 4.5:1 for body text
- [ ] Focus ring visible and consistent (3px solid accent)
- [ ] Semantic HTML (nav, main, article, button vs div)
- [ ] Screen reader labels for interactive elements

### Security
- [ ] No sensitive runbooks or secrets in public repo
- [ ] `SECURITY.md` present with contact information
- [ ] `.env.example` without real credentials

---

## File Structure

```
├── MVP_v2.md                 # This file
├── STYLE_BRIEF_v2.md         # Visual style brief
├── CRIT_TEMPLATE_v2.md       # Review session template
├── README.md                 # Updated with deploy instructions
├── SECURITY.md               # Security policy
├── site/                     # Static app (Next.js/Astro)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Tabs.tsx
│   │   │   ├── Panel.tsx
│   │   │   ├── DataCard.tsx
│   │   │   ├── Button.tsx
│   │   │   └── MatchViewer.tsx
│   │   ├── styles/
│   │   │   └── tokens.css    # Design tokens
│   │   ├── pages/
│   │   │   ├── index.tsx     # Home
│   │   │   ├── about.tsx
│   │   │   ├── roadmap.tsx
│   │   │   ├── contact.tsx
│   │   │   ├── docs.tsx      # Docs index
│   │   │   └── demo/
│   │   │       └── match.tsx # Match viewer
│   │   └── lib/
│   │       └── api.ts        # API client
│   └── public/
│       └── api/demo/         # Static JSON endpoints
│           ├── matches.json
│           ├── matches/
│           │   └── m-001.json
│           ├── players/
│           │   └── player-7.json
│           └── hubs.json
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Pages deployment
└── package.json
```

---

## Quick Deliverables and Timeline

### Week 0: Repo Prune + README Index
- [ ] Archive sensitive docs to private storage
- [ ] Update README with project overview and deploy instructions
- [ ] Create one-page architecture map
- [ ] Set up project structure

### Week 1: Static Marketing Pages + Token File
- [ ] Home page with hero, features, CTA
- [ ] About page with mission, team, contact
- [ ] Roadmap page with timeline
- [ ] Contact page with form
- [ ] Docs index page
- [ ] `tokens.css` with all design tokens
- [ ] Base layout components (Header, Footer)

### Week 2: Match Viewer UI + Demo JSON Endpoints
- [ ] Match viewer page layout
- [ ] Timeline scrubber component
- [ ] Event markers on timeline
- [ ] Side panel with event details
- [ ] API client for demo endpoints
- [ ] Demo JSON data (3 matches, 5 players)

### Week 3: Component Polish, Accessibility Pass, Deploy
- [ ] Component polish and consistency
- [ ] Keyboard navigation testing
- [ ] Color contrast verification
- [ ] Lighthouse performance audit
- [ ] GitHub Pages deployment
- [ ] Final QA and bug fixes

**Total**: 3 weeks to public MVP

---

## Tech Stack Recommendation

### Framework: Astro (Recommended)
- **Why**: Zero JS by default, partial hydration, excellent performance
- **Alternative**: Next.js with static export

### Styling: Tailwind CSS + CSS Variables
- Tailwind for utility classes
- CSS variables for design tokens (allows runtime theming)

### Animation: CSS Transitions + Framer Motion (selective)
- CSS for simple transitions (hover, focus)
- Framer Motion for complex sequences (tab switches, panel entrances)

### Deployment: GitHub Pages
- Free, fast, integrated with Git workflow
- Cloudflare Pages as alternative (better performance globally)

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep | High | Strict 3-week deadline; defer non-essential features |
| Performance issues | Medium | Optimize images, lazy load, code split |
| Browser compatibility | Low | Test on Chrome, Firefox, Safari; progressive enhancement |
| Accessibility gaps | Medium | Test early and often; use automated tools (axe) |

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Deployed to public URL
- [ ] Lighthouse score ≥ 80 (Performance, Accessibility, Best Practices, SEO)
- [ ] No critical or high-severity accessibility issues
- [ ] README updated with setup and deploy instructions
- [ ] Components documented

---

*Document Version: [Ver002.000]*  
*Last Updated: 2026-03-22*  
*Owner: Product Manager / Foreman Agent*
