@echo off
REM Kill ONLY the process that is LISTENING on this exact TCP port.
REM No process-tree (/T) kills — that can accidentally stop simulated-nodes.
REM Usage: call _kill-port.bat 9500
setlocal EnableExtensions
set "PORT=%~1"
if "%PORT%"=="" (
  echo Usage: _kill-port.bat PORT
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$port = %PORT%;" ^
  "$conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue;" ^
  "if (-not $conns) { Write-Host ('   Port ' + $port + ': free'); exit 0 }" ^
  "$pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique;" ^
  "foreach ($procId in $pids) {" ^
  "  if ($procId -and $procId -ne 0) {" ^
  "    try {" ^
  "      $p = Get-Process -Id $procId -ErrorAction Stop;" ^
  "      Write-Host ('   - Killing PID ' + $procId + ' (' + $p.ProcessName + ') on port ' + $port);" ^
  "      Stop-Process -Id $procId -Force -ErrorAction Stop;" ^
  "    } catch {" ^
  "      Write-Host ('   - Could not kill PID ' + $procId + ': ' + $_.Exception.Message)" ^
  "    }" ^
  "  }" ^
  "}" ^
  "Start-Sleep -Milliseconds 400;" ^
  "$still = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue;" ^
  "if ($still) { Write-Host ('   Port ' + $port + ': STILL BUSY') } else { Write-Host ('   Port ' + $port + ': cleared') }"

endlocal
exit /b 0
