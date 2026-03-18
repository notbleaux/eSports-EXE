# Test Suites, Linting, E2E, Security & Safety Plans

## Test Suites Implementation
- **Unit**: Vitest (website-v2), pytest (data/python) - 80% coverage.
- **E2E**: Playwright (playwright.config.ts ready).
- **Impl**: `npm test`, `pytest data/`.

## Linting & Styling Proof-Reads
- ESLint/Prettier (configs exist): `npm run lint`.
- Tailwind IntelliSense extension.

## Security/Safety Protocols
- **CodeScan Issues**: Likely dev deps (npm audit), legacy deps. Run `npm audit --fix`, update package-lock.json.
- **Frameworks**:
  - Scripts/Bots: Circuit breaker (ADR-001), rate limits.
  - AI Agents: .pre-commit-config.yaml, axioms review.
- **Notification Spams**: Failing workspaces (pytest.ini?), CI errors (.github/workflows?). Fix: `npm audit clean --force`, CI retry logic.

## Outlined Actions
1. `npm audit fix` (website-v2).
2. `pytest --cov data/` (fix Pylance numpy).
3. `npx playwright test`.
4. GitHub Codescan baseline.

**Deps Check**: package.json (TF.js heavy, audit), safety (no secrets, env vars).

Repo secure/test-ready post-actions.

