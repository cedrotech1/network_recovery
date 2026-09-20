@echo off
setlocal EnableExtensions
call "%~dp0_env.bat"
start "" "http://127.0.0.1:%ANFARS_UI_PORT%/login"
endlocal
