[Ver001.000]

# Comprehensive Setup Procedures — NJZiteGeisTe Platform

**Version:** 2.1.0  
**Last Updated:** 2026-04-05  
**Classification:** Development & Deployment Guide

---

## Table of Contents

1. [Prerequisites Overview](#1-prerequisites-overview)
2. [User Account Setups](#2-user-account-setups)
3. [Development Environment Setup](#3-development-environment-setup)
4. [API Setup Requirements](#4-api-setup-requirements)
5. [VS Code: Extension Setup](#5-vs-code-extension-setup)
6. [Build & Deployment](#6-build--deployment)
7. [Verification & Testing](#7-verification--testing)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites Overview

### 1.1 System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Windows 10 / macOS 12 / Ubuntu 20.04 | Windows 11 / macOS 14 / Ubuntu 22.04 |
| RAM | 8 GB | 16 GB |
| Storage | 10 GB free | 20 GB free |
| Node.js | 18.x | 20.x LTS |
| Python | 3.11 | 3.11+ |
| Docker Desktop | 4.20+ | Latest |

### 1.2 Required Accounts Summary

| Service | Purpose | Cost | Required |
|---------|---------|------|----------|
| GitHub | Source control | Free | ✅ Yes |
| Vercel | Frontend hosting | Free tier | ✅ Yes |
| Render | API hosting | Free tier | ✅ Yes |
| Supabase | PostgreSQL database | Free tier | ✅ Yes |
| Upstash | Redis cache | Free tier | ✅ Yes |
| Pandascore | Esports data API | Free tier | ⚠️ Optional |

---

## 2. User Account Setups

### 2.1 GitHub Account Setup

**Purpose:** Source control and CI/CD automation

**Steps:**
```bash
# 1. Create account at https://github.com/signup
# 2. Install GitHub CLI (optional but recommended)
winget install GitHub.cli        # Windows
brew install gh                  # macOS
sudo apt install gh              # Linux

# 3. Authenticate
gh auth login

# 4. Fork/clone the repository
git clone https://github.com/notbleaux/eSports-EXE.git
cd eSports-EXE
```

**MFA Setup:**
1. Go to Settings → Security → Enable two-factor authentication
2. Use authenticator app (Google Authenticator, Authy, etc.)
3. Save recovery codes securely

**Cost:** Free for public repositories

---

### 2.2 Supabase Account Setup

**Purpose:** PostgreSQL database hosting

**Steps:**
1. Navigate to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (recommended for SSO)
4. Create new organization: `njz-platform`
5. Create new project:
   - **Name:** `njzitegeist-prod` (or `njzitegeist-dev`)
   - **Database Password:** Generate strong password
   - **Region:** Choose closest to your users (e.g., `us-east-1`)

**Get Connection String:**
1. Go to Project Settings → Database
2. Under "Connection String", select "URI" tab
3. Copy the connection string format:
   ```
   postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
   ```
4. For connection pooling (recommended), use port `6543`:
   ```
   postgresql://postgres:[password]@db.[project-ref].supabase.co:6543/postgres
   ```

**Security Configuration:**
1. Settings → Database → SSL Mode: Require
2. Settings → API → Configure JWT Secret (save for later)

**Cost:** Free tier includes:
- 500 MB database storage
- 2 GB egress/month
- 200 concurrent connections
- Pauses after 7 days inactivity

---

### 2.3 Upstash Account Setup

**Purpose:** Redis caching and real-time data

**Steps:**
1. Navigate to https://upstash.com
2. Sign up with GitHub or email
3. Click "Create Database"
4. Configuration:
   - **Name:** `njz-redis`
   - **Region:** Same as Supabase (for low latency)
   - **Type:** Global (for edge caching) or Regional

**Get Redis URL:**
1. Click on your database
2. Go to "Details" tab
3. Copy the `REDIS_URL` (TLS enabled):
   ```
   rediss://default:[password]@[host]:[port]
   ```

**Cost:** Free tier includes:
- 10,000 commands/day
- 256 MB memory
- No persistence (data lost on restart)

---

### 2.4 Render Account Setup

**Purpose:** FastAPI backend hosting

**Steps:**
1. Navigate to https://render.com
2. Sign up with GitHub
3. Complete email verification

**Create Web Service (Blueprint Method):**
The repository includes `render.yaml` for automatic setup:

1. In Render dashboard, click "New +" → "Blueprint"
2. Connect your GitHub repository
3. Render will detect `render.yaml` and create:
   - Web service for API
   - Redis instance

**Manual Setup Alternative:**
1. Click "New +" → "Web Service"
2. Connect repository
3. Configure:
   - **Name:** `njz-api`
   - **Runtime:** Python 3
   - **Build Command:**
     ```bash
     pip install poetry
     poetry install --only main --no-interaction
     ```
   - **Start Command:**
     ```bash
     cd packages/shared/api && poetry run uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
     ```
   - **Plan:** Free

**Cost:** Free tier includes:
- 750 hours/month (sufficient for 24/7)
- 512 MB RAM
- 1 worker process
- Spins down after 15 min inactivity (cold start ~30s)

---

### 2.5 Vercel Account Setup

**Purpose:** Frontend React application hosting

**Steps:**
1. Navigate to https://vercel.com
2. Sign up with GitHub
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `apps/web`
   - **Build Command:** `pnpm run build`
   - **Output Directory:** `dist`

**Alternative: CLI Setup**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link and deploy
vercel
vercel --prod  # Production deployment
```

**Environment Variables (Vercel Dashboard):**
1. Project Settings → Environment Variables
2. Add:
   - `VITE_API_URL`: `https://your-api-url.onrender.com/v1`
   - `VITE_WS_URL`: `wss://your-api-url.onrender.com/ws`

**Cost:** Free tier includes:
- 100 GB bandwidth/month
- 6,000 build minutes/month
- 1,000 image optimizations/day

---

### 2.6 Pandascore API Setup (Optional)

**Purpose:** Official esports data API for legal data access

**Steps:**
1. Navigate to https://pandascore.co
2. Create account
3. Go to Dashboard → API Keys
4. Generate new key (starts with `pc_live_` or `pc_test_`)

**Cost:** Free tier includes:
- Limited requests/day
- Basic endpoints access
- No real-time data

---

### 2.7 OAuth Provider Setup (Optional - for Authentication)

#### Discord OAuth
1. Go to https://discord.com/developers/applications
2. "New Application" → Name it
3. OAuth2 → General
4. Add Redirect URL: `https://your-api.onrender.com/auth/oauth/discord/callback`
5. Copy Client ID and Client Secret

#### Google OAuth
1. Go to https://console.cloud.google.com/apis/credentials
2. "Create Credentials" → "OAuth 2.0 Client ID"
3. Configure consent screen
4. Add Authorized Redirect URI
5. Copy Client ID and Secret

#### GitHub OAuth
1. Go to https://github.com/settings/developers
2. "New OAuth App"
3. Set Authorization Callback URL
4. Copy Client ID and Generate/Copy Secret

---

## 3. Development Environment Setup

### 3.1 Node.js and pnpm Setup

**Install Node.js (20.x LTS recommended):**
```bash
# Windows (using winget)
winget install OpenJS.NodeJS.LTS

# macOS
brew install node@20

# Linux (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # v20.x.x
npm --version   # 10.x.x
```

**Install pnpm (package manager):**
```bash
# Windows
npm install -g pnpm

# macOS/Linux
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Verify
pnpm --version  # 8.15.0 or higher
```

**Enable pnpm in Monorepo:**
```bash
# From project root
pnpm install
```

**Expected Output:**
```
Packages: +1542
++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 1542, reused 1500, downloaded 42, added 1542, done
node_modules/.bin/turbo
```

---

### 3.2 Python Virtual Environment Setup

**Install Python 3.11+:**
```bash
# Windows (using winget)
winget install Python.Python.3.11

# macOS
brew install python@3.11

# Linux
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-dev

# Verify
python --version  # Python 3.11.x
```

**Create and Activate Virtual Environment:**
```bash
# From project root
cd services/api

# Create virtual environment
python -m venv .venv

# Activate (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Activate (Windows Command Prompt)
.venv\Scripts\activate.bat

# Activate (macOS/Linux)
source .venv/bin/activate

# Verify (should show path to venv)
which python
```

**Install Poetry (Python dependency manager):**
```bash
# Windows (PowerShell)
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | py -

# macOS/Linux
curl -sSL https://install.python-poetry.org | python3 -

# Add to PATH (Windows)
$env:PATH += ";$env:APPDATA\Python\Scripts"

# Add to PATH (macOS/Linux)
export PATH="$HOME/.local/bin:$PATH"

# Verify
poetry --version  # Poetry 1.7.x
```

**Install Python Dependencies:**
```bash
# From services/api directory (with venv activated)
cd services/api
poetry install

# Expected output:
# Installing dependencies from lock file
# Package operations: 85 installs, 0 updates, 0 removals
# ...
# Installing the current project: sator-api (1.0.0)
```

---

### 3.3 Docker Services Setup

**Install Docker Desktop:**
1. Download from https://www.docker.com/products/docker-desktop
2. Run installer
3. Start Docker Desktop
4. Verify:
   ```bash
   docker --version
   docker-compose --version
   ```

**Start Development Services:**
```bash
# From project root
# Start PostgreSQL and Redis only
docker-compose up -d db redis

# Or start all services
docker-compose up -d

# Expected output:
# [+] Running 4/4
#  ✔ Network njz-network    Created
#  ✔ Container njz-db       Started
#  ✔ Container njz-redis    Started
```

**Verify Services:**
```bash
# Check running containers
docker ps

# Expected output:
# CONTAINER ID   IMAGE              STATUS          PORTS
# xxxxxxxxxx     postgres:15        Up 10 seconds   0.0.0.0:5432->5432/tcp
# xxxxxxxxxx     redis:7            Up 10 seconds   0.0.0.0:6379->6379/tcp

# Test PostgreSQL
docker exec -it njz-db psql -U postgres -c "\l"

# Test Redis
docker exec -it njz-redis redis-cli ping
# Expected: PONG
```

**Docker Management Commands:**
```bash
# Stop services
docker-compose down

# Reset database (removes all data)
docker-compose down -v

# View logs
docker-compose logs -f db
docker-compose logs -f redis

# Access database shell
docker exec -it njz-db psql -U postgres -d njz_platform
```

---

### 3.4 Environment Variables Configuration

**Create Local Environment File:**
```bash
# From project root
copy .env.example .env.local        # Windows
cp .env.example .env.local          # macOS/Linux
```

**Edit `.env.local` with your values:**
```bash
# ─── Database (Local Docker or Supabase) ───────────────────
# Option 1: Local Docker
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/njz_platform

# Option 2: Supabase (recommended for team development)
# DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:6543/postgres

DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=5

# ─── Cache (Local Docker or Upstash) ──────────────────────
# Option 1: Local Docker
REDIS_URL=redis://localhost:6379/0

# Option 2: Upstash
# REDIS_URL=rediss://default:[password]@[host]:[port]

# ─── API Security ─────────────────────────────────────────
# Generate with: openssl rand -base64 32
JWT_SECRET_KEY=your-32-plus-char-random-string-here-change-in-production

# ─── CORS ─────────────────────────────────────────────────
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# ─── External Data APIs ───────────────────────────────────
PANDASCORE_API_KEY=your-pandascore-token-here  # Optional

# ─── Frontend (Vite) ──────────────────────────────────────
VITE_API_URL=http://localhost:8000/v1
VITE_WS_URL=ws://localhost:8000/ws
VITE_APP_ENV=development

# ─── Environment ──────────────────────────────────────────
ENVIRONMENT=development
LOG_LEVEL=info
APP_VERSION=2.1.0
```

**Generate JWT Secret:**
```bash
# Windows (PowerShell)
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[System.Convert]::ToBase64String($bytes)

# macOS/Linux
openssl rand -base64 32
```

---

### 3.5 Pre-commit Hooks Setup

**Install pre-commit:**
```bash
# With venv activated
pip install pre-commit

# Or using pipx (recommended)
pip install pipx
pipx install pre-commit
```

**Install Hooks:**
```bash
# From project root
pre-commit install

# Expected output:
# pre-commit installed at .git/hooks/pre-commit
```

**Run Hooks Manually (Optional):**
```bash
# Run all hooks on all files
pre-commit run --all-files

# Run specific hook
pre-commit run black
pre-commit run eslint
```

**Pre-commit Hooks Included:**
| Hook | Purpose |
|------|---------|
| trailing-whitespace | Remove trailing whitespace |
| end-of-file-fixer | Ensure files end with newline |
| check-yaml | Validate YAML syntax |
| check-json | Validate JSON syntax |
| check-added-large-files | Block files > 1000KB |
| black | Python code formatting |
| ruff | Python linting |
| mypy | Python type checking |
| eslint | JavaScript/TypeScript linting |
| prettier | Code formatting |
| detect-secrets | Security scan for secrets |

---

## 4. API Setup Requirements

### 4.1 FastAPI Backend Setup

**Project Structure:**
```
services/api/
├── src/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry
│   ├── config.py            # Configuration
│   ├── database.py          # Database connection
│   ├── routers/             # API endpoints
│   ├── models/              # Pydantic models
│   └── services/            # Business logic
├── tests/                   # Test suite
├── pyproject.toml           # Poetry config
└── README.md
```

**Start Development Server:**
```bash
# From project root
pnpm run dev:api

# Or directly with Poetry
cd services/api
poetry run uvicorn src.main:app --reload --port 8000 --host 0.0.0.0

# Expected output:
# INFO:     Will watch for changes in these directories: [...]
# INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

**Verify API is Running:**
```bash
# Health check
curl http://localhost:8000/health

# Expected output:
# {"status":"healthy","version":"2.1.0","timestamp":"2026-04-05T..."}

# API Documentation
curl http://localhost:8000/docs
# Open browser: http://localhost:8000/docs (Swagger UI)
# Open browser: http://localhost:8000/redoc (ReDoc)
```

---

### 4.2 PostgreSQL Database Setup

**Local Development (Docker):**
```bash
# Database is created automatically by docker-compose
# Access via:
docker exec -it njz-db psql -U postgres -d njz_platform

# Run SQL commands inside container:
\dt              # List tables
\l               # List databases
\q               # Quit
```

**Run Migrations:**
```bash
# Using Alembic (from project root)
pnpm run db:migrate

# Or directly
cd services/api
poetry run alembic -c ../../infra/migrations/alembic.ini upgrade head

# Generate new migration
cd services/api
poetry run alembic -c ../../infra/migrations/alembic.ini revision --autogenerate -m "description"
```

**Supabase Production Setup:**
```bash
# Run migrations against Supabase (replace with your connection string)
set DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:6543/postgres
psql %DATABASE_URL% -f infra/migrations/001_initial_schema.sql
```

---

### 4.3 Redis Cache Setup

**Local Development (Docker):**
```bash
# Already running from docker-compose
# Test connection:
docker exec -it njz-redis redis-cli

# Redis commands:
KEYS *           # List all keys
GET key_name     # Get value
DEL key_name     # Delete key
FLUSHALL         # Clear all (USE WITH CAUTION)
exit             # Quit
```

**Configuration in API:**
```python
# services/api/src/config.py
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
REDIS_POOL_MIN = int(os.getenv("REDIS_POOL_MIN", "2"))
REDIS_POOL_MAX = int(os.getenv("REDIS_POOL_MAX", "10"))
```

---

### 4.4 WebSocket Service Setup

**WebSocket Endpoint:**
- URL: `ws://localhost:8000/ws` (local)
- URL: `wss://your-api.onrender.com/ws` (production)

**Testing WebSocket:**
```bash
# Using wscat
npm install -g wscat

wscat -c ws://localhost:8000/ws
> {"type": "subscribe", "channel": "matches"}
< {"type": "ack", "channel": "matches"}
```

---

### 4.5 Pandascore API Integration

**Configuration:**
```bash
# Add to .env.local
PANDASCORE_API_KEY=pc_live_your_token_here
```

**Test Integration:**
```bash
# Test API connectivity
curl "https://api.pandascore.co/valorant/matches?token=$PANDASCORE_API_KEY"

# Test through local API
curl http://localhost:8000/v1/matches/live
```

---

## 5. VS Code: Extension Setup

### 5.1 Extension Installation Order

**Step 1: Install Core Extensions**
Open VS Code: Command Palette (`Ctrl+Shift+P`) → "Extensions: Install Extensions"

Install in this order:

**Python Stack:**
1. `ms-python.python` - Python language support
2. `ms-python.vscode-pylance` - Python language server
3. `ms-python.black-formatter` - Python formatting
4. `ms-python.debugpy` - Python debugging

**JavaScript/TypeScript Stack:**
5. `dbaeumer.vscode-eslint` - ESLint integration
6. `esbenp.prettier-vscode` - Code formatting
7. `bradlc.vscode-tailwindcss` - Tailwind CSS IntelliSense

**Testing:**
8. `ms-playwright.playwright` - Playwright test runner
9. `vitest.explorer` - Vitest test explorer

**Database:**
10. `ckolkman.vscode-postgres` - PostgreSQL client
11. `mikestead.dotenv` - Environment file support

**Docker:**
12. `ms-azuretools.vscode-docker` - Docker management

**Git:**
13. `eamodio.gitlens` - Git supercharged
14. `github.vscode-pull-request-github` - GitHub PRs

**Alternative: Bulk Install via CLI**
```bash
# From project root
code --install-extension ms-python.python
code --install-extension ms-python.vscode-pylance
code --install-extension ms-python.black-formatter
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-playwright.playwright
code --install-extension vitest.explorer
code --install-extension ckolkman.vscode-postgres
code --install-extension mikestead.dotenv
code --install-extension ms-azuretools.vscode-docker
code --install-extension eamodio.gitlens
```

### 5.2 MCP Server Configuration

**What is MCP:** Model Context Protocol servers enable AI assistants to interact with your codebase.

**Configure MCP in VS Code::**

1. Open Settings (`Ctrl+,`) → Search "MCP"
2. Or edit `.vscode/mcp.json`:

```json
{
  "servers": {
    "codebridge": {
      "command": "npx",
      "args": ["-y", "@p-de-jong/mcp-server-codebridge"]
    },
    "debugger": {
      "command": "npx",
      "args": ["-y", "@speakeasy/mcp-debugger"]
    },
    "tenets": {
      "command": "npx",
      "args": ["-y", "@manic-agency/tenets-mcp-server"]
    }
  }
}
```

**Install MCP Extensions:**
```bash
code --install-extension pimdejong.codebridge-mcp
code --install-extension speakeasy.debugger-mcp
code --install-extension manicagency.tenets-mcp-server
```

### 5.3 AI Assistant Configuration

**GitHub Copilot Setup (Optional):**
1. Install `github.copilot` extension
2. Sign in with GitHub account
3. Configure in settings:
   ```json
   {
     "github.copilot.enable": {
       "*": true,
       "markdown": false,
       "plaintext": false
     }
   }
   ```

**Baryon AI Setup (Alternative):**
```json
{
  "a3agent-spec-baryonai.model": "kimi-k2.5",
  "a3agent-spec-baryonai.apiEndpoint": "https://api.moonshot.cn/v1",
  "a3agent-spec-baryonai.enableMcp": true
}
```

### 5.4 Memory System Setup

**BrainSync Memory:**
The project uses `.brainsync/` directory for cross-agent memory.

**Configuration:**
```json
// .vscode/settings.json
{
  "brainsync.enabled": true,
  "brainsync.autoSync": true,
  "brainsync.workspace": "${workspaceFolder}/.brainsync"
}
```

---

## 6. Build & Deployment

### 6.1 Local Development Workflow

**Start All Services:**
```powershell
# PowerShell - From project root

# 1. Start Docker infrastructure
pnpm run docker:up

# 2. In Terminal 1 - Start API
pnpm run dev:api

# 3. In Terminal 2 - Start Web Frontend
pnpm run dev:web

# Or use setup script
pnpm run setup
```

**Access Points:**
| Service | URL |
|---------|-----|
| Web Frontend | http://localhost:5173 |
| API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| pgAdmin | http://localhost:5050 (admin/admin) |
| Redis Commander | http://localhost:8081 |
| MailHog | http://localhost:8025 |

### 6.2 Vercel Deployment

**Prerequisites:**
- Vercel CLI installed: `npm i -g vercel`
- Logged in: `vercel login`

**Deploy:**
```bash
# From project root
cd apps/web

# Preview deployment
vercel

# Production deployment
vercel --prod

# Or via Git push (auto-deploy if connected)
git push origin main
```

**Environment Variables in Vercel:**
```bash
# Set via CLI
vercel env add VITE_API_URL
vercel env add VITE_WS_URL

# Or via Dashboard: Project Settings → Environment Variables
```

### 6.3 Render API Deployment

**Deploy via Blueprint (render.yaml):**
1. Connect GitHub repository in Render dashboard
2. Render detects `render.yaml` automatically
3. Set required environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET_KEY`
   - `CORS_ORIGINS`
   - `PANDASCORE_API_KEY` (optional)

**Manual Deploy:**
```bash
# Trigger via Git push
git push origin main

# Or via Render CLI
render deploy --service njz-api
```

### 6.4 Database Migrations

**Run Migrations on Production:**
```bash
# Connect to Render SSH (if needed)
render ssh --service njz-api

# Run migrations
cd packages/shared/api
poetry run alembic upgrade head
```

**Migration Best Practices:**
```bash
# 1. Always backup before migration
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# 2. Test migration locally first
pnpm run db:migrate

# 3. Generate migration with descriptive name
cd services/api
poetry run alembic revision --autogenerate -m "add_player_stats_table"

# 4. Review generated migration before applying
```

### 6.5 Environment-Specific Configurations

**Development (.env.local):**
```bash
ENVIRONMENT=development
LOG_LEVEL=debug
DEBUG=true
VITE_API_URL=http://localhost:8000/v1
```

**Staging (.env.staging):**
```bash
ENVIRONMENT=staging
LOG_LEVEL=info
DEBUG=false
VITE_API_URL=https://api-staging.njzitegeist.com/v1
```

**Production (.env.production):**
```bash
ENVIRONMENT=production
LOG_LEVEL=warning
DEBUG=false
VITE_API_URL=https://api.njzitegeist.com/v1
CORS_ORIGINS=https://njzitegeist.com,https://www.njzitegeist.com
```

---

## 7. Verification & Testing

### 7.1 Pre-Deployment Checklist

```bash
# Run from project root

# 1. Type checking
pnpm run typecheck

# 2. Linting
pnpm run lint

# 3. Unit tests
pnpm run test:unit

# 4. Integration tests
pnpm run test:integration

# 5. Firewall tests
pnpm run test:firewall

# 6. Build verification
pnpm run build
```

### 7.2 Health Check Verification

```bash
# Local health check
curl http://localhost:8000/health | jq

# Expected output:
{
  "status": "healthy",
  "version": "2.1.0",
  "timestamp": "2026-04-05T06:17:11Z"
}

# Readiness check
curl http://localhost:8000/ready | jq

# Expected output:
{
  "status": "ready",
  "checks": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### 7.3 Smoke Tests

```bash
# Run smoke tests
pnpm run test:smoke

# Or manually:
curl -sf http://localhost:8000/health || echo "API FAIL"
curl -sf http://localhost:5173 || echo "Web FAIL"
```

---

## 8. Troubleshooting

### 8.1 Common Issues

**Issue: Docker fails to start**
```bash
# Check Docker status
docker info

# Restart Docker Desktop
# Or restart service:
sudo systemctl restart docker  # Linux
```

**Issue: PostgreSQL connection refused**
```bash
# Check if container is running
docker ps | grep njz-db

# Check logs
docker-compose logs db

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d db
```

**Issue: Python module not found**
```bash
# Ensure venv is activated
.venv\Scripts\Activate.ps1  # Windows
source .venv/bin/activate   # macOS/Linux

# Reinstall dependencies
cd services/api
poetry install
```

**Issue: pnpm install fails**
```bash
# Clear pnpm cache
pnpm store prune

# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules  # Windows
rm -rf node_modules                       # macOS/Linux
pnpm install
```

**Issue: Pre-commit hooks fail**
```bash
# Update pre-commit
pre-commit autoupdate

# Run specific hook with verbose
pre-commit run black --verbose
```

### 8.2 Cold Start Issues (Render Free Tier)

**Problem:** API takes 30+ seconds to respond after inactivity

**Solution:** Set up keepalive ping
```yaml
# .github/workflows/keepalive.yml
name: Keep Alive
on:
  schedule:
    - cron: '*/10 6-22 * * *'  # Every 10 min, 6am-10pm UTC
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl -sf https://your-api.onrender.com/health || true
```

### 8.3 Database Connection Pool Exhaustion

**Problem:** Too many connections error

**Solution:**
```python
# Reduce pool size in config
DATABASE_POOL_MAX = 5  # Default is 10
```

### 8.4 CORS Errors

**Problem:** `Access-Control-Allow-Origin` errors

**Solution:**
```python
# Update CORS origins in .env.local
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com
```

---

## Quick Reference Commands

```bash
# Development
pnpm run dev:api          # Start API server
pnpm run dev:web          # Start web frontend
pnpm run docker:up        # Start Docker services
pnpm run docker:down      # Stop Docker services
pnpm run setup            # Full local setup

# Testing
pnpm run test:unit        # Unit tests
pnpm run test:e2e         # E2E tests
pnpm run test:integration # Integration tests
pnpm run test:firewall    # Security tests
pnpm run test:smoke       # Smoke tests

# Database
pnpm run db:migrate       # Run migrations
pnpm run db:generate      # Generate migration

# Code Quality
pnpm run typecheck        # TypeScript check
pnpm run lint             # ESLint
pre-commit run --all-files # Pre-commit hooks

# Build & Deploy
pnpm run build            # Production build
vercel --prod             # Deploy to Vercel
```

---

## Support & Resources

- **Documentation:** See `docs/` directory
- **API Docs:** http://localhost:8000/docs (when running)
- **Project Issues:** https://github.com/notbleaux/eSports-EXE/issues
- **Vercel Support:** https://vercel.com/support
- **Render Docs:** https://render.com/docs
- **Supabase Docs:** https://supabase.com/docs

---

*End of Comprehensive Setup Procedures*
