# Secret Management Guide
## Secure Handling of API Keys and Credentials

**Date:** March 8, 2026  
**Classification:** SECURITY CRITICAL

---

## ⚠️ Current Risk

**Identified Issue:** `.env.example` files with manual configuration  
**Risk Level:** HIGH  
**Impact:** API keys can be accidentally committed to Git

---

## Recommended: GitHub Secrets

### Step 1: Add Secrets to Repository

1. Go to: https://github.com/notbleaux/eSports-EXE/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret:

| Secret Name | Purpose | Example |
|-------------|---------|---------|
| `DATABASE_URL` | Supabase connection | `postgresql://...` |
| `REDIS_URL` | Redis connection | `redis://...` |
| `PANDASCORE_API_KEY` | Pandascore API | `abc123...` |
| `SATOR_API_KEY` | Internal API | `xyz789...` |
| `GITHUB_TOKEN` | GitHub API | `ghp_...` |

### Step 2: Use in GitHub Actions

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    steps:
      - name: Deploy to Render
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          API_KEY: ${{ secrets.SATOR_API_KEY }}
        run: |
          echo "Deploying with secure credentials..."
```

### Step 3: Use in Application

```python
import os

# Read from environment (set by GitHub Secrets in production)
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not set")
```

---

## Alternative: Doppler (Recommended for Teams)

### Why Doppler?
- Centralized secret management
- Works across all environments
- Automatic rotation
- Team access control

### Setup

1. Create account: https://doppler.com
2. Create project: `sator-esports`
3. Add secrets to Doppler dashboard
4. Install CLI:
```bash
# macOS
brew install doppler

# Login
doppler login

# Configure project
doppler setup
```

5. Use in development:
```bash
# Run with secrets
doppler run -- npm run dev
```

6. Use in production (GitHub Actions):
```yaml
- name: Doppler setup
  uses: dopplerhq/cli-action@v1
  
- name: Deploy with Doppler
  env:
    DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN }}
  run: doppler run -- npm run deploy
```

---

## Alternative: HashiCorp Vault (Enterprise)

For advanced security requirements:

```python
import hvac

# Connect to Vault
client = hvac.Client(url='https://vault.sator.internal')
client.auth.approle.login(
    role_id=os.getenv('VAULT_ROLE_ID'),
    secret_id=os.getenv('VAULT_SECRET_ID')
)

# Read secrets
secret = client.secrets.kv.v2.read_secret_version(
    path='sator/database'
)
DATABASE_URL = secret['data']['data']['url']
```

---

## Local Development

### Option 1: .env File (NEVER COMMIT)

```bash
# .env (add to .gitignore!)
DATABASE_URL=postgresql://localhost/sator_dev
PANDASCORE_API_KEY=test_key_here
```

```bash
# .gitignore
.env
.env.local
*.pem
*.key
```

### Option 2: Doppler CLI (Recommended)

```bash
# Dev environment
doppler run -- npm run dev

# Test environment
doppler run -c test -- pytest
```

---

## Migration Plan

### Phase 1: Audit (Week 1)
- [ ] Identify all hardcoded secrets
- [ ] List all API keys in use
- [ ] Check for secrets in Git history

### Phase 2: Cleanup (Week 2)
- [ ] Rotate exposed API keys
- [ ] Remove secrets from code
- [ ] Add to .gitignore

### Phase 3: Implement (Week 3)
- [ ] Add secrets to GitHub
- [ ] Update deployment configs
- [ ] Test in staging

### Phase 4: Verify (Week 4)
- [ ] Run `git-secrets` scan
- [ ] Confirm no secrets in repo
- [ ] Document for team

---

## Security Checklist

- [ ] `.env` in `.gitignore`
- [ ] No secrets in code
- [ ] GitHub Secrets configured
- [ ] Pre-commit hooks with `detect-secrets`
- [ ] Regular key rotation schedule
- [ ] Access logging enabled

---

## Emergency: Secret Leaked?

1. **Revoke immediately** - Regenerate API key
2. **Check logs** - See if it was used
3. **Scan repo** - `git-secrets --scan-history`
4. **Rotate all** - Change related keys
5. **Review access** - Check who had access

---

**Bottom Line:** Never commit secrets. Use GitHub Secrets minimum, Doppler recommended.