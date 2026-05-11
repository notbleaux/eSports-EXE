# Pull Request

> **Tip:** Use a typed template by appending `?template=feature.md` (or `fix.md`, `refactor.md`, `docs.md`, `schema-change.md`, `deletion.md`, `agent_session_handoff.md`) to the PR URL. This default applies when no template query is set.

## Summary

<!-- 1-3 sentences: what changes and why. Link the issue. -->

Closes #

## Risk tier

- [ ] `[SAFE]` — non-breaking, no schema changes
- [ ] `[STRUCT]` — structural change, requires CODEOWNER review
- [ ] `[CRIT]` — schema / infra / deletion change, 24h hold per `docs/ai-operations/DRIFT-CLOSURE-SLA.md`

## Type of change

- [ ] `feat` — new capability
- [ ] `fix` — defect repair
- [ ] `refactor` — no behavior change
- [ ] `docs` — documentation only
- [ ] `test` — test coverage
- [ ] `chore` / `build` / `ci`

## Surface

- [ ] `apps/web`
- [ ] `apps/browser-extension` / `companion` / `overlay`
- [ ] `services/api` / `packages/shared/api`
- [ ] `data/schemas`
- [ ] `infra` / `.github/workflows`
- [ ] `docs`

## Pre-merge checklist

- [ ] `pnpm run check` passes locally (typecheck + unit)
- [ ] If touching `data/schemas/` or `packages/@njz/types`, updated `.agents/SCHEMA_REGISTRY.md`
- [ ] No new root-level `.md` files outside `.doc-tiers.json` `approved_root_files`
- [ ] No secrets, `.env.*`, or generated artifacts committed
- [ ] Commit messages follow `<type>(<scope>): <description> - <context>`
- [ ] If agent-authored, `[agent: <id>]` footer is present on commits

## Screenshots / evidence

<!-- For UI changes, attach before/after. For backend, attach test output or curl. -->

## Notes for reviewer

<!-- Anything reviewers should know: tradeoffs considered, follow-ups deferred, related PRs. -->
