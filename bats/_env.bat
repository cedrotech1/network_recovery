@echo off
REM Shared ports / paths for ANFARS Windows helpers
set "ANFARS_API_PORT=9500"
set "ANFARS_UI_PORT=5473"
set "ANFARS_SIM_CONTROL=9399"
set "ANFARS_NODE_WEB=9401"
set "ANFARS_NODE_WEB_STBY=9402"
set "ANFARS_NODE_APP=9403"
set "ANFARS_NODE_APP_STBY=9404"
set "ANFARS_NODE_API=9405"
set "ANFARS_NODE_PORTAL=9406"

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"
set "BACKEND=%ROOT%\backend"
set "FRONTEND=%ROOT%\frontend"
set "NODES=%ROOT%\simulated-nodes"
set "BATS=%~dp0"
