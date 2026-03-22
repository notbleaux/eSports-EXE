[Ver003.000]

# eSports-EXE — One-Page MVP Spec

**Project**: eSports-EXE public demo & marketing site  
**Goal**: Ship a free-hosted, production-quality public presence that demonstrates core platform value (match replay + hub panels) and a reusable visual system.  
**Date**: 2026-03-22  
**Status**: Approved for Implementation  

---

## Objective

Deliver a zero-budget, deployable site that showcases:

1. **Match Viewer demo** — read-only replay with timeline and event panel
2. **Hubbed UI** — tabbed, panelled lenses with per-hub flair
3. **Design system** — tokens + small component library to guide future work

---

## Scope (MVP)

| Module | Features |
|--------|----------|
| **Marketing pages** | Home, About, Roadmap, Contact, Docs index |
| **Demo app** | Match Viewer (scrub timeline, event markers, contextual side panel) |
| **API stubs** | Static JSON endpoints to feed the demo UI |
| **Design system** | CSS variables for tokens; components for Tabs, Panels, Data Cards, Buttons |
| **Deployment** | GitHub Pages or Cloudflare Pages (static + optional serverless stubs) |

---

## Endpoints (Demo Stubs)

### GET /api/demo/matches
Response: `[{ id, title, date, hub, duration, thumbnail }]`

### GET /api/demo/matches/{id}
Response: `{ id, teams[], score{}, timeline[{t,type,actor,meta}], replayUrl }`

### GET /api/demo/players/{id}
Response: `{ id, name, avatar, role, stats{} }`

### GET /api/demo/hubs
Response: `[{ id, name, accentColor, description }]`

---

## Demo Data (Example)

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
  ],
  "matchDetails": {
    "id": "m-001",
    "teams": ["Alpha", "Beta"],
    "score": { "Alpha": 3, "Beta": 2 },
    "timeline": [{ "t": 12, "type": "kill", "actor": "player-7", "meta": {} }],
    "replayUrl": "/replays/m-001.webm"
  }
}
```

---

## Acceptance Criteria

- [ ] **Public deploy**: Marketing pages + demo app reachable at a public URL
- [ ] **Match Viewer**: Loads `/api/demo/matches/{id}`, supports timeline scrub, shows event markers, updates side panel on event selection
- [ ] **Design system**: CSS variables for tokens; components for Tabs, Panels, Data Cards, Buttons exist in `ui/`
- [ ] **Performance**: FCP < 1.5s on 3G emulation for marketing pages
- [ ] **Accessibility**: Keyboard operable hub tabs; body text contrast >= 4.5:1
- [ ] **Security**: No secrets or sensitive runbooks in public repo; SECURITY.md present

---

## Deliverables & Timeline (Zero Budget)

| Week | Focus | Deliverable |
|------|-------|-------------|
| **Week 0 (Prep)** | Repo prune; README index; create `ui/tokens.css` | Clean repo, token file |
| **Week 1** | Static marketing pages; token file committed | Home, About, Roadmap, Contact |
| **Week 2** | Match Viewer UI + demo JSON endpoints (static files) | Working match viewer |
| **Week 3** | Component polish, accessibility pass, deploy to GitHub Pages | Public MVP |

---

## Deployment (Free Options)

**Primary**: GitHub Pages (static site)  
**Optional**: Cloudflare Pages / Netlify / Vercel for static + serverless functions (free tiers)

---

## Quick Implementation Notes

- Keep demo data in `/public/api/demo/*.json` for simple fetches
- Build UI with a lightweight framework (React + Vite or plain HTML/CSS/vanilla JS) to keep build simple
- Store tokens as CSS variables in `ui/tokens.css` and import into components
- Add `MVP.md` and `STYLE_BRIEF.md` to repo root for designers/devs

---

*Document Version: [Ver003.000]*  
*Last Updated: 2026-03-22*  
*Owner: Product Manager / Foreman Agent*
