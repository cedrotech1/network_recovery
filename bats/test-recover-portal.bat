@echo off
setlocal EnableExtensions
call "%~dp0_env.bat"

echo Recover Student Portal manually...
curl -s -X POST "http://127.0.0.1:%ANFARS_NODE_PORTAL%/admin/recover" -H "Content-Type: application/json" -d "{}"
echo.
echo.
curl -s "http://127.0.0.1:%ANFARS_NODE_PORTAL%/health"
echo.
pause
endlocal
