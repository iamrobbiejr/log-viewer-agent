from pydantic import BaseModel, Field, field_validator
from pathlib import Path


class AgentConfig(BaseModel):
    """
    Defines every configurable property of the agent.
    Written once by the installer, read on every agent startup.
    """

    # ── Identity ─────────────────────────────────────────────
    company_name:       str = Field(..., description="e.g. FastLink Transport")
    terminal_name:      str = Field(..., description="e.g. Freight North Counter 1")
    terminal_category:  str = Field(..., description="e.g. Freight North — used for grouping on dashboard")
    machine_hostname:   str = Field(..., description="Windows COMPUTERNAME — auto-populated")

    # ── Log Resolution ────────────────────────────────────────
    log_directory:      str = Field(..., description="Absolute path e.g. C:\\App\\Pds\\Logs\\Revmax")
    log_pattern:        str = Field(
        ...,
        description=(
            "Filename pattern with optional {date} placeholder.\n"
            "Examples:\n"
            "  revmax_{date}.log         → date-based naming\n"
            "  app_{date}.log            → app logs\n"
            "  {date}_sales.log          → prefix style\n"
            "  *.log                     → no date pattern, use last-modified order\n"
        )
    )
    date_format:        str = Field(
        default="%Y-%m-%d",
        description="Python strftime format for {date} in the pattern. Default: %Y-%m-%d (2026-05-22)"
    )
    max_days:           int = Field(default=5, ge=1, le=30)

    # ── Network ───────────────────────────────────────────────
    agent_port:         int  = Field(default=8000, ge=1024, le=65535)
    agent_secret:       str  = Field(..., min_length=8)

    # ── Optional Metadata ─────────────────────────────────────
    location_notes:     str  = Field(default="", description="e.g. Ground Floor, Left Wing")

    # ── Ngrok Integration ─────────────────────────────────────
    dashboard_url:      str  = Field(default="", description="Base URL of the Nest Backend API for syncing, e.g. http://10.0.0.5:3000/api")
    ngrok_authtoken:    str  = Field(default="", description="Ngrok authtoken if using ngrok for tunneling")

    @field_validator("log_directory")
    @classmethod
    def validate_log_directory(cls, v: str) -> str:
        path = Path(v)
        if not path.exists():
            raise ValueError(f"Log directory does not exist: {v}")
        if not path.is_dir():
            raise ValueError(f"Path is not a directory: {v}")
        return str(path.resolve())

    @field_validator("log_pattern")
    @classmethod
    def validate_log_pattern(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Log pattern cannot be empty.")
        # Must end with a file extension
        if "." not in v.split("/")[-1]:
            raise ValueError("Log pattern must include a file extension (e.g. .log).")
        return v
