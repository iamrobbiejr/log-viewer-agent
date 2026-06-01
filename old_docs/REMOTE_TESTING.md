# PDS Log Monitor — Remote UAT Testing Guide

If you need to perform User Acceptance Testing (UAT) where the **Dev PC** (hosting the Laravel backend and React dashboard) and the **UAT Machine** (hosting the Log Agent) are on entirely different networks (e.g., working from home while the machine is at the office), you must bridge the connection over the internet.

This document outlines the two supported methods for Remote UAT:
1. **The Ngrok & Vercel Method** (Exposing local servers to the public internet)
2. **The Tailscale Method** (Creating a secure virtual private network) — *Highly Recommended*

---

## METHOD 1: The Ngrok & Vercel Approach

This approach is best if you want to test the React frontend on a real domain (Vercel) while keeping Laravel on your Dev PC and the Agent on the UAT Machine.

### 1. UAT Machine Setup (Office)
Because the UAT Machine is behind a corporate router, the Laravel backend at your house cannot reach it directly. You must expose the Agent using Ngrok.

1. Install [Ngrok](https://ngrok.com/download) on the UAT Machine.
2. Ensure the Log Agent is running locally on port 8000.
3. Open PowerShell and start Ngrok:
   ```powershell
   ngrok http 8000
   ```
4. Ngrok will output a public Forwarding URL (e.g., `https://agent-123.ngrok-free.app`). **Save this URL.**
   * *Security Warning: Your log agent is now exposed to the public internet. However, because it requires the `X-Agent-Secret` header, unauthorized users cannot access your logs.*

### 2. Dev PC Setup (Home)
Your Dev PC runs the Laravel backend. You must configure Laravel to talk to the UAT Ngrok URL. Furthermore, you must expose Laravel itself so Vercel can talk to it.

1. **Configure Laravel to reach the UAT Agent:**
   Open `apps/backend/.env` and update the machine configuration:
   ```env
   UAT_MACHINE_IP=agent-123.ngrok-free.app
   AGENT_SECRET_UAT=your_secret_key
   ```
   *(Ensure `config/machines.php` is configured to use port 443 for HTTPS if you are passing the ngrok domain instead of an IP, or omit the port and append `https://` in your backend HTTP client.)*

2. **Expose Laravel via Ngrok:**
   Open a new PowerShell window and expose your Laragon local server:
   ```powershell
   ngrok http 80
   ```
   *(Assuming Laragon Nginx is on port 80). Save this second Ngrok URL (e.g., `https://laravel-456.ngrok-free.app`).*

3. **Update Laravel App URL:**
   In `apps/backend/.env`, update:
   ```env
   APP_URL=https://laravel-456.ngrok-free.app
   ```

### 3. Vercel Dashboard Setup
Now configure the React dashboard hosted on Vercel to point to your Dev PC's Ngrok URL.

1. In Vercel Project Settings > Environment Variables, add:
   * `VITE_API_BASE_URL` = `https://laravel-456.ngrok-free.app/api/v1`
2. **CRITICAL FIX FOR FREE NGROK:** Free Ngrok accounts intercept the first request to show an HTML warning page, which breaks JSON API calls. You must bypass this in the dashboard code.
   Edit `apps/dashboard/src/api/logApi.js` and add this header:
   ```javascript
   const headers = { 
     'Accept': 'application/json',
     'ngrok-skip-browser-warning': 'true' // Bypasses the HTML warning screen
   };
   ```
3. Trigger a new deployment on Vercel so the environment variables and code changes take effect.

---

## METHOD 2: The Tailscale Approach (Recommended)

This is the cleanest, most secure, and most developer-friendly approach. Tailscale creates a zero-configuration mesh VPN. It gives both computers a static private IP address, making them act as if they are plugged into the same network switch, regardless of where they are in the world.

No Vercel deployment or Ngrok tunnels are required.

### 1. Pre-requisites (Do this before leaving the office)
1. Download and install [Tailscale](https://tailscale.com/download) on the **UAT Machine**.
2. Log in using your Google, Microsoft, or GitHub account.
3. Open the Tailscale app from the Windows System Tray and note the `100.x.x.x` IP address assigned to this machine.
4. Ensure the PDS Log Agent is running on the machine (`uvicorn main:app --host 0.0.0.0 --port 8000`).

### 2. Dev PC Setup (At Home)
1. Install Tailscale on your **Dev PC** at home.
2. Log in using the **exact same account** you used at the office.
3. Your Dev PC and the UAT Machine are now on the same virtual LAN.

### 3. Verification & Configuration
1. **Test the Connection:**
   Open PowerShell on your Dev PC and ping the UAT Machine's Tailscale IP to verify the logs are reachable:
   ```powershell
   Invoke-RestMethod http://100.xxx.xxx.xxx:8000/health
   ```
   *If you see a JSON response, the VPN tunnel is working perfectly.*

2. **Update Laravel Configuration:**
   Open your Dev PC's `apps/backend/.env` and update the machine IP:
   ```env
   UAT_MACHINE_IP=100.xxx.xxx.xxx
   ```
3. Clear Laravel's config cache:
   ```powershell
   php artisan config:clear
   ```

### 4. Running the Dashboard
Because you are back on a "Local Area Network" (thanks to Tailscale), you do not need Vercel or Ngrok. 
Simply run the dashboard locally on your Dev PC as normal:
```powershell
npm run dev
```
The React frontend will call your local Laravel API, and Laravel will silently securely tunnel through Tailscale to the UAT machine at the office.
