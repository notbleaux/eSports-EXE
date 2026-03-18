# Game-Website Equitable Production & 12 Improvements

## Current Review
**Game**: Deterministic FPS sim (Godot 4, 20TPS, NJZ UI, heroes).
**Website**: React/Vite/Tailwind (HeroHelp, ML predictions).
**Quality Gap**: Web production-ready (tests, PWA), Game functional (needs tests/deploy).

## Pipelines
- **Shared Data**: SATOR API (matches/players).
- **Web -> Game**: WebSocket replays.
- **Game -> Web**: Embed HTML5 export.

## 12 Improvements

1. **Shared Auth Pipeline**
   - Sub1: OAUTH sync game/web sessions.
   - Sub2: Token-based API keys.
   - Guide: Add AuthManager.gd + React Query interceptor; `npm i next-auth`; test login flow.

2. **Replay Embed System**
   - Sub1: HTML5 game export iframe.
   - Sub2: WebSocket sync replays.
   - Guide: Godot export Web; vite-plugin-iframe; websocket bridge.

3. **Metrics Dashboard Shared**
   - Sub1: Godot telemetry -> SATOR.
   - Sub2: Web charts React -> Godot overlay.
   - Guide: CustomEventBus.gd + Zustand sync.

4. **Accessibility Parity**
   - Sub1: WCAG Godot shaders/voiceover.
   - Sub2: Web ARIA live regions.
   - Guide: HeadlessUI + Godot AccessNode.

5. **Betting Casino Live**
   - Sub1: RNG 8-table SFX Godot.
   - Sub2: React casino UI sync.
   - Guide: FramerMotion + AudioStream; integrate docs/BETTING_SIM.

6. **Heroes Cross-Platform**
   - Sub1: Shared JSON defs.
   - Sub2: Web3D viewer.
   - Guide: Defs/heroes.json + drei.js.

7. **Mobile PWA Game**
   - Sub1: Touch controls Godot.
   - Sub2: TWA web wrap.
   - Guide: Godot touch input + vite PWA.

8. **CI/CD Parity**
   - Sub1: GitHub Actions Godot export.
   - Sub2: Vercel web deploy.
   - Guide: .github/workflows/godot.yml.

9. **Performance Metrics**
   - Sub1: FPS/Lighthouse shared.
   - Sub2: Sentry both.
   - Guide: Godot Performance singleton + Sentry React.

10. **Help Systems Unified**
    - Sub1: Shared tips JSON.
    - Sub2: Cross-search.
    - Guide: mkdocs + Godot RichText.

11. **Networking Robust**
    - Sub1: Circuit breaker game.
    - Sub2: Query heuristics web.
    - Guide: TanStack retry + Godot HTTPRequest.

12. **Monetization Pipeline**
    - Sub1: In-game purchases web.
    - Sub2: NFT heroes.
    - Guide: Stripe + wallet connect.

**Next**: Implement 1-4; PR.

