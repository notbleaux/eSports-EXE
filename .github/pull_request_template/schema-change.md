## Schema Change: [type name]

**THIS PR IS ALWAYS `[CRIT]`** — schema changes affect every consumer.

### Change description
[What was added, renamed, or removed]

### Consumer impact
| Consumer | Impact | Migration required? |
|----------|--------|---------------------|
| `apps/web/` | | |
| `services/` | | |
| `packages/shared/` | | |

### Testing
- [ ] `pnpm typecheck` passes across full monorepo
- [ ] `.agents/SCHEMA_REGISTRY.md` updated with new/changed types
- [ ] No duplicate type definitions (`grep -r "interface Player" apps/web/src/` → 0)

### Checklist
- [ ] CODEOWNER review obtained
- [ ] 24-hour hold observed
- [ ] `[agent: <id>]` footer added if agent-authored
