# SiteGeiste Shell Architecture — Based on NuVue index.html

## Status: SHELL TO EXPAND (Per Eli Answer #6)
The `index.html` NuVue portfolio page is the **foundational shell** for SiteGeiste.
It will be expanded into the full NeXeZ workspace interface.

---

## Design System Extraction

### Color Palette (Hyper-Pop / New-2²)
| Token | Value | Usage |
|-------|-------|-------|
| `--pink` | `#FF2D8A` | Primary accent, CTAs, highlights |
| `--cyan` | `#00F0FF` | Secondary accent, tech, links |
| `--purple` | `#A855F7` | Tertiary accent, cosmic themes |
| `--lime` | `#BFFF00` | Success, go, active states |
| `--orange` | `#FF6B2B` | Warnings, sunset themes |
| `--chrome` | `#C0C0C0` | Metallic, neutral highlights |
| `--deep` | `#0A0A0F` | Background base |
| `--card-bg` | `rgba(255,255,255,0.03)` | Card surfaces |
| `--card-border` | `rgba(255,255,255,0.06)` | Card borders |
| `--text` | `#F0F0F0` | Primary text |
| `--text-muted` | `#888` | Secondary text |

### Typography
| Role | Font | Weights |
|------|------|---------|
| Display / Hero | `Syne` | 400-800 |
| Body / UI | `DM Sans` | 100-1000 |
| Monospace / Code | `Space Grotesk` | 300-700 |

### Animation Tokens
| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| `gradient-shift` | 4-5s | ease infinite | Gradient text |
| `float` | 8s | ease-in-out | Floating orbs |
| `pulse-glow` | 2s | ease | Scroll indicator |
| `scan-line` | 6s | linear | CRT effect |
| `marquee` | 30s | linear | Banner text |
| `chromatic` | 0.3s | ease | Glitch effect |
| `card-hover` | 0.5s | cubic-bezier(0.16, 1, 0.3, 1) | Card interactions |

---

## Component Inventory (From index.html)

### Global Components
1. **Cursor** — Custom dot cursor with hover scaling
2. **Navigation** — Fixed top bar with blur backdrop, gradient logo, link underlines
3. **Grain Overlay** — SVG noise texture, fixed, pointer-events none

### Section Components
4. **Hero** — Full viewport, orb background, gradient title, CTA button, scroll indicator
5. **Marquee Banner** — Infinite scrolling text strip with separators
6. **Section Header** — Label (cyan + line) + Title (with accent span)
7. **Portfolio Grid** — CSS grid, auto-fill minmax(380px, 1fr)
8. **Project Card** — Visual (gradient + pattern + icon) + Body (repo name, title, description, tags) + Footer (link + stars)
9. **Featured Card** — 2-column span, larger visual height
10. **Concept Section** — 2-column grid (text + orb visualization)
11. **Stats Bar** — 4-column grid of stat items
12. **Tech Grid** — Flex wrap of pill buttons
13. **Footer** — Centered logo + tagline + links + copyright

### Card Themes (Extracted)
| Theme | Gradient | Pattern | Icon Glow |
|-------|----------|---------|-----------|
| `neon-night` | Purple-black | Hex grid | Pink |
| `sunset` | Orange-black | Circuit lines | Orange |
| `arctic` | Cyan-black | Wave lines | Cyan |
| `cosmic` | Purple-black | Dot pattern | Purple |
| `forest` | Lime-black | Hex grid | Lime |
| `gold` | Gold-black | Circuit lines | Gold |
| `vapor` | Pink-purple | Wave lines | Pink |
| `sport` | Lime-black | Hex grid | Lime |
| `mint` | Mint-black | Dot pattern | Mint |
| `pixel` | Yellow-black | Hex grid | Yellow |

---

## SiteGeiste Expansion Plan

### Phase 1: Static Shell → React App
Convert `index.html` to React components:
- `App.tsx` — Router + layout
- `components/Navigation.tsx`
- `components/Hero.tsx`
- `components/Marquee.tsx`
- `components/ProjectCard.tsx`
- `components/ConceptSection.tsx`
- `components/StatsBar.tsx`
- `components/TechGrid.tsx`
- `components/Footer.tsx`
- `hooks/useCursor.ts`
- `hooks/useScrollAnimation.ts`
- `styles/design-system.css` — CSS variables + keyframes

