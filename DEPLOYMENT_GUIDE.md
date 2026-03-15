[Ver001.000]

# SATOR API Deployment Guide
**Date:** 2026-03-15  
**Status:** Production Ready (Score: 8.5/10)  
**Commit:** 9792b86

---

## 🚀 QUICK START (Docker - Recommended)

### Prerequisites
- Docker Desktop installed
- PowerShell or Command Prompt

### Step 1: Copy-Paste These Commands (Run in PowerShell as Administrator)

```powershell
# Navigate to project directory
cd C:\Users\jacke\Documents\GitHub\eSports-EXE

# Generate JWT secret (save this value)
$JWT_SECRET = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
Write-Host "JWT_SECRET_KEY: $JWT_SECRET" -ForegroundColor Green

# Set environment variables
$env:JWT_SECRET_KEY = $JWT_SECRET
$env:APP_ENVIRONMENT = "development"

# Start all services
docker-compose up -d

# Wait for database initialization (30 seconds)
Start-Sleep -Seconds 30

# Verify deployment
Write-Host "`n=== HEALTH CHECKS ===" -ForegroundColor Cyan
curl http://localhost:8000/health | ConvertFrom-Json | Format-List
curl http://localhost:8000/ready | ConvertFrom-Json | Format-List

Write-Host "`n=== API ENDPOINTS ===" -ForegroundColor Cyan
curl http://localhost:8000/api/sator/stats | ConvertFrom-Json | Format-List
```

### Step 2: Verify Deployment

Open browser to: http://localhost:8000/docs

Expected: FastAPI Swagger UI with all 78 endpoints documented.

---

## 🖥️ OPTION 4: Local Python/PostgreSQL Install

### Part A: Install PostgreSQL (Copy-Paste Each Block)

**BLOCK 1: Download and Install PostgreSQL**
```powershell
# Download PostgreSQL 14 installer
$pgUrl = "https://get.enterprisedb.com/postgresql/postgresql-14.15-1-windows-x64.exe"
$pgInstaller = "$env:TEMP\postgresql-installer.exe"

Write-Host "Downloading PostgreSQL 14..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $pgUrl -OutFile $pgInstaller

Write-Host "Installing PostgreSQL (this may take a few minutes)..." -ForegroundColor Yellow
Start-Process -FilePath $pgInstaller -ArgumentList "--mode unattended --superpassword sator_admin --serverport 5432" -Wait

Write-Host "PostgreSQL installed!" -ForegroundColor Green
```

**BLOCK 2: Add PostgreSQL to PATH**
```powershell
# Add PostgreSQL to PATH
$pgPath = "C:\Program Files\PostgreSQL\14\bin"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$pgPath*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$pgPath", "User")
    Write-Host "Added PostgreSQL to PATH. RESTART PowerShell after this!" -ForegroundColor Red
} else {
    Write-Host "PostgreSQL already in PATH" -ForegroundColor Green
}

# Verify
psql --version
```

**BLOCK 3: Create Database**
```powershell
# Create database and user (run after restarting PowerShell)
$env:PGPASSWORD = "sator_admin"

# Create user and database
psql -U postgres -c "CREATE USER sator WITH PASSWORD 'sator_dev_password';"
psql -U postgres -c "CREATE DATABASE sator OWNER sator;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE sator TO sator;"

Write-Host "Database 'sator' created successfully!" -ForegroundColor Green
```

### Part B: Install Python 3.11 (Copy-Paste Each Block)

**BLOCK 4: Download and Install Python**
```powershell
# Download Python 3.11
$pyUrl = "https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe"
$pyInstaller = "$env:TEMP\python-installer.exe"

Write-Host "Downloading Python 3.11..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $pyUrl -OutFile $pyInstaller

Write-Host "Installing Python (check 'Add to PATH')..." -ForegroundColor Yellow
Start-Process -FilePath $pyInstaller -ArgumentList "/quiet InstallAllUsers=1 PrependPath=1" -Wait

Write-Host "Python installed! RESTART PowerShell!" -ForegroundColor Red
```

**BLOCK 5: Verify Python Installation**
```powershell
# Run after restarting PowerShell
python --version
pip --version
```

### Part C: Install Dependencies and Run (Copy-Paste Each Block)

**BLOCK 6: Install Python Dependencies**
```powershell
# Navigate to project
cd C:\Users\jacke\Documents\GitHub\eSports-EXE

# Install dependencies
cd packages/shared
pip install -r requirements.txt

Write-Host "Dependencies installed!" -ForegroundColor Green
```

**BLOCK 7: Configure Environment**
```powershell
# Create .env file
cd packages/shared/api

$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })

