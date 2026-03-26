[Ver001.000]

# eSports-EXE — Project Ready
## Definitive Starting Point for MVP Implementation

**Status**: ✅ Ready for Development Kickoff  
**Date**: 2026-03-22  
**Timeline**: 4-6 weeks to public MVP  
**Budget**: Zero-cost (GitHub Pages)  
**Design Philosophy**: Type-first, motion-forward, panel-driven  

---

## 🎯 Executive Summary

Build the eSports-EXE web presence around a **type-first, motion-forward, panel-driven system** inspired by:
- **Ciridae** — atmospheric minimalism, hub flair
- **GT Standard** — typographic discipline, editorial clarity  
- **Endex** — functional data-UI, modular panels

**Deliver**: Entire MVP as a zero-cost, static GitHub Pages deployment with client-side dynamic behavior.

**Result**: Enterprise-grade feel without enterprise-grade costs — aligned with Canberra tech aesthetic of clean, purposeful, future-leaning design.

---

## 📖 Narrative Architecture

### Hub-Based Storytelling

Collapse platform complexity into a single, coherent story through **Hubs as Lenses**:

| Hub | Purpose | Content Type |
|-----|---------|--------------|
| **Core Hub** | What EXE is, what problems it solves | Editorial storytelling |
| **Match Hub** | Viewer, replays, data, agents | Panel dashboard |
| **Research Hub** | Papers, experiments, architecture | Longform editorial |
| **Dev Hub** | API docs, onboarding, security | Documentation |

**Why This Works**:
- Mirrors Ciridae's clarity
- Echoes Endex's modularity  
- Follows GT Standard's editorial flow
- Creates natural information architecture

---

## 🏗️ Information Architecture

### Page Types

| Type | Use For | Layout |
|------|---------|--------|
| **Editorial Pages** | Storytelling (Overview, Research) | Centered single column |
| **Panel Dashboards** | Functional areas (Match Viewer, Agents) | 12-column modular grid |
| **Tabbed Lenses** | Sub-contexts (Stats, Replay, Metadata) | Animated panel stacks |

### State Change Strategy
Use **motion to reinforce state changes, not decorate them**:
- Tab switches → Panel slides + crossfade
- Data updates → Subtle highlight pulse
- Navigation → Smooth scroll + fade

---

## 🎨 Visual System (Locked)

### Typography: GT Standard

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| Display | 48–72px | 700 | Hero headlines |
| H1 | 40px | 600 | Page titles |
| H2 | 28px | 600 | Hub headers |
| H3 | 20px | 500 | Panel titles |
| Body | 16–18px | 400 | Content |

**Rules**:
- Tight leading for headlines (1.05–1.15)
- Relaxed for body (1.45–1.6)
- Optical sizes for clarity

### Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#0F0F0F` | Text, headings |
| Secondary | `#2A2A2A` | Subheadings |
| Warm Gray | `#E5E5E5` | Borders, dividers |
| Background | `#FAFAFA` | Page background |

**Hub Accents**:
- Electric Cyan `#4FF3FF` — Core/Analytics
- Warm Orange `#FF8A3D` — Match/Events

### Panels & Grid

**Editorial**: Centered single column (max 720px)  
**Dashboards**: 12-column modular grid  
**Panels**:
- Soft elevation (0 6px 18px rgba(0,0,0,0.08))
- 16px border radius
- Animated masks for tab transitions

### Motion Rules

| Animation | Duration | Easing |
|-----------|----------|--------|
| Entrance | 200ms | ease-out |
| Panel Switch | 250–300ms | ease-in-out |
| Hover | 150ms | ease-out |

**Pattern**: Fade + slight upward shift (20px) for entrances

---

## 🛠️ Technical Stack (Zero-Cost)

| Layer | Technology | Cost |
|-------|------------|------|
| **Hosting** | GitHub Pages | Free |
| **Framework** | Astro or plain HTML/CSS/JS | Free |
| **Styling** | CSS Variables + Tailwind | Free |
| **Motion** | CSS Transitions + WAAPI | Free |
| **Data** | Client-side fetch (JSON) | Free |
| **APIs** | Existing backend endpoints | Existing |

**Why This Stack**:
- Free, fast, maintainable
- No build complexity barrier
- Scales to dynamic features later

---

## 📅 Implementation Roadmap

### Phase 1 — Scope & Content (Week 0–1)
- [ ] Define 3–4 Hubs (Core, Match, Research, Dev)
- [ ] Extract key docs from repo
- [ ] Archive legacy content to private storage
- [ ] Create content inventory

**Deliverable**: Content plan + archived legacy

### Phase 2 — Design System (Week 1–2)
- [ ] Build type scale (`tokens.css`)
- [ ] Define color tokens
- [ ] Create panel components
- [ ] Define motion rules
- [ ] Build component library (Storybook or HTML)

