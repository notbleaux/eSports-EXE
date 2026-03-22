#!/usr/bin/env powershell
# [Ver001.000]
# SATOR Database Migration Runner Script (Windows)
# Runs all SQL migrations in order
# Usage: .\scripts\run-migrations.ps1 [environment]

$ErrorActionPreference = "Stop"

function Log-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Green }
function Log-Warn { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Log-Error { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }

$ENVIRONMENT = if ($args[0]) { $args[0] } else { "production" }
Log-Info "Running migrations for environment: $ENVIRONMENT"

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Log-Error "DATABASE_URL environment variable is not set!"
    Log-Error "Please set it to your PostgreSQL connection string."
    exit 1
}

Log-Info "Database URL is configured"

# Migration directories
$API_MIGRATIONS_DIR = "packages/shared/api/migrations"

# Check if migration directories exist
if (-not (Test-Path $API_MIGRATIONS_DIR)) {
    Log-Error "API migrations directory not found: $API_MIGRATIONS_DIR"
    exit 1
}

Log-Info "Found API migrations directory"

# Check if Python is available
$PYTHON_CMD = if (Get-Command python3 -ErrorAction SilentlyContinue) { "python3" } else { "python" }
Log-Info "Using Python: $PYTHON_CMD"

# Run migrations using the Python script
$migrateScript = "scripts/migrate.py"
if (Test-Path $migrateScript) {
    Log-Info "Running migrations using scripts/migrate.py"
    $env:PYTHONPATH = "packages/shared;$env:PYTHONPATH"
    & $PYTHON_CMD $migrateScript
} else {
    Log-Warn "scripts/migrate.py not found"
    Log-Error "Cannot run migrations automatically"
    exit 1
}

Log-Info "Migrations completed successfully!"
