@echo off
setlocal EnableExtensions
call "%~dp0_env.bat"

echo Seeding screenshot / demo history data...
cd /d "%BACKEND%"
call npm run seed
call npm run seed:demo
echo.
echo Demo data ready. Open Charts, Logs, Problems, Fixes, Users.
pause
endlocal
