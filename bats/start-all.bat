@echo off
setlocal EnableExtensions
call "%~dp0_env.bat"

echo ============================================
echo   ANFARS - Start ALL (conflict-safe)
echo   UI:       http://127.0.0.1:%ANFARS_UI_PORT%/login
echo   API:      http://127.0.0.1:%ANFARS_API_PORT%
echo   Nodes:    %ANFARS_NODE_WEB%-%ANFARS_NODE_PORTAL% (+ UI extras)
echo   Control:  %ANFARS_SIM_CONTROL%
echo ============================================
echo.

echo [0] Free stuck APP ports first (simulate kept if already healthy) ...
call "%~dp0_kill-port.bat" %ANFARS_API_PORT%
call "%~dp0_kill-port.bat" %ANFARS_UI_PORT%
call "%~dp0_wait.bat" 1

echo [1] Simulate nodes (defaults + UI-added from extra-nodes.json) ...
call "%~dp0start-simulate.bat" /silent

echo [2] Backend API ...
call "%~dp0start-backend.bat" /silent
call "%~dp0_wait.bat" 5

echo [3] Frontend UI ...
call "%~dp0start-frontend.bat" /silent
call "%~dp0_wait.bat" 4

echo.
echo Opening login page...
start "" "http://127.0.0.1:%ANFARS_UI_PORT%/login"
echo.
echo Done.
echo   stop-app.bat / kill-app.bat  = stop UI+API, KEEP simulate
echo   kill-all.bat                 = stop everything
if /I not "%~1"=="/silent" pause
endlocal
exit /b 0
