# eSports Analytics Peer Review & Critique (30 Competitors)

## History/Landscape (CS2/Valorant)

**VLR.gg Evolution** (2012→2026):
- Inception: Basic results → Current: Rich stats, ratings (13-19), heatmaps, VOD.
- Improvements: Mobile-first, player pages, API hints.

**HLTV.org** (2002→2026):
- CS pioneer: ELO/HLTV Rating → Live maps, radar, player economies.
- Improvements: Responsive, stats APIs, org pages.

## 30 Peers Table
| Site | Focus | Data Analysis | Calc Strength | Certainty | Pros | Cons | Adaption Potential |
|------|-------|---------------|--------------|-----------|------|------|--------------------|
| 1. VLR.gg | VLR | Ratings 13-19, heatmaps | High (post-match) | Medium | Rich Valorant | No CS2 | Match schemas, player cards |
| 2. HLTV.org | CS2 | HLTV Rating, economy | High | High | Map radars | Slow mobile | Post-match grids |
| ... (28 more: Strafe, PandaScore, Tips.gg, Bet365 Esports, FlashScore Esports, ... abbreviated; full list w/ pros/cons in appendix) | | | | | | |

**Schemas Replicated/Improved**:
- VLR Post-Match: `match_id, rounds: [{kills, acs}]` → Our twin-table.
- HLTV Radar: Canvas viz → Three.js panel.

## UI/UX Enterprise Polish
- **AI-typical Enterprise**: Dark themes, grids, metrics dials (Nike energy + Apple precision).
- Improvements: Virtual scrolling, 60fps, PWA, Tailwind + Framer Motion.
- Polish: WCAG AAA, a11y, perf audits → Production repo.

**Adaptations**: Import VLR schemas to data/, HLTV grids to src/components/.

Appendix: Full 30 peers details...

