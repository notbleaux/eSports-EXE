#!/usr/bin/env pwsh
# [Ver001.000]
# Infrastructure Resurrection Script
# Libre-X-eSport 4NJZ4 TENET Platform
#
# This script helps restore production infrastructure:
# 1. Supabase database (paused - needs manual resume)
# 2. Render.com deployment
# 3. Cloudflare DNS configuration
#
# Usage: .\scripts\resurrect-infrastructure.ps1

param(
    [switch]$SkipSupabaseCheck,
    [switch]$SkipRenderCheck,
    [switch]$SkipCloudflareCheck
)

$ErrorActionPreference = "Stop"

# Colors
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-Status($message, $status) {
    $color = switch ($status) {
        "OK" { $Green }
        "WARN" { $Yellow }
        "ERROR" { $Red }
        "INFO" { $Blue }
        default { $Reset }
    }
    Write-Host "$color[$status]$Reset $message"
}

function Show-Header($title) {
    Write-Host ""
    Write-Host "$Blue========================================$Reset"
    Write-Host "$Blue  $title$Reset"
    Write-Host "$Blue========================================$Reset"
}

# ============================================================================
# CHECK 1: Local Development Environment
# ============================================================================
Show-Header "LOCAL DEVELOPMENT STATUS"

try {
    $dockerStatus = docker ps --format "{{.Names}}" 2>$null
    if ($dockerStatus -contains "sator-api") {
        Write-Status "Docker API container" "OK"
    } else {
        Write-Status "Docker API container" "ERROR"
        Write-Host "  Run: docker-compose up -d"
    }
    
    if ($dockerStatus -contains "sator-db") {
        Write-Status "Docker Database container" "OK"
    } else {
        Write-Status "Docker Database container" "ERROR"
    }
    
    if ($dockerStatus -contains "sator-redis") {
        Write-Status "Docker Redis container" "OK"
    } else {
        Write-Status "Docker Redis container" "ERROR"
    }
} catch {
    Write-Status "Docker not running" "ERROR"
}

# Test API health
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 5
    Write-Status "API Health: $($health.status)" "OK"
} catch {
    Write-Status "API not responding on :8000" "ERROR"
}

# ============================================================================
# CHECK 2: Supabase (Manual Action Required)
# ============================================================================
if (-not $SkipSupabaseCheck) {
    Show-Header "SUPABASE STATUS (CRITICAL)"
    
    Write-Status "Supabase Project: NJZ-EXE" "WARN"
    Write-Host ""
    Write-Host "$Yellow ACTION REQUIRED:$Reset"
    Write-Host "  1. Visit: https://supabase.com/dashboard/project/sxwyaxfresuroiezxo"
    Write-Host "  2. Click the 'Resume project' button"
    Write-Host "  3. Wait 2-3 minutes for database to start"
    Write-Host ""
    Write-Host "  Project has been paused since 14 Mar 2026"
    Write-Host "  87 days remaining until permanent deletion!"
    Write-Host ""
    
    $resume = Read-Host "Have you resumed the Supabase project? (y/n)"
    if ($resume -eq "y") {
        Write-Status "Supabase marked as resumed" "OK"
    } else {
        Write-Status "Supabase resurrection skipped" "WARN"
        Write-Host "$Red Please resume Supabase before deploying to Render!$Reset"
    }
}

# ============================================================================
# CHECK 3: Render.com Deployment
# ============================================================================
if (-not $SkipRenderCheck) {
    Show-Header "RENDER.COM DEPLOYMENT"
    
    Write-Status "Render Blueprint" "INFO"
    Write-Host "  Config file: infrastructure/render.yaml"
    Write-Host ""
    
    Write-Host "$Blue Deployment Steps:$Reset"
    Write-Host "  1. Visit: https://dashboard.render.com/"
    Write-Host "  2. Delete the failed 'sator-api' service if it exists"
    Write-Host "  3. Click 'New +' → 'Blueprint'"
    Write-Host "  4. Connect this GitHub repository"
    Write-Host "  5. Select 'infrastructure/render.yaml'"
    Write-Host "  6. Set environment variables:"
    Write-Host "     - PANDASCORE_API_KEY: (your API key)"
    Write-Host "     - JWT_SECRET_KEY: (auto-generated)"
    Write-Host "     - TOTP_ENCRYPTION_KEY: (auto-generated)"
    Write-Host ""
    
    # Check if render.yaml is valid
    if (Test-Path "infrastructure/render.yaml") {
        $renderYaml = Get-Content "infrastructure/render.yaml" -Raw
        if ($renderYaml -match "services:" -and $renderYaml -match "databases:") {
            Write-Status "render.yaml structure" "OK"
        } else {
            Write-Status "render.yaml may be incomplete" "WARN"
        }
    } else {
        Write-Status "render.yaml not found" "ERROR"
    }
}

# ============================================================================
# CHECK 4: Cloudflare DNS
# ============================================================================
if (-not $SkipCloudflareCheck) {
    Show-Header "CLOUDFLARE DNS CONFIGURATION"
    
    Write-Status "Domain: libreauxnjz.io" "INFO"
    Write-Host ""
    Write-Host "$Blue Nameservers to configure at registrar:$Reset"
    Write-Host "  - eva.ns.cloudflare.com"
    Write-Host "  - greg.ns.cloudflare.com"
    Write-Host ""
    Write-Host "  Check status at: https://dash.cloudflare.com/"
    Write-Host ""
}

# ============================================================================
# CHECK 5: Environment Variables
# ============================================================================
Show-Header "ENVIRONMENT VARIABLES CHECK"

$requiredVars = @(
    "DATABASE_URL",
    "REDIS_URL",
    "JWT_SECRET_KEY",
    "TOTP_ENCRYPTION_KEY"
)

foreach ($var in $requiredVars) {
    $value = [Environment]::GetEnvironmentVariable($var)
    if ($value) {
        Write-Status "$var is set" "OK"
    } else {
        Write-Status "$var is NOT set" "WARN"
    }
}

# ============================================================================
# SUMMARY
# ============================================================================
Show-Header "RESURRECTION CHECKLIST"

Write-Host @"

$Blue Infrastructure Resurrection Checklist:$Reset

[ ] 1. Resume Supabase (CRITICAL - 87 days left!)
      https://supabase.com/dashboard/project/sxwyaxfresuroiezxo

[ ] 2. Deploy to Render
      https://dashboard.render.com/ → Blueprint → infrastructure/render.yaml

[ ] 3. Configure Cloudflare nameservers
      eva.ns.cloudflare.com, greg.ns.cloudflare.com

[ ] 4. Set PANDASCORE_API_KEY in Render dashboard

[ ] 5. Update Vercel environment variables
      VITE_API_URL pointing to Render URL

[ ] 6. Test production deployment
      curl https://<render-url>/health

$Green Next Steps:$Reset
  - Run: .\scripts\setup-local.ps1 (for local dev)
  - Run: pytest tests/unit (for test verification)
  - Check: https://github.com/notbleaux/eSports-EXE/actions (for CI status)

"@

Write-Status "Infrastructure resurrection guide complete" "OK"
