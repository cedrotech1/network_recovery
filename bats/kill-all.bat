@echo off
REM Stop EVERYTHING: app + simulated nodes
setlocal EnableExtensions
call "%~dp0_env.bat"

echo ============================================
echo   ANFARS - Kill ALL
echo   Stops backend, frontend, AND simulate
echo ============================================
echo.

echo [1/3] Stop app ports ...
call "%~dp0_kill-port.bat" %ANFARS_API_PORT%
call "%~dp0_kill-port.bat" %ANFARS_UI_PORT%

echo [2/3] Stop simulate ports (defaults + UI-added) ...
call "%~dp0_kill-port.bat" %ANFARS_SIM_CONTROL%
call "%~dp0_kill-port.bat" %ANFARS_NODE_WEB%
call "%~dp0_kill-port.bat" %ANFARS_NODE_WEB_STBY%
call "%~dp0_kill-port.bat" %ANFARS_NODE_APP%
call "%~dp0_kill-port.bat" %ANFARS_NODE_APP_STBY%
call "%~dp0_kill-port.bat" %ANFARS_NODE_API%
call "%~dp0_kill-port.bat" %ANFARS_NODE_PORTAL%
call "%~dp0_kill-extra-ports.bat"

echo [3/3] Close ANFARS console windows ...
taskkill /FI "WINDOWTITLE eq ANFARS-Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq ANFARS Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq ANFARS-Frontend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq ANFARS Frontend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq ANFARS-Simulate*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq ANFARS Simulate*" /T /F >nul 2>&1

call "%~dp0_wait.bat" 1
echo.
echo Everything stopped.
if /I not "%~1"=="/silent" pause
endlocal
exit /b 0
