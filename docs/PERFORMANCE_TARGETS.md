[Ver002.000]

# Performance Targets — NJZiteGeisTe Platform

## Bundle Size Targets

| Chunk | Target | Current |
|-------|--------|---------|
| Initial JS | < 200 kB gzip | TBD (build needed) |
| vendor-react | < 50 kB gzip | TBD |
| vendor-three | < 150 kB gzip | TBD |
| vendor-charts | < 80 kB gzip | TBD |
| vendor-framer | < 40 kB gzip | TBD |
| vendor-query | < 20 kB gzip | TBD |
| vendor-gsap | < 30 kB gzip | TBD |
| Hub chunks (each) | < 100 kB gzip | TBD |
| **Total initial** | **< 500 kB gzip** | 675 kB (uncompressed, Phase 4) |

## Runtime Targets (Core Web Vitals)

| Metric | Target | Notes |
|--------|--------|-------|
| Largest Contentful Paint (LCP) | < 2.5s | Hero + first hub content |
| First Input Delay (FID) | < 100ms | Click/tap response |
| Cumulative Layout Shift (CLS) | < 0.1 | No layout jumps |
| Time to First Byte (TTFB) | < 800ms | Vercel Edge CDN |
| First Contentful Paint (FCP) | < 1.8s | Above-fold content |

## API Response Targets

| Endpoint | Target (cached) | Target (cold) |
|----------|----------------|---------------|
| GET /v1/players | < 200ms | < 800ms |
| GET /v1/simrating/leaderboard | < 500ms | < 1.5s |
| GET /v1/matches | < 200ms | < 800ms |
| WS /ws/matches/live heartbeat | < 100ms interval | — |

## Lighthouse CI Thresholds (`.lighthouserc.json`)

| Category | Threshold |
|----------|-----------|
| Performance | ≥ 70 (warn) |
| Accessibility | ≥ 85 (warn) |
| Best Practices | ≥ 85 (warn) |
| SEO | ≥ 80 (warn) |
| LCP | ≤ 2500ms |
| CLS | ≤ 0.1 |
| FCP | ≤ 1800ms |
| TBT | ≤ 300ms |
| TTI | ≤ 3500ms |

All assertions are `warn` (not `error`) — CI will not hard-fail on threshold breaches; results are uploaded as artifacts.

## Measurement Commands

```bash
# Build and check chunk sizes
cd apps/web && npm run build

# Bundle analyzer (uncomment rollup-plugin-visualizer in vite.config.js)
npm run build:analyze

# Run Lighthouse CI locally (requires build first)
npm install -g @lhci/cli
cd apps/web && npm run build && npm run preview &
lhci autorun

# Single-page audit
npx lighthouse http://localhost:4173 --output html
```

## Optimisation Checklist

- [x] All 5 hubs lazy-loaded with React.lazy + Suspense
- [x] manualChunks for react, tanstack, three.js, framer-motion, charts, gsap
- [x] sourcemap: false in production build
- [x] cssCodeSplit: true
- [x] Service worker caching (sw.ts v3)
- [ ] Compress images / SVG icons (icons not yet optimised)
- [ ] Preload critical font subsets only (full family currently loaded)
- [ ] Add `loading="lazy"` to below-fold images
- [ ] Consider @tanstack/react-virtual for long leaderboard lists
