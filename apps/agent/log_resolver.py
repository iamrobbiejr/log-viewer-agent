import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional


class LogResolver:
    """
    Resolves which log files to serve based on the configured pattern.

    Supports two resolution strategies:
    ─────────────────────────────────────────────────────────────────
    Strategy A — Date Pattern  (when log_pattern contains "{date}")
      Pattern:  revmax_{date}.log  +  date_format: %Y-%m-%d
      Resolves: revmax_2026-05-22.log, revmax_2026-05-21.log ...

    Strategy B — Last Modified  (when log_pattern is a glob like "*.log")
      Pattern:  *.log  OR  sales*.log  OR  app_*.log
      Resolves: The last max_days files sorted by date modified (newest first)
    ─────────────────────────────────────────────────────────────────
    """

    def __init__(
        self,
        log_directory: str,
        log_pattern:   str,
        date_format:   str = "%Y-%m-%d",
        max_days:      int = 5,
    ):
        self.log_dir     = Path(log_directory)
        self.log_pattern = log_pattern
        self.date_format = date_format
        self.max_days    = max_days
        self.strategy    = "date_pattern" if "{date}" in log_pattern else "last_modified"

    # ─────────────────────────────────────────────────────────
    # Public API
    # ─────────────────────────────────────────────────────────

    def get_available_files(self) -> list[dict]:
        """
        Returns metadata for all resolvable log files.
        Result is always sorted newest-first.
        """
        if self.strategy == "date_pattern":
            return self._resolve_by_date_pattern()
        else:
            return self._resolve_by_last_modified()

    def resolve_file(self, file_identifier: str) -> Optional[Path]:
        """
        Resolves a single file identifier to an actual Path.

        For date_pattern strategy: identifier is a date string e.g. "2026-05-22"
        For last_modified strategy: identifier is the filename e.g. "app_log_v2.log"

        Returns None if the file doesn't exist or is outside the allowed window.
        """
        if self.strategy == "date_pattern":
            return self._resolve_date_file(file_identifier)
        else:
            return self._resolve_named_file(file_identifier)

    def get_strategy(self) -> str:
        return self.strategy

    # ─────────────────────────────────────────────────────────
    # Strategy A: Date Pattern Resolution
    # ─────────────────────────────────────────────────────────

    def _resolve_by_date_pattern(self) -> list[dict]:
        results = []
        today   = datetime.now().date()

        for days_ago in range(self.max_days):
            target_date  = today - timedelta(days=days_ago)
            date_str     = target_date.strftime(self.date_format)
            filename     = self.log_pattern.replace("{date}", date_str)
            file_path    = self.log_dir / filename

            if file_path.exists() and file_path.is_file():
                stat = file_path.stat()
                results.append({
                    "identifier":    date_str,          # used in API URL
                    "filename":      filename,
                    "display_label": self._friendly_label(days_ago, target_date),
                    "date":          target_date.isoformat(),
                    "is_today":      days_ago == 0,
                    "size_bytes":    stat.st_size,
                    "modified_at":   datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "strategy":      "date_pattern",
                })

        return results

    def _resolve_date_file(self, date_str: str) -> Optional[Path]:
        """Validates date string and returns the corresponding file path."""
        try:
            # Parse and re-format to normalise any user input
            parsed_date = datetime.strptime(date_str, self.date_format).date()
        except ValueError:
            return None

        # Enforce max_days window
        today = datetime.now().date()
        delta = (today - parsed_date).days
        if delta < 0 or delta >= self.max_days:
            return None

        filename  = self.log_pattern.replace("{date}", date_str)
        file_path = self.log_dir / filename

        return file_path if file_path.exists() else None

    # ─────────────────────────────────────────────────────────
    # Strategy B: Last Modified Resolution
    # ─────────────────────────────────────────────────────────

    def _resolve_by_last_modified(self) -> list[dict]:
        """
        Finds files matching the glob pattern, sorted by last modified date.
        Returns the most recent max_days files.
        """
        # Convert {date}-free pattern to a glob
        # e.g. "app_*.log" stays as-is,  "sales.log" matches exact file
        glob_pattern = self.log_pattern

        matched_files = sorted(
            self.log_dir.glob(glob_pattern),
            key=lambda f: f.stat().st_mtime,
            reverse=True,   # newest first
        )

        results = []
        for index, file_path in enumerate(matched_files[: self.max_days]):
            stat         = file_path.stat()
            modified     = datetime.fromtimestamp(stat.st_mtime)
            results.append({
                "identifier":    file_path.name,    # filename is the identifier
                "filename":      file_path.name,
                "display_label": self._friendly_label(index, modified.date()),
                "date":          modified.date().isoformat(),
                "is_today":      index == 0,
                "size_bytes":    stat.st_size,
                "modified_at":   modified.isoformat(),
                "strategy":      "last_modified",
            })

        return results

    def _resolve_named_file(self, filename: str) -> Optional[Path]:
        """
        For last_modified strategy, validates and returns the file.
        Ensures path traversal is impossible.
        """
        # Security: reject any path separators in the filename
        if "/" in filename or "\\" in filename or ".." in filename:
            return None

        file_path = self.log_dir / filename

        # Confirm the resolved path is still inside log_dir
        try:
            file_path.resolve().relative_to(self.log_dir.resolve())
        except ValueError:
            return None

        # Confirm file is in the allowed set
        allowed = {f["filename"] for f in self._resolve_by_last_modified()}
        if filename not in allowed:
            return None

        return file_path if file_path.exists() else None

    # ─────────────────────────────────────────────────────────
    # Helpers
    # ─────────────────────────────────────────────────────────

    @staticmethod
    def _friendly_label(days_ago: int, date) -> str:
        labels = {0: "Today", 1: "Yesterday"}
        if days_ago in labels:
            return f"{labels[days_ago]} ({date})"
        return str(date)
