---
sidebar_position: 1
---

# Setting up Cloudflare Tunnels for Production Agents

Cloudflare Tunnels securely expose the Log Viewer Agent running on a local machine (e.g., port 8000) to the internet without opening any router ports or configuring firewall rules. It provides a static, permanent HTTPS URL for each machine.

> [!IMPORTANT]
> You must have a Cloudflare account with a domain added to it (e.g., `yourcompany.com`) to use Zero Trust Tunnels.

## Step 1: Create the Tunnel via Cloudflare Zero Trust

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Zero Trust**.
2. On the left menu, go to **Networks** -> **Tunnels**.
3. Click **Add a tunnel**.
4. Select **Cloudflared** (the default connector) and click Next.
5. **Name your tunnel**: Give it a clear name that identifies the physical machine (e.g., `Branch-A-Till-1`).
6. Click **Save tunnel**.

## Step 2: Install Cloudflared on the Production Machine

After saving the tunnel, Cloudflare will show you the installation commands for various operating systems. Since the agents run on Windows:

1. Under the **Choose your environment** section, select **Windows**.
2. Copy the command provided in the "Run the following command" box. It usually looks like this:
   ```cmd
   cloudflared.exe service install eyJhIjoi...[LONG_TOKEN]...
   ```
3. On the production machine where the Log Viewer Agent is installed:
   * Download `cloudflared.exe` from the link provided in the Cloudflare dashboard.
   * Open **Command Prompt as Administrator**.
   * Run the command you copied. 

This installs `cloudflared` as a background Windows Service that will start automatically on boot.

## Step 3: Route the Traffic to the Agent

Back in the Cloudflare Zero Trust dashboard, click **Next** to configure routing.

1. **Public Hostname Tab**:
   * **Subdomain**: Enter a unique identifier for this machine (e.g., `branch-a-till-1`).
   * **Domain**: Select your primary domain from the dropdown (e.g., `yourcompany.com`).
2. **Service**:
   * **Type**: Select `HTTP`.
   * **URL**: Enter `localhost:8000` (or whatever port your agent is running on).
3. Click **Save hostname**.

## Step 4: Add the Machine to the Dashboard

Your machine is now live on the internet! 

1. Open your Log Viewer Dashboard.
2. Go to the **Machine Management** page.
3. Click **Add Machine**.
4. Enter the details:
   * **Name**: Branch A - Till 1
   * **Category**: Production
   * **URL**: `https://branch-a-till-1.yourcompany.com` (The URL you created in Step 3)
   * **Secret**: Generate a random secure string (or let the dashboard generate one).
5. Open the `config.json` on the production machine and update `agent_secret` to match the secret you just generated. Restart the Log Agent service.

**Done!** Your backend can now securely query this specific machine forever, regardless of its local IP address.

> [Screenshot/s needed] - Add screenshots of the Cloudflare Dashboard setup.
