# One Terminal - All Services
$root = "C:\Users\jacke\Documents\GitHub\eSports-EXE"
$env:TOTP_ENCRYPTION_KEY = "dev-totp-key-change-in-production"
$env:JWT_SECRET_KEY = "dev-secret-key-change-in-production"
$env:PYTHONPATH = "$root\packages\shared"

function Test-Port($port) {
    try { $c = New-Object Net.Sockets.TcpClient("localhost", $port); $c.Close(); return $true } catch { return $false }
}

Write-Host "STARTING ALL SERVICES..." -ForegroundColor Green

# Start Webhook (background job)
$wh = Start-Job { cd $using:root; .openclaw/scripts/webhook-server.ps1 -Port 3001 }

# Start ACP (background job)  
$acp = Start-Job { cd $using:root; python .openclaw/acp-server.py }

# Start FastAPI (background job)
$api = Start-Job { 
    cd "$using:root\packages\shared\api"
    $env:PYTHONPATH = "$using:root\packages\shared"
    $env:TOTP_ENCRYPTION_KEY = "dev-totp-key-change-in-production"
    $env:JWT_SECRET_KEY = "dev-secret-key-change-in-production"
    uvicorn main:app --port 8000 --host 0.0.0.0
}

Write-Host "Waiting for services to start..." -ForegroundColor Yellow
for ($i=5; $i -gt 0; $i--) { Write-Host "$i..." -NoNewline; Start-Sleep 1 }
Write-Host "`n"

# Test all services
Write-Host "=== SERVICE STATUS ===" -ForegroundColor Cyan
$ports = @(3001, 8080, 8000)
$names = @("Webhook", "ACP Bridge", "FastAPI")
for ($i=0; $i -lt 3; $i++) {
    $ok = Test-Port $ports[$i]
    $color = if ($ok) { "Green" } else { "Red" }
    $status = if ($ok) { "ONLINE" } else { "OFFLINE" }
    Write-Host "$($names[$i]) (port $($ports[$i])): " -NoNewline
    Write-Host $status -ForegroundColor $color
}

Write-Host "`n=== LOGS (Ctrl+C to stop viewing) ===" -ForegroundColor Cyan
while ($true) {
    Receive-Job $wh -Keep | Select-Object -Last 1 | Write-Host -ForegroundColor DarkGray
    Receive-Job $acp -Keep | Select-Object -Last 1 | Write-Host -ForegroundColor DarkGray
    Receive-Job $api -Keep | Select-Object -Last 1 | Write-Host -ForegroundColor DarkGray
    Start-Sleep 2
}
