@echo off
setlocal EnableExtensions
call "%~dp0_env.bat"

echo ============================================
echo   ANFARS - Restart APP only
echo   Keeps / restores simulate
echo ============================================
echo.

call "%~dp0kill-app.bat" /silent
call "%~dp0_wait.bat" 2

REM Make sure simulate is up before API monitors it
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { Invoke-WebRequest -Uri 'http://127.0.0.1:%ANFARS_SIM_CONTROL%/health' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
  echo Simulate was down — starting it ...
  call "%~dp0start-simulate.bat" /silent
)

call "%~dp0start-backend.bat" /silent
call "%~dp0_wait.bat" 5
call "%~dp0start-frontend.bat" /silent
call "%~dp0_wait.bat" 3
start "" "http://127.0.0.1:%ANFARS_UI_PORT%/login"

echo.
echo App restarted. Login: http://127.0.0.1:%ANFARS_UI_PORT%/login
if /I not "%~1"=="/silent" pause
endlocal
exit /b 0
