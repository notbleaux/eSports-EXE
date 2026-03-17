# Web Design Review: Top 20 Sites 2008+ (for NJZ4 eSports Repo)

## Review Framework
Sizing/tiling/CSS/elements/composition analyzed for adaptive/fluid mechanics.

## Top Inspirations
1. **Apple.com**: Hero animations, grid tiling, smooth scroll (CSS scroll-snap).
2. **Airbnb**: Card grids, masonry layout (CSS grid masonry).
3. **Spotify**: Dynamic particles (Canvas/WebGL), hero overlays.
4. **Netflix**: Infinite scroll, aspect ratio tiling.
5. **Google**: Material Design 3, neumorphism accents.
6. **Twitter/X**: Adaptive nav, floating elements.
7. **Reddit**: Threaded comments, infinite load.
8. **YouTube**: Video tiles, responsive iframes.
9. **Dribbble**: Hover effects, perfect spacing.
10. **Figma**: Canvas-like, collaborative cursors.

11-20: Nike (parallax), Stripe (gradients), Notion (blocks), Discord (glassmorphism), Twitch (overlays), LinkedIn (feeds), Medium (typography), GitHub (monospace), Slack (animations), Canva (drag-drop).

## Refits for Repo
- **Fluid Grids**: CSS `grid-template-rows: masonry` for match cards.
- **Hero Composition**: Quarterly grid w/centre dial (SATOR) + heroes frame.
- **Tiling**: `aspect-ratio: 16/9` for replay tiles.
- **Scripts**: GSAP for anims, Framer Motion React (web-v2).
- **Preserve Adaptive**: Media queries + container queries.

## Implementation Plan
1. Update STYLING_GUIDE.md w/CSS vars.
2. web-v2: HeroHelp + masonry grids.
3. Godot: Export templates w/NJZ shaders.

Iterative fine-tune during dev.
