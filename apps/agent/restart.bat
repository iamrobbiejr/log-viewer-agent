@echo off
setlocal EnableDelayedExpansion
cls

echo ============================================================
echo   Log Viewer Agent - Service Restarter
echo ============================================================
echo.

REM ── Check Admin Privileges ──────────────────────────────────
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] This script must be run as Administrator.
    echo Right-click restart.bat and select "Run as administrator".
    pause
    exit /b 1
)

set SERVICE_NAME=LogViewerAgent
set NGROK_SERVICE_NAME=LogViewerAgent_Ngrok

echo Restarting Agent Services...
echo.

REM ── Stop Services ───────────────────────────────────────────
echo Stopping %SERVICE_NAME%...
net stop "%SERVICE_NAME%" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Service %SERVICE_NAME% stopped successfully.
) else (
    echo Service %SERVICE_NAME% was already stopped or doesn't exist.
)

sc query "%NGROK_SERVICE_NAME%" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Stopping %NGROK_SERVICE_NAME%...
    net stop "%NGROK_SERVICE_NAME%" 2>nul
)

echo.
REM ── Start Services ──────────────────────────────────────────
sc query "%NGROK_SERVICE_NAME%" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Starting %NGROK_SERVICE_NAME%...
    net start "%NGROK_SERVICE_NAME%" 2>nul
)

echo Starting %SERVICE_NAME%...
net start "%SERVICE_NAME%" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Service %SERVICE_NAME% started successfully.
) else (
    echo [ERROR] Failed to start service %SERVICE_NAME%.
)

echo.
echo ============================================================
echo   Restart Complete!
echo ============================================================
echo.
pause
