# PDS Log Monitor — UAT Staging Deployment Guide

─────────────────────────────────────────────────────────────────────
## SECTION 1 — CODEBASE READINESS ASSESSMENT
─────────────────────────────────────────────────────────────────────

### 1.1 Environment Configuration Gaps
* **[BLOCKING]** The dashboard application does not have an `.env.example` or `.env` file.
* **[IMPORTANT]** Backend `.env.example` does not list the required `AGENT_SECRET_*` variables for the machines.
* **[IMPORTANT]** Backend `config/machines.php` uses a hardcoded default secret (`'secret'`) if not present in the environment variables.
* **[MINOR]** Backend `config/machines.php` hardcodes IP addresses rather than relying entirely on the `.env` file.

### 1.2 Build Readiness (Dashboard)
* **[BLOCKING]** `apps/dashboard/src/api/logApi.js` uses `import.meta.env.VITE_API_BASE_URL` with a fallback to `http://backend.test/api/v1`. If this variable is not explicitly provided during `npm run build`, the compiled assets will bake in the `.test` domain, causing API requests to fail when accessed from another machine on the LAN.
* **[MINOR]** Vite config (`vite.config.js`) does not currently configure the build output directory specifically for Laragon, requiring manual copying of the `dist/` directory.

### 1.3 Agent Readiness
* **[BLOCKING]** The agent does not bind to `0.0.0.0` automatically. While `install.bat` registers the service with `--host 0.0.0.0`, running it manually for UAT requires passing the flag explicitly (`uvicorn main:app --host 0.0.0.0 --port 8000 --reload`), otherwise it defaults to localhost only.
* **[MINOR]** Agent CORS origin is set to `["*"]` in `main.py`, which is perfectly acceptable for an internal LAN deployment.
* **[MINOR]** `config.json` relies entirely on running `installer.py` (which correctly guides users). 

### 1.4 Backend Readiness
* **[IMPORTANT]** `config/machines.php` contains dummy machines (`freight-north-c1`, `freight-north-c2`) that must be updated to reflect the actual UAT machine identity.
* **[MINOR]** `LogAgentService.php` properly handles connection timeouts for offline agents and returns a graceful `null`, returning the agent as `offline` in `pingAllMachines()`.
* **[MINOR]** Laravel 11's default CORS middleware is configured in `bootstrap/app.php` and defaults to allowing all origins, which is appropriate for LAN usage.

### 1.5 Network Readiness Checklist
* **Dev PC:** Port 80 (TCP) inbound must be open in Windows Firewall so the UAT machine or other LAN devices can reach the Nginx server.
* **UAT Machine:** Port 8000 (TCP) inbound must be open in Windows Firewall so the Dev PC can poll the agent.
* **Router:** No configuration needed as long as client isolation is disabled on the local network.

─────────────────────────────────────────────────────────────────────
## SECTION 2 — PRE-STAGING FIXES
─────────────────────────────────────────────────────────────────────

**1. Create Dashboard Environment Template**
* **File:** `apps/dashboard/.env.example`
* **Change:** Create the new file with the following content:
```env
# The URL of the Laravel Backend API (must be the Dev PC's LAN IP)
VITE_API_BASE_URL=http://192.168.1.X/api/v1
```
* **Reason:** Ensures developers provide the correct LAN IP during `npm run build` instead of falling back to a local-only domain.

**2. Update Backend Machines Config**
* **File:** `apps/backend/config/machines.php`
* **Change:**
```php
<?php

return [
    'list' => [
        [
            'id'                => 'uat-machine-1',
            'ip'                => env('UAT_MACHINE_IP', '192.168.1.100'),
            'port'              => 8000,
            'secret'            => env('AGENT_SECRET_UAT', ''),
        ],
    ],
    'timeout_seconds' => 5,
];
```
* **Reason:** Removes hardcoded fallback secrets and dummy machine IP data, enforcing reliance on the `.env` file for secure UAT testing.

─────────────────────────────────────────────────────────────────────
## SECTION 3 — STAGING DEPLOYMENT DOCUMENT
─────────────────────────────────────────────────────────────────────

### TRACK A — Dev PC Setup (Central Server)

