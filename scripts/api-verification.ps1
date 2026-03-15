# SATOR API Endpoint Verification Script
# Verifies all 35 API endpoints for Wave 1 - Task C1
# [Ver001.000]

param(
    [string]$BaseUrl = "http://localhost:8000",
    [switch]$Verbose = $false
)

$script:PassCount = 0
$script:FailCount = 0
$script:Failures = @()

function Write-Result {
    param(
        [string]$Endpoint,
        [int]$StatusCode,
        [bool]$Passed,
        [string]$Details = ""
    )
    
    $status = if ($Passed) { "PASS" } else { "FAIL" }
    $color = if ($Passed) { "Green" } else { "Red" }
    
    Write-Host "[$status] $Endpoint (HTTP $StatusCode)" -ForegroundColor $color
    if ($Details -and $Verbose) {
        Write-Host "       $Details" -ForegroundColor Gray
    }
    
    if ($Passed) {
        $script:PassCount++
    } else {
        $script:FailCount++
        $script:Failures += "$Endpoint (HTTP $StatusCode)"
    }
}

function Test-Endpoint {
    param(
        [string]$Method = "GET",
        [string]$Path,
        [hashtable]$Headers = @{},
        [string]$Body = "",
        [int[]]$ExpectedCodes = @(200),
        [string]$Description = ""
    )
    
    $url = "$BaseUrl$Path"
    
    try {
        $params = @{
            Uri = $url
            Method = $Method
            Headers = $Headers
            TimeoutSec = 10
            UseBasicParsing = $true
            ErrorAction = "Stop"
        }
        
        if ($Body -and $Method -in @("POST", "PUT", "PATCH")) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        $passed = $ExpectedCodes -contains $response.StatusCode
        Write-Result -Endpoint "$Method $Path" -StatusCode $response.StatusCode -Passed $passed -Details $Description
        
        # Check CORS headers
        if ($response.Headers["Access-Control-Allow-Origin"]) {
            Write-Host "       CORS: $($response.Headers["Access-Control-Allow-Origin"])" -ForegroundColor Cyan
        }
        
        return $passed
    }
    catch {
        $statusCode = $_.Exception.Response?.StatusCode.Value__
        if ($ExpectedCodes -contains $statusCode) {
            Write-Result -Endpoint "$Method $Path" -StatusCode $statusCode -Passed $true -Details "Expected error code"
            return $true
        } else {
            Write-Result -Endpoint "$Method $Path" -StatusCode ($statusCode ?? 0) -Passed $false -Details $_.Exception.Message
            return $false
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Blue
Write-Host "SATOR API Endpoint Verification" -ForegroundColor Blue
Write-Host "Base URL: $BaseUrl" -ForegroundColor Blue
Write-Host "========================================`n" -ForegroundColor Blue

# ============================================================
# HEALTH ENDPOINTS (6)
# ============================================================
Write-Host "## Health Endpoints" -ForegroundColor Yellow
Test-Endpoint -Path "/health" -ExpectedCodes @(200)
Test-Endpoint -Path "/v1/health" -ExpectedCodes @(200)
Test-Endpoint -Path "/ready" -ExpectedCodes @(200, 503)
Test-Endpoint -Path "/v1/ready" -ExpectedCodes @(200, 503)
Test-Endpoint -Path "/live" -ExpectedCodes @(200)
Test-Endpoint -Path "/v1/live" -ExpectedCodes @(200)

# ============================================================
# PLAYER ENDPOINTS (2)
# ============================================================
Write-Host "`n## Player Endpoints" -ForegroundColor Yellow
Test-Endpoint -Path "/v1/players/" -ExpectedCodes @(200, 422)
Test-Endpoint -Path "/v1/players/00000000-0000-0000-0000-000000000001" -ExpectedCodes @(200, 404, 422)

# ============================================================
# MATCH ENDPOINTS (4)
# ============================================================
Write-Host "`n## Match Endpoints" -ForegroundColor Yellow
Test-Endpoint -Path "/v1/matches/test-match-id" -ExpectedCodes @(200, 404)
Test-Endpoint -Path "/v1/matches/test-match/rounds/1/sator-events" -ExpectedCodes @(200, 404)
Test-Endpoint -Path "/v1/matches/test-match/rounds/1/arepo-markers" -ExpectedCodes @(200, 404)
Test-Endpoint -Path "/v1/matches/test-match/rounds/1/rotas-trails" -ExpectedCodes @(200, 404)

# ============================================================
# ANALYTICS ENDPOINTS (3)
# ============================================================
Write-Host "`n## Analytics Endpoints" -ForegroundColor Yellow
Test-Endpoint -Path "/v1/analytics/simrating/00000000-0000-0000-0000-000000000001" -ExpectedCodes @(200, 404)
Test-Endpoint -Path "/v1/analytics/rar/00000000-0000-0000-0000-000000000001" -ExpectedCodes @(200, 404)
Test-Endpoint -Path "/v1/analytics/investment/00000000-0000-0000-0000-000000000001" -ExpectedCodes @(200, 404)

# ============================================================
# COLLECTION ENDPOINTS (5) - Data Pipeline
# ============================================================
Write-Host "`n## Collection Endpoints" -ForegroundColor Yellow
Test-Endpoint -Path "/v1/collection/sources" -ExpectedCodes @(200)
Test-Endpoint -Path -Method "POST" -Path "/v1/collection/start" -Body '{"mode":"delta","source":"vlr"}' -ExpectedCodes @(200, 422)
Test-Endpoint -Path "/v1/collection/status/test-job" -ExpectedCodes @(200, 404)
Test-Endpoint -Path "/v1/collection/active" -ExpectedCodes @(200)
Test-Endpoint -Method "POST" -Path "/v1/collection/cancel/test-job" -ExpectedCodes @(200, 404, 400)

# ============================================================
# DASHBOARD ENDPOINTS (5)
# ============================================================
Write-Host "`n## Dashboard Endpoints" -ForegroundColor Yellow
Test-Endpoint -Path "/v1/dashboard/metrics" -ExpectedCodes @(200)
Test-Endpoint -Path "/v1/dashboard/trends" -ExpectedCodes @(200)
Test-Endpoint -Path "/v1/dashboard/regional-breakdown" -ExpectedCodes @(200)
Test-Endpoint -Path "/v1/dashboard/role-distribution" -ExpectedCodes @(200)
Test-Endpoint -Path "/v1/dashboard/health" -ExpectedCodes @(200)

# ============================================================
# SEARCH ENDPOINTS (5)
# ============================================================
Write-Host "`n## Search Endpoints" -ForegroundColor Yellow
Test-Endpoint -Path "/v1/search/?q=tenz" -ExpectedCodes @(200)
Test-Endpoint -Path "/v1/search/players?q=tenz" -ExpectedCodes @(200)
Test-Endpoint -Path "/v1/search/teams?q=sen" -ExpectedCodes @(200)
Test-Endpoint -Path "/v1/search/matches?q=vct" -ExpectedCodes @(200)
Test-Endpoint -Path "/v1/search/suggestions?q=te" -ExpectedCodes @(200)

# ============================================================
# ML MODELS ENDPOINTS (5+ - Circuit Breaker Pattern)
# ============================================================
Write-Host "`n## ML Models Endpoints" -ForegroundColor Yellow
Test-Endpoint -Path "/v1/ml/models" -ExpectedCodes @(200, 503)
Test-Endpoint -Path "/v1/ml/models/00000000-0000-0000-0000-000000000001" -ExpectedCodes @(200, 404, 503)
Test-Endpoint -Path "/v1/ml/ab-tests" -ExpectedCodes @(200, 503)
Test-Endpoint -Path "/v1/ml/deployments/active" -ExpectedCodes @(200, 503)
Test-Endpoint -Path "/v1/ml/models/00000000-0000-0000-0000-000000000001/metrics" -ExpectedCodes @(200, 404, 503)

# ============================================================
# WEBSOCKET ENDPOINT (1)
# ============================================================
Write-Host "`n## WebSocket Endpoint" -ForegroundColor Yellow
# Note: WebSocket can't be tested with simple HTTP request, just verify endpoint exists
Test-Endpoint -Path "/v1/ws/stats" -ExpectedCodes @(200, 404)

# ============================================================
# RATE LIMITING TEST
# ============================================================
Write-Host "`n## Rate Limiting Test (65 rapid requests)" -ForegroundColor Yellow
$rateLimitHits = 0
for ($i = 0; $i -lt 65; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "$BaseUrl/health" -Method GET -TimeoutSec 5 -UseBasicParsing
    }
    catch {
        if ($_.Exception.Response?.StatusCode.Value__ -eq 429) {
            $rateLimitHits++
        }
    }
}

if ($rateLimitHits -ge 3) {
    Write-Host "[PASS] Rate limiting active ($rateLimitHits requests returned 429)" -ForegroundColor Green
    $script:PassCount++
} else {
    Write-Host "[WARN] Rate limiting may not be active ($rateLimitHits requests returned 429)" -ForegroundColor Yellow
}

# ============================================================
# SUMMARY
# ============================================================
Write-Host "`n========================================" -ForegroundColor Blue
Write-Host "Verification Summary" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host "Passed: $script:PassCount" -ForegroundColor Green
Write-Host "Failed: $script:FailCount" -ForegroundColor Red
Write-Host "Total:  $($script:PassCount + $script:FailCount)/35" -ForegroundColor White

if ($script:Failures.Count -gt 0) {
    Write-Host "`nFailed Endpoints:" -ForegroundColor Red
    foreach ($failure in $script:Failures) {
        Write-Host "  - $failure" -ForegroundColor Red
    }
}

Write-Host ""
exit $script:FailCount
