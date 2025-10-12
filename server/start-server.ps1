<#
Start the server in the background on Windows.
Saves the PID to .server.pid so it can be stopped later with stop-server.ps1

Usage:
  .\start-server.ps1

If Node is already running for this project (index.js in command line), it will not start a new one.
#>
Param()

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

Write-Host "Checking for existing node process running index.js..."
$existing = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and ($_.CommandLine -match 'index.js') -and ($_.CommandLine -match [regex]::Escape($scriptDir)) }
if ($existing) {
  $pids = $existing | Select-Object -ExpandProperty ProcessId
  Write-Host "Server already running (pid: $($pids -join ', '))."; exit 0
}

Write-Host "Starting node index.js in background..."
$proc = Start-Process -FilePath node -ArgumentList 'index.js' -WorkingDirectory $scriptDir -WindowStyle Hidden -PassThru
Start-Sleep -Milliseconds 500
if ($proc -and $proc.Id) {
  $proc.Id | Out-File -FilePath (Join-Path $scriptDir '.server.pid') -Encoding ascii
  Write-Host "Started server (pid: $($proc.Id)). PID saved to .server.pid"
} else {
  Write-Host "Failed to start server."; exit 1
}
