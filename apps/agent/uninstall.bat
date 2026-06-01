@echo off
setlocal EnableDelayedExpansion
cls

echo ============================================================
echo   Log Viewer Agent Uninstaller
echo ============================================================
echo.

REM ── Check Admin Privileges ──────────────────────────────────
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] This script must be run as Administrator.
    echo Right-click uninstall.bat and select "Run as administrator".
    pause
    exit /b 1
)

set AGENT_DIR=%~dp0
set NSSM=%AGENT_DIR%tools\nssm.exe
set SERVICE_NAME=LogViewerAgent

REM ── Confirmation ──────────────────────────────────────────────
set /p "CONFIRM=Are you sure you want to uninstall the services? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo Uninstallation cancelled.
    pause
    exit /b 0
)

REM ── Remove Agent Service ────────────────────────────────────
echo.
echo Stopping Agent service...
sc stop "%SERVICE_NAME%" >nul 2>&1
timeout /t 2 /nobreak >nul

echo Deleting Agent service...
sc delete "%SERVICE_NAME%" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Service %SERVICE_NAME% removed successfully.
) else (
    echo [ERROR] Failed to delete %SERVICE_NAME% (it may not exist or require elevated permissions).
)

REM ── Remove Ngrok Service ────────────────────────────────────
set NGROK_SERVICE_NAME=LogViewerAgent_Ngrok
echo.
echo Stopping Ngrok service...
sc stop "%NGROK_SERVICE_NAME%" >nul 2>&1
timeout /t 2 /nobreak >nul

echo Deleting Ngrok service...
sc delete "%NGROK_SERVICE_NAME%" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Service %NGROK_SERVICE_NAME% removed successfully.
) else (
    echo [ERROR] Failed to delete %NGROK_SERVICE_NAME% (it may not exist).
)

REM ── Firewall rule cleanup (optional) ─────────────────────────
echo Cleaning up Firewall rules...
powershell -Command "Remove-NetFirewallRule -DisplayName 'Log Viewer Agent Port *' -ErrorAction SilentlyContinue | Out-Null"

echo.
echo ============================================================
echo   Uninstallation Complete!
echo ============================================================
echo.
pause
