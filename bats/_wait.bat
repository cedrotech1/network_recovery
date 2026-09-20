@echo off
REM Sleep N seconds without "timeout" (timeout fails under redirected / non-interactive shells)
REM Usage: call _wait.bat 3
setlocal EnableExtensions
set "SECS=%~1"
if "%SECS%"=="" set "SECS=1"
set /a PINGS=%SECS%+1
ping -n %PINGS% 127.0.0.1 >nul 2>&1
endlocal
exit /b 0
