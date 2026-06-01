# Agent Installation Guide

This guide covers how to install the **PDS Log Agent** on a Windows machine. The agent will be installed as a permanent background Windows Service (`PDSLogAgent`) that automatically starts on system boot. **You do not need to manually run `uvicorn` or leave any terminal windows open.**

## Prerequisites
1. **Python 3.11+**: Ensure Python is installed and added to the system `PATH`.
2. **Administrator Access**: You must have Admin rights to install a Windows Service.

## Installation Steps

1. Copy the `apps/agent` folder to the target UAT/Production machine (e.g., to `C:\Program Files\PDS_Agent`).
2. Navigate to that folder in File Explorer.
3. Right-click on **`install.bat`** and select **"Run as Administrator"**.

### What the script does automatically:
* It creates necessary `tools` and `logs` directories.
* It automatically downloads the `nssm.exe` (Non-Sucking Service Manager) utility if it's missing.
* It installs all required Python dependencies from `requirements.txt`.
* It opens the Windows Firewall for the agent port (default 8000).
* It registers and starts the background Windows Service.

### Interactive Configuration
During the installation, the script will prompt you for a few details to generate the `config.json` file.
When prompted for the **Agent Secret**, ensure you provide a secure string (or paste the UUID generated in the Cloudflare/Dashboard setup).

> [!TIP]
> **Cloudflare Integration**
> Once the `PDSLogAgent` service is running, follow the **Cloudflare Tunnel Setup Guide** to link this agent to a public URL. The agent runs silently on `localhost:8000` (by default), and Cloudflare handles bridging it to the internet.

## Verifying the Installation

To verify that the service is running correctly:
1. Open a web browser on the local machine.
2. Go to `http://localhost:8000/health` (change 8000 if you used a custom port).
3. You should see a JSON response confirming the agent is online and showing its configuration.

## Troubleshooting & Maintenance
* **Logs**: If the agent fails to start, check the `logs/agent_stdout.log` and `logs/agent_stderr.log` files in the agent folder.
* **Uninstalling**: If you need to remove the agent, simply right-click **`uninstall.bat`** and run as Administrator. This will stop and delete the Windows Service.
