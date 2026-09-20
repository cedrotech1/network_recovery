@echo off
setlocal EnableExtensions
call "%~dp0_env.bat"

echo ============================================
echo   ANFARS health check
echo ============================================
echo.

echo [API] http://127.0.0.1:%ANFARS_API_PORT%/api/v1/health
curl -s "http://127.0.0.1:%ANFARS_API_PORT%/api/v1/health" || echo FAILED
echo.
echo.

echo [UI] http://127.0.0.1:%ANFARS_UI_PORT%/
curl -s -o NUL -w "HTTP %%{http_code}\n" "http://127.0.0.1:%ANFARS_UI_PORT%/" || echo FAILED
echo.

echo [Simulate control] http://127.0.0.1:%ANFARS_SIM_CONTROL%/health
curl -s "http://127.0.0.1:%ANFARS_SIM_CONTROL%/health" || echo FAILED
echo.
echo.

echo [Nodes]
for %%P in (%ANFARS_NODE_WEB% %ANFARS_NODE_WEB_STBY% %ANFARS_NODE_APP% %ANFARS_NODE_APP_STBY% %ANFARS_NODE_API% %ANFARS_NODE_PORTAL%) do (
  echo --- port %%P ---
  curl -s "http://127.0.0.1:%%P/health" || echo FAILED
  echo.
)

echo.
pause
endlocal