@"
DATABASE_URL=postgresql://sator:sator_dev_password@localhost:5432/sator
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=$jwtSecret
APP_ENVIRONMENT=development
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
RATE_LIMIT_REQUESTS_PER_MINUTE=100
RATE_LIMIT_BURST=10
"@ | Out-File -FilePath .env -Encoding utf8

Write-Host "Environment configured!" -ForegroundColor Green
```

**BLOCK 8: Run Migrations**
```powershell
# Run migration 018 - Users & Auth
psql postgresql://sator:sator_dev_password@localhost:5432/sator -f packages/shared/api/migrations/018_users_auth.sql

# Run migration 019 - VLR Enhancement Metrics
psql postgresql://sator:sator_dev_password@localhost:5432/sator -f packages/shared/axiom-esports-data/infrastructure/migrations/019_vlr_enhancement_metrics.sql

Write-Host "Migrations complete!" -ForegroundColor Green
```

**BLOCK 9: Start API Server**
```powershell
# Start the API
cd packages/shared/api
python main.py

# OR with uvicorn directly:
# uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**BLOCK 10: Verify (Run in NEW PowerShell window)**
```powershell
# Health check
curl http://localhost:8000/health | ConvertFrom-Json

# SATOR stats
curl http://localhost:8000/api/sator/stats | ConvertFrom-Json

# Open API docs
Start-Process "http://localhost:8000/docs"
```

---

## 🐧 OPTION 1: WSL2 (Ubuntu)

### Step 1: Install WSL2
```powershell
# Run in PowerShell as Administrator
wsl --install -d Ubuntu
# Restart computer when prompted
```

### Step 2: Setup Ubuntu Environment
```bash
# After restart, open Ubuntu terminal
sudo apt update && sudo apt upgrade -y

# Install Python and PostgreSQL
sudo apt install -y python3.11 python3-pip python3.11-venv postgresql-14 postgresql-client-14 redis-server

# Start PostgreSQL
sudo service postgresql start

# Create database user
sudo -u postgres psql -c "CREATE USER sator WITH PASSWORD 'sator_dev_password';"
sudo -u postgres psql -c "CREATE DATABASE sator OWNER sator;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sator TO sator;"
```

### Step 3: Clone and Deploy
```bash
# Clone repository
cd ~
git clone https://github.com/notbleaux/eSports-EXE.git
cd eSports-EXE

# Setup Python environment
cd packages/shared
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cd api
cp .env.example .env
# Edit .env with nano or vim

# Run migrations
psql postgresql://sator:sator_dev_password@localhost:5432/sator -f ../api/migrations/018_users_auth.sql
psql postgresql://sator:sator_dev_password@localhost:5432/sator -f ../axiom-esports-data/infrastructure/migrations/019_vlr_enhancement_metrics.sql

# Start server
python main.py
```

---

## ☁️ FALLBACK: Render Direct Deploy

If local deployment fails, deploy directly to Render:

```powershell
# Push to main branch
cd C:\Users\jacke\Documents\GitHub\eSports-EXE
git add -A
git commit -m "[DEPLOY] Production deployment configuration"
git push origin main
```

Then:
1. Go to https://dashboard.render.com/
2. Connect GitHub repository
3. Use `infrastructure/render.yaml` blueprint
4. Set environment variables in Render dashboard:
   - `JWT_SECRET_KEY` (generate with: `openssl rand -hex 32`)
   - `DATABASE_URL` (from Render PostgreSQL)
   - `APP_ENVIRONMENT=production`

---

## 🔧 Troubleshooting

### Issue: "docker-compose not found"
**Fix:** Install Docker Desktop from https://www.docker.com/products/docker-desktop

### Issue: "Port 5432 already in use"
**Fix:** Stop existing PostgreSQL or change port in docker-compose.yml
```yaml
ports:
  - "5433:5432"  # Use 5433 on host
```

### Issue: "Module not found: axiom_esports_data"
**Fix:** Junction not created. Run:
```powershell
cd packages/shared
cmd /c "mklink /J axiom_esports_data axiom-esports-data"
```

### Issue: "Database connection refused"
**Fix:** Wait 30 seconds after `docker-compose up` for DB to initialize

### Issue: "Permission denied" on migrations
**Fix:** Run PowerShell as Administrator

---

## ✅ VERIFICATION CHECKLIST

After deployment, verify:

- [ ] `curl http://localhost:8000/health` returns `{"status": "healthy"}`
- [ ] `curl http://localhost:8000/ready` returns database status
- [ ] `curl http://localhost:8000/api/sator/stats` returns platform stats
- [ ] Swagger UI at http://localhost:8000/docs loads
- [ ] All 78 endpoints visible in Swagger

---

**Recommended Path:** Start with Docker (Quickest - 5 minutes)
**Fallback:** Use Render if Docker fails

Report deployment results back for Accessory Prompt deployment.
