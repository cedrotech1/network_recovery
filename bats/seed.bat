@echo off
setlocal EnableExtensions
call "%~dp0_env.bat"

echo Seeding base users + nodes...
cd /d "%BACKEND%"
call npm run seed
echo.
echo Done.
pause
endlocal
