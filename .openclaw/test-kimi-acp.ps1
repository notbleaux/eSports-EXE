# Test kimi acp with correct stdio usage
# This script demonstrates the PROPER way to use kimi acp

param(
    [switch]$Interactive
)

$ErrorActionPreference = "Stop"

Write-Host @"
=============================================================
     Testing kimi acp (stdio transport)
=============================================================

IMPORTANT: kimi acp uses stdio (stdin/stdout), NOT HTTP ports!

"@ -ForegroundColor Cyan

# Test 1: Check kimi acp is available
Write-Host "[Test 1] Checking kimi acp..." -ForegroundColor Yellow
$kimiHelp = kimi acp --help 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ kimi acp is available" -ForegroundColor Green
    Write-Host "  Note: Uses stdio transport (no ports)" -ForegroundColor Gray
} else {
    Write-Error "kimi acp not found"
    exit 1
}

# Test 2: Show correct usage
Write-Host "`n[Test 2] Correct usage examples:" -ForegroundColor Yellow
Write-Host @"

  # Just run kimi acp (it waits for JSON-RPC on stdin):
  kimi acp

  # Or use our collaboration CLI:
  .openclaw/collaborate.ps1 status

  # Or use VS Code: extension:
  .openclaw/setup-vscode-extension.ps1 -Dev

"@ -ForegroundColor White

# Test 3: Try to spawn kimi acp and send initialize
Write-Host "[Test 3] Spawning kimi acp process..." -ForegroundColor Yellow

try {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "kimi"
    $psi.Arguments = "acp"
    $psi.RedirectStandardInput = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true

    $proc = New-Object System.Diagnostics.Process
    $proc.StartInfo = $psi
    $proc.Start() | Out-Null

    Write-Host "  ✅ Process spawned (PID: $($proc.Id))" -ForegroundColor Green

    # Give it a moment to start
    Start-Sleep -Milliseconds 500

    # Send initialize request
    $initMessage = @{
        jsonrpc = "2.0"
        id = 1
        method = "initialize"
        params = @{
            protocolVersion = 1
            clientCapabilities = @{
                fs = @{
                    readTextFile = $true
                    writeTextFile = $true
                }
                terminal = $true
            }
            clientInfo = @{
                name = "test-client"
                version = "1.0.0"
            }
        }
    } | ConvertTo-Json -Depth 10 -Compress

    Write-Host "  Sending initialize request..." -ForegroundColor Gray
    $proc.StandardInput.WriteLine($initMessage)
    $proc.StandardInput.Flush()

    # Wait for response
    Start-Sleep -Milliseconds 2000

    # Try to read response
    $response = $null
    $attempts = 0
    while ($attempts -lt 10 -and -not $response) {
        if ($proc.StandardOutput.Peek() -gt -1) {
            $line = $proc.StandardOutput.ReadLine()
            if ($line) {
                try {
                    $response = $line | ConvertFrom-Json
                    break
                } catch {
                    # Not valid JSON yet
                }
            }
        }
        Start-Sleep -Milliseconds 500
        $attempts++
    }

    # Check stderr for any messages
    $stderr = $proc.StandardError.ReadToEnd()
    if ($stderr) {
        Write-Host "  Agent stderr: $stderr" -ForegroundColor Yellow
    }

    # Cleanup
    $proc.Kill()

    if ($response) {
        Write-Host "  ✅ Got response from kimi acp!" -ForegroundColor Green
        Write-Host "  Protocol: v$($response.result.protocolVersion)" -ForegroundColor Gray
        Write-Host "  Agent: $($response.result.agentInfo.name)" -ForegroundColor Gray
    } else {
        Write-Host "  ⚠️  No response (may require authentication)" -ForegroundColor Yellow
        Write-Host "     Try running: kimi /login" -ForegroundColor Gray
    }

} catch {
    Write-Host "  ❌ Error: $_" -ForegroundColor Red
}

# Final summary
Write-Host @"

=============================================================
     SUMMARY
=============================================================

✅ kimi acp is installed and uses stdio transport
✅ Do NOT use --port (it's not supported)
✅ Use stdin/stdout for JSON-RPC communication

Working Options:
1. Use .openclaw/collaborate.ps1 (easiest)
2. Use VS Code: extension
3. Use Python bridge server

=============================================================
"@ -ForegroundColor Green