┌─────────────────────────────────────────────────┐
│ STEP A1 — Verify Laragon is running and healthy │
│ Machine: Dev PC                                 │
│ Who runs this: Developer                        │
├─────────────────────────────────────────────────┤
│ What to do:                                     │
│   1. Open Laragon and start all services.       │
│   2. Confirm Nginx, MySQL, and Redis are running.│
│   3. Confirm PHP version is 8.3+.               │
│                                                 │
│ Expected result:                                │
│   All services indicate "Started" in Laragon.   │
│                                                 │
│ If it fails:                                    │
│   Ensure no other services (like IIS or Skype)  │
│   are using port 80 or 3306.                    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ STEP A2 — Pull latest code from git             │
│ Machine: Dev PC                                 │
│ Who runs this: Developer                        │
├─────────────────────────────────────────────────┤
│ What to do:                                     │
│   Run `git pull origin main` in the monorepo root.│
│                                                 │
│ Expected result:                                │
│   Code is up-to-date and `apps/agent`,          │
│   `apps/backend`, `apps/dashboard` exist.       │
│                                                 │
│ If it fails:                                    │
│   Stash or commit local changes before pulling. │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ STEP A3 — Build the React dashboard             │
│ Machine: Dev PC                                 │
│ Who runs this: Developer                        │
├─────────────────────────────────────────────────┤
│ What to do:                                     │
│   1. Create `apps/dashboard/.env` containing:   │
│      VITE_API_BASE_URL=http://[DEV_PC_LAN_IP]/api/v1 │
│   2. Open terminal in `apps/dashboard`.         │
│   3. Run `npm install && npm run build`.        │
│   4. Copy the contents of `dist/` to Laragon's  │
│      web root (e.g. `C:\laragon\www\pds-log-monitor\public`).│
│                                                 │
│ Expected result:                                │
│   Static files are built and placed correctly.  │
│                                                 │
│ If it fails:                                    │
│   Check Node version (v18+) and ensure the IP   │
│   in `.env` is correct.                         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ STEP A4 — Configure Laravel backend for staging │
│ Machine: Dev PC                                 │
│ Who runs this: Developer                        │
├─────────────────────────────────────────────────┤
│ What to do:                                     │
│   1. Duplicate `apps/backend/.env.example` as `.env`.│
│   2. Set `APP_URL=http://[DEV_PC_LAN_IP]`.      │
│   3. Update DB credentials for MySQL.           │
│   4. Set `UAT_MACHINE_IP=[UAT_MACHINE_LAN_IP]`. │
│   5. Set `AGENT_SECRET_UAT=[YOUR_SECRET_KEY]`.  │
│   6. Run: `php artisan key:generate`            │
│   7. Run: `php artisan config:clear`            │
│                                                 │
│ Expected result:                                │
│   The `.env` file contains correct LAN IPs and  │
│   the UAT machine's secret key.                 │
│                                                 │
│ If it fails:                                    │
│   Ensure the `.env` has no syntax errors.       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ STEP A5 — Register the UAT machine              │
│ Machine: Dev PC                                 │
│ Who runs this: Developer                        │
├─────────────────────────────────────────────────┤
│ What to do:                                     │
│   Update `apps/backend/config/machines.php` to: │
│   [                                             │
│       'id'     => 'uat-machine-1',              │
│       'ip'     => env('UAT_MACHINE_IP'),        │
│       'port'   => 8000,                         │
│       'secret' => env('AGENT_SECRET_UAT'),      │
│   ]                                             │
│                                                 │
│ Expected result:                                │
│   The UAT machine is officially registered in   │
│   the backend configuration.                    │
│                                                 │
│ If it fails:                                    │
│   Check for missing commas or brackets.         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ STEP A6 — Configure Laragon virtual host        │
│ Machine: Dev PC                                 │
│ Who runs this: Developer                        │
├─────────────────────────────────────────────────┤
│ What to do:                                     │
│   Configure Nginx (`C:\laragon\etc\nginx\sites-enabled\pds-log-monitor.conf`):│
│   server {                                      │
│       listen 80;                                │
│       server_name localhost [DEV_PC_LAN_IP];    │
│       root "C:/laragon/www/pds-log-monitor/public";│
│                                                 │
│       index index.html index.php;               │
│                                                 │
│       location / {                              │
│           try_files $uri $uri/ /index.html;     │
│       }                                         │
│                                                 │
│       location /api {                           │
│           try_files $uri $uri/ /index.php?$query_string; │
│       }                                         │
│       ... (PHP-FPM block)                       │
│   }                                             │
│   Restart Nginx in Laragon.                     │
│                                                 │
│ Expected result:                                │
│   `http://[DEV_PC_LAN_IP]/` shows the Dashboard.│
│   `http://[DEV_PC_LAN_IP]/api/v1/...` works.    │
│                                                 │
│ If it fails:                                    │
│   Check Laragon Nginx error logs.               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ STEP A7 — Run Laravel migrations and verify     │
│ Machine: Dev PC                                 │
│ Who runs this: Developer                        │
├─────────────────────────────────────────────────┤
│ What to do:                                     │
│   1. Open terminal in `apps/backend`.           │
│   2. Run `php artisan migrate`.                 │
│   3. Run `php artisan route:list`.              │
│                                                 │
│ Expected result:                                │
│   Database tables are created and the /api/v1   │
│   routes are listed correctly.                  │
│                                                 │
│ If it fails:                                    │
│   Confirm MySQL is running and DB_DATABASE      │
│   matches the created schema name.              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ STEP A8 — Verify backend can reach UAT machine  │
│ Machine: Dev PC                                 │
│ Who runs this: Developer                        │
├─────────────────────────────────────────────────┤
│ What to do:                                     │
│   Run via PowerShell:                           │
│   `Invoke-RestMethod http://[UAT_MACHINE_IP]:8000/health`│
│                                                 │
│ Expected result:                                │
│   Returns JSON showing status "ok".             │
│                                                 │
│ If it fails:                                    │
│   Ensure Track B is fully completed first!      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ STEP A9 — Configure Windows Firewall on Dev PC  │
│ Machine: Dev PC                                 │
│ Who runs this: Developer                        │
├─────────────────────────────────────────────────┤
│ What to do:                                     │
│   Run via PowerShell as Administrator:          │
│   `New-NetFirewallRule -DisplayName "Laragon Web" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow`│
│                                                 │
│ Expected result:                                │
│   The UAT Machine's browser can load the        │
│   dashboard via `http://[DEV_PC_LAN_IP]/`.      │
│                                                 │
│ If it fails:                                    │
│   Check if the network profile is set to Public │
│   instead of Private.                           │
└─────────────────────────────────────────────────┘


