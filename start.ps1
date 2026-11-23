# 软件库 · 启动脚本（Windows）
# 用法：双击 start.bat，或在 PowerShell 里执行 .\start.ps1
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8080
$env:PORT = "$port"
$env:DATA_DIR = Join-Path $root 'data'
if (-not (Test-Path -LiteralPath $env:DATA_DIR)) { New-Item -ItemType Directory -Path $env:DATA_DIR | Out-Null }

$conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($conn) {
  Write-Host "端口 $port 已有实例在运行，先关闭旧进程…" -ForegroundColor Yellow
  foreach ($p in @($conn | Select-Object -ExpandProperty OwningProcess -Unique)) {
    try { Stop-Process -Id $p -Force -ErrorAction Stop } catch {}
  }
  Start-Sleep -Milliseconds 900
}

$outLog = Join-Path $env:DATA_DIR 'server.out.log'
$errLog = Join-Path $env:DATA_DIR 'server.err.log'
Start-Process -FilePath 'python' `
  -ArgumentList '-u', (Join-Path $root 'app\server.py') `
  -WorkingDirectory $root -WindowStyle Hidden `
  -RedirectStandardOutput $outLog -RedirectStandardError $errLog

Start-Sleep -Seconds 2
$listen = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue

if ($listen) {
  Write-Host ("启动成功 → http://127.0.0.1:{0}" -f $port) -ForegroundColor Green
  Write-Host ("PID: {0}" -f ($listen | Select-Object -First 1 -ExpandProperty OwningProcess))
  Write-Host '默认账号 admin / admin123（首次登录后请改密码）'
  Write-Host ("日志：{0}" -f $outLog)
} else {
  Write-Host '启动失败，错误日志最后几行：' -ForegroundColor Red
  if (Test-Path -LiteralPath $errLog) { Get-Content -LiteralPath $errLog -Encoding UTF8 -Tail 12 }
  exit 1
}
