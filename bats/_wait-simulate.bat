@echo off
REM Wait until simulate control API answers /health (max ~45s)
REM Usage: call _wait-simulate.bat
setlocal EnableExtensions
call "%~dp0_env.bat"

echo [wait] Simulate control http://127.0.0.1:%ANFARS_SIM_CONTROL%/health ...
set "READY=0"
for /L %%I in (1,1,30) do (
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:%ANFARS_SIM_CONTROL%/health' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
  if not errorlevel 1 (
    set "READY=1"
    echo [wait] Simulate is ready.
    goto :done
  )
  call "%~dp0_wait.bat" 1
)
echo [wait] WARNING: Simulate not ready yet — backend will keep trying to heal UI services.

:done
endlocal
exit /b 0