### TRACK B — UAT Machine Setup (Agent)

┌─────────────────────────────────────────────────┐
│ STEP B1 — Verify prerequisites on UAT machine   │
│ Machine: UAT Machine                            │
│ Who runs this: Developer                        │
├─────────────────────────────────────────────────┤
│ What to do:                                     │
│   1. Confirm Python 3.11+ is installed.         │
│   2. Confirm `pip` is available.                │
│   3. Confirm the actual log directory exists.   │
│                                                 │
│ Expected result:                                │
│   `python --version` returns 3.11+.             │
│                                                 │
│ If it fails:                                    │
│   Install Python from python.org, ensuring      │
│   "Add Python to PATH" is checked.              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ STEP B2 — Copy agent files to UAT machine       │
│ Machine: UAT Machine                            │
│ Who runs this: Developer                        │
├─────────────────────────────────────────────────┤
│ What to do:                                     │
│   Copy `apps/agent` from the Dev PC via USB or  │
│   shared folder to `C:\log-agent\`.             │
│                                                 │
│ Expected result:                                │
│   Files exist at `C:\log-agent\main.py`.        │
│                                                 │
│ If it fails:                                    │
│   Ensure antivirus hasn't blocked the scripts.  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ STEP B3 — Create Python virtual environment     │
│ Machine: UAT Machine                            │
│ Who runs this: Developer                        │
├─────────────────────────────────────────────────┤
│ What to do:                                     │
│   1. Open PowerShell at `C:\log-agent\`.        │
│   2. `python -m venv venv`                      │
│   3. `.\venv\Scripts\Activate.ps1`              │
│   4. `pip install -r requirements.txt`          │
│                                                 │
│ Expected result:                                │
│   Dependencies (fastapi, uvicorn) install.      │
│                                                 │
│ If it fails:                                    │
│   If scripts are disabled, run:                 │
│   `Set-ExecutionPolicy Unrestricted -Scope CurrentUser`│
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ STEP B4 — Run the interactive installer         │
│ Machine: UAT Machine                            │
│ Who runs this: Developer                        │
├─────────────────────────────────────────────────┤
│ What to do:                                     │
│   Run `python installer.py`                     │
│   - company_name:      "Revmax Corp"            │
│   - terminal_name:     "UAT Terminal 1"         │
│   - terminal_category: "UAT"                    │
│   - log_directory:     (Enter real log path)    │
│   - log_pattern:       `revmax_{date}.log`      │
│   - date_format:       `%Y-%m-%d`               │
│   - max_days:          `5`                      │
│   - agent_secret:      [MATCH AGENT_SECRET_UAT] │
│   - agent_port:        `8000`                   │
│                                                 │
│ Expected result:                                │
│   `config.json` is successfully written.        │
│                                                 │
│ If it fails:                                    │
│   Ensure the chosen log directory exists.       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ STEP B5 — Verify config.json                    │
│ Machine: UAT Machine                            │
│ Who runs this: Developer                        │
├─────────────────────────────────────────────────┤
│ What to do:                                     │
│   Run `cat config.json` in PowerShell and check │
│   the values match what was entered.            │
│                                                 │
│ Expected result:                                │
│   JSON file is well-formed and correct.         │
│                                                 │
│ If it fails:                                    │
│   Delete `config.json` and run installer again. │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ STEP B6 — Start the agent manually for UAT      │
│ Machine: UAT Machine                            │
│ Who runs this: Developer                        │
├─────────────────────────────────────────────────┤
│ What to do:                                     │
│   Run:                                          │
│   `uvicorn main:app --host 0.0.0.0 --port 8000 --reload`│
│                                                 │
│ Expected result:                                │
│   Uvicorn running on `http://0.0.0.0:8000`      │
│                                                 │
│ If it fails:                                    │
│   If "uvicorn not recognized", ensure the venv  │
│   is activated.                                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ STEP B7 — Test agent locally on UAT machine     │
│ Machine: UAT Machine                            │
│ Who runs this: Developer                        │
├─────────────────────────────────────────────────┤
│ What to do:                                     │
│   In a new PowerShell tab, run:                 │
│   `Invoke-RestMethod http://localhost:8000/health`│
│                                                 │
│ Expected result:                                │
│   Returns JSON matching `config.json` specs.    │
│                                                 │
│ If it fails:                                    │
│   Ensure the agent is running in the other tab. │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ STEP B8 — Configure Windows Firewall            │
│ Machine: UAT Machine                            │
│ Who runs this: Developer                        │
├─────────────────────────────────────────────────┤
│ What to do:                                     │
│   Run via PowerShell as Administrator:          │
│   `New-NetFirewallRule -DisplayName 'Agent 8000' -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow`│
│                                                 │
│ Expected result:                                │
│   Firewall rule is created, opening port 8000.  │
│                                                 │
│ If it fails:                                    │
│   Run PowerShell as Administrator.              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ STEP B9 — Test agent reachable from Dev PC      │
│ Machine: Dev PC                                 │
│ Who runs this: Developer                        │
├─────────────────────────────────────────────────┤
│ What to do:                                     │
│   From Dev PC PowerShell:                       │
│   `Invoke-RestMethod http://[UAT_MACHINE_IP]:8000/health`│
│                                                 │
│ Expected result:                                │
│   Returns correct terminal_name and category.   │
│                                                 │
│ If it fails:                                    │
│   Check UAT machine firewall rules.             │
└─────────────────────────────────────────────────┘


