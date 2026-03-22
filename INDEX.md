[Ver001.000]

# eSports-EXE — Project Index
## Complete Deliverables Reference

**Project**: notbleaux/eSports-EXE — eSports platform with match replay, hub dashboards, and analytics  
**Status**: MVP Specification Complete, Ready for Implementation  
**Last Updated**: 2026-03-22  

---

## 🚀 Quick Start

**New to the project?** Start here:
1. Read `MVP_v2.md` for the current MVP specification
2. Review `STYLE_BRIEF_v2.md` for design tokens and guidelines
3. Check `data/` for sample data structure
4. Schedule a CRIT session using `CRIT_TEMPLATE_v2.md`

---

## 📋 MVP Specifications

| Document | Purpose | Status |
|----------|---------|--------|
| **MVP_v2.md** | One-page MVP spec (v2) — **START HERE** | ✅ Current |
| **MVP.md** | Comprehensive MVP spec (v1) | ✅ Reference |
| **MVP_BACKLOG.md** | Detailed development backlog with timeline | ✅ Reference |

**Key Points (MVP_v2)**:
- 3-week timeline to public MVP
- Marketing site + Match Viewer demo
- Free hosting (GitHub Pages/Cloudflare Pages)
- FCP < 1.5s, Lighthouse ≥ 80

---

## 🎨 Design System

| Document | Purpose | Status |
|----------|---------|--------|
| **STYLE_BRIEF_v2.md** | Visual style brief (v2) — **START HERE** | ✅ Current |
| **STYLE_BRIEF.md** | Detailed style brief (v1) | ✅ Reference |
| **STYLE_SPEC_V1.md** | Complete design system specification | ✅ Reference |

**Key Tokens (STYLE_BRIEF_v2)**:
- **Typography**: GT Standard (display), Inter/Merriweather (body)
- **Colors**: Charcoal `#111217`, Cyan `#00D1FF`, Amber `#FFB86B`, Violet `#9B7CFF`
- **Spacing**: 8px base, 24px card padding
- **Motion**: 240ms entrance, 200ms panel switch

---

## 🔍 Review & Critique

| Document | Purpose | Status |
|----------|---------|--------|
| **CRIT_TEMPLATE_v2.md** | 90-minute review session template | ✅ Current |
| **CRIT_TEMPLATE.md** | Original CRIT template | ✅ Reference |
| **CRIT_REPORT_MERGE_RESOLUTION_2026-03-22.md** | Repository repair CRIT report | ✅ Archive |

**When to use**: Schedule weekly CRIT sessions during design/development phases.

---

## 📊 Demo Data

| File | Purpose | Content |
|------|---------|---------|
| **data/matches.json** | Sample matches | 5 matches (completed, live, upcoming) |
| **data/replays/replay-001.json** | Complete replay | Events, rounds, player stats, economy |
| **data/events.json** | Event catalog | 10 event types with colors, icons, severities |
| **data/hubs.json** | Hub definitions | 3 hubs (Analytics, Events, Replays) |

**API Structure**:
```
GET /api/demo/matches       → List of matches
GET /api/demo/matches/{id}  → Match details + timeline
GET /api/demo/players/{id}  → Player profile
GET /api/demo/hubs          → Hub definitions
```

---

## 🗂️ Repository Status

| Document | Purpose |
|----------|---------|
| **README.md** | Project overview (needs update for MVP) |
| **SECURITY.md** | Security policy and contact |
| **AGENTS.md** | AI agent coordination guidelines |
| **TODO.md** | Development TODO list |

**Recent Changes**:
- Repository merge conflicts resolved
- Design system documentation added
- MVP specifications created
- Demo data populated

---

## 📅 Implementation Roadmap

### Phase 0 — Prep (Week 0)
- [ ] Archive sensitive docs to private storage
- [ ] Update README with project overview
- [ ] Set up `site/` directory structure

### Phase 1 — Marketing + Tokens (Week 1)
- [ ] Implement `ui/tokens.css` with design tokens
- [ ] Build marketing pages (Home, About, Roadmap, Contact)
- [ ] Create base layout components (Header, Footer)

### Phase 2 — Match Viewer (Week 2)
- [ ] Match viewer page layout
- [ ] Timeline scrubber component
- [ ] Event markers and side panel
- [ ] Integrate demo data

### Phase 3 — Polish + Deploy (Week 3)
- [ ] Component polish and consistency
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Deploy to GitHub Pages

---

## 🛠️ Tech Stack Recommendation

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | Astro or Next.js | Static export, excellent performance |
| **Styling** | Tailwind CSS + CSS Variables | Utility-first + runtime theming |
| **Animation** | CSS Transitions + Framer Motion | Performance + capability |
| **Hosting** | GitHub Pages | Free, fast, integrated |
| **Alternative** | Cloudflare Pages | Better global performance |

---

## 📐 Design Principles

1. **Type-First**: Editorial clarity through GT Standard typography
2. **Motion-Forward**: Purposeful animations that guide attention
3. **Hub Architecture**: Each hub has distinct accent, shared system
4. **Panelled Lenses**: Tabbed, layered panels for contextual tools
5. **Accessible by Default**: WCAG AA, keyboard navigation, reduced motion

---

## ✅ Definition of Done (MVP)

- [ ] Deployable to public URL
- [ ] Marketing pages complete (Home, About, Roadmap, Contact)
- [ ] Match Viewer loads demo data and renders timeline
- [ ] Design system tokens in `ui/tokens.css`
- [ ] Components: Tabs, Panels, Data Cards, Buttons
- [ ] Lighthouse score ≥ 80 (Performance, Accessibility, Best Practices, SEO)
- [ ] Keyboard navigation works
- [ ] Color contrast ≥ 4.5:1
- [ ] `SECURITY.md` present
- [ ] README updated with deploy instructions

---

## 🔗 External References

### Design Inspiration
- **GT Standard**: https://gt-standard.com — Typographic system
- **Endex**: https://www.siteinspire.com/website/13263-endex — Data panels
- **Ciridae**: Hub flair and motion language
- **Detail.design**: https://detail.design — Craft and motion

### Technical Resources
- **GitHub Pages**: https://docs.github.com/pages
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **Lighthouse**: https://developers.google.com/web/tools/lighthouse

---

## 👥 Team Roles

| Role | Responsibilities |
|------|------------------|
| **Product Owner** | Scope decisions, priority calls, success metrics |
| **Design Lead** | Design system, visual consistency, CRIT moderation |
| **Frontend Engineer** | Component implementation, performance, accessibility |
| **QA / Accessibility** | Testing, a11y audit, device testing |

---

## 📝 Document Versioning

All documents use version headers: `[VerMMM.mmm]`

- **Major (MMM)**: Structural changes
- **Minor (mmm)**: Content updates

Current versions:
- MVP_v2.md: [Ver002.000]
- STYLE_BRIEF_v2.md: [Ver002.000]
- CRIT_TEMPLATE_v2.md: [Ver002.000]

---

## 🎯 Immediate Next Steps

1. **Review**: Read `MVP_v2.md` and `STYLE_BRIEF_v2.md`
2. **Approve**: Confirm scope and design tokens
3. **Schedule**: First CRIT session for next week
4. **Setup**: Create `site/` directory and initialize project
5. **Deploy**: Get a staging URL up for continuous review

---

*Document Version: [Ver001.000]*  
*Last Updated: 2026-03-22*  
*Owner: Foreman Agent / Product Manager*
