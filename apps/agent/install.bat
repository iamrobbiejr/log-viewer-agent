@echo off
setlocal EnableDelayedExpansion
cls

echo ============================================================
echo   Log Viewer Agent Installer
echo ============================================================
echo.

REM ── Check Admin Privileges ──────────────────────────────────
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] This script must be run as Administrator.
    echo Right-click install.bat and select "Run as administrator".
    pause
    exit /b 1
)

set AGENT_DIR=%~dp0
set NSSM=%AGENT_DIR%tools\nssm.exe
set SERVICE_NAME=LogViewerAgent
set SYSTEM_PYTHON=python

REM ── Check Python ────────────────────────────────────────────
%SYSTEM_PYTHON% --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python not found in PATH. Please install Python 3.11+ first.
    pause
    exit /b 1
)

REM ── Create Virtual Environment ──────────────────────────────
if not exist "%AGENT_DIR%venv" (
    echo [INFO] Creating Python virtual environment...
    %SYSTEM_PYTHON% -m venv "%AGENT_DIR%venv"
)
set PYTHON="%AGENT_DIR%venv\Scripts\python.exe"

REM ── Check NSSM ──────────────────────────────────────────────
if not exist "%AGENT_DIR%tools" mkdir "%AGENT_DIR%tools"
if not exist "%AGENT_DIR%logs" mkdir "%AGENT_DIR%logs"

if not exist "%NSSM%" (
    echo [INFO] Downloading NSSM...
    powershell -Command "Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile '%AGENT_DIR%tools\nssm.zip'; Expand-Archive -Path '%AGENT_DIR%tools\nssm.zip' -DestinationPath '%AGENT_DIR%tools' -Force; Copy-Item '%AGENT_DIR%tools\nssm-2.24\win64\nssm.exe' -Destination '%NSSM%'; Remove-Item '%AGENT_DIR%tools\nssm.zip'; Remove-Item '%AGENT_DIR%tools\nssm-2.24' -Recurse"
    if not exist "%NSSM%" (
        echo [ERROR] Failed to download NSSM automatically.
        echo Download from https://nssm.cc/download and place in tools\nssm.exe
        pause
        exit /b 1
    )
    echo       NSSM Downloaded.
)

REM ── Check Ngrok ─────────────────────────────────────────────
set NGROK=%AGENT_DIR%tools\ngrok.exe
if not exist "%NGROK%" (
    echo [INFO] Downloading Ngrok...
    powershell -Command "Invoke-WebRequest -Uri 'https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip' -OutFile '%AGENT_DIR%tools\ngrok.zip'; Expand-Archive -Path '%AGENT_DIR%tools\ngrok.zip' -DestinationPath '%AGENT_DIR%tools' -Force; Remove-Item '%AGENT_DIR%tools\ngrok.zip'"
    if not exist "%NGROK%" (
        echo [ERROR] Failed to download Ngrok automatically.
        pause
        exit /b 1
    )
    echo       Ngrok Downloaded.
)

REM ── Install Python Dependencies ─────────────────────────────
echo [1/4] Installing Python dependencies...
%PYTHON% -m pip install -r "%AGENT_DIR%requirements.txt" --quiet
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)
echo       Done.

REM ── Run Interactive Configuration ───────────────────────────
echo.
echo [2/4] Launching interactive configuration...
echo       (Answer the questions to set up this terminal)
echo.
%PYTHON% "%AGENT_DIR%installer.py"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Configuration cancelled or failed.
    pause
    exit /b 1
)

REM ── Remove Existing Service (if reinstalling) ────────────────
echo [3/4] Registering Windows Services...
sc query "%SERVICE_NAME%" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo       Removing existing agent service...
    "%NSSM%" stop   "%SERVICE_NAME%" >nul 2>&1
    "%NSSM%" remove "%SERVICE_NAME%" confirm >nul 2>&1
)

set NGROK_SERVICE_NAME=LogViewerAgent_Ngrok
sc query "%NGROK_SERVICE_NAME%" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo       Removing existing ngrok service...
    "%NSSM%" stop   "%NGROK_SERVICE_NAME%" >nul 2>&1
    "%NSSM%" remove "%NGROK_SERVICE_NAME%" confirm >nul 2>&1
)