─────────────────────────────────────────────────────────────────────
## SECTION 4 — END-TO-END UAT TEST PLAN
─────────────────────────────────────────────────────────────────────

**TEST-UAT-01: Dashboard loads from Dev PC browser**
* **Goal:** Verify the React built files are served successfully.
* **Steps:** 1. Navigate to `http://[DEV_PC_LAN_IP]/`
* **Expected:** Login/Dashboard screen appears without 404s.
* **Pass criteria:** Screen renders normally, no console errors.
* **Fail indicators:** Blank screen (JS missing), 500 error from Nginx.

**TEST-UAT-02: UAT machine appears in machine list**
* **Goal:** Verify Laravel aggregates machines.
* **Steps:** 1. Login to Dashboard. 2. Look at machine list.
* **Expected:** "UAT Terminal 1" is listed.
* **Pass criteria:** Machine card is visible.
* **Fail indicators:** List is empty (check `machines.php`).

**TEST-UAT-03: UAT machine shows correct terminal name and category**
* **Goal:** Verify health endpoint data parsing.
* **Steps:** 1. Inspect the UAT machine card.
* **Expected:** The UI displays "UAT Terminal 1" under the "UAT" category.
* **Pass criteria:** Text perfectly matches `config.json`.
* **Fail indicators:** Shows "uat-machine-1" (defaulting to ID, means health check failed).

