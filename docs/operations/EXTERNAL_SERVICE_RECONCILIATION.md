[Ver001.002]

# External Service Reconciliation Report — Post Rename to ZeSporteXte

**Status:** Verified + Vercel/Supabase/Sentry actions complete · 2026-05-15
**Owner:** Platform / infra
**Supersedes:** None — first canonical post-rename audit

## Change log
- `[Ver001.000]` initial verified findings (PR #43 commit `1049cb3`)
- `[Ver001.001]` documented Vercel deploy-secret issue (`d06c39d`)
- `[Ver001.002]` Vercel deploy unblocked + Sentry removal complete across 3 stages (`759bd77`, `6c53507`, `26a21ef`, `875ee93`)

---

## Background

In May 2026 the GitHub repository was renamed from `notbleaux/eSports-EXE` to `notbleaux/ZeSporteXte`. This report captures the verified state of every external integration after the rename, the in-repo URL changes applied so far, and the remaining cleanup backlog assigned to follow-up sprints.

This is the canonical reference for "what's the state of the rename?" — supersedes ad-hoc summaries in PR threads.

---

## Verified findings — external services (MCP, 2026-05-15)

### Vercel

| Field | Value |
|---|---|
| Team | `team_VQt7eyIfkf6feJlWnonk5Gqc` (slug `njzitegeiste`) |
| Project | `website-v2` (`prj_GC4GheoL6bWs3AIyuBUaYqDkfdoI`) |
| Framework | vite |
| Live | `false` |
| Latest deploy | `dpl_7NowKDqNPZKcgAh2KhkoC5F25wsX` — ready 2026-05-14 |
| Custom domain | none — `*.vercel.app` only |
| Git source | (not exposed in MCP response — verify in dashboard if rename audit needed) |

**Action required:** none. GitHub auto-redirects handle the rename for git webhook payloads. The `"name": "njzitegeist-platform"` field in `vercel.json` is cosmetic for existing projects (Vercel reads the project name from the dashboard, not the repo file).

### Supabase

| Field | Value |
|---|---|
| Organization | `ulcigmgrzwvawbazzkvk` ("notbleaux's Org") |
| Project | `NJZitegeiste` (`sxwyaxfresusroiezxxc`) |
| Region | `ap-southeast-1` (Singapore) |
| Status | `ACTIVE_HEALTHY` |
| Postgres | 17.6.1 |
| Database host | `db.sxwyaxfresusroiezxxc.supabase.co` |
| Git linkage | none |

**Action required:** none. Supabase has no GitHub-source binding to rename. Any in-repo CORS or env-var references to the old name are updated separately (see "In-repo URL changes" below).

### Cloudflare

| Field | Value |
|---|---|
| Account | `fe15ca3d787f6793157af4bf374fd1f1` (privaterelay Apple ID) |
| Created | 2026-03-12 |
| Workers | 0 |
| D1 databases | 0 |
| KV namespaces | 0 |
| R2 | not enabled |

**Action required:** none — account is empty, no resources deployed. The user's preventative concern about a Cloudflare rename impact does not apply: there is nothing to reconcile.

### Net result

**Zero platform-side dashboard reconciliation is required for the rename itself.** The only post-rename work is in-repo URL updates, tracked below.

## Sentry — REMOVED (PR #43, 3 stages, 2026-05-15)

User direction: "I don't think I have sentry account or it at up. Remove sentry entirely if it's blocking progress and find alternative that is free and accessible for you within your tools now."

Verified beforehand: all "secrets" in the 3 tracked `.env.*` files were placeholder strings (`your_sentry_auth_token_here`, `https://xxxxxxxx@sentry.io/yyyyyyyy`) — no real Sentry account or token ever existed. No rotation required.

**Stage 1 — `6c53507`** (`chore(deps): remove Sentry entirely (Stage 1 of 2)`)
- Deleted `apps/web/src/components/error/SentryErrorBoundary.tsx` (only file with hard `@sentry/react` import; was unused)
- Deleted `apps/web/src/config/sentry.ts` (redundant `@ts-nocheck`'d stub)
- Simplified `apps/web/src/shared/lib/sentry.ts` to a pure no-op (call sites unchanged: `initSentry`/`captureException`/`captureMessage`/`setUser` keep working)
- Removed `@sentry/react ^10.46.0` from `apps/web/package.json` → `pnpm-lock.yaml` dropped 7 packages

**Stage 2a — `26a21ef`** (`chore(gitignore): untrack 3 placeholder env files + narrow overly-broad lib/ rule`)
- `git rm --cached` for the 3 placeholder env files (`apps/web/.env.production`, `.env.vercel`, `.env.sentry-build-plugin`)
- Added `.gitignore` patterns so they stay untracked
- Narrowed unrooted `lib/` and `lib64/` rules → `/lib/` and `/lib64/` so they no longer shadow legitimate frontend source dirs (`apps/web/src/lib/`, `apps/web/src/shared/lib/`)

**Stage 2b — `875ee93`** (`chore(sentry): remove VITE_SENTRY_DSN env vars + type declarations`)
- Removed the `SENTRY` block from `apps/web/.env.example`
- Removed the `SENTRY_DSN` line from `packages/shared/api/.env.example`
- Removed the `declare module '@sentry/react'` stub from `apps/web/src/global.d.ts`
- Removed `readonly VITE_SENTRY_DSN?: string;` from `apps/web/src/vite-env.d.ts`

**Stage 2c — this commit**
- Removed Sentry block from root `.env.production.template`
- Final report update marking the workstream complete

**Verification across all stages:**
- `pnpm --filter=@njzitegeist/web run typecheck` → 0 errors
- `grep -rln '@sentry\|VITE_SENTRY\|SENTRY_DSN' --include='*.ts' --include='*.tsx' --include='*.env*' --include='*.json' apps/ packages/` → 0 matches in tracked files
- `grep '@sentry' pnpm-lock.yaml` → 0 matches

**Out of scope (legacy archives, intentionally NOT touched):**
- `docs/legacy/analysis/context_dossier_deployment.json` — by directory name, this is the deprecated context dossier; should be archived if not already

**Future error-reporting replacement path** (no work needed unless observability becomes a requirement):
- `apps/web/src/shared/lib/sentry.ts` is a single swap-in point — wire Supabase logs (project `NJZitegeiste` already exists) or Cloudflare Workers Analytics Engine (free tier, account already exists) into the no-op there, no call-site changes.

---

### Pre-existing Vercel deploy issue (surfaced 2026-05-15 on PR #43)

**Unrelated to the rename**, but discovered while monitoring this PR:

```
Environment Variable "VITE_API_URL" references Secret "api_url",
which does not exist.
```

`vercel.json` declared `build.env` overrides using Vercel secret syntax (`@<secret_name>`) for three vars whose secrets were never created in the `njzitegeiste` Vercel team project. Every PR's preview deploy crashed at build-config time.

**Resolved in PR #43** (commit on `claude/post-rename-cleanup-tail`):

- Removed the three `@<secret>` references from `vercel.json` → `build.env`:
  - `VITE_API_URL: @api_url` (removed)
  - `VITE_WS_URL: @ws_url` (removed)
  - `VITE_SENTRY_DSN: @sentry_dsn` (removed)
- Retained `VITE_BASE_PATH: /` (literal value, no secret dependency)

**Safe because:** every frontend consumer of these vars has a `??` fallback in code (`apps/web/src/shared/api/client.ts`, `hooks/usePlayerStatsLive.ts`, `lib/sentry.ts`, etc.) — missing env at build time falls back to `localhost:8000`. To wire real production values, set them as project-level env vars in the Vercel dashboard or via `vercel env add`.

### Supabase wiring — verified configuration

Live project state (via MCP, 2026-05-15):

| Field | Value |
|---|---|
| URL | `https://sxwyaxfresusroiezxxc.supabase.co` |
| Modern publishable key format | `sb_publishable_*` (recommended) |
| Legacy anon key format | JWT `eyJ*` (still supported, less preferred) |
| Public schema tables | 13 (raws_games/teams/players/tournaments, users, workspace_projects, agent_roster, system_connections, system_events, esports_teams/players/matches/stats) |
| RLS enabled on all 13 tables | ✓ |
| Frontend wiring | Not yet present — no `@supabase` package imports in `apps/web/src/` |

**Action taken in PR #43:**
- `apps/web/.env.example` updated to reflect modern publishable-key format (`sb_publishable_*`) and the dashboard provenance.
- Project name/branding in the file header refreshed to "NJZ eSports — ZeSporteXte Platform".

**Out of scope for PR #43** (future Kimi sprint or focused work):
- Install `@supabase/supabase-js` in `apps/web`
- Create the canonical client at `apps/web/src/shared/lib/supabase.ts`
- Generate TypeScript schema types via `mcp__supabase__generate_typescript_types` → `apps/web/src/shared/lib/supabase.types.ts`
- Wire client-side hooks for the 13 existing tables

### Net result

**Zero platform-side dashboard reconciliation is required for the rename itself.** Vercel deploy issue is in-repo fixed. Supabase project verified healthy.

---

## In-repo URL changes — what's been applied

### PR #17 (merged 2026-05-15, `ce8d5bc`)

- `README.md` — 12 occurrences (CI badges, codecov, license, clone, cd, security audit link, status table)
- `mkdocs.yml` — site_url + repo_url
- `.github/ISSUE_TEMPLATE/config.yml` — security advisory + discussions URLs
- `services/legacy-compiler/openapi.yaml` — contact url
- `services/websocket/openapi.yaml` — contact url
- `services/tenet-verification/openapi.yaml` — contact url
- `.github/workflows/integration-tests.yml` — header comment

### PR #A — this PR

**Wave 2a (functional URL refs):**
- `docs/openapi.yaml` — info.contact.url
- `docs/api-contracts/rotas-openapi.yaml` — info.contact.name (intentionally left `api@esports-exe.com` and `api.esports-exe.com` unchanged — placeholder fictional domain values, not live services; Kimi sprint resolves repo-wide)
- `packages/shared/api/.env.example` — CORS_ORIGINS allowlist path
- `docs/operations/EXTERNAL_SERVICE_RECONCILIATION.md` *(this file)*

**Wave 2b (missed-by-#17 sweep — caught in PR-#A self-audit):**
- `.github/workflows/integration-tests.yml` — header comment (line 2)
- `apps/web/src/components/sator-square/hooks/useSpatialData.ts` — JSDoc (line 5)
- `apps/web/src/components/sator-square/index.ts` — JSDoc (line 8)

The wave 2b files are TypeScript / workflow comments only — no runtime string literals or URLs. Caught because the PR-#A self-audit grep included `*.ts` / `*.tsx` extensions and the previous sweep didn't.

### Files explicitly out-of-scope for PR #A (deferred to Kimi sweep)

| File | Why deferred |
|---|---|
| `.kimi/config.yaml` | Kimi's own config; let Kimi update during Stage 1 |
| `.openclaw/agent-manifest.yaml`, `.openclaw/shared-state.json` | Agent framework state files; mass-update with other agent dirs |
| `.agent-prompts/ui-design/mappings/user-path-schema.json` | Part of the ~148 doc/agent refs Kimi Stage 1 batch handles |
| `apps/web/.mascot-cache/index.json` | Build cache — regenerates; no need to hand-edit |
| `apps/web/tests/optimization/BUNDLE_ANALYSIS_REPORT.json` | Stale build artifact; should regen, not hand-edit |
| ~140 `.md` files in `docs/`, `.agents/`, `plans/`, etc. | Bulk doc-only sweep — Kimi Stage 1 mechanical replacement |

---

## Remaining backlog — Kimi K2.6 sprint queue

The following are out of scope for the Pro-window work that produced PR #17 and PR #A. Each is a multi-day workstream best handled by the Kimi swarm or a focused future sprint.

### 1. Exhaustive doc rename sweep (148 files)

Pure documentation references to `eSports-EXE` / `esports-exe.com` across non-functional areas:

```bash
grep -rln 'eSports-EXE' --include='*.md' --include='*.yml' --include='*.yaml' \
  --include='*.json' --include='*.toml' . \
  | grep -v node_modules | grep -v archive | grep -v Archived | wc -l
# = 148 (snapshot 2026-05-15)
```

Directories with concentration: `docs/`, `.agents/`, `plans/`, `project/`, `.agent-prompts/`, `.zencoder/`, `notebooks/`, `memory/`.

**Open decision required before sweep starts:** the `esports-exe.com` fictional domain. Keep as a placeholder, replace with canonical (e.g. `zesportexte.dev`), or remove? PR #A intentionally preserved it pending this decision.

### 2. Polyrepo alignment audit suite

Per the broader directive about aligning ZeSporteXte within the NeXeZ polyrepo:

| Deliverable | Path |
|---|---|
| Per-World-Port PRD | `docs/prds/PRD-WORLD-PORTS.md` |
| Omni-switch / nexez-codon integration PRD | `docs/prds/PRD-OMNI-SWITCH.md` |
| v1.0.0 gate OKRs | `docs/okrs/OKR-V1.0.0-GATE.md` |
| Cross-repo polyrepo boundary ADR | `docs/adrs/ADR-004-CROSS-REPO-POLYREPO-BOUNDARY.md` |
| Rename reconciliation decision record | `docs/adrs/ADR-005-RENAME-RECONCILIATION.md` |
| System audit + portfolio fit report | `docs/operations/POLYREPO_ALIGNMENT_AUDIT.md` |

### 3. Integration-test infrastructure repair

Two bugs documented inline in commit `17043af`'s workflow comment:

- `tests/integration/docker-compose.test.yml` line 69: `command: uvicorn main:app` doesn't match `Dockerfile.api`'s actual entrypoint `packages.shared.api.main:app` — would raise `ModuleNotFoundError`.
- `tests/integration/docker-compose.test.yml` line 20: `../../infra/migrations:/docker-entrypoint-initdb.d` mounts alembic `.py` files into postgres's init-db hook, which expects `.sql` / `.sh` only.

Additional bugs likely surface once these are fixed and the stack actually runs. `docker-compose-tests` is currently non-blocking via step-level `continue-on-error` (re-enable as a hard gate after the sprint).

### 4. `.turbo/cache/` un-track

21 files in `.turbo/cache/` are still tracked in git (per `git ls-files .turbo/cache/`). They were gitignored in commit `b85dc07` but the historical tracked entries weren't removed.

```bash
git rm --cached -r .turbo/cache/
git commit -m "chore(gitignore): untrack 21 historical .turbo/cache entries"
```

### 5. TypeScript error reduction

`MASTER_PLAN.md` tracks a workstream to reduce ~2,142 TS errors → target <100. `TypeScript Type Check` and `TypeScript Typecheck` are non-blocking (step-level `continue-on-error`, see `ce1e440`) until the workstream completes; re-enable as hard gates at the threshold.

### 6. Phase 9.20 Lighthouse threshold

Lighthouse CI is currently non-blocking. The Phase 9.20 gate target is performance ≥0.7, accessibility ≥0.85, best-practices ≥0.85, SEO ≥0.8 per `.lighthouserc.json`. Re-enable as a hard gate once the bundle/perf workstream meets thresholds.

---

## References

- **PR #17** — `notbleaux/ZeSporteXte#17` (merged 2026-05-15) — premier onboarding standards + CI hygiene + rename wave 1
- **Commit `79a629e`** — `@njz/types` tsconfig fix (the actual Build Web App unblocker)
- **Commit `439262e`** — turbo `--filter=@njzitegeist/web` fix (root cause of Build Web App "no package found")
- **Commit `ce1e440`** — moved `continue-on-error` from job-level → step-level so checks report success
- **Commit `17043af`** — documented `docker-compose.test.yml` infra bugs
- **CLAUDE.md** — TENET architecture and project conventions
- **MASTER_PLAN.md** — TS error reduction workstream, Phase 9.20 Lighthouse gate
