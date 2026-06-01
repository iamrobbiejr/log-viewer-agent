"""
Log Viewer Agent — Interactive Installer
─────────────────────────────────────
Guides a technician through configuring the agent and writes config.json.
Designed to be simple enough for non-developers to run.
"""

import json
import os
import socket
import sys
from pathlib import Path

from config_schema import AgentConfig
from pydantic import ValidationError


# ─────────────────────────────────────────────────────────────
# Terminal Colours (works on Windows 10+ with ANSI enabled)
# ─────────────────────────────────────────────────────────────

class C:
    RESET  = "\033[0m"
    BOLD   = "\033[1m"
    GREEN  = "\033[92m"
    YELLOW = "\033[93m"
    RED    = "\033[91m"
    CYAN   = "\033[96m"
    DIM    = "\033[2m"


def print_header():
    os.system("cls")
    print(f"""
{C.CYAN}{C.BOLD}
╔══════════════════════════════════════════════════════╗
║           Log Viewer Agent — Installer v2.0             ║
║      Configure this machine for log monitoring       ║
╚══════════════════════════════════════════════════════╝
{C.RESET}""")


def prompt(
    question:    str,
    default:     str  = "",
    required:    bool = True,
    secret:      bool = False,
    hint:        str  = "",
) -> str:
    """Interactive prompt with optional default value and hint text."""
    default_display = f"{C.DIM} [{default}]{C.RESET}" if default else ""
    hint_display    = f"\n  {C.DIM}→ {hint}{C.RESET}"   if hint   else ""

    while True:
        print(f"\n{C.BOLD}{question}{C.RESET}{default_display}{hint_display}")
        raw = input("  > ").strip()

        if not raw and default:
            return default

        if not raw and required:
            print(f"  {C.RED}✗ This field is required.{C.RESET}")
            continue

        if secret and len(raw) < 8:
            print(f"  {C.RED}✗ Secret must be at least 8 characters.{C.RESET}")
            continue

        return raw


def prompt_choice(question: str, choices: list[str], default: str = "") -> str:
    """Prompt where user picks from a numbered list."""
    print(f"\n{C.BOLD}{question}{C.RESET}")
    for i, choice in enumerate(choices, 1):
        marker = f"{C.GREEN}✓{C.RESET} " if choice == default else "  "
        print(f"  {marker}{i}. {choice}")

    while True:
        raw = input("  Enter number (or type custom value): ").strip()

        if not raw and default:
            return default

        if raw.isdigit():
            idx = int(raw) - 1
            if 0 <= idx < len(choices):
                return choices[idx]

        # Allow typing a custom value not in the list
        if raw:
            return raw

        print(f"  {C.RED}✗ Please enter a number or a custom value.{C.RESET}")


def show_pattern_help():
    print(f"""
{C.CYAN}  Log Pattern Guide:
  ─────────────────────────────────────────────────────
  Use {{date}} as a placeholder for the date in the filename.

  Examples:
    revmax_{{date}}.log       → revmax_2026-05-22.log
    app_{{date}}.log          → app_2026-05-22.log
    {{date}}_freight.log      → 2026-05-22_freight.log
    sales{{date}}.log         → sales2026-05-22.log

  If your log files DON'T have dates in the name, use a
  glob pattern and files will be sorted by date modified:
    *.log                   → all .log files (newest 5)
    revmax*.log             → files starting with revmax
  ─────────────────────────────────────────────────────{C.RESET}""")


def show_date_format_help():
    print(f"""
{C.CYAN}  Date Format Guide (Python strftime):
  ─────────────────────────────────────────────────────
    %Y-%m-%d   → 2026-05-22    (most common, recommended)
    %d-%m-%Y   → 22-05-2026
    %m-%d-%Y   → 05-22-2026
    %Y%m%d     → 20260522
    %d%m%Y     → 22052026
  ─────────────────────────────────────────────────────{C.RESET}""")


