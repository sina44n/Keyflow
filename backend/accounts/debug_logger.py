import os
import json
from datetime import datetime
from pathlib import Path

LOG_FILE = Path(__file__).resolve().parent.parent / 'auth_debug.log'

def log_auth_event(event_type, details):
    """Safely logs authentication diagnostic events to auth_debug.log."""
    try:
        now = datetime.utcnow().isoformat() + "Z"
        entry = f"[{now}] [{event_type}] {json.dumps(details, default=str)}\n"
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(entry)
    except Exception:
        pass
