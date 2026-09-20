@echo off
setlocal EnableExtensions
call "%~dp0_env.bat"

echo [simulate] Ensuring LAN nodes on %ANFARS_NODE_WEB%-%ANFARS_NODE_PORTAL% (+ control %ANFARS_SIM_CONTROL%) ...
echo [simulate] Also restores UI-added services from extra-nodes.json

REM If already healthy, do not start a second copy
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:%ANFARS_SIM_CONTROL%/health' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 (
  echo [simulate] Already running — skip start.
  if /I not "%~1"=="/silent" pause
  endlocal
  exit /b 0
)

REM Free stuck simulate ports (defaults + any UI-added extras), then start once
call "%~dp0_kill-port.bat" %ANFARS_SIM_CONTROL%
call "%~dp0_kill-port.bat" %ANFARS_NODE_WEB%
call "%~dp0_kill-port.bat" %ANFARS_NODE_WEB_STBY%
call "%~dp0_kill-port.bat" %ANFARS_NODE_APP%
call "%~dp0_kill-port.bat" %ANFARS_NODE_APP_STBY%
call "%~dp0_kill-port.bat" %ANFARS_NODE_API%
call "%~dp0_kill-port.bat" %ANFARS_NODE_PORTAL%
echo [simulate] Freeing UI-added service ports ...
call "%~dp0_kill-extra-ports.bat"

start "ANFARS-Simulate" cmd /k "cd /d "%NODES%" && title ANFARS Simulate Nodes && npm start"
echo [simulate] Window opened — waiting until control is healthy ...
call "%~dp0_wait-simulate.bat"

if /I not "%~1"=="/silent" pause
endlocal
exit /b 0
