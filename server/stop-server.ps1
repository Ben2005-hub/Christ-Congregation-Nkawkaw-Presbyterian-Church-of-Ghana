Param()

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

$pidFile = Join-Path $scriptDir '.server.pid'
if (Test-Path $pidFile) {
  $pid = Get-Content $pidFile -ErrorAction SilentlyContinue
  if ($pid) {
    Write-Host "Stopping server pid $pid ..."
    try { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue; Remove-Item $pidFile -ErrorAction SilentlyContinue; Write-Host 'Stopped.' } catch { Write-Host 'Failed to stop or process not found.' }
    exit 0
  }
}
Write-Host "No PID file found. Trying to stop any node index.js processes in this folder..."
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and ($_.CommandLine -match 'index.js') -and ($_.CommandLine -match [regex]::Escape($scriptDir)) } | ForEach-Object { Write-Host "Stopping pid: $($_.ProcessId)"; Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
