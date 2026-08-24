# filmcommando 가비아 FTP 배포 도구(deploy.py)를 exe로 빌드하고 코드서명하는 스크립트
param(
    [string]$VERSION = "0.0.9"
)

$ErrorActionPreference = 'Stop'
$ToolsDir = $PSScriptRoot
$EnvFile  = Join-Path $ToolsDir '.env'
$CertsDir = Join-Path $ToolsDir 'certs'
$Name     = "filmcommando-web-v$VERSION"

# ── .env에서 PFX_PASSWORD 로드 (값은 변수에만 보관, 절대 출력하지 않음) ──
if (-not (Test-Path $EnvFile)) {
    Write-Error ".env 파일을 찾을 수 없습니다: $EnvFile"
    exit 1
}
$envMap = @{}
Get-Content $EnvFile | Where-Object { $_ -match '=' -and $_ -notmatch '^\s*#' } | ForEach-Object {
    $idx = $_.IndexOf('=')
    $k = $_.Substring(0, $idx).Trim()
    $v = $_.Substring($idx + 1).Trim()
    $envMap[$k] = $v
}
$pfxPassword = $envMap['PFX_PASSWORD']
if (-not $pfxPassword) {
    Write-Error "PFX_PASSWORD 값을 .env에서 찾을 수 없습니다."
    exit 1
}

# ── certs 폴더에서 PFX 파일 자동 탐색 ──
$pfxFile = Get-ChildItem -Path $CertsDir -Filter '*.pfx' -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $pfxFile) {
    Write-Error "tools\certs\ 폴더에서 .pfx 파일을 찾을 수 없습니다."
    exit 1
}

Write-Host "=== $Name 빌드 시작 (PyInstaller) ==="
Push-Location $ToolsDir
try {
    python -m PyInstaller --onefile --name $Name --distpath dist --workpath "build\$Name" --specpath . deploy.py
    if ($LASTEXITCODE -ne 0) { throw "PyInstaller 빌드 실패 (exit $LASTEXITCODE)" }
} finally {
    Pop-Location
}

$builtExe = Join-Path $ToolsDir "dist\$Name.exe"
if (-not (Test-Path $builtExe)) {
    Write-Error "빌드 결과 exe를 찾을 수 없습니다: $builtExe"
    exit 1
}

$finalExe = Join-Path $ToolsDir "$Name.exe"
Copy-Item -Path $builtExe -Destination $finalExe -Force
Write-Host "빌드 완료: $finalExe"

Write-Host "=== 코드서명 시작 ==="
try {
    $securePw = ConvertTo-SecureString -String $pfxPassword -AsPlainText -Force
    $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2(
        $pfxFile.FullName, $securePw, 'Exportable,PersistKeySet')
    $result = Set-AuthenticodeSignature -FilePath $finalExe -Certificate $cert `
        -TimestampServer "http://timestamp.digicert.com"
} finally {
    $pfxPassword = $null
    $securePw = $null
}

if ($result.Status -ne 'Valid') {
    Write-Error "코드서명 실패: $($result.StatusMessage)"
    exit 1
}

Write-Host "=== 완료 ==="
Write-Host "서명된 인증서: $($cert.Subject)"
Write-Host "서명 상태: $($result.Status)"
Write-Host "최종 파일: $finalExe"