**Deliverable**: `ui/tokens.css`, `ui/components/`, component docs

### Phase 3 — Static Build (Week 2–4)
- [ ] HTML/CSS/JS site structure
- [ ] Core Hub (editorial pages)
- [ ] Match Hub (panel dashboard + viewer)
- [ ] Tabbed lenses with animations
- [ ] Client-side fetch for dynamic data
- [ ] GitHub Pages deployment setup

**Deliverable**: Deployed site at `username.github.io/esports-exe`

### Phase 4 — Polish (Week 4–6)
- [ ] Accessibility audit (keyboard nav, reduced motion)
- [ ] Performance tuning (Lighthouse ≥ 80)
- [ ] Cross-browser testing
- [ ] Documentation (README, API docs)
- [ ] Security review (no sensitive docs)

**Deliverable**: Production-ready MVP

---

## ✅ Definition of Done

- [ ] Public URL on GitHub Pages
- [ ] 4 Hubs implemented (Core, Match, Research, Dev)
- [ ] Match Viewer with timeline scrubber
- [ ] Tabbed lenses with animated transitions
- [ ] Design system tokens in `ui/tokens.css`
- [ ] Lighthouse score ≥ 80 (all categories)
- [ ] Keyboard navigation works
- [ ] `prefers-reduced-motion` supported
- [ ] Color contrast ≥ 4.5:1
- [ ] README with deploy instructions
- [ ] `SECURITY.md` present

---

## ⚠️ Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Sensitive docs exposure | Medium | High | Archive to private repo; audit before deploy |
| Static hosting limitations | Low | Medium | Use client-side fetch; serverless functions if needed |
| Motion overload | Medium | Medium | Keep transitions functional; max 300ms duration |
| Design system drift | Medium | High | Lock tokens early; enforce via CSS variables |
| Scope creep | High | High | Strict 4-6 week deadline; defer non-essential features |

---

## 📁 Repository Structure

```
esports-exe/
├── PROJECT_READY.md          # This file — start here
├── INDEX.md                  # Complete deliverables index
├── MVP_v2.md                 # MVP specification
├── STYLE_BRIEF_v2.md         # Design tokens and guidelines
├── CRIT_TEMPLATE_v2.md       # Review session template
├── README.md                 # Project overview (update needed)
├── SECURITY.md               # Security policy
├── ui/                       # Design system
│   ├── tokens.css           # CSS variables
│   └── components/          # Reusable components
├── site/                     # Static site
│   ├── index.html           # Core Hub / Home
│   ├── match/               # Match Hub
│   ├── research/            # Research Hub
│   ├── dev/                 # Dev Hub
│   └── assets/              # Images, fonts, etc.
├── data/                     # Demo data
│   ├── matches.json
│   ├── replays/
│   └── hubs.json
└── .github/
    └── workflows/
        └── deploy.yml       # GitHub Pages deployment
```

---

## 🚀 Immediate Next Steps

### Today
1. [ ] Read this document (`PROJECT_READY.md`)
2. [ ] Review `MVP_v2.md` and `STYLE_BRIEF_v2.md`
3. [ ] Confirm scope and timeline with team

### This Week
4. [ ] Archive sensitive docs to private storage
5. [ ] Set up `site/` directory structure
6. [ ] Initialize project (Astro or HTML/CSS/JS)
7. [ ] Create `ui/tokens.css` with design tokens

### Next Week
8. [ ] Build Core Hub pages (Home, About)
9. [ ] Implement tabbed lens component
10. [ ] Deploy to GitHub Pages (staging)

---

## 📚 Key Documents Reference

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **PROJECT_READY.md** | This file — definitive starting point | **First** |
| **INDEX.md** | Complete index of all deliverables | When looking for specific doc |
| **MVP_v2.md** | MVP specification and timeline | Before planning sprints |
| **STYLE_BRIEF_v2.md** | Design tokens and guidelines | Before writing CSS |
| **CRIT_TEMPLATE_v2.md** | Review session template | Before scheduling CRIT |

---

## 🎨 Design Inspiration References

- **GT Standard**: https://gt-standard.com — Typographic system
- **Ciridae**: Atmospheric minimalism, hub flair
- **Endex**: https://www.siteinspire.com/website/13263-endex — Functional panels
- **Detail.design**: https://detail.design — Craft and motion

---

## 🔗 External Resources

- **GitHub Pages**: https://docs.github.com/pages
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **Lighthouse**: https://developers.google.com/web/tools/lighthouse

---

*Document Version: [Ver001.000]*  
*Last Updated: 2026-03-22*  
*Next Milestone: Week 0 completion (scope + content)*  
*Owner: Product Manager / Foreman Agent*
