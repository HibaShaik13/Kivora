# Kivora Local Development Launcher
# Starts FastAPI backend (port 8000) and Vite frontend (port 5174)

$ProjectRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path "$ProjectRoot\backend\app\main.py")) {
    $ProjectRoot = (Get-Location).Path
}

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Starting Kivora Marketplace (Local Development)" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Project Root: $ProjectRoot"

# 1. Check Port 8000 (Backend)
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($port8000) {
    Write-Host "[INFO] Port 8000 is currently occupied (PID: $($port8000[0].OwningProcess))." -ForegroundColor Yellow
}

# 2. Check Port 5174 (Frontend)
$port5174 = Get-NetTCPConnection -LocalPort 5174 -ErrorAction SilentlyContinue
if ($port5174) {
    Write-Host "[INFO] Port 5174 is currently occupied (PID: $($port5174[0].OwningProcess))." -ForegroundColor Yellow
}

# 3. Launch Backend in new window if not already active
if (-not $port8000) {
    Write-Host "[STARTING] Launching FastAPI Backend on http://localhost:8000..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot'; python -m uvicorn backend.app.main:app --reload --port 8000"
} else {
    Write-Host "[OK] Backend server is already running." -ForegroundColor Green
}

# 4. Launch Frontend in new window if not already active
if (-not $port5174) {
    Write-Host "[STARTING] Launching Vite Frontend on http://localhost:5174..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot\frontend'; npm run dev -- --port 5174"
} else {
    Write-Host "[OK] Frontend server is already running." -ForegroundColor Green
}

Write-Host ""
Write-Host "Kivora services are ready:" -ForegroundColor Cyan
Write-Host "  - Frontend: http://localhost:5174" -ForegroundColor White
Write-Host "  - Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  - API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "  - Health:   http://localhost:8000/api/health" -ForegroundColor White
Write-Host "=======================================================" -ForegroundColor Cyan
