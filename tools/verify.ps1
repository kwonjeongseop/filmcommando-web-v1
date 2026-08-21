# filmcommando.com 자동 검증 스크립트
# 실행: powershell -ExecutionPolicy Bypass -File tools\verify.ps1

$ErrorActionPreference = 'SilentlyContinue'
$datFile  = Join-Path $PSScriptRoot 'verify.dat'
$logFile  = 'C:\claude\test-results\logs\verify.log'
$ts       = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$pass = 0; $fail = 0

Add-Content $logFile '' -Encoding UTF8
Add-Content $logFile "=== 검증 시작: $ts ===" -Encoding UTF8

$lines = Get-Content $datFile |
  Where-Object { $_ -notmatch '^\s*#' -and $_ -match '\|' }

foreach ($line in $lines) {
  $p      = $line.Trim() -split '\|', 3
  $type   = $p[0].Trim()
  $target = $p[1].Trim()
  $expect = $p[2].Trim()
  $ok     = $false
  $msg    = ''

  switch ($type) {
    'PAGE' {
      try {
        $r    = Invoke-WebRequest -Uri $target `
                  -UseBasicParsing -TimeoutSec 15
        $code = [int]$r.StatusCode
      } catch {
        $code = 0
      }
      $ok  = ($code -eq [int]$expect)
      $msg = "PAGE $($target.Split('/')[-1]): " +
             "$code (기대 $expect) -> " +
             $(if ($ok){'PASS'}else{'FAIL'})
    }

    'API' {
      try {
        $r    = Invoke-WebRequest -Uri $target `
                  -Method POST `
                  -ContentType 'application/json' `
                  -Body '{}' `
                  -UseBasicParsing -TimeoutSec 15
        $code = [int]$r.StatusCode
      } catch {
        $code = [int]($_.Exception.Response.StatusCode.value__)
      }
      $ok  = ($code -eq [int]$expect)
      $msg = "API Firebase ($code vs $expect) -> " +
             $(if ($ok){'PASS'}else{'FAIL'})
    }

    'FILE' {
      $count = (Get-ChildItem `
                 -LiteralPath $target `
                 -File `
                 -ErrorAction SilentlyContinue).Count
      $ok    = ($count -ge [int]$expect)
      $msg   = "FILE 수량: $count 개 " +
               "(기대 >=$expect) -> " +
               $(if ($ok){'PASS'}else{'FAIL'})
    }
  }

  if ($ok) { $pass++ } else { $fail++ }
  $color = if ($ok) { 'Green' } else { 'Red' }
  Write-Host "[$(if($ok){'PASS'}else{'FAIL'})] $msg" `
    -ForegroundColor $color
  Add-Content $logFile "[$(if($ok){'PASS'}else{'FAIL'})] $msg" -Encoding UTF8
}

$summary = "결과 요약: PASS=$pass FAIL=$fail " +
           "총=$($pass+$fail)"
Write-Host ''
Write-Host "=== $summary ===" -ForegroundColor Cyan
Add-Content $logFile "=== $summary ===" -Encoding UTF8
Add-Content $logFile "=== 검증 완료: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" -Encoding UTF8

if ($fail -gt 0) { exit 1 } else { exit 0 }
