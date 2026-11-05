# KEYFLOW Unified Local Development Startup System
# ===================================================
# Orchestrates Django Backend (port 8000) and Vite Frontend (port 5173).
# Ensures backend health verification before launching frontend proxy.

$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path "$PSScriptRoot\..").Path
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"
$VenvPython = Join-Path $BackendDir ".venv\Scripts\python.exe"

Write-Host "==========================================================" -ForegroundColor Magenta
Write-Host "         KEYFLOW Unified Local Development Suite          " -ForegroundColor Magenta
Write-Host "==========================================================" -ForegroundColor Magenta

# 1. Verify Project Paths
Write-Host "[1/5] Detecting environment..." -ForegroundColor Gray
Write-Host "  -> Project Root: $ProjectRoot" -ForegroundColor DarkGray
Write-Host "  -> Backend:      $BackendDir" -ForegroundColor DarkGray
Write-Host "  -> Frontend:     $FrontendDir" -ForegroundColor DarkGray

if (-not (Test-Path $VenvPython)) {
    Write-Host "[ERROR] Django virtual environment not found at: $VenvPython" -ForegroundColor Red
    Write-Host "Please set up the virtual environment first:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor Yellow
    Write-Host "  python -m venv .venv" -ForegroundColor Yellow
    Write-Host "  .\.venv\Scripts\pip.exe install -r requirements.txt" -ForegroundColor Yellow
    exit 1
}

# 2. Check Backend on Port 8000
Write-Host "`n[2/5] Checking Django backend status..." -ForegroundColor Gray
$backendAlreadyRunning = $false
$backendProcess = $null

try {
    $conn = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) {
        $backendAlreadyRunning = $true
    }
} catch {
    $netstat = netstat -ano | findstr :8000
    if ($netstat) {
        $backendAlreadyRunning = $true
    }
}

if ($backendAlreadyRunning) {
    Write-Host "  -> Port 8000 is occupied. Probing health..." -ForegroundColor DarkGray
    try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health/" -TimeoutSec 3 -ErrorAction Stop
        if ($health.status -eq "ok" -and $health.database -eq "ok") {
            Write-Host "[OK] Existing Django process is healthy. Reusing process." -ForegroundColor Green
        } else {
            Write-Host "[WARNING] Existing backend returned degraded state: $($health.database)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[ERROR] Port 8000 is occupied by an unresponsive process." -ForegroundColor Red
        Write-Host "Please free port 8000 before running 'npm run dev'." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "  -> Port 8000 is free. Starting Django development server..." -ForegroundColor Gray
    $backendProcess = Start-Process -FilePath $VenvPython `
        -ArgumentList "manage.py", "runserver", "127.0.0.1:8000", "--noreload" `
        -WorkingDirectory $BackendDir `
        -PassThru `
        -WindowStyle Hidden

    Write-Host "  -> Django process launched (PID: $($backendProcess.Id)). Waiting for health check..." -ForegroundColor DarkGray

    # 3. Poll Backend Health Check
    $isHealthy = $false
    $retries = 30
    for ($i = 1; $i -le $retries; $i++) {
        Start-Sleep -Milliseconds 500
        try {
            $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health/" -TimeoutSec 2 -ErrorAction Stop
            if ($health.status -eq "ok" -and $health.database -eq "ok") {
                $isHealthy = $true
                break
            }
        } catch {
            # Still initializing
        }
        if ($backendProcess.HasExited) {
            Write-Host "[ERROR] Django process terminated unexpectedly with code: $($backendProcess.ExitCode)" -ForegroundColor Red
            exit 1
        }
    }

    if (-not $isHealthy) {
        Write-Host "[ERROR] Backend health check timed out after 15 seconds." -ForegroundColor Red
        if ($backendProcess -and -not $backendProcess.HasExited) {
            Stop-Process -Id $backendProcess.Id -Force
        }
        exit 1
    }
    Write-Host "[OK] Django backend verified healthy on 127.0.0.1:8000 (Database: OK)" -ForegroundColor Green
}

# 4. Display System Map
Write-Host "`n[3/5] Service Endpoint Map:" -ForegroundColor Cyan
Write-Host "  [Frontend]   http://localhost:5173" -ForegroundColor White
Write-Host "  [Backend]    http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  [API Health] http://localhost:5173/api/health/ (proxied -> :8000)" -ForegroundColor White
Write-Host "  [Leaderboard]http://localhost:5173/api/leaderboard/ (proxied -> :8000)" -ForegroundColor White
Write-Host "  [Academy]    http://localhost:5173/academy" -ForegroundColor White
Write-Host "  [Workstation]http://localhost:5173/workstation" -ForegroundColor White
Write-Host "  [Arcade]     http://localhost:5173/arcade" -ForegroundColor White

# 5. Launch Vite Frontend
Write-Host "`n[4/5] Launching Vite development server..." -ForegroundColor Gray
Write-Host "Press Ctrl+C to terminate the development session.`n" -ForegroundColor Yellow

try {
    Push-Location $FrontendDir
    & npm run dev
} finally {
    Pop-Location
    Write-Host "`n[5/5] Shutting down development environment..." -ForegroundColor Gray
    if ($backendProcess -and -not $backendProcess.HasExited) {
        Write-Host "Stopping spawned Django backend (PID: $($backendProcess.Id))..." -ForegroundColor DarkGray
        try {
            Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
        } catch {}
    }
    Write-Host "KEYFLOW shutdown complete." -ForegroundColor Green
}
