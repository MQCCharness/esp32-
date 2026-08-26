# ── ESP32-S3-MOC Educational Program — Build Script ──
# Builds the Vite frontend, then compiles the Go+Wails exe

Write-Host "`n=== ESP32-S3-MOC Educational Program Build ===`n" -ForegroundColor Cyan

# Step 1: Build the Vite frontend
Write-Host "[1/3] Building Vite frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] Vite build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Frontend built to dist/" -ForegroundColor Green

# Step 2: Build the Go exe
Write-Host "`n[2/3] Compiling Go + Wails exe..." -ForegroundColor Yellow
$env:CGO_ENABLED = "0"
go build -tags "desktop,production" -ldflags "-H windowsgui" -o esp32-edu.exe .
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] Go build failed!" -ForegroundColor Red
    exit 1
}

# Step 3: Report
$file = Get-Item "esp32-edu.exe"
$sizeMB = [math]::Round($file.Length / 1MB, 2)
Write-Host "`n[3/3] Build complete!" -ForegroundColor Green
Write-Host "  Output: $($file.FullName)" -ForegroundColor White
Write-Host "  Size:   $sizeMB MB" -ForegroundColor White
Write-Host "`n  Double-click esp32-edu.exe to run.`n" -ForegroundColor Cyan
