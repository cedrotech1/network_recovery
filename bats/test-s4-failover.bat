@echo off
setlocal EnableExtensions
call "%~dp0_env.bat"

echo ============================================
echo   TEST S4 - Failover style inject on Campus App
echo ============================================
echo.

echo Before primary:
curl -s "http://127.0.0.1:%ANFARS_NODE_APP%/health"
echo.
echo.

curl -s -X POST "http://127.0.0.1:%ANFARS_NODE_APP%/admin/inject" -H "Content-Type: application/json" -d "{\"mode\":\"down\"}"
echo.
echo Injected down on Campus App primary. Watch UI for failover.
timeout /t 20 /nobreak

echo.
echo Primary after wait:
curl -s "http://127.0.0.1:%ANFARS_NODE_APP%/health"
echo.
echo Standby:
curl -s "http://127.0.0.1:%ANFARS_NODE_APP_STBY%/health"
echo.
pause
endlocal
