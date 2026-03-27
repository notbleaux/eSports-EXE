## Feature: [description]

### What this adds
-

### Risk tier
- [ ] `[SAFE]` — non-breaking, no schema changes
- [ ] `[STRUCT]` — structural change, requires CODEOWNER review
- [ ] `[CRIT]` — schema/infra/deletion change, 24h hold

### Testing
- [ ] Unit tests added/updated
- [ ] E2E tests cover the new route/feature
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test:unit` passes

### Checklist
- [ ] Follows TENET architecture (no TENET-as-hub violations)
- [ ] No inline type definitions (all types via `@njz/types`)
- [ ] No secrets committed
- [ ] `[agent: <id>]` footer added if agent-authored
