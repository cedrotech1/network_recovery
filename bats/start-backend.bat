@echo off
setlocal EnableExtensions
call "%~dp0_env.bat"

echo [backend] Preparing API on port %ANFARS_API_PORT% ...
REM Free stuck/previous API only — never touch simulate
call "%~dp0_kill-port.bat" %ANFARS_API_PORT%
call "%~dp0_wait.bat" 1

start "ANFARS-Backend" cmd /k "cd /d "%BACKEND%" && title ANFARS Backend API && npm run start:dev"
echo [backend] Window opened.
if /I not "%~1"=="/silent" pause
endlocal
exit /b 0
