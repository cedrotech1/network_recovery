@echo off
setlocal EnableExtensions
call "%~dp0_env.bat"

echo ============================================
echo   TEST S2 - Inject HTTP 500 on Student Portal
echo   Watch UI Activity logs / Home for AUTO FIXED
echo ============================================
echo.

echo Before:
curl -s "http://127.0.0.1:%ANFARS_NODE_PORTAL%/health"
echo.
echo.

echo Injecting...
curl -s -X POST "http://127.0.0.1:%ANFARS_NODE_PORTAL%/admin/inject" -H "Content-Type: application/json" -d "{\"mode\":\"http500\"}"
echo.
echo.

echo Portal should now be unhealthy. Wait ~15-20s for auto-recovery...
timeout /t 18 /nobreak

echo.
echo After ~18s:
curl -s "http://127.0.0.1:%ANFARS_NODE_PORTAL%/health"
echo.
echo.
echo If still failed, wait a few more seconds or check backend console.
pause
endlocal
