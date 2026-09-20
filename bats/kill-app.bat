@echo off
REM Stop Backend + Frontend ONLY. Keep simulated-nodes running.
REM If simulate was somehow already down, restart it at the end.
setlocal EnableExtensions
call "%~dp0_env.bat"

echo ============================================
echo   ANFARS - Stop APP (keep simulate)
echo   Stop:  Backend %ANFARS_API_PORT% + Frontend %ANFARS_UI_PORT%
echo   Keep:  Simulate %ANFARS_SIM_CONTROL% and %ANFARS_NODE_WEB%-%ANFARS_NODE_PORTAL% (+ UI extras)
echo ============================================
echo.
echo NOTE: The website http://127.0.0.1:%ANFARS_UI_PORT% will NOT open after this.
echo       That is normal. Use restart-app.bat when you want the UI again.
echo.

echo [1/3] Free API / UI ports only (exact PID, no tree-kill) ...
call "%~dp0_kill-port.bat" %ANFARS_API_PORT%
call "%~dp0_kill-port.bat" %ANFARS_UI_PORT%

echo [2/3] Close Backend/Frontend console windows (not Simulate) ...
REM No /T here — avoid killing unrelated processes
taskkill /FI "WINDOWTITLE eq ANFARS-Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq ANFARS Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq ANFARS-Frontend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq ANFARS Frontend*" /F >nul 2>&1

call "%~dp0_wait.bat" 1

echo [3/3] Verify simulated nodes still up ...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:%ANFARS_SIM_CONTROL%/health' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { Write-Host '   Simulate: OK'; exit 0 }; exit 1 } catch { Write-Host '   Simulate: DOWN — restarting...'; exit 1 }"
if errorlevel 1 (
  call "%~dp0start-simulate.bat" /silent
)

echo.
echo --------------------------------------------
echo APP stopped:
echo   UI  http://127.0.0.1:%ANFARS_UI_PORT%  = offline (expected)
echo   API http://127.0.0.1:%ANFARS_API_PORT% = offline (expected)
echo.
echo SIMULATE still for lab tests:
echo   Control http://127.0.0.1:%ANFARS_SIM_CONTROL%/health
echo   Portal  http://127.0.0.1:%ANFARS_NODE_PORTAL%/health
echo.
echo To open the website again:  restart-app.bat
echo --------------------------------------------
if /I not "%~1"=="/silent" pause
endlocal
exit /b 0
