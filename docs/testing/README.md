[Ver001.000]

# Testing

Index of test surfaces, layered from fastest to slowest.

| Layer | Command | Location | Notes |
|---|---|---|---|
| Type check | `pnpm run typecheck` | all workspaces | Strict TS, blocks `noUnusedLocals` |
| Unit (web) | `pnpm run test:unit` | `apps/web/` (Vitest) | Watch mode: `cd apps/web && npm run test` |
| Unit (Python) | `pytest tests/unit/ -v` | `tests/unit/` | |
| Firewall | `pnpm run test:firewall` | `packages/shared/packages/data-partition-lib/` | Data partition security |
| Schema parity | `pnpm run validate:schema` | `packages/shared/packages/stats-schema/` | |
| Integration | `pnpm run test:integration` | `tests/integration/` | Requires Docker |
| E2E | `pnpm run test:e2e` | `tests/e2e/` (Playwright) | 95+ tests |
| Visual | `cd apps/web && npm run test:visual` | `apps/web/tests/visual/` | Playwright screenshots |
| Accessibility | see `tests/accessibility/` | | |
| Load | `tests/load/` | Locust, k6 | Manual / scheduled |
| Smoke | `pnpm run test:smoke` | `tests/smoke/smoke_test.sh` | Production sanity check |

## Local confidence command

```bash
pnpm run check
```

Runs typecheck + unit tests. The single command to run before opening a PR.

## Deeper references

- [`docs/TESTING_STRATEGY.md`](../TESTING_STRATEGY.md) (if present)
- [`apps/web/TESTING_STRATEGY.md`](../../apps/web/TESTING_STRATEGY.md)
- [`docs/CI_CD_PIPELINE.md`](../CI_CD_PIPELINE.md)
