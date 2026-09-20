@echo off
REM Free ports used by UI-added simulated services (extra-nodes.json), typically 9407+.
REM Defaults 9401-9406 are handled separately by callers.
setlocal EnableExtensions
call "%~dp0_env.bat"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$file = Join-Path '%NODES%' 'extra-nodes.json';" ^
  "if (-not (Test-Path $file)) { Write-Host '   Extra ports: none (no extra-nodes.json)'; exit 0 }" ^
  "try { $nodes = Get-Content $file -Raw | ConvertFrom-Json } catch { Write-Host '   Extra ports: could not read JSON'; exit 0 }" ^
  "if (-not $nodes) { Write-Host '   Extra ports: empty'; exit 0 }" ^
  "foreach ($n in @($nodes)) {" ^
  "  $port = [int]$n.port;" ^
  "  if ($port -lt 1) { continue }" ^
  "  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue;" ^
  "  if (-not $conns) { Write-Host ('   Port ' + $port + ' (' + $n.key + '): free'); continue }" ^
  "  $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique;" ^
  "  foreach ($procId in $pids) {" ^
  "    if ($procId -and $procId -ne 0) {" ^
  "      try {" ^
  "        $p = Get-Process -Id $procId -ErrorAction Stop;" ^
  "        Write-Host ('   - Killing PID ' + $procId + ' (' + $p.ProcessName + ') on extra port ' + $port + ' (' + $n.key + ')');" ^
  "        Stop-Process -Id $procId -Force -ErrorAction Stop;" ^
  "      } catch {" ^
  "        Write-Host ('   - Could not kill PID ' + $procId + ': ' + $_.Exception.Message)" ^
  "      }" ^
  "    }" ^
  "  }" ^
  "}"

endlocal
exit /b 0
