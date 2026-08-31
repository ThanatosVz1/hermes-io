@echo off
title Hermes.io — AI Learning Roadmap Generator
echo ========================================================
echo   Starting Hermes.io Server...
echo ========================================================

REM Check if agy-node or node is present
where agy-node.cmd >nul 2>nul
if %ERRORLEVEL% equ 0 (
    agy-node.cmd server.js
    goto end
)

where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    node server.js
    goto end
)

if exist "C:\Users\Viveksingh\AppData\Roaming\Antigravity\bin\agy-node.cmd" (
    "C:\Users\Viveksingh\AppData\Roaming\Antigravity\bin\agy-node.cmd" server.js
    goto end
)

echo ERROR: Neither Node.js nor agy-node was found.
pause

:end
