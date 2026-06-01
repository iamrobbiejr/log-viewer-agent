import json
import os
import re
from pathlib import Path
from typing import Optional
import asyncio
import urllib.request
import urllib.error

from fastapi import FastAPI, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware

from config_schema import AgentConfig
from log_resolver  import LogResolver

# ─────────────────────────────────────────────────────────────
# Bootstrap — Load & Validate Config
# ─────────────────────────────────────────────────────────────

CONFIG_PATH = Path(__file__).parent / "config.json"

def load_config() -> AgentConfig:
    if not CONFIG_PATH.exists():
        raise RuntimeError(
            "config.json not found. Please run installer.py first.\n"
            f"Expected location: {CONFIG_PATH}"
        )
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return AgentConfig(**raw)


config   = load_config()
resolver = LogResolver(
    log_directory = config.log_directory,
    log_pattern   = config.log_pattern,
    date_format   = config.date_format,
    max_days      = config.max_days,
)

# ─────────────────────────────────────────────────────────────
# App Setup
# ─────────────────────────────────────────────────────────────

last_synced_url = None

async def sync_ngrok_url():
    """Background task to sync Ngrok URL to Nest Backend."""
    global last_synced_url
    
    # Initial delay to give Ngrok time to spin up and acquire a tunnel
    await asyncio.sleep(5)
    
    while True:
        try:
            # 1. Fetch public URL from local Ngrok API
            req = urllib.request.Request("http://127.0.0.1:4040/api/tunnels")
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode())
                
            tunnels = data.get("tunnels", [])
            https_url = None
            for t in tunnels:
                if t.get("public_url", "").startswith("https://"):
                    https_url = t["public_url"]
                    break
            
            if not https_url:
                raise ValueError("No HTTPS tunnel found in Ngrok API")

            # 2. If changed or first time, push to backend
            if https_url != last_synced_url:
                print(f"Ngrok URL discovered: {https_url}. Syncing to backend...")
                sync_payload = json.dumps({
                    "secret": config.agent_secret,
                    "url": https_url
                }).encode("utf-8")
                
                sync_req = urllib.request.Request(
                    f"{config.dashboard_url.rstrip('/')}/machines/agent-sync",
                    data=sync_payload,
                    headers={
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true"
                    },
                    method="POST"
                )
                
                with urllib.request.urlopen(sync_req, timeout=10) as sync_res:
                    if sync_res.status in (200, 201):
                        print("Successfully synced URL to backend.")
                        last_synced_url = https_url
                    else:
                        print(f"Failed to sync. Status: {sync_res.status}")

            # Wait 300 seconds (5 minutes) before next successful check
            await asyncio.sleep(300)

        except Exception as e:
            print(f"Error syncing Ngrok URL: {e}. Retrying in 10 seconds...")
            await asyncio.sleep(10)

app = FastAPI(
    title       = f"{config.company_name} — Log Agent",
    description = f"Terminal: {config.terminal_name}",
    version     = "2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins  = ["*"],
    allow_methods  = ["GET"],
    allow_headers  = ["*"],
)

@app.on_event("startup")
async def startup_event():
    if getattr(config, "ngrok_authtoken", "") and getattr(config, "dashboard_url", ""):
        print("Ngrok integration enabled. Starting background sync task...")
        asyncio.create_task(sync_ngrok_url())

MAX_FILE_SIZE = 10 * 1024 * 1024   # 10 MB


# ─────────────────────────────────────────────────────────────
# Auth
# ─────────────────────────────────────────────────────────────

def verify_token(x_agent_secret: Optional[str] = Header(None)) -> None:
    if x_agent_secret != config.agent_secret:
        raise HTTPException(status_code=401, detail="Unauthorized")


# ─────────────────────────────────────────────────────────────
# Log Parser  (unchanged from v1, still works for any format)
# ─────────────────────────────────────────────────────────────

def parse_log_lines(raw_lines: list[str]) -> list[dict]:
    pattern = re.compile(
        r"^\[?(?P<timestamp>\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}(?:\.\d+)?)\]?\s+"
        r"(?P<level>INFO|WARN|WARNING|ERROR|DEBUG|CRITICAL)\s+"
        r"(?P<message>.+)$",
        re.IGNORECASE,
    )
    parsed = []
    for line_number, line in enumerate(raw_lines, start=1):
        line_clean = line.rstrip("\n\r")
        match = pattern.match(line_clean)
        if match:
            parsed.append({
                "line_number": line_number,
                "timestamp":   match.group("timestamp"),
                "level":       match.group("level").upper(),
                "message":     match.group("message").strip(),
                "raw":         line_clean,
            })
        elif line_clean.strip():
            if parsed:
                parsed[-1]["message"] += "\n" + line_clean
                parsed[-1]["raw"] += "\n" + line_clean
            else:
                parsed.append({
                    "line_number": line_number,
                    "timestamp":   None,
                    "level":       "RAW",
                    "message":     line_clean,
                    "raw":         line_clean,
                })
    return parsed


# ─────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    """Public health check — exposes terminal identity."""
    return {
        "status":            "ok",
        "company":           config.company_name,
        "terminal_name":     config.terminal_name,
        "terminal_category": config.terminal_category,
        "machine_hostname":  config.machine_hostname,
        "location_notes":    config.location_notes,
        "log_strategy":      resolver.get_strategy(),
        "log_pattern":       config.log_pattern,
        "agent_version":     "2.0.0",
    }


@app.get("/logs")
def list_logs(x_agent_secret: Optional[str] = Header(None)):
    """Lists available log files — metadata only, no content."""
    verify_token(x_agent_secret)
    return {
        "terminal_name":     config.terminal_name,
        "terminal_category": config.terminal_category,
        "log_directory":     config.log_directory,
        "log_pattern":       config.log_pattern,
        "strategy":          resolver.get_strategy(),
        "available":         resolver.get_available_files(),
    }


@app.get("/logs/{identifier:path}")
def get_log(
    identifier:       str,
    search:           Optional[str] = Query(None),
    level:            Optional[str] = Query(None),
    page:             int           = Query(1, ge=1),
    page_size:        int           = Query(500, ge=50, le=2000),
    x_agent_secret:   Optional[str] = Header(None),
):
    """
    Fetches parsed log content.
    
    identifier:
      - For date_pattern strategy: a date string e.g. "2026-05-22"
      - For last_modified strategy: a filename e.g. "revmax_log.log"
    """
    verify_token(x_agent_secret)

    file_path = resolver.resolve_file(identifier)

    if file_path is None:
        raise HTTPException(
            status_code=404,
            detail=f"Log file not found or outside the allowed {config.max_days}-day window."
        )

    if file_path.stat().st_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Log file exceeds the 10 MB size limit.")

    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        raw_lines = f.readlines()

    entries = parse_log_lines(raw_lines)

    if level:
        entries = [e for e in entries if e["level"] == level.upper()]

    if search:
        search_lower = search.lower()
        entries = [e for e in entries if search_lower in e["raw"].lower()]

    total_entries = len(entries)
    total_pages   = max(1, -(-total_entries // page_size))
    start         = (page - 1) * page_size
    page_entries  = entries[start : start + page_size]

    return {
        "terminal_name":     config.terminal_name,
        "terminal_category": config.terminal_category,
        "identifier":        identifier,
        "filename":          file_path.name,
        "total_lines":       len(raw_lines),
        "total_entries":     total_entries,
        "page":              page,
        "page_size":         page_size,
        "total_pages":       total_pages,
        "entries":           page_entries,
    }
