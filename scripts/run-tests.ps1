#!/usr/bin/env pwsh
# [Ver001.000]
# Test Suite Runner for SATOR Platform
#
# Usage: .\scripts\run-tests.ps1 [unit|integration|e2e|all]

param(
    [Parameter(Position = 0)]
    [ValidateSet("unit", "integration", "e2e", "all", "ci")]
    [string]$Suite = "unit",
    
    [switch]$ShowDetails,
    [switch]$Coverage,
    [switch]$FailFast
)

$ErrorActionPreference = "Stop"

# Colors
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-Header($title) {
    Write-Host ""
    Write-Host "$Blue========================================$Reset"
    Write-Host "$Blue  $title$Reset"
    Write-Host "$Blue========================================$Reset"
    Write-Host ""
}

# Check prerequisites
Write-Header "TEST SUITE RUNNER"

Write-Host "Suite: $Suite"
Write-Host ""

# Verify Docker is running
$dockerRunning = docker ps 2>$null
if (-not $dockerRunning) {
    Write-Host "$Red ERROR: Docker is not running$Reset"
    exit 1
}

# Set environment variables
$env:TEST_DATABASE_URL = "postgresql://sator:sator_dev_password@localhost:5432/sator_test"
$env:TEST_REDIS_URL = "redis://localhost:6379/1"
$env:JWT_SECRET_KEY = "test-secret-key-for-testing"
$env:ENCRYPTION_KEY = "test-encryption-key-32-chars-long"
$env:TOTP_ENCRYPTION_KEY = "test-totp-key-32-chars-long-"
$env:PYTHONPATH = "packages/shared/api"

# Ensure test database exists (ignore if already exists)
try { docker exec sator-db psql -U sator -c "CREATE DATABASE sator_test;" 2>&1 | Out-Null } catch {}

$allPassed = $true

# ============================================================================
# UNIT TESTS
# ============================================================================
if ($Suite -in @("unit", "all", "ci")) {
    Write-Header "UNIT TESTS"
    
    try {
        python -m pytest tests/unit -v --tb=short
        if ($LASTEXITCODE -ne 0) { $allPassed = $false }
    } catch {
        Write-Host "$Red Error running unit tests: $_$Reset"
        $allPassed = $false
    }
}

# ============================================================================
# INTEGRATION TESTS
# ============================================================================
if ($Suite -in @("integration", "all")) {
    Write-Header "INTEGRATION TESTS"
    
    try {
        python -m pytest tests/integration -v --tb=short
        if ($LASTEXITCODE -ne 0) { $allPassed = $false }
    } catch {
        Write-Host "$Red Error running integration tests: $_$Reset"
        $allPassed = $false
    }
}

# ============================================================================
# API SMOKE TEST
# ============================================================================
if ($Suite -eq "ci") {
    Write-Header "API SMOKE TEST"
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 10
        if ($response.status -eq "healthy") {
            Write-Host "$Green API health check passed$Reset"
        } else {
            Write-Host "$Red API unhealthy: $($response.status)$Reset"
            $allPassed = $false
        }
    } catch {
        Write-Host "$Red API not responding: $_$Reset"
        $allPassed = $false
    }
}

# ============================================================================
# SUMMARY
# ============================================================================
Write-Header "TEST SUMMARY"

if ($allPassed) {
    Write-Host "$Green All tests passed!$Reset"
    exit 0
} else {
    Write-Host "$Red Some tests failed. See output above for details.$Reset"
    exit 1
}
