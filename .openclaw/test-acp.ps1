# ACP Protocol Test Script
# Tests the ACP bridge server and client

param(
    [ValidateSet("bridge", "kimi", "all")]
    [string]$Test = "all",
    
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host @"
=============================================================
     ACP (Agent Client Protocol) Test Suite
=============================================================
"@ -ForegroundColor Cyan

$testsPassed = 0
$testsFailed = 0

function Test-Step($Name, $ScriptBlock) {
    Write-Host "`n[Test] $Name..." -ForegroundColor Yellow -NoNewline
    try {
        $result = & $ScriptBlock
        Write-Host " PASS" -ForegroundColor Green
        $script:testsPassed++
        return $result
    } catch {
        Write-Host " FAIL" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
        $script:testsFailed++
        return $null
    }
}

# Test 1: Check Python bridge server exists
Test-Step "Python bridge server exists" {
    $serverPath = Join-Path $scriptDir "acp-server.py"
    if (-not (Test-Path $serverPath)) {
        throw "acp-server.py not found"
    }
    $true
}

# Test 2: Check Node.js client exists
Test-Step "Node.js client exists" {
    $clientPath = Join-Path $scriptDir "acp-client.js"
    if (-not (Test-Path $clientPath)) {
        throw "acp-client.js not found"
    }
    $true
}

# Test 3: Test JSON-RPC encoding/decoding
Test-Step "JSON-RPC message format" {
    $message = @{
        jsonrpc = "2.0"
        id = 1
        method = "initialize"
        params = @{
            protocolVersion = 1
            clientCapabilities = @{
                fs = @{ readTextFile = $true; writeTextFile = $true }
                terminal = $true
            }
        }
    } | ConvertTo-Json -Depth 10 -Compress
    
    # Verify it's valid JSON
    $parsed = $message | ConvertFrom-Json
    if ($parsed.jsonrpc -ne "2.0") {
        throw "Invalid JSON-RPC version"
    }
    $true
}

# Test 4: Test Python bridge server initialization
if ($Test -eq "bridge" -or $Test -eq "all") {
    Test-Step "Python bridge server starts" {
        $serverPath = Join-Path $scriptDir "acp-server.py"
        
        # Create a test message
        $initMessage = @{
            jsonrpc = "2.0"
            id = 1
            method = "initialize"
            params = @{
                protocolVersion = 1
                clientCapabilities = @{
                    fs = @{ readTextFile = $true; writeTextFile = $true }
                    terminal = $true
                }
                clientInfo = @{
                    name = "test-client"
                    version = "1.0.0"
                }
            }
        } | ConvertTo-Json -Depth 10 -Compress
        
        # Send to server and capture response
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = "python"
        $psi.Arguments = $serverPath
        $psi.RedirectStandardInput = $true
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true
        
        $process = New-Object System.Diagnostics.Process
        $process.StartInfo = $psi
        $process.Start() | Out-Null
        
        # Send initialize message
        $process.StandardInput.WriteLine($initMessage)
        $process.StandardInput.Flush()
        
        # Read response (with timeout)
        $response = $null
        $timeout = 5000
        $timer = [System.Diagnostics.Stopwatch]::StartNew()
        
        while ($timer.ElapsedMilliseconds -lt $timeout) {
            if ($process.StandardOutput.Peek() -gt -1) {
                $line = $process.StandardOutput.ReadLine()
                if ($line) {
                    $response = $line | ConvertFrom-Json
                    break
                }
            }
            Start-Sleep -Milliseconds 100
        }
        
        $process.Kill()
        $timer.Stop()
        
        if (-not $response) {
            throw "No response from server"
        }
        
        if ($response.error) {
            throw "Server returned error: $($response.error.message)"
        }
        
        if (-not $response.result.agentCapabilities) {
            throw "Invalid response: missing agentCapabilities"
        }
        
        Write-Host "`n  Agent: $($response.result.agentInfo.name)" -ForegroundColor Gray
        Write-Host "  Protocol: v$($response.result.protocolVersion)" -ForegroundColor Gray
        $true
    }
}

# Test 5: Test kimi acp if available
if ($Test -eq "kimi" -or $Test -eq "all") {
    Test-Step "kimi acp is available" {
        try {
            $kimiInfo = kimi info 2>&1 | Out-String
            if ($kimiInfo -match "wire protocol" -or $kimiInfo -match "agent spec") {
                $true
            } else {
                throw "kimi doesn't report ACP wire protocol"
            }
        } catch {
            throw "kimi not found or not working: $_"
        }
    }
}

# Test 6: Test MCP servers
Test-Step "MCP servers configured" {
    $mcpList = kimi mcp list 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to list MCP servers"
    }
    $servers = $mcpList | Where-Object { $_ -match "\w+" }
    Write-Host "`n  Found $($servers.Count) MCP servers:" -ForegroundColor Gray
    $servers | ForEach-Object { Write-Host "    - $_" -ForegroundColor Gray }
    $true
}

# Test 7: Test shared state
Test-Step "Shared state file valid" {
    $statePath = Join-Path $scriptDir "shared-state.json"
    if (-not (Test-Path $statePath)) {
        throw "shared-state.json not found"
    }
    
    $state = Get-Content $statePath | ConvertFrom-Json
    if (-not $state.version) {
        throw "Invalid state file: missing version"
    }
    if (-not $state.agent_states) {
        throw "Invalid state file: missing agent_states"
    }
    $true
}

# Summary
Write-Host "`n=============================================================" -ForegroundColor Cyan
Write-Host "     Test Results" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -gt 0) { "Red" } else { "Green" })

if ($testsFailed -eq 0) {
    Write-Host "`nAll tests passed! ACP infrastructure is ready." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nSome tests failed. Check output above." -ForegroundColor Red
    exit 1
}