def run_installer():
    print_header()

    print(f"  {C.DIM}This installer will create a config.json file for this machine.")
    print(f"  Answer each question — press Enter to accept the default value shown in [brackets].{C.RESET}")

    # ── Step 1: Company Info ──────────────────────────────────
    print(f"\n{C.YELLOW}{'─'*54}")
    print(f"  STEP 1 of 5 — Company & Terminal Identity")
    print(f"{'─'*54}{C.RESET}")

    company_name = prompt(
        "Company / Organisation Name",
        hint="e.g. FastLink Transport, City Bus Services"
    )

    # Suggest common categories from company name for convenience
    suggested_categories = [
        "Freight North", "Freight South", "Freight East", "Freight West",
        "Bus North",     "Bus South",     "Bus East",     "Bus West",
        "Admin",         "Operations",    "Warehouse",
    ]

    terminal_category = prompt_choice(
        "Terminal Category (used to group machines on the dashboard)",
        choices   = suggested_categories,
        default   = "Freight North",
    )

    terminal_name = prompt(
        "Terminal / Counter Name",
        hint=(
            f"This is the human-readable name shown on the dashboard.\n"
            f"  e.g. {terminal_category} Counter 1, {terminal_category} Ticket Office"
        )
    )

    location_notes = prompt(
        "Location Notes (optional)",
        default  = "",
        required = False,
        hint     = "e.g. Ground Floor Left, Near Entrance, Server Room",
    )

    # ── Step 2: Log Directory ─────────────────────────────────
    print(f"\n{C.YELLOW}{'─'*54}")
    print(f"  STEP 2 of 5 — Log Directory")
    print(f"{'─'*54}{C.RESET}")

    while True:
        log_directory = prompt(
            "Full path to the log directory",
            default = r"C:\App\Pds\Logs",
            hint    = r"e.g. C:\App\Pds\Logs\Revmax  or  C:\Logs\Bus",
        )
        if Path(log_directory).exists():
            print(f"  {C.GREEN}✓ Directory found.{C.RESET}")
            break
        else:
            print(f"  {C.RED}✗ Directory not found: {log_directory}{C.RESET}")
            create = input("  Create it now? (y/n): ").strip().lower()
            if create == "y":
                Path(log_directory).mkdir(parents=True, exist_ok=True)
                print(f"  {C.GREEN}✓ Directory created.{C.RESET}")
                break
            # else loop again

    # ── Step 3: Log Pattern ───────────────────────────────────
    print(f"\n{C.YELLOW}{'─'*54}")
    print(f"  STEP 3 of 5 — Log File Pattern")
    print(f"{'─'*54}{C.RESET}")

    show_pattern_help()

    log_pattern = prompt(
        "Log filename pattern",
        default = "revmax_{date}.log",
        hint    = "Use {date} as a placeholder, or a glob like *.log",
    )

    # Only ask for date format if the pattern uses {date}
    date_format = "%Y-%m-%d"
    if "{date}" in log_pattern:
        show_date_format_help()
        date_format = prompt(
            "Date format used in the filename",
            default = "%Y-%m-%d",
            hint    = "Must match exactly how dates appear in your filenames",
        )

    max_days = prompt(
        "How many days of logs to make available",
        default = "5",
        hint    = "Enter a number between 1 and 30",
    )

    # ── Step 4: Preview Resolved Files ───────────────────────
    print(f"\n{C.YELLOW}{'─'*54}")
    print(f"  STEP 4 of 5 — Verifying Log Files")
    print(f"{'─'*54}{C.RESET}")

    # Import here to avoid circular dependency during early prompts
    from log_resolver import LogResolver

    preview_resolver = LogResolver(
        log_directory = log_directory,
        log_pattern   = log_pattern,
        date_format   = date_format,
        max_days      = int(max_days),
    )

    available = preview_resolver.get_available_files()

    if available:
        print(f"\n  {C.GREEN}✓ Found {len(available)} log file(s):{C.RESET}")
        for f in available:
            size_kb = f['size_bytes'] / 1024
            print(f"    • {f['filename']:<40} {size_kb:>8.1f} KB  [{f['display_label']}]")
    else:
        print(f"\n  {C.YELLOW}⚠ No log files found matching the pattern in that directory.")
        print(f"    Pattern: {log_pattern}")
        print(f"    Directory: {log_directory}")
        print(f"    The agent will still install — files will appear once logs are created.{C.RESET}")

    # ── Step 5: Security ─────────────────────────────────────
    print(f"\n{C.YELLOW}{'─'*54}")
    print(f"  STEP 5 of 5 — Security & Network")
    print(f"{'─'*54}{C.RESET}")

    agent_secret = prompt(
        "Agent Secret Key (shared with the central dashboard)",
        secret = True,
        hint   = "Minimum 8 characters. Use the same key configured on the dashboard server.",
    )

    agent_port = prompt(
        "Agent Port",
        default = "8000",
        hint    = "The port this agent listens on. Must be open in Windows Firewall.",
    )

    print(f"\n{C.YELLOW}{'─'*54}")
    print(f"  STEP 6 of 6 — Ngrok Integration (Optional)")
    print(f"{'─'*54}{C.RESET}")

    ngrok_authtoken = prompt(
        "Ngrok Authtoken",
        default = "",
        required = False,
        secret = False,
        hint = "If using Ngrok, paste your authtoken here. Leave blank to skip.",
    )

    dashboard_url = ""
    if ngrok_authtoken:
        dashboard_url = prompt(
            "Dashboard API Base URL",
            default = "http://your-server-ip:3000/api",
            required = True,
            hint = "The Agent will push its new Ngrok URL to this Nest Backend endpoint.",
        )

    # ── Build & Validate Config ───────────────────────────────
    raw_config = {
        "company_name":       company_name,
        "terminal_name":      terminal_name,
        "terminal_category":  terminal_category,
        "machine_hostname":   socket.gethostname(),
        "log_directory":      log_directory,
        "log_pattern":        log_pattern,
        "date_format":        date_format,
        "max_days":           int(max_days),
        "agent_port":         int(agent_port),
        "agent_secret":       agent_secret,
        "location_notes":     location_notes,
        "ngrok_authtoken":    ngrok_authtoken,
        "dashboard_url":      dashboard_url,
    }

    try:
        validated = AgentConfig(**raw_config)
    except ValidationError as e:
        print(f"\n  {C.RED}✗ Configuration validation failed:{C.RESET}")
        for err in e.errors():
            print(f"    • {err['loc'][0]}: {err['msg']}")
        sys.exit(1)

    # ── Summary ───────────────────────────────────────────────
    print(f"""
{C.CYAN}{'─'*54}
  Configuration Summary
{'─'*54}{C.RESET}
  Company:           {validated.company_name}
  Terminal Name:     {validated.terminal_name}
  Category:          {validated.terminal_category}
  Hostname:          {validated.machine_hostname}
  Location Notes:    {validated.location_notes or '(none)'}

  Log Directory:     {validated.log_directory}
  Log Pattern:       {validated.log_pattern}
  Date Format:       {validated.date_format}
  Strategy:          {preview_resolver.get_strategy()}
  Max Days:          {validated.max_days}

  Agent Port:        {validated.agent_port}
  Agent Secret:      {'*' * len(validated.agent_secret)}
""")

    confirm = input(f"  {C.BOLD}Save this configuration? (y/n): {C.RESET}").strip().lower()
    if confirm != "y":
        print(f"\n  {C.YELLOW}Installation cancelled. No files were written.{C.RESET}")
        sys.exit(0)

    # ── Write config.json ─────────────────────────────────────
    config_path = Path(__file__).parent / "config.json"
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(validated.model_dump(), f, indent=2)

    print(f"\n  {C.GREEN}✓ config.json written to {config_path}{C.RESET}")
    print(f"\n  {C.BOLD}Returning to main installer to start Windows Service...{C.RESET}\n")


if __name__ == "__main__":
    run_installer()
