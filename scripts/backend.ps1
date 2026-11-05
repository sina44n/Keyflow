# KEYFLOW Dedicated Backend Startup Script
# ==========================================
# Starts Django development server with environment validation and health checks.

$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path "$PSScriptRoot\..").Path
$BackendDir = Join-Path $ProjectRoot "backend"
$VenvPython = Join-Path $BackendDir ".venv\Scripts\python.exe"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         KEYFLOW Backend Development Server               " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check Python executable
if (-not (Test-Path $VenvPython)) {
    Write-Host "[ERROR] Virtual environment Python not found at: $VenvPython" -ForegroundColor Red
    Write-Host "Run the following to initialize backend venv:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor Yellow
    Write-Host "  python -m venv .venv" -ForegroundColor Yellow
    Write-Host "  .\.venv\Scripts\pip.exe install -r requirements.txt" -ForegroundColor Yellow
    exit 1
}

# 2. Check if port 8000 is occupied
$portActive = $false
try {
    $conn = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) { $portActive = $true }
} catch {
    # Fallback for systems without Get-NetTCPConnection
    $netstat = netstat -ano | findstr :8000
    if ($netstat) { $portActive = $true }
}

if ($portActive) {
    Write-Host "[WARNING] Port 8000 is already in use." -ForegroundColor Yellow
    try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health/" -TimeoutSec 2 -ErrorAction Stop
        if ($health.status -eq "ok") {
            Write-Host "[OK] Existing process on port 8000 is a healthy KEYFLOW backend." -ForegroundColor Green
            Write-Host "Health endpoint: http://127.0.0.1:8000/api/health/" -ForegroundColor Cyan
            exit 0
        }
    } catch {
        Write-Host "[ERROR] Port 8000 is occupied by an unresponsive or non-KEYFLOW process." -ForegroundColor Red
        Write-Host "Please free port 8000 or terminate the conflicting process before starting Django." -ForegroundColor Yellow
        exit 1
    }
}

# 3. Run Django System Check
Write-Host "[1/3] Running Django system check..." -ForegroundColor Gray
Push-Location $BackendDir
try {
    & $VenvPython manage.py check
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Django system check failed." -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "[OK] Django system check passed." -ForegroundColor Green
} finally {
    Pop-Location
}

# 4. Display endpoints
Write-Host "`n[2/3] KEYFLOW API Endpoints:" -ForegroundColor Cyan
Write-Host "  -> Base API:        http://127.0.0.1:8000/api/" -ForegroundColor White
Write-Host "  -> Health Probe:    http://127.0.0.1:8000/api/health/" -ForegroundColor White
Write-Host "  -> Leaderboard API: http://127.0.0.1:8000/api/leaderboard/" -ForegroundColor White
Write-Host "  -> Quotes API:      http://127.0.0.1:8000/api/quotes/current/?lang=en" -ForegroundColor White
Write-Host "  -> Admin Panel:     http://127.0.0.1:8000/admin/" -ForegroundColor White

Write-Host "`n[3/3] Starting Django on 127.0.0.1:8000 (Ctrl+C to stop)..." -ForegroundColor Yellow
Push-Location $BackendDir
try {
    & $VenvPython manage.py runserver 127.0.0.1:8000
} finally {
    Pop-Location
}

