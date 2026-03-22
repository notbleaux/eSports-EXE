#!/usr/bin/env powershell
# [Ver001.000]
# Start All Services - One Command Setup
# Kimi ACP + Webhook Server + FastAPI

param(
    [int]$AcpPort = 8080,
    [int]$WebhookPort = 3001,
    [int]$ApiPort = 8000
)

$ErrorActionPreference = "Stop"

# Colors
$Green = "`e[32m"
$Red = "`e[31m"
$Yellow = "`e[33m"
$Reset = "`e[0m"

function Write-Status {
    param([string]$Message, [string]$Status)
    $color = if ($Status -eq "OK") { $Green } else { $Yellow }
    Write-Host "$color[$Status]$Reset $Message"
}

Write-Host @"

           SATOR Multi-Agent Service Launcher               
                                                               
  Starting: Kimi ACP + Webhook Server + FastAPI               

"@ -ForegroundColor Cyan

# Set environment variables
$env:TOTP_ENCRYPTION_KEY = "dev-totp-key-change-in-production"
$env:JWT_SECRET_KEY = "dev-secret-key-change-in-production"
$env:PYTHONPATH = "C:\Users\jacke\Documents\GitHub\eSports-EXE\packages\shared"

$root = "C:\Users\jacke\Documents\GitHub\eSports-EXE"

# Kill existing processes on ports
Write-Status "Cleaning up existing services..." "..."
Get-NetTCPConnection -LocalPort $AcpPort -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Get-NetTCPConnection -LocalPort $WebhookPort -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Get-NetTCPConnection -LocalPort $ApiPort -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 1

# Start Kimi ACP
Write-Status "Starting Kimi ACP on port $AcpPort..." "..."
$acpJob = Start-Job -Name "KimiACP" -ScriptBlock {
    param($root)
    Set-Location $root
    kimi acp 2>&1
} -ArgumentList $root

Start-Sleep -Seconds 3

# Start Webhook Server
Write-Status "Starting Webhook Server on port $WebhookPort..." "..."
$webhookJob = Start-Job -Name "WebhookServer" -ScriptBlock {
    param($root, $port)
    Set-Location $root
    & "$root\.openclaw\scripts\webhook-server.ps1" -Port $port
} -ArgumentList $root, $WebhookPort

Start-Sleep -Seconds 2

# Start FastAPI
Write-Status "Starting FastAPI on port $ApiPort..." "..."
$apiJob = Start-Job -Name "FastAPI" -ScriptBlock {
    param($root, $port)
    $env:TOTP_ENCRYPTION_KEY = "dev-totp-key-change-in-production"
    $env:JWT_SECRET_KEY = "dev-secret-key-change-in-production"
    $env:PYTHONPATH = "$root\packages\shared"
    Set-Location "$root\packages\shared\api"
    uvicorn main:app --port $port --host 0.0.0.0 2>&1
} -ArgumentList $root, $ApiPort

Start-Sleep -Seconds 3

# Check status
Write-Host "`n Service Status:" -ForegroundColor Cyan
$services = @(
    @{ Name = "Kimi ACP"; Port = $AcpPort; Job = $acpJob },
    @{ Name = "Webhook Server"; Port = $WebhookPort; Job = $webhookJob },
    @{ Name = "FastAPI"; Port = $ApiPort; Job = $apiJob }
)

foreach ($svc in $services) {
    $connected = Test-NetConnection -ComputerName localhost -Port $svc.Port -WarningAction SilentlyContinue
    if ($connected.TcpTestSucceeded) {
        Write-Status "$($svc.Name) on port $($svc.Port)" "OK"
    } else {
        Write-Status "$($svc.Name) on port $($svc.Port)" "WAIT"
    }
}

Write-Host @"


   All services starting!                                     
                                                               
   Kimi ACP:      http://localhost:$AcpPort                    
   Webhook:       http://localhost:$WebhookPort                
   FastAPI:       http://localhost:$ApiPort                    
                                                               
  Press Ctrl+C to stop all services                            

"@ -ForegroundColor Green

# Monitor jobs
try {
    while ($true) {
        Start-Sleep -Seconds 5
        
        # Show any output
        foreach ($job in Get-Job) {
            $output = Receive-Job -Job $job -Keep
            if ($output) {
                Write-Host "[$($job.Name)] $($output[-1])" -ForegroundColor DarkGray
            }
        }
    }
} finally {
    Write-Host "`n Stopping all services..." -ForegroundColor Yellow
    Get-Job | Remove-Job -Force
    Write-Host " All services stopped" -ForegroundColor Green
}