**TEST-UAT-04: UAT machine shows Online status with green indicator**
* **Goal:** Verify LAN connectivity to agent.
* **Steps:** 1. Look at status dot on the card.
* **Expected:** Status is "Online" and green.
* **Pass criteria:** Visual confirmation.
* **Fail indicators:** Status is "Offline" (Check Firewall, IP).

**TEST-UAT-05: Clicking UAT machine opens log viewer**
* **Goal:** Verify navigation.
* **Steps:** 1. Click on "UAT Terminal 1".
* **Expected:** Routes to machine details view.
* **Pass criteria:** URL changes, UI changes to viewer.
* **Fail indicators:** Nothing happens, console error.

**TEST-UAT-06: Available log dates load for UAT machine**
* **Goal:** Verify agent `/logs` endpoint works via proxy.
* **Steps:** 1. Look at the date selection sidebar/dropdown.
* **Expected:** A list of dates/filenames appears.
* **Pass criteria:** At least one valid log file is listed.
* **Fail indicators:** Missing secret error (401), empty list.

**TEST-UAT-07: Today's log file loads and displays entries**
* **Goal:** Verify parsing of large log payloads.
* **Steps:** 1. Select today's date.
* **Expected:** A table of log entries displays.
* **Pass criteria:** Content matches the physical log file.
* **Fail indicators:** JSON parsing error, 500 from agent.

**TEST-UAT-08: Previous day log file loads correctly**
* **Goal:** Verify historical log access.
* **Steps:** 1. Select yesterday's date.
* **Expected:** Table populates with yesterday's entries.
* **Pass criteria:** Date column reflects the past date.
* **Fail indicators:** 404 from agent (file missing or outside max_days window).

**TEST-UAT-09: Log entries display correct level colors**
* **Goal:** Verify frontend formatting logic.
* **Steps:** 1. Scan the log entries for levels.
* **Expected:** INFO is gray/blue, WARN is yellow, ERROR is red.
* **Pass criteria:** Visual color confirmation.
* **Fail indicators:** All text is one color, or shows as "RAW".

**TEST-UAT-10: Search filters log entries correctly**
* **Goal:** Verify agent-side search filtering.
* **Steps:** 1. Type a known error code into search box. 2. Press enter.
* **Expected:** Only entries containing the string appear.
* **Pass criteria:** Result count decreases accurately.
* **Fail indicators:** UI freezes, no change.

**TEST-UAT-11: Level filter shows only ERROR entries**
* **Goal:** Verify agent-side level filtering.
* **Steps:** 1. Select "ERROR" from level dropdown.
* **Expected:** Table strictly shows ERROR lines.
* **Pass criteria:** Zero INFO/WARN lines visible.
* **Fail indicators:** Empty table when errors exist.

**TEST-UAT-12: Pagination works — navigating to page 2**
* **Goal:** Verify agent-side pagination.
* **Steps:** 1. Ensure file has >500 lines. 2. Click "Next Page".
* **Expected:** Shows entries 501-1000.
* **Pass criteria:** Page number updates, new lines load.
* **Fail indicators:** Button disabled incorrectly.

**TEST-UAT-13: Simulate offline — stop agent, refresh dashboard**
* **Goal:** Verify failure handling.
* **Steps:** 1. Press Ctrl+C on UAT agent terminal. 2. Refresh Dashboard.
* **Expected:** UAT machine card shows "Offline".
* **Pass criteria:** Card gracefully degrades.
* **Fail indicators:** Dashboard crashes completely.

**TEST-UAT-14: Restart agent — machine returns to Online status**
* **Goal:** Verify recovery.
* **Steps:** 1. Restart agent. 2. Refresh Dashboard.
* **Expected:** UAT machine is back "Online".
* **Pass criteria:** Status dot turns green again.
* **Fail indicators:** Requires Laravel reboot.

**TEST-UAT-15: Log viewer on mobile**
* **Goal:** Verify responsiveness on LAN.
* **Steps:** 1. Connect phone to same Wi-Fi. 2. Go to `http://[DEV_PC_LAN_IP]`.
* **Expected:** Dashboard is usable, tables scroll horizontally.
* **Pass criteria:** Navigable on mobile browser.
* **Fail indicators:** Site cannot be reached (Firewall issue).


