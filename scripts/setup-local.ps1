# SATOR Platform - Local Development Setup Script
# Run this script to set up the local development environment

param(
    [switch]$SkipDocker,
    [switch]$SkipNpm,
    [switch]$SkipPython,
    [switch]$ResetDatabase
)

$ErrorActionPreference = "Stop"
$WorkspaceRoot = Split-Path -Parent $PSScriptRoot

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  SATOR Platform - Local Development Setup" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "  [OK] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] Node.js not found. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "  [OK] npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] npm not found" -ForegroundColor Red
    exit 1
}

# Check Python
try {
    $pythonVersion = python --version
    Write-Host "  [OK] Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] Python not found. Please install Python 3.11+ from https://python.org/" -ForegroundColor Red
    exit 1
}

# Check Docker
if (-not $SkipDocker) {
    try {
        $dockerVersion = docker --version
        Write-Host "  [OK] Docker: $dockerVersion" -ForegroundColor Green
        
        # Check if Docker daemon is responsive
        $dockerInfo = docker info 2>&1
        if ($dockerInfo -match "error|Error|Cannot") {
            Write-Host "  [WARN] Docker daemon not responding. Please start Docker Desktop." -ForegroundColor Yellow
            $SkipDocker = $true
        } else {
            Write-Host "  [OK] Docker daemon is responsive" -ForegroundColor Green
        }
    } catch {
        Write-Host "  [WARN] Docker check failed. Skipping Docker setup." -ForegroundColor Yellow
        $SkipDocker = $true
    }
} else {
    Write-Host "  [SKIP] Skipping Docker check" -ForegroundColor Gray
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

# Start Docker infrastructure
if (-not $SkipDocker) {
    Write-Host "Starting Docker infrastructure..." -ForegroundColor Yellow
    Set-Location $WorkspaceRoot
    
    if ($ResetDatabase) {
        Write-Host "  Resetting database (removing volumes)..." -ForegroundColor Yellow
        docker-compose down -v
    }
    
    Write-Host "  Starting PostgreSQL and Redis containers..." -ForegroundColor Yellow
    docker-compose up -d db redis
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [FAIL] Failed to start Docker infrastructure" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  Waiting for services to start (10 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Check if containers are running
    $dbRunning = docker ps --filter "name=sator-db" --format "{{.Names}}"
    $redisRunning = docker ps --filter "name=sator-redis" --format "{{.Names}}"
    
    if ($dbRunning -and $redisRunning) {
        Write-Host "  [OK] PostgreSQL and Redis are running" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Services may still be starting. Check with: docker ps" -ForegroundColor Yellow
    }
} else {
    Write-Host "[SKIP] Skipping Docker infrastructure startup" -ForegroundColor Gray
}

Write-Host ""

# Install NPM dependencies
if (-not $SkipNpm) {
    Write-Host "Installing NPM dependencies..." -ForegroundColor Yellow
    Set-Location $WorkspaceRoot
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [FAIL] Failed to install NPM dependencies" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  [OK] NPM dependencies installed" -ForegroundColor Green
} else {
    Write-Host "[SKIP] Skipping NPM dependencies" -ForegroundColor Gray
}

Write-Host ""

# Install Python dependencies
if (-not $SkipPython) {
    Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
    Set-Location $WorkspaceRoot
    python -m pip install -r packages/shared/requirements.txt
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [FAIL] Failed to install Python dependencies" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  [OK] Python dependencies installed" -ForegroundColor Green
} else {
    Write-Host "[SKIP] Skipping Python dependencies" -ForegroundColor Gray
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Start the API server:      npm run dev:api" -ForegroundColor White
Write-Host "  2. Start the frontend:        cd apps/web && npm run dev" -ForegroundColor White
Write-Host "  3. Or use VS Code: tasks:      Ctrl+Shift+P -> Run Task" -ForegroundColor White
Write-Host ""
Write-Host "Services:" -ForegroundColor Yellow
Write-Host "  - API:     http://localhost:8000" -ForegroundColor White
Write-Host "  - Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  - Health:  http://localhost:8000/health" -ForegroundColor White
Write-Host ""
