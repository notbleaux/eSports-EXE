# Start All Services - Simple Version
$root = "C:\Users\jacke\Documents\GitHub\eSports-EXE"

# Set env vars
$env:TOTP_ENCRYPTION_KEY = "dev-totp-key-change-in-production"
$env:JWT_SECRET_KEY = "dev-secret-key-change-in-production"
$env:PYTHONPATH = "$root\packages\shared"

Write-Host "Starting all services..." -ForegroundColor Green

# Start Webhook
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; .openclaw/scripts/webhook-server.ps1 -Port 3001"

Start-Sleep 2

# Start ACP
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; python .openclaw/acp-server.py"

Start-Sleep 2

# Start FastAPI
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\packages\shared\api'; `$env:PYTHONPATH='$root\packages\shared'; `$env:TOTP_ENCRYPTION_KEY='dev-totp-key-change-in-production'; `$env:JWT_SECRET_KEY='dev-secret-key-change-in-production'; uvicorn main:app --port 8000 --host 0.0.0.0"

Write-Host "`nAll services started in separate windows!" -ForegroundColor Green
Write-Host "Webhook:  http://localhost:3001"
Write-Host "ACP:      http://localhost:8080"
Write-Host "FastAPI:  http://localhost:8000"
