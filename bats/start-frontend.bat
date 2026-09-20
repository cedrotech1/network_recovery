@echo off
setlocal EnableExtensions
call "%~dp0_env.bat"

echo [frontend] Preparing UI on port %ANFARS_UI_PORT% ...
REM Free stuck/previous UI only — never touch simulate
call "%~dp0_kill-port.bat" %ANFARS_UI_PORT%
call "%~dp0_wait.bat" 1

start "ANFARS-Frontend" cmd /k "cd /d "%FRONTEND%" && title ANFARS Frontend && npm run dev"
echo [frontend] Window opened.
if /I not "%~1"=="/silent" pause
endlocal
exit /b 0
