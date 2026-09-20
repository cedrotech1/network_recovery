@echo off
REM One-shot lab setup for a PC where PostgreSQL is installed but the app DB is missing.
REM Creates database (if needed) → syncs tables → seeds Admin/ICT/Viewer + default services.
REM Optional: setup-db.bat /demo   also loads screenshot/demo history.
setlocal EnableExtensions
call "%~dp0_env.bat"

echo ============================================
echo   AFDRS - Database setup (create + seed)
echo   Project: Automatic Failure Detection
echo           and Recovery System
echo ============================================
echo.

if not exist "%BACKEND%\.env" (
  if exist "%BACKEND%\.env.example" (
    echo [1] backend\.env missing — copying from .env.example
    copy /Y "%BACKEND%\.env.example" "%BACKEND%\.env" >nul
    echo     EDIT backend\.env and set DEV_DATABASE_PASSWORD to your postgres password,
    echo     then run this bat again.
    if /I not "%~1"=="/silent" pause
    endlocal
    exit /b 1
  ) else (
    echo ERROR: No backend\.env and no .env.example
    if /I not "%~1"=="/silent" pause
    endlocal
    exit /b 1
  )
)

cd /d "%BACKEND%"
if errorlevel 1 (
  echo ERROR: Cannot cd to backend
  if /I not "%~1"=="/silent" pause
  endlocal
  exit /b 1
)

echo [1] Ensure npm packages ...
if not exist "node_modules\" (
  call npm install
  if errorlevel 1 (
    echo ERROR: npm install failed
    if /I not "%~1"=="/silent" pause
    endlocal
    exit /b 1
  )
) else (
  echo     node_modules OK
)

echo.
echo [2] Create PostgreSQL database if missing ...
call npm run db:ensure
if errorlevel 1 (
  echo.
  echo ERROR: Could not create/connect to PostgreSQL.
  echo   1^) Start PostgreSQL service
  echo   2^) Check DEV_DATABASE_* in backend\.env
  echo      ^(user/password/host/port/name^)
  if /I not "%~1"=="/silent" pause
  endlocal
  exit /b 1
)

echo.
echo [3] Migrate / sync tables + seed users ^& services ...
REM This project uses Sequelize sync ^(no migrations folder^).
REM npm run seed creates/updates tables and seeds Admin + default nodes.
call npm run seed
if errorlevel 1 (
  echo ERROR: Seed / table sync failed
  if /I not "%~1"=="/silent" pause
  endlocal
  exit /b 1
)

if /I "%~1"=="/demo" (
  echo.
  echo [4] Demo history for screenshots ...
  call npm run seed:demo
  if errorlevel 1 (
    echo WARNING: seed:demo failed — base users/nodes are still OK
  )
)

echo.
echo ============================================
echo   Setup complete
echo ============================================
echo   Admin:  admin@uok.ac.rw / Admin@123
echo   ICT:    ict@uok.ac.rw / Ict@12345
echo   Viewer: viewer@uok.ac.rw / View@12345
echo.
echo   Next:  start-all.bat
echo   Login: http://127.0.0.1:%ANFARS_UI_PORT%/login
echo ============================================
if /I not "%~1"=="/silent" if /I not "%~1"=="/demo" pause
if /I "%~1"=="/demo" if /I not "%~2"=="/silent" pause
endlocal
exit /b 0