─────────────────────────────────────────────────────────────────────
## SECTION 5 — STAGING ENVIRONMENT REFERENCE CARD
─────────────────────────────────────────────────────────────────────

### 5.1 All URLs and ports
* **Dashboard:**      `http://[DEV-PC-IP]/`
* **Laravel API:**    `http://[DEV-PC-IP]/api/v1`
* **UAT Agent:**      `http://[UAT-IP]:8000`
* **Laravel logs:**   `C:\laragon\www\pds-log-monitor\apps\backend\storage\logs\`
* **Agent logs:**     `C:\log-agent\logs\`

### 5.2 Quick health check commands (PowerShell)
```powershell
# Check Agent Health
Invoke-RestMethod http://[UAT-IP]:8000/health

# Check Backend API Health
Invoke-RestMethod http://[DEV-PC-IP]/api/v1/machines
```

### 5.3 How to restart each service
* **Laravel/Nginx:** Open the Laragon tray menu → Click `Stop All` → Click `Start All`.
* **Agent (UAT Manual):** Go to the UAT terminal window, press `Ctrl+C`, then run `uvicorn main:app --host 0.0.0.0 --port 8000 --reload` again.

### 5.4 How to check Laravel logs for errors
```powershell
Get-Content C:\laragon\www\pds-log-monitor\apps\backend\storage\logs\laravel.log -Wait -Tail 20
```

### 5.5 Common problems and instant fixes

| Problem | Likely cause | Fix |
|---|---|---|
| Dashboard shows no machines | `machines.php` is empty or DB migration missing. | Ensure Step A5 and A7 are fully complete. |
| UAT machine shows Offline but agent is running | Windows Firewall on UAT machine blocking Port 8000. | Run Step B8 Firewall command. |
| Agent starts but no logs found | `log_directory` or pattern in `config.json` incorrect. | Rerun `installer.py` (Step B4) with correct path. |
| 401 Unauthorized from agent | `AGENT_SECRET` mismatch between `.env` and `config.json`. | Fix secret in `.env` and run `php artisan config:clear`. |
| CORS error in browser console | Agent or Backend blocking LAN origin. | Ensure Backend CORS allows `*` and VITE URL is correct. |
| Laravel returns 500 error | Permissions issue or missing DB/Env variables. | Check `laravel.log` via command in section 5.4. |
| Dashboard cannot reach Laravel API | `VITE_API_BASE_URL` built incorrectly. | Re-run `npm run build` after fixing Dashboard `.env`. |
| Log entries show as RAW (not parsed) | Log format doesn't match the regex pattern in `main.py`. | Verify log lines start with an ISO timestamp and level. |


─────────────────────────────────────────────────────────────────────
## SECTION 6 — POST-UAT SIGN-OFF CHECKLIST
─────────────────────────────────────────────────────────────────────

### 6.1 Functional Sign-off
* [ ] All TEST-UAT-01 through TEST-UAT-15 passed.
* [ ] Real log data from UAT machine is visible in the dashboard.
* [ ] Log levels parse and display correctly with correct colors.
* [ ] Search returns correct filtered results from the agent.
* [ ] Offline/online detection accurately tracks agent uptime.
* [ ] Mobile view is usable on a real device on the LAN.

### 6.2 Technical Sign-off
* [ ] No sensitive data committed to git (secrets, `config.json`).
* [ ] Both frontend and backend `.env` files are not committed to git.
* [ ] Agent secret is non-trivial (not "password" or "secret").
* [ ] Windows Firewall rules are scoped to Private profiles only.
* [ ] Laravel `APP_DEBUG` is false for the staging deployment.
* [ ] No console errors in the browser during normal use.
* [ ] Laravel logs show no unhandled exceptions during the UAT phase.

### 6.3 Issues Log

| Issue # | Description | Severity | Status | Fix Applied |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |

### 6.4 UAT Outcome

* **UAT Date:**
* **Tester:**
* **Agent Machine tested:**
* **Log files tested:**
* **Overall result:** [ PASS ] / [ PASS WITH MINOR ISSUES ] / [ FAIL ]
* **Notes:**
* **Sign-off:**


─────────────────────────────────────────────────────────────────────
**Document:** STAGING.md
**Project:**  pds-log-monitor
**Phase:**    UAT Staging — Single Machine
**Author:**   Generated from codebase analysis
**Next step:** Full production deployment to all 10 terminals
