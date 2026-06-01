@echo off
setlocal EnableDelayedExpansion
cls

echo ============================================================
echo   Log Viewer Agent - Release Packager
echo ============================================================
echo.

set AGENT_DIR=apps\agent
set RELEASE_NAME=log-viewer-agent-release.zip

if exist %RELEASE_NAME% del %RELEASE_NAME%

echo Compressing Agent folder into %RELEASE_NAME%...
echo (Excluding venv, logs, tools, and __pycache__ to keep it clean)

powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $src = '%cd%\%AGENT_DIR%'; $dst = '%cd%\%RELEASE_NAME%'; $tmp = '%cd%\temp_release_agent'; if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }; New-Item -ItemType Directory -Path $tmp | Out-Null; Copy-Item -Path $src\* -Destination $tmp -Recurse -Force; Remove-Item -Path $tmp\venv -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item -Path $tmp\logs -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item -Path $tmp\tools -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item -Path $tmp\__pycache__ -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item -Path $tmp\config.json -Force -ErrorAction SilentlyContinue; [System.IO.Compression.ZipFile]::CreateFromDirectory($tmp, $dst); Remove-Item $tmp -Recurse -Force;"

if exist %RELEASE_NAME% (
    echo.
    echo Successfully created %RELEASE_NAME%!
    echo You can now upload this zip to GitHub Releases.
) else (
    echo [ERROR] Failed to create release zip.
)

pause
