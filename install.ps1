# Musicku CLI Windows Installer
# Run in PowerShell: irm https://raw.githubusercontent.com/rajibjugi02-ctrl/Musicku/main/install.ps1 | iex

$ErrorActionPreference = "Stop"

Write-Host "───────────────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host "   Musicku CLI Installer (Windows PowerShell)" -ForegroundColor Cyan
Write-Host "   Apple iOS 26 Liquid Audio Streaming" -ForegroundColor DarkCyan
Write-Host "───────────────────────────────────────────────────────" -ForegroundColor Cyan

# 1. Check Node.js and npm
if (-not (Get-Command "node" -ErrorAction SilentlyContinue) -or -not (Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Host "`n[ERROR] Node.js dan npm diperlukan untuk menjalankan CLI Musicku." -ForegroundColor Red
    Write-Host "Silakan download dan instal Node.js terlebih dahulu di: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

$nodeVer = (node -v)
Write-Host "`n[OK] Node.js terdeteksi: $nodeVer" -ForegroundColor Green

# 2. Setup directory
$installDir = "$env:LOCALAPPDATA\MusickuCLI"
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

$binDir = "$installDir\bin"
if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
}

# 3. Download CLI script
$cliUrl = "https://raw.githubusercontent.com/rajibjugi02-ctrl/Musicku/main/bin/opmusic.js"
$targetScript = "$binDir\opmusic.js"
Write-Host "Mengunduh Musicku CLI..." -ForegroundColor Gray

# Local fallback if run from repository
if (Test-Path ".\bin\opmusic.js") {
    Copy-Item -Path ".\bin\opmusic.js" -Destination $targetScript -Force
} else {
    Invoke-WebRequest -Uri $cliUrl -OutFile $targetScript -UseBasicParsing
}

# 4. Create batch wrapper (opmusic.cmd)
$cmdContent = "@echo off`r`nnode `"%~dp0opmusic.js`" %*"
Set-Content -Path "$binDir\opmusic.cmd" -Value $cmdContent -Force

# 5. Add to User PATH if not already present
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$binDir*") {
    Write-Host "Menambahkan $binDir ke PATH sistem..." -ForegroundColor Gray
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$binDir", "User")
    $env:Path = "$env:Path;$binDir"
}

Write-Host "`n───────────────────────────────────────────────────────" -ForegroundColor Green
Write-Host "  ✔ Musicku CLI (opmusic) berhasil terpasang!" -ForegroundColor Green
Write-Host "───────────────────────────────────────────────────────" -ForegroundColor Green
Write-Host "`nKetik perintah berikut untuk mulai mendengarkan musik:" -ForegroundColor Yellow
Write-Host "  opmusic           (Buka Musicku)" -ForegroundColor Cyan
Write-Host "  opmusic --cloud   (Buka versi Cloud Production)" -ForegroundColor Cyan
Write-Host "  opmusic --dev     (Jalankan server lokal)" -ForegroundColor Cyan
Write-Host "  opmusic --help    (Lihat panduan lengkap)" -ForegroundColor Cyan
Write-Host ""
