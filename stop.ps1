# 软件库 · 停止脚本（Windows）
# 用法：双击 stop.bat，或在 PowerShell 里执行 .\stop.ps1
$port = 8080
$conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue

if (-not $conn) {
  Write-Host "端口 $port 没有在运行的服务" -ForegroundColor Yellow
  exit 0
}

foreach ($p in @($conn | Select-Object -ExpandProperty OwningProcess -Unique)) {
  try {
    Stop-Process -Id $p -Force -ErrorAction Stop
    Write-Host ("已停止进程 PID {0}" -f $p) -ForegroundColor Green
  } catch {
    Write-Host ("停止 PID {0} 失败：{1}" -f $p, $_.Exception.Message) -ForegroundColor Red
  }
}

Start-Sleep -Milliseconds 700
if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
  Write-Host "端口 $port 仍被占用" -ForegroundColor Red
  exit 1
}
Write-Host "服务已关闭，数据仍保存在 data\ 目录" -ForegroundColor Green
