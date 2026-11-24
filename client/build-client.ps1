param(
  [string]$Python = "python"
)

$root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root

& $Python -m PyInstaller `
  --noconfirm --clean --onefile --windowed `
  --name software-hub-client `
  --icon "$root\app\static\favicon.ico" `
  --add-data "$root\client\launcher.html;." `
  "$root\client\client.py"

if ($LASTEXITCODE -ne 0) {
  Write-Error "构建失败，请查看上方输出"
  exit $LASTEXITCODE
}

Copy-Item -LiteralPath "$root\dist\software-hub-client.exe" -Destination "$root\software-hub-client.exe" -Force
Write-Output "已生成：$root\software-hub-client.exe"
