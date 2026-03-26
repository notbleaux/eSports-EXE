# Branch Protection Rules — NJZiteGeisTe Platform

## Main Branch (`main`)

Configure these rules in GitHub → Settings → Branches → Add Rule for `main`:

### Required Status Checks (must pass before merge)
- `quality-checks` — linting, formatting, type checking
- `security-scan` — Bandit (Python), detect-secrets
- `test` — pytest + Vitest
- `build` — Vite production build

### Pull Request Requirements
- Minimum 1 approving review required
- Dismiss stale reviews when new commits are pushed
- Require branches to be up to date before merging
- Do not allow bypassing the above settings

### Restrictions
- Do not allow force pushes
- Do not allow deletions

## How to Apply
1. Go to: https://github.com/notbleaux/eSports-EXE/settings/branches
2. Click "Add branch protection rule"
3. Branch name pattern: `main`
4. Check all boxes listed above
5. Click "Save changes"

## Development Workflow
```
feature/your-feature  →  PR to main  →  review + checks  →  merge
```

Never commit directly to main.