### Phase 2: Repo Cards → Live Data
Replace static 12 repos with dynamic data:
- GitHub API integration (`octokit` or `fetch`)
- Repo metadata: stars, language, last commit, README excerpt
- Real-time stats update (daily cache)
- Link to actual repo URLs

### Phase 3: Module System Integration
Add SiteGeiste-specific modules as expandable sections:
- **AI Control Panel** — LLM profile selector, model status, token usage
- **Agent Dashboard** — Satyrs/Saters/Satirs status, task queue, VORP display
- **Module Navigator** — Collapsible sidebar with module tree
- **CiteGeiste Integration** — Wiki search, knowledge graph preview
- **NueVue Connector** — Terminal toggle, dashboard preview

### Phase 4: Anima Crossing — PolyOffice Integration
- Virtual office visualization (PixiJS v8)
- Agent avatars/sprites (from `pixel-office-sprites`)
- Room-based navigation (click room → expand module)
- Multi-AI PortHub interface

### Phase 5: Authentication & Personalization
- GitHub OAuth login
- User preferences (theme, layout, modules)
- Personalized dashboard (recent repos, active agents)
- Role-based access (owner, collaborator, viewer)

---

## Repo Mapping (index.html → Actual)

| index.html Name | Actual Repo | Status |
|-----------------|-------------|--------|
| `nexes-zero-zenith` | `nexez-jz` (was NJZetao5) | Must-Have |
| `numun-core` | `numun-ops-center` | Wave 2 |
| `bleaux-moon-os` | *Conceptual / branding* | Brand layer |
| `nue-vue` | `nuevue` | Must-Have |
| `zesitegeiste` | `nexez-sitegeiste` | Must-Have |
| `zecitegeiste` | `hexnex-wiki` (CiteGeiste) | Must-Have |
| `cszeitgeiste` | *Conceptual / education* | Future |
| `zesportsxte` | `ZeSporteXte` | Parallel |
| `esportes-manager` | `esporte-manager` | **FROZEN** |
| `vis-a-vis` | *Conceptual / communication* | Future |
| `anima-crossing` | *Productivity / PolyOffice* | Phase 4 |
| `citegeiste` | `hexnex-wiki` (duplicate?) | Must-Have |

**Note:** Some repos in index.html are conceptual/future. SiteGeiste will distinguish between:
- 🟢 Active (linked, live data)
- 🟡 In Development (linked, placeholder data)
- ⚪ Conceptual (no link, vision card)

---

## Technical Stack (Frozen)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + CSS variables (design tokens)
- **Animation**: Framer Motion + CSS keyframes
- **Data**: GitHub REST API + GraphQL
- **State**: Zustand (lightweight)
- **Auth**: NextAuth.js (GitHub provider)
- **Hosting**: Vercel (zero-cost tier)

---

## File Structure (Target)
```
sitegeiste/
├── app/
│   ├── page.tsx              # Landing (from index.html shell)
│   ├── layout.tsx            # Root layout + providers
│   ├── globals.css           # Design tokens + keyframes
│   ├── dashboard/
│   │   └── page.tsx          # Authenticated dashboard
│   └── api/
│       └── repos/            # GitHub API proxy
├── components/
│   ├── ui/                   # Shadcn/ui base
│   ├── navigation/
│   ├── hero/
│   ├── cards/
│   ├── sections/
│   └── modules/              # SiteGeiste-specific
├── hooks/
├── lib/
│   ├── github.ts             # GitHub API client
│   └── utils.ts
├── types/
│   └── repo.ts               # Repo metadata types
├── public/
│   └── sprites/              # Pixel office sprites
└── next.config.js
```

---

## Implementation Checklist

- [ ] Create `nexez-sitegeiste` repo (public, needs GitHub token)
- [ ] Initialize Next.js 14 project with TypeScript + Tailwind
- [ ] Port `index.html` CSS to `globals.css` (design tokens)
- [ ] Port `index.html` sections to React components
- [ ] Implement custom cursor hook
- [ ] Implement scroll animation hook
- [ ] Add GitHub API integration (repo metadata)
- [ ] Create module system skeleton (AI Control, Agent Dashboard)
- [ ] Add Vercel deployment config
- [ ] Test responsive breakpoints (1024px, 768px)

---

*Architecture created: 2026-05-16*
*Status: Shell documented, awaiting repo creation*
*Next step: Initialize Next.js project once GitHub token available*
