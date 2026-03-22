@echo off
REM [Ver001.000] - Start All SATOR Services
REM One-click startup for: Webhook + ACP Bridge + FastAPI

echo ==========================================
echo    STARTING ALL SATOR SERVICES
echo ==========================================
echo.

set ROOT=C:\Users\jacke\Documents\GitHub\eSports-EXE
set PYTHONPATH=%ROOT%\packages\shared
set TOTP_ENCRYPTION_KEY=dev-totp-key-change-in-production
set JWT_SECRET_KEY=dev-secret-key-change-in-production

echo Starting Service 1: Webhook Server (Port 3001)...
start "WEBHOOK SERVER - Port 3001" cmd /k "cd /d %ROOT% && powershell -ExecutionPolicy Bypass -File .openclaw\scripts\webhook-server.ps1 -Port 3001"

timeout /t 2 /nobreak >nul

echo Starting Service 2: ACP Bridge (Port 8080)...
start "ACP BRIDGE - Port 8080" cmd /k "cd /d %ROOT% && python .openclaw\acp-server.py"

timeout /t 2 /nobreak >nul

echo Starting Service 3: FastAPI (Port 8000)...
start "FASTAPI - Port 8000" cmd /k "cd /d %ROOT%\packages\shared\api && set PYTHONPATH=%ROOT%\packages\shared&& set TOTP_ENCRYPTION_KEY=dev-totp-key-change-in-production&& set JWT_SECRET_KEY=dev-secret-key-change-in-production&& uvicorn main:app --port 8000 --host 0.0.0.0"

timeout /t 3 /nobreak >nul

echo.
echo ==========================================
echo    ALL SERVICES STARTED!
echo ==========================================
echo.
echo Webhook:  http://localhost:3001
echo ACP:      http://localhost:8080
echo FastAPI:  http://localhost:8000
echo.
echo Testing in 5 seconds...
timeout /t 5 /nobreak >nul

curl http://localhost:3001/health
curl http://localhost:8000/health

echo.
echo Press any key to close this window (services keep running)...
pause >nul
