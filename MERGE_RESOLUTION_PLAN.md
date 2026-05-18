# Merge Resolution Plan — rotas-phase-1 → main

## Situation Analysis

### Divergence Scale
| Metric | Value |
|--------|-------|
| Our commits | 4 (`a5e4ab6` → `133ee41`) |
| Remote commits | 116 (`d11542a` → `bc64904`) |
| Our changed files | ~400 |
| Remote changed files | 1,349 |
| **Overlap (both modified)** | **~200+ files** |

### Our Changes (Must Preserve)

| Commit | Files | Value |
|--------|-------|-------|
| `a5e4ab6` | TypeScript fixes across codebase | 580 errors → 0 |
| `fd17683` | Gesture/spatial audio types + rebrand | `@ts-nocheck` cleanup |
| `c7355b6` | **ROTAS API client** | `src/api/rotas.ts` (11 endpoints) |
| `133ee41` | **Player/Team hooks** | 6 hooks + cache keys |

### Critical Files We Own
These files are NEW or uniquely modified by us — no remote equivalent:

```
apps/web/src/api/rotas.ts              ← NEW: ROTAS API client
apps/web/src/hooks/usePlayer.ts       ← NEW
apps/web/src/hooks/usePlayerStats.ts  ← NEW
apps/web/src/hooks/usePlayers.ts     ← NEW
apps/web/src/hooks/useTeam.ts         ← NEW
apps/web/src/hooks/useTeamStats.ts    ← NEW
apps/web/src/hooks/useTeams.ts       ← NEW
```

### High-Risk Overlap Areas
Files both sides modified — need careful resolution:

1. **`apps/web/src/api/index.ts`** — We added ROTAS exports; remote may have restructured
2. **`apps/web/src/hooks/useLiveMatches.ts`** — We rewired to ROTAS; remote may have changes
3. **`apps/web/src/hooks/useMatchData.ts`** — Same
4. **`apps/web/src/hooks/useMatchHistory.ts`** — Same
5. **`apps/web/src/lib/cache-manager.ts`** — We added `STANDARD` config + query keys
6. **`apps/web/src/App.tsx`** — Both sides modified (rebrand + imports)
7. **`apps/web/src/hub-1-sator/index.tsx`** — Both sides (suppression + features)
8. **`apps/web/src/hub-2-rotas/index.tsx`** — Both sides
9. **`apps/web/package.json`** — Dependency changes likely on both sides
10. **`apps/web/tsconfig.json`** — We added path aliases

### Origin Main Changes (What We'd Be Merging Into)
Based on commit history, remote includes:
- PR #54: Docker majors audit + wiki research
- PR #49: Agent sign-off helper CLI
- PR #37: Vite 6.4.2 → 7.3.2 (major bump)
- PR #42: Next.js 15.5.18 → 16.2.6 (major bump)
- PR #53: Sourcegraph wiki features
- Various agent framework files

## Recommended Strategy: "Rebase + Re-apply"

Instead of a messy merge with 200+ file conflicts, the cleanest approach:

### Phase 1: Backup Our Work
```bash
cd ZeSporteXte/apps/web
git checkout rotas-phase-1
git diff main..HEAD > /tmp/our-changes.patch
```

### Phase 2: Reset to Origin Main
```bash
git checkout main
git fetch origin
git reset --hard origin/main  # Now at bc64904
```

### Phase 3: Cherry-Pick Our Changes
Apply only the specific files we need, one by one:

```bash
# From rotas-phase-1 branch, extract our critical files
git checkout rotas-phase-1 -- src/api/rotas.ts
git checkout rotas-phase-1 -- src/hooks/usePlayer.ts
git checkout rotas-phase-1 -- src/hooks/usePlayerStats.ts
git checkout rotas-phase-1 -- src/hooks/usePlayers.ts
git checkout rotas-phase-1 -- src/hooks/useTeam.ts
git checkout rotas-phase-1 -- src/hooks/useTeamStats.ts
git checkout rotas-phase-1 -- src/hooks/useTeams.ts
```

### Phase 4: Manually Merge `api/index.ts`
The `api/index.ts` on origin/main likely has different structure. We need to:
1. Read the current `origin/main` version
2. Add our ROTAS exports without breaking existing ones
3. Handle any renamed/moved Pandascore exports

### Phase 5: Manually Merge `cache-manager.ts`
Origin may have added new cache configs. We need to add our `STANDARD` config and `players`/`teams` query keys without overwriting origin's changes.

### Phase 6: Re-apply Hook Rewiring
The match hooks (`useLiveMatches`, `useMatchData`, `useMatchHistory`) need to be checked:
- If origin rewired them too → merge logic carefully
- If origin didn't touch them → apply our ROTAS wiring

### Phase 7: TypeScript Verification
```bash
cd apps/web
pnpm install  # May need due to Vite/Next major bumps
pnpm run typecheck  # Must be 0 errors
pnpm run build  # Must succeed
```

### Phase 8: Commit and Push
```bash
git add -A
git commit -m "feat(rotas): Phase 1 — ROTAS API integration (rebased on main)

- Add ROTAS API client (11 endpoints)
- Add player/team TanStack Query hooks (6 hooks)
- Add STANDARD cache config + query keys
- Wire useLiveMatches, useMatchData, useMatchHistory to ROTAS
- Rebased onto origin/main (bc64904) with Vite 7.3.2 + Next 16.2.6
- 0 TypeScript errors, build verified"
git push origin main
```

## Alternative Strategy: "Branch Merge with Conflict Resolution"

If you prefer to preserve all our history (not just the ROTAS changes):

```bash
git checkout main
git merge origin/main  # Accept all origin changes first
# Then manually re-apply our ROTAS files from rotas-phase-1 branch
```

This is more work but keeps the full commit history.

## My Recommendation

**Use "Rebase + Re-apply" (Strategy 1).**

Reasons:
1. The overlap is too large for clean auto-merge
2. Our value is in the ROTAS files, not the 400-file changeset
3. Origin has major dependency bumps (Vite 7, Next 16) — our old branch may not even build against those versions
4. It's faster and safer

## Questions for You

Before I execute, confirm:

1. **Preserve all our changes, or just ROTAS?**
   - Just ROTAS (faster) ← My recommendation
   - All 400 files (more work, keeps history)

2. **Risk tolerance?**
   - Low: I'll verify every step with `typecheck` and `build`
   - Medium: Standard verification
   - High: Push first, fix later (not recommended)

3. **Should I check origin's current `api/index.ts` and `cache-manager.ts` first?**
   - Yes, to see if they already have ROTAS work
   - No, just proceed

## Estimated Timeline

| Phase | Estimate |
|-------|----------|
| Backup + reset | 2 min |
| Extract our files | 2 min |
| Merge `api/index.ts` | 5 min |
| Merge `cache-manager.ts` | 3 min |
| Check + merge hook files | 5 min |
| `pnpm install` | 3 min |
| `typecheck` + `build` | 2 min |
| Fix any errors | 5-15 min |
| Commit + push | 2 min |
| **Total** | **29-39 min** |

---

**Ready to proceed?** Reply with:
- `"Proceed with Strategy 1"` — Rebase + Re-apply (recommended)
- `"Proceed with Strategy 2"` — Full merge with conflict resolution
- `"Check origin files first"` — I'll inspect the key files before deciding
