[Ver001.000]

# Research: Netlify Integration Investigation

**Status:** Scoping doc · 2026-05-17
**Owner:** Platform / infra
**Plan reference:** Plan v002.002 §"Newly available tool surface" item 24, Round 2 R2.3
**Recommendation:** **NO immediate integration.** Document as available fallback for Phase 7.

---

## Why this investigation

Netlify MCP server was added to the session toolkit. Vercel preview deploys were just unblocked (PR #50 lockfile fix). The question: is Netlify worth adding as either:

1. **Production redundancy** (active-active or failover to Vercel)
2. **Phase 7 fallback path** (per plan v002 Phase 7 — multi-platform fallbacks: Supabase / Drive / Vercel / Cloudflare / Git, +Netlify)
3. **Replacement for Vercel** (cost / feature reasons)

…or **none of the above** (Vercel is fine; Netlify adds operational surface without payoff)?

## Verified state (via Netlify MCP, 2026-05-17)

| Field | Value |
|---|---|
| Authenticated user | `hvrry.h@gmail.com` (Google-linked, MFA disabled) |
| Account ID | `69e5ba530aa65dca99328694` |
| Team | "hvrry-h's team" (slug `hvrry-h`) |
| Team tier | **Free** |
| Account created | 2026-04-20 |
| Site count | **0** |
| Connected accounts | Google only |
| Onboarding state | `customize-site-name: open`, `deploy-again: open` — not completed |
| SAML / SSO | None |
| Dashboard URL | https://app.netlify.com/teams/hvrry-h |

The Netlify account is **empty and unused** (same pattern as the Cloudflare account discovered in PR #43's `EXTERNAL_SERVICE_RECONCILIATION.md`).

## Decision matrix

| Option | Cost | Effort | Value | Recommendation |
|---|---|---|---|---|
| **(A) Skip** — leave account dormant | $0 | 0 | Zero — but Vercel works fine already (verified post-PR-#50) | ⭐ **RECOMMEND** until Phase 7 |
| (B) Add as Phase 7 fallback | $0 (Free tier) | ~2 days: deploy duplicate, DNS/CDN failover wiring, runbook | Defensive: if Vercel has an outage, traffic fails over | Defer to Phase 7 work; doc this option |
| (C) Replace Vercel | $0 (Free → Pro) | ~5 days: full migration + git integration + secrets re-wire | Switching cost > benefit; Vercel project `website-v2` is healthy, deploys post-#50 are green | ❌ NO |
| (D) Active-active (Vercel + Netlify) | $0–20/mo (Pro tier likely) | ~1 week: dual deploys, traffic-shifting logic, observability | Adds operational surface (2 platforms to monitor) without clear traffic-failure scenarios | ❌ NO |

**Decision: Option A.** Netlify is a viable Phase 7 fallback candidate when that phase is reached. **No work in this round.**

## Phase 7 fallback assessment (if/when activated)

Plan v002's Phase 7 lists fallback platforms: **Supabase / Drive / Vercel / Cloudflare / Git**. Netlify could slot in as **another edge-deploy fallback** alongside Vercel:

| Fallback layer | Current primary | Netlify role |
|---|---|---|
| Web frontend | Vercel `website-v2` (`prj_GC4GheoL...`) | Could host a passive mirror; traffic shifts via DNS swap |
| Edge API functions | Vercel + Cloudflare Workers (Cloudflare empty per #43) | Netlify Functions could host emergency endpoints |
| Static assets | Vercel | Netlify CDN (cheaper for large bandwidth use cases) |
| Form handling | (not used) | Netlify Forms is a no-op feature for esports analytics |

**Operational consideration:** dual-deploys require DNS-level failover or proxy logic. Cloudflare (already in the stack, even if empty) is the natural place for that traffic-shifting layer — recommend treating Phase 7 fallback design as Cloudflare-Workers-orchestrated rather than Netlify-active.

## Capability surface available via MCP (for future reference)

The Netlify MCP server in this session provides read + write tools:

**Read:**
- `netlify-user-services-reader` — get-user
- `netlify-team-services-reader` — get-teams, get-team
- `netlify-project-services-reader` — get-project, get-projects, get-forms-for-project
- `netlify-deploy-services-reader` — deploy state
- `netlify-extension-services-reader` — installed extensions

**Write:**
- `netlify-deploy-services-updater` — trigger deploys
- `netlify-extension-services-updater` — install/configure extensions
- `netlify-project-services-updater` — create/update projects

If Phase 7 picks up Netlify, the MCP can drive end-to-end provisioning without leaving the terminal.

## Action items (if/when this gets prioritized)

1. **Reserve a Netlify site slug** (`zesportexte-fallback` or similar) — prevents squatting
2. **Connect git source** to `notbleaux/ZeSporteXte` (read-only, Netlify will auto-build from main)
3. **Match Vercel's build config**: `pnpm install --frozen-lockfile && pnpm run build --filter=@njzitegeist/web` → publish `apps/web/dist/`
4. **Document in `docs/operations/EMERGENCY_MEMORY_PROTOCOLS.md`** (Phase 7 deliverable) the DNS-swap procedure
5. **Cost monitor:** Free tier covers 100GB bandwidth/mo + 300 build min/mo. Sufficient for fallback; would not handle primary traffic for a launched product

## References

- Plan v002.002 §"Newly available tool surface" item 24
- PR #43 `docs/operations/EXTERNAL_SERVICE_RECONCILIATION.md` — established the multi-platform fallback context (lists Vercel/Supabase/Cloudflare already verified)
- Netlify dashboard: https://app.netlify.com/teams/hvrry-h
