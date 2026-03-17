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

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  SATOR Platform - Local Development Setup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "  ✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ npm not found" -ForegroundColor Red
    exit 1
}

# Check Python
$pythonPath = "C:\Users\jacke\AppData\Local\Python\bin\python.exe"
if (Test-Path $pythonPath) {
    $pythonVersion = & $pythonPath --version
    Write-Host "  ✅ Python: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "  ❌ Python not found at $pythonPath" -ForegroundColor Red
    Write-Host "     Please install Python 3.11+ from https://python.org/" -ForegroundColor Red
    exit 1
}

# Check Docker
if (-not $SkipDocker) {
    try {
        $dockerVersion = docker --version
        Write-Host "  ✅ Docker: $dockerVersion" -ForegroundColor Green
        
        # Check if Docker is running
        $dockerInfo = docker info 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ⚠️  Docker is installed but not running. Please start Docker Desktop." -ForegroundColor Yellow
            exit 1
        }
    } catch {
        Write-Host "  ❌ Docker not found. Please install Docker Desktop from https://docker.com/" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ⏭️  Skipping Docker check" -ForegroundColor Gray
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Start Docker infrastructure
if (-not $SkipDocker) {
    Write-Host "🐳 Starting Docker infrastructure..." -ForegroundColor Yellow
    Set-Location $WorkspaceRoot
    
    if ($ResetDatabase) {
        Write-Host "  🗑️  Resetting database (removing volumes)..." -ForegroundColor Yellow
        docker-compose down -v
    }
    
    docker-compose up -d db redis
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ Failed to start Docker infrastructure" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  ⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Check if containers are running
    $dbRunning = docker ps --filter "name=sator-db" --format "{{.Names}}"
    $redisRunning = docker ps --filter "name=sator-redis" --format "{{.Names}}"
    
    if ($dbRunning -and $redisRunning) {
        Write-Host "  ✅ PostgreSQL and Redis are running" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Services may still be starting. Check with: docker ps" -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️  Skipping Docker infrastructure startup" -ForegroundColor Gray
}

Write-Host ""

# Install NPM dependencies
if (-not $SkipNpm) {
    Write-Host "📦 Installing NPM dependencies..." -ForegroundColor Yellow
    Set-Location $WorkspaceRoot
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ Failed to install NPM dependencies" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  ✅ NPM dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⏭️  Skipping NPM dependencies" -ForegroundColor Gray
}

Write-Host ""

# Install Python dependencies
if (-not $SkipPython) {
    Write-Host "🐍 Installing Python dependencies..." -ForegroundColor Yellow
    Set-Location $WorkspaceRoot
    & $pythonPath -m pip install -r packages/shared/requirements.txt
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ Failed to install Python dependencies" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  ✅ Python dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⏭️  Skipping Python dependencies" -ForegroundColor Gray
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Start the API server:      npm run dev:api" -ForegroundColor White
Write-Host "  2. Start the frontend:        cd apps/website-v2 && npm run dev" -ForegroundColor White
Write-Host "  3. Or use VS Code: tasks:      Ctrl+Shift+P → Run Task" -ForegroundColor White
Write-Host ""
Write-Host "Services:" -ForegroundColor Yellow
Write-Host "  • API:     http://localhost:8000" -ForegroundColor White
Write-Host "  • Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  • Health:  http://localhost:8000/health" -ForegroundColor White
Write-Host ""
