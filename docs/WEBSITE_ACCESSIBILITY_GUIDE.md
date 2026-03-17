# Website Accessibility & Standards Compliance

## Research Summary
**Top 10 Designs/Standards**:
1. **WCAG 2.2 AA** (ARIA, keyboard, contrast >4.5:1).
2. **Material Design 3** (mobile, heuristics).
3. **Apple HIG** (iOS gestures).
4. **Google Material You** (dynamic themes).
5. **Bootstrap 5.3** (grid, plugins).
6. **Tailwind UI** (current stack, utility-first).
7. **Ant Design** (enterprise metrics).
8. **Chakra UI** (accessible primitives).
9. **React Aria** (ARIA heuristics).
10. **Top Games** (Overwatch help overlays, LoL client accessibility).

**Industry Frameworks**:
- Vite + React + Tailwind (current): Add `@headlessui/react`, `react-aria`.
- Metrics: Lighthouse 100, axe-core audits.
- Mobile: PWA manifest, TWA compliant.

## File Structure
```
apps/website-v2/
├── src/
│   ├── components/ (HelpOverlay, CasinoSFX)
│   ├── pages/ (HelpWiki, Downloads, Contact)
│   ├── hooks/ (useAccessibility, useNetworking)
│   ├── tools/ (agents, plugins)
├── public/ (downloads)
├── docs/ (Knowledge Centre)
```

## Tools/Plugins
- **Agents**: Zustand stores, TanStack Query.
- **Networking**: React Query (caching, heuristics).
- **Plugins**: Playwright e2e, Vitest.
- **Metrics**: Sentry, CustomTimer hooks.
- **Accessibility**: `react-focus-lock`, color-blind modes.

## Settings Panel
- Keyboard nav toggle.