REM ── Read variables from config.json ─────────────────────────
pushd "%AGENT_DIR%"
%PYTHON% -c "import json; c=json.load(open('config.json', encoding='utf-8')); f=open('temp_vars.bat', 'w'); f.write('set AGENT_PORT=' + str(c.get('agent_port', 8000)) + '\n'); f.write('set NGROK_AUTHTOKEN=' + c.get('ngrok_authtoken', '') + '\n'); f.close()"
call temp_vars.bat
del temp_vars.bat
popd

REM ── Register Agent with NSSM ────────────────────────────────
set AGENT_DIR_NO_SLASH=%AGENT_DIR:~0,-1%
"%NSSM%" install "%SERVICE_NAME%" %PYTHON%
"%NSSM%" set "%SERVICE_NAME%" AppDirectory    "%AGENT_DIR_NO_SLASH%"
"%NSSM%" set "%SERVICE_NAME%" AppParameters   "-m uvicorn main:app --host 0.0.0.0 --port !AGENT_PORT!"
"%NSSM%" set "%SERVICE_NAME%" DisplayName     "Log Viewer Agent"
"%NSSM%" set "%SERVICE_NAME%" Description     "Log Viewer Monitoring Agent — exposes local logs via HTTP"
"%NSSM%" set "%SERVICE_NAME%" Start           SERVICE_AUTO_START
"%NSSM%" set "%SERVICE_NAME%" AppStdout       "%AGENT_DIR_NO_SLASH%\logs\agent_stdout.log"
"%NSSM%" set "%SERVICE_NAME%" AppStderr       "%AGENT_DIR_NO_SLASH%\logs\agent_stderr.log"
"%NSSM%" set "%SERVICE_NAME%" AppRotateFiles  1
"%NSSM%" set "%SERVICE_NAME%" AppRotateBytes  5242880

REM ── Register Ngrok with NSSM ────────────────────────────────
if not "!NGROK_AUTHTOKEN!"=="" (
    "%NSSM%" install "%NGROK_SERVICE_NAME%" "%NGROK%"
    "%NSSM%" set "%NGROK_SERVICE_NAME%" AppDirectory    "%AGENT_DIR_NO_SLASH%\tools"
    "%NSSM%" set "%NGROK_SERVICE_NAME%" AppParameters   "http !AGENT_PORT! --authtoken=!NGROK_AUTHTOKEN!"
    "%NSSM%" set "%NGROK_SERVICE_NAME%" DisplayName     "Log Viewer Agent Ngrok"
    "%NSSM%" set "%NGROK_SERVICE_NAME%" Description     "Log Viewer Monitoring Agent — Ngrok Tunnel"
    "%NSSM%" set "%NGROK_SERVICE_NAME%" Start           SERVICE_AUTO_START
    "%NSSM%" set "%NGROK_SERVICE_NAME%" AppStdout       "%AGENT_DIR_NO_SLASH%\logs\ngrok_stdout.log"
    "%NSSM%" set "%NGROK_SERVICE_NAME%" AppStderr       "%AGENT_DIR_NO_SLASH%\logs\ngrok_stderr.log"
    "%NSSM%" set "%NGROK_SERVICE_NAME%" AppRotateFiles  1
    "%NSSM%" set "%NGROK_SERVICE_NAME%" AppRotateBytes  5242880
)

REM ── Configure Firewall ──────────────────────────────────────
echo [4/4] Configuring Windows Firewall...
powershell -Command "New-NetFirewallRule -DisplayName 'Log Viewer Agent Port !AGENT_PORT!' -Direction Inbound -Protocol TCP -LocalPort !AGENT_PORT! -Action Allow -Profile Private -ErrorAction SilentlyContinue | Out-Null"

REM ── Start Services ──────────────────────────────────────────
"%NSSM%" start "%SERVICE_NAME%"
if not "!NGROK_AUTHTOKEN!"=="" (
    "%NSSM%" start "%NGROK_SERVICE_NAME%"
)

echo.
echo ============================================================
echo   Installation Complete!
echo   Agent running on port !AGENT_PORT!
echo   Health check: http://localhost:!AGENT_PORT!/health
if not "!NGROK_AUTHTOKEN!"=="" (
    echo   Ngrok Tunnel is running in the background.
)
echo ============================================================
echo.
pause
